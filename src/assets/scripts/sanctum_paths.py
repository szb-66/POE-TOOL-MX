"""Map path evidence. Room ornaments are deliberately excluded."""
import cv2
import numpy as np


def path_evidence(image, mask, source, target, hsv=None):
    sx, sy = source['x'] + source['width']/2, source['y'] + source['height']/2
    tx, ty = target['x'] + target['width']/2, target['y'] + target['height']/2
    start = source['x'] + source['width'] * 1.15
    end = target['x'] - target['width'] * .15
    if end <= start:
        return {'support': 0, 'fill': 0}
    # Include both rims even when decorated room centres offset the corridor.
    radius = max(3, round(source['height'] * .12))
    if hsv is None:
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    support, filled, points = [], [], []
    for x in np.linspace(start, end, max(12, round(end-start))).astype(int):
        y = round(sy + (ty-sy)*(x-sx)/(tx-sx))
        if x < 0 or x >= image.shape[1] or y-radius < 0 or y+radius >= image.shape[0]:
            continue
        hit = np.flatnonzero(mask[y-radius:y+radius+1, x])
        support.append(bool(len(hit)))
        if len(hit) < 2:
            continue
        lo, hi = int(hit[0]), int(hit[-1])
        center = y-radius+(lo+hi)/2
        points.append((x, center))
    residual = 0.0
    if len(points) >= 8:
        coordinates = np.array(points, dtype=float)
        slope, intercept = np.polyfit(coordinates[:, 0], coordinates[:, 1], 1)
        residual = float(np.median(np.abs(coordinates[:, 1] - (slope*coordinates[:, 0]+intercept))))
        # Sample perpendicular to the fitted line, with subpixel interpolation.
        # Compare its centre to its own rims: absolute brightness makes a dim
        # solid stroke look hollow, especially along diagonal antialiased edges.
        normal = np.array([-slope, 1.0]) / np.hypot(slope, 1)
        offsets = np.linspace(-radius, radius, radius*4+1)
        xs = coordinates[:, 0, None] + normal[0]*offsets
        ys = (slope*coordinates[:, 0]+intercept)[:, None] + normal[1]*offsets
        samples = cv2.remap(hsv, xs.astype(np.float32), ys.astype(np.float32), cv2.INTER_LINEAR)
        centre = samples[:, np.abs(offsets) <= .5]
        rim_value = np.percentile(samples[:, :, 2], 85, axis=1)
        filled = np.mean((centre[:, :, 1] > 60) & (centre[:, :, 2] > 65)
                         & (centre[:, :, 2] >= rim_value[:, None]*.65), axis=1)
    return {'support': round(float(np.mean(support)), 3) if support else 0,
            'fill': round(float(np.mean(filled)), 3) if len(filled) else 0,
            'residual': round(residual, 2)}


def locate_position(rooms, edges):
    by_id = {room['id']: room for room in rooms}
    walked = [edge for edge in edges if edge.get('traversal') == 'visited' and edge['status'] == 'matched']
    result = {'currentRoomId': None, 'positionSource': 'paths', 'positionStatus': 'unknown',
              'initialSelection': False, 'startRoomIds': []}
    if walked:
        incoming, outgoing = {}, {}
        for edge in walked:
            incoming.setdefault(edge['to'], []).append(edge['from'])
            outgoing.setdefault(edge['from'], []).append(edge['to'])
        starts = set(outgoing)-set(incoming)
        ends = set(incoming)-set(outgoing)
        if len(starts) == len(ends) == 1 and all(len(v) == 1 for v in [*incoming.values(), *outgoing.values()]):
            node, seen = next(iter(starts)), set()
            first = min(room['column'] for room in rooms)
            while node not in seen:
                seen.add(node)
                if node not in outgoing:
                    break
                node = outgoing[node][0]
            if len(seen) == len(walked)+1 and by_id[next(iter(starts))]['column'] == first:
                result.update(currentRoomId=node, positionStatus='confirmed')
        return result
    # No walked chain: the entered first-column room is the only one whose
    # candidate exits are still reachable; unchosen first-column rooms are
    # blocked. Multiple candidates mean the player has not committed yet.
    first = min((room['column'] for room in rooms), default=None)
    candidates = [room for room in rooms if first == 0 and room['column'] == 0 and any(
        edge['from'] == room['id'] and edge.get('status') == 'matched'
        and edge.get('availability') == 'gold' and edge.get('traversal') == 'available'
        for edge in edges)]
    if len(candidates) == 1:
        result.update(currentRoomId=candidates[0]['id'], positionStatus='confirmed')
        return result
    # Entry is a complete untraversed graph, independent of the boss artwork.
    # Do not discard unknown edges: they are evidence that entry is not confirmed.
    if complete_initial_map(rooms, edges):
        result.update(initialSelection=True, positionStatus='initial',
                      startRoomIds=[r['id'] for r in rooms if r['column'] == 0])
    return result


def complete_initial_map(rooms, edges):
    by_id = {room['id']: room for room in rooms}
    if (not edges or len(by_id) != len(rooms)
            or {r['column'] for r in rooms} != set(range(8))
            or sum(r['column'] == 0 for r in rooms) < 2
            or sum(r['column'] == 7 for r in rooms) != 1
            or any(r.get('occluded') for r in rooms)):
        return False
    for edge in edges:
        source, target = by_id.get(edge['from']), by_id.get(edge['to'])
        if (not source or not target or target['column'] != source['column'] + 1
                or edge.get('occluded') or edge.get('status') != 'matched'
                or edge.get('availability') != 'gold' or edge.get('traversal') != 'available'):
            return False
    incoming = {edge['to'] for edge in edges}
    outgoing = {edge['from'] for edge in edges}
    # Adjacent columns form a DAG. Requiring every interior room to have both
    # sides proves all rooms belong to a path from an entrance to the last room.
    return all((r['column'] == 0 or r['id'] in incoming)
               and (r['column'] == 7 or r['id'] in outgoing) for r in rooms)
