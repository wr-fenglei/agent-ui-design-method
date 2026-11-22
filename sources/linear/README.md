# Linear 风格原稿与 Linear 官方截图

前三张出自用户提供的 Linear 风格 Figma 设计文件, Quarry 以这份文件的桌面窗口为布局参考, 下方的 Inbox 来自 Linear 官方公开更新, 是本次补充的产品对照

| 原图 | 图中可核对的内容 | 出处与本地取得方式 |
|---|---|---|
| [桌面截图审查窗口](original-review-window.png) | 1320 × 720, 选中的 UI-142, 右侧详情及右下 Codex 浮窗 | Screens 页 `7:29`, 完整 1× 导出, 从历史提交 `0fa35e3` 的 `foundations/linear-source.png` 原样取回 [Figma 节点](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-29) · [历史原图](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/foundations/linear-source.png) |
| [选中行主组件](original-finding-row.png) | 560 × 40, 从左至右保留状态, 编号, 标题, 分类, 负责人和时间 | Components 页 `4:48` 内的 `4:37`, 从 592 × 112 的 1× 组件集导出图裁出 `[16,56,560,40]` [Figma 节点](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=4-37) · [历史组件集导出](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/examples/linear/components/list-rows.png) |
| [手机队列中的同一条问题](original-mobile-row.png) | 340 × 40, 同一状态, 编号, 标题和时间, 分类和负责人收起 | Screens 页 `12:452`, 从 390 × 976 的 1× 手机首屏裁出 `[25,758,340,40]` [Figma 节点](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=12-452) · [历史手机首屏](https://github.com/wr-fenglei/agent-ui-design-method/blob/0fa35e3/examples/linear/mobile/hero.png) |
| [官方 Inbox 顶栏与通知](official-inbox.png) | 顶部有筛选和显示设置, 下方两条通知各含标题, 活动说明, 状态与时间, 第一条显示选中底色 | Linear 在 2024-03-27 发布的更新页内找到 “New inbox”, 从 3312 × 1792 的配图裁出 `[1120,196,1599,633]`, 保留网页原图像素, 这些尺寸描述网页素材 [官方更新页](https://linear.app/changelog/2024-03-20-new-linear-ui) · [官方原图](https://webassets.linear.app/images/ornj730p/production/07674ddb4de363e709275146e817e5dc485a9a75-3312x1792.png) |

坐标均为从原图左上角起算的 `[x,y,宽,高]`, 查看原 Figma 节点需要该文件的访问权, 仓库内可直接打开这些 PNG

查找其他宽度的实际用例时, 在原 Figma 的 Screens 页查找 UI-142, 桌面实例宽 399 px, 仍有头像和时间, 可以和表中两种宽度逐项比对 [桌面实例](https://www.figma.com/design/cytw6jxvr7NDe0K406hGME?node-id=7-303)

查找 Linear 产品截图时, 在官方 Changelog 搜索 “New sidebar”, “New inbox” 或 “UI refresh”, 进入对应发布日期的文章点击原图, 要核对列表中的分组, 计数和显示字段, 可查官方文档的 Grouping 和 Display properties 小节 [官方设计更新](https://linear.app/changelog/2026-03-12-ui-refresh) · [Display options](https://linear.app/docs/display-options)
