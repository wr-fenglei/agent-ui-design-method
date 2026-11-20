# Untitled UI React · 默认浅色 · Brand Purple

核对官网预览的计算样式、盒模型与 SVG, 并复核官方 React 源码, 官网实际使用 neutral 中性灰, CSS Lab 由 Chrome Canvas sRGB 转成十六进制, 弱图标是 #A1A1A1, 尺寸以 CSS px 表示, 字形按字号 / 行高, DOM 实测采用 1440 像素视口, 源码锁定提交 bff7606f3ce7

## 官网组件截图

| 组件 | 截图 | 预览页 |
|---|---|---|
| 按钮 · 主次及危险操作 | [PNG](../../originals/untitled-buttons.png) | [官网预览](https://www.untitledui.com/react/components/buttons#button-example) |
| 表单 · 默认输入 | [PNG](input-default.png) | [官网预览](https://www.untitledui.com/react/components/inputs#default) |
| 表单 · 错误输入 | [PNG](input-invalid.png) | [官网预览](https://www.untitledui.com/react/components/inputs#invalid) |
| 带点状态徽章 | [PNG](badges.png) | [官网预览](https://www.untitledui.com/react/components/badges#with-dot) |
| Simple 单层侧栏 | [PNG](sidebar.png) | [官网预览](https://www.untitledui.com/react/components/sidebar-navigations#simple) |
| 表格 · 默认 | [PNG](table.png) | [官网预览](https://www.untitledui.com/react/components/tables#table-example) |
| 下划线 Tab | [PNG](tabs.png) | [官网预览](https://www.untitledui.com/react/components/tabs#underline) |
| 复选框 · 标签和说明 | [PNG](checkbox.png) | [官网预览](https://www.untitledui.com/react/components/checkboxes#with-label-and-hint) |

## 实测与组件源码

| 组件 | 属性 | 值 | 证据 |
|---|---|---|---|
| 全局 · 默认 Light | spacing | 4 px, 根变量 .25rem | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/styles/theme.css) |
|  | 底色 · primary | #FFFFFF | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/buttons#button-example) |
|  | 底色 · secondary / primary hover | #FAFAFA | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 底色 · secondary hover / tertiary | #F5F5F5 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/styles/theme.css) |
|  | 文字 · primary | #171717 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/inputs#default) |
|  | 文字 · secondary | #404040 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/buttons#button-example) |
|  | 文字 · tertiary | #525252 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 四级文字 · placeholder | #737373 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/inputs#default) |
|  | 装饰图标 · 默认 | #A1A1A1 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 控件描边 · primary | #D4D4D4 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/inputs#default) |
|  | 分隔 · secondary | #E5E5E5 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 品牌主色 | #7F56D9 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/buttons#button-example) |
|  | 品牌 hover | #6941C6 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/buttons/button.tsx) |
|  | 品牌浅底 | #F9F5FF | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/badges#with-dot) |
|  | 品牌浅描边 | #E9D7FE | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/badges#with-dot) |
|  | 品牌焦点色 | #9E77ED | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/styles/theme.css) |
|  | 主题 | 官方 CLI 的 brand 保持默认紫色 | [官方页](https://www.untitledui.com/react/docs/installation) |
|  | 字体族 | Inter, 默认正文 400, 标签 500, 按钮 600 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/styles/theme.css) |
|  | 字体层级 | 12 / 18, 14 / 20, 16 / 24, 18 / 28 px | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/styles/theme.css) |
|  | 标题层级 | 20 / 30, 24 / 32, 30 / 38 px | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/styles/theme.css) |
|  | 轻阴影 · shadow-xs | 0 1 2 px rgba(0,0,0,.05) | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/styles/theme.css) |
| 按钮 · md | 高度和圆角 | 40 px 高 / 8 px 圆角 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/buttons#button-example) |
|  | 内边距 | 纵 10 px、横 14 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/buttons#button-example) |
|  | 字体 | 14 / 20 px 600 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/buttons#button-example) |
|  | 图标 | 20×20 px、原始 SVG 24 视框内 stroke 2 px、gap 4 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/buttons#button-example) |
|  | Primary 默认 | 紫底 #7F56D9、白字、白图标 60% 不透明 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/buttons#button-example) |
|  | Primary hover | 背景 #6941C6, 图标白 70% 不透明 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/buttons/button.tsx) |
|  | Primary 微描边 | 黑 18% 的 1 px 内线、底部黑 5% 内阴影、外部 shadow-xs、顶部白 12% 内线渐隐 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/buttons/button.tsx) |
|  | Secondary 默认 | 白底、#404040 字、1 px 内侧 #D4D4D4 环线 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/buttons#button-example) |
|  | Secondary hover | 底色 #FAFAFA、字色 #262626 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/buttons/button.tsx) |
|  | Tertiary 默认 | 透明底、无环线、#525252 字, hover 浅灰 #FAFAFA | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/buttons/button.tsx) |
|  | 键盘焦点 | 2 px 品牌轮廓、2 px offset | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/buttons/button.tsx) |
|  | 禁用 | 容器 opacity 50%, 保留尺寸 | [官方页](https://www.untitledui.com/react/components/buttons#disabled-buttons-example) |
|  | 大小 | xs 32 / sm 36 / md 40 / lg 44 / xl 48 px | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/buttons/button.tsx) |
| 输入框 · md | 高度和圆角 | 40 px 高 / 8 px 圆角 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/inputs#default) |
|  | 默认边距 | 纵 8 px、左右 12 px, 尾部图标时右 36 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/inputs#default) |
|  | 输入文字 | 16 / 24 px、400 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/inputs#default) |
|  | 标签 | 14 / 20 px、500、#404040, 星号间距 2 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/inputs#default) |
|  | 标签和说明间距 | 控件上下 6 px, 辅助文字 14 / 20 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/inputs#default) |
|  | 默认环线 | 1 px #D4D4D4 inset, shadow-xs | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/input/input.tsx) |
|  | 焦点环线 | 2 px #9E77ED inset | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/input/input.tsx) |
|  | 禁用 | 字段层 opacity 50% | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/input/input.tsx) |
|  | 错误显示 | 错误环线、尾部错误图标、独立错误文字 #E7000B | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/inputs#invalid) |
|  | 错误焦点 | 无焦点 1 px error-subtle, 有焦点 2 px error | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/input/input.tsx) |
| 徽章 · pill with dot | 高度 | sm 22 / md 24 / lg 28 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/badges#with-dot) |
|  | sm 字形与间距 | 12 / 18 px 500、纵 2 px、左 6 px、右 8 px、gap 4 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/badges#with-dot) |
|  | 圆点 | 8×8 px 视框、可见圆 6 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/badges#with-dot) |
|  | 圆角与环线 | 全圆角 9999 px、1 px inset | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/badges#with-dot) |
|  | 品牌浅底 / 环线 / 字 | #F9F5FF / #E9D7FE / #6941C6, dot #9E77ED | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/badges#with-dot) |
|  | 灰色浅底 / 环线 / 字 | #FAFAFA / #E5E5E5 / #404040, dot #737373 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/badges#with-dot) |
|  | 成功色浅底 / 环线 / 字 | #F0FDF4 / #B9F8CF / #008236, dot #00C950 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/badges#with-dot) |
| 表格状态 · modern sm | 官网实例 | Team members 表格中的 Active, BadgeWithDot modern sm | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 大小 | 高 22 px、Active 宽 60.2 px, 其他文本随测量宽度自适应 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 形状 | 圆角 6 px, 白底 #FFFFFF, 1 px #D4D4D4 内环线 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 轻阴影 | 0 1 2 px、黑色 5% | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 文本 | Inter 12 / 18 px、500、#404040 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 内边距与间距 | 纵 2 px、横 6 px, 点与文字间隔 4 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 点 | 8×8 px SVG、可见圆 6 px, 官网 Active 绿 #00C950 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
| 侧栏 · simple | 桌面栏宽 | 280 px、白底 #FFFFFF | [官方页](https://www.untitledui.com/react/iframe/sidebar-navigation/sidebar-navigation-simple-demo) |
|  | 内容首层边距 | 品牌及搜索横 20 px、顶部 20 px, 基础导航横 16 px, 示例行宽 247 px | [官方页](https://www.untitledui.com/react/iframe/sidebar-navigation/sidebar-navigation-simple-demo) |
|  | 栏右分割线 | 1 px #E5E5E5 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/sidebar-navigations#simple) |
|  | 行高 | 36 px、基础导航项间 2 px | [官方页](https://www.untitledui.com/react/iframe/sidebar-navigation/sidebar-navigation-simple-demo) |
|  | 行圆角与内边距 | 6 px 圆角、8 px padding | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/app-navigation/base-components/nav-item.tsx) |
|  | 标签 | 14 / 20 px、600 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/app-navigation/base-components/nav-item.tsx) |
|  | 图标 | 20×20 px、图标右距 8 px, 子路径无图标 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/app-navigation/base-components/nav-item.tsx) |
|  | 默认项 | 白底 / #404040 字 / #A1A1A1 图标 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/app-navigation/base-components/nav-item.tsx) |
|  | 当前项 | #FAFAFA 底 / #262626 字 / #737373 图标, aria-current=page | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/app-navigation/base-components/nav-item.tsx) |
|  | 当前项 hover | #F5F5F5 底 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/app-navigation/base-components/nav-item.tsx) |
|  | 子项 | 左内边距 40 px, 展开方向用 chevron | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/app-navigation/base-components/nav-item.tsx) |
| 表格 · TableCard | 外壳 | 白底、圆角 12 px、1 px #E5E5E5 外环线、shadow-xs | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/table/table.tsx) |
|  | 卡片标题区 | md 横 24 px 纵 20 px, 标题区后 1 px 分隔 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/table/table.tsx) |
|  | 列头背景 | #FAFAFA | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 列头文字 | 内层标签 12 / 18 px、600、#737373 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/table/table.tsx) |
|  | 列头高 | 实测 md 44 px、sm 36 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 数据行高 | 实测 md 72 px、sm 56 px, 随单元格内容 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | md 单元格间距 | 横 24 px、纵 16 px, 选择框后首列左 12 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | sm 单元格间距 | 横 20 px、纵 12 px | [官方页](https://www.untitledui.com/react/components/tables#table-small-size-example) |
|  | 单元格文字 | 14 / 20 px 400, 主名称可用 500 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 数据行分隔 | 1 px #E5E5E5, 最后一行取消重复边 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/table/table.tsx) |
|  | hover / selected | hover #FAFAFA, 可选 highlightSelectedRow 同色 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/table/table.tsx) |
| Tab · underline sm | 高度与字重 | 32 px、14 / 20 px、600 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tabs#underline) |
|  | 边距 | 上 0、横 2、下 10 px、圆角 0 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tabs#underline) |
|  | 选中 | 文字 #6941C6、2 px 下划线 #7F56D9 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tabs#underline) |
|  | 未选 | 文字 #737373、透明下划线, 组底 #E5E5E5 1 px | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tabs#underline) |
|  | 图标尺寸 | sm 16 px、md 20 px | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/tabs/tabs.tsx) |
| Checkbox | 框体大小及圆角 | sm 16×16 / 4 px、md 20×20 / 6 px | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/checkbox/checkbox.tsx) |
|  | 默认 | 白底、1 px #D4D4D4 内环线 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/checkbox/checkbox.tsx) |
|  | 选择与中间态 | #7F56D9 底、白色勾或短横 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/checkbox/checkbox.tsx) |
|  | 键盘焦点 | 2 px #9E77ED、offset 2 px | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/checkbox/checkbox.tsx) |
|  | 禁用 | 框体 opacity 50%, 未选禁用灰色填充 #F5F5F5 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/base/checkbox/checkbox.tsx) |
|  | 标签与提示 | sm 间隔 8 px、14 / 20 px 标签 500、提示 400 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/checkboxes#with-label-and-hint) |

## 本稿决定与避免项

这些是本稿组合策略, 官网或源码链接用于对照组件

| 分类 | 属性 | 值 | 对照 |
|---|---|---|---|
| 设计决定 | 主动作 | 每个动作组只放一个紫底主按钮, 其他用白底或无底样式 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/buttons#button-example) |
|  | 表格状态语义 | 三态均用 modern 白底灰边, In progress 用琥珀 #F0B100 点, Passed 用绿 #00C950 点, Needs review 用中性灰 #737373 点, 保留状态名称 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 右侧成功结果 | Checks passed 用浅填充的 success pill, 浅绿 #F0FDF4、描边 #B9F8CF、字 #008236, 点 #00C950 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/badges#with-dot) |
|  | 不切碎数据 | 同批记录放连续表格, 保留表头和分隔, 避免每行再套卡片 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
|  | 对比 | 正文使用主次文字灰, 淡灰仅用于装饰, 错误同时提供控件状态与文字 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/inputs#invalid) |
|  | 本稿尺幅 | 侧栏 280 px, 右详情 400 px, 详情作为相邻列, 非覆盖层 | [React 源码](https://github.com/untitleduico/react/blob/bff7606f3ce705f0ba5984f383f11f865024e1f7/components/application/slideout-menus/slideout-menu.tsx) |
|  | 视觉克制 | 用白/浅灰面和 1 px 中性分隔, 避免渐变底、代码无依据的蓝灰和每卡重阴影 | [官网预览 / DOM 样本](https://www.untitledui.com/react/components/tables#table-example) |
