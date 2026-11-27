import base64
import os
import struct
import zlib

import numpy as np

LABELS = ("highlighted", "dimmed", "empty")
SCHEMA_VERSION = 2
INPUT_SIZE = 32
CNN_CHANNELS = 5
STATS_DIM = 16
DEFAULT_THRESHOLD = 0.95

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


def _resize_axis_area_or_linear(arr, target, axis):
    """Pure-NumPy anti-aliased area downsample (size >= target) or linear upsample (size < target)."""
    size = int(arr.shape[axis])
    if size == target:
        return arr
    if size == target * 2:
        shape = list(arr.shape)
        shape[axis:axis + 1] = [target, 2]
        return arr.reshape(shape).mean(axis=axis + 1)
    if size > target:
        edges = np.linspace(0, size, target + 1).astype(np.int32)
        out_shape = list(arr.shape)
        out_shape[axis] = target
        out = np.empty(out_shape, dtype=np.float32)
        for idx in range(target):
            s0 = int(edges[idx])
            s1 = max(s0 + 1, int(edges[idx + 1]))
            if axis == 0:
                out[idx] = arr[s0:s1].mean(axis=0)
            else:
                out[:, idx] = arr[:, s0:s1].mean(axis=1)
        return out
    coords = np.clip((np.arange(target, dtype=np.float32) + 0.5) * (size / float(target)) - 0.5, 0.0, size - 1.0)
    i0 = np.floor(coords).astype(np.int32)
    i1 = np.minimum(i0 + 1, size - 1)
    w = coords - i0
    if axis == 0:
        w = w[:, None, None]
        return arr[i0] * (1.0 - w) + arr[i1] * w
    w = w[None, :, None]
    return arr[:, i0] * (1.0 - w) + arr[:, i1] * w


def resize_tiles_32(bgr_batch):
    """Anti-aliased resize of arbitrary BGR tile batch to (N, 32, 32, 3) float32 in [0, 1]."""
    if isinstance(bgr_batch, np.ndarray) and bgr_batch.ndim == 4:
        count, height, width, _channels = bgr_batch.shape
        if count == 0:
            return np.zeros((0, INPUT_SIZE, INPUT_SIZE, 3), dtype=np.float32)
        if height == 64 and width == 64:
            return (
                bgr_batch[:, :, :, :3]
                .reshape(count, INPUT_SIZE, 2, INPUT_SIZE, 2, 3)
                .astype(np.float32)
                .mean(axis=(2, 4))
                * (1.0 / 255.0)
            )
        if height == INPUT_SIZE and width == INPUT_SIZE:
            return bgr_batch[:, :, :, :3].astype(np.float32) * (1.0 / 255.0)

    items = list(bgr_batch)
    count = len(items)
    if count == 0:
        return np.zeros((0, INPUT_SIZE, INPUT_SIZE, 3), dtype=np.float32)
    out = np.empty((count, INPUT_SIZE, INPUT_SIZE, 3), dtype=np.float32)
    for index, tile in enumerate(items):
        arr = np.asarray(tile)
        if arr.ndim != 3 or arr.shape[0] <= 0 or arr.shape[1] <= 0 or arr.shape[2] < 3:
            raise RuntimeError("grid-tile-empty")
        f = arr[:, :, :3].astype(np.float32)
        if f.shape[0] == 64 and f.shape[1] == 64:
            out[index] = f.reshape(INPUT_SIZE, 2, INPUT_SIZE, 2, 3).mean(axis=(1, 3))
        elif f.shape[0] == INPUT_SIZE and f.shape[1] == INPUT_SIZE:
            out[index] = f
        else:
            tmp = _resize_axis_area_or_linear(f, INPUT_SIZE, axis=0)
            out[index] = _resize_axis_area_or_linear(tmp, INPUT_SIZE, axis=1)
    out *= 1.0 / 255.0
    return out


def extract_hybrid_inputs(bgr32):
    """Build 5-channel CNN tensor (B,G,R,chroma,rel_sat) and 16-dim interior physical stats."""
    count = int(bgr32.shape[0])
    if count == 0:
        return (
            np.zeros((0, INPUT_SIZE, INPUT_SIZE, CNN_CHANNELS), dtype=np.float32),
            np.zeros((0, STATS_DIM), dtype=np.float32),
        )
    b, g, r = bgr32[..., 0], bgr32[..., 1], bgr32[..., 2]
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    chroma = cmax - cmin
    sat = chroma / (cmax + 0.08)
    luma = 0.114 * b + 0.587 * g + 0.299 * r

    x5 = np.stack([b, g, r, chroma, sat], axis=-1).astype(np.float32)

    # Trim 1px outer ring in stats to stay immune to neighbor border bleed-over
    ib, ig, ir = b[:, 1:-1, 1:-1], g[:, 1:-1, 1:-1], r[:, 1:-1, 1:-1]
    il = luma[:, 1:-1, 1:-1].reshape(count, -1)
    ic = chroma[:, 1:-1, 1:-1].reshape(count, -1)
    isat = sat[:, 1:-1, 1:-1].reshape(count, -1)
    icmax = cmax[:, 1:-1, 1:-1].reshape(count, -1)

    q90_idx = int(il.shape[1] * 0.90)
    l_q90 = np.partition(il, q90_idx, axis=1)[:, q90_idx:].mean(axis=1)
    c_q90 = np.partition(ic, q90_idx, axis=1)[:, q90_idx:].mean(axis=1)
    s_q90 = np.partition(isat, q90_idx, axis=1)[:, q90_idx:].mean(axis=1)

    blue_bg = ((ib - np.maximum(ir, ig)) > 0.035).mean(axis=(1, 2))
    red_bg = ((ir - np.maximum(ig, ib)) > 0.045).mean(axis=(1, 2))
    very_dark = (icmax < 0.055).mean(axis=1)
    vivid = ((ic > 0.12) & (isat > 0.28)).mean(axis=1)
    bright_vivid = ((il > 0.22) & (isat > 0.22)).mean(axis=1)

    gx = np.abs(np.diff(luma[:, 1:-1, 1:-1], axis=2)).mean(axis=(1, 2))
    gy = np.abs(np.diff(luma[:, 1:-1, 1:-1], axis=1)).mean(axis=(1, 2))

    stats = np.column_stack([
        ib.mean(axis=(1, 2)),
        ig.mean(axis=(1, 2)),
        ir.mean(axis=(1, 2)),
        il.mean(axis=1),
        ic.mean(axis=1),
        isat.mean(axis=1),
        l_q90,
        c_q90,
        s_q90,
        blue_bg,
        red_bg,
        very_dark,
        vivid,
        bright_vivid,
        gx,
        gy,
    ]).astype(np.float32)
    return x5, stats


def im2col_stride2(x):
    """3x3 stride-2 padding-1 im2col for NHWC tensor -> (N, H//2, W//2, 9*C)."""
    n, h, w, c = x.shape
    oh, ow = h // 2, w // 2
    xp = np.pad(x, ((0, 0), (1, 1), (1, 1), (0, 0)), mode="constant")
    cols = np.empty((n, oh, ow, 9 * c), dtype=np.float32)
    idx = 0
    for dy in range(3):
        for dx in range(3):
            cols[:, :, :, idx:idx + c] = xp[:, dy:dy + 2 * oh:2, dx:dx + 2 * ow:2, :]
            idx += c
    return cols


def _softmax(logits):
    shifted = logits - np.max(logits, axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / np.maximum(np.sum(exp, axis=1, keepdims=True), 1e-8)


class SlotHighlightClassifier:
    def __init__(self, version, mu, sd, w1, b1, w2, b2, w3, b3, w4, b4, w5, b5, temperature=1.0):
        self.version = str(version)
        self.mu = np.asarray(mu, dtype=np.float32)
        self.sd = np.maximum(np.asarray(sd, dtype=np.float32), 1e-6)
        self.W1 = np.asarray(w1, dtype=np.float32)
        self.b1 = np.asarray(b1, dtype=np.float32)
        self.W2 = np.asarray(w2, dtype=np.float32)
        self.b2 = np.asarray(b2, dtype=np.float32)
        self.W3 = np.asarray(w3, dtype=np.float32)
        self.b3 = np.asarray(b3, dtype=np.float32)
        self.W4 = np.asarray(w4, dtype=np.float32)
        self.b4 = np.asarray(b4, dtype=np.float32)
        self.W5 = np.asarray(w5, dtype=np.float32)
        self.b5 = np.asarray(b5, dtype=np.float32)
        self.temperature = max(0.1, float(temperature))

        c1 = self.W1.shape[1] if self.W1.ndim == 2 else 0
        c2 = self.W2.shape[1] if self.W2.ndim == 2 else 0
        c3 = self.W3.shape[1] if self.W3.ndim == 2 else 0
        if (
            self.mu.shape != (STATS_DIM,)
            or self.sd.shape != (STATS_DIM,)
            or self.W1.ndim != 2
            or self.W1.shape[0] != 9 * CNN_CHANNELS
            or self.b1.shape != (c1,)
            or self.W2.ndim != 2
            or self.W2.shape[0] != 9 * c1
            or self.b2.shape != (c2,)
            or self.W3.ndim != 2
            or self.W3.shape[0] != 9 * c2
            or self.b3.shape != (c3,)
            or self.W4.ndim != 2
            or self.W4.shape[0] != 2 * c3 + STATS_DIM
            or self.b4.shape != (self.W4.shape[1],)
            or self.W5.ndim != 2
            or self.W5.shape[0] != self.W4.shape[1]
            or self.W5.shape[1] != len(LABELS)
            or self.b5.shape != (len(LABELS),)
        ):
            raise RuntimeError("weights-contract-invalid")

    def predict_logits_32(self, bgr32, batch_size=576):
        count = int(bgr32.shape[0])
        if count == 0:
            return np.zeros((0, len(LABELS)), dtype=np.float32)
        outputs = []
        c1, c2, c3 = self.W1.shape[1], self.W2.shape[1], self.W3.shape[1]
        for start in range(0, count, batch_size):
            chunk = bgr32[start:start + batch_size]
            n = int(chunk.shape[0])
            x5, stats = extract_hybrid_inputs(chunk)
            col1 = im2col_stride2(x5)
            a1 = np.maximum(col1.reshape(-1, 9 * CNN_CHANNELS) @ self.W1 + self.b1, 0.0).reshape(n, 16, 16, c1)
            col2 = im2col_stride2(a1)
            a2 = np.maximum(col2.reshape(-1, 9 * c1) @ self.W2 + self.b2, 0.0).reshape(n, 8, 8, c2)
            col3 = im2col_stride2(a2)
            a3 = np.maximum(col3.reshape(-1, 9 * c2) @ self.W3 + self.b3, 0.0).reshape(n, 4, 4, c3)
            flat3 = a3.reshape(n, 16, c3)
            gap = flat3.mean(axis=1)
            gmp = flat3.max(axis=1)
            sn = (stats - self.mu) / self.sd
            feat = np.concatenate([gap, gmp, sn], axis=1)
            a4 = np.maximum(feat @ self.W4 + self.b4, 0.0)
            outputs.append(a4 @ self.W5 + self.b5)
        return np.vstack(outputs).astype(np.float32)

    def predict_proba_32(self, bgr32, batch_size=576):
        logits = self.predict_logits_32(bgr32, batch_size=batch_size)
        if len(logits) == 0:
            return np.zeros((0, len(LABELS)), dtype=np.float32)
        return _softmax(logits / self.temperature).astype(np.float32)

    def predict_proba(self, images):
        bgr32 = resize_tiles_32(images)
        if len(bgr32) == 0:
            return np.zeros((0, len(LABELS)), dtype=np.float32)
        return self.predict_proba_32(bgr32)


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
        required = (
            "schema_version", "version", "mu", "sd",
            "W1", "b1", "W2", "b2", "W3", "b3", "W4", "b4", "W5", "b5", "temperature",
        )
        if any(field not in data.files for field in required):
            raise RuntimeError("weights-contract-invalid")
        if int(np.asarray(data["schema_version"]).item()) != SCHEMA_VERSION:
            raise RuntimeError("weights-contract-invalid")
        classifier = SlotHighlightClassifier(
            version=str(np.asarray(data["version"]).item()),
            mu=data["mu"],
            sd=data["sd"],
            w1=data["W1"],
            b1=data["b1"],
            w2=data["W2"],
            b2=data["b2"],
            w3=data["W3"],
            b3=data["b3"],
            w4=data["W4"],
            b4=data["b4"],
            w5=data["W5"],
            b5=data["b5"],
            temperature=float(np.asarray(data["temperature"]).item()),
        )
    if len(_CLASSIFIER_CACHE) > 8:
        _CLASSIFIER_CACHE.clear()
    _CLASSIFIER_CACHE[cache_key] = classifier
    return classifier


def detect_gold_frames(image, columns, rows):
    """Detect PoE search highlight closed gold rectangles (1x1..2x4) along grid edges.

    Returns:
      frame_mask: (rows, columns) bool array of cells inside closed gold frames
      h_edges:    (rows + 1, columns) float32 sharp gold line scores along horizontal grid lines
      v_edges:    (rows, columns + 1) float32 sharp gold line scores along vertical grid lines
      rects:      list of (c0, r0, w, h, score, span_x, span_y)
    """
    rows = int(rows)
    columns = int(columns)
    empty_mask = np.zeros((rows, columns), dtype=bool)
    empty_h = np.zeros((rows + 1, columns), dtype=np.float32)
    empty_v = np.zeros((rows, columns + 1), dtype=np.float32)
    if image is None or getattr(image, "ndim", 0) != 3 or image.shape[2] < 3 or rows <= 0 or columns <= 0:
        return empty_mask, empty_h, empty_v, []

    img_h, img_w = int(image.shape[0]), int(image.shape[1])
    cell_w = img_w / float(columns)
    cell_h = img_h / float(rows)
    if cell_w < 14.0 or cell_h < 14.0:
        return empty_mask, empty_h, empty_v, []

    b = image[:, :, 0].astype(np.int16)
    g = image[:, :, 1].astype(np.int16)
    r = image[:, :, 2].astype(np.int16)

    # Sharp bright warm-gold PoE search border (handles red/blue background blending & gamma 0.75..1.30,
    # rejects dark brown UI outer frame R~115/G~80 and neutral white/blue highlights).
    is_gold = (
        (r >= 148)
        & (g >= 115)
        & (r >= g - 6)
        & ((r - b) >= 24)
        & ((r - b) * 10 >= r)
        & (g >= b - 8)
        & (b <= 228)
    )
    luma = (b + 4 * g + 2 * r) // 7  # int16-safe (max 1785), in 0..255

    pad_x = max(3, min(8, int(round(cell_w * 0.12))))
    pad_y = max(3, min(8, int(round(cell_h * 0.12))))
    seg_mx = max(2, int(round(cell_w * 0.14)))
    seg_my = max(2, int(round(cell_h * 0.14)))

    xs = [int(round(c * img_w / columns)) for c in range(columns + 1)]
    ys = [int(round(r_i * img_h / rows)) for r_i in range(rows + 1)]

    h_edges = np.zeros((rows + 1, columns), dtype=np.float32)
    h_pos = np.full((rows + 1, columns), -1.0, dtype=np.float32)
    for r_i in range(rows + 1):
        yc = ys[r_i]
        wy0, wy1 = max(0, yc - pad_y), min(img_h, yc + pad_y + 1)
        if wy1 <= wy0:
            continue
        for c_i in range(columns):
            sx0 = min(xs[c_i + 1] - 1, xs[c_i] + seg_mx)
            sx1 = max(xs[c_i] + 1, xs[c_i + 1] - seg_mx)
            if sx1 <= sx0:
                continue
            band_g = is_gold[wy0:wy1, sx0:sx1]
            row_cov = band_g.mean(axis=1)
            best_idx = int(np.argmax(row_cov))
            best_cov = float(row_cov[best_idx])
            n_rows = band_g.shape[0]
            if best_idx + 1 < n_rows:
                best_cov = max(best_cov, float((band_g[best_idx] | band_g[best_idx + 1]).mean()))
            if best_idx > 0:
                best_cov = max(best_cov, float((band_g[best_idx] | band_g[best_idx - 1]).mean()))
            if best_cov < 0.62:
                continue
            row_luma = luma[wy0:wy1, sx0:sx1].mean(axis=1)
            line_luma = float(row_luma[best_idx])
            if line_luma < 120.0:
                continue
            away = [float(row_luma[k]) for k in range(n_rows) if abs(k - best_idx) >= 2]
            if away and (line_luma - min(away)) < 38.0:
                continue
            h_edges[r_i, c_i] = best_cov
            h_pos[r_i, c_i] = float(wy0 + best_idx)

    v_edges = np.zeros((rows, columns + 1), dtype=np.float32)
    v_pos = np.full((rows, columns + 1), -1.0, dtype=np.float32)
    for r_i in range(rows):
        sy0 = min(ys[r_i + 1] - 1, ys[r_i] + seg_my)
        sy1 = max(ys[r_i] + 1, ys[r_i + 1] - seg_my)
        if sy1 <= sy0:
            continue
        for c_i in range(columns + 1):
            xc = xs[c_i]
            wx0, wx1 = max(0, xc - pad_x), min(img_w, xc + pad_x + 1)
            if wx1 <= wx0:
                continue
            band_g = is_gold[sy0:sy1, wx0:wx1]
            col_cov = band_g.mean(axis=0)
            best_idx = int(np.argmax(col_cov))
            best_cov = float(col_cov[best_idx])
            n_cols = band_g.shape[1]
            if best_idx + 1 < n_cols:
                best_cov = max(best_cov, float((band_g[:, best_idx] | band_g[:, best_idx + 1]).mean()))
            if best_idx > 0:
                best_cov = max(best_cov, float((band_g[:, best_idx] | band_g[:, best_idx - 1]).mean()))
            if best_cov < 0.62:
                continue
            col_luma = luma[sy0:sy1, wx0:wx1].mean(axis=0)
            line_luma = float(col_luma[best_idx])
            if line_luma < 120.0:
                continue
            away = [float(col_luma[k]) for k in range(n_cols) if abs(k - best_idx) >= 2]
            if away and (line_luma - min(away)) < 38.0:
                continue
            v_edges[r_i, c_i] = best_cov
            v_pos[r_i, c_i] = float(wx0 + best_idx)

    edge_thr = 0.62
    h_on = h_edges >= edge_thr
    v_on = v_edges >= edge_thr

    # Enumerate valid minimal PoE item rectangles (w in 1..2, h in 1..4)
    candidates = []
    for r0 in range(rows):
        for c0 in range(columns):
            for w in (1, 2):
                if c0 + w > columns:
                    continue
                top_ok = bool(np.all(h_on[r0, c0:c0 + w]))
                top_clipped = r0 == 0
                if not top_ok and not top_clipped:
                    continue
                for h in (1, 2, 3, 4):
                    if r0 + h > rows:
                        continue
                    bot_ok = bool(np.all(h_on[r0 + h, c0:c0 + w]))
                    bot_clipped = (r0 + h) == rows
                    lft_ok = bool(np.all(v_on[r0:r0 + h, c0]))
                    lft_clipped = c0 == 0
                    rgt_ok = bool(np.all(v_on[r0:r0 + h, c0 + w]))
                    rgt_clipped = (c0 + w) == columns
                    if not ((top_ok or top_clipped) and (bot_ok or bot_clipped)
                            and (lft_ok or lft_clipped) and (rgt_ok or rgt_clipped)):
                        continue
                    ok_sides = int(top_ok) + int(bot_ok) + int(lft_ok) + int(rgt_ok)
                    interior_ok_sides = (
                        int(top_ok and not top_clipped)
                        + int(bot_ok and not bot_clipped)
                        + int(lft_ok and not lft_clipped)
                        + int(rgt_ok and not rgt_clipped)
                    )
                    # Require at least 3 sides gold & at least 2 strictly interior sides
                    # (tolerates tight outer crop while preventing outer UI edge false hits).
                    if ok_sides < 3 or interior_ok_sides < 2:
                        continue
                    has_h_cut = any(np.all(h_on[r0 + k, c0:c0 + w]) for k in range(1, h))
                    has_v_cut = (w == 2) and np.all(v_on[r0:r0 + h, c0 + 1])
                    if has_h_cut or has_v_cut:
                        continue
                    segs = []
                    if top_ok:
                        segs.append(h_edges[r0, c0:c0 + w])
                    if bot_ok:
                        segs.append(h_edges[r0 + h, c0:c0 + w])
                    if lft_ok:
                        segs.append(v_edges[r0:r0 + h, c0])
                    if rgt_ok:
                        segs.append(v_edges[r0:r0 + h, c0 + w])
                    mean_score = float(np.concatenate(segs).mean())
                    span_x = (
                        float(v_pos[r0:r0 + h, c0 + w].mean() - v_pos[r0:r0 + h, c0].mean())
                        if (lft_ok and rgt_ok)
                        else -1.0
                    )
                    span_y = (
                        float(h_pos[r0 + h, c0:c0 + w].mean() - h_pos[r0, c0:c0 + w].mean())
                        if (top_ok and bot_ok)
                        else -1.0
                    )
                    candidates.append((4 - ok_sides, w * h, -mean_score, r0, c0, w, h, mean_score, span_x, span_y))

    candidates.sort()
    frame_mask = np.zeros((rows, columns), dtype=bool)
    rects = []
    for _miss, _area, _neg, r0, c0, w, h, score, span_x, span_y in candidates:
        if np.any(frame_mask[r0:r0 + h, c0:c0 + w]):
            continue
        frame_mask[r0:r0 + h, c0:c0 + w] = True
        rects.append((c0, r0, w, h, score, span_x, span_y))
    return frame_mask, h_edges, v_edges, rects


def compute_border_gold_scores(image, columns, rows, order="row-major"):
    """Per-cell sharp gold border score along the cell's 4 grid edges."""
    count = int(columns) * int(rows)
    scores = np.zeros(count, dtype=np.float32)
    if image is None or getattr(image, "ndim", 0) != 3 or image.shape[2] < 3 or count <= 0:
        return scores
    _mask, h_edges, v_edges, _rects = detect_gold_frames(image, columns, rows)
    cell_max = np.maximum(
        np.maximum(h_edges[:rows, :], h_edges[1:, :]),
        np.maximum(v_edges[:, :columns], v_edges[:, 1:]),
    )
    if order == "column-major":
        return cell_max.T.reshape(-1).astype(np.float32)
    return cell_max.reshape(-1).astype(np.float32)


def classify_grid(image, columns, rows, classifier, highlight_threshold=DEFAULT_THRESHOLD, enable_border_boost=True):
    columns, rows = int(columns), int(rows)
    tiles = extract_grid_tiles(image, columns, rows, margin_ratio=0.08, order="row-major")
    probabilities = classifier.predict_proba([tile["image"] for tile in tiles])
    threshold = float(highlight_threshold)

    label_indices = np.argmax(probabilities, axis=1)
    hi_probs = probabilities[:, 0]
    dim_probs = probabilities[:, 1]
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
    suppressed = np.zeros(len(tiles), dtype=bool)
    if enable_border_boost and len(tiles) >= 2:
        frame_mask, h_edges, v_edges, rects = detect_gold_frames(image, columns, rows)
        non_empty = (empty_probs < 0.25).reshape(rows, columns)
        cell_w = image.shape[1] / float(columns)
        cell_h = image.shape[0] / float(rows)

        # Surrounded-hole guard: reject a 1x1 strongly dimmed cell whose 4 edges come solely from
        # 4 surrounding highlighted neighbors (gold lines sit outside its bounds: span > cell + 1.5px).
        if rects and rows >= 3 and columns >= 3:
            for c0, r0, w, h, _score, span_x, span_y in rects:
                if w != 1 or h != 1 or r0 <= 0 or r0 >= rows - 1 or c0 <= 0 or c0 >= columns - 1:
                    continue
                if not (
                    frame_mask[r0 - 1, c0]
                    and frame_mask[r0 + 1, c0]
                    and frame_mask[r0, c0 - 1]
                    and frame_mask[r0, c0 + 1]
                ):
                    continue
                idx = r0 * columns + c0
                if (not non_empty[r0, c0]) or (
                    float(dim_probs[idx]) >= 0.85
                    and ((span_x > cell_w + 1.5) or (span_y > cell_h + 1.5))
                ):
                    frame_mask[r0, c0] = False

        valid_frame_mask = frame_mask & non_empty
        has_closed_frames = bool(np.any(valid_frame_mask))

        if has_closed_frames:
            # Dual-evidence search-filter mode: closed gold frames exist AND page has clear dimmed items.
            dim_count = int(np.sum((label_indices == 1) & (dim_probs >= 0.65)))
            non_empty_count = int(np.sum(non_empty))
            search_mode = dim_count >= 2 and (dim_count / max(1, non_empty_count)) >= 0.10

            # Precompute non-shared strong gold edges per cell (edges NOT bordering an existing gold frame)
            # to protect against neighbor bleed-over while tolerating rare partially-occluded highlight items.
            edge_thr = 0.62
            for r_i in range(rows):
                for c_i in range(columns):
                    idx = r_i * columns + c_i
                    if valid_frame_mask[r_i, c_i]:
                        if decisions[idx] != "candidate":
                            boosted[idx] = True
                        decisions[idx] = "candidate"
                    elif search_mode and decisions[idx] in ("candidate", "uncertain"):
                        # Count strong gold edges that do NOT touch a neighbor inside valid_frame_mask
                        free_gold = 0
                        if h_edges[r_i, c_i] >= edge_thr and (r_i == 0 or not valid_frame_mask[r_i - 1, c_i]):
                            free_gold += 1
                        if h_edges[r_i + 1, c_i] >= edge_thr and (r_i + 1 == rows or not valid_frame_mask[r_i + 1, c_i]):
                            free_gold += 1
                        if v_edges[r_i, c_i] >= edge_thr and (c_i == 0 or not valid_frame_mask[r_i, c_i - 1]):
                            free_gold += 1
                        if v_edges[r_i, c_i + 1] >= edge_thr and (c_i + 1 == columns or not valid_frame_mask[r_i, c_i + 1]):
                            free_gold += 1
                        if free_gold >= 2 and float(hi_probs[idx]) >= 0.85:
                            if decisions[idx] != "candidate":
                                boosted[idx] = True
                            decisions[idx] = "candidate"
                        else:
                            # In active search mode, an item with no closed gold frame and <2 free gold edges
                            # is a bright/glowing dimmed item -> safely suppress to prevent false pickup!
                            decisions[idx] = "classified"
                            suppressed[idx] = True
        else:
            # Fallback for single-row / partial-border scenarios (no full closed frames):
            # Only boost non-empty cells with sharp gold edges NOT shared with an existing candidate.
            edge_thr = 0.62
            is_cand_grid = np.asarray([d == "candidate" for d in decisions], dtype=bool).reshape(rows, columns)
            cell_max = np.maximum(
                np.maximum(h_edges[:rows, :], h_edges[1:, :]),
                np.maximum(v_edges[:, :columns], v_edges[:, 1:]),
            )
            has_signal = bool(np.any(is_cand_grid)) or (
                bool(np.any(cell_max[non_empty] >= edge_thr))
                and float(np.mean(cell_max >= edge_thr)) < 0.70
            )
            if has_signal:
                for r_i in range(rows):
                    for c_i in range(columns):
                        idx = r_i * columns + c_i
                        if not non_empty[r_i, c_i] or is_cand_grid[r_i, c_i]:
                            continue
                        lbl = int(label_indices[idx])
                        p_hi = float(hi_probs[idx])
                        if not (lbl == 0 or p_hi >= 0.15):
                            continue
                        free_gold = 0
                        if h_edges[r_i, c_i] >= edge_thr and (r_i == 0 or not is_cand_grid[r_i - 1, c_i]):
                            free_gold += 1
                        if h_edges[r_i + 1, c_i] >= edge_thr and (r_i + 1 == rows or not is_cand_grid[r_i + 1, c_i]):
                            free_gold += 1
                        if v_edges[r_i, c_i] >= edge_thr and (c_i == 0 or not is_cand_grid[r_i, c_i - 1]):
                            free_gold += 1
                        if v_edges[r_i, c_i + 1] >= edge_thr and (c_i + 1 == columns or not is_cand_grid[r_i, c_i + 1]):
                            free_gold += 1
                        required_edges = 1 if (rows == 1 or columns == 1) else 2
                        if free_gold >= required_edges:
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
        elif suppressed[idx]:
            label_name = "dimmed"
            probability = float(dim_probs[idx]) if float(dim_probs[idx]) >= 0.5 else round(1.0 - p_hi, 6)
            effective_hi = 0.0
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
