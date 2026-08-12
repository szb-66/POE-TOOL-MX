import importlib.util
import json
import sys

import cv2
import numpy as np


def load_module(path):
    spec = importlib.util.spec_from_file_location("stash_tab_selector", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


selector = load_module(sys.argv[1])

assert selector.normalize_text(" Ｔｏ p \n") == "top"
assert selector.stitch_rows(["临时", "地图", "通货"], ["地图", "通货", "碎片"]) == ["临时", "地图", "通货", "碎片"]
assert selector.stitch_rows(["通货"], ["通货", "碎片", "通货"]).count("通货") == 2


class FakeOutput:
    boxes = [
        [[4, 2], [20, 2], [20, 22], [4, 22]],
        [[45, 2], [105, 2], [105, 24], [45, 24]],
        [[45, 32], [118, 32], [118, 56], [45, 56]],
    ]
    txts = ["图", "通 货", "通货2"]
    scores = [0.99, 0.99, 0.65]


filtered = selector.filter_ocr_rows(FakeOutput(), 180, 200, 0.72)
assert [row["normalizedText"] for row in filtered] == ["通货", "通货2"]
assert selector.exact_target_rows(filtered, "通货")
assert not selector.exact_target_rows(filtered, "通货2")


def row(text, y=0, confidence=0.99):
    return {
        "text": text, "normalizedText": selector.normalize_text(text),
        "confidence": confidence, "lowConfidence": confidence < 0.72,
        "box": {"x": 40, "y": y, "width": 50, "height": 20}
    }


class FakeMouse:
    def __init__(self):
        self.position = (0, 0)
        self.clicks = 0

    def press(self, _button):
        pass

    def release(self, _button):
        self.clicks += 1


class SimulatedSelector(selector.StashTabSelector):
    def __init__(self, sequence):
        super().__init__({
            "rootRegion": {"x": 100, "y": 200, "width": 160, "height": 500},
            "names": {"currency": "通货"}, "targetName": "通货", "hasScrollbar": True
        }, ocr_engine=lambda _image: None)
        self.sequence = sequence
        self.top_calls = 0
        self.scroll_calls = []
        self.fake_mouse = FakeMouse()

    def validate_environment(self):
        return selector.result(True)

    def scroll_to_top(self):
        self.top_calls += 1
        return selector.result(True, steps=2)

    def scan_from_top(self):
        pages = [{"step": index, "rows": [row(text, 40)]} for index, text in enumerate(self.sequence)]
        return selector.result(True, sequence=list(self.sequence), pages=pages, bottomStep=len(pages) - 1)

    def scroll(self, notches):
        self.scroll_calls.append(notches)

    def capture(self):
        return np.zeros((500, 160, 4), dtype=np.uint8)

    def recognize(self, _image):
        return [row("通货", 40)]

    def _mouse_controller(self):
        return self.fake_mouse

    def _wait_for_frame_change(self, _before):
        return True


successful = SimulatedSelector(["临时", "地图", "通货", "碎片"])
selected = successful.select()
assert selected["success"] and selected["scrollStep"] == 2
assert successful.top_calls == 2 and successful.scroll_calls == [-selector.SCROLL_NOTCHES] * 2
assert successful.fake_mouse.clicks == 1

duplicate = SimulatedSelector(["通货", "地图", "通货"])
rejected = duplicate.select()
assert not rejected["success"] and rejected["code"] == "target-not-unique"
assert duplicate.fake_mouse.clicks == 0 and duplicate.top_calls == 2


class LosingFocusSelector(SimulatedSelector):
    def __init__(self):
        super().__init__(["临时", "地图", "通货"])
        self.environment_checks = 0

    def validate_environment(self):
        self.environment_checks += 1
        if self.environment_checks >= 3:
            return selector.fail("game-not-foreground", "游戏不在前台，已停止仓库页选择")
        return selector.result(True)


losing_focus = LosingFocusSelector()
focus_result = losing_focus.select()
assert not focus_result["success"] and focus_result["code"] == "game-not-foreground"
assert losing_focus.fake_mouse.clicks == 0


def fixture_result(path):
    image = cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert image is not None
    cropped = image[:, 58:min(image.shape[1], 255)]
    output = selector.create_rapidocr_engine()(cropped)
    rows = selector.filter_ocr_rows(output, cropped.shape[1], cropped.shape[0], 0.72)
    values = [row["normalizedText"] for row in rows]
    currency_rows = [row for row in rows if row["normalizedText"] in ("通货", "通货2")]
    assert all(row["box"]["width"] > 0 and row["box"]["height"] > 0 for row in currency_rows)
    assert "碎片" in values and "药剂" in values
    return {
        "currency": values.count("通货"), "currency2": values.count("通货2"),
        "currencyBoxes": [row["box"] for row in currency_rows], "rows": values
    }


print(json.dumps({
    "pureChecks": True,
    "withScrollbar": fixture_result(sys.argv[2]),
    "withoutScrollbar": fixture_result(sys.argv[3])
}, ensure_ascii=False))
