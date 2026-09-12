"""Current full-tooltip OCR + required icons; isolated stage timings, not live speed."""
import argparse
import base64
import json
from pathlib import Path
import statistics
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'src/assets/scripts'))
from sanctum_ocr import create_sanctum_ocr_engine, read_frozen
from sanctum_frozen_image import FrozenImages
from sanctum_recognition import load_image


def benchmark(runs, threads):
    started = time.perf_counter()
    engine = create_sanctum_ocr_engine(threads)
    report = {'mode': 'offline-current-ocr', 'liveAcceptance': 'not-measured',
              'engineInitMs': (time.perf_counter()-started)*1000, 'samples': []}
    images = FrozenImages()
    try:
        for name in ['reward', 'purse', 'pact', 'fountain']:
            path = ROOT / ('test/fixtures/sanctum/ocr-'+name+'.png')
            image = load_image(str(path))
            rows = []
            for repeat in range(runs):
                options = dict(png=base64.b64encode(path.read_bytes()).decode(), includeIcons=False,
                               region=dict(x=0, y=0, width=image.shape[1], height=image.shape[0]), retainImage=True,
                               binding=dict(sessionId='benchmark', runId='r', floorId='f', roomId=name, frameId=repeat))
                started = time.perf_counter()
                read = read_frozen(options, engine, images)
                metrics = dict(read['captureMetrics'])
                icons = []
                if read.get('imageRef'):
                    try:
                        extra = read_frozen(dict(imageRef=read['imageRef'], binding=options['binding'],
                                                 region=options['region'], iconsOnly=True), engine)
                        metrics['iconsMs'] = extra['captureMetrics']['iconsMs']
                        metrics['decodeCalls'] += extra['captureMetrics']['decodeCalls']
                        icons = extra['currencyIcons']
                    finally:
                        images.release(read['imageRef'])
                rows.append(dict(repeat=repeat, totalMs=(time.perf_counter()-started)*1000, **metrics))
            report['samples'].append(dict(name=name, texts=read['texts'], icons=icons, runs=rows,
                                          medianMs=statistics.median(row['totalMs'] for row in rows)))
    finally:
        images.close()
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runs', type=int, default=5, choices=range(1, 21))
    parser.add_argument('--threads', type=int, default=2, choices=(1, 2, 4))
    args = parser.parse_args()
    print(json.dumps(benchmark(args.runs, args.threads), ensure_ascii=True, indent=2))
