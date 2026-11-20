async function drawStudy(frame, a) {
  const families = await figma.listAvailableFontsAsync();
  const face = async (family, style) => {
    const normalize = name => name.toLowerCase().replace(/[^a-z0-9]/g,'');
    const item=families.find(f=>f.fontName.family===family&&normalize(f.fontName.style)===normalize(style));
    if(!item)throw Error('Missing study typeface '+family+' '+style);
    await a.font(item.fontName.family,item.fontName.style);
    return item.fontName.family+'|'+item.fontName.style;
  };
  const [body,medium,semibold,code]=await Promise.all([
    face('IBM Plex Sans','Regular'),face('IBM Plex Sans','Medium'),
    face('IBM Plex Sans','SemiBold'),face('JetBrains Mono','Regular')
  ]);
  const c={
    desk:'#DCE1D8',paper:'#F9FAF5',bar:'#EEF1E9',ink:'#202822',softInk:'#526057',rule:'#D2D8CE',
    dark:'#192123',panel:'#202A2B',wh:'#F1F5EF',muted:'#B9C7C2',dim:'#A8BAB5',edge:'#42514D',
    hot:'#F19886',selected:'#332B29',green:'#9FD3B0',greenInk:'#CBF0D9',greenFill:'#20412F'
  };
  const ctx={issue:'RL-238',svc:'checkout-web',env:'staging',revision:'r2183',order:'TEST-8072',event:'checkout_complete'};
  const items=[
    {time:'09:41:12.083',attempt:'Confirmation',state:'Initial'},
    {time:'09:41:12.516',attempt:'Network retry',state:'Duplicate'}
  ];
  const current=items[1];
  frame.resize(1440,940);frame.fills=[a.paint(c.desk)];
  function t(g,v,x,y,size,opt={}){return g.T(v,x,y,size,{c:c.ink,font:body,lh:size+6,...opt});}
  function m(g,v,x,y,size=13,opt={}){return t(g,v,x,y,size,{font:code,c:c.muted,...opt});}
  function b(g,v,x,y,size,opt={}){return t(g,v,x,y,size,{font:semibold,...opt});}
  const paths={
    layers:'<path d="M2 8l10-5 10 5-10 5zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
    down:'<path d="M6 9l6 6 6-6"/>',
    query:'<path d="M4 6h16M7 12h10M10 18h4"/>',
    fields:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M5 9h4M5 13h4"/>',
    file:'<path d="M5 3h9l5 5v13H5zM14 3v6h5M8 14h8M8 17h6"/>',
    arrow:'<path d="M3 12h15m-6-6l6 6-6 6"/>',
    send:'<path d="M12 20V4m-6 6l6-6 6 6"/>',
    tick:'<path d="m4 12 5 5L21 5"/>',
    paperclip:'<path d="m8 13 7-7a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l8-8"/>',
    reveal:'<path d="m8 5 7 7-7 7"/>',
    terminal:'<path d="m3 6 5 5-5 5m8 1h8"/>',
    person:'<circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/>'
  };
  function icon(g,k,x,y,size,color){
    const html='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="'+color+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths[k]+'</svg>';
    return g.SVG(html,x,y,size,size,k);
  }
  const win=a.G('Quarry incident notebook',32,28,1376,884,{fill:c.paper,r:14,clip:true});
  win.frame.effects=[{type:'DROP_SHADOW',color:a.rgba('#2333252B'),offset:{x:0,y:8},radius:24,spread:0,visible:true,blendMode:'NORMAL'}];
  const top=win.G('Mac title bar',0,0,1376,53,{fill:c.bar});
  [[18,'#C8786F'],[38,'#CEAF62'],[58,'#7DA386']].forEach(([x,color])=>top.E(x,21,10,10,color,null,0,'Window control'));
  top.L(93,16,93,37,'#CCD2C8');
  icon(top,'layers',113,17,18,c.ink);
  b(top,'Quarry',139,13,17,{lh:26,ls:-.25});
  t(top,'/  Release reviews',208,16,14,{c:c.softInk});
  m(top,ctx.svc+'   /   '+ctx.env+' · '+ctx.revision,982,16,12,{w:353,align:'RIGHT',lh:21,c:c.softInk});
  top.L(0,52,1376,52,c.rule);
  const title=win.G('Current release investigation',40,73,1296,106);
  m(title,ctx.issue,0,0,12,{c:c.softInk,lh:18});
  b(title,'Duplicate checkout events',0,23,35,{lh:46,ls:-1.1});
  icon(title,'person',0,81,17,c.softInk);
  b(title,'You',24,77,14,{c:c.softInk,lh:23});
  t(title,'Reproduce the duplicate checkout event and prepare a fix for review.',65,76,16,{lh:25});
  const trace=win.G('Trace results and field inspector',0,206,1376,339,{fill:c.dark});
  b(trace,'Event trace',40,19,22,{c:c.wh,lh:32,ls:-.4});
  m(trace,'staging-event-trace.json',180,28,12,{c:c.muted,lh:18});
  trace.L(965,16,965,323,c.edge);
  const query=trace.G('Event query',40,65,886,37,{fill:c.panel,r:4});
  query.R(0,0,886,37,null,4,c.edge,'Query border');
  icon(query,'query',13,11,16,c.dim);
  m(query,'event',41,9,13,{c:c.dim,lh:20});
  m(query,'=',90,9,13,{c:c.dim,lh:20});
  m(query,ctx.event,109,9,13,{c:c.wh,lh:20});
  m(query,'2 records',756,9,12,{c:c.dim,w:114,lh:20,align:'RIGHT'});
  const tbl=trace.G('Chronological event records',40,119,886,145);
  const cols={time:16,event:231,attempt:469,state:703};
  [
    ['Timestamp',cols.time],['Event',cols.event],['Attempt',cols.attempt],['Finding',cols.state]
  ].forEach(([label,x])=>t(tbl,label,x,0,13,{font:medium,c:c.dim,lh:19}));
  tbl.L(0,29,886,29,c.edge);
  items.forEach((record,i)=>{
    const yy=30+i*53;
    const row=tbl.G(record.attempt+' / '+record.time,0,yy,886,53,{fill:i===1?c.selected:c.dark});
    if(i===1)row.R(0,0,3,53,c.hot,0,null,'Current row');
    m(row,record.time,cols.time,16,14,{c:c.wh,lh:20});
    m(row,ctx.event,cols.event,16,13,{c:c.wh,lh:20});
    t(row,record.attempt,cols.attempt,15,15,{c:c.wh,lh:22});
    row.E(cols.state,23,6,6,i===1?c.hot:c.dim,null,0,'Finding indicator');
    t(row,record.state,cols.state+15,15,15,{font:medium,c:i===1?c.hot:c.muted,lh:22});
    if(i===1)icon(row,'reveal',858,18,15,c.hot);
    row.L(0,52,886,52,c.edge);
  });
  icon(trace,'terminal',40,283,18,c.dim);
  t(trace,'Order',70,281,14,{lh:22,c:c.muted});
  m(trace,ctx.order,113,282,13,{lh:21,c:c.wh});
  t(trace,'emitted twice in 433 ms.',209,281,14,{lh:22,c:c.muted});
  const fields=trace.G('Current log fields',966,0,370,339);
  icon(fields,'fields',20,24,20,c.muted);
  b(fields,'Selected fields',49,19,22,{lh:32,c:c.wh,ls:-.4});
  t(fields,'Network retry',21,67,15,{font:medium,lh:23,c:c.wh});
  m(fields,current.time,21,95,13,{lh:20,c:c.muted});
  fields.L(20,134,369,134,c.edge);
  const linkedFields=[['event',ctx.event],['order',ctx.order],['service',ctx.svc],['environment',ctx.env]];
  linkedFields.forEach(([name,value],i)=>{
    const yy=150+i*37;
    m(fields,name,21,yy,12,{lh:18,c:c.dim});
    m(fields,value,138,yy-1,13,{lh:20,c:c.wh});
  });
  const out=win.G('Agent findings and patch',40,569,1296,194);
  b(out,'Codex findings',0,0,23,{lh:32,ls:-.55});
  t(out,'The retry emitted the same completion a second time. The proposed order-ID gate\nrecords one checkout_complete across two retries.',0,47,16,{lh:25,c:c.ink,w:770});
  const run=out.G('Regression status',0,123,189,29,{fill:c.greenFill,r:4});
  icon(run,'tick',11,7,15,c.green);
  b(run,'Regression passed',34,4,14,{c:c.greenInk,lh:21});
  [['09:42:26','Read trace'],['09:42:31','Reproduced retry'],['09:42:44','Verified gate']].forEach(([time,label],i)=>{
    const x=i*230;
    m(out,time,x,167,12,{c:c.softInk,lh:19});
    t(out,label,x+79,165,13,{lh:22,c:c.ink});
  });
  out.L(855,1,855,164,c.rule);
  b(out,'Patch review',889,0,21,{lh:31});
  t(out,'Awaiting review',1115,6,13,{w:181,align:'RIGHT',lh:20,c:c.softInk});
  icon(out,'file',890,53,20,c.softInk);
  m(out,'checkout-event.patch',922,52,14,{c:c.ink,lh:22});
  m(out,'+8  −2',1204,52,13,{w:92,align:'RIGHT',c:c.softInk,lh:22});
  const human=out.G('Review the proposed patch',889,107,157,40,{fill:'#FFFFFF',r:5});
  human.R(0,0,157,40,null,5,'#5F6E63','Manual review button border').strokeWeight=1.3;
  b(human,'Review patch',16,9,15,{c:c.ink,lh:22});
  icon(human,'arrow',125,11,17,c.ink);
  win.L(40,779,1336,779,c.rule);
  const input=win.G('Continue RL-238',40,804,1296,51,{fill:'#FFFFFF',r:5});
  input.R(0,0,1296,51,null,5,'#B7C2B5','Follow-up field border');
  icon(input,'paperclip',16,16,19,c.softInk);
  t(input,'Ask Codex about this release…',49,12,16,{lh:26,c:c.softInk});
  m(input,ctx.issue,1140,16,12,{c:c.softInk,lh:19});
  const send=input.G('Send follow-up',1249,9,34,34,{fill:c.bar,r:4});
  icon(send,'send',9,9,16,c.ink);
  return {width:1440,height:940};
}
