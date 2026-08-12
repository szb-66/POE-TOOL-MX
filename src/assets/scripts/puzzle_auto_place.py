from __future__ import annotations

import argparse
import ctypes
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

# 内置 Python 使用隔离的 sys.path，不会自动加入正在执行脚本的目录。
# 自动放置脚本需要复用同目录的识别器，因此必须显式加入该目录。
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from puzzle_analyzer import (
    analyze_image,
    capture_region,
    focus_game_window,
    is_game_foreground,
    load_json,
)

timing_mode = "adaptive"
adaptive_timeout_ms = 1000
button_hold_seconds = 0.02
release_settle_seconds = 0.02
stash_tab_settle_seconds = 0.25
patch_verify_seconds = 0.55
RESULT_POLL_INTERVAL_SECONDS = 0.01

def event(name: str, **payload: Any) -> None:
    print("EVENT " + json.dumps({"event": name, **payload}, ensure_ascii=False), flush=True)


def fail(code: str, reason: str, **details: Any) -> int:
    event("error", code=code, reason=reason, **details)
    return 2


def cell_center(region: dict[str, Any], rows: int, columns: int, row: int, column: int) -> tuple[int, int]:
    left = float(region.get("left", 0))
    top = float(region.get("top", 0))
    width = float(region.get("right", left)) - left
    height = float(region.get("bottom", top)) - top
    return (
        round(left + (column + 0.5) * width / columns),
        round(top + (row + 0.5) * height / rows),
    )


def normalized_orientation(fragment_type: str, orientation: int) -> int:
    value = round(float(orientation or 0) / 90) * 90 % 360
    if fragment_type == "cross":
        return 0
    if fragment_type == "straight":
        return value % 180
    return value


def counter_clockwise_turns(fragment_type: str, current: int, target: int) -> int:
    current_value = normalized_orientation(fragment_type, current)
    target_value = normalized_orientation(fragment_type, target)
    period = 90 if fragment_type == "cross" else 180 if fragment_type == "straight" else 360
    return int(((current_value - target_value) % period) / 90)


def _region_bounds(region: dict[str, Any]) -> tuple[int, int, int, int]:
    left = round(float(region.get("left", region.get("x", 0))))
    top = round(float(region.get("top", region.get("y", 0))))
    right = round(float(region.get("right", left + region.get("width", 0))))
    bottom = round(float(region.get("bottom", top + region.get("height", 0))))
    return left, top, right, bottom


def verification_neutral_point(
    atlas_region: dict[str, Any],
    inventory_region: dict[str, Any],
    display_bounds: dict[str, Any] | None = None,
) -> tuple[int, int]:
    """选择两个识别区域之外的悬停点，避免游戏高亮改变待验证格的航线拓扑。"""
    left, top, right, bottom = _region_bounds(atlas_region)
    width, height = right - left, bottom - top
    margin = max(24, round(min(width, height) * 0.04))
    candidates = [
        (round((left + right) / 2), top - margin),
        (left - margin, round((top + bottom) / 2)),
        (round((left + right) / 2), bottom + margin),
        (right + margin, round((top + bottom) / 2)),
    ]
    if display_bounds:
        display_left, display_top, display_right, display_bottom = _region_bounds(display_bounds)
        candidates.extend([
            (display_left + margin, display_top + margin),
            (display_right - margin, display_top + margin),
            (display_left + margin, display_bottom - margin),
            (display_right - margin, display_bottom - margin),
        ])
    else:
        display_left = display_top = display_right = display_bottom = None

    def inside(point: tuple[int, int], region: dict[str, Any], padding: int = 2) -> bool:
        region_left, region_top, region_right, region_bottom = _region_bounds(region)
        x, y = point
        return (
            region_left - padding <= x <= region_right + padding
            and region_top - padding <= y <= region_bottom + padding
        )

    for point in candidates:
        x, y = point
        if display_bounds and not (display_left <= x <= display_right and display_top <= y <= display_bottom):
            continue
        if not inside(point, atlas_region) and not inside(point, inventory_region):
            return point
    raise RuntimeError("无法找到海图区外的安全验证悬停点")


def move_physical(x: int, y: int) -> None:
    if os.name != "nt":
        raise RuntimeError("海图自动放置目前仅支持 Windows")
    if not is_game_foreground():
        raise RuntimeError("游戏已失去前台")
    user32 = user32_api()
    if not user32.SetCursorPos(int(x), int(y)):
        raise RuntimeError("无法移动鼠标到海图坐标")


def user32_api() -> Any:
    return ctypes.windll.user32


def click_physical(x: int, y: int, button: str, delay: float) -> None:
    move_physical(x, y)
    time.sleep(max(0.0, float(delay)))
    if not is_game_foreground():
        raise RuntimeError("游戏已失去前台")
    user32 = user32_api()
    if button == "right":
        down, up = 0x0008, 0x0010
    else:
        down, up = 0x0002, 0x0004
    pressed = False
    try:
        user32.mouse_event(down, 0, 0, 0, 0)
        pressed = True
        time.sleep(button_hold_seconds)
    finally:
        if pressed:
            user32.mouse_event(up, 0, 0, 0, 0)
            time.sleep(release_settle_seconds)


def inventory_tab_point(points: dict[str, Any], page: int) -> tuple[int, int]:
    value = points.get(str(page), points.get(page)) if isinstance(points, dict) else None
    if not isinstance(value, dict):
        raise RuntimeError(f"第 {page} 页仓库页签坐标未配置")
    return int(value["x"]), int(value["y"])


def switch_inventory_page(points: dict[str, Any], page: int, delay: float) -> None:
    click_physical(*inventory_tab_point(points, page), "left", delay)
    move_physical(0, 0)
    if timing_mode == "fixed":
        time.sleep(stash_tab_settle_seconds)


def place_fragment(
    source_point: tuple[int, int],
    target_point: tuple[int, int],
    delay: float,
    neutral_point: tuple[int, int] | None = None,
) -> None:
    click_physical(*source_point, "left", delay)
    if timing_mode == "fixed":
        time.sleep(patch_verify_seconds)
    click_physical(*target_point, "left", delay)
    if neutral_point is not None:
        move_physical(*neutral_point)
    if timing_mode == "fixed":
        time.sleep(patch_verify_seconds)


def capture_analyze(
    region: dict[str, Any],
    templates: dict[str, Any],
    region_type: str,
    manage_overlay: bool = True,
    recognition: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if manage_overlay:
        event("capture-start", regionType=region_type)
    try:
        return analyze_image(capture_region(region, region_type), templates, region_type, recognition)
    finally:
        if manage_overlay:
            event("capture-end", regionType=region_type)


def available_sources(result: dict[str, Any], fragment_type: str) -> list[dict[str, Any]]:
    candidates = [
        slot for slot in result.get("slots", [])
        if slot.get("occupied") and slot.get("type") == fragment_type
    ]
    return sorted(candidates, key=lambda slot: (-float(slot.get("confidence", 0)), int(slot["row"]), int(slot["column"])))


def source_slot(result: dict[str, Any], source: dict[str, Any]) -> dict[str, Any] | None:
    slots = result.get("slots", [])
    index = int(source["row"]) * 6 + int(source["column"])
    return slots[index] if result.get("success") and len(slots) == 60 else None


def planned_source_valid(result: dict[str, Any], source: dict[str, Any] | None, target: dict[str, Any]) -> bool:
    """计划来源必须仍占用对应格子；手动修正格可跳过识别类型校验。"""
    if not source:
        return False
    if source.get("type") != target.get("type"):
        return False
    live = source_slot(result, source)
    if not live or not live.get("occupied"):
        return False
    if not source.get("corrected") and live.get("type") != source.get("type"):
        return False
    return True


def source_orientation_matches(slot: dict[str, Any] | None, fragment_type: str, expected: int) -> bool:
    return bool(
        slot
        and slot.get("occupied")
        and slot.get("type") == fragment_type
        and normalized_orientation(fragment_type, int(slot.get("orientation", 0))) == normalized_orientation(fragment_type, expected)
    )


def verify_source_rotation(
    region: dict[str, Any],
    templates: dict[str, Any],
    source: dict[str, Any],
    expected: int,
    delay: float,
    recognition: dict[str, Any] | None = None,
) -> tuple[bool, dict[str, Any] | None]:
    latest = None
    fragment_type = str(source.get("type"))
    deadline = time.monotonic() + (adaptive_timeout_ms / 1000.0) if timing_mode == "adaptive" else None
    for attempt in range(1, 4):
        capture_kwargs = {} if not recognition else {"recognition": recognition}
        result = capture_analyze(region, templates, "inventory", **capture_kwargs)
        latest = source_slot(result, source)
        matched = source_orientation_matches(latest, fragment_type, expected)
        event(
            "source-rotation-verification",
            attempt=attempt,
            success=matched,
            expectedOrientation=normalized_orientation(fragment_type, expected),
            actual=latest,
            source=latest or source,
            slots=result.get("slots", []) if result.get("success") else [],
        )
        if matched:
            return True, latest
        if deadline is not None and time.monotonic() >= deadline:
            break
        remaining = deadline - time.monotonic() if deadline is not None else patch_verify_seconds
        if remaining > 0:
            time.sleep(min(RESULT_POLL_INTERVAL_SECONDS, remaining))
    return False, latest


def rotate_source_to_target(
    region: dict[str, Any],
    templates: dict[str, Any],
    source: dict[str, Any],
    target_orientation: int,
    delay: float,
    recognition: dict[str, Any] | None = None,
    retry_on_mismatch: bool = False,
) -> tuple[bool, dict[str, Any], dict[str, Any] | None]:
    """逐次旋转并确认仓库中的实际角度；仅当确认点击未生效时才补发右键。"""
    confirmed = dict(source)
    fragment_type = str(source.get("type"))
    turns = counter_clockwise_turns(fragment_type, int(source.get("orientation", 0)), target_orientation)
    source_point = cell_center(region, 10, 6, int(source["row"]), int(source["column"]))
    latest: dict[str, Any] | None = source
    for _turn_index in range(turns):
        expected = normalized_orientation(fragment_type, int(confirmed.get("orientation", 0)) - 90)
        retries = 2 if retry_on_mismatch else 0
        matched = False
        for _attempt in range(retries + 1):
            click_physical(*source_point, "right", delay)
            # 游戏右键旋转存在动画与输入冷却。先等待，再最多重读三次；
            # 右键不是幂等操作：仅当确认点击未生效（实际朝向与点击前一致）时才补发，避免多转 90°。
            if timing_mode == "fixed":
                time.sleep(patch_verify_seconds)
            matched, latest = verify_source_rotation(region, templates, confirmed, expected, delay, recognition)
            if matched:
                break
            before_orientation = normalized_orientation(fragment_type, int(confirmed.get("orientation", 0)))
            actual_orientation = normalized_orientation(fragment_type, int((latest or {}).get("orientation", 0)))
            if latest is None or actual_orientation != before_orientation:
                break
        if not matched:
            if retry_on_mismatch:
                confirmed = {**confirmed, "orientation": expected, "rotationUnverified": True}
                latest = dict(latest or source)
                latest["expectedOrientation"] = expected
                return True, confirmed, latest
            failure = dict(latest or {})
            failure["expectedOrientation"] = expected
            return False, confirmed, failure
        confirmed = {**confirmed, **(latest or {}), "orientation": expected}
    return True, confirmed, latest


def slot_matches(slot: dict[str, Any] | None, target: dict[str, Any]) -> bool:
    if not slot or not slot.get("occupied"):
        return False
    return slot.get("type") == target.get("type") and int(slot.get("mask", 0)) == (int(target.get("mask", 0)) & 15)


def initial_completed_indices(
    slots: list[dict[str, Any]], targets: list[dict[str, Any]], resume: bool
) -> set[int]:
    """全新执行必须覆盖九格；仅续跑会从当前海图恢复已完成格。"""
    if not resume or len(slots) != 9:
        return set()
    return {
        int(target["index"])
        for target in targets
        if slot_matches(slots[int(target["row"]) * 3 + int(target["column"])], target)
    }


def occupied_atlas_indices(result: dict[str, Any]) -> list[int]:
    """置信度不影响残留门禁；只要识别格明确为占用就要求先清空。"""
    slots = result.get("slots", [])
    if not result.get("success") or len(slots) != 9:
        return []
    return [index for index, slot in enumerate(slots) if slot.get("occupied")]


def verify_target(
    region: dict[str, Any],
    templates: dict[str, Any],
    target: dict[str, Any],
    delay: float,
    recognition: dict[str, Any] | None = None,
) -> tuple[bool, dict[str, Any] | None]:
    latest = None
    deadline = time.monotonic() + (adaptive_timeout_ms / 1000.0) if timing_mode == "adaptive" else None
    event("capture-series-start", regionType="atlas")
    try:
        for attempt in range(1, 4):
            capture_kwargs = {} if not recognition else {"recognition": recognition}
            result = capture_analyze(region, templates, "atlas", manage_overlay=False, **capture_kwargs)
            index = int(target["row"]) * 3 + int(target["column"])
            latest = result.get("slots", [])[index] if result.get("success") and len(result.get("slots", [])) == 9 else None
            event("verification", index=int(target["index"]), attempt=attempt, success=slot_matches(latest, target), actual=latest)
            if slot_matches(latest, target):
                return True, latest
            if deadline is not None and time.monotonic() >= deadline:
                break
            remaining = deadline - time.monotonic() if deadline is not None else patch_verify_seconds
            if remaining > 0:
                time.sleep(min(RESULT_POLL_INTERVAL_SECONDS, remaining))
        return False, latest
    finally:
        event("capture-series-end", regionType="atlas")


def main() -> int:
    global timing_mode, adaptive_timeout_ms, button_hold_seconds, release_settle_seconds
    global stash_tab_settle_seconds, patch_verify_seconds
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    config = load_json(Path(args.config))
    targets = config.get("targets") or []
    if len(targets) != 9:
        return fail("PLAN_INVALID", "自动放置方案必须包含九个目标格")
    templates = load_json(config["templatesPath"])
    recognition = config.get("recognition") or {}
    source_slots = config.get("sourceSlots")
    inventory_tab_points = config.get("inventoryTabPoints") or {}
    inventory_region = config["inventoryRegion"]
    atlas_region = config["atlasRegion"]
    neutral_point = verification_neutral_point(atlas_region, inventory_region, config.get("displayBounds"))
    delay = max(0.0, float(config.get("operation_delay_ms", 50)) / 1000)
    timing_mode = config.get("timing_mode", "adaptive")
    adaptive_timeout_ms = float(config.get("adaptive_timeout_ms", 1000))
    fixed_timing = config.get("fixed_timing", {})
    button_hold_seconds = max(0.0, float(fixed_timing.get("button_hold_ms", 20))) / 1000.0
    release_settle_seconds = max(0.0, float(fixed_timing.get("release_settle_ms", 20))) / 1000.0
    stash_tab_settle_seconds = max(0.0, float(fixed_timing.get("stash_tab_settle_ms", 250))) / 1000.0
    patch_verify_seconds = max(0.0, float(fixed_timing.get("patch_verify_ms", 550))) / 1000.0
    focused, focus_error = focus_game_window()
    if not focused:
        return fail(focus_error, "无法激活流放之路游戏窗口")

    resume_pending = bool(config.get("resume"))
    initial_atlas = capture_analyze(atlas_region, templates, "atlas", recognition=recognition)
    if not initial_atlas.get("success"):
        error = initial_atlas.get("error", {})
        return fail(
            error.get("code", "ATLAS_RECOGNITION_FAILED"),
            error.get("message", "执行前海图区识别失败，未发送任何放置点击"),
        )
    initial_slots: list[dict[str, Any]] = initial_atlas.get("slots", [])
    residual_indices = occupied_atlas_indices(initial_atlas)
    if not resume_pending and residual_indices:
        return fail(
            "ATLAS_NOT_EMPTY",
            "检测到海图区仍有碎片，请先点击游戏内“清空面板”，确认九格全部为空后重新自动放入",
            occupiedIndices=residual_indices,
            occupiedCount=len(residual_indices),
        )
    completed_indices = initial_completed_indices(initial_slots, targets, resume_pending)
    event("started", total=9, completed=len(completed_indices), completedIndices=sorted(completed_indices))
    planned_sources = source_slots if isinstance(source_slots, list) and len(source_slots) == 9 else None
    for position, target in enumerate(targets):
        if int(target["index"]) in completed_indices:
            event("step-completed", currentIndex=position, completed=len(completed_indices), target=target, skipped=True)
            continue
        if not is_game_foreground():
            return fail("GAME_NOT_FOREGROUND", "游戏已失去前台", currentIndex=position)
        target_point = cell_center(atlas_region, 3, 3, int(target["row"]), int(target["column"]))
        if resume_pending:
            resume_pending = False
            try:
                click_physical(*target_point, "left", delay)
                move_physical(*neutral_point)
                if timing_mode == "fixed":
                    time.sleep(patch_verify_seconds)
            except RuntimeError as error:
                return fail("INPUT_FAILED", str(error), currentIndex=position)
            recovered, _actual = verify_target(atlas_region, templates, target, delay, recognition)
            if recovered:
                completed_indices.add(int(target["index"]))
                event("step-completed", currentIndex=position, completed=len(completed_indices), target=target, recoveredHeld=True)
                continue
        source = planned_sources[position] if planned_sources is not None else {"page": 1}
        source_page = int(source.get("page", 1))
        event("source-page", currentIndex=position, completed=len(completed_indices), source=source)
        try:
            switch_inventory_page(inventory_tab_points, source_page, delay)
        except (KeyError, TypeError, ValueError, RuntimeError) as error:
            return fail("TAB_SWITCH_FAILED", str(error), currentIndex=position, source=source)
        inventory = capture_analyze(inventory_region, templates, "inventory", recognition=recognition)
        if not inventory.get("success"):
            error = inventory.get("error", {})
            return fail(error.get("code", "INVENTORY_RECOGNITION_FAILED"), error.get("message", "碎片仓库识别失败"), currentIndex=position)
        if planned_sources is not None:
            if not planned_source_valid(inventory, source, target):
                return fail("SOURCE_NOT_FOUND", f"第 {source_page} 页仓库中没有计划的{target.get('type')}碎片，请重新识别对应页面", currentIndex=position, source=source)
        else:
            sources = available_sources(inventory, str(target.get("type")))
            if not sources:
                return fail("SOURCE_NOT_FOUND", f"仓库中没有{target.get('type')}碎片", currentIndex=position)
            source = sources[0]
        turns = counter_clockwise_turns(str(target.get("type")), int(source.get("orientation", 0)), int(target.get("orientation", 0)))
        event("step", currentIndex=position, completed=len(completed_indices), target=target, source=source, turns=turns, slots=inventory.get("slots", []))
        try:
            rotation_ok, source, rotation_actual = rotate_source_to_target(
                inventory_region,
                templates,
                source,
                int(target.get("orientation", 0)),
                delay,
                recognition,
                bool(source.get("corrected")),
            )
            if not rotation_ok:
                return fail(
                    "SOURCE_ROTATION_MISMATCH",
                    f"仓库碎片旋转后角度确认失败，已停止在海图第 {position + 1} 格放入前",
                    currentIndex=position,
                    expected=target,
                    actual=rotation_actual,
                )
            source_point = cell_center(inventory_region, 10, 6, int(source["row"]), int(source["column"]))
            place_fragment(source_point, target_point, delay, neutral_point)
        except RuntimeError as error:
            return fail("INPUT_FAILED", str(error), currentIndex=position)
        verified, actual = verify_target(atlas_region, templates, target, delay, recognition)
        if not verified:
            return fail("TARGET_MISMATCH", f"海图第 {position + 1} 格验证失败", currentIndex=position, expected=target, actual=actual)
        completed_indices.add(int(target["index"]))
        event("step-completed", currentIndex=position, completed=len(completed_indices), target=target, source=source)

    final_result = capture_analyze(atlas_region, templates, "atlas", recognition=recognition)
    actual_slots = final_result.get("slots", []) if final_result.get("success") else []
    mismatch = next((target for target in targets if not slot_matches(actual_slots[int(target["row"]) * 3 + int(target["column"])] if len(actual_slots) == 9 else None, target)), None)
    if mismatch:
        return fail("FINAL_VERIFICATION_FAILED", "海图终检与当前方案不一致", expected=mismatch)
    event("completed", completed=9, total=9)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except Exception as error:
        raise SystemExit(fail("AUTO_PLACEMENT_FAILED", f"海图自动放置失败：{error}"))
