// Read-only Plugin API. nodes are visible, clipped descendants in layer order.
function checkScreenScope(screen, nodes, issue) {
  function inspectAction(node, action) {
    if (!action) return
    if (action.type === 'CONDITIONAL') {
      for (const block of action.conditionalBlocks) {
        for (const nested of block.actions) inspectAction(node, nested)
      }
    }
    if (action.type !== 'NODE') return
    if (action.navigation === 'OVERLAY') {
      issue('scope.overlay', node, '此控件配置了打开浮层的操作, 将本次决定需要的信息与操作放入首屏')
    } else if (['NAVIGATE', 'SWAP'].includes(action.navigation) && action.destinationId !== screen.id) {
      issue('scope.navigation', node, '此操作将切换画面, 请在首屏呈现当前任务和决定, 跳转目标 ' +
        (action.destinationId || '已失效'))
    }
  }
  for (const node of [screen, ...nodes]) {
    for (const reaction of node.reactions || []) {
      if (!reaction.trigger) continue
      for (const action of reaction.actions || [reaction.action]) inspectAction(node, action)
    }
  }

  const viewport = screen.absoluteBoundingBox
  if (!viewport) return
  function inside(inner, outer) {
    return inner.x >= outer.x - 1 && inner.y >= outer.y - 1 &&
      inner.x + inner.width <= outer.x + outer.width + 1 &&
      inner.y + inner.height <= outer.y + outer.height + 1
  }
  // A translucent full-viewport layer drawn above existing text and below a
  // smaller panel is a static scrim. A tint drawn behind all UI is a background.
  function isScrim(node, box) {
    if (node.isMask || !['RECTANGLE', 'FRAME', 'INSTANCE', 'COMPONENT'].includes(node.type) ||
        !inside(viewport, box) || !Array.isArray(node.fills)) return false
    for (let p = node.parent; p && p.id !== screen.id; p = p.parent) {
      if (p.clipsContent && p.absoluteBoundingBox && !inside(viewport, p.absoluteBoundingBox)) return false
    }
    const paints = node.fills.filter(p => p.visible !== false && p.opacity !== 0)
    if (!paints.length || paints.some(p => p.type !== 'SOLID')) return false
    return (node.opacity > 0 && node.opacity < 1) || paints.every(p => p.opacity > 0 && p.opacity < 1)
  }
  function hasText(node) {
    return node.type === 'TEXT' && typeof node.characters === 'string' && node.characters.trim() && !node.hasMissingFont &&
      (!Array.isArray(node.fills) || node.fills.concat(node.strokes || []).some(p => p.visible !== false && p.opacity !== 0))
  }
  const panelsWithText = new Set()
  for (const node of nodes.filter(hasText)) {
    for (let p = node.parent; p && p.id !== screen.id; p = p.parent) panelsWithText.add(p.id)
  }
  const earlierText = []
  let scrim = null
  const panelTypes = ['FRAME', 'GROUP', 'INSTANCE', 'COMPONENT']
  const dialogName = /(?:^|[\s/_-])(?:modal|dialog|popup|popover)(?:$|[\s/_-])|(?:弹窗|对话框|浮窗)(?:$|[\s/_-])/i
  for (const node of nodes) {
    const box = node.absoluteBoundingBox
    if (!box) continue
    if (hasText(node)) {
      earlierText.push(box)
    } else if (earlierText.length && isScrim(node, box)) {
      scrim = node
    } else if (panelTypes.includes(node.type) && panelsWithText.has(node.id) && inside(box, viewport) &&
        !inside(viewport, box)) {
      if (scrim) {
        issue('scope.overlay', node, '面板覆盖在遮住首屏内容的半透明图层「' + scrim.name + '」之上, 请将审阅内容排入首屏')
        return
      }
      if (dialogName.test(node.name) && earlierText.some(text => inside(text, box))) {
        issue('scope.overlay', node, '弹窗容器覆盖了下层正文, 请将当前任务所需的信息排入首屏')
        return
      }
    }
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = {checkScreenScope}
