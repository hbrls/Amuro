# Current Task

## 讨论主题

Whiteboard 从侧边栏 Panel 形态移动为会话头部 ConversationView（与 Chat / Trajectory 同级的 ViewTab）。

方案讨论已收敛，本文档是交给实施 Agent 的完整交接：技术机制、实施步骤、代码边界、验收标准、已知坑。

## 当前决策（已冻结，不再讨论）

1. **形态**：注册为 `conversation.view` 条目，id 用 `"whiteboard"`，tab 名 "Whiteboard"，`order: 90`（顺序最终形态：Chat 0 → Trajectory 10 → Whiteboard 90）。
2. **生命周期**：lazy mount——切到 tab 才挂载，切走即卸载，切回重新 mount；**不做 keep-alive，不做 anchor**，viewport 回 fitView 默认值可接受（DEFAULT_ZOOM 0.75）。
3. **数据源**：唯一数据源是 `src/client/database.js` 静态烘焙数据（6 Twig / 25 节点 / 19 边），一切数据行为照旧；**本期不接 Hub MCP，不做任何数据对接改造**。
4. **Composer**：零改造。tab 激活时输入框就是官方当前 session 的 composer（conversation.view 架构默认行为：composer 在 viewArea 之外 sticky bottom，切视图时保留）。
5. **节点上的对话按钮**：不管它。按钮现依赖 WhiteBoardPage 的 Conversation providers；新 ViewTab 不含抽屉时按钮自然变 no-op（VisitNode 已有 `!conversation` 守卫），可接受，不修不删。
6. **旧 Panel 代码**：`src/client/index.tsx` 中三段注册（`sidebar.panellist` 图标、`whiteboard.conversation`、`main` keyed Panel）**保持原样一行不动**。旧 Panel 与新 ViewTab 平行共存，等 ViewTab 调试完成后再回来讨论合并或迁移。
7. **其余代码直接拿来改**：WhiteBoardPage 等组件可直接在原文件上修改，不需要保证旧 Panel 渲染效果——本期只调试 ConversationView。
8. **范围外**：Hub / MCP / Desktop 上游零改动、零 patch；session↔node 映射、Update 功能、进度语义、数据过滤均不涉及。

## 技术机制要点（已从官方 bundle 实证）

### conversation.view 契约

- slot 类型：`conversation.view`，list，scope `session`；会话头部 tab 行由 `slots.entries("conversation.view")` 生成，渲染 `renderSlot("conversation.view", props, { only: activeViewId })`。
- 参考实现是官方 Trajectory 插件（`dsh-client-ui-trajectory`）：

```ts
ctx.slots.inject("conversation.view", () => ctx.slots.register({
  name: "conversation.view",
  id: "whiteboard",
  order: 90,
  label: "Whiteboard",          // 或 () => string；官方用 locale t()，从简可用字面量
  // children/inject 均可省略——白板不需要子 slot、不需要 session hooks
}, WhiteboardView))
```

- tab 行显示条件：`tabs.length > 1`。注册后 Chat 旁即出现 Whiteboard tab；Trajectory 受 developerTools 开关过滤，白板**不挂任何开关**，常显。
- 视图激活记忆（activateView / readConversationViewPreference）由官方按 session 处理，插件无需关心。
- 无 onShow/onHide 回调；"用户切到 tab" 等价于组件 mount（useEffect）。

### 生命周期与渲染

- 视图内容挂载在 `viewArea`（flex column 容器）内；官方视图都是纵向滚动列表，ReactFlow 画布需要撑满高度——组件根用 `height: 100%`（或 absolute inset）确保 RF 拿到非零尺寸，这是本任务最主要的适配点，调试时重点看。
- composer 在 viewArea 外层（`composerSeat`，sticky bottom），与本 slot 内容互不干扰，无需处理。

## 实施步骤

全部改动限于 `packages/dsh-plugin-whiteboard`（client 半），develop 分支。

1. **新组件** `src/client/WhiteboardView.tsx`：
   - 从 `WhiteBoardPage.tsx` 取画布部分：ReactFlow + Background/MiniMap/Controls/ZoomIndicator + `derivePositions` 全板推导 + module 级 `nodeTypes`（RF v12 要求稳定引用，保持模块级常量）；
   - 不带：WhiteBoardContext / WhiteBoardConversationContext providers、右侧会话抽屉、SessionProvider/renderSlot 逻辑；
   - 根容器保证 `viewArea` 内撑满高度；
   - 数据：`import { twigs } from './database.js'`（文件已在位，21.5KB）。
2. **新注册** `src/client/index.tsx`：在现有 apply 内**追加**一段 `ctx.slots.inject("conversation.view", …)`（上面契约代码），不动既有三段注册。可与步骤 1 一起做。
3. **构建**：`pnpm run bundle`（tsdown，entry 即 `src/client/index.tsx`）。
4. **调试**：重启 Desktop 使新 client bundle 生效（client-plugin HMR 仅在 `pnpm run dev:web` 运行时生效，否则重建后需重启验证）；在 GUI 任一会话验证。

## 验收标准

1. 任一 session 头部出现 "Whiteboard" tab，位置在 Chat（和 Trajectory）之后；
2. 切入后画布用 database.js 数据完整渲染：25 节点 / 19 边、连线跨 Twig/Workspace、pan/zoom/MiniMap/缩放指示（默认 75%）齐全；
3. tab 来回切换（Whiteboard ↔ Chat）不报错，Chat 对话与 composer 完全正常；
4. 空会话（hero phase）下 tab 行为只需不崩溃——是否显示不做要求，记录观察结果即可。

## 已知坑（调试时按此排查）

- **tab 不出现** → 检查 `tabs.length > 1` 条件是否满足（注册是否成功、inject 是否被消费）。
- **画布零高度/空白** → viewArea 是 flex 容器，RF 父级必须有确定高度。
- **节点按钮无响应** → 预期行为（决策 5），不是 bug。
- **布局推导**：必须全板推导（`derivePositions(sourceNodes, edges, …)`），不得逐 Twig 推导（行号从 0 起算会全部重叠到第一行，历史实测教训，代码注释有记录）。
- **nodeTypes** 必须模块级常量，组件内定义会导致 RF 警告与重挂载。
- **上游 schema/客户端机制变更**需重启 Desktop 才同步（既有约束）。

## 预期产出

- ViewTab 可用的 Whiteboard（验证阶段产物），旧 Panel 入口不受影响地共存；
- 调试完成后回到方案讨论，决定旧 Panel 的合并或迁移（另起任务，不在本轮）。
