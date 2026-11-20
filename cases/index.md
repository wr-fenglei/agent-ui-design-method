# Mac Agent 设计稿与规范

前两组都是 1440 × 940 的 Mac 工作台, 一笔订单在 433 ms 内发出两次结算事件, Agent 提交修补建议和验证结果, 由人审阅补丁

## Quarry × Still 五稿

五稿采用用户在 Still 中选定的组件, 各自选择适合本次调查的证据呈现方式 [五稿总览](../evidence/quarry-still.jpg)

| 方案 | 证据的呈现与用途 | Figma |
|---|---|---|
| 事件回放 | 用时间线标出 433 ms 间隔, 在下方列出对应的两条记录 | [设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68691) · [来源与规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68690) |
| 事件日志 | 在各自记录下展开 JSON, 对照相同的订单字段和变化的触发条件 | [设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68693) · [来源与规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68692) |
| 重试路径 | 沿着客户端到事件写入端的两行记录, 定位触发第二次写入的网络重试 | [设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68695) · [来源与规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68694) |
| 双记录核证 | 将订单, 事件名, 触发条件和时间逐字段并排核对, 确认两条记录属于同一订单 | [设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68697) · [来源与规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68696) |
| 补丁审阅 | 对照代码差异和本地回放, 查看补丁如何按订单防重, 以及两次重试的结果 | [设计稿](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68699) · [来源与规范](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=118-68698) |

## 十个来源对照

此轮每个方案研究一个独立来源, 可在同一项审阅任务中比较不同来源的布局与控件 [十稿总览](../evidence/ten-studies.jpg)

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

### 十个来源的案例记录

- `refs` 按原规范板顺序收录证据, `kind` 说明发布者和素材性质, `note` 写明观察点, `url` 指向原出处, `image` 标识实际入板的参考图, 有单独原图地址时存为 `image.url`, 其余可在对应 Figma 素材板查看
- `rules` 中的 `ref` 从 1 开始计数, 可找到支撑这项决定的素材, `value` 写本稿取值, `why` 说明选取理由, 每份的 `avoid` 保留制作时使用的负面提示
- `reviewPatch.box` 依次是按钮相对画布的 x, y, 宽, 高, `cornerRadius` 和 `fontSize` 分别是按钮圆角和标签字号, 数值来自最终 Figma 节点
- `qa` 是交付当时的检查记录, 包含可见文字数, 文字对比度采样数, 最低值及该值对应的文字, 几何检查, 必需文案和素材数量, `export.sha256` 可与仓库所附 PNG 对照

## 换一道题试试

我们让一个没有读过项目对话的 Agent 只从这个仓库取设计参考, 用样例文件名做一张静态稿, 给它的题目是

> 在 Mac 上预览三个文件的新名字, 其中两个原本会重名, 让人知道冲突在哪里、Agent 怎样解决、下一步怎么确认, 文件还没改名

两张照片原本都会叫「海岸.jpg」, 看图时可以找出 Agent 给它们加了什么、三份文件将分别叫什么、哪一步仍等人确认

[看整屏](../examples/file-rename/preview.png) · [看原尺寸小样](../examples/file-rename/components.png) · [整屏 HTML](../examples/file-rename/preview.html) · [小样 HTML](../examples/file-rename/components.html)

首稿把选中行和确认按钮都画成了紫色, 复核 Still 的选色范围后, 把按钮改成石墨色, 淡紫留给选中行, 另调深了原先难读的路径分隔符, 终稿在 1440 × 940 下检查过文字和控件边界

另一位 Agent 只看成稿就指出了哪两张照片会重名、各自增加的时间, 也认出了三个文件都还没改名, 两份 HTML 下载后可离线打开

[制作与验收方法](../docs/method.md)
