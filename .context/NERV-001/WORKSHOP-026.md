# Zano 技术产品调研

> updated_by: Codex - GPT-5.6
> updated_at: 2026-07-30 22:54:33
> evidence_window: 调研日期 2026-07-30；EryouHao/zano main 分支 fa810095（最后提交 2026-05-07）；GitHub Release v0.1.0；npm @fehey/zano-bridge v0.1.5；Claude Code 官方安装文档 2026-07-30 快照

## 交付结论

1. **Zano 是一个“人类与本地 AI Agent 共处频道”的协作工作区**。产品形态类似 Slack：Web 端提供频道、私信、线程、任务板、Agent 与机器管理；工作机上的 Zano Bridge 订阅消息，并为用户拥有的每个 Agent 拉起一个长期运行的 Claude Code 子进程。
2. **按本次 RUNBOOK 的严格口径，Zano 整体不符合“主体功能必须运行在工作 PC，云端只能辅助”的要求**。Agent 执行、工作目录和本地文件操作确实位于 PC，但共享消息、任务、身份、权限、Agent 定义、会话 ID、在线状态与协作 UI 都依赖 Next.js + Supabase 控制面。Supabase 同时承担数据库、认证和实时通信，不是简单认证或转发网关；Bridge 无法脱离该控制面独立工作。
3. **macOS 上的本地执行链路基本成立，但它不是原生桌面产品**。官方路径是安装 Node.js 20+ 与 Claude Code，再以前台 Node CLI 运行 `npx @fehey/zano-bridge`。Bridge 会写入 `~/.zano/agents`、生成 Bash 包装脚本并启动 Claude Code；macOS 的 POSIX 环境与该实现匹配。项目没有 `.app`、安装器、LaunchAgent 或正式后台服务方案。
4. **Windows 原生安装目前不应判定为受支持**。npm 包未设置 OS/CPU 限制，Claude Code 官方也已支持 Windows 10 1809+ 原生运行；但 Zano 官方文档未给出 Windows 路径，Bridge 当前会生成 `#!/usr/bin/env bash` 的无扩展名 `zano` 包装脚本、依赖 Unix 可执行权限，并用 `HOME` 展开默认目录。安装 Git for Windows、从兼容 Bash 环境启动并显式传入 `--agents-dir` 后可能可用，但这只是未运行验证的适配推导，不构成官方 Windows 支持。WSL 不纳入本次工作机路径。
5. **当前成熟度是个人项目级实验版本，不适合作为生产级 Agent 基础设施直接采用**。仓库明确标记 early and experimental；没有自动化测试，Web 端存在已知 lint 错误，数据库没有有序迁移工具；主分支自 2026-05-07 后无代码提交，npm Bridge 自 2026-04-28 后无发布更新。
6. **多机器调度边界尚未建立，是当前最重要的架构缺口**。每个 Bridge 会按用户身份加载该用户的全部 Agent，数据库和连接接口中没有 Agent 到机器的分配、租约或抢占关系。合理推导是：同一用户在两台机器同时运行 Bridge 时，两端可能同时订阅相同消息并拉起相同 Agent，造成重复回复、会话 ID 竞争及本地记忆分叉。公开 Issue #1 也提出了同一问题，截至证据窗口未获回复。
7. **可借鉴价值主要在本地 Agent 执行平面**：每 Agent 独立工作目录、持久 `MEMORY.md`、Claude Code 长进程、串行消息队列、Supabase Realtime 触发和任务 CLI 形成了一个紧凑原型。若目标是完全 PC 本地、弱云依赖或 Windows 原生 Agent 基础设施，需要重新设计控制面、机器分配和跨平台命令传输，而不是直接部署现状。

## 调研目标、范围与边界

### 调研目标

理解 Zano 的产品定位、核心流程、系统边界和运行依赖，重点回答：

1. Zano 为谁解决什么问题，Agent 如何获得消息和任务？
2. 哪些组件运行在工作 PC，哪些组件位于云端？
3. Windows 与 macOS 工作机能否按官方路径安装、运行和卸载？
4. 产品的维护状态、版本成熟度与公开反馈如何？

### 覆盖范围

- 产品定位、目标用户、核心流程与功能边界。
- 维护状态、版本演进、生态入口与公开反馈。
- 运行形态、主要组件、核心链路、关键依赖、接口、持久化、通信与部署。
- Windows/macOS 工作机安装资格与主体功能运行位置。

### 明确排除

- 不进行逐文件源码审计、代码质量审计或安全渗透测试。
- 不进行竞品比较或选型矩阵。
- 不调研遥测、监控、指标或运营数据采集。
- 不执行实际安装、不注册账号、不启动 Claude Code Agent、不进行性能 benchmark。
- Linux 与 WSL 不作为工作 PC 的合格运行路径。

## 证据口径

- **已确认**：来自仓库 README、自托管指南、包清单、关键入口文件、GitHub/NPM 元数据和 Claude Code 官方文档的直接证据。
- **合理推导**：组件关系、多机器重复执行风险、Windows 兼容性和主体功能位置等根据直接证据形成的架构判断；不等同于实际运行验证。
- **公开反馈**：当前只有一个公开 Issue 样本，仅用于指出机器分配问题，不代表普遍用户反馈。
- **未决**：需要 Windows/macOS 实机、双机器并发或完整自托管部署才能确认的事项，均在文末列出。
- GitHub 的 `updated_at` 在 2026-07-30 仍有变化，但代码活动应以 `pushed_at` 和提交记录为准；主分支最后推送为 2026-05-07。

## 产品调研

### 产品定位与目标用户

**一句话定位**：Zano 是一个让人类与 Claude Code Agent 在共享频道、私信、线程和任务板中协作的 Web 工作区，本地 Bridge 为云端协作空间接入用户工作机上的 Agent 执行能力。

目标用户包括：

- 希望让多个长期 Agent 作为团队成员存在，而不是每次临时发起一次对话的个人或小团队。
- 已使用 Claude Code，希望 Agent 能访问本地文件、工具和网络，同时通过共享频道与任务状态协作的开发团队。
- 能接受 Supabase、Next.js 托管服务与 Anthropic 在线模型依赖的实验性用户。

Zano 当前不是：

- 完全离线或纯本地的 Agent 工作台。
- 只提供简单云网关的桌面软件。
- 已具备机器调度、租约、隔离策略和可靠交付保障的生产级 Agent 调度平台。
- 通用模型运行框架；当前 Agent 执行对象固定为 Claude Code。

### 核心流程

一条端到端使用链路如下：

1. 用户在 Zano Web 注册并创建工作区、频道和 Agent。
2. 用户在“机器”设置中生成 Machine API Key。
3. 用户在工作机执行 `npx @fehey/zano-bridge --api-key ...`；Bridge 调用 Web 的 `/api/bridge/connect`，换取 Supabase 地址、匿名 Key、带用户身份的短期 JWT 和工作区信息。
4. Bridge 查询该用户拥有的全部 Agent 和频道成员关系，在 `~/.zano/agents` 下为每个 Agent 创建以 UUID 命名的子目录，并初始化 `MEMORY.md` 与 `notes/`。
5. Bridge 通过 Supabase Realtime 订阅消息：私信直接触发 Agent；公共频道只有明确 `@Agent` 时触发。
6. 首次收到消息时，Bridge 以该 Agent 的工作目录启动 `claude` 子进程，使用 stream-json 输入输出协议，并通过 stdin 逐条投递消息。
7. Bridge 把 `zano` CLI 注入 Agent 的 `PATH`。Agent 使用该 CLI 直接读取/发送消息、查询频道、创建或认领任务、更新任务状态；数据写回 Supabase，Web UI 实时展示。
8. Agent 的 Claude 会话 ID 保存到 Supabase，本地 `MEMORY.md` 和 `notes/` 保存长期知识；Bridge 重启时可恢复会话和工作目录。

### 功能地图与边界

| 功能域 | 当前能力 | 关键边界 |
| --- | --- | --- |
| 协作空间 | 工作区、频道、私信、线程、成员与 Agent 管理 | 依赖 Web + Supabase，不能由 Bridge 独立提供 |
| Agent 运行 | 每 Agent 一个 Claude Code 长进程和独立工作目录 | 固定依赖 `claude` 命令；默认绕过权限确认 |
| 消息路由 | Realtime 订阅；私信直达；频道按 `@mention` 路由 | 无持久消息消费租约，多 Bridge 可能重复消费 |
| 任务协作 | `todo`、`in_progress`、`in_review`、`done`；创建、认领、取消认领、更新 | 任务是真相源数据，不是独立可靠队列或调度器 |
| 长期记忆 | 本地 `MEMORY.md`、`notes/`，Supabase 保存会话 ID | 本地记忆与机器绑定，迁移与多机一致性未定义 |
| 工作区文件 | Web 可经 Realtime RPC 请求 Bridge 读取 Agent 本地工作区 | 云端 UI 与本地文件之间形成高信任边界 |
| 机器管理 | API Key、在线 Presence、30 秒心跳、主机名/平台信息 | 没有 Agent 分配、租约、主备或冲突避免机制 |
| 自托管 | 开源 Next.js、Bridge 和数据库 SQL | 官方指南仍要求 Supabase 项目；不是离线一体化安装包 |

### 维护状态与版本演进

- 仓库创建于 2026-04-27，首个公开 Release `v0.1.0` 发布于 2026-05-07。
- npm Bridge 在 2026-04-28 当天连续发布 `0.1.0` 至 `0.1.5`；CLI 当前为 `0.1.0`。
- 主分支最后提交 `fa810095` 时间为 2026-05-07；截至 2026-07-30 未发现后续代码提交或 Release。
- 仓库快照为 214 Stars、28 Forks、1 个 Open Issue。该数据只表示公开关注度，不代表采用率或质量。
- README 明确声明项目“early and experimental”，原作者以个人时间维护，并欢迎社区 fork。
- 已知工程缺口由官方直接披露：约 17 个 Web lint 错误、CI lint 暂时 `continue-on-error`、无自动化测试、数据库 SQL 需要按特殊顺序手工执行、尚无迁移工具。

综合判断：**项目已经形成可工作的产品原型，但当前维护连续性和工程保障弱，成熟度低于可直接承担团队关键任务的基础设施要求。**

### 生态与反馈

- **生态入口**：MIT 许可证、GitHub Issues/Discussions、可 fork 的 Next.js/Bridge/CLI/SQL 全套源码、npm 发布的 Bridge 与 CLI。
- **扩展方式**：可更换 Web 主机、Supabase 项目和 `--server-url`；Bridge 客户端协议不要求使用官方 npm 包，允许 fork 后重新发布。
- **公开反馈样本**：Issue #1 询问 Agent、频道与机器的预期关系，明确指出 Agent 当前没有绑定机器，并追问两台 Bridge 是否都会运行全部 Agent。该 Issue 创建于 2026-05-09，截至证据窗口仍开放且无回复。
- 由于样本仅一个，不能据此推导总体用户满意度；但其问题与入口实现互相印证，足以将“多机器分配未定义”列为已知未决架构边界。

## 技术架构调研

### 系统全貌与运行形态

Zano 是一个云端协作控制面与本地 Agent 执行面的组合系统：

| 组件 | 运行位置 | 职责 |
| --- | --- | --- |
| Zano Web | 默认托管于 `zano.fehey.com`；自托管时运行在 Vercel、VPS 或其他 Next.js 主机 | 用户界面、登录、频道/任务/Agent/机器管理、Bridge 连接接口 |
| Supabase | 官方路径为外部 Supabase 项目 | Postgres 真相源、Auth、RLS、Realtime Postgres Changes/Broadcast/Presence |
| Zano Bridge | 用户 Windows/macOS 工作机 | 认证、订阅消息、Agent 生命周期、本地工作区、Presence/心跳、文件 RPC |
| Claude Code Agent | Bridge 所在工作机上的子进程 | 读取本地文件与工具、执行任务、通过 `zano` CLI 回写协作数据 |
| `zano` CLI | 注入每个 Agent 的 `PATH` | 消息、频道、任务、服务器信息等 Agent 侧操作接口 |

默认托管站在调研时可访问，并跳转到 Zano 登录页。该事实只证明入口在线，不代表完整功能已运行验证。

### 主体功能运行位置判定

Zano 的主体并非单一位置，而是强耦合的两部分：

- **PC 本地执行面**：Claude Code 推理客户端、命令执行、本地文件读写、Agent 工作目录、记忆文件和 Bridge 进程。
- **远端控制与数据面**：用户身份、工作区、Agent 定义、频道、消息、任务、会话 ID、机器 Key、权限策略、在线状态和实时事件。

云端部分不只是账号、授权或转发：如果 Supabase 不可达，Bridge 无法获得 Agent、接收消息、查询任务或回写结果；如果 Web 控制面不可达，Machine API Key 认证和用户操作入口也会受影响。因此按 RUNBOOK 的严格筛选条件，**Zano 整体判定为不符合**。

若只评价“Agent 实际操作工作机文件和工具是否发生在 PC”，答案是**符合**；但这不能改变整个产品依赖远端核心控制面的事实。

### 主要组件与核心链路

#### 消息触发链路

1. Web 将人类消息写入 Supabase `messages`。
2. Supabase Realtime 将 Postgres 变更推送给所有订阅 Bridge。
3. Bridge 判断频道成员和消息类型：私信触发对应 Agent，公共频道只触发被 `@mention` 的 Agent。
4. Bridge 获取频道上下文，把消息封装后写入对应 Claude Code 进程 stdin。
5. Agent 使用注入的 `zano message send` 写回 Supabase。
6. Web 通过 Realtime 看到 Agent 回复和活动状态。

#### Agent 生命周期与记忆链路

1. Bridge 启动时按 `owner_id` 加载用户的全部 Agent。
2. 每个 Agent 绑定一个本地 UUID 目录，首次创建 `MEMORY.md` 和 `notes/`。
3. 第一次收到消息时才拉起 Claude Code；同一 Agent 的消息通过 Bridge 内存队列串行交付。
4. Claude Code 返回 session ID 后，Bridge 写入 Supabase `agents.session_id`。
5. 后续进程重建时使用 `--resume` 恢复 Claude 会话，并重新读取本地 `MEMORY.md` 构造系统提示词。

#### 多机器冲突链路

当前连接接口虽然记录 Machine Key、主机名、平台和心跳，但 Bridge 加载 Agent 的查询条件是用户身份，而不是机器身份。Presence 只上报本 Bridge 看到的 `agentIds`，没有租约或所有权变更。因此两台机器使用同一用户/工作区的 Key 时，合理推导会发生：

- 两台 Bridge 都加载全部 Agent 并订阅相同消息。
- 同一条消息可能触发两个本地 Claude Code 进程。
- 两端共享 Supabase session ID，但各自拥有不同本地 `MEMORY.md` 和工作文件。
- Presence、状态和回复可能互相覆盖，且没有明确的冲突裁决方。

### 主要依赖

只列影响安装和核心运行的依赖：

- **Node.js 20+**：运行 `@fehey/zano-bridge` 与 `@fehey/zano-cli`。
- **Claude Code**：Bridge 固定执行 `spawn("claude", ...)`，是唯一 Agent 运行时。
- **Claude Code 账号或 Anthropic/第三方模型提供方凭据**：模型调用需要联网认证。
- **Zano Server URL 与 Machine API Key**：默认连接 `https://zano.fehey.com`，自托管时改用自己的 Next.js 地址。
- **Supabase**：Postgres、Auth、RLS、Realtime 均为硬依赖；官方自托管指南要求创建 Supabase 项目。
- **Bash 兼容环境**：当前 Bridge 为 Agent 注入的 `zano` 命令是 Bash 包装脚本；macOS 默认具备，Windows 原生需要额外兼容环境。
- **本地磁盘写权限**：默认写入 `~/.zano/agents`，每个 Agent 有独立工作区、记忆和辅助文件。

源码开发路径还需要 pnpm 10、Turborepo 和完整仓库，但不属于 npm Quickstart 的终端用户硬依赖。

### 接口形态

- **Web UI**：浏览器中的频道、私信、线程、任务、Agent、机器与工作区文件界面。
- **Bridge CLI**：`zano-bridge --api-key --server-url --agents-dir`。
- **连接 HTTP API**：`POST /api/bridge/connect` 校验 Machine API Key，返回 Supabase 连接信息和带用户身份的 JWT。
- **Supabase 数据接口**：Web、Bridge 与 Agent CLI 通过 Supabase JS 客户端访问表和 RLS 策略。
- **Realtime WebSocket**：Postgres Changes 传递新消息和成员变化；Broadcast 用于活动和工作区文件 RPC；Presence 表示机器在线状态。
- **本机子进程接口**：Bridge 与 Claude Code 使用 stdin/stdout stream-json；不是网络 RPC。
- **Agent CLI**：`zano message ...`、`zano task ...`、`zano channel ...` 等命令是当前主执行路径。仓库还存在一个 MCP stdio 服务文件，但未被 Bridge 主入口引用，不将其视为已确认的核心运行链路。

### 持久化方式

| 状态 | 存储位置 | 归属与恢复方式 |
| --- | --- | --- |
| 用户、工作区、频道、成员、消息、任务、Agent、机器 Key | Supabase Postgres | 共享权威真相源，受 RLS 控制 |
| Claude Code session ID | Supabase `agents` | Bridge 重启或 Agent 进程重建时用于 `--resume` |
| Agent 工作目录 | 工作机 `~/.zano/agents` 下以 Agent UUID 命名的子目录 | 只存在当前机器，默认长期保留 |
| Agent 长期记忆 | 本地 `MEMORY.md`、`notes/` | 不自动同步到其他机器 |
| 单 Agent 待处理消息 | Bridge 进程内内存队列 | Bridge 崩溃或重启后不保证保留 |
| 在线状态 | Realtime Presence + `machine_keys.last_used_at` | Presence 断线自动移除，数据库心跳每 30 秒更新 |

Zano 没有独立消息队列中间件。任务板是数据库业务状态，Bridge 的消息串行化只是单进程内队列，不能等同于持久可靠队列。

### 通信方式

- Web ↔ Supabase：HTTPS 数据访问 + Realtime WebSocket。
- Bridge ↔ Zano Web：启动和每 6 小时刷新时调用 HTTPS 连接接口。
- Bridge ↔ Supabase：Realtime 长连接、PostgREST/数据库 API、Presence 与 Broadcast。
- Bridge ↔ Claude Code：本机 stdin/stdout 流式 JSON。
- Claude Code Agent ↔ Supabase：通过注入的 `zano` CLI 和环境变量直接访问 Supabase。
- Claude Code ↔ Anthropic：由 Claude Code 自身通过互联网完成模型调用。

总体是“云端事件总线与数据库 + 本地长驻执行器”的模式，不是 PC 内部闭环，也不是云端只做透明代理。

### 安全与权限边界

- Machine API Key 在服务端以 SHA-256 Hash 查询；连接接口不会把 Supabase `service_role` Key 下发给 Bridge，而是返回匿名 Key 和带用户身份的 7 天 JWT。
- Bridge 把 Supabase URL、匿名 Key 和用户 JWT 注入 Claude Code 子进程，使 Agent 能在 RLS 允许范围内直接读写消息与任务。
- Bridge 以 `--permission-mode bypassPermissions` 启动 Claude Code。官方 README 也明确提示：Agent 能做 Claude Code 在该机器上能做的一切，包括文件、工具和网络访问。
- Web 可通过 Realtime RPC 请求 Bridge 读取 Agent 本地工作区文件。虽然 Bridge 只为本用户 Agent 响应，但这仍把远端控制面与本地文件系统连接在一起。

因此 Zano Bridge 应视为**高信任本地守护进程**。它不适合在不受信频道、共享高权限账户或包含敏感凭据的工作机上默认运行。

## 部署形态

### 默认托管模式

- Web 与 Supabase 使用项目作者提供的托管环境。
- 用户只在工作机运行 Bridge 与 Claude Code。
- 这是最快路径，但消息、任务、身份和状态依赖外部服务。

### 官方自托管模式

官方指南的“自托管”包括：

1. 创建 Supabase 项目并手工按顺序执行 SQL 文件。
2. 在 Vercel、其他 Node 主机或自有 VPS 部署 Next.js 16 Web。
3. 在每台 Agent 工作机运行 Bridge，使用 `--server-url` 指向自有 Web 地址。

该路径允许自托管 Zano 应用代码，但官方指南仍要求 Supabase 账号/项目，并未提供 Supabase 本地一体化部署或离线安装流程；Claude Code 模型调用同样依赖网络。因此“fully self-hostable”应理解为**应用代码可自行托管**，不应扩大解释为完全离线或全部组件都在工作 PC。

## 工作机安装（Windows / macOS）

### macOS

**判定：Bridge 执行面可用，整体产品仍因核心云控制面而不符合本次主体位置要求。**

安装与启动：

1. 安装 Node.js 20+。
2. 安装并登录 Claude Code；Claude Code 官方要求 macOS 13.0+。
3. 在 Zano Web 创建 Machine API Key。
4. 运行：

```bash
npx @fehey/zano-bridge@0.1.5 --api-key zk_your_key_here
```

自托管时追加：

```bash
npx @fehey/zano-bridge@0.1.5 \
  --api-key zk_your_key_here \
  --server-url https://zano.example.com
```

运行形态与依赖：

- 前台 Node CLI 长驻进程，不是 macOS `.app`。
- 默认工作目录为 `~/.zano/agents`。
- 依赖 Bash 包装脚本、Node、Claude Code 和持续网络连接。
- 需要访问 Zano Web、Supabase Realtime/数据库 API、Anthropic 以及 Agent 工作所需的外部网络。
- 普通用户权限即可启动，但 Agent 实际拥有与当前用户接近的本地访问能力；不应在高权限终端中运行。
- 官方未提供 LaunchAgent、登录启动、崩溃拉起或日志轮转方案。

卸载：

1. 停止 Bridge 前台进程。
2. 在 Zano Web 撤销对应 Machine API Key。
3. `npx` 路径通常没有全局 Zano 安装；若曾全局安装，使用 npm 卸载对应包。
4. 确认不再需要 Agent 记忆和工作文件后，再删除 `~/.zano/agents`。该目录包含业务数据，不应作为普通缓存直接清理。

### Windows

**判定：当前官方证据不足，原生 Windows 不符合可直接采用要求。**

有利条件：

- npm Bridge/CLI 是 JavaScript 包，包元数据没有限制 `os` 或 `cpu`。
- Claude Code 官方已支持 Windows 10 1809+、Windows Server 2019+，可从 PowerShell/CMD 原生安装；Git for Windows 为可选的 Bash 工具来源。
- Node.js 20+、Supabase JS 和 HTTPS/WebSocket 本身均可跨平台运行。

阻碍条件：

- Zano README 与自托管指南没有 Windows 安装、服务化或卸载说明。
- Bridge 生成的 Agent 命令是无扩展名文件 `zano`，内容以 `#!/usr/bin/env bash` 开头，并依赖 `0o755` 可执行权限；PowerShell/CMD 不能把它当作普通 Windows 命令直接执行。
- 默认目录使用 `process.env.HOME` 展开 `~/.zano/agents`，未使用 Windows 常见的 `USERPROFILE` 或 Node `homedir()`；从 PowerShell/CMD 启动时可能得到错误或相对路径。
- 官方没有原生 Windows 运行验证、CI 目标或发布说明。

可能的未验证适配路径是：安装 Git for Windows、从 Git Bash 启动 Bridge、显式设置 `--agents-dir C:/...`，并确认 Claude Code 的 Bash 工具能执行注入的 `zano` 脚本。该方案需要实机验证和代码修正，不能作为当前官方安装方式。

WSL 即 Linux 用户空间，按本次 RUNBOOK 不计入 Windows 工作 PC 的合格路径。

卸载方面与 macOS 类似：停止进程、撤销 Machine API Key、移除 npm 包或缓存，并在确认数据可删除后清理显式配置的 Agent 目录。当前没有 Windows 安装器、注册表项或系统服务可由官方卸载程序处理。

## 云端网关与外部服务

Zano 不存在可被简单略过的“轻量云网关”。远端部分承担核心职责：

- Next.js Web：用户界面、Bridge 认证入口和管理操作。
- Supabase Postgres：共享业务真相源。
- Supabase Auth/RLS：身份和数据隔离。
- Supabase Realtime：消息触发、Presence、活动状态和工作区文件 RPC。
- Anthropic/模型提供方：Claude Code 模型推理。

这些都是产品运行必要条件，因此本报告不将其描述为简单认证或转发层；同时遵循 RUNBOOK，不展开 Supabase 服务端内部架构、扩缩容、高可用或 SLA。

## 未决项与证据边界

1. **Windows 原生实机**：尚未验证 Git Bash + 显式工作目录能否完整跑通 `zano` CLI、stream-json 和任务链路。
2. **macOS 端到端运行**：尚未实际注册、安装 Bridge、启动 Claude Code 或验证工作区文件 RPC。
3. **多机器并发**：未实测两台 Bridge 是否产生重复回复；结论来自连接查询、订阅模型和公开 Issue 的一致证据。
4. **完整私有化**：官方指南没有覆盖自托管 Supabase；未确认在完全自有基础设施上部署 Supabase 时所需的额外配置和兼容性。
5. **生产可靠性**：无自动化测试、故障恢复、消息幂等、持久队列或负载测试证据。
6. **MCP 路径**：仓库保留 MCP stdio 服务实现，但 Bridge 主入口当前使用 `zano` CLI，未验证 MCP 文件是否仍为受支持路径。

## 后续验证建议

如果目标是按本次 PC 本地优先条件筛选产品，现有证据已经足以停止继续深挖：**Zano 整体不符合，主要原因是核心控制与数据面必须远端运行，且 Windows 原生路径未完成。**

若只希望借鉴其本地 Bridge 设计，可进行三个小范围验证：

1. 在 macOS 上用一个测试 Agent 跑通“私信 → Claude Code → `zano` 回复 → 任务认领”，记录文件与网络权限。
2. 在 Windows 原生环境使用 Git for Windows 和显式 `--agents-dir` 跑同一链路，定位 Bash 包装脚本、PATH 与目录展开问题。
3. 在两台机器同时连接同一用户，发送一条消息，验证是否重复拉起 Agent，并据此设计 Agent-machine assignment、租约和幂等消费。

## 主要证据锚点

- [Zano README](https://github.com/EryouHao/zano/blob/fa810095a3f334f411c8e3309584679caf54cee3/README.md)
- [自托管指南](https://github.com/EryouHao/zano/blob/fa810095a3f334f411c8e3309584679caf54cee3/docs/SELF_HOSTING.md)
- [Bridge 入口与参数](https://github.com/EryouHao/zano/blob/fa810095a3f334f411c8e3309584679caf54cee3/apps/bridge/src/index.ts#L26-L155)
- [Bridge 加载 Agent 与 Realtime 订阅](https://github.com/EryouHao/zano/blob/fa810095a3f334f411c8e3309584679caf54cee3/apps/bridge/src/bridge.ts#L110-L180)
- [Bridge Presence 与机器心跳](https://github.com/EryouHao/zano/blob/fa810095a3f334f411c8e3309584679caf54cee3/apps/bridge/src/bridge.ts#L474-L518)
- [Agent 工作区、Bash CLI 包装与 Claude Code 启动](https://github.com/EryouHao/zano/blob/fa810095a3f334f411c8e3309584679caf54cee3/apps/bridge/src/agent-manager.ts#L215-L515)
- [Bridge 连接接口](https://github.com/EryouHao/zano/blob/fa810095a3f334f411c8e3309584679caf54cee3/apps/web/src/app/api/bridge/connect/route.ts)
- [Machine Key 与 Bridge RLS](https://github.com/EryouHao/zano/blob/fa810095a3f334f411c8e3309584679caf54cee3/packages/db/src/machine-keys.sql)
- [v0.1.0 Release](https://github.com/EryouHao/zano/releases/tag/v0.1.0)
- [npm：@fehey/zano-bridge](https://www.npmjs.com/package/@fehey/zano-bridge)
- [公开 Issue #1：Agent、频道与机器关系](https://github.com/EryouHao/zano/issues/1)
- [Claude Code 官方安装与 Windows 支持](https://code.claude.com/docs/en/setup)
