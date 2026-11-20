# Linear 参考究竟影响了什么

**可以确认的是直接复制, 任务继承和验收偏好, 现有记录无法估算 Linear 让用户多喜欢了多少**, 首先要区分两个对象, 外部 Linear Figma 是参考, Quarry 是本项目按参考制作的 Mac Agent 基准, 本文的尺寸来自后者 [外部参考节点](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-29) · [Quarry 基准节点](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=11-7202) · [本项目基准的原尺寸 PNG](../evidence/linear.png)

## 按轮次归因

| 对象 | 已有证据 | 能回答的问题 |
|---|---|---|
| 项目 Linear 基准 | 绘图源定义暗色三栏, 选中队列行, 浮动 Codex 审查框和人工审阅入口 | 可说明本项目采用了哪些具体处理, 不能把其中的尺寸写成 Linear 产品的通用规范 |
| 历史 Still 换色试验 | 当时用户要求沿用 Linear 的内容和布局, 构建函数显式执行 `linear.clone()`, 对复制节点换填色, 描边色与阴影色, 再将子节点移入目标 Frame | 这版可确认直接继承几何与排版, 历史对读覆盖 186 个后代图层, 含 97 个文字层, 此处记录的是已撤下的版本 |
| Apple 液体玻璃 | 用户指定布局与组件细节参考 Linear, 材质参考 Apple, Apple 研究另查 Mail, Notes, 原生材质与符号, 其基准方案把证据放在中央, 检查器固定在右侧, 与 Linear 的浮动 Agent 区有差异 | 能确定参考意图与材质渠道, 各自对用户喜爱的贡献缺少独立测量 |
| shadcn/ui 与 Untitled UI | 用户要求采用 Linear 稿的工作顺序, 先定义细节再绘制, 组件规格则取自各自官方实物和组件资料 | 可确认制作方法延续, 某一尺寸可以回到其组件来源复核 |
| 末轮十个来源 | 共同简报固定任务与视口, 每项先有来源规范, 发布函数新建空白 Frame 后调用对应的 drawStudy, 十份规范的来源清单均未把 Linear 列为直接素材 | 可确认这十个发布入口各自绘制, 仍然存在项目历史, 用户反馈, 共用字体与画图工具等间接影响 |

[历史 Still 构建与测量记录](../evidence/still-history.md) · [基准绘图源](../evidence/linear.js) · [末轮发布路径](../evidence/publish-ten.js) · [共同简报](../evidence/production-brief.md) · [各稿参考与规则](../cases/index.md)

历史 Still 提供了一例可以解释用户反馈的局部变化, 它沿用了 Linear 的按钮形状和位置, 按钮文字对按钮底色的对比度从 4.70:1 升至 7.08:1, 按钮底色与周围面板的对比度却从 3.78:1 降至 1.48:1, 前者回答"能否读出按钮文字", 后者反映"能否辨出按钮的边界", 用户当时点名不喜欢无描边的浅紫色按钮, 两个读数能解释候选原因, 这轮同时替换了多种颜色和阴影, 仍无法单独证明原因

## 十稿究竟有多像基准

| 比较项 | 项目 Linear 基准 | 最后十稿 |
|---|---|---|
| 画板, 事件与审阅动作 | 1440 × 940, RL-238, 2 条事件, Review patch | 十稿一致, 这些项是共同输入 |
| 问题主标题 | Inter Medium 26 px | 32–58 px, 5 稿用 Inter, 3 稿用 Georgia, 1 稿用 Noto Serif, 1 稿用 IBM Plex Sans |
| Review patch 按钮 | 135 × 33 px, 圆角 6 px, 字号 12 px | 宽 126–328 px, 高 32–44 px, 圆角 0–7 px, 字号 13–15 px, 0/10 同时使用基准的宽和高 |
| 三栏结构 | 导航 / 队列 / 详情宽 222 / 373 / 753 px, 浮动 Agent 区 405 × 409 px | Appllama 有相似的阅读顺序, 三栏为 196 / 286 / 958 px, 其规范直接引用 Bear 的三栏编辑器, Anthropic 则把任务整理成居中单栏 |

这些数值是描述性比较, 尺寸由 Figma 原生节点和绘图源读出, 主标题取文字等于 Duplicate checkout events 的最大字号节点, 避开队列中的同名小标题, 尺寸匹配可以查证, 仅凭尺寸差异无法推断模型没受历史参考影响 [11 张画板逐项读数](../evidence/frame-measurements.json) · [Appllama 来源记录](../cases/appllama/case.json) · [Anthropic 来源记录](../cases/anthropic/case.json)

## 哪个问题还需要实验

用户对 Linear 的肯定证明这张稿符合当时的偏好, 同一轮还发生了任务文案固定, 组件来源核对, 先写规范, 迭代走查等变化, 若想知道给一个新会话看 Linear 图是否增加被选中的机会, 需要成对生成和匿名选稿, 实验分别记录偏好与相似度, 其结果也只适用于所选任务, 来源与评审者 [待执行的实验与评分表](linear-ablation.md)
