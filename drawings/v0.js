async function drawStudy(frame, a) {
  const c = {
    desktop: '#E8EDF2', chrome: '#F8FAFC', white: '#FFFFFF', canvas: '#F1F4F7',
    ink: '#152233', secondary: '#465568', quiet: '#657487', border: '#E1E5E9',
    edge: '#CBD4DE', control: '#F5F7FA', blue: '#246BE4', blueText: '#184FAD',
    blueWash: '#EAF2FF', blueLine: '#C0D7FA', green: '#17613E',
    greenWash: '#EAF5EE', amber: '#8F4709', amberWash: '#FCF1E4',
  };

  function text(p, value, x, y, size, options = {}) {
    return p.T(value, x, y, size, { c: c.ink, lh: size + 5, ...options });
  }

  function glyph(p, name, x, y, color = c.secondary) {
    const paths = {
      check: 'M 1 5 L 4.5 8.5 L 11 1',
      down: 'M 1 2 L 5 6 L 9 2',
      right: 'M 2 1 L 6 5 L 2 9',
      arrow: 'M 1 6 L 12 6 M 8 2 L 12 6 L 8 10',
      send: 'M 1 6 L 6 1 L 11 6 M 6 1 L 6 13',
      scope: 'M 6 0 L 12 6 L 6 12 L 0 6 L 6 0 Z',
      box: 'M 1 6 L 1 1 L 6 1 M 10 1 L 15 1 L 15 6 M 15 10 L 15 15 L 10 15 M 6 15 L 1 15 L 1 10',
      file: 'M 3 1 L 10 1 L 14 5 L 14 15 L 3 15 L 3 1 Z M 10 1 L 10 5 L 14 5 M 6 8 L 11 8 M 6 11 L 11 11',
      preview: 'M 1 1 L 15 1 L 15 11 L 1 11 L 1 1 Z M 8 11 L 8 15 M 5 15 L 11 15',
      terminal: 'M 1 1 L 15 1 L 15 13 L 1 13 L 1 1 Z M 4 4 L 7 7 L 4 10 M 9 10 L 12 10',
    };
    return p.P(paths[name], x, y, null, color, 1.4, name);
  }

  function objectTag(p, x, y, withMenu = false) {
    const width = withMenu ? 180 : 160;
    const g = p.G('Selected checkout_complete scope', x, y, width, 24);
    g.R(0, 0, width, 24, c.blueWash, 5, c.blueLine, 'Selection token');
    glyph(g, 'scope', 8, 6, c.blue);
    text(g, 'checkout_complete', 27, 4, 12, { font: 'mono', c: c.blueText });
    if (withMenu) glyph(g, 'down', 161, 9, c.blueText);
  }

  function signal(p, label, x, y, width, tone) {
    const g = p.G(label, x, y, width, 25);
    const isGreen = tone === 'green';
    g.R(0, 0, width, 25, isGreen ? c.greenWash : c.amberWash, 5, null, 'Status surface');
    if (isGreen) {
      glyph(g, 'check', 9, 7, c.green);
    } else {
      g.E(10, 9, 7, 7, c.amber, null, 1, 'Status dot');
    }
    text(g, label, 26, 4, 11, { font: 'semibold', c: isGreen ? c.green : c.amber });
  }

  a.R(0, 0, 1440, 940, c.desktop, 0, null, 'Desktop backdrop');
  const shadow = a.R(16, 16, 1408, 908, c.white, 15, c.edge, 'Window perimeter');
  shadow.effects = [{
    type: 'DROP_SHADOW', color: { r: 0.12, g: 0.23, b: 0.34, a: 0.13 },
    offset: { x: 0, y: 9 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL',
  }];
  const w = a.G('Quarry replay review window', 16, 16, 1408, 908, { clip: true, r: 15, fill: c.white });
  const toolbar = w.G('Window toolbar', 0, 0, 1408, 59, { fill: c.chrome });
  toolbar.E(18, 25, 11, 11, '#FB625B', '#E45551', 0.6, 'Close window');
  toolbar.E(36, 25, 11, 11, '#F5BE4E', '#E4AA38', 0.6, 'Minimize window');
  toolbar.E(54, 25, 11, 11, '#58C759', '#4FB254', 0.6, 'Zoom window');
  toolbar.R(90, 18, 24, 24, '#203247', 6, null, 'Quarry app icon');
  toolbar.P('M 1 7 L 8 1 L 15 7 L 8 13 L 1 7 Z M 4 11 L 8 14 L 12 11',
    94, 22, null, c.white, 1.35, 'Quarry mark');
  text(toolbar, 'Quarry', 125, 19, 15, { font: 'bold' });
  glyph(toolbar, 'right', 187, 25, c.quiet);
  text(toolbar, 'Releases', 204, 20, 14, { c: c.secondary });
  glyph(toolbar, 'right', 275, 25, c.quiet);
  text(toolbar, 'RL-238', 292, 20, 14, { font: 'mono' });
  const branch = toolbar.G('Repository branch icon', 1134, 22, 16, 16);
  branch.L(4, 4, 4, 13, c.quiet, 1.25);
  branch.P('M 0 5 L 3 5 C 5.5 5 8 3 8 0', 4, 4, null, c.quiet, 1.25, 'Branch connection');
  branch.E(2.5, 1.5, 3, 3, c.chrome, c.quiet, 1, 'Branch origin');
  branch.E(2.5, 11.5, 3, 3, c.chrome, c.quiet, 1, 'Branch base');
  branch.E(10.5, 1.5, 3, 3, c.chrome, c.quiet, 1, 'Branch head');
  text(toolbar, 'quarry/checkout', 1155, 21, 12, { font: 'mono', c: c.secondary });
  toolbar.L(1279, 19, 1279, 42, c.border);
  toolbar.E(1296, 27, 6, 6, '#B17228', null, 1, 'Staging dot');
  text(toolbar, 'Staging', 1310, 20, 13, { font: 'medium', c: c.secondary });
  toolbar.L(0, 58.5, 1408, 58.5, c.border);

  const side = w.G('Object inspector and scoped conversation', 0, 59, 392, 849, { fill: c.white });
  const right = w.G('Live checkout replay preview', 392, 59, 1016, 849, { fill: c.canvas });
  w.L(391.5, 59, 391.5, 908, c.border);

  const sideTabs = side.G('Inspector tabs', 0, 0, 392, 52);
  text(sideTabs, 'Inspect', 18, 17, 14, { font: 'semibold' });
  text(sideTabs, 'Conversation', 104, 17, 14, { font: 'medium', c: c.quiet });
  sideTabs.L(0, 51.5, 392, 51.5, c.border);
  sideTabs.L(18, 51, 76, 51, c.blue, 2);

  objectTag(side, 18, 68, true);
  text(side, 'Event properties', 18, 112, 15, { font: 'semibold' });
  [
    ['Fixture', 'TEST-8072'],
    ['Checkout key', 'chk_1E9A'],
    ['Retry guard', 'Checkout key'],
  ].forEach(([name, value], i) => {
    const y = 149 + i * 28;
    text(side, name, 18, y, 13, { c: c.secondary });
    text(side, value, 142, y, 13, { font: i < 2 ? 'mono' : 'medium' });
  });
  side.L(18, 234.5, 374, 234.5, c.border);

  const thread = side.G('Request and agent activity', 18, 253, 356, 309);
  text(thread, 'Your request', 0, 0, 15, { font: 'semibold' });
  thread.R(0, 32, 2, 60, c.blueLine, 1, null, 'Quoted request rule');
  text(thread, 'Reproduce RL-238 and prepare a patch. Make sure checkout_complete is only sent once when the network retries.',
    12, 29, 14, { lh: 21, w: 321 });
  thread.L(0, 108.5, 356, 108.5, c.border);
  text(thread, 'Quarry Agent', 0, 127, 15, { font: 'semibold' });
  thread.E(247, 135, 6, 6, '#2E8859', null, 1, 'Ready dot');
  text(thread, 'Ready for review', 260, 129, 12, { font: 'medium', c: c.green });
  text(thread, 'Both events share a checkout key. I added a guard before emission, then replayed the fixture with two network retries.',
    0, 157, 14, { lh: 21, w: 350 });
  const activity = thread.G('Replay activity', 0, 230, 356, 70);
  activity.R(0, 0, 356, 70, c.control, 6, null, 'Activity rows');
  [
    ['Replayed original fixture', '2 emitted'],
    ['Replayed with patch', '1 emitted'],
  ].forEach(([action, result], i) => {
    const y = 10 + i * 32;
    glyph(activity, 'check', 12, y + 4, c.quiet);
    text(activity, action, 33, y, 12, { c: c.secondary, font: 'medium' });
    text(activity, result, 263, y, 12, { c: c.secondary, font: 'mono', align: 'RIGHT', w: 80 });
  });
  activity.L(12, 35, 344, 35, c.border);
  side.L(18, 579.5, 374, 579.5, c.border);
  text(side, 'Evidence source', 18, 597, 15, { font: 'semibold' });
  const fixture = side.G('Open checkout test fixture', 18, 625, 356, 48);
  glyph(fixture, 'file', 0, 16, c.quiet);
  text(fixture, 'checkout.retry.fixture.json', 26, 5, 12, { font: 'mono', c: c.secondary });
  text(fixture, 'Checkout test fixtures', 26, 25, 12, { c: c.quiet });
  glyph(fixture, 'right', 336, 19, c.quiet);

  const ask = side.G('Follow-up composer', 18, 717, 356, 110);
  ask.R(0, 0, 356, 110, c.white, 9, c.edge, 'Composer surface');
  objectTag(ask, 11, 11);
  text(ask, 'Ask about this event…', 12, 48, 14, { c: c.quiet });
  ask.R(314, 67, 30, 30, c.control, 7, c.border, 'Send follow-up · disabled');
  glyph(ask, 'send', 323, 75, c.quiet);

  const previewToolbar = right.G('Replay preview toolbar', 0, 0, 1016, 52, { fill: c.white });
  glyph(previewToolbar, 'preview', 25, 18);
  text(previewToolbar, 'Replay preview', 51, 17, 14, { font: 'semibold' });
  previewToolbar.R(315, 11, 376, 30, c.control, 5, c.border, 'Fixture path');
  glyph(previewToolbar, 'terminal', 327, 19, c.quiet);
  text(previewToolbar, 'checkout / TEST-8072', 350, 17, 12, { font: 'mono', c: c.secondary });
  previewToolbar.R(866, 11, 125, 30, c.blueWash, 5, c.blueLine, 'Select event tool');
  glyph(previewToolbar, 'box', 877, 18, c.blueText);
  text(previewToolbar, 'Select event', 901, 18, 12, { font: 'semibold', c: c.blueText });
  previewToolbar.L(0, 51.5, 1016, 51.5, c.border);

  const page = right.G('Checkout evidence document', 24, 75, 968, 750);
  page.R(0, 0, 968, 750, c.white, 9, c.edge, 'Evidence document surface');
  text(page, 'Checkout', 42, 34, 13, { font: 'medium', c: c.secondary });
  glyph(page, 'right', 113, 38, c.quiet);
  text(page, 'RL-238', 128, 34, 13, { font: 'mono', c: c.secondary });
  text(page, 'Duplicate checkout events', 42, 61, 35, { font: 'bold', ls: -0.9 });
  text(page, 'A network retry sent the same checkout event a second time.', 42, 115, 16, { c: c.secondary });
  page.L(42, 154.5, 926, 154.5, c.border);

  objectTag(page, 42, 172, true);
  const trace = page.G('Selected event evidence', 42, 200, 884, 421);

  function table(y, secondColumn, rows) {
    const grid = trace.G(secondColumn + ' evidence rows', 22, y, 840, 29 + rows.length * 33);
    const starts = [12, 227, 493, 716];
    const heads = ['Attempt', secondColumn, 'Event', 'Outcome'];
    grid.R(0, 0, 840, 27, c.control, 4, null, 'Column header surface');
    heads.forEach((head, i) => {
      text(grid, head, starts[i], 5, 12, { font: 'medium', c: c.secondary });
    });

    rows.forEach(([attempt, detail, event, outcome, tone], i) => {
      const y = 32 + i * 33;
      const outcomeColor = tone === 'amber' ? c.amber : tone === 'green' ? c.green : c.secondary;
      const yText = y + 5;
      const isRecorded = secondColumn === 'Time (UTC)';
      text(grid, attempt, starts[0], yText, 13, { font: 'medium' });
      text(grid, detail, starts[1], yText, 13, { font: isRecorded ? 'mono' : 'sans', c: c.secondary });
      text(grid, event, starts[2], yText, 13, { font: 'mono', c: event === '—' ? c.quiet : c.ink });
      if (tone === 'amber') grid.E(starts[3] - 13, yText + 6, 6, 6, c.amber, null, 1, 'Duplicate marker');
      text(grid, outcome, starts[3], yText, 13, { font: 'medium', c: outcomeColor });
      if (i < rows.length - 1) grid.L(0, y + 30, 840, y + 30, c.border);
    });
  }

  text(trace, 'Recorded trace', 22, 18, 17, { font: 'semibold' });
  signal(trace, '2 events emitted', 735, 18, 127, 'amber');
  table(55, 'Time (UTC)', [
    ['Initial request', '09:41:12.083', 'checkout_complete', 'Emitted', null],
    ['Retry 1', '09:41:12.516', 'checkout_complete', 'Duplicate', 'amber'],
  ]);
  text(trace, 'Same checkout key on both emissions, 433 ms apart.', 34, 166, 13, { c: c.secondary });
  trace.L(22, 198.5, 862, 198.5, c.border);
  text(trace, 'Patched replay', 22, 214, 17, { font: 'semibold' });
  signal(trace, 'Passed', 785, 213, 77, 'green');
  table(250, 'Rule evaluation', [
    ['Initial request', 'New checkout key', 'checkout_complete', 'Emitted', 'green'],
    ['Retry 1', 'Existing checkout key', '—', 'Suppressed', null],
    ['Retry 2', 'Existing checkout key', '—', 'Suppressed', null],
  ]);
  text(trace, 'Two network retries, one event emitted.', 34, 382, 13, { font: 'semibold', c: c.green });
  const traceBorder = trace.R(0, 0, 884, 421, null, 0, c.blue, 'Selected object outline');
  traceBorder.strokeWeight = 1.5;

  const patch = page.G('Patch awaiting review', 42, 658, 884, 60);
  patch.R(0, 4, 46, 46, c.control, 7, c.border, 'Patch document icon');
  glyph(patch, 'file', 14, 18, c.secondary);
  text(patch, 'checkout-event.patch', 62, 5, 14, { font: 'mono' });
  text(patch, 'Proposed change · Guard against repeated checkout keys', 62, 31, 13, { c: c.secondary });
  patch.R(722, 5, 162, 42, '#25374C', 7, null, 'Review patch button');
  text(patch, 'Review patch', 740, 16, 14, { font: 'semibold', c: c.white });
  glyph(patch, 'arrow', 851, 20, c.white);
}
