import importlib.util
import json
import sys
import types


def load_module(path):
    spec = importlib.util.spec_from_file_location("chart_mods_probe", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


probe = load_module(sys.argv[1])

# 安全预检常量与哨兵函数存在性
assert probe.GAME_WINDOW_TITLES == ("流放之路", "Path of Exile")
assert probe.DEFAULT_COPY_TIMEOUT_MS >= 200
assert callable(probe.require_game_foreground)
assert callable(probe.move_cursor)
assert callable(probe.send_copy_key)


class FakeBoxes:
    boxes = [
        [[4, 2], [20, 2], [20, 22], [4, 22]],
        [[45, 2], [105, 2], [105, 24], [45, 24]],
        [[45, 32], [118, 32], [118, 56], [45, 56]],
    ]
    txts = ["碎片", "通 货", "通货2"]
    scores = [0.99, 0.99, 0.65]


boxes, texts, scores = probe.unpack_ocr_output(FakeBoxes())
assert texts == ["碎片", "通 货", "通货2"]
assert scores == [0.99, 0.99, 0.65]

boxes2, texts2, scores2 = probe.unpack_ocr_output([[box, text, score] for box, text, score in zip(boxes, texts, scores)])
assert texts2 == texts
assert probe.unpack_ocr_output(None) == ([], [], [])

import numpy as np

frame_a = np.zeros((64, 64, 3), dtype=np.uint8)
frame_a[32:, :] = 255
frame_b = np.zeros((64, 64, 3), dtype=np.uint8)
frame_b[:, 32:] = 255
assert probe.frame_signature(frame_a) != probe.frame_signature(frame_b)
assert probe.same_frame(probe.frame_signature(frame_a), probe.frame_signature(frame_a))
assert not probe.same_frame(probe.frame_signature(frame_a), probe.frame_signature(frame_b))

# hover 区域钳制:虚拟屏幕 1920x1080
class FakeMss:
    def __init__(self):
        self.monitors = [{"left": 0, "top": 0, "width": 1920, "height": 1080}]

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


real_mss = sys.modules.get("mss")
fake_mss = types.ModuleType("mss")
fake_mss.mss = FakeMss
sys.modules["mss"] = fake_mss
try:
    probe_mss = sys.modules[probe.__name__]
    probe_mss.mss = fake_mss
    normal = probe.hover_monitor({"x": 960, "y": 540}, {"width": 480, "height": 320, "offsetY": 24})
    assert normal == {"left": 720, "top": 404, "width": 480, "height": 320}
    top_left = probe.hover_monitor({"x": 60, "y": 100}, {"width": 480, "height": 320, "offsetY": 24})
    assert top_left["left"] == 0 and top_left["top"] == 0
    bottom_right = probe.hover_monitor({"x": 1900, "y": 1070}, {"width": 480, "height": 320, "offsetY": 24})
    assert bottom_right["left"] == 1920 - 480
    assert 0 <= bottom_right["top"] <= 1080 - 320
    assert bottom_right["top"] + bottom_right["height"] <= 1080
finally:
    if real_mss is None:
        sys.modules.pop("mss", None)
    else:
        sys.modules["mss"] = real_mss

print(json.dumps({"ok": True}, ensure_ascii=False))
