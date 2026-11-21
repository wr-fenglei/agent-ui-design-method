# 从 Linear 底稿开始

先在左边点一个问题, 看旁边的记录和 Agent 的解释, 再决定下一步, 这套顺序既可以审截图, 也可以审订单

| 原稿用它审截图 | Quarry 首稿用它审订单 |
|---|---|
| [![Linear 风格原稿, 选中 UI-142 后查看截图审查](linear-source.png)](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-29) | [![Quarry 首次发布的 1440 × 940 整屏, 在同一窗口选问题、看证据、审补丁](original/quarry-first.png)](original/quarry-first.png) |

左边是用户给的 Linear 风格 Figma, 右边是这个项目沿用它做的 Quarry, 目前仓库把这一套作为元设计, 下文先读左图的出处, 再看新任务怎样沿用它

## 原稿有三页, 各查一件事

| 页 | 打开它可以看到什么 | 原尺寸图和 Figma |
|---|---|---|
| Foundations · 基础规则 | 颜色、字号、圆角、间距与布局、表面与阴影, 五部分共一张 1440 × 4126 的板 | [整张图](original/foundations.png) · [可编辑原稿](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=5-242) |
| Components · 组件 | 1200 × 1136 的总览并排展示按钮、侧栏行、列表行、工具组、输入框和状态点, 同页另有 18 个图标及可点开量尺寸的主组件 | [整张图](original/components.png) · [可编辑总览](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=6-52) · [图标](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=3-2) |
| Screens · 整页样例 | 同一落地页有桌面和手机两稿, 从首屏的审查窗口往下能看到规范检查、截图审查、压力测试, 桌面 1440 × 7263, 手机 390 × 5771 | [桌面整图](original/desktop.png) · [手机整图](original/mobile.png) · [桌面原稿](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-2) · [手机原稿](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=12-342) |

## 跟着一条真实的选中行读三页

1. **看它怎么标出选中**, 基础页给暗色表面配了一档约 5% 的白色叠层, 先在列表底色上比较普通行和选中行 [表面样本](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=5-252)
2. **看这一行装了什么**, 选中列表行的主组件是 560 × 40 px, 左右各留 16 px, 状态点、编号、标题、标签、头像和时间排成一行, 底部有 1 px 分割线, 选中时加浅底 [选中行主组件](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=4-37)
3. **看空间少了怎么改**, 桌面的 UI-142 实例宽 399 px, 隐藏标签, 手机版同一实例宽 340 px, 再隐藏头像, 两边均保留状态、编号、标题、时间和 40 px 行高 [桌面实例](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-303) · [手机实例](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=12-452)

做自己的列表时, 先写下用户认出一项任务需要哪些字段, 再定宽度不够时哪些可以收起, 把实际最长的一行放进画板检查

<details>
<summary>查原稿数值, 或看另一个组件怎么做</summary>

| 想画什么 | 原稿里的决定 |
|---|---|
| 文字有主次 | 主文字、次文字、辅助文字、弱提示四级依次为 <code>#F7F8F8</code>、<code>#D0D6E0</code>、<code>#8A8F98</code>、<code>#62666D</code>, 落地页大标题 56/64 px, 应用窗口详情标题 20/32 px, 控件文字 13/20 px, 编号 13/18 px 用等宽字体, 换背景后重新检查字色 [四级字色](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=5-302) · [字体样本](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=5-351) · [窗口详情](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-359) |
| 侧栏选中 | 默认和选中均为 216 × 28 px, 圆角 6 px, 左右内距与图文间距均为 8 px, 选中行加约 5% 白底, 标题字重从 400 变为 500 [侧栏行两态](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=4-25) |
| 按钮和工具组 | 主次按钮各有 32 和 44 px 两种高度, 主按钮实物填色为 <code>#E5E5E6</code>, 次按钮用约 5% 白底和 8% 白边, 16 px 图标放进 28 × 28 px 工具按钮, 前后切换和视图切换各自成组 [按钮样本](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=4-10) · [工具按钮](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=4-49) · [工具组样本](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=6-152) |
| 输入框获得焦点 | 两态均为 280 × 36 px, 圆角 8 px, 左右内距 12 px, 聚焦后 1 px 边线变成 <code>#5E6AD2</code>, 外加同色 35% 的 3 px 焦点环 [输入框两态](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=4-134) |
| 浮层与正文 | 平铺卡片用 1 px 线分边, 浮层另加黑色 25% 阴影, 向下 2 px, 模糊 32 px, 首屏 400 × 452 px 的 Agent 浮层实际沿用这套阴影 [基础页样本](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=5-475) · [屏内浮层](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-420) |
| 改成窄屏 | 落地页桌面左右留 80 px, 手机留 24 px, 区块上下留白从 128 变为 64 px, 桌面首屏含 1320 × 720 px 工作台, 手机首屏改放 342 × 540 px 的列表 [间距表](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=5-422) · [手机列表预览](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=12-366) |

截图审查样例在 1440 和 390 两个宽度展示问题, 压力测试样例列出长标题、长按钮、空列表、200% 字号等情况, 可据此给自己的任务选择测试数据, 图中文字是原稿演示内容 [截图审查样例](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=10-267) · [压力测试样例](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=10-446)

</details>

## Quarry 第一稿是怎样画出来的

2026-11-19, 用户请我们分别参考「灵感」和「Linear」做两份独立设计稿, 下表的时间均为上海时间

| 时间 | 当时做了什么 |
|---|---|
| 23:29–23:31, 读原稿 | 读取 Foundations、Components 及桌面和手机的 Screens, 单独导出颜色板和桌面首屏看实图, 项目首页有介绍文字和产品窗, 设计者选了其中 1320 × 720 px 的产品窗, 核对其 232 px 侧栏、1070 px 主区和 400 × 452 px 浮窗 [颜色板](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=5-247) · [桌面首屏](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-19) |
| 23:31, 定首屏 | 设计者动笔前写下「保留导航、队列、详情和右下浮动 Agent 面板」, 还明确要放可核对的事件证据和补丁, 当时已记录原稿的深色表面、靛蓝强调色、文字层级、1 px 平铺边线和浮层阴影 [原窗口](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-29) |
| 23:33–23:35, 画出并查看 | 第一版绘图源把选中问题、两条订单事件、处理结果和审阅动作一次放进窗口, 23:34:54 首次写入 Figma, 23:35:05 打开整屏导出, 页首右图取自当时的 PNG [首次发布整屏](original/quarry-first.png) |

**从原窗口逐项改写功能**, 两张图都可以从选中行一路读到 Agent 的产物

| 原稿审 UI-142 的截图 | Quarry 首稿审 RL-238 的订单 |
|---|---|
| 在「修复中」选中「首屏标题行高过紧」 | 在 8 项发布检查里选中「重复结算事件」, 队列仍按待审、进行中、通过分组 |
| 详情交代检查项, 给出 1440 和 390 两个视口及活动记录 | 详情给出同一订单 TEST-8072 的两条记录, 时间是 09:41:12.083 和 09:41:12.516, 首次确认和网络重试各发了一次同名事件 |
| Codex 浮窗写出请求、改动的两处排版、更新的 index.html, 底部可以追问 | 浮窗写出检查重试的请求、按订单号防重的建议、两次重试只发一次事件的回归结果, 用户可点 Review patch 审阅 checkout-event.patch, 也可以追问 |

**把空间留给需要对照的内容**, Quarry 在 1440 × 940 px 画板上给三栏分配 222 / 373 / 753 px, 详情上半部给两条事件共用时间、来源、事件名和结果四列, 两行按列对齐, 右下浮窗从证据底线往下 17 px 开始, 窗口左侧留出预期行为和活动记录, 在首稿中就能一边看两条事件, 一边审补丁 [首稿整屏](original/quarry-first.png) · [最终绘图源](../evidence/linear.js)

首发之后才修过快捷键、搜索、筛选、发送图标的居中和补丁增删颜色, 图层调整可与首发整屏对照 [最终导出](../evidence/linear.png) · [可编辑稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=11-7202)

现有记录没有测量各因素对审美判断的单独贡献 [Quarry 读数](../evidence/frame-measurements.json) · [制作要求](../README.md#制作要求)

如需收录第二套元设计, 先说明它适合哪类不同的任务, 用它完成一份新稿, 再由用户选择是否作为下次的起点
