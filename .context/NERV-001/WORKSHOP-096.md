# OpenHarness 技术产品调研

> updated_by: Qoder
> updated_at: 2026-10-24
> evidence_window: 2026-10-24；HKUDS/OpenHarness main@9b2efd795c6aa09f88b0c257d269a9e518da6ae7（2026-06-04）；最近正式 Release v0.1.9（2026-05-07）；公开反馈截至调研日

## 交付结论

### OpenHarness 是本地执行宿主，附带有持久状态的仓库自动化原型，但不满足完整 Stateful 调度中心的判定条件

**已确认**：必须区分三层能力。普通 Background Task 创建后立即启动本机进程；Cron 持久保存定时任务并周期触发；Repo Autopilot 则真正持久化工作卡、来源、优先级、执行阶段和验证结果，并选择下一张卡执行。不能把整个产品简单称为“完全无状态”，也不能因为 Task、Cron 或团队文件存在，就认定它拥有可恢复的中心调度能力。[后台任务入口](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/tasks/manager.py#L49-L112)、[Cron 注册表](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/services/cron.py#L73-L90)、[Autopilot 选卡与状态更新](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L265-L365)。

**架构判断**：整体归类为“Agent 执行宿主 + 单仓库、有持久状态的自动化运行器”。Autopilot 已超出仅承接外部 Task 的消费者，但缺少任务依赖解释、持久执行者租约、原子领取及故障恢复闭环，尚不能作为本议题所找的 Stateful 调度中心。

**选型影响**：值得研究的是其“工作摄取 → 优先级 → 执行 → 验证 → 修复 → 人工关口”模式，而非把现成 CLI 包装成一个服务后就视为调度核心。

### 持久保存工作卡不等于可恢复执行：异常退出可能让 Autopilot 后续 tick 持续跳过

**已确认**：`run_card` 拒绝执行已经处于 preparing、running、verifying、waiting_ci、repairing 的卡；`tick` 发现任何上述活跃状态就跳过执行；`run_next` 只选择 queued。普通后台任务管理器及 Agent→进程映射则从空内存集合初始化。[活跃状态守卫](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L627-L656)、[tick](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L1152-L1172)、[进程映射](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/swarm/subprocess_backend.py#L28-L41)。

**合理推导，未做故障注入**：进程在写入活跃状态后异常退出，文件仍在，但现有自动入口不会据租约超时把它重新排队，反而可能阻塞整个仓库下一次自动推进。会话恢复、保存团队成员、保存任务输出，都不能替代这一恢复机制。

**改造影响**：补齐恢复责任方、执行归属、可重新领取的状态迁移与外部副作用去重，属于调度内核建设，不是简单加重试参数。

### 本地核心不要求云端控制服务，但远程模型、聊天渠道和 GitHub 工作闭环各有独立云端边界

**已确认**：`oh` 是本地 Python CLI，可带终端 TUI；`ohmo` 在用户机器运行个人工作区与消息网关。官方文档提供 OpenAI 兼容的本地模型端点配置，不要求购买 OpenHarness 自身 SaaS 账号。已查的官方入口、包和运行链路未发现必须连接的 OpenHarness 托管控制平面。[官方使用与 Provider 文档](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/README.md)。

**Local 优先判断**：本地 CLI 的设计方向符合 Local 优先；完全离线仍取决于模型、工具及其依赖是否均在本地，不能把“使用本地订阅凭证”误写为“模型在本地”。聊天平台收发、GitHub Issue/PR/CI 工作闭环仍需联网。

**选型缺陷**：Autopilot 在 Git 仓库执行路径中会进入提交、推送、创建 PR 和等待远程检查，不能仅切换本地模型就得到完整离线的仓库治理闭环。[GitHub 推进链路](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L891-L1008)。

### Windows 与 macOS 都有官方原生 CLI 安装入口，但不能据此宣称无人值守调度链路已双平台验证

**已确认**：README 分别提供 Windows PowerShell 和 macOS shell 安装入口；Windows PowerShell 要使用 `openh`，避免 `oh` 与 `Out-Host` 别名冲突。终端 UI 不是独立桌面安装包；后台网关与 Cron 也不是一个已证明完整的中心调度服务。[安装文档](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/README.md)、[v0.1.8 平台修复说明](https://github.com/HKUDS/OpenHarness/releases/tag/v0.1.8)。

**已确认限制**：Autopilot 默认验证命令包含 POSIX shell 表达式，默认安装的 Cron 命令仍写作 `oh ...`；这些与 Windows 原生入口及 shell 差异共同构成验证点。不能由“Python 支持 Windows”外推整条自动运行、验证和恢复链路均已可用。[默认验证策略](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L90-L108)、[默认定时命令](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L1174-L1193)。

### 无外置数据库降低了单机安装成本，却没有消除调度一致性和治理成本

**已确认**：核心状态使用本地 JSON、JSONL、Markdown 和 YAML。Autopilot registry 的原子文件替换保障单次文件写入，并不把“选卡—占有—状态更新”组成一个原子事务；其公开选卡与更新路径没有执行者租约。[存储实现](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L1901-L1933)、[选卡与更新](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L334-L365)。

**改造影响**：普通工具可通过 CLI/headless 调用现成执行能力；要让多台工作机认领中心任务，仍需新建稳定接入协议、身份与权限、原子领取、租约及恢复机制。现有本机子进程接口不等于跨机器工作池。

**治理边界**：Autopilot 默认执行权限为 `full_auto`，内置 permission prompt 回调直接同意；人工合并关口不等同于逐个工具的人为批准。worktree 是工作副本/分支隔离，不是 OS 权限沙箱。私有化不能只搬运文件，还必须明确本机代码执行与 GitHub 写权限由谁授权。[默认策略](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L53-L113)、[Agent 执行入口](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L2041-L2079)。

## 调研目标

- 判断是否持久拥有工作对象、任务关系、生命周期与执行归属。
- 说明任务摄取、分派、持续推进、失败恢复及人工介入方式。
- 核验 Windows 与 macOS 的安装、接入和完整运行形态。
- 判断 Local 优先适配、云端依赖及数据与权限边界。
- 识别最小依赖、架构范式及私有化和调度改造边界。

## 产品调研

### 产品定位与目标用户

**已确认**：OpenHarness 是 MIT 许可、面向研究者和开发者的可扩展 Agent 运行基础设施；随包提供的 ohmo 是个人助理应用，不是另一套独立产品。其主要用途是本机代码与文件工作、脚本式自动化、技能/工具扩展，以及由聊天渠道触发个人助理。源码许可不代表外部模型、聊天平台和代码托管服务也开源。[许可证](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/LICENSE)、[官方场景说明](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/docs/SHOWCASE.md)。

**产品边界判断**：它不是已有组织租户、工作机资产管理和跨项目资源分配能力的调度 SaaS。当前证据中的完整性主要体现在单机 Agent 执行与单仓库自动化，而非组织工作运营平台。

### 核心流程

1. **人直接交给 Agent 工作**：安装 → `oh setup` 配置模型与凭证 → 在工作目录运行 `oh`，或以 `oh -p ... --output-format json|stream-json` 发起一次工作 → 本地运行工具 → 返回结果并保存会话。这是执行宿主流程。[README](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/README.md)。
2. **聊天事件带来工作**：`ohmo init` 创建个人工作区 → 配置模型与聊天渠道 → 启动 gateway → 接收被允许的消息 → 本地 Agent 处理 → 向原渠道回复。聊天的到达不是仓库工作卡自动完成持久化、依赖判断和领取的证据。
3. **仓库环境产生工作**：手工添加卡或扫描 GitHub Issue/PR → 本地 Autopilot 摄取、去重、评分 → `tick` 在没有活跃卡时选择 queued 卡 → 在 worktree 执行 → 本地验证、必要时修复 → 推送分支及 PR → 轮询 CI → 等待人工或满足条件后合并。周期触发可来自本地 Cron，也可来自仓库自带的 GitHub Actions 工作流。[CLI](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/cli.py#L1065-L1219)、[Autopilot 执行](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L627-L801)。

以上是文档与源码确认的设计链路，不是本次运行成功记录。

### 功能地图与边界

| 能力域 | 当前证据确认的能力 | 不应外推的能力 |
| --- | --- | --- |
| 本机执行 | 模型循环、文件与 shell 工具、CLI、终端 TUI | 完整桌面应用、远程工作机管理 |
| 连续上下文 | 会话快照、记忆、压缩后的上下文恢复 | 任意外部进程恢复、调度租约恢复 |
| 多 Agent | 本机子进程/进程内执行、团队成员资料、消息投递 | 分布式 Agent 池与中心抢单 |
| Background Task | 立即启动并查看、更新进度、停止进程 | 持久依赖 DAG、等待队列与断点接管 |
| Cron | 持久计划时间、重复触发、执行历史 | 持久执行租约与多节点防重 |
| Repo Autopilot | 仓库工作卡、评分、阶段推进、验证与修复、PR 衔接 | 通用组织任务模型、崩溃自动恢复 |
| 扩展 | 本地技能、插件、工具、MCP 客户端 | 一个供第三方工作机领取任务的标准调度协议 |

对应边界以[官方能力说明](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/README.md)、[Task 模型](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/tasks/types.py#L10-L32)、[Autopilot 模型](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/types.py#L9-L66)为依据；“未确认”不表示已经审计并证明全仓库不存在。

### 维护状态与版本演进

**已确认快照**：默认分支 main 最新提交为 2026-06-04 的 `9b2efd7`；调研时最近正式 Release 是 2026-05-07 的 v0.1.9。仓库未归档，但截至 2026-10-24 已数月没有主干推进；10 月仍有公开提交请求。应表述为“社区仍有输入，最近正式发布与主干整合滞后”，而不是根据热度断言持续维护或已经废弃。[主干提交](https://github.com/HKUDS/OpenHarness/commit/9b2efd795c6aa09f88b0c257d269a9e518da6ae7)、[v0.1.9](https://github.com/HKUDS/OpenHarness/releases/tag/v0.1.9)、[10 月待合并请求](https://github.com/HKUDS/OpenHarness/pull/368)。

与本次判断有关的变化：

- [v0.1.6（2026-04-10）](https://github.com/HKUDS/OpenHarness/releases/tag/v0.1.6)：子进程队友、团队持久资料、会话压缩、ohmo、Cron daemon。其“连续运行多天”是维护者发布说明，不证明崩溃后的任务恢复。
- [v0.1.7（2026-04-18）](https://github.com/HKUDS/OpenHarness/releases/tag/v0.1.7)：调整安装 PATH 行为、Windows 原生安装及共享状态写入等改进，影响工作机部署。
- [v0.1.8（2026-05-06）](https://github.com/HKUDS/OpenHarness/releases/tag/v0.1.8)：Windows 子进程和网关生命周期、远程渠道权限、MCP 启动隔离等修复，说明部署和接入仍在稳定化。
- [v0.1.9（2026-05-07）](https://github.com/HKUDS/OpenHarness/releases/tag/v0.1.9)：技能调用及 Provider API key 更新。不能把此后 main 的所有行为自动归入这一发行包。

**未合并能力**：2026-09-08 提交的 `/goal` 持久目标与跨重启恢复提案在调研时仍 open、`merged_at=null`，不计入当前主干能力。[PR #358](https://github.com/HKUDS/OpenHarness/pull/358)。

### 生态与反馈

扩展入口包括技能、插件、MCP 客户端和自定义 Python 工具；这些是执行能力扩展点，并非现成远程 Worker 协议。[官方扩展说明](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/README.md)。

本次抽样查看最近更新的公开 Issue/PR 列表，再选取影响接入与连续性的条目读取正文：

- **并发约束反馈，未独立验证**：2026-10-12 的 [Issue #365](https://github.com/HKUDS/OpenHarness/issues/365)反映并行队友的并发上限与 Provider 限额问题。单个、无评论的反馈不能支持普遍性能结论，但提示部署时要明确模型服务的并发预算；本报告不采用其成本或加速倍数断言。
- **完成通知与依赖漂移反馈，未合并**：[PR #368](https://github.com/HKUDS/OpenHarness/pull/368)于 2026-10-22 报告停止任务可能重复通知完成，并报告其 Windows 测试环境出现 MCP 2.3.0 兼容问题。这里引用的是提交者报告，不是本次复现，也不把拟议修复计入 main。
- **自治能力期待**：[PR #358](https://github.com/HKUDS/OpenHarness/pull/358)显示有人尝试补充目标持续推进与恢复，但不能据开放提案给当前产品加分。

## 技术架构调研

### 系统全貌与运行形态

```text
工作 PC / 自托管执行主机
  ├─ oh CLI / 终端 TUI ──> 本地 Runtime / 模型循环 ──> 本机工具、MCP
  │                              └─> 本机 Agent 子进程
  ├─ ohmo gateway ────────────────> 本地 Runtime / 会话
  ├─ Cron daemon ──> 到期 shell / Agent / autopilot tick
  └─ Repo Autopilot
       ├─ registry / journal / policies / run reports（仓库本地文件）
       ├─ 选卡、worktree、验证、修复
       └─ Git / gh ──> Issue、分支、PR、CI、合并

外部网络边界（按选用功能出现）
  ├─ 模型 API 或订阅认证后端；也可改成本机兼容模型服务
  ├─ 聊天平台消息服务
  └─ GitHub 仓库与 Actions 控制面
       └─ 自带 workflow 指向 self-hosted runner，不是 GitHub 托管执行机
```

**架构推导**：调度策略与执行运行时在本机 Python 代码中；没有必须独立部署的 OpenHarness 中心后端。多个入口可共同使用本地文件，但这不自动构成一致的中心状态服务。[CLI 注册](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/cli.py#L772-L781)、[执行时构造 Runtime](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L2041-L2079)、[self-hosted 工作流](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/.github/workflows/autopilot-run-next.yml#L1-L41)。

### Workspace、Project、Issue、Plan、Task：哪些对象真正参与调度

| 对象 | 标识、归属与持久化事实 | 调度语义及缺失影响 |
| --- | --- | --- |
| Workspace | ohmo 的个人目录；普通 oh 使用 cwd | 文件、会话及配置容器，不是组织级任务空间或资源池 |
| Project | cwd 对应的仓库目录；`.openharness/autopilot/` 保存该目录的状态 | 有单仓归属，未确认独立 Project ID、跨仓库对象关系与统一调度 |
| Issue | GitHub 拥有原始 Issue；扫描复制标题、正文、标签与 `issue:N` 来源到卡片；另有项目 Issue 上下文文件 | 外部工作来源，不是本产品完整拥有的 Issue 生命周期；关联到 PR 不等于 Task 依赖 |
| Plan | 文档中的计划模式、提示内容和会话产物 | 未确认可持久解释、可按依赖推进的独立编排对象；计划文本不计为 DAG |
| Background Task | 带 ID、cwd、命令/提示、状态和进度的内存 TaskRecord；输出文件落盘 | 创建即执行；无模型字段或选取逻辑支撑父子依赖、阻塞解除、优先级或资源调度 |
| Autopilot 工作卡 | `ap-*` ID、来源指纹、状态、score、metadata，保存在仓库 registry | 真正的持久工作记录；可关联 Issue、PR、worktree、attempt，但没有被选卡逻辑解释的 Task→Task 依赖 |
| Team / Agent | 团队名称、leader/session、成员 ID 等保存在 team 文件；运行中的 Agent→task 映射位于进程内 | 团队名册不是持久执行租约；成员恢复不证明工作已被接管 |

证据来自[项目路径定义](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/config/paths.py#L102-L159)、[Issue 摄取](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L502-L573)、[两类 Task 数据模型](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/types.py#L9-L66)、[后台 TaskRecord](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/tasks/types.py#L10-L32)、[团队资料](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/swarm/team_lifecycle.py#L190-L278)。未确认项限于上述产品资料、对象与调度入口，不以全仓库穷举作为依据。

### 主要组件与核心链路

#### 链路一：交互或 headless 请求驱动本地 Agent

用户提示进入 Runtime，模型生成工具调用，本地权限与工具层执行，结果回给模型，最终输出文本或结构化事件。委派队友时，本机 subprocess backend 创建 `--task-worker` 子进程，用 stdin/stdout 传递消息；后台管理器跟踪退出码并通知父执行上下文。[官方 Harness 流程](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/README.md)、[子进程创建与发送](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/swarm/subprocess_backend.py#L47-L138)。

后台任务从创建直接进入 running；退出码为零标记 completed，否则 failed，显式停止标记 killed。完成状态主要表达执行结束，不天然证明业务目标通过验证。`TaskUpdate` 仅改描述、进度及状态说明，不负责依赖解锁。[状态更新](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/tasks/manager.py#L171-L213)、[退出判定](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/tasks/manager.py#L249-L271)。

**连续性边界**：同一个存活管理器给已经结束的 Agent 再写入消息时，可以重启进程，但代码明确记录“原交互上下文未保留”。这不是宿主重启后的持久任务接管。[重启语义](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/tasks/manager.py#L335-L363)。

#### 链路二：定时条件触发工作

Cron 注册表保存 enabled、schedule、next_run 等信息；daemon 每轮重新读文件，将到期任务并发执行，写执行历史并计算下一次时间。tick 间隔常量为 30 秒，但本轮会等待全部任务结束后再等待下一轮，不能理解为严格每 30 秒无阻塞调度。[Cron 时间状态](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/services/cron.py#L73-L137)、[循环](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/services/cron_scheduler.py#L420-L479)。

**已确认**：单次执行默认 300 秒超时，失败/超时记录后重新计算下次周期，不是中心状态驱动的同一次执行重试或转移。[执行超时](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/services/cron_scheduler.py#L312-L365)。

**合理推导**：停机后保留的过期 next_run 可触发一次后续执行，但代码未形成补齐每个错过周期的积压队列。若执行中崩溃、尚未更新 next_run，恢复后也可能再次运行同一个外部副作用。

#### 链路三：Autopilot 的单仓库闭环

- **摄取与优先级**：人工/ohmo 类别输入、GitHub Issue、GitHub PR 及本地候选进入同一 registry；按来源和来源指纹去重，按 score、更新时间和标题选 queued 卡。优先级来自来源、标签和文本线索，不是对工作对象依赖的求解。[摄取](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L265-L338)、[评分](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L1935-L1970)。
- **归属与执行**：调用进程构建本机 Runtime；metadata 保存模型、worktree、分支和 attempt。没有按 Agent 可用性选择远端执行者的路径。[执行准备](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L658-L701)。
- **阶段推进**：典型主线为 queued → preparing → running → verifying → waiting_ci → completed/merged。验证或远程 CI 失败可进入 repairing，默认最多三次尝试；Agent 运行异常会记录 failed 并返回，不等同于统一自动重排。状态名还包括其他值，不能据枚举值推断每种转换都有自动机制。[执行与异常](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L712-L801)、[验证修复](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L818-L911)、[CI 及结束](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L1010-L1149)。
- **完成与人介入**：本地验证通过后还会提交、推送和创建 PR。自动合并取决于模式与标签，普通 completed 可以表示等待人工合并，而不是交付已经入主干。默认配置文件中的人工关口描述，不等于所有行为都有独立强制批准；CI 未报告检查、过了宽限期时也可被视为 success，不能把 completed 一律解释为 CI 已实际执行且通过。[合并判定与 CI 宽限](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L1548-L1593)。
- **上游影响下游**：已核验模型与选卡路径没有父子任务、依赖边、阻塞传播、取消传播或 DAG 分支执行。Issue/PR 关联与一次执行中的阶段顺序不能替代这些能力。

**影响部署的时间约束，合理推导**：默认本地 Cron 300 秒上限短于 Autopilot 默认远程 CI 等待 1800 秒。由 `install-cron` 触发的长流程可能在外层先被终止，结合活跃卡不自动回收，会放大持续推进中断问题。这里没有执行故障实验，不断言所有任务都会发生；足以要求部署前验证这条边界。

### 持久化方式

| 状态 | 存放与所有者 | 重启后的含义 |
| --- | --- | --- |
| Provider 配置、用户配置 | 本地用户配置目录，默认 `~/.openharness/` | 能重新装配运行环境，不是调度中心账户 |
| oh 会话 | 默认 `~/.openharness/data/sessions/`，按工作目录派生目录 | 保存消息和部分工具元数据，可恢复上下文 |
| 后台 Task | TaskRecord、进程及映射在内存；默认 `data/tasks/` 保留输出文件 | 不能据输出文件重新获得活跃进程归属 |
| Cron | 默认 `data/cron_jobs.json`、`cron_history.jsonl` | 计划可重读，运行中的执行租约不持久化 |
| Autopilot | `<repo>/.openharness/autopilot/registry.json`、journal、policies、运行/验证报告 | 卡和阶段保留；异常活跃阶段不会因此自动恢复 |
| Team | 本地 team JSON 与成员资料 | 保存组织上下文，不证明成员进程仍存活 |

[数据路径](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/config/paths.py#L15-L159)、[会话保存字段](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/services/session_storage.py#L18-L107)、[团队持久化](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/swarm/team_lifecycle.py#L263-L278)。

**已确认边界**：会话快照包含 `async_agent_state`、`async_agent_tasks` 等允许保存的元数据，因此不能写成“所有 Agent 状态都丢弃”；但这些快照与 BackgroundTaskManager 的进程控制表是两种状态。当前证据没有证明快照会恢复运行中 OS 进程及租约。

**数据库判断**：这几条核心路径不要求 PostgreSQL、Redis、内嵌 SQL 数据库或专属数据库扩展，也没有最低数据库版本要求。文件状态不是内嵌事务数据库；把目录放在共享盘上不能自然得到分布式队列。

### 任务队列与并发协调

| 层次 | 领取与协调方式 | 防重复、恢复及扩展限制 |
| --- | --- | --- |
| Background Task | 同一进程创建并立即启动；锁用于局部输入/输出 | 不是持久 pending 队列，没有跨宿主领取语义 |
| Cron | 本地文件保存计划；更新注册表使用文件锁与原子写；PID 文件管理 daemon | 锁保护计划修改，不覆盖“判断到期→执行”的领取租约；不保证多个执行者只运行一次 |
| Autopilot | 本地 registry 选 queued 卡；tick 检查是否已有活跃卡 | 指纹去重是摄取去重，不是抢单；读取、选卡、写状态分离，没有已确认的原子 claim |
| GitHub Actions 触发 | scan 与 run-next 各自设置 workflow concurrency group | 这是各工作流范围的控制，不是两条工作流和本地 CLI 共享的全局锁；不能替代 registry 一致性 |

证据见[后台管理器](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/tasks/manager.py#L49-L112)、[Cron 修改锁](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/services/cron.py#L73-L137)、[Autopilot 领取](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L334-L365)、[scan 工作流](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/.github/workflows/autopilot-scan.yml#L3-L25)、[run-next 工作流](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/.github/workflows/autopilot-run-next.yml#L3-L25)。

**合理推导**：单实例、单仓库是现有机制的适用运行边界；多入口并发可能发生重复选卡或覆盖状态。没有进行锁压力测试，不把可能性写成已经复现的数据损坏。

### 接口形态与客户端接入

**已确认标准入口**：Typer CLI、交互终端、`--print` 的 text/json/stream-json 输出、Python 内部工具扩展、MCP 客户端及聊天渠道适配。Autopilot 的 CLI 可添加卡、扫描、查看状态、run-next、tick 和安装 Cron；并非一个需要先安装官方桌面客户端才能连接的中心 API。[官方 CLI 说明](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/README.md)、[Autopilot CLI](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/cli.py#L1045-L1219)。

**三种接入语义分别判断**：

- 第三方程序**创建或管理工作**：可在相同执行环境调用 CLI；直接嵌入 Python 类属于代码级集成，没有查到独立稳定调度 SDK 的承诺。
- 第三方工作机**领取中心任务**：未确认标准协议；本机 `run-next` 既选卡又执行，不是发给远端 Worker 的 claim/ack 接口。
- 服务端**唤起客户端执行**：可借自托管 Actions runner 触发本机命令，但这是 GitHub runner 的接入关系，不是 OpenHarness 实现的客户端注册与租约体系。

`RemoteTrigger` 名称容易误导：实际是读取本地 Cron 作业并立即执行本机命令，没有在该工具实现中建立远程调度服务或外部事件订阅。[实际工具语义](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/tools/remote_trigger_tool.py#L17-L48)。

**改造影响**：绕过终端 UI 调用 CLI 是轻量适配；给另一种客户端接上“中心工作池”则不是同一量级，需要定义身份、工作归属、领取/完成/失联协议与一致性。Windows 的入口名和 shell 参数处理也需要单独适配。

### 通信方式

- Agent 与模型：按选定 Provider 向远端或本机模型端点请求并流式获取响应；外部端点故障直接影响推理。
- 父 Agent 与子进程：本机 stdin/stdout，消息按 JSON 行封装；Agent ID→Task ID 的映射由父进程持有。[子进程通信](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/swarm/subprocess_backend.py#L117-L138)。
- Cron 与执行：本地进程派生及文件注册表轮询，不要求消息中间件。
- Autopilot 与 GitHub：调用 `gh` 查询 Issue/PR 和状态，Git 传送代码；CI 等待采用轮询，默认 20 秒间隔，不是由持久事件队列驱动。[CI 轮询](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L1548-L1572)。
- MCP 与聊天渠道：属于可选外部能力边界；它们的连接恢复不能代替 Autopilot 工作卡恢复。

### 主要依赖

**包与执行核心，已确认**：发行包名 `openharness-ai`，要求 Python ≥3.10；入口 `oh`、`openh`、`openharness` 指向同一个 CLI，`ohmo` 指向个人助理应用。影响关键链路的依赖包括 Provider SDK、HTTP 客户端、Typer/Pydantic、Croniter、MCP；四个主要聊天渠道的 SDK 也在基础包依赖中，不是另一个必须单独安装的 channels extra。[包配置](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/pyproject.toml#L5-L55)。

**界面与开发依赖**：React/Ink TUI 需要 Node.js ≥18 及 npm 依赖；headless 使用不以终端界面为前提。Git 是源码安装、worktree 与仓库自动化需要的依赖；`uv`、测试及前端检查工具出现在开发/自托管工作流和默认验证策略中，不能统统算作普通 pip 用户的最小安装前提。[安装脚本](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/scripts/install.sh#L88-L265)、[自托管执行依赖](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/.github/workflows/autopilot-run-next.yml#L27-L41)。

**可不启用不等于可直接移除包**：不使用聊天、MCP 或 Cron 时可不配置和启动其能力，但相应 Python 库仍列为发行包依赖；要裁剪安装依赖，需调整打包与导入路径。Docker 属于有条件启用的沙箱能力，不是所有本机执行的硬前提；本次未验证其隔离强度。[包依赖](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/pyproject.toml#L16-L46)、[运行时沙箱配置](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/ui/runtime.py#L400-L443)。

**安装可重复性缺口**：包中多项依赖只有下限，默认安装脚本安装/升级最新发行包，源码模式拉取分支；固定脚本 URL 的 SHA 不等于固定最终安装代码与依赖。前述 MCP 兼容性反馈因此与工作机部署直接相关，但是否在目标环境发生仍需复现。

### 部署形态

#### Windows 工作机：原生 Python CLI，可选 TUI 和本机后台进程

- **安装方式，官方声明与源码确认**：README 给出 PowerShell 安装脚本或 `pip install openharness-ai`。脚本要求 PowerShell 5.1+、Python ≥3.10，创建 `%USERPROFILE%\.openharness-venv`；`-FromSource` 另需 Git，将源码放在 `%USERPROFILE%\.openharness-src`。有 Node ≥18 时尝试安装终端前端依赖，无 Node 则跳过 TUI。[Windows 安装脚本](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/scripts/install.ps1#L1-L254)。
- **运行入口**：PowerShell 用 `openh setup`、`openh`、`openh -p ...`；`openharness` 是另一个入口。不要把 `oh` 直接作为 PowerShell 命令，因为它可能解析为 `Out-Host`；显式 `oh.exe` 是脚本列出的另一种调用方式。个人助理使用 `ohmo init`、`ohmo config`、`ohmo gateway start`。[入口检测与提示](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/scripts/install.ps1#L261-L327)。
- **权限**：脚本修改用户级 PATH，并在用户目录安装；已读路径未请求管理员提权。安装示例中的进程级 ExecutionPolicy Bypass 不是管理员权限，也不应解读为需要全局关闭执行策略。运行时仍具有该 OS 用户可访问的文件、shell 与凭证权限；机器人接入不能绕过这一风险边界。
- **网络**：安装需访问 Python 包仓库，源码模式需访问 GitHub，TUI 依赖可能需 npm；运行时按功能连接模型、聊天平台、GitHub 或 MCP。纯本地模型与本地工具路径的离线可用性仍待验证。
- **后台与支持层次**：网关以 Windows detached 子进程运行，Cron 也有 Windows 启动路径；不是另装“中心服务”。已读安装和生命周期实现未注册 Windows Service 或开机计划任务。CLI 能原生运行，不表示 POSIX 风格的仓库验证命令已经兼容。[网关启动](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/ohmo/gateway/service.py#L256-L297)、[Cron 启动](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/services/cron_scheduler.py#L554-L575)。
- **升级**：默认安装脚本在该虚拟环境执行 pip 升级；源码模式执行 `git pull --ff-only` 后 editable 安装。要验证正式 v0.1.9，可在所用环境固定 `openharness-ai==0.1.9`；这不代表获得本报告 main 的全部后续修改。
- **卸载，按副作用推导而非官方完整卸载流程**：先停止 gateway、Cron 及运行中的工作，备份状态；pip 安装在原环境卸载，脚本专用虚拟环境可单独移除，并移除它对应的用户 PATH 项。源码目录、`.openharness`、`.ohmo` 与仓库级状态分别决定是否保留，不要删除整个用户 PATH 或共享的外部工具凭证。[安装副作用](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/scripts/install.ps1#L129-L254)、[网关停止](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/ohmo/gateway/service.py#L382-L413)。

**选型缺陷与未决**：当前 CI 的 Python 与前端任务使用 Ubuntu，不提供原生 Windows 测试矩阵。已有 Windows 修复和社区测试不能替代本次对完整无人值守流程的实测；尤其需验证路径、shell、Cron 命令、长任务超时与停机恢复。[CI 配置](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/.github/workflows/ci.yml#L9-L83)。

#### macOS 工作机：用户级虚拟环境和命令链接，不是独立 App 安装包

- **安装方式，已确认**：README 给出 Bash 安装脚本或 `pip install openharness-ai`。脚本检测 macOS，要求 Python ≥3.10 和 pip，创建 `~/.openharness-venv`；源码模式使用 Git 和 `~/.openharness-src`。React TUI 需 Node ≥18。[系统与依赖检测](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/scripts/install.sh#L67-L235)。
- **运行入口与副作用**：在 `~/.local/bin` 创建 `oh`、`ohmo`、`openharness` 链接，修改已有 Bash/Zsh 配置和 Fish 配置以加入 PATH；随后用 `oh setup`、`oh` 或 headless 命令。不是 `.app`、DMG 或菜单栏客户端安装。[链接与 PATH](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/scripts/install.sh#L278-L360)。
- **TUI 边界**：默认 pip 安装路径中的脚本只检查当前目录的 `frontend/terminal` 再执行 npm，未找到会跳过；不能仅据安装脚本执行成功认定 TUI 依赖已完整到位。[前端步骤](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/scripts/install.sh#L249-L265)。
- **权限与网络**：已读 macOS 安装路径没有主动提权，主要写用户目录和 shell 配置；工作时使用当前用户权限访问仓库、命令和凭证。下载、远端模型、渠道及 GitHub 的网络边界与 Windows 相同。没有证据要求所有用户预先授予完整磁盘访问等系统权限，具体受保护目录访问需按实际工具验证。
- **后台与开机行为**：网关和 Cron 是 detached/new-session Python 进程；已读安装与启动路径未注册 launchd。关终端后继续运行与重启系统后自动启动是不同能力。[网关进程启动](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/ohmo/gateway/service.py#L256-L297)。
- **升级**：重跑默认脚本执行 pip `--upgrade`，源码模式更新仓库后 editable 安装；固定发行包版本与固定 main SHA 的源码验证应分开。
- **卸载，合理推导**：先停止网关与 Cron 并备份工作状态；在原 Python 环境卸载包，或移除脚本专用虚拟环境；只清理本安装创建的三个命令链接和 PATH 增补。源码、个人工作区、仓库状态与持久记忆按保留要求处理。已读脚本没有完整卸载分支，不承诺自动移除所有扩展或共享凭证。

**选型缺陷与未决**：macOS 有明确文档与终端修复记录，但现有 CI 不提供原生 macOS 验证矩阵；本次也未运行。不能把 Linux CI 成功替代 macOS 的 UI、子进程、沙箱或常驻验证。[v0.1.8 macOS 终端修复](https://github.com/HKUDS/OpenHarness/releases/tag/v0.1.8)、[CI](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/.github/workflows/ci.yml#L9-L83)。

#### 主体功能位置与最小部署成本

| 使用形态 | 主体位置与最小条件 | 能力与运维边界 |
| --- | --- | --- |
| 交互 / headless Agent | PC 本机 Python 环境、发行包、可用模型；TUI 另需 Node/npm | 不需数据库或中心服务；模型在云端时仍有数据外发 |
| ohmo | 同一本机再运行网关、配置机器人凭证与准入名单 | 外部 IM 平台必需；主机停机就无法继续本地执行 |
| 本地 Cron | 单独后台 Python daemon、本地注册表 | 要自行保障启动、停止与异常后的状态处理；不是默认 OS 开机服务 |
| Repo Autopilot | 仓库、Git、`gh`、模型、验证工具与本地状态目录 | 工作卡持久化；完整 Git 仓库链路仍耦合 GitHub，且恢复机制不足 |
| Actions 驱动的 Autopilot | GitHub 控制面 + 自托管 runner 上的仓库与 Python/uv 环境 | 增加 runner、凭证和状态目录连续性要求，不是仅启用云端定时器就完成部署 |

**合理判断**：交互执行的部署负担低于持续自动工作所需负担。持续运行时，主机生命周期、依赖固定、权限以及卡状态恢复的管理仍由部署者承担；没有外置数据库不等于无需状态治理。

#### ohmo 网关与聊天云端：传输、持久化、鉴权和故障边界

**本机网关职责，已确认**：创建消息总线、ChannelManager、会话 Runtime pool 与 bridge。消息进入后按会话路由本地推理，回复返回渠道。它不是必须部署在 OpenHarness 官方云中的代理；可自行放在服务器，但那是用户自托管。[本机服务组装](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/ohmo/gateway/service.py#L42-L73)。

**外部渠道服务职责与接口，已确认**：

| 渠道 | 接收与发送方式 | 必要认证及网络 |
| --- | --- | --- |
| Telegram | SDK 长轮询接收，Bot API 回复 | Bot token；本机发起出站 HTTP 请求 |
| Slack | Socket Mode 接收，Web API 回复 | app token 与 bot token；出站长连接及 HTTP |
| Discord | Gateway WebSocket 接收，REST 回复 | Bot token；出站 WebSocket 及 HTTP |
| 飞书 | SDK WebSocket 长连接接收，REST 客户端发送 | app ID 与 app secret；代码明确不要求公网 IP |

[Telegram](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/channels/impl/telegram.py#L129-L182)、[Slack](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/channels/impl/slack.py#L33-L52)、[Discord](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/channels/impl/discord.py#L39-L85)、[飞书](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/channels/impl/feishu.py#L455-L516)。这四条路径不要求向 PC 暴露一个通用公网任务接收端口；企业代理与防火墙仍需允许相应出站连接。

**身份与执行权限分层**：机器人 token/应用凭证用于连接平台；发送者准入另由 allow_from 判断。公共渠道基类对空名单拒绝、`*` 放行所有发送者；Slack 还先做 DM/群策略，飞书 bridge 还检查受管群或明确提及。会话键包含群聊发送者只是记忆隔离，不是用户认证。[公共准入](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/channels/impl/base.py#L83-L136)、[Slack 多层过滤](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/channels/impl/slack.py#L158-L228)、[会话路由](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/ohmo/gateway/router.py#L8-L31)。

**远程管理边界，已确认**：斜杠命令需要可远程调用；管理例外还要求命令支持 opt-in、配置开启且命令名位于许可清单。这个清单是“哪些命令”，不是“哪些用户”。普通工具仍通过共用 PermissionChecker；网关构建运行时时未传入交互审批回调。无人值守时需审批工具的具体处置未在本轮运行验证，不将网关一概认定为全自动放行。[远程管理条件](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/ohmo/gateway/runtime.py#L127-L137)、[命令准入](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/ohmo/gateway/runtime.py#L262-L290)、[Runtime 构建](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/ohmo/gateway/runtime.py#L189-L209)。

**持久化与数据外发**：网关配置写本地 `gateway.json`，会话提示、消息、工具元数据及会话键索引写本地 JSON；附件下载到本地媒体目录。聊天平台本身收到用户输入、回复及发送的附件；模型请求还会把实际选入上下文的内容送往模型端点。本仓库不能证明外部平台没有副本或承诺其保留期限。[网关配置](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/ohmo/gateway/config.py#L13-L40)、[会话存储](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/ohmo/session_storage.py#L24-L99)、[本地媒体目录](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/channels/impl/base.py#L16-L31)。

**故障影响，源码加推导**：PC/自托管主机退出会停止网关；平台断连影响收发，模型或凭证失效影响生成。Telegram 配置不丢弃平台待收更新，飞书和 Discord 有重连循环；这仍不能证明从平台接收、进入本机处理、执行工具到回复这一整条链路具有持久确认或 exactly-once 保证。长连接恢复与工作任务恢复是两种问题。

#### 模型云端：可替换的推理服务，不是本地认证文件所代表的本地模型

**已确认**：运行时根据 Provider/profile 构造模型客户端，使用凭证与可配置 base_url；可以使用 API key，也有读取已有订阅认证信息的桥接方式。配置与认证材料在本机，不改变推理服务可能位于云端的事实。[Provider 文档](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/README.md)、[模型客户端构造](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/ui/runtime.py#L193-L238)。

**职责与数据边界**：云模型承担推理，通常接收选中的系统提示、历史消息及工具结果；OpenHarness 本机执行工具，外部服务不是默认本机文件系统所有者。断网、服务限流、认证失效会阻断对应模型循环；本机文件仍在，但不能据此继续依赖云推理的工作。

**替换与未决**：官方文档提供本机 OpenAI 兼容端点配置，可避免该层云依赖；不同模型的工具调用、主 Agent/子 Agent 路径兼容及完全离线能力未实测。尤其通用 `task_create(local_agent)` 路径单独取 Anthropic key，与继承 Provider 环境的子进程队友路径不同，不能从主会话切换成功外推所有委派路径都已等价兼容。[通用 Task 创建](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/tools/task_create_tool.py#L30-L54)、[队友继承路径](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/swarm/subprocess_backend.py#L55-L98)。

外部模型服务的内部数据库、部署集群与内容保留策略不由此开源仓库提供，列为未决；不虚构其内部组件，也不把未获取的信息解释成产品自有闭源调度模块。

#### GitHub 云端与自托管 runner：完整仓库闭环的外部控制面

**云端职责，已确认**：GitHub 保存源仓库、Issue、PR、评论、检查状态并提供合并接口。Autopilot 经 `gh` 查询/写回，经 Git 推送代码；即使 Agent 在本地执行，这些工作对象和外部副作用仍经过 GitHub。[摄取](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L502-L573)、[PR 推进](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/src/openharness/autopilot/service.py#L963-L1008)。

**仓库自带部署形态**：两个 Actions 工作流分别每半小时扫描、每两小时运行 tick，也接受手动触发；都指定 `self-hosted`，安装 Python 3.11、uv 与开发依赖。云端 Actions 负责定时与作业控制，真正执行位于用户提供的 runner，而非自带 GitHub 托管执行机。runner 可能是工作 PC 或其他主机；文件没有规定其 OS，不可据此认为 Windows/macOS 全部受测。[scan](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/.github/workflows/autopilot-scan.yml#L1-L41)、[run-next](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/.github/workflows/autopilot-run-next.yml#L1-L41)。

**状态边界**：Autopilot registry 仍写 runner 的仓库目录；工作流使用 `clean: false` 并只提交展示导出目录，不是把 registry 放入中心数据库。**合理推导**：依赖同一工作目录和持久磁盘；runner 被替换或两次任务落到不同主机时，不能依靠 GitHub 自身自动恢复该本地状态。[checkout 与提交范围](https://github.com/HKUDS/OpenHarness/blob/9b2efd795c6aa09f88b0c257d269a9e518da6ae7/.github/workflows/autopilot-run-next.yml#L21-L53)。

**权限与网络边界**：工作流声明 contents、issues、pull-requests 写权限；实际还需要 runner 中可用的 Git/`gh` 身份、模型凭证和网络。声明 workflow permissions 并不能证明 `gh` 已配置好身份。执行用户必须将仓库写入、评论、推送及合并视为真实外部操作，而非本地预览。

**故障影响**：GitHub 不可达会影响摄取、推送、PR、CI 和合并；runner 离线时云端触发不能完成本地执行。可以不采用 Actions、只用本地 Cron，但这只能剥离云端触发，不能剥离完整 GitHub 工作闭环本身。

### 架构范式、依赖根源与改造边界

**最小核心**：Python Runtime、模型调用、工具执行和本地状态文件。Cron、聊天网关、MCP、Autopilot 可按用途不启动；TUI 不是 headless 执行所必需的界面。没有一个必须剥离的闭源 OpenHarness 调度核心；外部服务的闭源性仍需按选用功能分别看待。

**底层刚需与上层能力**：工作状态的持久化、原子领取、执行归属、恢复和幂等，是把它升级为中心调度系统时必须具备的底层职责；向量检索或智能匹配不是当前调度核心成立的先决条件，不能把增加记忆能力当作补齐调度。

| 改造方向 | 范围与影响 |
| --- | --- |
| 只复用 Agent 执行 | 可用 headless CLI/结构化输出；调用方承担任务状态、重试及工作机治理 |
| 单机私有化执行 | 保留本地文件，改用内网/本机模型，按需不启用聊天及 GitHub 自动化；需验证工具和子 Agent Provider 一致性 |
| 保留完整 GitHub 仓库闭环 | Git、`gh`、远程仓库和 PR/CI 权限仍是业务依赖；本地模型只替换推理服务 |
| 剥离 GitHub | 需要替换摄取、分支/PR、检查状态与合并衔接；非 Git 目录可跳过 GitHub，但不等于 Git 仓库的离线功能等价模式 |
| 升级为多工作机调度 | 增加一致性状态所有者、claim/lease、执行者身份、依赖解锁、崩溃回收、重放与外部副作用幂等；属于实质性调度内核改造 |

**能否下沉为普通 Agent 节点**：一次 `oh -p` 或 `autopilot run-next` 可以由别的任务节点调用。但若撤去持续拥有 registry、选择工作、恢复执行及驱动后续阶段的责任方，只留下单次 Agent 调用，就失去其已有的跨调用工作状态与推进语义，不是等价 Stateful 调度。保留目录也不自动补上恢复责任方。

## 未决项与证据边界

- 未安装或运行 OpenHarness，未调用真实模型、启动网关、连接聊天账户、创建定时任务或写入外部仓库；没有 Windows/macOS 的完整实测结果。
- 代码结论针对固定 main SHA；Release 演进只引用对应发布说明，未假定 main 与 PyPI 0.1.9 完全相同。
- 已确认普通 Task、Cron 和 Autopilot 的关键状态归属与推进路径；未展开全仓库源码审计。接口、对象的“未确认”不等于证明任意插件不可能提供该能力。
- Autopilot 崩溃后活跃卡阻塞、并发领取竞争及 Cron 外层超时影响属于源码架构推导，尚待受控故障验证。
- Issue/PR 反馈是少量公开样本；待合并修改不是已发布能力，提交者测试结果不是本报告执行结果。
- 模型服务与聊天平台的内部存储、数据保留期限及托管实现不在本仓库公开契约中；不能承诺零留存或完全离线。

## 后续验证建议

1. **先验 Stateful 门槛**：在隔离仓库中，于 preparing/running/waiting_ci 阶段终止宿主再重启，观察是否重排、恢复、阻塞或重复写外部系统；验证依据是任务继续推进而不是会话可以打开。
2. **验证领取一致性**：对同一份测试 registry 同时触发两个受控执行入口，检查是否重复选卡；不要直接在真实有写权限的仓库试验。
3. **双平台金路径**：分别验证安装、headless、TUI、子 Agent、gateway start/stop/restart、Cron 和 Autopilot 验证命令；特别覆盖带空格路径、Windows `openh` 入口和后台进程退出。
4. **验证全本地边界**：只启用本机兼容模型和本地工具，禁止外部网络，验证主 Agent 与不同子 Agent 路径；再逐个接入聊天和 GitHub，确认每条外发边界与故障影响。
5. **验证完成与权限语义**：在无 CI、CI 失败、CI 超时、无自动合并标签等场景检查卡状态和实际 PR 状态；明确无人值守工具权限，避免将人工合并关口误当执行授权。
6. **验证部署可重复性**：分别固定发行包和 main 依赖，核验近期反馈所指 MCP 兼容性；再确定自动运行时限、恢复操作和停止/卸载过程。
