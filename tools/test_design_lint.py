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
ACTION = (38, 81, 128)


def png_chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))


def write_screen(path, variant, *, ink=INK, width=WIDTH, height=HEIGHT, rgba=False, up_filter=False):
    """Draw known flat-color patches so every pixel probe has a known answer."""
    rows = [bytearray(bytes(PAPER) * width) for _ in range(height)]

    def fill(x, y, w, h, rgb):
        for row in rows[y : y + h]:
            row[3*x : 3*(x+w)] = bytes(rgb) * w

    fill(0, 0, 96, height, (230, 235, 238))
    fill(112, 24, 25, 10, ink)
    if variant == 1:
        fill(109, 109, 86, 44, (80, 132, 193))
    fill(112, 112, 80, 38, ACTION)
    fill(120, 122, 15, 6, PAPER)
    fill(16, 80, 18, 20, (34, 50 + 30*variant, 71))
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


def sample_manifest():
    """The strings describe a fictional review flow used only as test input."""
    return {
        "task": "A catalog editor compares the source caption and accepts a corrected date.",
        "reference": {
            "image": "reference.png", "source": "Fictional catalog desk, controlled test reference",
            "comparison": {
                "layout": ["Left index occupies 33% of the catalog reader.",
                           "Left index is reduced to 25% to make room for the date evidence."],
                "type": ["Reference uses a 26px heading over a 16px note.",
                         "The editor uses a 24px heading and a 14px note for the narrower panel."],
                "color": ["White paper fills 80% of the reader, blue marks the selected index.",
                          "White paper fills 75% of the canvas, blue marks the confirmation control."],
                "spacing": ["The reference separates catalog sections by 12px.",
                            "The editor uses 16px between evidence and decisions to group each pair."],
            },
        },
        "artifacts": {"research": "research.png", "before": "before.png", "finalState": "review",
                      "revisionBox": [12, 72, 32, 40],
                      "revision": "Changed the selected index marker from dull green to forest green."},
        "states": {
            "review": {"screen": "review.png", "signal": "Source caption and revised date are visible.",
                       "owner": "Catalog editor", "primary": "confirm", "secondary": "inspect"},
            "done": {"screen": "done.png", "signal": "The accepted date appears beside the catalog entry.",
                     "owner": "Catalog editor", "primary": "inspect", "secondary": None,
                     "secondaryReason": "The saved record offers a single link back to its source."},
        },
        "layout": {"zones": {"index": [0, 0, 96, HEIGHT], "workspace": [96, 0, 288, HEIGHT]},
                   "grid": "The index occupies 96px. The heading and evidence share a left edge.",
                   "whitespace": "Space above the decision separates the original caption from the editor action."},
        "type": {
            "heading": {"family": "Inter", "size": 24, "line": 30, "weight": 600,
                        "use": "Selected catalog heading"},
            "body": {"family": "Inter", "size": 14, "line": 20, "weight": 400,
                     "use": "Evidence caption and action label"},
        },
        "colors": {"ink": {"hex": "#2c2e34", "use": "Title and catalog text"},
                   "paper": {"hex": "#ffffff", "use": "Document background and inverse text"},
                   "action": {"hex": "#265180", "use": "Confirmation button surface"}},
        "contrast": [
            {"state": "review", "style": "heading", "use": "Selected record heading",
             "fg": "ink", "bg": "paper", "fgAt": [118, 28], "bgAt": [139, 28]},
            {"state": "review", "style": "body", "use": "Accept corrected date button",
             "fg": "paper", "bg": "action", "fgAt": [123, 125], "bgAt": [136, 125]},
        ],
        "spacing": {"gaps": {"item": 8, "group": 16}, "density": "Tight index rows leave space around the source caption."},
        "edges": {"width": 1, "radius": 0, "use": "Square index row and a 1px divider at the panel edge."},
        "icons": {"used": False, "reason": "Both actions describe the date change with complete text labels."},
        "material": {"used": False, "reason": "Opaque surfaces preserve legibility of the original date annotation."},
        "components": {
            "confirm": {
                "role": "Filled confirmation button accepts the revised date and disappears after saving.",
                "states": ["review"],
                "variants": {
                    "default": {"when": "An editor has entered a corrected date.",
                                "appearance": "A blue rectangle contains the white confirmation label.",
                                "on": "review", "box": [109, 109, 86, 44]},
                    "focus": {"when": "Tab moves keyboard focus onto the confirmation control.",
                              "appearance": "A blue outer ring surrounds the filled button.",
                              "on": "research", "box": [109, 109, 86, 44]},
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
        for variant, name in enumerate(("reference", "research", "before", "review", "done")):
            write_screen(self.folder / (name + ".png"), variant)
        self.manifest = sample_manifest()

    def lint(self):
        manifest = self.folder / "design-system.json"
        manifest.write_text(json.dumps(self.manifest), encoding="utf-8")
        result = subprocess.run([sys.executable, str(TOOLS / "design_lint.py"), str(manifest), "--json"],
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
        heading, button = report["contrastSamples"]
        self.assertEqual(heading["actual"], ["#2c2e34", "#ffffff"])
        self.assertAlmostEqual(heading["ratio"], 13.57, places=2)
        self.assertEqual(button["actual"], ["#ffffff", "#265180"])
        self.assertAlmostEqual(button["ratio"], 8.17, places=2)

    def test_missing_or_empty_required_section(self):
        del self.manifest["spacing"]
        self.manifest["type"] = {}
        self.assert_issue("spacing")
        self.assert_issue("type")

    def test_field_name_and_placeholder(self):
        self.manifest["task"] = "task"
        self.manifest["reference"]["comparison"]["layout"][1] = "TODO: supply a 25% layout estimate"
        self.assert_issue("task")
        self.assert_issue("layout")

    def test_reference_path_cannot_leave_package(self):
        external = self.folder.parent / "external.png"
        shutil.copyfile(self.folder / "reference.png", external)
        (self.folder / "link.png").symlink_to(external)
        for locator in ("../external.png", "link.png", str(external)):
            with self.subTest(locator=locator):
                self.manifest["reference"]["image"] = locator
                self.assert_issue("reference")

    def test_reference_requires_an_existing_image(self):
        image = self.folder / "reference.png"
        image.unlink()
        self.assert_issue("reference.image")
        image.write_text("Controlled test data with a misleading PNG extension.")
        self.assert_issue("reference.image")

    def test_action_must_exist_in_that_state(self):
        self.manifest["states"]["done"]["primary"] = "absent"
        self.assert_issue("primary", "components")
        self.manifest["states"]["done"]["primary"] = "confirm"
        self.assert_issue("primary", "components", "states.done")

    def test_copied_reference_or_state_image(self):
        for name in ("reference.png", "done.png"):
            with self.subTest(name=name):
                original = (self.folder / name).read_bytes()
                shutil.copyfile(self.folder / "review.png", self.folder / name)
                self.assert_issue("reference", "states", "artifacts")
                (self.folder / name).write_bytes(original)

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
        with self.subTest("unknown evidence screen"):
            focus["on"] = "unavailable"
            self.assert_issue("variants", "components.confirm")
            focus["on"] = "research"
        with self.subTest("same pixels relabeled as a focus state"):
            focus["on"] = "review"
            self.assert_issue("variants", "components.confirm")
            focus["on"] = "research"
        with self.subTest("variant outside screen"):
            focus["box"] = [WIDTH, 2, 80, 30]
            self.assert_issue("variants", "components.confirm")

    def test_terminal_final_screen_still_requires_action_variants(self):
        self.manifest["artifacts"]["finalState"] = "done"
        self.manifest["states"]["done"].update(primary=None, primaryReason="The accepted date is locked after saving.")
        for sample in self.manifest["contrast"]:
            sample["state"] = "done"
        report = self.lint()
        self.assertTrue(report["ok"], report["errors"])
        del self.manifest["components"]["confirm"]["variants"]
        self.assert_issue("components.confirm.variants")

    def test_token_and_sampled_pixel_disagree(self):
        self.manifest["colors"]["ink"]["hex"] = "#1e3850"
        self.assert_issue("contrast", "colors")

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

    def test_revision_requires_same_dimensions(self):
        write_screen(self.folder / "before.png", 2, width=WIDTH+1)
        self.assert_issue("before", "revision", "artifacts")

    def test_revision_requires_change_in_the_stated_area(self):
        self.manifest["artifacts"]["revisionBox"] = [112, 24, 28, 16]
        self.assert_issue("revision", "artifacts")

    def test_geometry_and_sample_bounds(self):
        self.manifest["layout"]["zones"]["index"] = [-1, 0, 96, HEIGHT]
        self.manifest["contrast"][0]["fgAt"] = [WIDTH, 5]
        self.assert_issue("zones")
        self.assert_issue("contrast")


if __name__ == "__main__":
    unittest.main()
