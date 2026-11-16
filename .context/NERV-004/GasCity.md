# Gas City 技术产品调研

> updated_by: Qoder - Qoder
> updated_at: 2026-10-15 09:55:50
> evidence_window: 调研日期 2026-10-15；最新稳定版本 v1.5.0（2026-10-05 发布）；GitHub 仓库 gastownhall/gascity 默认分支 main（截至 2026-10-15）；官方文档 `docs/` 与贡献者文档 `engdocs/` 内嵌于仓库

## 交付结论

### Gas City 是「编排构建 SDK」形态的多 Agent 编码软件工厂，角色全部为配置、机器只有三件

Gas City 官方自我定位是 **Orchestration-builder SDK for multi-agent coding workflows**（[仓库描述](https://github.com/gastownhall/gascity)，直接事实），产品叙事是「软件工厂」：把作业怎么做一次性写成 **Formula**，编排器在会话之外驱动一支 Agent 舰队把它跑完——拆分为可跟踪工作单元、并行铺开、依赖未闭合则按住、失败重试直到完成（[docs/index](https://github.com/gastownhall/gascity/blob/main/docs/index.mdx)，直接事实）。

系统由六个原语构成，各自回答一个正交问题：**Agent**（谁做）、**Bead**（做什么，崩溃后仍存活的工作单元）、**Formula**（怎么做）、**Rig**（在哪做，注册进城市的项目）、**Pack**（配置系统，城市即本地 pack 并导入共享 pack）、**Event**（发生时可观测）（[docs/index](https://github.com/gastownhall/gascity/blob/main/docs/index.mdx)，直接事实）。真正的引擎只有三件与角色无关的机器：**Orchestrator（控制器）**、**Bead store（工作对象存储）**、**Event bus（事件流）**（[engdocs/architecture/index](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/index.md)，直接事实）。

关键点：**二进制内不硬编码任何角色**。前代产品里由代码写死的协调者/工人/看门狗，在 Gas City 中全部降级为配置——「一个 reviewer」就是操作员写的一段 prompt 模板加一条 pack 声明，而不是一个编译进去的插件（[FAQ](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/faq.md)，直接事实）。用户侧一切面向配置的产物是 TOML（`city.toml`、`pack.toml`）与 markdown prompt 模板，不要求写 Go（直接事实）。

Gas Town 在本轮只作为 provenance 事实出现：官方文档说明 Gas City 是 Gas Town 的机器被抽取出来的平台，且 Gas Town 的全部角色现在是 pack 配置（[FAQ](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/faq.md)，直接事实）。本轮调研对象与结论均只针对 Gas City。

### 判定：具备 Stateful 调度能力（调度中心持久拥有工作对象、关系、状态与归属），但有三条明确的非持久/未落地边界

对照 Index 调度判定基准逐条核验，Gas City 满足 Stateful 调度系统的全部要件（[engdocs/architecture/beads.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/beads.md) + [formula-spec-v2](https://github.com/gastownhall/gascity/blob/main/docs/reference/specs/formula-spec-v2.md) + [life-of-a-bead](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/life-of-a-bead.md)，直接事实）：

1. **持久拥有工作对象**：一切皆 bead（ID 为 `prefix-xxxxx`），字段含 Status/Type/Assignee/ParentID/Ref/Labels/描述与 `gc.*` metadata，落在 Dolt（默认经 `bd`）或用户自供的 exec store 里，生命周期长于任何会话（直接事实）。
2. **持久拥有对象关系**：依赖边以 `blocks` / `waits-for` / `conditional-blocks` / `parent-child` / `relates-to` / `tracks` 类型持久化在 store；`sling` 时调度中心对「depends-on」方向做三色 DFS 环检测（O(V+E)），发现环即在分派前拒绝并打印完整环路，`--force` 可跳过（[engdocs/architecture/cycle-detection.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/cycle-detection.md)，直接事实）。
3. **持久拥有任务状态**：Gas City 侧是三态契约 open / in_progress / closed（`BdStore` 把 `bd` 的六个状态映射进来）；Formula 编译产物是「工作流根 bead + 每步一个可独立路由的 step bead + 编排器拥有的控制 bead」，重试预算、检查循环、fan-out、scope 结算全部以 bead 形式持久化（直接事实）。
4. **持久拥有执行归属**：归属写在 bead 自身上（`gc.routed_to` metadata、Assignee、`pool:` 标签），不在内存里（直接事实）。
5. **判断何时可执行**：可执行性由 store 的依赖闭锁决定——被阻塞的 issue 存储层直接拒绝关闭，控制 bead（`scope-check`、`workflow-finalize` 等）在编排器的 dispatch 循环里按边门控（直接事实）。
6. **判断顺序推进**：step 的 `needs` 编译成阻塞边；`priority`（0–4）决定同带宽内的取任务次序；`check`/`retry`/`drain`/`on_complete` 由控制 dispatcher 解释（[formula-spec-v2](https://github.com/gastownhall/gascity/blob/main/docs/reference/specs/formula-spec-v2.md)，直接事实）。
7. **判断由谁执行**：Agent 池（`min`/`max` + `scale_check` 需求查询）决定并发与身份，路由标签决定归属，拉取式发现决定谁先拿到（直接事实）。
8. **失败后如何继续**：控制 dispatcher 生成 retry / retry-eval / ralph 控制 bead 实现重试循环，`retry.on_exhausted` 可为 `hard_fail` 或 `soft_fail`；scope 内成员失败按 `gc.on_fail = abort_scope` 跳过其余成员并以 `gc.outcome = fail` 关闭 scope 体，`hard` 失败类会连带保留失败原因与肇事成员；`teardown` 是唯一在结算之后仍继续运行的部分（直接事实）。健康巡逻负责崩溃循环隔离、僵尸会话回收与漂移排空（[engdocs/architecture/health-patrol.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/health-patrol.md)，直接事实）。

**三条必须写进结论的边界（否则会把「能力」读成「成熟度」）**：

- **部分调度簿记是刻意不持久的**。控制器文档的 Known Limitations 原文：「Tracker state is in-memory only: Crash tracker history, idle tracker timestamps, and order dispatch state are all lost on controller restart」（[engdocs/architecture/controller.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/controller.md)，直接事实）。工作对象与关系可恢复，但崩溃计数、空闲时间戳、order 派发游标重启即丢（直接事实）。
- **取任务的原子性不在 Gas City 的 Go 代码里**。claim 由 `bd update --claim` 的 compare-and-swap 保证；「一次只领一个」是写进 Agent prompt 模板的约定，文档明确「This is not enforced by Gas City Go code — it is prescribed in the agent's prompt template」（[engdocs/architecture/life-of-a-bead.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/life-of-a-bead.md)，直接事实）。
- **新一代调度内核尚未成为默认**。`[daemon] session_reconciler` 默认值是 `legacy`；reconciler v2 文档自述 main 上「the P2 skeleton… The controllers are trace-only」，P3 才替换 allocator、P4 才替换 session controller，并且 v2 会**拒绝**使用 `depends_on`、`scale_check`、identity circuit breaker、`max_session_age`、stall timeout 的配置；可靠性保证 **A7 在 main 上两种 reconcile 路径下均未满足**（tmux send-keys 无保护），A8 类保证「None crosses a restart」（[engdocs/architecture/reconciler-v2.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/reconciler-v2.md) + [invariants.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/invariants.md)，直接事实）。1.6 路线图的第一优先级正是「keyed v2 session reconciler 成为唯一 reconciler，legacy 路径删除」（[ROADMAP.md](https://github.com/gastownhall/gascity/blob/main/ROADMAP.md)，直接事实）。

结论：**是 Stateful 调度系统，不是任务执行宿主或 Stateless 任务消费者**；其调度语义中心驱动、状态外置于 store，但可靠性内核仍在迁移中（合理推导，依据上述三条边界）。

### 工作对象模型：City / Rig / Bead / Convoy / Formula 实例 / Order / Agent 可辨识，Issue、Plan、Task 全部落为持久 bead

对照 Index 的工作对象基准（[engdocs/architecture/beads.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/beads.md)、[nine-concepts.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/nine-concepts.md)、[formula-spec-v2](https://github.com/gastownhall/gascity/blob/main/docs/reference/specs/formula-spec-v2.md)，直接事实）：

- **City**：工作空间根，`gc init` 生成，含 `city.toml`、`.gc/`（事件、锁、socket、runtime、pack 缓存）与 `.beads/`。
- **Rig / Project**：`gc rig add <path>` 注册的项目，目录可在磁盘任意位置，拥有独立 bead 命名空间与 Agent 作用域（[Tutorial 01](https://github.com/gastownhall/gascity/blob/main/docs/tutorials/01-cities-and-rigs.md)，直接事实）。
- **Bead / Issue / Task**：唯一工作对象。`Create` 时 Type 缺省填 `"task"`，显式 Type 保留；容器类型判定大小写敏感——`"convoy"` 是容器，`"epic"` 只是普通类型，`"CONVOY"` 不是容器（直接事实）。
- **Convoy**：当前唯一容器类型，作为跟踪容器聚合多个 bead，成员闭合后自动关闭（[docs/tutorials/06-beads.md](https://github.com/gastownhall/gascity/blob/main/docs/tutorials/06-beads.md)，直接事实）。
- **Formula（Plan）/ 实例**：TOML 配方经编译器生成图；「Plan 不是供 Agent 读一遍的文本」——beads 后端负责 formula 物化，`bd` 是今天真正支持完整 formula 执行的后端；File/Mem store 只创建一个简化 molecule 根（用于测试与教程）（[engdocs/architecture/formulas.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/formulas.md)，直接事实）。
- **控制 bead**：`retry`、`retry-eval`、`check`、`ralph`、`fanout`、`drain`、`scope-check`、`workflow-finalize`，由编译器注入、编排器独占执行（直接事实）。
- **Order**：周期性/触发性作业，触发器五类（cooldown、cron、condition、event、manual），执行体分 `exec`（shell，不调模型）与 `formula`（MolCook wisp），跑在独立占空比泳道上；cooldown 由闭合的 `order-run:<scopedName>` 跟踪 bead 表达（默认留 10 条、7 天剪枝）（[engdocs/architecture/orders.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/orders.md)，直接事实）。
- **Message（Mail）**：`Type="message"` 的 bead，From/To/Subject/Body/ThreadID/Priority/CC，收件箱 = open 且未打 `read` 标签的自身指派消息（[engdocs/architecture/messaging.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/messaging.md)，直接事实）。
- **Agent**：声明在 pack/`city.toml` 里的配置对象 + 运行时池，非硬编码角色（直接事实）。

**归属与状态的存放位置**：全部在 bead store 的行与 `gc.*` metadata 里；不在进程内存、不在文件旁路（唯一例外是上节所列三类 tracker）（直接事实）。

### Agent 分派与连续性：拉取式发现 + CAS 认领 + 池化容量 + 控制 bead 重试，会话可弃、工作不可弃

分派链路（[life-of-a-bead.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/life-of-a-bead.md)、[Tutorial 03](https://github.com/gastownhall/gascity/blob/main/docs/tutorials/03-sessions.md)、[config.md](https://github.com/gastownhall/gascity/blob/main/docs/reference/config.md)，直接事实）：

1. 建 bead（`gc create` / `bd create` / API / formula 物化）。
2. `gc sling` 把 bead 路由给目标（Agent、池或 rig），写入 `gc.routed_to` / assignee / `pool:` 标签；sling 前置检查里做依赖环检测。
3. Agent 侧执行 `gc hook`，控制器按 Agent 配置的 `work_query`（`EffectivePoolDemandQuery`）返回可领工作。
4. Agent 用 `bd update --claim` 原子认领**恰好一个** bead（CAS 在 `bd`，认领纪律在 prompt 模板）。
5. 认领次序为优先级优先、同优先级带内 FIFO。
6. 会话在 tmux（默认后端且 fallback）或 subprocess / `acp` / k8s / ssh / `exec:<script>` 运行时里执行。
7. 完成后关闭 bead；容器 bead 满足成员条件后自动关闭；formula 由 `workflow-finalize` 聚合阻塞项结果、先关根、再传播 `gc.source_bead_id` 链。

连续性来自「工作对象在 store、会话是一次性的」这一分工：Agent 死亡后 bead 仍 open，新 Agent 领同一份工作；编排器重启则**收养**它发现的存活会话，从 store 续跑（[FAQ](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/faq.md)，直接事实）。

Agent 维度是**五条正交轴**的组合，而不是固定角色：harness（16 个内置，含 Claude Code、Codex CLI、Gemini CLI、Cursor Agent、GitHub Copilot、Sourcegraph AMP、OpenCode、Grok、Kimi Code、Pi）、model、upstream（如 bedrock；凭据以环境变量名引用）、transport（tmux send-keys + pane 抓取，或 `acp` = Agent Client Protocol over stdio 的 JSON-RPC）、runtime（tmux / 无头 subprocess / K8s Pod / `ssh:user@host` / `exec:<script>`）（[harness-recipes](https://github.com/gastownhall/gascity/blob/main/docs/guides/harness-recipes.md)、[engdocs/architecture/session.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/session.md)，直接事实）。混合舰队因此是配置而非改造。

**需注意的成熟度信号**：`session.quarantined` / `session.suspended` 事件已在 schema 注册但**无生产发射点**；`gc.detached` 只有消费者、仓库内无生产者；隔离状态自动过期（[health-patrol.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/health-patrol.md)，直接事实）。空闲会话休眠仍是设计文档阶段（[design/idle-session-sleep.md](https://github.com/gastownhall/gascity/blob/main/engdocs/design/idle-session-sleep.md)，直接事实）。

### 运行形态：机器级 supervisor + 每城 controller + 每城一个受管 Dolt + tmux 会话；主体功能在工作机本地

进程与端口拓扑（[design/machine-wide-supervisor-v0.md](https://github.com/gastownhall/gascity/blob/main/engdocs/design/machine-wide-supervisor-v0.md)、[dashboard.md](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/dashboard.md)、[config.md](https://github.com/gastownhall/gascity/blob/main/docs/reference/config.md)、[internal/beads-topology.md](https://github.com/gastownhall/gascity/blob/main/docs/reference/internal/beads-topology.md)，直接事实）：

| 组件 | 职责 | 运行位置 / 接口 |
| --- | --- | --- |
| `gc` CLI | 人与脚本的唯一主入口 | 工作机 |
| supervisor | 单一常驻守护进程，托管每座城市的 controller runtime，提供 API + 内嵌 dashboard | 工作机，`http://127.0.0.1:8372`；`~/.gc/supervisor.sock` / `.lock` |
| 城市 controller | 30s tick（`[daemon] patrol_interval`）reconcile 循环：巡逻、池管理、控制 dispatcher、order 泳道 | 工作机，flock 单例 `.gc/controller.lock`；IPC 为无鉴权 Unix socket `.gc/controller.sock`；`[api]` 默认 `127.0.0.1:9443`（0 为关闭） |
| 受管 Dolt sql-server | 每城一个，仅 `127.0.0.1`，端口写在 `.beads/dolt-server.port`；各 rig 为其中按 prefix 隔离的逻辑作用域 | 工作机（默认 beads provider 路径） |
| `bd` CLI | 工作对象读写、CAS 认领、formula 物化 | 工作机（子进程调用） |
| Agent 会话 | 执行工作 bead | 默认工作机 tmux；可选 K8s Pod / 远端 ssh / exec 沙箱 |
| Dashboard SPA | 编译后的 Vite/React bundle，内嵌进 supervisor 同源服务 `/` | 工作机 HTTP |

监督结构是 Erlang/OTP 风格：one_for_one 重启、崩溃循环隔离、僵尸会话捕获、漂移排空（[health-patrol.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/health-patrol.md)，直接事实）。

### Windows 与 macOS：macOS 是一等公民（三种官方安装 + launchd 自启），Windows 无原生支持产物、官方唯一路径是 WSL 2 —— 明确选型缺陷

发布产物面直接决定了平台边界：goreleaser 配置 `goos: [linux, darwin]` × `goarch: [amd64, arm64]`、格式仅 tar.gz（[.goreleaser.yml](https://github.com/gastownhall/gascity/blob/main/.goreleaser.yml)），v1.5.0 Release 资产实测只有 4 个 tar.gz + `checksums.txt` + `spdx.json`，**无 windows 资产**；文档直接下载表也只有 macOS/Linux 四行（[installation.md](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/installation.md)，直接事实）。官方文档对原生 Windows **既未声明支持也未声明不支持**（未发现），唯一 Windows 表述是排障文档中的一节：「Gas City works under WSL 2 with a standard Ubuntu or Debian distribution. Install prerequisites using the Linux column… tmux requires a working terminal — use Windows Terminal or another WSL-aware terminal emulator.」（[troubleshooting.md](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/troubleshooting.md)，直接事实）。

**macOS（工作机可用路径，直接事实）**：
- 安装三种：① `brew install gascity`（自动 tap `gastownhall/gascity`，下载匹配架构 `gc` 资产并装齐六个运行时依赖 tmux/jq/git/dolt/flock/beads；实测 tap formula 显式依赖 beads/jq/tmux 与 `on_macos` 的 flock，dolt 仅在 caveats 提及）；② 从 Release 直下 `darwin_arm64` / `darwin_amd64` tarball + 自备依赖；③ 源码构建（`make` + Go 1.26.4+ + `brew install icu4c`，因 Dolt 的 CGO 传递依赖）。
- 权限与安全：`pgrep`、`lsof` 系统自带；`flock` 必须 `brew install`（macOS 不自带）；无需管理员权限，全部状态落在 `~/.gc/` 与城市目录。源码构建在 macOS 上会用稳定的本地 codesigning identity 签名（可用 `GC_SIGN_IDENTITY` / `GC_ADHOC_SIGN=1`），文档说明其作用是**让 macOS 在多次重建之间记住本地权限授权**并清理过期的 `com.apple.provenance`；而 **Release 下载二进制的 Gatekeeper/quarantine/公证要求，官方文档未说明**（未发现），校验手段只有 checksum、`gh attestation verify` 与 SPDX。
- 运行与自启：`gc init` 即注册进 supervisor 并立即启动城市；开机自启由 `gc supervisor install` 生成 launchd 代理 `com.gascity.supervisor`，`gc supervisor stop` 会禁用该代理以保证「停了就停在重启之后」。网络全部为本机 loopback（8372、9443、Dolt 随机端口）。
- 卸载：官方路径 `gc stop <city>` → `brew uninstall gascity` → `brew untap gastownhall/gascity`（`gc supervisor uninstall` 只清 gc 自己的旧服务文件）。**清理数据目录与残留状态的官方步骤：未发现**。可由文档反推的落盘位置：`~/.gc/`（supervisor.toml、cities.toml、credentials、keys、supervisor.sock/.lock）与城市内 `.gc/`（events.jsonl、site.toml、controller.sock/.lock、runtime/packs/dolt、incidents、worktrees）+ `.beads/`（Dolt 数据、config.yaml、backup）。

**Windows（直接事实 + 合理推导）**：无 `gc` 原生二进制；无条件硬依赖 tmux/git/jq/pgrep/lsof，加上默认 beads 路径的 dolt/bd/flock，而 `bd` 只发布 linux/darwin × amd64/arm64 四元组（[deps.env](https://github.com/gastownhall/gascity/blob/main/deps.env)）。因此**原生 Windows 不可行**，必须走 WSL 2 + Windows Terminal 之类的 WSL 感知终端（合理推导，依据产物矩阵与依赖表）。tmux 无法绕过：README 原文「tmux is the default session backend **and** the fallback, so it stays required even if you run agents on another backend.」（直接事实）；`herdr` 是「opt-in alternative to tmux」、`exec:` provider 可接任意复用器，但**没有任何文档声称存在「不用 tmux 的本地运行」**（直接事实 + 未发现）。是否提供 Windows 版 `herdr`：官方文档未说明。

**选型缺陷（明确）**：Windows 工作机只能以 Linux 子系统形态承载，意味着把它当作「本机进程 + 终端会话」的整套语义（tmux pane、loopback 端口、flock 单例、launchd/systemd）都落在 WSL 内，宿主机侧不感知。对要求 Windows 原生 Agent 承载的方案，Gas City 不可直接选用。

### 维护与成熟度：高强度开发但单人主导，属 early-adopter 级稳定线

8 个月内 v1.0.0（2026-04-21）→ v1.5.0（2026-10-05）共 7 个 minor/patch 稳定点，近 12 周周提交 63–449，32 个 CI workflow 含 rc-gate、CodeQL、govulncheck、Scorecard、容器扫描、mac 回归与 homebrew-tap-smoke，`v*` tag 受 ruleset 保护（直接事实）。但贡献高度集中（julianknutsen 占前 200 人提交量的 63.6%）、issue 与 PR 各约 931 / 600 且靠高频 triage 维持而非净收敛、上游 `bd` 的一次数据损坏即可迫使 Gas City 重发版本（v1.3.0 → v1.3.1）、`gc storage migrate` 自标 experimental 并警告「不要迁移无法恢复的生产 city」，且 1.6 三个优先项（reconciler v2 替换 legacy、infra bead 迁 SQLite、贡献者上手）全部未完成（[ROADMAP.md](https://github.com/gastownhall/gascity/blob/main/ROADMAP.md) + [CHANGELOG.md](https://github.com/gastownhall/gascity/blob/main/CHANGELOG.md)，直接事实）。

判定：**架构能力已成形、运维成熟度仍在补**；把它当作「可无人值守长期跑生产」之前，需先按后续验证建议做故障注入与成本实测（合理推导）。

### Local 优先适配判断：核心可完全本地、可离线运行，无必需官方后端；但本地服务默认无鉴权，是必须前置的约束

- **本地闭环成立**：内置 pack 直接内嵌在 `gc` 二进制里、`gc init`/`gc rig add` 从不克隆外部 pack 仓库（[system-packs.md](https://github.com/gastownhall/gascity/blob/main/docs/reference/system-packs.md)）；备份默认本地模式「keeps commits on this host」且不配置 `origin` remote；直下安装法明确面向「CI, containers, air-gapped hosts」（[installation.md](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/installation.md)，直接事实）。断网下需要联网的功能没有官方清单（未发现），但可判定安装/升级下载、`gh` 门禁、异地备份 push、pack 导入、registry 目录读取、远程 city context、K8s/ssh provider、Dolt remote 属网络项（直接事实）。
- **无必需官方云**：`gc` 本体不需要任何官方服务端。营销站存在两个商业云产品（Beads Team Server「Managed SaaS or self-hosted inside your VPC」；Gasworks「Coming soon · Join the waitlist」），`gascity.com` 是 Astro 营销站，文档站是纯 Mintlify；main 树里 `cmd_login.go` 的 `defaultServiceURL = "https://gascity.com"`，但实测 `/gc/v0/auth/cli`、`/gc/v0/me`、`/gc/v0/cities`、`/.well-known/gascity-service` **全部 404**（直接事实 + 合理推导：官方 service protocol 服务端未对外运行；hosted-onboarding 设计文档自述「Status: exploration/design. No code」）。pack 发现目录取自 `raw.githubusercontent.com` 的 `gascity-packs/registry.toml`，只有**发布**才需要官方托管 registry（`registry.gascity.com`，可用 `--registry-url` / `GC_REGISTRY_URL` 覆盖）。
- **必须知道的本地安全边界**：API 默认绑 `127.0.0.1`，非 loopback 默认只读（要写必须显式 `allow_mutations`），`X-GC-Request` 只是反 CSRF（「Any non-empty value is accepted」）而非鉴权；远程硬化 runbook 原文「The read plane is **FULLY UNAUTHENTICATED**… A network/TLS front is **REQUIRED, not optional**」；写面用操作员本地生成的 ed25519 私钥签名 grant（`X-GC-City-Write`），服务端只配公钥，缺 key 缺 ack 则 fail-closed 拒绝启动；控制器 Unix socket 无鉴权；凭据文件强制 0600 且拒绝可被 group/world 写的 `credentials.toml`（直接事实）。
- **多租户缺失**：service protocol 明写「There is no org or tenant field」，单副本、单租户，`gc run` 帮助自述「local **single-user** only; do not expose to untrusted callers without an authorization gate」。多人共享工厂属于商业 Gasworks，不在开源产品内（直接事实）。

### 开源/闭源与改造边界：MIT、无闭源核心、无 CLA；扩展靠配置与 provider 接缝，而非改代码

`LICENSE` 是纯 MIT（「Copyright (c) 2026 Gas City Contributors」，无额外条款、无 NOTICE）；仓库无 enterprise 目录、无闭源核心，主干 8714 个树对象完整可见；`CONTRIBUTING.md` 无 CLA/DCO（直接事实）。闭源在另一侧且明确「Commercial stays private (crucible/gasworks)」，合规护栏是自承「STRUCTURAL, not semantic」的 CI 边界检查（[engdocs/plans/hosted-onboarding_DESIGN.md](https://github.com/gastownhall/gascity/blob/main/engdocs/plans/hosted-onboarding_DESIGN.md)，直接事实）。

依赖许可：`gastownhall/beads` MIT、`dolthub/dolt` Apache-2.0、`herdrdev/herdr` Apache-2.0，组合无 copyleft 冲突；**风险点**：`gastownhall/gascity-packs` 在 GitHub API 报 `license: None`、`raw/main/LICENSE` 404，而它是 `go.mod` 的直接依赖（pack 内容被内嵌进二进制），再分发/商用授权依据不足（合理推导）；`go.mod` 同时 require `github.com/steveyegge/beads v1.3.1`，与 README 引导的 `gastownhall/beads` 为不同 module 路径，需核实（直接事实 + 未决）。Agent CLI 为各厂商专有，需自备订阅/key（Gasworks 页亦称「Bring your own keys. Zero markup.」）。

改造可行性（架构推导 + 直接事实）：三层扩展缝——**pack**（声明 Agent、formula、order、prompt 模板）、**provider 接缝**（`[beads] provider = bd | file | exec:<script>`、`mail` provider、session provider `tmux | subprocess | k8s | ssh | exec:<script>`）、**存储类路由**（`[storage]` 把 infra 类 bead 迁到编译进去的 `sqlite-beads` binding）。产品自我定位即「SDK」，角色零硬编码，因此改配置即可换舰队与流程；反过来，**操作员配置被视为可信代码而不是沙箱**：「Gas City intentionally runs operator-configured commands. Those commands are a feature, not a sandbox.」（[trust-boundaries.md](https://github.com/gastownhall/gascity/blob/main/docs/reference/trust-boundaries.md)，直接事实）。

## 调研目标

- 确认 Gas City 换代后的产品定位、核心概念与运行形态。
- 判定它是否具备 Stateful 调度能力，而非任务执行宿主或无状态任务消费者。
- 厘清工作对象模型、任务关系与生命周期、Agent 分派与连续性。
- 核验数据库与持久化、对外接口、消息通信、任务队列的形态与可剥离性。
- 独立核验 Windows 与 macOS 工作机的安装、运行、权限、网络与卸载。
- 给出 Local 优先适配判断与选型缺陷。

范围外：源码审计、竞品对比、遥测行为研究。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：多 Agent 编码工作流的**编排构建 SDK**——把「作业怎么做」写成 Formula，由编排器在工作机本地驱动 Agent 舰队跑完（[仓库描述](https://github.com/gastownhall/gascity) + [docs/index](https://github.com/gastownhall/gascity/blob/main/docs/index.mdx)，直接事实）。
- **价值主张**：交互式会话给你「更快的双手」，软件工厂给你「生产质量 + 机器速度」；review 与 gap-check 负责质量，并行铺开负责速度（直接事实）。
- **目标用户**：需要把编码任务规模化、长时间无人值守推进的个人工程师与平台团队；文档示例场景是「描述一次 feature，回来看到完成分支」，并明确 20–30 实例级并行不是单会话工具能覆盖的（[how-gas-city-works](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/how-gas-city-works.md)，直接事实）。
- **许可与成本**：MIT、免费，唯一开销是 Agent 自身的模型用量，按已有 harness 凭据计费（[FAQ](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/faq.md)，直接事实）。
- **仓库统计**（[GitHub API](https://api.github.com/repos/gastownhall/gascity)，截至 2026-10-15，直接事实）：创建 2026-02-22，最近 push 2026-10-15，默认分支 main，主语言 Go，1387 Stars / 446 Forks；`open_issues` 字段 1533，拆分为 931 个 open issue + 约 600 个 open PR。

### 核心流程

1. `brew install gascity`（或直下 tarball）拿到 `gc` + 六个运行时依赖。
2. `gc init ~/my-city`：建城市根、`.beads/`、`city.toml`，注册进 supervisor 并立即启动；默认模板内置城市本地 `mayor` Agent、`[workspace] provider = "claude"`、来自 bundled `dolt` pack 的池，以及作为平台基础设施的 `control-dispatcher`。
3. `gc rig add <path>`：把已有仓库注册为 rig，分配独立 `issue_prefix`，endpoint 继承城市。
4. 写/导入 pack：声明 Agent、Formula、Order 与 prompt 模板。
5. 建 bead 或 sling 一个 formula；编译器生成工作流根 + step bead + 控制 bead。
6. 编排器 30s tick reconcile：控制 dispatcher 推进门控与 fan-out，池按 `min`/`max` 与 `scale_check` 需求伸缩。
7. Agent 通过 `gc hook` 发现工作、CAS 认领、在 tmux/远端会话里执行、关闭 bead。
8. 失败由 retry / retry-eval / ralph / `abort_scope` 处理；巡逻负责重启、隔离与收养。
9. `workflow-finalize` 聚合结果关闭根，pass 时沿 `gc.source_bead_id` 传播闭合。
10. 人在 dashboard / CLI / API / SSE 事件流观察，`gc doctor` 体检。

（[Quickstart](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/quickstart.md)、[Tutorial 01–07](https://github.com/gastownhall/gascity/blob/main/docs/tutorials/index.md)、[formula-spec-v2](https://github.com/gastownhall/gascity/blob/main/docs/reference/specs/formula-spec-v2.md)，直接事实）

### 功能地图与边界

- **工作对象系统**：bead 三态契约、依赖类型、容器（convoy）自动关闭、`gc.*` metadata 命名空间。
- **Formula v2 图执行**：`needs` DAG、`priority` 0–4、`check` 循环、`retry`（`on_exhausted` = hard_fail/soft_fail）、`drain`、`on_complete`、scope（setup/member/teardown + `abort_scope`）、workflow-finalize；v2 以 `[requires] formula_compiler = ">=2.0.0"` 显式启用（`contract = "graph.v2"` 已弃用并会被 `gc doctor` 告警）。
- **编排器**：one_for_one 监督、崩溃循环隔离、僵尸捕获、漂移排空、会话收养、占空比 order 泳道、池容量控制。
- **Agent 侧**：16 个 harness、五条正交轴、pull 式发现、CAS 认领、prompt 模板体系、handoff。
- **通信**：bead-backed mail（含 exec provider）、nudge、事件总线与 SSE、extmsg 外部客户端绑定/分组/参与者。
- **接口**：Huma 类型化 HTTP + SSE `/v0` 控制面、OpenAPI 3.1 为唯一事实源、生成的 Go 与 TypeScript 客户端、内嵌 dashboard、`/svc/*` 透传、`/hook/*` webhook 接收（HMAC/ed25519 校验原始 body）。
- **可插拔底座**：beads/mail/session provider 接缝，`[storage]` 存储类路由到 SQLite binding。
- **明确不含**：多租户/组织模型、官方托管必需服务、开箱沙箱隔离（配置=可信代码）、产品级 Docker 镜像/compose（仅 `contrib/k8s` 与 `contrib/mayor-chat` 样例清单）、Windows 原生支持。
- **规格中「接受但不生效」的构造**（作者不可依赖，[formula-spec-v2 §4](https://github.com/gastownhall/gascity/blob/main/docs/reference/specs/formula-spec-v2.md)，直接事实）：`until` 循环只跑一次（label 无人读）；`gate` 的 `type` 词表（gh:run/gh:pr/timer/human/mail）不校验且零内置 watcher；`waits_for` 的 all/any-children 语义无人解释；`vars.<name>.type` 不做强制。另有踩坑风险：**未知 step key 被静默忽略，依赖直接消失**（原文警告）。

### 维护状态与版本演进

- **维护强度（极高）**：最新提交 `3e3350d`（2026-10-15，julianknutsen）。近 12 周周提交量 63–449（中位约 110），最后一周 449（[GitHub API](https://api.github.com/repos/gastownhall/gascity/commits/main)，直接事实）。但集中度极高：贡献者列表 212 人（含匿名），前 200 人合计 6960 次提交中 **julianknutsen 4430（63.6%）**、第二名 735（10.6%）→ 实质是单一维护者主导，与 SUPPORT.md 自称的「small team」一致（直接事实 + 合理推导）。
- **Issue 收支靠高频 triage 维持，不是净收敛**：全时段 open 931 / closed 920；2026-10-01 起新开 113、关闭 92，近 7 天关闭 44（直接事实）。
- **发布门禁齐备**：`.github/workflows` 32 个（ci、23KB 的 rc-gate、release/rc-release、codeql、govulncheck、scorecard、container-scan、homebrew-tap-smoke、nightly、mac-regression），RELEASING.md 记录 `v*` tag 保护 ruleset 与专用 tagger App（直接事实）。
- **版本演进主线（v1.0 → v1.5）**（[CHANGELOG.md](https://github.com/gastownhall/gascity/blob/main/CHANGELOG.md)，直接事实）：
  - **v1.0.0（2026-04-21）立模型**：Pack V2 城市布局、声明式 `[[agent]]` 与运行时 session bead 分离、Supervisor API 迁 Huma/OpenAPI、order 的 "gates" 改名 "triggers"（自 v0.15.1 起 610 commits）。
  - **v1.1.0（2026-05-06）转运维就绪**：455 commits，聚焦 session 生命周期恢复、controller dispatch 性能、managed Dolt 加固、发布溯源与 Homebrew 分发。
  - **v1.2.0（05-29）/ v1.3.0（06-18）**：Packs v2 成为默认（identity/lock/overlay/registry 元数据显式化）；**v1.3.1 直接取代 v1.3.0**，因为后者构建在有已知数据损坏的 bd v1.0.5 上——上游依赖 pin 可单独驱动一次发布。
  - **v1.4.0（07-24）run 中心化 dashboard/API**；破坏性变更：每个 graph-owning scope 必须配 `control-dispatcher`，升级需 `gc doctor --fix`。v1.4.1（08-15）/ v1.4.2（09-18）为 Beads 1.3.0 对齐补丁。
  - **v1.5.0（10-05，最新稳定）**：强制 pin bd 1.3.1（否则 native store 拒用、backup/purge 跳过）、新增标为 experimental 的 `gc storage migrate`、pool/ephemeral 会话身份改用 session bead id（`GC_AGENT`/`BEADS_ACTOR`）、重试计数迁到 `gc.retry_attempt`、新城市 import key 改 `[imports.gc]`、`secrets.env` key 须为 shell 标识符、reaper/jsonl-export/mol-dog-backup 改走 bd、带 remote 的 Dolt 库不再被 compactor 压平、移除 seat-claim backstop 与 `execution.claim_stalled` 事件。
  - 1.x 内确有破坏性变更，但每个版本都带 "Upgrading Notes" 并配 `gc doctor --fix` 与升级文档；v1.5.0 之后 10 天无新版（截至 2026-10-15）。
- **配套版本纪律**：Gas City 1.5 要求 `bd` 1.3.1；Beads 1.3 把数据库 schema 从 v53 迁到 v66，需一次性 `gc dolt restart` → `gc bd --city/--rig … migrate schema` → `gc start`/`gc doctor` → `recompute-blocked`，且「An older `bd` cannot open a migrated database」（[upgrading.md](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/upgrading.md)，直接事实）。Dolt 地板：托管检查拒绝 2.1.0 以下与预发布；1.86.2 之前缺上游 GC/writer 死锁修复（dolthub/dolt `ccf7bde206`），重写下会挂住 `dolt_backup sync`（直接事实）。
- **生态入口**：`brew install gascity` 且已进入 **homebrew-core**（formulae.brew.sh 返回 stable 1.5.0 / MIT / 未弃用；RELEASING.md 仍写 "submission in progress"，属文档滞后）；GoReleaser 出 4 元组 tar.gz + sha256；**无 npm 包**（`gascity`、`@gascity/cli` 均 404）；有 `.devcontainer`、`contrib/` Dockerfile、Bazel CI 门禁。pack registry 命令面为 `gc pack registry list/search/show/refresh/publish/login`，目录来自 `gastownhall/gascity-packs`（96 stars、230 open issues、pushed 2026-10-11），缓存默认 24h；`pack.toml` 存 durable source URL + version 而非 handle；pack 生命周期 hooks 仍停在未合并 PR #5677（2026-08-26 开）。社区入口：README 挂 Discord（guild 1462817445562814505），GitHub Discussions 已开但搜索 0 条（直接事实）。
- **真实反馈主题**（样本：近期 updated 前 40 + open 前 40 + 2026-09-25 后新建 154 条 issue；样本，不代表整体）：
  1. **会话/调度状态收敛**——同一 durable vs runtime state 分歧家族反复出现：#3872（07-02，8 评）、#1029（04-20 至今仍 open）、#7897（10-14，一个慢 prepare 令整批 lease 过期）；正是 1.6 路线图第一优先级。
  2. **bd/Dolt 版本 pin 耦合**——v1.3.1 因 bd 1.0.5 数据损坏取代 v1.3.0，v1.3.5/v1.4.2 为对齐补丁，PR #7851（10-14）新增 pin lockstep 与 PATH skew 告警。
  3. **资源占用与 token 成本**——#2463（05-21，14 评：空闲 city 仍每秒 7+ 个 `bd` 子进程）、#2201（05-15：Dolt 1 小时耗光 MacBook M5 电池）、#6293（09-11：worker 启动上下文约 131K tokens 直接超窗）、#7804（10-13：reload 累积 610 个 sql 连接池）。
  4. **harness 集成细节**——#7936（10-15 Copilot 启动 prompt 过早粘贴未提交）、#5872（09-01，8 评：`.codex/hooks.json` 每次 reconcile 叠加）、#6982（10-04 OpenCode 重复提交 role）。
  5. **文档/配置缺口**——kind=docs 共 48 条，如 #7179（无跨 Beads schema 迁移流程）、#6820（文档写了不存在的 extmsg 端点）、#7899（10-14 `gc rig remove` 抹掉 `city.toml` 全部注释）。
  6. **外部声量**——HN 上唯一相关条目是 Yegge 的公告文《Welcome to Gas City》（2026-05-04，33 points / 55 comments），高赞集中在「看不懂它解决什么」与「抽象自嗨、示例不足」，针对叙事而非实操；维护者侧另有 Chris Sells 的 1.0 announce 与官方博客各一篇。样本量小，不构成采用度结论（社区样本 + 证据边界）。
- **成熟度判定（early-adopter）**：官方称 v1.0.0 为 "First stable release"、v1.5.0 为 stable 并取代 1.4.2，但 v1.1.0 自述是 "broad stability … release"，RC 文案要求「在可恢复的 city 上试用并报告崩溃」；`gc storage migrate` 明标 experimental 且「不要迁移无法恢复的生产 city」；ROADMAP 明示「reflects current thinking, not commitments… dates deliberately absent」，1.6 三个优先区全部未完成、性能目标等基准存在才给数字（直接事实）。结论：**可安装、有门禁、有迁移指引的 1.x 稳定线，但核心收敛与依赖 pin 仍在高频修补**（合理推导）。

## 技术架构调研

### 系统全貌与运行形态

三层结构：**supervisor（机器级守护）** → **每城 controller（reconcile 循环）** → **执行面（Agent 会话 + bd/Dolt 存储）**（[design/machine-wide-supervisor-v0.md](https://github.com/gastownhall/gascity/blob/main/engdocs/design/machine-wide-supervisor-v0.md)，直接事实）。三件与角色无关的机器是 Orchestrator、Bead store、Event bus；其余全是配置（直接事实）。

范式判定：**Stateful 调度器 + 外置工作对象存储（Dolt/可换）+ 编译式 formula 图 + 控制 bead 驱动 + tmux/多 runtime 会话宿主**。

### 主要组件与核心链路

**链路 A（工作流）**：建 bead → `gc sling` 路由（写 `gc.routed_to`/assignee/`pool:`，前置环检测）→ Agent `gc hook` 按 `work_query` 发现 → `bd update --claim` CAS 认领一个 → 会话执行 → 关闭 → 容器自动关闭 / `gc.source_bead_id` 传播。

**链路 B（编排流）**：formula TOML → 编译器（v2）→ 工作流根 + step bead + 注入的控制 bead（retry / retry-eval / check / ralph / fanout / drain / scope-check / workflow-finalize）→ 控制 dispatcher 在 store 作用域路由（`core.control-dispatcher`、`<rig>/core.control-dispatcher`，`max_active_sessions = 1`）独占执行 → 池 allocator 依 `min`/`max` 与 `scale_check` 调并发 → order 泳道按五类触发器派发 → 巡逻做重启/隔离/收养 → 事件写 `.gc/events.jsonl`（单调 seq）供 SSE 回放。

**规格级不变量**：「**The orchestrator executes every control bead.** … No agent participates in control execution.」/「**Agents execute only plain work beads.**」（[formula-spec-v2 §0.2](https://github.com/gastownhall/gascity/blob/main/docs/reference/specs/formula-spec-v2.md)，直接事实）；close-ownership invariant（编译图永不把工作阻塞在关闭它的那个控制 bead 上，违反即拒绝编译）（直接事实）。

跨进程/网络边界：CLI ↔ Unix socket ↔ controller；controller ↔ `bd` 子进程 ↔ Dolt（本机 MySQL 协议）；controller ↔ tmux pane（send-keys/抓取）；会话 ↔ 各厂商模型 API；可选 → git remote、K8s API、ssh（合理推导 + 直接事实）。

### 主要依赖

- **无条件硬依赖**：tmux（默认后端 **且** fallback）、git、jq、pgrep、lsof（README 标 Always；pgrep/lsof macOS 自带）。
- **仅默认 beads provider 需要**：dolt（≥2.1.0）、bd、flock。可真正剥离：`[beads] provider = "file"` 或 `GC_BEADS=file`「no dolt/bd/flock needed」；第三条路是 `GC_BEADS=exec:<script>`（解析序 `GC_BEADS` → `[beads].provider` → `bd`）。代价：file/内存 store 只建简化 molecule 根，完整 formula 执行要求 `bd`；两个内置 order（jsonl-export、reaper）在 file 模式「skip with a one-line message」。tmux/jq/pgrep/lsof **不因 file 而免**（直接事实）。
- **条件依赖**：`gh` 可选（「Gas City can run without `gh`」）；agent CLI 按 provider；`herdr` 需自备二进制；K8s provider 需 kubectl/kubeconfig。
- **构建依赖**：`make` + Go 1.26.4（`go.mod` 钉）+ ICU（Dolt 的传递 CGO 依赖）；发布二进制 `CGO_ENABLED=0`。
- **供应链注记**：CHANGELOG 记录原生 bd store 把上游 Beads/Dolt Go 库直接链进 `gc`，「increases binary size and supply-chain surface through the Dolt/Vitess and cloud-provider SDK dependency closure」，不想走这条路可保留 `GC_BEADS_FORCE_FALLBACK=1` 或 `GC_BEADS=file`（直接事实）。

### 接口形态

- **人/脚本**：`gc` CLI（含 `gc bd --rig` 这类纯 cd+exec 语法糖，无联邦层）、内嵌 dashboard SPA（同源 `/`）、host-side `/api/*` BFF。
- **类型化控制面**：Huma HTTP + SSE，`/v0` 命名空间，OpenAPI 3.1（`docs/reference/schema/openapi.json`）是权威契约，Go 客户端与 dashboard 的 TS 客户端均从其生成；资源含 cities、city status/readiness、agents、beads、sessions（submit/interact/transcript/output stream）、events（supervisor 与 city 两级 + stream）、config/packs、extmsg（adapters/inbound/outbound/bind/bindings/groups/participants/transcript）。`POST /v0/city` 是异步操作，靠 `request_id` 与事件流确认，不轮询（[api.md](https://github.com/gastownhall/gascity/blob/main/docs/reference/api.md)、[api-control-plane.md](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/api-control-plane.md)，直接事实）。
- **三个刻意非类型化的面**：`/svc/*`（外部 workspace-service 原始透传）、`/hook/*`（webhook 接收，HMAC/ed25519 对**原始 body** 签名，因此不能被 Huma 解码；仍受 mux 级写面 grant 与 R2 网络边界约束）、`/` 与 `/api/*`（dashboard）。
- **鉴权**：见 Local 优先小节——读面无鉴权、写面 ed25519 grant、`X-GC-Request` 仅反 CSRF、非 loopback 默认只读、`allowed_hosts` 否则 421。
- **Agent 接口**：prompt 模板 + `gc hook`/`gc mail`/`gc sling` 等 CLI 约定；ACP transport 走 stdio JSON-RPC。
- **控制器内部 IPC**：无鉴权 Unix socket（`.gc/controller.sock`），fsnotify 配置热重载。

### 持久化方式

- **默认：外部但本机的 Dolt sql-server**（非内嵌、非内存）。每城一个进程，只绑 `127.0.0.1`，端口记在 `.beads/dolt-server.port`；城市与所有 rig 共用这一台服务器，靠 `issue_prefix` 在 **`bd` 查询层**做硬过滤（`WHERE id LIKE 'riga-%'`）实现逻辑隔离——既非多库、也非联邦视图；跨 rig 汇总需直查 Dolt（[internal/beads-topology.md](https://github.com/gastownhall/gascity/blob/main/docs/reference/internal/beads-topology.md)，直接事实）。`gc.endpoint_origin` 四值中默认城市只会出现 `managed_city` 与 `inherited_city`，另两值（`city_canonical`、`explicit`）用于指向外部 Dolt。
- **可剥离性**：`bd` provider 可换 `file`（无 dolt/bd/flock）或 `exec:<script>`（用户自供后端，JSON 协议走 stdin/argv，直接 exec 非 `sh -c`）；`sqlite`/`sqlite-cgo`/`coordstore` 这三个旧 coordination-store provider 已移除并硬报错。
- **内嵌 SQLite 作为可选存储类**：`[storage]` 可把 infra 类 bead（order 跟踪、wisps、controller/session 簿记）迁到编译进去的 `sqlite-beads` binding，根路径默认 `.gc/store`；官方 runbook 称五类基础设施迁到单个 SQLite 引擎后基础设施类读显著更快，1.6 路线图表明「Dolt keeps the versioned work beads」。限制：依赖边 payload 上报能力受引擎限制（当前工作 store 引擎无法报告 edge payload 时该拆分永久不可用，SQLite 或原生 Dolt 可以）（[split-storage-classes.md](https://github.com/gastownhall/gascity/blob/main/docs/runbooks/split-storage-classes.md)，直接事实）。
- **其他持久面**：`.gc/events.jsonl`（append-only 事件）、`city.toml`/`pack.toml`/`.gc/site.toml`（配置与本机身份）、`~/.gc/`（supervisor 状态、凭据 0600、ed25519 key）、git worktree 与 `.gc/worktrees/`（会话工作区）。
- **不持久（官方明列）**：crash tracker 历史、idle tracker 时间戳、order 派发状态。

### 通信方式

- **Agent ↔ 中心**：拉取式 `gc hook`（HTTP 到 API，或 CLI 直连 store）；认领原子性在 `bd --claim` CAS。
- **Agent ↔ Agent**：mail = `Type="message"` 的 bead，默认 provider 是 beadmail（直接落 beads.Store），另有 `exec` 脚本 provider；`gc mail send/inbox/read/reply/archive/thread/count`。**无投递确认**，且 inbox 是 `store.List()` 全表过滤（性能上界随工作 store 规模线性）。
- **中心 ↔ 会话**：tmux send-keys + pane 抓取；或 ACP JSON-RPC over stdio；或 subprocess/K8s/ssh/exec provider；nudge 在 legacy 模式下会为每个会话自动 spawn 一个 `gc nudge poll` 进程。
- **观测**：事件总线写 `.gc/events.jsonl`（单调 seq）→ `/v0/events/stream` SSE，客户端按标准 SSE 重连协议从 last index 回放；错误目录 typed、`title`/`detail` 与运行时状态码解耦。
- **外部入站**：`/hook/{name}` webhook（原始 body 验签）与 extmsg 面（把外部 turn 投给被路由的 Agent）。
- **进程内**：flock 单例 + Unix socket + fsnotify 热重载；控制器 tick 默认 30s。

### 任务队列形态

队列就是工作对象存储本身，**持久化**、中心驱动判定可执行性、Worker 拉取认领：可执行集合由 store 的依赖闭锁算出，认领次序为「优先级优先 + 带内 FIFO」，并发上限由 Agent 池的 `min`/`max` 与 `scale_check`/`EffectivePoolDemandQuery` 决定，控制泳道（`control-dispatcher`，`max_active_sessions = 1`）保证控制 bead 单实例推进；order 是另一条**占空比泳道**，cooldown 用闭合的 `order-run:<scopedName>` bead 表达（默认保留 10 条、7 天剪枝）（直接事实）。内存态队列不存在，但派发游标与巡逻类簿记为内存（直接事实）。无独立 broker（hardened runbook：「no hosted edge, no external broker」）。

### 部署形态

#### 工作机安装（Windows / macOS）

**macOS**：`brew install gascity`（推荐，一次装齐 gc + tmux/jq/git/dolt/flock/beads）/ 直下 `darwin_arm64|amd64` tarball（面向 CI、容器、气隙主机）/ 源码构建（`make` + Go 1.26.4+ + `brew install icu4c`）。权限：无需管理员；`flock` 需 brew；本地权限授权可用稳定 codesigning identity 在重建间保持（Release 二进制的 Gatekeeper/公证要求：官方文档未说明）。网络：安装期需 GitHub/brew；运行期全 loopback；开机自启为 launchd `com.gascity.supervisor`。停止与查看：`gc stop`（先停 Agent 再停该城 Dolt 并注销城市）、`gc restart`、`gc status`、`gc supervisor status/logs/stop --wait`、`gc doctor`、`gc dashboard`。升级：`brew update && brew upgrade gascity`（formula 依赖 beads，会一起升 `bd`）后 `gc start` 逐城拉起；直下法「The `gc` binary is a single static file — overwriting it is safe」，但需自行装匹配版 `bd`；跨 Beads 1.3 需一次性 schema 迁移。卸载：`gc stop` → `brew uninstall gascity` → `brew untap gastownhall/gascity`（`gc supervisor uninstall` 只清 gc 旧服务文件）；**数据目录清理官方步骤未发现**，需自行删除 `~/.gc/` 与各城 `.gc/`、`.beads/`。

**Windows**：**无原生支持产物，官方唯一路径是 WSL 2 + Ubuntu/Debian**，终端需 WSL 感知（Windows Terminal）；依赖按文档的 Linux 列安装。原生 Windows 不可行的直接依据：发布矩阵无 windows、`bd` 只发四元组（linux/darwin × amd64/arm64）、硬依赖 tmux/flock/pgrep/lsof 在原生 Windows 缺失、且 tmux 作为默认后端与 fallback 不可绕过（直接事实 + 合理推导）。

**其他官方形态（区分于工作机安装）**：开发者路径 = 源码构建、devcontainer（`devcontainers/go:1.26-ubuntu-24.04` + apt 装 tmux/jq/libicu-dev + 脚本装 dolt/bd + `make install`，命名卷 `gc-cities` 让城市活过容器重建）、Bazel；服务器路径 = `remote-hardened-city` runbook（自托管直暴露写面，单 controller 副本，必须自带网络/TLS 前置，客户端经 HTTPS+SSE 远程写，`gc` 拒绝明文 http 的非 loopback URL）、`contrib/k8s` 清单（controller/Dolt/mail 的服务器侧部署）。**产品自身无官方 Docker 镜像/compose**（未发现）。K8s provider 的定位是「把 Agent 会话跑在远端 Pod」，不是把产品部署到 K8s；`remote_match` 支持混合路由（部分会话上 K8s、其余留本地 tmux）。

#### 主体功能运行位置

主体功能运行在**工作机本地**：supervisor、controller、Dolt、`bd`、tmux 会话与 dashboard 全在本机 loopback 面。可选把 Agent 会话放到 K8s Pod / ssh 主机 / exec 沙箱（远程 runtime），或用硬化城市把整套控制面放到自托管服务器、工作机只当客户端（直接事实）。

**Local 优先适配判断：满足**——核心可在完全离线、零官方服务的前提下运行；内置 pack 内嵌二进制、备份默认本地、气隙安装路径有文档。

**Local 优先选型缺陷（三条）**：① Windows 工作机无原生形态，必须 WSL 2；② 本地 API 读面完全无鉴权、控制 Unix socket 无鉴权，一旦为非 loopback 打开就必须自带网络/TLS 前置，多用户共享不在开源产品能力内；③ 默认 beads provider 绑定外部 Dolt + `bd`（含 1.86.2 之前的死锁风险与跨版本 schema 迁移纪律），用 `file`/`exec` 剥离则失去完整 formula 执行能力（直接事实 + 合理推导）。

#### 云端形态

- **产品本体无必需云端组件**；`gc` 不需要官方后端即可完整运行（直接事实）。
- **存在但尚未确认上线的托管轨道**：`internal/cliauth` + `cmd/gc/cmd_login.go` 的 `defaultServiceURL = "https://gascity.com"` 在 main 树上；protocol 文档刻意只写「`https://gascity.com` is one such server. So is any other.」，即符合性可由第三方实现；但实测 `gascity.com` 的 `/gc/v0/auth/cli`、`/gc/v0/me`、`/gc/v0/cities`、`/.well-known/gascity-service` 均 404，hosted-onboarding 设计文档自述「exploration/design. No code」，且明确**反对**官方出零配置开源参考服务端（「that's an OSS RCE footgun」）→ 判定：托管身份/运行边缘目前是规范 + 客户端，非可用服务（直接事实 + 合理推导）。
- **registry 两面**：读目录 = GitHub raw（`gascity-packs/registry.toml`），无需官方服务；发布 = 托管 `registry.gascity.com`（可覆盖 URL），「The hosted registry reviews and lands the change before others see it」。
- **商业云产品（不属于开源本体）**：Beads Team Server（早期访问，Managed SaaS 或 VPC 自托管；Kanban/依赖图/Gantt/run detail/成本报表）与 Gasworks（waitlist「Coming soon」、多操作员共享工厂、`works.gascity.com`、private repo）。相关 GitHub 仓库 API 404，无法区分私有与不存在（直接事实 + 未决）。
- **第三方服务关系**：Agent CLI 的模型请求必然出网且不由 Gas City 代理；DoltHub 只被引用 release 与 commit，未作为服务使用，「Dolt remote」是用户自配；`herdr.dev` 为 opt-in 复用器；README 顶部 Blacksmith 为 CI 赞助商标，`go.mod` 无相应依赖 → 判定为构建基建而非运行时依赖（合理推导）。
- **自动更新检查**：官方文档未说明存在版本自检或 `gc self-update`（未发现）。
- **不接官方托管会失去**：托管 registry 的发现目录与审核发布通道、`gc login/whoami/logout`（需符合性服务端）、以及商业侧的团队看板与多操作员能力；本地调度与执行能力不损失（直接事实）。

## 未决项与证据边界

- **可靠性内核的真实形态未决**：默认仍是 `legacy` reconciler，v2 为 trace-only 骨架；1.6 计划删除旧路径。届时 `depends_on`、`scale_check`、identity circuit breaker、`max_session_age`、stall timeout 等配置在 v2 下会被拒绝，意味着升级期存在配置兼容成本（直接事实 + 未决）。
- **重启后一致性边界未决**：不变量文档自承 A7 在 main 上两条路径均未满足、A8 类「None crosses a restart」、A13 的 keyed live view 推迟到 P5。因此「controller 崩溃/升级后完全自动收敛」目前是路线图目标而非已证事实（直接事实）。
- **认领纪律的强制层未决**：单领一件、失败释放等由 prompt 模板约定，Go 侧不强制；跨 harness 的 prompt 遵从率无法从文档判定，需实测（证据边界）。
- **规格与实现存在缝隙**：formula-spec-v2 §4 列出四项「接受但不生效」构造，且未知 step key 静默忽略会吞掉依赖；文档以「normative for implemented behavior」自限，说明历史承诺仍存在（直接事实）。
- **`herdr` 与 Windows 组合未决**：`herdr` 文档称其为 tmux 的 opt-in 替代，但未说明是否有 Windows 构建；据此不能推断 Windows 可脱离 WSL（未决）。
- **文档口径不一致**：`bd` 最低版本三处不一致（1.0.0 / 1.0.4 / 1.3.1）；`[beads].provider` 描述里的迁移建议（「migrate to "doltlite"」）与 CHANGELOG 记录的 doltlite 移除相冲突；`go.mod` 中 `steveyegge/beads` 与 `gastownhall/beads` 两条 module 路径并存（直接事实 + 未决）。
- **供应链授权风险未决**：`gastownhall/gascity-packs` 无 LICENSE 文件却是 `go.mod` 直接依赖并被内嵌进二进制；商用/再分发依据需向维护者确认（未决）。
- **托管服务上线状态未决**：`gascity.com` 服务端点 404 只代表当下未对外提供，官方文档未声明其计划（未决）。
- **MCP 口径自相矛盾**：main 上确有 `internal/materialize/mcp_project{,_lock,_safety}.go`，CHANGELOG v1.0.0 记「Provider-native MCP projection for Claude, Codex, Gemini」，troubleshooting 描述 server 被投影进 `.cursor/mcp.json`；但 guides/capabilities 文档仍写「MCP is list-only today」，config reference 把 pack 的 `mcp`/`mcp_append` 附件字段标为 **tombstone（被 materializer 忽略，"removed in v0.16"）**。需以现场 `gc mcp --help` 复核（直接事实 + 未决）。
- **支持渠道口径冲突**：README 挂 Discord（guild 1462817445562814505）且 GitHub Discussions 已开，而 SUPPORT.md 称「暂无独立讨论区或实时支持渠道」；RELEASING.md 又称 homebrew-core 提交进行中（实际已收录）——文档滞后于现状（直接事实 + 合理推导）。
- **运行成本未量化**：多个 issue 报告空闲城市仍每秒 7+ 个 `bd` 子进程、Dolt 快速耗电、worker 启动上下文约 131K tokens、reload 累积 sql 连接池；官方无资源基线（ROADMAP 明确「Numeric targets follow once a benchmark exists」）→ 单机可承载的城市/池规模边界**未发现**（社区样本 + 未决）。
- **遥测与数据外传未核验**：本轮按 RUNBOOK 要求排除遥测研究，文档中出现「dashboard-local telemetry sink for browser error logs」一句，未展开核验其范围与落点（证据边界）。
- **快照边界**：证据取自 2026-10-15 的 main 分支与 v1.5.0 发布资产；产品创建仅 8 个月、63.6% 提交集中于一人、issue 收支靠高频 triage 维持、路线图无日期承诺，结论有效期显著低于成熟产品（合理推导）。

## 后续验证建议

- **调度能力实测优先于文档采信**：跑一个中型 formula（含 `check`、`retry`、scope + `abort_scope`、teardown），在 step 执行中分别 kill controller、kill 会话、kill Dolt，验证「收养存活会话 + bead 不丢 + 重试预算正确」的实际表现，并记录三类内存 tracker 丢失造成的可观察差异。
- **认领并发正确性**：对同一高优先级 bead 并发启动多个 Agent，验证 `bd --claim` CAS 是否真能阻止双领，以及 prompt 纪律被违反时的下游后果。
- **持久化选型代价**：分别在 `[beads] provider = bd`、`file`、`exec:<script>` 下跑同一 formula，量化「完整 formula 执行能力」的缺失面（FileStore 只建简化 molecule 根）；同时验证 `[storage]` 迁 `sqlite-beads` 后的基础设施读性能与「edge payload」限制。
- **macOS 工作机验证点**：首次 `brew install` 后 Gatekeeper 对 `gc`/`bd`/`dolt` 的实际拦截行为、`flock` 缺失报错、launchd 代理重启后自启、以及非 loopback 打开 `allow_mutations` 后的 421/只读行为。
- **Windows 可用性判定**：若 Windows 工作机是硬要求，需在 WSL 2 + Windows Terminal 下端到端验证 tmux pane、loopback 端口暴露（WSL2 端口转发语义）、文件跨系统访问与 git 性能；不要假设原生 Windows 可行。
- **安全前置验证**：任何非 loopback 暴露前，按 hardened-city runbook 搭 TLS 前置、ed25519 grant 与 `allowed_hosts`，并验证读面无鉴权带来的 bead/mail/transcript/事件流全量泄露风险是否可接受。
- **运行成本实测**：零负载城市静置 30 分钟，统计 `gc`/`bd` 子进程 spawn 频率、Dolt CPU 与功耗、`bd` 连接数随 reconcile 的增长，以验证 issue 报告的「空闲仍每秒 7+ 子进程」「reload 累积连接池」是否在当前 v1.5.0 复现；同时测一次典型 worker 启动的输入 token 量（#6293 报约 131K）。
- **MCP 现状复核**：现场跑 `gc mcp --help` 与一次 pack 导入，确认投影是 list-only 还是已生效（文档三处口径冲突）。
- **Local 优先结论**：Gas City 对 macOS/Linux 工作机是完全 Local-first 的可选方案；对 Windows 工作机需接受 WSL 2 承载；对需要多租户或团队共享工厂的场景，开源本体不提供该能力，需自建或走商业产品。
