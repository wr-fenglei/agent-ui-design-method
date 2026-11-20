# 历史 Still 换色试验的构建记录

此页保留当时构建函数的两段摘录和测量记录, 便于核对项目 Linear 基准是否被实际读取

## 输入节点

```js
// Still uses the current Linear board as its sole source of content and geometry.
async function drawInspiration(frame, art) {
  const linear=await figma.getNodeByIdAsync('11:7202');
  if (linear?.type!=='FRAME' || linear.getPluginData('design')!=='linear' ||
      linear.parent.id!==frame.parent.id) throw Error('Linear source artboard missing');
```

## 子节点来源

```js
  const copy=linear.clone();
  try {
    const descendants=copy.findAll();
    const fonts=new Map();
    for(const n of descendants.filter(n=>n.type==='TEXT')){
      for(const f of n.getRangeAllFontNames(0,n.characters.length))fonts.set(f.family+'|'+f.style,f);
    }
    await Promise.all([...fonts.values()].map(f=>figma.loadFontAsync(f)));
    for(const node of descendants) {
      recolor(node,'fills');
      recolor(node,'strokes');
      if(Array.isArray(node.effects) && node.effects.length) {
        node.effects=node.effects.map(e=>e.type==='DROP_SHADOW'
          ? {...e,color:art.rgba('#51526B33')} : e);
      }
    }
    for(const child of copy.children.slice())frame.appendChild(child);
  } finally {
    copy.remove();
  }
}
```

## 当时逐层对读的结果

两份稿在 1440 × 940 画板内比较, 186 个后代图层中有 97 个文字层, 层级, 节点类型, 尺寸, 相对位置, 圆角, 文字和字号相同

| 读数 | 项目 Linear 稿 | 旧 Still 换色稿 |
|---|---:|---:|
| 导航 / 队列 / 详情宽度 | 222 / 373 / 753 px | 222 / 373 / 753 px |
| Review patch 宽高及圆角 | 135 × 33 px, r6 | 135 × 33 px, r6 |
| 文字与按钮底色对比 | 4.70:1 | 7.08:1 |
| 按钮底色与相邻面板对比 | 3.78:1 | 1.48:1 |

读数来自该历史版本的逐层与导出比对, 当前仓库只提供其记录, 已撤下的产品稿未重新发布
