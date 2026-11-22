# shadcn/ui 官方组件截图

这 6 张 PNG 均于 2026-11-22 从官方 New York v4 的 `dashboard-01` 运行页面截取, Chrome 使用浅色主题, 1 个 CSS px 对应 1 个图像像素, 桌面视口为 1440 × 800, 窄窗视口为 740 × 680, 下表的尺寸包含截图留边, 单位为 px [打开原页面][dashboard]

| 图片 | 截取位置和状态 | 可以对照的细节 | 官方组件 |
| --- | --- | --- | --- |
| [sidebar.png](sidebar.png) · 288 × 800 | 桌面首页左侧展开的 Sidebar, 从 Acme Inc. 到底部账户 | 创建操作在上方, 主菜单和 Documents 分组共用左侧图标轴, Settings 等辅助入口靠底部 | [Sidebar][sidebar] |
| [table.png](table.png) · 1096 × 572 | 桌面滚动到 Outline, 截取第一页的完整表头和 10 条数据 | 比较相邻行的标题起点和右侧操作列, 状态列同时使用图标和文字 | [Table][table] |
| [tabs.png](tabs.png) · 513 × 44 | 桌面 Outline 表格上方的 4 项标签组, Outline 已选中 | 36 px 高的浅灰容器内有一个白色选中项, 两个标签带数量 | [Tabs][tabs] |
| [input.png](input.png) · 361 × 72 | 单击 Outline 表格第一行的 Cover page, 右侧详情打开后, 将键盘焦点移到 Header 输入框 | 标签在输入框上方, 灰色焦点环包住 351 × 36 px 的输入框 | [Input][input] |
| [button.png](button.png) · 357 × 42 | 同一个 Cover page 右侧详情底部的 Submit 按钮, 默认状态 | 黑色按钮占满表单内容宽度, 本例为 351 × 36 px | [Button][button] |
| [sheet.png](sheet.png) · 290 × 680 | 窄窗回到顶部, 点击 Toggle Sidebar 后从左侧打开的导航面板 | 面板宽 288 px, 顶部和底部均贴窗, 右侧保留 2 px 遮罩供辨认边界 | [Sheet][sheet] |

### 查找同类实物

从 Blocks 的 Dashboard 分类选择 `dashboard-01`, 用 Open in New Tab 打开可交互页面, 滚到表格可比较相邻数据, 点行标题可查看详情表单, 缩窄窗口再打开导航可查看覆盖层, 桌面右侧详情使用 Drawer, 窄窗左侧导航使用 Sheet [Dashboard 示例目录][blocks] · [本例源码][registry]

需要单个控件的其他状态时, 打开上表对应的组件文档, 在示例中切换标签或用 Tab 键移动焦点, 记录视口与状态后按元素边界截图, 保留边框、阴影和焦点环

[dashboard]: https://ui.shadcn.com/view/new-york-v4/dashboard-01
[blocks]: https://ui.shadcn.com/blocks/dashboard
[registry]: https://ui.shadcn.com/r/styles/new-york-v4/dashboard-01.json
[sidebar]: https://ui.shadcn.com/docs/components/radix/sidebar
[table]: https://ui.shadcn.com/docs/components/radix/table
[tabs]: https://ui.shadcn.com/docs/components/radix/tabs
[input]: https://ui.shadcn.com/docs/components/radix/input
[button]: https://ui.shadcn.com/docs/components/radix/button
[sheet]: https://ui.shadcn.com/docs/components/radix/sheet
