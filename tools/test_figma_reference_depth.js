const test = require('node:test')
const assert = require('node:assert/strict')
const {checkReferenceDepth} = require('./figma_reference_depth.js')

// Synthetic Plugin API records for structural tests. Visual authorship and whether a URL really shows its cited UI require separate review.
function board() {
  let id = 0
  const sizes = new Map(), nodes = new Map(), sources = [], errors = []
  function layer(type, name, parent, props = {}) {
    const n = {id: '5:' + ++id, type, name, visible: true, children: [], fills: [], parent, width: 400, height: 200,
      x: 0, y: 0, ...props,
      get absoluteBoundingBox() {
        const p = this.parent && this.parent.absoluteBoundingBox
        return {x: this.x + (p ? p.x : 0), y: this.y + (p ? p.y : 0), width: this.width, height: this.height}
      },
    }
    nodes.set(n.id, n)
    if (parent) parent.children.push(n)
    return n
  }
  const page = layer('PAGE', '测试', null)
  const referenceArea = layer('SECTION', '参考实物', page, {width: 1200, height: 3200})
  function descendants(n) {
    return n.children.filter(c => c.visible).flatMap(c => [c, ...descendants(c)])
  }
  function note(card, name, characters, hyperlink) { return layer('TEXT', name, card, {characters, hyperlink}) }
  const subjects = ['定位待审字符串', '查看截图关联', '提交译文建议', '核对变量格式', '审查通过记录', '观察作业依赖']
  for (const [i, question] of subjects.entries()) for (const [j, side] of ['A','B'].entries()) {
    const name = question + side
    const card = layer('FRAME', name, referenceArea, {x: j * 500, y: i * 420, width: 480, height: 400})
    sources.push(card)
    const hash = 'bitmap-' + i + j
    sizes.set(hash, {width: 800, height: 400})
    layer('RECTANGLE', '参考图', card, {fills: [{type: 'IMAGE', imageHash: hash, scaleMode: 'FIT'}]})
    note(card, '比较问题', question)
    note(card, '比较位置', side)
    note(card, '来源', '测试界面 ' + name, {type: 'URL', value: 'https://docs.weblate.org/en/latest/user/basic.html'})
    note(card, '来源类型', '官方产品或规范, 同业务产品实物')
    note(card, '原图尺寸', '800×400 px')
    note(card, '取景', '整图')
    note(card, '画面观察', `${question}的按钮位于${j === 0 ? '当前译文下方' : '右侧工具栏'}`)
    note(card, '本稿取舍', '采用译文下方的操作组')
    note(card, '取舍理由', '审查者需在提交前逐词查看当前译文')
  }
  const context = {referenceArea, sources, descendants,
    api: {getImageByHash: h => sizes.has(h) ? {getSizeAsync: async () => sizes.get(h)} : null, getNodeByIdAsync: async id => nodes.get(id)},
    textContent: n => n.type === 'TEXT' ? n.characters : '',
    links: ns => ns.filter(n => n.hyperlink).map(node => ({node, link: node.hyperlink})),
    issue: (rule, n) => errors.push({rule, nodeId: n.id})}
  const field = (n, key) => n.children.find(c => c.name === key)
  return {page, sources, sizes, layer, note, field, errors, check: () => checkReferenceDepth(context)}
}

test('returns native dimensions, actual destinations and a pair for each design decision, without a material requirement', async () => {
  const b = board()
  const r = await b.check()
  assert.deepEqual(b.errors, [])
  assert.equal(r.cards.length, 12)
  assert.equal(r.comparisons.length, 6)
  assert.deepEqual(r.cards[0].image.nativeSize, {width: 800, height: 400})
  assert.match(r.cards[0].destinations[0], /docs\.weblate\.org/)
  assert.equal(r.comparisons[0].items[1].side, 'B')
  assert.equal(r.externalOfficial.length, 12)
  assert.equal(r.sourceKinds['项目示例'].length, 0)
  assert.equal(r.domainExamples.length, 12)
})

test('a collection of only previous project studies lacks official and domain examples even with twelve credited images', async () => {
  const b = board()
  for (const card of b.sources) b.field(card, '来源类型').characters = '项目示例'
  const r = await b.check()
  assert.equal(r.sourceKinds['项目示例'].length, 12)
  assert.deepEqual(b.errors.map(e => e.rule), ['source.official', 'source.domain'])
})

test('an original may be both an official product and a domain example, but project studies cannot claim either role', async () => {
  const b = board()
  b.field(b.sources[0], '来源类型').characters = '项目示例, 同业务产品实物'
  await b.check()
  assert.deepEqual(b.errors, [{rule: 'source.kind', nodeId: b.sources[0].id}])
})

test('also reads visible labeled lines and a link to a native original outside the reference board', async () => {
  const b = board(), card = b.sources[0], src = b.field(card, '来源')
  const orig = b.layer('RECTANGLE', '截图原件', b.page, {fills: b.field(card, '参考图').fills})
  src.hyperlink = {type: 'NODE', value: orig.id}
  const text = card.children.filter(n => n.type === 'TEXT' && n !== src)
  b.note(card, '图注', text.map(t => t.name + ': ' + t.characters).join('\n'))
  text.forEach(t => { t.visible = false })
  const r = await b.check()
  assert.deepEqual(b.errors, [])
  assert.deepEqual(r.cards[0].destinations, ['Figma 节点 ' + orig.id])
})

test('a reused URL is fine but duplicating the same visible picture under different card IDs fails', async () => {
  const b = board(), [a, c] = b.sources
  b.field(c, '参考图').fills = b.field(a, '参考图').fills
  b.field(c, '来源').hyperlink.value = 'https://developer.apple.com/design/'
  await b.check()
  assert.deepEqual(b.errors, [{rule: 'source.repeated-image', nodeId: c.id}])
})

test('real rectangular clips of one original are recognized, changing only the written coordinates is rejected', async () => {
  const b = board(), [a,c] = b.sources
  b.field(c, '参考图').fills = b.field(a, '参考图').fills
  for (const [idx, card] of [a,c].entries()) {
    const img = b.field(card, '参考图')
    const window = b.layer('FRAME', '取景范围', card, {width: 200, height: 200, clipsContent: true})
    card.children = card.children.filter(n => n !== img)
    img.parent = window
    img.x = -idx * 200
    window.children.push(img)
    b.field(card, '取景').characters = '裁切 ' + idx * 400 + ',0,400,400'
  }
  const report = await b.check()
  assert.deepEqual(b.errors, [])
  assert.deepEqual(report.cards[1].image.region, ['rect',400,0,400,400])
  b.field(c, '取景').characters = '裁切 0,0,400,400'
  await b.check()
  assert.ok(b.errors.some(e => e.rule === 'source.image-view' && e.nodeId === c.id))
})

test('an original-size file and an actual pre-exported cutout are both accepted', async () => {
  const b = board(), card = b.sources[0], img = b.field(card, '参考图')
  b.sizes.set(img.fills[0].imageHash, {width: 460, height: 170})
  b.field(card, '取景').characters = '裁切 15,82,460,170'
  await b.check()
  assert.deepEqual(b.errors, [])
})

test('a renamed identical image with the same native crop matrix still counts as a duplicate', async () => {
  const b = board(), [a,c] = b.sources
  for (const card of [a,c]) {
    b.field(card, '参考图').fills = [{type: 'IMAGE', imageHash: 'bitmap-00', scaleMode: 'CROP', imageTransform: [[0.5,0,0],[0,1,0]]}]
    b.field(card, '取景').characters = '裁切 0,0,400,400'
  }
  await b.check()
  assert.ok(b.errors.some(e => e.rule === 'source.repeated-image' && e.nodeId === c.id))
})

test('requires an actual separate comparison item, its observation, its decision and a reason', async () => {
  const b = board(), [a,c] = b.sources
  for (const key of ['来源','本稿取舍','取舍理由']) b.field(c, key).characters = '待定'
  b.field(c, '画面观察').characters = b.field(a, '画面观察').characters
  b.field(c, '比较位置').characters = 'A'
  await b.check()
  for (const key of ['source.pair','source.coverage','source.provenance','source.decision','source.rationale','source.repeated-observation']) assert.ok(b.errors.some(e => e.rule === key), key)
})

test('a linked original alone, broken bitmap, and invisible paint all fail at the affected card', async () => {
  const b = board()
  b.field(b.sources[0], '参考图').visible = false
  b.field(b.sources[1], '参考图').fills[0].imageHash = 'absent'
  b.field(b.sources[2], '参考图').fills[0].opacity = 0
  await b.check()
  assert.deepEqual(b.errors.filter(e => e.rule === 'source.reference-image').map(e => e.nodeId), b.sources.slice(0,3).map(c => c.id))
})

test('rejects placeholder or circular source URLs and unresolved originals', async () => {
  const b = board()
  const links = [{type:'URL', value:'https://example.org/reference.png'}, {type:'NODE', value:b.field(b.sources[1], '参考图').id}, {type:'NODE',value:'stale'}]
  for (const [i, link] of links.entries()) b.field(b.sources[i], '来源').hyperlink = link
  await b.check()
  assert.deepEqual(b.errors.filter(e => e.rule === 'source.original').map(e => e.nodeId), b.sources.slice(0,3).map(c => c.id))
})

test('wrong numeric dimensions, fake crop descriptions, and cropping caused by FILL fail at the affected image', async () => {
  const b = board()
  b.field(b.sources[0], '原图尺寸').characters = '600×400'
  b.field(b.sources[1], '取景').characters = '裁切 100,100,900,300'
  b.field(b.sources[2], '取景').characters = '裁切 4,4,500,300'
  const img = b.field(b.sources[3], '参考图')
  img.fills[0].scaleMode = 'FILL'
  img.width = 200
  await b.check()
  for (const [i,rule] of ['source.image-size','source.framing','source.image-view','source.image-view'].entries()) assert.ok(b.errors.some(e => e.rule === rule && e.nodeId === b.sources[i].id))
})
