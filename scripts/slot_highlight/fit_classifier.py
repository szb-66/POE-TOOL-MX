"""纯 NumPy CPU 离线拟合轻量双层 MLP 权重，并输出独立隔离评测报告。"""
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
    FEATURE_DIM,
    LABELS,
    SCHEMA_VERSION,
    SlotHighlightClassifier,
    extract_fast_features,
)


def _evaluate(classifier, features, labels, sessions, scenes, threshold):
    normalized = (features - classifier.mu) / classifier.sd
    a1 = np.maximum(normalized @ classifier.W1 + classifier.b1, 0.0)
    a2 = np.maximum(a1 @ classifier.W2 + classifier.b2, 0.0)
    logits = a2 @ classifier.W3 + classifier.b3
    logits -= logits.max(axis=1, keepdims=True)
    probs = np.exp(logits)
    probs /= np.maximum(probs.sum(axis=1, keepdims=True), 1e-8)

    pred_hi = (np.argmax(probs, axis=1) == 0) & (probs[:, 0] >= threshold)
    actual_hi = labels == 0
    tp = int(np.sum(pred_hi & actual_hi))
    fp = int(np.sum(pred_hi & ~actual_hi))
    fn = int(np.sum(~pred_hi & actual_hi))
    precision = tp / max(1, tp + fp)
    recall = tp / max(1, tp + fn)
    acc = float((np.argmax(probs, axis=1) == labels).mean())

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
        "zeroHighlightScenes": zero_scene_count,
        "zeroHighlightClicks": zero_scene_clicks,
        "sessions": sorted(set(sessions.tolist())),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default=str(PROJECT_ROOT / "artifacts" / "junfeng" / "workbench-combined.npz"))
    parser.add_argument("--output-dir", default=str(PROJECT_ROOT / "src" / "assets" / "models" / "slot-highlight"))
    parser.add_argument("--version", default="slot-highlight-v1")
    parser.add_argument("--steps", type=int, default=700)
    parser.add_argument("--seed", type=int, default=20260810)
    parser.add_argument("--threshold", type=float, default=0.98)
    args = parser.parse_args()

    t0 = time.perf_counter()
    data = np.load(args.dataset)
    images = data["images"]
    labels = data["labels"].astype(np.int64)
    sessions = data["sessions"]
    scenes = data["scenes"] if "scenes" in data.files else sessions
    domains = data["domains"] if "domains" in data.files else np.asarray(["junfeng"] * len(labels))
    partitions = data["partitions"] if "partitions" in data.files else np.asarray(["legacy"] * len(labels))
    audited = data["audited"] if "audited" in data.files else np.zeros(len(labels), dtype=np.bool_)

    junfeng_mask = np.asarray([str(d).startswith("junfeng") for d in domains])
    val_sessions = set(sessions[junfeng_mask & (partitions == "validation") & audited].tolist())
    test_sessions = set(sessions[junfeng_mask & (partitions == "test") & audited].tolist())
    train_mask = np.asarray([
        (s not in val_sessions) and (s not in test_sessions) and (p not in ("validation", "test"))
        for s, p in zip(sessions, partitions)
    ])
    val_mask = np.asarray([s in val_sessions for s in sessions])
    test_mask = np.asarray([s in test_sessions for s in sessions])

    features = extract_fast_features(images)
    mu = features[train_mask].mean(axis=0).astype(np.float32)
    sd = np.maximum(features[train_mask].std(axis=0), 1e-6).astype(np.float32)
    normalized = ((features - mu) / sd).astype(np.float32)

    rng = np.random.default_rng(args.seed)
    h1, h2, classes = 64, 32, len(LABELS)
    w1 = rng.normal(0.0, np.sqrt(2.0 / FEATURE_DIM), (FEATURE_DIM, h1)).astype(np.float32)
    b1 = np.zeros(h1, dtype=np.float32)
    w2 = rng.normal(0.0, np.sqrt(2.0 / h1), (h1, h2)).astype(np.float32)
    b2 = np.zeros(h2, dtype=np.float32)
    w3 = rng.normal(0.0, np.sqrt(2.0 / h2), (h2, classes)).astype(np.float32)
    b3 = np.zeros(classes, dtype=np.float32)

    x_train = normalized[train_mask]
    y_train = labels[train_mask]
    d_train = domains[train_mask]

    # Balance across (domain_group, class) while keeping a slight conservative penalty on false positives
    group_counts = {}
    for dom, lbl in zip(d_train.tolist(), y_train.tolist()):
        dom_key = "junfeng" if str(dom).startswith("junfeng") else str(dom)
        key = (dom_key, int(lbl))
        group_counts[key] = group_counts.get(key, 0) + 1
    sample_weights = np.asarray([
        1.0 / group_counts[("junfeng" if str(dom).startswith("junfeng") else str(dom), int(lbl))]
        for dom, lbl in zip(d_train.tolist(), y_train.tolist())
    ], dtype=np.float32)
    sample_weights /= sample_weights.sum()

    params = [w1, b1, w2, b2, w3, b3]
    m_adam = [np.zeros_like(p) for p in params]
    v_adam = [np.zeros_like(p) for p in params]
    row_idx = np.arange(len(y_train))

    for step in range(1, args.steps + 1):
        z1 = x_train @ w1 + b1
        a1 = np.maximum(z1, 0.0)
        z2 = a1 @ w2 + b2
        a2 = np.maximum(z2, 0.0)
        logits = a2 @ w3 + b3
        logits -= logits.max(axis=1, keepdims=True)
        probs = np.exp(logits)
        probs /= np.maximum(probs.sum(axis=1, keepdims=True), 1e-8)

        dlogits = probs.copy()
        dlogits[row_idx, y_train] -= 1.0
        dlogits *= sample_weights[:, None]

        dw3 = a2.T @ dlogits + 1e-4 * w3
        db3 = dlogits.sum(axis=0)
        da2 = dlogits @ w3.T
        da2[z2 <= 0.0] = 0.0
        dw2 = a1.T @ da2 + 1e-4 * w2
        db2 = da2.sum(axis=0)
        da1 = da2 @ w2.T
        da1[z1 <= 0.0] = 0.0
        dw1 = x_train.T @ da1 + 1e-4 * w1
        db1 = da1.sum(axis=0)

        lr = 0.01 if step <= int(args.steps * 0.7) else 0.003
        for idx, (param, grad) in enumerate(zip(params, (dw1, db1, dw2, db2, dw3, db3))):
            m_adam[idx] = 0.9 * m_adam[idx] + 0.1 * grad
            v_adam[idx] = 0.999 * v_adam[idx] + 0.001 * (grad * grad)
            m_hat = m_adam[idx] / (1.0 - 0.9 ** step)
            v_hat = v_adam[idx] / (1.0 - 0.999 ** step)
            param -= lr * m_hat / (np.sqrt(v_hat) + 1e-8)

    classifier = SlotHighlightClassifier(args.version, mu, sd, w1, b1, w2, b2, w3, b3)
    reports = {
        "validation": _evaluate(classifier, features[val_mask], labels[val_mask], sessions[val_mask], scenes[val_mask], args.threshold) if np.any(val_mask) else None,
        "test": _evaluate(classifier, features[test_mask], labels[test_mask], sessions[test_mask], scenes[test_mask], args.threshold) if np.any(test_mask) else None,
        "domains": {
            dom: _evaluate(classifier, features[domains == dom], labels[domains == dom], sessions[domains == dom], scenes[domains == dom], args.threshold)
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
        mu=mu,
        sd=sd,
        W1=w1,
        b1=b1,
        W2=w2,
        b2=b2,
        W3=w3,
        b3=b3,
    )
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "modelVersion": args.version,
        "classes": list(LABELS),
        "featureDim": FEATURE_DIM,
        "defaultThreshold": args.threshold,
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
    if not test_rep or test_rep["falsePositives"] != 0 or test_rep["recall"] < 0.99 or test_rep["zeroHighlightClicks"] != 0:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
