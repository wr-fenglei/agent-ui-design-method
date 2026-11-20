// Native drawing primitives. Layout, type scales, color, imagery and interaction belong to each individual study.
async function makeArt(frame,assetDictionary={}){
  const defaults={sans:['Inter','Regular'],medium:['Inter','Medium'],semibold:['Inter','Semi Bold'],bold:['Inter','Bold'],serif:['Georgia','Regular'],serifBold:['Georgia','Bold'],italic:['Georgia','Italic'],mono:['IBM Plex Mono','Regular'],zh:['PingFang SC','Regular'],zhBold:['PingFang SC','Semibold']};
  const loaded={};
  async function font(family,style='Regular'){
    const id=family+'|'+style;
    if(!loaded[id]){await figma.loadFontAsync({family,style});loaded[id]={family,style};}return loaded[id];
  }
  await Promise.all(Object.values(defaults).map(([f,s])=>font(f,s)));
  function rgba(hex){
    const h=hex.replace(/^#/,'');const v=h.length===3?h.split('').map(c=>c+c).join(''):h;
    if(!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v))throw Error('Invalid color '+hex);
    return {r:parseInt(v.slice(0,2),16)/255,g:parseInt(v.slice(2,4),16)/255,b:parseInt(v.slice(4,6),16)/255,a:v.length===8?parseInt(v.slice(6),16)/255:1}
  }
  function paint(c){if(typeof c==='object')return c;const {r,g,b,a}=rgba(c);return {type:'SOLID',color:{r,g,b},opacity:a}}
  function gradient(stops,direction='h'){
    const transform=direction==='h'?[[1,0,0],[0,1,0]]:direction==='v'?[[0,1,0],[-1,0,1]]:[[0.7,0.7,-0.2],[-0.7,0.7,0.5]];
    return{type:'GRADIENT_LINEAR',gradientTransform:transform,gradientStops:stops.map(([position,c])=>({position,color:rgba(c)}))};
  }
  const images={};
  function scoped(parent){
    function at(n,name,x,y){parent.appendChild(n);n.name=name;n.x=x;n.y=y;return n}
    function fill(n,f,stroke,sw=1){n.fills=f?[paint(f)]:[];n.strokes=stroke?[paint(stroke)]:[];if(stroke)n.strokeWeight=sw}
    function R(x,y,w,h,f,r=0,stroke=null,name='Surface'){const n=at(figma.createRectangle(),name,x,y);n.resize(w,h);n.cornerRadius=r;fill(n,f,stroke);return n}
    function E(x,y,w,h,f,stroke=null,sw=1,name='Ellipse'){const n=at(figma.createEllipse(),name,x,y);n.resize(w,h);fill(n,f,stroke,sw);return n}
    function T(value,x,y,size=16,o={}){
      const n=at(figma.createText(),o.name||String(value).split('\n')[0],x,y);
      const family=o.font||(/[\u2e80-\u9fff]/.test(value)?'zh':'sans');const key=defaults[family]?defaults[family].join('|'):family;
      if(!loaded[key])throw Error('Font not loaded '+key+'; call await a.font(family,style) first');
      n.fontName=loaded[key];n.fontSize=size;n.characters=String(value);
      if(o.w!=null){n.textAutoResize='HEIGHT';n.resize(o.w,n.height)}else n.textAutoResize='WIDTH_AND_HEIGHT';
      if(o.lh!=null)n.lineHeight={unit:'PIXELS',value:o.lh};
      if(o.ls!=null)n.letterSpacing={unit:'PIXELS',value:o.ls};
      if(o.align)n.textAlignHorizontal=o.align;
      n.fills=[paint(o.c||'#171719')];
      return n;
    }
    function P(data,x,y,f=null,stroke=null,sw=1,name='Vector'){
      const n=figma.createVector();parent.appendChild(n);n.name=name;n.vectorPaths=[{windingRule:'NONZERO',data}];n.x=x;n.y=y;fill(n,f,stroke,sw);n.strokeCap='ROUND';n.strokeJoin='ROUND';return n;
    }
    function L(x1,y1,x2,y2,c='#555555',sw=1){const x=Math.min(x1,x2),y=Math.min(y1,y2);return P('M '+(x1-x)+' '+(y1-y)+' L '+(x2-x)+' '+(y2-y),x,y,null,c,sw,'Rule')}
    function G(name,x,y,w,h,{clip=false,fill=null,r=0}={}){const g=at(figma.createFrame(),name,x,y);g.resize(w,h);g.cornerRadius=r;g.clipsContent=clip;g.fills=fill?[paint(fill)]:[];return scoped(g)}
    function IMG(key,x,y,w,h,{r=0,mode='FILL',name=key}={}){if(!images[key]){const b=assetDictionary[key];if(!b)throw Error('Missing asset '+key); images[key]=figma.createImage(figma.base64Decode(b)).hash}const n=R(x,y,w,h,null,r,null,name);n.fills=[{type:'IMAGE',imageHash:images[key],scaleMode:mode}];return n}
    function SVG(xml,x,y,w,h,name='Illustration'){const n=figma.createNodeFromSvg(xml);parent.appendChild(n);n.name=name;const sx=n.width,sy=n.height;if(w&&h){const k=w/sx;n.rescale(k);if(Math.abs(n.height-h)>0.5)n.resize(w,h)}else if(w)n.rescale(w/sx);else if(h)n.rescale(h/sy);n.x=x;n.y=y;return n}
    return {R,E,T,P,L,G,IMG,SVG,font,gradient,paint,rgba,frame:parent};
  }
  return scoped(frame);
}
