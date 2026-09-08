import importlib.util
import contextlib
import io
import json
import pathlib
import types
import unittest
from unittest.mock import patch


ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "src" / "assets" / "scripts" / "faustus_market_repricing.py"


def load_module():
    spec = importlib.util.spec_from_file_location("faustus_market_repricing", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FakeAdapter:
    def __init__(self, clipboard_values=None, currencies=None):
        self.actions = []
        self.clipboard_values = iter(clipboard_values or [])
        self.currencies = iter(currencies or [])
        self.window_open = True

    def double_click_price(self):
        self.actions.append("double_click_price")

    def hotkey(self, *keys):
        self.actions.append("hotkey:" + "+".join(keys))

    def read_clipboard(self):
        self.actions.append("read_clipboard")
        return next(self.clipboard_values)

    def write_clipboard(self, value):
        self.actions.append("write_clipboard:" + str(value))

    def recognize_current_currency(self, force_refresh=False):
        self.actions.append("recognize_currency")
        return next(self.currencies)

    def choose_currency(self, currency):
        self.actions.append("choose_currency:" + currency)

    def click_submit_once(self):
        self.actions.append("click_submit")

    def price_window_open(self):
        self.actions.append("price_window_open")
        return self.window_open

    def press_escape(self):
        self.actions.append("press_escape")
        self.window_open = False


class FakeRunAdapter(FakeAdapter):
    ITEM_TEXT = "物品类别: 护甲\n稀有度: 稀有\n测试物品\n--------\n护甲: 100"

    def validate_page(self):
        self.actions.append("validate_page")

    def validate_grid_structure(self):
        self.actions.append("validate_grid")

    def clear_grid_hover(self):
        self.actions.append("clear_grid_hover")

    def copy_item_at(self, column, row):
        return self.ITEM_TEXT if (column, row) == (0, 0) else ""

    def open_price_at(self, column, row):
        self.actions.append(f"open:{column},{row}")
        self.window_open = True

    def click_submit_once(self):
        super().click_submit_once()
        self.window_open = False

    def submission_result(self):
        self.actions.append("submission_result")
        return "repriced"


class GridRunAdapter(FakeRunAdapter):
    ITEM_TEXT = "物品类别: 护甲\n稀有度: 稀有\n测试物品\n术士长袍\n--------\n护甲: 100"

    def __init__(self, cells, *, shared_item=True, mutate_text=True):
        super().__init__()
        self.cells = list(cells)
        self.shared_item = shared_item
        self.mutate_text = mutate_text
        self.shared_price = 100
        self.cell_prices = {cell: 100 for cell in self.cells}
        self.current_cell = None
        self.pending_price = None

    def candidate_cells(self):
        return list(self.cells)

    def copy_item_at(self, column, row):
        cell = (column, row)
        if cell not in self.cell_prices:
            return ""
        price = self.shared_price if self.shared_item else self.cell_prices[cell]
        suffix = f"\n价格: {price}" if self.mutate_text else ""
        return self.ITEM_TEXT + suffix

    def open_price_at(self, column, row):
        self.current_cell = (column, row)
        self.actions.append(f"open:{column},{row}")
        self.window_open = True

    def read_clipboard(self):
        self.actions.append("read_clipboard")
        if self.pending_price is not None:
            return str(self.pending_price)
        return str(self.shared_price if self.shared_item else self.cell_prices[self.current_cell])

    def write_clipboard(self, value):
        self.pending_price = int(value)
        self.actions.append("write_clipboard:" + str(value))

    def recognize_current_currency(self, force_refresh=False):
        self.actions.append("recognize_currency")
        return "chaos"

    def click_submit_once(self):
        self.actions.append("click_submit")
        if self.shared_item:
            self.shared_price = self.pending_price
        else:
            self.cell_prices[self.current_cell] = self.pending_price
        self.pending_price = None
        self.window_open = False


class ProbeGridRunAdapter(GridRunAdapter):
    OTHER_ITEM_TEXT = "物品类别: 护甲\n稀有度: 稀有\n其他物品\n术士长袍\n--------\n护甲: 200"

    def __init__(self, candidates, item_text_by_cell, *, copy_sequences=None):
        super().__init__(candidates, shared_item=False, mutate_text=False)
        self.item_text_by_cell = dict(item_text_by_cell)
        self.copy_sequences = {
            cell: iter(values) for cell, values in (copy_sequences or {}).items()
        }
        self.cell_prices = {cell: 100 for cell in self.item_text_by_cell}

    def copy_item_at(self, column, row):
        cell = (column, row)
        self.actions.append(f"copy:{column},{row}")
        sequence = self.copy_sequences.get(cell)
        if sequence is not None:
            try:
                return next(sequence)
            except StopIteration:
                self.copy_sequences.pop(cell, None)
        return self.item_text_by_cell.get(cell, "")


class FakePreflightAdapter:
    def __init__(self):
        self.actions = []

    def validate_page(self):
        self.actions.append("validate_page")

    def validate_grid_structure(self):
        self.actions.append("validate_grid")


class FaustusAutomationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mod = load_module()

    def make_counting_game_adapter(self, ocr_batches, clipboard_values):
        adapter = self.mod.GameAdapter.__new__(self.mod.GameAdapter)
        adapter.grid = {"left": 0, "top": 0, "width": 1200, "height": 1200}
        adapter.Button = types.SimpleNamespace(left="left", right="right")
        adapter.Key = types.SimpleNamespace(esc="esc")
        adapter.keyboard = types.SimpleNamespace(press=lambda key: None, release=lambda key: None)
        adapter._price_context = None
        adapter._price_window_open_observation = None
        adapter._price_layout = None
        adapter._price_open_started = None
        adapter.ocr_count = 0
        adapter.actions = []
        batches = iter(ocr_batches)
        clipboard = iter(clipboard_values)

        def capture_ocr(region):
            adapter.ocr_count += 1
            adapter.actions.append(("ocr", dict(region)))
            return next(batches)

        adapter._popup_region = lambda: {"left": 0, "top": 0, "width": 1000, "height": 800}
        adapter.capture_ocr = capture_ocr
        adapter.click = lambda point, button=None, count=1: adapter.actions.append(
            ("click", tuple(round(value) for value in point), button, count)
        )
        adapter.sleep = lambda _seconds=0.08: None
        adapter.hotkey = lambda *keys: adapter.actions.append(("hotkey", keys))
        adapter.read_clipboard = lambda: next(clipboard)
        adapter.write_clipboard = lambda value: adapter.actions.append(("write", str(value)))
        return adapter

    def test_game_window_match_requires_both_title_and_process_name(self):
        self.mod.game_window_titles = lambda: ("流放之路", "Path of Exile")
        self.mod.game_window_process_names = lambda: ("PathOfExile.exe",)

        self.mod._window_title = lambda _hwnd: "流放之路攻略 - 浏览器"
        self.mod.window_process_name = lambda _hwnd: "msedge.exe"
        self.assertFalse(self.mod.window_matches_game(101))

        self.mod._window_title = lambda _hwnd: "流放之路"
        self.mod.window_process_name = lambda _hwnd: "pathofexile.exe"
        self.assertTrue(self.mod.window_matches_game(202))

    @staticmethod
    def repricing_config(item_name="术士长袍", width=2, height=2):
        return {
            "chaosPerDivine": "200",
            "bands": [{
                "start": "1", "end": "", "rangeCurrency": "chaos",
                "discountPercent": "10", "outputCurrency": "chaos",
            }],
            "item_footprints": {
                "schemaVersion": 1,
                "items": {f"*\x1f{item_name}": {"width": width, "height": height}},
                "categories": {},
            },
        }

    def test_probe_text_reused_by_next_candidate_but_not_next_run(self):
        neighbor = "物品类别: 通货\n稀有度: 通货\n混沌石\n--------"
        config = self.repricing_config(width=2, height=1)
        config["item_footprints"]["items"]["*\x1f混沌石"] = {"width": 1, "height": 1}
        adapter = ProbeGridRunAdapter([(0, 0), (1, 0)], {
            (0, 0): GridRunAdapter.ITEM_TEXT, (1, 0): neighbor,
        })
        with patch.object(self.mod, "require_game_foreground", lambda: None), contextlib.redirect_stdout(io.StringIO()):
            self.mod.run_repricing(config, adapter, preflight_done=True)
            self.assertEqual(adapter.actions.count("copy:1,0"), 1)
            self.assertEqual(adapter.actions.count("open:1,0"), 1)
            self.mod.run_repricing(config, adapter, preflight_done=True)
        self.assertEqual(adapter.actions.count("copy:1,0"), 2)
        self.assertEqual(adapter.actions.count("open:1,0"), 2)

    def test_preflight_done_skips_first_check_but_retains_periodic_check(self):
        adapter = GridRunAdapter([(column, 0) for column in range(12)] + [(0, 1)],
                                 shared_item=False, mutate_text=False)
        with patch.object(self.mod, "require_game_foreground", lambda: None), contextlib.redirect_stdout(io.StringIO()):
            self.mod.run_repricing(self.repricing_config(width=1, height=1), adapter, preflight_done=True)
        self.assertEqual(adapter.actions.count("validate_page"), 1)
        self.assertEqual(adapter.actions.count("validate_grid"), 1)
        self.assertEqual(adapter.actions.count("clear_grid_hover"), 1)
        self.assertEqual(adapter.actions.count("click_submit"), 13)

    def test_run_stages_and_opt_in_timing_preserve_submission_checks(self):
        output, timing = io.StringIO(), io.StringIO()
        adapter = GridRunAdapter([(0, 0), (1, 0)], shared_item=False, mutate_text=False)
        with patch.object(self.mod, "require_game_foreground", lambda: None), \
                patch.dict(self.mod.os.environ, {"FAUSTUS_TIMING": "1"}), \
                contextlib.redirect_stdout(output), contextlib.redirect_stderr(timing):
            self.mod.run_repricing(self.repricing_config(width=1, height=1), adapter, preflight_done=True)
        events = [json.loads(line[6:]) for line in output.getvalue().splitlines() if line.startswith("EVENT ")]
        stages = [event["stage"] for event in events if event["event"] == "stage"]
        self.assertEqual(stages, ["scanning"] + ["probing", "opening", "pricing", "submitting"] * 2)
        measurements = [json.loads(line[len("FAUSTUS_TIMING "):]) for line in timing.getvalue().splitlines()]
        self.assertTrue({"occupancy_scan", "footprint_probe", "open_price_window", "submission_check", "submit_to_next_window"}
                        .issubset({entry["stage"] for entry in measurements}))
        self.assertNotIn("术士长袍", timing.getvalue())
        for measurement in measurements:
            self.assertTrue(set(measurement).issubset({"stage", "ms", "cached"}))
        silent = io.StringIO()
        with patch.dict(self.mod.os.environ, {"FAUSTUS_TIMING": "0"}), contextlib.redirect_stderr(silent):
            self.mod.trace_run_timing("probe", self.mod.time.perf_counter())
        self.assertEqual(silent.getvalue(), "")

    @staticmethod
    def price_candidates(currency="混沌石"):
        def box(left, top, right, bottom):
            return [[left, top], [right, top], [right, bottom], [left, bottom]]

        return [
            {"text": "设置物品价格", "score": 0.99, "box": box(300, 100, 450, 125)},
            {"text": currency, "score": 0.99, "box": box(600, 200, 680, 225)},
            {"text": "上架物品", "score": 0.99, "box": box(550, 350, 680, 380)},
        ]

    def test_page_and_grid_anchors_fail_closed(self):
        valid = [
            {"text": "商人", "score": 0.99, "box": [[0, 0], [10, 0], [10, 10], [0, 10]]},
            {"text": "商店", "score": 0.98, "box": [[0, 12], [10, 12], [10, 22], [0, 22]]},
        ]
        self.assertEqual(self.mod.validate_page_anchors(valid), (True, "page_ok"))
        self.assertEqual(self.mod.validate_page_anchors(valid[:1]), (False, "page_anchor_missing"))
        self.assertEqual(
            self.mod.validate_grid_calibration({"left": 10, "top": 20, "right": 1210, "bottom": 1220, "scaleFactor": 1}),
            (True, "grid_ok"),
        )
        self.assertEqual(self.mod.validate_grid_calibration({"left": 10, "top": 20, "right": 1210, "bottom": 900, "scaleFactor": 1})[0], False)

    def test_recognition_preflight_only_checks_foreground_before_any_adapter_input(self):
        config = {
            "gridCalibration": {"left": 10, "top": 20, "right": 1210, "bottom": 1220, "scaleFactor": 1},
        }
        original_foreground = self.mod.is_game_foreground
        try:
            adapter = FakePreflightAdapter()
            self.mod.is_game_foreground = lambda: True
            self.mod.perform_readonly_preflight(config, adapter)
            self.assertEqual(adapter.actions, ["validate_page", "validate_grid"])

            blocked = FakePreflightAdapter()
            self.mod.is_game_foreground = lambda: False
            with self.assertRaises(self.mod.PageAbort) as failure:
                self.mod.perform_readonly_preflight(config, blocked)
            self.assertEqual(failure.exception.reason_code, "game_not_foreground")
            self.assertEqual(blocked.actions, [])
        finally:
            self.mod.is_game_foreground = original_foreground

    def test_item_identity_returns_only_safe_display_name(self):
        copied = "物品类别: 护甲\n稀 有 度: 稀有\n测试物品\n术士长袍\n--------\n品质: +20%"
        item = self.mod.identify_copied_item(copied)
        self.assertEqual(item["itemName"], "测试物品")
        self.assertNotIn("clipboard", item)
        self.assertNotIn("fingerprint", item)
        self.assertEqual(self.mod.best_effort_item_name(copied), "测试物品")
        self.assertEqual(self.mod.identify_copied_item("任意非空文本")["itemName"], "任意非空文本")

    def test_price_window_test_mode_and_helpers_are_removed(self):
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertNotIn('"price-window-test"', source)
        self.assertFalse(hasattr(self.mod, "run_price_window_test"))
        self.assertFalse(hasattr(self.mod, "_find_first_item"))

    def test_generic_model_only_skips_high_confidence_empty_cells(self):
        probabilities = [[0.0005, 0.0005, 0.999] for _ in range(144)]
        probabilities[0] = [0.90, 0.05, 0.05]
        probabilities[1] = [0.05, 0.90, 0.05]
        probabilities[2] = [0.10, 0.10, 0.80]
        cells, skipped = self.mod.select_market_candidate_cells(probabilities)
        self.assertEqual(cells, [(0, 0), (1, 0), (2, 0)])
        self.assertEqual(skipped, 141)

    def test_clipboard_probe_recovers_multicell_item_from_internal_visual_hit(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            occupied = {
                (column, row): GridRunAdapter.ITEM_TEXT
                for row in range(2) for column in range(2)
            }
            adapter = ProbeGridRunAdapter([(1, 1)], occupied)
            with contextlib.redirect_stdout(io.StringIO()):
                self.mod.run_repricing(self.repricing_config(), adapter)
            self.assertEqual(adapter.actions.count("click_submit"), 1)
            self.assertEqual(sum(action.startswith("open:") for action in adapter.actions), 1)
        finally:
            self.mod.require_game_foreground = original_gate

    def test_clipboard_probe_separates_adjacent_items_with_different_text(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            occupied = {
                **{(column, row): GridRunAdapter.ITEM_TEXT for row in range(2) for column in range(2)},
                **{(column, row): ProbeGridRunAdapter.OTHER_ITEM_TEXT for row in range(2) for column in range(2, 4)},
            }
            adapter = ProbeGridRunAdapter([(1, 0), (2, 0)], occupied)
            with contextlib.redirect_stdout(io.StringIO()):
                self.mod.run_repricing(self.repricing_config(), adapter)
            self.assertEqual(adapter.actions.count("click_submit"), 2)
        finally:
            self.mod.require_game_foreground = original_gate

    def test_clipboard_probe_keeps_identical_multicell_multiple_placements_ambiguous(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            occupied = {(column, 0): GridRunAdapter.ITEM_TEXT for column in range(3)}
            adapter = ProbeGridRunAdapter([(1, 0)], occupied)
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                self.mod.run_repricing(self.repricing_config(width=2, height=1), adapter)
            self.assertFalse(any(action.startswith("open:") for action in adapter.actions))
            self.assertIn('"reasonCode": "item_footprint_ambiguous"', output.getvalue())
        finally:
            self.mod.require_game_foreground = original_gate

    def test_clipboard_probe_retries_one_transient_empty_result(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            occupied = {(0, 0): GridRunAdapter.ITEM_TEXT, (1, 0): GridRunAdapter.ITEM_TEXT}
            adapter = ProbeGridRunAdapter(
                [(0, 0)], occupied,
                copy_sequences={(1, 0): ["", GridRunAdapter.ITEM_TEXT]},
            )
            with contextlib.redirect_stdout(io.StringIO()):
                self.mod.run_repricing(self.repricing_config(width=2, height=1), adapter)
            self.assertEqual(adapter.actions.count("copy:1,0"), 2)
            self.assertEqual(adapter.actions.count("click_submit"), 1)
        finally:
            self.mod.require_game_foreground = original_gate

    def test_clipboard_probe_persistent_empty_is_cached_and_safely_skipped(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            occupied = {(0, 0): GridRunAdapter.ITEM_TEXT}
            adapter = ProbeGridRunAdapter([(0, 0)], occupied)
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                self.mod.run_repricing(self.repricing_config(width=2, height=1), adapter)
            self.assertEqual(adapter.actions.count("copy:1,0"), 2)
            self.assertFalse(any(action.startswith("open:") for action in adapter.actions))
            self.assertIn('"reasonCode": "item_footprint_ambiguous"', output.getvalue())
        finally:
            self.mod.require_game_foreground = original_gate

    def test_multicell_item_is_repriced_once_even_when_copied_text_changes_after_submit(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            for width, height in ((2, 2), (1, 4), (2, 3), (2, 4)):
                cells = [(column, row) for row in range(height) for column in range(width)]
                adapter = GridRunAdapter(list(reversed(cells)), shared_item=True, mutate_text=True)
                with self.subTest(width=width, height=height), contextlib.redirect_stdout(io.StringIO()):
                    self.mod.run_repricing(self.repricing_config(width=width, height=height), adapter)
                self.assertEqual(adapter.actions.count("click_submit"), 1)
                self.assertEqual(sum(action.startswith("open:") for action in adapter.actions), 1)
        finally:
            self.mod.require_game_foreground = original_gate

    def test_identical_independent_single_cell_items_are_each_repriced_once(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            adapter = GridRunAdapter([(0, 0), (1, 0)], shared_item=False, mutate_text=False)
            with contextlib.redirect_stdout(io.StringIO()):
                self.mod.run_repricing(self.repricing_config(width=1, height=1), adapter)
            self.assertEqual(adapter.actions.count("click_submit"), 2)
        finally:
            self.mod.require_game_foreground = original_gate

    def test_unknown_or_visually_incomplete_footprint_never_opens_price_window(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            unknown = GridRunAdapter([(0, 0)], shared_item=True)
            unknown_output = io.StringIO()
            config = self.repricing_config()
            config["item_footprints"] = {"schemaVersion": 1, "items": {}, "categories": {}}
            with contextlib.redirect_stdout(unknown_output):
                self.mod.run_repricing(config, unknown)
            self.assertFalse(any(action.startswith("open:") for action in unknown.actions))
            self.assertIn('"reasonCode": "item_footprint_unknown"', unknown_output.getvalue())

            incomplete = GridRunAdapter([(0, 0), (1, 0), (0, 1)], shared_item=True)
            incomplete_output = io.StringIO()
            with contextlib.redirect_stdout(incomplete_output):
                self.mod.run_repricing(self.repricing_config(), incomplete)
            self.assertFalse(any(action.startswith("open:") for action in incomplete.actions))
            self.assertIn('"reasonCode": "item_footprint_ambiguous"', incomplete_output.getvalue())
        finally:
            self.mod.require_game_foreground = original_gate

    def test_locked_item_without_price_window_is_skipped_and_next_item_is_repriced(self):
        self_module = self.mod

        class LockedFirstAdapter(GridRunAdapter):
            def __init__(self):
                super().__init__([(0, 0), (1, 0)], shared_item=False, mutate_text=False)

            def open_price_at(self, column, row):
                if (column, row) == (0, 0):
                    self.actions.append("open:0,0")
                    self.window_open = False
                    raise self_module.ItemSkip("price_window_anchor_missing")
                super().open_price_at(column, row)

        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            adapter = LockedFirstAdapter()
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                self.mod.run_repricing(self.repricing_config(width=1, height=1), adapter)
            events = [json.loads(line[6:]) for line in output.getvalue().splitlines()
                      if line.startswith("EVENT ")]
            items = [event for event in events if event["event"] == "item"]
            self.assertEqual([item["reasonCode"] for item in items],
                             ["price_window_anchor_missing", "repriced"])
            self.assertEqual(adapter.actions.count("click_submit"), 1)
            self.assertEqual(events[-1]["event"], "completed")
        finally:
            self.mod.require_game_foreground = original_gate

    def test_periodic_validation_clears_hover_after_skipped_item(self):
        self_module = self.mod

        class HoverSensitiveAdapter(GridRunAdapter):
            UNKNOWN_TEXT = "物品类别: 未知\n稀有度: 稀有\n未知物品\n--------"

            def __init__(self):
                super().__init__([(column, 0) for column in range(12)] + [(0, 1)],
                                 shared_item=False, mutate_text=False)
                self.hovering_grid = False

            def copy_item_at(self, column, row):
                self.hovering_grid = True
                if (column, row) == (11, 0):
                    return self.UNKNOWN_TEXT
                return super().copy_item_at(column, row)

            def clear_grid_hover(self):
                self.actions.append("clear_grid_hover")
                self.hovering_grid = False

            def validate_grid_structure(self):
                if self.hovering_grid:
                    raise self_module.PageAbort("grid_structure_invalid")
                super().validate_grid_structure()

        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            adapter = HoverSensitiveAdapter()
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                self.mod.run_repricing(self.repricing_config(width=1, height=1), adapter)
            events = [json.loads(line[6:]) for line in output.getvalue().splitlines()
                      if line.startswith("EVENT ")]
            reasons = [event.get("reasonCode") for event in events if event["event"] == "item"]
            self.assertIn("item_footprint_unknown", reasons)
            self.assertEqual(adapter.actions.count("clear_grid_hover"), 2)
            self.assertEqual(events[-1]["event"], "completed")
        finally:
            self.mod.require_game_foreground = original_gate

    def test_footprint_geometry_enumerates_in_bounds_non_overlapping_rectangles(self):
        footprint = {"width": 2, "height": 2}
        rectangles = self.mod.candidate_footprint_rectangles((4, 4), footprint, set())
        self.assertEqual(len(rectangles), 4)
        self.assertIn({(4, 4), (5, 4), (4, 5), (5, 5)}, rectangles)
        self.assertEqual(
            self.mod.candidate_footprint_rectangles((0, 0), footprint, set()),
            [{(0, 0), (1, 0), (0, 1), (1, 1)}],
        )
        self.assertNotIn(
            {(4, 4), (5, 4), (4, 5), (5, 5)},
            self.mod.candidate_footprint_rectangles((4, 4), footprint, {(5, 5)}),
        )

    def test_failed_multicell_item_is_not_retried_from_another_covered_cell(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            adapter = GridRunAdapter([(0, 0), (1, 0), (0, 1), (1, 1)], shared_item=True)
            config = self.repricing_config()
            config["bands"][0]["start"] = "200"
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                self.mod.run_repricing(config, adapter)
            self.assertEqual(sum(action.startswith("open:") for action in adapter.actions), 1)
            self.assertEqual(adapter.actions.count("click_submit"), 0)
            self.assertEqual(output.getvalue().count('"reasonCode": "no_matching_band"'), 1)
        finally:
            self.mod.require_game_foreground = original_gate

    def test_read_price_uses_exact_double_click_select_copy_order_and_full_clipboard_integer(self):
        adapter = FakeAdapter(clipboard_values=["1000"])
        self.assertEqual(self.mod.read_full_price(adapter), 1000)
        self.assertEqual(adapter.actions, [
            "double_click_price", "hotkey:ctrl+a", "hotkey:ctrl+c", "read_clipboard"
        ])
        for invalid in ("000", "0", "1,000", "1000 混沌石", ""):
            with self.assertRaises(self.mod.ItemSkip):
                self.mod.parse_positive_price(invalid)
        self.assertEqual(self.mod.parse_positive_price("1000"), 1000)

    def test_currency_ocr_requires_exact_unique_high_confidence_text(self):
        box = [[0, 0], [20, 0], [20, 10], [0, 10]]
        self.assertEqual(self.mod.select_unique_currency([{"text": "混沌石", "score": 0.99, "box": box}]), "chaos")
        self.assertEqual(self.mod.select_unique_currency([{"text": "神圣石", "score": 0.99, "box": box}]), "divine")
        for candidates in (
            [{"text": "混沌石", "score": 0.70, "box": box}],
            [{"text": "混沌石", "score": 0.99, "box": box}, {"text": "混沌石", "score": 0.98, "box": box}],
            [{"text": "点金石", "score": 0.99, "box": box}],
        ):
            with self.assertRaises(self.mod.ItemSkip):
                self.mod.select_unique_currency(candidates)

    def test_fixture_ocr_finds_currency_words_but_never_uses_visual_price(self):
        fixture = ROOT / "test" / "fixtures" / "faustus"
        current = self.mod.ocr_image(fixture / "current-chaos-control.png")
        dropdown = self.mod.ocr_image(fixture / "currency-dropdown.png")
        truncated = self.mod.ocr_image(fixture / "truncated-1000-control.png")
        self.assertIn("混沌石", [item["text"] for item in current])
        self.assertEqual(self.mod.select_unique_currency(current), "chaos")
        self.assertIn("chaos", self.mod.find_dropdown_currencies(dropdown))
        self.assertIn("divine", self.mod.find_dropdown_currencies(dropdown))
        self.assertIn("000", [item["text"] for item in truncated])
        self.assertEqual(self.mod.read_full_price(FakeAdapter(clipboard_values=["1000"])), 1000)

    def test_currency_change_writes_price_then_selects_currency_and_submits_once(self):
        for old, new in (("divine", "chaos"), ("chaos", "divine")):
            with self.subTest(old=old, new=new):
                adapter = FakeAdapter()
                result = self.mod.execute_price_transaction(adapter, {
                    "newPrice": 360, "newCurrency": new, "oldCurrency": old})
                self.assertEqual(result, "repriced")
                self.assertEqual(adapter.actions, [
                    "write_clipboard:360", "hotkey:ctrl+v",
                    "choose_currency:" + new, "click_submit",
                ])

    def test_same_currency_writes_price_and_submits_without_rechecking(self):
        adapter = FakeAdapter()
        result = self.mod.execute_price_transaction(adapter, {
            "newPrice": 90, "newCurrency": "chaos", "oldCurrency": "chaos",
        })
        self.assertEqual(result, "repriced")
        self.assertEqual(adapter.actions, [
            "write_clipboard:90", "hotkey:ctrl+v",
            "click_submit",
        ])

    def test_successful_same_currency_repricing_uses_two_ocr_passes(self):
        adapter = self.make_counting_game_adapter([
            self.price_candidates("混沌石"),
            [],
        ], ["100"])

        adapter.open_price_at(0, 0)
        old_price = self.mod.read_full_price(adapter)
        old_currency = adapter.recognize_current_currency()
        self.assertEqual((old_price, old_currency), (100, "chaos"))
        self.mod.execute_price_transaction(adapter, {
            "newPrice": 90, "newCurrency": "chaos", "oldCurrency": "chaos",
        })
        self.assertEqual(adapter.submission_result(), "repriced")

        self.assertEqual(adapter.ocr_count, 2)
        self.assertIsNone(adapter._price_context)
        self.assertFalse(adapter.price_window_open())
        self.assertEqual(adapter.ocr_count, 2)

    def test_successful_currency_change_repricing_uses_three_ocr_passes(self):
        divine_option = self.price_candidates("神圣石")[1]
        divine_option["box"] = [[600, 270], [680, 270], [680, 295], [600, 295]]
        adapter = self.make_counting_game_adapter([
            self.price_candidates("混沌石"),
            [divine_option],
            [],
        ], ["200"])

        adapter.open_price_at(0, 0)
        self.assertEqual(self.mod.read_full_price(adapter), 200)
        self.assertEqual(adapter.recognize_current_currency(), "chaos")
        self.mod.execute_price_transaction(adapter, {
            "newPrice": 1, "newCurrency": "divine", "oldCurrency": "chaos",
        })
        self.assertEqual(adapter.submission_result(), "repriced")

        self.assertEqual(adapter.ocr_count, 3)
        self.assertIsNone(adapter._price_context)

    def test_submission_result_reuses_one_snapshot_for_warning_and_window_state(self):
        warning = {"text": "操作太频繁，请等待冷却", "score": 0.99,
                   "box": [[100, 50], [300, 50], [300, 80], [100, 80]]}
        adapter = self.make_counting_game_adapter([
            [*self.price_candidates("混沌石"), warning],
        ], [])

        self.assertEqual(adapter.submission_result(), "submit_warning")
        self.assertTrue(adapter.price_window_open())
        self.assertEqual(adapter.ocr_count, 1)

        abnormal = self.make_counting_game_adapter([
            self.price_candidates("混沌石"),
        ], [])
        self.assertEqual(abnormal.submission_result(), "submit_abnormal")
        self.assertTrue(abnormal.price_window_open())
        self.assertEqual(abnormal.ocr_count, 1)

    def test_price_context_is_invalidated_between_items_and_after_close(self):
        adapter = self.make_counting_game_adapter([
            self.price_candidates("混沌石"),
            [self.price_candidates()[0]],
            [self.price_candidates()[1]],
        ], [])
        adapter.open_price_at(0, 0)
        first_context = adapter._price_context
        adapter.open_price_at(1, 0)
        self.assertEqual(adapter.ocr_count, 3)
        self.assertIsNot(adapter._price_context, first_context)

        closing = self.make_counting_game_adapter([
            self.price_candidates("混沌石"),
            [],
        ], [])
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            closing.open_price_at(0, 0)
            self.assertTrue(self.mod.safe_close_price_window(closing))
            self.assertEqual(closing.ocr_count, 2)
            self.assertIsNone(closing._price_context)
            self.assertFalse(closing._price_window_open_observation)
        finally:
            self.mod.require_game_foreground = original_gate

    def test_layout_reuse_reads_each_items_currency_and_price_in_small_regions(self):
        first, second = self.price_candidates(), self.price_candidates("神圣石")
        adapter = self.make_counting_game_adapter([first, [], [second[0]], [second[1]]], ["1000", "2"])
        adapter.open_price_at(0, 0)
        self.assertEqual(self.mod.read_full_price(adapter), 1000)
        self.assertEqual(adapter.recognize_current_currency(), "chaos")
        self.mod.execute_price_transaction(adapter, {"oldCurrency": "chaos", "newCurrency": "chaos", "newPrice": 900})
        self.assertEqual(adapter.submission_result(), "repriced")
        layout = adapter._price_layout
        adapter.open_price_at(1, 0)
        self.assertEqual(self.mod.read_full_price(adapter), 2)
        self.assertEqual(adapter.recognize_current_currency(), "divine")
        self.assertIs(adapter._price_layout, layout)
        self.assertNotIn("currencyCode", layout)
        regions = [action[1] for action in adapter.actions if action[0] == "ocr"]
        self.assertLess(sum(r["width"] * r["height"] for r in regions[-2:]), 800000 * 0.1)
        fresh = self.make_counting_game_adapter([second], [])
        fresh.open_price_at(0, 0)
        self.assertEqual(fresh.actions[1], ("ocr", fresh._popup_region()))

    def test_local_uncertainty_and_geometry_changes_fall_back_to_full_recognition(self):
        first = self.price_candidates()
        moved = self.price_candidates("神圣石")
        for candidate in moved:
            candidate["box"] = [[x + 15, y + 15] for x, y in candidate["box"]]
        low = {**first[1], "score": 0.2}
        cases = ([[]], [[moved[0]]], [[first[0]], []],
                 [[first[0]], [low]], [[first[0]], [first[1], first[1]]],
                 [[first[0]], [moved[1]]])
        for local in cases:
            with self.subTest(local=local):
                adapter = self.make_counting_game_adapter([first, *local, moved], [])
                adapter.open_price_at(0, 0)
                old_layout = adapter._price_layout
                adapter.open_price_at(1, 0)
                self.assertEqual(adapter.recognize_current_currency(), "divine")
                self.assertIsNot(adapter._price_layout, old_layout)
                self.assertEqual(adapter._price_layout["title"]["box"], moved[0]["box"])
                self.assertEqual(adapter.actions[-1], ("ocr", adapter._popup_region()))

    def test_popup_bounds_change_bypasses_local_layout_and_failure_never_types(self):
        adapter = self.make_counting_game_adapter([self.price_candidates(), []], [])
        adapter.open_price_at(0, 0)
        adapter._popup_region = lambda: {"left": 10, "top": 0, "width": 1000, "height": 800}
        with self.assertRaises(self.mod.ItemSkip):
            adapter.open_price_at(1, 0)
        self.assertIsNone(adapter._price_context)
        self.assertIsNone(adapter._price_layout)
        self.assertFalse(any(action[0] in ("hotkey", "write") for action in adapter.actions))
        self.assertEqual(adapter.ocr_count, 2)

    def test_local_and_full_failure_clear_layout_without_price_input(self):
        adapter = self.make_counting_game_adapter([self.price_candidates(), [], []], [])
        adapter.open_price_at(0, 0)
        with self.assertRaises(self.mod.ItemSkip):
            adapter.open_price_at(1, 0)
        self.assertIsNone(adapter._price_layout)
        self.assertIsNone(adapter._price_context)
        self.assertFalse(any(action[0] in ("hotkey", "write") for action in adapter.actions))

    def test_direct_paste_replaces_selected_price_before_changing_currency(self):
        class SelectedPriceAdapter(FakeAdapter):
            def __init__(self, price):
                super().__init__()
                self.value, self.clipboard, self.selected = price, "", False

            def hotkey(self, *keys):
                super().hotkey(*keys)
                if keys == ("ctrl", "a"):
                    self.selected = True
                elif keys == ("ctrl", "c"):
                    self.clipboard = self.value if self.selected else ""
                elif keys == ("ctrl", "v"):
                    self.value = self.clipboard if self.selected else self.value + self.clipboard
                    self.selected = False

            def read_clipboard(self):
                return self.clipboard

            def write_clipboard(self, value):
                self.clipboard = value

        for old_price, new_price in (("1000", 9), ("2", 360), ("100", 90)):
            for old, new in (("chaos", "chaos"), ("chaos", "divine"), ("divine", "chaos")):
                with self.subTest(price=old_price, old=old, new=new):
                    adapter = SelectedPriceAdapter(old_price)
                    self.assertEqual(self.mod.read_full_price(adapter), int(old_price))
                    self.mod.execute_price_transaction(adapter, {
                        "oldCurrency": old, "newCurrency": new, "newPrice": new_price})
                    self.assertEqual(adapter.value, str(new_price))
                    self.assertEqual(adapter.actions.count("double_click_price"), 1)
                    self.assertEqual(adapter.actions.count("hotkey:ctrl+a"), 1)
                    self.assertEqual(adapter.actions.count("click_submit"), 1)

    def test_timing_is_opt_in_and_contains_only_numeric_metrics(self):
        adapter = self.make_counting_game_adapter([], [])
        with patch.dict(self.mod.os.environ, {"FAUSTUS_TIMING": "0"}), contextlib.redirect_stderr(io.StringIO()) as output:
            adapter.trace_timing("ocr", self.mod.time.perf_counter(), pixels=100)
        self.assertEqual(output.getvalue(), "")
        with patch.dict(self.mod.os.environ, {"FAUSTUS_TIMING": "1"}), contextlib.redirect_stderr(io.StringIO()) as output:
            adapter.trace_timing("ocr", self.mod.time.perf_counter(), pixels=100)
        data = json.loads(output.getvalue().removeprefix("FAUSTUS_TIMING "))
        self.assertEqual(set(data), {"stage", "ms", "pixels"})
        self.assertGreaterEqual(data["ms"], 0)

    def test_currency_dropdown_failure_never_submits(self):
        adapter = self.make_counting_game_adapter([
            self.price_candidates("混沌石"),
            [],
        ], [])
        adapter.open_price_at(0, 0)
        with self.assertRaises(self.mod.ItemSkip) as failure:
            adapter.choose_currency("divine")
        self.assertEqual(failure.exception.reason_code, "currency_option_uncertain")
        submit_point = tuple(round(value) for value in self.mod._box_center(
            adapter._price_context["submit"]["box"]
        ))
        self.assertFalse(any(action[0] == "click" and action[1] == submit_point
                             for action in adapter.actions if isinstance(action, tuple)))

    def test_safe_close_requires_known_window_and_confirms_it_closed(self):
        adapter = FakeAdapter()
        self.assertTrue(self.mod.safe_close_price_window(adapter))
        self.assertEqual(adapter.actions, ["price_window_open", "press_escape", "price_window_open"])
        unknown = FakeAdapter()
        unknown.window_open = False
        with self.assertRaises(self.mod.PageAbort):
            self.mod.safe_close_price_window(unknown)

        close_failed = FakeAdapter()
        close_failed.press_escape = lambda: close_failed.actions.append("press_escape")
        with self.assertRaises(self.mod.PageAbort) as failure:
            self.mod.safe_close_price_window(close_failed)
        self.assertEqual(failure.exception.reason_code, "price_window_close_failed")
        self.assertEqual(close_failed.actions.count("press_escape"), 2)

    def test_run_emits_only_structured_success_and_stable_skip_events(self):
        config = {
            "chaosPerDivine": "200",
            "bands": [{
                "start": "1", "end": "", "rangeCurrency": "chaos",
                "discountPercent": "10", "outputCurrency": "chaos",
            }],
            "item_footprints": {
                "schemaVersion": 1,
                "items": {"*\x1f测试物品": {"width": 1, "height": 1}},
                "categories": {},
            },
        }
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            adapter = FakeRunAdapter(clipboard_values=["100", "90"], currencies=["chaos", "chaos"])
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                self.mod.run_repricing(config, adapter)
            events = [json.loads(line[6:]) for line in output.getvalue().splitlines() if line.startswith("EVENT ")]
            items = [event for event in events if event["event"] == "item"]
            self.assertEqual(items, [{
                "event": "item", "itemName": "测试物品", "grid": "1,1",
                "oldPrice": 100, "oldCurrency": "chaos", "newPrice": 90,
                "newCurrency": "chaos", "reasonCode": "repriced",
            }])
            self.assertEqual(events[-1]["event"], "completed")
            self.assertEqual(adapter.actions.count("click_submit"), 1)
            self.assertNotIn("clipboard", items[0])
            self.assertNotIn("fingerprint", items[0])

            skipped = FakeRunAdapter(clipboard_values=["100"], currencies=["chaos"])
            skip_config = {**config, "bands": [{**config["bands"][0], "start": "200"}]}
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                self.mod.run_repricing(skip_config, skipped)
            item = next(json.loads(line[6:]) for line in output.getvalue().splitlines()
                        if line.startswith("EVENT ") and json.loads(line[6:])["event"] == "item")
            self.assertEqual(item["reasonCode"], "no_matching_band")
            self.assertNotIn("click_submit", skipped.actions)
        finally:
            self.mod.require_game_foreground = original_gate


if __name__ == "__main__":
    unittest.main()
