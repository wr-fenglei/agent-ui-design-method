"""Check media-pair provenance, effective masks, and full exterior comparison."""

import struct
import tempfile
import unittest
import zlib
from pathlib import Path

from design_lint import DesignLint
from design_media import check_media
from test_design_lint import png_chunk


SIZE = (60, 40)
BOX = (8, 8, 10, 10)
INK = (44, 50, 65)
ART = (90, 130, 40)
SWAP = (180, 23, 42)


def draw(path, patches, size=SIZE, *, rgba=False):
    width, height = size
    depth = 4 if rgba else 3
    rows = [bytearray(bytes(INK + ((255,) if rgba else ())) * width) for _ in range(height)]
    for (x, y, w, h), color in patches:
        for row in rows[y:y+h]:
            row[x * depth:(x+w) * depth] = bytes(color) * w
    header = struct.pack(">IIBBBBB", width, height, 8, 6 if rgba else 2, 0, 0, 0)
    pixels = b"".join(b"\x00" + row for row in rows)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", header)
                     + png_chunk(b"IDAT", zlib.compress(pixels)) + png_chunk(b"IEND", b""))


class MediaTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.folder = Path(temporary.name).resolve()
        self.alt = self.folder / "swap.png"
        draw(self.folder / "review.png", [(BOX, ART)])
        draw(self.alt, [(BOX, SWAP)])
        self.data = {"states": {"review": {}, "saved": {}}, "media": {"states": {
            "review": {"alternate": "swap.png", "boxes": [list(BOX)]},
            "saved": {"reason": "Saved state lists the corrected date and attribution in text."},
        }}}
        self.record = self.data["media"]["states"]["review"]

    def evaluate(self):
        self.checker = DesignLint(self.folder)
        self.checker.image("review.png", "states.review.screen", "review")
        return check_media(self.checker, self.data, "review")

    def assert_failure(self, word):
        result = self.evaluate()
        self.assertNotIn("review", result)
        self.assertIn(word, str(self.checker.errors))

    def test_visible_replacement_and_immutable_chrome(self):
        draw(self.alt, [(BOX, SWAP + (255,))], rgba=True)
        self.assertEqual(self.evaluate(), {"review": [BOX], "saved": []})
        self.assertEqual(self.checker.media_samples[0]["boxes"][0]["changedPixels"], 100)
        self.assertTrue(self.checker.media_samples[0]["outsideUnchanged"])

    def test_each_region_must_change(self):
        self.record["boxes"].append([37, 6, 8, 8])
        self.assert_failure("boxes[1]")

    def test_even_one_drifting_pixel_between_two_slots_fails(self):
        other = (26, 8, 10, 10)
        self.record["boxes"].append(list(other))
        draw(self.alt, [(BOX, SWAP), (other, SWAP), ((24, 12, 1, 1), (45, 50, 65))])
        self.assert_failure("(24, 12)")
        self.assertFalse(self.checker.media_samples[0]["outsideUnchanged"])

    def test_duplicate_one_pixel_limited_area_and_insignificant_deltas(self):
        for changes, expected in [
            ([(BOX, ART)], "只有 0 个像素"),
            ([(BOX, ART), ((10, 10, 1, 1), SWAP)], "只有 1 个像素"),
            ([(BOX, ART), ((10, 10, 3, 3), SWAP)], "至少需要 10 个"),
            ([(BOX, (101, 130, 40))], "只有 0 个像素"),
        ]:
            with self.subTest(changes=changes):
                draw(self.alt, changes)
                self.assert_failure(expected)

    def test_invisible_transparency_changes_do_not_count(self):
        draw(self.folder / "review.png", [(BOX, ART + (0,))], rgba=True)
        draw(self.alt, [(BOX, SWAP + (0,))], rgba=True)
        self.assert_failure("只有 0 个像素")

    def test_wide_overlapping_or_out_of_bounds_exclusions(self):
        for boxes, expected in [
            ([[0, 0, 60, 40]], "5%"),
            ([[0, 0, 30, 40], [30, 0, 29, 40]], "5%"),
            ([list(BOX), [10, 10, 20, 20]], "重叠"),
            ([[60, 0, 1, 5]], "位于原图内"),
        ]:
            with self.subTest(boxes=boxes):
                self.record["boxes"] = boxes
                self.assert_failure(expected)

    def test_masks_cannot_cover_independently_tagged_interface(self):
        self.data["contrast"] = [{"state": "review", "fgAt": [9, 10]}]
        self.assert_failure("覆盖")
        del self.data["contrast"]
        self.data["components"] = {"accept": {"variants": {"default": {"on": "review", "box": [17, 17, 3, 3]}}}}
        self.assert_failure("覆盖")

    def test_missing_or_differently_sized_alternate(self):
        draw(self.alt, [(BOX, SWAP)], size=(61, 40))
        self.assert_failure("尺寸")
        self.alt.unlink()
        self.assert_failure("alternate")

    def test_all_states_accounted_and_no_media_requires_specific_reason(self):
        declared = self.data["media"]["states"]
        del declared["saved"]
        declared["ghost"] = {"reason": "Another state shows only dates."}
        self.assertEqual(self.evaluate(), {"review": [BOX]})
        self.assertIn("media.states.saved", str(self.checker.errors))
        self.assertIn("media.states.ghost", str(self.checker.errors))
        for reason in ("TODO", "No media", "没有可替换作品"):
            declared["review"] = {"reason": reason}
            self.assert_failure("reason")
        declared["review"] = {"reason": "The panel shows only dates.", "boxes": [list(BOX)]}
        self.assert_failure("alternate")


if __name__ == "__main__":
    unittest.main()
