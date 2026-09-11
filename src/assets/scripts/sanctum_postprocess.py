"""No game input here: locate, encode and diagnose an already frozen frame."""
import base64
import time
import cv2
from sanctum_tooltip import locate_content
from sanctum_diagnostics import save_tooltip_evidence


def process_image(baseline, image, options, emit_evidence=lambda frame: None):
    started = time.perf_counter()
    metrics = dict(options.get('captureMetrics') or {})
    room = options['mode'] == 'map'
    stamp = time.perf_counter()
    evidence = {**locate_content(baseline, image, options['point'], room=room), 'texts': []}
    metrics['locateMs'] = (time.perf_counter()-stamp)*1000
    region = evidence.get('region')
    stamp = time.perf_counter()
    if region:
        x, y, w, h = (region[k] for k in ('x', 'y', 'width', 'height'))
        ok, png = cv2.imencode('.png', image[y:y+h, x:x+w], [cv2.IMWRITE_PNG_COMPRESSION, 1])
        if not ok:
            raise ValueError('内容截图编码失败')
        evidence['png'] = base64.b64encode(png).decode('ascii')
    frame = None
    if region:
        frame = dict(kind='room-crop' if room else 'effect-crop', region=dict(x=0, y=0, width=w, height=h),
                     sourceRegion=region, sourceWidth=image.shape[1], sourceHeight=image.shape[0],
                     width=w, height=h, png=evidence['png'])
    metrics['encodeMs'] = (time.perf_counter()-stamp)*1000
    stamp = time.perf_counter()
    if frame:
        emit_evidence(frame)
    metrics['evidenceTransferMs'] = (time.perf_counter()-stamp)*1000
    if region:
        for x, y, w, h in options.get('masks', []):
            if region['x'] < x+w and region['x']+region['width'] > x and region['y'] < y+h and region['y']+region['height'] > y:
                evidence.update(status='partial', reason='弹框与截图排除区重叠')
    evidence['readStages'] = dict(locate='matched' if region else 'failed', ocr='queued' if region else 'failed')
    evidence['captureMetrics'] = metrics
    stamp = time.perf_counter()
    if room:
        try:
            evidence['diagnosticId'] = save_tooltip_evidence(options['frameId'], baseline, image, evidence, options)
        except Exception:
            evidence['diagnosticReason'] = '局部诊断保存失败'
    metrics['diagnosticMs'] = (time.perf_counter()-stamp)*1000
    metrics['postprocessMs'] = (time.perf_counter()-started)*1000
    evidence['captureMetrics'] = {key: round(value, 2) for key, value in metrics.items()}
    return evidence
