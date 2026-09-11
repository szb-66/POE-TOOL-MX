"""Pure image geometry for moving Sanctum panels; no input or OCR here."""
import cv2
import numpy as np


def decorated_panels(gray, delta, target, header_only=False):
    """Pair the long title rules, then follow the translucent body below them."""
    height, width = gray.shape
    edges = cv2.Canny(gray, 40, 110)
    horizontal = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((1, 15), np.uint8))
    horizontal = cv2.morphologyEx(horizontal, cv2.MORPH_OPEN, np.ones((1, max(80, width//12)), np.uint8))
    contours, _ = cv2.findContours(horizontal, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    rules = [cv2.boundingRect(c) for c in contours]
    found = []
    tx, ty = target
    for x, y, w, _ in rules:
        if not width*.10 < w < width*.75 or not x-w*.15 <= tx <= x+w*1.15:
            continue
        for bx, by, bw, _ in rules:
            if not max(24, height*.018) < by-y < height*.09:
                continue
            if abs(x-bx) > max(8, w*(.01 if header_only else .025)) or abs(w-bw) > w*(.02 if header_only else .06):
                continue
            left, right = max(x,bx), min(x+w,bx+bw)
            header = gray[y:by, left:right]
            if np.mean(header < 85) < .65 or np.mean(header > 150) < .012:
                continue
            if header_only:
                bottom = min(height, y+right-left)
                if np.mean(delta[y:by, left:right]) >= .008 and y-height*.22 <= ty <= bottom+height*.22:
                    found.append({'x':left, 'y':y, 'width':right-left, 'height':by-y})
                continue
            bottom = by+1
            # Average a horizontal band: text and ornaments must not split the body.
            while bottom+6 < height and bottom-by < height*.55:
                band = gray[bottom:bottom+6, left+8:right-8]
                if np.mean(band < 85) < .72:
                    break
                bottom += 6
            if bottom-by < 18 or min(abs(ty-y), abs(ty-bottom)) > height*.22:
                continue
            if np.mean(delta[y:bottom,left:right]) < .008:
                continue
            found.append({'x':left,'y':y,'width':right-left,'height':bottom-y})
    # Nested rules belong to the same decorated header, not separate tooltips.
    found.sort(key=lambda r:r['width'] if header_only else -r['width']*r['height'])
    unique = []
    for r in found:
        if not any(abs(r['y']-a['y']) < height*.06 and abs((r['x']+r['width']/2)-(a['x']+a['width']/2)) < width*.08 for a in unique):
            unique.append(r)
    return unique


def effect_panels(image, target):
    """Pair opacity edges of a plain tooltip; map ornaments are not titles."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape
    kernel = max(1, round(width/768)) | 1
    smooth = cv2.GaussianBlur(gray, (kernel, kernel), 0).astype(np.int16)
    gap = max(3, round(height*.003))
    edges = [[], []]
    # Resampling softens opacity steps. Two nearby contrast levels retain
    # small panels without merging every edge into the map underneath.
    for index, sign in enumerate((1, -1)):
        for contrast in (12, 10):
            mask = np.uint8((smooth[:-gap]-smooth[gap:])*sign > contrast)*255
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((1,max(9,width//150)),np.uint8))
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((1,max(80,width//16)),np.uint8))
            contours, _ = cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
            edges[index].extend(cv2.boundingRect(c) for c in contours)
    tx, ty = target
    candidates = []
    for x,y,w,h in edges[0]:
        top = y+gap
        for bx,by,bw,bh in edges[1]:
            bottom = by+gap
            near = 0 <= ty-bottom < height*.12 or 0 <= top-ty < height*.12
            if not height*.025 < bottom-top < height*.5 or not near or top < gap*2 or bottom+gap*2 >= height:
                continue
            left,right=max(x,bx),min(x+w,bx+bw)
            if right-left < width*.06 or not left <= tx <= right:
                continue
            # Text holes must not split the panel. Trim background attached to
            # either edge by its column darkness across the complete body.
            dark=np.mean(gray[top:bottom,left:right] < 70,axis=0)
            mask=np.uint8(dark > .72).reshape(1,-1)
            mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((1,max(10,width//100)),np.uint8))[0]
            runs=np.split(np.flatnonzero(mask),np.flatnonzero(np.diff(np.flatnonzero(mask))>1)+1)
            for run in runs:
                if not len(run) or len(run)<width*.06:
                    continue
                l,r=left+int(run[0]),left+int(run[-1])+1
                if not l<=tx<=r or np.mean(gray[top:bottom,l:r]<70)<.8:
                    continue
                # Both horizontal edges must darken/lighten across the panel,
                # not just across one room card or one text line.
                above=np.mean(gray[max(0,top-gap*2):top-gap,l:r],axis=0)
                inside=np.mean(gray[top+gap:top+gap*2,l:r],axis=0)
                below=np.mean(gray[bottom+gap:bottom+gap*2,l:r],axis=0)
                last=np.mean(gray[bottom-gap*2:bottom-gap,l:r],axis=0)
                if np.mean(above-inside>10)<.65 or np.mean(below-last>10)<.65:
                    continue
                if l < gap*2 or r+gap*2 >= width:
                    continue
                left_edge=np.mean(gray[top:bottom,l-gap*2:l-gap],axis=1)-np.mean(gray[top:bottom,l+gap:l+gap*2],axis=1)
                right_edge=np.mean(gray[top:bottom,r+gap:r+gap*2],axis=1)-np.mean(gray[top:bottom,r-gap*2:r-gap],axis=1)
                if np.mean(left_edge>10)<.6 or np.mean(right_edge>10)<.6:
                    continue
                candidates.append({'x':l,'y':top,'width':r-l,'height':bottom-top})
    # The complete body contains the smaller edges introduced by text rows.
    candidates.sort(key=lambda r:(min(abs(ty-r['y']),abs(ty-r['y']-r['height'])),-r['width']*r['height']))
    unique = []
    for r in candidates:
        def overlaps(a):
            area = max(0,min(r['x']+r['width'],a['x']+a['width'])-max(r['x'],a['x'])) * max(0,min(r['y']+r['height'],a['y']+a['height'])-max(r['y'],a['y']))
            return area > .6*min(r['width']*r['height'],a['width']*a['height'])
        if not any(overlaps(a) for a in unique):
            unique.append(r)
    return unique


def changed_panel_boundary(baseline, image, region):
    """Require a complete panel boundary plus evidence of a new tooltip.

    Text/ornaments can interrupt an edge. Compare bands instead of requiring
    individual pixels to be black; an internal contour has no new outer edge.
    Screen edges remain partial candidates, never evidence of completeness.
    """
    height, width = image.shape[:2]
    x, y, w, h = (region[k] for k in ('x', 'y', 'width', 'height'))
    gap = max(2, round(width / 640))
    left, right = max(0, x-gap*2), min(width, x+w+gap*2)
    top, bottom = max(0, y-gap*2), min(height, y+h+gap*2)
    before = cv2.cvtColor(baseline[top:bottom,left:right], cv2.COLOR_BGR2GRAY).astype(np.float32)
    after = cv2.cvtColor(image[top:bottom,left:right], cv2.COLOR_BGR2GRAY).astype(np.float32)
    x, y = x-left, y-top
    def edge_support(values):
        horizontal, vertical = [], []
        if y >= gap*2:
            horizontal.append(np.mean(values[y+gap:y+gap*2,x:x+w],axis=0)
                              - np.mean(values[y-gap*2:y-gap,x:x+w],axis=0))
        if y+h+gap*2 <= values.shape[0]:
            horizontal.append(np.mean(values[y+h-gap*2:y+h-gap,x:x+w],axis=0)
                              - np.mean(values[y+h+gap:y+h+gap*2,x:x+w],axis=0))
        if x >= gap*2:
            vertical.append(np.mean(values[y:y+h,x+gap:x+gap*2],axis=1)
                            - np.mean(values[y:y+h,x-gap*2:x-gap],axis=1))
        if x+w+gap*2 <= values.shape[1]:
            vertical.append(np.mean(values[y:y+h,x+w-gap*2:x+w-gap],axis=1)
                            - np.mean(values[y:y+h,x+w+gap:x+w+gap*2],axis=1))
        return [[float(np.mean(side > 8)) for side in axis] for axis in (horizontal, vertical)]
    edges = edge_support(-after)
    changes = edge_support(before-after)
    # Consecutive tooltips can share a bottom or side with the baseline tooltip.
    # Require a new horizontal AND vertical edge, not four newly changed sides.
    return (all(axis and all(max(edge, change) >= .65 for edge, change in zip(axis, changed))
                for axis, changed in zip(edges, changes))
            and all(axis and max(axis) >= .3 for axis in changes))


def locate_tooltip(baseline, image, target, header_only=False, plain=False):
    if baseline.shape != image.shape:
        return {'status': 'unknown', 'reason': '提示框截图尺寸变化'}
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    delta = np.max(cv2.absdiff(baseline, image), axis=2) > 28
    if plain:
        panels = [r for r in effect_panels(image, target)
                  if np.mean(delta[r['y']:r['y']+r['height'],r['x']:r['x']+r['width']]) > .008
                  and changed_panel_boundary(baseline, image, r)]
        if len(panels) > 1:
            return {'status':'unknown','reason':'提示框存在多个候选'}
        if panels:
            return {**effect_panel_status(gray, panels[0]), 'method':'effect-opacity'}
    decorated = [] if plain else decorated_panels(gray, delta, target, header_only)
    if len(decorated) == 1:
        r = decorated[0]
        clipped = r['y']+r['height'] >= image.shape[0]-8
        return {'status': 'partial' if clipped else 'located', 'region':r,
                'reason':'提示框触及画面边缘' if clipped else None, 'method':'decorated-title'}
    # Plain effect panels remain supported independently of decorated room titles.
    mask = np.uint8(gray < 85) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    height, width = gray.shape
    if plain:
        # Static dark cards can attach to the tooltip's black contour. Recover
        # the newly darkened body as well, bridging text holes horizontally.
        before = cv2.cvtColor(baseline, cv2.COLOR_BGR2GRAY).astype(np.int16)
        changed = np.uint8(before-gray.astype(np.int16) > 8)*255
        changed = cv2.morphologyEx(changed, cv2.MORPH_CLOSE,
                                  np.ones((5,max(15,round(width*.02)) | 1),np.uint8))
        new_contours, _ = cv2.findContours(changed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = list(contours) + list(new_contours)
    candidates = []
    tx, ty = target
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w < max(80, width * .06) or h < 35 or w > width * .85 or h > height * .95:
            continue
        if cv2.contourArea(contour) / (w * h) < .72:
            continue
        if not x - w * .25 <= tx <= x + w * 1.25:
            continue
        if min(abs(ty - y), abs(ty - y - h)) > max(100, height * .18):
            continue
        if np.mean(delta[y:y+h, x:x+w]) < .18:
            continue
        rect = {'x': x, 'y': y, 'width': w, 'height': h}
        if plain and not changed_panel_boundary(baseline, image, rect):
            continue
        if not any(abs(x-r['x']) < 8 and abs(y-r['y']) < 8
                   and abs(w-r['width']) < 16 and abs(h-r['height']) < 16 for r in candidates):
            candidates.append(rect)
    if plain and candidates:
        # Contour methods may describe the same body with slightly different
        # borders. Keep the enclosing candidate, not an internal text island.
        candidates.sort(key=lambda r: -r['width']*r['height'])
        outer = candidates[0]
        candidates = [outer] + [r for r in candidates[1:] if
            max(0,min(r['x']+r['width'],outer['x']+outer['width'])-max(r['x'],outer['x'])) *
            max(0,min(r['y']+r['height'],outer['y']+outer['height'])-max(r['y'],outer['y']))
            < .9*r['width']*r['height']]
    if len(candidates) != 1:
        return {'status': 'unknown', 'reason': '提示框存在多个候选' if candidates else '未找到效果浮窗' if plain else '未找到提示框'}
    r = candidates[0]
    clipped = r['x'] <= 2 or r['y'] <= 2 or r['x']+r['width'] >= width-2 or r['y']+r['height'] >= height-2
    if header_only:
        return {'status':'partial' if clipped else 'located', 'region':r,
                'reason':'识别区域触及画面边缘，内容可能截断' if clipped else None}
    return effect_panel_status(gray, r)


def effect_panel_status(gray, r):
    height, width = gray.shape
    clipped = r['x'] <= 2 or r['y'] <= 2 or r['x']+r['width'] >= width-2 or r['y']+r['height'] >= height-2
    # A vertical track inside the right edge can hide additional entries.
    # This collector never scrolls; uncertainty must remain visible.
    right = gray[r['y']+5:r['y']+r['height']-5,
                 r['x']+int(r['width']*.85):r['x']+r['width']-5]
    tracks, _ = cv2.findContours(cv2.Canny(right, 45, 120), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    scroll = any(h > r['height']*.45 and w < max(12, r['width']*.07)
                 for x, y, w, h in (cv2.boundingRect(c) for c in tracks))
    if scroll:
        return {'status': 'partial', 'region': r, 'reason': '列表可能包含滚动内容，未读取隐藏条目'}
    return {'status': 'partial' if clipped else 'located', 'region': r,
            'reason': '提示框触及画面边缘，内容可能截断' if clipped else None}


def icon_candidates(image):
    """Find framed header_only icons, independent of their color and category order."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 140)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    # At small sizes anti-aliased frames can join the HUD's long edge, so
    # propose their chromatic foreground envelopes as well. Every hue uses
    # the same mask; no category or tier is inferred from these pixels.
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    foreground = np.uint8((hsv[:,:,1] > 110) & (hsv[:,:,2] > 90))*255
    foreground = cv2.morphologyEx(foreground, cv2.MORPH_CLOSE, np.ones((3,3),np.uint8))
    envelopes, _ = cv2.findContours(foreground, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    envelopes = [c for c in envelopes if cv2.contourArea(c) > .5*cv2.boundingRect(c)[2]*cv2.boundingRect(c)[3]]
    envelope_ids = {id(c) for c in envelopes}
    contours = list(contours) + envelopes
    found = []
    for contour in sorted(contours, key=lambda c: cv2.boundingRect(c)[2]*cv2.boundingRect(c)[3], reverse=True):
        x, y, w, h = cv2.boundingRect(contour)
        if min(w, h) < 16 or not .75 <= w/h <= 1.3 or h > image.shape[0] * .98:
            continue
        # Ornamental/open frames need not enclose contour area. Require edge
        # support on all four sides instead of filtering out boon entrances.
        boundary = edges[y:y+h,x:x+w] > 0
        band = max(2, round(min(w,h)*.12))
        support = [np.mean(np.any(boundary[:band],axis=0)), np.mean(np.any(boundary[-band:],axis=0)),
                   np.mean(np.any(boundary[:,:band],axis=1)), np.mean(np.any(boundary[:,-band:],axis=1))]
        if id(contour) not in envelope_ids and (min(support) < .68 or sum(value >= .85 for value in support) < 3):
            continue
        cx, cy = x+w//2, y+h//2
        if any(abs(cx-r['x']) < max(w, r['width'])/2 and abs(cy-r['y']) < max(h, r['height'])/2 for r in found):
            continue
        found.append({'x': cx, 'y': cy, 'width': w, 'height': h})
    rows = []
    for icon in sorted(found, key=lambda r:r['y']):
        row = next((row for row in rows if abs(icon['y']-row[0]['y']) < min(icon['height'],row[0]['height'])*.5), None)
        if row is None:
            rows.append([icon])
        else:
            row.append(icon)
    return [icon for row in rows for icon in sorted(row,key=lambda r:r['x'])]


def locate_content(baseline, image, target, room=False):
    """Locate on the frozen frame; retain original pixel coordinates.

    Baseline is the map/category screenshot, not a second hover capture.
    Broad darkening identifies the translucent body; gaps inside text lines are
    bridged so dense or multiline text cannot truncate a panel.
    """
    evidence = locate_tooltip(baseline, image, target, header_only=room, plain=not room)
    # Compare both scales even when native contours returned a small region.
    # OCR and evidence always use the original pixels, never the resized image.
    if not room and baseline.shape == image.shape and image.shape[1] > 1920:
        height, width = image.shape[:2]
        size = (1920, round(height*1920/width))
        reduced = locate_tooltip(cv2.resize(baseline, size, interpolation=cv2.INTER_AREA),
                                 cv2.resize(image, size, interpolation=cv2.INTER_AREA),
                                 (target[0]*size[0]/width, target[1]*size[1]/height), plain=True)
        panel = reduced.get('region')
        if panel:
            x = int(np.floor(panel['x']*width/size[0]))
            y = int(np.floor(panel['y']*height/size[1]))
            right = min(width, int(np.ceil((panel['x']+panel['width'])*width/size[0])))
            bottom = min(height, int(np.ceil((panel['y']+panel['height'])*height/size[1])))
            mapped = {'x':x,'y':y,'width':right-x,'height':bottom-y}
            delta = np.max(cv2.absdiff(baseline[y:bottom,x:right], image[y:bottom,x:right]),axis=2)>28
            if np.mean(delta) > .008:
                scaled = {**effect_panel_status(cv2.cvtColor(image,cv2.COLOR_BGR2GRAY),mapped),
                          'method':'effect-boundary-1920'}
                native = evidence.get('region')
                if not native:
                    evidence = scaled
                else:
                    overlap = max(0, min(native['x']+native['width'], right)-max(native['x'],x)) * max(
                        0, min(native['y']+native['height'],bottom)-max(native['y'],y))
                    native_area = native['width']*native['height']
                    scaled_area = mapped['width']*mapped['height']
                    if overlap < .9*min(native_area, scaled_area):
                        evidence = {'status':'unknown','reason':'提示框存在多个候选'}
                    elif scaled_area > native_area:
                        evidence = scaled
        elif not evidence.get('region') and '多个候选' in reduced.get('reason',''):
            evidence = reduced
    r = evidence.get('region')
    if not r:
        return evidence
    r['width'] = min(r['width'], image.shape[1]-r['x'])
    r['height'] = min(r['height'], image.shape[0]-r['y'])
    if room:
        x,y,w = r['x'],r['y'],r['width']
        # Title geometry limits width only. Body height is free to grow.
        a = cv2.cvtColor(baseline[y:,x:x+w],cv2.COLOR_BGR2GRAY).astype(np.int16)
        b = cv2.cvtColor(image[y:,x:x+w],cv2.COLOR_BGR2GRAY).astype(np.int16)
        broad = np.mean(a-b > 12,axis=1) > .25
        gap = max(8, round(w*.012))
        minimum = max(24, round(w*.065))
        bottom = None
        for row in range(minimum, len(broad)-gap+1):
            if not np.any(broad[row:row+gap]):
                bottom = row
                break
        if bottom is None:
            bottom = len(broad)
        if np.count_nonzero(broad[:bottom]) < minimum*.5:
            return {'status':'unknown','reason':'未找到正文范围','texts':[]}
        r['height'] = min(len(broad), bottom+2)
        clipped = y+r['height'] >= image.shape[0]-3
        evidence.update(status='partial' if clipped else 'located', reason='正文触及画面边缘' if clipped else None)
    evidence['region'] = r
    return evidence
