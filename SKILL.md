---
name: agent-ui-design-method
description: 从完整界面图片和制作过程出发, 设计 Agent 工作台, 交付可编辑界面、设计规范和原尺寸预览
---

# 画一张 Agent 界面

1. **打开参考图** 用图片查看工具打开下表的整屏原图, 挑一张适合当前任务的, 再打开该案例的过程图, 找出用户先看哪里、主要分区各占多少、标题和正文字号、底色和强调色各用在哪里
2. **先画布局** 用同一份任务、证据和操作画两种灰度构图, 在研究板上与选中的整屏并排, 标明沿用的布局、颜色、间距和因任务而改动的地方, 上色前选定一张
3. **定义组件再画成稿** 写出下列要素的取值、用途和关键状态, 用 Figma 样式与主组件绘制, 保留原尺寸样本、完整首稿和操作后的界面
4. **交付前检查** 导出 1× 成稿、结果和研究板, 保留修订前后同位置的图, 将[清单模板](tools/design-system.template.json)复制到交付目录并填入实测值, 运行 `python3 tools/design_lint.py 交付目录/design-system.json`, 修完报错再交付
5. **自己看导出图** 将参考与成稿按相同显示比例并排, 核对视觉重心、字级、色彩面积和疏密, 回到 1× 检查文字裁切、图标居中和按钮状态, 随稿附上调整的位置, 由用户确认视觉取舍

**设计系统必填要素** 任务与状态 · 网格、分栏与对齐 · 字体、字重、字号与行高 · 色彩角色与文字对比 · 间距与密度 · 边界与圆角 · 图标尺寸与线宽 · 材质取舍 · 组件与交互状态 · 主次操作与结果

| 示例 | 整屏原图 | 制作过程与规范图 |
|---|---|---|
| Linear | [队列与调查详情](evidence/linear.png) | [布局基准、组件与各屏](examples/linear/README.md) |
| shadcn/ui | [调查经过与证据表](references/shadcn-ui.png) | [从官网实物到审阅页](examples/shadcn-ui/README.md) |
| Untitled UI | [问题列表与侧栏详情](references/untitled-ui.png) | [表格、状态与详情面板](examples/untitled-ui/README.md) |
| Apple Liquid Glass | [全窗统一左栏材质](references/apple-process/uniform.png) | [实物、材质实验与三个版本](examples/apple-glass/README.md) |
