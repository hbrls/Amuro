# Tutti（tutti-os/tutti）技术产品调研

> updated_by: Qoder - Claude Sonnet 4.5
> updated_at: 2026-07-31 17:20:00
> evidence_window: 调研日期 2026-07-31；GitHub 仓库 `tutti-os/tutti`（创建于 2026-06-12，主干最近推送 2026-07-31）；最新 Release `v0.2.8`（2026-07-30，含 12 个 macOS 二进制资产）；官网 tutti.sh、README.md、AGENTS.md、CONTRIBUTING.md 与 main 主干目录结构快照

## 交付结论

1. **Tutti 是一个开源、本地优先（local-first）的桌面「人-Agent 实时共享工作台」，定位是围绕已有编码 Agent 的协作层，而非替代品。** 官方一句话为「Where people and agents build in tune」。它解决的核心痛点是：当真实工作流需要多个 Agent（Claude Code、Codex 等）依赖与交接时，人被迫沦为「Agent 之间的传话人」——反复复制上下文、下载/上传/粘贴产物。Tutti 提供一个上下文、文件、App、任务全部互联的实时共享工作区，让不同 Provider 的 Agent「像共享一个大脑」。

2. **运行形态判定为「纯本地桌面 + 本地常驻守护进程」，是强 Local 优先形态（开源版）。** 架构是本地优先桌面 monorepo：`apps/desktop`（Electron 外壳 + 渲染层 UI + preload 桥）+ `services/tuttid`（长驻本地守护进程，主业务核心，Go 实现，暴露 HTTP/query API）+ `packages/agent/host`（Provider 中立的 Agent 生命周期应用核，TypeScript）。Agent 在本机运行，工作状态留在本地；本地库为 SQLite（`~/.tutti/tuttid.db`，dev 为 `~/.tutti-dev/tuttid.db`）。

3. **Tutti 有「本地开源版」与「Tutti · VM 云端版」双形态，二者边界必须区分。** `Tutti`（open source）：Agent 本地运行、工作状态留本地，单人多 Agent。`Tutti · VM`（coming soon，**未发布、闭源、需 waitlist**）：用「多层虚拟化」把本地 Agent 虚拟成实时共享的**云端**工作区，Agent 仍在本地运行但工作状态实时驻留云端 Room，支持跨设备、多人多 Agent 协作。**本次调研的开源仓库仅含本地版；云端版是未来商业形态，不构成当前 Local 优先缺陷，但需标注为「云端路线在途」。**

4. **调度范式是「本地守护进程集中编排 + 目标→任务拆解 + 人审分派」，无中心云端调度器（开源版）。** Agent 生命周期语义（session/turn/goal/runtime-operation 的创建、发送、终止、恢复）由单一属主 `packages/agent/host` 通过 `ApplicationHost()` 拥有；`services/tuttid` 与 Go 侧 `tsh cmd/desktopd` 只是适配层（HTTP/query/composer/analytics/transport/provider 准备）委派生命周期。任务侧：用户描述目标 → Tutti 拆成子任务 → 人 review 后分派给合适 Agent → Control Center 统一汇聚待办/审批/运行态。这是**本地进程内集中编排**，对应 Index 关注的调度问题但落点在本地而非云端特权服务。

5. **区别于 Alook（云端中心队列 + 客户端轮询）与 Maestro（纯透传无自有 App）：Tutti 走「本地编排 + 自有 App 生态 + 跨 Agent 共享上下文」路线。** 三大核心能力：① 实时共享工作区（Big @ 引用历史会话/文件/App 调用/任务、`+` 引用本地文件与 App 产物、任务编排与冲突规避）；② 人与 Agent 共用的 App 中心（AI Canvas 图像、原型/UI 设计、文档、AI PPT，官方/社区/自建，运行在你已有的 Agent 订阅之上、不额外加价转售模型）；③ 减少「关于工作的工作」（目标→任务、Control Center、纯 GUI 无命令行）。

6. **Provider 复用你已有订阅，模型推理默认外流云端为唯一固有 Local 缺陷。** 支持 Claude Code、Codex、Hermes（OpenClaw 开发中）；「复用已有订阅、零额外成本」。无订阅者可用内置「Tutti Agent」（Early Access 免费，后续可能按量计费）。模型推理由底层 Provider CLI 对接其云端 API——这是 Provider 固有属性，与 Maestro 同类，非 Tutti 自身引入的中心化。

7. **持久化为「本地 SQLite + 本地文件」，无外置/云端数据面（开源版）。** 守护进程 `tuttid` 持有 durable local state，落 `~/.tutti/tuttid.db`；守护进程 HTTP 契约由 `services/tuttid/api/openapi/tuttid.v1.yaml` 定义。无 Postgres/Redis/云 DB 依赖。工作状态「留在本地」是官方明确承诺（VM 版才把状态搬云端）。

8. **工作机适配：macOS 完整（arm64 / x64 / universal 签名 DMG），Windows「coming soon」，无 Linux 桌面包——构成 Windows 工作机落地缺口。** `v0.2.8` 发布 12 个资产（`Tutti-0.2.8-mac-arm64/x64/universal.dmg/.zip` + `latest-mac.yml` + `SHA256SUMS.txt`），仅 macOS。README 明确「Windows support is coming soon」。开发栈需 Node 24+ / pnpm 10.11 / Go 1.24。

9. **维护状态「极活跃、高速迭代、工程规范严」。** 2026-06-12 创建、2026-07-31 仍在推送；3,197 stars / 315 forks / 151 open issues / 112 watchers。已到 `v0.2.x`（`v0.2.8`），有 `stable` 推荐 tag；`.changeset` 目录含大量变更单（changesets 驱动、发版频繁）；Go 1935 文件 + TS 2941 文件的大型混合 monorepo；AGENTS.md/CONTRIBUTING.md 规范完备（Conventional Commits、DCO、i18n、Agent Host 边界 lint、800 行文件上限）。Apache-2.0。

10. **综合判定：作为「本地优先 + 跨 Agent 共享工作台 + 自有 App 生态」范式的业界样本高度契合 Local 优先选型，建议列为「重点参考、优先候选」。** 满足多 Agent 协作、持续获得工作（目标拆解 + Control Center）、可治理审计（一切可见互联、人审分派）。主要待观察项：① Windows 工作机尚未支持；② 云端多人协作能力（Tutti · VM）闭源未发布，跨设备/多人场景暂不可评；③ 内置 Tutti Agent 后续计费策略未定；④ 模型推理仍外流 Provider 云端（固有）。

## 调研目标、范围与边界

### 调研目标

理解 Tutti 的产品定位、持续工作形态、运行架构与 Windows/macOS 工作机适配，重点判断其作为「Agent 持续获得工作并形成可治理完成闭环」的业界样本的成熟度、调度范式与 Local 优先适配程度，并厘清开源本地版与 Tutti · VM 云端版的边界。

### 核心问题

- Tutti 为谁解决什么问题，核心工作闭环如何形成？
- 本地桌面、守护进程 `tuttid`、Agent Host 应用核、Provider CLI、App 生态之间的职责边界是什么？
- Windows 与 macOS 工作机如何安装、运行、依赖与权限是什么？
- Agent 如何接收目标/任务并在多 Agent 间交接、避免冲突、形成审计与人审闭环？
- 状态如何持久化，是否存在云端依赖？开源版与 VM 版差异何在？
- 其调度范式是本地集中编排、云端中心调度，还是分布式任务池？

### 覆盖范围

- 官网 `tutti.sh`、README（含中英繁）。
- GitHub 仓库元数据、License、README.md、AGENTS.md、CONTRIBUTING.md、目录结构（`apps/{desktop,cli,mobile,ui-storyboard}`、`services/tuttid`、`packages/{agent,analytics,appcli,auth,browser,clients,commerce,configs,device-link,events,ui,workbench,workspace}`）、Release 列表与资产、`.changeset` 概况。

### 明确排除

- 不进行逐文件源码审计、代码质量审查或性能 benchmark（目录/AGENTS 仅用于回答架构与调度问题）。
- 不进行竞品比较、横向排名或选型矩阵（对比由独立流程完成；与 Alook/Maestro 的对照仅用于定位范式差异，非评分）。
- 不调研遥测实现细节。
- 不安装、不登录、不部署，不把静态证据包装为运行验证。
- Tutti · VM 云端版闭源未发布，仅据官方文案记录其定位，不做架构实证。
- Linux 仅作背景记录，不作工作机合格安装路径。

## 证据口径

- **直接事实**：官网/README 明文、AGENTS.md、CONTRIBUTING.md、GitHub API 元数据、License、Release 资产清单、目录结构与文件类型统计。
- **架构推导**：由 AGENTS.md（`services/tuttid` 守护进程 + `packages/agent/host` Agent Host 边界 + `apps/desktop` Electron）、CONTRIBUTING.md（仓库分层与 Go/Node 工具链）、目录树（Go/TS 文件分布、`services/tuttid/api/openapi`）、日志路径（`~/.tutti/tuttid.db`）组合推导出的组件关系与编排流；标注为系统模型，非运行时抓包。
- **产品文案**：README/官网对 Big @、App 中心、目标→任务、Tutti · VM 的描述用于归纳能力与形态，其中 VM 为「coming soon」未发布。
- **快照边界**：stars/forks/issue 数、版本与目录持续变化；结论以 `v0.2.8` 与 main 主干为准。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Tutti 是本地优先的桌面「人-Agent 实时共享工作台」——围绕你已有的编码 Agent 提供共享上下文、共用 App、任务编排的协作层，不替代 Agent。
- **目标用户**：任何用 AI Agent 构建的人——独立开发者（Claude 定计划、Codex 接开发，无需重讲上下文）、设计师（设计 App 出稿 → Codex 直接转代码）、产品经理（Codex 写 PRD → 调 UI/UX App 出原型，无需 Figma）、内容创作者（脚本/图像/排版一站式）。共同画像：同时用多个 Agent、手动搬运上下文/产物、为多个订阅分别付费而疲惫者。
- **隐喻**：合奏（tutti，意大利语「全体合奏」）——多 Agent 与人「同调协作」，共享一个实时工作区如同共享大脑。

### 核心流程

1. 下载 Tutti · Local（macOS）安装桌面应用，启动本地守护进程 `tuttid`；
2. 连接你已有的 Agent 订阅（Claude Code / Codex / Hermes）或使用内置 Tutti Agent；
3. 在 GUI 中描述目标 → Tutti 拆成子任务 → 人 review 后分派给合适 Agent；
4. Agent 在共享工作区协作：用 Big `@` 引用彼此的历史会话/文件/App 调用/任务，用 `+` 引用本地文件与 App 产物，跨 Provider 决定并行/串行以规避冲突；
5. 调用 App 中心（AI Canvas / 原型设计 / 文档 / AI PPT）产出，产物留在同一工作区供下一步 `+` 引用；
6. Control Center 统一汇聚所有会话、待审批动作、运行中任务，人一处处理。

### 功能地图与边界

- **实时共享工作区**：上下文、文件、运行任务、App 全部互联；Big `@`（引用跨 Agent 历史/文件/App/任务，甚至让 Codex 直接 @ Claude Code App 执行）、`+` 引用、任务编排与多项目并行/串行冲突规避。
- **App 中心**：AI Canvas（图像）、原型/UI 设计、文档、AI PPT；运行在已有 Agent 订阅之上、不加价转售模型；官方/社区/自建三来源。
- **少做「关于工作的工作」**：目标→任务自动拆解、Control Center 统一视图、纯 GUI 无命令行。
- **Provider 复用（BYO Agent）**：Claude Code / Codex / Hermes 可用，OpenClaw 开发中；内置 Tutti Agent 兜底（EA 免费）。
- **Tutti · VM（未发布）**：多层虚拟化的云端共享 Room，跨设备、多人多 Agent、`@` 队友的任务/文件/Agent 会话、localhost 免部署直接在 Room 预览；共享严格限定在 Room 内。

### 维护状态与版本演进

- **活跃度**：2026-06-12 创建，2026-07-31 仍在推送；3,197 stars / 315 forks / 151 open issues / 112 watchers（2026-07-31 快照）。
- **版本**：`v0.2.8`（2026-07-30），近期高频发版（v0.2.2 → v0.2.6/7/8），另有 `stable`（Recommended）滚动 tag。changesets 驱动发布。
- **工程规范**：AGENTS.md 定义分层与「Agent Host 边界」单一属主 + `pnpm check:agent-host-boundary` lint 拦截适配层越界编排；Conventional Commits + DCO + i18n 强约束 + 800 行文件上限 + Husky 钩子；多语言文档（中英繁）。
- **技术栈规模**：Go 1935 文件 + TS 2941 文件的大型混合 monorepo（pnpm 10.11 + go.work）。

### 生态与反馈

- **生态入口**：官网 tutti.sh、Discord、GitHub、App 中心（官方/社区/自建）、Tutti · VM waitlist。
- **反馈主题（据 changeset/目录归纳，样本有限）**：Agent 运行时能力契约与自愈（登录后 auth self-heal、runtime capability contracts）、Codex/Claude Provider 集成打磨（版本下限、API key 直连、计费 auth、模型目录）、Agent GUI 大量交互项（handoff、引用、附件、导出、会话来源分组）、App 中心创作能力、浏览器节点统一自动化、商务/设备联动。总体偏「Provider 集成深化 + Agent GUI 体验 + App 生态」，工程活动密度极高。

## 技术架构调研

### 系统全貌与运行形态

本地优先桌面 monorepo（AGENTS.md + CONTRIBUTING.md + 目录树佐证）：

- **桌面外壳**：`apps/desktop`（Electron shell + renderer UI + preload 桥 + 桌面集成）。
- **本地守护进程**：`services/tuttid`（长驻本地 daemon，主业务核心，Go；HTTP/query API，durable local state，adapters）。
- **Agent 应用核**：`packages/agent/host`（Provider 中立的 Agent 生命周期单一属主，TS；`ApplicationHost()`）；`packages/agent/gui`（Agent 会话/composer/审批交互）。
- **CLI**：`apps/cli`（Go，`cmd/tutti/main.go`，经 `internal/daemon` 与 tuttid 通信）；另有 `apps/mobile`、`apps/ui-storyboard`。
- **支撑包**：analytics、auth、browser、clients、commerce、device-link、events、ui、workbench、workspace。
- **范式判定**：本地进程内集中编排（Agent Host 拥有生命周期语义，tuttid/tsh 仅适配委派）+ Provider 订阅复用 + 自有 App 生态；无云端中心调度器（开源版）。Tutti · VM 才引入云端共享状态层，但未发布。

### 主要组件与核心链路

**主要组件（职责与运行位置）**：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| `apps/desktop`（Electron） | GUI、渲染、preload 桥、Control Center | 工作 PC 本地 |
| `services/tuttid`（Go daemon） | 主业务核心、durable 本地状态、HTTP/query、适配 | 工作 PC 本地 |
| `packages/agent/host`（TS） | Agent 生命周期单一属主（session/turn/goal/op） | 本地进程内 |
| `packages/agent/gui`（TS） | Agent 会话、composer、审批、时间线 | 本地渲染层 |
| `apps/cli`（Go） | 命令行入口，经 daemon 客户端通信 | 工作 PC 本地 |
| App 中心（AI Canvas/设计/文档/PPT） | 人与 Agent 共用的产出工具 | 本地工作区 |
| 底层 Provider CLI（Claude Code/Codex/Hermes） | 实际模型推理与代码操作 | 本地进程 + 其云端模型 API |
| SQLite `~/.tutti/tuttid.db` | 会话/任务/文件引用/工作状态持久化 | 工作 PC 本地 |

**核心链路（目标下发与多 Agent 交接，推导）**：用户在 GUI 描述目标 → Tutti 拆解为子任务 → 人 review 并分派给指定 Agent → `packages/agent/host` 经 `ApplicationHost()` 创建 session/turn/goal，`tuttid` 适配层将 HTTP/composer/transport 委派给 Host → 拉起底层 Provider CLI 执行 → 产物（含 App 输出）落共享工作区、写入本地 SQLite → 其他 Agent 用 `@`/`+` 直接引用，无需人工搬运 → Control Center 汇聚待审批/运行态、审计留痕。跨边界点：渲染层 ↔ tuttid（HTTP/query）、tuttid ↔ SQLite、Host ↔ Provider CLI、CLI ↔ daemon。

### 主要依赖

- **本地运行时硬依赖**：macOS（当前）；桌面应用自带守护进程。开发/构建需 Node.js 24+、pnpm 10.11.0、Go 1.24、golangci-lint v2.12.0。
- **Provider 依赖**：至少一个已装并认证的 Agent 订阅（Claude Code / Codex / Hermes）或使用内置 Tutti Agent——Tutti 复用订阅、不含独立模型。
- **技术栈**：TypeScript + Go 混合 monorepo；Electron（桌面）、Go（daemon/CLI）、pnpm + go.work、Oxlint/Oxfmt、tsgo、changesets。
- **无云端平台依赖（开源版）**：不绑定任何云 DB/对象存储；Tutti · VM 才引入云端 Room（未发布）。

### 接口形态

- **GUI**：Electron 桌面应用为主入口，纯图形、无命令行；Control Center 统一视图。
- **守护进程 HTTP/query API**：`services/tuttid`，契约由 `services/tuttid/api/openapi/tuttid.v1.yaml` 定义（改契约须先改该文件）。
- **CLI**：`apps/cli`（Go `tutti`），经 `internal/daemon` 客户端连接 daemon。
- **App 中心**：工作区内 App 调用（`@`/`+` 引用），支持官方/社区/自建。
- **Agent Host 契约**：`packages/agent/host` 对外暴露 session/turn/goal/op 生命周期 API，消费者只能面向 Host 契约编程。

### 持久化方式

- **本地为主**：守护进程 durable local state 落 SQLite——prod `~/.tutti/tuttid.db`、dev `~/.tutti-dev/tuttid.db`；会话、任务、文件引用、App 产物引用、工作状态均在本地。
- **无外置/云 DB（开源版）**：不用 Postgres/MySQL/Redis 或云数据面。
- **STATELESS 约束**：Agent Host 边界要求生命周期语义集中于 Host，适配层不得私存编排状态（`check:agent-host-boundary` lint 保障）。
- **VM 版差异**：Tutti · VM 才把工作状态实时搬到云端 Room（未发布，闭源）。

### 通信方式

- **渲染层 ↔ daemon**：本地 HTTP/query（OpenAPI 契约）。
- **CLI ↔ daemon**：本地 daemon 客户端调用。
- **Agent 协作**：进程内经 Agent Host 编排 + 共享工作区 `@`/`+` 引用（同机共享上下文），非跨网络消息总线。
- **模型通信**：由各底层 Provider CLI 自行对接其云端模型 API（本地进程发起）。
- **VM 版（未发布）**：多层虚拟化 + 云端 Room 实时同步（跨设备/多人）。

### 部署形态

#### 工作机安装（Windows / macOS）

- **macOS（完整）**：官网/Release 下载 `Tutti · Local`，`v0.2.8` 提供 `arm64 / x64 / universal` 三档 `.dmg`/`.zip` + `latest-mac.yml`（自动更新）+ `SHA256SUMS.txt`（校验）。桌面应用内置 `tuttid` 守护进程。
- **Windows（未就绪）**：README 明确「Windows support is coming soon」——**Windows 工作机落地缺口，标注为未支持**。
- **无 Linux 桌面包**：Release 仅 macOS 资产。
- **依赖与权限**：需连接已有 Agent 订阅或用内置 Tutti Agent；开发自建需 Node 24+/pnpm/Go 工具链。
- **签名/卸载**：DMG 分发含 SHA256 校验与自动更新清单；针对 Windows 的签名/安装细节因未发布而缺失——未决。

#### 主体功能运行位置

- **本地**：Agent 执行、桌面 GUI、守护进程、SQLite 状态、App 中心产出、工作目录/代码库。
- **云端**：仅模型推理由 Provider CLI 外流其云端 API（Provider 固有）；开源版无自有云端协调面。
- **判断**：属**纯本地形态（开源版）**，工作状态留本地，是**强 Local 优先适配**；唯一固有 Local 缺陷为模型推理外流（同 Maestro）。

#### 云端形态（Tutti · VM，未发布/闭源）

- **职责（据官方文案）**：多层虚拟化把本地 Agent 虚拟为实时共享云端 Room，工作状态（讨论/运行/产物）实时驻云，支持跨设备、多人多 Agent 协作、`@` 队友资源、localhost 免部署预览。
- **边界**：共享严格限定在 Room 内，Room 外一切私有。
- **状态**：coming soon、需 waitlist、闭源、未在开源仓库体现——**云端路线在途，暂不构成当前开源版的 Local 缺陷，但多人/跨设备场景不可评**。

## 未决项与证据边界

- **Windows 支持**：官方标注 coming soon，无二进制与安装/签名细节——未决，构成 Windows 工作机落地缺口。
- **Tutti · VM**：闭源未发布，架构/数据边界/隐私仅据文案，未做实证——不可评。
- **内置 Tutti Agent 计费**：EA 免费、后续「可能按量计费」，长期成本模型未定——未决。
- **守护进程内部编排/领单细节**：由 AGENTS.md 的 Agent Host 边界与 OpenAPI 契约推导，未做运行时抓包验证。
- **社区反馈**：据 changeset/目录归纳主题，未逐条核实 issue，样本边界为 2026-07-31 快照。
- **模型推理边界**：由底层 Provider CLI 决定（多为云端模型 API），未逐一验证；此为 Provider 固有属性。

## 后续验证建议

- 若进入选型深评：在 macOS 实测「下载 → 连接 Provider 订阅 → 描述目标 → 任务拆解 → 多 Agent 交接（Big @ / +）→ App 调用 → Control Center 审批」端到端闭环，验证本地编排与共享工作区推导。
- 跟踪 Windows 版发布时间与安装/签名形态，评估其对 Windows 工作机的适配完整度。
- 评估 `packages/agent/host` 的 Agent Host 契约与 `tuttid` OpenAPI，判断其对接自有调度/治理系统的可扩展性与二次开发成本。
- 待 Tutti · VM 发布后，专项评估其云端 Room 的数据边界、私有化可行性与多人/跨设备协作对 Local 优先的影响。
- 对照 Index 的中心调度关注点，评估「本地进程内集中编排 + 目标拆解 + 人审分派」范式在无中心特权服务前提下的多节点/隔离/治理适配缺口。
