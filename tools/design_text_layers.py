"""Check native Figma text against its own visible ink and adjacent flat surface."""

from collections import Counter
import json
from math import inf
from pathlib import Path
import re

from design_media import overlaps


def luminosity(rgb):
    values = [channel / 255 for channel in rgb]
    linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values]
    return sum(v * weight for v, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast_ratio(first, second):
    dark, light = sorted((luminosity(first), luminosity(second)))
    return (light + 0.05) / (dark + 0.05)


def contrast_minimum(size, weight):
    return 3 if size >= 24 or (size >= 14 * 96 / 72 and weight >= 700) else 4.5


def flat_pair(image, box, foreground, declared):
    """Find a foreground actually rendered next to its background in this text layer."""
    x, y, w, h = box
    # Large paragraphs may be checked in the editable document. Bound temporary
    # pixel storage without resizing, which would change the foreground color.
    if w * h > 350000:
        return None
    pixels = [image.rgb(i, j) for j in range(y, y + h) for i in range(x, x + w)]
    counts = Counter(pixels)
    background, bg_count = counts.most_common(1)[0]
    if (foreground == background or background not in declared or
            bg_count < len(pixels) * 0.25 or counts[foreground] < 2):
        return None
    # Require a uniform surface plus glyph antialiasing. A multicolored scene
    # can contain both pigments without using them as a text/background pair.
    span = [f - b for f, b in zip(foreground, background)]
    axis = max(range(3), key=lambda i: abs(span[i]))
    for color, count in counts.items():
        if count < 2:
            continue
        t = (color[axis] - background[axis]) / span[axis]
        if not -0.02 <= t <= 1.02 or any(abs(background[i] + t * span[i] - color[i]) > 4 for i in range(3)):
            return None
    for k, rgb in enumerate(pixels):
        if rgb != foreground:
            continue
        row, col = divmod(k, w)
        # Thin text can have only a few fully covered pixels, spaced across
        # several glyphs. A neighboring antialiased pixel can identify the
        # stroke but must never supply the foreground for the ratio.
        neighbors = ((col - 1, row), (col + 1, row), (col, row - 1), (col, row + 1))
        if not any(0 <= a < w and 0 <= b < h and
                   (pixels[b * w + a][axis] - background[axis]) / span[axis] >= 0.25 for a, b in neighbors):
            continue
        for b in range(max(0, row - 4), min(h - 1, row + 5)):
            for a in range(max(0, col - 4), min(w - 1, col + 5)):
                v = b * w + a
                if pixels[v] == pixels[v + 1] == pixels[v + w] == pixels[v + w + 1] == background:
                    return {"fgAt": [x + col, y + row], "bgAt": [x + a, y + b],
                            "actual": ["#" + bytes(foreground).hex(), "#" + bytes(background).hex()]}
    return None


def read_inventory(directory, locator):
    if not isinstance(locator, str) or not locator.strip():
        raise ValueError("需要交付目录内的原生文字清单路径")
    relative = Path(locator)
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError("请使用交付包内相对路径")
    path = (directory / relative).resolve(strict=True)
    if not path.is_file() or not path.is_relative_to(directory):
        raise ValueError("原生文字清单须为交付包内文件")
    with path.open(encoding="utf-8") as stream:
        data = json.load(stream)
    if (not isinstance(data, dict) or type(data.get("version")) is not int
            or data["version"] != 1 or not isinstance(data.get("states"), dict)):
        raise ValueError("请使用 export_text_layers.js 输出的 version 1 文字清单")
    return data["states"]


def check_text_layers(checker, data, states, colors, media_boxes):
    samples = []
    if "textLayers" not in data:
        return samples
    try:
        registry = read_inventory(checker.directory, data["textLayers"])
    except (OSError, ValueError, RuntimeError) as exc:
        checker.issue("textLayers", str(exc))
        return samples
    for state in sorted(states.keys() ^ registry.keys()):
        checker.issue("textLayers." + state, "原生文字清单状态须与交付画面一致")
    declared_colors = set(colors.values())
    for state in states:
        if state not in registry:
            continue
        field = "textLayers." + state
        path = checker.named_files.get(state)
        if path is None:
            continue
        image = checker.pixels(path)
        frame = registry[state]
        if (not isinstance(frame, dict) or not isinstance(frame.get("frameId"), str) or not frame["frameId"].strip()
                or (frame.get("width"), frame.get("height")) != (image.width, image.height)):
            checker.issue(field, "原生画板应含节点 ID, 尺寸须与 1× 导出一致")
            continue
        layers, issues = frame.get("layers"), frame.get("issues", [])
        if not isinstance(layers, list) or not layers or not isinstance(issues, list):
            checker.issue(field, "请导出画板内的可见原生文字与复核项目")
            continue
        for why in issues:
            samples.append({"state": state, "id": frame["frameId"], "text": "",
                            "status": "manual", "reason": str(why)})
        seen = set()
        for idx, layer in enumerate(layers):
            key = f"{field}.layers[{idx}]"
            if not isinstance(layer, dict):
                checker.issue(key, "缺少原生文字节点")
                continue
            node, text = layer.get("id"), layer.get("text")
            if (not isinstance(node, str) or not node.strip() or node in seen or
                    not isinstance(text, str) or not text.strip()):
                checker.issue(key, "需要独立的原生节点 ID 和可见文字")
                continue
            seen.add(node)
            entry = {"state": state, "id": node, "text": text, "status": "manual"}
            samples.append(entry)
            why = layer.get("manualReason")
            if why is not None:
                checker.text(layer, "manualReason", key)
                entry["reason"] = why
                continue
            box = checker.box(layer.get("box"), key + ".box", image)
            size, weight, fill = layer.get("fontSize"), layer.get("fontWeight"), layer.get("fillHex")
            if (not box or type(size) not in (int, float) or not 0 < size < inf or
                    type(weight) not in (int, float) or not 0 < weight <= 1000 or
                    not isinstance(fill, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", fill)):
                checker.issue(key, "请提供原生字级、字重、实色与像素框, 或由导出器记录复杂样式")
                entry["reason"] = "原生证据不完整"
                continue
            if state not in media_boxes or any(overlaps(box, mask) for mask in media_boxes[state]):
                entry["reason"] = "缺少有效媒体边界或文字框与作品图像重叠"
                continue
            pair = flat_pair(image, box, tuple(bytes.fromhex(fill[1:])), declared_colors)
            if not pair:
                entry["reason"] = "文字框内未辨认出连续实心字与相邻的已声明平坦底色"
                continue
            fg, bg = [bytes.fromhex(c[1:]) for c in pair["actual"]]
            ratio, minimum = contrast_ratio(fg, bg), contrast_minimum(size, weight)
            entry.update(pair, status="measured", ratio=round(ratio, 4), minimum=minimum)
            if ratio < minimum:
                checker.issue(key, f"{node} {text[:50]} 实测 {pair['actual']} 于 {pair['fgAt']} / {pair['bgAt']}, "
                                   f"{ratio:.4f}:1 低于 {minimum}:1")
    return samples
