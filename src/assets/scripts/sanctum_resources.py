"""Resource-only visual evidence. Never interpret unrelated HUD counters."""
import base64
from functools import lru_cache
import cv2
import numpy as np


@lru_cache(maxsize=1)
def coin_template():
    return cv2.imdecode(np.frombuffer(base64.b64decode(COIN_PNG), np.uint8), cv2.IMREAD_GRAYSCALE)


def resource_evidence(image, lines):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    template = coin_template()
    candidates = []
    # Source sample is 3840 px wide. Match the icon, not a fixed HUD coordinate.
    for scale in np.arange(.45, 1.61, .05):
        resized = cv2.resize(template, None, fx=float(scale), fy=float(scale), interpolation=cv2.INTER_AREA)
        h, w = resized.shape
        if h > gray.shape[0] or w > gray.shape[1]:
            continue
        scores = cv2.matchTemplate(gray, resized, cv2.TM_CCOEFF_NORMED)
        for _ in range(4):
            _, score, _, (x, y) = cv2.minMaxLoc(scores)
            if score < .78:
                break
            candidates.append((score, dict(x=x, y=y, width=w, height=h)))
            scores[max(0,y-h//2):y+h//2+1,max(0,x-w//2):x+w//2+1] = -1
    distinct = []
    for score, r in sorted(candidates, key=lambda item: -item[0]):
        if any(abs(r['x']-p['x']) < max(r['width'],p['width']) and abs(r['y']-p['y']) < max(r['height'],p['height']) for p in distinct):
            continue
        distinct.append(r)
    result = {'coinRegion': distinct[0] if len(distinct) == 1 else None, 'noInspiration': False}
    resolve = [line for line in lines if '坚毅' in line['text']]
    if len(resolve) != 1 or any('启' in line['text'] or '啟' in line['text'] for line in lines):
        return result
    r = resolve[0]['region']; lh = r['height']
    # Enclosing horizontal and vertical borders prove the single-row module.
    # Dark HUD panes can connect to the scene; darkness alone cannot bound them.
    edges = cv2.Canny(gray, 20, 60)
    borders = cv2.HoughLinesP(edges, 1, np.pi/180, max(20,round(r['width']*.3)),
                             minLineLength=round(r['width']*.85), maxLineGap=max(3,round(lh*.25)))
    if borders is None:
        return result
    horizontal = [line for line in borders.reshape(-1,4)
                  if abs(int(line[1])-int(line[3])) <= 2 and min(line[0],line[2]) <= r['x']+lh*.1
                  and max(line[0],line[2]) >= r['x']+r['width']-lh*.1]
    tops = [int(line[1]) for line in horizontal if r['y']-lh < line[1] < r['y']]
    bottoms = [int(line[1]) for line in horizontal if r['y']+lh < line[1] < r['y']+lh*2]
    if not tops or not bottoms:
        return result
    top,bottom = max(tops),min(bottoms)
    if not 1.35*lh <= bottom-top <= 2.6*lh or abs(r['y']+lh/2-(top+bottom)/2) > .18*(bottom-top):
        return result
    sides = []
    for left,right in [(max(1,r['x']-lh),r['x']), (r['x']+r['width'],min(gray.shape[1]-1,r['x']+r['width']+lh))]:
        strip = edges[top:bottom,int(left):int(right)]
        if strip.size == 0 or np.max(np.mean(strip > 0,axis=0)) < .5:
            return result
        sides.append(int(left)+int(np.argmax(np.mean(strip > 0,axis=0))))
    below = gray[bottom:min(gray.shape[0],bottom+round(lh*1.6)),r['x']:r['x']+r['width']]
    if below.shape[0] < lh*.4 or float(np.mean(below < 32)) > .75:
        return result
    result['noInspiration'] = True
    result['resolvePanel'] = dict(x=sides[0],y=top,width=sides[1]-sides[0],height=bottom-top)
    return result


# Gold coin icon cropped from the user supplied standalone HUD sample.
COIN_PNG = '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'
