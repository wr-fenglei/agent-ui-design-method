"""Check sampled interface colors or compare exports with the selected reference case."""

import argparse
from collections import Counter
from functools import lru_cache
from math import ceil, sqrt
from pathlib import Path

from design_images import load_image

# These four previously rejected UI colors also apply to small success indicators.
REJECTED = {tuple(bytes.fromhex(code)) for code in ('345a46', 'e8f0e9', '253e33', '315844')}
ROLES = {'window', 'toolbar', 'sidebar', 'reading', 'brand', 'primary'}


def hexcode(rgb):
    return '#' + bytes(rgb).hex().upper()


@lru_cache(maxsize=4096)
def green(rgb):
    r, g, b = rgb
    # For green-to-olive hues, green is above blue, and the hue must be
    # between 55 and 166 degrees. Exclude neutral tints with a spread below 12 units or 10% saturation.
    delta = max(rgb) - min(rgb)
    if delta < 12 or delta < .10 * max(rgb) or g <= b:
        return False
    hue = (60 * (g - b) / delta if r >= g else 120 + 60 * (b - r) / delta)
    if hue <= 65 and max(rgb) >= 185:
        return False  # Bright yellow, distinct from low-value olive.
    return 55 <= hue <= 166


def near(a, b):
    return all(abs(x-y) <= 8 for x, y in zip(a, b))


def contains(box, x, y):
    a, b, w, h = box
    return a <= x < a+w and b <= y < b+h


def intersects(a, b):
    x, y, w, h = a
    X, Y, W, H = b
    return x < X+W and X < x+w and y < Y+H and Y < y+h


def grid(image, box, exclude=(), *, budget=4096):
    x, y, w, h = box
    step = max(1, ceil(sqrt(w*h / budget)))
    for j in range(y+min(step//2, h-1), y+h, step):
        for i in range(x+min(step//2, w-1), x+w, step):
            if not any(contains(mask, i, j) for mask in exclude):
                yield i, j, image.rgb(i, j)


def mapping(value):
    return value if isinstance(value, dict) else {}


def primary_box(data, state, checker, image):
    aid = mapping(data['states'].get(state)).get('primary')
    if not isinstance(aid, str):
        return None
    comp = mapping(mapping(data.get('components')).get(aid))
    variant = mapping(mapping(comp.get('variants')).get('default'))
    if variant.get('on') == state:
        return checker.box(variant.get('box'), f'components.{aid}.variants.default.box', image)
    return None


def checked_sample(checker, record, field, state, role, colors, source_image, image, box, exclude):
    token = record.get('token')
    color = colors.get(token) if isinstance(token, str) else None
    if color is None:
        checker.issue(field+'.token', '请选择 colors 中的实色')
        return None
    if role != 'success' and green(color):
        checker.issue(field+'.token', f'界面或主操作使用了绿色 {hexcode(color)}')
    if 'sourceRole' in record and record['sourceRole'] != 'final':
        checker.issue(field+'.sourceRole', '请用 sourceImage 指定本案例的 final.png 或 components/文件名.png')
        return None
    source_name = record.get('sourceImage', 'final.png')
    if not isinstance(source_name, str):
        checker.issue(field+'.sourceImage', '请填写本案例内的图片路径')
        return None
    point = record.get('sourceAt')
    if not isinstance(point, list) or len(point) != 2 or any(type(n) is not int for n in point):
        checker.issue(field+'.sourceAt', '请填写案例原图实像素 [x,y]')
        return None
    try:
        source = source_image(source_name)
    except (ValueError, OSError, RuntimeError) as exc:
        checker.issue(field+'.sourceImage', str(exc))
        return None
    if source is None:
        return None
    try:
        ref = source.rgb(*point)
    except ValueError as exc:
        checker.issue(field+'.sourceAt', str(exc))
        return None
    if not near(color, ref):
        checker.issue(field+'.sourceAt', f'原图 {source_name} {point} 实测 {hexcode(ref)}, 与 {hexcode(color)} 每通道允差 8')
    if not box:
        return None
    count = hits = 0
    located = None
    for i, j, rgb in grid(image, box, exclude):
        count += 1
        if near(color, rgb):
            hits += 1
            if located is None:
                located = ([i, j], hexcode(rgb))
    fraction = 0.05 if role in ('success', 'primary', 'brand') else 0.20
    if not located or hits < fraction * count:
        checker.issue(field+'.box', f'框内只有 {hits}/{count} 个界面取样点符合 {hexcode(color)}, 要求至少 {fraction:.0%}')
        return None
    return {'state': state, 'role': role, 'token': token, 'sourceImage': source_name, 'sourceAt': point,
            'sourceHex': hexcode(ref), 'exportAt': located[0], 'exportHex': located[1],
            'matchingSamples': hits, 'samples': count}


@lru_cache(maxsize=4096)
def traffic_color(rgb):
    r, g, b = rgb
    if r >= 155 and r-g >= 65 and abs(g-b) <= 60:
        return 'red'
    if r >= 155 and 25 <= r-g <= 110 and g-b >= 60:
        return 'amber'
    if g >= 130 and g-r >= 35 and green(rgb):
        return 'green'
    return None


def native_window_dot(image, protected):
    """Locate the green member of a macOS traffic-light triplet at native 1x."""
    width, height = min(128, image.width), min(64, image.height)
    dots = {'red': [], 'amber': [], 'green': []}
    colored = {}
    for y in range(height):
        for x in range(width):
            kind = traffic_color(image.rgb(x, y))
            if kind:
                colored[x, y] = kind
    while colored:
        (x, y), kind = colored.popitem()
        stack = [(x, y)]
        points = []
        while stack:
            x, y = stack.pop()
            points.append((x, y))
            for p in ((x-1,y), (x+1,y), (x,y-1), (x,y+1)):
                if colored.get(p) == kind:
                    del colored[p]
                    stack.append(p)
        xs, ys = zip(*points)
        x, y = min(xs), min(ys)
        w, h = max(xs)-x+1, max(ys)-y+1
        if 8 <= w <= 14 and 8 <= h <= 14 and abs(w-h) <= 2 and 0.60 <= len(points)/(w*h) <= 0.89:
            dots[kind].append((x, y, w, h))
    for r in dots['red']:
        for a in dots['amber']:
            for g in dots['green']:
                boxes = (r, a, g)
                if max(b[1] for b in boxes)-min(b[1] for b in boxes) > 2:
                    continue
                if max(b[2] for b in boxes)-min(b[2] for b in boxes) > 2:
                    continue
                left, right = a[0]-r[0], g[0]-a[0]
                if 13 <= left <= 26 and abs(left-right) <= 2:
                    x, y, w, h = g
                    box = (x-1, y-1, w+2, h+2)
                    if not any(intersects(dot, b) for dot in (r, a, box) for b in protected):
                        return box
    return None


def check_surface_colors(checker, image, boxes, field, sampled_tokens=(), *, full=False, native=None):
    # A fixed canvas grid exposes broad omitted regions. On older manifests,
    # sample only independently identified UI regions and report exact bans.
    seen = {}
    frequencies = Counter()
    locations = {}
    for box, exclude in boxes:
        for x, y, rgb in grid(image, box, exclude, budget=50000):
            if rgb in REJECTED or (full and green(rgb) and not (native and contains(native, x, y))):
                seen.setdefault('green' if rgb not in REJECTED else hexcode(rgb), (rgb, x, y))
            if full:
                frequencies[rgb] += 1
                locations.setdefault(rgb, (x, y))
    for rgb, x, y in seen.values():
        checker.issue(field, f'界面取样 [{x},{y}] 实测绿色 {hexcode(rgb)}')
    # Group neighboring unsupported colors to catch dithering and shallow
    # gradients. Report the most common actual pixel in each qualifying group.
    unsupported = Counter()
    representative = {}
    for rgb, count in frequencies.most_common():
        if any(near(rgb, token) for token in sampled_tokens):
            continue
        bucket = tuple(channel // 16 for channel in rgb)
        unsupported[bucket] += count
        representative.setdefault(bucket, rgb)
    threshold = .05 * canvas_grid_count(image.width, image.height)
    for bucket, count in unsupported.most_common():
        if count < threshold:
            break
        rgb = representative[bucket]
        x, y = locations[rgb]
        checker.issue(field, f'界面取样 [{x},{y}] 实测 {hexcode(rgb)}, 该色及邻近色共 {count} 个取样点, 请提供案例来源')


def canvas_grid_count(w, h):
    # The 5% denominator includes media, so a small UI strip isn't counted as a large area.
    step = max(1, ceil(sqrt(w*h / 50000)))
    return len(range(min(step//2,w-1),w,step)) * len(range(min(step//2,h-1),h,step))


def check_primary_fill(checker, image, box, token, surfaces, field):
    # Filled actions must use the reference-backed primary token. An outline or
    # text action may share a verified surface color across its inside and outside.
    if not box or token is None:
        return
    x, y, w, h = box
    if w < 12 or h < 8:
        checker.issue(field+'.box', '请提供主操作的完整范围, 取样框至少 12×8 px')
        return
    inside = Counter(rgb for _, _, rgb in grid(image, box))
    total = sum(inside.values())
    usual, most = inside.most_common(1)[0]
    required = max(.35 * total, most)
    if sum(n for rgb, n in inside.items() if near(rgb, token)) >= required:
        return
    edge = []
    for j in (y+h//4, y+h//2, y+3*h//4):
        edge.extend([(x-1,j), (x+w,j)])
    for i in (x+w//4, x+w//2, x+3*w//4):
        edge.extend([(i,y-1), (i,y+h)])
    outside = [image.rgb(i,j) for i,j in edge if 0 <= i < image.width and 0 <= j < image.height]
    for surface in surfaces:
        if (sum(n for rgb,n in inside.items() if near(rgb, surface)) >= required
                and sum(near(rgb, surface) for rgb in outside) >= max(1, len(outside)//2)):
            return
    checker.issue(field+'.box', f'主操作框内常见色 {hexcode(usual)}, 请核对完整控件填色与案例来源')


def check_palette(checker, data, final, colors, case_dir, media_boxes):
    """Return measured samples. Validated media is keyed by state, including empty lists."""
    palette = checker.table(data, 'palette')
    state_roles = checker.table(palette, 'states', 'palette')
    success = mapping(palette.get('success'))
    if 'success' in palette and not isinstance(palette['success'], dict):
        checker.issue('palette.success', '请按状态填写成功提示')
    states = mapping(data.get('states'))
    for unknown in (state_roles.keys() | success.keys()) - states.keys():
        checker.issue(f'palette.{unknown}', '请选择已提供导出的状态')
    success_tokens = set()
    native_colors = set()
    result = []

    @lru_cache(maxsize=2)
    def source_image(name):
        if not case_dir:
            return None
        parts = name.split('/')
        component = (len(parts) == 2 and parts[0] == 'components' and '\\' not in parts[1]
                     and Path(parts[1]).suffix == '.png')
        if name != 'final.png' and not component:
            raise ValueError('请选择本案例的 final.png 或 components/文件名.png')
        root = case_dir.resolve()
        path = (root / name).resolve(strict=True)
        if (component and path.parent != root / 'components') or (not component and path != root / 'final.png'):
            raise ValueError('色源路径须指向所选案例的原图')
        if not path.is_file():
            raise ValueError('色源路径须指向 PNG 文件')
        return load_image(path, pixels=True)

    for state, row in states.items():
        path = checker.named_files.get(state)
        if not path:
            continue
        image = checker.pixels(path)
        base = f'palette.states.{state}'
        roles = mapping(state_roles.get(state))
        checked_colors = []
        surfaces = []
        masks = media_boxes.get(state, [])
        canvas = (0, 0, image.width, image.height)
        active = primary_box(data, state, checker, image)
        if 'window' not in roles and 'reading' not in roles:
            checker.issue(base, '请标出窗口或阅读表面的原图和导出取样')
        if isinstance(mapping(row).get('primary'), str) and 'primary' not in roles:
            checker.issue(base+'.primary', '请标出本状态主操作的可见颜色')
        role_boxes = {}
        for role, raw in roles.items():
            if role not in ROLES and not (role.startswith('surface-') and len(role) > 8):
                checker.issue(base+'.'+role, '请选择界面角色, 独立表面可用 surface-名称')
                continue
            role_boxes[role] = checker.box(mapping(raw).get('box'), base+'.'+role+'.box', image)
        primary = role_boxes.get('primary')
        if active and primary and not (contains(active, *primary[:2]) and
                                      contains(active, primary[0]+primary[2]-1, primary[1]+primary[3]-1)):
            checker.issue(base+'.primary.box', '请在主控件 default 实图框内取样')
        if active and primary and (primary[2] < .60 * active[2] or primary[3] < .60 * active[3]):
            checker.issue(base+'.primary.box', '主操作取样需包含控件主体, 宽高均至少为 default 实图框的 60%')
        protected = [b for b in [active, primary, role_boxes.get('brand')] if b]
        if any(intersects(b, mask) for b in protected for mask in masks):
            checker.issue(base, '主操作与品牌的实图位置须位于媒体框外')
        status = success.get(state, [])
        success_boxes = []
        if not isinstance(status, list):
            checker.issue('palette.success.'+state, '请逐项提供小范围成功提示的证据')
            status = []
        for i, raw in enumerate(status):
            field = f'palette.success.{state}[{i}]'
            record = mapping(raw)
            checker.text(record, 'meaning', field)
            box = checker.box(record.get('box'), field+'.box', image)
            if not box:
                continue
            if any(intersects(box, other) for other in [*masks, *protected, *success_boxes]):
                checker.issue(field+'.box', '成功提示应单独取样, 不能遮住媒体、品牌或主操作')
                continue
            sample = checked_sample(checker, record, field, state, 'success', colors, source_image, image, box, ())
            if sample:
                success_tokens.add(sample['token'])
                result.append(sample)
                success_boxes.append(box)
                # A named success patch can exclude only its source-verified tint
                # from the green check. Previously rejected colors always fail.
                target = colors[sample['token']]
                for x, y, rgb in grid(image, box):
                    if rgb in REJECTED or (green(rgb) and not near(rgb, target)):
                        checker.issue(field+'.box', f'提示内的 [{x},{y}] 实测未获准的绿色 {hexcode(rgb)}')
                        break
        if sum(w*h for _, _, w, h in success_boxes) > image.width * image.height * 0.02:
            checker.issue('palette.success.'+state, '成功提示总面积超过本状态画面的 2%')
        excluded = [*masks, *success_boxes]
        for role, box in role_boxes.items():
            sample = checked_sample(checker, mapping(roles[role]), base+'.'+role, state, role, colors,
                                    source_image, image, box, excluded)
            if sample:
                result.append(sample)
                checked_colors.append(colors[sample['token']])
                if role not in ('primary', 'brand'):
                    surfaces.append(colors[sample['token']])
            if role in ('brand', 'primary') and box:
                check_surface_colors(checker, image, [(box, ())], base+'.'+role, full=False)
                for x, y, rgb in grid(image, box):
                    if green(rgb):
                        checker.issue(base+'.'+role, f'界面取样 [{x},{y}] 实测绿色 {hexcode(rgb)}')
                        break
        primary_token = mapping(roles.get('primary')).get('token')
        if isinstance(primary_token, str):
            check_primary_fill(checker, image, active or primary, colors.get(primary_token), surfaces, base+'.primary')
        if state in media_boxes:
            native = native_window_dot(image, [*protected, *excluded])
            if native:
                x, y, w, h = native
                native_colors.add(image.rgb(x + w//2, y + h//2))
            check_surface_colors(checker, image, [(canvas, excluded)], base, checked_colors, full=True, native=native)
        else:
            ui_boxes = [b for b in role_boxes.values() if b]
            if active:
                ui_boxes.append(active)
            # Without a validated media mask, only known UI coordinates are
            # evidence. A layout box such as "workspace" could contain artwork.
            for sample in data.get('contrast', []) if isinstance(data.get('contrast'), list) else []:
                if not isinstance(sample, dict) or sample.get('state') != state:
                    continue
                for key in ('fgAt', 'bgAt'):
                    point = sample.get(key)
                    if isinstance(point, list) and len(point) == 2 and all(type(n) is int for n in point):
                        if contains(canvas, *point):
                            ui_boxes.append((*point, 1, 1))
            for key, box in mapping(mapping(data.get('layout')).get('zones')).items():
                if key == 'toolbar':
                    toolbar = checker.box(box, 'layout.zones.toolbar', image)
                    if toolbar:
                        ui_boxes.append(toolbar)
            check_surface_colors(checker, image, [(b, ()) for b in ui_boxes], base)
    for name, color in colors.items():
        if color in REJECTED or (green(color) and name not in success_tokens and color not in native_colors):
            checker.issue(f'colors.{name}.hex', f'界面语义色包含未获准的绿色 {hexcode(color)}')
    return result


def sample_point(argument):
    role, _, position = argument.partition('=')
    if role not in ('primary', 'selected', 'reading', 'success'):
        raise argparse.ArgumentTypeError(f'{argument}: 角色可选 primary, selected, reading, success')
    try:
        x, y = map(int, position.split(','))
    except ValueError:
        raise argparse.ArgumentTypeError(f'{argument}: 请用 角色=x,y 填写原图像素') from None
    return role, x, y


def main():
    parser = argparse.ArgumentParser(description='按指定的 1× PNG 像素检查界面角色用色')
    parser.add_argument('screen', type=Path)
    parser.add_argument('points', nargs='+', type=sample_point, metavar='角色=x,y')
    args = parser.parse_args()
    try:
        image = load_image(args.screen, pixels=True)
    except (OSError, ValueError) as exc:
        parser.exit(2, f'{args.screen}: {exc}\n')

    failed = review = False
    for role, x, y in args.points:
        location = f'{args.screen} {role}=({x},{y})'
        try:
            rgb = image.rgb(x, y)
        except ValueError as exc:
            parser.exit(2, f'{location}: {exc}\n')
        r, g, b = rgb
        if rgb in REJECTED or (role != 'success' and green(rgb)):
            result = '不通过, 当前角色使用了项目限制的绿色'
            failed = True
        elif role != 'success' and g > max(r, b) and not near(rgb, (g, g, g)):
            result = '需复核, 绿通道占优, 请对照主参考和原尺寸画面'
            review = True
        else:
            result = '该点未触发绿色限制'
        print(f'{location} {hexcode(rgb)}  {result}')
    if failed:
        return 1
    return 3 if review else 0


if __name__ == '__main__':
    raise SystemExit(main())
