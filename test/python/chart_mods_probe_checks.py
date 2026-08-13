import importlib.util
import json
import sys
import types
from difflib import SequenceMatcher
from pathlib import Path


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
# 整框 32x32 严格稳定路径已被目标 ROI/语义稳定替代,不得残留。
assert not hasattr(probe, "frame_signature")
assert not hasattr(probe, "same_frame")
assert not hasattr(probe, "advance_hover_stability")
# 单帧采样:三帧循环已按简化反馈移除。
assert not hasattr(probe, "sample_target_frames")


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
cv2 = probe.cv2

# 同一行的 OCR 框即使高度不同也按 x 排列,不得把行尾数值排到第二行之后。
class FragmentedLines:
    boxes = [
        [[2, 1], [806, 2], [806, 54], [2, 53]],
        [[786, 9], [876, 9], [876, 49], [786, 49]],
        [[3, 44], [701, 44], [701, 94], [3, 94]],
    ]
    txts = ["每条连接降低", "50%", "物品数量提高120%"]
    scores = [0.99, 0.99, 0.99]


ordered = probe.ordered_texts(lambda _image: FragmentedLines(), np.zeros((100, 900, 3), dtype=np.uint8), 0.5)
assert ordered == ["每条连接降低50%", "物品数量提高120%"]

# hover 区域按逻辑尺寸和 DPI 换算，并钳制在当前显示器内。
class FakeMss:
    def __init__(self):
        self.monitors = [
            {"left": 0, "top": 0, "width": 3840, "height": 2160},
            {"left": 0, "top": 0, "width": 3840, "height": 2160},
        ]

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
    display = {"x": 0, "y": 0, "width": 3840, "height": 2160}
    dpi_cases = [(1, 800, 320), (1.25, 1000, 400), (1.5, 1200, 480)]
    for scale_factor, expected_width, expected_height in dpi_cases:
        normal = probe.hover_monitor({"x": 1920, "y": 1080}, {
            "width": 800, "height": 320, "offsetY": 24,
            "scaleFactor": scale_factor, "displayBounds": display,
        })
        assert normal["width"] == expected_width
        assert normal["height"] == expected_height
        assert normal["left"] == 1920 - expected_width // 2
        assert normal["top"] == 1080 + round(24 * scale_factor) - expected_height // 2

    top_left = probe.hover_monitor({"x": 60, "y": 100}, {
        "width": 800, "height": 320, "offsetY": 24,
        "scaleFactor": 1.5, "displayBounds": display,
    })
    assert top_left["left"] == 0 and top_left["top"] == 0
    bottom_right = probe.hover_monitor({"x": 3820, "y": 2140}, {
        "width": 800, "height": 320, "offsetY": 24,
        "scaleFactor": 1.5, "displayBounds": display,
    })
    assert bottom_right["left"] == 3840 - 1200
    assert bottom_right["top"] == 2160 - 480
    # 以鼠标为中心的正方形捕获:上下左右对称覆盖。
    square = probe.hover_monitor({"x": 1920, "y": 1080}, {
        "width": 800, "height": 800, "offsetY": 0,
        "scaleFactor": 1.5, "displayBounds": display,
    })
    assert square["width"] == 1200 and square["height"] == 1200
    assert square["left"] == 1920 - 600
    assert square["top"] == 1080 - 600
finally:
    if real_mss is None:
        sys.modules.pop("mss", None)
    else:
        sys.modules["mss"] = real_mss

# 150% DPI 回归图只含游戏词缀区域；真实 OCR 输出允许与仓库等级文字粘连，
# 但必须完整保留目标目录文本。
engine = probe.create_rapidocr_engine()
fixture_cases = [
    (Path(sys.argv[2]), "相邻区域的怪物至少为魔法"),
    (Path(sys.argv[3]), "相邻区域包含8个额外的海兽群"),
    (Path(sys.argv[4]), "相邻区域的怪物群规模提高32%"),
    (Path(sys.argv[5]), "相邻区域的词缀数值提高60%"),
]
fixture = None
for fixture_path, target_text in fixture_cases:
    fixture = cv2.imdecode(np.fromfile(fixture_path, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert fixture is not None and fixture.shape[:2] == (480, 1200)
    fixture_texts = probe.ordered_texts(engine, fixture, probe.DEFAULT_OCR_MIN_CONFIDENCE)
    normalized_texts = [text.replace(" ", "") for text in fixture_texts]
    assert any(target_text in text for text in normalized_texts), (fixture_path, fixture_texts)

# 蓝紫色目标 ROI:白字仓库等级(L:83)与蓝紫文字并存时必须完整保留目标文本,
# 且黑字白底 ROI 尺寸远小于整框。夹具为 150% DPI,字形高度按 38 物理像素标定。
GLYPH_H_150 = 38.0
roi_cases = [
    (Path(sys.argv[2]), "相邻区域的怪物至少为魔法"),
    (Path(sys.argv[3]), "相邻区域包含8个额外的海兽群"),
    (Path(sys.argv[4]), "相邻区域的怪物群规模提高32%"),
    (Path(sys.argv[5]), "相邻区域的词缀数值提高60%"),
]
for fixture_path, target_text in roi_cases:
    fixture = cv2.imdecode(np.fromfile(fixture_path, dtype=np.uint8), cv2.IMREAD_COLOR)
    roi = probe.target_text_roi(fixture, glyph_h=GLYPH_H_150)
    assert roi is not None, fixture_path
    assert roi.shape[0] < 160 and roi.shape[1] < 900, (fixture_path, roi.shape)
    colors = {tuple(int(v) for v in color) for color in np.unique(roi.reshape(-1, 3), axis=0)}
    assert colors == {(0, 0, 0), (255, 255, 255)}, (fixture_path, colors)
    roi_texts = probe.ordered_texts(engine, roi, probe.DEFAULT_OCR_MIN_CONFIDENCE)
    joined = "".join(text.replace(" ", "") for text in roi_texts)
    # ROI OCR 允许把 % 误读为 9 等轻微差异,由主进程模糊匹配吸收。
    ratio = SequenceMatcher(None, target_text.replace(" ", ""), joined).ratio()
    assert ratio >= 0.75, (fixture_path, roi_texts)

# 动态背景变化样本:同一目标文字叠加不同亮暗背景与噪点后,ROI 边界与文本保持稳定。
def with_background(image, brightness, noise_seed):
    variant = image.copy()
    rng = np.random.default_rng(noise_seed)
    noise = rng.integers(0, 30, size=variant.shape, dtype=np.uint8)
    return cv2.addWeighted(cv2.add(variant, noise), 0.9, variant, 0.1, brightness)

baseline_image = cv2.imdecode(np.fromfile(str(Path(sys.argv[3])), dtype=np.uint8), cv2.IMREAD_COLOR)
baseline_roi = probe.target_text_roi(baseline_image, glyph_h=GLYPH_H_150)
assert baseline_roi is not None
for brightness, seed in [(-40, 1), (35, 2), (0, 3)]:
    dynamic = with_background(baseline_image, brightness, seed)
    dynamic_roi = probe.target_text_roi(dynamic, glyph_h=GLYPH_H_150)
    assert dynamic_roi is not None, (brightness, seed)
    assert abs(dynamic_roi.shape[0] - baseline_roi.shape[0]) <= 2, (brightness, seed)
    assert abs(dynamic_roi.shape[1] - baseline_roi.shape[1]) <= 2, (brightness, seed)
    dynamic_texts = probe.ordered_texts(engine, dynamic_roi, probe.DEFAULT_OCR_MIN_CONFIDENCE)
    joined = "".join(text.replace(" ", "") for text in dynamic_texts)
    ratio = SequenceMatcher(None, "相邻区域包含8个额外的海兽群", joined).ratio()
    assert ratio >= 0.75, (brightness, seed, dynamic_texts)

# 无蓝紫文字的画面不产生目标 ROI,由调用方走全帧 OCR 兼容回退。
blank = np.zeros((480, 1200, 3), dtype=np.uint8)
blank[:, :] = (120, 120, 120)
assert probe.target_text_roi(blank) is None

# 锚点过滤:同一画面含多行蓝字时,取离锚点最近的行(悬停浮窗紧邻光标)。
def blue_glyph(image, x, y):
    image[y:y + 20, x:x + 12] = (200, 100, 100)


synthetic = np.full((240, 480, 3), 60, np.uint8)
for i in range(6):
    blue_glyph(synthetic, 20 + i * 20, 30)
for i in range(3):
    blue_glyph(synthetic, 380 + i * 20, 170)
dominant = probe.target_text_roi(synthetic, glyph_h=20.0)
assert dominant is not None and dominant.shape[1] > 100
near_far_row = probe.target_text_roi(synthetic, anchor=(400, 180), glyph_h=20.0)
assert near_far_row is not None and near_far_row.shape[1] < 80

# 相邻文字行合并为一个文本块:锚点靠近任意一行都必须保留两行,远处蓝字不进入 ROI。
multiline = np.full((240, 480, 3), 60, np.uint8)
for line_y in (30, 56):
    for i in range(6):
        blue_glyph(multiline, 20 + i * 20, line_y)
for i in range(3):
    blue_glyph(multiline, 380 + i * 20, 170)
for anchor in ((80, 40), (80, 66)):
    multiline_roi = probe.target_text_roi(multiline, anchor=anchor, glyph_h=20.0)
    assert multiline_roi is not None
    assert multiline_roi.shape[0] > 45, (anchor, multiline_roi.shape)
    assert multiline_roi.shape[1] < 180, (anchor, multiline_roi.shape)

# 大面积蓝紫色背景(如海面)与词缀文字并存时,按字号过滤背景并取离锚点最近的行。
sea = np.full((240, 480, 3), 60, np.uint8)
sea[0:100, 0:300] = (200, 100, 100)
for i in range(6):
    blue_glyph(sea, 20 + i * 20, 160)
sea_roi = probe.target_text_roi(sea, anchor=(80, 170), glyph_h=20.0)
assert sea_roi is not None
assert sea_roi.shape[0] < 100 and sea_roi.shape[1] > 100, sea_roi.shape

# 真实夹具带锚点(捕获中心)仍能提取唯一目标行。
e0_image = cv2.imdecode(np.fromfile(str(Path(sys.argv[3])), dtype=np.uint8), cv2.IMREAD_COLOR)
anchored_roi = probe.target_text_roi(e0_image, anchor=(600, 240), glyph_h=GLYPH_H_150)
assert anchored_roi is not None
anchored_texts = probe.ordered_texts(engine, anchored_roi, probe.DEFAULT_OCR_MIN_CONFIDENCE)
anchored_joined = "".join(text.replace(" ", "") for text in anchored_texts)
assert "相邻区域包含8个额外的海兽群" in anchored_joined, anchored_texts

# 单帧采样:settle 后只抓取一次,不再循环等待或比较整框。
class FakeCapture:
    def __init__(self):
        self.grabbed = 0

    def grab(self, monitor):
        self.grabbed += 1
        return np.zeros((monitor["height"], monitor["width"], 4), dtype=np.uint8)


class FakeEngine:
    def __init__(self):
        self.calls = 0

    def __call__(self, image):
        self.calls += 1
        return None


fake_capture = FakeCapture()
fake_engine = FakeEngine()
texts = probe.border_edge_texts(
    fake_engine, fake_capture, {"left": 0, "top": 0, "width": 1200, "height": 480},
    settle_ms=1, min_confidence=0.5,
)
assert fake_capture.grabbed == 1
assert fake_engine.calls == 1
assert texts == []

print(json.dumps({"ok": True}, ensure_ascii=False))
