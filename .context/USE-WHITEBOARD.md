# Whiteboard 开发记录

本文记录开发阶段的设计、实现与验证方式，不作为 Session 的运行时提示词。

## 视图与数据演进

- Whiteboard 已从独立面板移入主对话页的 ConversationView Tab，与官方聊天输入区同时显示。旧面板及相关组件已删除。
- 已验证读取当前 Session 聚合的 Turn，以及监听 turn/start、user/message、turn/end 更新界面。Turn 列表展示 User 和 Assistant 内容，并为进行中的 Turn 显示加载状态。
- 已验证基于 Session Projection 的 Toast。
- VisitNode 的原对话入口已移除，目前显示 workspace 名称。
- 早期通过直接修改 database.js 并构建来验证离线数据；当前仍保留这份基线，同时支持工具返回的数据。

## 当前数据与重绘机制

database.js 只持有 nodes 和 edges，不持有 Twig。WhiteboardView 挂载时仍通过 mockCompute 读取离线数据，这是当前验证阶段保留的设定。

本地 whiteboard 工具接收 `{ type: 'reload', payload: { nodes, edges } }`。事件名从 init 改为 reload，用于表达完全重绘。每次收到 reload，client 重新读取 database.js，将基线与本次 payload 平铺拼接，再统一计算并重绘；此前的 payload 不累积。计算模块不区分数据来源。

节点保留各自来源的原生 ID。离线 fixture 的 VISIT 编号与 Hub 的工作区前缀 ID 可以同时存在；历史上的 VISIT 格式限制已移除。节点内容相似不影响分组，图结构依据 ID 和边关系处理。节点唯一性、边端点及图结构约束由代码校验。

## Twig 与布局实现

实现位于 `packages/dsh-plugin-whiteboard/src/client/whiteboardLayout.ts`。

- 按节点和边的连通分量推导 Twig；孤立节点独立成组。
- 每组支持单向、无分叉、无合流、无环的链，由唯一链头沿 source → target 遍历。
- Twig 按链头的 workspaceId、节点 ID 排序；Twig ID 是本次计算的临时编号，不承担稳定身份。
- 每条 Twig 占一行，列间距为 480px；行距取 300px 与上一行最高节点估算高度加 32px 中的较大值，避免内容较长时重叠。
- 每次重绘重新挂载 ReactFlow，使用其 fitView 对准最上、最左的节点，初始缩放为 75%。

分组、坐标、间距和视口均由 client 代码决定。箭头样式属于 client 展示层。历史上的 Current 展示机制、footer 日期与 tag 已移除。

## Session 能力启用机制

Whiteboard Tab 的可见性与工具注册分开处理。MCP 和本地 whiteboard 工具已从全局注册改为由当前 Session 的 /whiteboard command 挂载。

Command 通过宿主 loader 加载 dsh-mcp-client，在当前 Agent 作用域连接 backstage-whiteboard，等待挂载完成后注册本地工具，再通过 agent.followup 启动下一轮。连接失败则返回错误并停止。连接与工具的生命周期由宿主作用域管理；当前从简实现，不额外处理重复执行或 Session 重开。

运行时提示词只有 `packages/dsh-plugin-whiteboard/src/prompts/use.ts` 一份。本文的开发历史、数据校验和布局实现不注入 Session。

## 构建与验证记录

在仓库根目录执行 `pnpm --filter dsh-plugin-whiteboard bundle`。若已有 watch 进程，可等待自动重建。Host 半通过 ESM 构建内联本地 TypeScript 提示词，宿主依赖保持 external；lib 目录由构建生成，不手工维护。

Client 构建产物变化会触发宿主热更新，可能重置视图局部状态。Host、插件清单或 package.json 的变化按插件加载流程处理。构建通过不代表真实 Session 的完整交互已验收。

当前版本为 0.0.5，不新增测试文件。此前已通过插件构建、语法与差异检查，并临时校验挂载、注册、followup 的调用顺序及挂载失败时停止的行为；真实 Session 中读取 MCP 并完成重绘的端到端流程仍待验证。
