# 在 Figma 中检查任务、组件和原型

在目标文件中打开并配对 Figmosha, 从仓库根目录执行以下命令, 选择 `figmosha targets` 输出的第二列文档 ID, 按回车检查当前 Figma 页, Python 3 只读连接本机的桥接服务

```sh
figmosha targets
printf 'Figmosha 文档 ID: '
read -r FIGMOSHA_TARGET
python3 tools/figma_lint.py --target "$FIGMOSHA_TARGET"
```

要读其他页, 加 `--page '页面精确名称'` 或 `--page '12:34'`, 原来浏览的页保持选中, 加 `--json` 可以查看各任务对应的组件集、整屏尺寸和来源链接, 返回码 0 表示自动检查通过, 1 表示发现需要处理的设计问题, 2 表示检查未完成

## 作者在画布上放什么

同一 Figma 页的顶层用四个 Section 或 Frame 分区, 卡片和状态画板使用业务名称, 作者直接在 Figma 中写说明、放实物、做组件和连接原型

| 分区名称 | 画布上的内容 | 自动检查及反馈 |
|---|---|---|
| 功能与任务 | 每项任务一个 Frame 或 Group, 写出谁对什么做什么、可见结果, 放入规范区组件的实例, 或在文字上添加指向该组件节点的文件内链接 | 每张卡单独检查任务说明和组件关系, 按主组件或组件集 ID 核对它是否实际出现在成稿中 |
| 参考实物 | 每项来源一个 Frame 或 Group, 放实际截图、采用或舍弃的理由和可点击的文字出处, 链接可以指向官网或 Figma 内的原件节点 | 读取图片填充和原图尺寸, 逐卡核对说明与链接, 定位缺图、纯文字地址和指回本卡的节点链接, 网页访问权限须用交付对象的账号打开确认 |
| 组件与规范 | 直接放本稿的原生主组件和关键状态的 Component Set, 标出实际字号或行高、间距和带用途的颜色值, 如 `正文 16 px, 组距 8 px, 正文色 #122334` | 原生变体的属性与可见内容都要有变化, 并核对关键组件在任务卡及成稿中的使用情况, 尺寸、字色是否适合任务由读者结合 1× 整屏判断 |
| 成稿 | 直接放各状态的原尺寸 Frame, 放入真实业务文字和规范区实例, 在控件上设原型操作, 例如按钮 `On click → Navigate to` 结果画板、结果按钮 `Back` 返回入口 | 检查可见原生文字、关联实例和重复画面, 从 Figma 原型起点检查各结果能否到达并返回, 缺少显式起点时取分区图层顺序中的第一张整屏 |

每条错误包含规则、图层名和节点 ID, 同一组件变体可代表多个任务中的实际操作, 任务是否覆盖需求、截图是否对应出处、参数是否与画面一致, 需要打开相关图层核对, 对变量条件分支、组件内状态及操作后的业务结果, 在演示器里按实际路径操作

对会联动的数值, 先按原始数据和产品规则算出预期, 再点击原型逐项核对, 例如 Foldmap 暂缓德语警告后, 译文通过数保持 9/12, 就绪语言从 0/3 变为 1/3, 重开暂缓记录再关闭, 两个计数都应保留, 这类判断依据来自当前产品, Figma 原型连通性由上面的命令检查

## 首稿的 1× 排版检查

在 Figma 将第一张原尺寸整屏导出为 `first.png`, 执行下列命令, 检查器按 PNG 左上角坐标报告空带、重复横线及需要回看原图的区域

```sh
python3 tools/design_density.py first.png --json
```

工具在同一底色上量相邻文字间距, 检查有独立底面的容器是否留下大块内边距, 区分只隔开短字段的连续横线和有多列可比较数据的表格, 曾在旧稿测到 67 px 空带, 前后相邻间距为 16 和 27 px, 右栏 4 条 782 px 横线隔开 3 行短字段, 遇到渐变、照片留白或状态切换预留空间时, 打开对应位置判断

读图审校也可以把待评图片直接传给这条命令, 即使退出码为 0 也要查看 `manualReview`, 例如三条等距横线之间仅有两行短字段时会提示复看该区域, 请在图上判断横线是否帮助跨列读数, 然后逐区核对按钮和图标的位置

## 复核既有的像素清单

已有状态 PNG 和机器清单的历史交付可以执行 `python3 tools/design_lint.py spec.json --layout-only` 重测各状态的排版, 执行 `python3 tools/design_lint.py spec.json --json` 复核已有的按钮对齐、界面色、文字对比及作品换图记录, 路径相对于清单, 新稿从上面的 Figma 命令和首稿 PNG 命令开始

## 运行检查器测试

```sh
node --test tools/test_*.js
python3 -B -m unittest discover -s tools -p 'test_*.py'
```

若已有能调用 Figma Plugin API 的控制台, 依次加载 [figma_flow.js](../tools/figma_flow.js) 和 [check_design_page.js](../tools/check_design_page.js), 执行 `await checkDesignPage(figma)` 读取当前页, 或传入 `{page: '页面精确名称'}` 读取指定页, 超链接和可见文字的读取依据 [Figma TextNode 文档](https://developers.figma.com/docs/plugins/api/TextNode/), 主组件和实例的关系依据 [Figma ComponentNode 文档](https://developers.figma.com/docs/plugins/api/ComponentNode/)
