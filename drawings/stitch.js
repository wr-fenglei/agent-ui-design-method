// Westminster Heritage's itinerary, editorial type, and booking panel applied to an event investigation.
async function drawStudy(frame, a) {
  await Promise.all([
    a.font('Noto Serif', 'Bold'), a.font('Noto Serif', 'Regular'),
    a.font('Manrope', 'Regular'), a.font('Manrope', 'Bold'),
  ]);
  const C = {
    surface:'#F8FAFB', rail:'#F0F3F4', tint:'#E8ECEF', white:'#FFFFFF',
    ink:'#000A1E', navy:'#07182D', muted:'#53616B', light:'#C2CEDA', red:'#BB021F',
    redInk:'#A3001D', rule:'#CDD5DA', green:'#286248',
  };
  const font = {headline:'Noto Serif|Bold', serif:'Noto Serif|Regular',
    ui:'Manrope|Regular', strong:'Manrope|Bold', mono:'mono'};
  const txt = (g, s, x, y, size, options={}) =>
    g.T(s,x,y,size,{font:font.ui,c:C.ink,lh:Math.round(size*1.5),...options});
  function mid(g,s,x,top,width,height,size,options={}) {
    const node=txt(g,s,x,top,size,{w:width,align:'CENTER',...options});
    node.y=top+(height-node.height)/2;
    return node;
  }
  function outline(node,color) {
    node.strokes=[a.paint(color)];node.strokeWeight=1;node.strokeAlign='INSIDE';
  }
  const paths={
    overview:'<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>',
    trace:'<path d="M2.5 12h4l3-7 4.5 14 3-7h4.5"/>',
    file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 13h6m-6 3h4"/>',
    release:'<path d="m4 8 8-5 8 5v9l-8 5-8-5zM4 8l8 5 8-5m-8 5v9"/>',
    folder:'<path d="M3 8V5h6l2 2h10v13H3V8Z"/>',
    branch:'<circle cx="7" cy="5" r="2.3"/><circle cx="7" cy="19" r="2.3"/><circle cx="17" cy="6" r="2.3"/><path d="M7 7.5v9m10-8C17 12 13 13 7 13"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    chevron:'<path d="m9 6 6 6-6 6"/>',
    menu:'<path d="M5 8h14M5 12h10M5 16h14"/>',
    arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
    submit:'<path d="M12 19V5m-6 6 6-6 6 6"/>',
    check:'<path d="m5 12 4.5 4.5L19 7"/>',
    clip:'<path d="m8 13 6.6-6.6a3 3 0 0 1 4.3 4.3l-8.7 8.7a5 5 0 0 1-7.1-7.1L12.5 3"/>',
    code:'<path d="m7.5 7-5 5 5 5m9-10 5 5-5 5m-3-13-3 16"/>',
    test:'<path d="M8 3h8M10 3v5l-6 10a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3L14 8V3m-6 12h8"/>',
  };
  function icon(g,key,x,y,size,color=C.muted){
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.65">'+paths[key]+'</svg>';
    return g.SVG(svg,x,y,size,size,key+' icon');
  }

  frame.resize(1440,940);frame.fills=[a.paint(C.surface)];
  const chrome=a.G('Mac window title bar',0,0,1440,36,{fill:'#E8ECEE'});
  ['#EE746B','#E8B651','#68B880'].forEach((color,i)=>chrome.E(18+20*i,12,12,12,color));
  mid(chrome,'Quarry',520,0,400,36,12,{font:font.strong,c:C.muted});

  const rail=a.G('Workspace navigation',0,36,196,904,{fill:C.rail});
  txt(rail,'Quarry',24,25,31,{font:font.headline,lh:44,ls:-1.4});
  txt(rail,'Release engineering',25,72,12,{c:C.muted,lh:18});
  const nav=[
    ['Overview','overview'],['Investigations','trace'],['Patch archive','file'],['Releases','release'],
  ];
  nav.forEach(([name,shape],i)=>{
    const y=132+i*45,selected=i===1;
    const row=rail.G(name,12,y,172,37,{r:5,fill:selected?C.white:null});
    if(selected)row.R(0,9,3,19,C.red,1.5,null,'Current view');
    icon(row,shape,12,10,17,selected?C.red:C.muted);
    txt(row,name,42,8,13,{lh:21,font:selected?font.strong:font.ui,c:selected?C.ink:C.muted});
  });
  txt(rail,'Projects',24,382,12,{font:font.strong,c:C.muted,lh:18});
  icon(rail,'folder',24,422,17);txt(rail,'Checkout',54,419,13,{lh:22});
  icon(rail,'folder',24,462,17);txt(rail,'Billing',54,460,13,{lh:22,c:C.muted});
  const account=rail.G('Workspace account',20,830,156,50);
  account.E(0,6,34,34,'#DDE4E8');mid(account,'MR',0,6,34,34,11,{font:font.strong,c:'#374752'});
  txt(account,'Marin Rowe',45,5,12,{font:font.strong,lh:18});
  txt(account,'Maintainer',45,24,11,{c:C.muted,lh:16});

  const header=a.G('Case navigation',196,36,1244,62,{fill:C.white});
  txt(header,'Checkout',40,20,14,{font:font.strong,lh:22});
  icon(header,'chevron',122,25,12,C.muted);
  txt(header,'Release 2.8.4',149,20,14,{lh:22,c:C.muted});
  const search=header.G('Search workspace',1008,13,196,36,{fill:C.surface,r:5});
  icon(search,'search',12,9,17);txt(search,'Search',39,8,12,{lh:19,c:C.muted});
  mid(search,'⌘ K',147,4,39,28,11,{font:font.strong,c:C.muted});

  const title=a.G('Release finding',236,127,1160,143);
  txt(title,'Release finding',0,0,12,{font:font.strong,lh:18,c:C.muted});
  txt(title,'/',94,0,12,{c:C.muted,lh:18});
  txt(title,'RL-238',110,0,12,{font:font.mono,lh:18,c:C.muted});
  txt(title,'Duplicate checkout events',0,30,36,{font:font.headline,lh:48,ls:-.85});
  txt(title,'A network retry sent a second checkout event for the same order.',1,89,15,{lh:24,c:C.muted});

  const ledger=a.G('Ordered event trace',236,297,772,250);
  txt(ledger,'Event trace',0,0,25,{font:font.headline,lh:36,ls:-.4});
  txt(ledger,'TEST-8072  /  staging',540,10,11,{font:font.mono,lh:17,w:232,align:'RIGHT',c:C.muted});
  ledger.R(8,87,2,122,C.rule,0,null,'Time between emissions');
  function record(y,time,trigger,state,error=false) {
    const dot=ledger.E(4,y+30,10,10,error?C.red:C.navy,null,1,'Event node');
    dot.strokes=[a.paint(C.surface)];dot.strokeWeight=3;dot.strokeAlign='OUTSIDE';
    const row=ledger.G(trigger,36,y,736,72,{fill:C.white,r:6});
    txt(row,time,16,14,13,{font:font.mono,lh:20});
    txt(row,trigger,16,38,12,{c:C.muted,lh:18});
    txt(row,'checkout_complete',215,23,15,{font:font.strong,lh:24});
    txt(row,state,555,25,12,{font:font.strong,lh:20,c:error?C.redInk:C.muted,w:160,align:'RIGHT'});
  }
  record(52,'09:41:12.083','Initial confirmation','Emitted');
  txt(ledger,'433 ms later',36,138,12,{lh:18,c:C.muted});
  record(174,'09:41:12.516','Network retry','Duplicate',true);

  const discussion=a.G('Agent conversation',236,583,772,219);
  txt(discussion,'Investigation notes',0,0,25,{font:font.headline,lh:36,ls:-.4});
  function author(g,label,x,y,avatar,background) {
    g.E(x,y,28,28,background);
    mid(g,avatar,x,y,28,28,10,{font:font.strong,c:background===C.navy?C.white:C.ink});
    txt(g,label,x+40,y+4,13,{font:font.strong,lh:20});
  }
  author(discussion,'Marin Rowe',0,57,'MR','#E1E7E9');
  txt(discussion,'Find the duplicate emission, prepare a patch and rerun the retry test.',40,87,15,{w:718,lh:24});
  author(discussion,'Quarry Agent',0,138,'Q',C.navy);
  txt(discussion,'The retry used a new event key. I reused the original key and reran the check. Two retries now produce one event.',40,169,15,{w:718,lh:24});

  const compose=a.G('Continue the investigation',236,829,772,66,{fill:C.white,r:7});
  outline(compose.frame,'#C7D0D5');
  icon(compose,'clip',16,24,18);
  txt(compose,'Ask Quarry a follow-up…',49,21,15,{lh:24,c:C.muted});
  const send=compose.G('Send follow-up',720,15,36,36,{r:18,fill:C.navy});icon(send,'submit',9,9,18,C.white);

  const review=a.G('Patch review',1054,297,320,381,{fill:C.navy,r:8});
  txt(review,'Patch review',24,22,25,{font:font.headline,lh:36,ls:-.4,c:C.white});
  txt(review,'Prepared by Quarry Agent',24,63,12,{c:C.light,lh:18});
  icon(review,'file',24,115,20,C.light);
  txt(review,'checkout-event.patch',55,111,15,{font:font.strong,lh:24,c:C.white});
  txt(review,'Reuse the order’s event key when a checkout request is retried.',24,151,14,{w:271,lh:23,c:'#E3E9EE'});
  txt(review,'Retry verification',24,224,13,{font:font.strong,c:C.white,lh:20});
  icon(review,'check',201,228,15,'#B8DFC9');
  txt(review,'Passed',222,224,12,{font:font.strong,c:'#CAE6D6',lh:20});
  txt(review,'2 retries / 1 event',24,252,14,{font:font.mono,lh:22,c:C.white});
  const cta=review.G('Review patch',24,313,272,44,{fill:C.red,r:6});
  const ctaLabel=txt(cta,'Review patch',0,0,14,{font:font.strong,lh:20,c:C.white});
  const groupW=ctaLabel.width+10+16;
  // Manrope's rendered ink sits below its line box; center this fixed label and arrow optically.
  ctaLabel.x=(272-groupW)/2+1;ctaLabel.y=(44-ctaLabel.height)/2-1;
  icon(cta,'arrow',ctaLabel.x+ctaLabel.width+10,14,16,C.white);

  const files=a.G('Files in patch',1054,716,320,119);
  txt(files,'Files in patch',0,0,19,{font:font.headline,lh:28,ls:-.2});
  icon(files,'code',0,50,17);txt(files,'checkout/emit.ts',29,47,13,{font:font.mono,lh:21});
  icon(files,'test',0,87,17);txt(files,'checkout/retry.test.ts',29,84,13,{font:font.mono,lh:21});
}
