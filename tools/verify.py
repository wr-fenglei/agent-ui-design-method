"""Check the three offline reference sets shipped with the design method."""

import argparse
import hashlib
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

from design_images import load_image


# These final screens are the three original exports selected by the project owner.
FINALS = {
    "linear": "95b26c7cae5e418beacaf3be83f966876c4447d3b138e81d92ec24b62c9ef60d",
    "shadcn-ui": "2eebf7e0ba9481761f2fd06384faeb588c00077a04ed6a2496e80576363f2a96",
    "apple-glass": "d9735c8c624657c14f6f96915ed149a45f018dbbe69a1e217a8c4ab330376ec6",
}


def verify(root):
    examples = root / "examples"
    roles = ("final.png", "spec.png", "process.png")
    expected = {examples / case / role for case in FINALS for role in roles}
    actual = {p for p in examples.rglob("*") if p.is_file() and not p.name.startswith(".")}
    if actual != expected:
        raise ValueError(f"missing {sorted(expected - actual)}, extra {sorted(actual - expected)}")

    hashes = set()
    for path in sorted(expected):
        data = path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        if not data.startswith(b"\x89PNG\r\n\x1a\n") or digest in hashes:
            raise ValueError(f"expected a distinct PNG: {path}")
        hashes.add(digest)
        img = load_image(path)
        if path.name == "final.png" and digest != FINALS[path.parent.name]:
            raise ValueError(f"final screen differs from the selected original: {path}")
        print(f"{path.relative_to(root)}  {img.width} x {img.height}")

    home_links = set()
    for page in [root / "README.md", root / "AGENTS.md", root / "SKILL.md", root / "docs/lint.md"]:
        for raw in re.findall(r"\]\(([^)\n]+)\)", page.read_text(encoding="utf-8")):
            url = urlsplit(raw.strip("<>"))
            if url.scheme or not url.path:
                continue
            dest = (page.parent / unquote(url.path)).resolve()
            if not dest.is_relative_to(root) or not dest.is_file():
                raise ValueError(f"broken local link in {page.name}: {raw}")
            if page == root / "README.md":
                home_links.add(dest)
    if not expected.issubset(home_links):
        raise ValueError("homepage must link every reference PNG")
    print("verified 3 cases, 9 distinct offline PNGs and their entry points")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    try:
        verify(parser.parse_args().root.resolve())
    except (ValueError, OSError) as exc:
        sys.exit(f"verification failed: {exc}")
