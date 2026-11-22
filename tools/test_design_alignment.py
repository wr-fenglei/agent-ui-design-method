"""Check alignment against original PNG pixels, including deliberately shifted artwork."""

import tempfile
import unittest
from pathlib import Path

from design_alignment import check_alignment
from design_lint import DesignLint
from test_design_palette import write_pixels


PAPER = (255, 255, 255)
BLUE = (32, 65, 125)
INK = (36, 36, 40)


class AlignmentTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.folder = Path(tmp.name)
        self.path = self.folder / "review.png"
        self.default = {"on": "review", "box": [7, 17, 78, 38]}
        self.states = {"review": {"primary": "save"}, "done": {"primary": None}}
        self.data = {"components": {"save": {"variants": {"default": self.default}}}}

    def run_check(self, *, primary_offset=0, peer_offset=0, peer_height=32, final="review", extra=()):
        # The primary has asymmetric shadow padding, a line icon and label.
        # The secondary has a closed 1px outline with the canvas color inside.
        peer_y = 36-peer_height//2+peer_offset
        patches = [(10, 23, 72, 32, (218, 218, 220)), (10, 20, 72, 32, BLUE),
                   (19, 34+primary_offset, 8, 2, PAPER),
                   (22, 32+primary_offset, 2, 8, PAPER),
                   (34, 32+primary_offset, 4, 8, PAPER),
                   (41, 33+primary_offset, 14, 6, PAPER),
                   (60, 21, 1, 1, PAPER),
                   (90, peer_y, 62, peer_height, INK),
                   (91, peer_y+1, 60, peer_height-2, PAPER),
                   (104, 32+peer_offset, 34, 8, INK)]
        write_pixels(self.path, [*patches, *extra])
        checker = DesignLint(self.folder)
        checker.named_files["review"] = self.path
        samples = check_alignment(checker, self.data, self.states, final)
        return samples, checker.errors

    def test_one_primary_read_from_pixels_including_padded_variant_crop(self):
        samples, errors = self.run_check(final="done")
        self.assertEqual(errors, [])
        self.assertEqual(samples[0]["surfaceBox"], [10, 20, 72, 32])
        self.assertEqual(samples[0]["inkBox"], [19, 32, 36, 8])
        self.assertEqual(samples[0]["offsetY"], 0)

    def test_real_ink_shift_and_optical_allowance(self):
        for delta in (-4, -1, 1, 3, 5):
            with self.subTest(delta=delta):
                samples, errors = self.run_check(primary_offset=delta)
                self.assertEqual(samples[0]["offsetY"], delta)
                if abs(delta) >= 4:
                    self.assertEqual(errors[0]["path"], "components.save.variants.default.box")
                    self.assertIn(f"{abs(delta)} px", errors[0]["message"])
                    self.assertIn(str(samples[0]["inkBox"]), errors[0]["message"])
                else:
                    self.assertEqual(errors, [])

    def test_cropped_surface_and_blank_or_duplicated_evidence(self):
        for box in ([10, 26, 72, 26], [26, 26, 40, 20], [70, 70, 60, 20]):
            with self.subTest(box=box):
                self.default["box"] = box
                samples, errors = self.run_check(primary_offset=5)
                self.assertEqual(samples, [])
                self.assertIn(str(box), errors[0]["message"])
        self.default.update(box=[10, 20, 72, 32], peerBox=[10, 20, 72, 32])
        self.assertIn("重叠", self.run_check()[1][0]["message"])

    def test_row_matches_real_surfaces_despite_different_crops_and_heights(self):
        self.default["peerBox"] = [86, 16, 70, 44]
        samples, errors = self.run_check(peer_height=24)
        self.assertEqual(errors, [])
        self.assertEqual(samples[1]["surfaceBox"], [91, 25, 60, 22])
        self.assertEqual(samples[1]["rowOffsetY"], 0)
        samples, errors = self.run_check(peer_offset=5)
        self.assertEqual(samples[1]["offsetY"], 0)
        self.assertEqual(samples[1]["rowOffsetY"], 5)
        self.assertIn("5 px", errors[0]["message"])
        self.assertIn("peerBox", errors[0]["path"])

    def test_explicit_top_edge_for_different_height_pair(self):
        self.default.update(peerBox=[86, 12, 70, 44], peerAlign="top")
        samples, errors = self.run_check(peer_offset=-4, peer_height=24)
        self.assertEqual(errors, [])
        self.assertEqual(samples[1]["rowOffsetY"], 1)  # secondary's 1px outline
        self.default["peerAlign"] = "bottom"
        self.assertIn("bottom", self.run_check(peer_offset=-4, peer_height=24)[1][0]["message"])

    def test_reason_is_visible_for_non_button_and_cannot_hide_measurable_offsets(self):
        self.default["alignmentReason"] = "Primary action is an inline link in a two-line paragraph."
        self.default["box"] = [5, 70, 80, 20]
        samples, errors = self.run_check(extra=[(15, 78, 30, 4, BLUE), (50, 78, 7, 4, BLUE)])
        self.assertEqual(errors, [])
        self.assertEqual(samples[0]["manualReason"], self.default["alignmentReason"])
        self.assertNotIn("offsetY", samples[0])
        self.assertIn("一个色值", self.run_check()[1][0]["message"])
        self.default["box"] = [7, 17, 78, 38]
        self.assertIn("5 px", self.run_check(primary_offset=5)[1][0]["message"])
        self.default["peerBox"] = [90, 20, 62, 32]
        self.assertIn("alignmentReason", self.run_check()[1][0]["path"])

    def test_declared_multiline_control_has_pixel_evidence(self):
        self.default["alignmentReason"] = "Stacked title and subtitle share the full action area."
        samples, errors = self.run_check(extra=[(30, 44, 27, 4, PAPER)])
        self.assertEqual(errors, [])
        self.assertEqual(samples[0]["inkBands"], [[32, 39], [44, 47]])
        self.assertIn("manualReason", samples[0])

    def test_research_board_cannot_stand_in_for_the_decision_state(self):
        self.default["on"] = "research"
        self.assertIn(".on", self.run_check()[1][0]["path"])


if __name__ == "__main__":
    unittest.main()
