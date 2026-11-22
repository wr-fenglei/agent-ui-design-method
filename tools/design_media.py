"""Check the visible pixels of a source swap against the registered state export."""

from math import ceil
import re

from design_images import CHANNELS, region_differs


NO_MEDIA_ONLY = re.compile(r"^(?:n/?a|none|not applicable|no (?:media|images?|artwork)|"
                           r"(?:无|没有|不含|无需)(?:可替换)?(?:媒体|素材|图片|作品|换图)(?:可替换)?)\W*$", re.I)


def overlaps(a, b):
    x, y, w, h = a
    bx, by, bw, bh = b
    return x < bx + bw and bx < x + w and y < by + bh and by < y + h


def ui_anchors(data, state):
    """Use explicit screen-space UI evidence, never the proposed media masks."""
    entries = data.get("contrast")
    for entry in entries if isinstance(entries, list) else ():
        if not isinstance(entry, dict) or entry.get("state") != state:
            continue
        for key in ("fgAt", "bgAt"):
            point = entry.get(key)
            if isinstance(point, list) and len(point) == 2 and all(type(n) is int for n in point):
                yield (*point, 1, 1)
    components = data.get("components")
    for component in components.values() if isinstance(components, dict) else ():
        variants = component.get("variants") if isinstance(component, dict) else None
        for item in variants.values() if isinstance(variants, dict) else ():
            if not isinstance(item, dict) or item.get("on") != state:
                continue
            box = item.get("box")
            if isinstance(box, list) and len(box) == 4 and all(type(n) is int for n in box):
                yield box


def media_boxes(checker, data, state, record, field, base):
    supplied = record.get("boxes")
    if not isinstance(supplied, list) or not supplied:
        checker.issue(field + ".boxes", "请标出实际更换作品的像素框")
        return []
    boxes = []
    anchors = list(ui_anchors(data, state))
    for index, entry in enumerate(supplied):
        path = f"{field}.boxes[{index}]"
        box = checker.box(entry, path, base)
        if not box:
            continue
        if any(overlaps(box, existing) for existing in boxes):
            checker.issue(path, "请使用互不重叠的作品框")
        if any(overlaps(box, anchor) for anchor in anchors):
            checker.issue(path, "作品框覆盖了已标出的界面文字取样或控件")
        boxes.append(box)
    area = sum(w * h for _, _, w, h in boxes)
    if area * 100 > base.width * base.height * 95:
        checker.issue(field + ".boxes", "需保留至少 5% 的可见界面用于比较, 请缩紧作品框或导出带界面的展示状态")
    return boxes


def first_outside_change(left, right, boxes):
    """Compare every unmasked pixel, including narrow gaps between media slots."""
    for y in range(left.height):
        spans = sorted((x, x + w) for x, top, w, h in boxes if top <= y < top + h)
        start = 0
        for end, next_start in [*spans, (left.width, left.width)]:
            if end > start and region_differs(left, right, (start, y, end - start, 1)):
                for x in range(start, end):
                    if region_differs(left, right, (x, y, 1, 1)):
                        return x, y
            start = next_start
    return None


def composited_rgb(pixel):
    """Count a visible replacement on white even for differently encoded PNGs."""
    if pixel[3] == 255:
        return pixel[:3]
    return tuple(255 - ((255 - value) * pixel[3] + 127) // 255 for value in pixel[:3])


def replacement_count(left, right, box):
    x, y, w, h = box
    lb, rb = CHANNELS[left.color], CHANNELS[right.color]
    count = 0
    for row in range(y, y + h):
        left._decode_through(row)
        right._decode_through(row)
        li = row * (1 + left.width * lb) + 1 + x * lb
        ri = row * (1 + right.width * rb) + 1 + x * rb
        for offset in range(w):
            a = composited_rgb(left._visible_rgba(li + offset * lb))
            b = composited_rgb(right._visible_rgba(ri + offset * rb))
            if max(abs(a[i] - b[i]) for i in range(3)) >= 12:
                count += 1
    return count


def check_pair(checker, data, state, record, field):
    base = checker.artwork.get(state)
    if not base:
        checker.issue(field, "请提供该状态的原始 PNG 后对比换图导出")
        return None
    start_errors = len(checker.errors)
    boxes = media_boxes(checker, data, state, record, field, base)
    alt_id = ("media", state)
    checker.image(record.get("alternate"), field + ".alternate", alt_id)
    alternate = checker.artwork.get(alt_id)
    if alternate and (base.width, base.height) != (alternate.width, alternate.height):
        checker.issue(field + ".alternate", "换图前后的导出尺寸必须完全相同")
    if len(checker.errors) != start_errors:
        return None
    try:
        left = checker.pixels(checker.named_files[state])
        right = checker.pixels(checker.named_files[alt_id])
        drift = first_outside_change(left, right, boxes)
        if drift:
            checker.issue(field + ".alternate", f"作品框外的界面像素 ({drift[0]}, {drift[1]}) 发生变化")
        measured = []
        for index, box in enumerate(boxes):
            area = box[2] * box[3]
            minimum = max(4, ceil(area / 10))
            changed = replacement_count(left, right, box)
            measured.append({"box": list(box), "changedPixels": changed, "minimum": minimum})
            if changed < minimum:
                checker.issue(f"{field}.boxes[{index}]", f"只有 {changed} 个像素出现可见换图差异, 该框至少需要 {minimum} 个")
        checker.media_samples.append({"state": state, "boxes": measured,
                                      "outsideUnchanged": drift is None})
    except (OSError, ValueError) as exc:
        checker.issue(field + ".alternate", str(exc))
    return boxes if len(checker.errors) == start_errors else None


def check_media(checker, data, final):
    """Only return exclusions for states that passed their whole media check."""
    checker.media_samples = []
    validated = {}
    states = data.get("states")
    if not isinstance(states, dict):
        return validated
    entries = data.get("media")
    declared = entries.get("states") if isinstance(entries, dict) else None
    if not isinstance(declared, dict):
        checker.issue("media.states", "请逐状态提供换图导出及作品框, 无可替换作品的状态填 null")
        return validated
    for state in declared.keys() - states.keys():
        checker.issue(f"media.states.{state}", "找不到对应的交付状态")
    for state in states:
        field = f"media.states.{state}"
        record = declared.get(state)
        if state in declared and record is None:
            validated[state] = []
        elif not isinstance(record, dict):
            checker.issue(field, "请提供该状态的换图导出和作品框, 无可替换作品时填 null")
        elif set(record) == {"reason"}:
            before = len(checker.errors)
            checker.text(record, "reason", field)
            reason = record["reason"]
            if isinstance(reason, str) and NO_MEDIA_ONLY.fullmatch(reason.strip()):
                checker.issue(field + ".reason", "请写明当前状态实际展示的内容")
            if len(checker.errors) == before:
                validated[state] = []
        elif set(record) == {"alternate", "boxes"}:
            boxes = check_pair(checker, data, state, record, field)
            if boxes:
                validated[state] = boxes
        else:
            checker.issue(field, "有可替换作品时填写 alternate 和 boxes, 无可替换作品时填 null")
    return validated
