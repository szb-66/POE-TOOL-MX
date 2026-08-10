"""将用户在检测预览中纠正的原始图块导出为训练数据集。"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

LABELS = ("highlighted", "dimmed", "empty")


def read_image(path):
    try:
        return cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_COLOR)
    except OSError:
        return None


def legacy_session(sample):
    captured = str(sample.get("capturedAt", ""))
    try:
        day = datetime.fromisoformat(captured.replace("Z", "+00:00")).astimezone(timezone.utc).strftime("%Y%m%d")
    except ValueError:
        day = "unknown"
    return f"legacy-{day}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--repeat", type=int, default=8)
    args = parser.parse_args()
    if args.repeat < 1:
        raise SystemExit("--repeat 必须大于等于 1")
    root = Path(args.root).resolve()
    sources = []
    correction_index = root / "index.json"
    training_index = root / "training-index.json"
    if correction_index.exists():
        sources.extend((sample, args.repeat, str(sample.get("domain") or "junfeng"), "train", True)
                       for sample in json.loads(correction_index.read_text("utf-8")).get("samples", []))
    if training_index.exists():
        sources.extend((sample, 1, str(sample.get("domain") or "junfeng-training"),
                        str(sample.get("partition") or "train"), bool(sample.get("audited")))
                       for sample in json.loads(training_index.read_text("utf-8")).get("samples", []))
    images, labels, sessions, scenes, domains, coordinates, partitions, audited = [], [], [], [], [], [], [], []
    skipped = []
    raw_samples = 0
    for sample, repeat, domain, partition, is_audited in sources:
        label = str(sample.get("label", ""))
        path = (root / str(sample.get("relativePath", ""))).resolve()
        if label not in LABELS or root not in path.parents:
            skipped.append(str(sample.get("id", "")))
            continue
        image = read_image(path)
        if image is None or not image.size:
            skipped.append(str(sample.get("id", "")))
            continue
        preview_id = str(sample.get("previewId") or legacy_session(sample))
        session = f"{domain}:{preview_id}"
        normalized = cv2.resize(image, (64, 64), interpolation=cv2.INTER_AREA)
        raw_samples += 1
        for _ in range(repeat):
            images.append(normalized)
            labels.append(LABELS.index(label))
            sessions.append(session)
            scenes.append(session)
            domains.append(domain)
            coordinates.append((int(sample.get("column", -1)), int(sample.get("row", -1))))
            partitions.append(partition)
            audited.append(is_audited)
    if not images:
        raise SystemExit("没有可导出的本机校准素材")
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(output, images=np.asarray(images, np.uint8), labels=np.asarray(labels, np.int64),
                        sessions=np.asarray(sessions), scenes=np.asarray(scenes), domains=np.asarray(domains),
                        coordinates=np.asarray(coordinates, np.int16), partitions=np.asarray(partitions),
                        audited=np.asarray(audited, np.bool_))
    unique, counts = np.unique(np.asarray(labels), return_counts=True)
    print(json.dumps({"rawSamples": raw_samples, "samples": len(images),
                      "sessions": len(set(sessions)),
                      "labels": {LABELS[int(label)]: int(count) for label, count in zip(unique, counts)},
                      "skipped": skipped, "output": str(output)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
