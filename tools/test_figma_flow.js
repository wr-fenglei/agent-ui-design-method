const assert = require('node:assert/strict')
const test = require('node:test')
const {checkFigmaFlow} = require('./figma_flow.js')

const frame = id => ({id, name: id, type: 'FRAME', children: [], width: 800, height: 600})
const go = (destinationId, navigation = 'NAVIGATE') => ({type: 'NODE', navigation, destinationId})
const back = {type: 'BACK'}
const close = {type: 'CLOSE'}
function button(screen, actions, trigger = {type: 'ON_CLICK'}) {
  const node = {id: screen.id + '-' + screen.children.length, type: 'INSTANCE', name: '控件',
    reactions: [{trigger, actions: Array.isArray(actions) ? actions : [actions]}]}
  screen.children.push(node)
  return node
}
function check(screens, flowStartingPoints = []) {
  const errors = []
  const result = checkFigmaFlow({name: '业务', flowStartingPoints}, screens,
    screen => screen.children.filter(n => n.visible !== false),
    (rule, node, message) => errors.push({rule, node: node.id, message}))
  return {...result, errors, rules: errors.map(e => e.rule)}
}

test('accepts branches, the designated starting point and actual backward history', () => {
  const home = frame('入口'), detail = frame('详情'), kept = frame('保留'), done = frame('完成')
  button(home, go(detail.id))
  button(detail, go(kept.id))
  button(detail, go(done.id))
  button(kept, back)
  button(detail, back)
  button(done, go(home.id))
  const result = check([kept, detail, home, done], [{nodeId: 'elsewhere'}, {nodeId: home.id}])
  assert.deepEqual(result.errors, [])
  assert.equal(result.startId, home.id)
  assert.deepEqual(new Set(result.roundTrips), new Set([home.id, detail.id, kept.id, done.id]))
})

test('names a one-way result and a disconnected screen', () => {
  const home = frame('入口'), done = frame('完成'), none = frame('孤立')
  button(home, go(done.id))
  const {errors} = check([home, done, none])
  assert.deepEqual(errors.map(e => [e.rule, e.node]), [
    ['prototype-return', done.id], ['prototype-reach', none.id]])
})

test('reports the actual control with a deleted or out-of-scope destination', () => {
  const home = frame('入口'), done = frame('完成')
  const removed = button(home, go(null))
  const outside = button(done, go('参考板'))
  button(home, go(done.id))
  button(done, go(home.id))
  const {errors} = check([home, done])
  assert.deepEqual(errors.map(e => [e.rule, e.node]), [
    ['prototype-target', removed.id], ['prototype-target', outside.id]])
  assert.match(errors[0].message, /丢失/)
})

test('only deliberate control navigation counts towards reaching another screen', () => {
  for (const kind of ['timed', 'media', 'none', 'hover', 'press', 'root', 'hidden', 'variant',
    'scroll', 'self', 'conditional', 'emptyKey']) {
    const home = frame('入口'), done = frame('完成')
    const target = go(kind === 'self' ? home.id : done.id)
    const node = button(home, target)
    const r = node.reactions[0]
    if (kind === 'timed') r.trigger.type = 'AFTER_TIMEOUT'
    if (kind === 'media') r.trigger.type = 'ON_MEDIA_END'
    if (kind === 'none') r.trigger = null
    if (kind === 'hover') r.trigger.type = 'ON_HOVER'
    if (kind === 'press') r.trigger.type = 'ON_PRESS'
    if (kind === 'root') home.reactions = home.children.pop().reactions
    if (kind === 'hidden') node.visible = false
    if (kind === 'variant') target.navigation = 'CHANGE_TO'
    if (kind === 'scroll') target.navigation = 'SCROLL_TO'
    if (kind === 'conditional') r.actions = [{type: 'CONDITIONAL', conditionalBlocks: [{actions: [target]}]}]
    if (kind === 'emptyKey') r.trigger = {type: 'ON_KEY_DOWN', keyCodes: []}
    button(done, go(home.id))
    assert.deepEqual(check([home, done]).rules, ['prototype-reach'], kind)
  }
})

test('an actual keyboard shortcut on a screen and older single-action reactions work', () => {
  const home = frame('入口'), done = frame('完成')
  home.reactions = [{trigger: {type: 'ON_KEY_DOWN', keyCodes: [13]}, action: go(done.id)}]
  button(done, go(home.id))
  assert.deepEqual(check([home, done]).errors, [])
})

test('prefers actions to deprecated action and applies actions in order', () => {
  const home = frame('入口'), detail = frame('详情'), done = frame('完成')
  const node = button(home, [{type: 'SET_VARIABLE'}, go(detail.id), go(done.id)])
  node.reactions[0].action = go('obsolete')
  button(done, go(home.id))
  assert.deepEqual(check([home, detail, done]).errors.map(e => [e.rule, e.node]),
    [['prototype-reach', detail.id]])
})

test('CLOSE only exits an overlay and a top-level SWAP leaves no BACK history', () => {
  for (const [mode, finish, expected] of [
    ['NAVIGATE', back, []], ['SWAP', back, ['prototype-return']],
    ['NAVIGATE', close, ['prototype-return']], ['OVERLAY', close, []]]) {
    const home = frame('入口'), done = frame('完成')
    button(home, go(done.id, mode))
    button(done, finish)
    assert.deepEqual(check([home, done]).rules, expected, mode + ' / ' + finish.type)
  }
})

test('a working visit does not hide a stranded arrival from another control', () => {
  const home = frame('入口'), done = frame('完成')
  button(home, go(done.id))
  button(home, go(done.id, 'SWAP'))
  button(done, back)
  assert.deepEqual(check([home, done]).rules, ['prototype-return'])
})

test('swapping an open overlay preserves its host, outside click needs exposed space', () => {
  const home = frame('入口'), confirm = frame('确认'), done = frame('完成')
  button(home, go(confirm.id, 'OVERLAY'))
  button(confirm, go(done.id, 'SWAP'))
  done.overlayBackgroundInteraction = 'CLOSE_ON_CLICK_OUTSIDE'
  assert.deepEqual(check([home, confirm, done]).rules, ['prototype-return', 'prototype-return'])
  done.width = 400
  assert.deepEqual(check([home, confirm, done]).errors, [])
})

test('a cycle between two states still needs a way to return to the entry', () => {
  const home = frame('入口'), detail = frame('详情'), done = frame('完成')
  button(home, go(detail.id))
  button(detail, go(done.id))
  button(done, go(detail.id))
  assert.deepEqual(check([home, detail, done]).rules, ['prototype-return', 'prototype-return'])
})

test('reports single-screen and empty deliveries', () => {
  assert.deepEqual(check([frame('入口')]).rules, ['prototype-states'])
  assert.deepEqual(check([]).rules, ['prototype-states'])
})
