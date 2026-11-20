async function drawLinear(frame,a) {
  await a.font('JetBrains Mono','Regular');
  const c = {
    desktop:'#090A0C', chrome:'#141517', sidebar:'#121314', queue:'#0E0F10',
    detail:'#0B0C0E', selected:'#1D1F24', raised:'#17181B', hover:'#202125',
    line:'#26272B', softLine:'#1C1E21', ink:'#F7F8F8', body:'#D0D6E0',
    muted:'#9EA4AE', quiet:'#828892', accent:'#5E6AD2', accentText:'#AEB6FF',
    amber:'#F2C94C', green:'#54BD7B', red:'#EC8083',
  };
  frame.fills=[a.paint(c.desktop)];
  const iconPaths = {
    inbox:'M 1 6 L 3 2 L 11 2 L 13 6 L 13 12 L 1 12 Z M 1 7 L 4 7 L 5 9 L 9 9 L 10 7 L 13 7',
    person:'M 3 12 C 3 9 5 8 7 8 C 9 8 11 9 11 12 M 7 6 C 5.4 6 4.6 5 4.6 3.6 C 4.6 2.2 5.6 1.3 7 1.3 C 8.4 1.3 9.4 2.2 9.4 3.6 C 9.4 5 8.6 6 7 6',
    doc:'M 3 1 L 9 1 L 12 4 L 12 13 L 3 13 Z M 9 1 L 9 4 L 12 4 M 5 7 L 10 7 M 5 9.6 L 10 9.6',
    stack:'M 1 4 L 7 1 L 13 4 L 7 7 Z M 1 7 L 7 10 L 13 7 M 1 10 L 7 13 L 13 10',
    rows:'M 5 3 L 13 3 M 5 7 L 13 7 M 5 11 L 13 11 M 1 3 L 2 3 M 1 7 L 2 7 M 1 11 L 2 11',
    search:'M 9 5.3 C 9 7.5 7.4 9 5.3 9 C 3.2 9 1.5 7.4 1.5 5.3 C 1.5 3.2 3.2 1.5 5.3 1.5 C 7.4 1.5 9 3.2 9 5.3 Z M 8.2 8.2 L 12.6 12.6',
    filter:'M 1 3 L 13 3 M 3.5 7 L 10.5 7 M 6 11 L 8 11',
    left:'M 9 2 L 4 7 L 9 12',
    right:'M 5 2 L 10 7 L 5 12',
    up:'M 7 12 L 7 2 M 2.5 6.5 L 7 2 L 11.5 6.5',
    check:'M 2 7 L 5 10 L 12 3',
    close:'M 3 3 L 11 11 M 11 3 L 3 11',
    collapse:'M 2 7 L 12 7',
  };
  function icon(g,kind,x,y,color=c.muted) {
    return g.P(iconPaths[kind],x,y,null,color,1.25,kind);
  }
  function centerIcon(g,kind,x,y,w,h,color) {
    const node=icon(g,kind,0,0,color);
    node.x=x+(w-node.width)/2;
    node.y=y+(h-node.height)/2;
    return node;
  }
  function centerLine(node,y,h) {
    node.y=y+(h-node.height)/2;
  }
  function mono(g,value,x,y,size=11,color=c.muted,options={}) {
    return g.T(value,x,y,size,{font:'JetBrains Mono|Regular',c:color,...options});
  }
  function text(g,value,x,y,size=13,options={}) {
    return g.T(value,x,y,size,{c:c.body,...options});
  }
  function state(g,x,y,color) {
    return color
      ? g.E(x,y,8,8,color,null,1,'Status dot')
      : g.E(x,y,8,8,null,c.quiet,1.15,'Open status');
  }
  function shortcut(g,value,x,y,w) {
    g.R(x,y,w,21,c.chrome,4,c.line,'Shortcut');
    centerLine(mono(g,value,x,y,10,c.muted,{w,align:'CENTER'}),y,21);
  }

  const window = a.G('Release Audit · macOS window',44,56,1352,828,{fill:c.chrome,r:13,clip:true});
  const titlebar = window.G('macOS title bar',1,1,1350,49,{fill:c.chrome});
  for (const [index,color] of ['#EF746B','#E8B84E','#5AB979'].entries()) {
    titlebar.E(16+20*index,18,11,11,color,null,1,['Close','Minimize','Zoom'][index]);
  }
  titlebar.R(92,12,25,25,c.hover,6,c.line,'Workspace icon background');
  centerIcon(titlebar,'stack',92,12,25,25,'#BBC0CC');
  text(titlebar,'Quarry',128,16,14,{c:c.ink,font:'semibold'});
  titlebar.L(222,0,222,49,c.line);
  text(titlebar,'Release audit',242,16,14,{c:c.ink,font:'medium'});
  icon(titlebar,'right',338,19,c.quiet);
  mono(titlebar,'checkout-web · r2183',362,17,11,c.muted);
  titlebar.R(1165,10,168,28,c.raised,6,c.line,'Release identity');
  state(titlebar,1175,20,c.amber);
  centerLine(mono(titlebar,'RC 2.8.4 · staging',1192,10,10,c.body),10,28);
  window.L(0,50,1352,50,c.line);

  const side = window.G('Workspace navigation',1,51,222,776,{fill:c.sidebar});
  function nav(y,kind,label,extra='',selected=false) {
    if (selected) side.R(10,y,202,32,c.selected,6,null,'Selected navigation row');
    icon(side,kind,19,y+9,selected?c.accentText:c.muted);
    text(side,label,43,y+7,13,{font:selected?'medium':'sans',c:selected?c.ink:c.body});
    if (extra) mono(side,extra,169,y+9,10,selected?c.body:c.quiet,{w:29,align:'RIGHT'});
  }
  nav(17,'inbox','Inbox','8');
  nav(52,'person','Assigned to me','2');
  nav(87,'stack','All changes');
  text(side,'WORKSPACE',20,158,10,{font:'semibold',c:c.quiet,ls:0.75});
  nav(177,'doc','Review rules');
  nav(212,'rows','Review queue','8',true);
  nav(247,'stack','Artifacts');
  text(side,'SAVED VIEWS',20,321,10,{font:'semibold',c:c.quiet,ls:0.75});
  nav(340,'rows','Checkout release');
  nav(375,'rows','Analytics events');
  nav(410,'rows','Staging checks');
  side.L(16,705,206,705,c.line);
  side.E(17,724,29,29,'#2A293A',null,1,'Marin workspace avatar');
  centerLine(mono(side,'MR',17,724,10,'#D5CDF3',{w:29,align:'CENTER'}),724,29);
  text(side,'Marin Rowe',58,724,13,{font:'semibold',c:c.ink});
  text(side,'Release engineering',58,743,11,{c:c.quiet});
  window.L(223,51,223,827,c.line);

  const queue = window.G('Release findings queue',224,51,373,776,{fill:c.queue});
  text(queue,'Review queue',17,16,16,{c:c.ink,font:'semibold'});
  queue.R(282,11,33,29,c.raised,5,c.line,'Find a finding');
  centerIcon(queue,'search',282,11,33,29);
  queue.R(321,11,33,29,c.raised,5,c.line,'Filter findings');
  centerIcon(queue,'filter',321,11,33,29);
  queue.L(0,52,373,52,c.line);
  const queueGroups = [
    {heading:'Needs review',color:null,rows:[
      ['RL-241','Payment decline code mapping','6m'],
      ['RL-240','Receipt date in UTC locales','12m'],
      ['RL-239','Retry button stays enabled','19m'],
    ]},
    {heading:'In progress',color:c.amber,rows:[
      ['RL-238','Duplicate checkout events','Now'],
      ['RL-237','Spinner persists on slow Wi-Fi','24m'],
    ]},
    {heading:'Passed',color:c.green,rows:[
      ['RL-236','Apple Pay cancellation path','31m'],
      ['RL-235','Currency rounding in basket','47m'],
      ['RL-234','Checkout with no stored card','1h'],
    ]},
  ];
  let y=53;
  for (const group of queueGroups) {
    queue.R(0,y,373,33,'#141518',0,null,'Queue status group');
    state(queue,17,y+13,group.color);
    text(queue,group.heading,34,y+8,12,{font:'medium',c:c.body});
    mono(queue,String(group.rows.length),329,y+9,11,c.quiet,{w:24,align:'RIGHT'});
    y+=33;
    for (const [id,entry,time] of group.rows) {
      const isSelected=id==='RL-238';
      if (isSelected) {
        queue.R(0,y,373,47,c.selected,0,null,'Selected finding');
        queue.R(0,y,2,47,c.accent,0,null,'Selection rule');
      }
      state(queue,17,y+19,group.color);
      mono(queue,id,34,y+16,10,isSelected?c.accentText:c.quiet);
      text(queue,entry,95,y+14,12,{font:isSelected?'semibold':'sans',c:isSelected?c.ink:c.body});
      mono(queue,time,320,y+17,10,isSelected?c.body:c.quiet,{w:33,align:'RIGHT'});
      queue.L(0,y+47,373,y+47,c.softLine);
      y+=47;
    }
  }
  mono(queue,'CHECKOUT RELEASE · 8 FINDINGS',17,742,10,c.quiet,{ls:0.65});
  window.L(597,51,597,827,c.line);

  const detail = window.G('Selected finding · RL-238',598,51,753,776,{fill:c.detail});
  mono(detail,'CHECKOUT / ANALYTICS',26,19,10,c.quiet,{ls:1});
  icon(detail,'left',678,18,c.quiet);
  icon(detail,'right',708,18,c.muted);
  text(detail,'Duplicate checkout events',26,50,26,{font:'medium',c:c.ink,ls:-0.5});
  text(detail,'A retry after an accepted order emits checkout_complete a second time.',27,91,14,{w:684,lh:21,c:c.muted});
  state(detail,28,136,c.amber);
  text(detail,'In progress',44,130,12,{font:'medium'});
  text(detail,'Impact',160,130,12,{c:c.quiet});
  text(detail,'Analytics',210,130,12,{font:'medium'});
  text(detail,'Source',304,130,12,{c:c.quiet});
  mono(detail,'staging · r2183',356,132,11,c.body);
  detail.L(26,166,724,166,c.line);

  text(detail,'Event evidence',26,191,15,{font:'semibold',c:c.ink});
  mono(detail,'ORDER TEST-8072',26,218,10,c.quiet,{ls:0.6});
  for (const [ry,time,label,status,color] of [
    [248,'09:41:12.083','initial confirmation','EMITTED',c.green],
    [288,'09:41:12.516','network retry','DUPLICATE',c.red],
  ]) {
    detail.L(26,ry-6,724,ry-6,c.softLine);
    mono(detail,time,26,ry+4,11,c.muted);
    text(detail,label,139,ry+2,13);
    mono(detail,'checkout_complete',354,ry+4,11,c.body);
    mono(detail,status,581,ry+4,10,color);
  }
  detail.L(26,323,724,323,c.line);
  text(detail,'Expected',26,344,12,{font:'semibold',c:c.body});
  text(detail,'One completion event per order, even when the request is retried.',26,367,13,{w:274,lh:19,c:c.muted});
  detail.L(26,432,296,432,c.line);
  text(detail,'Activity',26,454,14,{font:'semibold',c:c.ink});
  const activity = [
    ['09:42','Marin opened RL-238','Attached the staging event trace.'],
    ['09:44','Codex matched 2 events','Both resolve to order TEST-8072.'],
    ['09:45','Regression check passed','Two retries, one completion event.'],
  ];
  for (const [index,[time,title,summary]] of activity.entries()) {
    const top=487+index*73;
    state(detail,28,top+5,index===2?c.green:null);
    text(detail,title,48,top,12,{c:c.body,font:'medium'});
    mono(detail,time,247,top+1,10,c.quiet);
    text(detail,summary,48,top+25,11,{c:c.muted,w:238});
    detail.L(48,top+52,295,top+52,c.softLine);
  }
  const agent = window.G('Floating Agent · Codex',921,391,405,409,{fill:c.raised,r:11,clip:true});
  agent.frame.strokes=[a.paint('#35363D')];
  agent.frame.strokeWeight=1;
  agent.frame.strokeAlign='INSIDE';
  agent.frame.effects=[{type:'DROP_SHADOW',visible:true,blendMode:'NORMAL',color:{r:0,g:0,b:0,a:0.48},offset:{x:0,y:12},radius:28,spread:1}];
  agent.E(14,14,23,23,'#242530','#393C4B',1,'Codex icon');
  centerLine(mono(agent,'C',14,14,11,c.accentText,{w:23,align:'CENTER'}),14,23);
  centerLine(text(agent,'Codex',47,14,14,{font:'semibold',c:c.ink}),14,23);
  centerLine(mono(agent,'RL-238',111,14,10,c.quiet),14,23);
  centerIcon(agent,'collapse',337,14,23,23,c.quiet);
  centerIcon(agent,'close',366,14,23,23,c.quiet);
  agent.L(0,51,405,51,c.line);

  const request = agent.G('Your request',13,65,379,69,{fill:c.hover,r:7});
  text(request,'Check the retry path and draft the smallest safe fix.',12,10,13,{w:351,lh:19,c:c.ink});
  mono(request,'staging-event-trace.json  ·  2 records',12,46,10,c.muted);
  state(agent,14,149,c.green);
  mono(agent,'CHECKS PASSED · 18 S',30,146,10,c.muted,{ls:0.6});
  text(agent,'The retry emitted the same event for TEST-8072. Gate completion by order ID. The regression check now records one event after two retries.',14,172,13,{w:372,lh:19,c:c.body});
  agent.R(13,237,379,45,'#141518',7,'#303238','Patch artifact');
  centerIcon(agent,'doc',20,237,22,45,c.muted);
  centerLine(mono(agent,'checkout-event.patch',47,237,11,c.body),237,45);
  centerLine(mono(agent,'+8',281,237,10,c.green),237,45);
  centerLine(mono(agent,'−2',303,237,10,c.red),237,45);
  centerIcon(agent,'right',353,237,25,45,c.muted);
  agent.R(13,293,135,33,c.accent,6,null,'Review patch');
  centerLine(text(agent,'Review patch',13,293,12,{w:135,align:'CENTER',font:'semibold',c:'#FFFFFF'}),293,33);
  centerLine(text(agent,'1 regression added',161,293,11,{c:c.muted}),293,33);
  agent.L(0,341,405,341,c.line);
  agent.R(13,352,379,42,c.detail,7,c.line,'Continue with Codex');
  centerLine(text(agent,'Ask Codex to revise the patch…',25,352,12,{c:c.quiet}),352,42);
  shortcut(agent,'Enter',313,362.5,35);
  agent.E(355,359,28,28,c.accent,null,1,'Send');
  centerIcon(agent,'up',355,359,28,28,'#FFFFFF');
  const outline=window.R(0,0,1352,828,null,13,'#323439','Window outline');
  outline.strokeAlign='INSIDE';
}
