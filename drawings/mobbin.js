async function drawStudy(frame, a) {
  const c = {
    ink: '#1A2030', text: '#31394C', mid: '#515D71', quiet: '#667184',
    line: '#DCE1E8', soft: '#EEF1F5', faint: '#F6F8FB', white: '#FFFFFF',
    blue: '#284AD4', blueTint: '#EBF0FF', amber: '#A64719', amberTint: '#FFF3E7',
    green: '#14744D', greenTint: '#E7F5EB'
  };
  const paths = {
    activity: 'M2 13h5l3-8 4 14 3-8 2 2h3',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    up: 'M12 19V5m-6 6 6-6 6 6',
    left: 'm14 5-7 7 7 7', right: 'm9 5 7 7-7 7', down: 'm6 9 6 6 6-6',
    bars: 'M4 19V9m8 10V4m8 15v-7',
    clock: 'M12 4a8 8 0 1 0 .01 0M12 7v5l3 2',
    search: 'M10.5 3.5a7 7 0 1 0 .01 0M16 16l5 5',
    table: 'M4 4h16v16H4zm0 5h16M10 9v11',
    terminal: 'm4 6 6 6-6 6m9 0h7',
    spark: 'm12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z',
    sliders: 'M4 6h7m4 0h5m-9-3v6M4 17h10m4 0h2m-6-3v6',
    chevron: 'm8 4 7 8-7 8',
    file: 'M6 2h8l5 5v15H6zm8 0v6h5M9 13h7m-7 4h5',
    check: 'm5 12 4 4 10-10',
    repeat: 'M4 10a7 7 0 0 1 12-4l3 3m0-5v5h-5M20 14a7 7 0 0 1-12 4l-3-3m0 5v-5h5',
    link: 'm10 13 4-4m-6 6-1 1a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0m2 2 1-1a3.5 3.5 0 0 1 5 5l-4 4a3.5 3.5 0 0 1-5 0',
    attach: 'm8 13 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9',
    branch: 'M6 6v12m0-5c7 0 11-2 11-7M6 3a2 2 0 1 0 .01 0M6 17a2 2 0 1 0 .01 0M17 3a2 2 0 1 0 .01 0',
    issue: 'M12 3a9 9 0 1 0 .01 0m0 5v5m0 3h.01',
    replay: 'M8 4a8 8 0 1 1-4 7m0-6v6h6',
    tune: 'M4 5h16M7 11h10m-7 6h4',
    user: 'M12 4a3.5 3.5 0 1 0 .01 0M5 20c0-4 3-6 7-6s7 2 7 6',
    pane: 'M3 4h18v16H3zm11 0v16',
    dataset: 'M4 5c0-3 16-3 16 0v13c0 3-16 3-16 0zm0 0c0 3 16 3 16 0M4 11c0 3 16 3 16 0',
    mark: 'm3 15 7-10 4 5-2 3-2-2-4 6zm7 3 7-10 4 5-4 6h-4l4-6-1-1-5 7z'
  };
  function icon(g, key, x, y, size = 18, color = c.mid, name = key) {
    const filled = key === 'mark';
    return g.SVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="' + paths[key] + '" fill="' + (filled ? color : 'none') + '" stroke="' + (filled ? 'none' : color) + '" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>', x, y, size, size, name);
  }
  function label(g, text, x, y, size = 14, color = c.text, font = 'sans', extra = {}) {
    return g.T(text, x, y, size, {c: color, font, ...extra});
  }
  function rule(g, x, y, w, color = c.line) { g.R(x, y, w, 1, color, 0, null, 'Divider'); }
  function panel(g, x, y, w, h, name) { return g.G(name, x, y, w, h); }
  frame.fills = [a.paint(c.white)];

  const top = a.G('Mac window toolbar', 0, 0, 1440, 48, {fill: c.faint});
  ['#ED6A60', '#F3BD4E', '#61C553'].forEach((color, i) =>
    top.E(19 + i * 19, 18, 12, 12, color, '#00000018', 0.7, 'Window control'));
  icon(top, 'mark', 94, 10, 28, c.ink, 'Quarry logo');
  label(top, 'Quarry', 127, 13, 16, c.ink, 'bold');
  top.R(201, 14, 1, 20, c.line);
  label(top, 'Engineering', 220, 15, 13, c.mid, 'medium');
  icon(top, 'right', 305, 18, 12);
  label(top, 'Checkout', 329, 15, 13, c.text, 'medium');
  icon(top, 'branch', 1182, 15, 17);
  label(top, 'fix/checkout-dedup', 1207, 15, 12, c.mid, 'mono');
  top.R(1369, 12, 1, 24, c.line);
  icon(top, 'pane', 1397, 15, 19);
  rule(top, 0, 47, 1440);

  const rail = a.G('Workspace tools', 0, 48, 64, 892, {fill: c.faint});
  rail.R(63, 0, 1, 892, c.line);
  [['table', 22, 'Issue list'], ['activity', 72, 'Active log explorer'], ['dataset', 122, 'Stored traces'], ['terminal', 172, 'Run console']].forEach(([key, y, name]) => {
    if (key === 'activity') rail.R(11, y - 9, 40, 40, c.blueTint, 8, null, 'Current tool');
    icon(rail, key, 20, y, 22, key === 'activity' ? c.blue : c.mid, name);
  });
  rule(rail, 17, 233, 29);
  icon(rail, 'search', 20, 258, 21, c.mid, 'Search workspace');
  rail.E(14, 832, 35, 35, '#DDE6F0', null, 1, 'User avatar');
  label(rail, 'MK', 21, 841, 12, '#2A425D', 'bold');

  const main = panel(a, 64, 48, 1000, 892, 'Investigation · log explorer');
  const inset = 32, width = 936;
  icon(main, 'issue', inset, 31, 16);
  label(main, 'Investigations', 55, 30, 13, c.mid, 'medium');
  icon(main, 'right', 152, 33, 12);
  label(main, 'RL-238', 175, 30, 13, c.text, 'mono');
  label(main, 'Duplicate checkout events', inset, 60, 32, c.ink, 'semibold', {ls: -1.15});
  const filters = panel(main, inset, 121, width, 36, 'Log query and scope');
  function filter(x, w, key, text) {
    filters.R(x, 0, w, 36, c.white, 6, c.line, text + ' filter');
    icon(filters, key, x + 10, 10, 16);
    label(filters, text, x + 34, 10, 13, c.text, 'medium');
    icon(filters, 'down', x + w - 22, 11, 13);
  }
  filter(0, 115, 'dataset', 'Staging');
  filter(123, 160, 'clock', '09:41:12 + 1s');
  filters.R(291, 0, 645, 36, c.white, 6, c.line, 'Message query');
  icon(filters, 'search', 303, 9, 17);
  label(filters, 'message:', 330, 10, 13, c.mid, 'mono');
  label(filters, 'checkout_complete', 397, 10, 13, c.ink, 'mono');

  const plot = panel(main, inset, 178, width, 232, 'Event arrivals · one second linear time scale');
  plot.R(0, 0, width, 232, c.white, 8, c.line, 'Event plot');
  label(plot, 'Event arrivals', 20, 16, 17, c.ink, 'semibold', {ls: -0.35});
  label(plot, 'Original capture', 20, 44, 12, c.mid, 'medium');
  plot.E(704, 24, 8, 8, c.blue);
  label(plot, 'First send', 720, 19, 12, c.mid, 'medium');
  plot.E(801, 24, 8, 8, c.amber);
  label(plot, 'Duplicate send', 817, 19, 12, c.mid, 'medium');
  const left = 67, graphWidth = 838, plotX = ms => left + graphWidth * ms / 1000;
  const firstX = plotX(83), secondX = plotX(516);
  const high = 108, base = 172;
  label(plot, '1', 42, high - 8, 11, c.mid, 'mono');
  label(plot, '0', 42, base - 8, 11, c.mid, 'mono');
  rule(plot, left, high, graphWidth, '#E9EDF2');
  rule(plot, left, base, graphWidth, '#BAC2CF');
  [0, 250, 500, 750, 1000].forEach((ms, i) => {
    const x = plotX(ms);
    for (let y = high + 6; y < base; y += 8) plot.R(x, y, 1, 2, '#DCE1E9', 0, null, 'Time grid');
    plot.R(x, base, 1, 5, '#AEB7C5');
    const offset = i === 0 ? 0 : i === 4 ? -48 : -24;
    const alignment = i === 0 ? 'LEFT' : i === 4 ? 'RIGHT' : 'CENTER';
    label(plot, String(ms), x + offset, 181, 11, c.mid, 'mono', {w: 48, align: alignment});
  });
  [{x: firstX, color: c.blue, name: 'Original emission at 83 ms'}, {x: secondX, color: c.amber, name: 'Duplicate emission at 516 ms'}].forEach(({x, color, name}) => {
    plot.R(x - 4, high, 8, base - high, color, 2, null, name);
  });
  rule(plot, firstX, 78, secondX - firstX, '#8C97AB');
  [firstX, secondX].forEach(x => plot.R(x, 78, 1, 11, '#8C97AB'));
  plot.R((firstX + secondX) / 2 - 32, 67, 64, 23, c.white);
  label(plot, '433 ms', (firstX + secondX) / 2 - 22, 69, 12, c.ink, 'mono');
  label(plot, 'Start 09:41:12.000', 20, 208, 11, c.mid, 'mono');
  label(plot, 'Elapsed time (ms)', 590, 208, 11, c.mid, 'sans', {w: 314, align: 'RIGHT'});

  label(main, 'Matching logs', inset, 439, 20, c.ink, 'semibold', {ls: -0.5});
  label(main, '2 records', 892, 445, 12, c.mid, 'medium');
  const logs = panel(main, inset, 478, width, 224, 'Two original records · retry expanded');
  logs.R(0, 0, width, 224, c.white, 8, c.line, 'Log table boundary');
  logs.R(1, 1, width - 2, 34, c.faint, 7);
  logs.R(1, 29, width - 2, 6, c.faint);
  const cols = [42, 247, 535, 737];
  ['Timestamp', 'Message', 'Origin', 'Delivery'].forEach((s,i)=>label(logs, s, cols[i], 10, 12, c.mid, 'medium'));
  rule(logs, 1, 35, width - 2);
  function record(y, time, origin, status, duplicate) {
    logs.R(1, y, width - 2, 44, duplicate ? c.amberTint : c.white, 0, null, duplicate ? 'Expanded selected retry' : 'Initial event');
    icon(logs, duplicate ? 'down' : 'right', 13, y + 15, 13, c.mid);
    label(logs, time, cols[0], y + 13, 13, c.ink, 'mono');
    label(logs, 'checkout_complete', cols[1], y + 13, 13, c.ink, 'mono');
    label(logs, origin, cols[2], y + 13, 13, c.text, 'medium');
    icon(logs, duplicate ? 'repeat' : 'arrow', cols[3], y + 14, 16, duplicate ? c.amber : c.blue);
    label(logs, status, cols[3] + 24, y + 13, 13, duplicate ? c.amber : c.blue, 'semibold');
  }
  record(36, '09:41:12.083', 'Initial request', 'Emitted', false);
  record(80, '09:41:12.516', 'Network retry', 'Duplicate', true);
  rule(logs, 1, 124, width - 2, '#ECDCCC');
  label(logs, 'order.id', 42, 143, 12, c.mid, 'mono');
  label(logs, 'ord_7394', 165, 143, 13, c.ink, 'mono');
  label(logs, 'attempt', 42, 178, 12, c.mid, 'mono');
  label(logs, 'retry_01', 165, 178, 13, c.ink, 'mono');
  label(logs, 'event.name', 477, 143, 12, c.mid, 'mono');
  label(logs, 'checkout_complete', 611, 143, 13, c.ink, 'mono');
  label(logs, 'dedupe_key', 477, 178, 12, c.mid, 'mono');
  label(logs, 'missing', 611, 178, 13, c.amber, 'mono');

  const replay = panel(main, inset, 731, width, 114, 'Patched replay evidence');
  replay.R(0, 0, width, 114, '#F6FAF7', 8, '#D3E4D8', 'Replay result');
  replay.R(18, 17, 32, 32, c.greenTint, 7);
  icon(replay, 'replay', 25, 24, 18, c.green);
  label(replay, 'Patched replay', 62, 19, 17, c.ink, 'semibold');
  label(replay, 'TEST-8072', 63, 46, 12, c.mid, 'mono');
  icon(replay, 'check', 835, 22, 16, c.green);
  label(replay, 'Passed', 858, 20, 13, c.green, 'semibold');
  rule(replay, 18, 68, width - 36, '#DFE9E2');
  label(replay, '2 network retries', 20, 84, 13, c.text, 'medium');
  icon(replay, 'arrow', 156, 84, 15, c.mid);
  label(replay, '1 emitted event', 182, 84, 13, c.ink, 'semibold');
  label(replay, 'checkout_complete', 658, 84, 12, c.mid, 'mono', {w:258, align:'RIGHT'});

  const side = a.G('Quarry Agent · conversation and patch', 1064, 48, 376, 892, {fill: c.white});
  side.R(0, 0, 1, 892, c.line);
  side.R(24, 24, 30, 30, c.ink, 8);
  icon(side, 'spark', 30, 30, 18, c.white);
  label(side, 'Quarry Agent', 65, 28, 18, c.ink, 'semibold', {ls:-0.45});
  rule(side, 1, 78, 375);
  const sx = 24;
  side.E(sx, 104, 27, 27, '#DDE6F0');
  label(side, 'MK', sx+4, 111, 10, '#2A425D', 'bold');
  label(side, 'You', 61, 109, 14, c.ink, 'semibold');
  label(side, '09:40', 302, 110, 11, c.mid, 'mono');
  label(side, 'Find why checkout_complete fires twice\non retry. Prepare a patch and a replay.', sx, 146, 14, c.text, 'sans', {lh:22});
  rule(side, sx, 212, 328);
  side.R(sx, 237, 27, 27, c.ink, 7);
  icon(side, 'spark', sx+5, 242, 17, c.white);
  label(side, 'Quarry Agent', 61, 241, 14, c.ink, 'semibold');
  label(side, '09:43', 302, 243, 11, c.mid, 'mono');
  label(side, 'The retry sent the same checkout event\nagain, 433 ms after the first send.', sx, 281, 14, c.text, 'sans', {lh:22});
  const run = panel(side,sx,346,328,135,'Agent investigation steps');
  run.R(10, 16, 1, 83, c.line);
  [['Read the captured trace', 0], ['Added a per-order dedupe key', 42], ['Replayed two network retries', 84]].forEach(([s,y]) => {
    run.E(2, y + 3, 17, 17, c.greenTint);
    icon(run, 'check', 5, y + 6, 11, c.green);
    label(run, s, 31, y+2, 13, c.text, 'medium');
  });
  label(side, 'Patch ready', sx, 488, 17, c.ink, 'semibold', {ls: -0.3});
  label(side, 'Review the change before applying it.', sx, 518, 13, c.mid);
  side.R(sx, 553, 328, 61, c.white, 8, c.line, 'Generated patch file');
  icon(side, 'file', 37, 572, 20, c.mid);
  label(side, 'checkout-event.patch', 68, 566, 13, c.ink, 'mono');
  label(side, 'Unified diff', 68, 588, 11, c.mid);
  icon(side, 'right', 326, 576, 12, c.mid);
  side.R(sx, 625, 328, 40, c.blue, 7, null, 'Primary action · Review patch');
  const ctaLabel = label(side, 'Review patch', 0, 636, 14, c.white, 'semibold');
  const ctaIconSize = 15, ctaGap = 8;
  ctaLabel.x = sx + (328 - ctaLabel.width - ctaGap - ctaIconSize) / 2;
  icon(side, 'arrow', ctaLabel.x + ctaLabel.width + ctaGap, 637, ctaIconSize, c.white);
  rule(side, 1, 749, 375);
  side.R(sx, 773, 328, 89, c.white, 8, '#B7C0CD', 'Follow-up composer');
  label(side, 'Ask a follow-up…', 38, 787, 14, c.mid);
  icon(side, 'attach', 40, 828, 16, c.mid, 'Attach file');
  side.R(310, 820, 29, 29, '#E9EDF3', 6, null, 'Send follow-up');
  icon(side, 'up', 317, 827, 15, c.mid);
}
