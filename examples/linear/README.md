# Linear 底稿如何变成 Quarry 发布审查

[![Quarry 发布审查终稿, RL-238 保持选中, 右侧显示订单记录和可审阅的补丁](../../evidence/linear.png)](../../evidence/linear.png)

**从队列里的 RL-238 开始读**, 向右能看到订单 TEST-8072 在 09:41:12.083 首次确认后发出 `checkout_complete`, 在 09:41:12.516 重试时又发出一次, 下方 Codex 面板提出按订单号防重, 给出回归检查的结果和 `checkout-event.patch`, 图中的下一步是点 **Review patch** 审阅补丁 [终稿原图, 1440 × 940](../../evidence/linear.png)

## 从原窗口确定布局

[![参考原稿的桌面产品窗口, 左侧导航和队列、右侧详情、右下 Codex 浮窗](../../foundations/linear-source.png)](../../foundations/linear-source.png)

参考来自用户提供的 Linear 风格 Figma, 上图是落地页首屏内的产品窗口, 1320 × 720 px, 原任务是审查 UI-142 的截图, 设计者先查看颜色板和桌面首屏, 再把原窗口中的问题、证据和回复逐项换成发布调查的内容 [原窗口](../../foundations/linear-source.png) · [当时的制作记录](../../foundations/linear.md#quarry-第一稿是怎样画出来的)

| 用户在看什么 | 原窗口 | Quarry 稿的安排 |
|---|---|---|
| 当前调查项 | 「截图审查」队列选中「首屏标题行高过紧」 | 222 px 侧栏保留 Review queue, 373 px 队列保持 RL-238 选中, 后面留出 753 px 详情 |
| 支持判断的记录 | UI-142 的检查说明提到 1440 和 390 两个视口, 下方有活动记录 | 订单号放在证据表上方, 两行按时间、来源、事件名、结果对齐, 可以直接读出 433 ms 内发生了什么 |
| 审完能做什么 | 浮窗显示修改请求、两处排版调整和更新的 index.html, 底部可以回复 | 405 × 409 px 的浮窗从证据表底线下方 17 px 开始, 保留两条事件的可见空间, 同时显示补丁和审阅按钮 |

## Foundations, 用整张基础板检查取值

打开[完整基础板, 1440 × 4126](../../foundations/original/foundations.png)可从上至下看六段, 下图均按原版面分段, 点击可查看 1× 图, 纵向位置以整板上沿为 0, 区间含起点、止于终点前一像素

| 基础板上半部 | 基础板下半部 |
|---|---|
| **说明** · `5:243` · y 0–322 [![基础板说明](foundations/intro.png)](foundations/intro.png) | **圆角** · `5:396` · y 2680–3100 [![窗口、输入框、行、小元素和胶囊的半径](foundations/radius.png)](foundations/radius.png) |
| **颜色** · `5:247` · y 322–1468 [![表面、描边、四级文字、靛蓝强调色、状态色样本](foundations/color.png)](foundations/color.png) | **间距与布局** · `5:422` · y 3100–3700 [![间距刻度及桌面和手机布局数值](foundations/spacing.png)](foundations/spacing.png) |
| **字号** · `5:351` · y 1468–2680 [![桌面标题、正文、控件、等宽编号和手机标题的实际字样](foundations/type.png)](foundations/type.png) | **表面与阴影** · `5:475` · y 3700–4126 [![1 px 边线的平铺卡片和带阴影的浮层样本](foundations/elevation.png)](foundations/elevation.png) |

观察产品窗口时, 可以先找用色面积最大的页面底色 `#08090A`, 再对照 4 级字色和小面积靛蓝 `#5E6AD2`, 标题、正文、编号在字号表中各有字重和行高, 落地页的 56/64 px 大标题和产品窗口的 13/20 px 控件文字分别服务于阅读和操作, 面板边界则可以与基础板最后一段的平铺卡片和浮层对照

## Components, 从一行问题看状态和密度

[![原文件组件总览, 展示按钮、侧栏、列表、工具组、输入框和状态点的组合](../../foundations/original/components.png)](../../foundations/original/components.png)

[![同一条 UI-142 在普通和选中两种状态下的实际主组件](components/list-rows.png)](components/list-rows.png)

列表主组件宽 560 px、高 40 px, 普通与选中两行保留相同的列位置, 桌面首屏将实例收窄至 399 px 后隐藏标签, 手机收窄至 340 px 后也收起头像, 仍能依据状态、编号、标题和时间认出 UI-142, 对应节点是主组件 `4:37`、桌面 `7:303`、手机 `12:452`

组件页的总览旁边放着单独的 18 个图标、6 组带变体的组件和 3 个独立主组件, 打开下面的本地图集可逐一查看原生 1× 图, 其中也有按钮的两种尺寸、输入框获得焦点后的边线、工具按钮之间的间距 [全部 11 项组件与节点索引](components/README.md)

## Screens, 对照桌面和手机整页

原稿把规范、截图审查和压力测试做成同一落地页的三个案例, 桌面首屏保留三栏窗口与浮层, 手机首屏选取列表层, 工具栏与正文也随宽度改变, 整页原图和每章都可离线打开, 图内的通过与失败是设计稿中的演示状态 [桌面整图, 1440 × 7263](../../foundations/original/desktop.png) · [手机整图, 390 × 5771](../../foundations/original/mobile.png)

| 桌面 1440 px | 手机 390 px |
|---|---|
| **导航和首屏** · `7:3`, `7:19` · y 0–1264 [![桌面首屏与产品窗口](desktop/hero.png)](desktop/hero.png) | **导航和首屏** · `12:343`, `12:359` · y 0–976 [![手机首屏与问题队列](mobile/hero.png)](mobile/hero.png) |
| **三项制作原则** · `9:255` · y 1264–2185 [![桌面并列展示规范、样稿及截图](desktop/method.png)](desktop/method.png) | **三项制作原则** · `12:486` · y 976–1778 [![手机把相同原则纵向排列](mobile/method.png)](mobile/method.png) |
| **规范检查** · `9:324` · y 2185–3456 [![桌面审查规范值, 指出两项表外数值](desktop/rules.png)](desktop/rules.png) | **规范检查** · `12:501` · y 1778–2667 [![手机上的规范检查列表](mobile/rules.png)](mobile/rules.png) |
| **截图审查** · `10:267` · y 3456–4727 [![桌面上按状态组织截图审查问题](desktop/screenshot-review.png)](desktop/screenshot-review.png) | **截图审查** · `12:553` · y 2667–3503 [![手机上的截图审查问题](mobile/screenshot-review.png)](mobile/screenshot-review.png) |
| **压力测试** · `10:446` · y 4727–5998 [![桌面上的七条测试及运行中的 Agent 回复](desktop/stress-tests.png)](desktop/stress-tests.png) | **压力测试** · `12:606` · y 3503–4280 [![手机上的测试状态与条件](mobile/stress-tests.png)](mobile/stress-tests.png) |
| **四个制作步骤** · `10:677` · y 5998–6509 [![桌面由左至右串起四个步骤](desktop/steps.png)](desktop/steps.png) | **四个制作步骤** · `12:687` · y 4280–4969 [![手机纵向展示四个步骤](mobile/steps.png)](mobile/steps.png) |
| **行动按钮和页脚** · `10:713`, `10:720` · y 6509–7263 [![桌面行动按钮和页脚各栏](desktop/footer.png)](desktop/footer.png) | **行动按钮和页脚** · `12:722`, `12:729` · y 4969–5771 [![手机行动按钮和页脚各栏](mobile/footer.png)](mobile/footer.png) |

## 从 Quarry 首稿到终稿

[![Quarry 首次发布的设计稿, 显示选中问题、两条事件、活动记录、Agent 说明和补丁](../../foundations/original/quarry-first.png)](../../foundations/original/quarry-first.png)

首稿已经放入 8 项检查、事件证据、Agent 回复和审阅动作, 可以对照首稿和终稿同一位置的原始像素, 检查细节改动 [首稿整屏](../../foundations/original/quarry-first.png) · [终稿整屏](../../evidence/linear.png)

| 同一位置的首稿 | 终稿 |
|---|---|
| [![首稿队列右上角的搜索与筛选图标](revision/tools-first.png)](revision/tools-first.png) | [![终稿队列右上角居中的搜索与筛选图标](revision/tools-final.png)](revision/tools-final.png) |
| [![首稿浮窗中的增减数均为绿色, 输入框右侧快捷键区域空白](revision/patch-first.png)](revision/patch-first.png) | [![终稿浮窗中新增 8 行为绿色、删除 2 行为红色, 输入框右侧显示 Enter](revision/patch-final.png)](revision/patch-final.png) |

## 整板、节点和版本

| 原文件及页面 | 一级节点 | 完整离线图 |
|---|---|---|
| 项目 Mac Agent · Linear, `11:7039` | `11:7202`, 页内共有 1 张画板 | [Quarry 发布审查终稿](../../evidence/linear.png) |
| Linear 原文件 Foundations, `0:1` | `5:242`, 页内共有 1 张画板 | [基础板](../../foundations/original/foundations.png) |
| Linear 原文件 Components, `2:166` | `6:52` 及同页 10 项 | [总览](../../foundations/original/components.png) · [同页图标、组件集与主组件](components/README.md#原稿节点和本地图片) |
| Linear 原文件 Screens, `2:167` | `7:2` 桌面、`12:342` 手机, 页内共 2 张 | [桌面落地页](../../foundations/original/desktop.png) · [手机落地页](../../foundations/original/mobile.png) · [桌面内的产品窗口 7:29](../../foundations/linear-source.png) |

上表整图按 Figma 1× 导出核对, 基础板、桌面、手机的分段各保留整图宽度, 按表中纵向位置拼合可逐像素还原完整图, Quarry 首稿来自首次发布时保存的 PNG, 两版控件局部均从各自整稿同位置裁切 [Linear 风格原文件](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=0-1) · [Quarry 项目页](https://www.figma.com/design/scYOkdhE2byoPHW4Gk1aDL/Untitled?node-id=11-7039)
