"""Lint an offline screen design delivery. Copy design-system.template.json to start."""

import argparse
import json
import math
import re
import sys
from functools import lru_cache
from pathlib import Path

sys.dont_write_bytecode = True
from design_alignment import check_alignment
from design_case import CASES, check_case, snapshots
from design_images import load_image, region_differs
from design_media import check_media
from design_palette import check_palette
from design_text_layers import check_text_layers, contrast_minimum, contrast_ratio


MANUAL_REVIEW = [
    "逐张打开所选案例的成稿、规范和过程图, 对照研究板及本稿核对观察框、分区比例、字级、色彩面积和间距, 指纹及字段只能验证提交的证据",
    "核对色样取自范例的界面区域, 主要操作、品牌、各表面和成功提示均已登记, 内容图与界面色分开取样",
    "在可编辑稿替换内容图并复核导出, 检查替换框是否贴合媒体边界, 逐项核对无媒体声明, 像素差异只反映提交的这组导出",
    "在可编辑稿中核对所声明的字体、行高、网格、密度、圆角、图标和材质, 确认色样坐标位于对应文字与背景",
    "对照主控件各变体的局部及修订区域, 检查触发条件、状态反馈与修订目标, 在可操作原型中验证交互",
    "作者按 1× 成稿逐项自查对象、证据、下一步和执行者是否清楚, 记录检查结果, 由用户确认视觉取舍",
]
PLACEHOLDER = re.compile(r"\b(todo|tbd|placeholder|lorem ipsum|fixme)\b|待填|占位|待定|待补|待完善|待确认后填", re.I)
EMPTY_LABELS = set("task layout type color spacing role use reason state signal owner source title text "
                   "任务 布局 字级 色彩 颜色 间距 角色 用途 原因 状态 证据 待办 填写 标题 字体字号".split())
LABEL_WORDS = re.compile(r"布局|网格|标题|层级|对齐|留白|间距|密度|任务|状态|证据|操作|动作|分区|比例|字号|"
                         r"字级|字重|行高|颜色|色彩|面积|用途|理由|边界|图标|角色|规格|组件|材质|名称|数值|取值|"
                         r"\b(?:task|state|layout|grid|zone|title|type|hierarchy|spacing|color|contrast|"
                         r"reference|role|signal|action|evidence|owner|appearance|size|weight|reason)\b", re.I)
AREA = re.compile(r"\d|面积|底色|大部|大面|小面|少量|局部|点缀|整[屏幅页]|全[屏幅页]|主体|背景铺满|"
                  r"占|majority|most|dominant|accent|entire|full|small|area|surface|half|quarter", re.I)


def number(value):
    if type(value) not in (int, float):
        return False
    try:
        return math.isfinite(value)
    except OverflowError:
        return False


def specific(value, key="", short=False):
    if not isinstance(value, str) or PLACEHOLDER.search(value):
        return False
    value = value.strip()
    chars = re.sub(r"[\W_]", "", value)
    if value.casefold() in EMPTY_LABELS or value.casefold() == key.casefold() or not chars:
        return False
    if short:
        return True
    return len(chars) >= 4 and len(set(chars.casefold())) >= 3 and bool(re.search(r"[^\W_]", LABEL_WORDS.sub("", value)))


def lookup(table, key):
    return table.get(key) if isinstance(key, str) else None


def image_pixels(path):
    return load_image(path, pixels=True)


class DesignLint:
    def __init__(self, directory):
        self.directory = directory
        self.errors = []
        self.artwork = {}
        self.named_files = {}
        self.fingerprints = {}
        self.png_by_size = {}
        self.pixels = lru_cache(maxsize=2)(image_pixels)
        self.samples = []
        self.case_dir = None

    def issue(self, path, message):
        self.errors.append({"path": path, "message": message})

    def text(self, record, key, path, *, short=False):
        value = record.get(key)
        if not specific(value, key, short):
            self.issue(f"{path}.{key}".lstrip("."), "请填写本稿中的具体内容")
        return value

    def table(self, record, key, path="", minimum=1):
        value = record.get(key)
        if not isinstance(value, dict) or len(value) < minimum:
            self.issue(f"{path}.{key}".lstrip("."), f"需要至少 {minimum} 项")
        return value if isinstance(value, dict) else {}

    def rows(self, table, path):
        for name, item in table.items():
            if not name.strip() or PLACEHOLDER.search(name):
                self.issue(f"{path}.{name}", "请使用有意义的名称")
            if isinstance(item, dict) and item:
                yield name, item, f"{path}.{name}"
            else:
                self.issue(f"{path}.{name}", "请填写该项的具体属性")

    def scale(self, record, key, path, *, positive=False, maximum=None):
        value = record.get(key)
        if (not number(value) or value < 0 or (positive and value == 0)
                or (maximum is not None and value > maximum)):
            interval = "大于 0" if positive else "大于或等于 0"
            limit = f" 且不超过 {maximum}" if maximum is not None else ""
            self.issue(f"{path}.{key}", f"需要{interval}{limit}的有限数值")
            return None
        return value

    def image(self, value, field, name, *, png=True):
        try:
            if not isinstance(value, str) or not value.strip():
                raise ValueError("请填写本包内的实际图像路径")
            relative = Path(value)
            if relative.is_absolute() or ".." in relative.parts:
                raise ValueError("请使用包内相对路径")
            path = (self.directory / relative).resolve(strict=True)
            if not path.is_relative_to(self.directory) or not path.is_file():
                raise ValueError("引用必须指向包内常规文件")
            with path.open("rb") as stream:
                is_png = stream.read(8) == b"\x89PNG\r\n\x1a\n"
                if png and not is_png:
                    raise ValueError("请提供原尺寸 PNG 导出")
            image = load_image(path)
            duplicate = self.fingerprints.get(image.fingerprint)
            if is_png and not duplicate:
                size = (image.width, image.height)
                previous = self.png_by_size.setdefault(size, [])
                for other, other_field, other_png_required in previous:
                    # A reference can use a PNG profile or depth unsupported by the
                    # screen pixel reader. This does not invalidate its source image.
                    try:
                        other_pixels = self.pixels(other)
                    except ValueError:
                        if other_png_required:
                            raise
                        continue
                    if not region_differs(other_pixels, self.pixels(path), (0, 0, *size)):
                        duplicate = other_field
                        break
                previous.append((path, field, png))
            if duplicate:
                self.issue(field, f"图像与 {duplicate} 重复, 需要本项独立证据")
            self.fingerprints[image.fingerprint] = field
            self.named_files[name], self.artwork[name] = path, image
        except (OSError, ValueError, RuntimeError) as exc:
            self.issue(field, f"请检查路径或重新导出图像, {exc}")

    def box(self, value, path, image):
        if not isinstance(value, list) or len(value) != 4 or not all(type(n) is int for n in value):
            self.issue(path, "请填写原图像素框 [x,y,width,height]")
            return None
        x, y, w, h = value
        if x < 0 or y < 0 or w <= 0 or h <= 0 or (image and (x + w > image.width or y + h > image.height)):
            size = f", 图像尺寸 {image.width}×{image.height}" if image else ""
            self.issue(path, f"需要有面积且位于原图内的像素框{size}")
            return None
        return tuple(value)

    def ref_and_screens(self, data, states):
        ref = self.table(data, "reference")
        if "image" in ref:
            self.image(ref["image"], "reference.image", ("reference",), png=False)
        self.case_dir = check_case(self, ref)
        self.text(ref, "source", "reference")
        compare = self.table(ref, "comparison", "reference")
        for axis in ("layout", "type", "color", "spacing"):
            pair = compare.get(axis)
            field = f"reference.comparison.{axis}"
            if not isinstance(pair, list) or len(pair) != 2:
                self.issue(field, "请并列填写参考原图与本稿的观察和取舍")
                continue
            for i, item in enumerate(pair):
                measured = AREA.search(item) if axis == "color" and isinstance(item, str) else None
                if axis != "color" and isinstance(item, str):
                    measured = re.search(r"\d", item)
                if not specific(item, axis) or not measured:
                    detail = "色彩面积及作用" if axis == "color" else "具体位置和测量值"
                    self.issue(f"{field}[{i}]", f"请写明{'参考' if i == 0 else '成稿'}的{detail}")

        artifacts = self.table(data, "artifacts")
        for key in ("research", "before"):
            self.image(artifacts.get(key), f"artifacts.{key}", (key,))
        for state, item, path in self.rows(states, "states"):
            if state == "research":
                self.issue(path, "research 保留为研究板证据, 请另选状态 ID")
            self.image(item.get("screen"), f"{path}.screen", state)
            self.text(item, "signal", path)
            self.text(item, "owner", path, short=True)
        # Earlier deliveries used "specimens" for their standalone specification board.
        spec = artifacts.get("spec", artifacts.get("specimens"))
        self.image(spec, "artifacts.spec", ("spec",))
        final = artifacts.get("finalState")
        if not isinstance(final, str) or final not in states:
            self.issue("artifacts.finalState", "请选择 states 中的主画面")
            final = None
        self.text(artifacts, "revision", "artifacts")
        main = self.artwork.get(final)
        box = self.box(artifacts.get("revisionBox"), "artifacts.revisionBox", main)
        before = self.artwork.get(("before",))
        if main and before:
            if (main.width, main.height) != (before.width, before.height):
                self.issue("artifacts.before", "修订前后需要同尺寸 1× 导出以对照同一位置")
            elif box:
                try:
                    if not region_differs(self.pixels(self.named_files[("before",)]), self.pixels(self.named_files[final]), box):
                        self.issue("artifacts.revisionBox", "修订前后的该区域像素一致, 请标出发生变化的位置")
                except (ValueError, OSError) as exc:
                    self.issue("artifacts.revisionBox", str(exc))
        return final

    def foundations(self, data, final):
        layout = self.table(data, "layout")
        self.text(layout, "grid", "layout")
        self.text(layout, "whitespace", "layout")
        zones = self.table(layout, "zones", "layout", minimum=2)
        boxes = set()
        for zone, value in zones.items():
            box = self.box(value, f"layout.zones.{zone}", self.artwork.get(final))
            if box and box in boxes:
                self.issue(f"layout.zones.{zone}", "分区与另一分区的位置尺寸完全相同")
            if box:
                boxes.add(box)
        styles = self.table(data, "type", minimum=2)
        ranks = set()
        for _, item, path in self.rows(styles, "type"):
            family = self.text(item, "family", path, short=True)
            self.text(item, "use", path)
            size = self.scale(item, "size", path, positive=True)
            line = self.scale(item, "line", path, positive=True)
            weight = self.scale(item, "weight", path, positive=True, maximum=1000)
            if isinstance(family, str) and size and line and weight:
                ranks.add((family, size, line, weight))
        if len(styles) >= 2 and len(ranks) == 1:
            self.issue("type", "请提供具有字族、字号、行高或字重区别的标题与正文样式")
        colors = {}
        for name, item, path in self.rows(self.table(data, "colors", minimum=2), "colors"):
            self.text(item, "use", path)
            value = item.get("hex")
            if isinstance(value, str) and re.fullmatch(r"#[\da-fA-F]{6}", value, re.ASCII):
                colors[name] = tuple(bytes.fromhex(value[1:]))
            else:
                self.issue(f"{path}.hex", "请填写实际 sRGB 颜色 #RRGGBB")
        spacing = self.table(data, "spacing")
        gaps = self.table(spacing, "gaps", "spacing", minimum=2)
        for name in gaps:
            self.scale(gaps, name, "spacing.gaps")
        self.text(spacing, "density", "spacing")
        edges = self.table(data, "edges")
        for key in ("width", "radius"):
            self.scale(edges, key, "edges")
        self.text(edges, "use", "edges")
        icons = self.table(data, "icons")
        if icons.get("used") is False:
            self.text(icons, "reason", "icons")
        else:
            if "used" in icons and icons["used"] is not True:
                self.issue("icons.used", "请填写 true 或 false")
            self.scale(icons, "size", "icons", positive=True)
            self.scale(icons, "stroke", "icons")
            self.text(icons, "use", "icons")
        material = self.table(data, "material")
        if type(material.get("used")) is not bool:
            self.issue("material.used", "请填写 true 或 false")
        self.text(material, "reason", "material")
        if material.get("used") is True:
            self.text(material, "use", "material")
        return styles, colors

    def contrast(self, entries, styles, colors, states):
        if not isinstance(entries, list) or len(entries) < 2:
            self.issue("contrast", "请在每个状态取样实际文字及邻近背景, 总计至少两处")
            if not isinstance(entries, list):
                return
        labels, locations, sampled_states = set(), set(), set()
        for index, entry in enumerate(entries):
            path = f"contrast[{index}]"
            if not isinstance(entry, dict):
                self.issue(path, "需要文字样式、语义色与取样位置")
                continue
            state, style_id = entry.get("state"), entry.get("style")
            image_path = lookup(self.named_files, state)
            style = lookup(styles, style_id)
            if not image_path:
                self.issue(path + ".state", "请选择已提供画面证据的状态")
            if not isinstance(style, dict):
                self.issue(path + ".style", "需要 type 中定义的文字样式")
            label = self.text(entry, "use", path, short=True)
            if isinstance(label, str) and isinstance(state, str):
                label_key = state, label.casefold().strip()
                if label_key in labels:
                    self.issue(path + ".use", "请取样另一处具体文字")
                labels.add(label_key)
            samples, coords = [], []
            for key in ("fg", "bg"):
                expected = lookup(colors, entry.get(key))
                point = entry.get(key + "At")
                if expected is None:
                    self.issue(f"{path}.{key}", "请选择 colors 中定义的语义色")
                if not isinstance(point, list) or len(point) != 2 or not all(type(v) is int for v in point):
                    self.issue(f"{path}.{key}At", "需要原尺寸 PNG 中的像素坐标 [x,y]")
                    continue
                coords.append(tuple(point))
                if image_path:
                    try:
                        actual = self.pixels(image_path).rgb(*point)
                        if expected and max(abs(a-b) for a, b in zip(actual, expected)) > 3:
                            self.issue(f"{path}.{key}At", f"实际像素 #{bytes(actual).hex()} 与语义色 #{bytes(expected).hex()} 不符, 请取实心字或邻近底色")
                        samples.append(actual)
                    except (OSError, ValueError) as exc:
                        self.issue(f"{path}.{key}At", str(exc))
            if len(coords) != 2 or not image_path:
                continue
            location = state, coords[0]
            if location in locations:
                self.issue(path + ".fgAt", "该文字像素已经被另一项取样")
            locations.add(location)
            if not isinstance(style, dict):
                continue
            line, size, weight = [style.get(key) for key in ("line", "size", "weight")]
            if (number(line) and len(samples) == 2
                    and math.dist(*coords) > max(24, 2 * line)):
                self.issue(path + ".bgAt", "请取同一字样旁的背景像素, 两点距离应在两倍行高内, 小字可用 24px")
            if len(samples) != 2 or not number(size) or not number(weight):
                continue
            # WCAG 2.2 SC 1.4.3. The threshold uses unrounded luminances and CSS px at 1x.
            threshold = contrast_minimum(size, weight)
            ratio = contrast_ratio(*samples)
            self.samples.append({"path": path, "state": state, "use": label,
                                 "actual": ["#" + bytes(v).hex() for v in samples],
                                 "ratio": round(ratio, 4), "minimum": threshold})
            sampled_states.add(state)
            if ratio < threshold:
                self.issue(path, f"实测文字对比度 {ratio:.4f}:1 低于所声明字级的 {threshold}:1")
        for state in sorted(states.keys() - sampled_states):
            self.issue("contrast." + state, "请在此状态的 1× 导出中取样文字及邻近底色")

    def variants(self, record, path, required, states):
        if not required and "variants" not in record:
            return
        variants = self.table(record, "variants", path, minimum=2)
        if "default" not in variants:
            self.issue(path + ".variants", "请提供 default 以及一个适用交互态的实图位置")
        evidence = []
        for key, variant, field in self.rows(variants, path + ".variants"):
            self.text(variant, "when", field)
            self.text(variant, "appearance", field)
            surface = variant.get("on")
            target = ("research",) if surface == "research" else surface
            if not isinstance(surface, str) or (surface != "research" and surface not in states):
                self.issue(field + ".on", "请指向 research 或已登记的状态")
                target = None
            elif surface != "research" and (not isinstance(record.get("states"), list) or surface not in record["states"]):
                self.issue(field + ".on", "该组件未声明出现在此状态, 请选择包含该组件的画面")
            image = self.artwork.get(target)
            box = self.box(variant.get("box"), field + ".box", image)
            if box and image:
                evidence.append((key, field, self.named_files[target], box))
        default = next((item for item in evidence if item[0] == "default"), None)
        if default:
            for key, field, path_b, box_b in evidence:
                if key == "default":
                    continue
                x, y, w, h = default[3]
                bx, by, bw, bh = box_b
                if path_b == default[2] and x < bx + bw and bx < x + w and y < by + bh and by < y + h:
                    self.issue(field + ".box", "同一静态图内请分别标出默认态和交互态的独立位置")
                    continue
                if (w, h) != (bw, bh):
                    self.issue(field + ".box", "请为同一控件的两个变体留出同尺寸比较框, 包含全部变化")
                    continue
                try:
                    if not region_differs(self.pixels(default[2]), self.pixels(path_b), default[3], right_origin=box_b[:2]):
                        self.issue(field + ".box", "该交互态与 default 的局部像素相同, 请提供可见变化")
                except (OSError, ValueError) as exc:
                    self.issue(field + ".box", str(exc))

    def controls(self, data, states, final):
        components = self.table(data, "components")
        active = lookup(states, final)
        main_control = active.get("primary") if isinstance(active, dict) else None
        if not isinstance(main_control, str):
            main_control = next((s["primary"] for s in states.values()
                                 if isinstance(s, dict) and isinstance(s.get("primary"), str)), None)
        has_action = False
        for name, item, path in self.rows(components, "components"):
            self.text(item, "role", path)
            visible = item.get("states")
            if not isinstance(visible, list) or not visible or not all(isinstance(k, str) and k in states for k in visible):
                self.issue(path + ".states", "请列出组件出现的已定义状态 ID")
            self.variants(item, path, name == main_control, states)
        for state, item, path in self.rows(states, "states"):
            for key in ("primary", "secondary"):
                value = item.get(key)
                if key in item and value is None:
                    self.text(item, key + "Reason", path)
                    continue
                component = lookup(components, value)
                if (not isinstance(component, dict) or not isinstance(component.get("states"), list)
                        or state not in component["states"]):
                    self.issue(f"{path}.{key}", "请选择在此状态可用的组件, 无此操作可填 null 并说明理由")
                else:
                    has_action = True
            if item.get("primary") is not None and item.get("primary") == item.get("secondary"):
                self.issue(path + ".secondary", "同一状态的主次操作需指向不同组件")
        if not has_action or not isinstance(main_control, str):
            self.issue("states", "至少一个状态需提供推进任务的主操作")

    def check(self, data):
        self.text(data, "task", "")
        states = self.table(data, "states", minimum=2)
        final = self.ref_and_screens(data, states)
        styles, colors = self.foundations(data, final)
        self.contrast(data.get("contrast"), styles, colors, states)
        self.controls(data, states, final)
        self.alignment_samples = check_alignment(self, data, states, final)
        media_boxes = check_media(self, data, final)
        self.text_layer_samples = check_text_layers(self, data, states, colors, media_boxes)
        self.palette_samples = check_palette(self, data, final, colors, self.case_dir, media_boxes)
        self.pixels.cache_clear()

    def report(self):
        return {"ok": not self.errors, "errors": self.errors, "contrastSamples": self.samples,
                "textLayerSamples": getattr(self, "text_layer_samples", []),
                "paletteSamples": getattr(self, "palette_samples", []),
                "alignmentSamples": getattr(self, "alignment_samples", []),
                "mediaSamples": getattr(self, "media_samples", []),
                "manualReview": MANUAL_REVIEW}


def unique_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"重复 JSON 字段 {key!r}")
        result[key] = value
    return result


def reject_constant(token):
    raise ValueError(f"非法 JSON 数字 {token}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument("manifest", type=Path, nargs="?", help="path to a design-system JSON manifest in its delivery directory")
    target.add_argument("--case", choices=CASES, help="list the three source files, native dimensions and SHA-256 for one example")
    parser.add_argument("--json", action="store_true", help="emit diagnostic paths, pixel measurements and manual checks as JSON")
    options = parser.parse_args()
    if options.case:
        try:
            _, views, _ = snapshots(options.case)
        except (ValueError, OSError) as exc:
            print(str(exc), file=sys.stderr)
            return 1
        if options.json:
            print(json.dumps({"case": options.case, "views": views}, indent=2))
        else:
            for row in views.values():
                print(f"{row['image']}  {row['width']}×{row['height']}  {row['sha256']}")
        return 0
    path = options.manifest
    checker = DesignLint(path.parent.resolve())
    try:
        with path.open(encoding="utf-8") as stream:
            data = json.load(stream, object_pairs_hook=unique_keys, parse_constant=reject_constant)
        if not isinstance(data, dict):
            raise ValueError("清单顶层需要 JSON 对象")
        checker.check(data)
    except (OSError, ValueError, RecursionError) as exc:
        checker.issue("$", str(exc))
    report = checker.report()
    if options.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print("自动检查通过" if report["ok"] else f"自动检查未通过, 共 {len(checker.errors)} 项")
        for item in checker.errors:
            print(f"  {item['path']}  {item['message']}")
        for sample in checker.samples:
            print(f"  {sample['path']}  {sample['use']}  {sample['ratio']}:1 (要求 {sample['minimum']}:1)")
        if report["textLayerSamples"]:
            measured = sum(row["status"] == "measured" for row in report["textLayerSamples"])
            manual = len(report["textLayerSamples"]) - measured
            print(f"  原生文字取样 {measured} 项, 另有 {manual} 项需人工复核, 坐标及原因见 --json")
        print("需人工核对")
        for item in MANUAL_REVIEW:
            print(f"  - {item}")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
