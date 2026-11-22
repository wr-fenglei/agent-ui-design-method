# Quarry 发布审查

| 阶段 | 计划内容 | 交付及验收要求 |
|---|---|---|
| 调查任务 | 从 8 项发布检查中选中 RL-238, 判断一次重试是否重复发送了结算事件 | 同屏可见选中项, 同一订单的两条事件, 以及人工审阅补丁的入口 |
| 选择原稿 | 2026-11-19 23:29 至 23:31, 设计者查看基础, 组件和屏幕三页, 导出颜色板与桌面首屏, 选定首屏中的 1320 × 720 产品窗 | 原窗中选中 UI-142, 详情交代截图检查对象, 右下浮窗给出改动和文件 [原窗](../../sources/linear/original-review-window.png) |
| 确定布局 | 23:31, 先定导航, 队列, 详情及右下浮窗, 再把截图审查的证据和产物换成订单事件及补丁 | 保留三栏, 订单号和事件放在浮窗上方, 活动记录留在左下, 两处都可与 Agent 的解释对照 [当时的制作记录](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/foundations/linear.md) |
| 查看首稿 | 23:34:54 首次写入 Figma, 23:35:05 查看首份 PNG, 订单 TEST-8072 在 09:41:12.083 和 09:41:12.516 两次发出同名事件 | 两次事件相隔 433 ms, 同列展示首次确认和网络重试, 浮窗给出按订单号防重的建议和 Review patch 入口 [首份导出](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/foundations/original/quarry-first.png) |
| 修订控件 | 对照同一位置的首稿和终稿, 补丁行把删除数改为红色, 输入框补上 Enter, 搜索, 筛选和发送图标调整至容器中心 | 成稿中可以分别读到文件名, 绿色 +8, 红色 −2 和追问快捷键 [首稿局部](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/examples/linear/revision/patch-first.png) · [终稿补丁行](components/patch-file.png) · [终稿输入框](components/reply-field.png) |

所有时间均为上海时间, 首稿中的回归通过及待审补丁是画面里的样例状态 [可编辑终稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=11-7202)

## 这次复核

以 1440 × 940 的[终稿](final.png)为坐标底图, 核对历史图层记录, 从原像素裁出 5 个组件, 选中行是 373 × 47, 订单证据的两行时间相隔 40 px, 浮窗顶边位于证据底线下方 17 px, 这些量值适用于这一张桌面成稿 [详细规范](spec.json) · [历史绘图源](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/evidence/linear.js)

原参考稿另有 UI-142 的宽窄实例, 主组件宽 560 px, 桌面实例宽 399 px 时隐藏分类, 手机实例宽 340 px 时也隐藏负责人, 三处行高都为 40 px, 可据此决定哪些字段优先保留, 本次对短队列和无补丁状态的处理属于复用建议, 尚无对应的 Quarry 成稿 [来源与获取办法](../../sources/linear/README.md)
