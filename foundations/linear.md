# 从 Linear 底稿开始

先在左边点一个问题, 看旁边的记录和 Agent 的解释, 再决定下一步, 这套顺序既可以审截图, 也可以审订单

| 原稿用它审截图 | Quarry 用它审订单 |
|---|---|
| [![Linear 风格原稿, 选中 UI-142 后查看截图审查](linear-source.png)](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-29) | [![Quarry 底稿, 在同一窗口选问题、看证据、审补丁](../evidence/linear.png)](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=11-7202) |

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

## Quarry 怎样用这套底稿

| 用户要判断什么 | Quarry 的做法 | 下一张稿可以怎样变 |
|---|---|---|
| 我正在看哪一项 | 队列选中 RL-238, 详情标题和 Agent 面板指向同一次调查 | 只有一个任务时收起队列, 用标题标明对象 |
| Agent 凭什么这么说 | 同一订单的首次确认和网络重试占两行, 时间戳可分别核对 | 看间隔时标出 433 ms, 看字段变化时将两条记录并排 |
| 哪一步还要我处理 | 本地回放已通过, 补丁仍待人审阅, 操作与产物相邻 | 可以把改动内容放主区, 侧栏放验证结果和审阅操作 |

原稿的应用窗口侧栏宽 232 px, 接着是 400 px 列表和 668 px 详情, Quarry 在 1440 × 940 画板上采用 222 / 373 / 753 px 三栏, 行高 47 px, 问题标题 26 px, 审阅按钮 135 × 33 px, 圆角 6 px, 这些是 Quarry 配合订单内容做出的取值 [原窗口](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-29) · [Quarry 读数](../evidence/frame-measurements.json) · [Quarry 绘图源](../evidence/linear.js)

换业务时带上所选对象、原始证据、Agent 解释和下一步这四样, 技术字段和控件可随任务更换, 同题比较时才固定订单和待审状态 [参考库](../references/README.md) · [制作流程](../docs/method.md)

如需收录第二套元设计, 先说明它适合哪类不同的任务, 用它完成一份新稿, 再由用户选择是否作为下次的起点
