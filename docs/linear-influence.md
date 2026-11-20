# Linear 影响了哪些设计决定

项目里的 Quarry 基准稿把发布调查组织为审查队列、事件证据、Agent 回复和人工审阅, 后续多组沿用了这项任务, 下文的尺寸来自项目基准稿 [外部 Linear 参考](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-29) · [Quarry 基准稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=11-7202) · [基准导出](../evidence/linear.png)

| 设计组 | 能查证的影响 |
|---|---|
| 早期 Still 换色稿 | 构建函数直接复制 Quarry 基准再替换填色、描边和阴影, 186 个后代图层中含 97 个文字层, 两稿的内容、位置、尺寸、字号和圆角逐项相同 [构建与按钮测量](../evidence/still-history.md) |
| shadcn/ui、Untitled UI 与 Apple | 两个组件库沿用先定义细节再绘制的顺序, 控件取值来自各自组件, Apple 稿参考 Linear 的布局细节, 用右侧固定检查器呈现审查, 材质取自 macOS 实物与实验 [shadcn/ui 稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=47-20650) · [Untitled UI 稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=50-21410) · [Apple 来源与设计规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=52-24248) |
| 十个来源对照稿 | 共同简报固定调查任务, 各稿在空白画板上按各自的来源规范绘制, 项目历史对设计者可见 [制作条件](../evidence/production-brief.md) · [发布函数](../evidence/publish-ten.js) · [各稿参考](../cases/index.md) |
| Quarry × Still 五稿 | 五位设计者均参考项目的 Linear、组件库研究和来源研究三页, 共用调查事实与待审状态, 使用用户选定的 Still 组件, 按 Apple 规范板的方法研究材质与层级, 各自安排证据, 例如日志稿展开两条原始记录, 核证稿按字段并排 [事件日志](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68693) · [双记录核证](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68697) |

## 十个来源稿与基准的尺寸对照

| 比较项 | Quarry 基准稿 | 十个来源稿 |
|---|---|---|
| 问题主标题 | Inter Medium, 26 px | 32–58 px, 5 稿用 Inter, 3 稿用 Georgia, 另 2 稿分别用 Noto Serif、IBM Plex Sans |
| Review patch 按钮 | 135 × 33 px, 圆角 6 px, 字号 12 px | 宽 126–328 px, 高 32–44 px, 圆角 0–7 px, 字号 13–15 px, 十稿均与基准的宽高组合不同 |
| 内容分区 | 三栏宽 222 / 373 / 753 px, 浮动 Agent 区 405 × 409 px | Appllama 借鉴 Bear 三栏编辑器, 栏宽 196 / 286 / 958 px, Anthropic 把调查整理成居中单栏 |

这些读数可以核对哪些规格被沿用, 各轮还改变了任务约束、组件来源与评审方式, 现有样本无法估算 Linear 对用户偏好的独立贡献 [11 张画板的原生测量](../evidence/frame-measurements.json) · [Appllama 来源记录](../cases/appllama/case.json) · [Anthropic 来源记录](../cases/anthropic/case.json)

## 待执行的对照实验

要检验额外提供一张 Quarry 基准图是否影响选稿, 可使用同一任务、素材包、模型设置与制作预算, 只向每对中的一组提供基准图

1. 从 Anthropic、Mobbin、Appllama 各生成 3 对, 每稿从空白画板和独立会话开始, 素材包排除历史稿与评语, 保留每次的首份导出
2. 在同一设备与缩放下随机左右位置, 隐藏来源和基准图, 请用户先选日常愿意使用的一张或持平, 并指出影响选择的细节
3. 锁定偏好后展示基准图, 再随机左右位置评相似度, 最后揭晓分组, 对两项指标分别报告两组获选数、持平数、有效对数和无效原因

这项实验的结论只适用于上述任务和评审条件
