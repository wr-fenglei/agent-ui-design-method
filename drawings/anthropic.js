async function drawStudy(frame, art) {
  const c = {
    paper:'#F8F6EF', ink:'#222822', body:'#424C43', quiet:'#575F57', line:'#DAD9CE',
    green:'#204F43', warm:'#965021', white:'#FFFFFF', field:'#FCFBF7'
  };
  frame.fills=[art.paint(c.paper)];
  function t(g, value, x, y, size, cfg={}) {
    return g.T(value,x,y,size,{font:'sans',lh:Math.round(size*1.4),c:c.ink,...cfg});
  }
  function centered(g, value, x, y, w, h, size, opts) {
    const n=t(g,value,x,0,size,{...opts,w,align:'CENTER'});
    n.y=y+(h-n.height)/2;
    return n;
  }
  function icon(g, glyph, x, y, size, tone, label) {
    const strokes={
      previous:'M 11 4 L 5 10 L 11 16 M 5 10 L 17 10',
      arrow:'M 4 10 L 16 10 M 11 5 L 16 10 L 11 15',
      up:'M 10 16 L 10 4 M 4 10 L 10 4 L 16 10',
      attach:'M 8 14 L 14.5 7.5 C 16 6 16 4.5 14.7 3.2 C 13.4 1.9 11.9 2.1 10.5 3.5 L 3.8 10.2 C 1.6 12.4 1.8 15.4 3.7 17 C 5.5 18.8 8.5 18.6 10.2 16.9 L 17.3 9.8 M 7 12.2 L 12.2 7',
      check:'M 4 10 L 8 14 L 16 5',
      file:'M 5 2 L 12 2 L 16 6 L 16 18 L 5 18 Z M 12 2 L 12 7 L 16 7 M 7.5 11 L 13.5 11 M 7.5 14 L 12 14',
      index:'M 3 5 L 5 5 M 8 5 L 17 5 M 3 10 L 5 10 M 8 10 L 17 10 M 3 15 L 5 15 M 8 15 L 17 15',
      more:'M 4 10 L 4.5 10 M 9.8 10 L 10.3 10 M 15.6 10 L 16.1 10'
    };
    g.SVG('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20"><path d="'+strokes[glyph]+'" fill="none" stroke="'+tone+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',x,y,size,size,label);
  }
  function rule(g,x,y,w) {g.R(x,y,w,1,c.line,0,null,'Section boundary');}

  const top=art.G('Quarry / Release journal',0,0,1440,69);
  for(const [i,tone] of ['#CE7465','#D8AD55','#73A488'].entries())
    top.E(24+19*i,28,11,11,tone,null,1,'macOS window control');
  t(top,'QUARRY',111,23,15,{font:'bold',c:c.green,ls:2.6,lh:21});
  top.R(225,26,1,16,c.line,0,null,'Workspace separator');
  t(top,'Release journal',246,23,15,{font:'serif',lh:22,c:c.body});
  icon(top,'index',1121,26,16,c.quiet,'Review index');
  t(top,'All reviews',1149,24,13,{font:'medium',c:c.body,lh:19});
  top.E(1272,17,34,34,'#E9EBE2',null,1,'Account surface');
  centered(top,'MR',1272,17,34,34,10,{font:'semibold',lh:14,c:c.green,ls:0.25});
  rule(top,0,68,1440);

  const page=art.G('Release case / RL-238',304,105,832,790);
  const hero=page.G('Case heading',0,0,832,162);
  t(hero,'RL-238',0,0,12,{font:'mono',lh:18,c:c.quiet,ls:0.45});
  hero.R(71,9,32,1,c.warm,0,null,'Editorial separator');
  t(hero,'CHECKOUT WEB',120,0,12,{font:'medium',lh:18,c:c.quiet,ls:1.1});
  t(hero,'Duplicate checkout events',-2,31,48,{font:'serifBold',lh:57,ls:-1.4});
  t(hero,'A network retry emitted a second completion event for order TEST-8072.',0,107,21,
    {font:'serif',lh:30,c:c.body,w:832});

  const request=page.G('Original request / Marin Rowe',0,167,832,82);
  rule(request,0,0,832);
  request.E(0,20,40,40,art.gradient([[0,'#AB6130'],[1,'#315646']],'d'),null,1,'Marin Rowe avatar');
  centered(request,'MR',0,20,40,40,14,{font:'semibold',c:c.white,lh:20});
  t(request,'Marin Rowe',55,18,14,{font:'semibold',lh:20});
  t(request,'Check the retry path and draft the smallest safe fix.',55,42,15,{font:'serif',lh:22,c:c.body});
  t(request,'09:42',764,27,11,{font:'mono',lh:17,c:c.quiet,w:68,align:'RIGHT'});
  rule(request,0,81,832);

  const trace=page.G('Event evidence / TEST-8072',0,278,832,162);
  t(trace,'Event evidence',0,0,24,{font:'serifBold',lh:30,ls:-0.4});
  t(trace,'2 records',726,8,12,{font:'mono',c:c.quiet,w:106,align:'RIGHT',lh:17});
  function evidenceRow(y,values,isHeader) {
    const xs=[0,172,371,672];
    for(const [i,value] of values.entries()){
      if(isHeader) {t(trace,value,xs[i],y,11,{font:'medium',lh:16,c:c.quiet,ls:0.5});continue;}
      const isOutcome=i===3,duplicate=value==='Duplicate';
      if(isOutcome)trace.E(xs[i],y+7,6,6,duplicate?c.warm:c.green,null,1,value+' indicator');
      t(trace,value,xs[i]+(isOutcome?15:0),y,i===0||i===2?13:14,
        {font:i===0||i===2?'mono':isOutcome?'medium':'sans',lh:20,c:isOutcome?(duplicate?c.warm:c.green):c.ink});
    }
  }
  evidenceRow(47,['TIME','TRIGGER','EVENT','RESULT'],true);
  rule(trace,0,72,832);
  evidenceRow(84,['09:41:12.083','Order accepted','checkout_complete','Emitted'],false);
  evidenceRow(120,['09:41:12.516','Network retry','checkout_complete','Duplicate'],false);
  rule(trace,0,155,832);

  const response=page.G('Codex / Investigation and patch',0,464,832,204);
  t(response,'Codex',0,0,24,{font:'serifBold',lh:30,ls:-0.4});
  const status=response.G('Regression status',0,5,139,21);
  icon(status,'check',0,2,16,c.green,'Regression passed');
  const passed=t(status,'Checks passed',24,0,13,{font:'medium',lh:20,c:c.green});
  status.frame.resizeWithoutConstraints(passed.x+passed.width,21);
  status.frame.x=832-status.frame.width;
  t(response,'I traced both emissions to the same accepted order. The patch checks its ID before emitting checkout_complete again.',0,41,17,
    {font:'serif',lh:26,c:c.body,w:760});
  t(response,'Replayed 2 retries',0,112,13,{font:'medium',lh:19,c:c.quiet});
  icon(response,'arrow',133,114,15,c.quiet,'Replay produced');
  t(response,'1 event emitted',160,112,13,{font:'semibold',lh:19,c:c.green});
  const patch=response.G('Patch artifact and review',0,148,832,55);
  rule(patch,0,0,832);
  icon(patch,'file',0,20,19,c.body,'Patch file');
  t(patch,'checkout-event.patch',32,19,13,{font:'mono',lh:20});
  t(patch,'+8',239,19,12,{font:'mono',lh:20,c:c.green});
  t(patch,'−2',273,19,12,{font:'mono',lh:20,c:c.warm});
  const approve=patch.G('Review patch',681,11,151,38,{fill:c.green,r:7});
  t(approve,'Review patch',18,8,13,{font:'semibold',lh:20,c:c.white});
  icon(approve,'arrow',117,9,18,c.white,'Open patch');

  const follow=page.G('Follow up with Codex',0,700,832,74,{fill:c.field,r:7});
  follow.frame.strokes=[art.paint('#BDBEB1')];follow.frame.strokeWeight=1;follow.frame.strokeAlign='INSIDE';
  icon(follow,'attach',17,25,20,c.quiet,'Attach context');
  t(follow,'Ask Codex about this patch…',52,24,15,{font:'sans',lh:23,c:c.quiet});
  const send=follow.G('Send follow-up',781,19,36,36,{fill:'#E7EBE2',r:18});
  icon(send,'up',8,8,20,c.green,'Send');
}
