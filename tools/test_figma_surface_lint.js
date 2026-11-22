const test = require('node:test')
const assert = require('node:assert/strict')
const {checkSurfaceQuality} = require('./figma_surface_lint.js')

function solid(hex, opacity = 1) {
  const [r, g, b] = hex.match(/../g).map(channel => Number.parseInt(channel, 16) / 255)
  return {type: 'SOLID', color: {r, g, b}, opacity}
}
function design(base = 'ffffff') {
  let sequence = 0
  function layer(parent, name, x, y, width, height, fills = [], props = {}) {
    const n = {id: String(++sequence), name, parent, absoluteBoundingBox: {x, y, width, height},
      type: 'RECTANGLE', children: [], fills, strokes: [], ...props}
    if (parent) parent.children.push(n)
    return n
  }
  const screen = layer(null, '画面', 0, 0, 1000, 640, [solid(base)], {type: 'FRAME', clipsContent: true})
  const rect = (name, x, y, w, h, fill, props) => layer(screen, name, x, y, w, h, [fill], props)
  function check() {
    const errors = []
    function descendants(n) {
      return n.children.filter(c => c.visible !== false && c.opacity !== 0).flatMap(c => {
        const b = c.absoluteBoundingBox
        return [...(b.width && b.height ? [c] : []), ...descendants(c)]
      })
    }
    const summary = checkSurfaceQuality(screen, descendants, (rule, node, message) => errors.push({rule, node, message}))
    return {errors, ...summary}
  }
  return {screen, layer, rect, check}
}

test('flags the previous warm sidebar even when the rest of the screen is white', () => {
  const d = design(), bad = d.rect('侧栏', 0, 0, 172, 640, solid('f0efea'))
  const {errors} = d.check()
  assert.deepEqual(errors.map(e => [e.rule, e.node]), [['surface.neutral', bad]])
  assert.match(errors[0].message, /#F0EFEA/)
})

test('looks at exposed fills and composes stacked paint, sibling backings and group opacity', () => {
  const d = design('321334')
  d.rect('覆盖旧底', 0, 0, 1000, 640, solid('ffffff'))
  const g = d.layer(d.screen, '面板组', 0, 0, 360, 640, [solid('ffffff')], {type: 'FRAME', opacity: 0.5})
  const pane = d.layer(g, '双重填充', 0, 0, 360, 640, [solid('ff0000'), solid('ffff00', 0.5)])
  const {errors} = d.check()
  assert.deepEqual(errors.map(e => e.node), [pane])
  assert.match(errors[0].message, /#FFBF80/)
  g.opacity = 0.01
  assert.deepEqual(d.check().errors, [])
})

test('accepts near-white, dark gray and small focus or semantic states in either appearance', () => {
  for (const base of ['ffffff', 'fafafa', '1f2022', '000000']) {
    const d = design(base)
    d.rect('窄侧栏', 0, 0, 64, 640, solid('27282c'))
    d.rect('通过', 200, 100, 96, 30, solid('22963d'))
    d.rect('selected row', 200, 200, 760, 44, solid('2255cc'))
    d.rect('focus ring', 100, 350, 700, 2, solid('0864da'))
    assert.deepEqual(d.check().errors, [])
  }
  const d = design()
  const bad = d.rect('主阅读面板', 0, 0, 350, 640, solid('999999'))
  assert.deepEqual(d.check().errors.map(e => e.node), [bad])
})

test('excludes image paints and illustration contents, but evaluates overlying opaque UI', () => {
  const d = design('3e454c')
  d.rect('扫描件', 0, 0, 1000, 640, {type: 'IMAGE', imageHash: '1234'})
  const drawing = d.layer(d.screen, 'Illustration', 0, 0, 350, 640, [], {type: 'GROUP'})
  d.layer(drawing, '平面图形', 0, 0, 350, 640, [solid('a2c740')])
  const pane = d.rect('浮层', 400, 0, 350, 640, solid('f0efea'))
  assert.deepEqual(d.check().errors.map(e => e.node), [pane])
})

test('sends translucent dark glass and unmeasured gradients to export review, opaque warm glass still fails', () => {
  const d = design('1f2022')
  const glass = {effects: [{type: 'GLASS', visible: true}]}
  const material = d.rect('阅读材质', 0, 0, 300, 640, solid('10171f', 0.68), glass)
  const gradient = d.rect('过渡底层', 300, 0, 300, 640, {type: 'GRADIENT_LINEAR'})
  const warm = d.rect('Liquid Glass', 600, 0, 400, 640, solid('f0efea'), glass)
  const result = d.check()
  assert.deepEqual(result.errors.map(e => e.node), [warm])
  assert.ok([material, gradient].every(n => result.manualReview.some(line => line.startsWith(n.id + ' '))))
})

test('clipping limits broad fills and hides lines with unknown or hidden backing', () => {
  const d = design()
  const clip = d.layer(d.screen, '裁切', 0, 0, 120, 36, [], {clipsContent: true, type: 'FRAME'})
  d.layer(clip, '装饰', 10, 0, 900, 640, [solid('ff0000')])
  d.layer(clip, '画面外的线', 10, 50, 800, 1, [solid('000000')])
  d.rect('透明线', 100, 80, 800, 2, solid('000000'), {opacity: 0})
  d.rect('旧背景', 400, 100, 400, 400, solid('902501'), {visible: false})
  assert.deepEqual(d.check().errors, [])
})

test('weighs horizontal and vertical native lines, pane strokes and their rendered contrast', () => {
  const d = design('1f2022')
  const faint = d.rect('淡色线', 100, 60, 750, 1, solid('ffffff', 0.09))
  const strong = d.layer(d.screen, '原生横线', 100, 100, 760, 0, [], {type: 'LINE', strokeWeight: 1, strokes: [solid('ffffff')]})
  const tall = d.rect('纵向分隔', 125, 120, 3, 450, solid('ffffff', 0.28))
  const pane = d.rect('分区', 620, 150, 350, 400, solid('27282c'), {strokeWeight: Symbol('mixed'),
    strokeLeftWeight: 3, strokeRightWeight: 0, strokeTopWeight: 0, strokeBottomWeight: 0, strokes: [solid('ffffff', 0.35)]})
  const result = d.check()
  assert.ok(result.separators >= 4)
  assert.deepEqual(result.errors.map(e => [e.rule, e.node]), [strong, tall, pane].map(n => ['separator.weight', n]))
  faint.fills = [solid('dddddd')]
  faint.opacity = 0.01
  assert.equal(d.check().errors.length, 3)
})

function rows(d, xs, name, hasHeader = false) {
  const group = d.layer(d.screen, name, 20, 20, 940, 450, [], {type: 'FRAME'})
  for (let i = 0; i < 5; i++) {
    d.layer(group, '横线 ' + i, 40, 80 + i * 54, 880, 1, [solid('dddddd')])
    for (const x of xs) {
      d.layer(group, '名称', x, 92 + i * 54, 84, 20, [solid('121212')], {type: 'TEXT', characters: '字段'})
      if (hasHeader && !i) d.layer(group, '表头', x, 48, 84, 20, [solid('121212')], {type: 'TEXT', characters: '表头'})
    }
  }
}

test('reports aligned open lines enclosing short fields and keeps usable table rules', () => {
  const d = design()
  rows(d, [60, 250], '说明字段')
  assert.deepEqual(d.check().errors.map(e => e.rule), ['separator.repeat'])
  for (const [xs, name, header] of [
    [[60, 420, 790], '对比数据'], [[60, 250], '来源表格'], [[60, 250], '库存', true],
  ]) {
    const t = design()
    rows(t, xs, name, header)
    assert.deepEqual(t.check().errors, [])
  }
})

test('points to a rail divider already preceded by 90 px of whitespace and keeps compact navigation untouched', () => {
  for (const last of [450, 370]) {
    const d = design()
    const rail = d.layer(d.screen, '档案与审校队列', 0, 0, 214, 640, [solid('f5f5f5')], {type: 'FRAME'})
    for (const [i, y] of [100, 240, last].entries()) {
      d.layer(rail, '分隔线 ' + i, 18, y, 178, 1, [solid('d3d6d0')])
    }
    for (const y of [65, 116, 210, 258, 342, last + 22]) {
      d.layer(rail, '标题', 18, y, 64, 18, [solid('121212')], {type: 'TEXT', characters: '标题'})
    }
    const result = d.check()
    assert.deepEqual(result.errors, [])
    if (last === 450) {
      assert.equal(result.manualReview.length, 1)
      assert.match(result.manualReview[0], /3 条横线.*178 px.*90、21 px/)
    } else assert.deepEqual(result.manualReview, [])
  }
})
