"""Exercise the design lint CLI with synthetic artwork in a temporary directory."""

import hashlib
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


def sample_manifest():
    """The strings describe a fictional review flow used only as test input."""
    return {
        "task": "A catalog editor compares the source caption and accepts a corrected date.",
        "reference": {
            "case": "shadcn-ui", "image": "reference.png", "source": "Quarry investigation screen from the method snapshot",
            "views": {
                "final": {"box": [0, 100, 288, 650], "observed": "The list of issues occupies a separate left rail.",
                          "apply": "The catalog index stays visible next to the selected caption."},
                "spec": {"box": [0, 200, 1400, 1000], "observed": "The button surface and text have opposite luminance.",
                         "apply": "The corrected date is accepted with a dark filled button."},
                "process": {"box": [0, 100, 1400, 1100], "observed": "A full investigation and a detail of the evidence occupy separate frames.",
                            "apply": "The comparison board pairs the entire review with a crop of the date."}
            },
            "comparison": {
                "layout": ["Left index occupies 33% of the catalog reader.",
                           "Left index is reduced to 25% to make room for the date evidence."],
                "type": ["Reference uses a 26px heading over a 16px note.",
                         "The editor uses a 24px heading and a 14px note for the narrower panel."],
                "color": ["White paper fills most of the reading surface, black marks the primary action.",
                          "White paper fills 75% of the canvas, a dark fill marks the confirmation control."],
                "spacing": ["The reference separates catalog sections by 12px.",
                            "The editor uses 16px between evidence and decisions to group each pair."],
            },
        },
        "artifacts": {"research": "research.png", "spec": "spec.png", "before": "before.png", "finalState": "review",
                      "revisionBox": [12, 72, 32, 40],
                      "revision": "Changed the intensity of the selected catalog index marker."},
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
                   "side": {"hex": "#fafafa", "use": "Index rail background"},
                   "action": {"hex": "#202020", "use": "Confirmation button surface"}},
        "palette": {"states": {
            state: {
                "window": {"token": "paper", "box": [200, 5, 170, 240], "sourceAt": [1428, 189]},
                "sidebar": {"token": "side", "box": [0, 0, 96, 256], "sourceAt": [4, 5]},
                "primary": {"token": "action", "box": [112, 112, 80, 38], "sourceAt": [387, 174]},
            } for state in ("review", "done")
        }},
        "media": {"states": {
            "review": {"reason": "Caption and date corrections are rendered as labels and numeric fields."},
            "done": {"reason": "The saved date and its caption appear in the index as text."},
        }},
        "contrast": [
            {"state": "review", "style": "heading", "use": "Selected record heading",
             "fg": "ink", "bg": "paper", "fgAt": [118, 28], "bgAt": [139, 28]},
            {"state": "review", "style": "body", "use": "Accept corrected date button",
             "fg": "paper", "bg": "action", "fgAt": [123, 130], "bgAt": [136, 130]},
            {"state": "done", "style": "body", "use": "Open saved catalog entry",
             "fg": "paper", "bg": "action", "fgAt": [123, 130], "bgAt": [136, 130]},
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
                                "appearance": "A dark rectangle contains the white confirmation label.",
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
        for variant, name in enumerate(("research", "before", "review", "done"), start=1):
            write_screen(self.folder / (name + ".png"), variant)
        write_screen(self.folder / "spec.png", 5)
        self.manifest = sample_manifest()
        self.case = TOOLS.parent / "examples" / "shadcn-ui"
        shutil.copyfile(self.case / "final.png", self.folder / "reference.png")
        for role, entry in self.manifest["reference"]["views"].items():
            entry["sha256"] = hashlib.sha256((self.case / (role + ".png")).read_bytes()).hexdigest()

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
        self.manifest["reference"]["comparison"]["layout"][1] = "TODO: supply a 25% layout estimate"
        self.assert_issue("task")
        self.assert_issue("layout")

    def test_case_command_identifies_each_original(self):
        for case in ("linear", "shadcn-ui", "apple-glass"):
            with self.subTest(case=case):
                result = subprocess.run(
                    [sys.executable, str(TOOLS / "design_lint.py"), "--case", case, "--json"],
                    check=True, capture_output=True, text=True, timeout=20)
                views = json.loads(result.stdout)["views"]
                self.assertEqual(set(views), {"final", "spec", "process"})
                for role, item in views.items():
                    path = TOOLS.parent / "examples" / case / (role + ".png")
                    self.assertEqual(item["sha256"], hashlib.sha256(path.read_bytes()).hexdigest())
                    self.assertEqual(str(path.relative_to(TOOLS.parent)), item["image"])
        del self.manifest["reference"]["image"]
        self.assertTrue(self.lint()["ok"])

    def test_case_requires_exactly_one_allowed_example(self):
        for case in ("unknown-case", ["linear", "apple-glass"], "../evidence"):
            with self.subTest(case=case):
                self.manifest["reference"]["case"] = case
                self.assert_issue("reference.case")

    def test_missing_or_extra_view(self):
        views = self.manifest["reference"]["views"]
        views["revision"] = views.pop("process")
        report = self.lint()
        self.assertEqual(
            {error["path"] for error in report["errors"]},
            {"reference.views.process", "reference.views.revision"})

    def test_role_fingerprints_are_bound_to_the_selected_case(self):
        views = self.manifest["reference"]["views"]
        views["spec"]["sha256"] = views["process"]["sha256"]
        other = self.case.parent / "linear" / "final.png"
        views["final"]["sha256"] = hashlib.sha256(other.read_bytes()).hexdigest()
        shutil.copyfile(other, self.folder / "reference.png")
        errors = {error["path"] for error in self.lint()["errors"]}
        self.assertEqual(errors, {"reference.image", "reference.views.spec.sha256", "reference.views.final.sha256"})

    def test_full_delivery_checks_media_before_exempting_artwork_colors(self):
        box = [250, 55, 75, 63]
        art = (*box, (52, 90, 70))
        replacement = (*box, (168, 64, 35))
        write_screen(self.folder / "review.png", 3, patches=[art])
        alternate = self.folder / "review-other.png"
        write_screen(alternate, 3, patches=[replacement])
        self.manifest["media"]["states"]["review"] = {"alternate": alternate.name, "boxes": [box]}
        report = self.lint()
        self.assertTrue(report["ok"], report["errors"])
        self.assertEqual(report["mediaSamples"][0]["boxes"][0]["changedPixels"], 75 * 63)
        self.assertTrue(report["mediaSamples"][0]["outsideUnchanged"])

        write_screen(alternate, 3, patches=[replacement, (117, 120, 1, 1, (33, 32, 32))])
        report = self.lint()
        self.assertFalse(report["ok"])
        self.assertFalse(report["mediaSamples"][0]["outsideUnchanged"])
        self.assertTrue(any("117, 120" in e["message"] for e in report["errors"]))

    def test_observations_and_decisions_are_specific_to_each_view(self):
        views = self.manifest["reference"]["views"]
        views["final"]["observed"] = "TODO: inspect the sidebar"
        views["spec"]["apply"] = views["process"]["apply"]
        views["spec"]["box"] = [0, 0, 40000, 20]
        views["process"]["observed"] = "same as reference"
        errors = {error["path"] for error in self.lint()["errors"]}
        self.assertTrue({"reference.views.final.observed", "reference.views.spec.box",
                         "reference.views.process.observed", "reference.views.process.apply"} <= errors, errors)

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

    def test_specification_board_is_an_independent_export(self):
        artifacts = self.manifest["artifacts"]
        spec = artifacts.pop("spec")
        self.assert_issue("artifacts.spec")
        artifacts["specimens"] = spec
        self.assertTrue(self.lint()["ok"])
        del artifacts["specimens"]
        for other in ("research.png", "before.png", "review.png"):
            with self.subTest(other=other):
                artifacts["spec"] = other
                self.assertTrue(any(e["path"] == "artifacts.spec" and "重复" in e["message"]
                                    for e in self.lint()["errors"]))

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
