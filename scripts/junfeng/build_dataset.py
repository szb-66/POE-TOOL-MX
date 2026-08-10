"""从高亮/灰暗成对截图导出君锋镇格子数据集。

会话目录格式：
  sessions/<session-id>/highlighted.png
  sessions/<session-id>/dimmed.png
  sessions/<session-id>/labels.json  # 可选，键为 "column:row"

手工截图格式：
  flat/<session-id>.png              # 高亮状态
  flat/<session-id>h.png             # 全灰状态

自动标签只用于开发初标，发布前必须人工检查 labels.json。
"""
import argparse
import json
import re
from pathlib import Path

import cv2
import numpy as np

LABELS = ("highlighted", "dimmed", "empty")


def read_image(path):
    """兼容 Windows 中文路径的 OpenCV 图片读取。"""
    try:
        encoded = np.fromfile(path, dtype=np.uint8)
    except OSError:
        return None
    return cv2.imdecode(encoded, cv2.IMREAD_COLOR)


def normalize_grid(image, columns, rows, tile_size):
    """将已框选的完整网格独立归一化，消除手工框选产生的像素级尺寸差。"""
    return cv2.resize(image, (columns * tile_size, rows * tile_size), interpolation=cv2.INTER_AREA)


def iter_sessions(root, flat_pairs):
    if not flat_pairs:
        for folder in sorted(root.iterdir()):
            if folder.is_dir():
                yield folder.name, folder / "highlighted.png", folder / "dimmed.png", folder / "labels.json"
        return

    candidates = []
    for bright_path in root.glob("*.png"):
        match = re.fullmatch(r"(.+?)(?<!h)\.png", bright_path.name, re.IGNORECASE)
        if not match or bright_path.stem.lower().endswith("h"):
            continue
        dim_path = root / f"{bright_path.stem}h.png"
        if dim_path.exists():
            candidates.append((bright_path.stem, bright_path, dim_path, root / f"{bright_path.stem}.labels.json"))
    yield from sorted(candidates, key=lambda item: item[0])


def tiles(image, columns, rows):
    for row in range(rows):
        for column in range(columns):
            y0, y1 = round(row * image.shape[0] / rows), round((row + 1) * image.shape[0] / rows)
            x0, x1 = round(column * image.shape[1] / columns), round((column + 1) * image.shape[1] / columns)
            yield column, row, image[y0:y1, x0:x1]


def crop_tile_margin(tile, ratio=0.08):
    margin_x = max(1, int(round(tile.shape[1] * ratio)))
    margin_y = max(1, int(round(tile.shape[0] * ratio)))
    return tile[margin_y:tile.shape[0] - margin_y, margin_x:tile.shape[1] - margin_x]


def background_template(dim_tiles):
    """从每个会话最暗的四分之一格子估计空网格背景，避免把网格纹理当物品。"""
    ranked = sorted(dim_tiles, key=lambda item: cv2.cvtColor(item[2], cv2.COLOR_BGR2GRAY).mean())
    sample_count = max(1, len(ranked) // 4)
    return np.median(np.stack([tile for _, _, tile in ranked[:sample_count]]), axis=0).astype(np.uint8)


def auto_label(bright, dim, empty_reference, pair_mode):
    delta = float(cv2.absdiff(bright, dim).mean())
    bright_background_delta = float(cv2.absdiff(bright, empty_reference).mean())
    dim_background_delta = float(cv2.absdiff(dim, empty_reference).mean())
    if max(bright_background_delta, dim_background_delta) < 10:
        return "empty"
    if pair_mode == "full-highlight":
        return "highlighted"
    return "highlighted" if delta >= 8 else "dimmed"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sessions", required=True)
    parser.add_argument("--output", default="artifacts/junfeng/dataset.npz")
    parser.add_argument("--columns", type=int, default=12)
    parser.add_argument("--rows", type=int, default=11)
    parser.add_argument("--tile-size", type=int, default=100)
    parser.add_argument("--domain", default="junfeng")
    parser.add_argument("--pair-mode", choices=("mixed", "full-highlight"), default="mixed",
                        help="mixed 通过亮灰差异初标；full-highlight 将所有占用格标为高亮")
    parser.add_argument("--flat-pairs", action="store_true",
                        help="读取 <会话>.png 和 <会话>h.png 的手工截图命名")
    args = parser.parse_args()
    images, labels, sessions, scenes, domains, coordinates = [], [], [], [], [], []
    skipped = []
    label_counts = {label: 0 for label in LABELS}
    for session, bright_path, dim_path, overrides_path in iter_sessions(Path(args.sessions), args.flat_pairs):
        bright = read_image(bright_path)
        dim = read_image(dim_path)
        if bright is None or dim is None:
            skipped.append({"session": session, "reason": "image-unreadable"})
            continue
        bright = normalize_grid(bright, args.columns, args.rows, args.tile_size)
        dim = normalize_grid(dim, args.columns, args.rows, args.tile_size)
        overrides = json.loads(overrides_path.read_text("utf-8")) if overrides_path.exists() else {}
        bright_tiles = list(tiles(bright, args.columns, args.rows))
        dim_tiles = list(tiles(dim, args.columns, args.rows))
        empty_reference = background_template(dim_tiles)
        suggested = {}
        session_id = f"{args.domain}:{session}"
        for (column, row, bright_tile), (_, _, dim_tile) in zip(bright_tiles, dim_tiles):
            label = str(overrides.get(f"{column}:{row}") or
                        auto_label(bright_tile, dim_tile, empty_reference, args.pair_mode))
            if label not in LABELS:
                raise ValueError(f"{session} {column}:{row} 标签无效: {label}")
            dim_label = "empty" if label == "empty" else "dimmed"
            for source, source_label, scene in (
                (bright_tile, label, f"{session_id}:highlighted"),
                (dim_tile, dim_label, f"{session_id}:dimmed"),
            ):
                source = crop_tile_margin(source)
                images.append(cv2.resize(source, (64, 64), interpolation=cv2.INTER_AREA))
                labels.append(LABELS.index(source_label))
                sessions.append(session_id)
                scenes.append(scene)
                domains.append(args.domain)
                coordinates.append((column, row))
                label_counts[source_label] += 1
            suggested[f"{column}:{row}"] = label
        suggested_path = (overrides_path.parent / f"{session}.labels.suggested.json"
                          if args.flat_pairs else overrides_path.with_name("labels.suggested.json"))
        suggested_path.write_text(json.dumps(suggested, ensure_ascii=False, indent=2), "utf-8")
    if not images:
        raise SystemExit("未找到有效会话")
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(output, images=np.asarray(images, np.uint8), labels=np.asarray(labels, np.int64),
                        sessions=np.asarray(sessions), scenes=np.asarray(scenes), domains=np.asarray(domains),
                        coordinates=np.asarray(coordinates, np.int16))
    print(json.dumps({"domain": args.domain, "pairMode": args.pair_mode, "samples": len(images),
                      "sessions": len(set(sessions)), "labels": label_counts, "skipped": skipped,
                      "output": str(output)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
