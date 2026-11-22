"""Verify layout findings from real PNG scanlines, including legitimate counterexamples."""

import contextlib
import io
import json
import struct
import tempfile
import unittest
import zlib
from pathlib import Path
from unittest.mock import patch

from design_density import analyze_layout, check_density, main
from design_images import load_image
from design_lint import main as manifest_main


class Screen:
    def __init__(self, width=540, height=400):
        self.width, self.height = width, height
        self.rows = [bytearray([250] * width) for _ in range(height)]

    def rect(self, x, y, w, h, gray):
        for row in self.rows[y:y+h]:
            row[x:x+w] = bytes([gray]) * w

    def words(self, x, y, letters=6, gray=35):
        for i in range(letters):
            self.rect(x + i * 6, y, 3, 11, gray)

    def save(self, path):
        def chunk(which, data):
            return struct.pack(">I", len(data)) + which + data + struct.pack(">I", zlib.crc32(which + data))
        header = struct.pack(">IIBBBBB", self.width, self.height, 8, 0, 0, 0, 0)
        raw = b''.join(b'\0' + row for row in self.rows)
        path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header)
                         + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b''))
        return path

    def fields(self, columns=(38, 140), *, wrapped=False):
        for y in (60, 115, 170, 225, 280):
            self.rect(30, y, 480, 1, 220)
        for y in (80, 135, 190, 245):
            for x in columns:
                self.words(x, y)
            if wrapped:
                self.words(columns[-1], y + 17)

    def gaps(self, positions=(65, 90, 178, 205)):
        for y in positions:
            self.words(38, y)


class Checker:
    def __init__(self, **files):
        self.named_files = files
        self.errors = []

    def issue(self, field, message):
        self.errors.append((field, message))

    @staticmethod
    def pixels(path):
        return load_image(path, pixels=True)

    def text(self, entry, key, field):
        if not isinstance(entry[key], str) or len(entry[key]) < 4:
            self.issue(field, "reason")


class LayoutTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.tmp = Path(tmp.name)

    def scan(self, screen):
        return analyze_layout(load_image(screen.save(self.tmp / "screen.png"), pixels=True))

    def test_sparse_aligned_fields_with_repeated_open_dividers(self):
        screen = Screen()
        screen.fields()
        result = self.scan(screen)["findings"]
        self.assertEqual([(f["rule"], f["linesY"]) for f in result],
                         [("repeated-dividers", [60, 115, 170, 225, 280])])
        self.assertEqual(result[0]["inkHeights"], [11]*4)

    def test_three_dividers_prompt_review_only_for_the_short_two_column_run(self):
        screen = Screen(720, 270)
        # The two regions deliberately put the field list and the comparison
        # table on the same surface. Both have aligned text above the first line.
        for left, width, columns, first, pitch in [
            (24, 270, (28, 116), 71, 36),
            (358, 334, (366, 468, 580), 86, 45),
        ]:
            for i in range(3):
                y = first + i * pitch
                for x in columns:
                    screen.words(x, y - 22)
                screen.rect(left, y, width, 2, 202)

        # With only one enclosed row, the field list has no repeated row evidence.
        screen.rect(24, 143, 270, 2, 250)
        report = self.scan(screen)
        self.assertEqual(report["findings"], [])
        self.assertEqual(report["manualReview"], [])

        screen.rect(24, 143, 270, 2, 202)
        report = self.scan(screen)
        self.assertEqual(report["findings"], [])
        note, = report["manualReview"]
        self.assertIn("[24, 71, 270, 74]", note)
        self.assertIn("y=[71, 107, 143]", note)
        self.assertIn("墨迹高 [11, 11] px", note)

    def test_three_comparison_columns_and_wrapped_text_are_not_sparse_field_rows(self):
        for columns, wrapped in [((38, 140, 290), False), ((38, 140), True)]:
            screen = Screen()
            screen.fields(columns, wrapped=wrapped)
            self.assertEqual(self.scan(screen)["findings"], [])

    def test_two_column_table_with_aligned_headers(self):
        screen = Screen()
        screen.fields()
        screen.words(38, 39)
        screen.words(140, 39)
        report = self.scan(screen)
        self.assertEqual(report["findings"], [])
        self.assertEqual(report["manualReview"], [])

    def test_verified_media_only_clears_a_finding_that_changed_inside_the_box(self):
        original = Screen()
        original.fields()
        base = original.save(self.tmp / "original.png")
        original.rect(30, 60, 480, 221, 190)
        alternate = original.save(self.tmp / "swap.png")
        states = {"review": {}}
        checker = Checker(review=base)
        checker.named_files[("media", "review")] = alternate
        verified = {"review": [[30, 60, 480, 221]]}
        found = check_density(checker, {}, states, verified)["review"]["findings"]
        self.assertEqual(checker.errors, [])
        self.assertGreater(found[0]["evidence"]["mediaChangedPixels"], 100000)
        checker.named_files[("media", "review")] = base
        check_density(checker, {}, states, verified)
        self.assertTrue(any("repeated-dividers" in msg for _, msg in checker.errors))

    def test_reserved_table_lines_need_observed_extra_aligned_columns(self):
        screen = Screen()
        screen.fields()
        base = screen.save(self.tmp / "primary.png")
        for y in (80, 135, 190, 245):
            screen.words(290, y)
        alternate = screen.save(self.tmp / "details.png")
        reason = {"rule": "repeated-dividers", "box": [30, 60, 480, 221],
                  "reason": "The details state adds the measured value in its third column",
                  "evidenceState": "details"}
        checker = Checker(review=base, details=alternate)
        states = {"review": {"layoutExceptions": [reason]}, "details": {}}
        findings = check_density(checker, {}, states)["review"]["findings"]
        self.assertEqual(checker.errors, [])
        self.assertEqual(findings[0]["evidence"]["measuredColumns"], [[38, 140, 290]] * 4)

    def test_double_divider_requires_separate_open_strokes(self):
        screen = Screen()
        screen.rect(30, 56, 480, 1, 215)
        screen.rect(30, 64, 480, 1, 215)
        item, = self.scan(screen)["findings"]
        self.assertEqual((item["rule"], item["linesY"], item["gap"]), ("double-divider", [56, 64], 7))
        # Two different adjacent antialias colors, and the edges of one control.
        screen = Screen()
        screen.rect(30, 56, 480, 1, 215)
        screen.rect(30, 57, 480, 1, 200)
        screen.rect(30, 80, 480, 1, 200)
        screen.rect(30, 90, 480, 1, 200)
        screen.rect(30, 80, 1, 11, 200)
        screen.rect(509, 80, 1, 11, 200)
        self.assertEqual(self.scan(screen)["findings"], [])

    def test_filled_toolbar_edges_are_not_dividers(self):
        screen = Screen()
        screen.rect(0, 0, 540, 55, 240)
        screen.rect(0, 55, 540, 1, 210)
        screen.rect(0, 65, 540, 1, 210)
        self.assertEqual(self.scan(screen)["findings"], [])

    def test_gap_within_text_peers_reports_neighbor_spacing(self):
        screen = Screen()
        screen.gaps()
        item, = self.scan(screen)["findings"]
        self.assertEqual((item["rule"], item["box"], item["adjacentGaps"]),
                         ("content-gap", [0, 101, 540, 77], [14, 16]))

    def test_ample_canvas_margins_and_pinned_footer_do_not_count(self):
        screen = Screen()
        screen.gaps((26, 53, 82, 349, 375))
        self.assertEqual(self.scan(screen)["findings"], [])

    def test_artwork_blocks_the_candidate_gap(self):
        screen = Screen()
        screen.gaps()
        # A mounted two-tone print with its own quiet area occupies the space.
        screen.rect(20, 110, 495, 56, 180)
        screen.rect(45, 116, 440, 43, 174)
        self.assertEqual(self.scan(screen)["findings"], [])

    def test_sparse_container_uses_the_painted_card_bounds(self):
        screen = Screen()
        screen.rect(40, 50, 460, 180, 230)
        screen.words(55, 66)
        screen.words(55, 91)
        item, = self.scan(screen)["findings"]
        self.assertEqual((item["rule"], item["box"], item["padding"]),
                         ("sparse-container", [40, 50, 460, 180], [16, 128]))
        screen.words(55, 160)
        screen.words(55, 196)
        self.assertEqual(self.scan(screen)["findings"], [])

    def test_exact_gap_can_be_occupied_in_another_state(self):
        screen = Screen()
        screen.gaps()
        base = screen.save(self.tmp / "base.png")
        screen.words(38, 118)
        screen.words(38, 145)
        alternate = screen.save(self.tmp / "alternate.png")
        reason = {"rule": "content-gap", "box": [0, 101, 540, 77],
                  "reason": "Expanded diagnostics reserve two extra lines here", "evidenceState": "details"}
        states = {"review": {"layoutExceptions": [reason]}, "details": {}}
        checker = Checker(review=base, details=alternate)
        report = check_density(checker, {}, states)
        self.assertEqual(checker.errors, [])
        evidence = report["review"]["findings"][0]["evidence"]
        self.assertEqual(evidence["occupiedBandsY"], [[118, 129], [145, 156]])

        reason["box"][0] = 1
        checker = Checker(review=base, details=alternate)
        check_density(checker, {}, states)
        self.assertTrue(any("layoutExceptions" in field for field, _ in checker.errors))
        self.assertTrue(any("content-gap" in msg for _, msg in checker.errors))

    def test_reason_without_changed_evidence_does_not_clear_the_finding(self):
        screen = Screen()
        screen.gaps()
        base = screen.save(self.tmp / "base.png")
        reason = {"rule": "content-gap", "box": [0, 101, 540, 77],
                  "reason": "Alignment with the expanded state", "evidenceState": "other"}
        checker = Checker(review=base, other=base)
        check_density(checker, {}, {"review": {"layoutExceptions": [reason]}, "other": {}})
        self.assertTrue(any("layoutExceptions" in field for field, _ in checker.errors))
        self.assertTrue(any("content-gap" in msg for _, msg in checker.errors))

    def test_first_draft_cli_needs_only_a_png(self):
        screen = Screen()
        screen.fields()
        path = screen.save(self.tmp / 'first.png')
        output = io.StringIO()
        with patch('sys.argv', ['design_density.py', str(path)]), contextlib.redirect_stdout(output):
            self.assertEqual(main(), 1)
        self.assertIn('repeated-dividers [30, 60, 480, 221]', output.getvalue())

    def test_manual_divider_review_is_visible_from_both_text_clis(self):
        screen = Screen()
        screen.fields()
        for y in (60, 115):
            screen.rect(30, y, 480, 1, 250)
        image = screen.save(self.tmp / "short.png")
        manifest = self.tmp / "screens.json"
        manifest.write_text(json.dumps({"states": {"draft": {"screen": image.name}}}))
        for cli, argv in [(main, ["design_density.py", str(image)]),
                          (manifest_main, ["design_lint.py", str(manifest), "--layout-only"])]:
            output = io.StringIO()
            with patch("sys.argv", argv), contextlib.redirect_stdout(output):
                self.assertEqual(cli(), 0)
            self.assertIn("横线组 [30, 170, 480, 111]", output.getvalue())
            self.assertIn("需人工复核", output.getvalue())


if __name__ == "__main__":
    unittest.main()
