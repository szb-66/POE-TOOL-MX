"""Read-only full-frame calibration candidates. Every candidate requires review.

Reference patches only locate stable decoration. Rectangles are anchored to actual
matches, never accepted from screen percentages without visual evidence.
"""
from pathlib import Path
import cv2
import numpy as np
from sanctum_recognition import room_candidates


def reference_image(number):
    path = Path(__file__).resolve().parent.parent / 'images' / 'sanctum-calibration' / f'example-{number}.png'
    image = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)
    return cv2.resize(image, (2048, round(image.shape[0] * 2048 / image.shape[1])))


def match_anchor(image, reference, rect, threshold=.82):
    x, y, w, h = rect
    patch = reference[y:y+h, x:x+w]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    patch = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
    best = None
    for scale in np.linspace(.65, 1.4, 31):
        size = (round(w*scale), round(h*scale))
        if size[0] >= gray.shape[1] or size[1] >= gray.shape[0]:
            continue
        result = cv2.matchTemplate(gray, cv2.resize(patch, size), cv2.TM_CCOEFF_NORMED)
        _, score, _, point = cv2.minMaxLoc(result)
        if best is None or score > best['score']:
            best = dict(x=point[0], y=point[1], scale=float(scale), score=score)
    return best if best and best['score'] >= threshold else None


def analyze_calibration(image, ocr_engine=None):
    height, width = image.shape[:2]
    if width < 100 or height < 100:
        raise ValueError('截图尺寸过小')
    ratio = min(1., 2048 / width)
    work = cv2.resize(image, (round(width*ratio), round(height*ratio)))
    ref = reference_image(1)
    results = []

    def add(key, rect, reason='自动定位，请核对边界', **extra):
        x, y, w, h = rect
        left, top = max(0, round(x/ratio)), max(0, round(y/ratio))
        right, bottom = min(width, round((x+w)/ratio)), min(height, round((y+h)/ratio))
        if right <= left or bottom <= top:
            return
        results.append(dict(key=key, region=dict(x=left, y=top, width=right-left, height=bottom-top),
                            status='review', reason=reason, **extra))

    def anchored(anchor, origin, target):
        x, y, w, h = target
        return (anchor['x']+(x-origin[0])*anchor['scale'], anchor['y']+(y-origin[1])*anchor['scale'],
                w*anchor['scale'], h*anchor['scale'])

    # The top crest is stable across floors; title text is taken from this frame.
    crest_rect = (1003, 60, 43, 43)
    crest = match_anchor(work, ref, crest_rect)
    if crest:
        add('sanctum-map', anchored(crest, crest_rect, (940, 99, 169, 41)))
        # Room recognition operates on the map-sized search window, as at runtime.
        search = anchored(crest, crest_rect, (560, 161, 926, 605))
        x, y, w, h = map(round, search)
        x, y = max(0, x), max(0, y)
        panel = work[y:min(work.shape[0], y+h), x:min(work.shape[1], x+w)]
        rooms = room_candidates(panel) if panel.size else []
        if rooms:
            left = min(r['x'] for r in rooms); top = min(r['y'] for r in rooms)
            right = max(r['x']+r['width'] for r in rooms); bottom = max(r['y']+r['height'] for r in rooms)
            pad = 14*crest['scale']
            add('mapRegion', (x+left-pad, y+top-pad, right-left+2*pad, bottom-top+2*pad))
            room = max(rooms, key=lambda r: r.get('confidence', 0))
            add('roomSize', (x+room['x'], y+room['y'], room['width'], room['height']))
            hsv = cv2.cvtColor(panel, cv2.COLOR_BGR2HSV)
            mask = cv2.inRange(hsv, np.array([12, 95, 42]), np.array([40, 255, 255]))
            for r in rooms:
                cv2.rectangle(mask, (max(0,r['x']-8),max(0,r['y']-8)), (r['x']+r['width']+8,r['y']+r['height']+8), 0, -1)
            lines = cv2.HoughLinesP(mask, 1, np.pi/180, 18, minLineLength=25, maxLineGap=6)
            if lines is not None:
                def between_rooms(line):
                    px, py = (int(line[0])+int(line[2]))/2, (int(line[1])+int(line[3]))/2
                    for first in rooms:
                        ax, ay = first['x']+first['width']/2, first['y']+first['height']/2
                        for second in rooms:
                            bx, by = second['x']+second['width']/2, second['y']+second['height']/2
                            if second.get('column') != first.get('column',0)+1 or not ax+first['width']/2 < px < bx-second['width']/2:
                                continue
                            expected_y = ay+(by-ay)*(px-ax)/(bx-ax)
                            if abs(py-expected_y) < max(4,first['height']*.08):
                                return True
                    return False
                # Decorative panel rules share path colors; only sample a line
                # geometrically connecting neighboring room columns.
                connected = [line for line in lines.reshape(-1,4) if between_rooms(line)]
                if not connected:
                    lines = None
            if lines is not None:
                a,b,c,d = max(connected, key=lambda line: abs(int(line[2])-int(line[0])))
                px, py = round((int(a)+int(c))/2), round((int(b)+int(d))/2)
                colors = hsv[max(0,py-4):py+5,max(0,px-4):px+5]
                selected = colors[(colors[:,:,0]>=12)&(colors[:,:,0]<=40)&(colors[:,:,1]>=95)]
                if len(selected):
                    hue = int(np.median(selected[:,0]))
                    add('pathColor', (x+px-5,y+py-5,11,11), pathHsv=[[max(0,hue-8),95,42],[min(179,hue+8),255,255]])

    coin_rect = (1507, 115, 28, 36)
    coins = match_anchor(work, ref, coin_rect, .84)
    if coins and coins['y'] < work.shape[0]*.5:
        add('coinsRegion', anchored(coins, coin_rect, (1495,103,166,59)))

    # Left resolve-bar decoration contains no changing text or resource values.
    bar_rect = (819, 794, 40, 43)
    bar = match_anchor(work, ref, bar_rect)
    if bar and bar['y'] > work.shape[0]*.5:
        if crest:
            add('sanctum-map-hud', anchored(bar, bar_rect, bar_rect))
            add('mapResourcesRegion', anchored(bar, bar_rect, (1220,766,165,103)), '按状态栏装饰定位，请覆盖坚毅上下移动及启迪出现的位置')
        else:
            add('hudResourcesRegion', anchored(bar, bar_rect, (839,766,546,125)), '请核对金币、坚毅与启迪完整面板')
        add('mapEffectIconsRegion' if crest else 'effectIconsRegion',
            anchored(bar, bar_rect, (839,746,546,164)), '请核对整条图标可能出现的范围，包含下方奖励入口')

    entry_rect = (1003,196,104,28)
    entry = match_anchor(work, reference_image(2), entry_rect, .84)
    if entry:
        add('sanctum-map-entry', anchored(entry, entry_rect, entry_rect))
    elif not crest:
        # Text fallback handles different font rendering and decoration. Keep the
        # search away from the quest tracker so a quest mention is not an entry.
        from sanctum_ocr import create_sanctum_ocr_engine, read_room_ocr
        engine = ocr_engine if ocr_engine is not None else create_sanctum_ocr_engine()
        left, top = round(work.shape[1]*.15), round(work.shape[0]*.12)
        text_area = work[top:round(work.shape[0]*.65),left:round(work.shape[1]*.8)]
        blocks = read_room_ocr(engine, text_area)['ocrBlocks']
        matches = [b for b in blocks if ''.join(b['text'].split()) == '禁域地图' and b['confidence'] >= .85]
        if len(matches) == 1:
            r = matches[0]['region']
            add('sanctum-map-entry', (left+r['x']-3, top+r['y']-3, r['width']+6, r['height']+6))
    return {'candidates': results, 'message': '请核对自动选框；未找到的元素可以补框或从另一张截图收集。' if results else '没有找到可靠元素，请参考示例重新截图，或选择元素手动补框。'}
