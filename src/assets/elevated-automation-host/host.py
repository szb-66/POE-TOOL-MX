#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""薄高权限自动化 Host：仅接受固定操作白名单并通过单连接命名管道受控执行。"""

import base64
import ctypes
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from ctypes import wintypes
from dataclasses import dataclass
from pathlib import Path


PIPE_NAME_RE = re.compile(r"^\\\\\.\\pipe\\PoECNHelper\.ElevatedAutomation\.[A-Za-z0-9._-]{8,128}$")
MAX_MESSAGE_BYTES = 32 * 1024 * 1024
MAX_STDOUT_CHUNK = 64 * 1024
CONNECT_TIMEOUT_SECONDS = 30.0
ALLOWED_ENV_KEYS = frozenset({
    "POE_GAME_WINDOW_TITLES_FILE",
    "POE_PARSE_TRANSPORT",
    "FAUSTUS_TIMING",
    "OC_DISABLE_DOT_ACCESS_WARNING",
    "PYTHONUNBUFFERED",
    "PYTHONIOENCODING",
    "PYTHONUTF8",
})


@dataclass(frozen=True)
class OperationSpec:
    script: str | None
    kind: str = "bundled"  # "bundled" or "generated-crafting"
    use_script_dir_cwd: bool = False


OPERATION_SPECS = {
    "window.activate-game": OperationSpec("activate_game_window.py"),
    "price.copy-item": OperationSpec("price_copy_helper.py"),
    "crafting.items": OperationSpec(None, kind="generated-crafting"),
    "crafting.maps": OperationSpec(None, kind="generated-crafting"),
    "combat.assist": OperationSpec("combat_assist_template.py"),
    "bag.auto-stash": OperationSpec("bag_auto_stash_template.py"),
    "chaos-recipe.pickup": OperationSpec("chaos_recipe_pick_template.py"),
    "stash-tabs.select": OperationSpec("stash_tab_selector.py"),
    "stash-pickup.run": OperationSpec("junfeng_highlight_pickup.py"),
    "junfeng.pickup": OperationSpec("junfeng_highlight_pickup.py"),
    "puzzle.analyze": OperationSpec("puzzle_analyzer.py", use_script_dir_cwd=True),
    "puzzle.chart-mods": OperationSpec("chart_mods_probe.py", use_script_dir_cwd=True),
    "puzzle.auto-place": OperationSpec("puzzle_auto_place.py", use_script_dir_cwd=True),
    "faustus.repricing": OperationSpec("faustus_market_repricing.py"),
    "sanctum.native": OperationSpec("sanctum_native.py"),
    "map-tracker.loot-click": OperationSpec("map_tracker_loot_click.py"),
}


class HostBoundaryError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


def _plain_object(value):
    return type(value) is dict


def _json_no_duplicates(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise HostBoundaryError("INVALID_MESSAGE", "消息包含重复字段")
        result[key] = value
    return result


def _validate_uuid4(value):
    try:
        parsed = uuid.UUID(value)
    except (AttributeError, TypeError, ValueError) as error:
        raise HostBoundaryError("INVALID_REQUEST_ID", "请求标识无效") from error
    if parsed.version != 4 or str(parsed) != value.lower():
        raise HostBoundaryError("INVALID_REQUEST_ID", "请求标识无效")
    return value.lower()


def decode_descriptor(encoded):
    if type(encoded) is not str or not encoded or len(encoded) > 64 * 1024:
        raise HostBoundaryError("INVALID_DESCRIPTOR", "Host 启动描述无效")
    try:
        raw = base64.b64decode(encoded.encode("ascii"), validate=True)
        descriptor = json.loads(raw.decode("utf-8", "strict"), object_pairs_hook=_json_no_duplicates)
    except HostBoundaryError:
        raise
    except (UnicodeEncodeError, UnicodeDecodeError, ValueError, json.JSONDecodeError) as error:
        raise HostBoundaryError("INVALID_DESCRIPTOR", "Host 启动描述无效") from error
    if not _plain_object(descriptor) or set(descriptor) != {
        "schemaVersion", "pipeName", "parentProcessId", "resourceRoot"
    }:
        raise HostBoundaryError("INVALID_DESCRIPTOR", "Host 启动描述字段无效")
    if descriptor["schemaVersion"] != 1 or not PIPE_NAME_RE.fullmatch(descriptor["pipeName"]):
        raise HostBoundaryError("INVALID_DESCRIPTOR", "Host 启动描述无效")
    parent_pid = descriptor["parentProcessId"]
    if type(parent_pid) is not int or not (1 <= parent_pid <= 0xFFFFFFFF):
        raise HostBoundaryError("INVALID_DESCRIPTOR", "Host 父进程标识无效")
    root_value = descriptor["resourceRoot"]
    if type(root_value) is not str or not root_value or "\0" in root_value:
        raise HostBoundaryError("INVALID_DESCRIPTOR", "Host 资源根无效")
    if not Path(root_value).is_absolute():
        raise HostBoundaryError("INVALID_DESCRIPTOR", "Host 资源根必须是绝对路径")
    try:
        root = Path(root_value).resolve(strict=True)
        stat = root.stat()
    except OSError as error:
        raise HostBoundaryError("INVALID_DESCRIPTOR", "Host 资源根不存在") from error
    if not root.is_dir() or root.is_symlink() or getattr(stat, "st_file_attributes", 0) & 0x400:
        raise HostBoundaryError("INVALID_DESCRIPTOR", "Host 资源根无效")
    return {
        "schemaVersion": 1,
        "pipeName": descriptor["pipeName"],
        "parentProcessId": parent_pid,
        "resourceRoot": str(root),
    }


def _safe_file_under_root(root, relative_parts):
    resolved_root = Path(root).resolve(strict=True)
    candidate = resolved_root.joinpath(*relative_parts)
    if not candidate.exists():
        return None
    resolved = candidate.resolve(strict=True)
    try:
        resolved.relative_to(resolved_root)
    except ValueError:
        return None
    stat = resolved.stat()
    if not resolved.is_file() or resolved.is_symlink() or getattr(stat, "st_file_attributes", 0) & 0x400:
        return None
    return resolved


def resolve_bundled_script(resource_root, filename):
    if type(filename) is not str or not filename or "/" in filename or "\\" in filename or ".." in filename or "\0" in filename:
        raise HostBoundaryError("RESOURCE_INVALID", "固定脚本名称无效")
    host_dir = Path(__file__).resolve().parent
    direct_helper = _safe_file_under_root(host_dir, (filename,))
    if direct_helper is not None:
        return direct_helper
    candidates = (
        (filename,),
        ("elevated-automation-host", filename),
        ("app.asar.unpacked", "src", "assets", "scripts", filename),
        ("src", "assets", "scripts", filename),
    )
    for parts in candidates:
        resolved = _safe_file_under_root(resource_root, parts)
        if resolved is not None:
            return resolved
    raise HostBoundaryError("RESOURCE_NOT_FOUND", f"固定脚本不存在：{filename}")


def validate_spawn_message(message, specs=OPERATION_SPECS):
    if not _plain_object(message) or message.get("type") != "spawn":
        raise HostBoundaryError("INVALID_SPAWN", "启动消息无效")
    allowed_keys = {
        "type", "requestId", "operationId", "args", "env", "stdin",
        "scriptContent", "copyStashTabSelector",
    }
    if not set(message).issubset(allowed_keys):
        raise HostBoundaryError("INVALID_SPAWN", "启动消息包含未授权字段")
    operation_id = message.get("operationId")
    if type(operation_id) is not str or operation_id not in specs:
        raise HostBoundaryError("UNKNOWN_OPERATION", "请求不在固定高权限操作白名单中")
    spec = specs[operation_id]
    request_id = _validate_uuid4(message.get("requestId"))
    args = message.get("args", [])
    if type(args) is not list or len(args) > 64 or any(type(item) is not str or "\0" in item for item in args):
        raise HostBoundaryError("INVALID_ARGS", "操作参数无效")
    env = message.get("env", {})
    if not _plain_object(env):
        raise HostBoundaryError("INVALID_ENV", "环境变量必须是对象")
    filtered_env = {}
    for key, value in env.items():
        if type(key) is not str or key not in ALLOWED_ENV_KEYS:
            raise HostBoundaryError("FORBIDDEN_ENV_KEY", f"不允许的环境变量：{key}")
        if value is not None:
            if type(value) is not str or "\0" in value:
                raise HostBoundaryError("INVALID_ENV", f"环境变量值无效：{key}")
            filtered_env[key] = value
    stdin_mode = message.get("stdin", "ignore")
    if stdin_mode not in ("ignore", "pipe"):
        raise HostBoundaryError("INVALID_STDIN_MODE", "stdin 模式无效")
    script_content = message.get("scriptContent")
    copy_stash_tab = bool(message.get("copyStashTabSelector", False))
    if spec.kind == "generated-crafting":
        if type(script_content) is not str or not script_content.strip() or "\0" in script_content:
            raise HostBoundaryError("INVALID_SCRIPT_CONTENT", "缺少有效制作脚本内容")
        if args:
            raise HostBoundaryError("INVALID_ARGS", "制作操作不允许附带命令行参数")
    else:
        if script_content is not None or copy_stash_tab:
            raise HostBoundaryError("FORBIDDEN_SCRIPT_CONTENT", "固定脚本操作禁止传入脚本内容")
    return {
        "requestId": request_id,
        "operationId": operation_id,
        "spec": spec,
        "args": list(args),
        "env": filtered_env,
        "stdin": stdin_mode,
        "scriptContent": script_content,
        "copyStashTabSelector": copy_stash_tab,
    }


def _is_current_process_elevated():
    if os.name != "nt":
        return False
    try:
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
        kernel32.GetCurrentProcess.restype = wintypes.HANDLE
        advapi32.OpenProcessToken.argtypes = [wintypes.HANDLE, wintypes.DWORD, ctypes.POINTER(wintypes.HANDLE)]
        advapi32.GetTokenInformation.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD)]
        kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
        token = wintypes.HANDLE()
        if not advapi32.OpenProcessToken(kernel32.GetCurrentProcess(), 0x0008, ctypes.byref(token)):
            return False
        try:
            elevated = wintypes.DWORD()
            needed = wintypes.DWORD()
            ok = advapi32.GetTokenInformation(token, 20, ctypes.byref(elevated), ctypes.sizeof(elevated), ctypes.byref(needed))
            return bool(ok and elevated.value)
        finally:
            kernel32.CloseHandle(token)
    except Exception:
        return False


def _create_private_temp_dir():
    """在系统临时目录下创建私有脚本目录；高权限运行时加锁为仅管理员与 SYSTEM 可访问。"""
    base = tempfile.mkdtemp(prefix="poe-elevated-")
    if os.name == "nt" and _is_current_process_elevated():
        try:
            advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
            kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
            advapi32.ConvertStringSecurityDescriptorToSecurityDescriptorW.argtypes = [
                wintypes.LPCWSTR, wintypes.DWORD, ctypes.POINTER(ctypes.c_void_p), ctypes.POINTER(wintypes.DWORD),
            ]
            advapi32.SetFileSecurityW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, ctypes.c_void_p]
            kernel32.LocalFree.argtypes = [ctypes.c_void_p]
            descriptor = ctypes.c_void_p()
            # 仅允许内置 Administrators 与 LocalSystem 完全控制，防止普通用户篡改临时脚本
            if advapi32.ConvertStringSecurityDescriptorToSecurityDescriptorW(
                "D:P(A;OICI;GA;;;BA)(A;OICI;GA;;;SY)", 1, ctypes.byref(descriptor), None
            ):
                try:
                    # DACL_SECURITY_INFORMATION | PROTECTED_DACL_SECURITY_INFORMATION
                    advapi32.SetFileSecurityW(base, 0x00000004 | 0x80000000, descriptor)
                finally:
                    kernel32.LocalFree(descriptor)
        except Exception:
            pass
    return Path(base)


class WindowsJob:
    """为每个受管子进程绑定 KILL_ON_JOB_CLOSE Job Object，确保 Host 退出时无孤儿高权限进程。"""

    def __init__(self, process):
        self.handle = None
        self.kernel32 = None
        if os.name != "nt":
            return
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel32.CreateJobObjectW.restype = wintypes.HANDLE
        kernel32.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
        kernel32.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
        kernel32.TerminateJobObject.argtypes = [wintypes.HANDLE, wintypes.UINT]
        kernel32.CloseHandle.argtypes = [wintypes.HANDLE]

        class BasicLimit(ctypes.Structure):
            _fields_ = [
                ("PerProcessUserTimeLimit", ctypes.c_longlong), ("PerJobUserTimeLimit", ctypes.c_longlong),
                ("LimitFlags", wintypes.DWORD), ("MinimumWorkingSetSize", ctypes.c_size_t),
                ("MaximumWorkingSetSize", ctypes.c_size_t), ("ActiveProcessLimit", wintypes.DWORD),
                ("Affinity", ctypes.c_size_t), ("PriorityClass", wintypes.DWORD),
                ("SchedulingClass", wintypes.DWORD),
            ]

        class IoCounters(ctypes.Structure):
            _fields_ = [(name, ctypes.c_ulonglong) for name in (
                "ReadOperationCount", "WriteOperationCount", "OtherOperationCount",
                "ReadTransferCount", "WriteTransferCount", "OtherTransferCount",
            )]

        class ExtendedLimit(ctypes.Structure):
            _fields_ = [
                ("BasicLimitInformation", BasicLimit), ("IoInfo", IoCounters),
                ("ProcessMemoryLimit", ctypes.c_size_t), ("JobMemoryLimit", ctypes.c_size_t),
                ("PeakProcessMemoryUsed", ctypes.c_size_t), ("PeakJobMemoryUsed", ctypes.c_size_t),
            ]

        handle = kernel32.CreateJobObjectW(None, None)
        if not handle:
            raise OSError(ctypes.get_last_error(), "CreateJobObjectW failed")
        limits = ExtendedLimit()
        limits.BasicLimitInformation.LimitFlags = 0x00002000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        if not kernel32.SetInformationJobObject(handle, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
            kernel32.CloseHandle(handle)
            raise OSError(ctypes.get_last_error(), "SetInformationJobObject failed")
        process_handle = wintypes.HANDLE(int(getattr(process, "_handle")))
        if not kernel32.AssignProcessToJobObject(handle, process_handle):
            kernel32.CloseHandle(handle)
            raise OSError(ctypes.get_last_error(), "AssignProcessToJobObject failed")
        self.kernel32 = kernel32
        self.handle = handle

    def terminate(self):
        if self.handle and self.kernel32:
            self.kernel32.TerminateJobObject(self.handle, 1)

    def close(self):
        if self.handle and self.kernel32:
            self.kernel32.CloseHandle(self.handle)
            self.handle = None


class ManagedWorker:
    """运行单个受管 Python 子进程并双向桥接 stdin/stdout/stderr。"""

    def __init__(self, request_id, process, job, temp_dir, on_event, on_done):
        self.request_id = request_id
        self.process = process
        self.job = job
        self.temp_dir = temp_dir
        self.on_event = on_event
        self.on_done = on_done
        self.stdin_lock = threading.Lock()
        self.lock = threading.RLock()
        self.cleaned = False
        self.stopped = False
        self.stdout_thread = threading.Thread(target=self._pump_stream, args=(process.stdout, "stdout"), daemon=True)
        self.stderr_thread = threading.Thread(target=self._pump_stream, args=(process.stderr, "stderr"), daemon=True)
        self.wait_thread = threading.Thread(target=self._wait_exit, daemon=True)
        self.stdout_thread.start()
        self.stderr_thread.start()
        self.wait_thread.start()

    @property
    def process_id(self):
        return int(self.process.pid)

    def write_stdin(self, text):
        with self.stdin_lock:
            stream = self.process.stdin
            if stream is None or stream.closed:
                return False
            try:
                stream.write(text.encode("utf-8"))
                stream.flush()
                return True
            except OSError:
                return False

    def close_stdin(self):
        with self.stdin_lock:
            stream = self.process.stdin
            if stream is not None and not stream.closed:
                try:
                    stream.close()
                except OSError:
                    pass

    def stop(self):
        with self.lock:
            self.stopped = True
        self.close_stdin()
        try:
            self.job.terminate()
        except Exception:
            pass
        if self.process.poll() is None:
            try:
                self.process.terminate()
            except OSError:
                pass
            try:
                self.process.wait(timeout=2.0)
            except subprocess.TimeoutExpired:
                try:
                    self.process.kill()
                except OSError:
                    pass
        return True

    def _pump_stream(self, stream, kind):
        if stream is None:
            return
        try:
            while True:
                chunk = stream.read1(MAX_STDOUT_CHUNK) if hasattr(stream, "read1") else stream.read(MAX_STDOUT_CHUNK)
                if not chunk:
                    break
                self.on_event({
                    "type": kind,
                    "requestId": self.request_id,
                    "data": chunk.decode("utf-8", "replace"),
                })
        except Exception:
            pass
        finally:
            try:
                stream.close()
            except OSError:
                pass

    def _wait_exit(self):
        exit_code = 1
        try:
            exit_code = int(self.process.wait())
        except Exception:
            exit_code = 1
        finally:
            self.stdout_thread.join(timeout=2.0)
            self.stderr_thread.join(timeout=2.0)
            self.cleanup()
            try:
                self.on_event({
                    "type": "exited",
                    "requestId": self.request_id,
                    "exitCode": exit_code,
                })
            finally:
                self.on_done(self.request_id)

    def cleanup(self):
        with self.lock:
            if self.cleaned:
                return
            self.cleaned = True
        self.close_stdin()
        for stream in (self.process.stdout, self.process.stderr):
            if stream is not None and not stream.closed:
                try:
                    stream.close()
                except OSError:
                    pass
        self.job.close()
        if self.temp_dir is not None:
            shutil.rmtree(self.temp_dir, ignore_errors=True)


def spawn_managed_worker(resource_root, request, on_event, on_done):
    spec = request["spec"]
    temp_dir = None
    cwd = None
    if spec.kind == "generated-crafting":
        temp_dir = _create_private_temp_dir()
        filename = "crafting.py" if request["operationId"] == "crafting.items" else "map_rolling.py"
        script_path = temp_dir / filename
        script_path.write_text(request["scriptContent"], encoding="utf-8")
        if request["copyStashTabSelector"]:
            selector = resolve_bundled_script(resource_root, "stash_tab_selector.py")
            shutil.copyfile(selector, temp_dir / "stash_tab_selector.py")
        cwd = str(temp_dir)
    else:
        script_path = resolve_bundled_script(resource_root, spec.script)
        if spec.use_script_dir_cwd:
            cwd = str(script_path.parent)

    env = dict(os.environ)
    env["PYTHONUNBUFFERED"] = "1"
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    env.update(request["env"])

    creation_flags = getattr(subprocess, "CREATE_NO_WINDOW", 0) if os.name == "nt" else 0
    stdin_pipe = subprocess.PIPE if request["stdin"] == "pipe" else subprocess.DEVNULL
    try:
        process = subprocess.Popen(
            [sys.executable, str(script_path), *request["args"]],
            stdin=stdin_pipe,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=cwd,
            env=env,
            creationflags=creation_flags,
        )
        job = WindowsJob(process)
    except Exception:
        if temp_dir is not None:
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    return ManagedWorker(request["requestId"], process, job, temp_dir, on_event, on_done)


class PipeChannel:
    """单连接、有界 NDJSON 命名管道通道。"""

    def __init__(self, api, handle):
        self.api = api
        self.handle = handle
        self.buffer = bytearray()
        self.write_lock = threading.Lock()
        self.closed = False

    def receive(self):
        while True:
            newline = self.buffer.find(b"\n")
            if newline >= 0:
                raw = bytes(self.buffer[:newline])
                del self.buffer[:newline + 1]
                if raw.endswith(b"\r"):
                    raw = raw[:-1]
                if not raw or len(raw) > MAX_MESSAGE_BYTES:
                    raise HostBoundaryError("INVALID_MESSAGE", "命名管道消息无效")
                try:
                    message = json.loads(raw.decode("utf-8", "strict"), object_pairs_hook=_json_no_duplicates)
                except HostBoundaryError:
                    raise
                except (UnicodeDecodeError, ValueError, json.JSONDecodeError) as error:
                    raise HostBoundaryError("INVALID_MESSAGE", "命名管道消息不是有效 JSON") from error
                if not _plain_object(message):
                    raise HostBoundaryError("INVALID_MESSAGE", "命名管道消息必须是对象")
                return message
            if len(self.buffer) > MAX_MESSAGE_BYTES:
                raise HostBoundaryError("MESSAGE_TOO_LARGE", "命名管道消息超限")
            chunk = self.api.read_pipe(self.handle, 64 * 1024)
            if chunk is None:
                time.sleep(0.005)
                continue
            if not chunk:
                return None
            self.buffer.extend(chunk)

    def send(self, message):
        if self.closed or not _plain_object(message):
            return False
        body = (json.dumps(message, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
        if len(body) > MAX_MESSAGE_BYTES:
            raise HostBoundaryError("MESSAGE_TOO_LARGE", "命名管道消息超限")
        with self.write_lock:
            if self.closed:
                return False
            self.api.write_pipe(self.handle, body)
            return True

    def close(self):
        with self.write_lock:
            if self.closed:
                return False
            self.closed = True
            self.api.close_pipe(self.handle)
            return True


class AutomationHostSession:
    """管理单个 UI 命名管道会话内的受管高权限进程。"""

    def __init__(self, resource_root, *, worker_factory=spawn_managed_worker):
        self.resource_root = Path(resource_root)
        self.worker_factory = worker_factory
        self.channel = None
        self.condition = threading.Condition(threading.RLock())
        self.active = {}
        self.used_request_ids = set()
        self.closed = False

    def serve(self, channel):
        self.channel = channel
        channel.send({
            "type": "hello",
            "protocolVersion": 1,
            "hostProcessId": os.getpid(),
        })
        shutdown_requested = False
        try:
            while not shutdown_requested:
                message = channel.receive()
                if message is None:
                    break
                kind = message.get("type")
                if kind == "spawn":
                    self._handle_spawn(message)
                elif kind == "stdin":
                    self._handle_stdin(message)
                elif kind == "stdin-end":
                    self._handle_stdin_end(message)
                elif kind == "stop":
                    self.stop(message.get("requestId"))
                elif kind == "stop-all":
                    self.stop_all()
                elif kind == "shutdown":
                    shutdown_requested = True
                else:
                    raise HostBoundaryError("INVALID_CONTROL", "未知控制消息")
            return shutdown_requested
        finally:
            with self.condition:
                self.closed = True
            self.stop_all()
            self.wait_for_idle(5.0)

    def _safe_send(self, payload):
        try:
            if self.channel is not None:
                self.channel.send(payload)
        except Exception:
            pass

    def _on_worker_done(self, request_id):
        with self.condition:
            self.active.pop(request_id, None)
            self.condition.notify_all()

    def _handle_spawn(self, message):
        request_id = message.get("requestId") if _plain_object(message) else None
        try:
            request = validate_spawn_message(message)
            request_id = request["requestId"]
            with self.condition:
                if self.closed:
                    raise HostBoundaryError("HOST_SESSION_CLOSED", "Host 会话已关闭")
                if request_id in self.used_request_ids:
                    raise HostBoundaryError("DUPLICATE_REQUEST_ID", "requestId 已使用")
                self.used_request_ids.add(request_id)
            worker = self.worker_factory(
                self.resource_root,
                request,
                self._safe_send,
                self._on_worker_done,
            )
            with self.condition:
                if self.closed:
                    worker.stop()
                    return
                self.active[request_id] = worker
            self._safe_send({
                "type": "started",
                "requestId": request_id,
                "processId": worker.process_id,
            })
        except HostBoundaryError as error:
            if type(request_id) is str:
                self._safe_send({
                    "type": "error",
                    "requestId": request_id,
                    "code": error.code,
                    "message": error.message,
                })
        except Exception as error:
            if type(request_id) is str:
                self._safe_send({
                    "type": "error",
                    "requestId": request_id,
                    "code": "WORKER_SPAWN_FAILED",
                    "message": str(error)[:240] or "高权限工作进程启动失败",
                })

    def _handle_stdin(self, message):
        request_id = message.get("requestId")
        data = message.get("data")
        if type(request_id) is not str or type(data) is not str:
            return
        with self.condition:
            worker = self.active.get(request_id)
        if worker is not None:
            worker.write_stdin(data)

    def _handle_stdin_end(self, message):
        request_id = message.get("requestId")
        if type(request_id) is not str:
            return
        with self.condition:
            worker = self.active.get(request_id)
        if worker is not None:
            worker.close_stdin()

    def stop(self, request_id):
        if type(request_id) is not str:
            return False
        with self.condition:
            worker = self.active.get(request_id)
        if worker is None:
            return False
        return bool(worker.stop())

    def stop_all(self):
        with self.condition:
            workers = list(self.active.values())
        ok = True
        for worker in workers:
            try:
                ok = bool(worker.stop()) and ok
            except Exception:
                ok = False
        return ok

    def wait_for_idle(self, timeout_seconds):
        deadline = time.monotonic() + max(0.0, timeout_seconds)
        with self.condition:
            while self.active:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    return False
                self.condition.wait(remaining)
            return True


def verify_pipe_client(api, pipe_handle, expected_process_id):
    actual = api.get_client_process_id(pipe_handle)
    if actual != expected_process_id:
        raise HostBoundaryError("CLIENT_PID_MISMATCH", "命名管道客户端进程不匹配")
    return True


class WindowsPipeApi:
    """最小 Win32 命名管道服务端，DACL 仅授权当前登录用户。"""

    _INVALID_HANDLE = ctypes.c_void_p(-1).value

    def __init__(self):
        if os.name != "nt":
            raise HostBoundaryError("WINDOWS_REQUIRED", "高权限 Host 仅支持 Windows")
        self.kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        self.advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
        self._configure_signatures()

    def _configure_signatures(self):
        self.kernel32.GetCurrentProcess.restype = wintypes.HANDLE
        self.kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        self.kernel32.OpenProcess.restype = wintypes.HANDLE
        self.kernel32.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
        self.kernel32.WaitForSingleObject.restype = wintypes.DWORD
        self.kernel32.CreateNamedPipeW.argtypes = [
            wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, wintypes.DWORD,
            wintypes.DWORD, wintypes.DWORD, wintypes.DWORD, ctypes.c_void_p,
        ]
        self.kernel32.CreateNamedPipeW.restype = wintypes.HANDLE
        self.kernel32.ConnectNamedPipe.argtypes = [wintypes.HANDLE, ctypes.c_void_p]
        self.kernel32.DisconnectNamedPipe.argtypes = [wintypes.HANDLE]
        self.kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
        self.kernel32.LocalFree.argtypes = [ctypes.c_void_p]
        self.kernel32.LocalFree.restype = ctypes.c_void_p
        self.kernel32.GetNamedPipeClientProcessId.argtypes = [
            wintypes.HANDLE, ctypes.POINTER(wintypes.ULONG),
        ]
        self.kernel32.ReadFile.argtypes = [
            wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD,
            ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p,
        ]
        self.kernel32.WriteFile.argtypes = [
            wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD,
            ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p,
        ]
        self.kernel32.PeekNamedPipe.argtypes = [
            wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD,
            ctypes.POINTER(wintypes.DWORD), ctypes.POINTER(wintypes.DWORD),
            ctypes.POINTER(wintypes.DWORD),
        ]
        self.advapi32.OpenProcessToken.argtypes = [
            wintypes.HANDLE, wintypes.DWORD, ctypes.POINTER(wintypes.HANDLE),
        ]
        self.advapi32.GetTokenInformation.argtypes = [
            wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD,
            ctypes.POINTER(wintypes.DWORD),
        ]
        self.advapi32.ConvertSidToStringSidW.argtypes = [
            ctypes.c_void_p, ctypes.POINTER(wintypes.LPWSTR),
        ]
        self.advapi32.ConvertStringSecurityDescriptorToSecurityDescriptorW.argtypes = [
            wintypes.LPCWSTR, wintypes.DWORD, ctypes.POINTER(ctypes.c_void_p),
            ctypes.POINTER(wintypes.DWORD),
        ]

    def _raise_last(self, code, message):
        raise HostBoundaryError(code, f"{message}（Win32 {ctypes.get_last_error()}）")

    def _current_user_sid(self):
        class SidAndAttributes(ctypes.Structure):
            _fields_ = [("Sid", ctypes.c_void_p), ("Attributes", wintypes.DWORD)]

        class TokenUser(ctypes.Structure):
            _fields_ = [("User", SidAndAttributes)]

        token = wintypes.HANDLE()
        if not self.advapi32.OpenProcessToken(self.kernel32.GetCurrentProcess(), 0x0008, ctypes.byref(token)):
            self._raise_last("PIPE_SECURITY_FAILED", "无法读取当前用户身份")
        try:
            needed = wintypes.DWORD()
            self.advapi32.GetTokenInformation(token, 1, None, 0, ctypes.byref(needed))
            if needed.value <= 0:
                self._raise_last("PIPE_SECURITY_FAILED", "无法读取用户令牌大小")
            buffer = ctypes.create_string_buffer(needed.value)
            if not self.advapi32.GetTokenInformation(token, 1, buffer, needed.value, ctypes.byref(needed)):
                self._raise_last("PIPE_SECURITY_FAILED", "无法读取用户 SID")
            token_user = ctypes.cast(buffer, ctypes.POINTER(TokenUser)).contents
            sid_text = wintypes.LPWSTR()
            if not self.advapi32.ConvertSidToStringSidW(token_user.User.Sid, ctypes.byref(sid_text)):
                self._raise_last("PIPE_SECURITY_FAILED", "无法转换用户 SID")
            try:
                return str(sid_text.value)
            finally:
                self.kernel32.LocalFree(sid_text)
        finally:
            self.kernel32.CloseHandle(token)

    def create_server(self, pipe_name):
        class SecurityAttributes(ctypes.Structure):
            _fields_ = [
                ("nLength", wintypes.DWORD),
                ("lpSecurityDescriptor", ctypes.c_void_p),
                ("bInheritHandle", wintypes.BOOL),
            ]

        sid = self._current_user_sid()
        descriptor = ctypes.c_void_p()
        sddl = f"D:P(A;;GA;;;{sid})"
        if not self.advapi32.ConvertStringSecurityDescriptorToSecurityDescriptorW(
            sddl, 1, ctypes.byref(descriptor), None
        ):
            self._raise_last("PIPE_SECURITY_FAILED", "无法建立命名管道 ACL")
        attributes = SecurityAttributes(ctypes.sizeof(SecurityAttributes), descriptor, False)
        try:
            handle = self.kernel32.CreateNamedPipeW(
                pipe_name,
                0x00000003 | 0x00080000,  # PIPE_ACCESS_DUPLEX | FILE_FLAG_FIRST_PIPE_INSTANCE
                0x00000000 | 0x00000008,  # PIPE_TYPE_BYTE | PIPE_REJECT_REMOTE_CLIENTS
                1,
                64 * 1024,
                64 * 1024,
                0,
                ctypes.byref(attributes),
            )
        finally:
            self.kernel32.LocalFree(descriptor)
        if handle in (None, 0, self._INVALID_HANDLE):
            self._raise_last("PIPE_CREATE_FAILED", "无法创建命名管道")
        return handle

    def connect(self, handle):
        if self.kernel32.ConnectNamedPipe(handle, None):
            return True
        if ctypes.get_last_error() == 535:  # ERROR_PIPE_CONNECTED
            return True
        self._raise_last("PIPE_CONNECT_FAILED", "命名管道连接失败")

    def get_client_process_id(self, handle):
        process_id = wintypes.ULONG()
        if not self.kernel32.GetNamedPipeClientProcessId(handle, ctypes.byref(process_id)):
            self._raise_last("PIPE_CLIENT_QUERY_FAILED", "无法校验管道客户端")
        return int(process_id.value)

    def read_pipe(self, handle, maximum):
        available = wintypes.DWORD()
        if not self.kernel32.PeekNamedPipe(handle, None, 0, None, ctypes.byref(available), None):
            error = ctypes.get_last_error()
            if error in (109, 232):  # ERROR_BROKEN_PIPE / ERROR_NO_DATA
                return b""
            self._raise_last("PIPE_READ_FAILED", "命名管道读取失败")
        if available.value == 0:
            return None
        buffer = ctypes.create_string_buffer(maximum)
        read = wintypes.DWORD()
        if not self.kernel32.ReadFile(handle, buffer, min(maximum, available.value), ctypes.byref(read), None):
            error = ctypes.get_last_error()
            if error in (109, 232):
                return b""
            self._raise_last("PIPE_READ_FAILED", "命名管道读取失败")
        return bytes(buffer.raw[:read.value])

    def write_pipe(self, handle, body):
        offset = 0
        while offset < len(body):
            chunk = body[offset:offset + 64 * 1024]
            buffer = ctypes.create_string_buffer(chunk, len(chunk))
            written = wintypes.DWORD()
            if not self.kernel32.WriteFile(handle, buffer, len(chunk), ctypes.byref(written), None) or written.value <= 0:
                self._raise_last("PIPE_WRITE_FAILED", "命名管道写入失败")
            offset += written.value
        return offset

    def close_pipe(self, handle):
        if handle not in (None, 0, self._INVALID_HANDLE):
            try:
                self.kernel32.DisconnectNamedPipe(handle)
            finally:
                self.kernel32.CloseHandle(handle)

    def watch_parent_exit(self, parent_pid, on_exit):
        handle = self.kernel32.OpenProcess(0x00100000, False, parent_pid)  # SYNCHRONIZE
        if not handle:
            return

        def monitor():
            try:
                self.kernel32.WaitForSingleObject(handle, 0xFFFFFFFF)
                on_exit()
            finally:
                self.kernel32.CloseHandle(handle)

        threading.Thread(target=monitor, name="elevated-host-parent-watch", daemon=True).start()


def run_host(encoded_descriptor, *, api=None):
    descriptor = decode_descriptor(encoded_descriptor)
    pipe_api = api or WindowsPipeApi()
    handle = pipe_api.create_server(descriptor["pipeName"])
    channel = None
    connected = threading.Event()
    session = AutomationHostSession(descriptor["resourceRoot"])

    def expire_unconnected_host():
        if not connected.wait(CONNECT_TIMEOUT_SECONDS):
            os._exit(1)

    threading.Thread(target=expire_unconnected_host, name="elevated-host-connect-timeout", daemon=True).start()
    if hasattr(pipe_api, "watch_parent_exit"):
        pipe_api.watch_parent_exit(descriptor["parentProcessId"], lambda: (session.stop_all(), os._exit(0)))

    try:
        pipe_api.connect(handle)
        verify_pipe_client(pipe_api, handle, descriptor["parentProcessId"])
        connected.set()
        channel = PipeChannel(pipe_api, handle)
        handle = None
        session.serve(channel)
        return 0
    finally:
        connected.set()
        if channel is not None:
            channel.close()
        elif handle is not None:
            pipe_api.close_pipe(handle)


def main(argv=None):
    arguments = list(sys.argv[1:] if argv is None else argv)
    if len(arguments) != 2 or arguments[0] != "--descriptor-base64":
        return 2
    try:
        return run_host(arguments[1])
    except (HostBoundaryError, OSError, ValueError):
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
