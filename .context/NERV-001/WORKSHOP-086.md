# Kun 技术产品调研

> updated_by: Qoder - Qoder
> updated_at: 2026-10-15 10:45:30
> evidence_window: 调研日期 2026-10-15；最新 GitHub Release Kun 0.4.0（2026-09-27 发布）；仓库 KunAgent/Kun 默认分支 master（可见最后提交 2026-10-11 18:12 UTC）；桌面应用 `package.json` version 0.4.0，运行时包 `kun/package.json` version 0.4.0

## 交付结论

### 1. 产品形态判定：本地优先的单运行时 AI 工作台，云端只是可选增值层

Kun 是一个跑在用户电脑上的 Electron 桌面应用（React + Zustand renderer / Preload IPC / Main 进程），外加同一份运行时的终端 TUI。GUI、TUI、CLI、脚本、扩展、IM 和手机远程都通过同一个 `kun serve` 本地 HTTP/SSE 边界工作；会话、设置、记忆、事件历史、用量全部写在本机数据目录（默认 `~/.kun/data`）（[README.md](https://github.com/KunAgent/Kun/blob/master/README.md)、[docs/kun-architecture.md](https://github.com/KunAgent/Kun/blob/master/docs/kun-architecture.md)）。直接事实：README 的自我定位是「本地优先的 AI 工作台：写代码、做文档、和 Agent 一起推进事情」，并明确「数据在本机……只有本次请求的上下文发给你选的 Provider」。

核心 Agent 能力（回合执行、任务图、调度、恢复、记忆、审批、工作流）全部在本地进程内完成，不依赖任何 Kun 云端服务。唯一必需的外联是模型 Provider 的 HTTP API 或用户自己的订阅账号登录。因此按 Local 优先标准，Kun 判定为**符合**，不存在「桌面壳 + 云端主体」的选型缺陷。云端组件确实存在，但职责边界很窄，见结论 9。

### 2. Stateful 调度判定：具备 Stateful 内核，但连续性受应用生命周期硬约束

按 Index 的基准（工作对象是否持久归属、对象关系与任务状态是否持久、执行归属是否可判定、能否决定何时可执行/顺序/由谁执行/失败后如何继续，以及进程重启、断线、Agent 退出后能否恢复），Kun 的证据链如下：

- **中心化的执行归属与租约**：Service Manager 是业务数据的唯一物理写入者，持有带 `fencingToken`、`expiresAt`、`commitExpiresAt` 的资源租约和按资源序列化的跨进程数据互斥锁；替换 Runtime 注册前必须先结算所有过期执行归属（[kun/src/manager/data-mutex.ts](https://github.com/KunAgent/Kun/blob/master/kun/src/manager/data-mutex.ts)、[kun/src/manager/expired-thread-lease-reconciliation.ts](https://github.com/KunAgent/Kun/blob/master/kun/src/manager/expired-thread-lease-reconciliation.ts)，直接事实）。这满足「防重复领取、原子抢占、租约、超时回收由中心驱动」。
- **持久队列与幂等提交**：排队输入采用「pending 元数据 → canonical user item → 完成标记」的固定提交顺序，第一笔写入前先记录准确 turn ID，失败按 ID 回滚；同一 `clientRequestId` 在锁内复核，不重复建 turn；临时写入失败/CAS 冲突/租约阻塞走每线程退避重试（250ms 递增至 5s）；启动恢复与在线路径规则相同（[docs/queue-delivery-reliability.md](https://github.com/KunAgent/Kun/blob/master/docs/queue-delivery-reliability.md)，直接事实，并含 2026-09-08 真实故障复盘）。
- **持久任务状态机**：`ExecutionTaskService` 把 `ThreadRecord.executionTasks` 作为带 schema 版本、revision、稳定 ID、owner、依赖、验收条件、证据的执行步骤聚合，状态区分 pending/running/waiting/blocked/paused/succeeded/failed/cancelled，等待/阻塞/暂停/失败必须有原因、成功必须有证据、终态不可改写；每个 owner 同时只有一个 running 步骤，只有当前持有回合能声明 running（[docs/execution-task-retirement.md](https://github.com/KunAgent/Kun/blob/master/docs/execution-task-retirement.md)，直接事实）。
- **图编排调度器**：Graph Mode 有 GraphPlan/GraphRun/Node/Attempt/typed edge/LoopGate/GraphPatch 的完整契约，宿主 Scheduler 计算 ready set、按 priority 与 retry-not-before 选择、做全局与单 run 并发准入、跨 GraphRun 轮转、执行有界指数退避重试和失败分类；GraphPatch 用 baseRevision/expectedRevision/expectedSeq 做 CAS；启动恢复按「校验 journal/snapshot → 过期租约 → 与 child session 对账 → orphaned/interrupted 重试或升级 → 按 pendingControlIntent 收敛 pausing/completing → 再启调度器」固定顺序进行（[docs/graph-mode.md](https://github.com/KunAgent/Kun/blob/master/docs/graph-mode.md)，直接事实）。
- **持久定时/提醒语义**：Room 提醒存于 Manager 拥有的 Rooms SQLite，状态 scheduled/paused/fired/cancelled/expired，`occurrence` 计数已提交的唤醒，预算用 per-agent CAS 账本串行化；触发在既有 runtime tick 上运行，「不引入第二套 runtime 或独立 daemon」，重启与重放 tick 不重复产生 occurrence，DST 缺失跳过、折叠只发一次，迟出窗口内允许一次补发、之外跳过到下一未来时间（[docs/rooms-reminders.md](https://github.com/KunAgent/Kun/blob/master/docs/rooms-reminders.md)，直接事实）。

**但同一批文档也给出了硬边界**：关窗即退出应用并 drain Manager、Runtime 与受管工作；「GUI 关闭后手机连接、定时执行和本地后台任务停止」；可选的独立常驻宿主 `kun host start`「不安装登录项、系统服务、计划任务或远程推送服务」，且默认 GUI 不能连到它，机器必须保持开机联网（[docs/kun-architecture.md](https://github.com/KunAgent/Kun/blob/master/docs/kun-architecture.md)、[docs/rooms-persistent-host.md](https://github.com/KunAgent/Kun/blob/master/docs/rooms-persistent-host.md)，直接事实）。同时 Graph 的出厂默认是 `enabled: false`、`defaultStrategy: direct`、`writeIsolation.mode: serialize`、`learning.mode: off`。

因此结论是：**Kun 不是任务执行宿主/自动化运行器的薄壳，它确有 Stateful 调度内核（持久工作对象 + 中心租约 + 依赖就绪 + 恢复对账）；但它是「随应用会话存在」的 Stateful——状态持久、驱动者不常驻。** 重启后能对账并继续，进程不在时不推进；这是与常驻调度器产品的实质差别，不是能力缺失。

### 3. 工作对象模型：Thread/Turn/执行步骤/Goal/Run/Commitment/Agent 齐备，缺 Issue 与 Project 工单对象

直接事实（来自上述文档与 `kun/src` 顶层结构）：

| 对象 | 在 Kun 中的身份 | 持久位置 |
| --- | --- | --- |
| Thread / Turn | 会话与回合，`clientSurface` 按回合持久化 | Manager 拥有的线程存储 |
| ExecutionTask | 具体执行步骤（依赖、owner、验收、证据、终态不可变） | `ThreadRecord.executionTasks` 聚合 |
| Goal | 完整目标、预算与完成策略 | 线程目标操作（`thread-service-goals-operations.ts`） |
| RoomTask / RoomRun / Job | 房间任务与一次确切尝试 | Rooms SQLite（`RoomRunRecord`） |
| Commitment | 跨对话承诺及其验收证据 | `agent-commitment-service.ts` |
| GraphPlan / GraphRun / Node / Attempt | 编排图与执行事实 | `<dataDir>/graphs/<runId>/events.jsonl` + `snapshot.json` |
| Workflow（创建loop）/ Loop 节点 | 画布工作流与循环体 | GUI 设置内的 `workflows`（运行记录按 `MAX_WORKFLOW_RUNS` 有界保留） |
| ScheduledTaskV1 | 定时任务（prompt、workspace、provider、绑定渠道） | GUI 设置 |
| Agent | 可持久参与者身份，独立于能力预设与会话 | Agent 目录 + 记忆作用域 |

**记录缺失项**：仓库与文档中未发现 Issue / 工单对象，也没有独立的 Project 实体登记。最接近「项目」的是 Code 的工作区目录，以及 Graph 用规范化 Git remote hash / Git common dir / canonical workspace root 解析出的项目身份，用来挂 Agent 注册表和学习资产。合理推导：Kun 把工作组织锚定在「会话 + 工作区目录」而非「工单」，因此对外部工单系统没有天然接入点（官方未说明是否有计划）。

### 4. Agent 分派与连续性：权限按尝试冻结、归属按来源固化，跨客户端可续

- **谁执行**：Graph 的 AssignmentResolver 在每个 attempt 派发前冻结 `GraphAssignmentSnapshotV1`（profile 版本、model/provider/reasoning、允许与禁止的工具/Skill/MCP、审批策略、sandbox、workspace root、读写 scope、网络与时间上限）；有效权限永远是父回合、Graph 策略、profile、节点与宿主硬限制的交集，任何子层只能收窄。子代理被强制屏蔽 `delegate_task`、`graph_*` 与治理能力，不能递归委派或扩权。项目 Agent 路由先做硬过滤，再按 task fit 32% / verified quality 22% / trust 14% / freshness 8% / efficiency 8% / confidence 10% / availability 3% / current load 3% 评分选择（docs/graph-mode.md，直接事实）。ADE（多 Agent 协作）另有总管-worker 模型：外部 agent 只能以 `kun serve` 内部 `DelegatedTurnRuntime` 身份进入，worker 权限是总管快照与档位的交集、只降不升，交接上下文由代码确定性生成而非模型摘要（docs/kun-architecture.md）。
- **连续性**：每个回合持久化发起端 `clientSurface`（gui/tui/cli/api/im/extension），自动续跑、后台任务和子代理必须继承来源，不能按「最近连的是 GUI 还是 TUI」改全局状态。GUI 重连先读 HTTP snapshot，再从已确认 sequence 续 SSE replay；Graph 等待节点期间只暂停该回合的进程内执行并释放模型并发槽，持久化 turn 仍是 `running`，重要事件恢复同一个 `sourceTurnId`（docs/graph-mode.md、docs/kun-architecture.md）。对话连续性层用 `agent_conversation_cursor` 与不可变 bridge receipt 和游标推进原子提交，重启读取确切 run-input snapshot（docs/agent-conversation-continuity.md）。
- **失败后如何继续**：节点必须有源 Lead 显式 pass 才能向下游交接数据；必需节点耗尽自动 attempt 时下游保持 blocked、run 进入 `awaiting_supervision` 并唤醒原 Lead，而不是把下游 skipped 或直接结束；重复相同失败不会自动落入持久化 `paused`，`paused` 只由用户或授权 Lead 显式使用。取消先写 terminal fence，再中止并等待活跃 worker，迟到结果不会进入已取消 run（docs/graph-mode.md）。

### 5. 运行形态与主要组件：一个数据目录只有一个应用所有者

```
Renderer(React/Zustand: Code 含 Design / Work / 手机远程 UI)
   → Preload IPC → Main 进程
        ├─ DesktopProcessStack → 本次会话拥有的 Service Manager
        ├─ RuntimeHost → kunRuntimeAdapter → 拥有的 Runtime
        └─ Main 自有子系统：工作流引擎、定时任务 tick、手机远程 HTTP、
           模型网关管理、IM 通道、更新器、扩展宿主、PTY/LSP/MCP 子进程
                ↓
        kun serve（TypeScript，HTTP/SSE，默认 127.0.0.1:18899）
          /health /v1/threads /v1/threads/:id/turns|events|fork|tasks|queued-turns
          /v1/sessions/:id/resume-thread /v1/approvals/:id /v1/user-inputs/:id
          /v1/usage /v1/workspace/status /v1/graphs… /v1/rooms…
```

Service Manager 负责选举、fencing 与规范化持久数据；Runtime 是会话作用域、可重启；受管子进程（PTY、LSP、MCP、session daemon 等）由 owner 负责整棵树的回收——POSIX 用独立进程组加 owner-loss guard，Windows native launcher 先创建 suspended 子进程、纳入 Job Object 再恢复。同一 canonical `dataDir` 已有 live/starting owner 时，第二个 GUI/TUI 返回 ownership conflict，不能 attach、steal 或 silent kill；production 与 development flavor 不能共享同一数据 owner（docs/kun-architecture.md，直接事实）。合理推导：这是「单写者 + 所有权围栏」架构，多个 UI 前端可以顺序接管历史，但不存在多客户端并发写同一 profile 的路径。

### 6. 持久化：原子 JSON 是标准数据，SQLite 只是可重建投影，无需外置数据库

直接事实：

- 线程存储是「原子 JSON 元数据 + 可重建 SQLite 索引」混合实现；索引缺失时 `list()` 从已索引行与 dirty filesystem delta 合并立即返回，补索引在后台分批并以单事务写回，进度通过 `indexStatus` 暴露（docs/kun-architecture.md）。
- 长期记忆：`{dataDir}/memory/mem_*.json` 是唯一标准数据，`memory-index.sqlite3`（含 FTS5）是可删除、可重建的检索投影；写入先提交 JSON 再投影，进程在两步之间退出时标准数据仍成功，下次启动做有界回填；可用 `KUN_MEMORY_STORE_BACKEND=file` 完全退回文件/n-gram 检索（[docs/memory-foundation.md](https://github.com/KunAgent/Kun/blob/master/docs/memory-foundation.md)）。这说明**SQLite 可剥离**，不是硬依赖。
- Graph：带 checksum 的 append-only JSONL journal + 原子 snapshot.json，启动重放 suffix；大 payload 外置到内容寻址 ArtifactStore（docs/graph-mode.md）。
- Rooms：run 记录与提醒存在 Manager 拥有的 Rooms SQLite（docs/rooms-runs.md、docs/rooms-reminders.md）。
- GUI 设置本身是 `kun-settings.json`，Service Manager 以文件内容 SHA-256 作为磁盘指纹，每次读取和 CAS 写入前重核，外部工具写有效 JSON 会触发热加载 revision（[docs/KUN_CONFIG.md](https://github.com/KunAgent/Kun/blob/master/docs/KUN_CONFIG.md)）。

数据库形态结论：**全部内嵌**（`better-sqlite3` 12.11.1 作为运行时依赖，打包时 `asarUnpack`），无外置 DB、无最低数据库版本要求、无专属服务端扩展；唯一 SQLite 侧要求是 FTS5（better-sqlite3 自带）。跨机迁移走 `.kunpack` 数据包：搬线程/会话/消息/事件、附件、内容寻址 artifact、记忆、Design/Write/Plan/SDD/分支注册表、UI 设置、工作流与定时任务定义，**绝不搬** API key、OAuth、token、keychain、信任、审批与授权；导入的工作流落地即禁用、定时任务禁用并清空渠道/Provider 绑定、历史 pending approval 变为不可操作的 expired/cancelled（[docs/data-migration.md](https://github.com/KunAgent/Kun/blob/master/docs/data-migration.md)）。

### 7. 接口与通信：本地 HTTP/SSE 是唯一跨进程协议，所有监听默认只绑回环

- **Runtime 协议**：GUI 只走 `kun serve` 的 HTTP + SSE，不在 renderer 实现 agent 逻辑；所有 `/v1` route 使用 runtime Bearer 令牌，`insecure` 可关闭一般 HTTP 鉴权，但敏感控制面仍强制绑定 token（[docs/graph-mode.md](https://github.com/KunAgent/Kun/blob/master/docs/graph-mode.md)、[kun/src/server/auth.ts](https://github.com/KunAgent/Kun/blob/master/kun/src/server/auth.ts)、[kun/src/cli/cli-options.ts](https://github.com/KunAgent/Kun/blob/master/kun/src/cli/cli-options.ts)，直接事实：默认 `host: 127.0.0.1`、`insecure: false`，GUI 管理的 runtime 在 `runtimeToken` 为空时自动生成并保存）。变更类接口统一使用 portable `commandId`、`idempotencyKey` 与适用的 `expectedSeq`/`expectedRevision`，响应返回持久化事实而非乐观预测。
- **桌面内部**：Renderer↔Main 走 Preload IPC；Market 等桌面独有能力刻意不进 Remote allowlist。
- **进程内/跨进程**：Runtime 通过 Manager 的 remote store 代理读写数据，并由 Manager 的数据互斥与租约串行化（`kun/src/manager/` 直接事实）。
- **手机远程**：Main 进程内独立 HTTP 服务，bind 可选 `loopback` 或 `lan`（LAN 时监听 `0.0.0.0`），端口自动避让；口令用 scrypt 加盐哈希存储，会话令牌为 24 字节 randomBase64URL、带 TTL、绑定远端地址与惰性/定时过期；给手机展示的是 `http://<局域网 IPv4>:<port>` 明文 URL（[src/main/remote/remote-access-service.ts](https://github.com/KunAgent/Kun/blob/master/src/main/remote/remote-access-service.ts)、[src/main/remote/remote-auth.ts](https://github.com/KunAgent/Kun/blob/master/src/main/remote/remote-auth.ts)、[src/main/remote/remote-lan-urls.ts](https://github.com/KunAgent/Kun/blob/master/src/main/remote/remote-lan-urls.ts)）。**未发现任何 TLS/证书路径**，也**未发现云端中转**：手机远程是局域网直连。风险提示（推导）：LAN 绑定 + 明文 HTTP 下，凭据与 SSE 会话暴露在本地网络，产品用口令+会话令牌而不是传输加密来承担这一边界。
- **工作流入站**：Main 内的 webhook server 注释明确「只绑 localhost，绝不暴露到网络」，可选 `x-kun-secret` 或 `Authorization: Bearer <secret>`（[src/main/workflow-webhook-server.ts](https://github.com/KunAgent/Kun/blob/master/src/main/workflow-webhook-server.ts)，直接事实）。
- **本地模型网关**：给 Codex/Claude Code/OpenCode/Pi 等外部客户端提供 OpenAI Chat/Responses、Anthropic Messages、Gemini generateContent 入口，「listener remains loopback-only」，每客户端独立可撤销 key，实例信息写 `~/.kun/gateway.json`（0600），`/api/hello` 是唯一免鉴权端点（[docs/local-model-gateway.md](https://github.com/KunAgent/Kun/blob/master/docs/local-model-gateway.md)）。
- **对外协议生态**：MCP（SDK 与 client）、ACP（`@agentclientprotocol/sdk`）、外部 harness SDK（Claude Agent SDK、Cursor SDK）、IM 官方通道（Lark Node SDK 出站 WebSocket、腾讯 openclaw-weixin 官方 iLink）。

### 8. Windows 与 macOS 安装形态：双平台原生安装包，Windows 只发 x64

**macOS**（[electron-builder.config.cjs](https://github.com/KunAgent/Kun/blob/master/electron-builder.config.cjs)、[.github/workflows/release.yml](https://github.com/KunAgent/Kun/blob/master/.github/workflows/release.yml) 直接事实）：
- 安装包：`.dmg` 与 `.zip`，同时出 arm64（Apple Silicon）与 x64（Intel）；dmg 用 ULFO(LZFSE) 压缩以容纳内置语音依赖；拖入 `/Applications`。
- 签名与公证：CI 在 `macos-latest` 解码 `MAC_CODESIGN_P12_BASE64`/`APPLE_API_KEY_BASE64`，先 `--check-notary` 验证凭据再构建签名包；公证在 `scripts/mac-notarize.cjs` 中自定义执行（electron-builder 的 `notarize: false`）；hardenedRuntime 与 forceCodeSigning 仅在提供签名身份时开启；entitlements 走 `build/entitlements.mac.plist`；申请 `NSMicrophoneUsageDescription`（语音转文字）。
- 运行入口：应用内 `kun`/`kun tui`；首次启动提示把 app 内 launcher 软链到 `/usr/local/bin/kun`，设置页可安装/修复/卸载并识别 stale target。
- 权限：macOS TCC 权限与通知授权都锚在保留的旧 bundle id `com.xingyuzhong.deepseekgui`（注释明确换 id 会让老版本拒绝安装新版本、并丢权限与授权）；Keychain 用于 safeStorage 凭据（文档记录 macOS 真实字节兼容验证仍未完成）。
- 升级与卸载：应用内更新走 electron-updater + Squirrel.Mac，完成后重启安装；GUI 与内置 Runtime/TUI 一起更新。官方未说明 macOS 最低版本；「关窗即退出」，明确不保留无窗口驻留。卸载文档未给出官方步骤（未发现专门卸载说明），数据在 `~/Library/Application Support/Kun/`（设置）与 `~/.kun/data`（运行时数据），删除这些即完成清理——此为按目录约定的推导，官方未说明。

**Windows**：
- 安装包：**仅 NSIS `.exe`，仅 x64**（`win.target = [{ target: 'nsis', arch: ['x64'] }]`）；**未发现 Windows ARM64 产物**，而 Linux 有 arm64、macOS 有双架构。选型缺陷：Windows ARM 设备只能走 x64 转译，官方未说明是否支持。
- 安装形态：per-user（`perMachine: false`、`selectPerMachineByDefault: false`、`allowElevation: true`），固定安装目录（不允许用户改），安装器语言 `en_US` 与 `zh_CN`，总是创建桌面快捷方式并创建开始菜单快捷方式；自定义 `build/installer.nsh` 提供带组件识别的安装目录迁移页；NSIS 自动写 `$INSTDIR\bin\kun.cmd` 并把该目录加入 PATH。
- 升级：CI 在 `windows-latest` 跑安装迁移事务测试（`windows-installer-migration.transaction.test.ts`）、恢复安全测试、真实安装器 smoke 与打包更新交接 smoke；发版清单记录了 v0.2.34 的真实 Windows 缺陷——安装器无法可靠恢复旧安装源、current-user 升级到 all-users 后旧 HKCU 卸载注册/快捷方式/PATH 残留——修复边界是「进程内解析已注册安装源、只清理经过验证的源与固定注册位置、fail-closed」。
- 卸载：`deleteAppDataOnUninstall: false`，即**卸载不删用户数据**；NSIS 由 appId 派生卸载 GUID，因此 appId 永远不换以保证升级正确卸载旧版。设置页另有 Uninstall 入口（含确认与取消）。
- 进程治理：native launcher 用 suspended 子进程 + Job Object 纳管子树。官方明确限制：进程组轮询不等价于能阻挡任意快速 `setsid`/double-fork 的 OS 沙箱，各平台打包产物需要真实进程证据。
- 权限与网络：普通用户权限即可安装；无登录项/服务；外联为模型 Provider、更新源、可选 IM 与市场。

**Linux**（作为对照，不替代任一工作机平台）：AppImage + deb，x64 与 arm64；deb 附带 AppArmor profile 以在 Ubuntu 24.04+ 拿到非特权用户命名空间，启动参数 `--disable-setuid-sandbox`。

### 9. 云端组件完整调研：更新分发 + 账号/衣橱 + 第三方市场，均不承担 Agent 主体能力

存在云端，按 RUNBOOK 要求完整记录：

1. **发布与更新分发**（必需但可离线安装）：electron-builder `publish.provider = generic`，URL 为 `https://www.kun-agent.com/api/r2/deepseek-gui/channels/<stable|frontier>/latest/`，背后是 Cloudflare R2 桶 `deepseek-gui`；CI 先建 draft GitHub Release、上传全部跨平台资产，再上传 R2、二次下载核验 stable 与兼容 latest 通道后才公开 Release。故障影响：更新与候选包下载失败不破坏本地数据；`artifact-integrity` 校验不等于 GUI 升级验收（docs/release-validation-checklist.md）。
2. **Kun 账号 + 衣橱/羽毛商店**（明确可选的增值层）：账号资源接口 `https://api-kun-server.com/api/assets/releases/latest?channel=...`，下载走 `kun-agent.com` 的 `/art/releases/<id>.json` 与 `/art/objects/<sha256>.webp`，Cloudflare Worker 用 R2 binding 读取、边缘缓存不可变文件，客户端不持 R2 凭据；清单由 ed25519 签名覆盖目录、渲染参数与文件哈希；仅登录用户可查询与下载，响应 `private, no-store`；服务端目录登记与推广在 Supabase SQL 控制台完成，**账号拥有、兑换、掉落由服务端裁定**；未登录使用内置默认形象（[docs/kun-art-updates.zh-CN.md](https://github.com/KunAgent/Kun/blob/master/docs/kun-art-updates.zh-CN.md)，直接事实）。边界很清楚：这是桌面吉祥物装扮/角色卡经济系统，不参与任务、对话与调度；文档同时声明「衣橱回退不改变任务数据」。数据持久化在服务端（Supabase）+ R2，客户端只有签名校验与本地缓存，接口与鉴权走账号令牌。
3. **Skill / MCP 市场**：内置市场源只有 `youdao`，目录来自有道 LobsterAI 的 `https://api-overmind.youdao.com/openapi/get/luna/hardware/lobsterai/prod/skill-store`（匿名可读），缓存 6 小时、失败回退旧缓存、空载荷不覆盖好缓存；下载必须 https 且在 `allowedDownloadHosts` 白名单内，64MB 上限，staging 解压后原子搬移，拒绝路径穿越与 symlink；`npx` 服务器必须从 npm registry 解析并钉死版本，永不写未钉版本；市场 IPC 只在桌面可用、不进 Remote allowlist（[docs/market-sources.md](https://github.com/KunAgent/Kun/blob/master/docs/market-sources.md)）。
4. **模型 Provider 与 IM**：模型请求发往用户所选 Provider（DeepSeek、Kimi/Moonshot、GLM/Zhipu、Qwen、xAI、Ollama 本地等）；Lark 走官方出站 WebSocket（不需要公网入站），微信走腾讯官方 iLink；凭据用 Electron `safeStorage` 且不允许明文回退、Linux `basic_text` 被拒。
5. **不存在的云端**：未发现 Agent 执行、任务队列、Graph 调度、记忆或审批的任何云端实现或云中转。

Local 优先适配判断：**主体在本地，云端仅为可选分发/装扮/市场目录**，不构成选型缺陷。次要缺陷是：更新源与装扮服务端为厂商托管、源码不在仓库（结论 11），以及 LAN 手机远程为明文 HTTP（结论 7）。

### 10. 维护状态与成熟度：高频发版、跨平台原生门禁，但公开反馈样本极小

直接事实：GitHub Release 最新为 Kun 0.4.0（2026-09-27），仓库 master 可见最后提交 2026-10-11；`release/` 目录含 51 份从 v0.2.0 到 v0.4.0 的更新日志，版本节奏为每周到每两周；0.4.0 的改动面包括把 Rooms 私聊/群聊并入 Code、统一 Work 工作区、账号与衣橱、本地模型网关协议扩展、多 Agent 协作实验等。CI 有 23 个工作流，Release 作业覆盖质量门（typecheck/lint/unit/生产依赖审计）+ macOS 签名公证 + Windows 安装器事务与 smoke + Linux x64/ARM64 + 草稿 Release 与 R2 推广；另有 daily-dev-prerelease、GUI 验收、多个真机 smoke。星数 6.3k（6315）、fork 592、watchers 127、Topics 含 `local-first`、`agentic-workflow`、`multi-agent`、`tui`。

反馈边界：GitHub Issues 页面当前显示 2 个 open（#1215 2026-08-19、#1029 2026-07-28），本次抓取未见 closed 计数样本，仓库有 50+ 版本与上千 PR 而 issue 列表几乎为空——**不能据此推断质量或健康度**，可能是 issue 使用策略或迁移导致，属未决。贡献者页面为 JS 渲染，未取到贡献者数量；版权行是 `Copyright (c) 2026 xingyuu`，appId 与 Linux maintainer 邮箱都指向同一作者，`package.json` author 为 "Kun Contributors"。合理推导：主导维护者单一，bus-factor 风险值得关注，但**未获得贡献分布数据，此项列为未决**。

成熟度的正向证据是自我限定：文档反复标注「packaged macOS 与 Windows 宿主生命周期和原生通知仍需平台 smoke」「真实 OS 字节兼容仍未验证」「Linux fixture 测试不证明 macOS/Windows 行为」，并把人工/真机验收与自动化测试分离。这在同类产品中较少见，说明其结论边界是自觉维护的。

### 11. 开源与闭源边界：源码可读但非 OSI 开源，商业使用需书面授权，账号服务端不在仓库

直接事实：`LICENSE` 是 **PolyForm Noncommercial 1.0.0**，并加了自定义前言：商业使用、商业分发、SaaS/托管服务、转售或集成进商业产品需要版权方单独书面许可；企业**仅为内部员工生产力**使用可申请免费书面内部使用授权（不覆盖对外 SaaS、转售、再许可或嵌入客户可见产品）；教育机构非商业教学/研究可直接使用且不可透传下游。因此 Kun 属于 source-available / 非商业源码可得，**不是开源许可证**。

改造边界：`CLA.md` 让贡献者保留版权，但授予项目所有者「可永久、全球、免版税、可再许可、可转让」并可把贡献以 noncommercial / commercial / **proprietary** / source-available / open-source 等任意许可再授权，无需额外同意。推导：Kun 可以走「社区贡献 → 官方商业版/专有发行」的双许可路线，第三方无法在未获书面许可的情况下把改进版商业化。

架构上的改造可行性（依据 docs/kun-architecture.md 的直接描述）：`kun` 包按 ports & adapters 组织，ports 含 ModelClient、ToolHost、ThreadStore、SessionStore、ApprovalGate、EventBus、WorkspaceInspector、Clock，adapters 已有 file 与 in-memory store 实现；替换模型客户端或存储适配器有明确接缝，但 **Service Manager 的租约/互斥/fencing、Graph 调度与恢复、以及 Main 进程内的工作流/定时/远程/网关子系统都紧耦合在应用生命周期上**，要改成常驻中心调度需要替换所有权模型，而不是换一个 adapter。扩展面另有独立平台：`packages/extension-api`、`extension-react`、`create-kun-extension` 与 examples（含 276 文件的视频编辑器示例），以及 hooks（PreToolUse/PostToolUse/UserPromptSubmit/TurnStart/TurnEnd/PreCompact，stdin JSON 调用、退出码 2 阻断）和 gateway-middleware 脚本（`node:vm`，明确声明不是安全边界、脚本属可信用户代码）。

闭源部分：账号与衣橱的服务端（Supabase 数据、Cloudflare Worker、签名私钥——文档明确「签名私钥不在仓库中」）、更新分发站与 `api-kun-server.com` 不在仓库内；`vendor/openclaw-shim` 是仓库内自带的微信 shim 包。

## 调研目标

- Kun 到底是什么形态的产品：桌面壳、本地运行时，还是云端 SaaS？核心能力实际运行在哪里？
- 它是否具备 Stateful 调度能力：工作对象与任务状态是否持久、能否决定何时可执行/顺序/由谁执行/失败后如何继续，重启与断线后能否恢复？
- Windows 与 macOS 工作机上分别怎么装、怎么跑、怎么升、怎么卸，两个平台能力是否对等？
- 系统由哪些主要部分组成，接口形态、持久化方式、通信方式和任务队列的真实边界是什么？
- 存在哪些云端组件，各自职责、数据与网络边界如何，是否损害 Local 优先？
- 许可证与贡献条款决定了怎样的使用与改造边界？

## 产品调研

### 产品定位与目标用户

Kun 面向「要用 Agent 持续推进真实工作、又不想把数据和调度交给云」的个人开发者与知识工作者。三个一等入口：**Code**（项目、终端、Git、Diff、Design 画布、Agent 对话与子任务）、**Work**（文档、论文、资料与白板，含证据卡与对比矩阵）、**Connect phone / 手机远程 + IM**（把本机 Agent 接到手机上）。它在同一个会话里可以同时选 Code 或 Design 作为下一回合的意图，说明定位不是「代码 Copilot」，而是「以 Agent 为主角的本地工作台」。

目标用户画像由能力面反推（合理推导）：会自己填 API Key 或已有 Claude Code/Codex 订阅、在意数据不出本机、需要在 GUI 与终端之间切换、并且可能想把机器上配好的模型网关复用给别的编码 CLI 的用户。文档也覆盖研究者场景（论文检索/批量解读/证据卡）。

### 核心流程（用户视角）

1. 从 Releases 下载对应平台安装包，首次启动引导里填 API Key 或登录已有订阅。
2. 打开一个项目文件夹交给 Code，或把资料拖进 Work；给 Agent 一件具体的事，Agent 动手前先请求确认。
3. 需要多线并行时切到 Graph：Lead 把需求拆成带依赖的节点，宿主编译并校验任务图，Scheduler 派发受限子代理，Lead 观察子会话、即时指导、逐节点验收，最后统一交付。
4. 需要反复打磨或对一批元素各跑一遍时，在「创建loop」画布里用 Loop 节点（条件循环或 foreach），或用定时任务/提醒把工作推到未来。
5. 回合、事件、任务状态、审批、用量与记忆都落在本机数据目录；关掉窗口即退出，下次打开读同一份历史；换机用 `.kunpack` 搬数据但不搬凭据。

### 功能地图与边界

可用能力：单运行时 GUI/TUI/CLI、Code 与 Work、Design 画布、Agent 目录与个人 Agent、群聊/私聊、Graph 编排与自进化项目 Agent（默认关）、多 Agent 协作 ADE（实验）、工作流与 Loop、提醒与定时任务、记忆与反馈账本（默认关）、知识库（Work 目录以只读、无向量结构挂给 Code）、计划 worktree、本地模型网关、MCP 与 Skill 市场、扩展平台、hooks、手机远程、IM 通道、`.kunpack` 迁移、账号与衣橱。

明确边界（官方自述，直接事实）：订阅额度查看是只读探测，不启动 Agent 也不改写凭据；历史 run inspector 永远只读，查看历史不重新执行工具；记忆永远是 `reference` 不可信证据，除非用户显式确认成 `directive`；网关不执行客户端工具、不把部分发出的工具调用重放到另一个 Provider；外部 harness 的能力以接入检测为准（Cursor SDK 无原生工具拦截入口因此保持禁用）；`mobile-remote-capability-baseline.md` 直言手机外壳与真实消息时间线尚未接完，Work 的真实上传/PDF/键盘安全区仍需 iOS Safari 与 Android Chrome 实测。

### 维护状态与版本演进

方向性变化可由版本线读出：0.2.x → 0.3.x 建立单运行时与桌面分发，0.3.8 起**停止独立 TUI 包分发**（TUI 随桌面应用统一更新），0.4.0 把 Rooms 并入 Code、统一 Work、引入账号/衣橱/羽毛商店并扩展网关协议面。发版路径固定为 `develop → master` 的发布 PR，不允许手工 tag 或绕过审批。

## 技术架构调研

### 系统全貌与运行形态

一句话：**一个「应用会话拥有的」本地三层结构（Manager / Runtime / 受管子进程）+ 两个 Main 进程内的独立子系统层（工作流引擎与定时任务、手机远程与本地网关）**，全部对外只暴露本地 HTTP/SSE 与 CLI。

值得单独记录的范式判断：Kun 把「谁拥有进程与数据」当作一等概念（reservation、fencing、retire-idle、owner-loss guard、Job Object），而不是假设有个常驻后台。这带来一个可预测的后果——产品语义里没有「服务器」，只有「当前开着的那台机器」。可选 `kun host` 提供的是前台分离进程宿主，官方明确它不注册任何系统服务，因此仍是「人主动起的宿主」而非守护进程。

### 主要组件与核心链路

**链路 A：一个 Graph 回合**（最能解释调度）
用户选 Graph 发消息 → Lead 理解目标与验收条件 → 选择策略（fanout_join / pipeline / bounded_loop / state_machine / hybrid / auto）并按可独立验收的粒度扇出 → `graph_create_run` 传轻量 intent → 宿主补 phase/node/edge/review/budget/identity 并校验后写 journal/snapshot → Scheduler 算 ready set → AssignmentResolver 冻结权限快照 → DelegationRuntime 起普通 executor child session → worker 用 `report_to_parent` 上报 → Lead 用 `graph_supervise_node` 的 overview/inspect/wait/guide 观察与纠偏 → worker 结束后宿主自动回收回复与完整会话 → Lead 对每节点 `graph_review_node` pass/revise → pass 即数据交接决定，宿主按 data edge 把有界结果包注入授权下游 → material signal 唤醒同一个 Lead turn → 完成条件、阻塞消息、写入集成与资源清理全部关闭 → GraphRun 进入 completed/failed/cancelled → 同一 Lead turn 最后一次醒来做统一交付 → 异步生成脱敏 Episode 供项目能力沉淀。跨边界点：child session 在同一 Runtime 进程内的独立会话，Graph 状态在 `<dataDir>/graphs/`，UI 通过 Bearer HTTP + SSE cursor 读取；写入隔离可以是 serialize / lease / 独立 worktree（`worktree` 需配置允许且是 Git 仓库），集成前做 stale/dirty/conflict 检查，未 accepted/conflict/orphaned 的 worktree 永不自动删除。

**链路 B：一条排队输入**
busy 时提交输入 → 保存准确 turn ID 后按 pending 元数据/canonical user item/完成标记顺序提交（失败按 ID 回滚，响应丢失先查询再确认原提交）→ 前端保留原输入并按 `clientRequestId` 查询 `queuedTurns`/`pendingAdmissions`/`settledTurns` 三类回执 → 当前回合结束后调度器离开上一回合的异步 fence 上下文独立提升下一条 → 提升时才发布 user-item 事件，使前端当前回合与实际执行一致。部分提交失败返回 HTTP 503 + `queue_admission_uncertain`。Stop 暂停本线程后续输入，租约释放产生的容量通知不解除暂停。

**链路 C：手机远程一次操作**
桌面开启 Remote 并选 LAN → Main 的独立 HTTP 服务监听 `0.0.0.0:<自动避让端口>` → 手机在局域网用明文 URL 打开，口令 scrypt 校验后签发绑定来源地址与 TTL 的会话令牌 → 页面复用同一套 `/v1` 语义与 SSE hub 做增量失效 → 上传/文件读取走有界分页与流式回退，市场等桌面独有 IPC 不在 allowlist。约束：桌面必须开着；能力基线明确手机外壳与真实时间线未接完。

### 主要依赖

影响安装/运行的依赖（不列全依赖树）：打包产物内置 Electron 43.1.0 与 `kun/dist` 运行时，终端用户**不需要装 Node.js**；从源码运行需 Node ≥ 22.19.0，README 另提示可用 npmmirror。原生模块是需要按平台/架构分别准备的一组：`better-sqlite3`（存储投影与 Rooms）、`node-pty`（终端）、`@computer-use/nut-js` + `@trycua/cua-driver`（Computer Use，Rust/UniFFI）、`sharp`/`@napi-rs/canvas`/`tesseract.js`（图像与 OCR）、内置语音（macOS 需 `prepare:macos-native:<arch>` 与 whisper 工具链）。`xlsx` 依赖从 `cdn.sheetjs.com` 以 tarball 形式拉取（供应链注意点：安装期需要访问该 CDN）。模型侧依赖 Provider 的 HTTP API 或外部 CLI 的原生登录（Claude Code、Codex、OpenCode、Cursor 等），网关协议一致性用固定版本的 CLI 做 conformance。

### 接口形态

本地 HTTP + SSE（`/v1` 全家桶，runtime Bearer）、CLI（`kun serve`、`kun tui`、`kun host start|status|stop`、`kun agents connect|disconnect|sync|save|use`、`kun gateway keys|routes|route`、`kun manager retire`）、Electron IPC（renderer↔main，含 market 等桌面专用）、模型网关对外协议（OpenAI Chat/Responses、Anthropic Messages、Gemini v1beta、`/v1/kun/route|limit`、免鉴权 `/api/hello`）、工作流 webhook 与内部 `/workflow/internal/*`、MCP（作为 client 与 server）、ACP、Skills/Hooks 的进程调用接口（stdin JSON + 退出码）。桌面 UI 与 TUI 都只消费同一套 HTTP 面，不各自实现 agent。

### 持久化方式

见结论 6。补充数据所有权：业务数据的**唯一物理写入者是 Service Manager**，Runtime 与其他消费者经 Manager 读写；`ExecutionTaskService` 明确「不引入第二个物理写入者、也不引入新调度器」。目录形态可按 flavor 隔离（`KUN_MANAGER_CONTROL_DIR`、`KUN_MANAGER_SETTINGS_PATH`、`KUN_DATA_DIR`）。凭据落在 OS 安全存储（macOS Keychain、Windows DPAPI、Linux 拒绝 basic_text）。降级边界：Graph 数据目录降级到不理解 executionTasks 的版本不被支持，回滚必须用 aware build；不要用「双写旧新账本」当回滚策略。

### 通信方式

同步 HTTP 请求 + 长连接 SSE 事件流为主（GUI 重连 = snapshot + `since_seq` 续放；`config.json` 的 `runtime.streamIdleTimeoutMs` 示例值 450000，官方未说明出厂默认值）；Manager↔Runtime 是带超时与围栏的内部调用（`resolveManagerDataRequestTimeoutMs`）；桌面定时任务在 Main 内以「空闲 30 s tick」推进，Room 提醒在 runtime tick 上触发、待判定条件每分钟检查一次，工作流由 `WorkflowScheduler` 的 `setInterval` 驱动——三者都是轮询而非外部推送；Lark 是出站 WebSocket、微信是官方通道；Room 事件用失效通知（invalidation）而非任意事件体广播，游标合并 run revision 与 thread event sequence。整体模式：**本地请求-响应 + 事件流 + 有界轮询**，没有消息中间件或外部 broker。

### 任务队列

队列是**持久**的：queued turn 与提醒/定时任务定义落盘，进程重启后由启动恢复对账（「正文存在则补齐提交，正文不存在则回滚；读取失败不能当作正文不存在」）。防重复领取靠 Manager 租约 + `clientRequestId` 幂等 + CAS revision；抢占是原子的（「只有当前持有回合能 claim running」「每个 owner 只有一个 running 步骤」）；超时回收由 Manager 结算过期租约后才允许替代 Runtime 注册；重试是每线程有界退避（250ms→5s）且提升成功/队列清空即取消；失败转移不是「中心把任务重派给别的 worker」，而是**把 run 置为 `awaiting_supervision` 并唤醒原 Lead 由它决策**（retry / repair / patch / rebind / cancel），这是 Kun 与自动 failover 调度器的实质差别。Graph 侧另有 `retry-not-before`、capped exponential backoff 与 attempt 预算，失败达到阈值不会自动进入持久化 paused。

### 部署形态

#### 工作机安装（Windows / macOS）

见结论 8。要点复述：macOS 双架构 dmg+zip、签名+公证、`/usr/local/bin/kun` 软链；Windows 仅 x64 NSIS per-user、PATH 注入 `bin\kun.cmd`、卸载不删数据、安装范围迁移有事务测试；两边都靠应用内 generic 更新源，Linux 有 arm64 而 Windows 没有。**平台不对等项**：Windows ARM64 缺失（未发现产物与说明）。

#### 主体功能运行位置

主体功能 100% 在 PC 本地：回合执行、任务图、调度与恢复、记忆、审批、工作流、网关、手机远程服务都是本机进程。Local 优先判定为**满足**。不构成缺陷但需记录的联网依赖：更新源、可选的账号/衣橱服务、可选的第三方市场目录、模型 Provider、可选 IM 通道。不联网时产品仍可安装使用（更新与装扮功能不可用；文档为内置离线兜底资源，且生产 smoke 明确验证「离线重启及回滚」）。

#### 云端形态

见结论 9，含职责、组件、依赖、接口、持久化、通信、托管形态（Cloudflare R2 + Worker、Supabase、厂商域名）、数据/权限/网络边界（仅登录用户可读资源、`private, no-store`、客户端无 R2 凭据、ed25519 签名）和故障影响（更新与装扮不可用，不影响本地任务数据与执行）。

## 未决项与证据边界

- **运行时真实行为未经本次运行验证**：全部结论建立在官方文档、源码契约与 CI 声明之上，未安装或执行 Kun。Graph 恢复、租约过期结算、SSE 重连、Windows 安装迁移的实际表现仍需真机验证。
- **Windows ARM64**：只确认了未发布 arm64 产物；官方未说明 Windows on ARM 的支持计划与 x64 转译体验。
- **最低系统版本**：macOS 与 Windows 的最低支持版本官方未说明；Electron 43.1 隐含的下限是推导，不作为结论。
- **macOS 卸载与数据清理官方步骤**：未发现文档说明；`~/Library/Application Support/Kun` 与 `~/.kun/data` 的清理建议是按目录约定推导。
- **手机远程的威胁模型**：明文 HTTP + 口令 + 会话令牌在不可信 LAN（公共 WiFi）下的暴露面，官方只给出 loopback/LAN 两档 bind，未发现更细的风险说明或 VPN 建议。
- **社区反馈代表性**：2 个 open issue、未见 closed 样本、贡献者数量未取到，因此「生态活跃度」与「常见问题分布」两项证据不足；星数/fork 只描述公开快照。
- **账号服务端**：其数据模型、可用性 SLA、离线降级（除「回退内置资源」外）不在仓库中，无法核验。
- **`kun host` 与 GUI 的关系**：官方明确默认 GUI 不能连独立宿主、同 profile 需先关 GUI，但未说明多客户端长期共存的推荐路径。
- **Graph 默认关闭的产品影响**：文档表述为「产品始终按完整的稳定版 Graph 能力运行」，而出厂默认 `enabled: false`、`defaultStrategy: direct`。二者关系（是否首次使用需手动开启）官方未说明。

## 后续验证建议

1. 在 macOS（Apple Silicon）与 Windows x64 真机各装一次 0.4.0：验证 Gatekeeper/SmartScreen 提示、`kun` CLI PATH、应用内升级到下一版本的完整交接，以及 Windows 从 current-user 到 all-users 迁移后旧注册/快捷方式/PATH 是否被精确清理。
2. 开一个真实 Graph run 并在节点执行中途强杀应用，重启后核对：过期租约结算、orphan attempt 计数、`awaiting_supervision` 是否唤醒原 Lead、未合并 worktree 是否 preserved（对照 docs/graph-mode.md §13 的恢复顺序逐项打勾）。
3. 在同一 `dataDir` 上并行起 GUI 与 TUI，确认返回 ownership conflict 而不是静默接管；再用 `kun tui --no-start` 连 GUI 持有的 Runtime，核对 `clientSurface` 是否按回合正确继承。
4. busy 回合下排队两条输入并注入提交失败（或断网/杀进程），验证 503 + `queue_admission_uncertain`、按同一 `clientRequestId` 重试不重复建 turn、Stop 后不被容量通知自动恢复。
5. 手机远程：在受控 LAN 上开启 LAN bind，实测登录锁定与会话 TTL、抓包确认凭据与消息为明文，据此判断是否只允许在可信网络启用；同时实测 `kun host start/status/stop` 的真实生命周期与状态诚实性（PID 不当作在线证据）。
6. 把本地模型网关分别接给 Claude Code 与 Codex，验证实例发现文件 `~/.kun/gateway.json`、路由 trace、会话亲和在重启后保持，以及「原生订阅连接默认不可导出」的边界是否与文档一致。
7. 若要评估「改造为常驻调度服务」的可行性，优先验证：把定时任务与工作流引擎从 Main 迁到 Manager/Runtime 需要改哪些所有权点，以及 `.kunpack` 与 executionTask 聚合能否作为跨宿主迁移的唯一事实源。
