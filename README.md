# 在 Figma 设计一张桌面 Agent 工作界面

默认交付一张首屏, 让用户在这张图上认出正在处理的对象, 看懂 Agent 发现了什么, 用原始证据判断下一步, 研究、参考和组件规范在 Figma 单独分区, 交付链接直接打开成稿

| 示例 | 打开哪些 Figma 节点 | 在画面里看什么 |
|---|---|---|
| Linear | [Foundations](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME/?node-id=5-242) · [Components](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME/?node-id=2-166) · [原始产品窗口](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME/?node-id=7-29) · [Quarry 成稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=11-7202) | 8 项检查按状态归组, 队列保留当前位置, 详情呈现原始记录, 浮窗包括 Agent 请求、附件、回归与待审补丁, 初稿就确定了这些区域之间的关系 |
| shadcn/ui | [整屏](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=47-20650) · [组件规范与官网实物](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=47-20892) | 先写出相隔 433 ms 的两个事件, 再对照官方 Dashboard 测量侧栏、表格和按钮, 在 Agent review 中串起请求、附件、三次工具活动、事件表和待审文件, Event trace 与 Patch 作为相邻视图 |
| Apple Liquid Glass | [来源与设计规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=52-24248) · [首版](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=51-23751) · [分区透明](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=74-37804) · [全窗统一材质](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=75-38790) | 导航、问题切换、事件、预期、回放结果、工具用时和人工审阅共存, 研究板包含实物、局部对照、原尺寸组件、研究依据和本稿定义, 三版保持任务和位置一致以比较材质 |

三个示例用来研究内容怎样同屏组织, 例如证据放在哪里, 表格怎样对齐, 工具怎样分组, 按当前任务选用这些做法, 浮窗和附属页面无需跟随示例制作

网页打不开或 `figmosha targets` 报本地锁错误时, 在已配对 Figmosha 的电脑上从仓库根目录运行 `python3 tools/read_figma_examples.py`, 命令按示例列出上表 10 个原生节点的名称、可用尺寸和抽样文字或子层, 读取不全时返回非零退出码, 文件未配对时按输出提示打开对应原稿和插件后重试

用节点 ID 定位整屏和组件规范, 在 Figma 画布查看队列、选中项、详情和审阅操作的位置关系, 再与规范板上的组件和产品实物逐项对照

开始制作时读[工作步骤](SKILL.md), 进入原稿和规范板逐项查看, 需要继续找实物时用 [Linear 原始素材](sources/linear/README.md)、[shadcn/ui 官网组件截图](sources/shadcn-ui/README.md) 和 [Apple 官方材料](sources/apple-glass/README.md), 首屏范围、组件和排版的自动检查见[检查说明](docs/lint.md)

有新业务时按功能补真实产品参考, 例如这组[多语言审阅与发布实物](sources/localization/README.md)收录 Xcode、Weblate、Mozilla Pontoon 及 GitHub 的 8 张截图, 可对照字符串编辑、建议差异和发布回归

需要设计多状态交互时, 可参考 Foldmap 的[参考取舍](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=164-77285)和[审阅首稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/?node-id=165-77832), 对照德语译文缺少的 `{trip}` 和 Agent 建议, 再在[交互原型](https://www.figma.com/proto/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=165-78014&page-id=160%3A77215&starting-point-node-id=165%3A78014&scaling=scale-down&content-scaling=fixed)里采纳建议、运行复查并查看发布结果
