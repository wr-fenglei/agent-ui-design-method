const test = require('node:test')
const assert = require('node:assert/strict')
const {checkDesignPage} = require('./check_design_page.js')

const sourceUrl = 'https://support.apple.com/guide/notes/welcome/mac'
const imageHash = '49d950f98beaf6c054cc8af157cc403d27b62405'
const paint = (r, g, b) => ({type: 'SOLID', color: {r, g, b}, visible: true, opacity: 1})
const ink = paint(0x12 / 255, 0x23 / 255, 0x34 / 255)
const paper = paint(1, 1, 1)

// Local coordinates mirror the Plugin API. Absolute coordinates depend on the current parent,
// so nested instance text, sibling screen origins and clips can be tested independently.
function designFile() {
  const byId = new Map()
  function layer(type, name, parent, x, y, width, height, props = {}) {
    const n = {id: `1:${byId.size + 1}`, type, name, parent, x, y, width, height,
      visible: true, opacity: 1, fills: [], strokes: [], effects: [], reactions: [],
      children: [], clipsContent: type === 'FRAME', ...props,
      get absoluteBoundingBox() {
        const p = this.parent && this.parent.absoluteBoundingBox
        return {x: this.x + (p ? p.x : 0), y: this.y + (p ? p.y : 0), width: this.width, height: this.height}
      },
      get absoluteRenderBounds() { return this.absoluteBoundingBox },
      findAll(predicate) { return this.children.flatMap(c => [...(predicate(c) ? [c] : []), ...c.findAll(predicate)]) },
    }
    if (parent) parent.children.push(n)
    byId.set(n.id, n)
    return n
  }
  function label(parent, characters, x, y, width = 320, hyperlink = null) {
    return layer('TEXT', characters, parent, x, y, width, 24, {characters, hyperlink, fills: [ink],
      fontSize: 16, fontWeight: 400, lineHeight: {unit: 'PIXELS', value: 24},
      fontName: {family: 'Inter', style: 'Regular'},
      getStyledTextSegments() {
        return [{start: 0, end: this.characters.length, characters: this.characters,
          hyperlink: this.hyperlink, fontSize: this.fontSize, fills: this.fills}]
      },
    })
  }
  function instance(parent, main, x, y) {
    const n = layer('INSTANCE', '确认决定', parent, x, y, main.width, main.height,
      {fills: main.fills, mainComponent: main, getMainComponentAsync: async () => main})
    label(n, main.children[0].characters, 8, 8, 96)
    return n
  }
  function navigate(button, target) {
    button.reactions = [{trigger: {type: 'ON_CLICK'}, actions: [
      {type: 'NODE', navigation: 'NAVIGATE', destinationId: target.id, transition: null},
    ]}]
  }

  const root = layer('DOCUMENT', '订单调查', null, 0, 0, 0, 0)
  const page = layer('PAGE', '提交前校对', root, 0, 0, 0, 0, {loadAsync: async () => {}})
  const tasks = layer('SECTION', '功能与任务', page, 0, 0, 520, 360)
  const refs = layer('FRAME', '参考实物', page, 600, 0, 520, 420)
  const spec = layer('SECTION', '组件与规范', page, 1200, 0, 520, 420)
  const finals = layer('SECTION', '成稿', page, 1800, 0, 1680, 620)

  const specText = label(spec, '正文 16 px, 行高 24 px, 组距 8 px, 正文色 #122334', 12, 12, 480)
  const family = layer('COMPONENT_SET', '校对操作', spec, 12, 56, 296, 72)
  function variant(state, x, color, title) {
    const n = layer('COMPONENT', `State=${state}`, family, x, 8, 112, 40,
      {variantProperties: {State: state}, fills: [color]})
    label(n, title, 8, 8, 96)
    return n
  }
  const normal = variant('Default', 8, paper, '确认发货')
  const selected = variant('Selected', 144, paint(0.8, 0.92, 1), '重新校对')
  const task = layer('FRAME', '校对出库信息', tasks, 8, 8, 480, 152)
  const taskText = label(task, '仓库人员对照订单编号, 确认本批货物已发出', 8, 8, 448)
  const taskButton = instance(task, normal, 8, 48)
  const source = layer('GROUP', 'Apple Notes 工具栏', refs, 12, 12, 480, 365)
  const capture = layer('RECTANGLE', 'Notes 原始工具栏截图', source, 8, 8, 448, 200,
    {fills: [{type: 'IMAGE', imageHash, scaleMode: 'FIT', visible: true, opacity: 1}]})
  const rationale = label(source, '沿用工具栏的操作分组, 把两次确认安排在同一处', 8, 228, 440)
  const sourceLink = label(source, 'Apple Notes 使用手册', 8, 276, 240, {type: 'URL', value: sourceUrl})

  function screen(name, x, title, detail, master) {
    const n = layer('FRAME', name, finals, x, 16, 800, 560, {fills: [paper]})
    const heading = label(n, title, 32, 32, 450)
    const data = label(n, detail, 32, 72, 640)
    const button = instance(n, master, 32, 132)
    return {n, heading, data, button}
  }
  const entry = screen('待校对', 16, '订单 SG-1042 等待校对', '发货单记录 8 箱, 订单记录 8 箱', normal)
  const result = screen('已确认', 848, '订单 SG-1042 已确认发货', '本次交接已记录 8 箱', selected)
  navigate(entry.button, result.n)
  navigate(result.button, entry.n)
  page.flowStartingPoints = [{nodeId: entry.n.id, name: '校对并提交'}]
  const api = {root, currentPage: page, fileKey: 'Abc123',
    getNodeByIdAsync: async id => byId.get(id) || null,
    getImageByHash: hash => hash === imageHash ? {getSizeAsync: async () => ({width: 1200, height: 600})} : null}
  return {api, page, tasks, task, taskText, taskButton, refs, source, capture, rationale,
    sourceLink, spec, specText, family, normal, selected, finals, entry, result, layer, label}
}

async function errorsAt(d, nodes) {
  const {errors} = await checkDesignPage(d.api, {mode: 'workflow'})
  assert.ok(errors.every(e => e.rule && e.nodeId && e.nodeName && e.message))
  assert.ok(errors.some(e => nodes.some(n => e.nodeId === n.id)), JSON.stringify(errors, null, 2))
}

test('reads the active page and returns the clickable source URL', async () => {
  const d = designFile()
  const report = await checkDesignPage(d.api, {mode: 'workflow'})
  assert.deepEqual(report.errors, [])
  assert.equal(report.page.id, d.page.id)
  assert.ok(report.sources.some(s => s.url === sourceUrl && s.nodeName && s.nodeId))
})

test('selects a non-active page by exact name or node id', async () => {
  const d = designFile()
  const active = d.layer('PAGE', '个人草稿', d.api.root, 0, 0, 0, 0, {loadAsync: async () => {}})
  d.api.currentPage = active
  for (const page of [d.page.name, d.page.id]) {
    const report = await checkDesignPage(d.api, {page, mode: 'workflow'})
    assert.equal(report.page.id, d.page.id)
    assert.equal(d.api.currentPage, active)
    assert.deepEqual(report.errors, [])
  }
})

test('a task may link directly to its actual component instead of including an instance', async () => {
  const d = designFile()
  d.task.children = [d.taskText]
  d.label(d.task, '确认发货控件', 8, 48, 120, {type: 'NODE', value: d.normal.id})
  assert.deepEqual((await checkDesignPage(d.api, {mode: 'workflow'})).errors, [])
})

test('an unrelated internal node cannot serve as the task component', async () => {
  const d = designFile()
  d.task.children = [d.taskText]
  d.label(d.task, '确认发货控件', 8, 48, 120, {type: 'NODE', value: d.capture.id})
  await errorsAt(d, [d.task, d.tasks])
})

test('each source card needs its own visible screenshot, rationale and clickable link', async () => {
  for (const change of [
    d => { d.capture.fills = [paper] },
    d => { d.capture.fills[0].imageHash = 'no-longer-in-this-file' },
    d => { d.capture.visible = false },
    d => { d.rationale.characters = '' },
    d => { d.sourceLink.hyperlink = null; d.sourceLink.characters = sourceUrl },
  ]) {
    const d = designFile()
    change(d)
    await errorsAt(d, [d.source, d.capture, d.sourceLink, d.rationale])
  }
})

test('a filled reference card does not supply evidence for an empty second reference', async () => {
  const d = designFile()
  const empty = d.layer('FRAME', '仓库手持终端', d.refs, 0, 0, 240, 100)
  d.label(empty, '手持终端的扫码结果也采用上下两行', 4, 4, 230)
  await errorsAt(d, [empty])
})

test('section names alone do not document typography, spacing or color values', async () => {
  const d = designFile()
  d.specText.characters = '字号, 间距, 颜色'
  await errorsAt(d, [d.spec, d.specText])
})

test('renaming an identical variant does not demonstrate a visual state', async () => {
  const d = designFile()
  d.selected.fills = d.normal.fills
  d.selected.children[0].characters = d.normal.children[0].characters
  await errorsAt(d, [d.family, d.selected, d.spec])
})

test('detached drawings in full screens are not instances of the specified component', async () => {
  const d = designFile()
  d.entry.button.type = d.result.button.type = 'FRAME'
  await errorsAt(d, [d.entry.n, d.result.n, d.task, d.finals])
})

test('a blank full screen cannot provide evidence for a completed task', async () => {
  const d = designFile()
  d.result.n.children = []
  await errorsAt(d, [d.result.n])
})

test('renaming an otherwise identical screen cannot demonstrate a changed result', async () => {
  const d = designFile()
  d.result.heading.characters = d.entry.heading.characters
  d.result.data.characters = d.entry.data.characters
  d.result.button.children[0].characters = d.entry.button.children[0].characters
  d.result.button.fills = d.entry.button.fills
  d.result.button.mainComponent = d.normal
  d.result.button.getMainComponentAsync = async () => d.normal
  await errorsAt(d, [d.result.n, d.entry.n, d.finals])
})

test('a completed task does not supply the component mapping for an unrelated task', async () => {
  const d = designFile()
  const extra = d.layer('GROUP', '撤回提交', d.tasks, 8, 180, 420, 128)
  d.label(extra, '仓库人员发现箱数有误时撤回发货决定', 8, 8, 398)
  await errorsAt(d, [extra])
})

test('a hidden reference image paint supplies no visible evidence', async () => {
  const d = designFile()
  d.capture.fills[0].visible = false
  await errorsAt(d, [d.source, d.capture])
})

test('refuses an unknown page name, a screen id, and an ambiguous page name', async () => {
  const d = designFile()
  for (const page of ['不存在的页面', d.entry.n.id]) {
    await assert.rejects(checkDesignPage(d.api, {page, mode: 'workflow'}), /找不到.*页面/)
  }
  d.layer('PAGE', d.page.name, d.api.root, 0, 0, 0, 0, {loadAsync: async () => {}})
  await assert.rejects(checkDesignPage(d.api, {page: d.page.name}), /同名.*ID/)
  assert.deepEqual((await checkDesignPage(d.api, {page: d.page.id, mode: 'workflow'})).errors, [])
})

test('a full screen with all content outside its clipped bounds is reported at the screen', async () => {
  const d = designFile()
  for (const child of d.result.n.children) child.x += d.result.n.width
  await errorsAt(d, [d.result.n])
})

test('a source link pointing back to the screenshot on the same card is not an original source', async () => {
  const d = designFile()
  d.sourceLink.hyperlink = {type: 'NODE', value: d.capture.id}
  await errorsAt(d, [d.sourceLink, d.source])
})

test('localization placeholders in real product copy are usable content', async () => {
  const d = designFile()
  d.taskText.characters = 'Locate the missing placeholder and confirm the corrected translation'
  d.entry.heading.characters = 'Missing placeholder {trip}'
  d.entry.data.characters = 'Placeholder mismatch'
  d.task.name = d.taskText.characters
  assert.deepEqual((await checkDesignPage(d.api, {mode: 'workflow'})).errors, [])
  d.taskText.characters = 'PLACEHOLDER'
  await errorsAt(d, [d.task])
})

function singleScreenFile() {
  const d = designFile()
  d.finals.children = [d.entry.n]
  d.entry.button.reactions = []
  d.page.flowStartingPoints = []
  const checklist = d.label(d.task, 'SG-1042\n发货单记录 8 箱\n确认发货', 8, 100, 320)
  checklist.name = '首屏核对'
  return {...d, checklist}
}

test('default report checks one screen, including task values nested in an instance', async () => {
  const d = singleScreenFile()
  const report = await checkDesignPage(d.api)
  assert.deepEqual(report.errors, [])
  assert.equal(report.mode, 'single-screen')
  assert.equal(report.prototype, undefined)
  assert.deepEqual(report.screens.map(n => n.id), [d.entry.n.id])
  assert.deepEqual(report.contentChecks, ['SG-1042', '发货单记录 8 箱', '确认发货'].map(value =>
    ({value, nodeId: d.checklist.id, found: true})))
})

test('drafts, research boards and full-size component specimens are independent of the release', async () => {
  const d = singleScreenFile()
  for (const name of ['研究板', '首稿与试排']) {
    const study = d.layer('SECTION', name, d.page, 0, 800, 1800, 700)
    d.layer('FRAME', '对照用的候选整屏', study, 0, 10, 800, 560)
    d.layer('FRAME', '第二个候选', study, 830, 10, 800, 560)
  }
  const samples = d.layer('FRAME', '原尺寸样件', d.page, 0, 1800, 540, 400)
  d.spec.children = [d.specText]
  samples.children.push(d.family)
  d.family.parent = samples
  assert.deepEqual((await checkDesignPage(d.api)).errors, [])
})

test('extra visible, hidden, clipped and wrapped release boards are reported at their nodes', async () => {
  for (const variant of ['visible', 'hidden', 'clipped', 'group']) {
    const d = singleScreenFile()
    const extra = d.layer(variant === 'group' ? 'GROUP' : 'FRAME', '采纳后', d.finals, 860, 10, 800, 560)
    if (variant === 'hidden') extra.visible = false
    if (variant === 'clipped') {
      d.finals.clipsContent = true
      extra.x = 2000
    }
    if (variant === 'group') d.layer('FRAME', '结果', extra, 0, 0, 800, 560)
    const {errors} = await checkDesignPage(d.api)
    assert.ok(errors.some(e => e.rule === 'scope.extra-board' && e.nodeId === extra.id), variant)
  }
})

test('a top-level frame outside assigned areas is reported, including a screen containing only an image', async () => {
  const d = singleScreenFile()
  const extra = d.layer('FRAME', '已发布', d.page, 3400, 0, 800, 560, {fills: d.capture.fills})
  assert.ok((await checkDesignPage(d.api)).errors.some(e => e.rule === 'scope.unassigned' && e.nodeId === extra.id))
})

test('requires a non-placeholder checklist independent of the task description', async () => {
  const d = singleScreenFile()
  d.checklist.characters = 'TODO\nSG-1042\nSG-1042'
  d.taskText.characters = ''
  const {errors} = await checkDesignPage(d.api)
  assert.ok(errors.some(e => e.rule === 'screen.evidence-list'))
  assert.ok(errors.some(e => e.rule === 'task.description' && e.nodeId === d.task.id))
})

test('unrelated records, offscreen text, partially clipped text and research copy cannot prove the evidence', async () => {
  for (const change of [
    d => { d.entry.data.characters = '新到货物 24 箱' },
    d => { d.entry.data.x = d.entry.n.width },
    d => { d.entry.data.x = d.entry.n.width - 10 },
    d => { d.entry.data.visible = false },
  ]) {
    const d = singleScreenFile()
    d.label(d.spec, '发货单记录 8 箱', 12, 200, 180)
    change(d)
    const report = await checkDesignPage(d.api)
    assert.deepEqual(report.contentChecks.filter(v => !v.found).map(v => v.value), ['发货单记录 8 箱'])
    assert.ok(report.errors.some(e => e.rule === 'screen.evidence' && e.nodeId === d.checklist.id))
  }
})

test('matches literal values with punctuation and preserves identifier boundaries', async () => {
  const d = singleScreenFile()
  d.checklist.characters = 'SG-104\n[状态 A+B]\n{trip}'
  d.entry.data.characters = '检查 [状态 A+B] 与 {trip}'
  const {contentChecks} = await checkDesignPage(d.api)
  assert.deepEqual(contentChecks.map(c => c.found), [false, true, true])
})

test('single-screen rules run for CLI-equivalent page selection, including overlays', async () => {
  const d = singleScreenFile()
  d.entry.button.reactions = [{trigger: {type: 'ON_CLICK'},
    actions: [{type: 'NODE', navigation: 'OVERLAY', destinationId: d.result.n.id}]}]
  const {errors} = await checkDesignPage(d.api, {page: d.page.id, mode: 'single-screen'})
  assert.ok(errors.some(e => e.rule === 'scope.overlay' && e.nodeId === d.entry.button.id))
})

test('workflow remains explicit and performs the original round-trip checks', async () => {
  const d = designFile()
  const workflow = await checkDesignPage(d.api, {mode: 'workflow'})
  assert.deepEqual(workflow.errors, [])
  assert.equal(workflow.mode, 'workflow')
  assert.deepEqual(new Set(workflow.prototype.roundTrips), new Set([d.entry.n.id, d.result.n.id]))
  assert.equal(workflow.contentChecks, undefined)
  assert.ok((await checkDesignPage(d.api)).errors.some(e => e.rule === 'scope.extra-board'))
  await assert.rejects(checkDesignPage(d.api, {mode: 'unknown'}), /未知/)
})
