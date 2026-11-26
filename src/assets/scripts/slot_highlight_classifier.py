import base64
import os
import struct
import zlib

import numpy as np

LABELS = ("highlighted", "dimmed", "empty")
SCHEMA_VERSION = 1
FEATURE_DIM = 73

_V_THRESHOLDS = (0.05, 0.10, 0.16, 0.24, 0.34, 0.45, 0.58, 0.72, 0.85)
_C_THRESHOLDS = (0.05, 0.12, 0.22, 0.35, 0.50)
_BORDER_MASK_16 = np.zeros((16, 16), dtype=bool)
_BORDER_MASK_16[:2, :] = True
_BORDER_MASK_16[-2:, :] = True
_BORDER_MASK_16[:, :2] = True
_BORDER_MASK_16[:, -2:] = True

_CLASSIFIER_CACHE = {}


def default_weights_path():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = (
        os.path.join(script_dir, "slot-highlight", "weights.npz"),
        os.path.abspath(os.path.join(script_dir, "..", "models", "slot-highlight", "weights.npz")),
    )
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate
    return candidates[0]


def _cell_bounds(width, height, columns, rows, column, row):
    x0 = int(round(column * width / columns))
    x1 = int(round((column + 1) * width / columns))
    y0 = int(round(row * height / rows))
    y1 = int(round((row + 1) * height / rows))
    return x0, y0, x1, y1


def extract_grid_tiles(image, columns, rows, margin_ratio=0.08, order="row-major"):
    if image is None or getattr(image, "ndim", 0) != 3 or image.shape[2] < 3:
        raise RuntimeError("grid-image-invalid")
    if int(columns) <= 0 or int(rows) <= 0:
        raise RuntimeError("grid-invalid")
    height, width = int(image.shape[0]), int(image.shape[1])
    tiles = []
    coords = (
        ((column, row) for column in range(columns) for row in range(rows))
        if order == "column-major"
        else ((column, row) for row in range(rows) for column in range(columns))
    )
    for column, row in coords:
        x0, y0, x1, y1 = _cell_bounds(width, height, columns, rows, column, row)
        cell_w = max(1, x1 - x0)
        cell_h = max(1, y1 - y0)
        margin_x = max(1, int(round(cell_w * margin_ratio))) if cell_w > 2 else 0
        margin_y = max(1, int(round(cell_h * margin_ratio))) if cell_h > 2 else 0
        ix0 = min(x1 - 1, x0 + margin_x) if x1 > x0 else x0
        ix1 = max(ix0 + 1, x1 - margin_x) if x1 > x0 else x1
        iy0 = min(y1 - 1, y0 + margin_y) if y1 > y0 else y0
        iy1 = max(iy0 + 1, y1 - margin_y) if y1 > y0 else y1
        tile = image[iy0:iy1, ix0:ix1, :3]
        if tile.size == 0:
            raise RuntimeError("grid-tile-empty")
        tiles.append({
            "column": column,
            "row": row,
            "bounds": (x0, y0, x1, y1),
            "image": tile,
        })
    return tiles


def _resample_16x16(bgr_batch):
    if isinstance(bgr_batch, np.ndarray) and bgr_batch.ndim == 4:
        count, height, width, _channels = bgr_batch.shape
        if count == 0:
            return np.zeros((0, 16, 16, 3), dtype=np.float32)
        ys = np.linspace(0, max(0, height - 1), 16).astype(np.int32)
        xs = np.linspace(0, max(0, width - 1), 16).astype(np.int32)
        return bgr_batch[:, ys][:, :, xs, :3].astype(np.float32) * (1.0 / 255.0)

    items = list(bgr_batch)
    count = len(items)
    if count == 0:
        return np.zeros((0, 16, 16, 3), dtype=np.float32)
    out = np.empty((count, 16, 16, 3), dtype=np.float32)
    index_cache = {}
    for index, tile in enumerate(items):
        arr = np.asarray(tile)
        if arr.ndim != 3 or arr.shape[0] <= 0 or arr.shape[1] <= 0 or arr.shape[2] < 3:
            raise RuntimeError("grid-tile-empty")
        height, width = int(arr.shape[0]), int(arr.shape[1])
        pair = (height, width)
        cached = index_cache.get(pair)
        if cached is None:
            ys = np.linspace(0, height - 1, 16).astype(np.int32)
            xs = np.linspace(0, width - 1, 16).astype(np.int32)
            cached = (ys[:, None], xs[None, :])
            index_cache[pair] = cached
        out[index] = arr[cached[0], cached[1], :3]
    out *= 1.0 / 255.0
    return out


def extract_fast_features(bgr_batch):
    sub = _resample_16x16(bgr_batch)
    count = sub.shape[0]
    if count == 0:
        return np.zeros((0, FEATURE_DIM), dtype=np.float32)

    b, g, r = sub[..., 0], sub[..., 1], sub[..., 2]
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    chroma = cmax - cmin
    luma = 0.114 * b + 0.587 * g + 0.299 * r

    fv = cmax.reshape(count, 256)
    fl = luma.reshape(count, 256)
    fc = chroma.reshape(count, 256)
    fr = r.reshape(count, 256)
    fg = g.reshape(count, 256)
    fb = b.reshape(count, 256)

    v_bins = np.column_stack([(fv > thr).mean(axis=1) for thr in _V_THRESHOLDS])
    c_bins = np.column_stack([(fc > thr).mean(axis=1) for thr in _C_THRESHOLDS])

    top_v = np.partition(fv, 240, axis=1)[:, 240:]
    top_c = np.partition(fc, 240, axis=1)[:, 240:]
    low_v = np.partition(fv, 32, axis=1)[:, :32]

    gold = np.clip(r - b, 0.0, 1.0) * np.clip(g - b * 0.75, 0.0, 1.0) * (r > 0.35)
    bgold = gold[:, _BORDER_MASK_16]

    blue_dom = np.clip(fb - np.maximum(fr, fg), 0.0, 1.0).mean(axis=1)
    red_dom = np.clip(fr - np.maximum(fg, fb), 0.0, 1.0).mean(axis=1)

    gx = np.abs(np.diff(luma, axis=2))
    gy = np.abs(np.diff(luma, axis=1))

    l4 = luma.reshape(count, 4, 4, 4, 4).mean(axis=(2, 4)).reshape(count, 16)
    c4 = chroma.reshape(count, 4, 4, 4, 4).mean(axis=(2, 4)).reshape(count, 16)

    stats = np.column_stack([
        fv.mean(axis=1), fv.std(axis=1), fv.max(axis=1),
        fl.mean(axis=1), fl.std(axis=1),
        fc.mean(axis=1), fc.std(axis=1), fc.max(axis=1),
        fr.mean(axis=1), fg.mean(axis=1), fb.mean(axis=1),
        fr.std(axis=1), fg.std(axis=1), fb.std(axis=1),
        top_v.mean(axis=1), top_v.max(axis=1), low_v.mean(axis=1),
        top_c.mean(axis=1), top_c.max(axis=1),
        blue_dom, red_dom,
        bgold.mean(axis=1), bgold.max(axis=1),
        gx.mean(axis=(1, 2)), gx.max(axis=(1, 2)),
        gy.mean(axis=(1, 2)), gy.max(axis=(1, 2)),
    ])
    return np.hstack([stats, v_bins, c_bins, l4, c4]).astype(np.float32)


def _softmax(logits):
    shifted = logits - np.max(logits, axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / np.maximum(np.sum(exp, axis=1, keepdims=True), 1e-8)


class SlotHighlightClassifier:
    def __init__(self, version, mu, sd, w1, b1, w2, b2, w3, b3):
        self.version = str(version)
        self.mu = np.asarray(mu, dtype=np.float32)
        self.sd = np.asarray(sd, dtype=np.float32)
        self.W1 = np.asarray(w1, dtype=np.float32)
        self.b1 = np.asarray(b1, dtype=np.float32)
        self.W2 = np.asarray(w2, dtype=np.float32)
        self.b2 = np.asarray(b2, dtype=np.float32)
        self.W3 = np.asarray(w3, dtype=np.float32)
        self.b3 = np.asarray(b3, dtype=np.float32)
        if (
            self.mu.shape != (FEATURE_DIM,)
            or self.sd.shape != (FEATURE_DIM,)
            or self.W1.ndim != 2
            or self.W1.shape[0] != FEATURE_DIM
            or self.W2.ndim != 2
            or self.W2.shape[0] != self.W1.shape[1]
            or self.W3.ndim != 2
            or self.W3.shape[0] != self.W2.shape[1]
            or self.W3.shape[1] != len(LABELS)
        ):
            raise RuntimeError("weights-contract-invalid")

    def predict_proba(self, images):
        features = extract_fast_features(images)
        if len(features) == 0:
            return np.zeros((0, len(LABELS)), dtype=np.float32)
        normalized = (features - self.mu) / self.sd
        a1 = np.maximum(normalized @ self.W1 + self.b1, 0.0)
        a2 = np.maximum(a1 @ self.W2 + self.b2, 0.0)
        logits = a2 @ self.W3 + self.b3
        return _softmax(logits).astype(np.float32)


def load_classifier(weights_path=None):
    target = os.path.abspath(str(weights_path or default_weights_path()))
    if not os.path.isfile(target):
        raise RuntimeError("weights-file-missing")
    stat = os.stat(target)
    cache_key = (target, int(stat.st_size), int(stat.st_mtime_ns))
    cached = _CLASSIFIER_CACHE.get(cache_key)
    if cached is not None:
        return cached
    with np.load(target, allow_pickle=False) as data:
        required = ("schema_version", "version", "mu", "sd", "W1", "b1", "W2", "b2", "W3", "b3")
        if any(field not in data.files for field in required):
            raise RuntimeError("weights-contract-invalid")
        if int(np.asarray(data["schema_version"]).item()) != SCHEMA_VERSION:
            raise RuntimeError("weights-contract-invalid")
        version = str(np.asarray(data["version"]).item())
        classifier = SlotHighlightClassifier(
            version=version,
            mu=data["mu"],
            sd=data["sd"],
            w1=data["W1"],
            b1=data["b1"],
            w2=data["W2"],
            b2=data["b2"],
            w3=data["W3"],
            b3=data["b3"],
        )
    if len(_CLASSIFIER_CACHE) > 8:
        _CLASSIFIER_CACHE.clear()
    _CLASSIFIER_CACHE[cache_key] = classifier
    return classifier


def compute_border_gold_scores(image, columns, rows, order="row-major"):
    count = int(columns) * int(rows)
    scores = np.zeros(count, dtype=np.float32)
    if image is None or getattr(image, "ndim", 0) != 3 or image.shape[2] < 3 or count <= 0:
        return scores
    height, width = int(image.shape[0]), int(image.shape[1])
    if (width / columns) < 16.0 or (height / rows) < 16.0:
        return scores

    coords = (
        [(column, row) for column in range(columns) for row in range(rows)]
        if order == "column-major"
        else [(column, row) for row in range(rows) for column in range(columns)]
    )
    f = image[:, :, :3].astype(np.float32) * (1.0 / 255.0)
    b_ch, g_ch, r_ch = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    is_gold = (
        (r_ch > 0.45)
        & (g_ch > 0.30)
        & ((r_ch - b_ch) > 0.18)
        & ((g_ch - b_ch) > 0.10)
        & (r_ch >= g_ch * 0.95)
    )
    for idx, (column, row) in enumerate(coords):
        x0, y0, x1, y1 = _cell_bounds(width, height, columns, rows, column, row)
        cell_w, cell_h = x1 - x0, y1 - y0
        if cell_w < 16 or cell_h < 16:
            continue
        bx = max(2, min(5, int(round(cell_w * 0.08))))
        by = max(2, min(5, int(round(cell_h * 0.08))))
        cell_gold = is_gold[y0:y1, x0:x1]
        top_score = float(cell_gold[:by, :].any(axis=0).mean())
        bottom_score = float(cell_gold[-by:, :].any(axis=0).mean())
        left_score = float(cell_gold[:, :bx].any(axis=1).mean())
        right_score = float(cell_gold[:, -bx:].any(axis=1).mean())
        scores[idx] = max(top_score, bottom_score, left_score, right_score)
    return scores


def classify_grid(image, columns, rows, classifier, highlight_threshold=0.98, enable_border_boost=True):
    tiles = extract_grid_tiles(image, columns, rows, margin_ratio=0.08, order="row-major")
    probabilities = classifier.predict_proba([tile["image"] for tile in tiles])
    threshold = float(highlight_threshold)

    label_indices = np.argmax(probabilities, axis=1)
    hi_probs = probabilities[:, 0]
    empty_probs = probabilities[:, 2]

    decisions = []
    for idx in range(len(tiles)):
        lbl = int(label_indices[idx])
        p_hi = float(hi_probs[idx])
        if lbl == 0 and p_hi >= threshold:
            decisions.append("candidate")
        elif lbl == 0 or p_hi >= 0.5:
            decisions.append("uncertain")
        else:
            decisions.append("classified")

    boosted = np.zeros(len(tiles), dtype=bool)
    if enable_border_boost and len(tiles) >= 2:
        border_scores = compute_border_gold_scores(image, columns, rows, order="row-major")
        is_cand = np.asarray([d == "candidate" for d in decisions], dtype=bool)
        non_empty = empty_probs < 0.25
        baseline = float(np.median(border_scores))
        has_search_signal = bool(np.any(is_cand)) or (
            bool(np.any(border_scores[non_empty] >= 0.60)) and float(np.mean(border_scores >= 0.50)) < 0.70
        )
        if has_search_signal:
            gate = max(0.55, baseline + 0.35)
            for idx in range(len(tiles)):
                if not non_empty[idx] or is_cand[idx]:
                    continue
                lbl = int(label_indices[idx])
                p_hi = float(hi_probs[idx])
                if (lbl == 0 or p_hi >= 0.15) and float(border_scores[idx]) >= gate:
                    decisions[idx] = "candidate"
                    boosted[idx] = True

    cells, candidates, uncertain = [], [], []
    for idx, tile in enumerate(tiles):
        lbl = int(label_indices[idx])
        p_hi = float(hi_probs[idx])
        decision = decisions[idx]
        if boosted[idx]:
            label_name = "highlighted"
            probability = max(p_hi, threshold)
            effective_hi = max(p_hi, threshold)
        else:
            label_name = LABELS[lbl]
            probability = float(probabilities[idx, lbl])
            effective_hi = p_hi
        cell = {
            "column": tile["column"],
            "row": tile["row"],
            "label": label_name,
            "probability": round(probability, 6),
            "highlightProbability": round(effective_hi, 6),
            "calibrated": False,
            "borderBoosted": bool(boosted[idx]),
            "decision": decision,
            "modelVersion": classifier.version,
        }
        if decision == "candidate":
            candidates.append({**cell, "probability": effective_hi})
        elif decision == "uncertain":
            uncertain.append(cell)
        cells.append(cell)
    return cells, candidates, uncertain


def classify_empty_slots(image, columns, rows, classifier, empty_threshold=0.98, order="column-major"):
    tiles = extract_grid_tiles(image, columns, rows, margin_ratio=0.08, order=order)
    probabilities = classifier.predict_proba([tile["image"] for tile in tiles])
    if probabilities.shape != (columns * rows, len(LABELS)):
        raise RuntimeError("model-output-invalid")
    empty_slots = set()
    thr = float(empty_threshold)
    for idx, tile in enumerate(tiles):
        probs = probabilities[idx]
        if int(np.argmax(probs)) == 2 and float(probs[2]) >= thr:
            empty_slots.add((tile["column"], tile["row"]))
    return probabilities, empty_slots


def encode_png_data_url(bgr_image):
    if bgr_image is None or getattr(bgr_image, "ndim", 0) != 3 or bgr_image.shape[2] < 3:
        return ""
    height, width = int(bgr_image.shape[0]), int(bgr_image.shape[1])
    if height <= 0 or width <= 0:
        return ""
    rgb = np.ascontiguousarray(bgr_image[:, :, 2::-1], dtype=np.uint8)
    raw = np.empty((height, width * 3 + 1), dtype=np.uint8)
    raw[:, 0] = 0
    raw[:, 1:] = rgb.reshape(height, width * 3)
    compressed = zlib.compress(raw.tobytes(), level=6)

    def chunk(tag, payload):
        body = tag + payload
        return struct.pack(">I", len(payload)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png_bytes = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")
    return "data:image/png;base64," + base64.b64encode(png_bytes).decode("ascii")
