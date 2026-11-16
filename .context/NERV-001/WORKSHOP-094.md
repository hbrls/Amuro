# Factory Signals 技术产品调研

> updated_by: Qoder - Qoder
> updated_at: 2026-10-23 17:33:00 CST
> evidence_window: 2026-10-23 调研；Signals 2026-01-23、2026-09-24 官方文章及调研时 Factory 文档快照；未取得 Signals 独立版本号或 Release

## 交付结论

### Signals 是内部自动化改进闭环，不能认定为已交付的 Stateful 调度器

**已确认（官方披露）**：Signals 根据 Factory 使用反馈自动产生 Linear ticket，Droid 接单、修改代码、形成并审查 PR，合并前仍由人工批准。2026-09-24 的后续文章明确把它称为 Factory 自身开发流程中的内部系统，而不是一份客户可直接启用的产品交付说明。[1 月技术文章](https://factory.com/news/factory-signals)、[9 月后续说明](https://factory.com/articles/self-improving-software-feedback)

**架构判断**：已展示的范式是“周期性发现工作 → 外部工单 → Agent 执行 → 人工审批”，本轮按**自动化运行器／改进闭环**归类。没有公开证据证明 Signals 自身持久拥有任务依赖、执行归属、可执行性判定和故障接续，不能由自动建单、自分派或持续改进推导其满足 Stateful 调度基准。

**证据边界**：也不能把整个系统称为完全 Stateless。文章明确存在持久化数据和外部工单；未证实的是这些状态是否组成由 Signals 负责持续推进的调度状态，而不是“有没有数据库”。

### 工作记录与执行成果分别落在外部工单和 PR，未确认 Signals 拥有统一任务图

**已确认**：文章把待修复工作落在 Linear ticket，把成果落在 PR。当前 Linear 委派文档说明 Droid 获取工单标题、描述、标签和评论，回报进度与结果，并尝试将待办工单推进为开始状态。[Signals](https://factory.com/news/factory-signals)、[Linear 委派](https://docs.factory.com/delegations/linear.md)

**未决**：Signals 原生 Workspace、Project、Plan、Task 的标识、关系和生命周期未公开；Task 前置依赖、失败传播、优先级和跨进程恢复同样未公开。当前 Droid 的会话与计算机接口不能直接补足这些证据，更不能倒推 1 月内部系统使用了当前实现。

### 已披露主体依赖云端，不满足完整 Local 优先要求

**已确认**：公开方案使用 BigQuery、OpenAI Batch API、Linear 和 Droid 完成内部闭环。官方文章未提供独立服务包、客户配置流程或本地部署清单。[Signals](https://factory.com/news/factory-signals)

**Local 优先判断**：把 Droid 放到工作机只能改变代码执行位置，不会自动把工作发现、外部工单和委派控制面搬到本地。完整离线闭环及断网接续没有获得支持证据。

**选型缺陷**：当前不能把 Signals 作为已验证可获取、可安装、可脱离厂商内部环境运行的调度产品。该结论不取代下文对完整云端形态的调查。

### Windows 与 macOS 支持 Droid 执行端，但未证实支持 Signals 完整中心

**已确认**：当前 Factory App 提供 Windows x64/ARM64、macOS Apple Silicon/Intel 下载；CLI 与 Remote Control 也支持两类工作机。App 能直接访问本地项目，不应笼统称为只展示网页的壳。[App 安装](https://docs.factory.com/factory-app/quickstart.md)、[Remote Control](https://docs.factory.com/remote-control.md)

**选型缺陷与边界**：客户端支持不等于 Signals 中心支持。任一平台的 Signals 本地安装、升级、卸载和离线运行都未取得证据；通用客户端的最低系统要求及完整卸载说明也存在文档缺口，详见部署章节。

### 可以跳过图形客户端调用 Droid，但未取得 Signals 调度层接入协议

**已确认**：当前 `droid exec` 提供一次性执行、会话续接和 stdin/stdout JSON-RPC；Sessions REST API 支持驱动会话，但多个核心操作仅对选定组织开放。[Droid Exec](https://docs.factory.com/droid-exec/overview.md)、[Sessions API](https://docs.factory.com/api-reference/sessions.md)

**接入判断**：外部工具可作为 Droid 调用方，不必经过 Factory 图形界面；这是执行层接入，不是直连 Signals 持久调度中心。没有取得 Signals 的任务创建、认领、租约、依赖或恢复协议。

**改造影响**：若自行包装这些执行接口，工作身份、持久化、去重、调度和故障接续仍需调用方承担，不能算安装一个 Signals 适配器即可获得。

### 企业 Droid 可以隔离部署，不代表 Signals 可以完整私有化

**已确认**：Factory 提供企业专用 airgap Droid 构建，完整 agent harness 本地运行，免 Factory 登录，使用客户模型端点；但依赖 Factory cloud 的功能不可用，当前 Delegations 文档更明确表示隔离部署不提供其设置入口。[Airgapped Deployment](https://docs.factory.com/enterprise/airgapped-deployment.md)、[Delegations](https://docs.factory.com/delegations/index.md)

**未决**：没有证据证明该交付包括 Signals 服务、工作发现流程、工单桥接或相应控制面。当前也未取得 Signals 核心代码和可修改、再部署许可；GitHub 核验因本机没有 `gh` 而受阻，不能因此武断认定其闭源。

**改造判断**：执行环境、执行模型和完整工作闭环是不同层次。Signals 私有化需要厂商明确交付契约，或重新建设相关能力，不是已证明可行的配置开关。

## 调研目标

- 判定 Signals 是否持久拥有工作对象、任务关系及生命周期。
- 核实工作产生、Agent 分派、执行反馈与故障接续方式。
- 分别核实 Windows、macOS 接入和完整部署，判断 Local 优先适配。
- 明确云端服务、接口、持久化及关键依赖边界。
- 判断公开可用性、私有化条件和架构改造范围。

## 产品调研

### 产品定位与目标用户

**已确认（官方披露）**：Signals 是 Factory 为自身开发流程构建的内部改进系统，用于把反复出现的用户困难转成软件修复工作。文章的实际使用者是 Factory 内部研究与工程团队，不是一个已经展示客户安装和使用流程的独立调度产品。[1 月文章](https://factory.com/news/factory-signals)、[9 月说明](https://factory.com/articles/self-improving-software-feedback)

它与自主工作的直接关联是：任务不必先由人逐项编写，系统可以依据环境反馈生成工作，再交给代码 Agent 执行。这里的“自我改进”指产品代码和行为改进闭环；9 月文章明确区分了内部系统与面向客户的自动模型再训练功能，不能解释成模型权重自动更新。

本报告只记录上述系统在工作产生、任务推进和部署方面的事实，不展开反馈指标、分类算法、埋点、上报配置、看板或告警规则。

### 核心流程

1. **发现工作**：内部日批次处理形成符合触发条件的改进候选项。
2. **生成工作记录**：Signals 自动在 Linear 创建 ticket。
3. **接单**：文章称 Droid 接手这些 ticket，示意图称 self-assignment；内部派单实现未披露。
4. **执行和验证**：Droid 修改代码、形成 PR 并自审。
5. **治理与交付**：人工批准 PR 后才可合并；后续使用反馈继续进入改进循环。

**证据范围**：以上为文章披露，不是本次运行复现。文章列举工具超时处理和输出截断修复作为案例，但未给出可逐项核验的工单和 PR 链接。[Closing the Loop](https://factory.com/news/factory-signals)

**未决**：PR 被拒绝、修复失败、工单取消或执行中断后，谁重新规划、是否自动重试、是否需要人工再触发，文章没有说明。闭环周期性运行不等于每个失败任务必然接续。

### 功能地图与边界

| 能力域 | 已披露能力 | 不能据此推导的能力 |
| --- | --- | --- |
| 主动产生工作 | 条件满足时自动生成改进工单 | 任意来源任务统一规划、实时自主观察 |
| 工单承接 | Linear ticket 进入 Droid 执行流程 | Signals 原生 Issue/Task 账本和依赖图 |
| 自动修复 | Droid 修改代码、形成 PR、自审 | 跨任务资源调度、故障后自动转交 |
| 人工治理 | 合并前人工批准 | 独立复核已由平台强制、所有任务采用相同审批规则 |
| 反馈闭环 | 产品变更后继续获得反馈 | 模型权重自更新、无人批准自动部署 |
| 对外接入 | 当前 Factory 有 CLI、委派和 API | 客户已经能够启用同样的 Signals 内部服务 |

前五项来自 [Signals 文章](https://factory.com/news/factory-signals)；最后一项来自[当前 Droid 文档](https://docs.factory.com/droid-exec/overview.md)，不能混作同一版本的 Signals 实现。

### 维护状态与版本演进

**2026-01-23：已披露内部运行，不是独立 Release。** 官方表示系统已经运行数月，闭环每日执行，并保留人工批准；实时反馈与更主动的演进属于下一步方向。不能把这些规划记为当时已发布能力。[原始文章](https://factory.com/news/factory-signals)

**2026-09-24：官方继续解释内部实践，不是新增版本承诺。** 后续文章重申内部反馈、提出修复和人工决策的边界，并建议读者用已有工程工作流与验证机制构建可检查的改进。它没有提供 Signals 的版本号、下载或客户启用流程。[后续文章](https://factory.com/articles/self-improving-software-feedback)

**维护判断**：有近期官方后续讨论，但无法仅凭发文日期确认 Signals 代码持续维护、发布节奏或当前可获取性。一般 Droid 的更新记录、Missions 或 Automations 文档不能记作 Signals 的版本演进；当前客户端支持也不能倒推为 1 月已有。

### 开源、生态与反馈

**官方入口**：目标主体的直接入口为 [Signals 文章](https://factory.com/news/factory-signals)。官网链接到 [Factory-AI GitHub 组织](https://github.com/Factory-AI)，但它不是已确定的 Signals 源码仓库。[官网 OSS 页面](https://factory.com/oss)实际提供开源贡献者免费工具申请，不是 Signals 的源码发布和许可证说明。

**核验限制**：本次环境执行 GitHub CLI 查找返回不可用，未安装工具，也未绕过要求抓取 GitHub。因而组织仓库、Signals 主干源码、LICENSE、Release 以及 issue/discussion 抽样未完成；不能把它们报告为“查无结果”。

**反馈样本边界**：已取得两篇 Factory 官方自述，没有取得可核实的 Signals 专属独立用户反馈。文章内效果数字没有公开可复核样本和完整评估方法，本报告不把它们当作可靠性保证、客户采用率或免审依据。

**生态判断**：Linear 委派、Droid CLI/SDK 和远程计算资源属于相关执行生态，不是 Signals 已开放扩展点的证据。9 月文章引导读者使用其他 Factory 功能，也不等于这些功能更名为 Signals。

## 技术架构调研

### 系统全貌与运行形态

**已确认的职责关系**来自 Signals 文章，未披露的部署位置不补猜：

```text
Factory 内部数据与日批处理
        │
        ├── BigQuery：已披露的输入/结果持久化
        ├── OpenAI Batch API：已披露的异步处理服务
        │
        ▼
Signals 条件满足 → 创建 Linear ticket
        │
        ▼
Droid 接单 → 执行环境中的代码变更 → PR / 自审
                                      │
                                      ▼
                                人工批准合并
                                      │
                                      └── 后续使用反馈进入下一周期
```

**边界说明**：这里把反馈处理视为工作来源，只记录其对云端依赖、异步性和数据边界的影响。图中没有把 BigQuery 标为任务队列，也没有把 OpenAI Batch API 标为跨任务调度器。[Signals](https://factory.com/news/factory-signals)

**合理推导**：整体是厂商控制的内部流程与外部服务组合，不是一个工作机常驻程序独立完成的闭环。文章没有给出 Signals 主程序使用的云平台、容器编排或定时服务；修复代码所用机器的位置也未说明。

**当前执行接入的补充事实，不回填历史实现**：Factory Delegations 可使用 Dynamic Environment 或 Persistent computer pool；后者可包含在线的自有 Remote Control 机器。当前文档证明这种 Droid 执行路径存在，不能证明内部 Signals 使用同一配置。[Delegations](https://docs.factory.com/delegations/index.md)

### 工作对象、任务关系与生命周期

| 对象 | 标识、来源、归属和层级 | 调度意义及证据边界 |
| --- | --- | --- |
| Workspace | 当前委派涉及 Linear workspace 与 Factory organization 的授权关联；未公开 Signals workspace 对象及 ID | 组织和接入容器，不证明拥有可执行任务图 |
| Project | 未发现 Signals 原生 Project 定义；仓库是代码修复上下文 | 不能把仓库目录、项目切换或文件隔离当作任务关系 |
| Issue | Signals 自动生成 Linear ticket，外部工作记录归 Linear；内部关联 ID 未公开 | 有可跟踪的工作入口，但是否有 Signals issue 镜像与一致性记录未决 |
| Plan | 文章未定义持久化 Plan、里程碑及 Plan→Task 转换 | 不能由“Droid 修复”推导存在编排计划；普通执行文本也不等于持久编排对象 |
| Task | 文章中的修复是业务概念，未公开 Signals task ID、生命周期或领取契约 | 未证实是 Signals 中心拥有、可独立恢复的产品对象 |
| Session / Computer | 当前 Droid API 使用 sessionId、computerId；会话可交互和中断 | 是执行资源与会话，不自动拥有工单依赖和任务重试归属 |
| PR | Droid 形成修复，人工批准合并；具体 Git 托管方以实际配置为准 | 代码合并门槛，不等于 Signals Task 的完成状态 |

上述边界依据 [Signals](https://factory.com/news/factory-signals)、[Linear](https://docs.factory.com/delegations/linear.md)、[Delegations](https://docs.factory.com/delegations/index.md) 和 [Sessions API](https://docs.factory.com/api-reference/sessions.md)。没有公开定义意味着当前无法据此验收，不是已经证明内部不存在。

**已确认的推进责任**：Signals 产生工单；Droid 实现和自审；人批准合并。当前 Linear 接入层会尝试把 backlog/to-do 工单移到 started 状态并回传 PR/MR 链接；“尝试”不是跨系统事务保证。[Linear](https://docs.factory.com/delegations/linear.md)

**未决的关系与策略**：没有获得 Signals 持久化和解释父子任务、前置依赖、阻塞、并行分支或 DAG 的证据，也没有上游完成、失败、取消或超时后如何解锁、阻塞、跳过或终止下游的契约。优先级、计划时间和资源约束如何共同决定可执行性未公开。

**不得混淆**：当前 Sessions API 可以列出子会话，包括 Task subagents 和 mission agents；这是执行会话关系，不能直接当作 Signals 的任务依赖图。[Sessions API](https://docs.factory.com/api-reference/sessions.md)

### 主要组件与核心链路

#### 链路一：条件触发到可评审修复

**已确认**：内部周期处理 → Signals 创建 Linear ticket → Droid 接单 → 修复与 PR → 自审 → 人工批准。跨越工作发现、外部工单、代码执行和代码托管边界。[Signals](https://factory.com/news/factory-signals)

**未决**：触发决策如何持久化、同一问题怎样避免重复建单、工单创建成功但执行启动失败如何补偿。图示中的箭头不是可靠消息交付或事务提交证据。

#### 链路二：当前公开的 Linear 到 Droid 委派

**已确认，当前通用 Droid 能力**：管理员授权 Linear 应用，配置共享服务账号、Git 凭据与计算资源。用户将 issue 指派给 Factory 或在评论中提及 Factory；Droid 在远程机器建立会话，读取 issue 上下文、执行和验证，再回写进度与结果。无需先创建 Software Factory automation。[Linear](https://docs.factory.com/delegations/linear.md)

**权限边界**：共享 issue 委派使用配置中的服务账号及其 Git/Connector 凭据，不是发起人的个人连接。用户须属于关联 Factory 组织，双方邮箱应匹配；应用须获准访问相应 Linear team。个人 Linear Connector 仅为会话提供工具，不会安装委派应用。

**停止与反馈**：Linear 的 Stop 控件停止运行，但不回滚已完成修改；能使用该控件的人不局限于发起者。文档未承诺停止后自动重新排队。Open in Factory 附件打开携带 issue 上下文的新会话，与指派给 agent 的流程不同。

**证据限制**：这说明当前公开的执行承接方式，不证明客户能启用 Signals 工作发现，也不证明就是 1 月内部 self-assignment 的具体实现。

#### 链路三：自有工作机承担执行

**已确认，当前通用 Droid 能力**：Windows/macOS 工作机安装、登录 Droid，运行 `droid daemon --remote-control`，机器经注册后出站连接 Factory relay。共享持久池机器需要属于配置的服务账号并保持在线。[Remote Control](https://docs.factory.com/remote-control.md)、[Delegations](https://docs.factory.com/delegations/index.md)

**合理推导**：代码和命令可留在工作机执行，但身份、委派配置和中继依赖仍在 Factory 侧。这是混合部署，不是 Signals 调度中心下沉。

### Agent 分派与连续性

**Signals 已披露**：正文称 Droid “picks up those tickets”，图示称 “Self-assignment”；没有说明是已有 Agent 轮询领取、事件唤起一次性 Agent，还是中心在多个 Agent 之间挑选执行者。[Signals](https://factory.com/news/factory-signals)

**当前接入能力已确认**：Delegations 区分动态计算和持久机器池，机器忙时建议等会话结束再重试，或增加机器、调整单机 parallel worker limit。这证明资源配置和容量约束存在，但没有公开自动持久排队、抢占或公平性保证。[Delegations](https://docs.factory.com/delegations/index.md)

**恢复边界**：

- `droid exec --session-id` 可续接会话，JSON-RPC 有加载会话入口；文档要求调用方处理超时、进程清理和会话持久化。它不是任务失败后的自动转交承诺。[Droid Exec](https://docs.factory.com/droid-exec/overview.md)
- Factory 托管 Droid Computers 保留文件、安装依赖和服务状态，支持空闲暂停及新会话唤醒。这是执行环境连续性，不是任务调度状态恢复。[Droid Computers](https://docs.factory.com/droid-computers/overview.md)
- Signals 是否持久关联 ticket、session、执行者与检查点；断线后续原会话还是新建；是否迁移机器，均为**未决**。

### 主要依赖与依赖根源

| 依赖 | 已披露职责 | 替换与架构边界 |
| --- | --- | --- |
| BigQuery | Signals 的输入和结果持久化 | 是公开方案依赖；没有证据表明承担任务锁、事务队列或依赖解析，不能认定为调度必需数据库 |
| OpenAI Batch API | 工作来源处理中使用的异步服务 | 是文章所述实现依赖，不是已证明不可替换的调度原语；替换契约未公开 |
| Linear | 接收改进工单；当前还承载 Droid 委派入口和回报 | 换掉它涉及工作记录、身份、入口与结果关联，不是只换模型 |
| Droid 与模型访问 | 实现修复、使用工具、产生反馈 | Signals 未公开可插拔执行器接口；替换需重做执行协议、权限、验收和结果回写 |
| Git 与 PR 托管 | 代码访问、修复提交、评审与合并 | 是交付及治理边界；仓库写权限独立于 Signals 工作发现 |
| Factory 控制面及 relay | 当前 Droid 的组织身份、委派配置与远程连通 | 本地执行仍依赖在线控制面；未证实普通客户可自托管同样的委派中心 |

Signals 关系来自[官方文章](https://factory.com/news/factory-signals)，当前执行接入依赖来自 [Delegations](https://docs.factory.com/delegations/index.md) 和 [Remote Control](https://docs.factory.com/remote-control.md)。

**数据库结论**：Signals 调度数据库的类型、最低版本、专属扩展和事务方案未公开。不能由已知 BigQuery 推导底层任务库也使用 BigQuery，也不能猜测另有 PostgreSQL、Redis 或消息中间件。

**根源区分**：工作发现使用的模型处理与任务调度必须持有的状态分属不同层。剥离前者会失去自动产生候选工作的能力；补足后者需要任务身份、依赖、执行归属与状态一致性。当前没有源码和运行契约，不能把任一替换描述为已经验证的小改动。

### 接口形态与客户端接入

**Signals 本身：未取得公开调度 API。** 两篇文章和当前文档索引没有提供 Signals 的 Task 创建/查询、领取/租约、依赖管理、重试/恢复或外部 worker 注册契约。[Signals](https://factory.com/news/factory-signals)、[官方文档索引](https://docs.factory.com/llms.txt)

**当前 Droid 有三类执行接入载体**：

- **CLI / 子进程**：普通 `droid exec` 接受任务、执行并退出；JSON-RPC 模式通过 stdin/stdout 多轮驱动，交换通知及权限请求。可跳过图形界面，但仍使用官方 Droid 运行时。[Droid Exec](https://docs.factory.com/droid-exec/overview.md)
- **SDK**：官方文档指向 TypeScript 与 Python SDK，封装执行交互；不是 Signals 中心服务包。
- **REST**：Sessions API 使用 Bearer 认证，提供会话创建、消息和中断等操作，多项核心操作仅对选定组织开放；有 `computerId` 定向查询语义，但不能因此判定有 Signals 工作图 API。[Sessions API](https://docs.factory.com/api-reference/sessions.md)

| 接入语义 | 当前可证实情况 |
| --- | --- |
| 客户端创建或管理任务 | 可驱动 Droid 会话、在 Linear 发起委派；未取得 Signals 原生 Task 管理证据 |
| 客户端领取任务 | “picks up” 未披露领取协议，不能判定存在通用 pull worker |
| 服务端唤起客户端执行 | 当前 Delegations 可使用配置的远程机器；证明执行派发，不证明 Signals 任务状态由客户端恢复 |

**适配影响**：CLI/SDK 可支持执行包装，满足准入时可走 Sessions API；但要获得 Stateful 工作中心，调用方仍须承担独立任务状态、依赖解析、执行归属和故障重派。该范围属于新增能力，不是对已有 Signals 调度器换一个前端。

### 持久化方式

**已确认**：Signals 的输入与结果存入 BigQuery；改进工作落为 Linear ticket；代码变更形成 PR。当前 Droid 另有可标识、可续接会话，以及保留执行文件的持久计算机。[Signals](https://factory.com/news/factory-signals)、[Droid Exec](https://docs.factory.com/droid-exec/overview.md)、[Droid Computers](https://docs.factory.com/droid-computers/overview.md)

**架构判断**：这些状态分别存在于不同组件中；未取得统一 Signals 任务账本的公开证据。不能把“历史结果可查询”“代码还在”或“会话可恢复”当作中心恢复所有未完成工作的保证。

**未决**：触发决策、去重记录、依赖关系、执行分配、检查点和最终结果确认由谁存储，如何在 Signals 主进程重启后重建尚未完成的工作，以及客户端断线后哪一方拥有推进权。

### 通信方式

- **Signals 已披露**：日批处理使用外部异步 Batch API，随后创建工单并进入修复流程。这是批次驱动加跨服务交互，不是已证明的实时工作机派单网络。[Signals](https://factory.com/news/factory-signals)
- **当前 Droid 本地接入**：CLI 子进程通过标准输入输出交换 JSON-RPC 请求、响应和通知。[Droid Exec](https://docs.factory.com/droid-exec/overview.md)
- **当前工作机远程接入**：daemon 出站连 Factory relay，无需开放入站端口；托管计算机文档说明 SSH 经安全 WebSocket tunnel。不能将 SSH 隧道的证据外推为所有任务消息均用相同协议。[Remote Control](https://docs.factory.com/remote-control.md)、[Droid Computers](https://docs.factory.com/droid-computers/overview.md)
- **未决**：Signals 到 Linear/Droid 的适配使用 webhook、轮询还是队列；断线重放、去重确认和跨服务重试责任均未公开。

### 任务队列

**判定：未取得 Signals 持久工作队列证据。** 每日批处理说明节律，Batch API 说明外部异步处理，Linear 工单说明工作记录，三者都不能单独证明存在由 Signals 负责的完整任务生命周期队列。[Signals](https://factory.com/news/factory-signals)

**未决**：队列介质、原子领取、防重复派发、租约、超时回收、重试、失败转移及多 Signals 实例协调。当前 Delegations 公开的机器容量约束和忙时处理建议不足以回答这些机制。[Delegations](https://docs.factory.com/delegations/index.md)

**停止边界**：未取得公开 Signals 核心源码或运行契约；继续枚举通用 Droid 的端点或实现，不能补齐 Signals 队列证据，因此保留未决，不扩大为源码审计。

### 部署形态

#### Windows 工作机：可安装执行端，完整 Signals 中心未证实

**安装与入口，已确认**：Factory App 有 x64、ARM64 下载，运行安装器；企业支持签名 MSIX。CLI 提供原生 Windows `droid.exe` 和 PowerShell 安装入口，不是只支持 WSL。桌面启动后登录、选择本地项目；终端用 `droid`，自动化用 `droid exec`。[App Quickstart](https://docs.factory.com/factory-app/quickstart.md)、[Windows MSIX](https://docs.factory.com/enterprise/windows-msix-deployment.md)、[CLI Quickstart](https://docs.factory.com/droid-cli/quickstart.md)、[CLI Reference](https://docs.factory.com/droid-cli/cli-reference.md)

官方 CLI 安装命令为 `irm https://app.factory.ai/cli/windows | iex`。这是记录官方入口，本次未下载执行；企业使用时仍需按自己的软件分发策略审查安装内容。

**依赖与系统要求，已确认/未决**：MSIX 文档要求 Windows 10 1809、build 10.0.17763.0 或更新，安装包须匹配架构；不能把该最低版本套用到 CLI。App 内置 Droid；CLI 入门要求终端和代码项目，推荐 Git。实际构建测试还需要项目自身工具链。所读文档没有给出完整 CLI 最低系统和硬件依赖。[Windows MSIX](https://docs.factory.com/enterprise/windows-msix-deployment.md)、[App Overview](https://docs.factory.com/factory-app/overview.md)、[CLI Quickstart](https://docs.factory.com/droid-cli/quickstart.md)

**权限，已确认**：MSIX 按用户安装须在目标用户上下文执行；设备级 provisioning 需要管理员。命令执行权限另由 Droid 自主级别和组织策略约束，不能把安装许可当作无限制代码执行许可。[Windows MSIX](https://docs.factory.com/enterprise/windows-msix-deployment.md)、[Droid Exec](https://docs.factory.com/droid-exec/overview.md)

**网络，已确认**：标准连接式使用需要 Factory 登录/API，执行时依所选模型及代码仓库访问相应服务。启用远程控制须能出站到组织区域的 Factory relay；无需开放公网入站端口。[Deployment Patterns](https://docs.factory.com/enterprise/network-and-deployment.md)、[Remote Control](https://docs.factory.com/remote-control.md)

**升级，已确认**：MSIX 后台检查更新，下载和安装前征求同意；组织可禁用 App/CLI 自动更新并由 IT 发包，仅做设备管理分发不会自动关闭应用内更新。独立 CLI 默认自动更新，也提供 `droid update`；npm 版本内置自动更新关闭，需经 npm 更新。[Windows MSIX](https://docs.factory.com/enterprise/windows-msix-deployment.md)、[CLI Reference](https://docs.factory.com/droid-cli/cli-reference.md)

**卸载，未决**：所读安装与参考页未给完整官方卸载、残留凭据清理及撤销设备 provisioning 流程。Remote Control 的 `droid computer remove` 可注销当前机器并清理本地注册配置，但不是卸载 App/CLI，也不证明删除云端工单或会话。[Remote Control](https://docs.factory.com/remote-control.md)

**完整度判断**：以上都是执行客户端和辅助接入支持，没有 Signals 中心在 Windows 上的独立服务安装、升级或卸载证据。

#### macOS 工作机：有原生客户端，仍不是 Signals 的本地完整形态

**安装与入口，已确认**：Factory App 提供 Apple Silicon 和 Intel 版本，打开 `.dmg` 并拖入 Applications；登录后选择本地项目。CLI 官方入口为 `curl -fsSL https://app.factory.ai/cli | sh`，另有 `brew install --cask droid` 和 npm 安装选项。终端入口为 `droid`、`droid exec`；本次未执行安装。[App Quickstart](https://docs.factory.com/factory-app/quickstart.md)、[Droid Exec](https://docs.factory.com/droid-exec/overview.md)

**依赖，已确认/未决**：App 内置 Droid；CLI 需要终端及项目上下文，项目构建测试依赖须另行满足。所读页面没有给出 macOS 最低版本和硬件下限；Node.js 属于选择 npm 安装方式时的工具链，不能当作所有原生安装方式已证实的硬依赖。[App Overview](https://docs.factory.com/factory-app/overview.md)、[CLI Quickstart](https://docs.factory.com/droid-cli/quickstart.md)

**权限，未决**：所读页面没有给出管理员、Full Disk Access 或 Accessibility 的完整要求，不能自行宣称都必须授予。代码文件权限和执行自主级别仍需按工作机与组织策略管理。

**网络，已确认**：标准模式连接 Factory 身份/API 和所选模型/代码服务；远程控制通过区域 relay 出站连接，无需开放入站端口。代理、自定义 CA 及 mTLS 支持见企业网络文档，但不意味着 Signals 本地离线。[Deployment Patterns](https://docs.factory.com/enterprise/network-and-deployment.md)、[Remote Control](https://docs.factory.com/remote-control.md)

**升级，已确认/未决**：独立 CLI 默认自动更新，可用 `droid update`；npm 安装需经包管理器更新。所读页面未给 macOS App 独立更新流程，不能直接套用 Windows MSIX 的提示机制。[CLI Reference](https://docs.factory.com/droid-cli/cli-reference.md)

**卸载，未决**：没有取得官方完整 App/CLI 卸载和凭据/会话残留清理说明。可以确认的是远程机器注销命令，但移除注册、删除应用、清理用户数据及删除云端记录是不同动作，不应混称。[Remote Control](https://docs.factory.com/remote-control.md)

**完整度判断**：原生桌面和 CLI 是本地执行能力；未取得 Signals 中心在 macOS 上的服务包、后台进程、升级或卸载证据。

#### 主体功能运行位置与离线影响

**Signals 主体**：公开形态是依赖云端服务的 Factory 内部闭环；具体主程序托管位置未披露，外部云依赖明确。[Signals](https://factory.com/news/factory-signals)

**Droid 执行层**：可以位于 Factory 托管计算机，或通过 Remote Control 使用自有工作机。后一种模式改变命令与文件位置，不改变 Signals 工作来源、外部工单和委派控制面的边界。[Droid Computers](https://docs.factory.com/droid-computers/overview.md)、[Remote Control](https://docs.factory.com/remote-control.md)

**断网影响，合理推导**：工作机与 Factory relay/API 失联时，不能依赖公开远程委派链路启动和管理新工作；外部 Batch、Linear 或 Git 托管不可达时，相应产生工作、接单、回写或交付步骤不能完成。已落盘代码不会因此自动消失，但不等于闭环仍可推进；缓存、续跑和恢复保证未公开。

#### 云端职责、接口、数据与故障边界

| 云端部分 | 职责与主要状态 | 部署、权限与故障影响 |
| --- | --- | --- |
| Signals 内部服务 | 根据处理结果作触发决策、生成 Linear 工单 | 内部运行；主程序、定时触发器、配置存储和租户边界未公开；不可用影响新工作产生，补跑机制未决 |
| BigQuery | 已披露的输入与结果持久化 | 外部托管服务；具体项目、区域、保留策略与账号权限未公开；不可达影响对应读写，不代表已存在工单消失 |
| OpenAI Batch API | 异步处理输入、返回结果 | 外部 API；文章明确发送输入到服务，不能从“人不读原文”推导“模型不处理内容”或“数据不出边界”；请求前处理、保留政策和失败补偿未披露 |
| Linear | 保存改进工作；当前委派入口及结果回报 | 当前授权涉及 issue/comment 与 team 访问；不可用影响建单、接单和回写；内部 Signals 使用的具体凭据未披露 |
| Factory 委派及身份控制面 | 当前组织配置、服务账号、计算资源选择和会话入口 | 标准在线服务；当前 Delegations 在 airgap 不可用；身份或配置问题影响该公开执行路径 |
| Factory relay 与执行机器 | 当前远程连通、代码和工具执行 | 自有机器出站接入，托管机器由 Factory 维护；离线、繁忙或模型不可达影响执行，自动排队与迁移保证未公开 |
| PR 平台与人工评审 | 保存修复和评审结果，控制合并 | Git 写入权限和分支规则单独管理；PR 创建、自审、人工批准和已合并不是同一状态 |

Signals 自身及已知云依赖来自[原始文章](https://factory.com/news/factory-signals)，当前公开执行层来自 [Delegations](https://docs.factory.com/delegations/index.md)、[Linear](https://docs.factory.com/delegations/linear.md)、[Remote Control](https://docs.factory.com/remote-control.md)。文章也提到 Slack 承载内部团队输出，但未证明它是修复派单的必经节点，故不把它当作任务队列，也不展开报表机制。

**人工批准的实际含义**：1 月文章只说明内部保留人工合并批准。当前 Delegations 文档提醒，Factory 作为 PR 作者时，请求工作的人仍可满足一次人工审批；若需要独立于请求人的复核，必须由代码托管规则额外约束。不能把“有人批准”解释成平台已强制独立双人治理。[Delegations：独立评审](https://docs.factory.com/delegations/index.md)

#### 托管、自有基础设施与隔离部署

**Cloud-managed，已确认**：当前企业部署文档说明 Droid 可在笔记本或构建机器执行，Factory cloud 提供 orchestration、组织元数据、Web 认证和控制能力；客户端安装不等于安装控制面。[Deployment Patterns](https://docs.factory.com/enterprise/network-and-deployment.md)

**Hybrid / 自有基础设施，已确认**：Droid 可运行在客户 VM、容器、CI 和远程开发环境；按需要连接 Factory cloud 协调。文档还提供在自有云/数据中心供应执行沙箱的路径，但这是计算资源位置，不证明 Signals 或 Factory 控制面一并下放。

**Airgap，已确认但限于明确交付范围**：企业专用构建需联系厂商取得，经客户离线制品流程导入；完整 Droid harness 本地运行，不需要 Factory 账号，至少要配置一个自有模型端点。跨设备同步、云集成和自动更新等云依赖功能不可用，更新需离线导入。[Airgapped Deployment](https://docs.factory.com/enterprise/airgapped-deployment.md)

**隔离责任**：Airgap Mode 是可靠性契约，不是强制网络隔离设施；防火墙和沙箱边界由客户保障。它没有承诺交付 Signals 的工作发现、外部工单替代或独立委派控制面；Delegations 文档明确该设置在 airgap 不可用。[Airgapped Deployment](https://docs.factory.com/enterprise/airgapped-deployment.md)、[Delegations](https://docs.factory.com/delegations/index.md)

#### 最小部署成本与私有化改造边界

**完整 Signals：无法给出可复现最小部署。** 没有公开独立服务包、资源规格、部署清单、售价或许可，无法给出单机内存、数据库数量或固定成本估算。BigQuery 与 Batch API 的存在只说明公开方案依赖，不能替代完整交付报价。[Signals](https://factory.com/news/factory-signals)

**仅公开 Droid 委派路径，已确认**：需要付费 Factory 组织、Manager/Owner 配置权限、外部应用授权、活动服务账号、Git 凭据与可用 Environment/持久计算机。符合资格的组织会获得默认配置、账号和环境；具体席位、推理、计算和外部服务费用需按合同确认，不能算作 Signals 报价。[Delegations](https://docs.factory.com/delegations/index.md)

**运维影响，合理推导**：托管路径减少客户维护控制面和计算机的工作，但仍需维护权限、代码环境、凭据及验收规则。自有工作机还需承担 daemon 在线、版本更新、工具链和机器维护；隔离部署另增制品分发、模型服务和网络边界维护。

**改造边界**：

- 包装 Droid CLI/SDK 的执行入口：有公开接口，仍需验证准入、权限与结果验收。
- 把云执行换成自有机器：当前有 Remote Control 路径，但仍依赖 Factory relay/控制面。
- 替换 Signals 的输入处理、工单存储和状态推进：没有公开可替换模块契约，应视为重新建设或厂商交付事项。
- 将完整 Signals 移入断网工作机：当前无完整产品、许可和依赖替代证据，不应报告为可行的小规模改造。

### 架构范式与扩展可行性

**分类**：Signals 是周期驱动的工作发现和自动化改进闭环；普通 `droid exec` 是一次性执行宿主。存在持久工单、会话或机器并不自动使它成为跨任务 Stateful 调度中心，也不能据此称整个系统为 Serverless 或完全无状态。[Signals](https://factory.com/news/factory-signals)、[Droid Exec](https://docs.factory.com/droid-exec/overview.md)

**职责下沉，合理推导**：一次候选工作处理、一次工单生成或一次代码修复可以作为普通 Agent 节点封装；这只替代一个步骤，不会继承未知的批次连续性、去重、任务依赖和恢复责任。

**扩展约束**：当前 Droid 可用 worktree 隔离并发代码变更，Delegations 可增添机器和调整单机 worker 限制；文件隔离不解决工单重复领取，增加 worker 不证明多个 Signals 调度节点能互斥协调。[Droid Exec](https://docs.factory.com/droid-exec/overview.md)、[Delegations](https://docs.factory.com/delegations/index.md)

**结论**：执行接入具备可研究的公开载体，但整体 Signals 没有可验证的调度/部署合同。若要求本地持久工作图、第三方 Agent 领取、依赖解锁和失败转移，应先取得相应中心能力证据，不能把它们假设为已有功能。

## 未决项与证据边界

- **交付与许可**：两篇官方文章证明内部实践；未取得客户可用 Signals 服务包、核心源码、许可证或私有化授权。GitHub 核验因缺少 `gh` 未完成，不是查无结果。
- **对象与推进**：Signals 原生 Task/Plan、依赖关系、执行归属和各状态迁移责任方未公开。
- **恢复**：批次重启、建单后启动失败、重复投递、执行器退出、机器离线和人工拒绝后的推进方式未公开。
- **队列与一致性**：数据库最低版本、队列、原子领取、租约和多节点协调未公开，不能从 BigQuery 或 Batch API 猜测。
- **平台完整度**：有两平台客户端证据，没有两平台 Signals 中心安装证据；客户端部分最低要求、权限与完整卸载流程仍需官方澄清及实测。
- **私有化完整度**：本地执行、私有模型和 Droid airgap 不等于 Signals 全套服务在客户环境运行。
- **数据与权限**：内部跨服务身份、处理前数据边界、区域、保留和补偿责任未充分公开；本报告不延伸为遥测专项。
- **时间与样本**：Signals 核心依据是 1 月技术文章及 9 月澄清；当前滚动文档仅证明相关 Droid 接入能力，不能回填旧实现。未取得独立 Signals 用户反馈样本。
- **验证性质**：未安装客户端、授权外部集成、执行修复任务或测试故障恢复；官方披露不等于本次运行验证。

## 后续验证建议

1. **先确认交付资格**：要求厂商明确 Signals 是否面向客户提供，以及版本、许可、服务包、部署拓扑和支持范围；仅提供 Droid 账号或客户端不算完整交付。
2. **验证 Stateful 条件**：要求演示任务依赖、执行归属和持久状态；重启中心、停止 worker、断开工作机后，检查谁决定继续、重试或转交。
3. **验证跨服务失败窗口**：重点检查重复触发、工单已创建但执行未启动、代码已提交但回报失败、PR 被拒绝；确认去重、补偿和人工介入责任，而不只展示正常路径。
4. **分别实测 Windows 与 macOS**：在最低权限测试机验证安装、注册、接单、权限暂停、升级、注销和卸载，并观察离线对云端工作的影响。
5. **分层验收私有化和治理**：分别确认本地执行、私有模型、私有控制面和 Signals 完整闭环；以分支规则验证自动修复不能绕过所需人工批准。
