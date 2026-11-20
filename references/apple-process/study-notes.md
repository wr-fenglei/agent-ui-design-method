# Apple 原稿研究板 · 可搜索的笔记

这份笔记保留制作原稿时用过的 13 项材料和 92 条记录, 可以搜索“选中行”“工具组”或“折射”, 回到来源查同一项取值, 表内的本稿是 Apple 风格的 Quarry 原稿, 全窗稿在此基础上改变了背景层 [完整研究板](board.png) · [全窗做法](../../cases/apple-glass.md)

## 参考实物

| 材料 | 当时从中观察了什么 |
|---|---|
| [音乐 · macOS 27 贴边侧栏](https://developer.apple.com/videos/play/wwdc2026/102/?time=1434) | 23:54, Home 选中行使用中性底色, 左栏上、下、左边缘和窗口相接, 后方封面颜色进入侧栏 |
| [备忘录 · 深色工具栏](https://developer.apple.com/design/human-interface-guidelines/toolbars) | 顶部胶囊将同类图标放在同一底面, 右侧更多菜单悬在内容上方, 中部笔记保持平整深色底 |
| [Paste Stack · 浮动队列](https://pasteapp.io/blog/paste-stack) | 队列覆盖发票窗口与橙色桌面, 外沿随背景变色, 列表项内部保持白底, 撤销、更多和关闭位于标题右侧 |
| [iA Writer 8 · 文档窗口](https://ia.net/topics/search-to-navigate) | 左侧保留文件层级, 正文连续, 导航、格式和搜索分成小组, 作者菜单在当前上下文就地展开 |
| [Things 3.22 · 侧栏与排程弹层](https://culturedcode.com/things/blog/2025/09/things-for-os-26/) | 后窗侧栏透出冷色, 前窗项目区保持白底, 黑色日期面板在选中任务旁展开, 作者在 2026-09-14 发布 3.24 并记录玻璃调整, 本图对应 3.22 |
| [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) | 原生运行几何记录, 非系统材质截图, 图形会话锁定, 尺寸来自实际 AppKit 视图树, 标注图用于校准几何 |
| [Figma · 折射与模糊对照](proof.png) | 标线位置对照普通底板、背景模糊与 GLASS 折射, 通过同一区域的导出像素验证 |
| [地图 · macOS 27 的地图与控件](https://developer.apple.com/videos/play/wwdc2026/289/?time=904) | 15:04, 左侧导航边缘与窗口相接, 航拍底图延续至背后, 右侧缩放、图层和地图模式分别成组 |
| [地图 · macOS 26 的内缩侧栏](https://developer.apple.com/videos/play/wwdc2025/310/?time=322) | 05:22, 桥梁地图延伸到窗口边框, 浮置导航与窗口左、上、下边缘留有间隙, 可与 27 版对照 |
| [App Store · 深色侧栏取色](https://developer.apple.com/videos/play/wwdc2025/310/?time=363) | 06:03, Arcade 封面中的红蓝色渗入左侧与下方悬浮元素, 侧栏文字和搜索仍可读 |
| [Paste · 剪贴板建议](https://pasteapp.io/updates) | 横向候选栏与邮件并列, 相邻卡片显示链接、图片和文本, 标题与来源分别位于卡片内部 |
| [Tahoe Day · 系统桌面画面](tahoe-day.jpg) | 本机 Tahoe Day 系统桌面第 4 秒的湖景, 取出的画面为 1600 × 899 px, 用于窗口后面的桌面 |
| [Figma · 1× 字体渲染对照](font-proof.png) | 14 px 的同一测试串, 当时环境中的 SF Pro 无字形输出, Helvetica Neue Regular 导出 332 个高于阈值的像素 |

## 研究依据

这里的 42 条分别来自平台资料、设计套件、应用实图、本机布局树和 Figma 导出, 阅读时保留各自的状态与单位

### Apple 平台指引

| 要查什么 | 原板记录 | 依据 |
|---|---|---|
| 密集文字浮层的材质 | Regular | [Apple HIG · Materials](https://developer.apple.com/design/human-interface-guidelines/materials#Liquid-Glass) |
| 媒体控制的材质 | Clear 可保留后方图片或视频细节 | [Apple HIG · Materials](https://developer.apple.com/design/human-interface-guidelines/materials#Liquid-Glass) |
| 较亮媒体背景的衬底 | 需要增强 Clear 控件对比时, 可加约 35% 不透明黑色衬底 | [Apple HIG · Materials](https://developer.apple.com/design/human-interface-guidelines/materials#Liquid-Glass) |
| 导航后方的背景来源 | 从实际内容区域延展, 为前景文字保留安全区 | [Apple · Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass) |
| 选中侧栏项目字重 | macOS 27 使用 Semibold | [WWDC26 · Modernize your AppKit app](https://developer.apple.com/videos/play/wwdc2026/289/?time=849) |
| 系统字体家族 | macOS 系统界面使用 SF Pro | [Apple HIG · Typography](https://developer.apple.com/design/human-interface-guidelines/typography) |

### Apple 27 设计套件

| 要查什么 | 原板记录 | 依据 |
|---|---|---|
| Dark Active 侧栏填充色 | #0C0C0C | [Apple macOS 27 UI Kit · Dark Active Sidebar](https://www.sketch.com/s/57153a31-3379-4737-8ac6-dbfd6525f052/layer-styles?g=Sidebar%252FBackground%252FDark&component=d4e30091-9cce-454c-94ec-88f1855ea39c) |
| Dark Active 侧栏填充不透明度 | 85% | [Apple macOS 27 UI Kit · Dark Active Sidebar](https://www.sketch.com/s/57153a31-3379-4737-8ac6-dbfd6525f052/layer-styles?g=Sidebar%252FBackground%252FDark&component=d4e30091-9cce-454c-94ec-88f1855ea39c) |
| Dark Active 侧栏背景模糊 | 80 px, Sketch 模板单位 | [Apple macOS 27 UI Kit · Dark Active Sidebar](https://www.sketch.com/s/57153a31-3379-4737-8ac6-dbfd6525f052/layer-styles?g=Sidebar%252FBackground%252FDark&component=d4e30091-9cce-454c-94ec-88f1855ea39c) |
| 单按钮模板外框 | 24 × 24 px, Medium / Active 状态 | [Apple macOS 27 UI Kit · Toolbar Inspector](https://www.sketch.com/s/57153a31-3379-4737-8ac6-dbfd6525f052/f/EF012DD2-0660-4DEC-B0E1-AEDC78597C76#Inspector) |
| 单按钮模板内距 | 2 px, 每侧 | [Apple macOS 27 UI Kit · Toolbar Inspector](https://www.sketch.com/s/57153a31-3379-4737-8ac6-dbfd6525f052/f/EF012DD2-0660-4DEC-B0E1-AEDC78597C76#Inspector) |
| 单按钮模板圆角平滑 | 60%, Apple smoothing | [Apple macOS 27 UI Kit · Toolbar Inspector](https://www.sketch.com/s/57153a31-3379-4737-8ac6-dbfd6525f052/f/EF012DD2-0660-4DEC-B0E1-AEDC78597C76#Inspector) |

### 系统导航

| 要查什么 | 原板记录 | 依据 |
|---|---|---|
| 侧栏边缘 | macOS 27 样图中, 侧栏与窗口左、上、下边缘相接 | [音乐 · macOS 27 贴边侧栏](https://developer.apple.com/videos/play/wwdc2026/102/?time=1434) |
| 选中反馈 | 选中行保留可读文字及独立的行背景 | [音乐 · macOS 27 贴边侧栏](https://developer.apple.com/videos/play/wwdc2026/102/?time=1434) |

### 深色材质

| 要查什么 | 原板记录 | 依据 |
|---|---|---|
| 玻璃承载层 | 工具和导航使用玻璃背板, 长篇正文使用连续内容面 | [备忘录 · 深色工具栏](https://developer.apple.com/design/human-interface-guidelines/toolbars) |
| 工具分组 | 同类命令共享一个胶囊, 分组之间保留外部间隔 | [备忘录 · 深色工具栏](https://developer.apple.com/design/human-interface-guidelines/toolbars) |

### 第三方应用

| 要查什么 | 原板记录 | 依据 |
|---|---|---|
| 浮层内容面 | 浮动队列中的条目使用独立内容底色 | [Paste Stack · 浮动队列](https://pasteapp.io/blog/paste-stack) |
| 文档内容层 | 文件树与正文使用相邻的独立阅读区 | [iA Writer 8 · 文档窗口](https://ia.net/topics/search-to-navigate) |
| 临时面板位置 | 排程面板在选中任务旁打开 | [Things 3.22 · 侧栏与排程弹层](https://culturedcode.com/things/blog/2025/09/things-for-os-26/) |

### Tahoe 26.6.2 实测

| 要查什么 | 原板记录 | 依据 |
|---|---|---|
| 窗口样本尺寸 | 1070 × 620 pt, 实验自定 | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| 窗口像素倍率 | 2× | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| 工具栏高度 | 52 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| 独立工具按钮 | 36 × 36 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| 双按钮组外框 | 70 × 36 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| 工具组之间的间隔 | 8 pt | 回读视图树可见, 8 pt 是两个托盘之间弹性占位视图的宽度, 左托盘从 x = 936 pt 起, 宽 36 pt, 右托盘从 x = 990 pt 起, 两个托盘外沿实际相隔 18 pt [原生坐标](native-geometry.txt) |
| 托盘垂直内距 | 8 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| 分栏线宽 | 1 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| 交通灯直径 | 14 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| 交通灯中心距 | 23 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| 标准按钮高度 | 24 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| Mini 按钮高度 | 13 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| Small 按钮高度 | 20 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |
| Large 按钮高度 | 28 pt | [macOS 26.6.2 · 原生运行几何记录](native-geometry.txt) |

### Figma 对照实验 · 校准样本

打开测量文件的 `measurements`, 在 `glass`、`no-refraction` 和 `blur` 三组中查看可测截面总数和偏移至少 2 px 的截面数, 视觉对照图使用相同的六组效果 [逐组测量数据](refraction-results.json) · [六组对照图](proof.png)

| 要查什么 | 原板记录 | 依据 |
|---|---|---|
| GLASS 参数 · refraction | 0.84, 归一化强度 | [Figma · 折射与模糊对照](proof.png) |
| GLASS 参数 · depth | 23, Figma 效果参数 | [Figma · 折射与模糊对照](proof.png) |
| GLASS 参数 · radius | 0 px | [Figma · 折射与模糊对照](proof.png) |
| 折射组标线截面偏移 ≥ 2 px | 398 / 1428 个标线截面 | [Figma · 折射与模糊对照](proof.png) |
| 折射组最大标线位移 | 8.78 px | [Figma · 折射与模糊对照](proof.png) |
| 零折射组标线截面偏移 ≥ 2 px | 0 / 1505 个标线截面 | [Figma · 折射与模糊对照](proof.png) |
| 背景模糊对照 · radius | 8 px | [Figma · 折射与模糊对照](proof.png) |
| 背景模糊组标线截面偏移 ≥ 2 px | 0 / 802 个标线截面 | [Figma · 折射与模糊对照](proof.png) |

### Figma 原尺寸导出 · 字体

| 要查什么 | 原板记录 | 依据 |
|---|---|---|
| 14 px 英文测试串的栅格化 | SF Pro Regular、Semibold 与 SF Pro Rounded Regular 均为 0 个有效字形像素, Helvetica Neue Regular 为 332 个, 阈值 128 | [字体对照](font-proof.png) |

## 本稿定义

这里的 50 条是原稿选择的窗口、分栏、材质、文字与操作规格, 原稿的正文和检查器使用实色, 全窗稿清除这两处填充 [三版实际图层](materials.json)

### 画板与窗口

| 要查什么 | Quarry 原稿取值 | 依据 |
|---|---|---|
| 画板尺寸 | 1440 × 940 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 窗口尺寸 | 1376 × 844 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 窗口左偏移 | 32 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 窗口上偏移 | 48 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 窗口圆角 | 16 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |

### 审查导航

| 要查什么 | Quarry 原稿取值 | 依据 |
|---|---|---|
| 侧栏宽度 | 228 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 选中行高度 | 34 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 选中行圆角 | 7 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 选中行字重 | Helvetica Neue Bold | Quarry 本稿 · 绘制参数, 1× 设计像素 |

### 工具条

| 要查什么 | Quarry 原稿取值 | 依据 |
|---|---|---|
| 工具条高度 | 52 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 工具组高度 | 36 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 胶囊半径 | 18 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 组间间距 | 10 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 组内分隔线宽 | 1 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |

### 证据文档

| 要查什么 | Quarry 原稿取值 | 依据 |
|---|---|---|
| 主列宽度 | 786 px, 当前画板 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 左右内距 | 36 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 内容面颜色 | #1F2022 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 数据行高度 | 53 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 表头高度 | 36 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |

### 检查器

| 要查什么 | Quarry 原稿取值 | 依据 |
|---|---|---|
| 检查器宽度 | 362 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 检查器水平内距 | 22 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 内容面颜色 | #27282C | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 强调操作数量 | 1 个, Review patch | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 主按钮高度 | 28 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 主按钮底色 | #0864DA | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 跟进输入高度 | 40 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |

### 文字与状态

| 要查什么 | Quarry 原稿取值 | 依据 |
|---|---|---|
| 主文字颜色 | #F2F2F5 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 正文常规字形 | Helvetica Neue Regular | Quarry 本稿 · 字体映射 |
| 正文中等字重 | Helvetica Neue Medium | Quarry 本稿 · 字体映射 |
| 次文字颜色 | #A2A4AC, 元数据 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 问题标题字号 | 30 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 问题标题行高 | 37 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 问题标题字重 | Helvetica Neue Bold | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 正文字号 | 13–14 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 正文行高 | 18–21 px, 当前正文 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 标识符字体 | Menlo Regular, 等宽 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 标识符字号 | 11–12 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 次级正文颜色 | #C1C2C8 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 状态信息 | 保留状态名称, 颜色只作为附加线索 | Quarry 本稿 · 绘制参数, 1× 设计像素 |

### 本稿侧栏材质

| 要查什么 | Quarry 原稿取值 | 依据 |
|---|---|---|
| 底色 | #0C0C0C | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 底色不透明度 | 85% | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| GLASS 折射强度 | 0.30 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| GLASS 深度 | 12, Figma 效果参数 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| GLASS 磨砂半径 | 36 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |

### 本稿工具与输入

| 要查什么 | Quarry 原稿取值 | 依据 |
|---|---|---|
| 底色 | #999999 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| 底色不透明度 | 17% | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| GLASS 折射强度 | 0.46 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| GLASS 深度 | 8, Figma 效果参数 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| GLASS 磨砂半径 | 4 px | Quarry 本稿 · 绘制参数, 1× 设计像素 |
| GLASS 色散 | 0 | Quarry 本稿 · 绘制参数, 1× 设计像素 |
