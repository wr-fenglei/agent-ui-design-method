"""Exercise the design lint CLI with synthetic artwork in a temporary directory."""

import json
import shutil
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
WIDTH, HEIGHT = 384, 256
INK = (44, 46, 52)
PAPER = (255, 255, 255)
ACTION = (32, 32, 32)


def png_chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))


def write_screen(path, variant, *, ink=INK, width=WIDTH, height=HEIGHT, rgba=False, up_filter=False, patches=()):
    """Draw known flat-color patches so every pixel probe has a known answer."""
    rows = [bytearray(bytes(PAPER) * width) for _ in range(height)]

    def fill(x, y, w, h, rgb):
        for row in rows[y : y + h]:
            row[3*x : 3*(x+w)] = bytes(rgb) * w

    fill(0, 0, 96, height, (250, 250, 250))
    fill(112, 24, 25, 10, ink)
    if variant == 1:
        fill(109, 109, 86, 44, (80, 132, 193))
    fill(112, 112, 80, 38, ACTION)
    fill(120, 128, 15, 6, PAPER)
    fill(16, 80, 18, 20, (34 + 25 * variant,) * 3)
    for patch in patches:
        fill(*patch)
    if rgba:
        for i, row in enumerate(rows):
            opaque = bytearray(b"\xff" * (4 * width))
            for channel in range(3):
                opaque[channel::4] = row[channel::3]
            rows[i] = opaque
    hdr = struct.pack(">IIBBBBB", width, height, 8, 6 if rgba else 2, 0, 0, 0)
    if up_filter:
        previous = bytearray(len(rows[0]))
        scanlines = []
        for row in rows:
            scanlines.append(b"\x02" + bytes((a - b) % 256 for a, b in zip(row, previous)))
            previous = row
        pixels = b"".join(scanlines)
    else:
        pixels = b"".join(b"\x00" + row for row in rows)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", hdr)
                     + png_chunk(b"IDAT", zlib.compress(pixels)) + png_chunk(b"IEND", b""))


def write_button(path, *, focused=True, width=86, height=44):
    rows = []
    for y in range(height):
        row = bytearray()
        for x in range(width):
            color = (80, 132, 193) if focused else PAPER
            if 3 <= x < 83 and 3 <= y < 41:
                color = ACTION
            if 11 <= x < 26 and 19 <= y < 25:
                color = PAPER
            row.extend(color)
        rows.append(b"\x00" + row)
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", header)
                     + png_chunk(b"IDAT", zlib.compress(b"".join(rows))) + png_chunk(b"IEND", b""))


def sample_manifest():
    """The strings describe a fictional review flow used only as test input."""
    return {
        "task": "A catalog editor compares the source caption and accepts a corrected date.",
        "reference": {"case": "shadcn-ui"},
        "finalState": "review",
        "states": {
            "review": {"screen": "review.png", "signal": "Source caption and revised date are visible.",
                       "primary": "confirm", "secondary": "inspect"},
            "done": {"screen": "done.png", "signal": "The accepted date appears beside the catalog entry.",
                     "primary": "inspect"},
        },
        "layout": {"zones": {"index": [0, 0, 96, HEIGHT], "workspace": [96, 0, 288, HEIGHT]}},
        "type": {
            "heading": {"family": "Inter", "size": 24, "line": 30, "weight": 600},
            "body": {"family": "Inter", "size": 14, "line": 20, "weight": 400},
        },
        "colors": {"ink": {"hex": "#2c2e34"}, "paper": {"hex": "#ffffff"},
                   "side": {"hex": "#fafafa"}, "action": {"hex": "#202020"}},
        "palette": {"states": {
            state: {
                "window": {"token": "paper", "box": [200, 5, 170, 240], "sourceAt": [1428, 189]},
                "sidebar": {"token": "side", "box": [0, 0, 96, 256], "sourceAt": [4, 5]},
                "primary": {"token": "action", "box": [112, 112, 80, 38], "sourceAt": [387, 174]},
            } for state in ("review", "done")
        }},
        "media": {"states": {
            "review": None,
            "done": None,
        }},
        "contrast": [
            {"state": "review", "style": "heading", "use": "Selected record heading",
             "fg": "ink", "bg": "paper", "fgAt": [118, 28], "bgAt": [139, 28]},
            {"state": "review", "style": "body", "use": "Accept corrected date button",
             "fg": "paper", "bg": "action", "fgAt": [123, 130], "bgAt": [136, 130]},
            {"state": "done", "style": "body", "use": "Open saved catalog entry",
             "fg": "paper", "bg": "action", "fgAt": [123, 130], "bgAt": [136, 130]},
        ],
        "spacing": {"gaps": {"item": 8, "group": 16}},
        "edges": {"width": 1, "radius": 0},
        "icons": {"used": False},
        "material": {"used": False},
        "components": {
            "confirm": {
                "role": "Accept corrected date", "states": ["review"],
                "variants": {
                    "default": {"on": "review", "box": [109, 109, 86, 44]},
                    "focus": {"image": "components/focus.png"},
                },
            },
            "inspect": {"role": "Source link opens the original caption in each catalog state.",
                        "states": ["review", "done"]},
        },
    }


class DesignLintTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.folder = Path(temporary.name) / "delivery"
        self.folder.mkdir()
        (self.folder / "components").mkdir()
        self.focus = self.folder / "components" / "focus.png"
        write_button(self.focus)
        write_screen(self.folder / "review.png", 3)
        write_screen(self.folder / "done.png", 4)
        (self.folder / "process.md").write_text("Kept the source and corrected dates side by side.\n", encoding="utf-8")
        self.manifest = sample_manifest()

    def lint(self, *options, raw=None):
        manifest = self.folder / "spec.json"
        manifest.write_text(json.dumps(self.manifest) if raw is None else raw, encoding="utf-8")
        result = subprocess.run([sys.executable, str(TOOLS / "design_lint.py"), str(manifest), "--json", *options],
                                capture_output=True, text=True, timeout=20)
        try:
            report = json.loads(result.stdout)
        except ValueError:
            self.fail(f"Invalid JSON output: {result.stdout!r}\n{result.stderr}")
        self.assertIs(report["ok"], result.returncode == 0, report)
        return report

    def assert_issue(self, *path_terms):
        report = self.lint()
        self.assertFalse(report["ok"], report)
        self.assertTrue(all(error.get("message") for error in report["errors"]), report)
        paths = [error["path"] for error in report["errors"]]
        self.assertTrue(any(term in path for term in path_terms for path in paths), paths)

    def test_complete_package_still_requires_visual_review(self):
        report = self.lint()
        self.assertTrue(report["ok"], report["errors"])
        self.assertEqual(report["errors"], [])
        self.assertTrue(report["manualReview"])
        self.assertEqual(set(report["layoutSamples"]), {"review", "done"})
        heading, button, saved = report["contrastSamples"]
        self.assertEqual(saved["state"], "done")
        self.assertEqual(heading["actual"], ["#2c2e34", "#ffffff"])
        self.assertAlmostEqual(heading["ratio"], 13.57, places=2)
        self.assertEqual(button["actual"], ["#ffffff", "#202020"])
        self.assertAlmostEqual(button["ratio"], 16.29, places=2)
        self.assertTrue(report["paletteSamples"])
        self.assertEqual(report["alignmentSamples"][0]["offsetY"], 0)

    def test_missing_or_empty_required_section(self):
        del self.manifest["spacing"]
        self.manifest["type"] = {}
        self.assert_issue("spacing")
        self.assert_issue("type")

    def test_field_name_and_placeholder(self):
        self.manifest["task"] = "task"
        self.manifest["states"]["review"]["signal"] = "TODO"
        self.assert_issue("task")
        self.assert_issue("signal")

    def test_first_draft_only_needs_one_screen(self):
        self.manifest = {"states": {"draft": {"screen": "review.png"}}}
        report = self.lint("--layout-only")
        self.assertTrue(report["ok"], report)
        self.assertIn("draft", report["layoutSamples"])
        self.assertFalse(self.lint()["ok"])

    def test_malformed_json_returns_diagnostic(self):
        for raw in ('{"states": {}, "states": {}}', '{"unused": NaN}', '[]', '{'):
            with self.subTest(raw=raw):
                errors = self.lint("--layout-only", raw=raw)["errors"]
                self.assertEqual(errors[0]["path"], "$")
                self.assertTrue(errors[0]["message"])

    def test_case_requires_exactly_one_allowed_example(self):
        for case in ("unknown-case", ["linear", "apple-glass"], "../evidence"):
            with self.subTest(case=case):
                self.manifest["reference"]["case"] = case
                self.assert_issue("reference.case")

    def test_full_delivery_checks_media_before_exempting_artwork_colors(self):
        box = [250, 55, 75, 63]
        art = (*box, (52, 90, 70))
        replacement = [(*box, (168, 64, 35)), (265, 69, 9, 14, (241, 218, 188))]
        write_screen(self.folder / "review.png", 3, patches=[art])
        alternate = self.folder / "review-other.png"
        write_screen(alternate, 3, patches=replacement)
        self.manifest["media"]["states"]["review"] = {"alternate": alternate.name, "boxes": [box]}
        report = self.lint()
        self.assertTrue(report["ok"], report["errors"])
        self.assertEqual(report["mediaSamples"][0]["boxes"][0]["changedPixels"], 75 * 63)
        self.assertTrue(report["mediaSamples"][0]["outsideUnchanged"])

        write_screen(alternate, 3, patches=[*replacement, (117, 120, 1, 1, (33, 32, 32))])
        report = self.lint()
        self.assertFalse(report["ok"])
        self.assertFalse(report["mediaSamples"][0]["outsideUnchanged"])
        self.assertTrue(any("117, 120" in e["message"] for e in report["errors"]))

        write_screen(alternate, 3, patches=[(*box, PAPER)])
        report = self.lint()
        self.assertFalse(report["ok"])
        self.assertTrue(any(e["path"] == "media.states.review.boxes[0]" and "空白" in e["message"]
                            for e in report["errors"]))

    def test_export_path_cannot_leave_package(self):
        external = self.folder.parent / "external.png"
        shutil.copyfile(self.folder / "review.png", external)
        (self.folder / "link.png").symlink_to(external)
        for locator in ("../external.png", "link.png", str(external)):
            with self.subTest(locator=locator):
                self.manifest["states"]["review"]["screen"] = locator
                self.assert_issue("states.review.screen")

    def test_process_is_nonempty_markdown(self):
        (self.folder / "process.md").unlink()
        self.assert_issue("process")
        self.manifest["process"] = "review.png"
        self.assert_issue("process")
        self.manifest["process"] = "decisions.md"
        (self.folder / "decisions.md").write_text("  ")
        self.assert_issue("process")
        (self.folder / "decisions.md").write_text("The date appears alongside the source caption.")
        self.assertTrue(self.lint()["ok"])

    def test_action_must_exist_in_that_state(self):
        self.manifest["states"]["done"]["primary"] = "absent"
        self.assert_issue("primary", "components")
        self.manifest["states"]["done"]["primary"] = "confirm"
        self.assert_issue("primary", "components", "states.done")

    def test_reencoded_duplicate_state(self):
        for options in ({"rgba": True}, {"up_filter": True}):
            with self.subTest(options=options):
                write_screen(self.folder / "done.png", 3, **options)
                self.assert_issue("states")

    def test_primary_variant_evidence(self):
        variants = self.manifest["components"]["confirm"]["variants"]
        with self.subTest("missing interaction state"):
            focus = variants.pop("focus")
            self.assert_issue("variants", "components.confirm")
            variants["focus"] = focus
        with self.subTest("missing component"):
            focus["image"] = "components/absent.png"
            self.assert_issue("variants.focus.image")
        with self.subTest("unknown evidence screen"):
            variants["focus"] = {"on": "unavailable", "box": [0, 0, 86, 44]}
            self.assert_issue("variants.focus.on")
        with self.subTest("same pixels relabeled as a focus state"):
            variants["focus"] = dict(variants["default"])
            self.assert_issue("variants.focus.box")
        with self.subTest("standalone PNG must visibly differ"):
            write_button(self.focus, focused=False)
            variants["focus"] = {"image": "components/focus.png"}
            self.assert_issue("variants.focus.image")
        with self.subTest("mismatched crop size"):
            write_button(self.focus, width=42, height=20)
            variants["focus"] = {"image": "components/focus.png"}
            self.assert_issue("variants.focus")

    def test_terminal_final_screen_still_requires_action_variants(self):
        self.manifest["finalState"] = "done"
        del self.manifest["states"]["done"]["primary"]
        report = self.lint()
        self.assertTrue(report["ok"], report["errors"])
        del self.manifest["components"]["confirm"]["variants"]
        self.assert_issue("components.confirm.variants")

    def test_token_and_sampled_pixel_disagree(self):
        self.manifest["colors"]["ink"]["hex"] = "#1e3850"
        self.assert_issue("contrast", "colors")

    def test_each_exported_state_needs_its_own_text_sample(self):
        self.manifest["contrast"].pop()
        self.assert_issue("contrast.done")

    def test_material_used_requires_its_location(self):
        self.manifest["material"]["used"] = True
        self.assert_issue("material")

    def test_large_and_regular_text_thresholds(self):
        write_screen(self.folder / "review.png", 3, ink=(136, 136, 136))
        self.manifest["colors"]["ink"]["hex"] = "#888888"
        report = self.lint()
        self.assertTrue(report["ok"], report["errors"])  # 3.54:1 at 24px
        self.manifest["type"]["heading"].update(size=16, weight=400)
        self.assert_issue("contrast")  # 3.54:1 at 16px

    def test_low_measured_contrast_fails_even_for_large_text(self):
        write_screen(self.folder / "review.png", 3, ink=(172, 172, 172))
        self.manifest["colors"]["ink"]["hex"] = "#acacac"
        self.assert_issue("contrast")

    def test_geometry_and_sample_bounds(self):
        self.manifest["layout"]["zones"]["index"] = [-1, 0, 96, HEIGHT]
        self.manifest["contrast"][0]["fgAt"] = [WIDTH, 5]
        self.assert_issue("zones")
        self.assert_issue("contrast")


if __name__ == "__main__":
    unittest.main()
