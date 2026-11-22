const test = require('node:test')
const assert = require('node:assert/strict')
const {checkScreenScope} = require('./figma_screen_scope.js')

function design() {
  const viewport = {x: 70, y: 130, width: 900, height: 600}
  const screen = {type: 'FRAME', id: '2:1', name: '订单审阅', absoluteBoundingBox: viewport}
  const nodes = []
  const surface = opacity => [{type: 'SOLID', opacity}]
  function layer(type, name, box, parent = screen, extra = {}) {
    const node = {id: '2:' + (nodes.length + 2), type, name, parent, absoluteBoundingBox: box,
      fills: surface(1), ...extra}
    nodes.push(node)
    return node
  }
  function label(name, parent, box) { return layer('TEXT', name, box, parent, {characters: name}) }
  const textBox = {x: 380, y: 320, width: 140, height: 24}
  const panelBox = {x: 340, y: 290, width: 300, height: 220}
  const record = () => label('核对弹窗提示中的订单号', screen, textBox)
  const tint = (parent = screen) => layer('RECTANGLE', '层 21', viewport, parent, {fills: surface(0.32)})
  function panel(name = '层 22', parent = screen) {
    const form = layer('FRAME', name, panelBox, parent)
    label('采用此记录', form, textBox)
    return form
  }
  function issues() {
    const found = []
    checkScreenScope(screen, nodes, (rule, node) => found.push([rule, node.id]))
    return found
  }
  return {screen, record, tint, panel, layer, viewport, issues}
}

test('reports overlay and cross-screen actions, including nested conditional alternatives', () => {
  const d = design()
  const button = d.panel()
  const go = navigation => ({type: 'NODE', navigation, destinationId: '4:4'})
  button.reactions = [{trigger: {type: 'ON_CLICK'}, actions: [
    {type: 'CONDITIONAL', conditionalBlocks: [
      {actions: [go('NAVIGATE')]},
      {actions: [{type: 'CONDITIONAL', conditionalBlocks: [{actions: [go('OVERLAY')]}]}]},
    ]},
  ]}]
  d.screen.reactions = [{trigger: {type: 'AFTER_TIMEOUT'}, action: go('SWAP')}]
  assert.deepEqual(d.issues(), [['scope.navigation', d.screen.id], ['scope.navigation', button.id], ['scope.overlay', button.id]])
})

test('in-place scrolling, component variants, and self navigation keep the screen in view', () => {
  const d = design()
  const button = d.panel()
  button.reactions = [{trigger: {type: 'ON_CLICK'}, actions: [
    {type: 'NODE', navigation: 'SCROLL_TO', destinationId: button.id},
    {type: 'NODE', navigation: 'CHANGE_TO', destinationId: '80:40'},
    {type: 'NODE', navigation: 'NAVIGATE', destinationId: d.screen.id},
  ]}]
  assert.deepEqual(d.issues(), [])
})

test('detects an unnamed form over a painted scrim and existing product text', () => {
  const d = design()
  d.record()
  d.tint()
  const form = d.panel()
  assert.deepEqual(d.issues(), [['scope.overlay', form.id]])
})

test('detects a form inside a translucent full-screen wrapper', () => {
  const d = design()
  d.record()
  const wrap = d.layer('FRAME', '层 20', d.viewport, d.screen, {opacity: 0.8})
  const form = d.panel('复核', wrap)
  assert.deepEqual(d.issues(), [['scope.overlay', form.id]])
})

test('a named dialog that covers underlying text can be identified without a scrim', () => {
  const d = design()
  d.record()
  const form = d.panel('订单确认弹窗')
  assert.deepEqual(d.issues(), [['scope.overlay', form.id]])
})

test('background tints, inline cards and product text about popups do not create a modal', () => {
  const d = design()
  d.tint()
  d.record()
  d.panel('审阅面板')
  d.layer('FRAME', '导航', {x: 70, y: 130, width: 160, height: 600})
  assert.deepEqual(d.issues(), [])
})

test('a clipped local tint cannot act as a full-screen scrim', () => {
  const d = design()
  d.record()
  const rail = d.layer('FRAME', '侧栏', {x: 70, y: 130, width: 160, height: 600}, d.screen, {clipsContent: true})
  d.tint(rail)
  d.panel()
  assert.deepEqual(d.issues(), [])
})
