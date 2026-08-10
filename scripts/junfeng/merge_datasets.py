"""合并多个已按各自网格切割的数据集，并保留来源域与采集会话。"""
import argparse
import json
from pathlib import Path

import numpy as np


FIELDS = ("images", "labels", "sessions", "scenes", "domains", "coordinates")
OPTIONAL_FIELDS = ("partitions", "audited")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", action="append", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    loaded = [np.load(path) for path in args.dataset]
    missing = {path: [field for field in FIELDS if field not in data.files]
               for path, data in zip(args.dataset, loaded)}
    missing = {path: fields for path, fields in missing.items() if fields}
    if missing:
        raise SystemExit(f"数据集字段不完整: {json.dumps(missing, ensure_ascii=False)}")
    merged = {field: np.concatenate([data[field] for data in loaded]) for field in FIELDS}
    merged["partitions"] = np.concatenate([
        data["partitions"] if "partitions" in data.files else np.asarray(["legacy"] * len(data["images"]))
        for data in loaded
    ])
    merged["audited"] = np.concatenate([
        data["audited"] if "audited" in data.files else np.zeros(len(data["images"]), dtype=np.bool_)
        for data in loaded
    ])
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(output, **merged)
    domains, counts = np.unique(merged["domains"], return_counts=True)
    print(json.dumps({"samples": len(merged["images"]),
                      "sessions": len(set(merged["sessions"].tolist())),
                      "domains": dict(zip(domains.tolist(), counts.tolist())),
                      "partitions": dict(zip(*[values.tolist() for values in np.unique(merged["partitions"], return_counts=True)])),
                      "output": str(output)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
