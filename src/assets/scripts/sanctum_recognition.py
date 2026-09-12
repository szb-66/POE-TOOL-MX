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


def merge_fragmented_rooms(candidates, fragments, height):
    """图标会把已揭示房间的暗色内框切成碎片，最大碎片的宽高比可能越过常规范围。
    仅当碎片与同列已识别房间中心对齐且纵向不重叠时补回，排除同房重复碎片和背景装饰。"""
    accepted = []
    for fragment in sorted(fragments, key=lambda item: -item["quality"]):
        center = fragment["x"] + fragment["width"] / 2
        column = [room for room in candidates
                  if abs(center - (room["x"] + room["width"] / 2)) < height * .025]
        overlap = any(room["y"] < fragment["y"] + fragment["height"]
                      and fragment["y"] < room["y"] + room["height"] for room in column)
        if column and not overlap:
            candidates.append(fragment)
            accepted.append(fragment)
    return accepted


def room_candidates(image, calibration=None):
    """跨灰度阈值找矩形内框，避免图标把暗底切成多个区域。"""
    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    candidates, fragments, low_fill = [], [], []
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
            fill = abs(cv2.contourArea(contour)) / (w * h)
            # Revealed icons and the purple selection frame split the dark interior.
            if fill < .25:
                continue
            # Sample colors support an already detected rectangle. Painting
            # their matches across the map joined room interiors to scenery.
            colors = (calibration or {}).get('roomColors', [])
            evidence = 0.0
            if colors:
                center = image[y+h//4:y+3*h//4,x+w//4:x+3*w//4].astype(np.int16)
                evidence = float(np.mean(np.min([np.max(np.abs(center-np.array(c)),axis=2) for c in colors],axis=0)<18))
            item = {"x": x, "y": y, "width": w, "height": h, "quality": fill, 'colorSupport':round(evidence,3)}
            if fill < .40:
                if .50 < w / h <= .95:
                    low_fill.append(item)
            elif .50 < w / h < .82:
                candidates.append(item)
            elif w / h <= .95:
                fragments.append(item)
    merge_fragmented_rooms(candidates, fragments, height)
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
    unique.extend(recover_low_fill_rooms(image, unique, low_fill, calibration))
    unique.extend(recover_frame_rooms(image, unique, calibration))
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


def recover_frame_rooms(image, anchors, calibration=None):
    """Recover observed frames, including singleton columns, without icon templates.

    Grid geometry only bounds the search. Both visible frame strokes and a
    continuous connection to an original anchor are required for every result.
    """
    if not anchors:
        return []
    height, width = image.shape[:2]
    w, h = [round(float(np.median([r[key] for r in anchors]))) for key in ('width', 'height')]
    columns = []
    for room in sorted(anchors, key=lambda r: r['x'] + r['width']/2):
        cx = room['x'] + room['width']/2
        if not columns or abs(cx - np.median([r['x'] + r['width']/2 for r in columns[-1]])) > w*.35:
            columns.append([])
        columns[-1].append(room)
    centers = [float(np.median([r['x'] + r['width']/2 for r in col])) for col in columns if len(col) >= 2]
    if len(centers) < 4:
        return []
    spacing = float(np.median(np.diff(centers)))
    if not 1.5*w < spacing < 4*w:
        return []
    # One neighboring column on either side is a search area, never a room.
    search_centers = [centers[0]-spacing, *centers, centers[-1]+spacing]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 20, 60)
    horizontal = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((1, max(2, round(w*.05))), np.uint8))
    horizontal = cv2.morphologyEx(horizontal, cv2.MORPH_OPEN, np.ones((1, round(w*.45)), np.uint8))
    vertical = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((max(2, round(h*.08)), 1), np.uint8))
    vertical = cv2.morphologyEx(vertical, cv2.MORPH_OPEN, np.ones((round(h*.4), 1), np.uint8))
    masks = [path_mask(image, calibration), unavailable_path_mask(image)]
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    options = []
    margin = max(2, round(w*.12))
    for cx in search_centers:
        x = round(cx-w/2)
        if x-margin < 0 or x+w+margin >= width:
            continue
        neighbors = [r for r in anchors if abs(abs(r['x']+r['width']/2-cx)-spacing) < w*.25]
        if not neighbors:
            continue
        stroke = np.mean(horizontal[:, x+round(w*.15):x+round(w*.85)] > 0, axis=1)
        # Anchor the upper rim itself. A horizontal HUD stroke underneath a
        # room is not its bottom rim and must not shift the proposed top.
        ys = np.flatnonzero(stroke >= .65).tolist()
        for y in sorted(ys):
            if y < 3 or y+h >= height:
                continue
            if any(x < r['x']+r['width'] and r['x'] < x+w and y < r['y']+r['height'] and r['y'] < y+h for r in anchors):
                continue
            # Use the upper 70% of each side: the HUD can cover the lower rim.
            band = vertical[y+round(h*.08):y+round(h*.78)] > 0
            left = np.mean(band[:, x-margin:x+margin+1], axis=0)
            right = np.mean(band[:, x+w-margin:x+w+margin+1], axis=0)
            if min(float(left.max()), float(right.max())) < .75:
                continue
            lx, rx = x-margin+int(left.argmax()), x+w-margin+int(right.argmax())
            if not .8*w <= rx-lx <= 1.2*w:
                continue
            # The inner top rim enters the dark panel. Prefer that transition
            # over the parallel ornamental strokes above it, without sampling
            # the icon in the body of the room.
            inset = round(w*.15)
            top_contrast = float(np.mean(gray[y-3:y, x+inset:x+w-inset])) - float(np.mean(gray[y:y+3, x+inset:x+w-inset]))
            if top_contrast < 8:
                continue
            room = dict(x=round((lx+rx-w)/2), y=y, width=w, height=h,
                        quality=.85, evidence='frame-path-supported')
            support, alignment = [], []
            for neighbor in neighbors:
                source, target = sorted((room, neighbor), key=lambda r: r['x'])
                for mask in masks:
                    confidence = connection_evidence(mask, source, target)
                    if confidence < .85:
                        continue
                    evidence = path_evidence(image, mask, source, target, hsv)
                    if evidence['residual'] <= max(2, h*.025):
                        support.append(confidence)
                        alignment.append(connection_alignment(mask, source, target))
            if support:
                options.append(((len(support), top_contrast, -float(np.mean(alignment))), room))
    accepted = []
    for _, room in sorted(options, key=lambda item: item[0], reverse=True):
        if not any(room['x'] < r['x']+r['width'] and r['x'] < room['x']+w
                   and room['y'] < r['y']+r['height'] and r['y'] < room['y']+h for r in [*anchors, *accepted]):
            accepted.append(room)
    return accepted


def geometric_exit_rooms(rooms, edges):
    """A complete eight-column graph establishes an exit, not its room type."""
    if {r['column'] for r in rooms} != set(range(8)):
        return []
    last = [r for r in rooms if r['column'] == 7]
    if len(last) != 1 or any(r.get('occluded') for r in rooms):
        return []
    by_id = {r['id']: r for r in rooms}
    valid = [e for e in edges if e.get('status') == 'matched' and not e.get('occluded')
             and e['from'] in by_id and e['to'] in by_id
             and by_id[e['to']]['column'] == by_id[e['from']]['column']+1]
    incoming, outgoing = {e['to'] for e in valid}, {e['from'] for e in valid}
    if all((r['column'] == 0 or r['id'] in incoming) and (r['column'] == 7 or r['id'] in outgoing) for r in rooms):
        return [last[0]['id']]
    return []


def recover_low_fill_rooms(image, anchors, fragments, calibration=None):
    """Weak dark contours need independent column and continuous path evidence.

    Restore a full rectangle from observed fragment bounds and trusted peers;
    recovered rooms never become anchors for other weak fragments.
    """
    if not anchors or not fragments:
        return []
    height, width = image.shape[:2]
    typical_width = float(np.median([r['width'] for r in anchors]))
    columns = []
    for room in sorted(anchors, key=lambda r: r['x'] + r['width']/2):
        cx = room['x'] + room['width']/2
        if not columns or abs(cx - np.median([r['x'] + r['width']/2 for r in columns[-1]])) > typical_width * .3:
            columns.append([])
        columns[-1].append(room)
    centers = [float(np.median([r['x'] + r['width']/2 for r in col])) for col in columns]
    masks = [path_mask(image, calibration), unavailable_path_mask(image)]
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    accepted = []
    for fragment in sorted(fragments, key=lambda r: -r['quality']):
        cx = fragment['x'] + fragment['width']/2
        index = min(range(len(columns)), key=lambda i: abs(centers[i] - cx))
        peers = columns[index]
        if len(peers) < 2 or abs(centers[index] - cx) > typical_width * .2:
            continue
        w, h = [round(float(np.median([r[key] for r in peers]))) for key in ('width', 'height')]
        if not (.75*w < fragment['width'] < 1.25*w and .75*h < fragment['height'] < 1.25*h):
            continue
        neighbors = [r for i in (index-1, index+1) if 0 <= i < len(columns)
                     and 1.5*w < abs(centers[i]-centers[index]) < 4*w for r in columns[i]]
        if not neighbors:
            continue
        x = round(centers[index] - w/2)
        # Both bounds come from visible fragment edges, never an expected row.
        bounds = sorted((fragment['y'], fragment['y'] + fragment['height'] - h))
        options = []
        for y in range(round(bounds[0] - h*.05), round(bounds[1] + h*.05) + 1, max(1, round(h*.025))):
            if x < 0 or y < 0 or x+w > width or y+h > height:
                continue
            if any(x < r['x']+r['width'] and r['x'] < x+w and
                   y < r['y']+r['height'] and r['y'] < y+h for r in [*anchors, *accepted]):
                continue
            room = {**fragment, 'x': x, 'y': y, 'width': w, 'height': h}
            support = []
            residuals = []
            alignment = []
            for neighbor in neighbors:
                source, target = sorted((room, neighbor), key=lambda r: r['x'])
                for mask in masks:
                    # A narrow corridor rejects isolated intersections and lines
                    # that run past the proposed room instead of connecting to it.
                    confidence = connection_evidence(mask, source, target)
                    if confidence < .85:
                        continue
                    evidence = path_evidence(image, mask, source, target, hsv)
                    if evidence['residual'] <= max(2, h*.025):
                        support.append(confidence)
                        residuals.append(evidence['residual'])
                        alignment.append(connection_alignment(mask, source, target))
            if support:
                options.append(((len(support), sum(support), -sum(alignment), -sum(residuals)), room))
        if options:
            room = max(options, key=lambda option: option[0])[1]
            room['evidence'] = 'low-fill-path-supported'
            accepted.append(room)
    return accepted


def connection_alignment(mask, source, target):
    """Distance between the actual stroke centre and the proposed room corridor.

    Continuity alone has a plateau for thick paths; do not pick its first y.
    """
    sx, sy = source['x'] + source['width']/2, source['y'] + source['height']/2
    tx, ty = target['x'] + target['width']/2, target['y'] + target['height']/2
    xs = np.arange(round(source['x'] + source['width']*1.15), round(target['x'] - target['width']*.15))
    ys = sy + (ty-sy)*(xs-sx)/(tx-sx)
    radius = max(2, round(source['height']*.045))
    rows = np.rint(ys).astype(int)[:, None] + np.arange(-radius, radius+1)
    hits = mask[np.clip(rows, 0, mask.shape[0]-1), xs[:, None]] > 0
    counts = hits.sum(axis=1)
    valid = counts > 0
    centers = (rows[valid]*hits[valid]).sum(axis=1)/counts[valid]
    return float(np.mean(np.abs(centers-ys[valid]))) if np.any(valid) else float('inf')


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
    exits = geometric_exit_rooms(rooms, edges)
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
