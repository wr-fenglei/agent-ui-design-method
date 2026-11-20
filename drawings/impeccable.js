async function drawStudy(frame, a) {
  const c = {
    page: '#F2F3EE', ink: '#191D21', muted: '#52605E', blue: '#1A3A8D',
    yellow: '#F3BD35', rule: '#C7CDC6', trace: '#939D98', green: '#276348',
    red: '#8B4434', white: '#FFFFFF', barText: '#E7EDF9'
  };
  frame.fills = [a.paint(c.page)];

  function type(g, str, x, y, size, opts = {}) {
    return g.T(str, x, y, size, {c: c.ink, ...opts});
  }
  function strokeIcon(g, name, x, y, size, color) {
    const paths = {
      arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
      up: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
      down: '<path d="m7 10 5 5 5-5"/>',
      left: '<path d="m15.5 5-7 7 7 7"/>',
      right: '<path d="m8.5 5 7 7-7 7"/>',
      check: '<circle cx="12" cy="12" r="8.25"/><path d="m8.4 12 2.3 2.5 4.9-5.2"/>',
      paper: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M13.5 3.5v4.8H18m-8 4h5.2m-5.2 3h4"/>',
      clip: '<path d="m8.5 12.4 5.2-5.2a2.5 2.5 0 0 1 3.5 3.5l-6.5 6.5a4.1 4.1 0 0 1-5.8-5.8l7.4-7.5"/>'
    };
    return g.SVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="1.65" stroke-linejoin="round" stroke-linecap="round">'+paths[name]+'</svg>', x, y, size, size, name+' icon');
  }
  function crossRule(g, y, width) {
    g.R(0, y, width, 1, c.rule, 0, null, 'Section rule');
  }
  function capsuleNode(g, x, y, active) {
    g.E(x-7, y-7, 14, 14, c.page, active ? c.ink : c.trace, 2.5, 'Event junction');
    g.E(x-2, y-2, 4, 4, active ? c.ink : c.trace, null, 1, 'Junction centre');
  }

  const bar = a.G('Release workspace toolbar', 0, 0, 1440, 62, {fill:c.blue});
  ['#F27872','#F3C467','#70C994'].forEach((color, i) => {
    bar.E(22+i*19, 25, 12, 12, color, null, 1, 'Window control');
  });
  bar.L(101,31,122,31,c.yellow,3);
  bar.E(110,26,10,10,c.white,c.ink,2,'Quarry mark');
  type(bar,'Quarry',134,17,22,{font:'bold',lh:28,c:c.white,ls:-0.6});
  for (const [label,x] of [['Release audit',275],['Agent runs',409]]) {
    type(bar,label,x,22,14,{font:label==='Release audit'?'semibold':'medium',lh:19,c:label==='Release audit'?c.white:c.barText});
  }
  bar.R(275,58,92,3,c.yellow,0,null,'Active workspace');
  type(bar,'checkout-web',1151,22,13,{font:'mono',lh:18,c:c.barText});
  bar.R(1282,21,1,20,'#7389BE',0,null,'Account divider');
  bar.E(1302,15,32,32,'#E3E8F3',null,1,'Marin avatar');
  type(bar,'MR',1302,23,11,{font:'bold',w:32,align:'CENTER',lh:16,c:c.blue});
  strokeIcon(bar,'down',1348,22,16,c.white);

  const heading = a.G('Issue identity and navigation',76,91,1288,113);
  type(heading,'Release audit',0,0,13,{font:'medium',lh:18,c:c.muted});
  strokeIcon(heading,'right',90,4,11,c.muted);
  type(heading,'RL-238',115,0,13,{font:'mono',lh:18,c:c.ink});
  type(heading,'Duplicate checkout events',0,30,38,{font:'bold',lh:46,ls:-1.4});
  heading.E(1,92,8,8,c.yellow,c.ink,1,'Review status');
  type(heading,'Needs review',18,86,13,{font:'medium',lh:20});
  heading.R(116,91,1,11,c.rule);
  type(heading,'checkout-web  /  r2183',133,87,12,{font:'mono',lh:18,c:c.muted});
  for(const [i,name] of ['left','right'].entries()) {
    const g=heading.G(name==='left'?'Previous finding':'Next finding',1210+i*42,37,36,36);
    g.R(0,0,36,36,null,4,c.rule,'Control edge');
    strokeIcon(g,name,9,9,18,c.ink);
  }
  a.R(76,214,1288,1,c.rule,0,null,'Header boundary');

  const left=a.G('Selected trace and event ledger',76,242,861,664);
  type(left,'Event trace',0,0,21,{font:'bold',lh:28,ls:-0.45});
  type(left,'Order TEST-8072',0,34,14,{lh:22,c:c.muted});
  type(left,'2 records',715,5,12,{font:'mono',w:146,lh:18,align:'RIGHT',c:c.muted});

  const plot=left.G('Order accepted / original completion / retry',0,70,861,222);
  const y1=61, y2=149, start=54, fork=308, turn=433, retry=519, end=780;
  plot.L(start,y1,end,y1,c.trace,3);
  // The highlighted branch starts at the original confirmation and ends at the duplicate.
  for(const [color,width] of [[c.ink,7],[c.yellow,3]]) {
    plot.L(fork,y1,turn,y2,color,width);
    plot.L(turn,y2,end,y2,color,width);
  }
  capsuleNode(plot,start,y1,false);
  capsuleNode(plot,fork,y1,true);
  capsuleNode(plot,end,y1,false);
  capsuleNode(plot,retry,y2,true);
  capsuleNode(plot,end,y2,true);
  function nodeLabel(text, nodeX, y, width, size, opts) {
    return type(plot,text,nodeX-width/2,y,size,{...opts,w:width,align:'CENTER'});
  }
  nodeLabel('Order accepted',start,24,108,14,{font:'medium',lh:20});
  nodeLabel('Initial confirmation',fork,24,156,14,{font:'semibold',lh:20});
  nodeLabel('Emitted',end,15,144,14,{font:'semibold',lh:20});
  nodeLabel('09:41:12.083',end,36,144,11,{font:'mono',lh:16,c:c.muted});
  nodeLabel('Network retry',retry,173,130,14,{font:'semibold',lh:20});
  nodeLabel('Duplicate',end,170,144,15,{font:'bold',lh:21});
  nodeLabel('09:41:12.516',end,192,144,11,{font:'mono',lh:16,c:c.muted});
  left.L(0,309,26,309,c.ink,6); left.L(0,309,26,309,c.yellow,2.5);
  type(left,'Retry path',36,299,12,{lh:18,c:c.muted});
  left.L(154,309,180,309,c.trace,3);
  type(left,'Original confirmation',190,299,12,{lh:18,c:c.muted});

  crossRule(left,344,861);
  type(left,'Event records',0,367,21,{font:'bold',lh:28,ls:-0.45});
  const grid=left.G('Two recorded checkout events',0,407,861,120);
  const columns=[['Time',0],['Attempt',189],['Event name',405],['Outcome',695]];
  for (const [title,x] of columns) type(grid,title,x,0,12,{font:'medium',c:c.muted,lh:18});
  crossRule(grid,26,861);
  for (const [i, values] of [
    ['09:41:12.083','Initial confirmation','checkout_complete','Emitted'],
    ['09:41:12.516','Network retry','checkout_complete','Duplicate']
  ].entries()) {
    const y=27+i*44;
    for(let col=0;col<values.length;col++) {
      const mono=col===0||col===2;
      if(col===3)grid.E(columns[col][1],y+19,7,7,i?c.yellow:'#D4E1D5',i?c.ink:c.green,1,'Outcome marker');
      type(grid,values[col],columns[col][1]+(col===3?17:0),y+11,mono?13:14,
        {font:mono?'mono':col===3?'semibold':'sans',lh:22});
    }
  }
  crossRule(left,547,861);
  strokeIcon(left,'check',0,578,23,c.green);
  type(left,'After the patch',35,574,19,{font:'bold',lh:28});
  type(left,'Replaying two retries emitted one completion event for this order.',35,612,14,{lh:22,c:c.muted});

  a.R(955,242,1,664,c.rule,0,null,'Agent column boundary');
  const review=a.G('Agent review and follow-up',977,242,387,664);
  type(review,'Agent review',0,0,21,{font:'bold',lh:28,ls:-0.45});
  type(review,'Marin Rowe',0,54,13,{font:'semibold',lh:19});
  type(review,'09:42',310,55,11,{font:'mono',w:77,lh:16,align:'RIGHT',c:c.muted});
  type(review,'Check the retry path and draft the smallest safe fix.',0,82,14,{w:375,lh:22});
  crossRule(review,127,387);
  type(review,'Quarry Agent',0,149,13,{font:'semibold',lh:19});
  type(review,'09:43',310,150,11,{font:'mono',w:77,lh:16,align:'RIGHT',c:c.muted});
  type(review,'The retry emitted a second completion event after the order had already been accepted.',0,180,14,{w:365,lh:22});
  for(const [i,s] of ['Read the staging trace','Replayed checkout with two retries'].entries()) {
    strokeIcon(review,'check',0,245+i*30,17,c.green);
    type(review,s,26,242+i*30,13,{lh:22});
  }
  crossRule(review,322,387);
  type(review,'Proposed patch',0,346,17,{font:'bold',lh:24});
  strokeIcon(review,'paper',0,395,20,c.ink);
  type(review,'checkout-event.patch',29,394,13,{font:'mono',lh:21});
  type(review,'+8',303,395,12,{font:'mono',lh:19,c:c.green});
  type(review,'−2',345,395,12,{font:'mono',lh:19,c:c.red});
  type(review,'Gate completion by order ID.',0,430,14,{c:c.muted,lh:22});
  const action=review.G('Review proposed patch',0,471,135,38,{fill:c.blue,r:4});
  type(action,'Review patch',13,9,13,{font:'semibold',lh:20,c:c.white});
  strokeIcon(action,'arrow',107,11,17,c.white);

  crossRule(review,552,387);
  type(review,'Follow up',0,574,13,{font:'semibold',lh:19});
  const field=review.G('Follow-up input',0,605,387,48);
  field.R(0,0,387,48,'#FAFAF7',4,'#A9B1AA','Input border');
  strokeIcon(field,'clip',13,15,18,c.muted);
  type(field,'Ask about this patch…',45,13,14,{c:c.muted,lh:22});
  const send=field.G('Send follow-up',344,7,34,34,{fill:'#E1E5DE',r:4});
  strokeIcon(send,'up',8,8,18,c.muted);
}
