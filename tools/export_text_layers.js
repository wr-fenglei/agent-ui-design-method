// In a Figma plugin or existing bridge, append:
// return await exportTextLayers(figma, {review: "12:34", done: "12:35"})
// Use the same unrotated state frames as the 1x PNGs. Native TEXT only.
// Render bounds include visible strokes/effects. The PNG establishes the final pixels.
// https://developers.figma.com/docs/plugins/api/TextNode/

async function exportTextLayers(api, frames) {
  function validRect(rect) {
    return rect && [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) &&
      rect.width > 0 && rect.height > 0
  }

  function intersection(a, b) {
    if (!validRect(a) || !validRect(b)) return null
    const x = Math.max(a.x, b.x)
    const y = Math.max(a.y, b.y)
    const width = Math.min(a.x + a.width, b.x + b.width) - x
    const height = Math.min(a.y + a.height, b.y + b.height) - y
    return width > 0 && height > 0 ? {x, y, width, height} : null
  }

  function pixelBox(rect, origin) {
    const x = Math.floor(rect.x - origin.x)
    const y = Math.floor(rect.y - origin.y)
    return [x, y, Math.ceil(rect.x + rect.width - origin.x) - x,
      Math.ceil(rect.y + rect.height - origin.y) - y]
  }

  function noRotationOrScale(node) {
    const m = node.absoluteTransform
    return m && Math.abs(m[0][0] - 1) < 1e-5 && Math.abs(m[1][1] - 1) < 1e-5 &&
      Math.abs(m[0][1]) < 1e-5 && Math.abs(m[1][0]) < 1e-5
  }

  function visible(item) {
    return item.visible !== false && item.opacity !== 0
  }

  function blendChangesColor(item) {
    return item.blendMode && item.blendMode !== 'NORMAL' && item.blendMode !== 'PASS_THROUGH'
  }

  function fillHex(fills) {
    if (!Array.isArray(fills)) return null
    const paints = fills.filter(visible)
    if (paints.length !== 1) return null
    const paint = paints[0]
    if (paint.type !== 'SOLID' || (paint.opacity !== undefined && paint.opacity !== 1) ||
        blendChangesColor(paint)) return null
    const rgb = ['r', 'g', 'b'].map(k => paint.color[k])
    if (!rgb.every(v => Number.isFinite(v) && v >= 0 && v <= 1)) return null
    return '#' + rgb.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
  }

  function oneValue(runs, key) {
    const values = new Set(runs.map(run => run[key]))
    return values.size === 1 ? runs[0][key] : null
  }

  function clippedByCorner(clip, text) {
    // Test the furthest text-box corner in each rounded clipping corner.
    const {x, y, width, height} = clip.absoluteBoundingBox
    const corners = [
      [clip.topLeftRadius, text.x - x, text.y - y],
      [clip.topRightRadius, x + width - text.x - text.width, text.y - y],
      [clip.bottomLeftRadius, text.x - x, y + height - text.y - text.height],
      [clip.bottomRightRadius, x + width - text.x - text.width, y + height - text.y - text.height],
    ]
    return corners.some(([r, dx, dy]) => r > 0 && dx < r && dy < r &&
      (dx - r) ** 2 + (dy - r) ** 2 > r ** 2)
  }

  function compositing(node) {
    if (node.opacity < 1 || blendChangesColor(node)) return '透明度或混合模式会影响实际文字色'
    const effects = Array.isArray(node.effects) ? node.effects.filter(visible) : []
    if (effects.some(e => node.type === 'TEXT' || !['DROP_SHADOW', 'INNER_SHADOW', 'BACKGROUND_BLUR'].includes(e.type))) {
      return '图层效果需要在导出图中核对'
    }
    return null
  }

  async function readFrame(id) {
    const frame = await api.getNodeByIdAsync(id)
    if (!frame || !['FRAME', 'COMPONENT', 'INSTANCE'].includes(frame.type)) {
      throw Error('找不到指定的状态画框 ' + id)
    }
    const origin = frame.absoluteBoundingBox
    if (!validRect(origin) || !noRotationOrScale(frame) ||
        !Number.isInteger(origin.width) || !Number.isInteger(origin.height)) {
      throw Error('1× 导出需要未旋转、未缩放及整数尺寸的状态画框 ' + id)
    }
    const result = {frameId: frame.id, width: origin.width, height: origin.height, layers: [], issues: []}
    const ancestors = []
    for (let p = frame.parent; p && p.type !== 'DOCUMENT' && p.type !== 'PAGE'; p = p.parent) {
      if (!visible(p)) throw Error('状态画框的祖先已隐藏 ' + id)
      // Exporting a nested frame in isolation may differ from its canvas appearance.
      if (p.clipsContent || compositing(p)) ancestors.push('嵌套状态受外层裁切或合成影响, 核对独立导出')
    }
    if (!visible(frame)) throw Error('状态画框已隐藏 ' + id)
    if (api.root && api.root.documentColorProfile && api.root.documentColorProfile !== 'SRGB') {
      ancestors.push('文档色域需要和导出的 sRGB 色值核对')
    }

    function visit(node, clip, corners, warnings) {
      if (!visible(node) || !clip) return
      const reasons = warnings.slice()
      const composition = compositing(node)
      if (composition) reasons.push(composition)
      if (node.type === 'TEXT') {
        if (!node.characters.trim()) return
        const bounds = node.absoluteRenderBounds
        if (!validRect(bounds)) return
        const visibleRect = intersection(bounds, clip)
        if (!visibleRect) return
        if (!noRotationOrScale(node)) reasons.push('文字带旋转、翻转或缩放')
        if (corners.some(c => clippedByCorner(c, visibleRect))) reasons.push('文字处于圆角裁切范围')
        if (node.hasMissingFont) reasons.push('文字使用缺失字体')
        if (node.textTruncation && node.textTruncation !== 'DISABLED') reasons.push('检查实际显示的省略文字')
        const hasStrokes = Array.isArray(node.strokes) && node.strokes.some(visible)
        if (hasStrokes) reasons.push('文字使用描边')
        const styles = node.getStyledTextSegments(['fontSize', 'fontWeight', 'fills'])
        if (!hasStrokes && styles.length && styles.every(run => Array.isArray(run.fills) && !run.fills.some(visible))) return
        const runs = styles.map(run => ({
          start: run.start, end: run.end,
          fontSize: Number.isFinite(run.fontSize) ? run.fontSize : null,
          fontWeight: Number.isFinite(run.fontWeight) ? run.fontWeight : null,
          fillHex: fillHex(run.fills),
        }))
        const item = {id: node.id, name: node.name, text: node.characters, box: pixelBox(visibleRect, origin),
          fontSize: oneValue(runs, 'fontSize'), fontWeight: oneValue(runs, 'fontWeight'),
          fillHex: oneValue(runs, 'fillHex')}
        if (item.fontSize === null || item.fontWeight === null || !item.fillHex) {
          reasons.push('核对分段字级、字重或填充, 当前层缺少统一可测的样式')
          item.runs = runs
        }
        if (reasons.length) item.manualReason = [...new Set(reasons)].join(', ')
        result.layers.push(item)
        return
      }
      if (node.type === 'TEXT_PATH' || node.type === 'SHAPE_WITH_TEXT') {
        result.issues.push(node.id + ' ' + node.name + ', 此文字类型需要人工核对')
        return
      }
      if (!('children' in node)) return
      let childClip = clip
      let childCorners = corners
      if (node.clipsContent) {
        childClip = intersection(clip, node.absoluteBoundingBox)
        if (!childClip) return
        if (!noRotationOrScale(node)) reasons.push('祖先使用变换裁切, 文字框为外接矩形')
        if ([node.topLeftRadius, node.topRightRadius, node.bottomLeftRadius, node.bottomRightRadius].some(r => r > 0)) {
          childCorners = corners.concat(node)
        }
      }
      let masked = false
      for (const child of node.children) {
        if (visible(child) && child.isMask) {
          masked = true
        } else {
          visit(child, childClip, childCorners, masked ? reasons.concat('蒙版的可见边缘需要在导出图核对') : reasons)
        }
      }
    }
    visit(frame, origin, [], ancestors)
    return result
  }

  if (!frames || typeof frames !== 'object' || Array.isArray(frames) || !Object.keys(frames).length) {
    throw Error('请提供状态名称与 Figma 画框 ID 的映射')
  }
  const states = Object.create(null)
  for (const [name, id] of Object.entries(frames)) states[name] = await readFrame(id)
  return {version: 1, states}
}

if (typeof module !== 'undefined' && module.exports) module.exports = {exportTextLayers}
