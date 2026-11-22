// Read native, visible layers. The caller supplies the same clipped traversal and text/link readers as the page checker.
async function checkReferenceDepth({api, referenceArea, sources, descendants, textContent, links, issue}) {
  const fields = ['比较问题', '比较位置', '来源', '来源类型', '原图尺寸', '取景', '画面观察', '本稿取舍', '取舍理由']
  const prefix = new RegExp('^(' + fields.join('|') + ')\\s*[:：]\\s*(.*)$')
  const clean = s => s.toLowerCase().replace(/[\s,，.。:：、!?！？\-·]/g, '')
  function informative(s) {
    const generic = /^(?:[ab]|待定|待补充?|待填写?|同上|参考(?:图|来源)?|比较(?:问题)?|问题|对比|对照|第?\d+组|官方(?:网站|来源)?|采用|舍弃|借鉴|保留|沿用|布局|组件|操作|很好|有用|提高效率|界面清晰|提升体验|参考布局|使用方便|[a-z]?\d+|todo|tbd|n\/?a|placeholder|pair|question|comparison|reference)[\d\s.。!?！？#-]*$/i
    return !!s && /[a-z\u3400-\u9fff]/i.test(s) && !generic.test(s.trim())
  }
  function annotations(nodes) {
    const values = Object.create(null)
    for (const n of nodes) {
      const text = textContent(n)
      if (!text) continue
      const lines = text.split(/\r?\n/)
      let labeled = false
      for (const line of lines) {
        const m = prefix.exec(line.trim())
        if (m) { values[m[1]] = m[2].trim(); labeled = true }
      }
      if (!labeled && fields.includes(n.name.trim())) values[n.name.trim()] = text.trim()
    }
    return values
  }
  function isAncestor(ancestor, node) {
    for (let n = node; n; n = n.parent) if (n.id === ancestor.id) return true
    return false
  }
  function imagePaints(n) {
    return (Array.isArray(n.fills) ? n.fills : []).filter(p => p.type === 'IMAGE' && p.imageHash && p.visible !== false && p.opacity !== 0)
  }
  async function destinations(nodes, card) {
    const urls = new Set()
    for (const {link} of links(nodes)) {
      if (link.type === 'URL') {
        const url = /^(https?:\/\/)((?:[\da-z-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#][^\s]*)?$/i.exec(link.value)
        if (url && !/(?:^|\.)(?:example\.(?:com|net|org)|example|invalid|test|localhost)$/i.test(url[2])) urls.add(link.value)
      } else if (link.type === 'NODE') {
        const target = await api.getNodeByIdAsync(link.value)
        if (!target || ['PAGE', 'DOCUMENT'].includes(target.type) || isAncestor(target, card) || isAncestor(referenceArea, target)) continue
        const original = [target, ...descendants(target)]
        if (original.some(n => imagePaints(n).length) || (target.type !== 'TEXT' && original.some(n => textContent(n)) && original.length > 2)) urls.add('Figma 节点 ' + target.id)
      }
    }
    return [...urls]
  }
  function dimensions(s) {
    const m = /^(\d+)\s*[x×*]\s*(\d+)\s*(?:px|像素)?$/i.exec(s || '')
    return m && Number(m[1]) > 1 && Number(m[2]) > 1 ? {width: Number(m[1]), height: Number(m[2])} : null
  }
  function framing(s, size) {
    if (/^(整图|全图|full)$/i.test(s || '')) return {type: 'full'}
    const m = /^(?:裁切|裁剪|crop)\s*[:：]?\s*(\d+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*(?:px)?$/i.exec(s || '')
    if (!m || !size) return null
    const [x, y, width, height] = m.slice(1).map(Number)
    if (width < 1 || height < 1 || x + width > size.width || y + height > size.height || (width === size.width && height === size.height)) return null
    return {type: 'crop', x, y, width, height}
  }
  const sizes = new Map()
  async function sizeOf(hash) {
    if (!sizes.has(hash)) {
      const img = api.getImageByHash(hash)
      const value = img && await img.getSizeAsync()
      sizes.set(hash, value && value.width > 1 && value.height > 1 ? value : null)
    }
    return sizes.get(hash)
  }
  const close = (a, b) => Math.abs(a - b) <= 1
  function equalRect(a, b) { return ['x', 'y', 'width', 'height'].every(k => close(a[k], b[k])) }
  function intersection(a, b) {
    const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y)
    return {x, y, width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x), height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y)}
  }
  function visibleBox(n, card) {
    let box = n.absoluteBoundingBox
    if (!box) return null
    for (let p = n.parent; p && p.type !== 'PAGE'; p = p.parent) {
      if ((p.clipsContent || p.id === card.id || p.id === referenceArea.id) && p.absoluteBoundingBox) box = intersection(box, p.absoluteBoundingBox)
    }
    return box
  }
  // For unrotated FIT/FILL and rectangular clipping, recover the visible source coordinates from canvas bounds.
  function displayedPixels(n, fill, imageSize, box) {
    const layer = n.absoluteBoundingBox
    const img = imageSize
    if (!layer || !box || layer.width <= 0 || layer.height <= 0 || !['FIT', 'FILL'].includes(fill.scaleMode) || fill.rotation) return null
    const t = n.absoluteTransform
    if (t && (Math.abs(t[0][1]) > 0.00001 || Math.abs(t[1][0]) > 0.00001 || t[0][0] <= 0 || t[1][1] <= 0)) return null
    const pick = fill.scaleMode === 'FIT' ? Math.min : Math.max
    const scale = pick(layer.width / img.width, layer.height / img.height)
    const imageBox = {x: layer.x + (layer.width - img.width * scale) / 2, y: layer.y + (layer.height - img.height * scale) / 2, width: img.width * scale, height: img.height * scale}
    const shown = intersection(imageBox, box)
    return {x: (shown.x - imageBox.x) / scale, y: (shown.y - imageBox.y) / scale, width: shown.width / scale, height: shown.height / scale}
  }
  function cropTransform(fill) {
    const m = fill.imageTransform
    if (fill.scaleMode !== 'CROP' || !Array.isArray(m) || m.length !== 2 || !m.every(r => Array.isArray(r) && r.length === 3 && r.every(Number.isFinite))) return null
    const values = m.map(row => row.map(v => Math.round(v * 100000) / 100000))
    return JSON.stringify(values) === '[[1,0,0],[0,1,0]]' ? null : values
  }
  async function primaryImage(card, nodes) {
    const images = []
    for (const n of [card, ...nodes]) {
      const box = visibleBox(n, card)
      if (n.width <= 1 || n.height <= 1 || !box || box.width <= 1 || box.height <= 1) continue
      for (const fill of imagePaints(n)) {
        const size = await sizeOf(fill.imageHash)
        if (size) images.push({node: n, fill, size, box, area: box.width * box.height})
      }
    }
    // A card can contain detail insets and logos. Authors can designate the source; otherwise the largest visible image is the comparison subject.
    const named = images.filter(img => img.node.name === '参考图')
    const eligible = named.length ? named : images
    return eligible.sort((a, b) => b.area - a.area)[0]
  }
  function inspectImage(image, size, view, card) {
    const {node, fill, box} = image
    const native = image.size
    const whole = {x: 0, y: 0, width: native.width, height: native.height}
    const pixels = displayedPixels(node, fill, native, box)
    const transform = cropTransform(fill)
    const region = pixels && !equalRect(pixels, whole) ? ['rect', ...['x','y','width','height'].map(k => Math.round(pixels[k]))] : transform ? ['transform', transform] : ['full']
    if (size && view) {
      const original = size.width === native.width && size.height === native.height
      const cutout = view.type === 'crop' && view.width === native.width && view.height === native.height
      if (!original && !cutout) issue('source.image-size', card, '原图尺寸或裁切宽高与参考图的像素尺寸不符, 请核对原件或在 Figma 中缩放图层')
      if (fill.scaleMode === 'TILE' || (view.type === 'full' && region[0] !== 'full') ||
        (view.type === 'crop' && ((original && pixels && !equalRect(view, pixels)) || (original && !pixels && !transform) || (cutout && region[0] !== 'full')))) {
        issue('source.image-view', card, '画布显示的区域与整图或裁切标注不符, 请核对填充和裁切边界')
      }
    }
    return {nodeId: node.id, hash: fill.imageHash, nativeSize: native, region}
  }
  const cards = [], groups = new Map(), imagesSeen = new Map(), observations = new Map()
  const sourceKinds = {'项目示例': [], '官方产品或规范': [], '同业务产品实物': []}
  const externalOfficial = [], domainExamples = []
  for (const card of sources) {
    const nodes = descendants(card), a = annotations(nodes)
    const question = a['比较问题'] || '', side = (a['比较位置'] || '').toUpperCase()
    const size = dimensions(a['原图尺寸']), view = framing(a['取景'], size)
    if (!informative(question)) issue('source.question', card, '写出本组两张图共同研究的具体设计决定')
    if (!/^[AB]$/.test(side)) issue('source.side', card, '比较位置填写 A 或 B')
    if (!informative(a['来源'])) issue('source.provenance', card, '写出产品、应用或原件名称及所示界面')
    const provenance = await destinations(nodes, card)
    if (!provenance.length) issue('source.original', card, '添加可点击的产品或业务原件出处, 文件内链接须指向参考区之外的原始设计或图片')
    const kinds = [...new Set((a['来源类型'] || '').split(/[,，、/+]+/).map(k => k.trim()).filter(Boolean))]
    const classified = kinds.length && kinds.every(k => Object.prototype.hasOwnProperty.call(sourceKinds, k)) && !(kinds.includes('项目示例') && kinds.length > 1)
    if (!classified) issue('source.kind', card, '区分项目示例、官方产品或规范、同业务产品实物, 官方同业务产品截图可以同时填写后两项')
    else for (const kind of kinds) sourceKinds[kind].push(card.id)
    if (!size) issue('source.dimensions', card, '标明来源原件的像素宽高, 如 1440×900')
    if (!view) issue('source.framing', card, '填写整图或裁切 x,y,w,h, 以原图左上角为原点, 裁切不得超出原图')
    for (const [field, rule, instruction] of [
      ['画面观察', 'observation', '指出图中可以复查的控件、内容、位置或状态关系'],
      ['本稿取舍', 'decision', '说明本稿哪处采用、改用或舍弃图里的做法'],
      ['取舍理由', 'rationale', '写明驱动取舍的任务要求、数据条件或空间约束'],
    ]) if (!informative(a[field])) issue('source.' + rule, card, instruction)
    const observation = clean(a['画面观察'] || '')
    if (observation) {
      if (observations.has(observation)) issue('source.repeated-observation', card, '观察与「' + observations.get(observation) + '」相同, 请指出本张图独有的证据')
      else observations.set(observation, card.name)
    }
    const statements = ['画面观察','本稿取舍','取舍理由'].map(k => clean(a[k] || '')).filter(Boolean)
    if (new Set(statements).size < statements.length) issue('source.repeated-note', card, '请分别写出图中所见、本稿决定和作此决定的原因')
    const image = await primaryImage(card, nodes)
    const evidence = image ? inspectImage(image, size, view, card) : null
    if (!evidence) issue('source.reference-image', card, '本张参考卡需就地展示原始截图或实际裁切, 使用可读的图片填充')
    else {
      const key = JSON.stringify([evidence.hash, evidence.region])
      if (imagesSeen.has(key)) issue('source.repeated-image', card, '与「' + imagesSeen.get(key) + '」显示同一图片和区域, 请换用另一张实物或研究不同的实际裁切')
      else imagesSeen.set(key, card.name)
    }
    if (classified && evidence && provenance.length) {
      if (kinds.includes('官方产品或规范') && provenance.some(url => /^https?:\/\//i.test(url))) externalOfficial.push(card.id)
      if (kinds.includes('同业务产品实物')) domainExamples.push(card.id)
    }
    cards.push({id: card.id, name: card.name, question, side, source: a['来源'] || '', kinds, destinations: provenance, originalSize: size, framing: view, image: evidence, observation: a['画面观察'] || '', decision: a['本稿取舍'] || '', rationale: a['取舍理由'] || ''})
    if (informative(question)) {
      const key = clean(question)
      if (!groups.has(key)) groups.set(key, {question, items: []})
      groups.get(key).items.push({id: card.id, side})
    }
  }
  const comparisons = [...groups.values()]
  let complete = 0
  for (const pair of comparisons) {
    if (pair.items.length === 2 && pair.items.some(i => i.side === 'A') && pair.items.some(i => i.side === 'B')) complete++
    else issue('source.pair', sources.find(n => n.id === pair.items[0].id), '同一比较问题需要 A 和 B 各一张来源卡, 请核对位置和问题文字')
  }
  if (complete < 6) issue('source.coverage', referenceArea, '已配对 ' + complete + ' 组, 需要至少 6 个具体比较问题, 每组 2 张实物')
  if (!externalOfficial.length) issue('source.official', referenceArea, '至少一张官方产品或规范的实物图需关联外部官方出处')
  if (!domainExamples.length) issue('source.domain', referenceArea, '为本题的专业判断提供至少一张同业务产品实物及其出处')
  return {cards, comparisons, sourceKinds, externalOfficial, domainExamples, manualReview: ['用接收者账号打开出处, 确认来源类型、产品、界面、状态、原图尺寸和裁切范围, 对照图片核实观察与取舍', '逐组核实 A/B 回答同一设计问题, 检查重编码、轻微移动裁切及同源内容是否重复, 复核影响本稿的测量值或材质判断']}
}

if (typeof module !== 'undefined' && module.exports) module.exports = {checkReferenceDepth}
