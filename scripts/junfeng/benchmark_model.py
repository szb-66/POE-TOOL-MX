"""按隔离的验证或测试会话评估当前高亮模型，并把质量报告写入 manifest。"""
import argparse
import json
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

LABELS = ("highlighted", "dimmed", "empty")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--split", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--partition", choices=("validation", "test"), default="validation")
    args = parser.parse_args()
    data = np.load(args.dataset)
    split = json.loads(Path(args.split).read_text("utf-8"))
    validation = set(split["testSessions" if args.partition == "test" else "validationSessions"])
    if args.partition == "test" and len(validation) < 3:
        raise SystemExit("最终测试集至少需要 3 个已审计独立会话")
    mask = np.asarray([session in validation for session in data["sessions"]])
    if not mask.any() or all(session in validation for session in set(data["sessions"].tolist())):
        raise SystemExit("验证会话必须非空且与训练会话隔离")
    images = np.asarray([cv2.cvtColor(image, cv2.COLOR_BGR2RGB).transpose(2, 0, 1)
                         for image in data["images"][mask]], np.float32) / 255.0
    labels = data["labels"][mask]
    audited = data["audited"][mask] if "audited" in data.files else np.zeros(int(mask.sum()), dtype=np.bool_)
    if args.partition == "test" and not bool(np.all(audited)):
        raise SystemExit("最终测试集包含未经人工审计的标签")
    sessions = data["sessions"][mask]
    scenes = data["scenes"][mask] if "scenes" in data.files else sessions
    coordinates = data["coordinates"][mask] if "coordinates" in data.files else np.full((len(labels), 2), -1)
    runtime = ort.InferenceSession(args.model, providers=["CPUExecutionProvider"])
    logits = runtime.run(["logits"], {"input": images})[0]
    logits -= logits.max(axis=1, keepdims=True)
    probabilities = np.exp(logits) / np.exp(logits).sum(axis=1, keepdims=True)
    predicted_highlight = probabilities[:, 0] >= 0.995
    actual_highlight = labels == 0
    true_positive = int(np.sum(predicted_highlight & actual_highlight))
    false_positive = int(np.sum(predicted_highlight & ~actual_highlight))
    false_negative = int(np.sum(~predicted_highlight & actual_highlight))
    precision = true_positive / max(1, true_positive + false_positive)
    recall = true_positive / max(1, true_positive + false_negative)
    zero_scene_clicks = 0
    zero_scene_count = 0
    for scene_id in set(scenes.tolist()):
        scene = scenes == scene_id
        if not np.any(actual_highlight[scene]):
            zero_scene_count += 1
            zero_scene_clicks += int(np.sum(predicted_highlight[scene]))
    highlighted_cells = int(np.sum(actual_highlight))
    negative_cells = int(np.sum(~actual_highlight))
    coverage_passed = highlighted_cells >= 20 and negative_cells >= 200 and zero_scene_count >= 1
    passed = false_positive == 0 and recall >= 0.99 and zero_scene_clicks == 0 and coverage_passed
    error_indices = np.where(predicted_highlight != actual_highlight)[0]
    errors = []
    for index in error_indices[:200]:
        session_id = str(sessions[index])
        errors.append({"kind": "false-positive" if predicted_highlight[index] else "false-negative",
                       "sessionId": session_id, "previewId": session_id.split(":", 1)[-1],
                       "column": int(coordinates[index][0]), "row": int(coordinates[index][1]),
                       "actualLabel": LABELS[int(labels[index])],
                       "highlightProbability": float(probabilities[index, 0])})
    report = {"passed": passed, "partition": args.partition, "audited": bool(np.all(audited)),
              "threshold": 0.995, "precision": precision, "recall": recall,
              "falsePositives": false_positive, "falseNegatives": false_negative,
              "zeroHighlightClicks": zero_scene_clicks, "zeroHighlightScenes": zero_scene_count,
              "highlightedCells": highlighted_cells, "negativeCells": negative_cells,
              "coveragePassed": coverage_passed, "evaluatedCells": int(len(labels)),
              "validationSessions": sorted(validation), "errors": errors}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    manifest_path = Path(args.manifest)
    manifest = json.loads(manifest_path.read_text("utf-8"))
    manifest["benchmark"] = report
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), "utf-8")
    if not passed:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
