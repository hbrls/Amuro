# Accio（Accio Work）技术产品调研

> updated_by: Qoder
> updated_at: 2026-10-23 15:01:16
> evidence_window: 2026-10-23；官网桌面公开下载 v0.35.2（包日期 2026-10-17）；更新记录截至 v0.36.0（2026-10-22）；在线帮助未绑定客户端版本，版本差异分别记录

## 交付结论

### 当前主体是具备本地执行能力的 Accio Work，不应按采购搜索网站理解

**已确认（官网及官方帮助）**：用户指定的 accio.com 当前首页主推 Accio Work，提供 Windows/macOS 桌面应用、执行云任务的 Web Portal，以及移动端通知与决策入口。桌面应用能操作本地文件、终端和真实浏览器，支持 Agent Group、临时 SubAgent、定时任务和外部工具连接，并非仅展示云端对话的桌面壳。[官网](https://www.accio.com/)、[快速入门](https://www.accio.com/work/doc?slug=quickstart)

其产品定位是面向中小企业和个体经营者的业务执行团队。采购和供应商研究属于业务能力，不应替代对当前本地执行、任务编排与云端服务的调查。

### 存在持久任务与依赖编排，但尚不足以确认为满足严格基准的 Stateful 调度中心

**已确认（官方功能说明）**：Agent Group 的任务跨会话保留，全组共享，具有执行归属、阻塞依赖和 `Pending → In Progress → Completed` 生命周期；TL 分派成员，成员更新状态。官方协作概览还明确写明成员在依赖允许时并行执行。这已经超过临时 TODO 和“收到输入就启动一次 Agent”。[团队指南](https://www.accio.com/work/doc?slug=agent-team-guide)、[协作概览](https://www.accio.com/work/doc?slug=agent-collaboration-overview)

**未决**：跨会话保留不等于进程崩溃恢复。任务依赖由确定性调度器还是 TL 的推理解释，执行归属如何与领取原子绑定，运行中任务在重启、失联、超时后如何重新排队或转交，均未获得充分证据。

**架构判定**：目前可确认的是“带持久任务协作层和本地定时器的 Agent 执行宿主／自动化运行器”；其具备有状态协作编排能力，但不能据此验收为可靠的 Stateful 调度中心，也不能反向称为纯 Stateless 或 Serverless 消费者。

### 本地定时器具有重启补偿，但不能据此认定为离线自治或云端接管

**已确认（官方文档）**：定时任务关联 Agent、目标会话、提示词和时间规则。电脑关闭时不运行，重新启动 Accio Work 后检查错过的任务。较详细的 Automations 文档说明：延迟不久的一次性任务会补跑，周期任务从当前时间恢复。[当前定时任务帮助](https://www.accio.com/work/doc?slug=help-scheduled-tasks)、[Automations 指南](https://www.accio.com/work/doc?slug=automations-guide)

**证据边界**：官网所称“本地计划离线仍可工作”只足以支持定时规则在本机触发，不证明依赖模型、网页或外部应用的任务能离线完成；新旧帮助对补跑粒度的表述也不同，不能承诺补齐每个历史周期。[官网 FAQ](https://www.accio.com/)

### Windows 与 macOS 均有正式安装入口，但不是可独立部署的中心服务证明

**已确认**：Windows 10 或更高版本、64 位；macOS 12 或更高版本，分别提供 Apple Silicon 与 Intel 安装包。本次对 v0.35.2 的 Windows EXE、macOS ARM64 PKG 和 x64 PKG 仅作 HEAD 请求，均返回 HTTP 200，未下载安装或运行。[安装帮助](https://www.accio.com/work/doc?slug=help-install)、[官网下载入口](https://www.accio.com/)

**选型影响**：双平台桌面客户端支持成立，但管理员权限、系统权限、后台常驻、卸载残留及运行恢复仍需双平台实测。安装客户端不能等同于获得可私有化的调度服务和完整后端。

### 本地执行是真实能力，但完整业务闭环仍依赖云端，Local 优先只能部分满足

**已确认**：官网明确模型访问经其网关，Web Portal 的任务在云端运行；安装文档同时承认 Web 与桌面数据尚未完全同步。应分别研究本地执行与云端执行，不能把它们理解为同一状态库的两个等价入口。[官网](https://www.accio.com/)、[安装帮助](https://www.accio.com/work/doc?slug=help-install)

**架构推导**：本地文件工具和本地编排不等于完全离线；模型推理、授权接入和外部业务工具不可用时，相关工作链路不能完整推进。本地执行与数据控制有价值，但对独立本地中心、完整断网运行和跨端一致恢复的要求仍存在缺口。

### 核心源码与完整自托管路径未公开，私有化不是已证明可行的小改造

**未发现**：在官网、帮助、条款和有限定向检索中，未取得主程序官方源码仓库、主程序开源许可证、完整后端镜像或自托管指南。服务条款对逆向和源码获取另有限制，不能把 Skills、配置文件开放等同于核心可自由修改部署。[服务条款 §3.4](https://cdn.contract.alibaba.com/terms/common_product_agreement/20260519212911543/20260519212911543.html?lng=en)、[Skills 指南](https://www.accio.com/work/doc?slug=skills-guide)

**选型影响**：核心实现不可审阅、云端强依赖及私有部署路径缺失构成明确缺陷；依赖替换、数据库剥离和调度恢复改造必须先取得厂商接口、源码及授权证据，当前不能承诺实施范围。

### 工具扩展不等于外部执行者接入，TL 下沉也不能替代持久运行时

**已确认**：官方标准入口是桌面应用、Web、移动端与 IM 消息；Skills/MCP 用于给 Agent 增加能力。团队任务由 TL 通过 task-dispatch 工具分派给产品内的成员。[官网 FAQ](https://www.accio.com/)、[团队指南](https://www.accio.com/work/doc?slug=agent-team-guide)

**架构推导**：TL 本身已经是普通 Agent 角色，但任务共享、持久化、成员唤起、定时器、权限与会话连续性仍由宿主承担。把 TL 提示词搬到其他 Agent，不会自动获得这些职责。MCP 或 IM 可作为业务输入、工具调用适配面，不能未经证明就当作外部 Worker 的领取、心跳或故障转移协议。

## 调研目标

- 判断持久工作对象、依赖关系及任务生命周期是否形成 Stateful 调度能力。
- 核实客户端接入、执行分派，以及失败、断线和重启后的连续性。
- 分别说明 Windows/macOS 安装、运行及本地与云端边界。
- 识别核心依赖、开源与服务边界、Local 优先适配及私有化改造约束。
- 判断架构范式与调度逻辑下沉的可行性。

## 产品调研

### 产品定位与目标用户

**已确认（官方定位）**：Accio Work 面向中小企业、个体经营者及业务团队，围绕研究、采购、店铺运营、营销和通用办公提供 Agent 执行能力。它的核心交互是给 Agent 或团队提出业务目标，授权使用本地文件、浏览器或外部业务应用，并在会话中取得成果。[产品说明](https://www.accio.com/work/doc?slug=help-about)

“业务团队”“主动智能”是产品定位，不直接证明自治发现工作、确定性任务调度或可靠交付。可确认的工作来源是人工消息、计划时间和已连接的 IM 消息；持续观察环境并自主生成、排序和闭环处理新工作，目前没有足够证据。

### 核心流程

**已确认（官方使用流程）**：安装并登录 → 创建或选择 Agent → 选择工作目录及工具能力 → 发送业务目标 → 必要时由 TL 拆分持久任务、设置依赖并分派成员 → 成员操作工具和更新任务 → TL 汇总，用户检查并授权必要的外部动作。[快速入门](https://www.accio.com/work/doc?slug=quickstart)、[团队指南](https://www.accio.com/work/doc?slug=agent-team-guide)

成果可以作为回复、附件或工作目录中的文件交付；“任务 Completed”仍主要依靠 Agent 更新，没有充分证据证明存在统一的独立验收器。删除会话也不等于删除 Agent 长期记忆。[会话指南](https://www.accio.com/work/doc?slug=chat-guide)、[常见操作](https://www.accio.com/work/doc?slug=help-common-ops)

### 功能地图与边界

| 功能域 | 已确认的使用能力 | 对调度判断的边界 |
| --- | --- | --- |
| 单 Agent 执行 | 文件、终端、浏览器、外部工具，流式展示过程与成果 | 是执行闭环，不自动证明中心调度 |
| Agent Group | 长期成员、TL 分派、共享任务、依赖和执行归属 | 存在有状态协作；可靠恢复机制未决 |
| SubAgent | 独立会话中的临时后台子任务，可并行 | 任务完成或超时即终止，不等同持久 Worker |
| Scheduled Tasks | 自然语言或界面创建、指定 Agent 和会话、定时触发 | 电脑关闭时不执行；补偿触发不等于故障任务恢复 |
| Skills／MCP／Plugins | 为 Agent 增加业务知识和外部工具能力 | 是能力扩展，不是已经证明的调度控制 API |
| Channels | 外部聊天消息进入 Agent，向用户返回结果 | 消息触发，不等同事件总线或事务性任务队列 |
| 记忆与 Workspace | 记忆跨会话使用、工作目录约束文件操作 | 记忆与文件隔离不能替代任务状态和依赖 |

依据：[官网 FAQ](https://www.accio.com/)、[协作概览](https://www.accio.com/work/doc?slug=agent-collaboration-overview)、[定时任务](https://www.accio.com/work/doc?slug=help-scheduled-tasks)、[Agent Core](https://www.accio.com/work/doc?slug=agent-core-design)。

### 维护状态与版本演进

**已确认（官方发布）**：Accio 于 2024 年 11 月以 B2B 采购搜索起步；2025-08-14 发布的 Accio Agent 是网站 Agent Mode，采购询盘仍由用户最后确认发送；2026-03-23 发布 Accio Work，将主体扩展至业务执行团队。因此当前研究以 Work 为主，早期采购功能仅作为产品演进背景。[Agent 发布](https://www.prnewswire.com/news-releases/alibaba-international-releases-the-worlds-first-ai-agent-for-global-trade-302530000.html)、[Work 发布](https://www.prnewswire.com/news-releases/alibaba-international-launches-accio-work-an-enterprise-ai-agent-for-global-businesses-302721683.html)

**已确认（公开版本记录，不代表实测）**：与调度和接入直接相关的变化如下。[官方 Changelog](https://www.accio.com/work/documents/en/changelog.html)

| 版本与日期 | 影响核心判断的变化 | 证据边界 |
| --- | --- | --- |
| 0.29.0，2026-08-12 | 外部浏览器自动化升级，修复 macOS 更新兼容与本地文件预览问题 | 说明双平台和浏览器连接持续维护，不证明所有环境稳定 |
| 0.32.0，2026-09-02 | 群聊可创建运行计划；计划跨升级保留；Agent 配置丢失或损坏可恢复；Web 继续向桌面能力靠拢 | 为计划持久化提供补证，但配置恢复不等于运行中 Task 恢复 |
| 0.35.0，2026-10-19 | 新增隔离内置浏览器；修复 Agent 升级导致会话和记忆丢失，称升级仅更新程序文件 | 新增另一种浏览器执行形态；升级保留需在目标包验证 |
| 0.36.0，2026-10-22 | 修复睡眠唤醒并重连后无法继续、后台长任务丢失、计划堆积和慢网／离线下一次性任务失败；计划可选择上下文保留范围 | 厂商承认这些连续性缺陷并列出修复；不能据此推导精确恢复、幂等和故障转移语义 |

**版本差异**：当日官网下载仍指向 v0.35.2，三类包日期均为 2026-10-17；更新记录最新列示 0.36.0，且所查记录未列出 0.35.2。分发版本与记录并未对齐，原因未决。本报告分别保留两者，不能把 0.36.0 的修复当作官网下载包已经具备的行为。[官网](https://www.accio.com/)、[Changelog](https://www.accio.com/work/documents/en/changelog.html)

**维护判断**：官方在持续交付，近期重点包括本地状态保留、睡眠恢复、计划任务和浏览器执行稳定性。成熟度应描述为“有实际产品化能力、持续修复可靠性问题”，不能仅凭 Agent 定位或更新频率认定可靠自治已经成熟。

### 生态与反馈

**已确认**：标准扩展方向包括 Skills、MCP、第三方应用连接以及 IM Channels。官方安装帮助把登录跳转、更新后找不到历史、模型或高峰时段引起的响应变慢列为故障排查场景；其中“Web 与桌面尚未完全同步”直接影响跨端接入与工作连续性。[安装帮助](https://www.accio.com/work/doc?slug=help-install)

这些是厂商承认或预期的支持场景，不是故障率统计。版本记录进一步确认持续修复升级状态丢失、睡眠恢复、后台长任务和计划堆积问题；只能据此选取验收场景，不能推导其普遍发生或修复已经生效。[官方 Changelog](https://www.accio.com/work/documents/en/changelog.html)

**独立反馈边界**：本轮抽查到官方 Browser Relay 的商店入口及评价聚合，但未取得足够可逐条核验的原始评论，因此不归纳普遍用户故障、不使用聚合评分判断可靠性。首页用户证言同样不能代替独立样本或证明无人值守成功率。[扩展商店入口](https://chromewebstore.google.com/detail/accio-browser-relay/allhanmilpgeamlpoanonpgognlofono)、[评价聚合](https://extops.dev/extensions/allhanmilpgeamlpoanonpgognlofono)

## 技术架构调研

### 系统全貌与运行形态

**已确认**：官方 FAQ 将桌面技术形态描述为 Electron；桌面能使用本地系统资源，Web Portal 则面向云执行。以下为依据官方职责描述形成的逻辑拓扑，不是对内部微服务或实际部署清单的确认。[官网](https://www.accio.com/)

```text
Windows / macOS 工作机
  桌面界面
    └─ Agent 执行宿主
        ├─ 单 Agent / TL / Member / 临时 SubAgent
        ├─ 团队持久任务与本地定时器
        ├─ 工作目录、Agent 私有配置与记忆
        └─ 权限检查 → 文件 / 终端 / Chrome Relay / 工具连接
                  │
                  ├─ 网络 → Accio 账号、模型网关及业务服务
                  └─ 网络 → 已授权的外部应用、MCP 与 IM 平台

浏览器 Web Portal → Accio 云端任务执行环境
移动端 / IM       → 消息、结果及人工决策入口

本地与云端的任务迁移、完整状态同步和接管关系：未决
```

**边界**：桌面宿主并非已证明可拆出的独立服务；本地 TL 也不是独立数据库调度中心。Web 云运行时的具体组件、存储与消息栈需要与可确认的外部职责分开记录。

### 工作对象、任务关系与生命周期

| 对象 | 实际形态及归属 | 关系与调度含义 |
| --- | --- | --- |
| Workspace | **已确认**为群组绑定的文件操作根目录，默认可取 TL 的工作目录 | 约束文件访问；不是已经证明的跨项目任务调度实体 |
| Project | Agent 目录模型含默认 `project/` 工作目录；**未发现**独立 Project 生命周期的充分证据 | 不能把文件夹叫作项目就推导出项目级依赖或调度 |
| Issue | 文档举例可周期检查外部仓库 Issue；**未发现**原生持久 Issue 对象的充分证据 | 外部问题可成为输入，但没有证据证明与本地 Task 双向同步或由中心持有 |
| Plan | TL 创建“task plan”，体现为任务拆分和依赖；**未确认**有独立 Plan ID、版本或生命周期 | 已持久化的是文档所述团队 Task，不能把规划文本本身认作编排对象 |
| Task（团队） | **已确认**全组共享、跨会话保留，可分配给 Agent；示例以任务编号引用 | 支持阻塞依赖，状态为 Pending、In Progress、Completed；全局 ID、存储和并发更新规则未披露 |
| Scheduled Task | **已确认**持有名称、Agent、目标会话、提示词和时间规则 | 定时触发某 Agent；与团队任务之间是否有统一 ID 和状态模型未披露 |
| Agent／Group／Session | **已确认**持久成员可加入不同群，每个群有自己的 Session；临时 SubAgent 使用独立 Session | 角色与会话是运行组织单元，不等同对外可领取任务的 Worker |

依据：[团队指南](https://www.accio.com/work/doc?slug=agent-team-guide)、[协作概览](https://www.accio.com/work/doc?slug=agent-collaboration-overview)、[Agent Core](https://www.accio.com/work/doc?slug=agent-core-design)、[定时任务](https://www.accio.com/work/doc?slug=help-scheduled-tasks)、[Automations](https://www.accio.com/work/doc?slug=automations-guide)。

**已确认的推进责任**：用户消息默认交给 TL；TL 分析、创建任务并用 task-dispatch 分派；成员完成工作后可更新任务；TL 汇总并继续分派后续工作。用户也可直接 @ 某成员触发执行。成员之间不通过互相 @ 自动激活。[团队指南](https://www.accio.com/work/doc?slug=agent-team-guide)

**已确认的关系能力**：官方例子将两个研究任务并行处理，下游写作依赖两者；协作概览说明在依赖允许时启动成员。文档并未进一步保证任意 DAG 校验、循环检测、父子任务级联或依赖满足后无需 TL 推理即可自动领取。

**未决的生命周期边界**：没有足够公开说明覆盖 Failed、Blocked、Cancelled、Timed Out 等持久状态及迁移责任；也未说明上游失败后下游是阻塞、跳过、重试还是取消。成员有轮数和超时保护，但停止执行不等于持久任务自动进入可恢复状态。

**调度策略边界**：时间规则已确认参与定时触发，角色描述影响 TL 选择成员；优先级、资源配额、跨组并发限额是否参与任务领取决策未决。支持并行与限制成员数不能直接证明资源感知调度。

### 主要组件与核心链路

#### 链路一：人工业务目标进入团队任务并交付结果

**已确认（官方流程）**：用户消息 → TL 先分析 → 创建共享任务、执行归属和依赖 → TL 分派 → 依赖允许的成员并行运行 → 工具权限检查 → 成员输出与状态更新 → TL 汇总交付。成员启动在 TL 分析与分派决策完成之后，避免其看不到完整的上层决策。[团队指南](https://www.accio.com/work/doc?slug=agent-team-guide)、[协作概览](https://www.accio.com/work/doc?slug=agent-collaboration-overview)

**未决**：文档未交代分派消息与 Task 状态更新是否为同一事务，也未确认 TL 退出后是否有独立循环继续检测可执行任务。不能从正常流程图推导异常恢复保证。

#### 链路二：本地计划产生新一次执行

**已确认**：用户在会话或管理页面创建规则 → 绑定 Agent、目标会话、指令和时间 → 本地时间到达后触发 → Agent 执行并在会话返回带定时标记的结果。页面可以管理任务，较详细指南提供暂停、恢复、Run Now 和执行历史。[定时任务](https://www.accio.com/work/doc?slug=help-scheduled-tasks)、[Automations 指南](https://www.accio.com/work/doc?slug=automations-guide)

**已确认的连续性下限**：重启 Accio Work 后会检查错过的触发。**未决**：电脑睡眠、系统时区变化、执行时间超过周期、重复启动客户端，以及已运行一半的副作用任务如何处理；补跑窗口与去重语义未披露。

#### 链路三：外部消息或业务工具参与执行

**已确认**：IM Channel 配置后可自动接收任务消息与回复；浏览器业务操作可以通过桌面 Chrome 扩展连接现有浏览器；文件和外部工具产生的结果返回 Agent 会话。[官网 FAQ](https://www.accio.com/)、[开始任务](https://www.accio.com/work/doc?slug=help-start-task)

**架构推导**：这是跨网络与外部账号边界的工作链路。消息成功送达、工具动作成功，以及持久任务完成是不同事件；没有证据把它们提升为端到端事务或恰好一次业务执行。

### 主要依赖

| 依赖 | 角色与强弱 | 剥离边界 |
| --- | --- | --- |
| 桌面应用与本地运行环境 | **已确认**承载本地工具、工作目录与定时执行 | 若移除桌面宿主，不能假定本地计划、文件执行和团队状态仍存在 |
| Accio 模型网关及模型服务 | **已确认**官网规定的模型接入路径 | 自有网关、BYOK、完全本地模型和离线闭环尚无充分证据 |
| Chromium 浏览器／Chrome 与连接能力 | **已确认**支持 Browser Relay；Direct CDP 标为 Beta，建议 Chrome M144+ | 扩展不是唯一途径，也不是文件任务硬依赖；新版本另列内置浏览器，须按目标包验证 |
| 外部应用授权、IM、MCP | **已确认**按所选业务能力引入 | 不使用相应业务时可以不配置；不能由此推导核心云依赖可移除 |
| 本地文件状态、云端状态存储 | 部分文件形态已公开，底层数据库未公开 | 不能提出已经可执行的数据库替换、嵌入式化或去中间件方案 |

依据：[官网](https://www.accio.com/)、[Agent Core](https://www.accio.com/work/doc?slug=agent-core-design)、[安装帮助](https://www.accio.com/work/doc?slug=help-install)、[浏览器指南](https://www.accio.com/work/doc?slug=browser-use-guide)、[Changelog](https://www.accio.com/work/documents/en/changelog.html)。

**架构推导**：记忆检索、商业数据、垂直 Skills 是增值能力；任务记录、依赖、执行归属、权限与可恢复推进属于调度最小职责。公开资料不足以把后者落实到某个事务数据库或消息队列，更不能把它们全部当作可选插件。

### 接口形态与客户端接入

**已确认**：桌面和 Web 是用户创建、管理并观察工作的入口；IM 是外部消息入口；Skills/MCP 是能力扩展；内部 Agent 使用任务分派与 SubAgent 启动工具；真实浏览器控制由官方描述的 Chrome DevTools Protocol 与 Browser Relay 路径承担。[官网 FAQ](https://www.accio.com/)、[协作概览](https://www.accio.com/work/doc?slug=agent-collaboration-overview)、[开始任务](https://www.accio.com/work/doc?slug=help-start-task)

**未发现／未决**：在本轮核验的官方入口中，没有足够证据确认可供第三方跳过官方客户端使用的稳定调度 REST、WebSocket、gRPC、CLI 或 SDK 契约；也未确认任意工作机 Worker 注册、领取、续租与提交结果的协议。内部工具名和前端请求不能自动当作承诺稳定的公共 API。

**接入语义**：官方客户端主要是创建、管理与执行工作的整体宿主；并未证明它只是从远程中心领取任务的薄 Worker。两个桌面平台使用同一产品入口，未发现已公开的平台特有 Worker 协议。

**改造判断**：通过 IM 或工具桥接可以形成“向 Accio 提交业务指令／让 Accio 调用工具”的集成，但是否能维护任务依赖、执行归属和故障转移仍未决。若目标是接入另一种执行器，必须先取得受支持的任务控制与状态契约，不能用 UI 自动化等价替代调度集成。

### 持久化方式

**已确认（官方设计文档）**：Agent 私有目录以 `agents/{agentId}/` 表示，保存配置、角色和长期记忆等文件；`project/` 是默认工作目录，另有运行状态目录。此处是官方逻辑目录说明，不是已经核验的 Windows/macOS 安装绝对路径。[Agent Core](https://www.accio.com/work/doc?slug=agent-core-design)

**已确认（产品语义）**：团队 Task 跨会话保留；成员共享任务清单；计划有管理列表与执行历史；生成文件写入工作目录。**未决（存储实现）**：团队任务、依赖、归属与执行历史的本地具体文件、数据库类型、事务范围、同步协议和恢复格式未披露。[团队指南](https://www.accio.com/work/doc?slug=agent-team-guide)、[Automations](https://www.accio.com/work/doc?slug=automations-guide)、[常见操作](https://www.accio.com/work/doc?slug=help-common-ops)

**已确认的跨端限制**：官方明确 Web 与桌面数据尚未完全同步。不能据此指定哪一个数据库是全产品状态权威，也不能声称换设备即可接管运行中任务。[安装帮助](https://www.accio.com/work/doc?slug=help-install)

**数据库结论**：没有可靠证据给出强制数据库类型、最低版本、专属扩展、外置与内嵌配置差异或可关闭选项；均保留未决。不按常见 Electron 应用习惯猜测 SQLite，也不按厂商基础设施推定云端数据库产品。

### 通信方式

**已确认（文档语义）**：会话流式展示响应；团队共享会话消息，每个 Agent 获取自上次回复以来的增量消息；TL 分派成员，临时 SubAgent 完成后回传父 Agent；Channels 传递外部消息。[会话指南](https://www.accio.com/work/doc?slug=chat-guide)、[团队指南](https://www.accio.com/work/doc?slug=agent-team-guide)、[协作概览](https://www.accio.com/work/doc?slug=agent-collaboration-overview)

**已确认（本地浏览器连接）**：浏览器指南明确该连接使用 `127.0.0.1` 和随机令牌鉴权，复用用户现有浏览器登录会话；Direct CDP 为会话级授权，重启后需重新批准。该链路本地化不证明网页提取内容不会作为上下文送到模型网关。[浏览器指南](https://www.accio.com/work/doc?slug=browser-use-guide)

**未决（其他传输实现）**：流式回复并不能证明采用 SSE 或 WebSocket；群消息共享并不能证明使用某种消息中间件。桌面 UI 与执行宿主的 IPC、跨设备推送、断线重放和保活协议没有充分证据。

### 任务队列

**已确认**：产品拥有持久共享任务清单、时间规则及任务分派，成员能并行执行。**未决**：任务清单是否由持久化队列驱动，是否有原子领取、防重复派发、租约、超时回收、中心重试与失败转移，均未公开。[团队指南](https://www.accio.com/work/doc?slug=agent-team-guide)、[Automations](https://www.accio.com/work/doc?slug=automations-guide)

**关键区分**：文档证明本地运行时负责在重启后检查错过的计划时间；没有证明它同样负责恢复一项已领取、部分完成的团队任务。执行轮数和超时限制也不是队列租约。单机之外的分布式最小依赖、多节点互斥与共享队列一致性保留未决。

0.36.0 的记录补充了睡眠后继续执行、后台长任务保留和计划堆积修复，但没有公开领取、重放、租约和幂等机制，且该记录与当日下载包存在版本差异；它提高了恢复能力的证据强度，仍不足以给出严格队列保证。[Changelog](https://www.accio.com/work/documents/en/changelog.html)

### 部署形态

#### Windows 工作机

**安装与入口（已确认）**：Windows 10 或更高版本、64 位，官网下载 EXE；v0.35.2 对应文件 `Accio-0.35.2-20261017-2100-win.exe`。安装后启动客户端并登录进入工作区。本次仅确认文件可访问，未运行安装器。[安装帮助](https://www.accio.com/work/doc?slug=help-install)、[Windows 安装包](https://work-download.accio.com/package/v0.35.2/Accio-0.35.2-20261017-2100-win.exe)

**依赖与权限**：本地文件操作需授权工作目录；终端与浏览器受产品权限策略约束。现有 Chromium 浏览器可通过 Relay 扩展连接，指南要求开启扩展开发者模式并加载客户端提供的目录；另有 Direct CDP（Beta）可不装扩展，建议 Chrome M144+，开启远程调试并批准连接，重启后需重新授权。是否需要 UAC、管理员安装、系统服务或额外运行库，官方安装帮助未充分说明。[开始任务](https://www.accio.com/work/doc?slug=help-start-task)、[浏览器指南](https://www.accio.com/work/doc?slug=browser-use-guide)

**网络与运行**：登录、模型和所选外部业务需要相应网络；定时任务要求电脑及 Accio Work 处于可执行状态。独立后台服务、自启动与睡眠唤醒行为未决，不能假定关闭窗口仍能保持任务运行。

**升级（已确认）**：应用内检查更新或重新下载最新安装器；官方说明升级本身不应清空历史，但不同端历史尚未完全同步。[安装帮助](https://www.accio.com/work/doc?slug=help-install)

**卸载（未决）**：核验到的安装帮助没有完整卸载说明。可将 Windows“设置 → 应用 → 已安装的应用”中的标准卸载作为后续验证入口，但本轮未确认卸载器注册、静默卸载参数、残留目录或卸载对任务和云端账号的影响；不得声称卸载已清除全部数据。

#### macOS 工作机

**安装与入口（已确认）**：macOS 12 或更高版本；分别提供 Apple Silicon ARM64 与 Intel x64 PKG。v0.35.2 文件日期为 2026-10-17。按处理器选择安装包，安装并登录客户端。本次没有执行 PKG。[安装帮助](https://www.accio.com/work/doc?slug=help-install)、[Apple Silicon 安装包](https://work-download.accio.com/package/v0.35.2/Accio-0.35.2-20261017-2153-arm64.pkg)、[Intel 安装包](https://work-download.accio.com/package/v0.35.2/Accio-0.35.2-20261017-2153-x64.pkg)

**依赖与权限**：操作现有浏览器同样可选 Relay 扩展或 Direct CDP（Beta），后者建议 Chrome M144+ 且会话重启后需重新授权；本地工具受工作目录及产品审批策略约束。PKG 是否要求管理员权限，应用签名与公证状态，是否需要辅助功能、屏幕录制或完全磁盘访问，尚未核验；不能将 CDP 浏览器控制等同于必需全桌面录屏权限。[浏览器指南](https://www.accio.com/work/doc?slug=browser-use-guide)

**网络、常驻与升级**：网络边界与 Windows 同类；更新方式也是应用内更新或重新安装最新版。锁屏、睡眠、退出客户端、登录项和后台进程的行为未决，不承诺笔记本合盖后继续本地执行。[安装帮助](https://www.accio.com/work/doc?slug=help-install)、[定时任务](https://www.accio.com/work/doc?slug=help-scheduled-tasks)

**卸载（未决）**：官方帮助未明确 PKG 所安装组件的完整卸载流程。删除应用本体只能作为普通 macOS 应用的验证起点，不能证明清除了登录项、辅助进程、Agent 记忆、定时规则或凭据。需在获授权的测试机核验卸载范围，不提供猜测性的批量删除命令。

#### 辅助组件与主体位置

**已确认**：Chrome Relay 扩展是桌面浏览器能力的辅助组件，不能代替完整执行宿主；Web 不需要安装，但某些桌面能力不可用。Linux 容器、自托管中心服务和源码构建部署不在当前已确认的用户安装路径中。[安装帮助](https://www.accio.com/work/doc?slug=help-install)、[开始任务](https://www.accio.com/work/doc?slug=help-start-task)

**架构判定**：产品整体属于本地与云端混合形态。本地负责真实工具执行与本地自动化，云端并非只提供静态页面；其至少承担模型接入及 Web 任务执行。两端完整功能等价和自动接管均未证实。[官网](https://www.accio.com/)

#### 云端形态与开源服务边界

**适用范围（已确认）**：所查官网服务条款与隐私政策均于 2026-07-20 生效，覆盖中国大陆以外用户；合同主体为 ACCIO GLOBAL TECHNOLOGY PTE. LTD.，条款覆盖网站、App 和桌面应用。不能把该法律与托管边界直接套用到另一个地区站点。[服务条款](https://cdn.contract.alibaba.com/terms/common_product_agreement/20260519212911543/20260519212911543.html?lng=en)、[隐私政策](https://cdn.contract.alibaba.com/terms/privacy_policy_full/20260128160936548/20260128160936548.html?lng=en)

| 云端角色 | 已确认职责、依赖与接口 | 持久化、边界和未决项 |
| --- | --- | --- |
| 账号及访问服务 | 邮箱或 Alibaba International 账号登录，客户端登录与浏览器账号相关 | 账号体系在云端；协议、会话令牌格式、企业 SSO 和组织级 RBAC 的完整支持未确认 |
| 模型路由网关 | 官网明确经其网关调用模型，支持多个模型系列 | 网关具体转发字段、缓存、保留和故障切换未公开；不可视为不接触内容的纯认证服务 |
| Web 云任务环境 | 官网明确 Web Portal 为云端运行任务提供入口 | 计算部署单元、任务存储、隔离机制、任务队列与桌面迁移协议未公开 |
| 业务与工具连接 | 连接器通过 OAuth 或 API Key 授权业务应用；MCP 增加外部工具 | 连接器执行进程位置和凭据托管范围不完全明确；第三方有独立条款和网络依赖 |
| 业务数据托管 | 隐私政策覆盖输入、附件、输出及连接应用提供的信息 | 有保留及跨境处理政策，但不是逐类任务对象的物理存储设计；数据库、备份和删除传播机制未公开 |

依据：[官网](https://www.accio.com/)、[账号帮助](https://www.accio.com/work/doc?slug=help-login)、[连接器指南](https://www.accio.com/work/doc?slug=connectors-guide)、[隐私政策](https://cdn.contract.alibaba.com/terms/privacy_policy_full/20260128160936548/20260128160936548.html?lng=en)。上表是可确认的功能职责，不是声称厂商恰好部署了五个独立服务。

**托管及地域（已确认但限定范围）**：隐私政策 §6 说明个人信息依用户所在地在美国、德国和／或新加坡处理和存储，并可能跨境传输。韩国专章 §14.2 列示 Alibaba Cloud 数据托管、Wispr 语音转写，以及 Anthropic、OpenAI、Google 模型服务及相应 API 传输；这是地区性处理者披露，不是全局部署图，不能据此认定所有任务都由同一云服务商或区域执行。[隐私政策 §6、§14.2](https://cdn.contract.alibaba.com/terms/privacy_policy_full/20260128160936548/20260128160936548.html?lng=en)

**业务数据边界（已确认）**：政策 §2.1 包含用户输入、上传附件、图片、语音、输出和连接应用信息；§3 包含研究和模型改进／训练用途，并对相关个人信息的聚合或去标识处理作出说明。§5 的保留原则为持续合法业务需要，而非统一保留天数。不能把“本地默认保存”概括为所有内容永不离机、绝不用于训练或云端零保留。[隐私政策 §2.1、§3、§5](https://cdn.contract.alibaba.com/terms/privacy_policy_full/20260128160936548/20260128160936548.html?lng=en)

**声明之间的边界**：Work 发布稿称用户可选择不在服务器保存数据，这是厂商承诺；当前具体设置位置、适用数据类型、是否覆盖模型提供者，以及对云任务的影响尚未确认。“不保存在服务器”与“从未通过模型网关处理”不是同一命题。[官方发布稿](https://www.prnewswire.com/news-releases/alibaba-international-launches-accio-work-an-enterprise-ai-agent-for-global-businesses-302721683.html)

**权限及治理（已确认为文档规则，未作安全审计）**：通用策略默认允许读取和网络访问，写入、Shell、浏览器通常需要审批，支持拒绝规则以及单次、会话、持久授权，并宣称按工作目录限制文件访问。但 Daily Assistant 模板明确写入可自动批准，不能承诺每个模板每次写入都需人工确认。实际策略应按模板和 Agent 配置验收。[权限指南](https://www.accio.com/work/doc?slug=permissions-guide)、[Agent 创建指南](https://www.accio.com/work/doc?slug=create-agent-guide)

**网络与故障影响（架构推导）**：网关或模型故障会中断需要推理的执行；账号故障影响登录和重新授权；第三方授权失效或接口变动会阻塞相关业务动作。服务条款也明确第三方服务变化或中断的责任边界。未确认独立本地推理、离线回退、自动跨模型切换或中心接管能力。[服务条款 §11.3](https://cdn.contract.alibaba.com/terms/common_product_agreement/20260519212911543/20260519212911543.html?lng=en)

**开源及自托管（未发现）**：在官网、帮助、条款和有限定向检索中，未找到主程序官方源码仓库、主程序开源许可证、完整服务端镜像或自托管指南；不据此断言不存在任何公开代码或内部私有化方案。条款 §3.4 对逆向及取得源码设有限制，仍受适用法律例外约束。可编辑配置、创建 Skills 和安装本地客户端，不等于获得核心源码或修改、部署授权。[服务条款 §3.4](https://cdn.contract.alibaba.com/terms/common_product_agreement/20260519212911543/20260519212911543.html?lng=en)、[Skills 指南](https://www.accio.com/work/doc?slug=skills-guide)

**选型缺陷**：核心实现及私有部署路径未公开，模型与业务闭环具有云端强绑定，云端数据边界不能由桌面沙箱替代；这会限制独立部署、依赖剥离、恢复机制改造和第三方执行器接入。没有源码与授权证据前，只能讨论受支持的外围集成，不能承诺可通过小改造得到私有调度核心。

### 架构范式、最小部署与改造边界

**架构推导**：当前可见范式是“桌面执行宿主内的 TL 监督者编排 + 持久团队任务 + 本地时间触发”，以及并存的云执行服务。没有足够证据将其定性为分布式任务池，也没有证明存在一个可独立部署、统一管理所有 PC 执行者的中心调度服务。

**最小使用成本（已确认的产品条件）**：本地使用至少需要受支持 PC、客户端和账号；浏览器或第三方业务按需增加连接组件、授权及网络。官方计费帮助列有免费日额度，最低付费 Pro 标价为每月 19.9 美元；这是当日文档标价，实际按账号地区和购买页确认。本次未购买服务。[计费帮助](https://www.accio.com/work/doc?slug=help-billing)

**运行约束**：额度和高等级模型时间窗口限制会影响持续任务吞吐；官方说明额度耗尽或模型容量不足会产生访问限制。文档中 Auto 的计费表与解释段存在“Free”和“使用相同积分系统”的口径差异，因此不据此承诺免费无限执行，也不估算固定任务成本。[额度帮助](https://www.accio.com/work/doc?slug=help-credits)

**运维判断（架构推导）**：普通使用无需自行管理已公开的数据库或队列，但仍需维护客户端在线状态、浏览器连接、工具授权、额度与升级。自建中心的基础设施成本无法从 SaaS 价格推导；硬件内存下限、后台资源成本和中心部署规模仍未获充分说明。

**调度下沉**：TL 可以是普通 Agent，文档已经采用这种组织方式；但如果移除宿主拥有的任务清单、依赖、执行归属、会话和计划恢复，只保留 TL 指令，则退化为提示词驱动协作，不是等价的有状态调度。

**扩展约束**：一个 Agent 可加入多个群，群各有 Session，但 Agent 核心记忆可共享；群工作目录隔离不等同进程、容器或多租户隔离。多组同时触碰同一外部资源时的互斥及调度节点协调未决，不应通过增加 TL 数量推导出可靠横向扩展。[团队指南](https://www.accio.com/work/doc?slug=agent-team-guide)、[Agent Core](https://www.accio.com/work/doc?slug=agent-core-design)

## 未决项与证据边界

- **严格调度闭环**：任务和依赖存储、可执行条件的解释者、执行归属原子性、崩溃恢复与失败接管未确认；跨会话持久性和计划重启补偿不能替代这些证据。
- **本地与云端一致性**：任务同步范围、状态权威位置、云任务向 PC 的接管及反向迁移未确认；官方已经承认数据尚未完全同步。
- **自动化副作用**：补跑时间窗口、周期堆积、重复派发及外部动作的幂等语义未确认。
- **实际运行验证**：本轮未安装客户端、未登录提交任务、未连接业务账号、未执行外部写操作；结论来自公开帮助、官网及安装包可访问性，不构成双平台运行验收。
- **文档时效**：公开帮助含新旧页面，部分功能命名和补跑描述不同；下载 v0.35.2 与记录 v0.36.0 尚未对齐，无版本号文档不能保证逐条适用于下载包。
- **安装、卸载和私有化**：双平台安装包可访问已确认，但系统权限、完整卸载和后台服务行为未验收；未取得核心源码、数据库、调度 API 或完整私有部署资料。
- **数据与组织治理**：云任务对象存储、凭据保管、保留配置、企业 SSO／RBAC、工作数据删除和跨地区处理者范围需厂商进一步确认；通用政策和地区性表格不能替代逐产品数据流图。

## 后续验证建议

1. **先验证持久调度而非界面清单**：在测试目录建立 A、B 并行，C 依赖两者的团队任务，分别结束会话、退出 TL、终止客户端并重启，核对任务、依赖、执行归属和 C 的解锁责任；确认是否无需人工重新发话。
2. **验证失败和去重**：使用无外部副作用的任务，模拟成员失败、审批拒绝、超时和断网；核对是否进入持久失败状态、是否重试或转交，以及是否重复执行。
3. **分别验证两平台的计划恢复**：测试一次性与周期任务、睡眠和关机错过时点、执行跨越下个周期；记录补跑窗口和已运行任务的恢复差异，不把补偿触发当作续跑。
4. **验证云端依赖和跨端一致性**：确认模型与账号接入配置，区分网络断开后的本地操作、计划触发和完整任务完成；另测 Web 与桌面的任务、文件、审批和历史同步范围。
5. **向厂商索取受支持的架构与接入说明**：优先取得工作状态存储、队列与租约语义、Worker/API 契约、云数据边界、私有化和授权条款；没有这些证据前不制定数据库剥离或中心服务迁移方案。
6. **安装与卸载验收**：使用获授权的 Windows/macOS 测试机核对签名、安装权限、常驻进程、升级恢复、Relay 扩展权限及卸载残留；卸载本体、撤销外部授权和删除云端账号数据分别验收。
