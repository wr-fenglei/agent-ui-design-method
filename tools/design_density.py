"""Measure spacing and horizontal dividers in a composited, native-size UI PNG."""

import argparse
import json
import sys
from array import array
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from statistics import median

from design_images import CHANNELS, load_image, region_differs
from design_media import replacement_count


# Pixel coordinates and thresholds are for 1x desktop exports. Both directions
# of contrast work. No authored threshold, crop or zone selects what to scan.
MIN_WIDTH = 144
MIN_INK_DELTA = 32
MIN_RULE_DELTA = 7


def delta(a, b):
    return max(abs((a & 255) - (b & 255)),
               abs(((a >> 8) & 255) - ((b >> 8) & 255)),
               abs(((a >> 16) & 255) - ((b >> 16) & 255)))


def packed_rows(image, top=0, bottom=None):
    """Retain alpha so empty transparent canvas and uncomposited ink are ignored."""
    bottom = image.height if bottom is None else bottom
    image._decode_through(bottom - 1)
    width = image.width
    stride = 1 + width * CHANNELS[image.color]
    for y in range(top, bottom):
        offset = y * stride + 1
        raw = image.data[offset:offset + stride - 1]
        if image.color == 6:
            rgba = raw
        elif image.color == 2 and not image.transparency:
            rgba = bytearray(b'\xff' * (width * 4))
            for c in range(3):
                rgba[c::4] = raw[c::3]
        else:
            rgba = bytearray()
            for x in range(width):
                rgba.extend(image._visible_rgba(offset + x * CHANNELS[image.color]))
        pixels = array('I')
        pixels.frombytes(rgba)
        if sys.byteorder == 'big':
            pixels.byteswap()
        yield pixels


def flat_spans(rows):
    spans = defaultdict(list)
    for y, row in enumerate(rows):
        left, last = 0, row[0]
        for x, color in enumerate(row):
            if color == last:
                continue
            if x - left >= MIN_WIDTH and last >> 24 == 255:
                spans[left, x, last].append(y)
            left, last = x, color
        if len(row) - left >= MIN_WIDTH and last >> 24 == 255:
            spans[left, len(row), last].append(y)
    return spans


def clusters(values, gap):
    """Return exclusive-end runs of sorted unique integer coordinates."""
    bounds = []
    for value in values:
        if bounds and value - bounds[-1][1] <= gap:
            bounds[-1][1] = value + 1
        else:
            bounds.append([value, value + 1])
    return bounds


@dataclass
class Rule:
    left: int
    right: int
    top: int
    bottom: int
    background: int


def horizontal_rules(rows, spans):
    height, width = len(rows), len(rows[0])
    rules = []
    for (left, right, color), ys in spans.items():
        width_px = right - left
        for top, bottom in clusters(ys, 0):
            if bottom - top > 2 or top < 3 or bottom + 2 >= height:
                continue
            # A divider has the same surface above and below across its span.
            xs = [left + width_px * k // 8 for k in range(1, 8)]
            neighbors = [rows[top - 2][x] for x in xs] + [rows[bottom + 1][x] for x in xs]
            bg = neighbors[0]
            if (bg >> 24 != 255 or delta(bg, color) < MIN_RULE_DELTA
                    or any(delta(v, bg) > 3 for v in neighbors)):
                continue
            # An outline turns at an endpoint. Test the two adjacent horizontal
            # bands and a few pixels around each end, including rounded corners.
            ends = (left, right - 1)
            def turns_at(edge, y1, y2):
                end = range(max(0, edge - 5), min(width, edge + 6))
                return all(rows[yy][(left + right) // 2] != color
                           and any(rows[yy][x] == color for x in end) for yy in (y1, y2))

            if any(turns_at(edge, top - 2, top - 3) or turns_at(edge, bottom + 1, bottom + 2)
                   for edge in ends):
                continue
            rules.append(Rule(left, right, top, bottom, bg))
    # A two-tone antialiased stroke can produce overlapping candidates on
    # adjacent scanlines. Preserve one physical stroke for counts and groups.
    merged = []
    for line in sorted(rules, key=lambda r: r.top):
        same_stroke = None
        for other in reversed(merged):
            if line.top - other.bottom > 1:
                break
            if (line.top <= other.bottom and abs(other.left - line.left) <= 3
                    and abs(other.right - line.right) <= 3
                    and delta(other.background, line.background) <= 3):
                same_stroke = other
                break
        if same_stroke:
            same_stroke.bottom = max(same_stroke.bottom, line.bottom)
        else:
            merged.append(line)
    return merged


def column_runs(columns):
    return clusters(sorted(columns), 21)


@dataclass
class Band:
    top: int
    bottom: int
    columns: set
    broad: bool

    @property
    def height(self):
        return self.bottom - self.top

    def is_text(self):
        # The projection must retain separate strokes. A single painted shape,
        # thumbnail, edge or toolbar fill cannot serve as the text at either end.
        return (5 <= self.height <= 48 and not self.broad and len(self.columns) >= 6
                and len(clusters(sorted(self.columns), 0)) >= 2)


def content_bands(rows, left, right, top, bottom, bg):
    """Project visible content onto y; ignore only isolated thin horizontal rules."""
    bands = []
    width = right - left
    for y in range(top, bottom):
        row = rows[y]
        ink = set()
        changed = 0
        for x in range(left, right):
            color = row[x]
            if color != bg and color >> 24 == 255:
                diff = delta(color, bg)
                if diff >= MIN_RULE_DELTA:
                    changed += 1
                if diff >= MIN_INK_DELTA:
                    ink.add(x)
        # A filled surface or image blocks a gap even when its contrast is
        # too low for text. Repeated table rules are removed after banding.
        broad = changed > width * 0.62
        if len(ink) < 3 and not broad:
            continue
        if bands and y - bands[-1].bottom <= 2:
            band = bands[-1]
            band.bottom = y + 1
            band.columns.update(ink)
            band.broad |= broad
        else:
            bands.append(Band(y, y + 1, ink, broad))
    return [b for b in bands if not (b.broad and b.height <= 2)]


def finding(rule, box, message, **measurements):
    return dict(rule=rule, box=list(box), message=message, **measurements)


def line_families(rules):
    families = []
    for rule in rules:
        for family in families:
            first = family[0]
            if (abs(first.left - rule.left) <= 3 and abs(first.right - rule.right) <= 3
                    and delta(first.background, rule.background) <= 3):
                family.append(rule)
                break
        else:
            families.append([rule])
    return families


def divider_findings(rows, rules):
    findings = []
    for family in line_families(rules):
        simple = []
        head = family[0]
        for first, second in zip(family, family[1:]):
            gap = second.top - first.bottom
            if gap > 110:
                head = second
                simple = []
                continue
            left, right = max(first.left, second.left), min(first.right, second.right)
            bands = content_bands(rows, left, right, first.bottom, second.top, first.background)
            box = (left, first.top, right - left, second.bottom - first.top)
            # Adjacent colors can be the antialiased parts of a single stroke.
            mid = (first.bottom + second.top) // 2
            if (2 <= gap <= 16 and not bands
                    and all(delta(rows[mid][left + (right - left) * k // 8], first.background) <= 3
                            for k in range(1, 8))):
                findings.append(finding("double-divider", box,
                                        f"两条同宽横线之间净空 {gap} px, 未测到内容",
                                        linesY=[first.top, second.top], gap=gap))
            # Open field lists with widely separated, short text are distinct
            # from a bordered table or a row with several comparison columns.
            row = bands[0] if len(bands) == 1 and bands[0].is_text() else None
            cols = column_runs(row.columns) if row else []
            if (len(cols) != 2 or gap < 36 or row.height > 0.42 * gap
                    or cols[1][0] - left > (right - left) * 0.45
                    or right - cols[-1][1] < (right - left) * 0.18):
                simple = []
                continue
            starts = [p[0] for p in cols]
            if simple and max(abs(a - b) for a, b in zip(simple[0][3], starts)) > 8:
                simple = []
            simple.append((first, second, row.height, starts))
            if len(simple) >= 3:
                # A visible header with these same column anchors establishes
                # a comparison grid even if it has only two columns.
                above = content_bands(rows, left, right, max(0, head.top - 40),
                                      head.top, head.background)
                if above and above[-1].is_text() and head.top - above[-1].bottom <= 20:
                    headers = column_runs(above[-1].columns)
                    if len(headers) == 2 and all(abs(col[0] - x) <= 8 for col, x in zip(headers, starts)):
                        continue
                edges = [simple[0][0].top] + [s[1].top for s in simple]
                heights = [s[2] for s in simple]
                box = (left, edges[0], right - left, second.bottom - edges[0])
                item = finding("repeated-dividers", box,
                               f"{len(edges)} 条开放横线分隔 {len(simple)} 行两列短内容, "
                               f"行内墨迹高 {min(heights)}–{max(heights)} px",
                               linesY=edges, inkHeights=heights, columnStarts=starts)
                if findings and findings[-1].get("linesY") == edges[:-1]:
                    findings[-1] = item
                else:
                    findings.append(item)
    return findings


def panel_intervals(rows, spans):
    """Recover flat panels from repeated full-width blank runs and persistent sides."""
    width, height = len(rows[0]), len(rows)
    for (left, right, bg), ys in spans.items():
        if len(ys) < 12 or ys[-1] - ys[0] < 90:
            continue

        def side_continues(y):
            row = rows[y]
            return ((left == 0 or row[left - 1] != bg) and row[left] == bg
                    and (right == width or row[right] != bg) and row[right - 1] == bg)

        # A gap inside an artwork must not extrapolate from a glyph or image
        # detail into the rest of the screen. Require actual surface edges.
        if sum(side_continues(y) for y in ys[::4]) < len(ys[::4]) * 0.85:
            continue
        intervals = clusters((y for y in range(ys[0], ys[-1] + 1) if side_continues(y)), 2)
        for top, bottom in intervals:
            if bottom - top < 96:
                continue
            # Endpoints created by an adjacent glyph do not persist beyond the
            # blank strip. Check well-spaced rows across the recovered panel.
            ys_test = range(top, bottom, 8)
            if sum(side_continues(y) for y in ys_test) < len(ys_test) * 0.9:
                continue
            if sum(1 for y in ys if top <= y < bottom) < 12:
                continue
            yield left, right, top, bottom, bg


def visible_panel_findings(rows, panels):
    height, width = len(rows), len(rows[0])
    findings = []
    inspected = []
    for left, right, top, bottom, bg in panels:
        panel_width, panel_height = right - left, bottom - top
        bands = content_bands(rows, left + 3, right - 3, top, bottom, bg)
        texts = [b for b in bands if b.is_text()]
        if not texts:
            continue
        inspected.append(dict(box=[left, top, panel_width, panel_height], textBands=len(texts)))
        for i, (a, b) in enumerate(zip(bands, bands[1:])):
            gap = b.top - a.bottom
            if gap < 64 or not (a.is_text() and b.is_text()):
                continue
            if abs(min(a.columns) - min(b.columns)) > 12:
                continue
            # A pinned footer, an empty canvas margin or the first element of
            # an unrelated region lacks consecutive peers on both sides.
            near = []
            if i > 0 and bands[i - 1].is_text():
                near.append(a.top - bands[i - 1].bottom)
            if i + 2 < len(bands) and bands[i + 2].is_text():
                near.append(bands[i + 2].top - b.bottom)
            if len(near) != 2 or gap < max(2.25 * median(near), 3 * max(a.height, b.height)):
                continue
            if b.top >= bottom - min(96, panel_height * 0.15):
                continue
            box = (left, a.bottom, panel_width, gap)
            findings.append(finding("content-gap", box,
                                    f"同栏相邻墨迹间隔 {gap} px, 前后间距 {near[0]} 和 {near[1]} px",
                                    adjacentGaps=near, inkHeights=[a.height, b.height]))
        # A finite, inset card must be painted on all sides. Whole windows,
        # sidebars, toolbar strips, rounded outlines and poster margins do not
        # qualify simply because little of the available canvas contains text.
        if (left == 0 or right == width or top <= 4 or bottom >= height - 4
                or panel_height > height * 0.65 or panel_height < 112
                or not (1 <= len(bands) <= 4 and len(texts) == len(bands))):
            continue
        if any(rows[y][(left + right) // 2] == bg for y in (top - 4, bottom + 3)):
            continue
        upper, lower = texts[0].top - top, bottom - texts[-1].bottom
        occupied = texts[-1].bottom - texts[0].top
        if (max(upper, lower) >= 64 and occupied <= panel_height * 0.35
                and max(upper, lower) >= 3 * max(b.height for b in texts)):
            findings.append(finding("sparse-container", (left, top, panel_width, panel_height),
                                    f"封闭底面高 {panel_height} px, 内容跨 {occupied} px, "
                                    f"上下净空分别为 {upper} 和 {lower} px",
                                    padding=[upper, lower], contentSpan=occupied))
    return findings, inspected


def analyze_layout(image):
    rows = list(packed_rows(image))
    spans = flat_spans(rows)
    rules = horizontal_rules(rows, spans)
    panels, inspected = visible_panel_findings(rows, panel_intervals(rows, spans))
    return {"size": [image.width, image.height],
            "findings": [*panels, *divider_findings(rows, rules)],
            "manualReview": [] if inspected else ["未识别可连续测量文字间距的平面容器, 请按 1× 图检查栏内实际内容间距"],
            "measurements": {"panels": inspected,
                             "openRules": [[r.left, r.top, r.right - r.left, r.bottom - r.top]
                                           for r in rules]}}


def contains(outer, inner):
    x, y, w, h = outer
    bx, by, bw, bh = inner
    return x <= bx and y <= by and x + w >= bx + bw and y + h >= by + bh


def measured_reservation(base, alternate, item):
    """Prove the same space is occupied in a registered state at the same scale."""
    if (base.width, base.height) != (alternate.width, alternate.height):
        return None
    x, y, w, h = item["box"]
    rule = item["rule"]
    if rule == "double-divider":
        return None
    # Local context must match across both states. A different layout that
    # happens to have text at the same coordinates is insufficient evidence.
    if (y < 3 or y + h + 3 > base.height
            or any(region_differs(base, alternate, (x, yy, w, 3)) for yy in (y - 3, y + h))):
        return None
    if rule == "sparse-container":
        upper, lower = item["padding"]
        if lower > upper:
            y += h - lower
        h = max(upper, lower)
    sample = Counter(base.rgb(xx, yy) for xx in range(x + 5, x + w - 4, 12)
                     for yy in range(y, y + h, 6))
    color, count = sample.most_common(1)[0]
    if count < sum(sample.values()) * 0.55:
        return None
    r, g, b = color
    bg = r | (g << 8) | (b << 16) | (255 << 24)
    # Read only the evidence crop. Both border strips above used original
    # image coordinates, so the subsequent bands can be reported in those units.
    rows = list(packed_rows(alternate, y, y + h))
    if rule == "repeated-dividers":
        starts = []
        if any(region_differs(base, alternate, (x, line, w, 1)) for line in item["linesY"]):
            return None
        for y1, y2 in zip(item["linesY"], item["linesY"][1:]):
            bands = content_bands(rows, x + 3, x + w - 3, y1 + 2 - y, y2 - y, bg)
            if len(bands) != 1 or not bands[0].is_text():
                return None
            cols = column_runs(bands[0].columns)
            if len(cols) < 3:
                return None
            starts.append([col[0] for col in cols])
        if all(len(row) == len(starts[0])
               and all(abs(a - b) <= 8 for a, b in zip(starts[0], row)) for row in starts):
            return {"measuredColumns": starts}
        return None
    if rule in ("sparse-container", "content-gap"):
        bands = content_bands(rows, x + 3, x + w - 3, 0, h, bg)
        texts = [b for b in bands if b.is_text()]
        if (len(texts) >= 2 and len(texts) == len(bands)
                and texts[-1].bottom - texts[0].top >= h * 0.35):
            return {"occupiedBandsY": [[y + b.top, y + b.bottom] for b in texts]}
    return None


def apply_exceptions(checker, states, state, entries, report, path):
    if not isinstance(entries, list):
        checker.issue(path, "局部例外需逐项指明 rule、box、reason 和 evidenceState")
        return
    for index, entry in enumerate(entries):
        field = f"{path}[{index}]"
        if not isinstance(entry, dict) or set(entry) != {"rule", "box", "reason", "evidenceState"}:
            checker.issue(field, "例外需精确对应一次实测, 并引用可验证该取舍的另一个状态")
            continue
        item = next((f for f in report["findings"] if f["rule"] == entry["rule"]
                     and f["box"] == entry["box"] and "evidence" not in f), None)
        other = entry["evidenceState"]
        if (item is None or not isinstance(other, str) or other == state
                or other not in checker.named_files or other not in states):
            checker.issue(field, "请引用当前报告的规则与准确坐标, 并指定不同的已交付状态")
            continue
        before = len(checker.errors)
        checker.text(entry, "reason", field)
        if len(checker.errors) != before:
            continue
        try:
            evidence = measured_reservation(checker.pixels(checker.named_files[state]),
                                            checker.pixels(checker.named_files[other]), item)
        except (OSError, ValueError) as exc:
            checker.issue(field, str(exc))
            continue
        if evidence:
            item["evidence"] = dict(state=other, reason=entry["reason"], **evidence)
        else:
            checker.issue(field, "引用状态的同位置没有测到保留空间所容纳的多行内容或对齐的数据列")


def check_density(checker, data, states, verified_media=None):
    reports = {}
    for state, state_data in states.items():
        path = checker.named_files.get(state)
        if path is None:
            continue
        try:
            image = checker.pixels(path)
            report = analyze_layout(image)
            media = (verified_media or {}).get(state, [])
            alternate = checker.named_files.get(("media", state))
            for item in report["findings"]:
                box = item["box"]
                if alternate and any(contains(mask, box) for mask in media):
                    changed = replacement_count(image, checker.pixels(alternate), box)
                    if changed >= box[2] * box[3] * 0.35:
                        item["evidence"] = {"mediaChangedPixels": changed}
            if isinstance(state_data, dict) and "layoutExceptions" in state_data:
                apply_exceptions(checker, states, state, state_data["layoutExceptions"], report,
                                 f"states.{state}.layoutExceptions")
            reports[state] = report
            for item in report["findings"]:
                if "evidence" not in item:
                    checker.issue(f"states.{state}.screen", f"{item['rule']} {item['box']}: {item['message']}")
        except (ValueError, OSError) as exc:
            checker.issue(f"states.{state}.screen", str(exc))
    return reports


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("screen", type=Path, help="单张 1× 状态 PNG")
    parser.add_argument("--json", action="store_true", help="输出各项实测记录")
    args = parser.parse_args()
    try:
        report = analyze_layout(load_image(args.screen, pixels=True))
    except (ValueError, OSError) as exc:
        parser.exit(2, f"{args.screen}: {exc}\n")
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        for item in report["findings"]:
            print(f"{item['rule']} {item['box']}  {item['message']}")
        for note in report["manualReview"]:
            print(note)
        print(f"检查 {args.screen.name}, {len(report['findings'])} 项待处理")
    return int(bool(report["findings"]))


if __name__ == "__main__":
    sys.exit(main())
