import argparse
import base64
import hashlib
import json
import os
import sys
import time

import cv2
import mss
import numpy as np

SCRIPT_DIRECTORY = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIRECTORY not in sys.path:
    sys.path.insert(0, SCRIPT_DIRECTORY)

from stash_pickup_template import (
    apply_fixed_timing,
    capture,
    ctrl_click,
    focus_game_window,
    is_game_foreground,
    patch_changed,
    region_rect,
    require_game_foreground,
    choose_layout,
)
from bag_auto_stash_template import InterfaceMatcher

LABELS = ("highlighted", "dimmed", "empty")
CALIBRATION_UNSET = object()


def emit(event, **payload):
    print("EVENT " + json.dumps({"event": event, **payload}, ensure_ascii=False), flush=True)


def load_json(path, fallback=None):
    try:
        with open(path, "r", encoding="utf-8") as stream:
            return json.load(stream)
    except Exception:
        return fallback


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        while True:
            chunk = stream.read(1024 * 1024)
            if not chunk:
                return digest.hexdigest()
            digest.update(chunk)


def validate_model(config):
    manifest_path = str(config.get("manifest_path", ""))
    model_path = str(config.get("model_path", ""))
    manifest = load_json(manifest_path)
    if not isinstance(manifest, dict):
        return None, "model-manifest-missing"
    if (manifest.get("schemaVersion") != 1 or manifest.get("architectureVersion") != 1
            or tuple(manifest.get("classes", ())) != LABELS):
        return None, "model-contract-invalid"
    if not os.path.isfile(model_path):
        return None, "model-file-missing"
    if str(manifest.get("sha256", "")).lower() != sha256(model_path).lower():
        return None, "model-checksum-mismatch"
    input_size = manifest.get("inputSize", {})
    if int(input_size.get("width", 0)) <= 0 or int(input_size.get("height", 0)) <= 0:
        return None, "model-input-invalid"
    try:
        import onnxruntime as ort
        session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
        return ModelRuntime(session, manifest), ""
    except Exception as exc:
        return None, "model-load-failed:" + str(exc)


def softmax(values):
    shifted = values - np.max(values, axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / np.maximum(np.sum(exp, axis=1, keepdims=True), 1e-8)


class ModelRuntime:
    def __init__(self, session, manifest):
        self.session = session
        self.manifest = manifest
        self.version = str(manifest.get("modelVersion", ""))
        self.width = int(manifest["inputSize"]["width"])
        self.height = int(manifest["inputSize"]["height"])
        outputs = manifest.get("outputs", {})
        self.input_name = str(manifest.get("inputName") or session.get_inputs()[0].name)
        self.logits_name = str(outputs.get("logits", "logits"))
        self.embedding_name = str(outputs.get("embedding", "embedding"))

    def infer(self, images):
        if not images:
            return np.zeros((0, 3), np.float32), np.zeros((0, 32), np.float32)
        tensors = []
        for image in images:
            resized = cv2.resize(image, (self.width, self.height), interpolation=cv2.INTER_AREA)
            rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
            tensors.append(np.transpose(rgb, (2, 0, 1)))
        batch = np.ascontiguousarray(np.stack(tensors), dtype=np.float32)
        logits, embeddings = self.session.run([self.logits_name, self.embedding_name], {self.input_name: batch})
        probabilities = softmax(np.asarray(logits, dtype=np.float32))
        embeddings = np.asarray(embeddings, dtype=np.float32).reshape(len(images), -1)
        if embeddings.shape[1] != 32:
            raise RuntimeError("model-embedding-contract-invalid")
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return probabilities, embeddings / np.maximum(norms, 1e-8)


def grid_tile(image, columns, rows, column, row):
    x0 = int(round(column * image.shape[1] / columns))
    x1 = int(round((column + 1) * image.shape[1] / columns))
    y0 = int(round(row * image.shape[0] / rows))
    y1 = int(round((row + 1) * image.shape[0] / rows))
    margin_x = max(1, int(round((x1 - x0) * 0.08)))
    margin_y = max(1, int(round((y1 - y0) * 0.08)))
    tile = image[y0 + margin_y:y1 - margin_y, x0 + margin_x:x1 - margin_x].copy()
    return {"column": column, "row": row, "bounds": (x0, y0, x1, y1), "image": tile}


def grid_tiles(image, columns, rows):
    return [grid_tile(image, columns, rows, column, row)
            for row in range(rows) for column in range(columns)]


def data_url(image):
    ok, encoded = cv2.imencode(".png", image)
    return "data:image/png;base64," + base64.b64encode(encoded).decode("ascii") if ok else ""


def load_calibration(config, model):
    index = load_json(str(config.get("calibration_index", "")), {"samples": []}) or {"samples": []}
    root = os.path.abspath(str(config.get("calibration_root", "")))
    images, labels = [], []
    for sample in index.get("samples", []):
        label = str(sample.get("label", ""))
        file_path = os.path.abspath(os.path.join(root, str(sample.get("relativePath", ""))))
        if label not in LABELS or not file_path.startswith(root + os.sep) or not os.path.isfile(file_path):
            continue
        try:
            image = cv2.imdecode(np.fromfile(file_path, dtype=np.uint8), cv2.IMREAD_COLOR)
            if image is not None and image.size:
                images.append(image)
                labels.append(LABELS.index(label))
        except Exception:
            pass
    if not images:
        return None
    _, embeddings = model.infer(images)
    return embeddings, np.asarray(labels, dtype=np.int32)


def apply_calibration(probabilities, embeddings, calibration, similarity):
    if calibration is None:
        return probabilities, np.zeros(len(probabilities), dtype=bool)
    sample_embeddings, labels = calibration
    output = probabilities.copy()
    overridden = np.zeros(len(probabilities), dtype=bool)
    similarities = embeddings @ sample_embeddings.T
    for index in range(len(output)):
        close = np.where(similarities[index] >= similarity)[0]
        if not len(close):
            continue
        weights = np.maximum(similarities[index, close] - similarity + 1e-4, 1e-4)
        votes = np.bincount(labels[close], weights=weights, minlength=len(LABELS))
        label = int(np.argmax(votes))
        output[index] = 0.0
        output[index, label] = 1.0
        overridden[index] = True
    return output, overridden


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


def classify(image, config, model, calibration=CALIBRATION_UNSET):
    grid = config.get("grid", {})
    columns, rows = int(grid.get("columns", 12)), int(grid.get("rows", 11))
    if columns <= 0 or rows <= 0:
        raise RuntimeError("grid-invalid")
    tiles = grid_tiles(image, columns, rows)
    probabilities, embeddings = model.infer([tile["image"] for tile in tiles])
    if calibration is CALIBRATION_UNSET:
        calibration = load_calibration(config, model)
    probabilities, overridden = apply_calibration(
        probabilities, embeddings, calibration, float(config.get("calibration_similarity", 0.965)))
    threshold = float(config.get("highlight_threshold", 0.995))
    cells, candidates, uncertain = [], [], []
    for index, tile in enumerate(tiles):
        label_index = int(np.argmax(probabilities[index]))
        probability = float(probabilities[index, label_index])
        highlight_probability = float(probabilities[index, 0])
        cell = {
            "column": tile["column"], "row": tile["row"], "label": LABELS[label_index],
            "probability": round(probability, 6), "highlightProbability": round(highlight_probability, 6),
            "calibrated": bool(overridden[index]), "modelVersion": model.version,
            "embedding": [round(float(value), 7) for value in embeddings[index]],
            "tileDataUrl": data_url(tile["image"]),
        }
        if label_index == 0 and highlight_probability >= threshold:
            cell["decision"] = "candidate"
            candidates.append({**cell, "probability": highlight_probability})
        elif label_index == 0 or highlight_probability >= 0.5:
            cell["decision"] = "uncertain"
            uncertain.append(cell)
        else:
            cell["decision"] = "classified"
        cells.append(cell)
    return cells, group_candidates(candidates), uncertain


def candidate_label(image, columns, rows, candidate, config, model, calibration, require_threshold=False):
    tile = grid_tile(image, columns, rows, candidate["column"], candidate["row"])
    probabilities, embeddings = model.infer([tile["image"]])
    probabilities, _ = apply_calibration(
        probabilities, embeddings, calibration, float(config.get("calibration_similarity", 0.965)))
    label = LABELS[int(np.argmax(probabilities[0]))]
    if require_threshold and (label != "highlighted" or
                              float(probabilities[0, 0]) < float(config.get("highlight_threshold", 0.995))):
        return "uncertain" if label == "highlighted" else label
    return label


def annotated(image, columns, rows, cells):
    output = image.copy()
    colors = {"highlighted": (0, 220, 0), "dimmed": (140, 140, 140), "empty": (70, 70, 70), "unknown": (0, 180, 255)}
    for cell in cells:
        x0 = int(round(cell["column"] * image.shape[1] / columns))
        x1 = int(round((cell["column"] + 1) * image.shape[1] / columns))
        y0 = int(round(cell["row"] * image.shape[0] / rows))
        y1 = int(round((cell["row"] + 1) * image.shape[0] / rows))
        cv2.rectangle(output, (x0 + 2, y0 + 2), (x1 - 3, y1 - 3), colors.get(cell.get("label"), colors["unknown"]), 2)
    return data_url(output)


def candidate_patch(image, columns, rows, candidate):
    column, row = candidate["column"], candidate["row"]
    x0 = int(round(column * image.shape[1] / columns))
    x1 = int(round((column + 1) * image.shape[1] / columns))
    y0 = int(round(row * image.shape[0] / rows))
    y1 = int(round((row + 1) * image.shape[0] / rows))
    return image[y0:y1, x0:x1].copy()


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


def require_action_ready(interface_matcher, interface_mode):
    require_game_foreground()
    if interface_matcher is None:
        return
    if hasattr(interface_matcher, "check_ready"):
        if not interface_matcher.check_ready(interface_mode):
            raise RuntimeError("reward-interface-lost" if interface_mode == "reward" else "interface-lost")
        return
    matches, _scores = interface_matcher.check_interface()
    ready = matches.get("rewardMatched") and matches.get("inventoryMatched") \
        if interface_mode == "reward" else matches.get("stashMatched")
    if not ready:
        raise RuntimeError("reward-interface-lost" if interface_mode == "reward" else "interface-lost")


def wait_for_candidate_change(before, rect, columns, rows, candidate, grabber, delay, timeout,
                              config, model, calibration, interface_matcher=None, interface_mode="stash"):
    deadline = time.monotonic() + max(timeout, delay * 6)
    while time.monotonic() < deadline:
        time.sleep(min(0.05, delay))
        require_action_ready(interface_matcher, interface_mode)
        after_image = capture(rect, grabber)
        after = candidate_patch(after_image, columns, rows, candidate)
        if patch_changed(before, after, 8.0) and \
                candidate_label(after_image, columns, rows, candidate, config, model, calibration) == "empty":
            return after_image
    return None


def run(config, preview=False):
    apply_fixed_timing({"fixed_timing": config.get("fixed_timing", {})})
    if not focus_game_window():
        raise RuntimeError("game-not-foreground")
    model, model_error = validate_model(config)
    from pynput.mouse import Controller as MouseController
    mouse = MouseController()
    with mss.MSS() as grabber:
        grid_region = config.get("grid_region")
        rect = region_rect(grid_region)
        layout_metadata = {}
        if rect:
            grid = config.get("grid", {})
            columns, rows = int(grid.get("columns", 12)), int(grid.get("rows", 11))
        else:
            layout = choose_layout(config.get("calibration", {}), grabber,
                                   float(config.get("layout_confidence", 1.15)))
            rect = layout["rect"]
            columns = rows = int(layout["columns"])
            selected_region = config.get("calibration", {}).get(layout["calibration"], {})
            grid_region = selected_region.copy() if isinstance(selected_region, dict) else {}
            grid_region.update({
                "left": rect["left"], "top": rect["top"],
                "right": rect["left"] + rect["width"],
                "bottom": rect["top"] + rect["height"],
            })
            layout_metadata = {
                "layout": columns, "calibration": layout["calibration"],
                "confidence": round(float(layout["confidence"]), 3),
            }
        if columns <= 0 or rows <= 0:
            raise RuntimeError("grid-invalid")
        config = {**config, "grid_region": grid_region, "grid": {"columns": columns, "rows": rows}}
        park_position = park_cursor_position(config.get("grid_region", {}), rect)
        mouse.position = park_position
        time.sleep(0.08)
        require_game_foreground()
        image = capture(rect, grabber)
        if model is None:
            cells = [{"column": c, "row": r, "label": "unknown", "probability": 0.0,
                      "highlightProbability": 0.0, "calibrated": False, "modelVersion": "",
                      "tileDataUrl": data_url(tile["image"])}
                     for tile in grid_tiles(image, columns, rows)
                     for c, r in [(tile["column"], tile["row"])]]
            if preview:
                emit("preview", modelReady=False, modelError=model_error, modelVersion="", cells=cells,
                     candidateItems=0, uncertainCells=columns * rows,
                     imageDataUrl=annotated(image, columns, rows, cells), rawImageDataUrl=data_url(image),
                     **layout_metadata)
                return 0
            emit("aborted", reason=model_error, modelVersion="", candidateItems=0,
                 remainingItems=0, pickedItems=0, uncertainCells=columns * rows, **layout_metadata)
            return 2
        calibration = load_calibration(config, model)
        interface_mode = str(config.get("interface_mode", "stash"))
        interface_matcher = InterfaceMatcher(config) if config.get("templates") else None
        if interface_matcher is not None and not interface_matcher.valid:
            raise RuntimeError("interface-template-invalid")
        cells, groups, uncertain = classify(image, config, model, calibration)
        common = {"modelVersion": model.version, "candidateItems": len(groups),
                  "uncertainCells": len(uncertain), **layout_metadata}
        if preview:
            emit("preview", modelReady=True, cells=cells, candidates=[group[0] for group in groups],
                 imageDataUrl=annotated(image, columns, rows, cells), rawImageDataUrl=data_url(image), **common)
            return 0
        if uncertain and bool(config.get("abort_on_uncertain", True)):
            emit("aborted", reason="uncertain-cells", remainingItems=len(groups), pickedItems=0, **common)
            return 2
        if not groups:
            emit("completed", reason="no-candidates", remainingItems=0, pickedItems=0, **common)
            return 0

        from pynput.keyboard import Controller as KeyboardController, Key
        from pynput.mouse import Button
        keyboard = KeyboardController()
        delay = max(0.02, float(config.get("operation_delay_ms", 80)) / 1000.0)
        timing_mode = config.get("timing_mode", "fixed")
        adaptive_timeout = max(0.5, min(3.0, float(config.get("adaptive_timeout_ms", 1000)) / 1000.0))
        fixed_timeout = max(0.08, float(config.get("fixed_timing", {}).get("patch_verify_ms", 550)) / 1000.0)
        verify_timeout = adaptive_timeout if timing_mode == "adaptive" else fixed_timeout
        candidates = [candidate for group in groups for candidate in group]
        common["candidateItems"] = len(candidates)
        picked = 0
        try:
            emit("started", remainingItems=len(candidates), pickedItems=0, **common)
            for index, candidate in enumerate(candidates):
                require_action_ready(interface_matcher, interface_mode)
                inspection_image = capture(rect, grabber)
                if candidate_label(inspection_image, columns, rows, candidate, config, model, calibration, True) != "highlighted":
                    emit("progress", currentIndex=index + 1, remainingItems=len(candidates) - index - 1,
                         pickedItems=picked, skipped=True, **common)
                    continue
                require_action_ready(interface_matcher, interface_mode)
                mouse.position = candidate_center(rect, columns, rows, candidate)
                time.sleep(delay)
                require_action_ready(interface_matcher, interface_mode)
                current_image = capture(rect, grabber)
                before = candidate_patch(current_image, columns, rows, candidate)
                after_image = None
                for attempt in range(2):
                    require_action_ready(interface_matcher, interface_mode)
                    ctrl_click(mouse, keyboard, Key.ctrl, Button.left)
                    after_image = wait_for_candidate_change(
                        before, rect, columns, rows, candidate, grabber, delay, verify_timeout,
                        config, model, calibration, interface_matcher, interface_mode)
                    if after_image is None:
                        require_action_ready(interface_matcher, interface_mode)
                        fallback_image = capture(rect, grabber)
                        if candidate_label(fallback_image, columns, rows, candidate, config, model, calibration) == "empty":
                            after_image = fallback_image
                    if after_image is not None:
                        break
                    if attempt == 0:
                        time.sleep(max(0.08, delay))
                if after_image is None:
                    emit("aborted", reason="transfer-unconfirmed", remainingItems=len(candidates) - index,
                         pickedItems=picked, **common)
                    return 2
                picked += 1
                emit("progress", currentIndex=index + 1, remainingItems=len(candidates) - index - 1,
                     pickedItems=picked, **common)
            emit("completed", reason="completed", remainingItems=0, pickedItems=picked, **common)
            return 0
        finally:
            try:
                keyboard.release(Key.ctrl)
            except Exception:
                pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()
    try:
        config = load_json(args.config)
        if not isinstance(config, dict):
            raise RuntimeError("config-invalid")
        return run(config, args.preview)
    except Exception as exc:
        emit("error", reason=str(exc))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
