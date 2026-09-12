"""Bounded, immutable decoded crops shared by text and icon workers."""
import uuid
import ctypes
from sanctum_frames import open_mapping, frame_view


def image_binding(value):
    keys = ('sessionId', 'runId', 'floorId', 'roomId', 'frameId')
    if not isinstance(value, dict) or any(not isinstance(value.get(k), (str, int)) or isinstance(value.get(k), bool) for k in keys):
        raise ValueError('冻结图片身份无效')
    return {k: value[k] for k in keys}


class FrozenImages:
    def __init__(self, budget=128*1024*1024, count=8):
        self.budget, self.limit = budget, count
        self.items = {}
        self.bytes = 0

    def retain(self, image, binding):
        binding = image_binding(binding)
        if len(self.items) >= self.limit or self.bytes+image.nbytes > self.budget:
            raise ValueError('冻结图片缓存容量不足')
        height, width = image.shape[:2]
        spec = dict(name='poe-sanctum-'+uuid.uuid4().hex, width=width, height=height,
                    stride=image.nbytes, count=1, size=image.nbytes)
        mapping = open_mapping(spec)
        frame_view(mapping, spec, 0)[:] = image
        ref = dict(pool=spec, binding=binding)
        self.items[spec['name']] = (mapping, ref)
        self.bytes += spec['size']
        return ref

    def release(self, ref):
        # The native request envelope also carries deadlines/capture windows.
        ref = dict(pool=ref.get('pool'), binding=ref.get('binding'))
        name = ref.get('pool', {}).get('name')
        item = self.items.get(name)
        if item is None:
            return
        if item[1] != ref:
            raise ValueError('冻结图片身份失配')
        self.items.pop(name)
        self.bytes -= ref['pool']['size']
        item[0].close()

    def close(self):
        for mapping, _ in self.items.values():
            mapping.close()
        self.items.clear()
        self.bytes = 0


def open_image(ref, binding):
    if ref.get('binding') != image_binding(binding):
        raise ValueError('冻结图片身份失配')
    name = ref.get('pool', {}).get('name')
    if not isinstance(name, str) or not name.startswith('poe-sanctum-'):
        raise ValueError('冻结图片引用无效')
    # mmap(tagname=...) would CREATE an empty mapping after an owner crash.
    # Hold an existing handle until mmap opens it, preventing that race.
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.OpenFileMappingW.argtypes = [ctypes.c_ulong, ctypes.c_int, ctypes.c_wchar_p]
    kernel.OpenFileMappingW.restype = ctypes.c_void_p
    kernel.CloseHandle.argtypes = [ctypes.c_void_p]
    handle = kernel.OpenFileMappingW(4, False, name)
    if not handle:
        raise ValueError('冻结图片已释放')
    try:
        mapping = open_mapping(ref['pool'])
    finally:
        kernel.CloseHandle(handle)
    image = frame_view(mapping, ref['pool'], 0)
    image.setflags(write=False)
    return mapping, image
