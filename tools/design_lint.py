"""Check a screen design from its JSON specification and 1× PNG exports."""

import argparse
import json
import math
import re
import sys
from functools import lru_cache
from pathlib import Path

sys.dont_write_bytecode = True
from design_alignment import check_alignment
from design_density import check_density
from design_images import Dimensions, load_image, region_differs
from design_media import check_media
from design_palette import check_palette
from design_text_layers import check_text_layers, contrast_minimum, contrast_ratio


EXAMPLES = Path(__file__).resolve().parent.parent / "examples"
CASES = ("linear", "shadcn-ui", "apple-glass")
MANUAL_REVIEW = [
    "查看 1× 导出, 核对主体、阅读顺序、分组与操作位置",
    "核对实际文字、媒体边界和控件变体, 在可操作原型中完成任务",
]
PLACEHOLDER = re.compile(r"\b(todo|tbd|placeholder|lorem ipsum|fixme)\b|待填|待补|待完善", re.I)


def number(value):
    if type(value) not in (int, float):
        return False
    try:
        return math.isfinite(value)
    except OverflowError:
        return False


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
        self.pixels = lru_cache(maxsize=2)(image_pixels)
        self.samples = []
        self.layout_samples = {}
        self.layout_only = False

    def issue(self, path, message):
        self.errors.append({"path": path, "message": message})

    def text(self, record, key, path):
        value = record.get(key)
        if (not isinstance(value, str) or not value.strip() or PLACEHOLDER.search(value)
                or value.strip().casefold() == key.casefold()):
            self.issue(f"{path}.{key}".lstrip("."), "请填写本稿中的具体内容")
        return value

    def table(self, record, key, path="", minimum=1):
        value = record.get(key)
        if not isinstance(value, dict) or len(value) < minimum:
            self.issue(f"{path}.{key}".lstrip("."), f"需要含至少 {minimum} 项的 JSON 对象")
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

    def local_file(self, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("请填写交付目录内的文件路径")
        relative = Path(value)
        if relative.is_absolute() or ".." in relative.parts:
            raise ValueError("请使用交付目录内的相对路径")
        path = (self.directory / relative).resolve(strict=True)
        if not path.is_relative_to(self.directory) or not path.is_file():
            raise ValueError("引用须指向交付目录内的文件")
        return path

    def image(self, value, field, name):
        try:
            path = self.local_file(value)
            image = self.pixels(path)
            self.named_files[name] = path
            self.artwork[name] = Dimensions(image.width, image.height)
        except (OSError, ValueError, RuntimeError) as exc:
            self.issue(field, f"请提供可读取的 1× PNG, {exc}")

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

    def screens(self, states):
        for state, item, path in self.rows(states, "states"):
            self.image(item.get("screen"), path + ".screen", state)

    def check_delivery(self, data, states):
        self.text(data, "task", "")
        ref = self.table(data, "reference")
        case = ref.get("case")
        case_dir = EXAMPLES / case if case in CASES else None
        if case_dir is None:
            self.issue("reference.case", "请选择 linear, shadcn-ui 或 apple-glass")
        try:
            path = self.local_file(data.get("process", "process.md"))
            if path.suffix.lower() != ".md" or not path.read_text(encoding="utf-8").strip():
                raise ValueError("请提供有内容的 Markdown 文件")
        except (OSError, ValueError, RuntimeError) as exc:
            self.issue("process", f"请检查设计过程 Markdown 文件, {exc}")
        final = data.get("finalState")
        if not isinstance(final, str) or final not in states:
            self.issue("finalState", "请选择 states 中的主画面")
            final = None
        by_size = {}
        for state, item, path in self.rows(states, "states"):
            self.text(item, "signal", path)
            image = self.artwork.get(state)
            if image is None:
                continue
            size = image.width, image.height
            for other in by_size.setdefault(size, []):
                if not region_differs(self.pixels(self.named_files[other]),
                                      self.pixels(self.named_files[state]), (0, 0, *size)):
                    self.issue(path + ".screen", f"画面与 states.{other}.screen 的可见像素相同, 请导出状态变化")
                    break
            by_size[size].append(state)
        return final, case_dir

    def foundations(self, data, final):
        layout = self.table(data, "layout")
        zones = self.table(layout, "zones", "layout")
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
            family = self.text(item, "family", path)
            size = self.scale(item, "size", path, positive=True)
            line = self.scale(item, "line", path, positive=True)
            weight = self.scale(item, "weight", path, positive=True, maximum=1000)
            if isinstance(family, str) and size and line and weight:
                ranks.add((family, size, line, weight))
        if len(styles) >= 2 and len(ranks) == 1:
            self.issue("type", "请提供具有字族、字号、行高或字重区别的标题与正文样式")
        colors = {}
        for name, item, path in self.rows(self.table(data, "colors", minimum=2), "colors"):
            value = item.get("hex")
            if isinstance(value, str) and re.fullmatch(r"#[\da-fA-F]{6}", value, re.ASCII):
                colors[name] = tuple(bytes.fromhex(value[1:]))
            else:
                self.issue(f"{path}.hex", "请填写实际 sRGB 颜色 #RRGGBB")
        spacing = self.table(data, "spacing")
        gaps = self.table(spacing, "gaps", "spacing", minimum=2)
        for name in gaps:
            self.scale(gaps, name, "spacing.gaps")
        edges = self.table(data, "edges")
        for key in ("width", "radius"):
            self.scale(edges, key, "edges")
        icons = self.table(data, "icons")
        if icons.get("used") is not False:
            if "used" in icons and icons["used"] is not True:
                self.issue("icons.used", "请填写 true 或 false")
            self.scale(icons, "size", "icons", positive=True)
            self.scale(icons, "stroke", "icons")
        material = self.table(data, "material")
        if type(material.get("used")) is not bool:
            self.issue("material.used", "请填写 true 或 false")
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
            label = self.text(entry, "use", path)
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
            if "image" in variant:
                if "on" in variant or "box" in variant:
                    self.issue(field, "单独导出的控件使用整张 image, 画面内的控件请使用 on 和 box")
                    continue
                target = ("component", path, key)
                self.image(variant["image"], field + ".image", target)
                image = self.artwork.get(target)
                box = (0, 0, image.width, image.height) if image else None
            else:
                target = variant.get("on")
                visible = record.get("states")
                if not isinstance(target, str) or target not in states or not isinstance(visible, list) or target not in visible:
                    self.issue(field + ".on", "请选择该组件所在的已登记状态, 或用 image 指向单独的控件 PNG")
                    continue
                image = self.artwork.get(target)
                box = self.box(variant.get("box"), field + ".box", image)
            if box and image:
                locator = field + (".image" if "image" in variant else ".box")
                evidence.append((key, locator, self.named_files[target], box))
        default = next((item for item in evidence if item[0] == "default"), None)
        if default:
            for key, field, path_b, box_b in evidence:
                if key == "default":
                    continue
                x, y, w, h = default[3]
                bx, by, bw, bh = box_b
                if path_b == default[2] and x < bx + bw and bx < x + w and y < by + bh and by < y + h:
                    self.issue(field, "同一静态图内请分别标出默认态和交互态的独立位置")
                    continue
                if (w, h) != (bw, bh):
                    self.issue(field, "请为同一控件的两个变体留出同尺寸比较框, 包含全部变化")
                    continue
                try:
                    if not region_differs(self.pixels(default[2]), self.pixels(path_b), default[3], right_origin=box_b[:2]):
                        self.issue(field, "该交互态与 default 的局部像素相同, 请提供可见变化")
                except (OSError, ValueError) as exc:
                    self.issue(field, str(exc))

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
                if value is None:
                    continue
                component = lookup(components, value)
                if (not isinstance(component, dict) or not isinstance(component.get("states"), list)
                        or state not in component["states"]):
                    self.issue(f"{path}.{key}", "请选择在此状态可用的组件, 无此操作可省略")
                else:
                    has_action = True
            if item.get("primary") is not None and item.get("primary") == item.get("secondary"):
                self.issue(path + ".secondary", "同一状态的主次操作需指向不同组件")
        if not has_action or not isinstance(main_control, str):
            self.issue("states", "至少一个状态需提供推进任务的主操作")

    def check(self, data, *, layout_only=False):
        self.layout_only = layout_only
        states = self.table(data, "states", minimum=1 if layout_only else 2)
        self.screens(states)
        if layout_only:
            self.layout_samples = check_density(self, data, states)
            return
        final, case_dir = self.check_delivery(data, states)
        styles, colors = self.foundations(data, final)
        self.contrast(data.get("contrast"), styles, colors, states)
        self.controls(data, states, final)
        self.alignment_samples = check_alignment(self, data, states, final)
        media_boxes = check_media(self, data, final)
        self.layout_samples = check_density(self, data, states, media_boxes)
        self.text_layer_samples = check_text_layers(self, data, states, colors, media_boxes)
        self.palette_samples = check_palette(self, data, final, colors, case_dir, media_boxes)

    def report(self):
        report = {"ok": not self.errors, "errors": self.errors, "layoutSamples": self.layout_samples}
        if not self.layout_only:
            report.update(contrastSamples=self.samples, textLayerSamples=getattr(self, "text_layer_samples", []),
                          paletteSamples=getattr(self, "palette_samples", []),
                          alignmentSamples=getattr(self, "alignment_samples", []),
                          mediaSamples=getattr(self, "media_samples", []), manualReview=MANUAL_REVIEW)
        return report


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
    parser.add_argument("manifest", type=Path, help="交付目录内的设计规范 JSON")
    parser.add_argument("--layout-only", action="store_true", help="首稿检查, 只需 states 及各状态的 screen")
    parser.add_argument("--json", action="store_true", help="输出结构化诊断与测量结果")
    options = parser.parse_args()
    path = options.manifest
    checker = DesignLint(path.parent.resolve())
    checker.layout_only = options.layout_only
    try:
        with path.open(encoding="utf-8") as stream:
            data = json.load(stream, object_pairs_hook=unique_keys, parse_constant=reject_constant)
        if not isinstance(data, dict):
            raise ValueError("清单顶层需要 JSON 对象")
        checker.check(data, layout_only=options.layout_only)
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
        if report.get("textLayerSamples"):
            measured = sum(row["status"] == "measured" for row in report["textLayerSamples"])
            manual = len(report["textLayerSamples"]) - measured
            print(f"  原生文字取样 {measured} 项, 另有 {manual} 项需人工复核, 坐标及原因见 --json")
        if report.get("manualReview"):
            print("需人工核对")
        for item in report.get("manualReview", []):
            print(f"  - {item}")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
