"""Check the portable design records and original PNG exports with the standard library."""

import argparse
import hashlib
import json
import math
import re
import struct
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


CASES = "anthropic impeccable promax stitch hallmark v0 mobbin refero lapa appllama".split()
EXPECTED = {"refs": 66, "images": 51, "rules": 110, "avoid": 52, "textLayers": 570}
REQUIRED_TEXT = {
    "Quarry", "RL-238", "Duplicate checkout events", "TEST-8072", "09:41:12.083",
    "09:41:12.516", "checkout_complete", "checkout-event.patch", "Review patch",
}
PNG_HEADER = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def web_url(url):
    parsed = urlsplit(url)
    return parsed.scheme in ("https", "http") and bool(parsed.hostname)


def figma_id(url):
    parsed = urlsplit(url)
    nodes = parse_qs(parsed.query).get("node-id", [])
    require(parsed.scheme == "https" and parsed.hostname == "www.figma.com"
            and parsed.path.startswith("/design/scYOkdhE2byoPHW4Gk1aDL/")
            and len(nodes) == 1 and re.fullmatch(r"\d+-\d+", nodes[0]),
            f"invalid case Figma URL: {url}")
    return nodes[0]


def digest(value):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value)


def finite(value):
    return type(value) in (float, int) and math.isfinite(value)


def check_png(path, size=None, sha256=None):
    with path.open("rb") as stream:
        header = stream.read(24)
        require(len(header) == 24 and header.startswith(PNG_HEADER), f"invalid PNG: {path}")
        if size is not None:
            require(struct.unpack(">II", header[16:24]) == tuple(size), f"size mismatch: {path}")
        if sha256 is not None:
            checksum = hashlib.sha256(header)
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                checksum.update(chunk)
            require(checksum.hexdigest() == sha256, f"SHA-256 mismatch: {path}")


def verify_studies(root):
    refs = root / "references"
    apple = refs / "apple-process"
    captures = json.loads((apple / "materials.json").read_text())["boards"]
    boards = {item["id"]: item for item in captures}
    exports = {"51:23751": refs / "apple-liquid-glass.png", "74:37804": apple / "full.png",
               "75:38790": apple / "uniform.png"}
    require(len(captures) == len(boards) and boards.keys() == exports.keys(), "Apple board IDs differ")
    for node, path in exports.items():
        board = boards[node]
        require(digest(board["textLayoutAndStyleSha256"]) and digest(board["exportSha256"]),
                f"invalid capture digest: {node}")
        check_png(path, board["boardSize"], board["exportSha256"])

    base, uniform = boards["51:23751"], boards["75:38790"]
    require(uniform["basedOn"] == base["id"] and base["textLayers"] == uniform["textLayers"]
            and base["textLayoutAndStyleSha256"] == uniform["textLayoutAndStyleSha256"],
            "uniform board differs from the recorded base text layout or style")

    def surface(board, name):
        matches = [layer for layer in board["surfaces"] if layer["name"] == name]
        require(len(matches) == 1, f"expected one {name} layer in {board['name']}")
        return matches[0]

    sidebar = surface(base, "Sidebar material surface")
    whole = surface(uniform, "Continuous Liquid Glass · Original sidebar material")
    require(sidebar["fills"] and any(e["type"] == "GLASS" for e in sidebar["effects"])
            and sidebar["fills"] == whole["fills"] and sidebar["effects"] == whole["effects"],
            "uniform board differs from the recorded sidebar material")
    require(whole["size"] == uniform["window"]["size"] and whole["size"][0] > sidebar["size"][0]
            and whole["size"][1] == sidebar["size"][1], "sidebar material does not extend across window")
    check_png(apple / "board.png", (1440, 8112))

    library = refs / "library-process"
    checks = json.loads((library / "checks.json").read_text())
    for key, design in (("shadcn", "shadcn-ui.png"), ("untitled", "untitled-ui.png")):
        record = checks[key]
        for field in ("designPngSha256", "boardPngSha256"):
            require(digest(record[field]), f"invalid {key} {field}")
        check_png(refs / design, record["designSizePx"], record["designPngSha256"])
        check_png(library / key / "board.png", sha256=record["boardPngSha256"])

    for name, size in {"foundations": (1440, 4126), "components": (1200, 1136),
                       "desktop": (1440, 7263), "mobile": (390, 5771)}.items():
        check_png(root / "foundations" / "original" / f"{name}.png", size)


def verify_case(folder, index, images, nodes):
    data = json.loads((folder / "case.json").read_text())
    require(data["key"] == folder.name, "key differs from directory")
    require(all(data[k].strip() for k in ("name", "direction", "lens")), "missing brief")
    refs = data["refs"]
    urls = set()
    image_count = 0
    for ref in refs:
        require(all(ref[k].strip() for k in ("title", "kind", "note")), "incomplete attribution")
        require(web_url(ref["url"]), f"invalid reference URL: {ref['url']}")
        urls.add(ref["url"])
        if "galleryUrl" in ref:
            require(web_url(ref["galleryUrl"]), "invalid gallery URL")
        if "image" in ref:
            im = ref["image"]
            require(digest(im["sha256"]) and im["sha256"] not in images, "invalid or repeated source image hash")
            images.add(im["sha256"])
            if "url" in im:
                require(web_url(im["url"]), "invalid image URL")
            image_count += 1
    require(image_count >= 5, "missing source images")
    for rule in data["rules"]:
        require(type(rule["ref"]) is int and 1 <= rule["ref"] <= len(refs), "rule links to missing reference")
        require(all(rule[k].strip() for k in ("axis", "value", "why")), "missing rule value or reason")
    require(bool(data["rules"]) and bool(data["avoid"])
            and all(isinstance(note, str) and note.strip() for note in data["avoid"]), "missing rules or prompts")

    for role in ("design", "spec"):
        url = data["figma"][role]
        node = figma_id(url)
        require(node not in nodes, "Figma node reused")
        nodes.add(node)
        require(url in index, "index missing Figma link")
    for name in ("case.json", "design.png"):
        require(f"]({folder.name}/{name})" in index, f"index missing {name}")

    export = data["export"]
    require(export["file"] == "design.png", "unexpected export filename")
    png = (folder / export["file"]).read_bytes()
    require(png.startswith(PNG_HEADER), "invalid PNG header")
    width, height = struct.unpack(">II", png[16:24])
    require((width, height) == (1440, 940) and export["size"] == [width, height], "changed canvas size")
    require(hashlib.sha256(png).hexdigest() == export["sha256"], "PNG hash mismatch")

    action = data["reviewPatch"]
    x, y, w, h = action["box"]
    require(all(finite(v) for v in action["box"])
            and 0 <= x < x+w <= width and 0 <= y < y+h <= height, "invalid button bounds")
    require(0 <= action["cornerRadius"] <= min(w, h)/2 and 0 < action["fontSize"] <= h, "invalid button style")
    qa = data["qa"]
    require(type(qa["textLayers"]) is int and qa["textLayers"] > 0
            and qa["textLayers"] == qa["contrastSamples"], "text coverage mismatch")
    require(qa["referenceImages"] == image_count and qa["linkedReferenceUrls"] == len(urls), "reference count mismatch")
    require(set(qa["requiredTextFound"]) == REQUIRED_TEXT
            and len(qa["requiredTextFound"]) == len(REQUIRED_TEXT), "required text mismatch")
    require(all(qa[k] == 0 for k in ("geometryFlags", "pendingVisualFlags", "belowContrastThreshold")),
            "recorded QA flags")
    low = qa["minimumContrast"]
    require(finite(low) and qa["thresholdAtMinimum"] in (3, 4.5)
            and qa["thresholdAtMinimum"] <= low <= 21 and qa["minimumContrastText"].strip(), "invalid contrast record")
    return {"refs": len(refs), "images": image_count, "rules": len(data["rules"]),
            "avoid": len(data["avoid"]), "textLayers": qa["textLayers"]}, low


def main(root):
    cases = root / "cases"
    index = (cases / "index.md").read_text()
    require({p.name for p in cases.iterdir() if p.is_dir()} == set(CASES), "case directories differ")
    totals = dict.fromkeys(EXPECTED, 0)
    images, nodes, minima = set(), set(), []
    for key in CASES:
        try:
            record, low = verify_case(cases / key, index, images, nodes)
        except (ValueError, KeyError, TypeError, OSError, struct.error) as exc:
            raise ValueError(f"{key}: {exc}") from exc
        for field in totals:
            totals[field] += record[field]
        minima.append(low)
    require(totals == EXPECTED, f"record totals differ: {totals}")
    verify_studies(root)
    print(f"verified {len(CASES)} PNGs and case records, {len(nodes)} Figma node links")
    print(", ".join(f"{key}={value}" for key, value in totals.items()))
    print(f"minimum recorded text contrast={min(minima):.3f}:1")
    print("checked archived Apple, library and Linear exports and captured layer records (offline)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1],
                        help="repository root (defaults to the directory above tools)")
    try:
        main(parser.parse_args().root)
    except (ValueError, KeyError, TypeError, OSError, struct.error) as exc:
        sys.exit(f"verification failed: {exc}")
