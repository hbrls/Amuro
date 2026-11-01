# TocoAI 技术产品调研

> updated_by: Qoder - Qoder
> updated_at: 2026-10-23 17:34:37 +0800
> evidence_window: 2026-10-23；官方在线文档当前快照；官网 latest 接口返回 IntelliJ 插件 0.0.231、VS Code 扩展 0.0.128；未锁定核心源码分支或 Release

## 交付结论

### 当前应归类为交互式任务执行宿主，不能认定为 Stateful 调度器

**已确认：**TocoAI 能将需求拆成待办、保存到工作台，再由用户选择待办开启独立会话；Planner、Designer、Developer、Tester 等角色接续完成规划、设计、编码和测试。它不是只有代码补全能力，也不只是一次性的提示词输入框。[首个项目：需求拆解与独立会话](https://tocoai.cn/docs/your-first-toco-project#需求拆解)

**判定：**公开流程未证明产品持久拥有任务依赖、执行归属和自动推进策略，也未证明进程退出后会重新领取、转交或恢复执行。工作台被称为“调度中心”、会话内存在“AI 自动调度”，不能替代上述证据；本轮按**具备项目资产与待办管理的交互式任务执行宿主**归类，而不把整个产品武断称为无状态服务。[最佳实践：工作台、Agent 指定与中断继续](https://tocoai.cn/docs/best-practices)

### 工作台和 Plan 提供协作上下文，不足以证明任务关系驱动的持续编排

**已确认：**待办记录业务目标、关键规则、完成结果和所属场景；优先级是“建议实施顺序”，复杂度是风险与工作量判断。Planner 的产物是可 Review 的实施规划，确认后作为后续环节的共同上下文。[首个项目：需求拆解、设计方案规划](https://tocoai.cn/docs/your-first-toco-project)

**证据边界：**尚未找到可核验的工作对象标识、父子任务或 DAG、阻塞传播、并发容量、执行者租约和任务状态迁移契约。领域模型中的实体关系，以及 ReadPlan／WritePlan 描述的业务读写方案，不是 Agent Task 之间的调度关系。[生成代码架构总结](https://tocoai.cn/docs/code-architecture-summary)

### 标准版是本地 IDE 与云端模型服务的混合形态，不满足完整 Local 优先要求

**已确认：**官网出售“云端专业版”；隐私政策明确用户创建的后端架构模型、数据库模型、流程模型“仅存储于我们的服务器中”，用于再次登录调取；生成的后端代码则实时返回本地，厂商声明不留存。因此云端至少承担身份、权益和核心建模资产持久化，不能仅描述为认证或转发网关。[价格页](https://tocoai.cn/pricing)、[隐私政策：信息存储](https://tocoai.cn/docs/privacy-policy)

**选型缺陷：**本地有 IDE、代码和可操作的项目文件，不代表本地拥有完整建模能力及持续执行状态。标准版缺少经过证实的离线建模、独立中心服务与断云降级能力；M2C 引擎和 Agent 编排各自运行在哪个进程，仍需官方架构资料确认。

### 私有化部署是商业交付选项，不是已证实的自助部署或开源改造路径

**已确认：**私有化方案价格面议，宣传企业私有大模型和开发脚手架适配。服务协议采用商业专有使用约束，限制篡改、反向工程及权限转售等行为；购买私有部署不能自动解释为取得源码、再分发或二次开发权。[私有化报价](https://tocoai.cn/pricing)、[服务协议：使用范围与知识产权](https://tocoai.cn/docs/terms-of-service)

**证据边界：**官网链接了官方 GitHub 组织，但本次环境无可用 `gh`，未核验仓库、主干源码和 LICENSE。2026-01-30 的创始人访谈将引擎开源表述为未来计划，不能据此认定截至调研日已经发布，也不能断言当前所有核心模块必然闭源。[官方组织](https://github.com/toco-ai)、[创始人访谈：先成为产品公司](https://tocoai.cn/blog/code-less-important-architecture-core-tocoai-founder#08-先成为一家产品公司再成为行业标准)

**选型缺陷：**目前没有已核验的可修改核心源码及开源许可，也没有公开自托管组件清单、最小资源配置、离线授权与迁移工具说明。私有部署成本、部署完整度和替换依赖的可行性，应作为采购前置条件而非已具备能力。

### Windows 与 macOS 均可按 IDE 插件路线接入，但尚无完整 PC 调度服务的交付证据

**已确认：**官方交付 IntelliJ ZIP 插件和 VS Code VSIX 扩展，安装均为本地侧载；截至调研日，官网版本接口返回 0.0.231 与 0.0.128。没有从这些安装说明中获得独立 TocoAI 桌面安装程序、本地中心服务或公开 CLI 的交付证据；FAQ 将 CLI 列为后续规划。[IntelliJ 安装](https://tocoai.cn/docs/installation)、[VS Code 安装](https://tocoai.cn/docs/installation-vscode)、[FAQ：支持的 IDE](https://tocoai.cn/docs/faq#目前支持哪些-ide)

**平台边界：**IDE 宿主支持 Windows 和 macOS，所以两平台均有可用的安装路径；但 TocoAI 自身没有公开逐 OS／CPU 架构兼容矩阵，本次也未运行验证。双平台客户端路线存在，不等于完整中心调度服务可以原生部署在任一工作机上。

## 调研目标

- 判断是否持久拥有工作对象、任务关系、执行归属及生命周期推进能力。
- 核验标准客户端与调度层接入语义、接口和通信边界。
- 分别核验 Windows 与 macOS 工作机的安装、运行、升级和卸载。
- 识别本地、云端和混合运行形态，以及 Local 优先适配缺陷。
- 说明依赖根源、持久化方式、架构范式和私有化改造边界。

## 产品调研

### 产品定位与目标用户

**已确认：**正式名称为 TocoAI，官方入口为[产品首页](https://tocoai.cn/)和[开发文档](https://tocoai.cn/docs)。其核心定位是建模驱动的 AI 软件开发：让 AI 先建立结构化设计，再由建模引擎和编码 Agent 共同生成可维护的业务系统。目标用户是构建 API、微服务及领域模型的后端与全栈工程师，以及需要统一设计规范的研发团队。

**范围边界：**DSL-Spec 模式面向从零开始的 Java 后端项目；MDD 建模能力限定于 Toco Project，当前教程明确为 Java Spring 体系。Vibe 模式用于已有代码库的多语言对话编码，不能将其多语言支持外推为建模引擎已支持所有语言。模式选择后不能直接切换。[首个项目：项目模式与新建项目](https://tocoai.cn/docs/your-first-toco-project#选择项目模式)

### 核心流程

**已确认，官方教学流程：**

1. 在 IDE 中选择 DSL-Spec 模式并建立 Toco Project，把需求文档提供给 Agent Chat。
2. 对于复杂需求，由 System Analyst 梳理目标、规则、边界与流程；用户 Review。上下文充分的简单任务可以跳过这一步。
3. Domain Architect 建立领域模型；用户可通过对话或可视化编辑器修改。Agent 流程维护可跨会话复用的业务知识。
4. Agent 将确认后的需求拆成待办，用户审阅、保存到工作台，并选择一个或少量相关待办开启独立会话。
5. Planner 产出实施规划，用户确认后交给 Designer 建模；M2C 引擎生成结构性代码，Developer 补充业务逻辑。
6. 接受已实现的技术知识沉淀；Tester 生成并执行接口级 Mock 单元测试。发现业务逻辑问题时，保留失败证据，交回规划与开发环节。

上述流程取自[首个项目](https://tocoai.cn/docs/your-first-toco-project)，其中“后续补充集成测试”属于计划能力；当前接口级 Mock 测试不等于真实数据库、第三方服务或端到端环境已经验收通过。

### 功能地图与边界

| 功能域 | 已公开的产品行为 | 与持续自主工作的边界 |
| --- | --- | --- |
| 需求分析与拆解 | 可审阅的分析、待办和业务知识 | 工作主要来自用户输入，未证明平台主动观察环境或由外部事件持续创建任务 |
| 工作台与会话 | 待办保存、分批选择、独立会话、历史上下文回退 | 会话隔离不等于文件或执行资源隔离；保存待办不等于持久队列 |
| 多角色 Agent | 自动选择角色，也可用 `@AgentName` 指定执行者 | 角色路由不等于在多个在线工作机之间选择 Worker |
| DSL 与 M2C | 模型编辑、结构性代码生成、业务逻辑补全 | 模型更新后需触发再生成，手工修改受保护的生成区会被覆盖 |
| 团队规范与知识 | `.toco/rules` 规范、跨会话复用的业务和技术知识 | 规范遵循的产品表述不等于经过验证的权限强制执行机制 |
| 测试与反馈 | 接口级 Mock 测试，问题交回规划和开发 | 未披露任务完成条件的机器强制判定、失败自动重试次数与跨会话接管 |

证据来自[首个项目](https://tocoai.cn/docs/your-first-toco-project)、[最佳实践](https://tocoai.cn/docs/best-practices)与[协作流程](https://tocoai.cn/docs/collaborative-development-process)。官方所称结构代码占比和准确率不是本次运行验证结果，不用于推导免审或质量保证。

### 维护状态与版本演进

**已确认的可下载快照：**官网公开 latest 接口分别返回以下记录，两个接口均 HTTP 200；对应安装包 HEAD 检查亦为 HTTP 200。只检查元数据及响应头，未下载包正文、核验签名或实际安装。

| 交付载体 | 当前返回版本 | 记录创建／更新时间 | 证据 |
| --- | --- | --- | --- |
| IntelliJ 插件 ZIP | 0.0.231 | 创建 2026-07-08，更新 2026-07-09 | [官方版本接口](https://tocoai.cn/mis/api/config/client-plugin-version/latest?pluginType=INTELLIJ)、[官方 ZIP](https://platform.tocoai.cn/upload/tocoai-cn-0.0.231.zip) |
| VS Code 扩展 VSIX | 0.0.128 | 创建及更新均为 2026-09-23 | [官方版本接口](https://tocoai.cn/mis/api/config/client-plugin-version/latest?pluginType=VSCODE)、[官方 VSIX](https://platform.tocoai.cn/upload/tocoai-cn-0.0.128.vsix) |

**边界：**这是安装包配置记录的时间，不是已确认的正式发布日期；两种插件编号不能相互排序，也不能据此推导功能完全同等。接口提供 MD5 字段，但本次没有取得包正文核对，更未证明数字签名或来源验证链。当前返回非强制更新标志，也不等于长期无强制升级策略。

**与接入和架构有关的演进证据：**

- [2026-01-30 的创始人访谈](https://tocoai.cn/blog/code-less-important-architecture-core-tocoai-founder)强调人控制、修改 AI 输出，且将引擎内核、建模描述与模板开源列为未来计划；不把计划算作当前源码交付。
- [IntelliJ 安装页](https://tocoai.cn/docs/installation)标注 2026-02-25 更新；[VS Code 安装页](https://tocoai.cn/docs/installation-vscode)与 [FAQ](https://tocoai.cn/docs/faq)标注 2026-03-19 更新，确认当前双 IDE 接入路线，CLI 仍为规划。
- [首个项目](https://tocoai.cn/docs/your-first-toco-project)标注 2026-08-04 更新，已描述需求分析、工作台、独立会话、知识沉淀与 Tester Mock 测试；集成测试仍列为后续能力。页面更新时间不是这些功能的首次发布时间。

**判断：**官网文档、版本接口与安装包仍可访问，且存在 2026 年的插件更新记录，不能认定停更；但没有完整 Changelog／Release 序列或运行验证，不能据此判断发布频率、稳定性或生产成熟度。

### 生态与反馈

**已确认：**现有生态以 IDE 接入、可视化建模、团队规则、生成框架及商业支持组成。官网承诺专属服务群与每周 7 天、每天 12 小时人工答疑；私有化方案包含企业模型及开发脚手架适配。这些属于服务承诺，不是响应时效或部署成功率的实测结果。[价格页](https://tocoai.cn/pricing)

**证据边界：**没有完成公开 Issue／Discussion 抽样：当前环境执行 `gh --version` 返回命令不存在，因此未核验官方组织的仓库、提交与问题讨论。本报告不把未取得反馈当成“没有问题”，也不把首页精选评价当作独立、具有代表性的用户样本。[官网指向的组织](https://github.com/toco-ai)

**对接含义：**目前可确认的是供应商支持渠道和定制服务入口，而非可供第三方实现 Worker 的开放开发生态。是否存在正式 SDK、自动化 API 或第三方插件协议仍未决。

## 技术架构调研

### 系统全貌与运行形态

**已确认的逻辑边界：**

```text
开发人员
  ├─ 本地 IDE + TocoAI 插件
  │    ├─ Agent Chat／工作台／设计编辑入口
  │    ├─ 本地工程、规则、生成代码和业务代码
  │    └─ 用户选择待办、Review、执行与反馈
  │
  └─ 官网控制台入口 → 登录／账号与订阅服务

TocoAI 云服务
  ├─ 账号身份、组织座席与额度管理
  └─ 建模资产存储与重新调取

逻辑能力：Agent 多角色协作 + DSL／M2C 生成 + 大模型推理
  └─ 这些能力的端云拆分、进程和接口位置尚未公开核实

交付产物：用户业务应用
  └─ 自己的 Java／Spring、数据库和业务 HTTP／RPC，不是 TocoAI 调度服务
```

以上是根据[官方教程](https://tocoai.cn/docs/your-first-toco-project)、[价格页](https://tocoai.cn/pricing)和[隐私政策](https://tocoai.cn/docs/privacy-policy)建立的**逻辑架构推导**，不是实际进程图或网络抓包结果。没有证据将 Agent、M2C、模型存储进一步拆成若干微服务，也没有证据支持指定其内部技术栈。

**浏览器观察：**从官方文档点击“控制台”，跳转到[带控制台返回地址的登录页](https://tocoai.cn/login?redirectUrl=%2Fconsole)，页面要求手机号／邮箱并同意协议。本次停在未登录页面，未发送验证码、创建账号、购买服务或读取任何账号内数据。

### 工作对象、任务关系与生命周期

#### Workspace、Project、Issue、Plan、Task 并未构成已证实的调度对象图

| 对象 | 已确认的产品含义、来源与归属 | 标识、关系与状态所有者的边界 |
| --- | --- | --- |
| Workspace | 文档有 IDE 工作环境和“工作台”，但未明确独立 Workspace 产品对象 | 不能把中文工作台直接翻译成有持久身份和租户边界的 Workspace；标识、层级与生命周期未披露 |
| Project | 用户创建 Toco Project；其中组织模块、设计、代码和上下文；FAQ 明确组织成员管理和项目添加多名成员 | 项目及成员关系真实存在；全局 Project ID、角色权限细节、可调度任务层级与状态迁移契约未披露 |
| Issue | 所调查的官方流程未给出独立 Issue 对象或外部工单同步流程 | 未证实 Issue→Task 转换、Issue 状态所有者和事件触发；不据此声称所有版本都不存在 |
| Plan | Planner 形成含目标、当前状态、影响范围、依赖、风险、承接方和执行事项的可审阅规划 | 已证实规划产物与上下文传递；独立持久编排 ID、机器可解释依赖和状态迁移未披露 |
| Task／待办 | Agent 根据用户确认的需求产生，用户审阅后保存到工作台；可附目标、规则、交付结果、场景、优先级与复杂度 | 已证实保存和跨会话选择；唯一 ID、持久存储、执行归属、完成状态的写入者与任务间关系未披露 |

证据为[首个项目](https://tocoai.cn/docs/your-first-toco-project)、[最佳实践](https://tocoai.cn/docs/best-practices)和 [FAQ](https://tocoai.cn/docs/faq)。这里区分“产品能保存某种内容”和“存在可供调度使用、可恢复的对象模型”，不以数据库表盘点替代产品语义。

**已确认的设计状态不等于任务状态：**FAQ 给出设计协作的“草稿态”（个人编辑、对团队不可见）和“提交态”（团队共享）；组织至少两人、项目添加多人后开启协作。结合云端模型保存说明，可确认跨成员共享的建模资产，但不能把草稿／提交直接解释为 Task 等待／完成状态。FAQ 同时明确不内置代码版本管理，代码需要用户使用 Git 或 SVN 管理；因此对话回退不应被理解为完整代码版本回滚。[FAQ：多人协作与代码版本](https://tocoai.cn/docs/faq#tocoai-支持多人协作吗)

**特别区分：**ReadPlan 与 WritePlan 是生成应用的查询／写操作建模元素，不是 Planner 的任务计划；ER 关系与聚合对象表达目标业务数据关系，不是 Agent 工作依赖。[生成代码架构总结](https://tocoai.cn/docs/code-architecture-summary)

#### 当前推进由用户选择、确认和会话内角色协作驱动

**已确认：**典型推进是“需求输入→Review→待办保存→用户选择执行→规划确认→设计／编码→测试反馈”。这是产品操作顺序，不是已经公开的持久状态机。用户可以指定 Agent 跳过自动角色调度，也可在一个会话内处理少量关联待办。[首个项目](https://tocoai.cn/docs/your-first-toco-project)、[最佳实践](https://tocoai.cn/docs/best-practices)

**未决：**没有获得 Task 允许的状态值、状态迁移责任方、前置条件自动满足检测、上游失败或取消的传播、下游解锁、任务超时与并发限制的公开契约。不能把“优先级建议顺序”描述为自动优先级调度，也不能把待办类型中的“定时任务、消息、回调”解释为 TocoAI 自身提供周期／事件触发器；它们是准备开发的业务执行单元。[首个项目：需求拆解](https://tocoai.cn/docs/your-first-toco-project#需求拆解)

**已确认但非执行保障：**协作指南建议架构师先完成建模，开发人员再按模块并行，最后统一联调；模块负责人由架构师指定。这是组织协作方法，不是产品自动分配 Agent、执行 DAG 或强制跨模块互斥的证据。[协作开发流程建议](https://tocoai.cn/docs/collaborative-development-process)

#### “继续”和历史回退不能证明故障后的持久恢复

**已确认：**发生手动或异常中断时，官方建议在对话里说“继续”，由 AI 检查已完成内容并接续；上下文使用较高时建议总结后开启新会话。双击历史消息可回退会话上下文。[最佳实践：会话管理与中断继续](https://tocoai.cn/docs/best-practices)

**证据边界：**以上描述没有说明 IDE 崩溃、工作机断线、账号掉线或 Agent 进程退出后的恢复契约，不能等同于持久检查点、自动重排队或不同执行者接管。历史上下文回退也未证明会原子回滚模型、文件、数据库及外部副作用。

### 主要组件与核心链路

#### 链路一：需求进入工作台，再进入一次交互式执行

**已确认：**用户通过 IDE 提供需求；Agent 分析并拆出待办，用户确认、保存并选择执行；独立会话携带已确认目标、规则及上下文，Planner 规划后由各角色接续。这里跨越“工作台记录→会话上下文”的产品边界，但待办数据库及后台写入协议未披露。[首个项目](https://tocoai.cn/docs/your-first-toco-project)

**关键约束：**优先级只是建议，用户选择才是公开流程中的执行入口。没有证据显示云端会在 IDE 离线后继续对依赖关系求值并分派给另一台机器。

#### 链路二：模型修改驱动生成，业务代码在本地继续开发

**已确认：**Domain Architect／Designer 修改设计；M2C 根据建模信息生成结构性代码；Developer 编写业务逻辑。手动修改模型后必须重新生成，对话修改时 AI 会自动触发；受保护生成区不可依赖手工改动长期保留。[首个项目：代码生成](https://tocoai.cn/docs/your-first-toco-project#代码生成8020-原则)、[最佳实践：设计与代码同步](https://tocoai.cn/docs/best-practices)

**数据边界：**标准服务的建模资产在云端存储，生成代码返回客户端且由用户管理。该政策可以证明资产落点，不能单凭“返回客户端”确认 M2C 是全部云端运行，也不能证明已有源码和推理上下文绝不出端。[隐私政策](https://tocoai.cn/docs/privacy-policy)

#### 链路三：测试失败反馈与会话中断接续

**已确认：**Tester 当前执行接口级 Mock 测试，发现业务问题后保留失败证据并交回规划、开发；会话中断时，用户输入“继续”让 AI 检查已完成部分并接续。[首个项目：单元测试](https://tocoai.cn/docs/your-first-toco-project#单元测试)、[最佳实践](https://tocoai.cn/docs/best-practices)

**证据边界：**这构成反馈闭环的产品方法，但失败证据的存储位置、自动回传协议、任务重新入队、恢复检查点及自动验收条件尚未证明。官方服务协议仍要求用户自行审核、测试和验证生成内容，不能将宣传中的代码准确性当作免验收承诺。[服务协议：免责条款](https://tocoai.cn/docs/terms-of-service)

### 主要依赖

**已确认的分层边界：**官方[生成代码架构总结](https://tocoai.cn/docs/code-architecture-summary#一项目整体概览)描述的是被生成的业务应用：Java JDK 11 或以上、Spring Boot、Maven 多模块、MyBatis-Plus 读与 Hibernate 写，示例读写 MySQL。它不是 TocoAI 产品后台的架构图，也不能证明调度中心必须依赖 MySQL、Hibernate 或任何特定数据库版本。

**改造含义：**M2C、DSL 和生成区规则是模型与代码一致性的核心约束，不应当作可随意剥离的外观层。相反，生成应用自己的数据库及业务运行依赖，需要按应用运行需求评估，不能计入尚未公开的 TocoAI 调度核心依赖。[最佳实践：设计修改和生成区](https://tocoai.cn/docs/best-practices)

**客户端依赖已确认：**IntelliJ 安装页要求 IDEA“2024.03 或更高版本”、JDK 11+ 并配置 Project Structure；VS Code 安装页要求 1.82.0+、JDK 11+ 与 Extension Pack for Java。这里保留 IDEA 版本的官方原文，“2024.03”与实际兼容 build 的对应未核验，不擅自改写为已证实的 2024.3。[IntelliJ 前置条件](https://tocoai.cn/docs/installation#前置条件)、[VS Code 前置条件](https://tocoai.cn/docs/installation-vscode#前置条件)

**不要混淆运行层次：**IDEA 官方当前发行版附带 JBR，运行 IDE 不等于必须使用项目 JDK；Java 扩展包服务于项目构建及语言工具。JDK 11+ 是 Toco 文档列出的开发环境条件，不能据此认定插件或当前 Java 语言服务器自身最低运行时就是 Java 11。[IDEA 运行环境](https://www.jetbrains.com/help/idea/installation-guide.html#requirements)、[Java 扩展包](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack)

**云服务依赖已确认：**标准使用依赖 TocoAI 账号、服务权益、建模资产服务与模型额度；普通云端版是否支持用户自定义推理端点未确认。私有化报价明确可适配企业私有大模型，但不能外推为所有标准客户都能关闭厂商模型接入。[价格页](https://tocoai.cn/pricing)

**最小核心未决：**官方安装页未要求用户另外部署数据库、Docker、消息中间件或 TocoAI 守护服务，不能据此断言插件绝无辅助进程。FAQ 列出 npm 域名只是网络排障信息，不证明用户须预装 Node.js／npm。产品侧事务、锁和一致性所需依赖未披露，因此也不能讨论把某个猜测中的数据库或向量库剥离。[FAQ](https://tocoai.cn/docs/faq#插件加载很慢怎么办)

### 接口形态与客户端接入

**已确认：**可见交互是 IDE 中的 Agent Chat、工作台、可视化模型编辑、文件与设计元素引用、`@AgentName` 角色指定。这里的用户操作代表创建／选择工作并启动执行，不是客户端在公开任务池中领取租约。[首个项目](https://tocoai.cn/docs/your-first-toco-project)、[最佳实践](https://tocoai.cn/docs/best-practices)

**未决：**概述宣传“丰富的 API 接口”，但没有据此获得产品调度 REST、WebSocket、gRPC、CLI、SDK 或 Worker 接入协议。教程中的 HTTP API、RPC 和读写方案主要描述待生成应用的接口，不能挪作 TocoAI 服务端接口证据。[概述](https://tocoai.cn/docs)、[生成代码架构总结](https://tocoai.cn/docs/code-architecture-summary)

**已确认的有限开放边界：**官网存在无需登录即可读取的插件版本 JSON 接口，用于分发元数据；它不是任务提交、领取或控制协议。FAQ 将 CLI 列为未来规划，不应报告为已发布接入载体。[IntelliJ 版本接口](https://tocoai.cn/mis/api/config/client-plugin-version/latest?pluginType=INTELLIJ)、[VS Code 版本接口](https://tocoai.cn/mis/api/config/client-plugin-version/latest?pluginType=VSCODE)、[FAQ](https://tocoai.cn/docs/faq#目前支持哪些-ide)

**架构推导：**当前不能给出“跳过官方客户端，直接接入调度中心”的受支持路径。仅依靠 UI 自动化包装插件仍是执行层适配，不会补出持久依赖、调度归属和恢复语义；本轮不实施该适配。Windows／macOS 在公开语义上均走 IDE 插件，没有已确认的平台专属 Worker 协议。

### 持久化方式

| 状态／产物 | 已确认的存放与所有权边界 | 尚不能确认的部分 |
| --- | --- | --- |
| 账号身份 | 标准服务在厂商服务器存储手机号／邮箱等账号信息 | 认证数据库、最低版本、备份恢复与离线凭证有效期 |
| 用户建模信息 | 后端架构、数据库和流程模型仅存于厂商服务器，用于再次登录调取 | DSL 导出格式、本地缓存完整度、冲突解决、关系恢复与私有部署同等性 |
| 生成的后端代码 | 政策称实时返回本地，厂商服务器不存储、缓存或留存 | 已有代码、上下文及模型供应商的传输处理／留存边界，不能由生成代码政策外推 |
| 工作台待办 | 教程明确“保存到工作台”，稍后可选择并开会话 | 究竟本地文件、IDE 状态、云数据库还是组合存储；跨机器／进程恢复与关联完整性 |
| Planner 规划、会话、进度与结果 | 规划用于后续共同上下文；提供会话历史和回退，支持业务／技术知识沉淀 | 具体存储、保留期、执行检查点、任务归属及失败证据是否为独立持久对象 |
| 项目规则 | 文档明确 `.toco/rules` 是规范沉淀载体 | 除文件外是否同步、如何分发和强制执行，不由该说明自动证明 |

前三区分取自[隐私政策](https://tocoai.cn/docs/privacy-policy)，后三区分取自[首个项目](https://tocoai.cn/docs/your-first-toco-project)与[最佳实践](https://tocoai.cn/docs/best-practices)。所有数据库类型、最低版本、专有扩展、内存与落盘差异均未获产品核心证据；不能以生成应用示例的 MySQL 替代回答。

**退出约束已确认：**服务协议赋予用户数据查阅、导出权，但允许服务终止超过 7 个自然日后删除数据；隐私政策另列注销后 7 个自然日删除账号与模型。两种触发条件不同，不能认为只要未注销，停服后模型就会长期保留。导出权也不等于已经验证可迁移格式和恢复工具。[服务协议：数据保护](https://tocoai.cn/docs/terms-of-service)、[隐私政策：存储期限](https://tocoai.cn/docs/privacy-policy)

**授权边界：**协议把厂商架构模型和框架代码的基础知识产权，与用户需求及独立业务逻辑形成的最终成果知识产权分开。不能笼统写“所有生成资产均可无限制再分发”，复用基础框架和二次服务化仍应澄清授权。[服务协议：知识产权归属](https://tocoai.cn/docs/terms-of-service)

### 通信方式

**已确认：**官网与登录入口使用 HTTPS；隐私政策声明 SSL 传输加密、AES 存储加密。客户端使用建模能力涉及远程资产的保存与调取；大模型用量按团队统一核算。[登录页](https://tocoai.cn/login?redirectUrl=%2Fconsole)、[隐私政策](https://tocoai.cn/docs/privacy-policy)、[价格页](https://tocoai.cn/pricing)

**未决：**未取得插件与服务端之间的正式 REST／流式响应／WebSocket 协议、服务推送或轮询方式、是否有本地服务与 IPC、断线补偿、必要保活和模型请求路由。不能从聊天式界面推断一定使用 SSE 或 WebSocket，也不能从生成应用的 RPC 示例推断产品用相同协议。

**边界判断：**文档没有给出工作机注册、心跳／在线容量上报、领取租约或中心唤起协议，因此只能确认交互式客户端接入，不能确认跨机器 Worker 通信。第三方消息中间件是否必需、可替换也属未决。

### 任务队列

**已确认：**工作台提供保存和分批选取待办的能力；标准流程仍要求用户选择后开启会话。公开资料没有把工作台定义为具有领取协议的持久队列。[最佳实践：工作台](https://tocoai.cn/docs/best-practices)

**未决：**尚不能确认内存队列或持久队列的实现、单机／分布式最小依赖、防重复领取、原子抢占、并发协调、租约续期、超时回收、失败重试与转移分别由谁负责。也不能反向断言其必定没有内部队列。没有产品核心源码或官方协议时，继续猜测锁与表结构不会改善调度能力判断。

### 部署形态

#### 工作机安装（Windows／macOS）

**交付形态已确认：**IntelliJ 采用 ZIP，VS Code 采用 VSIX；两份官方安装文档均表示当前通过本地安装包安装。官网这条安装链未给出 TocoAI Marketplace 条目；不能由此证明其他渠道必然没有。Java 扩展包的市场页面不是 TocoAI 插件页面。[IntelliJ 文档](https://tocoai.cn/docs/installation)、[VS Code 文档](https://tocoai.cn/docs/installation-vscode)

##### Windows 工作机

- **宿主与系统：**安装 Windows 版 IntelliJ IDEA 或 VS Code。当前 IDE 官方页面列有 Windows 10／11 及 x64／ARM64 安装载体；这是宿主支持范围，TocoAI 未给出自己的 Windows 版本和 CPU 架构矩阵，单一 ZIP／VSIX 不足以证明全架构兼容。[IDEA 系统与安装要求](https://www.jetbrains.com/help/idea/installation-guide.html#requirements)、[VS Code 下载](https://code.visualstudio.com/Download)
- **IntelliJ 安装和入口：**按 Toco 文档准备 IDEA“2024.03 或更高”、账号和 JDK 11+，配置项目 JDK；从官网取得 ZIP，在 `Settings → Plugins → 齿轮 → Install Plugin from Disk…` 选择文件并重启。随后 `Settings → Toco → 登录`，在项目中使用 Agent Chat 和建模功能。[IntelliJ 安装](https://tocoai.cn/docs/installation)
- **VS Code 安装和入口：**准备 VS Code 1.82.0+、JDK 11+、Extension Pack for Java 与账号；在 `Extensions → … → Install from VSIX…` 选择官方 VSIX，按建议重启；活动栏点击 TocoAI 图标登录。新建 Toco Project 可从新窗口进入插件创建流程。[VS Code 安装](https://tocoai.cn/docs/installation-vscode)、[新建项目](https://tocoai.cn/docs/your-first-toco-project#新建-toco-项目)
- **权限与网络：**需要组织允许侧载扩展、登录远程服务及读写工作目录；前者的企业准入规则依本机环境，后两者来自登录和代码生成流程。官方未披露 Toco 专属管理员权限、终端确认及目录沙箱策略。网络要求见下方共同说明，不能保证离线运行。
- **升级：**可沿用侧载入口安装官网下载的新包，这是宿主机制支持的合理路径，并非本次验证过的 Toco 跨版本迁移方案；配置迁移、回退和兼容性仍需验证。
- **卸载：**在 IDEA 的 `Settings → Plugins → Installed` 找到 Toco，经 Disable 旁菜单选择 Uninstall；VS Code 在扩展齿轮菜单选择 Uninstall，按提示重启扩展宿主。这些是 IDE 官方标准操作，不是 Toco 专属清理保证。[IDEA 卸载插件](https://www.jetbrains.com/help/idea/managing-plugins.html#uninstall-plugin)、[VS Code 卸载扩展](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_uninstall-an-extension)

##### macOS 工作机

- **宿主与系统：**安装与 Intel／Apple Silicon 匹配的 IDEA 或 VS Code。当前 IDEA 2026.2 文档列 macOS 15／26；VS Code 下载页列 macOS 12.0+，其支持政策还限定 Apple 持续安全维护的版本。安装下限和当前官方支持范围不是一回事，这些也均不是 TocoAI 自身最低系统要求。[IDEA 要求](https://www.jetbrains.com/help/idea/installation-guide.html#requirements)、[VS Code 下载](https://code.visualstudio.com/Download)、[VS Code 支持政策](https://code.visualstudio.com/docs/supporting/requirements#_platforms)
- **IntelliJ 安装和入口：**满足 Toco 文档的 IDEA 版本、账号与项目 JDK 11+ 条件，在 IDEA 设置的 `Plugins → 齿轮 → Install Plugin from Disk…` 安装同一官方 ZIP并重启；通过 Toco 设置登录后进入项目使用。官方没有单独的 TocoAI DMG／App 或 Apple Silicon 原生包说明，实际架构兼容性未测。[IntelliJ 安装](https://tocoai.cn/docs/installation)
- **VS Code 安装和入口：**准备 VS Code 1.82.0+、JDK 11+、Java 扩展包和账号，在 `Extensions → … → Install from VSIX…` 侧载，重启后通过活动栏登录。配套 Java 工具的运行时由其自身包版本决定，不把项目 JDK 11 当作所有扩展的统一最低运行时。[VS Code 安装](https://tocoai.cn/docs/installation-vscode)、[Java 工具运行时](https://marketplace.visualstudio.com/items?itemName=redhat.java#java-tooling-jdk)
- **权限与网络：**需要相应工作目录读写和远程服务连接。官方没有说明必须授予“完全磁盘访问”、辅助功能权限或管理员权限，也没有给出 Toco 插件的进程隔离与终端审批契约；本次未授予任何系统权限或运行插件。
- **升级：**与 Windows 一样采用官方新包及 IDE 侧载入口的待验证路径；没有证明 macOS 下自动更新、架构迁移或降级恢复正常。
- **卸载：**在 IDEA 设置的已安装插件列表卸载 Toco，或在 VS Code 扩展条目菜单选择 Uninstall，按宿主提示重启。仍是宿主标准方法；不需要为了卸载插件删除整个 IDE。[IDEA 卸载插件](https://www.jetbrains.com/help/idea/managing-plugins.html#uninstall-plugin)、[VS Code 卸载扩展](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_uninstall-an-extension)

##### 两平台共同的网络、权限与清理边界

**官方网络排障声明：**使用代理／VPN 出现加载缓慢时，FAQ 建议将 `platform.tocoai.cn`、`tocoai.cn`、`code.tocoai.cn`、`tocoai-asset.oss-cn-hangzhou.aliyuncs.com`、`tocoai-release.oss-cn-hangzhou.aliyuncs.com`、`registry.npmjs.org`、`registry.npmmirror.com` 加入代理例外。这是官方提供的连通性线索，不是完整企业白名单，更不是要求无条件修改用户代理设置。[FAQ：加载缓慢](https://tocoai.cn/docs/faq#插件加载很慢怎么办)

**边界：**OSS 资源／发行域名可表明分发链涉及对象存储，不能证明用户模型也存于同一 Bucket；npm 地址不能证明本机必须安装 npm。具体运行 API、出口端口和模型服务域名未完整披露。

**权限推导：**VS Code 官方明确扩展具有与 VS Code 本身相同的权限，因此不能按隔离网页对待插件；但它不证明 Toco 已执行某类命令，也不说明 Toco 是否另有审批层。应以实际目标版本验证工作目录和终端操作边界。[VS Code 扩展权限](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_install-an-extension)

**升级边界：**VS Code 官方说明从 VSIX 安装的扩展默认禁用自动更新，不能承诺自动从市场更新。Toco 是否有独立更新器、IDEA ZIP 的升级提示及跨版迁移规则未核实。[VSIX 安装机制](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_install-from-a-vsix)

**卸载边界：**卸载插件不等于删除本地项目、`.toco` 配置、缓存或凭证，更不等于注销账号和删除云端模型；官方未说明全部残留路径。不要为“彻底清理”删除用户代码，云端数据退出应按服务协议单独处理。[FAQ：项目配置](https://tocoai.cn/docs/faq#如何在团队内共享项目规则和提示词)、[隐私政策](https://tocoai.cn/docs/privacy-policy)

**中心服务支持：**Windows／macOS 上可交付的是上述客户端插件；独立完整中心服务的安装步骤、运行入口、权限、升级和卸载均未获得公开证据。Linux 容器或服务器方案也没有足够材料，不能拿未确认的服务器方案替代任一工作机平台。

#### 主体功能运行位置与 Local 优先判断

**已确认：**标准商业方案是云端专业版：本地 IDE 承载交互、工程和代码操作，云端持有账号、权益及建模数据。建模资产是产品持续开发的核心上下文，所以云端不是可忽略的辅助站点。[价格页](https://tocoai.cn/pricing)、[隐私政策](https://tocoai.cn/docs/privacy-policy)

**架构推导：**标准版完整研发闭环是混合形态，而非纯 PC 本地或单纯浏览器 SaaS。不能把插件称为完全无本地能力的“壳”，但也不能因为代码文件落地本机，就视为已满足 Local 优先。

**故障边界：**断网或云服务不可达至少会阻止远程模型调取和在线账号操作。已有本地源文件是否能被 IDE 编辑、编译取决于自己的开发环境；这不代表 TocoAI 建模和 Agent 能离线执行。已登录缓存、M2C 本地可用性、会话延续和额度验证降级没有运行验证，不能给出全离线保证。

#### 云端形态

| 维度 | 已确认的服务职责／公开声明 | 证据边界与影响 |
| --- | --- | --- |
| 身份与准入 | 手机号／邮箱注册登录、账号凭证、组织座席与使用额度 | 登录采用验证码的政策说明已确认；Token 形式、会话时效、单点登录及组织 RBAC 未披露 |
| 核心数据 | 账号与建模信息在厂商服务器保存，支持再次登录调取 | 云数据库类型、版本、存储引擎和资产版本控制实现未披露 |
| AI 与生成服务 | 服务内容包含处理需求、生成模型和代码，模型用量按团队计费 | 推理提供商、直连／代理、Agent／M2C 的进程位置未披露，不能把模型存储服务臆定为完整 Agent 中心 |
| 接口与通信 | 用户通过官网、登录控制台与 IDE 产品入口接入；政策声明 SSL 传输 | 产品 API、服务推送、长连接、内部消息系统和跨端同步协议未公开确认 |
| 托管与依赖 | 政策称数据在中国境内，可委托第三方提供服务器存储 | 未披露云厂商、地域、计算资源、容器形态、数据库及扩展依赖；不可自行列出部署清单 |
| 权限与数据边界 | 模型离开工作机并远程保存；生成代码声明不在厂商服务器留存 | “不留存”不等于“不传输”；已有源码、提示词、推理上下文和模型供应商处理链未完整披露 |
| 运维访问 | 政策声明加密、访问控制，故障排查访问需授权及双人复核，同时禁止查阅建模内容 | 这是政策承诺，不是本次安全审计；不能推断零知识存储或厂商无解密能力 |
| 故障与终止 | 常规维护可能短暂停服；欠费或到期可暂停／终止服务 | 未提供本次可核验的可用性 SLA、离线补偿、恢复时间或恢复点目标；存在云端资产退出风险 |

上表事实均来自[服务协议](https://tocoai.cn/docs/terms-of-service)、[隐私政策](https://tocoai.cn/docs/privacy-policy)、[价格页](https://tocoai.cn/pricing)以及本次对[未登录控制台入口](https://tocoai.cn/login?redirectUrl=%2Fconsole)的观察。未公开的实现维度保留为未决，不以推测填满架构。

**数据使用边界：**服务协议约定为提供服务处理用户需求、模型和代码；隐私政策同时存在“服务优化以外”与“不主动查阅、分析、使用”建模信息的措辞。没有完整模型供应商及数据处理附件，不把这些文字概括为整个推理链无条件“不用于训练”或所有数据不出企业网络。[服务协议](https://tocoai.cn/docs/terms-of-service)、[隐私政策](https://tocoai.cn/docs/privacy-policy)

#### 私有化、最小成本与部署完整度

**已确认：**云端专业版为每座席每月 200 元，每座席每月赠送 30,000 Credits，超额按团队充值，公开换算为 1 元＝300 Credits。此处保留价格只为说明持续运行依赖供应商账号、座席与模型预算；它不是总拥有成本测算。[价格页](https://tocoai.cn/pricing)

**费用边界：**2026-03-19 更新的 FAQ 还表示赠送 Credits 仅可用于设计驱动开发，历史项目维护模式不可用。较新的项目教程采用 DSL-Spec／Vibe 命名，因此不能未经确认就把赠送额度视为所有模式通用，也不根据旧称推断当前完整计费映射。[FAQ：赠送额度](https://tocoai.cn/docs/faq#赠送的-credit-为什么无法使用)

**已确认：**私有化方案价格面议，宣称数据自主管理、资源可控，支持企业私有大模型与脚手架适配。这是存在商业交付路径的证据，不是公开安装包、容器镜像或源码部署说明。

**未决：**私有部署是否包括账号授权、模型库、M2C、Agent 执行、计费组件的全部替代；是否有持续外网授权；所需操作系统、CPU／内存／GPU、数据库与最低版本、升级备份方式均未披露。不能给出可信的最小硬件和运维成本，也不能将其与 Windows／macOS 上安装插件视为同一成本层次。

**选型含义：**标准 SaaS 免去了用户自运维厂商后台，但增加云依赖和资产退出约束；私有化有机会改变数据与推理边界，尚未证明可在单台工作 PC 上完整运行。两种形态必须分开评价。

### 架构范式与改造边界

**判定：**可观察的架构范式是“人确认与选择工作＋会话内多角色执行＋模型约束的代码生成”，不是已证明的中心持久调度器、分布式任务池，也没有证据支持把它归为 Serverless 运行平台。

**架构推导：**若只封装“接收需求→规划／编码→返回产物”为普通 Agent 节点，封装的是执行能力。因为原产品未证实提供可独立调用的任务依赖解析、持久执行归属与故障重派，所以不能把这种封装称为等价调度能力下沉。

**未决：**多会话独立仅证明上下文相互分离，未证明进程沙箱、独立工作目录、写文件互斥或多调度节点一致性。团队按模块分工是约定，不是隔离技术。扩展至多人多机前，应先拿到执行隔离与冲突处理契约。[最佳实践](https://tocoai.cn/docs/best-practices)、[协作流程](https://tocoai.cn/docs/collaborative-development-process)

## 未决项与证据边界

- **调度能力：**Task ID、依赖关系、状态迁移、执行归属、自动可执行性判断、重试／重排队和断线接管均未获得直接证据；保存待办与保存模型不能替代这些条件。
- **运行与存储：**Agent／M2C 的端云进程分布，待办、会话、规划和检查点的具体持久化位置，产品数据库类型、最低版本与扩展依赖未决。
- **开放接入：**核心产品 API／CLI／SDK、Worker 准入、认证协议与第三方接入契约未决；没有建立可直接对接的调度中心模型。
- **端云与退出：**源码及模型推理上下文的完整流向、供应商及留存条款、本地缓存离线完整度、DSL 导出和恢复能力未决。
- **私有化：**完整组件清单、资源最低要求、外网依赖、授权和源码交付范围、与云端功能同等性未决。
- **开源与维护：**官方 GitHub 组织由官网给出，但 `gh` 不可用，仓库和许可证、提交／Release、Issue／Discussion 未核验；开源计划不当作开源发布事实。
- **验证强度：**本次完成官方公开资料调查和未登录网页入口观察，没有安装插件、运行生成项目、登录账号、验证断网／重启／故障恢复，也没有执行产品源码审计。政策与功能文档中的声明均不是运行实测。

## 后续验证建议

1. **先验证调度而非继续盘点功能。**用两个有前置关系的待办，观察上游完成、失败、取消时下游是否由系统自动推进；随后退出 IDE、断开网络或结束执行者，检查任务状态、执行归属和恢复行为。若仍必须人工打开会话继续，保留执行宿主分类。
2. **双平台分别完成一次实际接入。**在 Windows 与 macOS 上记录插件版本、IDE 版本和架构，走登录→新建项目→建模→待办执行→测试→重启恢复；检查更新和卸载后的本地文件、凭证以及云端资产是否残留。
3. **索取端云架构与正式接口。**要求官方明确 Agent、M2C、模型存储、账号授权的运行位置，提供第三方接入、执行权限、数据传输和模型供应商说明；不要依靠生成应用的 HTTP／RPC 文档对接产品后台。
4. **私有化先核对完整性与授权。**确认全部组件、硬依赖、离线授权、升级责任、功能差异，以及是否允许二次开发、服务化封装和框架再分发；拿到资料前不估算“轻量本地化改造”。
5. **验证退出与证据缺口。**实际导出模型及关联数据，在约定环境恢复；明确停服与注销的删除时限。具备可用 `gh` 后，定点核验官方核心仓库／许可证与发布记录，并补充与部署、接入相关的有限反馈样本。
