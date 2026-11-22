# Quarry 如何呈现一次重复结算调查

2026-11-20 的制作记录从已有的发布审查案例开始, 下列时间均为北京时间, 订单、附件和回归结果是原案例的样例数据

## 先确定审阅者需要对照的两条记录

00:45 确定沿用已有 Linear 稿的调查任务, 订单 `TEST-8072` 首次确认时产生 `checkout_complete`, 网络重试后再次产生同名事件, 记录时间分别是 `09:41:12.083` 和 `09:41:12.516`, 相隔 433 ms, 审阅者需要核对请求与结果, 再决定是否审阅按订单 ID 去重的补丁, 两个带毫秒的时间戳和待审文件名因此在画第一稿之前就已确定 [历史制作记录](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/references/component-studies.md)

## 到官网量出页面容纳内容的空间

00:49 已查看 Dashboard 01 的展开侧栏、表格和输入框, 00:51 写入第一版测量规格, 当时使用 New York v4 浅色主题和 1440 × 1000 px 桌面视口, 展开侧栏宽 288 px, 顶栏高 48 px, 表头高 40 px, 第一条数据行高 53 px, 制作者采用这些值, 把 1096 px 宽的正文留给一次调查, 让两行事件共享请求、事件名、时间、结果四列 [官方 Dashboard 01](https://ui.shadcn.com/view/new-york-v4/dashboard-01) · [官网组件截图及取图方法](../../sources/shadcn-ui/README.md)

官方页展示营收指标和文档目录, Quarry 另行编排审查内容, 请求保留附件, 运行记录写出读文件、重放和回归的各步结果, 补丁行把文件和审阅按钮放在一起, 运行记录和追问输入分别参考官网 Tool 和 Prompt Input 的组件组合 [Tool](https://ui.shadcn.com/docs/ai-elements/radix/tool) · [Prompt Input](https://ui.shadcn.com/docs/ai-elements/radix/prompt-input)

## 首稿把调查经过和人工动作放在同一页

00:52 写入两栏绘图函数, 00:54 首次导出 1440 × 940 px 整屏, 审阅者从问题标题往下读, 请求携带 `staging-event-trace.json`, 三条运行记录依次给出读取到两条事件、重放复现重复事件、回归时两次重试只产生一条事件的结果, 证据表保留原始的两条同名事件, 首次确认标为 Emitted, 网络重试标为 Duplicate [首稿原图](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/references/library-process/shadcn/first-screen.png)

证据表上方的 Open trace 指向原始追踪, 表下方的 `checkout-event.patch` 列出按订单 ID 去重、增加一项回归测试及 +8 / −2 行变化, Review patch 与文件同排, 底部追问框保留问题编号 RL-238, 审阅者可以继续追问先收到重试时的行为 [补丁行](components/patch-review-card.png) · [追问输入](components/follow-up-input.png)

## 对照官网修订标签组, 回读 Figma 成稿

同位置的首稿和终稿显示, 标签组从 32 px 高改为官网表格标签组使用的 36 px, 白色选中项高 29 px, 在灰色底板内上下各留 3.5 px, 三个标签的文案和顺序保持一致 [首稿标签](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/examples/shadcn-ui/revision-first.png) · [终稿标签](components/view-tabs.png)

随后从成稿提取样件, 把 Review patch 和 Duplicate 分别关联到 Figma 主组件, 归档记录包含 30 项组件尺寸与布局检查、8 处图标位置检查, Review patch 图标与文字相距 6 px, 两者组成的区域在按钮内水平和垂直居中偏差均为 0 px, 本目录的 5 张局部直接裁自该次交付的 1× 成稿, 每个裁框及对应尺寸见规范 [终稿整屏](final.png) · [成稿规格](spec.json) · [历史核验记录](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/references/library-process/checks.json)
