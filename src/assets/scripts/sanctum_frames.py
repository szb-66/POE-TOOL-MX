"""Named, RAM-only frozen frames. The postprocessor owns the mapping lifetime."""
import mmap
import uuid
import numpy as np

FRAME_BUDGET = 512 * 1024 * 1024


class FramePool:
    def __init__(self, width, height, budget=FRAME_BUDGET):
        if type(width) is not int or type(height) is not int or min(width, height) < 1 or width*height > 40_000_000:
            raise ValueError('冻结画面尺寸无效')
        self.stride = width*height*3
        self.count = min(128, min(budget, FRAME_BUDGET)//self.stride)
        if self.count < 2:
            raise ValueError('冻结画面超过缓冲容量')
        self.spec = dict(name='poe-sanctum-'+uuid.uuid4().hex, width=width, height=height,
                         stride=self.stride, count=self.count, size=self.stride*self.count)
        self.mapping = open_mapping(self.spec)

    def view(self, slot):
        return frame_view(self.mapping, self.spec, slot)

    def close(self):
        self.mapping.close()


def open_mapping(spec):
    if not isinstance(spec.get('name'), str) or not spec['name'].startswith('poe-sanctum-'):
        raise ValueError('冻结缓冲身份无效')
    w, h, stride, count, size = (spec[k] for k in ('width', 'height', 'stride', 'count', 'size'))
    if any(type(n) is not int for n in (w, h, stride, count, size)) or min(w, h, count) < 1 or w*h > 40_000_000 or stride != w*h*3 or size != count*stride or size > FRAME_BUDGET:
        raise ValueError('冻结缓冲尺寸无效')
    return mmap.mmap(-1, size, tagname=spec['name'], access=mmap.ACCESS_WRITE)


def frame_view(mapping, spec, slot):
    if type(slot) is not int or not 0 <= slot < spec['count']:
        raise ValueError('冻结画面引用无效')
    return np.ndarray((spec['height'], spec['width'], 3), dtype=np.uint8,
                      buffer=mapping, offset=slot*spec['stride'])
