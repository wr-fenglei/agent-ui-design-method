async function drawStudy(frame, a) {
  const palette = {
    sidebar: '#303236', railText: '#E3E4E5', railMuted: '#A9AAAE',
    ink: '#343638', quiet: '#65676A', metadata: '#696B6E', red: '#A64E52',
    line: '#E2E2E3', selected: '#F4F4F5', paper: '#FFFFFF', green: '#397258'
  };
  frame.fills = [a.paint(palette.paper)];
  const icons = {
    panel: '<rect x="3" y="4.5" width="18" height="15" rx="2.3"/><path d="M9 5v14"/>',
    note: '<path d="M6.5 3.5h8l3.8 3.8v12a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 19.3V5a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M14.5 3.8v4h3.6M8.5 12h6.7M8.5 15.7h5.4"/>',
    search: '<circle cx="10.4" cy="10.4" r="6.2"/><path d="m15.2 15.2 4.8 4.8"/>',
    inbox: '<path d="m5.5 5-3 11v2.5h19V16l-3-11h-13Z"/><path d="M3 15h5.1l1.8 2h4.2l1.8-2h5.2"/>',
    pin: '<path d="m8 5 7.2-2.1-.8 4.3 3.1 3.4L9 13.2l.7-4.4L8 5ZM10.8 12.8l-3.4 7"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11h14V8M10 12h4"/>',
    tag: '<path d="M3.5 4h7.3l9.8 9.7-6.7 6.8-10.4-10V4Z"/><circle cx="7.5" cy="7.7" r="1"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    edit: '<path d="M12 5H5a1.8 1.8 0 0 0-1.8 1.8v12A1.8 1.8 0 0 0 5 20.6h12a1.8 1.8 0 0 0 1.8-1.8v-7"/><path d="m10 14 1-3.7 7.9-7.8 2.2 2.2-7.9 7.9-3.2 1.4Z"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v6"/><circle cx="12" cy="7.3" r=".75" fill="currentColor" stroke="none"/>',
    more: '<circle cx="5" cy="12" r="1.45" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.45" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.45" fill="currentColor" stroke="none"/>',
    clip: '<path d="m8.3 14.8 7.9-7.9a2 2 0 0 0-2.8-2.8L5 12.5a4.1 4.1 0 1 0 5.8 5.8l8.7-8.7"/>',
    check: '<path d="m4.9 11.6 4.6 4.6 9.6-9.7"/>',
    arrow: '<path d="M12 19V5M6.4 10.6 12 5l5.6 5.6"/>',
    upRight: '<path d="M6 18 18 6M7 6h11v11"/>',
    patch: '<path d="M5.5 3.5h8l5 5v11a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5ZM13.5 4v5H18"/><path d="M8 13h5M10.5 10.5v5M12 17.4h4"/>',
    gear: '<path d="m9.8 3-.5 2-2 .9-1.8-1.1-2 3.4L5 9.7l-.1 2.4-1.5 1.3 2 3.6 2-.6 2 .9.5 2h4.2l.6-2 2-.9 1.8.7 2-3.6-1.5-1.4V9.7l1.5-1.4-2-3.5-1.8 1.1-2-.9-.6-2Z"/><circle cx="12" cy="11.4" r="3.2"/>'
  };
  function icon(target, name, x, y, size, color) {
    const geometry = icons[name].replace(/currentColor/g, color);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + (1.5 * 24 / size) + '" stroke-linecap="round" stroke-linejoin="round">' + geometry + '</svg>';
    return target.SVG(svg, x, y, size, size, 'Icon · ' + name);
  }
  function tool(target, name, x, y, color) {
    const box = target.G('Control · ' + name, x, y, 32, 32);
    icon(box, name, 7, 7, 18, color);
  }
  function label(target, value, x, y, size, opts = {}) {
    return target.T(value, x, y, size, {c: palette.ink, ...opts});
  }
  const rail = a.G('Sidebar · Notebook collections', 0, 0, 196, 940, {fill: palette.sidebar});
  ['#F36B69', '#EABF55', '#69BF67'].forEach((c, i) => rail.E(19+i*20,20,12,12,c,null,0,'Window control'));
  tool(rail, 'panel', 151, 9, palette.railMuted);
  label(rail, 'Quarry', 17, 66, 26, {font:'semibold',c:'#FAFAFA',lh:33,ls:-0.8});
  label(rail, 'Library', 18, 139, 12, {font:'semibold',c:palette.railMuted,lh:18});
  function libraryRow(value, symbol, y, active = false) {
    if (active) rail.R(9,y,178,34,'#484A4D',6,null,'Selected collection');
    icon(rail,symbol,19,y+9,16,active?'#F1F2F2':palette.railMuted);
    label(rail,value,47,y+7,14,{font:active?'medium':'sans',lh:20,c:palette.railText});
  }
  libraryRow('Investigations','note',167,true);
  libraryRow('Inbox','inbox',205);
  libraryRow('Pinned','pin',243);
  libraryRow('Archive','archive',281);
  label(rail, 'Tags', 18, 367, 12, {font:'semibold',lh:18,c:palette.railMuted});
  libraryRow('Checkout','tag',395);
  libraryRow('Payments','tag',433);
  libraryRow('Reliability','tag',471);
  rail.L(16,869,180,869,'#4B4D50');
  rail.E(18,890,30,30,'#56595C',null,0,'Workspace avatar');
  label(rail,'Q',18,895,14,{font:'semibold',lh:20,w:30,align:'CENTER',c:'#FBFBFB'});
  label(rail,'Workspace',58,895,13,{font:'medium',lh:20,c:palette.railText});
  tool(rail,'gear',150,889,palette.railMuted);

  const list = a.G('List · Investigations',196,0,286,940,{fill:palette.paper});
  label(list,'Investigations',18,24,19,{font:'semibold',lh:27,ls:-0.45});
  tool(list,'edit',209,21,palette.quiet);
  tool(list,'search',246,21,palette.quiet);
  function period(text,y){label(list,text,20,y,12,{font:'semibold',lh:18,c:palette.metadata});}
  function note(y,title,blurb,stamp,active=false) {
    const entry=list.G('Note · '+title,10,y,266,111);
    if(active){
      entry.R(0,0,266,111,palette.selected,5,null,'Selected note surface');
      entry.R(0,5,3,101,'#AC5054',1.5,null,'Selection edge');
    }
    label(entry,title,12,11,15,{font:'semibold',lh:22,w:246,ls:-0.2});
    label(entry,blurb,12,39,13,{lh:19,c:palette.quiet,w:242});
    label(entry,stamp,12,85,11.5,{lh:16,c:palette.metadata});
    if(!active) entry.L(12,110,252,110,palette.line);
  }
  period('Today',81);
  note(108,'Duplicate checkout events','One checkout, two deliveries of the\nsame analytics event.','RL-238   ·   09:43',true);
  note(229,'Receipt delivery delay','Comparing acknowledgement times\nacross the receipt queue.','RL-237   ·   08:20');
  period('Yesterday',376);
  note(405,'Refund status mismatch','The receipt and the billing ledger\nreported different states.','RL-233   ·   Yesterday');
  note(520,'Webhook delivery order','A replay reached the listener\nahead of the original callback.','RL-229   ·   Yesterday');
  const doc = a.G('Document · RL-238',482,0,958,940,{fill:palette.paper});
  a.L(482,0,482,940,palette.line);
  const left=76;
  const measure=806;
  icon(doc,'note',left,26,16,palette.metadata);
  label(doc,'RL-238',left+24,25,12,{font:'mono',lh:18,c:palette.metadata});
  tool(doc,'info',864,17,palette.quiet);
  tool(doc,'more',903,17,palette.quiet);
  label(doc,'Duplicate checkout events',left,85,38,{font:'bold',lh:48,ls:-1.45});
  label(doc,'Quarry Agent',left+44,153,13,{font:'semibold',lh:19});
  label(doc,'Edited today at 09:43',left+44,172,12,{lh:18,c:palette.metadata});
  doc.E(left,155,30,30,'#F2EBE9',null,0,'Quarry Agent avatar');
  label(doc,'Q',left,160,14,{font:'semibold',lh:20,c:palette.red,w:30,align:'CENTER'});

  const request=doc.G('User request',left,216,measure,61);
  request.R(0,3,3,50,'#DBC6C5',1.5,null,'Quoted request');
  label(request,'You asked',16,0,12,{font:'semibold',lh:18,c:palette.metadata});
  label(request,'Find out why one checkout produced two analytics events.',16,23,16,{lh:25});
  label(doc,'What happened',left,300,20,{font:'semibold',lh:28,ls:-0.5});
  label(doc,'I replayed the checkout and traced both deliveries. The network retry sent the same\ncheckout_complete event a second time, before the first acknowledgement arrived.',left,340,16,{lh:25,w:measure});
  label(doc,'Delivery trace',left,421,20,{font:'semibold',lh:28,ls:-0.5});
  const trace=doc.G('Evidence · Original delivery trace',left,462,measure,110);
  trace.R(0,0,measure,110,palette.paper,4,palette.line,'Table border');
  trace.R(1,1,measure-2,33,'#F5F5F6',3,null,'Table header');
  [34,72].forEach(y=>trace.L(0,y,measure,y,palette.line));
  [188,485].forEach(x=>trace.L(x,0,x,110,palette.line));
  [['Time',14],['Event',202],['Delivery',499]].forEach(([v,x])=>label(trace,v,x,8,12,{font:'semibold',lh:18,c:palette.quiet}));
  function delivery(y,time,action){
    label(trace,time,14,y,13,{font:'mono',lh:20});
    label(trace,'checkout_complete',202,y,13,{font:'mono',lh:20});
    label(trace,action,499,y,14,{lh:20});
  }
  delivery(43,'09:41:12.083','Initial submission');
  delivery(81,'09:41:12.516','Network retry');
  label(doc,'Proposed fix',left,608,20,{font:'semibold',lh:28,ls:-0.5});
  label(doc,'Reuse the event ID on retry so collection records each checkout once.',left,645,16,{lh:25});
  const patch=doc.G('Artifact · checkout-event.patch',left,692,measure,52);
  patch.L(0,0,measure,0,palette.line);
  patch.L(0,51,measure,51,palette.line);
  icon(patch,'patch',1,16,19,palette.quiet);
  label(patch,'checkout-event.patch',31,16,14,{font:'mono',lh:20});
  const action=patch.G('Action · Review patch',measure-127,10,127,32);
  action.R(0,0,127,32,'#FFFFFF',6,'#D8D1D1','Button border');
  label(action,'Review patch',10,6,13,{font:'medium',lh:20,w:89,align:'CENTER',c:palette.red});
  icon(action,'upRight',102,9,14,palette.red);
  doc.E(left,764,19,19,'#EAF2ED',null,0,'Passed test status');
  icon(doc,'check',left+3.5,767.5,12,palette.green);
  label(doc,'TEST-8072 passed',left+29,763,13,{font:'semibold',lh:20});
  label(doc,'2 retries produced 1 checkout_complete event.',left+29,789,14,{lh:21,c:palette.quiet});

  const reply=doc.G('Composer · Continue investigation',left,855,measure,51);
  reply.R(0,0,measure,51,'#FAFAFA',9,'#DEDEDF','Entry field');
  tool(reply,'clip',9,9,palette.metadata);
  label(reply,'Ask a follow-up…',52,14,15,{lh:22,c:palette.quiet});
  const send=reply.G('Send follow-up',measure-43,9,32,32);
  send.R(0,0,32,32,'#E9E8E8',8,null,'Send control');
  icon(send,'arrow',7,7,18,palette.quiet);
}
