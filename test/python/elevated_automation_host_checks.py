#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""高权限薄 Python Host 边界与会话自检。"""

import base64
import json
import os
import sys
import tempfile
import threading
import uuid
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
HOST_DIR = PROJECT_ROOT / "src" / "assets" / "elevated-automation-host"
SCRIPTS_DIR = PROJECT_ROOT / "src" / "assets" / "scripts"
sys.path.insert(0, str(HOST_DIR))

import host  # noqa: E402


class InMemoryChannel:
    def __init__(self, incoming, wait_for_exit=False):
        self.incoming = list(incoming)
        self.wait_for_exit = wait_for_exit
        self.exited_event = threading.Event()
        self.sent = []
        self.closed = False
        self._lock = threading.Lock()

    def receive(self):
        if self.incoming:
            return self.incoming.pop(0)
        if self.wait_for_exit:
            self.exited_event.wait(timeout=5.0)
        return None

    def send(self, message):
        with self._lock:
            self.sent.append(message)
            if message.get("type") in ("exited", "error"):
                self.exited_event.set()
            return True

    def close(self):
        self.closed = True
        return True


def expect_boundary_error(fn, expected_code):
    try:
        fn()
    except host.HostBoundaryError as error:
        assert error.code == expected_code, f"expected {expected_code}, got {error.code}: {error.message}"
        return
    raise AssertionError(f"expected HostBoundaryError({expected_code})")


def test_descriptor_and_chinese_path():
    with tempfile.TemporaryDirectory(prefix="流放助手-host-") as temp_dir:
        payload = {
            "schemaVersion": 1,
            "pipeName": r"\\.\pipe\PoECNHelper.ElevatedAutomation.abc12345",
            "parentProcessId": os.getpid(),
            "resourceRoot": temp_dir,
        }
        encoded = base64.b64encode(json.dumps(payload, ensure_ascii=False).encode("utf-8")).decode("ascii")
        decoded = host.decode_descriptor(encoded)
        assert decoded["parentProcessId"] == os.getpid()
        assert Path(decoded["resourceRoot"]) == Path(temp_dir).resolve()

    bad = base64.b64encode(json.dumps({
        "schemaVersion": 1,
        "pipeName": r"\\.\pipe\WrongPrefix.12345678",
        "parentProcessId": 123,
        "resourceRoot": str(SCRIPTS_DIR),
    }).encode("utf-8")).decode("ascii")
    expect_boundary_error(lambda: host.decode_descriptor(bad), "INVALID_DESCRIPTOR")


def test_allowlist_and_env_guard():
    for op_id, spec in host.OPERATION_SPECS.items():
        if spec.kind == "bundled":
            resolved = host.resolve_bundled_script(SCRIPTS_DIR, spec.script)
            assert resolved.is_file(), f"missing bundled script for {op_id}: {spec.script}"
    assert host.OPERATION_SPECS["stash-pickup.run"].script == "junfeng_highlight_pickup.py"

    expect_boundary_error(
        lambda: host.resolve_bundled_script(SCRIPTS_DIR, "../package.json"),
        "RESOURCE_INVALID",
    )

    req_id = str(uuid.uuid4())
    expect_boundary_error(
        lambda: host.validate_spawn_message({
            "type": "spawn", "requestId": req_id, "operationId": "shell.exec", "args": [],
        }),
        "UNKNOWN_OPERATION",
    )
    expect_boundary_error(
        lambda: host.validate_spawn_message({
            "type": "spawn", "requestId": req_id, "operationId": "bag.auto-stash",
            "args": [], "env": {"PYTHONPATH": "C:\\evil"},
        }),
        "FORBIDDEN_ENV_KEY",
    )
    expect_boundary_error(
        lambda: host.validate_spawn_message({
            "type": "spawn", "requestId": req_id, "operationId": "bag.auto-stash",
            "args": [], "scriptContent": "print(1)",
        }),
        "FORBIDDEN_SCRIPT_CONTENT",
    )
    valid_crafting = host.validate_spawn_message({
        "type": "spawn", "requestId": req_id, "operationId": "crafting.items",
        "args": [], "env": {"POE_PARSE_TRANSPORT": "pipe"}, "stdin": "pipe",
        "scriptContent": "print('ok')", "copyStashTabSelector": True,
    })
    assert valid_crafting["operationId"] == "crafting.items"
    assert valid_crafting["copyStashTabSelector"] is True


def test_verify_pipe_client():
    class FakeApi:
        def get_client_process_id(self, _handle):
            return 2222

    assert host.verify_pipe_client(FakeApi(), 1, 2222) is True
    expect_boundary_error(lambda: host.verify_pipe_client(FakeApi(), 1, 3333), "CLIENT_PID_MISMATCH")


def test_session_spawn_stdin_stdout_and_shutdown():
    req_id = str(uuid.uuid4())
    session = host.AutomationHostSession(SCRIPTS_DIR)
    channel = InMemoryChannel([
        {
            "type": "spawn",
            "requestId": req_id,
            "operationId": "crafting.items",
            "args": [],
            "env": {"POE_PARSE_TRANSPORT": "pipe"},
            "stdin": "pipe",
            "scriptContent": "import sys\nline = sys.stdin.readline().strip()\nprint('ECHO:' + line, flush=True)\n",
        },
        {"type": "stdin", "requestId": req_id, "data": "ping-123\n"},
        {"type": "stdin-end", "requestId": req_id},
    ], wait_for_exit=True)
    session.serve(channel)
    types = [m["type"] for m in channel.sent]
    assert types[0] == "hello"
    assert "started" in types
    stdout_text = "".join(m["data"] for m in channel.sent if m["type"] == "stdout")
    assert "ECHO:ping-123" in stdout_text, f"unexpected stdout: {stdout_text!r}"
    exited = [m for m in channel.sent if m["type"] == "exited"]
    assert exited and exited[0]["exitCode"] == 0


def main():
    test_descriptor_and_chinese_path()
    test_allowlist_and_env_guard()
    test_verify_pipe_client()
    test_session_spawn_stdin_stdout_and_shutdown()
    print("elevated_automation_host_checks: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
