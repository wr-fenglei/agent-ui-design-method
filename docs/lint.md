# 在 Figma 中检查 Mac Agent 首屏

在目标文件中打开并配对 Figmosha, 从仓库根目录执行以下命令, 选择 `figmosha targets` 输出的第二列文档 ID, 按回车检查当前 Figma 页, Python 3 只读连接本机的桥接服务

```sh
figmosha targets
printf 'Figmosha 文档 ID: '
read -r FIGMOSHA_TARGET
python3 tools/figma_lint.py --target "$FIGMOSHA_TARGET"
```

默认模式 `single-screen` 检查一个 Mac Agent 主窗口的首屏, 选择其他页时加 `--page '页面精确名称'` 或 `--page '12:34'`, 加 `--json` 可查看检查模式, 任务关联的组件, 整屏尺寸和来源链接, 返回码 0 表示自动检查通过, 1 表示发现设计问题, 2 表示检查未完成

## 在同一 Figma 页检查四个分区

用下表的四个名称命名页面顶层的 Section 或 Frame, 任务卡和来源卡各用一个 Frame, Group 或 Section, 直接放在所属分区下, 在 `成稿` 直接放一张原尺寸主窗口 Frame, 其中只呈现窗口打开时可见的任务内容

| 分区名称 | 画布上的内容 | 自动检查及反馈 |
|---|---|---|
| 功能与任务 | 围绕同一项任务写出当前对象, Agent 已完成的工作和用户此时要做的判断, 写清所需字段和依据, 给任务卡放入规范区实例或设置指向组件节点的文字链接 | 逐卡检查说明, 组件关系, 按主组件或组件集 ID 核对关联组件是否用在成稿中 |
| 参考实物 | 按来源放截图, 可点击的出处和取舍理由, 指出图中哪一处解决了首屏的具体问题, 如长译文怎样与原文逐项对读 | 读取图片填充和原图尺寸, 逐卡检查说明和链接, 报告缺图, 未设置超链接的地址和指回本卡的节点链接 |
| 组件与规范 | 用当前任务的数据制作 1:1 原生主组件, 将影响判断的状态放进 Component Set, 例如用同一条原文展示译文遗漏变量和保留变量的两种标记, 标出字体, 间距和颜色用途, 如 `正文 16 px, 组距 8 px, 正文色 #122334` | 检查规范数值, 变体属性与可见差异, 核对关键样件是否同时关联任务卡并在成稿中使用 |
| 成稿 | 在一个首屏呈现当前任务对象, Agent 给出的具体内容及其依据, 根据任务放入对应的用户操作, 保留当前状态的组件实例, 弹窗, 操作结果和附属功能不纳入首屏 | 核对成稿 Frame 数量及规范区实例, 逐项匹配任务卡指定的可见文字, 检查跨画板跳转, 打开浮层的原型动作及可识别的静态弹窗 |

研究板, 首稿对照或样件可放在相应的资料分区内, 若另设页面顶层辅助板, 可命名为`研究`, `研究板`, `首稿`, `试排`, `首稿与试排` 或 `原尺寸样件`

在核心任务卡中, 将任务说明和名为 `首屏核对` 的原生文字图层放在组件实例外, 核对图层每行写一项首屏应显示的具体文字, 可跨任务卡汇总, 至少选两项不同的值, 对象, 判断依据, 建议或操作按任务选择, 例如 Foldmap 的德语审阅可用这条记录的键名, 英语原文和待改译文

```text
trip.export.progress
Exporting {trip}…
Reise wird exportiert …
```

检查器在首屏完整可见的原生文字图层中逐项查找, 可在一段长文字中匹配完整的值, 例如 `SG-1042` 无法匹配要求的 `SG-104`, JSON 报告中的 `contentChecks` 列出每项原文和匹配结果, 对图像和波形可填写首屏已有的图号, 测量值或单位, 在 1× 原图查看图像实际呈现的差异

每条错误列明规则和对应图层的名称与节点 ID, 在 Figma 打开相应图层核对, 用接收方账号打开来源链接, 确认截图对应原件

按 1× 查看主窗口, 在画面中找到研究使用的那条记录, 例如原文里的 `{trip}`, 遗漏该变量的德语译文, 以及 Agent 建议的改动, 逐项对照后判断这次修改是否有依据, 使用模拟记录时在研究板注明, 对合并成一张位图的弹窗或其他遮挡, 在首屏原图上核对

## 明确要求交互流程时

当需求明确要求可操作的交互流程时, 在 `成稿` 内放入该流程所需的起始和结果 Frame, 在控件上设置原型操作, 在仓库根目录执行

```sh
python3 tools/figma_lint.py --target "$FIGMOSHA_TARGET" --mode workflow
```

此模式检查重复画面, 各结果从原型起点能否到达及返回, 未配置起点时使用成稿区图层顺序中的第一张整屏, 在演示器实际核对条件分支, 组件内状态及操作后的业务值, 例如 Foldmap 暂缓德语警告后, 按产品规则核对译文通过数保持 9/12, 就绪语言从 0/3 变为 1/3, 重开暂缓记录再关闭后两项计数都应保留

## 首稿的 1× 排版检查

在 Figma 将 `成稿` 中的主窗口按 1× 导出为 `first.png`, 执行下列命令, 检查器按 PNG 左上角坐标报告空带, 重复横线及需要回看原图的区域

```sh
python3 tools/design_density.py first.png --json
```

工具在同一底色上量相邻文字间距, 检查有独立底面的容器是否留下大块内边距, 区分只隔开短字段的连续横线和有多列可比较数据的表格, 曾在旧稿测到 67 px 空带, 前后相邻间距为 16 和 27 px, 右栏 4 条 782 px 横线隔开 3 行短字段, 遇到渐变, 照片留白或状态切换预留空间时, 打开对应位置判断

读图审校也可以把待评图片直接传给这条命令, 即使退出码为 0 也要查看 `manualReview`, 例如三条等距横线之间仅有两行短字段时会提示复看该区域, 请在图上判断横线是否帮助跨列读数, 然后逐区核对按钮和图标的位置

Figma 或 HTML 首屏用 1× PNG, 执行 `python3 tools/design_palette.py first.png primary=100,80 selected=32,96 reading=280,160`, 把示例坐标换成从左上角量得的主按钮底, 选中导航底和阅读表面像素, 避开字形和照片, 独立成功提示可加 `success=x,y`
命令只核对指定点, 输出角色, 坐标和色值, 返回 1 表示命中项目限制的绿色, 3 表示浅绿或相邻色需对照原图复核, 2 表示输入无效, 0 表示这些样点未触发规则

## 复核既有的像素清单

已有状态 PNG 和机器清单的历史交付可以执行 `python3 tools/design_lint.py spec.json --layout-only` 重测各状态的排版, 执行 `python3 tools/design_lint.py spec.json --json` 复核已有的按钮对齐, 界面色, 文字对比及作品换图记录, 路径相对于清单, 新稿从上面的 Figma 命令和首稿 PNG 命令开始

## 运行检查器测试

```sh
node --test tools/test_*.js
python3 -B -m unittest discover -s tools -p 'test_*.py'
```

若已有能调用 Figma Plugin API 的控制台, 依次加载 [figma_flow.js](../tools/figma_flow.js), [figma_screen_scope.js](../tools/figma_screen_scope.js) 和 [check_design_page.js](../tools/check_design_page.js), 执行 `await checkDesignPage(figma)` 检查当前页的首屏, 用 `{page: '页面精确名称'}` 指定页, 明确要求交互流程时用 `{mode: 'workflow'}` 启用原型检查, 图层和实例关系见 [Figma TextNode 文档](https://developers.figma.com/docs/plugins/api/TextNode/) 及 [Figma ComponentNode 文档](https://developers.figma.com/docs/plugins/api/ComponentNode/)
