"""Check native and screenshot evidence independently with known pixel fixtures."""

import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from design_lint import DesignLint
from design_text_layers import check_text_layers
from test_design_lint import write_screen


class TextLayerTests(unittest.TestCase):
    def setUp(self):
        temp = TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.folder = Path(temp.name).resolve()
        self.box = [200, 40, 90, 16]
        self.bg = (245, 245, 245)
        self.fg = (115, 115, 115)
        self.colors = {"ink": self.fg, "inset": self.bg, "paper": (255, 255, 255)}
        self.path = self.folder / "result.png"
        self.layer = {"id":"1:2", "name":"Field caption", "text":"Record transcription",
                      "box":self.box, "fontSize":12, "fontWeight":400, "fillHex":"#737373"}
        self.frame = {"frameId":"1:1", "width":384, "height":256, "layers":[self.layer], "issues":[]}
        self.media = {"result":[]}
        self.paint(self.fg)

    def paint(self, color):
        write_screen(self.path, 3, patches=[(*self.box, self.bg),
                     (210, 43, 1, 8, color), (215, 43, 1, 8, color), (210, 43, 6, 1, color)])

    def check(self, locator="text.json"):
        (self.folder / "text.json").write_text(json.dumps({"version":1, "states":{"result":self.frame}}))
        checker = DesignLint(self.folder)
        checker.named_files["result"] = self.path
        samples = check_text_layers(checker, {"textLayers":locator}, {"result":{}}, self.colors, self.media)
        return checker.errors, samples

    def test_small_unreported_pair_is_read_from_result_export(self):
        errors, rows = self.check()
        self.assertEqual(len(errors), 1)
        self.assertIn("4.3492", errors[0]["message"])
        self.assertEqual(rows[0]["actual"], ["#737373", "#f5f5f5"])
        self.assertEqual(rows[0]["minimum"], 4.5)

    def test_same_pair_uses_real_large_font_threshold(self):
        self.layer["fontSize"] = 24
        errors, rows = self.check()
        self.assertEqual(errors, [])
        self.assertEqual(rows[0]["minimum"], 3)
        self.layer.update(fontSize=19, fontWeight=700)
        self.assertEqual(self.check()[1][0]["minimum"], 3)

    def test_repaired_black_ink_passes(self):
        self.paint((0,0,0))
        self.layer["fillHex"] = "#000000"
        errors, rows = self.check()
        self.assertEqual(errors, [])
        self.assertEqual(rows[0]["ratio"], 19.2620)

    def test_thin_strokes_can_have_disjoint_full_pixels(self):
        aa = (151, 151, 151)
        write_screen(self.path, 3, patches=[(*self.box,self.bg), (210,43,1,8,aa), (215,43,1,8,aa),
                     (210,45,1,1,self.fg), (215,48,1,1,self.fg)])
        errors, rows = self.check()
        self.assertEqual(rows[0]["actual"][0], "#737373")
        self.assertIn("4.3492", errors[0]["message"])

    def test_antialiased_pixels_never_replace_the_solid_text_color(self):
        self.paint((119,119,119))
        errors, rows = self.check()
        self.assertEqual(errors, [])
        self.assertEqual(rows[0]["status"], "manual")
        self.assertNotIn("ratio", rows[0])

    def test_art_and_mixed_fills_are_reported_for_visual_review(self):
        self.media = {"result":[tuple(self.box)]}
        errors, rows = self.check()
        self.assertEqual(errors, [])
        self.assertIn("作品", rows[0]["reason"])
        self.layer["manualReason"] = "Native letters use two fills and weights"
        self.assertEqual(self.check()[1][0]["reason"], self.layer["manualReason"])

    def test_unseen_token_combinations_do_not_trigger_an_error(self):
        self.colors["possible"] = (126,126,126)
        self.layer.update(fillHex="#000000", fontSize=12)
        self.paint((0,0,0))
        self.assertEqual(self.check()[0], [])
        del self.colors["inset"]
        errors, rows = self.check()
        self.assertEqual(errors, [])
        self.assertEqual(rows[0]["status"], "manual")

    def test_rejects_wrong_size_duplicate_nodes_and_external_sidecar(self):
        self.frame["width"] = 307
        self.assertTrue(self.check()[0])
        self.frame["width"] = 384
        self.frame["layers"].append(dict(self.layer))
        self.assertTrue(any("ID" in i["message"] for i in self.check()[0]))
        self.assertTrue(self.check("../text.json")[0])


if __name__ == "__main__":
    unittest.main()
