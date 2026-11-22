const test = require('node:test')
const assert = require('node:assert/strict')
const {checkSpecDepth} = require('./figma_spec_depth.js')

const colors = {背景: '#FFFFFF', 正文: '#202124', 次文字: '#65686C', 主操作: '#26272B',
  选中: '#ECEEF0', 警示: '#A23830', 通过: '#34674B', 分割线: '#E3E4E5'}

function solid(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255)
  return {type: 'SOLID', color: {r, g, b}, opacity: 1, visible: true}
}

function fixture() {
  let serial = 0
  const cards = new Map()
  const errors = []
  function node(parent, type, name, width, height, extra = {}) {
    const n = {id: `1:${++serial}`, type, name, parent, width, height, x: 0, y: 0,
      visible: true, opacity: 1, children: [], fills: [], strokes: [], effects: [],
      get absoluteBoundingBox() {
        const box = this.parent && this.parent.absoluteBoundingBox
        return {x: (box ? box.x : 0) + this.x, y: (box ? box.y : 0) + this.y,
          width: this.width, height: this.height}
      },
      get relativeTransform() { return [[1, 0, this.x], [0, 1, this.y]] },
      ...extra}
    if (parent) parent.children.push(n)
    return n
  }
  function copyTree(source, parent, name = source.name) {
    const {id, children, parent: oldParent, absoluteBoundingBox, relativeTransform, ...props} = source
    const copy = node(parent, source.type, name, source.width, source.height, {...props, name})
    for (const child of children) copyTree(child, copy)
    return copy
  }
  function text(parent, name, characters, extra = {}) {
    return node(parent, 'TEXT', name, 220, 24, {characters, fontName: {family: 'Inter', style: 'Regular'},
      fontSize: 14, lineHeight: {unit: 'PIXELS', value: 20}, fills: [solid(colors.正文)], ...extra})
  }
  function link(parent, target) {
    return text(parent, '成稿位置', '查看出库校对窗口中的位置', {hyperlink: {type: 'NODE', value: target.id}})
  }
  function reference(card, measurement) {
    text(card, '来源', `Linear 原件的实测值为 ${measurement}`, {hyperlink: {type: 'URL',
      value: 'https://linear.app/now/how-we-redesigned-the-linear-ui'}})
    text(card, '取舍', '保留原件的阅读层级, 便于仓管员区分发货清单与待确认的箱数')
  }
  const page = node(null, 'PAGE', '仓库发货校对', 0, 0)
  const library = node(page, 'SECTION', '组件与规范', 1800, 3800)
  const screen = node(page, 'FRAME', '发货校对', 1440, 900, {fills: [solid(colors.背景)]})
  function card(name) {
    const n = node(library, 'FRAME', name, 520, 210)
    cards.set(name, n)
    return n
  }
  const navigation = node(screen, 'FRAME', '发货队列', 232, 900, {fills: [solid('#F7F7F7')]})
  const reading = node(screen, 'FRAME', '发货单详情', 800, 900, {fills: [solid(colors.背景)],
    x: 232, paddingLeft: 24, paddingRight: 24, paddingTop: 24, paddingBottom: 24,
    itemSpacing: 12, layoutMode: 'VERTICAL'})
  node(reading, 'RECTANGLE', '发货清单表头下边界', 752, 1, {fills: [solid(colors.分割线)]})
  const title = [
    ['标题', '出库前校对', 'Semibold', 30, 38], ['分组', '发货单与仓库记录', 'Semibold', 20, 28],
    ['正文', '仓库记录为八箱', 'Regular', 15, 22], ['操作', '确认出库', 'Medium', 14, 20],
    ['元数据', 'SG-1042', 'Regular', 12, 16],
  ]
  for (const [role, content, style, size, height] of title) {
    const c = card('字阶/' + role)
    const props = {fontName: {family: 'Inter', style}, fontSize: size,
      lineHeight: {unit: 'PIXELS', value: height}}
    text(c, '字样', content, props)
    text(c, '参数', `Inter · ${style} · ${size}/${height} px`)
    text(reading, content, content, props)
  }
  reference(cards.get('字阶/正文'), '14/20 px')
  for (const [role, hex] of Object.entries(colors)) {
    const c = card('色彩/' + role)
    node(c, 'RECTANGLE', '色样', 26, 26, {fills: [solid(hex)]})
    text(c, '参数', role + ' ' + hex)
  }
  reference(cards.get('色彩/背景'), '#FFFFFF')
  const focus = node(reading, 'FRAME', '聚焦的追问字段', 300, 36, {cornerRadius: 8, strokeWeight: 2,
    strokes: [solid('#626EA2')], fills: [solid(colors.背景)]})
  const icon = node(focus, 'VECTOR', '放大镜', 16, 16, {strokes: [solid(colors.次文字)], strokeWeight: 1.5})
  const row = node(navigation, 'FRAME', '出库单标题行', 232, 44, {fills: [solid(colors.选中)]})
  const measurements = [
    ['画板', screen, '1440 × 900 px'], ['导航', navigation, '232 × 900 px'],
    ['阅读区', reading, '800 × 900 px'], ['行高', row, '44 px'], ['控件', focus, '300 × 36 px'],
    ['图标', icon, '16 × 16 px'], ['内距', reading, '24 px'], ['组距', reading, '12 px'],
    ['圆角', focus, '8 px'], ['焦点', focus, '2 px'],
  ]
  for (const [role, target, value] of measurements) {
    const c = card('几何/' + role)
    text(c, '参数', role + ' ' + value)
    link(c, target)
  }
  reference(cards.get('几何/图标'), '16 × 16 px')
  const surface = card('表面/层级')
  node(surface, 'RECTANGLE', '底面', 150, 40, {fills: navigation.fills})
  node(surface, 'RECTANGLE', '内容面', 150, 40, {fills: reading.fills})
  text(surface, '说明', '窗口使用浅灰底面, 出库单正文在白色阅读面, 表头下方用 1 px 分隔线, 同组记录用 12 px 组距')
  const data = [
    ['导航', 'SG-1042 当前出库单', 'SG-1067 待选出库单'], ['证据', '订单 SG-1042 载明 8 箱'],
    ['运行', '仓库条码已扫描', '条码校验失败'], ['决定', '确认发出 8 箱', '暂缓到货确认'],
    ['复查', '八箱货物均已签收'], ['工具', '检索物流记录'],
  ]
  const placed = {}
  const examples = {}
  const variants = {}
  function instance(parent, master) {
    const n = node(parent, 'INSTANCE', master.name, master.width, master.height, {
      mainComponent: master, getMainComponentAsync: async () => master,
      fills: master.fills, variantProperties: master.variantProperties})
    text(n, '标签', master.children[0].characters)
    return n
  }
  for (const [role, label, second] of data) {
    const family = node(library, 'COMPONENT_SET', role + '组件', 410, 44)
    function variant(state, hex, label) {
      const master = node(family, 'COMPONENT', '状态=' + state, 180, 36,
        {variantProperties: {状态: state}, fills: [solid(hex)]})
      text(master, '标签', label)
      return master
    }
    const first = variant('默认', colors.选中, label)
    const c = card('样件/' + role)
    placed[role] = instance(role === '导航' ? navigation : reading, first)
    examples[role] = instance(c, first)
    link(c, placed[role])
    text(c, '说明', second ? `默认状态显示“${label}”, 切换后显示“${second}”, 与当前出库单关联` :
      `在出库单校对时显示“${label}”, 给仓库人员核实发货对象`)
    if (second) {
      const next = variant('异常', colors.警示, second)
      variants[role] = instance(c, next)
    }
  }
  for (const [name, role, caption] of [
    ['原始记录', '证据', '订单 SG-1042 载明 8 箱, 清点人员核实装车数'],
    ['签收结果', '复查', 'SG-1042 的 8 个箱码均已签收, 可关闭本次审阅'],
  ]) {
    const c = card('情境/' + name)
    instance(c, placed[role].mainComponent)
    text(c, '说明', caption)
    link(c, placed[role])
  }
  function addGlass() {
    const blur = {type: 'BACKGROUND_BLUR', visible: true, radius: 8}
    navigation.effects = [blur]
    const c = card('材质/对照')
    node(c, 'RECTANGLE', '基准', 128, 72, {fills: navigation.fills})
    node(c, 'RECTANGLE', '实验', 128, 72, {fills: navigation.fills, effects: [blur]})
    text(c, '说明', '同一张网格图中, 基准背景模糊 0 px, 实验背景模糊 8 px, 栏后竖线轮廓变软而正文仍可读')
    return c
  }
  const descendants = n => n.children.filter(child => child.visible !== false && child.opacity !== 0)
    .flatMap(child => [child, ...descendants(child)])
  async function run() {
    errors.length = 0
    await checkSpecDepth({library, screens: [screen], descendants,
      textContent: n => n.type === 'TEXT' && !n.hasMissingFont ? n.characters.trim() : '',
      links: nodes => nodes.filter(n => n.type === 'TEXT' && n.hyperlink && n.characters.trim())
        .map(n => ({node: n, link: n.hyperlink})),
      familyOfInstance: async n => n.mainComponent?.parent?.id,
      issue: (rule, node, message) => errors.push({rule, nodeId: node.id, message})})
    return errors
  }
  return {node, copyTree, text, card, link, cards, run, library, screen, addGlass, placed, examples, variants}
}

const named = (parent, name) => parent.children.find(child => child.name === name)
async function rejects(d, prefix) {
  const errors = await d.run()
  assert.ok(errors.some(error => error.rule.startsWith(prefix)), `Expected ${prefix}\n${JSON.stringify(errors, null, 2)}`)
}

test('flat surfaces with measured specifications, linked native instances and two product contexts pass', async () => {
  assert.deepEqual(await fixture().run(), [])
})

test('a sheet of headings or copies of the complete screen cannot replace measured samples', async () => {
  const d = fixture()
  d.library.children.length = 0
  d.text(d.library, '说明', '字阶/正文 14/20 px 颜色 #FFFFFF 组距 8 px 样件/导航 状态/完成')
  for (let i = 0; i < 40; i++) {
    d.copyTree(d.screen, d.library, '屏幕 ' + i)
  }
  const errors = await d.run()
  for (const rule of ['spec.typography', 'spec.palette', 'spec.geometry', 'spec.specimen', 'spec.context']) {
    assert.ok(errors.some(e => e.rule.startsWith(rule)), rule)
  }
})

test('actual font properties, swatch paint and measured target geometry must agree with the annotations', async () => {
  for (const [group, role, sample, edit, prefix] of [
    ['字阶', '正文', '字样', n => { n.fontSize = 44 }, 'spec.typography'],
    ['字阶', '正文', '字样', n => { n.lineHeight = {unit: 'PIXELS', value: 47} }, 'spec.typography'],
    ['字阶', '正文', '字样', n => { n.fontName = {family: 'Georgia', style: 'Bold'} }, 'spec.typography'],
    ['色彩', '警示', '色样', n => { n.fills = [solid('#000000')] }, 'spec.palette'],
    ['几何', '图标', '参数', n => { n.characters = '图标 51 × 51 px' }, 'spec.geometry'],
    ['几何', '内距', '参数', n => { n.characters = '内距 82 px' }, 'spec.geometry'],
    ['几何', '内距', '参数', n => { n.characters = '内距 24 pt' }, 'spec.geometry'],
    ['几何', '焦点', '成稿位置', n => { n.hyperlink = null }, 'spec.geometry'],
  ]) {
    const d = fixture()
    edit(named(d.cards.get(group + '/' + role), sample))
    await rejects(d, prefix)
  }
  const d = fixture()
  named(named(d.screen, '发货单详情'), '确认出库').fontName = {family: 'Georgia', style: 'Bold'}
  await rejects(d, 'spec.typography')
})

test('a named inspector, toolbar or input in the release needs measurements for that actual region', async () => {
  for (const role of ['检查栏', '工具栏', '输入']) {
    const d = fixture()
    const target = d.node(d.screen, 'FRAME', '区域/' + role, 320, 700,
      {layoutMode: 'VERTICAL', paddingLeft: 20, paddingRight: 20, paddingTop: 20, paddingBottom: 20})
    await rejects(d, 'spec.geometry.landmark')
    const c = d.card('几何/' + role)
    const parameter = d.text(c, '参数', '320 × 700 px · 内距 20 px')
    d.link(c, target)
    assert.deepEqual(await d.run(), [])
    parameter.characters = '320 × 700 px · 内距 40 px'
    await rejects(d, 'spec.geometry.landmark')
  }
})

test('broken source or missing adoption decision fails the relevant foundation group', async () => {
  for (const edit of [
    c => { named(c, '来源').hyperlink = null },
    c => { named(c, '取舍').characters = '' },
  ]) {
    const d = fixture()
    edit(d.cards.get('几何/图标'))
    await rejects(d, 'spec.provenance')
  }
})

test('a screenshot, a resized specimen or a link to another component family fails the 1:1 check', async () => {
  for (const edit of [
    d => { d.examples.证据.type = 'RECTANGLE' },
    d => { d.examples.证据.width /= 2 },
    d => { named(d.cards.get('样件/证据'), '成稿位置').hyperlink.value = d.placed.决定.id },
  ]) {
    const d = fixture()
    edit(d)
    await rejects(d, 'spec.specimen')
  }
})

test('every base surface needs a native swatch, a match in the actual screen, and a separation note', async () => {
  for (const edit of [
    c => { named(c, '内容面').visible = false },
    c => { named(c, '底面').fills = [solid('#C2029D')] },
    c => { named(c, '底面').opacity = 0.5 },
    c => { named(c, '说明').characters = '' },
  ]) {
    const d = fixture()
    edit(d.cards.get('表面/层级'))
    await rejects(d, 'spec.surface')
  }
})

test('a differently named state with identical native appearance does not count', async () => {
  const d = fixture()
  const original = d.examples.运行
  const duplicate = d.variants.运行
  duplicate.name = '名义上的失败'
  duplicate.mainComponent = original.mainComponent
  duplicate.getMainComponentAsync = original.getMainComponentAsync
  duplicate.fills = original.fills
  duplicate.children[0].characters = original.children[0].characters
  await rejects(d, 'spec.states')
})

test('a second copy of one product context cannot demonstrate the other context', async () => {
  const d = fixture()
  const first = d.cards.get('情境/原始记录')
  d.library.children = d.library.children.filter(n => n !== d.cards.get('情境/签收结果'))
  d.copyTree(first, d.library, '情境/签收结果')
  await rejects(d, 'spec.context')
})

test('internally consistent swatches and typography still need matching usage in the release', async () => {
  const d = fixture()
  const body = d.cards.get('字阶/正文')
  named(body, '字样').fontName = {family: 'Georgia', style: 'Regular'}
  named(body, '参数').characters = 'Georgia Regular 15/22 px'
  await rejects(d, 'spec.typography')
  for (const role of ['背景', '正文']) {
    const example = fixture()
    const card = example.cards.get('色彩/' + role)
    named(card, '色样').fills = [solid('#C18CB6')]
    named(card, '参数').characters = '#C18CB6'
    await rejects(example, 'spec.palette')
  }
})

test('a surface using background blur requires a measured control and comparison', async () => {
  const d = fixture()
  const comparison = d.addGlass()
  assert.deepEqual(await d.run(), [])
  const trial = named(comparison, '实验')
  const baseline = named(comparison, '基准')
  trial.width += 32
  await rejects(d, 'spec.material')
  trial.width = baseline.width
  trial.opacity = 0.5
  await rejects(d, 'spec.material')
  trial.opacity = baseline.opacity
  trial.effects = baseline.effects
  await rejects(d, 'spec.material')
  comparison.visible = false
  await rejects(d, 'spec.material')
})
