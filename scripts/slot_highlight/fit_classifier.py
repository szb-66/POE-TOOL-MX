"""纯 NumPy CPU 离线训练轻量混合 CNN 权重，并输出全域独立隔离与抗亮度偏移评测报告。"""
import argparse
import json
from pathlib import Path
import sys
import time

import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = PROJECT_ROOT / "src" / "assets" / "scripts"
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from slot_highlight_classifier import (  # noqa: E402
    CNN_CHANNELS,
    DEFAULT_THRESHOLD,
    INPUT_SIZE,
    LABELS,
    SCHEMA_VERSION,
    STATS_DIM,
    SlotHighlightClassifier,
    extract_hybrid_inputs,
    im2col_stride2,
    resize_tiles_32,
)


def _col2im_stride2(dcols, h, w, c):
    n, oh, ow, _ = dcols.shape
    dxp = np.zeros((n, h + 2, w + 2, c), dtype=np.float32)
    idx = 0
    for dy in range(3):
        for dx in range(3):
            dxp[:, dy:dy + 2 * oh:2, dx:dx + 2 * ow:2, :] += dcols[:, :, :, idx:idx + c]
            idx += c
    return dxp[:, 1:h + 1, 1:w + 1, :]


def _augment_batch(bgr32, labels, rng, mild=False):
    out = bgr32.copy()
    n = len(out)

    flip_idx = np.where(rng.random(n) < 0.5)[0]
    if len(flip_idx):
        out[flip_idx] = out[flip_idx, :, ::-1, :]

    prob_g = 0.40 if mild else 0.75
    g_lo, g_hi = (0.88, 1.14) if mild else (0.72, 1.32)
    aug_idx = np.where(rng.random(n) < prob_g)[0]
    if len(aug_idx):
        gammas = rng.uniform(g_lo, g_hi, size=(len(aug_idx), 1, 1, 1)).astype(np.float32)
        gains = rng.uniform(0.94, 1.06, size=(len(aug_idx), 1, 1, 1)).astype(np.float32)
        out[aug_idx] = np.clip((np.maximum(out[aug_idx], 1e-6) ** gammas) * gains, 0.0, 1.0)

    shift_prob = 0.25 if mild else 0.45
    for i in np.where(rng.random(n) < shift_prob)[0]:
        dy = int(rng.integers(-2, 3))
        dx = int(rng.integers(-2, 3))
        if dy != 0 or dx != 0:
            out[i] = np.roll(out[i], shift=(dy, dx), axis=(0, 1))

    bleed_prob = 0.08 if mild else 0.16
    for i in np.where((labels != 0) & (rng.random(n) < bleed_prob))[0]:
        side = int(rng.integers(0, 4))
        w_px = int(rng.integers(1, 3))
        col = np.array([
            rng.uniform(0.35, 0.68),
            rng.uniform(0.58, 0.84),
            rng.uniform(0.75, 0.96),
        ], dtype=np.float32)
        if side == 0:
            out[i, :w_px, :, :] = col
        elif side == 1:
            out[i, -w_px:, :, :] = col
        elif side == 2:
            out[i, :, :w_px, :] = col
        else:
            out[i, :, -w_px:, :] = col
    return out


def _evaluate(classifier, bgr32, labels, sessions, scenes, threshold):
    probs = classifier.predict_proba_32(bgr32)
    preds = np.argmax(probs, axis=1)
    pred_hi = (preds == 0) & (probs[:, 0] >= threshold)
    actual_hi = labels == 0
    tp = int(np.sum(pred_hi & actual_hi))
    fp = int(np.sum(pred_hi & ~actual_hi))
    fn = int(np.sum(~pred_hi & actual_hi))
    precision = tp / max(1, tp + fp)
    recall = tp / max(1, tp + fn)
    acc = float((preds == labels).mean()) if len(labels) else 0.0

    pred_emp = (preds == 2) & (probs[:, 2] >= 0.98)
    actual_emp = labels == 2
    emp_fp = int(np.sum(pred_emp & ~actual_emp))
    emp_fn = int(np.sum(~pred_emp & actual_emp))

    zero_scene_clicks = 0
    zero_scene_count = 0
    for scene_id in set(scenes.tolist()):
        m = scenes == scene_id
        if not np.any(actual_hi[m]):
            zero_scene_count += 1
            zero_scene_clicks += int(np.sum(pred_hi[m]))
    return {
        "samples": int(len(labels)),
        "accuracy": round(acc, 6),
        "highlightedCells": int(np.sum(actual_hi)),
        "negativeCells": int(np.sum(~actual_hi)),
        "tp": tp,
        "falsePositives": fp,
        "falseNegatives": fn,
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "emptyFalsePositives": emp_fp,
        "emptyFalseNegatives": emp_fn,
        "zeroHighlightScenes": zero_scene_count,
        "zeroHighlightClicks": zero_scene_clicks,
        "sessions": sorted(set(sessions.tolist())),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default=str(PROJECT_ROOT / "artifacts" / "junfeng" / "workbench-combined.npz"))
    parser.add_argument("--output-dir", default=str(PROJECT_ROOT / "src" / "assets" / "models" / "slot-highlight"))
    parser.add_argument("--version", default="slot-highlight-v2")
    parser.add_argument("--steps", type=int, default=2200)
    parser.add_argument("--batch-size", type=int, default=256)
    parser.add_argument("--seed", type=int, default=20260810)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    args = parser.parse_args()

    t0 = time.perf_counter()
    data = np.load(args.dataset, allow_pickle=False)
    images = data["images"]
    labels = data["labels"].astype(np.int64)
    sessions = data["sessions"]
    scenes = data["scenes"] if "scenes" in data.files else sessions
    domains = data["domains"] if "domains" in data.files else np.asarray(["junfeng"] * len(labels))
    partitions = data["partitions"] if "partitions" in data.files else np.asarray(["legacy"] * len(labels))
    audited = data["audited"] if "audited" in data.files else np.zeros(len(labels), dtype=np.bool_)

    val_sessions = set(sessions[(partitions == "validation") & audited].tolist())
    test_sessions = set(sessions[(partitions == "test") & audited].tolist())
    train_mask = np.asarray([
        (s not in val_sessions) and (s not in test_sessions) and (p not in ("validation", "test"))
        for s, p in zip(sessions, partitions)
    ])
    val_mask = np.asarray([s in val_sessions for s in sessions])
    test_mask = np.asarray([s in test_sessions for s in sessions])
    unseen_mask = val_mask | test_mask

    bgr32 = resize_tiles_32(images)
    x_train = bgr32[train_mask]
    y_train = labels[train_mask]
    d_train = domains[train_mask]
    a_train = audited[train_mask]

    _, tr_stats = extract_hybrid_inputs(x_train)
    mu = tr_stats.mean(axis=0).astype(np.float32)
    sd = np.maximum(tr_stats.std(axis=0), 1e-6).astype(np.float32)

    group_counts = {}
    for dom, lbl in zip(d_train.tolist(), y_train.tolist()):
        dom_key = "junfeng" if str(dom).startswith("junfeng") else str(dom)
        key = (dom_key, int(lbl))
        group_counts[key] = group_counts.get(key, 0) + 1
    sample_probs = np.asarray([
        (2.5 if aud else 1.0) / group_counts[("junfeng" if str(dom).startswith("junfeng") else str(dom), int(lbl))]
        for dom, lbl, aud in zip(d_train.tolist(), y_train.tolist(), a_train.tolist())
    ], dtype=np.float64)
    sample_probs /= sample_probs.sum()

    rng = np.random.default_rng(args.seed)
    c1, c2, c3, h4, classes = 16, 32, 48, 48, len(LABELS)
    w1 = rng.normal(0.0, np.sqrt(2.0 / (9 * CNN_CHANNELS)), (9 * CNN_CHANNELS, c1)).astype(np.float32)
    b1 = np.zeros(c1, dtype=np.float32)
    w2 = rng.normal(0.0, np.sqrt(2.0 / (9 * c1)), (9 * c1, c2)).astype(np.float32)
    b2 = np.zeros(c2, dtype=np.float32)
    w3 = rng.normal(0.0, np.sqrt(2.0 / (9 * c2)), (9 * c2, c3)).astype(np.float32)
    b3 = np.zeros(c3, dtype=np.float32)
    w4 = rng.normal(0.0, np.sqrt(2.0 / (2 * c3 + STATS_DIM)), (2 * c3 + STATS_DIM, h4)).astype(np.float32)
    b4 = np.zeros(h4, dtype=np.float32)
    w5 = rng.normal(0.0, np.sqrt(2.0 / h4), (h4, classes)).astype(np.float32)
    b5 = np.zeros(classes, dtype=np.float32)

    params = [w1, b1, w2, b2, w3, b3, w4, b4, w5, b5]
    m_adam = [np.zeros_like(p) for p in params]
    v_adam = [np.zeros_like(p) for p in params]

    bs = int(args.batch_size)
    row_idx = np.arange(bs)
    wd = 1e-4

    for step in range(1, args.steps + 1):
        mild = step > int(args.steps * 0.78)
        idx = rng.choice(len(y_train), size=bs, replace=True, p=sample_probs)
        xb = _augment_batch(x_train[idx], y_train[idx], rng, mild=mild)
        yb = y_train[idx]
        x5, st = extract_hybrid_inputs(xb)

        col1 = im2col_stride2(x5)
        z1 = col1.reshape(-1, 9 * CNN_CHANNELS) @ w1 + b1
        a1 = np.maximum(z1, 0.0).reshape(bs, 16, 16, c1)

        col2 = im2col_stride2(a1)
        z2 = col2.reshape(-1, 9 * c1) @ w2 + b2
        a2 = np.maximum(z2, 0.0).reshape(bs, 8, 8, c2)

        col3 = im2col_stride2(a2)
        z3 = col3.reshape(-1, 9 * c2) @ w3 + b3
        a3 = np.maximum(z3, 0.0).reshape(bs, 4, 4, c3)

        flat3 = a3.reshape(bs, 16, c3)
        gap = flat3.mean(axis=1)
        gmp_idx = np.argmax(flat3, axis=1)
        gmp = np.take_along_axis(flat3, gmp_idx[:, None, :], axis=1)[:, 0, :]
        sn = (st - mu) / sd
        feat = np.concatenate([gap, gmp, sn], axis=1)

        z4 = feat @ w4 + b4
        a4 = np.maximum(z4, 0.0)
        logits = a4 @ w5 + b5
        logits_s = logits - logits.max(axis=1, keepdims=True)
        probs = np.exp(logits_s)
        probs /= np.maximum(probs.sum(axis=1, keepdims=True), 1e-8)

        dlogits = probs.copy()
        dlogits[row_idx, yb] -= 1.0
        # Slight conservative weight on negative samples to prevent false-positive highlighted clicks
        class_weight = np.where(yb == 0, 1.0, 1.2).astype(np.float32)
        dlogits *= (class_weight / bs)[:, None]

        dw5 = a4.T @ dlogits + wd * w5
        db5 = dlogits.sum(axis=0)
        da4 = dlogits @ w5.T
        dz4 = da4 * (z4 > 0.0)

        dw4 = feat.T @ dz4 + wd * w4
        db4 = dz4.sum(axis=0)
        dfeat = dz4 @ w4.T

        dgap = dfeat[:, :c3]
        dgmp = dfeat[:, c3:2 * c3]
        dflat3 = np.broadcast_to(dgap[:, None, :] * (1.0 / 16.0), (bs, 16, c3)).copy()
        np.put_along_axis(
            dflat3,
            gmp_idx[:, None, :],
            np.take_along_axis(dflat3, gmp_idx[:, None, :], axis=1) + dgmp[:, None, :],
            axis=1,
        )
        dz3 = dflat3.reshape(-1, c3) * (z3 > 0.0)
        dw3 = col3.reshape(-1, 9 * c2).T @ dz3 + wd * w3
        db3 = dz3.sum(axis=0)
        dc3 = (dz3 @ w3.T).reshape(bs, 4, 4, 9 * c2)
        da2 = _col2im_stride2(dc3, 8, 8, c2)

        dz2 = da2.reshape(-1, c2) * (z2 > 0.0)
        dw2 = col2.reshape(-1, 9 * c1).T @ dz2 + wd * w2
        db2 = dz2.sum(axis=0)
        dc2 = (dz2 @ w2.T).reshape(bs, 8, 8, 9 * c1)
        da1 = _col2im_stride2(dc2, 16, 16, c1)

        dz1 = da1.reshape(-1, c1) * (z1 > 0.0)
        dw1 = col1.reshape(-1, 9 * CNN_CHANNELS).T @ dz1 + wd * w1
        db1 = dz1.sum(axis=0)

        lr = 0.00025 + 0.5 * (0.005 - 0.00025) * (1.0 + np.cos(np.pi * step / args.steps))
        for p_i, (param, grad) in enumerate(zip(params, (dw1, db1, dw2, db2, dw3, db3, dw4, db4, dw5, db5))):
            m_adam[p_i] = 0.9 * m_adam[p_i] + 0.1 * grad
            v_adam[p_i] = 0.999 * v_adam[p_i] + 0.001 * (grad * grad)
            m_hat = m_adam[p_i] / (1.0 - 0.9 ** step)
            v_hat = v_adam[p_i] / (1.0 - 0.999 ** step)
            param -= lr * m_hat / (np.sqrt(v_hat) + 1e-8)

        if step % 550 == 0:
            loss = float(-np.log(np.maximum(probs[row_idx, yb], 1e-8)).mean())
            print(f"[fit] step={step}/{args.steps} elapsed={time.perf_counter()-t0:.1f}s loss={loss:.4f}", file=sys.stderr, flush=True)

    # Quantize conv/linear weights to float16 for compact distribution (<50KB), evaluate quantized model directly!
    w1_q, w2_q, w3_q, w4_q, w5_q = [w.astype(np.float16) for w in (w1, w2, w3, w4, w5)]
    classifier = SlotHighlightClassifier(
        args.version, mu, sd, w1_q, b1, w2_q, b2, w3_q, b3, w4_q, b4, w5_q, b5, temperature=1.0
    )

    # Temperature calibration on validation set only (strict zero FP preference)
    temperature = 1.0
    if np.any(val_mask):
        val_logits = classifier.predict_logits_32(bgr32[val_mask])
        y_val = labels[val_mask]
        best_t, best_nll = 1.0, 1e9
        for t_cand in np.linspace(0.50, 1.50, 41):
            ls = val_logits / float(t_cand)
            ls = ls - ls.max(axis=1, keepdims=True)
            p = np.exp(ls)
            p /= np.maximum(p.sum(axis=1, keepdims=True), 1e-8)
            fp_val = int(np.sum((np.argmax(p, axis=1) == 0) & (p[:, 0] >= args.threshold) & (y_val != 0)))
            if fp_val > 0:
                continue
            nll = float(-np.log(np.maximum(p[np.arange(len(y_val)), y_val], 1e-8)).mean())
            if nll < best_nll:
                best_nll, best_t = nll, float(t_cand)
        temperature = round(best_t, 4)
        classifier.temperature = temperature

    gamma_reports = {}
    if np.any(unseen_mask):
        x_unseen = bgr32[unseen_mask]
        y_unseen = labels[unseen_mask]
        s_unseen = sessions[unseen_mask]
        sc_unseen = scenes[unseen_mask]
        for gamma in (0.75, 0.85, 1.0, 1.15, 1.30):
            shifted = np.clip(np.maximum(x_unseen, 1e-6) ** gamma, 0.0, 1.0).astype(np.float32)
            rep = _evaluate(classifier, shifted, y_unseen, s_unseen, sc_unseen, args.threshold)
            gamma_reports[f"{gamma:.2f}"] = {
                "accuracy": rep["accuracy"],
                "falsePositives": rep["falsePositives"],
                "falseNegatives": rep["falseNegatives"],
                "precision": rep["precision"],
                "recall": rep["recall"],
                "emptyFalsePositives": rep["emptyFalsePositives"],
                "emptyFalseNegatives": rep["emptyFalseNegatives"],
            }

    all_rep = _evaluate(classifier, bgr32, labels, sessions, scenes, args.threshold)
    audited_rep = _evaluate(classifier, bgr32[audited], labels[audited], sessions[audited], scenes[audited], args.threshold) if np.any(audited) else all_rep
    reports = {
        "validation": _evaluate(classifier, bgr32[val_mask], labels[val_mask], sessions[val_mask], scenes[val_mask], args.threshold) if np.any(val_mask) else None,
        "test": _evaluate(classifier, bgr32[test_mask], labels[test_mask], sessions[test_mask], scenes[test_mask], args.threshold) if np.any(test_mask) else None,
        "unseenAll": _evaluate(classifier, bgr32[unseen_mask], labels[unseen_mask], sessions[unseen_mask], scenes[unseen_mask], args.threshold) if np.any(unseen_mask) else None,
        "zeroHighlightAudited": {
            "scenes": audited_rep["zeroHighlightScenes"],
            "clicks": audited_rep["zeroHighlightClicks"],
        },
        "zeroHighlightAll": {
            "scenes": all_rep["zeroHighlightScenes"],
            "clicks": all_rep["zeroHighlightClicks"],
        },
        "gammaRobustness": gamma_reports,
        "domains": {
            dom: _evaluate(classifier, bgr32[domains == dom], labels[domains == dom], sessions[domains == dom], scenes[domains == dom], args.threshold)
            for dom in sorted(set(domains.tolist()))
        },
    }

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    weights_path = out_dir / "weights.npz"
    np.savez_compressed(
        weights_path,
        schema_version=np.asarray(SCHEMA_VERSION, dtype=np.int32),
        version=np.asarray(args.version),
        temperature=np.asarray(temperature, dtype=np.float32),
        mu=mu,
        sd=sd,
        W1=w1_q,
        b1=b1,
        W2=w2_q,
        b2=b2,
        W3=w3_q,
        b3=b3,
        W4=w4_q,
        b4=b4,
        W5=w5_q,
        b5=b5,
    )
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "modelVersion": args.version,
        "architecture": "hybrid-cnn-32x32-5ch-gap-gmp-stats16",
        "inputSize": INPUT_SIZE,
        "cnnChannels": CNN_CHANNELS,
        "statsDim": STATS_DIM,
        "classes": list(LABELS),
        "defaultThreshold": args.threshold,
        "temperature": temperature,
        "weightsFile": "weights.npz",
        "elapsedSeconds": round(time.perf_counter() - t0, 3),
        "benchmark": reports,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), "utf-8")
    print(json.dumps({
        "weightsPath": str(weights_path),
        "weightsBytes": weights_path.stat().st_size,
        **manifest,
    }, ensure_ascii=False, indent=2))

    test_rep = reports.get("test")
    val_rep = reports.get("validation")
    if (
        not test_rep
        or test_rep["falsePositives"] != 0
        or test_rep["recall"] < 0.99
        or test_rep["zeroHighlightClicks"] != 0
        or (val_rep and val_rep["falsePositives"] != 0)
        or reports["zeroHighlightAudited"]["clicks"] != 0
        or gamma_reports.get("0.85", {}).get("falsePositives", 1) != 0
        or gamma_reports.get("1.15", {}).get("falsePositives", 1) != 0
    ):
        raise SystemExit(2)


if __name__ == "__main__":
    main()
