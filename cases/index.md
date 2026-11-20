# 十个 Mac Agent 案例

10 张稿共用 1440 × 940 px 视口和同一次结算事件调查, 每张左上角为画布坐标原点, 单位均为 px

| 来源 | 布局 | 观察与规则 | 看图 |
|---|---|---|---|
| Anthropic Frontend Design | 编辑部式发布审查手记 | [8 项来源 / 12 条规则](anthropic/case.json) | [PNG](anthropic/design.png) · [Figma 设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-40146) · [Figma 素材及规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=87-39033) |
| Impeccable | 双分支事件路径与审查工作栏 | [6 项来源 / 10 条规则](impeccable/case.json) | [PNG](impeccable/design.png) · [Figma 设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-40223) · [Figma 素材及规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=87-39122) |
| UI UX Pro Max | 事件记录与可展开的字段检查器 | [7 项来源 / 10 条规则](promax/case.json) | [PNG](promax/design.png) · [Figma 设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-40356) · [Figma 素材及规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-39784) |
| Google Stitch · DESIGN.md | 编辑式事件时间线与补丁审阅栏 | [7 项来源 / 12 条规则](stitch/case.json) | [PNG](stitch/design.png) · [Figma 设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-40468) · [Figma 素材及规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=87-39192) |
| Hallmark | 纸面证据校样与右侧审查批注 | [6 项来源 / 10 条规则](hallmark/case.json) | [PNG](hallmark/design.png) · [Figma 设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-41131) · [Figma 素材及规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-39924) |
| v0 Design Mode | 左侧选区检查器与右侧事件预览 | [6 项来源 / 10 条规则](v0/case.json) | [PNG](v0/design.png) · [Figma 设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-41242) · [Figma 素材及规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-39852) |
| Mobbin MCP | 事件脉冲图与日志回放台 | [6 项来源 / 12 条规则](mobbin/case.json) | [PNG](mobbin/design.png) · [Figma 设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-42516) · [Figma 素材及规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-40064) |
| Refero | 双事件对照与请求体检查 | [6 项来源 / 12 条规则](refero/case.json) | [PNG](refero/design.png) · [Figma 设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-40586) · [Figma 素材及规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=87-39266) |
| Lapa Ninja | 笔记式调查报告与页边批注 | [7 项来源 / 10 条规则](lapa/case.json) | [PNG](lapa/design.png) · [Figma 设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-40694) · [Figma 素材及规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=87-39344) |
| Appllama | 三栏调查笔记与正文内事件表 | [7 项来源 / 12 条规则](appllama/case.json) | [PNG](appllama/design.png) · [Figma 设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-40835) · [Figma 素材及规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=110-39996) |

## 如何读一份记录

- `refs` 按原规范板顺序收录证据, `kind` 说明发布者和素材性质, `note` 写明观察点, `url` 指向原出处, `image` 标识实际入板的参考图, 有单独原图地址时存为 `image.url`, 其余可在对应 Figma 素材板查看
- `rules` 中的 `ref` 从 1 开始计数, 可找到支撑这项决定的素材, `value` 写本稿取值, `why` 说明选取理由, 每份的 `avoid` 保留制作时使用的负面提示
- `reviewPatch.box` 依次是按钮相对画布的 x, y, 宽, 高, `cornerRadius` 和 `fontSize` 分别是按钮圆角和标签字号, 数值来自最终 Figma 节点
- `qa` 是交付当时的检查记录, 包含可见文字数, 文字对比度采样数, 最低值及该值对应的文字, 几何检查, 必需文案和素材数量, `export.sha256` 可与仓库所附 PNG 对照
- 制作时在同一画板分别导出原图和隐藏文字的副本, 取有文字差异的位置采样背景并计算对比度, 静态截图覆盖本次展示的状态, 交互行为和用户偏好需分别验证

[返回制作方法](../README.md)
