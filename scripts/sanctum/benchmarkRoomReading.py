"""Replay frozen rooms through the current production driver (no game input).

The former NativeSession.ocr/read_tooltip replay predates shared frames and is
not a production path. The JS harness measures native workers and JS parsing.
"""
import argparse
from pathlib import Path
import subprocess

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runs', type=int, default=5, choices=range(1, 21))
    parser.add_argument('--mode', choices=('compare', 'matrix', 'current'), default='compare')
    parser.add_argument('--baseline-ref', default='HEAD')
    parser.add_argument('--scenario', choices=('rooms', 'rewards'), default='rooms')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    raise SystemExit(subprocess.call(['node', str(root/'scripts/sanctum/benchmarkRecognition.mjs'),
                                    '--runs='+str(args.runs), '--mode='+args.mode,
                                    '--baseline-ref='+args.baseline_ref, '--scenario='+args.scenario], cwd=root))
