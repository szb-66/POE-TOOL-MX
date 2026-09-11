"""PoE1 圣所图像分析。纯离线函数不产生键鼠输入；命令行用于实机样本回放。"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

import cv2
import numpy as np
from sanctum_paths import path_evidence, locate_position


def load_image(path):
    image = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("无法读取采样图")
    return image


def room_candidates(image, calibration=None):
    """跨灰度阈值找矩形内框，避免图标把暗底切成多个区域。"""
    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    candidates = []
    room_size = (calibration or {}).get("roomSize")
    for threshold in (24, 32, 40, 48, 56):
        mask = cv2.inRange(gray, 0, threshold)
        contours, _ = cv2.findContours(mask, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if room_size:
                size_matches = room_size[0] * .75 < w < room_size[0] * 1.25 and room_size[1] * .75 < h < room_size[1] * 1.25
            else:
                size_matches = height * .045 < w < height * .088 and height * .078 < h < height * .125
            if not size_matches:
                continue
            if not .50 < w / h < .82:
                continue
            fill = abs(cv2.contourArea(contour)) / (w * h)
            # Revealed icons and the purple selection frame split the dark interior.
            if fill < .40:
                continue
            # Sample colors support an already detected rectangle. Painting
            # their matches across the map joined room interiors to scenery.
            colors = (calibration or {}).get('roomColors', [])
            evidence = 0.0
            if colors:
                center = image[y+h//4:y+3*h//4,x+w//4:x+3*w//4].astype(np.int16)
                evidence = float(np.mean(np.min([np.max(np.abs(center-np.array(c)),axis=2) for c in colors],axis=0)<18))
            candidates.append({"x": x, "y": y, "width": w, "height": h, "quality": fill, 'colorSupport':round(evidence,3)})
    # Highlighted frames are connected purple outlines even when the icon fragments
    # the dark interior. Detect the outline itself rather than relaxing dark fill further.
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    purple = cv2.inRange(hsv, np.array([125, 80, 65]), np.array([165, 255, 255]))
    purple = cv2.morphologyEx(purple, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    contours, _ = cv2.findContours(purple, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        size_matches = (room_size[0] * .75 < w * .68 < room_size[0] * 1.25 and
                        room_size[1] * .75 < h * .75 < room_size[1] * 1.25) if room_size else height * .10 < h < height * .15
        if size_matches and .6 < w / h < .9 and height * .06 < y < height * .84:
            candidates.append({"x": round(x + w * .16), "y": round(y + h * .125),
                               "width": round(w * .68), "height": round(h * .75), "quality": .99, "borderEffect": "affliction"})
    # Some boss icons split the dark interior completely. A positive image match
    # supplies visual evidence; never synthesize a boss at an expected grid slot.
    template_path = Path(__file__).resolve().parent.parent / "sanctum" / "vault-boss.png"
    if candidates and template_path.exists():
        template = load_image(template_path)
        scale = float(np.median([r["height"] for r in candidates])) / template.shape[0]
        for factor in (.95, 1.0, 1.05, 1.10):
            scaled = cv2.resize(template, None, fx=scale * factor, fy=scale * factor)
            if scaled.shape[0] >= height or scaled.shape[1] >= width:
                continue
            scores = cv2.matchTemplate(image, scaled, cv2.TM_CCOEFF_NORMED)
            _, confidence, _, location = cv2.minMaxLoc(scores)
            if confidence >= .90:
                candidates.append({"x": location[0], "y": location[1],
                                   "width": scaled.shape[1], "height": scaled.shape[0],
                                   "quality": float(confidence), "evidence": "vault-boss-template"})
    archive_template = Path(__file__).resolve().parent.parent / 'sanctum' / 'archives-boss.png'
    if candidates and archive_template.exists():
        template = load_image(archive_template)
        scale = float(np.median([r['height'] for r in candidates])) / 134
        for factor in (.95, 1.0, 1.05):
            scaled = cv2.resize(template, None, fx=scale*factor, fy=scale*factor)
            if min(scaled.shape[:2]) < 10 or scaled.shape[0] >= height or scaled.shape[1] >= width:
                continue
            scores = cv2.matchTemplate(image, scaled, cv2.TM_CCOEFF_NORMED)
            _, confidence, _, location = cv2.minMaxLoc(scores)
            if confidence >= .90 and location[0] > width*.75:
                candidates.append({'x': location[0], 'y': location[1], 'width': scaled.shape[1],
                                   'height': scaled.shape[0], 'quality': float(confidence), 'evidence': 'archives-boss-template'})
    unique = []
    for candidate in sorted(candidates, key=lambda item: -item["quality"]):
        cx = candidate["x"] + candidate["width"] / 2
        cy = candidate["y"] + candidate["height"] / 2
        prior = next((r for r in unique if abs(cx - (r["x"] + r["width"] / 2)) < height * .025
                      and abs(cy - (r["y"] + r["height"] / 2)) < height * .025), None)
        if prior is not None:
            if candidate.get('borderEffect'):
                prior['borderEffect'] = candidate['borderEffect']
            if candidate.get('evidence'):
                prior['evidence'] = candidate['evidence']
            continue
        unique.append(candidate)
    columns = []
    for room in sorted(unique, key=lambda item: item["x"]):
        if not columns or abs(room["x"] - columns[-1][0]["x"]) > height * .04:
            columns.append([])
        columns[-1].append(room)
    # Establish column spacing from repeated aligned rooms. Background fragments can
    # form singleton columns between genuine columns; counting them shifts every ID.
    anchors = [float(np.median([r["x"] + r["width"] / 2 for r in column]))
               for column in columns if len(column) >= 3]
    if len(anchors) >= 4:
        spacing = float(np.median(np.diff(anchors)))
        origin = anchors[0]
        if spacing > height * .08:
            columns = [column for column in columns if
                       abs((float(np.median([r["x"] + r["width"] / 2 for r in column])) - origin) / spacing
                           - round((float(np.median([r["x"] + r["width"] / 2 for r in column])) - origin) / spacing)) < .16]
    # A floor map must exhibit multiple aligned columns; arbitrary black panels aren't a floor.
    if not 6 <= len(columns) <= 9 or any(len(column) > 6 for column in columns):
        return []
    rooms = []
    for col, column in enumerate(columns):
        for row, room in enumerate(sorted(column, key=lambda item: item["y"])):
            room.update(id=f"{col}:{row}", column=col, row=row, status="candidate",
                        confidence=round(room.pop("quality"), 3), rawText="")
            rooms.append(room)
    return rooms


def path_mask(image, calibration=None):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, np.array([12, 95, 42]), np.array([40, 255, 255]))
    if calibration and calibration.get("pathHsv"):
        lower, upper = calibration["pathHsv"]
        mask |= cv2.inRange(hsv, np.array(lower, dtype=np.uint8), np.array(upper, dtype=np.uint8))
    return mask


def unavailable_path_mask(image):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    return cv2.bitwise_or(cv2.inRange(hsv, np.array([0, 130, 35]), np.array([8, 255, 255])),
                         cv2.inRange(hsv, np.array([172, 130, 35]), np.array([179, 255, 255])))


def connection_evidence(mask, source, target):
    sx, sy = source["x"] + source["width"] / 2, source["y"] + source["height"] / 2
    tx, ty = target["x"] + target["width"] / 2, target["y"] + target["height"] / 2
    # Exclude frame ornaments at both ends; measure continuous support, not a shared component
    # (intersecting independent paths can belong to one connected component).
    start = int(source["x"] + source["width"] + source["width"] * .15)
    end = int(target["x"] - target["width"] * .15)
    if end <= start:
        return 0.0
    radius = max(2, round(source["height"] * .045))
    supported = []
    for x in range(start, end + 1):
        y = round(sy + (ty - sy) * (x - sx) / (tx - sx))
        if x < 0 or x >= mask.shape[1] or y < 0 or y >= mask.shape[0]:
            supported.append(False)
        else:
            supported.append(bool(np.any(mask[max(0, y-radius):y+radius+1, x])))
    return sum(supported) / len(supported)


def room_content_status(image, room):
    # Relative inset excludes animated borders, including purple/gold ornaments.
    x, y, w, h = (room[k] for k in ('x', 'y', 'width', 'height'))
    if room.get('occluded') or x < 0 or y < 0 or x+w > image.shape[1] or y+h > image.shape[0]:
        return 'unknown'
    inner = image[y+round(h*.22):y+round(h*.78), x+round(w*.22):x+round(w*.78)]
    if not inner.size:
        return 'unknown'
    gray = cv2.cvtColor(inner, cv2.COLOR_BGR2GRAY)
    bright, contrast = float(np.mean(gray > 65)), float(np.std(gray))
    # Achromatic icons are still content. Only a uniformly dark, textureless
    # interior proves empty; intermediate/occluded evidence is not exclusion.
    if bright > .025 and contrast > 12:
        return 'present'
    if np.max(gray) < 42 and contrast < 6:
        return 'empty'
    return 'unknown'


def analyze_floor(image, calibration=None):
    if image is None or image.size == 0:
        return {"status": "unknown", "reason": "CAPTURE_EMPTY", "rooms": [], "edges": []}
    if calibration:
        try:
            validate_calibration(calibration, image.shape[1], image.shape[0])
        except (ValueError, TypeError, KeyError, IndexError):
            return {"status": "unknown", "reason": "CALIBRATION_INVALID_OR_SIZE_MISMATCH", "rooms": [], "edges": []}
        x, y, w, h = calibration["region"]
        masked = np.full_like(image, 255)
        masked[y:y+h, x:x+w] = image[y:y+h, x:x+w]
        image = masked
    rooms = room_candidates(image, calibration)
    if not rooms:
        return {"status": "unknown", "reason": "ROOM_GRID_NOT_FOUND", "rooms": [], "edges": []}
    mask = path_mask(image, calibration)
    unavailable_mask = unavailable_path_mask(image)
    edges = []
    path_hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    for source in rooms:
        for target in rooms:
            if target["column"] != source["column"] + 1:
                continue
            evidence = path_evidence(image, mask, source, target, path_hsv)
            gold_confidence = evidence["support"]
            red_confidence = connection_evidence(unavailable_mask, source, target)
            confidence = max(gold_confidence, red_confidence)
            # An isolated crossing does not establish an edge. Keep only
            # continuous traces that fit the endpoint corridor.
            if confidence < .70 or (gold_confidence >= red_confidence and evidence['residual'] > max(2, source['height'] * .025)):
                continue
            edges.append({"from": source["id"], "to": target["id"],
                          "status": "matched" if confidence >= .85 else "unknown",
                          "availability": "unavailable" if red_confidence >= .85 and gold_confidence < .85
                          else "gold" if gold_confidence >= .85 and red_confidence < .85 else "unknown",
                          "traversal": "unavailable" if red_confidence >= .85 and gold_confidence < .85
                          else ("visited" if evidence["fill"] >= .72 else "available" if evidence["fill"] <= .35 else "unknown")
                          if gold_confidence >= .85 and red_confidence < .85 else "unknown",
                          "pathEvidence": evidence, "confidence": round(confidence, 3)})
    incoming = {edge["to"] for edge in edges if edge["status"] == "matched"}
    outgoing = {edge["from"] for edge in edges if edge["status"] == "matched"}
    last_column = max(room["column"] for room in rooms)
    for room in rooms:
        connected = (room["column"] == 0 or room["id"] in incoming) and (
            room["column"] == last_column or room["id"] in outgoing)
        room["status"] = "matched" if connected else "unknown"
        inner = image[room["y"]+10:room["y"]+room["height"]-10,
                      room["x"]+10:room["x"]+room["width"]-10]
        room["revealed"] = False
        if inner.size:
            hsv = cv2.cvtColor(inner, cv2.COLOR_BGR2HSV)
            room["revealed"] = bool(np.mean((hsv[:, :, 1] > 55) & (hsv[:, :, 2] > 65)) > .08)
        room["revealStatus"] = "visible" if room["revealed"] else "unknown"
        room['contentStatus'] = room_content_status(image, room)
        if room['contentStatus'] == 'present':
            room['revealed'], room['revealStatus'] = True, 'visible'
        room["detailsStatus"] = "unknown"
    position = locate_position(rooms, edges)
    exits = [r["id"] for r in rooms if r.get("evidence") in ("vault-boss-template", "archives-boss-template")]
    # Map identity and text have not been established by geometric recognition.
    return {"status": "partial", "reason": "DETAILS_AND_IDENTITY_UNCONFIRMED",
            "rooms": rooms, "edges": edges, **position, "exitRoomIds": exits, "width": image.shape[1], "height": image.shape[0]}


def validate_calibration(value, width, height):
    def integers(items, count, bounds):
        return isinstance(items, list) and len(items) == count and all(
            type(n) is int and low <= n <= high for n, (low, high) in zip(items, bounds))
    if not isinstance(value, dict) or value.get("version") != 1 or value.get("scope") not in ("sample", "live"):
        raise ValueError("校准格式无效")
    if value.get("imageSize") != [width, height]:
        raise ValueError("校准尺寸不匹配")
    region = value["region"]
    if not integers(region, 4, [(0, width), (0, height), (1, width), (1, height)]):
        raise ValueError("区域无效")
    if region[0] + region[2] > width or region[1] + region[3] > height:
        raise ValueError("区域越界")
    room = value["roomSize"]
    if room is not None and not integers(room, 2, [(24, min(width, 1000)), (24, min(height, 1000))]):
        raise ValueError("房间尺寸无效")
    hsv = value["pathHsv"]
    if not isinstance(hsv, list) or len(hsv) != 2 or any(not integers(row, 3, [(0, 179), (0, 255), (0, 255)]) for row in hsv):
        raise ValueError("路径颜色无效")
    if any(low > high for low, high in zip(*hsv)):
        raise ValueError("路径颜色范围反向")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image")
    parser.add_argument("--output")
    parser.add_argument("--calibration", help="仅用于当前样本的校准 JSON")
    args = parser.parse_args()
    result = analyze_floor(load_image(args.image), json.loads(args.calibration) if args.calibration else None)
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(payload, encoding="utf-8")
    else:
        print(payload)


if __name__ == "__main__":
    main()
