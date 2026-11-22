const assert = require('node:assert/strict')
const test = require('node:test')
const {exportTextLayers} = require('./export_text_layers.js')

const transform = [[1, 0, 100], [0, 1, 200]]
const rect = (x, y, width, height) => ({x, y, width, height})
const solid = {type: 'SOLID', color: {r: 0, g: 0, b: 0}, opacity: 1, visible: true}
const style = {start: 0, end: 4, fontSize: 14, fontWeight: 400, fills: [solid]}

function label(id, properties = {}) {
  return {type: 'TEXT', id, name: 'Row ' + id, characters: 'Read', visible: true,
    absoluteTransform: transform, absoluteRenderBounds: rect(110.2, 211.35, 31.2, 13.47),
    getStyledTextSegments: () => [style], ...properties}
}

function frame(children) {
  return {type: 'FRAME', id: '1:4', visible: true, clipsContent: true, children,
    absoluteTransform: transform, absoluteBoundingBox: rect(100, 200, 100, 80)}
}

function apiFor(root) {
  return {root: {documentColorProfile: 'SRGB'}, getNodeByIdAsync: async id => id === root.id ? root : null}
}

async function scan(children) {
  const root = frame(children)
  const report = await exportTextLayers(apiFor(root), {review: root.id})
  assert.equal(report.version, 1)
  return report.states.review
}

test('uses frame-relative outward-rounded ink bounds, including visible instance children', async () => {
  const report = await scan([{type: 'INSTANCE', children: [label('I2:3;4:5')]}])
  assert.deepEqual([report.frameId, report.width, report.height], ['1:4', 100, 80])
  assert.deepEqual(report.layers, [{id: 'I2:3;4:5', name: 'Row I2:3;4:5', text: 'Read', box: [10, 11, 32, 14],
    fontSize: 14, fontWeight: 400, fillHex: '#000000'}])
})

test('omits hidden ancestors, zero opacity, invisible fills, empty text and image contents', async () => {
  const report = await scan([{type: 'GROUP', visible: false, children: [label('hidden')]},
    {type: 'FRAME', opacity: 0, children: [label('zero')]},
    label('empty', {characters: '  '}), label('absent', {absoluteRenderBounds: null}),
    label('clear', {getStyledTextSegments: () => [{...style, fills: [{...solid, opacity: 0}]}]}),
    {type: 'RECTANGLE', fills: [{type: 'IMAGE'}]}, label('visible')])
  assert.deepEqual(report.layers.map(n => n.id), ['visible'])
})

test('intersects screen and ancestor clips, skipping fully cropped render bounds', async () => {
  const report = await scan([{type: 'FRAME', clipsContent: true, absoluteTransform: transform,
    absoluteBoundingBox: rect(120, 210, 15, 12), children: [label('cut'),
      label('outside', {absoluteRenderBounds: rect(125, 223, 4, 8)})]}])
  assert.deepEqual(report.layers.map(r => r.box), [[20, 11, 15, 11]])
})

test('mixed fills, sizes and weights preserve runs without guessing geometry for each run', async () => {
  const report = await scan([label('mixed', {getStyledTextSegments: () => [
    {...style, end: 2}, {...style, start: 2, fontSize: 22, fontWeight: 600, fills: [{type: 'GRADIENT_LINEAR'}]}]})])
  const n = report.layers[0]
  assert.deepEqual([n.fontSize, n.fontWeight, n.fillHex], [null, null, null])
  assert.equal(n.runs[1].start, 2)
  assert.match(n.manualReason, /分段/)
})

test('different character runs with the same measurable style share one box', async () => {
  const report = await scan([label('homogeneous', {getStyledTextSegments: () => [
    {...style, end: 2}, {...style, start: 2} ]})])
  assert.equal(report.layers[0].fillHex, '#000000')
  assert.equal(report.layers[0].manualReason, undefined)
})

test('opacity, blending, rotating, rounded clips and sibling masks produce review reasons', async () => {
  const report = await scan([
    {type: 'GROUP', opacity: 0.6, children: [label('transparent')]},
    {type: 'GROUP', blendMode: 'MULTIPLY', children: [label('blended')]},
    label('rotated', {absoluteTransform: [[0, -1, 0], [1, 0, 0]]}),
    {type: 'FRAME', clipsContent: true, absoluteTransform: transform, topLeftRadius: 12,
      absoluteBoundingBox: rect(110, 210, 60, 45), children: [label('corner')]},
    {type: 'VECTOR', isMask: true}, label('masked'),
    {type: 'TEXT_PATH', id: '5:4', name: 'Circle'},
  ])
  for (const layer of report.layers) assert.ok(layer.manualReason, layer.id)
  assert.match(report.issues[0], /5:4/)
})

test('rejects hidden or rotated state frames and non-frame ids', async () => {
  const root = frame([])
  let api = apiFor(root)
  await assert.rejects(exportTextLayers(api, {review: '3:9'}), /找不到/)
  root.absoluteTransform = [[0, -1, 0], [1, 0, 0]]
  await assert.rejects(exportTextLayers(api, {review: root.id}), /未旋转/)
  root.absoluteTransform = transform
  root.parent = {type: 'GROUP', visible: false}
  await assert.rejects(exportTextLayers(api, {review: root.id}), /祖先已隐藏/)
})
