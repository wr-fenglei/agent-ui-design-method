# Apple Liquid Glass · 发布审查工作台

用户选定的全窗稿让三栏共用一层玻璃, 左栏选中 RL-238, 中央用同一订单的两个时间戳说明重复事件, 右栏保留工具记录和待审补丁, 回归结果显示重试 2 次、发出 1 个事件, 下一步是点 `Review patch` 审阅改动

![全窗统一左栏材质, 订单 TEST-8072 的两次事件、回归结果和审阅补丁操作](../../references/apple-process/uniform.png)

## 三次设计

| 版本 | 窗口背景 | 整屏原图 |
|---|---|---|
| 原稿 · 51:23751 | 左栏透出桌面, 正文和检查器各有深色底面 | [1440 × 940](../../references/apple-liquid-glass.png) |
| 分区透明 · 74:37804 | 顶栏、正文和检查器独立取色, 底色不透明度分别为 57%、68%、61% | [1440 × 940](../../references/apple-process/full.png) |
| 全窗统一 · 75:38790 | 从原稿复制, 把左栏壁纸与玻璃移到窗底, 三栏共同取色, 页首展示这版成稿 | [1440 × 940](../../references/apple-process/uniform.png) |

**原稿** 两个事件落在平整的正文底面, 左栏里的湖景止于栏边

![原稿整屏, 玻璃位于导航和控件](../../references/apple-liquid-glass.png)

**分区透明** 中央与右栏透出不同深浅的颜色, 顶栏仍有独立底板

![分区透明整屏, 正文与右栏独立取色](../../references/apple-process/full.png)

**同一位置的变化** 下图按制作顺序并列, 在整屏坐标 (240, 180) 和 (275, 180) 取左栏与正文两点, 三稿的左点均为 RGB(21, 33, 40), 右点依次为 RGB(31, 32, 34)、RGB(28, 51, 69)、RGB(21, 33, 40)

![三版同坐标的栏边界和工具栏局部](../../references/apple-process/layer-detail.png)

## 全窗稿的制作记录

| 图层与位置 | 制作决定 |
|---|---|
| 桌面与窗口 | 在 1440 × 940 画板的 (32, 48) 处放置 1376 × 844 的窗口, 四角半径 16 px, 窗内的壁纸保持画板尺寸并移至 (−32, −48), 加 32 px 图层模糊, 让内外湖景对齐 |
| 共用玻璃 | 将 228 px 宽的左栏玻璃扩为整个窗口, 放在壁纸上方, 填充 #0C0C0C, 不透明度 85%, Figma Glass 折射 0.30、深度 12、磨砂半径 36、高光强度 0.10、光向 −60°、色散 0 |
| 三栏与工具条 | 左栏、正文、检查器宽度分别为 228、786、362 px, 工具条高 52 px, 清除正文、事件表、检查器和追问区的填充, 移除顶栏的实色底板, 保留表线、选中行和按钮边界 |
| 控件与文字 | 窗底保留 1 块玻璃, 另有 6 块工具或输入控件玻璃, 控件底色 #999999、不透明度 17%、折射 0.46、深度 8、磨砂半径 4、高光强度 0.22, 原稿与成稿的 75 个文字层在文案、字框位置与尺寸、字体和填充上相同 |

Apple 平台资料与设计套件提供导航和控件的参考, 整窗共用左栏材质是这次对照中的项目选择, 这些图记录的是 Figma 将壁纸对齐后导出的静态效果 [三版图层与效果读数](../../references/apple-process/materials.json)

## 原稿研究板

原板 52:24248 为 1440 × 8112 px, 记录 13 项材料、42 条研究依据和 50 条本稿定义, 下列 11 张图保留原宽、原顺序和全部像素, 图中文字可在笔记中搜索 [完整研究板 PNG](../../references/apple-process/board.png) · [原板文字与来源](../../references/apple-process/study-notes.md)

### 参考实物

Music 的贴边导航随封面取色, Notes 把命令分组放在顶部, 这两处分别对应原稿的左栏和工具组

![参考实物, Apple Music 的贴边左栏和 Notes 的深色工具栏](board/01-official.png)

Paste Stack 在窗口与桌面交界处取色, iA Writer 保持正文连贯, Things 把排程面板贴近当前任务

![第三方应用, Paste Stack、iA Writer 8 和 Things 3.22 的实图及原板观察记录](board/02-apps.png)

本机 AppKit 视图树给出工具栏高 52 pt、双按钮底板 70 × 36 pt, 图中标注用于校准几何 [本机测量记录](../../references/apple-process/native-geometry.txt)

![本机 AppKit 视图测量与几何标注](board/03-appkit.png)

在红绿标线下分别测试折射、零折射和背景模糊, 高折射组 1428 个可测截面中有 398 个偏移至少 2 px, 另外两组在同一阈值下均为 0 [六组导出测量数据](../../references/apple-process/refraction-results.json)

![Figma 六组材质样本与折射测量](board/04-optics.png)

### 材质与层级

A 标记前后切换的工具组, B 是左栏当前问题, C 是补丁审阅操作, 三个文字样本分别对应标题、分区标题和事件标识符

![带位置标记的原稿、三个控件的尺寸和三种文字样本](board/05-layers.png)

### 原尺寸组件

工具组为 72 × 36 px, 选中行为 210 × 34 px, 主操作为 123 × 28 px, 图中样件均按画板的 1× 像素导出

![1× 工具栏命令组、当前审查项与补丁审查主按钮](board/06-components.png)

### 研究依据

平台指引和 Apple 27 套件记录材质角色、底色、圆角与工具组边界, 下段继续列出第三方应用、本机 AppKit、Figma 折射测试与字体导出记录

![研究依据上半部, 平台指引、Apple 27 设计套件、系统导航与深色材质](board/07-basis-platform.png)

![研究依据下半部, 应用观察、本机尺寸、折射对照及字体渲染](board/08-basis-measurements.png)

### 本稿定义

原稿的尺寸、文字和颜色在此以 1× 设计像素记录, 全窗稿沿用三栏尺寸, 改变了壁纸和玻璃覆盖的区域

![本稿定义上半部, 画板、窗口、审查导航、工具条与事件文档](board/09-spec-layout.png)

![本稿定义下半部, 表头高度、检查器、文字、状态、侧栏与工具材质](board/10-spec-controls.png)

### 补充来源

原板结尾保留了两代 Maps、App Store、Paste、系统桌面和字体实验的观察记录, 对应原图见下一节

![原板末尾六项补充来源与实物说明](board/11-sources.png)

## 13 项研究原件

**Apple 应用** 两代 Maps 的图同时保留, 可以直接比较导航与窗口边缘的距离

| Music · macOS 27 贴边侧栏 | Notes · 深色工具组 |
|---|---|
| [![Music 实图, 封面颜色进入贴边左栏](originals/04-music-macos27.jpg)](originals/04-music-macos27.jpg) | [![Notes 实图, 工具栏和更多菜单](originals/01-notes-dark-toolbar.png)](originals/01-notes-dark-toolbar.png) |

| Maps · macOS 26 内缩导航 | Maps · macOS 27 贴边导航 | App Store · 深色侧栏 |
|---|---|---|
| [![Maps 26, 桥梁地图与内缩侧栏](../../references/originals/apple-maps.jpg)](../../references/originals/apple-maps.jpg) | [![Maps 27, 航拍底图与右侧控件分组](originals/05-maps-macos27.jpg)](originals/05-maps-macos27.jpg) | [![App Store, 红蓝色进入左侧导航](originals/03-app-store-tahoe26.jpg)](originals/03-app-store-tahoe26.jpg) |

**第三方应用** 四张作者发布图分别展示浮动队列、文档、选中任务与剪贴板建议

| Paste Stack · 浮动队列 | iA Writer 8 · 文档窗口 |
|---|---|
| [![浮动队列覆盖发票窗口和桌面](originals/paste-stack-mac.png)](originals/paste-stack-mac.png) | [![左侧文件树、紧凑工具组和编辑区](originals/ia-writer-8-mac.png)](originals/ia-writer-8-mac.png) |

| Things 3.22 · 侧栏与排程 | Paste · 剪贴板建议 |
|---|---|
| [![Things 选中任务与日期浮层](originals/things-mac-os26.jpg)](originals/things-mac-os26.jpg) | [![Paste 候选栏与邮件并列](originals/paste-intelligent-clipboard-mac.png)](originals/paste-intelligent-clipboard-mac.png) |

**本机与导出实验** 左图根据 AppKit 视图树标注尺寸, 采集时图形会话锁定, 材质外观可查上方应用实图, 右图是整窗内外共用的 Tahoe Day 源图

| AppKit 几何标注 · macOS 26.6.2 | Tahoe Day · 系统桌面第 4 秒 |
|---|---|
| [![AppKit 控件位置与尺寸标注](originals/geometry.png)](originals/geometry.png) | [![Tahoe Day 系统桌面原始画面](../../references/apple-process/tahoe-day.jpg)](../../references/apple-process/tahoe-day.jpg) |

| Figma 折射与模糊导出对照 | Figma 1× 字体渲染对照 |
|---|---|
| [![六种材质的标线对照](../../references/apple-process/proof.png)](../../references/apple-process/proof.png) | [![同一测试串在各字族的输出, 本次环境下 Helvetica Neue 输出字形](../../references/apple-process/font-proof.png)](../../references/apple-process/font-proof.png) |

原稿研究板与三版整屏共 4 个画板, 本页的整屏和完整板均与对应节点的 1× 导出逐字节一致
