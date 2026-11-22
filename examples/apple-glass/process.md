# Quarry 的 Mac 发布审查窗口

审阅者在左栏选中 RL-238, 中栏对照订单 TEST-8072 的两次 checkout_complete, 确认网络重试产生了重复事件, 右栏显示 Agent 如何复现问题, 运行回归并交出补丁, 回归通过后, Review patch 仍由审阅者操作, 这些记录是设计稿中的示例数据 [最终整屏](final.png)

## 先确定导航和正文的关系

Music 的 Home 有独立选中底, 侧栏的其他行透出封面颜色, Notes 的编辑命令共享顶部胶囊, 下面的笔记使用连续背景, Apple 的 Materials 指南把 Liquid Glass 用在导航和控件层, 内容层使用标准材质, 原稿据此把桌面颜色引入左栏, 把问题说明, 两行事件和回归结果放进同一阅读区 [Music 与 Notes 原件和定位方法](../../sources/apple-glass/README.md) · [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials)

11 月 20 日的制作文件显示, 07:21 至 07:25 已保存 Notes 与 Music 参考图, 07:27 导出折射试样, 07:28 建立绘图源文件, 07:31 保存 AppKit 视图树, 07:34 导出字体试样, 尺寸和字体在首稿绘制期间继续校准

在 macOS 26.6.2 的 AppKit 视图树中, 该窗口的工具栏高 52 pt, 双按钮底板为 70 × 36 pt, 上下各留 8 pt, 项目在 Figma 用 52 px 高的工具栏和 72 × 36 px 的双按钮组, 两个命令各占 36 px, 当时图形会话锁定, 这项记录提供的是几何数据 [AppKit 实测](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/references/apple-process/native-geometry.txt) · [成稿双按钮组](components/previous-next.png)

材质试样把红绿标线放在效果层后方, 背景模糊时, 802 个可测截面均未偏移 2 px, 高折射时, 1428 个可测截面中有 398 个偏移至少 2 px, 这个对照用来识别 Figma 折射, 前景控件与窗底另有各自的参数, 随后的 1× 英文字体试样中 SF Pro 没有输出字形, 成稿使用能输出字形的 Helvetica Neue, 时间和事件名使用 Menlo [折射试验读数](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/references/apple-process/refraction-results.json) · [字体与材质研究记录](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/references/apple-process/study-notes.md)

## 用同一笔订单比较三版材质

| 制作顺序 | 画面变化 | 可复查的设计稿 |
|---|---|---|
| 原稿 | 左栏单独取壁纸颜色, 中栏和右栏各有深色背景, 在左栏边缘能看到湖色中断 | [原稿 51:23751](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=51-23751) |
| 分区透明稿 | 顶栏, 正文和右栏分别加底, 不透明度分别为 57%, 68%, 61%, 后方湖景穿过各区时深浅不同 | [分区稿 74:37804](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=74-37804) |
| 全窗稿 | 从原稿重新复制, 把左栏壁纸移到窗底, 玻璃从左栏宽扩到全窗宽, 清空顶栏底板, 正文, 事件表, 右栏和追问区中挡住玻璃的填充, 用户选中这一版 | [成稿 75:38790](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=75-38790) |

窗内壁纸图层保持 1440 × 940 px, 相对窗口偏移 (-32, -48), 与窗外桌面的同一片湖景对齐, 窗口的 16 px 圆角裁切壁纸和玻璃, 全窗使用一层侧栏材质是本项目选定的静态 Figma 处理, 这项处理超出了 Apple 为导航与控件建议的范围 [三稿图层读数](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/references/apple-process/materials.json) · [Apple 的材质采用说明](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)

## 核对证据和操作在材质变化后仍然可读

从整屏左上起, 栏界左侧 (240, 180) 在三版中均为 #152128, 右侧 (275, 180) 依次为 #1F2022, #1C3345, #152128, 成稿的两点底色相同, 两点之间 x = 259 的 1 px 分栏线仍然可见, 历史回读记录也显示, 原稿与全窗稿的 75 个文字层在内容, 字框位置与尺寸, 字体和填充上相同 [历史对照](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/examples/apple-glass/README.md) · [最终整屏](final.png)

成稿的证据表只有两行, 同名事件出现于 09:41:12.083 和 09:41:12.516, 相隔 433 ms, 两条记录占用 142 px 高的表格, 下方独立说明预期行为和回放结果, 两次重试只发出一个事件, 右栏随后显示待审文件和一个蓝色按钮, 在同一屏能区分原始故障, 回归结果与人工审阅三个状态 [证据表](components/event-evidence-table.png) · [审阅按钮](components/review-patch.png) · [成稿规格](spec.json)

## 换成自己的内容

需要在多个问题之间切换, 对照事件, 持续查看运行记录时, 可以分别使用这个案例的左, 中, 右三栏, 只有一个对象和一个动作时, 用一列放对象, 证据和操作即可, 两三条记录按内容高度结束, 只有需要逐项比对的字段才保留表头和行线, 新稿的列数, 对齐及留白取决于任务里的实际对象和操作 [成稿布局与分隔线规则](spec.json)
