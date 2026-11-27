import argparse
import json
import os
import sys
import time

import mss

SCRIPT_DIRECTORY = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIRECTORY not in sys.path:
    sys.path.insert(0, SCRIPT_DIRECTORY)

from stash_pickup_template import (
    apply_fixed_timing,
    capture,
    choose_layout,
    is_game_foreground,
    region_rect,
    require_game_foreground,
)
from bag_auto_stash_template import (
    InputController,
    apply_fixed_timing as apply_transfer_timing,
    ensure_input_dependencies,
    normalize_operation_delay,
    parse_item_header,
    resolve_item_footprint,
    resolved_footprint_slots,
    transfer_pickup_item,
)
from slot_highlight_classifier import (
    DEFAULT_THRESHOLD,
    LABELS,
    classify_grid,
    default_weights_path,
    encode_png_data_url,
    extract_grid_tiles,
    load_classifier,
)


def emit(event, **payload):
    print("EVENT " + json.dumps({"event": event, **payload}, ensure_ascii=False), flush=True)


def failure_details(reason, config=None):
    reason = str(reason or "")
    if reason == "game-not-foreground":
        return {"failureCode": "GAME_NOT_FOREGROUND"}
    if reason in ("calibration-missing", "layout-unrecognized"):
        return {
            "failureCode": "REGION_GEOMETRY_CHANGED",
            "configurationIssueId": "stash-grid.any",
        }
    if reason == "grid-invalid":
        return {
            "failureCode": "REGION_INVALID",
            "configurationIssueId": (
                "junfeng.grid" if isinstance(config, dict) and config.get("grid_region")
                else "stash-grid.any"
            ),
        }
    return {}


def load_json(path, fallback=None):
    try:
        with open(path, "r", encoding="utf-8") as stream:
            return json.load(stream)
    except Exception:
        return fallback


def validate_classifier(config):
    weights_path = str(config.get("weights_path") or default_weights_path())
    try:
        return load_classifier(weights_path), ""
    except Exception as exc:
        return None, str(exc) or "weights-load-failed"


def grid_tiles(image, columns, rows):
    return extract_grid_tiles(image, columns, rows, margin_ratio=0.08, order="row-major")


def group_candidates(cells):
    by_key = {(cell["column"], cell["row"]): cell for cell in cells}
    groups = []
    visited = set()
    for key in by_key:
        if key in visited:
            continue
        pending, group = [key], []
        while pending:
            current = pending.pop()
            if current in visited or current not in by_key:
                continue
            visited.add(current)
            group.append(by_key[current])
            column, row = current
            pending.extend(((column - 1, row), (column + 1, row), (column, row - 1), (column, row + 1)))
        groups.append(sorted(group, key=lambda item: item["probability"], reverse=True))
    return groups


def ordered_candidates(groups):
    return sorted(
        (candidate for group in groups for candidate in group),
        key=lambda candidate: (candidate["row"], candidate["column"]),
    )


def classify(image, config, classifier):
    grid = config.get("grid", {})
    columns, rows = int(grid.get("columns", 12)), int(grid.get("rows", 11))
    if columns <= 0 or rows <= 0:
        raise RuntimeError("grid-invalid")
    threshold = float(config.get("highlight_threshold", DEFAULT_THRESHOLD))
    enable_border_boost = bool(config.get("enable_border_boost", True))
    cells, candidates, uncertain = classify_grid(
        image,
        columns,
        rows,
        classifier,
        highlight_threshold=threshold,
        enable_border_boost=enable_border_boost,
    )
    return cells, group_candidates(candidates), uncertain


def candidate_center(rect, columns, rows, candidate):
    return (
        rect["left"] + int(round((candidate["column"] + 0.5) * rect["width"] / columns)),
        rect["top"] + int(round((candidate["row"] + 0.5) * rect["height"] / rows)),
    )


def park_cursor_position(region, rect):
    bounds = region.get("displayPhysicalBounds") if isinstance(region, dict) else None
    if isinstance(bounds, dict):
        left = int(round(float(bounds.get("left", 0))))
        top = int(round(float(bounds.get("top", 0))))
        width = int(round(float(bounds.get("width", 0))))
        height = int(round(float(bounds.get("height", 0))))
        if width > 0 and height > 0:
            margin = 12
            candidates = (
                (left + margin, top + margin),
                (left + width - margin - 1, top + margin),
                (left + margin, top + height - margin - 1),
                (left + width - margin - 1, top + height - margin - 1),
            )
            right, bottom = rect["left"] + rect["width"], rect["top"] + rect["height"]
            for position in candidates:
                if not (rect["left"] <= position[0] < right and rect["top"] <= position[1] < bottom):
                    return position
    return rect["left"] - 24, rect["top"] - 24


def _calibration_union_rect(calibration):
    if not isinstance(calibration, dict):
        return None, None
    rects = []
    sample_region = None
    for key in ("root", "folder"):
        region = calibration.get(key)
        rect = region_rect(region)
        if rect:
            rects.append(rect)
            if sample_region is None:
                sample_region = region
    if not rects:
        return None, None
    left = min(item["left"] for item in rects)
    top = min(item["top"] for item in rects)
    right = max(item["left"] + item["width"] for item in rects)
    bottom = max(item["top"] + item["height"] for item in rects)
    return sample_region, {"left": left, "top": top, "width": right - left, "height": bottom - top}


def _tooltip_settle_seconds(config):
    return max(0.08, normalize_operation_delay(config.get("operation_delay_ms")) / 1000.0)


def run(config, preview=False):
    apply_fixed_timing({"fixed_timing": config.get("fixed_timing", {})})
    if not is_game_foreground():
        raise RuntimeError("game-not-foreground")
    ensure_input_dependencies()
    classifier, model_error = validate_classifier(config)
    from pynput.mouse import Controller as MouseController
    mouse = MouseController()
    with mss.MSS() as grabber:
        grid_region = config.get("grid_region")
        rect = region_rect(grid_region)
        layout_metadata = {}
        already_parked = False
        if rect:
            grid = config.get("grid", {})
            columns, rows = int(grid.get("columns", 12)), int(grid.get("rows", 11))
        else:
            cal_region, union_rect = _calibration_union_rect(config.get("calibration", {}))
            if union_rect:
                mouse.position = park_cursor_position(cal_region, union_rect)
                time.sleep(_tooltip_settle_seconds(config))
                require_game_foreground()
                already_parked = True
            layout = choose_layout(
                config.get("calibration", {}),
                grabber,
                float(config.get("layout_confidence", 1.15)),
            )
            rect = layout["rect"]
            columns = rows = int(layout["columns"])
            selected_region = config.get("calibration", {}).get(layout["calibration"], {})
            grid_region = selected_region.copy() if isinstance(selected_region, dict) else {}
            grid_region.update({
                "left": rect["left"],
                "top": rect["top"],
                "right": rect["left"] + rect["width"],
                "bottom": rect["top"] + rect["height"],
            })
            layout_metadata = {
                "layout": columns,
                "calibration": layout["calibration"],
                "confidence": round(float(layout["confidence"]), 3),
            }
        if columns <= 0 or rows <= 0:
            raise RuntimeError("grid-invalid")
        config = {**config, "grid_region": grid_region, "grid": {"columns": columns, "rows": rows}}
        if not already_parked:
            park_position = park_cursor_position(config.get("grid_region", {}), rect)
            mouse.position = park_position
            time.sleep(normalize_operation_delay(config.get("operation_delay_ms")) / 1000.0)
            require_game_foreground()
        image = capture(rect, grabber)
        if classifier is None:
            cells = [
                {
                    "column": tile["column"],
                    "row": tile["row"],
                    "label": "unknown",
                    "probability": 0.0,
                    "highlightProbability": 0.0,
                    "calibrated": False,
                    "borderBoosted": False,
                    "modelVersion": "",
                }
                for tile in grid_tiles(image, columns, rows)
            ]
            if preview:
                raw_url = encode_png_data_url(image)
                emit(
                    "preview",
                    modelReady=False,
                    modelError=model_error,
                    modelVersion="",
                    cells=cells,
                    candidateItems=0,
                    uncertainCells=columns * rows,
                    imageDataUrl=raw_url,
                    rawImageDataUrl=raw_url,
                    **layout_metadata,
                )
                return 0
            emit(
                "aborted",
                reason=model_error,
                modelVersion="",
                candidateItems=0,
                remainingItems=0,
                pickedItems=0,
                uncertainCells=columns * rows,
                **layout_metadata,
            )
            return 2

        cells, groups, uncertain = classify(image, config, classifier)
        common = {
            "modelVersion": classifier.version,
            "candidateItems": len(groups),
            "uncertainCells": len(uncertain),
            **layout_metadata,
        }
        if preview:
            raw_url = encode_png_data_url(image)
            emit(
                "preview",
                modelReady=True,
                cells=cells,
                candidates=[group[0] for group in groups],
                imageDataUrl=raw_url,
                rawImageDataUrl=raw_url,
                **common,
            )
            return 0
        if uncertain and bool(config.get("abort_on_uncertain", True)):
            emit("aborted", reason="uncertain-cells", remainingItems=len(groups), pickedItems=0, **common)
            return 2
        if not groups:
            emit("completed", reason="no-candidates", remainingItems=0, pickedItems=0, **common)
            return 0

        apply_transfer_timing(config)
        clipboard_controller = InputController(config)
        candidates = ordered_candidates(groups)
        candidate_keys = {(candidate["column"], candidate["row"]) for candidate in candidates}
        resolved_slots = set()
        ambiguous_slots = {
            (cell["column"], cell["row"])
            for cell in cells
            if (cell["column"], cell["row"]) not in candidate_keys and cell.get("label") != "empty"
        }
        ambiguous_slots.update((cell["column"], cell["row"]) for cell in uncertain)
        common["candidateItems"] = len(candidates)
        picked = 0
        try:
            emit("started", remainingItems=len(candidates), pickedItems=0, **common)
            for index, candidate in enumerate(candidates):
                candidate_key = (candidate["column"], candidate["row"])
                if candidate_key in resolved_slots:
                    emit(
                        "progress",
                        currentIndex=index + 1,
                        remainingItems=len(candidates) - index - 1,
                        pickedItems=picked,
                        skipped=True,
                        **common,
                    )
                    continue
                require_game_foreground()
                target_position = candidate_center(rect, columns, rows, candidate)
                if not clipboard_controller.move(*target_position):
                    emit(
                        "aborted",
                        reason="game-not-foreground",
                        remainingItems=len(candidates) - index,
                        pickedItems=picked,
                        **common,
                    )
                    return 2
                before_status, item_text = clipboard_controller.copy_item_text()
                if before_status == "empty":
                    ambiguous_slots.add(candidate_key)
                    emit(
                        "progress",
                        currentIndex=index + 1,
                        remainingItems=len(candidates) - index - 1,
                        pickedItems=picked,
                        skipped=True,
                        **common,
                    )
                    continue
                if before_status != "copied":
                    emit(
                        "aborted",
                        reason="transfer-unconfirmed",
                        remainingItems=len(candidates) - index,
                        pickedItems=picked,
                        **common,
                    )
                    return 2
                transferred, reason = transfer_pickup_item(clipboard_controller)
                if not transferred:
                    emit(
                        "aborted",
                        reason=reason,
                        remainingItems=len(candidates) - index,
                        pickedItems=picked,
                        **common,
                    )
                    return 2
                item = parse_item_header(item_text)
                footprint = resolve_item_footprint(item, config.get("item_footprints", {}))
                footprint_slots = resolved_footprint_slots(
                    candidate, footprint, candidates, ambiguous_slots
                )
                resolved_slots.update(footprint_slots)
                if not footprint_slots:
                    ambiguous_slots.add(candidate_key)
                picked += 1
                emit(
                    "progress",
                    currentIndex=index + 1,
                    remainingItems=len(candidates) - index - 1,
                    pickedItems=picked,
                    **common,
                )
            emit("completed", reason="completed", remainingItems=0, pickedItems=picked, **common)
            return 0
        finally:
            clipboard_controller.release_all()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()
    config = None
    try:
        config = load_json(args.config)
        if not isinstance(config, dict):
            raise RuntimeError("config-invalid")
        return run(config, args.preview)
    except Exception as exc:
        reason = str(exc)
        emit("error", reason=reason, **failure_details(reason, config))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
