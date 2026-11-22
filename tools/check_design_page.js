// For Figmosha, load figma_flow.js and figma_screen_scope.js before calling this function.
async function checkDesignPage(api, options = {}) {
  const mode = options.mode === undefined ? 'single-screen' : options.mode
  if (!['single-screen', 'workflow'].includes(mode)) throw Error('未知的 Figma 检查模式 ' + mode)
  const single = mode === 'single-screen'
  let page = api.currentPage
  if (options.page) {
    const pages = api.root.children
    const matches = pages.filter(p => p.name === options.page)
    page = pages.find(p => p.id === options.page)
    if (!page && matches.length === 1) page = matches[0]
    if (!page) throw Error(matches.length > 1 ? '同名 Figma 页面有多项, 请指定页面 ID' : '找不到 Figma 页面 ' + options.page)
  }
  if (page.loadAsync) await page.loadAsync()
  const errors = [], sources = [], tasks = [], screens = []
  const report = {mode, page: {id: page.id, name: page.name}, errors, sources, tasks, screens, manualReview: [
    '对照需求逐项读任务卡, 核对覆盖范围、参考图的来历及所选组件是否适用于当前操作',
    '用接收方账号打开每个来源链接, 确认能看到对应原件',
    single
      ? '按 1× 对照本题记录, 确认首屏能辨认对象、证据、Agent 发现和当前可做的操作, 核对图片或图表实际内容、字段关联、遮挡及静态浮层'
      : '按目标尺寸查看整屏和关键控件, 核对字号、颜色、间距、图像、层级与规范, 在演示器实际完成各条操作',
  ]}
  function issue(rule, node, message) {
    errors.push({rule, nodeId: node.id, nodeName: node.name, message})
  }
  function visible(n) { return n.visible !== false && n.opacity !== 0 }
  function children(n) { return n.contentsHidden ? [] : (n.children || []).filter(visible) }
  function intersection(a, b) {
    const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y)
    const width = Math.min(a.x + a.width, b.x + b.width) - x
    const height = Math.min(a.y + a.height, b.y + b.height) - y
    return width > 0 && height > 0 ? {x, y, width, height} : null
  }
  // Clip in canvas coordinates. A frame without clipping may have visible children outside its own bounds.
  const cache = new Map()
  function descendants(root) {
    if (cache.has(root.id)) return cache.get(root.id)
    const out = []
    function visit(node, clip) {
      const box = node.absoluteBoundingBox
      const region = clip && box ? intersection(clip, box) : box
      if (region && region.width > 0 && region.height > 0) out.push(node)
      if (node.clipsContent && !region) return
      const layers = children(node)
      for (const child of node.itemReverseZIndex ? layers.reverse() : layers) visit(child, node.clipsContent ? region : clip)
    }
    let clip = root.absoluteBoundingBox
    for (let p = root.parent; clip && p && p.type !== 'PAGE'; p = p.parent) {
      if (p.clipsContent && p.absoluteBoundingBox) clip = intersection(clip, p.absoluteBoundingBox)
    }
    const layers = children(root)
    if (clip) for (const n of root.itemReverseZIndex ? layers.reverse() : layers) visit(n, clip)
    cache.set(root.id, out)
    return out
  }
  function area(name) {
    const hits = children(page).filter(n => ['FRAME', 'SECTION'].includes(n.type) && n.name.trim() === name)
    if (hits.length !== 1) issue('area', page, hits.length ? '存在同名分区, 请保留一个「' + name + '」入口' : '页面缺少可见的「' + name + '」Section 或 Frame')
    return hits.length === 1 ? hits[0] : null
  }
  function directItems(area, types) {
    if (!area) return []
    const seen = new Set(descendants(area).map(n => n.id))
    return children(area).filter(n => types.includes(n.type) && seen.has(n.id))
  }
  const featureArea = area('功能与任务'), referenceArea = area('参考实物')
  const library = area('组件与规范'), release = area('成稿')
  const supportingNames = new Set(['研究', '研究板', '首稿', '试排', '首稿与试排', '原尺寸样件'])
  const boardTypes = ['FRAME', 'SECTION', 'GROUP', 'INSTANCE', 'COMPONENT', 'COMPONENT_SET']
  if (single) {
    const areas = new Set([featureArea, referenceArea, library, release].filter(Boolean).map(n => n.id))
    for (const node of children(page)) {
      if (boardTypes.includes(node.type) && !areas.has(node.id) && !supportingNames.has(node.name.trim())) {
        issue('scope.unassigned', node, '将成稿放入「成稿」, 研究、首稿试排或样件放入对应资料区, 此画板的用途需确认')
      }
    }
  }
  const cardTypes = ['FRAME', 'GROUP', 'SECTION']
  const placeholder = /^(?:todo|tbd|placeholder|fixme|待填(?:写)?|待补(?:充)?|待完善|占位文字)[.!。! ]*$|^lorem ipsum(?:\s+dolor\b|[.! ]*$)/i
  function textContent(n) {
    if (n.type !== 'TEXT' || typeof n.characters !== 'string' || n.hasMissingFont) return ''
    if (Array.isArray(n.fills) && !n.fills.some(visible) && !(n.strokes || []).some(visible)) return ''
    const s = n.characters.trim()
    return placeholder.test(s) ? '' : s
  }
  function fullyInViewport(node, screen) {
    const box = node.absoluteBoundingBox
    for (let p = node.parent; p && p.type !== 'PAGE'; p = p.parent) {
      if (p.id !== screen.id && !p.clipsContent) continue
      const region = intersection(box, p.absoluteBoundingBox)
      if (!region || region.width < box.width - 0.01 || region.height < box.height - 0.01) return false
    }
    return true
  }
  function componentsInside(n, top) {
    for (let p = n.parent; p && p.id !== top.id; p = p.parent) {
      if (['INSTANCE', 'COMPONENT', 'COMPONENT_SET'].includes(p.type)) return true
    }
    return false
  }
  function segments(n) {
    if (!textContent(n)) return []
    return n.getStyledTextSegments ? n.getStyledTextSegments(['hyperlink']) : [{characters: n.characters, hyperlink: n.hyperlink}]
  }
  function links(nodes) {
    const result = []
    for (const n of nodes) for (const run of segments(n)) {
      if (run.hyperlink && run.characters.trim()) result.push({node: n, link: run.hyperlink})
    }
    return result
  }
  function note(nodes, card) {
    return nodes.some(n => {
      if (componentsInside(n, card) || !textContent(n)) return false
      const body = segments(n).filter(run => !run.hyperlink).map(run => run.characters).join('').trim()
      return body && !placeholder.test(body) && !/^https?:\/\//i.test(body)
    })
  }
  const libraryNodes = library ? [...descendants(library)] : []
  if (single) {
    for (const board of children(page).filter(n => n.name.trim() === '原尺寸样件' && boardTypes.includes(n.type))) {
      libraryNodes.push(board, ...descendants(board))
    }
  }
  const local = new Map(libraryNodes.filter(n => ['COMPONENT', 'COMPONENT_SET'].includes(n.type)).map(n => [n.id, n]))
  function family(n) { return n.type === 'COMPONENT' && n.parent.type === 'COMPONENT_SET' ? n.parent.id : n.id }
  const instances = new Map()
  async function familyOfInstance(n) {
    if (!instances.has(n.id)) {
      const main = await n.getMainComponentAsync()
      instances.set(n.id, main && local.has(main.id) ? family(main) : null)
    }
    return instances.get(n.id)
  }
  async function instanceFamilies(nodes) {
    const ids = new Set()
    for (const n of nodes) if (n.type === 'INSTANCE') {
      const id = await familyOfInstance(n)
      if (id) ids.add(id)
    }
    return ids
  }
  // Names and IDs can differ between identical copies. Compare visible text, layout, paint and shape instead.
  function appearance(root) {
    const layers = [root, ...descendants(root)]
    return JSON.stringify(layers.map(n => [n.type, n.width, n.height, n === root ? null : n.relativeTransform,
      n.type === 'TEXT' ? [n.characters, n.fontSize, n.fontName, n.textAlignHorizontal] : null,
      n.fills, n.strokes, n.strokeWeight, n.opacity, n.effects, n.cornerRadius, n.vectorPaths]))
  }
  const fullScreens = directItems(release, ['FRAME'])
  const placedFamilies = new Set(), seenScreens = new Map()
  if (release && !fullScreens.length) issue('screen.frame', release, single
    ? '在成稿分区直接放一张可见的首屏 Frame'
    : '将每个原尺寸状态画板作为成稿分区的直接 Frame')
  if (single && release) {
    // Count artwork structurally, so a second frame cannot disappear by hiding or clipping it.
    for (const node of release.children || []) {
      if (boardTypes.includes(node.type) && node.id !== (fullScreens[0] && fullScreens[0].id)) {
        issue('scope.extra-board', node, '成稿限一张可见的首屏 Frame, 研究、试排和原尺寸样件请独立放置')
      }
    }
  }
  const visibleCopy = []
  for (const screen of fullScreens) {
    const nodes = descendants(screen), texts = nodes.map(textContent).filter(Boolean)
    const families = await instanceFamilies(nodes)
    for (const id of families) placedFamilies.add(id)
    screens.push({id: screen.id, name: screen.name, width: screen.width, height: screen.height,
      textLayers: texts.length, componentFamilies: [...families]})
    if (new Set(texts).size < 2) issue('screen.content', screen, '画面需要可见的业务内容和控件或状态文字, 请检查隐藏、裁切、缺失字体和占位层')
    if (library && !families.size) issue('screen.instances', screen, '在实际画面中使用规范区的组件实例, 检查实例是否已分离或被隐藏')
    if (single) {
      if (screen === fullScreens[0]) {
        for (const n of nodes) if (textContent(n) && fullyInViewport(n, screen)) visibleCopy.push(textContent(n))
      }
      const scope = typeof checkScreenScope === 'function' ? checkScreenScope : require('./figma_screen_scope.js').checkScreenScope
      scope(screen, nodes, issue)
    } else {
      const signature = appearance(screen)
      if (seenScreens.has(signature)) issue('screen.duplicate', screen, '可见图层与「' + seenScreens.get(signature) + '」相同, 请展示操作后发生的变化')
      else seenScreens.set(signature, screen.name)
    }
  }
  const mapped = new Set(), cards = directItems(featureArea, cardTypes)
  const requiredCopy = new Map()
  if (featureArea && !cards.length) issue('task.card', featureArea, '每项功能放一张任务卡, 将任务说明和关联组件放在同一 Frame 或 Group')
  for (const card of cards) {
    const nodes = descendants(card), ids = await instanceFamilies(nodes)
    const checklists = single ? nodes.filter(n => n.type === 'TEXT' && n.name.trim() === '首屏核对' && !componentsInside(n, card)) : []
    for (const list of checklists) {
      for (const line of textContent(list).split(/\r?\n/)) {
        const value = line.trim().replace(/\s+/g, ' ')
        if (value && !placeholder.test(value) && !requiredCopy.has(value)) requiredCopy.set(value, list)
      }
    }
    if (!note(nodes.filter(n => !checklists.includes(n)), card)) issue('task.description', card, '写出任务的对象、用户操作及预期结果, 请将说明放在组件实例外')
    for (const {link} of links(nodes)) if (link.type === 'NODE' && local.has(link.value)) ids.add(family(local.get(link.value)))
    if (!ids.size) issue('task.component', card, '任务缺少组件映射, 放入规范区组件的实例, 或将文字链接到该组件节点')
    for (const id of ids) {
      mapped.add(id)
      if (release && !placedFamilies.has(id)) issue('task.unused', card, '「' + local.get(id).name + '」未在任何成稿状态中使用')
    }
    tasks.push({id: card.id, name: card.name, componentFamilies: [...ids]})
  }
  if (single) {
    if (featureArea && requiredCopy.size < 2) {
      issue('screen.evidence-list', featureArea, '在核心任务卡中放名为「首屏核对」的文字层, 每行写一项同屏核对的业务原文, 至少写两项不同的值')
    }
    const lines = visibleCopy.map(s => s.replace(/\s+/g, ' '))
    report.contentChecks = []
    for (const [value, list] of requiredCopy) {
      // Match a complete identifier or word within a longer caption. SG-104 cannot verify SG-1042.
      const literal = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const left = /^[A-Za-z0-9_]/.test(value) ? '(^|[^A-Za-z0-9_])' : ''
      const right = /[A-Za-z0-9_]$/.test(value) ? '($|[^A-Za-z0-9_])' : ''
      const matches = new RegExp(left + literal + right)
      const found = lines.some(s => matches.test(s))
      report.contentChecks.push({nodeId: list.id, value, found})
      if (!found) issue('screen.evidence', list, '首屏缺少任务卡指定的可见业务原文「' + value + '」')
    }
  }
  if (library) {
    const guidance = libraryNodes.filter(n => !componentsInside(n, library)).map(textContent).filter(Boolean).join('\n')
    const value = String.raw`\d+(?:\.\d+)?`, nearby = String.raw`[^\n,;，；]{0,20}`
    function quantity(labels) { return new RegExp('(?:' + labels + ')' + nearby + value + '|' + value + nearby + '(?:' + labels + ')', 'i').test(guidance) }
    if (!quantity('字[号級级]|标题|正文|行高|font|typography|body|heading|line.height')) issue('spec.type', library, '在规范区标出实际字号或行高, 如「正文 16 px」')
    if (!quantity('间距|组距|内距|边距|列距|行距|spacing|padding|gap|margin|gutter')) issue('spec.spacing', library, '标出具体的组距或内边距, 如「组距 8 px」')
    if (!/(?:#[0-9a-f]{3,4}\b|#[0-9a-f]{6}(?:[0-9a-f]{2})?\b|rgba?\(\s*\d)/i.test(guidance)) issue('spec.color', library, '标出界面颜色的用途和实际色值, 如「正文色 #122334」')
    if (![...local.values()].some(n => n.type === 'COMPONENT')) issue('spec.component', library, '在规范区放置可编辑的原生主组件')
    const usableSets = new Set()
    for (const set of [...local.values()].filter(n => n.type === 'COMPONENT_SET')) {
      const variants = children(set).filter(n => n.type === 'COMPONENT' && local.has(n.id))
      const properties = variants.map(n => JSON.stringify(Object.entries(n.variantProperties || {}).sort()))
      if (properties.includes('[]') || new Set(properties).size < 2 || new Set(variants.map(appearance)).size < 2) {
        issue('spec.variant', set, '展示同一原生组件集的不同属性值和可见变化, 核对变体是否只有名称不同')
      } else usableSets.add(set.id)
    }
    if (![...usableSets].some(id => mapped.has(id) && placedFamilies.has(id))) issue('spec.key-variant', library, '关键任务需要一组具有可见状态差异的原生变体, 在任务卡关联此组件并将其实例用于成稿')
  }
  const references = directItems(referenceArea, cardTypes)
  if (referenceArea && !references.length) issue('source.card', referenceArea, '在参考区按来源分组, 将截图、采用依据和来源链接放在同一张卡里')
  const checkedImages = new Map()
  async function hasSourceImage(nodes) {
    for (const n of nodes) for (const fill of Array.isArray(n.fills) ? n.fills : []) {
      if (fill.type !== 'IMAGE' || !visible(fill) || !fill.imageHash || n.width <= 1 || n.height <= 1) continue
      if (!checkedImages.has(fill.imageHash)) {
        const image = api.getImageByHash(fill.imageHash)
        const size = image && await image.getSizeAsync()
        checkedImages.set(fill.imageHash, !!size && size.width > 1 && size.height > 1)
      }
      if (checkedImages.get(fill.imageHash)) return true
    }
    return false
  }
  function webSource(value) {
    // A Figma plugin sandbox does not provide the browser URL constructor.
    return typeof value === 'string' && /^https?:\/\/(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,}(?::\d+)?(?:[/?#][^\s]*)?$/i.test(value)
  }
  for (const card of references) {
    const nodes = descendants(card)
    if (!await hasSourceImage([card, ...nodes])) issue('source.image', card, '放入可见的来源截图, 检查图片填充能否读到原图尺寸')
    if (!note(nodes, card)) issue('source.use', card, '在来源卡上写出采用的布局、控件或参数及其在本稿的用途')
    const valid = new Set()
    for (const {node, link} of links(nodes)) {
      if (link.type === 'URL' && webSource(link.value)) valid.add(link.value)
      else if (link.type === 'NODE') {
        const target = await api.getNodeByIdAsync(link.value)
        if (target && !['DOCUMENT', 'PAGE'].includes(target.type) && target.id !== card.id && !nodes.some(n => n.id === target.id)) valid.add('Figma 节点 ' + target.id)
        else issue('source.destination', node, '来源节点已失效或指回本卡, 请链接到原始参考')
      } else issue('source.destination', node, '来源需要可打开的网页地址或文件内的原件节点')
    }
    if (!valid.size) issue('source.link', card, '给来源文字设置可点击的原件链接, 直接输入地址时请确认 Figma 已生成超链接')
    for (const url of valid) sources.push({nodeId: card.id, nodeName: card.name, url})
  }
  if (!single && fullScreens.length) {
    const flow = typeof checkFigmaFlow === 'function' ? checkFigmaFlow : require('./figma_flow.js').checkFigmaFlow
    report.prototype = flow(page, fullScreens, descendants, issue)
  }
  return report
}

if (typeof module !== 'undefined' && module.exports) module.exports = {checkDesignPage}
