async function drawStudy(frame, a) {
  const c = {
    paper: '#F9F3E8', tool: '#F1E8DB',
    ink: '#130E0A', body: '#2E2722', muted: '#665F58',
    line: '#C5BCB1', hardLine: '#9A9085', blue: '#144BB7',
    blank: '#FCF7ED',
  };

  const marks = {
    back: '<path d="m14 6-6 6 6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>',
    send: '<path d="M12 20V4m-6 6 6-6 6 6"/>',
    attachment: '<path d="m20 11.5-8.8 8.8a5 5 0 0 1-7.1-7.1L14 3.3a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-2.8-2.8l8-8"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  };
  const order = 'TEST-8072';
  const event = 'checkout_complete';
  const trace = 'staging-event-trace.json';

  function type(g, value, x, y, o = {}) {
    const {size = 14, lh = 22, weight = 'sans', color = c.ink, w, align, ls} = o;
    return g.T(value, x, y, size, {c: color, font: weight, lh, w, align, ls});
  }

  function icon(g, key, x, y, size = 16, color = c.ink) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"'
      + ' fill="none" stroke="' + color + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
      + marks[key] + '</svg>';
    return g.SVG(svg, x, y, size, size, 'Icon / ' + key);
  }

  function boxStroke(g, color, weight = 1) {
    g.frame.strokes = [a.paint(color)];
    g.frame.strokeWeight = weight;
    g.frame.strokeAlign = 'INSIDE';
  }

  function button(g, caption, x, y, w, h) {
    const control = g.G('Button / ' + caption, x, y, w, h, {fill: c.ink});
    type(control, caption, 0, (h-18)/2, {
      size: 13, lh: 18, weight: 'medium', color: c.paper, w, align: 'CENTER',
    });
    return control;
  }

  function sample(g, name) {
    g.frame.setPluginData('sample', name);
  }

  frame.fills = [a.paint(c.paper)];
  const toolbar = a.G('Workspace toolbar', 0, 0, 1440, 64, {fill: c.blank});
  type(toolbar, 'Quarry', 72, 20, {size: 17, lh: 24, weight: 'semibold'});
  toolbar.L(152, 20, 152, 44, c.line);
  icon(toolbar, 'back', 176, 24, 16, c.muted);
  type(toolbar, 'Release audit', 201, 21, {size: 13, lh: 20, weight: 'medium'});
  type(toolbar, 'RL-238', 315, 22, {size: 12, lh: 18, weight: 'mono', color: c.muted});
  type(toolbar, 'Staging / r2183', 1092, 22, {
    size: 12, lh: 18, weight: 'mono', color: c.body, w: 238, align: 'RIGHT',
  });
  const menu = toolbar.G('Toolbar / Audit actions', 1340, 18, 28, 28);
  icon(menu, 'more', 6, 6, 16, c.body);
  toolbar.L(0, 63, 1440, 63, c.line);

  const proof = a.G('Release evidence proof', 72, 108, 824, 754);
  type(proof, 'Duplicate checkout events', 0, 0, {
    size: 58, lh: 62, weight: 'serif', ls: -1.2,
  });
  type(proof, 'A network retry emitted a second completion event for an accepted order.', 0, 81, {
    size: 16, lh: 24, color: c.body,
  });
  type(proof, 'Order', 0, 122, {size: 13, lh: 18, weight: 'medium', color: c.muted});
  type(proof, order, 51, 122, {size: 12, lh: 18, weight: 'mono'});
  proof.L(147, 121, 147, 140, c.line);
  type(proof, 'Service', 166, 122, {size: 13, lh: 18, weight: 'medium', color: c.muted});
  type(proof, 'checkout-web', 230, 122, {size: 12, lh: 18, weight: 'mono'});

  type(proof, 'Event proof', 0, 170, {size: 30, lh: 36, weight: 'serif', ls: -.4});
  type(proof, 'Captured trace', 636, 183, {
    size: 13, lh: 18, weight: 'medium', color: c.muted, w: 188, align: 'RIGHT',
  });
  const table = proof.G('Table / Captured checkout events', 0, 226, 824, 153);
  sample(table, 'Hallmark event proof');
  table.L(0, 0, 824, 0, c.ink);
  table.L(0, 3, 824, 3, c.ink);
  const col = [12, 206, 383, 638];
  ['Trigger', 'Timestamp', 'Event', 'Result'].forEach((value,i)=>{
    type(table, value, col[i], 17, {size: 13, lh: 18, weight: 'medium', color: c.muted});
  });
  table.L(0, 49, 824, 49, c.line);
  const records = [
    ['Initial confirmation', '09:41:12.083', 'First emission'],
    ['Network retry', '09:41:12.516', 'Duplicate'],
  ];
  for (const [i,[trigger,time,status]] of records.entries()) {
    const top = 50+i*51;
    const record = table.G('Trace row / ' + trigger, 0, top, 824, 51);
    if (i) {
      record.R(0, 6, 2, 39, c.blue, 0, null, 'Duplicate evidence mark');
    }
    type(record, trigger, col[0], 16, {size: 14, lh: 20, weight: i ? 'semibold' : 'sans'});
    type(record, time, col[1], 17, {size: 12, lh: 18, weight: 'mono'});
    type(record, event, col[2], 17, {size: 12, lh: 18, weight: 'mono'});
    type(record, status, col[3], 17, {size: 13, lh: 18, weight: 'medium', color: i ? c.blue : c.body});
    table.L(0, top+50, 824, top+50, c.line);
  }
  icon(proof, 'file', 0, 399, 14, c.blue);
  const source = type(proof, trace, 22, 396, {
    size: 12, lh: 18, weight: 'mono', color: c.blue,
  });
  proof.L(22, 415, 22+source.width, 415, c.blue);
  type(proof, '433 ms between emissions', 619, 397, {
    size: 13, lh: 18, color: c.muted, w: 205, align: 'RIGHT',
  });

  type(proof, 'Regression check', 0, 452, {size: 30, lh: 36, weight: 'serif', ls: -.4});
  type(proof, 'Proposed order ID gate', 0, 491, {size: 13, lh: 18, color: c.muted});
  const outcome = proof.G('Regression / One event after two retries', 0, 522, 824, 60, {fill: c.tool});
  outcome.L(0, 0, 824, 0, c.line);
  outcome.L(0, 59, 824, 59, c.line);
  outcome.L(247, 0, 247, 60, c.line);
  outcome.L(511, 0, 511, 60, c.line);
  type(outcome, 'Replay', 12, 9, {size: 12, lh: 17, weight: 'medium', color: c.muted});
  type(outcome, '2 retries', 12, 30, {size: 13, lh: 18, weight: 'mono'});
  type(outcome, 'Completed events', 259, 9, {size: 12, lh: 17, weight: 'medium', color: c.muted});
  type(outcome, '1 checkout_complete', 259, 30, {size: 13, lh: 18, weight: 'mono'});
  type(outcome, 'Result', 523, 9, {size: 12, lh: 17, weight: 'medium', color: c.muted});
  icon(outcome, 'check', 523, 32, 14);
  type(outcome, 'Passed', 544, 29, {size: 13, lh: 18, weight: 'medium'});

  type(proof, 'Patch for review', 0, 626, {size: 30, lh: 36, weight: 'serif', ls: -.4});
  proof.L(0, 676, 824, 676, c.line);
  icon(proof, 'file', 0, 702, 18, c.body);
  type(proof, 'checkout-event.patch', 31, 700, {size: 13, lh: 20, weight: 'mono'});
  type(proof, '+8', 499, 701, {size: 12, lh: 18, weight: 'mono'});
  type(proof, '−2', 531, 701, {size: 12, lh: 18, weight: 'mono'});
  const review = button(proof, 'Review patch', 668, 689, 156, 44);
  sample(review, 'Hallmark review action');
  proof.L(0, 744, 824, 744, c.line);

  a.L(960, 108, 960, 862, c.line);
  const notes = a.G('Agent margin notes', 992, 108, 376, 754);
  type(notes, 'Agent notes', 0, 7, {size: 35, lh: 43, weight: 'serif', ls: -.5});
  type(notes, 'Codex', 282, 21, {size: 13, lh: 18, weight: 'medium', color: c.muted, w: 94, align: 'RIGHT'});
  notes.L(0, 61, 376, 61, c.hardLine);

  type(notes, 'Your request', 0, 86, {size: 13, lh: 18, weight: 'semibold'});
  type(notes, 'Trace the retry that emitted a second event.\nDraft the smallest safe patch.', 0, 114, {
    size: 15, lh: 23, w: 362, color: c.body,
  });
  icon(notes, 'attachment', 0, 171, 14, c.muted);
  type(notes, trace, 23, 168, {size: 12, lh: 18, weight: 'mono', color: c.muted});
  notes.L(0, 207, 376, 207, c.line);

  type(notes, 'Run activity', 0, 231, {size: 13, lh: 18, weight: 'semibold'});
  type(notes, 'Completed in 18 s', 203, 232, {
    size: 12, lh: 17, color: c.muted, w: 173, align: 'RIGHT',
  });
  const runs = [
    ['09:42:26', 'Read the staging trace'],
    ['09:42:31', 'Replayed the retry path'],
    ['09:42:44', 'Verified the proposed gate'],
  ];
  runs.forEach(([time,label],i)=>{
    const y = 260+i*36;
    type(notes, time, 0, y+8, {size: 12, lh: 18, weight: 'mono', color: c.muted});
    type(notes, label, 100, y+8, {size: 13, lh: 18, color: c.body});
    if (i === 2) icon(notes, 'check', 357, y+9, 16);
    notes.L(0, y+33, 376, y+33, c.line);
  });

  type(notes, 'Agent finding', 0, 403, {size: 13, lh: 18, weight: 'semibold'});
  type(notes, 'The initial confirmation and the retry emitted the same event for TEST-8072. Gate completion by order ID.', 0, 431, {
    size: 14, lh: 22, w: 365, color: c.body,
  });
  type(notes, 'With the proposed gate, two retries produced one completion event. The patch awaits review.', 0, 490, {
    size: 14, lh: 22, w: 365, color: c.body,
  });

  type(notes, 'Follow up', 0, 629, {size: 13, lh: 18, weight: 'medium'});
  const compose = notes.G('Focused follow-up / RL-238', 0, 660, 376, 84, {fill: c.blank});
  boxStroke(compose, c.blue, 2);
  sample(compose, 'Hallmark focused reply');
  type(compose, 'How does the gate suppress duplicate events?', 13, 13, {
    size: 13, lh: 18, color: c.body, w: 350,
  });
  const scope = compose.G('Reply scope / RL-238', 13, 48, 74, 24, {fill: c.tool});
  boxStroke(scope, c.line);
  type(scope, 'RL-238', 0, 4, {size: 11, lh: 16, weight: 'mono', w: 74, align: 'CENTER'});
  const send = compose.G('Send follow-up', 334, 46, 28, 28, {fill: c.ink});
  icon(send, 'send', 6, 6, 16, c.paper);
}
