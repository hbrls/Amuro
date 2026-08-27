# TaskTrove 技术产品调研

> updated_by: Qoder - Claude-Sonnet
> updated_at: 2026-08-10 16:25:00
> evidence_window: 2026-08-10；目标版本 v0.12.4（2026-01-09 发布，此后 main 无提交）；分支 `main`；运行时 Node.js + Next.js + JSON 文件存储

## 交付结论

### TaskTrove 是单用户 Todo 管理器，不是 Stateful 任务调度器

已确认：TaskTrove 的核心持久对象是 Task、Project、Label、ProjectGroup、LabelGroup、Settings、User，全部存于**单个 JSON 数据文件**（[data-file.ts](https://github.com/dohsimpson/TaskTrove/blob/main/packages/types/src/data-file.ts) 的 `DataFileSchema` 对应 `tasks.json`）。它是单用户设计（`DataFileSchema` 含单个 `user` 字段），没有 Agent、Worker、Run、执行归属、任务队列、抢占、失败转移等任何调度概念。

架构判断：TaskTrove 持久拥有任务对象，但**没有任务间依赖**（[core.ts](https://github.com/dohsimpson/TaskTrove/blob/main/packages/types/src/core.ts) 的 TaskSchema 无 depend/block/predecessor 字段）、**没有多态状态机**（仅 `completed` 布尔 + `completedAt`）、**没有执行者分派**。它不满足本专项"依据依赖/状态/策略持续推进任务并选择执行者"的 Stateful 调度判定基准，应归类为**单用户 Todo 管理工具**。

在本批四个产品中，TaskTrove 的任务模型最简单：Wekan 有卡片依赖与规则自动化，tududi 有 7 态状态机与独立子任务，4ga Boards 有实时协作，而 TaskTrove 仅提供完成二态、内嵌子任务清单与 RRULE 重复，无任何自动化或依赖机制。

### Task 仅完成/未完成二态，子任务为内嵌清单，重复用 RRULE，无依赖无状态机

已确认：[TaskSchema](https://github.com/dohsimpson/TaskTrove/blob/main/packages/types/src/core.ts) 的关键字段为 `completed`（布尔）、`completedAt`、`priority`（1–4，1 最高）、`dueDate`/`dueTime`、`projectId`、`labels`（数组）、`subtasks`（SubtaskSchema 数组）、`recurring`（string，经 `validateRRule` 校验）、`recurringMode`（dueDate/completedAt）。

子任务是**内嵌在 Task 内的清单项**（SubtaskSchema：id/title/completed/order），不是独立任务对象，无自身状态或归属。重复任务采用 iCalendar RRULE 标准，`recurringMode` 决定按到期日还是完成日计算下次。

关键判定：没有任务间前置依赖、阻塞、并行分支或 DAG；没有任务生命周期状态机（只有完成与否）；子任务仅是勾选清单。状态推进完全由用户手动驱动，重复任务到期由系统按 RRULE 生成新到期项。没有"前置完成后自动解锁下游"的可执行性判定。

### 无任何自动化、依赖或后台调度，仅有 RRULE 重复计算

已确认：仓库 `packages/scheduler` 仅含一个 `index.ts`，结合 types 包的 `rrule.test.ts` 与 `validateRRule`，其职责是**按 RRULE 计算重复任务的下次到期时间**，属于日期计算工具，不是任务调度器。全仓扫描未发现任务依赖、自动化规则、触发器、任务队列或执行分派逻辑。

架构判断：TaskTrove 的"自动化"止于重复任务的到期计算。没有事件驱动自动化、没有定时任务推进（除重复实例）、没有执行归属或失败恢复。它是本批产品中最纯粹的"手动 Todo 列表"。

### Next.js 全栈 + JSON 文件存储，单容器自托管，无原生桌面应用

已确认：TaskTrove 是 pnpm monorepo（turbo），唯一应用为 [apps/web](https://github.com/dohsimpson/TaskTrove/tree/main/apps/web)（Next.js，含 `next.config.mjs`、`app/`、`auth.ts`、`proxy.ts`、Dockerfile）。部署为单容器（[selfhost/docker-compose.yml](https://github.com/dohsimpson/TaskTrove/blob/main/selfhost/docker-compose.yml)：镜像 `ghcr.io/dohsimpson/tasktrove:latest`，端口 3000，卷 `./data:/app/data`，可选 `AUTH_SECRET`）。

存储为 **JSON 数据文件**（`/app/data` 下的 tasks.json），非数据库。客户端为浏览器（响应式 Web），官网与仓库未提供 Windows/macOS/Linux 原生桌面应用。

Local 优先判断：架构高度适配——单容器 + JSON 文件，数据完全留在本地，无云端强依赖，部署极简。选型缺陷是：无原生桌面应用（仅 Web/PWA 形态），且单用户设计不支持多人协作。

### Sustainable Use License 非 OSI 开源，含 Pro 分层，商用私有化受限

已确认：[LICENSE.md](https://github.com/dohsimpson/TaskTrove/blob/main/LICENSE.md) 为 **Sustainable Use License v1.0**（fair-code，非 OSI 批准的开源许可证，故 GitHub 标注 NOASSERTION）。其允许内部业务/非商业/个人使用、修改、免费非商业分发；**禁止商业分发或付费提供**。含 `.pro.` 文件/目录需单独 Pro License（LICENSE_PRO.md）。

当前 `main` 分支经全仓扫描**无任何 `.pro.` 文件或目录**（计数为 0），即社区版源码完整可见，Pro 功能不在公开仓库。

架构判断：这是 fair-code 模式（类似 n8n）。对"个人/内部自托管使用与修改"无实质障碍，但**对商业性私有化改造、再分发或作为商业产品组件集成构成明确法律约束**。这与前三个产品（Wekan/4ga Boards/tududi 均为 MIT）形成关键差异，是 Local 优先之外的独立选型风险点。

### JSON 文件是唯一持久化，无数据库、无消息队列，部署极简但扩展受限

已确认：TaskTrove 仅依赖 JSON 文件存储（tasks.json），单容器即可运行，无需 PostgreSQL/SQLite/Redis/Kafka 等任何外部服务。无独立后端进程（Next.js 全栈）。

架构判断：这是极致的 Local 优先/低运维部署，但 JSON 文件存储意味着：无并发写保护（单用户假设）、无查询索引、无事务、数据量大时性能受限。它本非调度器，无需分布式一致性；但若想在其上扩展协作或调度，文件存储是明显瓶颈。

## 调研目标

- 判断 TaskTrove 是否持久拥有工作对象、执行归属和可恢复的 Stateful 调度状态
- 明确 Task、Project、Label、子任务、重复任务的实际对象模型及生命周期
- 核验是否存在任务依赖、自动化、定时推进或执行分派机制
- 分别评估 Windows、macOS 工作机接入及本地、云端运行形态
- 识别许可证约束、核心依赖、标准接入面和私有化改造范围

## 产品定位与核心流程

### 定位与用户

TaskTrove 是"modern Todo Manager, fully self-hostable"，定位个人任务管理，强调现代化 UI 与自托管隐私。面向个人用户组织任务、项目、标签，提供优先级、到期、重复、子任务清单、日历/通知/语音命令等。单用户设计，无协作。

### 端到端流程

1. 用户经 Web 登录（AUTH_SECRET 保护会话），创建 Project/Label 组织任务。
2. 创建 Task，设优先级（1–4）、到期日/时间、标签、子任务清单、RRULE 重复。
3. 按视图（今天/逾期/自定义过滤）查看与勾选完成；重复任务到期按 RRULE 生成新到期项。
4. 数据全部写入本地 JSON 文件（tasks.json），含版本号与 edition 标记。

## 工作对象与调度模型

### Task、Project、Label、子任务、重复任务映射

| 对象 | 结论 | 持久化与归属 | 调度影响 |
| --- | --- | --- | --- |
| Task | 一等持久工作对象 | JSON 文件（tasks.json），单 user | 完成二态 + 优先级，无执行归属/依赖/状态机 |
| Subtask | 内嵌清单项（非独立对象） | Task 内 SubtaskSchema 数组 | 勾选清单，无独立状态/归属 |
| Recurring Task | RRULE 字符串 + recurringMode | Task 的 `recurring` 字段 | 到期计算生成新到期项，非依赖调度 |
| Project / Label | 持久组织对象 | JSON 文件；含 Group 分组 | 组织边界，非调度对象 |
| 任务依赖 / 状态机 / Agent / Run / 队列 | 当前证据未发现 | 无对应字段/模型 | 不构成调度对象模型 |

### 任务关系、可执行性与状态所有者

TaskTrove 的"状态"是 `completed` 布尔 + 优先级 + 到期日。没有任务生命周期状态机，没有"谁把任务从等待推进到可执行"的调度角色。任务间只有"Task ⊃ 内嵌子任务"的包含关系，没有任务间前置依赖、阻塞或 DAG。状态推进完全由用户手动驱动；重复任务由系统按 RRULE 计算下次到期。无多执行者分派或抢占（单用户）。

### 自动化与定时机制

仅有 RRULE 重复的到期计算（scheduler/types 包）。无事件驱动自动化、无规则引擎、无后台 cron 任务推进、无执行分派。通知（notifications.ts）与语音命令（voice-commands.ts）是交互增强，与调度无关。

## 技术架构

### 系统全貌

```text
Browser / PWA (Next.js React 前端)
      | HTTPS (Next.js Route Handlers / Server Actions)
      v
Next.js Server (Node.js, 全栈, auth.ts 会话)
      | 读写
      v
JSON 数据文件 (/app/data/tasks.json, DataFileSchema)
```

单容器形态下全部组件位于一个 Next.js 进程；无独立数据库、无后台 worker、无消息队列。

### 持久化与并发

所有对象持久化于单个 JSON 文件（tasks.json），含 schema 版本号。无数据库、无 Redis/Kafka、无任务队列。并发模型为单用户假设下的整文件读写，无多写冲突保护。这决定了它不适合多人或高并发扩展。

### 接口与鉴权

| 边界 | 主要接口 | 鉴权/约束 |
| --- | --- | --- |
| Browser ↔ Server | HTTPS（Next.js 页面 + Route Handlers） | 会话（AUTH_SECRET）；`proxy.ts` 处理代理 |
| 数据层 | JSON 文件读写 | 文件系统卷 `/app/data` |

当前证据未发现独立的公开 REST/GraphQL API 文档或 webhook 体系；集成面主要是 Next.js 内部数据流。voice-commands、calendar、notifications 为前端/本地能力。

### 数据边界

自托管实例全部数据存于本地 JSON 文件，无强制云端回传。单用户，无协作数据。官方是否提供托管云服务，当前证据未发现明确入口（官网 tasktrove.io 以自托管为主）。断网不影响本地实例核心流程。

## 部署与工作机支持

### macOS

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .app/.dmg。Docker 单容器或源码（Node.js + pnpm） |
| 运行入口 | `docker compose -f selfhost/docker-compose.yml up -d`，浏览器访问 `http://localhost:3000` |
| 依赖 | Docker Desktop；或 Node.js + pnpm（turbo monorepo 源码） |
| 权限 | 容器内运行，卷挂 `./data`；可选 AUTH_SECRET |
| 网络 | 局域网自托管可离线；公网需自行配 TLS/反向代理 |
| 升级 | 拉新镜像重启；注意 JSON 数据文件的 schema 版本迁移 |
| 卸载 | 官方未提供一键卸载；删容器与 data 目录为合理推导，数据保留由用户决定 |

macOS 无原生桌面应用，只能作浏览器端或本地跑 Docker/源码。

### Windows

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .exe 安装器。Docker Desktop 单容器或源码（Node.js + pnpm） |
| 运行入口 | 同 macOS：`docker compose up -d` 后浏览器访问；或 WSL/源码 |
| 依赖 | Docker Desktop（Windows）；或 Node.js + pnpm |
| 权限 | 容器内运行；源码视 Node 环境而定 |
| 网络 | 局域网自托管可离线；公网需自行配 TLS |
| 升级 | 同 macOS，拉新镜像 |
| 卸载 | 无官方卸载流程；删容器/卷/源码目录 |

Windows 同样无原生桌面应用，依赖 Docker Desktop 或 WSL/源码。

### 自托管服务器与许可证约束

生产为单容器（JSON 文件内嵌），资源占用极低。可选 `docker-compose-pro.yml`（Pro 版，需 Pro License）。**许可证约束**：Sustainable Use License 允许内部/个人/非商业自托管与修改，禁止商业分发或付费提供；Pro 功能需单独商业许可。这是私有化商用场景的明确法律边界。

## 接入与改造边界

### 最小接入路径

1. 当前证据未发现成熟公开 API/webhook；接入主要依赖直接读取 JSON 数据文件（tasks.json，有 DataFileSchema 与 serialization 层）或自建 Next.js Route Handler。
2. 若要把 TaskTrove 当"工作对象来源"接入外部调度：外部系统可解析 tasks.json（Zod schema 公开）读取 Task/Project/Label，自行维护任务依赖与执行归属；TaskTrove 本身不提供依赖或调度状态。

### 私有化与依赖剥离

| 组件 | 性质 | 改造判断 |
| --- | --- | --- |
| JSON 文件存储 | 核心嵌入式依赖 | 全部对象持久化；单用户假设，换库需重写数据层 |
| Next.js 全栈 | 核心运行时 | 前后端一体，无独立后端可剥离 |
| RRULE scheduler | 日期计算工具 | 重复任务到期计算，非调度一致性组件 |
| 通知/语音/日历 | 前端增强 | 可关，不影响核心任务管理 |

TaskTrove 没有"调度最小核心职责"可剥离——它本就不含执行调度中心。若目标是 Stateful 调度，TaskTrove 只能作为工作对象（任务）的来源，任务依赖、执行归属、失败恢复都需外部系统另行实现。**且 Sustainable Use License 禁止商业性再分发，商用私有化改造需先解决许可。**

### 扩展约束

JSON 文件存储与单用户设计是根本扩展约束：无并发写保护、无查询索引、无协作模型。若需多人协作或任务调度，需先替换数据层（引入数据库）并重建权限/协作模型，改造面大。其 fair-code 许可证进一步限制商业扩展路径。

## 维护状态、开源与公开反馈

仓库主分支 `main`，主语言 TypeScript，2025 年 7 月创建（很新）。截至 2026-08-10：1095 stars、24 forks、33 open issues。**最新 Release v0.12.4 与最近一次提交均为 2026-01-09，此后约 7 个月无更新**，维护活跃度明显下降（对比 tududi 当日活跃、Wekan 当日发布）。版本仍处 0.x（未达 1.0）。

许可证为 Sustainable Use License（fair-code，非 OSI 开源），含 Pro 分层（当前 main 无 .pro 文件）。公开反馈样本较少（33 open issues），个案不代表整体。维护停滞与许可证约束是除技术形态外的两个独立选型风险点。

## 未决项与证据边界

- 本次未实际部署或运行 TaskTrove；重复任务到期计算、会话鉴权、JSON 读写行为来自官方文档与定点源码证据，未在目标环境复现。
- "无任务依赖/状态机/执行分派"是基于 TaskSchema 与全仓扫描的"未发现"，非对未来版本的永久否定。
- 官方未提供 Windows/macOS 原生应用与一键卸载说明；PWA 长期体验未决。
- 是否存在官方托管云服务、Pro 版功能清单与定价、LICENSE_PRO.md 具体条款，当前证据未发现，未决。
- 公开 REST/GraphQL API 或 webhook 能力未确认；集成面可能仅限 JSON 文件与内部数据流。
- JSON 文件存储在数据量增长下的性能与损坏恢复边界未验证。
- 项目自 2026-01-09 后停滞，是否仍活跃维护、roadmap 是否延续，未决。

## 后续验证建议

1. 在干净 macOS 与 Windows（Docker Desktop）环境各执行一次单容器部署、数据备份与升级，记录 JSON 数据文件的 schema 迁移与保留行为。
2. 核实许可证边界：确认 Sustainable Use License 对目标使用场景（尤其商用私有化）的约束，并查明 Pro 版功能与 LICENSE_PRO.md 条款，再决定是否纳入选型。
3. 若拟以 TaskTrove 为工作对象来源，验证 tasks.json 的解析稳定性（DataFileSchema/serialization）与外部系统读取任务的可行性，自行设计任务依赖与执行归属映射。
4. 若需依赖驱动编排、多人协作或执行分派，明确 TaskTrove 无原生能力且单用户/文件存储是根本约束，须外部系统整体重建，不建议在其上改造。
5. 鉴于维护停滞，评估 fork 自维护的成本与许可证允许范围，或优先考虑活跃维护的替代方案（本报告不做竞品比较，仅提示维护风险）。
