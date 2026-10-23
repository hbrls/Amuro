# Lucius AI 技术产品调研

> updated_by: Qoder - Qoder
> updated_at: 2026-10-23 14:58:42 CST
> evidence_window: 2026-10-23 在线官网、公开文档与登录入口快照；未确认产品版本、分支或 Release；历史公告及条款日期在正文就地标注

## 交付结论

### 应归类为云端业务自动化运行器：具有有状态定时执行子系统，但尚不足认定为本轮所需的 Stateful 工作编排器

**已确认（官方披露，非运行实测）**：Lucius 不只是对话应答。其 Automation 明确将到期触发先写入数据库，再执行预先配置的 Flow；失败会重试，watchdog 会恢复卡住的执行，重启后支持短窗口补发、超窗标记 skipped。多实例同时触发时，用数据库唯一约束防止重复触发。因此，将整个产品称为纯 Stateless 消费者同样不准确。[Automation](https://luciusai.com/features/automation)

**判定**：现有证据支持“云端客服／运营自动化运行器，内含持久化定时触发和恢复机制”。但未确认 Task 之间的依赖、可执行条件、执行者归属、跨 Agent 重新分派及工作对象关系的完整持久化模型，不能把定时触发持久化直接升级为通用 Stateful 任务编排能力。[任务与交接](https://luciusai.com/features/tasks)、[产品文档](https://luciusai.com/docs)

**选型影响**：它可以作为“事件处理＋人工交接＋持久化定时执行”的实践样本；按本轮严格基准，暂不能作为已经证实的中心工作调度系统。

### Task 的主语义是人工交接工单，Flow 的步骤不等于 Task 依赖图

**已确认（官方文档）**：工作主要来自渠道消息、知识冲突及预设周期。Agent 收集上下文后，对无依据、越权、敏感或用户要求人工的情况停止自动处理，建立包含问题、材料和建议动作的任务；人解决后，结果回流知识库。[任务功能](https://luciusai.com/features/tasks)、[知识引擎](https://luciusai.com/features/knowledge)

**未决**：Workspace 有明确产品语义，Task 有明确交接语义；独立 Project、Issue、Plan 对象，以及 Task 的父子、前置依赖、阻塞传播、并行分支和跨 Agent 归属均未被公开文档充分说明。页面示例里的“Issue”是任务内的问题描述，不能据此认定独立 Issue 实体；Flow 定义“怎么做”，Automation 定义“何时做”，也不能据此推导 DAG。[文档](https://luciusai.com/docs)、[Automation](https://luciusai.com/features/automation)

**改造影响**：如果要承担持续工作池，仍需先获得对象协议、生命周期和执行归属证据；外部补一个任务中心，会新增独立调度职责，不能当成 Lucius 已有能力。

### Windows 与 macOS 都可作为浏览器接入工作机，但未证实能承载本地中心或本地 Agent 执行服务

**已确认（入口观察）**：官方注册入口进入云端 Web 应用，本次浏览器访问被导向登录页，提供 Google 和工作邮箱入口；公开安装指引实际讲解渠道连接、Bot 授权和网站组件嵌入。[应用入口](https://app.luciusai.com/)、[安装与接入文档](https://luciusai.com/docs)

**未发现／未决**：在上述入口、公开文档和定向检索范围内，未发现官方 Windows 安装包、macOS 应用包、桌面 CLI、工作机执行守护进程或完整自托管部署清单。这表示两平台的原生中心与执行端支持均未证实，不表示浏览器无法访问，也不表示厂商绝无非公开交付方式。

**选型缺陷**：现有公开形态不满足主体能力在工作 PC 本地运行的 Local 优先要求。网站组件和平台聊天客户端只是接入界面，不是调度服务的本地替代品。

### 云端承担主体业务、持久化和凭据托管，不能当作可忽略的转发网关

**已确认（官方文档与条款）**：控制台管理 Workspace、Agent、渠道和知识；Automation 写入服务端数据库；隐私政策披露云基础设施提供者包括 AWS、Google Cloud，AI 服务包括 OpenAI、Anthropic，Gmail 功能还明确经过 OpenRouter。客户数据主要在美国存储处理，欧盟托管或区域化需要另行申请。[文档](https://luciusai.com/docs)、[Automation](https://luciusai.com/features/automation)、[隐私政策 §§7、9、18](https://luciusai.com/privacy)

**边界**：这些是官方公布的逻辑职责和服务提供者，不能证明某个租户同时使用全部提供者，也不能据此得出数据库类型、具体区域、网络拓扑或服务拆分。

**选型缺陷**：消息、知识、客户上下文以及连接凭据会进入供应商控制的系统；断网工作机不能独立完成同等流程。数据区域可谈判不等于软件可私有部署，更不等于提供离线形态。

### 标准接入是渠道与网站会话，不是向任意工作机分派任务的执行协议

**已确认（官方文档）**：网站通过控制台生成的 Script tag 或 npm 组件接入，并配置 App ID、Allowed origins 和负责回复的 Agent；Slack 使用 Socket Mode 长连接，飞书使用长连接事件订阅，邮箱支持 OAuth 或 IMAP/SMTP。[接入文档](https://luciusai.com/docs)

**未决**：未发现公开的调度 REST／WebSocket／gRPC 协议或任务 Worker SDK，能够让第三方工具领取任务、报告检查点、续租或移交执行权。服务条款提到 APIs，不等于提供了这些调度接口。[条款 §§1–2](https://luciusai.com/terms)

**权限影响**：Discord 指引要求 Bot 开启成员与消息内容 intents，并授予 Administrator；这是平台层高权限，不会因为 Lucius 内配置了角色边界就自动收窄。Slack、飞书和邮箱同样需要渠道或组织授权。[接入文档](https://luciusai.com/docs)

### 私有化与依赖剥离缺少可执行交付依据，不能按修改开源调度核心估算成本

**已确认（商业条款）**：公开授权是订阅期内有限、可撤销的服务使用权；供应商保留服务、软件与工作流等技术权利，条款限制逆向获取非公开实现。这不是开源许可证。[条款 §§2、8、10](https://luciusai.com/terms)

**未发现／未决**：未确认官方产品源码仓库、开源许可证、带版本自托管制品，以及数据库、消息中间件、模型服务的可替换配置。不能将“未找到源码”表述成已经证明所有组件闭源，但当前也没有开放核心可改造的证据。

**改造影响**：数据库持久化与唯一性约束属于官方定时执行机制的根基，不能直接删去；知识和模型属于业务执行能力，能否与调度核心解耦未公开。没有代码与部署契约时，把云端核心搬到 PC 不是已证实的小范围适配，而是先取证、取得授权，再确定工作量的事项。

### 自动化能力受套餐限制，公开文档存在不一致，可靠性不能照宣传绝对化

**已确认（当前价目页）**：Starter 为 $19/月；Scheduled reports 从 Growth 的 $99/月提供；Custom flows 从 Scale 的 $499/月提供。最低接入价格不等于调度场景的最低使用成本。[价格与功能表](https://luciusai.com/pricing)

**证据冲突**：当前价目页、首页和 `llms.txt` 的部分价格／credits 不一致；渠道首页 FAQ 使用“plans to support”，而安装文档已提供若干渠道的实际配置步骤。应逐能力确认已开通范围，不能将所有宣传项视为同一版本已发布。[首页](https://luciusai.com/)、[官方机器可读摘要](https://luciusai.com/llms.txt)、[文档](https://luciusai.com/docs)

**证据边界**：Automation 声称避免丢触发、重复发送，但本次未运行故障验证；条款亦不默认保证具体 uptime 或 Agent 一定完成任务。数据库唯一约束可解释触发去重，不能单独证明跨外部渠道副作用的 exactly-once。[Automation](https://luciusai.com/features/automation)、[条款 §§2.4、6.5](https://luciusai.com/terms)

## 调研目标

- 判断产品是否持久拥有工作对象、任务关系、生命周期与执行归属。
- 核验客户端接入、Agent 分派及失败、断线和重启后的连续性。
- 分别说明 Windows 与 macOS 工作机部署及 Local 优先适配程度。
- 建立完整云端模型，明确接口、通信、持久化与关键依赖。
- 评估架构范式、依赖剥离及私有化改造边界。

## 产品调研

### 产品定位与目标用户

**已确认（官方定位）**：Lucius / Lucius AI 面向存在重复客服、社区交流和运营协作的小型及成长型团队，提供可以接入现有沟通渠道的 AI 员工。核心价值不是在 PC 上运行任意任务，而是依业务知识回答、识别用户上下文、按规则执行动作，并把超出能力或权限的工作交给人。[首页](https://luciusai.com/)、[文档](https://luciusai.com/docs)

**已确认（官方公司自述）**：隐私政策将服务方列为 Lucius AI, Inc.，Delaware corporation；未独立核验其工商登记。[隐私政策 §1](https://luciusai.com/privacy)

### 核心流程

1. 管理员准备 Workspace，连接一个真实渠道，创建负责该渠道的 Agent，设置职责、语气、权限及人工接管边界。
2. 添加网站、文档、FAQ 或历史对话等知识源，先测试可回答、应拒答和应交接的场景，再发布到渠道。
3. 客户消息进入 Lucius；系统结合知识、客户上下文与规则，回答问题或按 Flow 补齐必要信息。
4. 证据不足、越权、敏感或客户要求人工时，停止自动处理，生成交接任务；人处理并回复后，解决方式回流知识库。
5. 管理员还可配置周期任务；时间到达后持久化触发、运行 Flow，并向创建时确定的工作渠道发送结果。[入门文档](https://luciusai.com/docs)、[任务功能](https://luciusai.com/features/tasks)、[Automation](https://luciusai.com/features/automation)

**边界**：这是文档描述的产品闭环，本次未创建账号、连接真实业务平台、发送客户消息或运行付费任务。

### 功能地图与边界

| 能力域 | 公开证据与业务职责 | 对本轮调度判断的意义 |
| --- | --- | --- |
| 角色与策略 | Agent 有身份、职责、知识范围、允许动作及停止条件；有人工介入边界 | 证明业务权限配置，不证明中心按任务选择执行者。[文档](https://luciusai.com/docs) |
| 知识与客户上下文 | 导入知识、标记冲突／过时项，记录客户历史；上下文在 Workspace 内隔离 | 属于长期业务状态，不等同于调度状态或任务检查点。[知识](https://luciusai.com/features/knowledge)、[客户记忆](https://luciusai.com/features/customer-profile) |
| 人工交接任务 | 汇总问题、证据、材料、建议动作；人解决后回流知识 | 证明产品创建工作记录和人工闭环，不证明 Task DAG。[任务](https://luciusai.com/features/tasks) |
| Flow | 定义任务如何做、可用工具和参数 | 是执行定义；公开材料未给出持久编排图、版本或中途恢复契约。[Automation](https://luciusai.com/features/automation) |
| Automation | 到期触发 Flow，持久化触发记录，失败重试和卡住恢复 | 有状态定时执行的直接依据，不能等同全部工作对象的 Stateful 编排。[Automation](https://luciusai.com/features/automation) |
| 渠道连接 | 网站、Discord、Slack、Telegram、飞书与邮箱有配置指导 | 是消息／业务接入，不是工作机 Worker 注册。[文档](https://luciusai.com/docs) |

**当前可用与规划边界**：有具体安装步骤的渠道，比只出现在能力列表中的渠道有更强支持证据，但仍未逐渠道实测。WhatsApp、部分 CRM／日历动作可见于宣传或计费举例，不能由此确认完整接入、授权及交付状态；未找到统一的 GA／Beta／废弃清单。[首页](https://luciusai.com/)、[文档](https://luciusai.com/docs)、[价格页](https://luciusai.com/pricing)

### 维护状态与版本演进

**已确认（可观察快照）**：2026-10-23 官网、详细接入文档和应用登录入口可访问。DPA 标注 2026-02-06，服务条款标注 2026-08-21，隐私政策更新至 2026-09-08，并具体说明 Gmail 接入和处理边界。这能说明公开运营资料存在更新，不能证明发布频率或生产服务可用率。[DPA](https://luciusai.com/security/dpa)、[条款](https://luciusai.com/terms)、[隐私政策](https://luciusai.com/privacy)

**历史事实（厂商复盘）**：2026-03-05 的团队文章表示结束早期企业化包装尝试并选择自建。它只证明当时的架构方向决策，不是当前版本已经完成重写、能够私有部署或具备某数据库架构的证据；不将文中旧方案实现套用到当前产品。[官方自建复盘](https://luciusai.com/blog/openclaw-enterprise-postmortem)

**未决**：没有取得正式 Release、版本号、分支快照或可回滚交付包，无法建立带版本的功能演进表。文档使用的 `app-v3` 子域也不是 Release 证明。订阅条款允许更新、修改和移除功能，故企业接入需要额外确认版本通知与兼容承诺。[文档](https://luciusai.com/docs)、[条款 §2.3](https://luciusai.com/terms)

### 生态与反馈

**已确认（官方接入生态）**：公开文档围绕渠道平台、网站 Script／npm 组件和邮箱授权展开；未提供任意第三方 Agent 接入调度的开发者契约。网站 npm 安装方式是一种前端组件交付方式，不足证明核心调度器开源。[文档](https://luciusai.com/docs)

**反馈样本边界**：官网选录了关于知识冲突提醒、社区应答与日报的客户评价；这些评价没有附完整原始讨论或统一评价日期。其中日报评价可辅助确认厂商展示过该使用场景，但不能作为定时执行可靠性的独立证据。[官网客户评价](https://luciusai.com/)

**未发现／未决**：本次官方链接和精确域名检索未确认可靠归属的公开 Issue／Discussion 样本，无法归纳重复出现的安装或恢复故障。也未确认产品源码仓库；研究环境缺少 `gh`，未完成 GitHub 站内 CLI 核验，不能把检索结果说成全网不存在。

## 技术架构调研

### 系统全貌与运行形态

**合理推导（组件职责模型，不是部署实测）**：Lucius 是供应商托管、以 Workspace 组织业务状态的云端应用。浏览器和渠道客户端是人机入口，云端承担策略解释、知识／上下文处理、业务执行、人工交接及定时执行。公开文档没有证明以下逻辑角色分别独立成服务或进程。

```text
Windows / macOS 工作机
  ├─ 浏览器 → Lucius 云端控制台 → Workspace / Agent / 渠道与策略配置
  └─ 平台客户端或网站访客界面
       ↓ 消息／邮件／网站会话
渠道接入层（Lucius 云端；网站组件亦连接此侧）
       ↓
业务执行层：Agent 角色 + Policy + Flow
  ├─ 知识与客户上下文 ↔ 云端业务状态
  ├─ 外部模型服务 → 回答／业务动作 → 原渠道
  └─ 超出边界 → 人工 Task → 人处理 → 知识回流

预设时间 → Automation → 持久化触发记录 → Flow 执行 → 指定渠道结果
                         ↑                 │
                         └─ 重试／卡住恢复 ┘
```

证据来自[入门与渠道配置](https://luciusai.com/docs)、[任务交接](https://luciusai.com/features/tasks)、[定时执行机制](https://luciusai.com/features/automation)以及[云端数据处理说明](https://luciusai.com/privacy)。图中箭头表示责任和数据关系，不代表已确认采用某种内部 RPC、队列或进程部署方式。

### Workspace、Project、Issue、Plan 与 Task：对象存在性不替代调度证据

| 对象 | 存在性、标识与归属 | 生命周期／关系与证据缺口 |
| --- | --- | --- |
| Workspace | **已确认（文档）**：网站安装需 active Workspace，邮箱列表属于当前 Workspace，客户上下文按 Workspace 隔离。标识格式和创建接口未公开 | 是租户／业务配置边界；不能由隔离推出任务依赖或调度归属。[文档](https://luciusai.com/docs)、[客户上下文](https://luciusai.com/features/customer-profile) |
| Project | **未发现**：已查文档未说明独立 Project 对象 | 无法确认层级、状态和 Task 归属；不拿 Workspace 代替 Project。 |
| Issue | **未确认独立对象**：任务页面中的 Issue 是示例 Task 的问题描述 | 不能据此声称独立 Issue 可转为 Task；外部 bug／投诉可以是交接输入。[任务页面](https://luciusai.com/features/tasks) |
| Plan | **未发现编排对象**：订阅 plan 是套餐，不能算工作 Plan | 未证实持久化计划、计划节点及其转换到任务的机制。[价格页](https://luciusai.com/pricing) |
| Task／交接事件 | **已确认（文档语义）**：由边界触发、知识冲突等创建；任务页展示 `Task #4182`、`Open` 及上下文。该编号和状态来自演示，不是本次创建的真实记录 | 有人处理和关闭后回流知识的路径；正文与摘要提到 owner，但未说明完整状态枚举、归属事务、跨故障恢复契约或与 event 的底层实体是否相同。[任务](https://luciusai.com/features/tasks)、[知识](https://luciusai.com/features/knowledge)、[官方摘要](https://luciusai.com/llms.txt) |
| Flow | **已确认（官方职责）**：定义执行内容、工具和参数，被 Automation 调用 | 配置复用可确认；存储结构、版本、步骤检查点及 Task 依赖解释器未公开。[Automation](https://luciusai.com/features/automation) |
| Automation／触发记录 | **已确认（官方机制）**：预设时间及目标渠道；触发先写数据库，运行历史记录计划时间、状态与动作结果 | 这是明确持久化的执行相关记录；唯一键、租约和它与人工 Task 的关联模型未公开。[Automation](https://luciusai.com/features/automation) |
| Agent／渠道绑定 | **已确认（安装文档）**：创建 Agent，并将渠道绑定给负责回复的 Agent；邮箱 Connected 后还须完成分派 | 证明配置期路由，不证明任务到来后动态挑选 Worker，亦未证明多 Agent 协作调度。[文档](https://luciusai.com/docs) |

**缺失项的影响**：没有公开证明 Project、Issue、Plan，不应虚构完整层级；没有 Task 依赖和执行归属证据，不能通过“有工作区、长期记忆和任务列表”完成 Stateful 调度判定。

### 主要组件与核心链路

#### 链路一：客户问题进入云端，自动处理或形成交接

**已确认（文档）**：渠道接收消息后交给已绑定 Agent；Agent 结合知识与用户上下文，按角色／规则答复或执行 Flow。未到权限边界时可以自动行动；需要人工时收集截图、账号或复现信息等上下文，停止自动回复并创建任务。[文档](https://luciusai.com/docs)、[任务](https://luciusai.com/features/tasks)

**边界**：渠道平台→Lucius→外部模型服务可能跨网络和供应商。平台凭据控制可读写范围，Lucius 的角色策略再决定其使用方式。Task 页提出退款、账单、账号权限和数据删除等由人执行；“支持退款流程”不能写成已授权自动退款。

#### 链路二：人工完成交接，解决方式进入长期知识

**已确认（产品描述）**：人解决 Task 并回复后，系统提取知识，用于后续同类请求；知识冲突可自动标记旧条目、暂停使用或派给知识 owner 裁决。[任务](https://luciusai.com/features/tasks)、[知识引擎](https://luciusai.com/features/knowledge)

**未决**：未公开人工关闭的完整权限和状态迁移规则、抽取结果的提交事务，以及客户回复、Task 关闭与知识写入之间失败时如何一致恢复。公开指南也要求将批准后的答案回填知识，不能据此保证所有关闭方式都无需人工确认。[文档](https://luciusai.com/docs)

#### 链路三：到期触发持久化，执行 Flow 并投递结果

**已确认（官方机制）**：用户选模板、目标渠道和时间，也可立即试跑；Automation 到期将触发记录写入数据库，执行 Flow，结果发送到创建时已验证的目标渠道。查询失败时将此次运行记为失败，不用模型编造结果；失败重试、卡住恢复及重启补发由系统负责。[Automation](https://luciusai.com/features/automation)

**合理推导**：该路径不依赖管理员每天登录或保持浏览器会话；它的连续性来自云端计划与触发记录，而不是工作 PC 的单次聊天进程。

**未决**：服务未公开后台 Worker 的具体选取、调度轮询／推送方式，以及“外部渠道已收到但本地状态提交失败”时的重试去重契约。

### 任务关系、生命周期与 Agent 连续性

| 问题 | 已取得证据 | 判定与边界 |
| --- | --- | --- |
| 工作从何而来 | 消息／邮件、知识冲突、人工配置的计划；定时追办可查找逾期未关闭事件 | 不只是人工单轮指令，但未证明能够自主生成和维护长期依赖计划。[任务](https://luciusai.com/features/tasks)、[知识](https://luciusai.com/features/knowledge)、[Automation](https://luciusai.com/features/automation) |
| 何时可执行 | 定时执行依据配置时间及时区；事件处理依渠道绑定、角色和规则 | 时间条件明确；Task 的前置依赖、资源条件、优先级与全局并发策略未公开。 |
| 谁推进状态 | Lucius 创建人工交接，人处理；Automation 记录触发、执行失败及跳过 | 是可辨认的责任划分，不是已确认的完整数据库状态机。 |
| 上下游如何联动 | 人工处理可触发知识回流；Automation 触发 Flow | 未发现 Task A 完成后解锁 Task B、失败传播、分支跳过或取消链。Flow 多步骤不能当作跨 Task DAG。 |
| 谁执行 | 渠道预先绑定 Agent；交接给团队，逾期事件可提醒其 owner | 未确认中心按能力／负载选择 Agent、Worker 主动抢单、执行归属持久化或再分派协议。 |
| 失败与卡住如何恢复 | Automation 声明 retry、watchdog 恢复、短窗口补发及 skipped | 证据限定于自动化执行，不应外推到所有交接任务、对话中间步骤或跨 Agent 接管。 |
| 检查点与结果在哪里 | 云端有运行历史、任务上下文和长期知识 | 结果记录不等同执行检查点；未确认从任意工具步骤恢复而不是重跑 Flow。 |

本表中没有明确标为已取得证据的能力均为**未决或当前未发现**，不因功能名称含 Agent、Task 或 Automation 而补齐。

### 主要依赖

| 依赖 | 已确认的职责 | 可关闭／替换／剥离边界 |
| --- | --- | --- |
| Lucius 云端账号与订阅 | 管理工作区、渠道、角色及业务状态；付费功能和 credits 控制使用范围 | 当前公开交付强绑定；不能通过不登录或去掉前端替代云端核心。[入口](https://app.luciusai.com/)、[条款](https://luciusai.com/terms) |
| 数据库持久化及唯一约束 | 到期触发留存、多实例重复触发协调 | 是已披露定时可靠性机制的底层依赖；数据库类型、最低版本、扩展和替换支持均未公开。[Automation](https://luciusai.com/features/automation) |
| 供应商云基础设施 | 计算、托管和应用记录存储；政策列出 AWS、Google Cloud | 这是供应商依赖，不是用户 PC 要安装的运行环境；不可推定用户可以自行切换。[隐私政策 §§7、9](https://luciusai.com/privacy) |
| 外部模型与模型路由 | 生成回复、解释上下文；邮箱明确使用 OpenRouter 及底层模型提供者 | 未公开离线模型、BYOK 或移除路由层的配置；不能认为列出多个模型即意味着用户可替换。[隐私政策 §18.2](https://luciusai.com/privacy) |
| 业务渠道及凭据 | 接收消息、邮件及执行外部写入 | 可选接入哪些渠道；撤销授权将停用相关功能。连接方式取决于平台，非统一 Worker 协议。[文档](https://luciusai.com/docs)、[条款 §3.4](https://luciusai.com/terms) |
| 知识与客户上下文 | 支持业务回答、回流及客户相关决策 | 属于业务能力，不足以推导向量数据库、向量扩展或与调度数据库共库；是否可以剥离未公开。[知识](https://luciusai.com/features/knowledge)、[客户上下文](https://luciusai.com/features/customer-profile) |

**未决**：没有证据说明必须部署 Redis、消息代理、容器平台或本地数据库；也没有证据说明这些内部依赖不存在。不能给出完整自托管最小运行栈或数据库最低版本。

### 接口形态与客户端接入

- **Web 控制台（已观察）**：云端登录和管理入口。登录页提供 Google 与工作邮箱继续方式；未完成登录，邮箱后续验证方式和租户级 RBAC 界面未实测。[应用](https://app.luciusai.com/)
- **Web Widget（官方文档）**：控制台生成 Script tag 或 npm 初始化方式，绑定 App ID、负责回复的 Agent 与 Allowed origins。访客在开始对话前必须填写邮箱，文档称此规则不能关闭；营销页中“访客可以匿名开始”的描述不能覆盖具体接入要求。[文档](https://luciusai.com/docs)、[网站功能页](https://luciusai.com/channels/website)
- **平台接口（官方文档）**：Discord／Telegram 提交 Bot Token，Slack 提交 Bot 与 App-Level Token，飞书提交 AppID／AppSecret；邮箱使用 Google／Microsoft OAuth 或 IMAP／SMTP。OAuth 回调指向 Lucius 云端，不是工作机监听端口。[文档](https://luciusai.com/docs)
- **调度接口（未决）**：未公开任务创建／领取、Worker 注册、检查点、心跳租约、完成回报的稳定契约；也未确认第三方调度 SDK、CLI、MCP 或 gRPC 接入。条款提到 API 不能补足协议。[条款](https://luciusai.com/terms)

**接入语义**：控制台创建／配置 Agent 与自动化；渠道把外部业务事件送入 Lucius；人工在产品内处理交接任务。没有证据表明浏览器“领取计算任务”，或服务端会唤起 Windows／macOS 上的任意程序。

**改造判断（合理推导）**：第三方工具可以通过已支持渠道提交消息，但这是输入桥接，不是接管调度执行。若要直接接入中心，需供应商先开放对象／执行协议；逆向网页私有接口既无稳定性保障，也受条款限制。本次未实施此类访问。

### 持久化方式

**已确认（直接机制）**：Automation 的触发是数据库记录；公开运行历史包含计划时间、状态、持续时间和动作摘要。数据库唯一约束用于多实例去重。[Automation](https://luciusai.com/features/automation)

**已确认（产品状态与条款）**：云端保留客户对话、知识和客户上下文；客户上下文声明在 Workspace 内隔离、可按个人导出或删除。邮箱还保存维持连接所需的授权凭据与同步邮件。[客户上下文](https://luciusai.com/features/customer-profile)、[隐私政策 §§3、18](https://luciusai.com/privacy)

**合理推导／未决**：长期任务记录、角色与渠道配置应由云端应用持有，但未取得其具体落库及恢复契约。不能推定所有业务对象与 Automation 共用同一数据库，也不能把聊天历史当成任务检查点。

**数据拥有与保管**：条款保留客户对 Customer Data 的权利，供应商代为处理；这与“数据库由供应商托管”是两种不同的所有权。DPA 提供按条件返回／删除数据的约定，不承诺导出的数据可以重建整套调度系统。[条款 §§7–8](https://luciusai.com/terms)、[DPA §9](https://luciusai.com/security/dpa)

### 通信方式

| 边界 | 已确认方式 | 未决事项 |
| --- | --- | --- |
| 工作机浏览器→Lucius | HTTPS 应用及网站组件入口 | 登录态管理、控制台内部 REST／SSE／WebSocket 细节未公开，不从页面技术外推。 |
| Slack→Lucius | Socket Mode 长连接收事件；不要求用户配置公开 Request URL | 心跳、断线重订阅、消息重放及分片实现未公开。[文档](https://luciusai.com/docs) |
| 飞书→Lucius | 长连接事件订阅，Lucius 服务启动时建立连接；配置云端 OAuth 回调 | 自动重连策略、会话归属及多副本协调未公开。[文档](https://luciusai.com/docs) |
| Discord／Telegram→Lucius | Bot 凭据与事件／消息权限 | 未在已查资料中确认当前服务端每种渠道采用的具体接收模式，不把外部平台可支持的所有模式视为 Lucius 已使用。 |
| 邮箱↔Lucius | Gmail／Microsoft OAuth；通用邮箱 IMAP／SMTP 与 TLS／STARTTLS | OAuth 是授权机制，不能据此断言实时推送；同步采用轮询、订阅还是 IDLE 未公开。[文档](https://luciusai.com/docs) |
| Automation→Flow | 先落持久触发，再执行并更新结果 | 是否经过内部消息代理、轮询领取或进程内通知未公开。[Automation](https://luciusai.com/features/automation) |

**合理推导**：Slack／飞书的长连接属于云端接入服务与平台的连接，不要求管理员工作 PC 维持本地入站公网端口。工作机网络条件与云端连接器网络条件必须分开评估。

### 任务队列

**已确认（官方机制）**：公开材料描述的是数据库支撑的持久触发记录，不是“只把以后做这件事保存在内存里”。它足以证明定时触发有耐久状态，不足以确定存在一个面向所有 Task 的统一持久工作队列。[Automation](https://luciusai.com/features/automation)

| 队列／协调问题 | 当前结论 |
| --- | --- |
| 多实例防重复触发 | **官方确认**：数据库唯一约束承担去重。唯一键、触发时间粒度和事务边界未公开。 |
| Worker 防重复领取／原子抢占 | **未决**：插入触发记录的去重，不自动等于执行期间互斥或抢占协议。 |
| 失败重试 | **官方确认**存在；重试条件、次数和退避未公开，不继续穷举内部实现。 |
| 卡住恢复 | **官方确认**由 watchdog 恢复；如何识别卡住、是否有租约或执行者 fencing 未公开。 |
| 重启错过时间 | **官方确认**短窗口内补发，超过窗口标记 skipped 并给出理由；窗口长度未公开。 |
| 外部副作用恰好一次 | **未验证**：唯一触发行不能单独保证网络故障下只发送一条消息；厂商“一次”表述需受控故障测试。 |
| 并发、优先级、资源限额 | **未决**：未公开调度级控制；credits 限额不能替代 Worker 并发或资源配额。 |
| 单机／分布式最小依赖 | **未决**：可识别数据库协调职责，但没有自托管拓扑与运行清单。 |

**架构推导**：重试、恢复和跳过具有系统级持久记录依据，不只是一次 Agent 会话内部循环；但看不到完整执行归属和互斥契约，不能认定支持任意 Worker 池的可靠故障转移。

### 部署形态

#### Windows 工作机安装与运行

| 项目 | 核验结果 |
| --- | --- |
| 安装方式 | **官方公开形态**是访问云端 Web 应用并连接渠道；未发现 Lucius Windows 原生安装包、后台服务或官方本地源码运行指引。[应用](https://app.luciusai.com/)、[文档](https://luciusai.com/docs) |
| 运行入口 | 浏览器进入控制台；日常业务可在网站或所连接平台使用。平台客户端不是 Lucius 本地执行器。 |
| 依赖 | **合理推导**：可访问服务的浏览器、账号及所选平台；未公开 Windows 最低版本和浏览器兼容矩阵。普通使用不需要由用户安装数据库、Node.js 或容器；npm 是网站开发接入选项，不是每台工作机的依赖。 |
| 权限 | 浏览器接入未要求本机管理员权限；渠道授权可能要求平台管理员。Discord 指引要求 Administrator；Slack 应用安装可能需 Workspace 管理员审批；网站组件需要网站发布权限。[文档](https://luciusai.com/docs) |
| 网络 | **合理推导**：需访问 Lucius 应用、身份认证及所用业务平台。没有本地监听端口安装步骤；邮件服务器访问主要由云端连接器承担。精确域名白名单与所有端口要求未完整披露。 |
| 升级 | 云端供应商更新，无已确认的 Windows 客户端升级程序；渠道权限变更可能需重新授权。 |
| 卸载／退出 | 没有可确认的 Windows 程序可卸载；应解除渠道绑定／撤销授权，停用网站组件，并按合同取消服务及请求数据处理。关闭浏览器或清理其缓存不等于停止云端 Agent。 |
| 支持结论 | **可推导为 Web 接入工作机；未做 Windows 实机测试**。本地中心、原生执行端和断网完整运行均未证实，是本轮选型缺口。 |

#### macOS 工作机安装与运行

| 项目 | 核验结果 |
| --- | --- |
| 安装方式 | **官方公开形态**同样是浏览器访问和渠道配置；未发现 `.dmg`／`.pkg`、应用商店安装、Homebrew CLI 或本地中心部署指引。[应用](https://app.luciusai.com/)、[文档](https://luciusai.com/docs) |
| 运行入口 | 本次在 macOS 浏览器环境实际打开官网与云端登录页；未登录。日常消息可以经平台 Web／桌面客户端进入云端，不代表 Lucius 在这些客户端进程内执行。 |
| 依赖 | 未公开最低 macOS 版本、Intel／Apple Silicon 限制和受支持浏览器清单。**合理推导**：云端 Web 使用不要求本机编译、数据库或容器；网站 npm 构建环境只涉及网站开发者。 |
| 权限 | 已查指引没有辅助功能、屏幕录制、完全磁盘访问或本机管理员安装步骤；不能将其描述为 PC 控制 Agent。实际高权限主要在连接的平台账号和网站发布侧。[文档](https://luciusai.com/docs) |
| 网络 | **合理推导**：与 Windows 同属云端接入需求；没有已证实的离线核心、回环本地服务或需要本机公网入站的部署形态。 |
| 升级 | 云端更新；无已确认的 macOS 安装包升级链路。Slack 改权限后须重新安装应用以重新授权，而非更新 Lucius 本机程序。 |
| 卸载／退出 | 无已确认本机包可移除；解除远端授权、移除网站安装代码、取消订阅与数据删除是不同操作，不能只关闭网页或删除书签。 |
| 支持结论 | **仅实际验证公开页面和登录入口可访问**；未验证登录后功能、平台连接或原生执行。完整中心与本地执行端均未证实。 |

#### 两平台共用的接入、升级和撤离约束

**已确认（文档）**：Website 需要有效 Workspace、负责回复的 Agent、网站发布权限和允许的 origin；npm／Script 安装代码由控制台生成，不能手改 App ID 或 API URL。Slack 修改 scopes 后需要重新安装应用。飞书文档仍将设置入口写为 `app-v3.luciusai.com`，而 OAuth 回调使用主应用域；本次未验证该分支入口，不能把它当成已确认推荐部署版本。[文档](https://luciusai.com/docs)

**撤离流程（建议，非本次执行）**：先导出所需业务数据并停止计划任务，再禁用 Widget／移除网站代码，解除邮箱与平台连接并在平台侧撤销授权，最后取消服务并发起数据删除。公开资料未给出涵盖所有连接器的一键卸载或全部 Token 删除承诺，须逐项确认。

**已确认（重要区别）**：Gmail 在 Lucius 内断开后停止进一步同步并清除连接凭据，但先前同步邮件和对话不会自动删除；仅在 Google 侧撤销授权也不会删除 Lucius 已保存的数据。Google 数据应按专门删除流程申请，不能直接套用一般数据的 30／90 天期限。[隐私政策 §18.4](https://luciusai.com/privacy)

#### 主体功能运行位置与 Local 优先

**判定**：公开完整路径为“工作机／网站／渠道端接入＋Lucius 云端业务主体＋外部渠道和模型”。没有证据支持完整本地、自托管、仅云端认证或离线桌面形态。[文档](https://luciusai.com/docs)、[隐私政策](https://luciusai.com/privacy)

**合理推导**：工作机断网或浏览器退出，不应被视为云端计划任务停止；反过来，云端或外部模型／平台故障也不能由工作机接管。这种持续执行位置位于供应商侧，而不是 Local 优先架构。

**最小使用成本（当前公开报价）**：普通接入为 Starter $19/月；需要明确列出的定时报告能力至少 Growth $99/月；高级自定义 Flow 至少 Scale $499/月。页面对 credits 的数字存在冲突，因此不据此计算运行次数；最终以确认后的订单和租户能力为准。[价格页](https://luciusai.com/pricing)、[条款 §4](https://luciusai.com/terms)

**运维复杂度**：用户不负责安装中心数据库，但仍负责平台凭据、权限审批、渠道可用性、知识质量、人工接管及套餐限额。供应商负责后台运行；自托管所需机器、运行时与运维成本因无交付依据而未决。

#### 云端形态：职责、依赖、数据与故障边界

| 云端逻辑部分 | 职责和已确认依赖 | 证据边界 |
| --- | --- | --- |
| 账号与 Workspace 管理 | 用户接入、租户配置、Agent／渠道绑定和服务授权 | 登录入口实见；后台服务拆分、认证存储及租户隔离实现未公开。[应用](https://app.luciusai.com/)、[文档](https://luciusai.com/docs) |
| 渠道连接器 | 接收消息、同步邮件、发送回复／动作；保存渠道连接凭据 | Slack／飞书长连接与邮箱授权有文档；连接器副本归属和凭据加密实现未公开。[文档](https://luciusai.com/docs)、[隐私政策 §18](https://luciusai.com/privacy) |
| Agent／Flow／Policy 执行 | 解释职责与工具边界、处理业务、生成交接 | 是逻辑功能，不据此认定独立微服务或沙箱类型。[Automation](https://luciusai.com/features/automation) |
| 业务存储与知识 | 对话、客户上下文、知识和配置；Task 对象的具体落库契约未公开 | 长期云端业务数据可确认；数据库、对象存储、向量检索引擎未公开。[隐私政策](https://luciusai.com/privacy)、[客户上下文](https://luciusai.com/features/customer-profile) |
| Automation | 计划到期判断、持久触发、运行历史、重试、卡住恢复 | 触发写数据库及唯一约束可确认；执行队列、租约和 failover 拓扑未公开。[Automation](https://luciusai.com/features/automation) |
| 外部托管与模型 | 政策列出 AWS／Google Cloud；模型提供者包括 OpenAI／Anthropic；邮箱模型调用经 OpenRouter | 提供者名单不是部署清单；具体租户路由与区域未公开。[隐私政策 §§7、9、18](https://luciusai.com/privacy) |

**数据与权限边界（官方披露）**：客户是业务数据控制方，Lucius 是代表客户处理的服务方。对话内容、平台标识、共享文件、知识材料、客户上下文和部分渠道凭据会进入云端；Gmail 明确请求 `gmail.readonly` 和 `gmail.send`，内容和相关上下文会提交模型服务生成回复，不接收 Google 登录密码。[隐私政策 §§3、18](https://luciusai.com/privacy)、[DPA §§2–3](https://luciusai.com/security/dpa)

**区域与托管（官方披露）**：主要数据基础设施在美国；EU 托管和特定区域诉求须申请／协商。未发现私有 VPC、客户自有云、离线许可证或完整本地制品交付说明。[隐私政策 §9](https://luciusai.com/privacy)、[条款 §7.4](https://luciusai.com/terms)

**访问控制（官方承诺）**：政策列出 RBAC、最小权限和管理访问 MFA；客户上下文页面声称 Workspace 间不共享。它们是供应商承诺，未做权限或隔离测试；管理 MFA 不能自动等同所有普通登录用户强制 MFA。[隐私政策 §11](https://luciusai.com/privacy)、[客户上下文](https://luciusai.com/features/customer-profile)

**故障影响（合理推导）**：控制台不可达会影响配置与人工处理；业务执行或数据库故障会影响回复、触发与任务推进；模型故障影响生成；渠道 Token 撤销、平台停服或网络不可达会影响收发。Automation 自述有重试恢复，但不能推断每一种连接器和副作用都具有相同恢复保证。合同默认没有指定 uptime 保证。[Automation](https://luciusai.com/features/automation)、[条款 §§2.4、3.4、9](https://luciusai.com/terms)

**云端证据缺口**：DPA 指向的 `https://www.luciusai.com/subprocessors` 在本次请求返回 HTTP 404；因此保留隐私政策提供的提供者类别和名字，但完整实体、地点、数据范围与变更名单仍需确认。这不是对应提供者不存在的证据。[DPA §6 与 Annex 3](https://luciusai.com/security/dpa)

### 依赖根源、架构范式与扩展改造边界

**架构范式（合理推导）**：供应商托管的、具有 Workspace 业务隔离的中心化业务应用，内部包含持久化定时执行机制。数据库唯一约束说明其设计考虑同时运行多个实例；不等于已确认分布式任务池、多调度节点选主或所有执行节点水平扩展方式。[Automation](https://luciusai.com/features/automation)、[客户上下文](https://luciusai.com/features/customer-profile)

**不能等价下沉为普通 Agent 节点**：单独让一个 Agent 执行 Flow，可以复用业务逻辑概念，但不会自动保留持久触发、唯一性协调、跨重启补发、watchdog 和历史状态。若要保持等价，必须仍有独立耐久状态及持续运行的调度／恢复责任方。

| 改造方向 | 可判定范围 | 主要约束 |
| --- | --- | --- |
| 给现有工具增加消息入口 | 利用已支持平台或网站组件对接业务请求 | 只解决输入输出，不获得任务领取、执行归属和恢复协议。 |
| 让第三方 Agent 直接执行中心任务 | 需供应商开放稳定 Task／执行协议 | 当前缺乏工作对象、租约、回报及失败转移契约；不能估为薄适配层。 |
| 将完整运行主体搬到 PC | 需源码或正式自托管包、许可、依赖及迁移方案 | Windows／macOS 原生支持、数据库和渠道长连接管理均未确认。 |
| 删除数据库或改为纯会话内状态 | 与已披露触发耐久性、唯一约束及恢复职责冲突 | 不是等价简化，会失去已知可靠性特性。 |
| 替换模型／剥离知识能力 | 业务与调度职责在概念上可以区分 | 实际模块边界、提供者配置和迁移接口未公开；不能把概念分离当成可直接关闭。 |
| 增加多调度节点／多 Worker | 唯一约束可抑制部分重复触发 | 无执行领取、fencing、渠道连接归属和负载策略证据，不能给出横向扩展保证。 |

本次没有可靠归属的源码和待核验入口，故未进行源码扫描；关键机制优先使用已经明确披露的官方描述，剩余实现缺口停止下钻并转为未决。

## 未决项与证据边界

- **严格 Stateful 资格未决**：缺少 Task 关系、全生命周期、执行归属、任务间依赖解锁和跨 Agent 接管证据；已确认的耐久性主要是 Automation 触发层。
- **版本与交付未决**：无正式版本、Release、自托管制品、核心源码许可证；不能给出当前主干实现结论。官方提供商业服务使用权，不等于已经获得核心源码许可。
- **平台支持边界**：只在 macOS 浏览器验证公开页面与登录入口；未做 Windows 实机、登录后产品、渠道授权、本地安装或断网实验。两平台原生中心／执行器均未证实。
- **恢复实现未决**：数据库类型／版本／扩展、原子领取、租约、重试细则、外部副作用幂等及恢复窗口未公开；没有运行证据保证 exactly-once。
- **接入协议未决**：控制台与渠道文档足够解释标准使用，但无法证明第三方 Agent 可直接领取中心任务。网站组件不是调度 SDK。
- **套餐与资料冲突**：价目页、首页、`llms.txt` 存在价格和 credits 差异；官方摘要的低阶价格不作为自动化成本依据。Widget 文档要求先填邮箱，与功能页的匿名访客叙述存在差异。[价格](https://luciusai.com/pricing)、[首页](https://luciusai.com/)、[摘要](https://luciusai.com/llms.txt)、[文档](https://luciusai.com/docs)、[网站功能](https://luciusai.com/channels/website)
- **云端供应链边界**：完整 subprocessor 入口本次 404；现有名单来自隐私政策，未取得租户实际托管地域与模型路由证明。[DPA](https://luciusai.com/security/dpa)、[隐私政策](https://luciusai.com/privacy)
- **维护反馈边界**：官方材料说明当前服务定位和部分机制，厂商选录评价不能替代独立故障样本；未确认公开产品仓库和讨论区，且环境缺少 GitHub CLI。

## 后续验证建议

1. **首先取得工作对象与调度演示**：要求供应商用真实 Workspace 展示 Task 的创建来源、负责人、状态迁移、等待条件和任务关系；若不支持依赖解锁，应明确按业务自动化而非通用工作编排评估。
2. **在授权测试租户验证 Automation 恢复**：覆盖正常定时、重复触发、执行失败、进程重启后短窗口补发、超窗 skipped，以及“渠道已发送但状态未提交”的场景。重启或多实例验证需供应商协助，不对生产环境做故障注入。
3. **确认跨 Agent 连续性**：区分渠道绑定与任务执行分派；要求证明 Agent 退出后任务由谁重新认领、从哪个检查点继续。若只有 Flow 重跑，不写成任务级断点恢复。
4. **补齐双平台交付资料**：分别确认 Windows／macOS 的浏览器支持矩阵、是否有原生执行端或完整本地中心；如有非公开私有化形态，索取安装、升级、卸载、网络和依赖清单。
5. **在接入前完成权限与撤离验证**：核实 Discord 是否必须授予 Administrator，确认最小可用 scopes、凭据保存与撤销方式；验证断开邮箱和删除历史数据是分开的流程。
6. **在承诺成本与改造前取得书面契约**：核对自动化套餐、credits、源码／自托管授权、数据库硬依赖、模型替换、开发者 API、完整 subprocessor 清单及数据区域。没有这些材料，不承诺本地化或第三方 Worker 对接工作量。
