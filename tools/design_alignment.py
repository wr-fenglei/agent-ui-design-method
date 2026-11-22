"""Measure single-line decision buttons in the original 1x PNG."""

from collections import Counter


class ManualGeometry(ValueError):
    """The crop has visible content but its flat single-line geometry is ambiguous."""


def measure_button(image, box):
    """Find an enclosed flat fill, then read the visible ink between its edges."""
    x, y, w, h = box
    if w * h > 262144 or x == 0 or y == 0 or x+w >= image.width or y+h >= image.height:
        raise ValueError("请框出单个按钮并保留可读取的屏内外沿")
    # Read one extra pixel around the crop. A cut through the button fill
    # connects it to this guard and cannot masquerade as a new button edge.
    stride = w + 2
    pixels = [image.rgb(i, j) for j in range(y-1, y+h+1) for i in range(x-1, x+w+1)]
    center = Counter(pixels[j*stride+i] for j in range(1+h//4, 1+h-h//4)
                     for i in range(1+w//4, 1+w-w//4))
    fill = center.most_common(1)[0][0]
    if not any(pixels[j*stride+i] != fill for j in range(1, h+1) for i in range(1, w+1)):
        raise ValueError("实图框内只有一个色值, 请标出可见的按钮内容")
    remaining = {i for i, pixel in enumerate(pixels) if pixel == fill}
    surface = set()
    while remaining:
        seed = remaining.pop()
        stack = [seed]
        region = {seed}
        touches_guard = False
        while stack:
            i = stack.pop()
            if i < stride or i >= len(pixels)-stride or i % stride in (0, stride-1):
                touches_guard = True
            for neighbor in (i-1, i+1, i-stride, i+stride):
                if neighbor in remaining:
                    remaining.remove(neighbor)
                    region.add(neighbor)
                    stack.append(neighbor)
        if not touches_guard and len(region) > len(surface):
            surface = region
    if len(surface) < max(9, w*h/4):
        raise ManualGeometry("框内未识别完整的单色按钮底面, 请检查边界或说明不适用的样式")

    # The left/right ends of each interior scanline exclude the outline,
    # antialiased rounded corners, outer shadows and focus rings.
    spans = {}
    for i in surface:
        row, col = divmod(i, stride)
        if row in spans:
            left, right = spans[row]
            spans[row] = min(left, col), max(right, col)
        else:
            spans[row] = col, col
    left = min(a for a, b in spans.values())
    right = max(b for a, b in spans.values())
    top, bottom = min(spans), max(spans)
    sw, sh = right-left+1, bottom-top+1
    if sw < w/2 or sh < h/2 or len(surface) < sw*sh/2:
        raise ManualGeometry("框内没有占据主体的连续按钮底面, 请核对按钮框")
    foreground = set()
    for row, (start, end) in spans.items():
        for col in range(start+1, end):
            i = row*stride+col
            pixel = pixels[i]
            if max(abs(a-b) for a, b in zip(fill, pixel)) >= 48:
                foreground.add(i)
    # Keep diagonal and 1px strokes while rejecting isolated raster noise.
    neighbors = (-stride-1, -stride, -stride+1, -1, 1, stride-1, stride, stride+1)
    ink = [divmod(i, stride) for i in foreground if any(i+n in foreground for n in neighbors)]
    if len(ink) < 3:
        raise ValueError("底面内缺少可测的文字或图标像素, 请核对实图位置")
    ink_rows = sorted({row for row, col in ink})
    first, last = ink_rows[0], ink_rows[-1]
    ink_left, ink_right = min(col for row, col in ink), max(col for row, col in ink)
    starts = [i for i in range(1, len(ink_rows)) if ink_rows[i]-ink_rows[i-1] >= 4]
    bands = [ink_rows[a:b] for a, b in zip([0, *starts], [*starts, len(ink_rows)])]
    return {"surfaceBox": [x-1+left, y-1+top, sw, sh],
            "inkBox": [x-1+ink_left, y-1+first, ink_right-ink_left+1, last-first+1],
            "inkBands": [[y-1+band[0], y-1+band[-1]] for band in bands if len(band) >= 3],
            "offsetY": (first+last-top-bottom)/2}


def check_alignment(checker, data, states, final):
    """Check one decision group, using its existing primary default evidence."""
    state = final
    if not isinstance(states.get(state), dict) or not isinstance(states[state].get("primary"), str):
        state = next((name for name, row in states.items()
                      if isinstance(row, dict) and isinstance(row.get("primary"), str)), None)
    if state is None:
        return []
    component = states[state]["primary"]
    components = data.get("components")
    control = components.get(component) if isinstance(components, dict) else None
    variants = control.get("variants") if isinstance(control, dict) else None
    default = variants.get("default") if isinstance(variants, dict) else None
    if not isinstance(default, dict):
        return []  # Missing default evidence is already reported by controls().
    field = f"components.{component}.variants.default"
    if default.get("on") != state:
        checker.issue(field+".on", f"请使用主操作在待决定状态 {state} 的原尺寸导出")
        return []
    reason = default.get("alignmentReason")
    if "alignmentReason" in default:
        checker.text(default, "alignmentReason", field)
        if "peerBox" in default or "peerAlign" in default:
            checker.issue(field+".alignmentReason", "提供同排按钮时请核对实图位置, 或移除同排声明并说明人工核对原因")
    mode = default.get("peerAlign", "center")
    if mode not in ("top", "center", "bottom") or ("peerAlign" in default and "peerBox" not in default):
        checker.issue(field+".peerAlign", "请为同排 peerBox 选择 top、center 或 bottom")
        return []
    path = checker.named_files.get(state)
    if not path:
        return []
    samples = []
    for key in ("box", "peerBox"):
        if key == "peerBox" and key not in default:
            continue
        try:
            image = checker.pixels(path)
            box = checker.box(default.get(key), field+"."+key, image)
            if not box:
                continue
            sample = measure_button(image, box)
        except ManualGeometry as exc:
            if reason and key == "box":
                samples.append({"state": state, "component": component, "role": "primary",
                                "box": list(box), "manualReason": reason, "observed": str(exc)})
            else:
                checker.issue(field+"."+key, f"{state} {default.get(key)}: {exc}")
            continue
        except (OSError, ValueError) as exc:
            checker.issue(field+"."+key, f"{state} {default.get(key)}: {exc}")
            continue
        sample.update(state=state, component=component, role="primary" if key == "box" else "peer")
        samples.append(sample)
        if reason and key == "box" and len(sample["inkBands"]) >= 2:
            sample["manualReason"] = reason
            continue
        offset = sample["offsetY"]
        if abs(offset) >= 4:
            direction = "下" if offset > 0 else "上"
            checker.issue(field+"."+key, f"{state} 按钮底面 {sample['surfaceBox']} 内的字形或图标 "
                          f"{sample['inkBox']} 偏{direction} {abs(offset):g} px, 请检查内容纵向位置")
    if len(samples) == 2 and "surfaceBox" in samples[0]:
        x, y, w, h = samples[0]["surfaceBox"]
        px, py, pw, ph = samples[1]["surfaceBox"]
        if px < x+w and x < px+pw:
            checker.issue(field+".peerBox", "同排按钮的实测底面横向重叠, 请框出另一个按钮")
        else:
            factor = {"top": 0, "center": 0.5, "bottom": 1}[mode]
            offset = (py+factor*ph) - (y+factor*h)
            samples[1].update(peerAlign=mode, rowOffsetY=offset)
            if abs(offset) >= 4:
                checker.issue(field+".peerBox", f"{state} 两按钮的 {mode} 对齐位置相差 {abs(offset):g} px, "
                              f"实测底面为 {samples[0]['surfaceBox']} 和 {samples[1]['surfaceBox']}")
    return samples
