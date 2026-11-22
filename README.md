# 在 Figma 设计一个能处理整项工作的 Agent

从这三个可编辑的 Figma 示例开始, 在同一页追踪一项任务怎样从队列走到证据、Agent 运行、人工决定和下一步, 新设计的研究、组件和成稿也都放在 Figma 里

| 示例 | 打开哪些 Figma 节点 | 在画面里看什么 |
|---|---|---|
| Linear | [Foundations](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME/?node-id=5-242) · [Components](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME/?node-id=2-166) · [原始产品窗口](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME/?node-id=7-29) · [Quarry 成稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=11-7202) | 8 项检查按状态归组, 队列保留当前位置, 详情呈现原始记录, 浮窗包括 Agent 请求、附件、回归与待审补丁, 初稿就确定了这些区域之间的关系 |
| shadcn/ui | [整屏](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=47-20650) · [组件规范与官网实物](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=47-20892) | 先写出相隔 433 ms 的两个事件, 再对照官方 Dashboard 测量侧栏、表格和按钮, 在 Agent review 中串起请求、附件、三次工具活动、事件表和待审文件, Event trace 与 Patch 作为相邻视图 |
| Apple Liquid Glass | [来源与设计规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=52-24248) · [首版](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=51-23751) · [分区透明](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=74-37804) · [全窗统一材质](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=75-38790) | 导航、问题切换、事件、预期、回放结果、工具用时和人工审阅共存, 研究板包含实物、局部对照、原尺寸组件、研究依据和本稿定义, 三版保持任务和位置一致以比较材质 |

三个历史成稿可检查图层和可见功能, 未绑定原型跳转, 新设计要把可操作的评审流程连接起来

开始制作时读[工作步骤](SKILL.md), 进入原稿和规范板逐项查看, 需要继续找实物时用 [Linear 原始素材](sources/linear/README.md)、[shadcn/ui 官网组件截图](sources/shadcn-ui/README.md) 和 [Apple 官方材料](sources/apple-glass/README.md), 原型和排版的自动检查见[检查说明](docs/lint.md)

有新业务时按功能补真实产品参考, 例如这组[多语言审阅与发布实物](sources/localization/README.md)收录 Xcode、Weblate、Mozilla Pontoon 及 GitHub 的 8 张截图, 可对照字符串编辑、建议差异和发布回归

看这套方法怎样用于新题目, 可以打开 Foldmap 的[参考取舍](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=164-77285)和[审阅首稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=165-77832), 对照德语译文缺少的 `{trip}` 和 Agent 建议, 再在[交互原型](https://www.figma.com/proto/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=165-78014&page-id=160%3A77215&starting-point-node-id=165%3A78014&scaling=scale-down&content-scaling=fixed)里采纳建议、运行复查并查看发布结果
