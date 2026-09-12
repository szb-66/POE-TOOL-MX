"""Room OCR evidence and frozen-image OCR. No window or input operations."""
import base64
import math
import cv2
import numpy as np
from chart_mods_probe import prepare_ocr_image, unpack_ocr_output


def room_body_region(image):
    """Use the gold title rule, never a fixed height or the first OCR line.

    A body-only selection has no gold title above a wide rule and is unchanged.
    This also excludes the small ornaments beside the title before detection.
    """
    height, width = image.shape[:2]
    full = {'x': 0, 'y': 0, 'width': width, 'height': height}
    if width < 80 or height < 30:
        return full
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    gold = ((hsv[:, :, 0] >= 10) & (hsv[:, :, 0] <= 45)
            & (hsv[:, :, 1] > 45) & (hsv[:, :, 2] > 55))
    rules = cv2.morphologyEx(np.uint8(gold), cv2.MORPH_OPEN,
                             np.ones((1, max(60, round(width*.65))), np.uint8))
    rows = np.flatnonzero(np.mean(rules, axis=1) > .6)
    groups = np.split(rows, np.flatnonzero(np.diff(rows) > 4)+1)
    for group in groups:
        if not len(group):
            continue
        top, bottom = int(group[0]), int(group[-1])+1
        if not width*.025 < top < min(height-12, width*.16):
            continue
        title = gold[:top] & (hsv[:top, :, 2] > 160)
        if np.mean(title) < .025:
            continue
        return {'x': 0, 'y': bottom, 'width': width, 'height': height-bottom}
    return full


def has_currency_offer(texts):
    return any(''.join(line.split()) in ('完成后提供物品', '完成后获得物品', '完成后提供奖励')
               for line in texts)


def create_sanctum_ocr_engine():
    from pathlib import Path
    import rapidocr
    from rapidocr import RapidOCR
    # Tooltips are wide and short. Short-side scaling inflates them severalfold.
    return RapidOCR(params={"Global.model_root_dir": str(Path(rapidocr.__file__).resolve().parent / "models"),
                            "Det.limit_type": "max"})


def read_room_ocr(engine, image):
    boxes, texts, scores = unpack_ocr_output(engine(prepare_ocr_image(image)))
    blocks = []
    for box, text, confidence in zip(boxes, texts, scores):
        if not text.strip() or not math.isfinite(confidence):
            continue
        points = np.asarray(box, dtype=float)
        if points.shape != (4, 2) or not np.isfinite(points).all():
            continue
        left, top = np.maximum(0, np.floor(points.min(axis=0))).astype(int)
        right, bottom = np.minimum([image.shape[1], image.shape[0]], np.ceil(points.max(axis=0))).astype(int)
        if right <= left or bottom <= top:
            continue
        blocks.append({'text': text, 'confidence': max(0., min(1., confidence)),
                       'region': {'x': int(left), 'y': int(top), 'width': int(right-left), 'height': int(bottom-top)}})
    groups = []
    for block in sorted(blocks, key=lambda b: b['region']['y'] + b['region']['height']/2):
        r = block['region']
        center = r['y'] + r['height']/2
        last = groups[-1] if groups else []
        previous = last[0]['region'] if last else None
        if previous and abs(center-previous['y']-previous['height']/2) <= min(r['height'], previous['height'])*.5:
            last.append(block)
        else:
            groups.append([block])
    lines, ordered = [], []
    for group in groups:
        group.sort(key=lambda b: b['region']['x'])
        ordered += group
        x, y = min(b['region']['x'] for b in group), min(b['region']['y'] for b in group)
        right = max(b['region']['x']+b['region']['width'] for b in group)
        bottom = max(b['region']['y']+b['region']['height'] for b in group)
        lines.append({'text': ''.join(b['text'] for b in group), 'confidence': min(b['confidence'] for b in group),
                      'region': {'x': x, 'y': y, 'width': right-x, 'height': bottom-y}})
    return {'texts': [line['text'] for line in lines], 'ocrBlocks': ordered, 'ocrLines': lines}


def read_frozen(options, engine=None):
    png = options.get('png')
    if not isinstance(png, str) or len(png) > 24*1024*1024:
        raise ValueError('冻结截图无效')
    raw = base64.b64decode(png, validate=True)
    if raw[:8] != b'\x89PNG\r\n\x1a\n' or len(raw) < 24:
        raise ValueError('冻结截图格式无效')
    width, height = int.from_bytes(raw[16:20], 'big'), int.from_bytes(raw[20:24], 'big')
    if width < 1 or height < 1 or width*height > 40_000_000:
        raise ValueError('冻结截图尺寸无效')
    image = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    region = options.get('region', {})
    if image is None or any(type(region.get(k)) is not int for k in ('x','y','width','height')):
        raise ValueError('识别区域无效')
    x,y,w,h = (region[k] for k in ('x','y','width','height'))
    if x < 0 or y < 0 or w < 1 or h < 1 or x+w > width or y+h > height:
        raise ValueError('识别区域越界')
    from sanctum_rewards import recognize_currency_icons
    panel = image[y:y+h,x:x+w]
    body = room_body_region(panel) if options.get('room', True) else {'x':0,'y':0,'width':w,'height':h}
    bx, by, bw, bh = (body[k] for k in ('x','y','width','height'))
    import time
    started = time.perf_counter()
    icons_only = options.get('iconsOnly', False)
    # One OCR pass, with the gold rule separating title evidence from prose.
    text = {'texts': [], 'ocrBlocks': [], 'ocrLines': []} if icons_only else read_room_ocr(
        engine if engine is not None else create_sanctum_ocr_engine(), panel)
    title_texts = [line['text'] for line in text['ocrLines']
                   if by and line['region']['y'] + line['region']['height']/2 < by]
    for key in ('ocrBlocks', 'ocrLines'):
        text[key] = [block for block in text[key]
                     if block['region']['y'] + block['region']['height']/2 >= by]
    text['texts'] = [line['text'] for line in text['ocrLines']]
    for block in [*text['ocrBlocks'], *text['ocrLines']]:
        block['region']['x'] += x
        block['region']['y'] += y
    ocr_ms = (time.perf_counter()-started)*1000
    started = time.perf_counter()
    scan_icons = icons_only or options.get('includeIcons',True) and has_currency_offer(text['texts'])
    icons = recognize_currency_icons(panel[by:by+bh,bx:bx+bw]) if scan_icons else []
    for icon in icons:
        icon['region']['x'] += x+bx
        icon['region']['y'] += y+by
    evidence = {}
    if options.get('resources'):
        from sanctum_resources import resource_evidence
        evidence = resource_evidence(image, text['ocrLines'])
    return {**text, 'region':region, 'bodyRegion':{**body,'x':x+bx,'y':y+by},
            'titleTexts':title_texts, 'titleRegion':{'x':x,'y':y,'width':w,'height':by} if by else None,
            **({'resourceEvidence': evidence} if options.get('resources') else {}),
            'status':'located', 'currencyIcons':icons, 'hasCurrencyOffer':has_currency_offer(text['texts']),
            'captureMetrics':{'ocrMs':round(ocr_ms,2),'iconsMs':round((time.perf_counter()-started)*1000,2),'ocrCalls':int(not icons_only),'iconCalls':int(bool(scan_icons))}}

