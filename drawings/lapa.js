async function drawStudy(frame, a) {
  const c = {
    paper: '#FDFCF9', margin: '#F7F7F4', ink: '#292927', body: '#444642',
    soft: '#646761', line: '#DADBD4', dark: '#282A2A', nav: '#E2E2D9',
    hint: '#B5B9B2', selected: '#383B39', accent: '#CD786B', label: '#924735',
    warm: '#EDBD9E', ok: '#386248', okBg: '#E6EEE5', inset: '#F4F3ED'
  };
  frame.resize(1440, 940);
  frame.fills=[a.paint(c.paper)];
  const nav=a.G('Quarry notebook index',0,0,202,940,{fill:c.dark});
  const page=a.G('Investigation document',202,0,870,940,{fill:c.paper});
  const margin=a.G('Agent discussion in the page margin',1072,0,368,940,{fill:c.margin});

  const shapes={
    folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9H3z"/>',
    search:'<circle cx="10" cy="10" r="5.8"/><path d="m14.5 14.5 4.3 4.3"/>',
    book:'<path d="M4 3.5h12.5a2 2 0 0 1 2 2v15H6.3A2.3 2.3 0 0 1 4 18.2zm0 14.8A2.3 2.3 0 0 1 6.4 16H18.5M8 4v12"/>',
    page:'<path d="M6 3.5h8l4 4v13H6zM14 3.5v5h4M9 13h6M9 16h5"/>',
    code:'<path d="M5 3h9l5 5v13H5zM14 3v6h5M10.5 12l-2 2 2 2m3-4 2 2-2 2"/>',
    branch:'<circle cx="7" cy="5" r="2"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="7" r="2"/><path d="M7 7v10m0-3h4a6 6 0 0 0 6-5"/>',
    thread:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8m-8 3h5"/>',
    note:'<path d="M4 5h16v11H9l-5 4z"/>',
    left:'<path d="m14.5 6-6 6 6 6"/>', right:'<path d="m9.5 6 6 6-6 6"/>',
    external:'<path d="M6 18 18 6M7 6h11v11"/>',
    panel:'<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M14.5 5v14"/>',
    check:'<path d="m5 12.4 4.3 4.3L19 6.5"/>',
    send:'<path d="M12 18V6m-5 5 5-5 5 5"/>',
    clip:'<path d="m8.5 12.8 6.6-6.6a3 3 0 1 1 4.2 4.2L10 19.7a4.8 4.8 0 1 1-6.8-6.8l9.2-9.2"/>',
    hash:'<path d="m10 4-3 16m10-16-3 16M4 9h16M3 15h16"/>',
    clock:'<circle cx="12" cy="12" r="8.1"/><path d="M12 7v5l3 2"/>',
    plus:'<path d="M12 5v14M5 12h14"/>'
  };
  function icon(scope,kind,x,y,sz=16,col=c.soft) {
    scope.SVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="'+col+'" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+shapes[kind]+'</svg>',x,y,sz,sz,kind+' icon');
  }
  function label(s,text,x,y,size=14,opt={}) {
    return s.T(text,x,y,size,{font:'sans',c:c.ink,lh:20,...opt});
  }
  function withRule(s,x,y,width,color=c.line) {
    s.R(x,y,width,1,color,0,null,'Section rule');
  }
  function anchor(scope,x,y) {
    scope.R(x,y,30,23,'#FEF1E8',5,'#D9A98E','Comment reference');
    icon(scope,'note',x+5,y+5,13,c.label);
    label(scope,'1',x+19,y+4,10,{c:c.label,lh:15,font:'medium'});
  }
  function dots(scope,x,y,col) {
    [0,5,10].forEach(offset=>scope.E(x+offset,y,2.4,2.4,col));
  }
  // Notebook index
  ['#EE7770','#E6B75D','#78B583'].forEach((color,i)=>nav.E(22+i*20,23,11,11,color));
  icon(nav,'book',20,79,27,c.nav);
  label(nav,'Quarry',58,76,23,{c:'#F8F8F0',lh:32,font:'semibold',ls:-0.7});
  icon(nav,'search',23,141,16,c.hint);
  label(nav,'Find in notebook',51,138,13,{c:c.nav,lh:21});
  withRule(nav,20,181,162,'#454846');
  label(nav,'Notebook',22,204,12,{c:c.hint,lh:18,font:'medium'});
  icon(nav,'folder',22,243,17,c.nav);
  label(nav,'Investigations',51,240,14,{c:'#F2F2EA',font:'semibold'});
  icon(nav,'folder',22,279,17,c.hint);
  label(nav,'Release notes',51,276,14,{c:c.nav});
  icon(nav,'folder',22,315,17,c.hint);
  label(nav,'Archive',51,312,14,{c:c.nav});
  label(nav,'Recent investigations',22,385,12,{c:c.hint,lh:18,font:'medium'});
  nav.R(0,414,202,65,c.selected,0,null,'Selected investigation');
  nav.R(0,430,3,32,c.accent,0,null,'Selected entry marker');
  label(nav,'RL-238',22,423,11,{c:'#E3A292',font:'mono',lh:16});
  label(nav,'Checkout events',22,444,14,{c:'#FAFAF1',font:'semibold'});
  label(nav,'RL-237',22,496,11,{c:c.hint,font:'mono',lh:16});
  label(nav,'Receipt timestamps',22,517,14,{c:c.nav});
  label(nav,'RL-236',22,566,11,{c:c.hint,font:'mono',lh:16});
  label(nav,'Card authorization',22,587,14,{c:c.nav});
  withRule(nav,20,858,162,'#454846');
  nav.E(21,880,34,34,'#444946');
  label(nav,'M',21,887,13,{w:34,align:'CENTER',font:'semibold',c:'#F4F3EC',lh:20});
  label(nav,'Marin Rowe',66,879,13,{font:'medium',c:'#F4F3EC',lh:19});
  label(nav,'Release engineering',66,900,11,{c:c.hint,lh:16});

  // The notebook page has its own title bar and an uninterrupted reading column.
  icon(page,'book',28,23,16);
  label(page,'Investigations',53,20,13,{c:c.soft});
  icon(page,'right',146,25,12);
  label(page,'RL-238',166,21,12,{c:c.ink,font:'mono'});
  icon(page,'panel',817,21,20);
  withRule(page,0,62,870);
  const x=88,w=694;
  icon(page,'folder',x,109,16,c.soft);
  label(page,'Release notebook',x+24,106,13,{c:c.soft,font:'medium'});
  label(page,'Duplicate checkout events',x,147,42,{font:'serif',ls:-1.45,lh:50});
  label(page,'RL-238',x,220,12,{c:c.soft,font:'mono'});
  page.E(x+67,228,3,3,'#92958F');
  label(page,'checkout-web',x+81,220,12,{c:c.soft,font:'mono'});
  page.E(x+189,228,3,3,'#92958F');
  label(page,'staging',x+203,220,12,{c:c.soft,font:'mono'});
  label(page,'The checkout succeeded. When the browser retried the same order, analytics recorded a second completion.',x,263,16,{w:650,c:c.body,lh:26});

  const evidence=page.G('Event evidence table',x,353,w,196);
  label(evidence,'Event evidence',0,0,25,{font:'serif',lh:34,ls:-0.4});
  label(evidence,'TEST-8072',w-130,6,12,{w:130,align:'RIGHT',c:c.soft,font:'mono'});
  const cols=[10,155,362];
  withRule(evidence,0,45,w);
  ['Time','Event','Trigger'].forEach((name,i)=>label(evidence,name,cols[i],55,12,{c:c.soft,font:'medium',lh:18}));
  withRule(evidence,0,82,w);
  const eventRows=[
    ['09:41:12.083','checkout_complete','Order accepted'],
    ['09:41:12.516','checkout_complete','Network retry']
  ];
  eventRows.forEach(([time,event,trigger],i)=>{
    let y=82+i*44;
    label(evidence,time,cols[0],y+12,12,{c:c.body,font:'mono',lh:20});
    label(evidence,event,cols[1],y+12,12,{c:c.ink,font:'mono',lh:20});
    if(i===1) evidence.R(cols[2],y+33,89,3,c.warm,0,null,'Commented evidence underline');
    label(evidence,trigger,cols[2],y+11,14,{c:c.ink,lh:22});
    if(i===1) anchor(evidence,w-40,y+10);
    withRule(evidence,0,y+44,w);
  });

  const change=page.G('Patch and regression evidence',x,576,w,271);
  label(change,'Proposed change',0,0,25,{font:'serif',lh:34,ls:-0.4});
  label(change,'Record the completion against the order ID before a retry can emit it again.',0,47,16,{w:650,lh:26,c:c.body});
  const file=change.G('Patch file',0,102,w,58,{fill:c.inset,r:5});
  icon(file,'code',15,18,22,c.soft);
  label(file,'checkout-event.patch',49,17,14,{font:'mono',lh:24,c:c.ink});
  label(file,'+8',w-101,19,12,{font:'mono',c:c.ok});
  label(file,'−2',w-64,19,12,{font:'mono',c:'#9A4B3C'});
  change.E(0,186,21,21,c.okBg);
  icon(change,'check',3,189,15,c.ok);
  label(change,'Regression check passed',31,185,14,{font:'semibold',lh:22,c:c.ok});
  label(change,'Two retries produced one completion event for TEST-8072.',31,214,15,{c:c.body,lh:23});
  withRule(page,x,870,w);
  icon(page,'clock',x,891,14);
  label(page,'Last updated at 09:45',x+22,888,12,{c:c.soft});

  // Margin annotations stay outside the document reading measure.
  margin.R(0,0,1,940,c.line);
  icon(margin,'thread',27,23,17,c.body);
  label(margin,'Agent discussion',55,19,15,{font:'semibold',lh:24});
  dots(margin,321,30,c.soft);
  withRule(margin,0,62,368);
  const sx=28,threadW=312;
  label(margin,'Network retry',sx,108,23,{font:'serif',lh:31,ls:-0.45});
  const ref=margin.G('Selected evidence reference',sx,158,threadW,62);
  ref.R(0,0,3,55,c.warm);
  label(ref,'checkout_complete',14,1,13,{font:'mono',lh:21});
  label(ref,'09:41:12.516',14,27,11,{c:c.soft,font:'mono',lh:18});
  anchor(ref,threadW-31,0);
  withRule(margin,sx,228,threadW);
  function author(y,name,initial,fill,ink,time) {
    margin.E(sx,y,29,29,fill);
    label(margin,initial,sx,y+4.5,13,{w:29,align:'CENTER',font:'semibold',c:ink,lh:20});
    label(margin,name,sx+41,y+3,14,{font:'semibold',lh:21});
    label(margin,time,sx+threadW-54,y+5,11,{w:54,align:'RIGHT',font:'mono',c:c.soft,lh:18});
  }
  author(254,'Marin Rowe','M','#E5E7DE','#4D5948','09:42');
  label(margin,'Find out why a retry records two checkout events, then prepare a patch.',sx,301,15,{w:threadW,c:c.body,lh:24});
  author(387,'Quarry Agent','Q','#EFDCD2','#833F31','09:45');
  label(margin,'I matched the two records to the same order. The retry reached the analytics call 433 ms after the first completion.',sx,434,15,{w:threadW,c:c.body,lh:24});
  label(margin,'I added a guard keyed to the order ID and replayed the retry twice. The order now emits one event.',sx,530,15,{w:threadW,c:c.body,lh:24});
  const button=margin.G('Review patch action',sx,626,146,38,{fill:'#313633',r:5});
  label(button,'Review patch',14,9,13,{font:'semibold',lh:20,c:'#FFFFFF'});
  icon(button,'external',115,11,16,'#FFFFFF');
  const composer=margin.G('Continue the agent discussion',sx,830,threadW,72);
  composer.R(0,0,threadW,72,'#FDFCF9',6,'#C5C7BD','Composer outline');
  label(composer,'Ask a follow-up…',13,10,14,{c:c.soft,lh:21});
  icon(composer,'clip',13,43,16,c.soft);
  composer.E(threadW-40,32,28,28,'#E6E8DF');
  icon(composer,'send',threadW-35,37,18,c.body);
}
