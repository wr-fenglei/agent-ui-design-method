"""Record which three images from this method snapshot support a design."""

import hashlib
import re
from pathlib import Path

from design_images import load_image


EXAMPLES = Path(__file__).resolve().parent.parent / "examples"
CASES = ("linear", "shadcn-ui", "apple-glass")
ROLES = ("final", "spec", "process")


def snapshots(case):
    if case not in CASES:
        raise ValueError("请选择 linear、shadcn-ui 或 apple-glass 中的一个案例")
    case_dir = EXAMPLES / case
    views = {}
    fingerprints = {}
    for role in ROLES:
        path = case_dir / f"{role}.png"
        image = load_image(path)
        views[role] = {
            "image": f"examples/{case}/{role}.png",
            "width": image.width,
            "height": image.height,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
        if image.fingerprint in fingerprints:
            raise ValueError(f"案例中的 {role}.png 与 {fingerprints[image.fingerprint]} 图像重复")
        fingerprints[image.fingerprint] = role
    return case_dir, views, fingerprints


def normalized(value):
    return re.sub(r"[\W_]", "", value.casefold())


def check_case(checker, reference):
    case = reference.get("case")
    try:
        case_dir, originals, fingerprints = snapshots(case)
    except (OSError, ValueError) as exc:
        checker.issue("reference.case", str(exc))
        return None

    # Preserve the existing duplicate-artwork check when an author uses the
    # repository's original instead of copying it into the delivery directory.
    for digest, role in fingerprints.items():
        checker.fingerprints.setdefault(digest, f"reference.views.{role}")

    supplied_image = checker.named_files.get(("reference",))
    if supplied_image:
        if hashlib.sha256(supplied_image.read_bytes()).hexdigest() != originals["final"]["sha256"]:
            checker.issue("reference.image", "随稿主参考需与所选案例 final.png 完全一致, 也可省略该字段")

    views = checker.table(reference, "views", "reference")
    for extra in views.keys() - set(ROLES):
        checker.issue(f"reference.views.{extra}", "仅填写 final、spec、process 三张图")
    notes = set()
    for role, original in originals.items():
        prefix = f"reference.views.{role}"
        item = views.get(role)
        if not isinstance(item, dict):
            checker.issue(prefix, "请填写该角色对应原图的指纹、观察框、画面观察和应用取舍")
            continue
        for extra in item.keys() - {"sha256", "box", "observed", "apply"}:
            checker.issue(f"{prefix}.{extra}", "原图由选中案例和角色定位, 仅填写模板中的四个字段")
        if item.get("sha256") != original["sha256"]:
            checker.issue(prefix + ".sha256", f"需要当前快照 {original['image']} 的 SHA-256")
        box = checker.box(item.get("box"), prefix + ".box", None)
        if box and (box[0] + box[2] > original["width"] or box[1] + box[3] > original["height"]):
            checker.issue(prefix + ".box", f"观察框超出原图 {original['width']}×{original['height']} 像素")
        for key in ("observed", "apply"):
            note = checker.text(item, key, prefix)
            if not isinstance(note, str):
                continue
            value = normalized(note)
            if value in notes or len(value) < 8 or value in {
                "同上沿用参考设计", "采用该案例中的设计", "使用该案例中的设计", "沿用这张图中的做法",
                "useasreference", "followthisreference", "sameasabove", "sameasreference",
            }:
                checker.issue(f"{prefix}.{key}", "请写明框内的具体要素, 以及它如何影响本稿中的一个位置或操作")
            notes.add(value)
    return case_dir
