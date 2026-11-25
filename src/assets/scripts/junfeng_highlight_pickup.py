import argparse
import base64
from contextlib import nullcontext
import hashlib
import json
import os
import signal
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
    is_game_foreground,
    region_rect,
    require_game_foreground,
    choose_layout,
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
LABELS = ("highlighted", "dimmed", "empty")
CALIBRATION_UNSET = object()
_ACTIVE_EMITTER = None
_WORKER_RUNNING = True
_WORKER_CONTEXT = {"model_cache": None, "calibration_cache": None, "grabber": None}
_INCLUDE_PREVIEW_ASSETS = True


def _handle_worker_signal(_signum, _frame):
    global _WORKER_RUNNING
    _WORKER_RUNNING = False
    raise KeyboardInterrupt("worker-terminated")


def emit(event, **payload):
    if _ACTIVE_EMITTER is not None:
        _ACTIVE_EMITTER(event, **payload)
        return
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


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        while True:
            chunk = stream.read(1024 * 1024)
            if not chunk:
                return digest.hexdigest()
            digest.update(chunk)


def _file_stat_signature(path):
    try:
        stat = os.stat(path)
        return int(stat.st_size), int(stat.st_mtime_ns), int(stat.st_mtime * 1000)
    except OSError:
        return None


def validate_model(config, model_cache=None):
    if model_cache is None:
        model_cache = _WORKER_CONTEXT.get("model_cache")
    manifest_path = str(config.get("manifest_path", ""))
    model_path = str(config.get("model_path", ""))
    manifest_sig = _file_stat_signature(manifest_path) if manifest_path else None
    model_sig = _file_stat_signature(model_path) if model_path else None
    cache_key = (
        os.path.abspath(model_path) if model_path else "",
        os.path.abspath(manifest_path) if manifest_path else "",
        model_sig,
        manifest_sig,
    )
    if (isinstance(model_cache, dict) and model_sig is not None and manifest_sig is not None
            and model_cache.get("key") == cache_key and model_cache.get("runtime") is not None):
        return model_cache["runtime"], ""

    manifest = load_json(manifest_path)
    if not isinstance(manifest, dict):
        return None, "model-manifest-missing"
    if (manifest.get("schemaVersion") != 1 or manifest.get("architectureVersion") != 1
            or tuple(manifest.get("classes", ())) != LABELS):
        return None, "model-contract-invalid"
    if not os.path.isfile(model_path) or model_sig is None:
        return None, "model-file-missing"
    expected_hash = str(manifest.get("sha256", "")).lower()
    verified_stamp = config.get("verified_stamp") if isinstance(config.get("verified_stamp"), dict) else None
    stamp_matches = False
    if verified_stamp and expected_hash and str(verified_stamp.get("sha256", "")).lower() == expected_hash:
        stamp_matches = (
            int(verified_stamp.get("size", -1)) == model_sig[0]
            and int(verified_stamp.get("mtimeMs", -1)) == model_sig[2]
        )
    if not stamp_matches and expected_hash != sha256(model_path).lower():
        return None, "model-checksum-mismatch"
    input_size = manifest.get("inputSize", {})
    if int(input_size.get("width", 0)) <= 0 or int(input_size.get("height", 0)) <= 0:
        return None, "model-input-invalid"
    try:
        import onnxruntime as ort
        session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
        runtime = ModelRuntime(session, manifest)
        if isinstance(model_cache, dict):
            model_cache.clear()
            model_cache["key"] = cache_key
            model_cache["runtime"] = runtime
        return runtime, ""
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


def load_calibration(config, model, calibration_cache=None):
    if calibration_cache is None:
        calibration_cache = _WORKER_CONTEXT.get("calibration_cache")
    index_path = str(config.get("calibration_index", ""))
    root_raw = str(config.get("calibration_root", ""))
    if not index_path:
        return None
    index_sig = _file_stat_signature(index_path)
    cache_key = (os.path.abspath(index_path), index_sig, model.version)
    if (isinstance(calibration_cache, dict) and index_sig is not None
            and calibration_cache.get("key") == cache_key):
        return calibration_cache.get("value")

    index = load_json(index_path, {"samples": []}) or {"samples": []}
    root = os.path.abspath(root_raw)
    cached_vectors, cached_labels = [], []
    images_to_infer, infer_labels = [], []
    for sample in index.get("samples", []):
        label = str(sample.get("label", ""))
        file_path = os.path.abspath(os.path.join(root, str(sample.get("relativePath", ""))))
        if label not in LABELS or not file_path.startswith(root + os.sep) or not os.path.isfile(file_path):
            continue
        label_idx = LABELS.index(label)
        vector = sample.get("featureVector")
        sample_version = str(sample.get("modelVersion", ""))
        if (isinstance(vector, list) and len(vector) == 32
                and sample_version and sample_version == model.version):
            try:
                arr = np.asarray(vector, dtype=np.float32)
                norm = float(np.linalg.norm(arr))
                if np.all(np.isfinite(arr)) and norm > 1e-8:
                    cached_vectors.append(arr / norm)
                    cached_labels.append(label_idx)
                    continue
            except Exception:
                pass
        try:
            image = cv2.imdecode(np.fromfile(file_path, dtype=np.uint8), cv2.IMREAD_COLOR)
            if image is not None and image.size:
                images_to_infer.append(image)
                infer_labels.append(label_idx)
        except Exception:
            pass

    all_embeddings = []
    all_labels = []
    if cached_vectors:
        all_embeddings.append(np.stack(cached_vectors).astype(np.float32))
        all_labels.extend(cached_labels)
    if images_to_infer:
        _, inferred = model.infer(images_to_infer)
        all_embeddings.append(inferred.astype(np.float32))
        all_labels.extend(infer_labels)

    result = None
    if all_embeddings:
        result = (
            np.concatenate(all_embeddings, axis=0),
            np.asarray(all_labels, dtype=np.int32),
        )
    if isinstance(calibration_cache, dict) and index_sig is not None:
        calibration_cache.clear()
        calibration_cache["key"] = cache_key
        calibration_cache["value"] = result
    return result


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


def ordered_candidates(groups):
    return sorted(
        (candidate for group in groups for candidate in group),
        key=lambda candidate: (candidate["row"], candidate["column"]),
    )


def classify(image, config, model, calibration=CALIBRATION_UNSET, include_preview_assets=None):
    emit_preview_assets = _INCLUDE_PREVIEW_ASSETS if include_preview_assets is None else bool(include_preview_assets)
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
        }
        if emit_preview_assets:
            cell["embedding"] = [round(float(value), 7) for value in embeddings[index]]
            cell["tileDataUrl"] = data_url(tile["image"])
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


def run(config, preview=False):
    global _INCLUDE_PREVIEW_ASSETS
    apply_fixed_timing({"fixed_timing": config.get("fixed_timing", {})})
    if not is_game_foreground():
        raise RuntimeError("game-not-foreground")
    ensure_input_dependencies()
    model, model_error = validate_model(config)
    from pynput.mouse import Controller as MouseController
    mouse = MouseController()
    shared_grabber = _WORKER_CONTEXT.get("grabber")
    grabber_ctx = nullcontext(shared_grabber) if shared_grabber is not None else mss.MSS()
    previous_include_preview = _INCLUDE_PREVIEW_ASSETS
    _INCLUDE_PREVIEW_ASSETS = bool(preview)
    try:
        with grabber_ctx as grabber:
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
            time.sleep(normalize_operation_delay(config.get("operation_delay_ms")) / 1000.0)
            require_game_foreground()
            image = capture(rect, grabber)
            if model is None:
                cells = [{"column": c, "row": r, "label": "unknown", "probability": 0.0,
                          "highlightProbability": 0.0, "calibrated": False, "modelVersion": "",
                          **({"tileDataUrl": data_url(tile["image"])} if preview else {})}
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

            apply_transfer_timing(config)
            clipboard_controller = InputController(config)
            mouse = clipboard_controller.mouse
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
                        emit("progress", currentIndex=index + 1, remainingItems=len(candidates) - index - 1,
                             pickedItems=picked, skipped=True, **common)
                        continue
                    require_game_foreground()
                    target_position = candidate_center(rect, columns, rows, candidate)
                    if not clipboard_controller.move(*target_position):
                        emit("aborted", reason="game-not-foreground", remainingItems=len(candidates) - index,
                             pickedItems=picked, **common)
                        return 2
                    before_status, item_text = clipboard_controller.copy_item_text()
                    if before_status == "empty":
                        ambiguous_slots.add(candidate_key)
                        emit("progress", currentIndex=index + 1, remainingItems=len(candidates) - index - 1,
                             pickedItems=picked, skipped=True, **common)
                        continue
                    if before_status != "copied":
                        emit("aborted", reason="transfer-unconfirmed", remainingItems=len(candidates) - index,
                             pickedItems=picked, **common)
                        return 2
                    transferred, reason = transfer_pickup_item(clipboard_controller)
                    if not transferred:
                        emit("aborted", reason=reason, remainingItems=len(candidates) - index,
                             pickedItems=picked, **common)
                        return 2
                    item = parse_item_header(item_text)
                    footprint = resolve_item_footprint(item, config.get("item_footprints", {}))
                    footprint_slots = resolved_footprint_slots(
                        candidate, footprint, candidates, ambiguous_slots)
                    resolved_slots.update(footprint_slots)
                    if not footprint_slots:
                        ambiguous_slots.add(candidate_key)
                    picked += 1
                    emit("progress", currentIndex=index + 1, remainingItems=len(candidates) - index - 1,
                         pickedItems=picked, **common)
                emit("completed", reason="completed", remainingItems=0, pickedItems=picked, **common)
                return 0
            finally:
                clipboard_controller.release_all()
    finally:
        _INCLUDE_PREVIEW_ASSETS = previous_include_preview


def run_worker():
    global _ACTIVE_EMITTER, _WORKER_RUNNING
    _WORKER_RUNNING = True
    signal.signal(signal.SIGINT, _handle_worker_signal)
    signal.signal(signal.SIGTERM, _handle_worker_signal)
    model_cache = {}
    calibration_cache = {}
    emit("worker-ready")
    with mss.MSS() as grabber:
        _WORKER_CONTEXT["model_cache"] = model_cache
        _WORKER_CONTEXT["calibration_cache"] = calibration_cache
        _WORKER_CONTEXT["grabber"] = grabber
        try:
            while _WORKER_RUNNING:
                line = sys.stdin.readline()
                if not line:
                    break
                line = line.strip()
                if not line:
                    continue
                request_id = ""
                config = None
                try:
                    command = json.loads(line)
                    if not isinstance(command, dict):
                        raise RuntimeError("command-invalid")
                    cmd = str(command.get("cmd", ""))
                    request_id = str(command.get("requestId", ""))
                    if cmd == "shutdown":
                        emit("worker-shutdown", requestId=request_id)
                        return 0
                    if cmd == "ping":
                        emit("pong", requestId=request_id)
                        continue
                    config_path = str(command.get("configPath", ""))
                    config = load_json(config_path)
                    if not isinstance(config, dict):
                        raise RuntimeError("config-invalid")

                    def scoped_emit(event_name, **payload):
                        if request_id:
                            payload["requestId"] = request_id
                        print("EVENT " + json.dumps({"event": event_name, **payload}, ensure_ascii=False), flush=True)

                    _ACTIVE_EMITTER = scoped_emit
                    try:
                        if cmd == "warmup":
                            model, model_error = validate_model(config)
                            if model is not None:
                                load_calibration(config, model)
                            emit(
                                "warmup-done",
                                modelReady=model is not None,
                                modelVersion=model.version if model is not None else "",
                                modelError=model_error,
                            )
                        elif cmd == "preview":
                            run(config, preview=True)
                        elif cmd == "run":
                            run(config, preview=False)
                        else:
                            raise RuntimeError("unknown-command:" + cmd)
                    finally:
                        _ACTIVE_EMITTER = None
                except KeyboardInterrupt:
                    return 0
                except Exception as exc:
                    _ACTIVE_EMITTER = None
                    reason = str(exc)
                    payload = {"reason": reason, **failure_details(reason, config)}
                    if request_id:
                        payload["requestId"] = request_id
                    emit("error", **payload)
        finally:
            _WORKER_CONTEXT["model_cache"] = None
            _WORKER_CONTEXT["calibration_cache"] = None
            _WORKER_CONTEXT["grabber"] = None
    return 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config")
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--worker", action="store_true")
    args = parser.parse_args()
    if args.worker:
        return run_worker()
    if not args.config:
        emit("error", reason="config-invalid")
        return 2
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
