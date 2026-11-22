# 用真实参考设计桌面 Agent

交付时打开一张主界面, 用户能认出当前处理的对象、核对 Agent 的证据、作出决定, 旁边的两块板分别回答「参考了哪些产品」和「这个界面的组件怎样制作」

从下面三个示例读起, 选一个作为布局依据, 用同业务的产品实物决定字段、状态和操作

| 示例 | 打开哪些 Figma 节点 | 在画面里看什么 |
|---|---|---|
| Linear | [Foundations](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME/?node-id=5-242) · [Components](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME/?node-id=2-166) · [原始产品窗口](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME/?node-id=7-29) · [Quarry 成稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=11-7202) | 8 项检查按状态归组, 队列保留当前位置, 详情呈现原始记录, 浮窗包括 Agent 请求、附件、回归与待审补丁, 初稿就确定了这些区域之间的关系 |
| shadcn/ui | [整屏](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=47-20650) · [组件规范与官网实物](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=47-20892) | 先写出相隔 433 ms 的两个事件, 再对照官方 Dashboard 测量侧栏、表格和按钮, 在 Agent review 中串起请求、附件、三次工具活动、事件表和待审文件, Event trace 与 Patch 作为相邻视图 |
| Apple Liquid Glass | [来源与设计规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=52-24248) · [首版](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=51-23751) · [分区透明](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=74-37804) · [全窗统一材质](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=75-38790) | 导航、问题切换、事件、预期、回放结果、工具用时和人工审阅共存, 研究板包含实物、局部对照、原尺寸组件、研究依据和本稿定义, 三版保持任务和位置一致以比较材质 |

[Foldmap 的参考实物](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=164-77285)展示了如何把这套方法用到另一个业务, 12 张来源图按 6 个决定成对排列, [组件与规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=165-77401)展示审阅行、译文对照、Agent 检查、决定、发布门槛和复查结果, [审阅首稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=165-77832)把同一条德语记录的原文、缺少的占位符、候选译文和审阅动作放在一起

**开始制作**　打开[工作步骤](SKILL.md), 先确定一条需要人工判断的记录, 再打开三份 Figma 示例, 也可运行 `python3 tools/read_figma_examples.py` 定位原件, 仓库附有各例的整屏和原尺寸组件截图

**查参考**　[Linear 原稿与官方产品图](sources/linear/README.md) · [shadcn/ui 官网组件](sources/shadcn-ui/README.md) · [Apple 官方图与材质指南](sources/apple-glass/README.md) · [多语言工具实物](sources/localization/README.md)

**验收**　[参考实物](docs/reference-native.md) · [组件与规范](docs/spec-native.md) · [运行 lint](docs/lint.md)
