// Loaded into the Figma sandbox before check_design_page.js. No network or document writes.
async function checkSpecDepth({library, screens, descendants, textContent, links, familyOfInstance, issue}) {
  const counts = {typography: 0, palette: 0, geometry: 0, sourceComparisons: 0,
    specimenRoles: 0, specimenFamilies: 0, stateFamilies: 0, contexts: 0, materialRequired: false}
  if (!library) return counts

  const nativeCards = new Set(['FRAME', 'GROUP', 'SECTION'])
  const components = new Set(['INSTANCE', 'COMPONENT', 'COMPONENT_SET'])
  const parts = name => String(name || '').split('/').map(word => word.trim())
  function insideComponent(node, stop) {
    for (let p = node.parent; p && p !== stop; p = p.parent) if (components.has(p.type)) return true
    return false
  }
  const visibleLibrary = descendants(library)
  const cards = visibleLibrary.filter(n => nativeCards.has(n.type) && !insideComponent(n, library))
  const key = n => parts(n.name).slice(0, 2).join('/')
  const cardMap = new Map()
  for (const card of cards) {
    const name = key(card)
    if (!cardMap.has(name)) cardMap.set(name, card)
  }
  function required(rule, category, roles, test) {
    for (const role of roles) {
      const name = category + '/' + role
      const card = cardMap.get(name)
      if (card) test(role, card)
      else issue(rule, library, '缺少可见的「' + name + '」原生分组, 详见 docs/spec-native.md')
    }
  }
  function values(card) {
    return descendants(card).filter(n => !insideComponent(n, card))
  }
  function named(card, name) { return values(card).find(n => n.name.trim() === name) }
  function note(card, name) {
    const node = named(card, name)
    return node ? textContent(node) : ''
  }
  function solid(node) {
    return Array.isArray(node && node.fills) ?
      node.fills.find(p => p.type === 'SOLID' && p.visible !== false && p.opacity !== 0) : null
  }
  const channel = value => Math.round(255 * value).toString(16).padStart(2, '0').toUpperCase()
  function colorHex(paint) {
    const c = paint && paint.color
    return c ? '#' + channel(c.r) + channel(c.g) + channel(c.b) : ''
  }
  function typedNumbers(text) {
    const result = [], matcher = /(\d+(?:\.\d+)?)\s*px\b/gi
    let match
    while ((match = matcher.exec(text))) result.push(+match[1])
    return result
  }
  const near = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 0.25
  const sizeEqual = (a, b) => near(a.width, b.width) && near(a.height, b.height)
  const releaseNodes = new Map()
  const owner = new Map()
  for (const screen of screens) {
    for (const node of [screen, ...descendants(screen)]) {
      releaseNodes.set(node.id, node)
      owner.set(node.id, screen)
    }
  }
  const nodeIndex = new Map(visibleLibrary.map(n => [n.id, n]))
  for (const [id, node] of releaseNodes) nodeIndex.set(id, node)
  function targets(card) {
    return links(values(card)).filter(item => item.link.type === 'NODE')
      .map(item => nodeIndex.get(item.link.value)).filter(Boolean)
  }
  const reference = (library.parent && library.parent.children || []).find(n => n.name === '参考实物')
  const sourceIds = new Set(reference ? [reference, ...descendants(reference)].map(n => n.id) : [])
  const sectionsWithSource = new Set()
  function sourceDecision(section, card) {
    const original = named(card, '来源')
    if (!original) return
    const source = textContent(original)
    const hasValue = /#[\da-f]{6}\b|\d\s*(?:px|pt|rem|%|倍)/i.test(source)
    const live = links([original]).some(({link}) => (link.type === 'URL' && /^https?:\/\/[^\s/]+\/\S+/i.test(link.value))
      || (link.type === 'NODE' && sourceIds.has(link.value)))
    if (hasValue && live && note(card, '取舍') && note(card, '参数')) {
      sectionsWithSource.add(section)
      counts.sourceComparisons++
    } else issue('spec.provenance', card, '「来源」写原件的数值和原单位并链接到实物, 「参数」记录本稿值, 「取舍」说明该值适用的操作')
  }

  const typeSizes = {}
  const screenText = Array.from(releaseNodes.values()).filter(n => textContent(n))
  required('spec.typography', '字阶', ['标题', '分组', '正文', '操作', '元数据'], (role, card) => {
    const node = named(card, '字样')
    const param = note(card, '参数')
    const pair = param.match(/(\d+(?:\.\d+)?)\s*(?:px)?\s*\/\s*(\d+(?:\.\d+)?)\s*px\b/i)
    const font = node && node.fontName
    const inUse = !['标题', '正文', '操作'].includes(role) || (node && font && screenText.some(n =>
      n.fontName && n.fontName.family === font.family && n.fontName.style === font.style && near(n.fontSize, node.fontSize)
      && n.lineHeight && node.lineHeight && n.lineHeight.unit === node.lineHeight.unit && near(n.lineHeight.value, node.lineHeight.value)))
    if (node && textContent(node) && inUse && font && typeof font.family === 'string' && typeof font.style === 'string'
       && pair && param.toLowerCase().includes(font.family.toLowerCase()) && param.toLowerCase().includes(font.style.toLowerCase())
       && near(node.fontSize, +pair[1]) && node.lineHeight && node.lineHeight.unit === 'PIXELS' && near(node.lineHeight.value, +pair[2])) {
      counts.typography++
      typeSizes[role] = node.fontSize
    } else issue('spec.typography', card, '放入真实业务「字样」, 在「参数」逐项核对字体家族、字形及字号/行高 px, 标题、正文、操作需与成稿字样一致')
    sourceDecision('字阶', card)
  })
  if (typeSizes['标题'] <= typeSizes['正文']) issue('spec.typography.hierarchy', library, '当前标题与正文的实测字阶未拉开, 请复核标题角色和阅读层级')
  required('spec.palette', '色彩', ['背景', '正文', '次文字', '主操作', '选中', '警示', '通过', '分割线'], (role, card) => {
    const sample = named(card, '色样')
    const hex = note(card, '参数').match(/#[0-9a-f]{6}\b/i)
    const paint = paintKey(sample)
    let inUse = true
    if (role === '正文') inUse = screenText.some(n => paintKey(n) === paint)
    if (role === '背景') inUse = Array.from(releaseNodes.values()).some(n => n.type !== 'TEXT'
      && n.width >= owner.get(n.id).width * 0.2 && n.height >= owner.get(n.id).height * 0.2 && paintKey(n) === paint)
    if (sample && sample.type !== 'TEXT' && hex && hex[0].toUpperCase() === colorHex(solid(sample)) && inUse) counts.palette++
    else issue('spec.palette', card, '放入原生「色样」并在「参数」写相同的六位 HEX, 正文与背景色样的填充、透明度需与成稿中的文字及大底面一致')
    sourceDecision('色彩', card)
  })

  function measurementTarget(node) {
    if (releaseNodes.has(node.id)) return true
    for (let p = node; p && p !== library; p = p.parent) {
      if (components.has(p.type) || parts(p.name)[0] === '样件' || p.name === '测量样件') return true
    }
    return false
  }
  function gapBetween(nodes) {
    if (nodes.length !== 2 || nodes[0].parent !== nodes[1].parent) return []
    const a = nodes[0].absoluteBoundingBox, b = nodes[1].absoluteBoundingBox
    if (!a || !b) return []
    const gaps = []
    if (a.x < b.x + b.width && b.x < a.x + a.width) gaps.push(Math.max(a.y - b.y - b.height, b.y - a.y - a.height))
    if (a.y < b.y + b.height && b.y < a.y + a.height) gaps.push(Math.max(a.x - b.x - b.width, b.x - a.x - a.width))
    return gaps.filter(v => v > 0)
  }
  const focused = node => Array.isArray(node.strokes) && node.strokes.some(p => p.visible !== false && p.opacity !== 0)
  const widthHeightRoles = new Set(['画板', '导航', '阅读区', '控件', '图标'])
  required('spec.geometry', '几何', ['画板', '导航', '阅读区', '行高', '控件', '图标', '内距', '组距', '圆角', '焦点'], (role, card) => {
    const param = note(card, '参数')
    const nodes = targets(card).filter(measurementTarget)
    const numbers = typedNumbers(param)
    const dimensions = param.match(/(\d+(?:\.\d+)?)\s*(?:px)?\s*[×x*]\s*(\d+(?:\.\d+)?)\s*px\b/i)
    const measured = []
    let matches = false
    for (const n of nodes) {
      if (widthHeightRoles.has(role)) {
        if (dimensions && (role !== '画板' || screens.includes(n))
          && near(n.width, +dimensions[1]) && near(n.height, +dimensions[2])) matches = true
      } else if (role === '行高') measured.push(n.height)
      else if (role === '圆角') measured.push(n.cornerRadius, n.topLeftRadius, n.topRightRadius, n.bottomLeftRadius, n.bottomRightRadius)
      else if (role === '内距' && n.layoutMode && n.layoutMode !== 'NONE') measured.push(n.paddingLeft, n.paddingRight, n.paddingTop, n.paddingBottom)
      else if (role === '组距' && n.layoutMode && n.layoutMode !== 'NONE') measured.push(n.itemSpacing)
      else if (role === '焦点' && focused(n)) measured.push(n.strokeWeight)
      else if (role === '焦点' && Array.isArray(n.effects)) {
        for (const effect of n.effects) {
          if (effect.type === 'DROP_SHADOW' && effect.visible !== false && effect.radius === 0) measured.push(effect.spread)
        }
      }
    }
    if (role === '组距') measured.push(...gapBetween(nodes))
    if (!matches) matches = numbers.some(v => measured.some(m => near(m, v) && (v > 0 || role === '圆角')))
    if (matches) counts.geometry++
    else issue('spec.geometry', card, '「参数」须与 NODE 链接目标的原生几何一致, 宽高写作 144 × 36 px, 单值写作 8 px, 焦点指向实际描边或焦点环')
    sourceDecision('几何', card)
  })
  for (const section of ['字阶', '色彩', '几何']) if (!sectionsWithSource.has(section)) {
    issue('spec.provenance', library, '「' + section + '」至少选一项并列写出「来源」「参数」「取舍」, 保留原图链接和原始单位')
  }
  const landmarkNames = {
    检查栏: ['检查器', '检查栏', '检查面板', 'inspector', 'inspector panel'],
    工具栏: ['工具栏', 'toolbar', 'command bar'],
    输入: ['输入', '输入框', '追问输入', 'input', 'composer', 'follow-up input'],
  }
  // Recognize the author's explicit role tag and common native layer names.
  for (const [role, aliases] of Object.entries(landmarkNames)) {
    const landmarks = Array.from(releaseNodes.values()).filter(n =>
      ['FRAME', 'GROUP', 'INSTANCE'].includes(n.type) &&
      (key(n) === '区域/' + role || aliases.includes(n.name.trim().toLowerCase())))
    if (!landmarks.length) continue
    const card = cardMap.get('几何/' + role)
    const param = card && note(card, '参数')
    const dimensions = param && param.match(/(\d+(?:\.\d+)?)\s*(?:px)?\s*[×x*]\s*(\d+(?:\.\d+)?)\s*px\b/i)
    const inset = param && param.match(/(?:水平|左|右)?内距\s*(\d+(?:\.\d+)?)\s*px\b/)
    const matches = dimensions && inset && targets(card).some(n => {
      if (!landmarks.includes(n) || !near(n.width, +dimensions[1]) || !near(n.height, +dimensions[2])) return false
      const value = +inset[1]
      if (n.layoutMode && n.layoutMode !== 'NONE') return near(n.paddingLeft, value) || near(n.paddingRight, value)
      const box = n.absoluteBoundingBox
      const children = (n.children || []).filter(child => child.visible !== false && child.opacity !== 0 && child.absoluteBoundingBox && !sizeEqual(n, child))
      if (!box || !children.length) return false
      const rects = children.map(child => child.absoluteBoundingBox)
      return near(Math.min(...rects.map(b => b.x)) - box.x, value)
        || near(box.x + box.width - Math.max(...rects.map(b => b.x + b.width)), value)
    })
    if (matches) counts.geometry++
    else issue('spec.geometry.landmark', card || landmarks[0], '成稿含「' + role + '」, 在「几何/' + role + '」链接原生容器, 核对「参数」中的宽 × 高 px 和水平内距 N px')
  }

  const scopeOf = n => n && owner.get(n.id)
  const inRelease = n => scopeOf(n) && n !== scopeOf(n)
  const materialTypes = new Set(['GLASS', 'BACKGROUND_BLUR'])
  function material(node) {
    return Array.isArray(node && node.effects) ? node.effects.filter(e => e.visible !== false && materialTypes.has(e.type)) : []
  }
  function paintKey(node) {
    const fill = solid(node)
    if (!fill) return null
    const alpha = (fill.opacity === undefined ? 1 : fill.opacity) * (node.opacity === undefined ? 1 : node.opacity)
    return colorHex(fill) + '/' + alpha.toFixed(4)
  }
  const renderedPaints = new Set(Array.from(releaseNodes.values()).filter(n => n.type !== 'TEXT').map(paintKey).filter(Boolean))
  const surface = cardMap.get('表面/层级')
  if (!surface || !['底面', '内容面'].every(name => renderedPaints.has(paintKey(named(surface, name)))) || !note(surface, '说明')) {
    issue('spec.surface', surface || library, '「表面/层级」放入与成稿填充、透明度一致的「底面」「内容面」样片, 「说明」写出阅读层、分组位置及分隔线使用边界')
  }
  // Figma effect objects can contain nested vectors/colour objects. Stable keys avoid property-order mismatches.
  function clean(value) {
    if (Array.isArray(value)) return value.map(clean)
    if (!value || typeof value !== 'object') return value
    const result = {}
    for (const k of Object.keys(value).sort()) {
      if (k !== 'boundVariables' && k !== 'visible') result[k] = clean(value[k])
    }
    return result
  }
  const effectKey = effects => JSON.stringify(clean(effects))
  const actualMaterials = new Set()
  for (const node of releaseNodes.values()) if (material(node).length) actualMaterials.add(effectKey(material(node)))
  counts.materialRequired = actualMaterials.size > 0
  if (counts.materialRequired) {
    const experiment = cardMap.get('材质/对照')
    const base = experiment && named(experiment, '基准'), sample = experiment && named(experiment, '实验')
    const baseline = effectKey(material(base)), applied = effectKey(material(sample))
    const observation = experiment && note(experiment, '说明')
    const numbers = observation ? (observation.match(/(?:\d+(?:\.\d+)?|\.\d+)/g) || []).map(Number) : []
    const materialValues = []
    for (const e of material(sample)) {
      const original = material(base).find(prior => prior.type === e.type)
      for (const [field, value] of Object.entries(e)) {
        if (typeof value === 'number' && (!original || original[field] !== value)) materialValues.push(value)
      }
    }
    if (!base || !sample || base.type !== sample.type || !sizeEqual(base, sample) || base.cornerRadius !== sample.cornerRadius
        || paintKey(base) !== paintKey(sample) || baseline === applied || !actualMaterials.has(applied)
        || !numbers.some(v => materialValues.some(m => Math.abs(v - m) < 0.001))) {
      issue('spec.material', experiment || library, '成稿使用玻璃或背景模糊, 「材质/对照」须含同一图形不同效果的原生「基准」「实验」, 实验参数需与成稿相同, 「说明」写出实测数值与观察')
    }
  }

  const roleNames = {
    导航: ['导航', '定位'], 证据: ['证据', '对照'], 运行: ['运行', '进度'],
    决定: ['决定', '操作'], 复查: ['复查', '结果'], 工具: ['工具', '输入'],
  }
  function visualState(root) {
    return JSON.stringify([root, ...descendants(root)].map(n => [n.type, n.width, n.height,
      n === root ? null : n.relativeTransform, textContent(n), n.fontName, n.fontSize, n.fontWeight,
      n.fills, n.strokes, n.strokeWeight, n.cornerRadius, n.opacity, n.effects, n.vectorPaths]))
  }
  function stateName(n) {
    if (n.variantProperties && Object.keys(n.variantProperties).length) return JSON.stringify(clean(n.variantProperties))
    const props = Object.entries(n.componentProperties || {}).filter(([, p]) => p.type === 'BOOLEAN' || p.type === 'VARIANT')
    if (props.length) return JSON.stringify(props.map(([key, p]) => [key, p.value]))
    return parts(n.name)[0] === '状态' ? parts(n.name)[1] : ''
  }
  const families = new Map()
  async function family(n) {
    if (n.type !== 'INSTANCE') return null
    if (!families.has(n.id)) families.set(n.id, await familyOfInstance(n))
    return families.get(n.id)
  }
  const exemplars = new Set(), stateFamilies = new Set(), usedPositions = new Set()
  for (const [role, aliases] of Object.entries(roleNames)) {
    const card = aliases.map(a => cardMap.get('样件/' + a)).find(Boolean)
    if (!card) {
      issue('spec.specimen', library, '缺少「样件/' + role + '」, 可用对应的业务类名 ' + aliases.join(' 或 '))
      continue
    }
    const instances = values(card).filter(n => n.type === 'INSTANCE')
    const destinations = targets(card).filter(n => n.type === 'INSTANCE' && inRelease(n))
    const linkedFamilies = new Set()
    for (const target of destinations) {
      const id = await family(target)
      if (!id) continue
      for (const n of instances) if (await family(n) === id && sizeEqual(n, target)) linkedFamilies.add(id)
    }
    if (linkedFamilies.size !== 1 || !note(card, '说明')) {
      issue('spec.specimen', card, '「样件/' + role + '」放本地原生实例及状态/用途「说明」, 将文字 NODE 链接到对应成稿实例, 核对家族及 1:1 宽高')
      continue
    }
    const [id] = linkedFamilies
    const positions = []
    for (const target of destinations) if (await family(target) === id && !usedPositions.has(target.id)) positions.push(target.id)
    if (!positions.length) {
      issue('spec.specimen.placement', card, '此成稿实例已经展示过, 请标出本项任务实际使用的实例')
      continue
    }
    usedPositions.add(positions[0])
    counts.specimenRoles++
    exemplars.add(id)
    const seenStates = []
    for (const n of instances) {
      if (await family(n) !== id) continue
      const state = stateName(n)
      if (!state) continue
      const signature = visualState(n)
      if (seenStates.some(prior => prior.state !== state && prior.signature !== signature)) stateFamilies.add(id)
      seenStates.push({state, signature})
    }
  }
  counts.specimenFamilies = exemplars.size
  counts.stateFamilies = stateFamilies.size
  if (stateFamilies.size < 3) issue('spec.states', library, '在三个关键样件家族中各展示两种可辨认的状态, 使用真实变体或将两个实例命名为「状态/业务状态」, 只改图层名称无法通过')

  const contextSignatures = new Set(), contextTargets = new Set()
  for (const card of cards.filter(n => parts(n.name)[0] === '情境' && parts(n.name)[1])) {
    const instances = values(card).filter(n => n.type === 'INSTANCE')
    const localTargets = targets(card).filter(inRelease)
    let accepted = false
    for (const target of localTargets) {
      if (contextTargets.has(target.id)) continue
      const screen = scopeOf(target)
      const tooLarge = n => n.width >= screen.width * 0.90 && n.height >= screen.height * 0.90
      if ([target, ...values(card)].some(tooLarge)) continue
      const targetInstances = [target, ...descendants(target)].filter(n => n.type === 'INSTANCE')
      for (const n of instances) {
        const id = await family(n)
        if (!exemplars.has(id)) continue
        let match = false
        for (const placed of targetInstances) if (await family(placed) === id && sizeEqual(n, placed)) { match = true; break }
        if (!match) continue
        const data = descendants(n).map(textContent).filter(Boolean).join('\n')
        if (!data || !note(card, '说明')) continue
        const signature = id + '\n' + data
        if (contextSignatures.has(signature)) continue
        contextSignatures.add(signature)
        contextTargets.add(target.id)
        accepted = true
        break
      }
      if (accepted) break
    }
    if (!accepted) issue('spec.context', card, '用带业务数据的本地原尺寸实例展示一个产品局部, 「说明」写出当前情境, NODE 链接指向对应的独立成稿实例或局部容器')
  }
  counts.contexts = contextSignatures.size
  if (counts.contexts < 2) issue('spec.context', library, '缺少两个内容和成稿定位均不同的「情境/业务名称」, 整窗复制及重复的同一条记录不能计入')
  return counts
}

if (typeof module !== 'undefined' && module.exports) module.exports = {checkSpecDepth}
