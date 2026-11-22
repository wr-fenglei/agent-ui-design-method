// Evaluate exposed panel fills and long structural rules in a finished Figma frame.
// All measurements are in canvas coordinates. Non-solid backdrops have unknown RGB.
function checkSurfaceQuality(screen, descendants, issue) {
  const viewport = screen.absoluteBoundingBox
  const summary = {surfaces: 0, separators: 0, manualReview: []}
  if (!viewport || !viewport.width || !viewport.height) return summary
  const seen = new Set(descendants(screen).map(n => n.id))
  const panels = [], rules = [], labels = [], illustrations = []
  const rectTypes = new Set(['RECTANGLE', 'FRAME', 'COMPONENT', 'INSTANCE', 'SECTION'])
  const mediaName = /^(?:illustration|artwork|wallpaper|photograph|heatmap|chart plot|插画|插图|壁纸|照片|热力图)(?:$|[ /·:：_-])/i
  const localName = /(?:\b(?:focus|progress|selection|selected|status|badge|scrim)\b|焦点|进度|选中|状态标[记识]|遮罩)/i
  const tableName = /(?:\b(?:table|grid|data rows)\b|数据表|表格)/i
  const visible = n => n.visible !== false && n.opacity !== 0
  const opacity = n => Number.isFinite(n.opacity) ? n.opacity : 1
  const paints = v => Array.isArray(v) ? v.filter(visible) : []
  const normal = n => !n.blendMode || ['NORMAL', 'PASS_THROUGH'].includes(n.blendMode)
  function intersect(a, b) {
    const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y)
    const width = Math.min(a.x + a.width, b.x + b.width) - x
    const height = Math.min(a.y + a.height, b.y + b.height) - y
    return width > 0 && height > 0 ? {x, y, width, height} : null
  }
  const contains = (b, x, y) => b && x >= b.x && y >= b.y && x < b.x + b.width && y < b.y + b.height
  const mix = (front, back, amount) => amount === 1 ? front : front && back && front.map((c, i) => c * amount + back[i] * (1 - amount))
  const hex = rgb => '#' + rgb.map(c => Math.round(c).toString(16).toUpperCase().padStart(2, '0')).join('')
  function paintColor(p) {
    if (p.type !== 'SOLID' || !normal(p)) return null
    return [p.color.r * 255, p.color.g * 255, p.color.b * 255]
  }
  function neutral(rgb) {
    const values = rgb.map(Math.round), lo = Math.min(...values), hi = Math.max(...values)
    return (lo >= 232 && hi - lo <= 4) || (hi <= 64 && hi - lo <= 10)
  }
  function contrast(rgb, bg) {
    function luminance(color) {
      const [r, g, b] = color.map(v => v <= 10.31475 ? v / 3294.6 : ((v / 255 + 0.055) / 1.055) ** 2.4)
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const a = luminance(rgb), b = luminance(bg)
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  }
  function longEnough(length, horizontal) {
    return length >= Math.max(96, Math.min(240, 0.42 * (horizontal ? viewport.width : viewport.height)))
  }
  function collect(node, clip, table, local, parent) {
    if (!visible(node) || node.isMask) return null
    let bounds = node.absoluteBoundingBox
    if (node.type === 'LINE') bounds = node.absoluteRenderBounds || bounds
    if (!bounds) return null
    if (node.type === 'LINE' && (!bounds.width || !bounds.height)) {
      const size = Number.isFinite(node.strokeWeight) ? node.strokeWeight : 1
      bounds = {...bounds, width: bounds.width || size, height: bounds.height || size}
    }
    const box = intersect(bounds, clip)
    if (!box && node.clipsContent) return null
    const fills = paints(node.type === 'LINE' ? node.strokes : node.fills)
    const isMedia = node !== screen && (mediaName.test(node.name) || fills.some(p => ['IMAGE', 'VIDEO'].includes(p.type)))
    const entry = {node, box, clip, fills, parent, children: [], alpha: opacity(node), normal: normal(node), media: isMedia}
    table = table || tableName.test(node.name)
    // A full-size pane can have a state name. Only exempt controls and genuine dimming scrims.
    local = local || (box && node !== screen && localName.test(node.name) &&
      (Math.min(box.width, box.height) <= 84 || (/scrim|遮罩/i.test(node.name) && fills.length && fills.every(p => {
        const rgb = paintColor(p)
        return rgb && Math.max(...rgb) - Math.min(...rgb) <= 4 && opacity(p) * entry.alpha < 1
      }))))
    if (box && (node === screen || node.type === 'LINE' || seen.has(node.id))) {
      if (node.type === 'TEXT' && node.characters && node.characters.trim() && fills.length) labels.push(box)
      if (isMedia) illustrations.push(box)
      if (rectTypes.has(node.type) || node.type === 'LINE') {
        const {width: w, height: h} = box
        const major = node === screen || (w >= 64 && h >= 64 && w * h >= viewport.width * viewport.height * 0.08) ||
          (h >= viewport.height * 0.60 && w >= 64) || (w >= viewport.width * 0.72 && h >= 40)
        if (major && !local && !isMedia) {
          if (fills.length) panels.push(entry)
          const strokes = paints(node.strokes)
          if (strokes.length) {
            // The Plugin API returns figma.mixed for unequal per-side weights.
            for (const [side, horizontal] of [['Top', true], ['Bottom', true], ['Left', false], ['Right', false]]) {
              const weight = node['stroke' + side + 'Weight'] ?? node.strokeWeight
              if (Number.isFinite(weight) && weight > 0 && longEnough(horizontal ? w : h, horizontal)) {
                rules.push({entry, box, horizontal, weight, side, strokes, table})
              }
            }
          }
        }
        const horizontal = w >= h, length = Math.max(w, h), weight = Math.min(w, h)
        const pane = parent && parent.box
        const rail = horizontal && pane && pane.width <= viewport.width * 0.35 && pane.height >= viewport.height * 0.60 &&
          w >= Math.max(96, pane.width * 0.72)
        if (!local && !isMedia && fills.length && (rail || longEnough(length, horizontal)) && weight <= 8 &&
            (node.type === 'RECTANGLE' || node.type === 'LINE')) rules.push({entry, box, horizontal, weight, table, rail})
      }
    }
    // Mask image pixels and illustration groups without treating internal artwork as UI.
    if (isMedia && mediaName.test(node.name)) return entry
    const children = !node.contentsHidden && node.children || []
    for (const child of node.itemReverseZIndex ? [...children].reverse() : children) {
      const e = collect(child, node.clipsContent ? box : clip, table, local, entry)
      if (e) entry.children.push(e)
    }
    return entry
  }
  const tree = collect(screen, viewport, false, false)
  if (!tree) return summary
  // Sample only rectangular backgrounds. Text and glyphs do not supply backdrop colors.
  // Group opacity applies once to the combined children, including at overlapping fills.
  function sample(x, y, stroke, omit) {
    function render(entry, below) {
      if (!contains(entry.clip, x, y)) return below
      const inside = contains(entry.box, x, y)
      if (entry.node.clipsContent && !inside) return below
      let out = below
      function add(paints) {
        for (const paint of paints) out = {owner: entry, rgb: mix(paintColor(paint), out.rgb, opacity(paint))}
      }
      if (inside && entry.media) out = {owner: entry, rgb: null}
      else if (inside && (rectTypes.has(entry.node.type) || entry.node.type === 'LINE') && entry !== omit) add(entry.fills)
      for (const child of entry.children) out = render(child, out)
      if (inside && stroke && stroke.entry === entry && !omit) add(stroke.strokes)
      if (out === below) return below
      return {owner: out.owner, rgb: entry.normal ? mix(out.rgb, below.rgb, entry.alpha) : null}
    }
    return render(tree, {owner: null, rgb: null})
  }
  for (const entry of panels) {
    const {x, y, width, height} = entry.box
    const colors = [], effects = paints(entry.node.effects)
    const frosted = effects.some(e => e.type === 'GLASS' || (e.type === 'BACKGROUND_BLUR' && e.radius > 0))
    if (frosted && entry.fills.every(p => {
      const rgb = paintColor(p)
      return rgb && Math.max(...rgb) <= 64 && Math.max(...rgb) - Math.min(...rgb) <= 20 && opacity(p) * entry.alpha < 1
    })) {
      summary.manualReview.push(entry.node.id + ' ' + entry.node.name + ', 在 1× 导出核对半透明深色材质及其背后内容')
      continue
    }
    let unknown = false
    for (const px of [0.12, 0.5, 0.88]) for (const py of [0.12, 0.5, 0.88]) {
      const s = sample(x + px * width, y + py * height)
      if (s.owner !== entry) continue
      if (s.rgb) colors.push(s.rgb)
      else unknown = true
    }
    if (unknown) summary.manualReview.push(entry.node.id + ' ' + entry.node.name + ', 在 1× 导出取样渐变、混合或非实色背底')
    if (!colors.length) continue
    summary.surfaces++
    const bad = colors.filter(c => !neutral(c))
    if (bad.length) issue('surface.neutral', entry.node, '整屏或面板可见底色 ' + hex(bad[0]) + ', 请核对主参考的白、近白灰、黑或近黑灰底色')
  }
  const heavy = new Set(), horizontalRules = []
  for (const rule of rules) {
    const {entry, box, horizontal, side} = rule
    const ratios = []
    for (const t of [0.25, 0.5, 0.75]) {
      const x = box.x + (horizontal ? t * box.width : side ? (side === 'Left' ? 0.25 : box.width - 0.25) : box.width / 2)
      const y = box.y + (!horizontal ? t * box.height : side ? (side === 'Top' ? 0.25 : box.height - 0.25) : box.height / 2)
      const line = sample(x, y, side ? rule : null)
      const bg = sample(x, y, null, side ? null : entry)
      if (line.owner === entry && line.rgb && bg.rgb) ratios.push(contrast(line.rgb, bg.rgb))
    }
    if (!ratios.length) continue
    summary.separators++
    const ratio = ratios.sort((a, b) => a - b)[Math.floor(ratios.length / 2)]
    if ((ratio >= 2.4 || (rule.weight >= 2 && ratio >= 1.35) || (rule.weight >= 3 && ratio >= 1.2)) && !heavy.has(entry)) {
      heavy.add(entry)
      issue('separator.weight', entry.node, (side ? '面板描边' : '分隔线') + '宽 ' + rule.weight.toFixed(1) + ' px, 与相邻底色对比 ' + ratio.toFixed(2) + ':1, 请核对线宽、透明度和区分这两处内容的需要')
    }
    if (!side && horizontal && !rule.table && ratio >= 1.08) horizontalRules.push(rule)
  }
  // Look for consecutive open dividers around sparse fields. A table header, occupied right
  // column, artwork or different row geometry is evidence against this interpretation.
  const families = []
  for (const rule of horizontalRules) {
    const box = rule.box
    let family = families.find(f => Math.abs(f[0].box.x - box.x) <= 3 && Math.abs(f[0].box.width - box.width) <= 4)
    if (!family) { family = []; families.push(family) }
    family.push(rule)
  }
  for (const family of families) {
    family.sort((a, b) => a.box.y - b.box.y)
    let run = []
    for (let i = 1; i < family.length; i++) {
      const before = family[i - 1], after = family[i], box = before.box
      const top = box.y + box.height, height = after.box.y - top
      const row = {...box, y: top, height}
      const rowLabels = labels.filter(b => contains(row, b.x + b.width / 2, b.y + b.height / 2))
      const sparse = height >= 18 && height <= 110 && rowLabels.length <= 2 &&
        rowLabels.every(b => b.x + b.width <= box.x + box.width * 0.82 && b.height <= height * 0.70) &&
        !illustrations.some(b => intersect(row, b))
      if (!sparse) { run = []; continue }
      if (!run.length) run.push(before)
      run.push(after)
      if (run.length !== 4) continue
      const first = run[0].box
      const headers = labels.filter(b => b.y + b.height <= first.y && b.y + b.height >= first.y - 24 &&
        b.x >= first.x && b.x + b.width <= first.x + first.width)
      if (rowLabels.length >= 2 && rowLabels.every(b => headers.some(h => Math.abs(h.x - b.x) <= 8))) continue
      issue('separator.repeat', before.entry.node, '连续 4 条同宽横线分隔 3 行短字段或空行, 长度 ' + Math.round(box.width) + ' px, 请核对字段分组是否可用间距表达')
    }
  }
  // A tall, narrow rail can already separate sections with their own headings and
  // generous spacing. Locate the specific redundant-looking rule for visual review.
  const railRules = new Map()
  for (const rule of horizontalRules.filter(r => r.rail)) {
    const rail = rule.entry.parent
    if (!railRules.has(rail)) railRules.set(rail, [])
    railRules.get(rail).push(rule)
  }
  for (const [rail, lines] of railRules) {
    if (lines.length < 3) continue
    let candidate = null
    for (const rule of lines) {
      const b = rule.box
      const neighbors = rail.children.filter(e => e !== rule.entry && e.box && e.box.height > 8 && e.box.width > 4 &&
        e.box.x < b.x + b.width && e.box.x + e.box.width > b.x)
      if (neighbors.some(e => e.box.y <= b.y && e.box.y + e.box.height > b.y)) continue
      const preceding = neighbors.map(e => e.box.y + e.box.height).filter(bottom => bottom <= b.y)
      const following = neighbors.map(e => e.box.y).filter(top => top >= b.y + b.height)
      if (!preceding.length || !following.length) continue
      const before = b.y - Math.max(...preceding), after = Math.min(...following) - b.y - b.height
      if (before >= 48 && after >= 12 && (!candidate || before > candidate.before)) candidate = {rule, before, after}
    }
    if (candidate) {
      const {rule, before, after} = candidate
      summary.manualReview.push(rule.entry.node.id + ' ' + rail.node.name + ', 栏内 ' + lines.length + ' 条横线跨过栏宽的 72% 以上, ' +
        '此线长 ' + Math.round(rule.box.width) + ' px, 线上、下距相邻内容 ' + Math.round(before) + '、' + Math.round(after) +
        ' px, 在 1× 图核对现有留白是否已足以区分两组内容')
    }
  }
  return summary
}

if (typeof module !== 'undefined' && module.exports) module.exports = {checkSurfaceQuality}
