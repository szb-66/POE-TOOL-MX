import importlib.util
import contextlib
import io
import json
import pathlib
import types
import unittest


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


class FakePrioritizedAdapter(FakeRunAdapter):
    def candidate_cells(self):
        return [(5, 4), (0, 0)]

    def copy_item_at(self, column, row):
        self.actions.append(f"copy:{column},{row}")
        return self.ITEM_TEXT if (column, row) == (5, 4) else ""


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

    def test_recognition_preflight_activates_game_before_any_adapter_input(self):
        config = {
            "activateGameWindow": True,
            "gridCalibration": {"left": 10, "top": 20, "right": 1210, "bottom": 1220, "scaleFactor": 1},
        }
        original_activate = self.mod.activate_game_window
        original_foreground = self.mod.is_game_foreground
        try:
            adapter = FakePreflightAdapter()
            self.mod.activate_game_window = lambda: True
            self.mod.is_game_foreground = lambda: True
            self.mod.perform_readonly_preflight(config, adapter)
            self.assertEqual(adapter.actions, ["validate_page", "validate_grid"])

            blocked = FakePreflightAdapter()
            self.mod.activate_game_window = lambda: False
            with self.assertRaises(self.mod.PageAbort) as failure:
                self.mod.perform_readonly_preflight(config, blocked)
            self.assertEqual(failure.exception.reason_code, "game_activation_failed")
            self.assertEqual(blocked.actions, [])
        finally:
            self.mod.activate_game_window = original_activate
            self.mod.is_game_foreground = original_foreground

    def test_item_identity_returns_only_safe_display_name(self):
        copied = "物品类别: 护甲\n稀 有 度: 稀有\n测试物品\n术士长袍\n--------\n品质: +20%"
        item = self.mod.identify_copied_item(copied)
        self.assertEqual(item["itemName"], "测试物品")
        self.assertNotIn("clipboard", item)
        self.assertNotIn("fingerprint", item)
        self.assertEqual(self.mod.best_effort_item_name(copied), "测试物品")
        self.assertEqual(self.mod.identify_copied_item("任意非空文本")["itemName"], "任意非空文本")

    def test_price_test_uses_visual_candidate_order_and_emits_visible_progress(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            adapter = FakePrioritizedAdapter()
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                column, row, item = self.mod._find_first_item(adapter)
            self.assertEqual((column, row, item["itemName"]), (5, 4, "测试物品"))
            self.assertEqual(adapter.actions, ["copy:5,4"])
            event = json.loads(next(line[6:] for line in output.getvalue().splitlines()
                                    if line.startswith("EVENT ")))
            self.assertEqual(event, {
                "event": "scan-progress", "current": 1, "total": 2, "column": 6, "row": 5,
            })
        finally:
            self.mod.require_game_foreground = original_gate

    def test_candidate_scan_accepts_any_fresh_nonempty_clipboard_without_format_validation(self):
        original_gate = self.mod.require_game_foreground
        self.mod.require_game_foreground = lambda: None
        try:
            adapter = FakePrioritizedAdapter()
            adapter.copy_item_at = lambda column, row: "任意非空文本" if (column, row) == (5, 4) else ""
            with contextlib.redirect_stdout(io.StringIO()):
                column, row, item = self.mod._find_first_item(adapter)
            self.assertEqual((column, row, item["itemName"]), (5, 4, "任意非空文本"))

            empty = FakePrioritizedAdapter()
            empty.copy_item_at = lambda _column, _row: ""
            with contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaises(self.mod.PageAbort) as missing:
                    self.mod._find_first_item(empty)
            self.assertEqual(missing.exception.reason_code, "no_market_item_found")
        finally:
            self.mod.require_game_foreground = original_gate

    def test_generic_model_skips_every_cell_classified_as_empty(self):
        probabilities = [[0.01, 0.01, 0.98] for _ in range(144)]
        probabilities[0] = [0.90, 0.05, 0.05]
        probabilities[1] = [0.05, 0.90, 0.05]
        probabilities[2] = [0.10, 0.10, 0.80]
        cells, skipped = self.mod.select_market_candidate_cells(probabilities)
        self.assertEqual(cells, [(0, 0), (1, 0)])
        self.assertEqual(skipped, 142)

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

    def test_footprint_geometry_rejects_multiple_out_of_bounds_and_conflicting_rectangles(self):
        footprint = {"width": 2, "height": 2}
        exact = {(4, 4), (5, 4), (4, 5), (5, 5)}
        self.assertEqual(
            self.mod.unique_footprint_slots((4, 4), footprint, exact, set(), set()),
            exact,
        )
        multiple = {(4, 4), (5, 4), (6, 4), (4, 5), (5, 5), (6, 5)}
        self.assertEqual(
            self.mod.unique_footprint_slots((5, 4), footprint, multiple, set(), set()),
            set(),
        )
        self.assertEqual(
            self.mod.unique_footprint_slots((11, 11), footprint, {(11, 11)}, set(), set()),
            set(),
        )
        self.assertEqual(
            self.mod.unique_footprint_slots((4, 4), footprint, exact, {(5, 5)}, set()),
            set(),
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

    def test_transaction_rechecks_value_and_currency_then_submits_once(self):
        adapter = FakeAdapter(clipboard_values=["360"], currencies=["chaos"])
        result = self.mod.execute_price_transaction(adapter, {"newPrice": 360, "newCurrency": "chaos", "oldCurrency": "divine"})
        self.assertEqual(result, "repriced")
        self.assertEqual(adapter.actions.count("click_submit"), 1)
        self.assertLess(adapter.actions.index("choose_currency:chaos"), adapter.actions.index("recognize_currency"))
        self.assertLess(adapter.actions.index("recognize_currency"), adapter.actions.index("click_submit"))

        mismatch = FakeAdapter(clipboard_values=["359"], currencies=["chaos"])
        with self.assertRaises(self.mod.ItemSkip):
            self.mod.execute_price_transaction(mismatch, {"newPrice": 360, "newCurrency": "chaos", "oldCurrency": "divine"})
        self.assertNotIn("click_submit", mismatch.actions)

        currency_mismatch = FakeAdapter(clipboard_values=["360"], currencies=["divine"])
        with self.assertRaises(self.mod.ItemSkip):
            self.mod.execute_price_transaction(
                currency_mismatch,
                {"newPrice": 360, "newCurrency": "chaos", "oldCurrency": "divine"},
            )
        self.assertNotIn("click_submit", currency_mismatch.actions)

    def test_successful_same_currency_repricing_uses_three_ocr_passes(self):
        adapter = self.make_counting_game_adapter([
            self.price_candidates("混沌石"),
            [self.price_candidates("混沌石")[1]],
            [],
        ], ["100", "90"])

        adapter.open_price_at(0, 0)
        old_price = self.mod.read_full_price(adapter)
        old_currency = adapter.recognize_current_currency()
        self.assertEqual((old_price, old_currency), (100, "chaos"))
        self.mod.execute_price_transaction(adapter, {
            "newPrice": 90, "newCurrency": "chaos", "oldCurrency": "chaos",
        })
        self.assertEqual(adapter.submission_result(), "repriced")

        self.assertEqual(adapter.ocr_count, 3)
        self.assertIsNone(adapter._price_context)
        self.assertFalse(adapter.price_window_open())
        self.assertEqual(adapter.ocr_count, 3)

    def test_successful_currency_change_repricing_uses_four_ocr_passes(self):
        divine_option = self.price_candidates("神圣石")[1]
        divine_option["box"] = [[600, 270], [680, 270], [680, 295], [600, 295]]
        adapter = self.make_counting_game_adapter([
            self.price_candidates("混沌石"),
            [divine_option],
            [self.price_candidates("神圣石")[1]],
            [],
        ], ["200", "1"])

        adapter.open_price_at(0, 0)
        self.assertEqual(self.mod.read_full_price(adapter), 200)
        self.assertEqual(adapter.recognize_current_currency(), "chaos")
        self.mod.execute_price_transaction(adapter, {
            "newPrice": 1, "newCurrency": "divine", "oldCurrency": "chaos",
        })
        self.assertEqual(adapter.submission_result(), "repriced")

        self.assertEqual(adapter.ocr_count, 4)
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
            self.price_candidates("混沌石"),
        ], [])
        adapter.open_price_at(0, 0)
        first_context = adapter._price_context
        adapter.open_price_at(1, 0)
        self.assertEqual(adapter.ocr_count, 2)
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
