const pageName='Mac Agent · 十个来源对照';
let page=figma.root.children.find(p=>p.name===pageName);
if(!page){if(role!=='spec')throw Error('Publish specifications first');page=figma.createPage();page.name=pageName;page.setPluginData('tenSourceStudy','1');page.backgrounds=[{type:'SOLID',color:{r:.88,g:.89,b:.89}}];}
if(page.getPluginData('tenSourceStudy')!=='1')throw Error('Wrong destination page');
await page.loadAsync();
let section=page.children.find(s=>s.type==='SECTION'&&s.getPluginData('study')===key);
if(!section){
 if(role!=='spec')throw Error('Missing specification section');
 section=figma.createSection();page.appendChild(section);section.name=info.name;section.setPluginData('study',key);
 section.resizeWithoutConstraints(3000,1250);
 section.fills=[{type:'SOLID',color:{r:.93,g:.94,b:.93}}];
}
const find=role=>section.children.find(n=>n.getPluginData('role')===role);
if(role==='design' && find('spec')?.getPluginData('digest')!==specDigest)throw Error('Publish the current specification before its screen');
const old=find(role);
const stage=figma.createFrame();section.appendChild(stage);stage.resize(1440,940);stage.clipsContent=true;
try{
 const a=await makeArt(stage,assets);
 if(role==='spec'){await drawReferenceSheet(stage,a,info,imageInfo);}else{await drawStudy(stage,a);}
 if(!stage.children.length)throw Error('Empty board');
 const fontIssue=stage.findOne(n=>n.type==='TEXT'&&n.characters.trim()&&(n.hasMissingFont||n.width<=0));
 if(fontIssue)throw Error('Missing font in '+fontIssue.name);
 const n=old||stage;
 if(old){const stale=old.children.slice();old.resizeWithoutConstraints(stage.width,stage.height);old.fills=stage.fills;old.effects=stage.effects;old.strokes=stage.strokes;old.clipsContent=stage.clipsContent;for(const c of stage.children.slice())old.appendChild(c);for(const c of stale)c.remove();stage.remove();}
 n.name=info.name+' · '+(role==='spec'?'参考素材与设计规范':info.direction);
 n.setPluginData('role',role);n.setPluginData('study',key);n.setPluginData('digest',specDigest);
 n.x=role==='spec'?1520:40;n.y=66;
 section.resizeWithoutConstraints(3000,Math.max(...section.children.map(c=>c.y+c.height))+40);
 let rowY=0;for(let i=0;i<order.length;i+=2){
  const pair=order.slice(i,i+2).map(k=>page.children.find(s=>s.type==='SECTION'&&s.getPluginData('study')===k));
  pair.forEach((s,j)=>{if(s){s.x=j*3144;s.y=rowY;}});
  rowY+=Math.max(0,...pair.map(s=>s?.height||0))+144;
 }
 figma.commitUndo();return {page:page.id,section:section.id,id:n.id,size:[n.width,n.height],nodes:n.findAll(()=>true).length,role};
}catch(error){if(!stage.removed)stage.remove();throw error;}
