async function drawStudy(frame, a) {
  const color = {
    backdrop: '#1B1F22', window: '#141618', header: '#191B1D', raised: '#1B1E20',
    field: '#202326', selected: '#25282C', line: '#292D31', border: '#353A3F', controlEdge: '#69737B',
    paper: '#ECEBE6', ink: '#1D2022', text: '#F0F0EC', body: '#D1D4D5',
    quiet: '#A3ABAD', glyph: '#B7BFC1', incident: '#F0BE7A', incidentGround: '#3D3021',
    pass: '#8BD2AA', passGround: '#23372F', codeKey: '#9DBDD1', codeValue: '#D6DDBB',
  };
  const event = 'checkout_complete';
  const order = 'TEST-8072';
  const trace = [
    { time: '09:41:12.083', status: 'Initial', attempt: 1 },
    { time: '09:41:12.516', status: 'Duplicate', attempt: 2 },
  ];
  const current = trace[1];
  const patch = 'checkout-event.patch';

  frame.resize(1440, 940);
  frame.fills = [a.paint(color.backdrop)];
  const win = a.G('Quarry desktop window', 28, 28, 1384, 884, {fill:color.window, r:17, clip:true});
  win.frame.strokes = [a.paint(color.border)];
  win.frame.strokeAlign = 'INSIDE';
  win.frame.strokeWeight = 1;
  win.frame.effects = [{type:'DROP_SHADOW', color:a.rgba('#080A0D6B'), offset:{x:0,y:12}, radius:35, spread:0, visible:true, blendMode:'NORMAL'}];

  function text(g, label, x, y, size, options = {}) {
    return g.T(label, x, y, size, {lh:size+6, c:color.text, ...options});
  }
  function mono(g, label, x, y, size, options = {}) {
    return text(g, label, x, y, size, {font:'mono', ...options});
  }
  function stroke(node, shade = color.border) {
    node.strokes = [a.paint(shade)];
    node.strokeWeight = 1;
    node.strokeAlign = 'INSIDE';
  }
  function surface(g, name, x, y, w, h, {fill=color.raised, edge=color.border, r=6, clip=false} = {}) {
    const group = g.G(name, x, y, w, h, {fill,r,clip});
    if (edge) stroke(group.frame, edge);
    return group;
  }
  const iconPaths = {
    'Chevron right':'M 0 0 L 4 4 L 0 8',
    'Chevron down':'M 0 0 L 4 4 L 8 0',
    'Search':'M 5.4 0 C 8.382 0 10.8 2.418 10.8 5.4 C 10.8 8.382 8.382 10.8 5.4 10.8 C 2.418 10.8 0 8.382 0 5.4 C 0 2.418 2.418 0 5.4 0 Z M 9.3 9.3 L 13 13',
    'Copy':'M 5 0 L 13 0 Q 14 0 14 1 L 14 9 Q 14 10 13 10 L 5 10 Q 4 10 4 9 L 4 1 Q 4 0 5 0 Z M 0 5 L 0 13 Q 0 14 1 14 L 9 14',
    'Document':'M 2 0 L 8 0 L 13 5 L 13 15 Q 13 17 11 17 L 2 17 Q 0 17 0 15 L 0 2 Q 0 0 2 0 Z M 8 0 L 8 5 L 13 5 M 3 9 L 10 9 M 3 13 L 8 13',
    'Check':'M 0 4 L 3 7 L 10 0',
    'Send':'M 6 13 L 6 0 M 0 6 L 6 0 L 12 6',
  };
  function icon(g, name, x, y, shade=color.glyph, weight=1.5) {
    return g.P(iconPaths[name], x, y, null, shade, weight, name);
  }
  function badge(g, label, x, y, w, bg, fg) {
    const b = g.G(label+' status', x, y, w, 22, {fill:bg, r:4});
    text(b, label, 0, 3, 11, {font:'medium', lh:16, w, align:'CENTER', c:fg});
  }
  function mark(group, name) {
    group.frame.setPluginData('sample', name);
  }

  const bar = win.G('Window title and run navigation', 0, 0, 1384, 52, {fill:color.header});
  [[23,'#D27B72'],[43,'#C7AB62'],[63,'#76A68D']].forEach(([x,c])=>bar.E(x,21,10,10,c,null,0,'Window control'));
  text(bar,'Quarry',104,16,15,{font:'semibold',lh:20});
  bar.L(171,15,171,37,color.border);
  text(bar,'Runs',190,17,13,{c:color.quiet,lh:18});
  icon(bar,'Chevron right',233,22,color.quiet,1.25);
  mono(bar,'RL-238',250,17,13,{lh:18});
  text(bar,'Staging environment',1158,17,13,{w:194,align:'RIGHT',c:color.body,lh:18});
  win.L(0,52,1384,52,color.line);

  const title = win.G('Task title and context', 32, 76, 1320, 82);
  text(title,'Duplicate checkout events',0,0,34,{font:'semibold',lh:43,ls:-.8});
  mono(title,'checkout-web',0,53,13,{lh:20,c:color.body});
  title.L(113,56,113,69,color.border);
  text(title,'Order',129,53,13,{lh:20,c:color.quiet});
  mono(title,order,175,53,13,{lh:20,c:color.body});

  const evidence = win.G('Trace triage workspace', 32, 182, 1320, 354);
  const index = evidence.G('Event index', 0, 0, 464, 354);
  text(index,'Trace events',0,0,21,{font:'semibold',lh:28,ls:-.32});
  const query = surface(index, 'Filter by event', 0, 40, 305, 34, {fill:color.field,edge:color.controlEdge});
  icon(query,'Search',11,10.5,color.quiet,1.4);
  mono(query,event,34,8,13,{lh:18,c:color.body});
  const result = surface(index, 'Select event outcome', 315, 40, 149, 34, {fill:color.field,edge:color.controlEdge});
  text(result,'All outcomes',11,8,13,{lh:18,c:color.body});
  icon(result,'Chevron down',128,15,color.quiet,1.4);

  const table = surface(index,'Two recorded checkout events',0,90,464,136,{fill:color.window,r:7,clip:true});
  table.R(0,0,464,36,color.raised,0,null,'Column headings surface');
  const fields = [[16,'Time'],[126,'Event'],[328,'Outcome']];
  for (const [x,label] of fields) text(table,label,x,9,12,{font:'medium',lh:18,c:color.quiet});
  for (const [i,record] of trace.entries()) {
    const y = 36+i*50;
    const active = record === current;
    const row = table.G(record.status+' event / '+record.time,1,y,462,50,{fill:active?color.selected:color.window});
    row.L(0,0,462,0,color.border);
    if (active) row.R(0,6,2,37,color.quiet,1,null,'Selection rail');
    mono(row,record.time,15,15,12,{lh:20,c:active?color.text:color.body});
    mono(row,event,125,15,12,{lh:20,c:active?color.text:color.body});
    badge(row,record.status,327,14,active?82:56,active?color.incidentGround:color.field,active?color.incident:color.body);
    icon(row,'Chevron right',437,21,color.quiet,1.25);
  }
  mark(table,'refero-event-index');
  icon(index,'Document',1,253,color.quiet,1.3);
  mono(index,'staging-event-trace.json',26,252,13,{lh:19,c:color.body});
  text(index,'The retry arrived 433 ms after the first event.',0,292,14,{lh:21,c:color.quiet});

  evidence.L(488,0,488,354,color.line);
  const detail = evidence.G('Selected request inspector', 512, 0, 808, 354);
  text(detail,'Selected event',0,0,14,{font:'medium',lh:20,c:color.quiet});
  mono(detail,current.time,634,0,13,{w:174,align:'RIGHT',lh:20,c:color.body});
  mono(detail,event,0,26,24,{lh:31});
  text(detail,'Retry attempt',0,75,12,{lh:18,c:color.quiet});
  mono(detail,String(current.attempt),91,74,13,{lh:20});
  detail.L(130,74,130,94,color.border);
  text(detail,'Source',148,75,12,{lh:18,c:color.quiet});
  mono(detail,'checkout-web',203,74,13,{lh:20,c:color.body});
  const request = surface(detail,'Trace request body',0,117,808,217,{fill:color.raised,r:8,clip:true});
  text(request,'Request body',16,13,14,{font:'semibold',lh:20});
  const copy = surface(request,'Copy request body',716,9,80,28,{fill:color.field,r:5});
  icon(copy,'Copy',10,7,color.body,1.2);
  text(copy,'Copy',34,5,12,{lh:18,c:color.body});
  request.L(0,45,808,45,color.line);
  const raw = [
    ['{'],
    ['  "event": '+JSON.stringify(event)+',', 'event'],
    ['  "order_id": '+JSON.stringify(order)+',', 'order_id'],
    ['  "emitted_at": '+JSON.stringify(current.time)+',', 'emitted_at'],
    ['  "attempt": '+current.attempt+',', 'attempt'],
    ['  "service": "checkout-web"', 'service'],
    ['}'],
  ];
  for (const [i,[line,key]] of raw.entries()) {
    const code = mono(request,line,18,56+22*i,13,{lh:22,c:color.body});
    if (key) {
      const keyEnd = 2+key.length+2;
      const tail = line.endsWith(',')?line.length-1:line.length;
      code.setRangeFills(2,keyEnd,[a.paint(color.codeKey)]);
      code.setRangeFills(keyEnd+2,tail,[a.paint(color.codeValue)]);
    }
  }
  mark(request,'refero-request-body');

  win.L(32,557,1352,557,color.line);
  const investigation = win.G('Agent conversation and run evidence',32,578,731,221);
  text(investigation,'Agent investigation',0,0,21,{font:'semibold',lh:28,ls:-.32});
  text(investigation,'You',0,47,13,{font:'medium',lh:20,c:color.quiet});
  text(investigation,'Reproduce the duplicate checkout event and prepare a patch.',80,45,15,{w:651,lh:22,c:color.body});
  text(investigation,'Codex',0,89,13,{font:'medium',lh:20,c:color.quiet});
  text(investigation,'A network retry emitted the same checkout completion again for TEST-8072. I added an order-ID gate and verified the retry behavior.',80,86,15,{w:635,lh:22,c:color.text});
  investigation.L(0,148,731,148,color.line);
  const tools = [
    ['09:42:26','Read staging trace'],
    ['09:42:31','Reproduced retry'],
    ['09:42:44','Verified order-ID gate'],
  ];
  for (const [i,[time,step]] of tools.entries()) {
    const x = i*250;
    if (i) investigation.L(x-18,167,x-18,204,color.line);
    mono(investigation,time,x,165,12,{lh:18,c:color.quiet});
    text(investigation,step,x,189,14,{lh:20,c:color.body});
  }
  win.L(786,578,786,800,color.line);

  const review = win.G('Regression and human review', 809, 578, 543, 221);
  text(review,'Regression and patch',0,0,21,{font:'semibold',lh:28,ls:-.32});
  badge(review,'Passed',0,47,66,color.passGround,color.pass);
  mono(review,'09:42:44',403,47,12,{w:140,align:'RIGHT',lh:22,c:color.quiet});
  text(review,'Two retries produced one checkout_complete event.',0,78,14,{lh:22,c:color.body});
  const artifact = surface(review,'Patch ready for human review',0,116,543,70,{fill:color.raised,r:8});
  const doc = surface(artifact,'Patch document glyph',12,17,36,36,{fill:color.field,r:6,edge:null});
  icon(doc,'Document',11.5,9.5,color.glyph,1.4);
  mono(artifact,patch,62,15,13,{lh:19});
  text(artifact,'Awaiting review',62,40,12,{lh:18,c:color.quiet});
  const reviewButton = surface(artifact,'Review patch button',405,17,126,36,{fill:color.paper,edge:null,r:7});
  text(reviewButton,'Review patch',0,7,13,{w:126,align:'CENTER',font:'semibold',lh:20,c:color.ink});
  mark(artifact,'refero-patch-review');
  const composer = surface(win,'Continue this investigation',32,819,1320,45,{fill:color.raised,edge:color.controlEdge,r:8});
  text(composer,'Ask about this investigation…',14,11,14,{lh:22,c:color.quiet});
  const send = surface(composer,'Send follow-up',1278,6.5,32,32,{fill:color.field,r:6});
  icon(send,'Send',10,9.5,color.glyph,1.4);
  return {width:1440,height:940};
}
