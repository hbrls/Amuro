# 支持 Task 前后依赖的开源项目与开放规范调查

> updated_by: Codex - GPT-6
> updated_at: 2026-11-01  Asia/Shanghai
> evidence_window: 2026-11-01；既有 NERV-001 至 NERV-004 报告、公开官方文档、公开源码与 GitHub API 元数据
> status: 已完成本轮筛选；版本、许可证与能力以链接所指公开快照为准

> 补充说明：关于 `workspaceId`、`sessionId` 及 `goals/stories/specs` 长文本字段的新增判定，请以 [WORKSHOP-098](./WORKSHOP-098.md) 为准；本报告主要保留前后依赖关系与 DAG/Tree 的初轮调查。

## 交付结论

### 既有调查已确认多个符合项，公开检索又补出新候选

本次需求的最低判定是：产品存在真实的 Task／Issue／Work Package 等任务对象；能持久表达 `Task 1 -> Task 2 -> Task 3` 的前后或阻塞关系；最好还能表达树或 DAG。既有调查中确认的候选是 **Gas City、Cline Kanban、Hermes Studio、Mission Console、Plane、Wekan、tududi、Taskwarrior、Huly、Netflix Maestro、Trigger.dev、Agently**。公开网络新检索并核验补充了 **Beads、OpenProject、Redmine、Vikunja、Gitea、GanttProject、TaskJuggler、Apache Airflow、Open Workflow Specification 与 BPMN 2.0**。

旧报告中部分产品曾因“不具备完整 Stateful Agent 调度中心”而被排除；这不是本次需求的排除条件。比如 Wekan、tududi 的依赖目前偏任务关系或可执行性查询，仍然满足“Task 管理 + previous/next 数据关系”；Gas City、Hermes Studio、Mission Console、Maestro、Trigger.dev 则进一步具有执行或工作流推进能力。

### 最贴合需求的第一梯队是 Beads、OpenProject、Redmine、Vikunja、GanttProject、TaskJuggler 和 Gas City

- **Beads**：MIT；任务是持久化 issue/bead，支持 blocking、parent-child、conditional-blocks、waits-for，多前置依赖、`bd ready` 自动判断所有阻塞依赖已关闭、依赖树与写入期环检测。它同时面向 Agent 长周期任务，数据结构和命令都直接围绕依赖图设计。[官方 README](https://github.com/gastownhall/beads)、[Dependencies and Gates](https://github.com/gastownhall/beads/blob/main/docs/core-concepts/dependencies.md)、[LICENSE](https://github.com/gastownhall/beads/blob/main/LICENSE)
- **OpenProject**：GPL-3.0；Work Package 是持久任务对象，官方文档直接定义 `Predecessor (before) / Successor (after)`，支持 lag；自动排程模式下，前置任务延期会推动后继任务，另有 Blocks/Blocked by 和父子关系。[官方关系文档](https://www.openproject.org/docs/user-guide/work-packages/work-package-relations-hierarchies/)、[GitHub](https://github.com/opf/openproject)
- **Redmine**：GPL-2.0；Issue 支持 subtasks、`blocks/blocked by`、`precedes/follows`。官方说明中，若 B follows A，则 B 的开始日期受 A 的结束日期约束；blocks 关系可阻止任务关闭。[官方 Issue 文档](https://www.redmine.org/projects/redmine/wiki/RedmineIssues)、[GitHub](https://github.com/redmine/redmine)
- **Vikunja**：AGPL-3.0；TaskRelation 枚举直接包含 `subtask/parenttask`、`blocking/blocked`、`precedes/follows`，关系保存为任务间持久记录，源码对父子关系做环检测。[关系模型源码](https://github.com/go-vikunja/vikunja/blob/main/pkg/models/task_relation.go)、[项目主页](https://vikunja.io/)、[GitHub](https://github.com/go-vikunja/vikunja)
- **GanttProject**：GPL-3.0；官方 Scheduler 文档明确把任务依赖定义为 predecessor/successor，默认 Finish-Start 约束要求 successor 不能早于 predecessor 完成；调度器会扫描任务的全部依赖并计算满足约束的最早开始日期，summary task 还能把约束传播到子任务。[官方 Scheduler 文档](https://docs.ganttproject.biz/user/scheduler/)、[GitHub](https://github.com/bardsoftware/ganttproject)
- **TaskJuggler**：GPL-2.0；任务、项目计划和资源分配由其声明式项目模型管理，并提供优化排程器；仓库包含 `TaskDependency` 实现及多依赖语法测试。它适合文本化项目计划，不是交互式看板。[官方 README](https://github.com/taskjuggler/TaskJuggler/blob/master/README.rdoc)、[依赖实现](https://github.com/taskjuggler/TaskJuggler/blob/master/lib/taskjuggler/TaskDependency.rb)
- **Gas City**：MIT；Formula v2 的 `needs`/`depends_on` 是真正的 DAG 边，示例含 `dry`、`wet` 汇合到 `combine`，再到 `cook`、`serve`；另有 setup/member/teardown scope、retry、check、drain 和 workflow-finalize。它更接近“可执行任务图”，不是普通看板。[Formula v2 SPEC](https://github.com/gastownhall/gascity/blob/main/docs/reference/specs/formula-spec-v2.md)、[周期检测说明](https://github.com/gastownhall/gascity/blob/main/engdocs/architecture/cycle-detection.md)、[GitHub](https://github.com/gastownhall/gascity)

### 既有报告中符合，但关系语义较轻或产品定位不同的候选

| 项目 | 开源许可 | Task 管理 | previous/next 或等价关系 | 线性 | Tree | DAG | 结论边界 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [Cline Kanban](https://github.com/cline/kanban) | Apache-2.0 | 卡片任务、状态、Agent worktree | 卡片链接；完成并移入 trash 后链接任务自动启动 | 是 | 有限 | 可形成依赖图 | 轻量依赖编排，依赖 Hook/自动交付，不是强一致队列；[README](https://github.com/cline/kanban/blob/main/README.md) |
| [Hermes Studio](https://github.com/EKKOLearnAI/hermes-studio) | BSL-1.1（Studio；商业使用另授权） | SQLite durable Kanban Task、Run、Claim | Kanban 父子 Link；Dispatcher 在父项完成后将子项提升为 ready | 是 | 是 | Visual Workflow 支持分支、汇合、条件、循环 | Studio 许可不由底层 Hermes Agent 的 MIT 许可覆盖；Workflow 重启语义有限；[既有报告](../NERV-001/WORKSHOP-015.md) |
| [Mission Console](https://github.com/CuSO41108/mission-agent) | 仓库公开，许可证/商用授权需单独核验 | 本地 SQLite Task、Run 队列、资源锁 | 工作流节点依赖图 | 是 | 是 | 是，durable data-flow graph | 本地 Electron 单机调度，尚无正式 Release；[既有报告](../NERV-001/WORKSHOP-084.md) |
| [Plane](https://github.com/makeplane/plane) | AGPL-3.0 | Issue/Work Item | 模型包含 parent、blocked_by，并有 `start_before` / `finish_before` 关系类型 | 是 | 是 | 可表达多边关系，但通用 DAG 执行未确认 | 项目管理平台；关系目前主要用于项目计划/状态和甘特语义，不应直接当作执行引擎；[Issue 模型](https://github.com/makeplane/plane/blob/preview/apps/api/plane/db/models/issue.py) |
| [Gitea](https://github.com/go-gitea/gitea) | MIT | Issue | 持久 `IssueDependency`，`blocked_by`/`blocking`，拒绝直接互相阻塞，关闭前检查未完成依赖 | 可用 | 子 Issue 可用 | 关系数据可构成图；未证明完整环检测 | Issue 管理而非通用 DAG 调度；[源码](https://github.com/go-gitea/gitea/blob/main/models/issues/dependency.go) |
| [Wekan](https://github.com/wekan/wekan) | MIT | Card、子任务 | `blocks`/`is-blocked-by`、`fixes`、`related-to`，另有 parentId 子任务 | 是 | 是 | 关系可形成图，但依赖不驱动自动解锁 | 旧报告已确认依赖是持久关系标注，当前未发现拓扑调度；[既有报告](../NERV-002/WeKan.md) |
| [tududi](https://github.com/chrisvel/tududi) | MIT | 持久 Task | `task_relations` 的 `blocks`；写入拒绝循环，读取可判断 `is_blocked` | 是 | 子任务最多一层 | 可形成阻塞图 | 阻塞是读取期派生提示，完成被阻塞任务仍可人工确认完成；不是依赖门禁调度；[既有报告](../NERV-003/Tududi.md) |
| [Taskwarrior](https://github.com/GothenburgBitFactory/taskwarrior) | MIT | CLI Task | `depends:<id1,id2>`；`blocked`/`blocking`/`unblocked` 查询 | 是 | 有父子兼容字段 | 多依赖可形成 DAG | 个人任务管理器，关系用于阻塞查询，不是自动执行器；[官方任务文档](https://taskwarrior.org/docs/task/)、[源码文档快照](https://github.com/GothenburgBitFactory/taskwarrior/blob/develop/doc/man/task.1.in) |
| [Huly Platform](https://github.com/hcengineering/platform) | EPL-2.0 | Tracker Issue | `subIssues`、`blockedBy`、relations，Gantt relation 带 dependency kind 和 lag | 是 | 是 | 关系对象可形成图 | 任务/项目管理能力较完整；本轮未确认通用依赖自动执行；[Tracker 类型](https://github.com/hcengineering/platform/blob/develop/models/tracker/src/types.ts) |
| [GanttProject](https://github.com/bardsoftware/ganttproject) | GPL-3.0 | 桌面项目任务、summary task | Scheduler 使用 predecessor/successor 依赖和 Finish-Start 约束 | 是 | 是 | 多依赖可形成项目 DAG | 日期排程器，不是 Agent 执行队列；官方文档确认依赖会参与排程 |

### 更偏“工作流执行器”但满足 Task、线性和 DAG 的开源项目

| 项目 | 开源许可 | 任务关系能力 | 适合怎样理解 |
| --- | --- | --- | --- |
| [Apache Airflow](https://github.com/apache/airflow) | Apache-2.0 | DAG 中 Task 是节点；`>>`、`<<`、`set_upstream`、`set_downstream` 定义前后关系 | 强执行调度，Task 管理通过 DAG/TaskInstance 完成；不是人工项目管理看板。官方文档：[DAGs](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html) |
| [Netflix Maestro](https://github.com/Netflix/maestro) | Apache-2.0 | Workflow/Instance/Step；依赖、条件、foreach、subworkflow、失败路由 | 既有报告判定为典型 Stateful DAG 调度器；没有传统 Project/Issue 管理层；[既有报告](../NERV-001/WORKSHOP-046.md) |
| [Trigger.dev](https://github.com/triggerdotdev/trigger.dev) | Apache-2.0（仓库版本需复核） | `triggerAndWait()` 父子任务，服务端持久等待/恢复；幂等键防重 | 任务执行与工作流调度能力强，适合代码定义的 Task 链；[既有报告](../NERV-001/WORKSHOP-059.md) |
| [Agently](https://github.com/AgentEra/Agently) | Apache-2.0 | `TaskDAG` / `DynamicTask`，`depends_on`，验证后编译为 TriggerFlow 执行 | 明确是开放源码的 DAG 数据/执行 API；关系和计划通常是应用提交的图，不是全局任务管理中心；[README](https://github.com/AgentEra/Agently/blob/main/README.md) |
| [CAMEL-AI Workforce](https://github.com/camel-ai/camel) | Apache-2.0 | Task 分解、子任务父子层级、并发与失败恢复 | 单次 Workforce 运行内的任务图；不提供跨进程全局任务管理；[既有报告](../NERV-001/WORKSHOP-060.md) |
| [n8n](https://github.com/n8n-io/n8n) | Sustainable Use License | 工作流内部节点 DAG、分支、等待 | 满足工作流内线性/DAG，但不是跨工作流 Task 管理；[既有报告](../NERV-001/WORKSHOP-047.md) |

### 至少有开放 SPEC 的候选

- **Gas City Formula v2** 是任务图 SPEC：`steps`、`needs`、`depends_on`、priority、retry、check、drain、scope 等均有明确字段和语义。它可以单独作为“Task DAG 数据结构与执行契约”的参考，不必采用整个 Gas City 产品。[SPEC](https://github.com/gastownhall/gascity/blob/main/docs/reference/specs/formula-spec-v2.md)
- **Open Workflow Specification** 是厂商中立工作流 DSL。其 Task 是工作流的基本计算单元，内置 `Do`（顺序子任务）、`Fork`（并行子任务）、`Switch`、`Try`、`Wait`、`Run` 等；任务继续执行时按声明顺序或 `then` 转移，适合表达线性链、树形控制流和并行分支。规范仓库声明 Apache-2.0，规范网站标注 CC BY 4.0；使用或改编时应按实际使用的规范文件核对声明。它是开放规范/DSL，不是任务管理数据库。[官方仓库](https://github.com/open-workflow-specification/specification)、[DSL Task/Flow](https://github.com/open-workflow-specification/specification/blob/main/dsl.md)
- **Serverless Workflow 1.x**（Open Workflow Specification 的前身/兼容命名）仍是可参考的开放 DSL 体系，但新项目应优先阅读当前 Open Workflow Specification 的命名和版本说明。[项目 README](https://github.com/open-workflow-specification/specification)
- **Agently `task_dag/v1`** 提供应用提交的 DAG 数据 schema，包含 `id`、`kind`、`binding`、`depends_on`、`inputs`、`semantic_outputs`。它更像开放的 Task DAG 数据协议，而不是独立产品的任务中心。[README 中 Dynamic Task](https://github.com/AgentEra/Agently/blob/main/README.md)
- **BPMN 2.0** 是 OMG 发布的开放业务流程规范，提供 Sequence Flow、并行网关、条件分支、事件和子流程等控制流构件，可表达线性、树状和并行汇合流程；它是标准规范而不是 Task 管理产品，采用时需要另配任务实例、状态和持久化模型。[OMG BPMN 2.0](https://www.omg.org/spec/BPMN/2.0/)

### 不应误收为“已满足”的项目

- **Taiga、Leantime、4ga Boards、TaskTrove**：有 Task/Ticket 或子任务清单，但旧报告核验未发现真正的前后依赖；Leantime 的 `dependingTicketId` 主要用于分组/层级展示和防环，不能据字段名直接判定为 predecessor/successor。
- **FreeTodo、Tududi 的父子 Todo/Task**：父子关系满足 Tree 组织，但不自动等同于“前置完成后才能开始”。tududi 另有 blocks 关系，所以应归入“关系图满足、执行门禁不满足”；FreeTodo 当前证据只有树形组织。
- **Task Master**：功能上有任务、子任务、依赖、`next_task` 和依赖检查，但仓库许可证是 **MIT + Commons Clause**，明确排除以该软件功能为基础向第三方收费销售或托管销售。它可作为源码参考，不能按无附加限制的 MIT 项目计入。[README](https://github.com/eyaltoledano/claude-task-master/blob/main/README.md)、[LICENSE](https://github.com/eyaltoledano/claude-task-master/blob/main/LICENSE)
- **n8n、Task Master、Hermes Studio 等**：源码公开不等于许可证无条件开放；选型时必须单独审查许可证，而不能只看 GitHub 的“公开仓库”。

## 调研目标

- 复核既有调查中是否已经存在满足 Task 管理和前后依赖要求的项目。
- 从公开网络和官方资料中补充开源项目及至少开放 SPEC。
- 区分线性关系、树形层级、真正 DAG 边和仅用于展示的关系标注。
- 区分普通任务管理、工作流执行器和 Agent 任务系统，避免把三者混为一谈。
- 记录许可证和证据边界，供后续选型或架构设计继续核验。

## 产品调研

### 本轮需求的判定口径

“Task 管理系统”按持久 Task、Issue、Card、Work Package、TaskInstance 或等价对象判定；“previous/next”按 `precedes/follows`、`predecessor/successor`、`depends_on/blocks`、`needs` 或可反向查询的有向关系判定。父子层级单独标记为 Tree，不能代替有向前后依赖。若系统能够保存多条前置边并在依赖满足后计算 ready 集合，则按 DAG 能力记录；若只是展示关系或人工查询，则明确标为“关系图，不是执行 DAG”。

### 网络调查方法与证据窗口

本轮使用 Google 公开搜索定位候选，再回到官方文档、官方源码、GitHub API 元数据和既有报告核验。检索词包括 `open source task management task dependencies DAG predecessor successor`、`open source project management task dependencies OpenProject Vikunja Kanboard`、`open source agent task management dependencies specification`、`open source Gantt task dependencies predecessor successor`。搜索结果仅用于发现候选，能力结论优先采用官方资料或源码。调研日期为 2026-11-01（Asia/Shanghai）。

## 技术架构调研

### 关系能力的四种强度

1. **线性关系**：可保存 A precedes/follows B，能够表达 `Task 1 -> Task 2 -> Task 3`。
2. **树形关系**：可保存 parent/child/subtask；能表达任务分解树，但不自动说明开始条件。
3. **DAG 数据关系**：允许一个任务有多个前置或多个后继，并拒绝环或提供拓扑/ready 查询。
4. **DAG 执行调度**：除保存图外，系统还根据依赖、状态或时间真正决定何时运行、何时解锁、失败如何传播或恢复。

新增需求只强制第 1 项，偏好第 2 或第 3 项；第 4 项是加强项。因此，Wekan、tududi、Gitea 这类“DAG 数据关系”候选不能被误写成完整执行调度器；Beads、Gas City、Airflow、Maestro、Trigger.dev 则属于更强的执行方向。

### 持久化与接口差异

- 项目管理类（OpenProject、Redmine、Plane、Vikunja、Wekan、Gitea、Huly、tududi）通常把任务和关系存入 SQL 数据库，通过 Web UI、REST/API 或内置服务管理。
- Agent/本地类（Beads、Cline Kanban、Hermes Studio、Mission Console、Taskwarrior）可以使用 Dolt、JSON、SQLite 或本地文件；这满足数据结构要求，但跨机器一致性和故障接管能力要另行确认。
- 工作流类（Gas City、Airflow、Maestro、Trigger.dev、Agently、Open Workflow Specification）把 Task 作为执行图节点，通常由 YAML/DSL/Python/TypeScript/API 定义；它们未必提供传统项目管理中的负责人、评论、看板或手工工单流程。

### 部署与 Local 优先边界

本轮按用户要求暂不以架构限制淘汰候选。Windows/macOS 原生支持、云端依赖、数据库和消息队列仍应在下一轮选型时单独核验。已有 RUNBOOK 规定的双平台与 Local 优先要求继续适用于后续技术产品深入报告，但不改变本次“是否有 Task 前后关系”的筛选结果。

## 未决项与证据边界

- 本轮主要回答能力存在性，不是完整版本验收。关系类型在未来版本中可能改变，应固定 commit/tag 后再做实施选型。
- “支持 DAG”需要区分允许多边关系、拒绝环、计算 ready 集合和真正执行四个层次；表格已尽量拆开，但仍建议对第一梯队做运行验证。
- Plane、Huly、Vikunja 的关系数据模型已确认，但本轮未逐一验证所有 UI/API 路径和自动排程行为。
- Task Master 的许可证为 MIT 加 Commons Clause；这不是标准 MIT，是否能用于内部部署、商业嵌入或托管需法律/合规确认。
- Open Workflow Specification、BPMN 2.0、Agently `task_dag/v1` 和 Gas City Formula v2 是开放规范或数据/执行契约，不等于独立的任务管理数据库。若需求必须“产品开箱即用地管理 Task”，应优先看 Beads、OpenProject、Redmine、Vikunja、GanttProject、TaskJuggler 或 Gitea。
- OpenProject、Redmine 的 predecessor/successor 主要影响日期、关闭和计划排程；它们不是 Agent 调度器。若后续需求是“前置完成后自动唤起 Agent”，需要在这些系统之上增加执行层。

## 后续验证建议

1. 先用同一最小样例验证候选：创建 A、B、C，设置 A→B→C；再创建 D、E，设置 D、E→F；尝试创建环；完成 A 后检查 B 是否变为 ready；失败/取消 A 后检查下游语义。
2. 第一轮 PoC 优先验证 **Beads、OpenProject、Vikunja、GanttProject、Gas City**：分别覆盖 Agent 任务图、项目管理 predecessor/successor、桌面项目排程、通用 Task relation 和可执行 DAG。若倾向声明式项目计划，再加入 TaskJuggler。
3. 若需要传统项目管理 UI，再验证 OpenProject、Redmine、Vikunja、Plane、Huly；若需要 Agent 长周期任务，再验证 Beads、Cline Kanban、Hermes Studio、Mission Console。
4. 若只需定义开放数据结构，比较 Gas City Formula v2、Agently `task_dag/v1`、Open Workflow Specification；应先确定是“任务管理对象协议”还是“工作流执行 DSL”。
5. 下一轮再按 RUNBOOK 补齐许可证、Windows/macOS、Local/云端、持久化、API、队列、恢复和多节点证据，并为每个候选锁定版本或 commit。
