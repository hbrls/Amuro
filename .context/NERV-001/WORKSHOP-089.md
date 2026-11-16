# PLANKA 技术产品调研

> updated_by: Qoder
> updated_at: 2026-10-23 15:32:45 +08:00
> evidence_window: 2026-10-23；Community 2.2.1（2026-08-10），提交 266246e242430d921c32badecdd447514107c568；master 快照 627701dda3459fa25830b0fd5bb2f5668d033284（2026-09-17）；Pro 2.5.0（2026-09-06）

## 交付结论

### PLANKA 是持久化协作看板，不是已证实的 Stateful Agent 调度器

**已确认**：PLANKA 拥有 Project、Board、List、Card、TaskList、Task 等工作记录，支持成员分配、任务完成标记、截止日期和实时协作。官方将其定位为实时协作 Kanban 应用；公开 API 展示的是对这些记录的创建、编辑和移动，而不是 Agent 执行服务。[产品说明](https://docs.planka.cloud/docs/about-planka/)、[官方 v2 API](https://documenter.getpostman.com/view/48263477/2sBXcDGMDt)

**判定**：具有持久状态不等于具有 Stateful 调度。当前证据未建立“依赖满足→进入就绪队列→选定执行者→领取或租约→执行→失败恢复”的闭环，也未证明 PLANKA 会启动 Agent。它不宜强行归入执行宿主、自动化运行器或无状态消费者，更准确的类别是**中心化持久工作记录与协作界面**。

**选型影响**：可以作为外部 Agent 工作来源和结果展示面；但现有证据不足以支持将其选作 Index 所要求的独立调度中心，不能假定只加一个客户端插件即可获得该能力。

### 任务关联和完成传播真实存在，但不是可执行依赖图

**已确认**：Community 2.2.1 的 Task 持久保存清单、关联卡片、用户归属、排序及完成状态。关联任务创建时继承卡片名称和关闭状态；卡片关闭／重新打开时，数据库事务同步更新关联任务的完成状态。这不是只有文本链接的看板。[Task 模型](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/models/Task.js)、[创建任务](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/helpers/tasks/create-one.js)、[状态事务](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/hooks/query-methods/models/Card.js#L178-L224)

**边界**：这条链路传播完成状态，没有展示“前置完成后唤起下游执行者”。排序不等于执行顺序，用户归属不等于执行租约。Pro 的跨看板卡片代理又是另一种关系，不能与 Community 的清单关联任务混为一谈。[Pro 2.5.0 发布说明](https://planka.app/blog/planka-pro-v2-5-0)

**已确认／未决**：Pro 已提供周期卡片，但官网仍将 Automated Workflows 标为 Soon。周期生成工作记录与按依赖持续调度 Agent 是不同能力；内部周期实现及故障补偿未公开核实。[官方功能边界](https://planka.app/features)

### Community 自托管能够保留本地业务数据，但不是离线优先桌面应用

**已确认**：Community 可以在自有服务器和自有数据库上完整运行其看板能力，官方不将其描述为试用版。浏览器是访问服务端的客户端；实时通信需要客户端到实例的网络连接。[版本说明](https://docs.planka.cloud/docs/community-or-pro/)、[部署入口](https://docs.planka.cloud/docs/installation/docker/production-version/)

**架构推导**：将应用与数据库都部署到工作 PC，可使核心协作数据不经过厂商托管云；但服务必须持续运行，浏览器断开该服务后不具备已确认的离线编辑与合并能力。远程自托管同样不等于工作 PC 本地运行。

**选型影响**：Community 对“本地控制数据”的要求有条件适配；没有独立桌面安装包是部署体验边界，不构成本地主体运行不成立的理由。调度能力应另行判断，初次下载、安装、升级与选择启用的外部服务仍有网络依赖。

### Community 最小部署依赖 PostgreSQL，不是可直接嵌入 Agent 的单进程任务库

**已确认**：官方最小 Compose 是应用加 PostgreSQL 16；应用镜像包含 Node 24、Python/Apprise 和出站 Squid。数据库初始化强制安装 `pg_trgm` 并建立 PL/pgSQL ID 生成函数，Community 不要求独立 Redis。[Compose](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/docker-compose.yml)、[镜像](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/Dockerfile)、[数据库前置](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/db/migrations/20250228000022_version_2.js#L6-L30)

**改造影响**：将其包装成一次 Agent 任务，只是调用中心服务，并没有下沉中心状态。移植为内嵌数据库或新增真正调度能力，需要分别改造持久层或领域模型，不能作为依赖剥离小改处理。

### Windows 手工安装文档存在运行时版本滞后，macOS 主要依靠 Linux 容器

**已确认**：Windows 指南提供预构建 ZIP 加服务器运行时的安装路径，不是独立桌面安装包。指南仍写 Node.js tested v22，但 Community 2.2.1 的服务端声明 `node >=24`，官方镜像也使用 Node 24；安装本目标版本应遵守代码要求，不能照抄旧文档。[Windows 指南](https://docs.planka.cloud/docs/installation/manual/windows/)、[服务端运行时](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/package.json)、[镜像定义](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/Dockerfile)

**已确认／缺陷**：官方镜像构建声明 `linux/amd64`、`linux/arm64`，为 Intel／Apple Silicon 工作机提供容器架构依据，但不是原生 macOS 或 Windows 二进制支持。macOS 专用原生安装指南未发现，双平台的宿主版本、服务自启、卸载及实际运行仍须验证。[镜像构建声明](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/.github/workflows/build-and-push-docker-image.yml#L74-L80)

### Community 是受限制的源码可用许可，Pro 默认不开放源码且存在授权锁定

**已确认**：Community License 1.1 允许组织内部使用与修改，但限制面向第三方商业获利的托管、跨组织商业账号共享等用途；不能当作无用途限制的开源许可。许可还排除非主分支内容以及标记为 `.pe.`／Pro 的内容。[Community 许可全文](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/LICENSE.md)

**已确认**：商业许可明确标准 Pro/Enterprise 仓库访问仅含预编译版本，源码仅在例外情况下另行协议开放；生产使用需要有效商业许可。故公开 Community 主干可核验，不代表 Pro 核心同样公开。[商业许可全文](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/LICENSES/PLANKA%20Commercial%20License%20EN.md)

**已确认**：Community 升级 Pro 会增加 Valkey 并进行不可降级的数据库迁移，Pro 到期后连只读访问也锁定。Pro 通常在线验权，可申请绑定主机名的离线密钥；托管 Pro 则把业务主体放在供应商的独立实例和数据库中。[迁移与到期](https://docs.planka.cloud/docs/community-or-pro/)、[离线授权](https://planka.app/faq/technical)、[托管说明](https://planka.app/pricing)

**选型影响**：对外商业托管须单独审查许可；Pro 的闭源默认边界、持续授权与单向迁移均是明确改造约束。自托管不等于免授权、可自由再分发或到期后仍可读；迁移前应保留可还原的 Community 备份。

### 可以绕过浏览器调用 API，但外部调度桥接不能只是字段映射

**已确认**：官方公开 REST API 和 Webhook；文档示例以 Bearer Token 鉴权，编辑工作对象仍受用户和看板权限约束。外部程序可以创建、更新卡片和任务，无须模拟浏览器界面。[API 文档入口](https://docs.planka.cloud/docs/api-reference/swagger-ui/)、[官方 v2 API](https://documenter.getpostman.com/view/48263477/2sBXcDGMDt)

**架构推导**：外部 Agent 可读取工作、写回评论与完成状态；但依赖解析、原子领取、执行租约、重试和结果验证必须由另一个有持久状态的组件承担，除非后续取得 PLANKA 自身具备这些语义的直接证据。仅将卡片移到“In Progress”不能防止多个 Agent 同时执行。

**改造影响**：使用现有 API 做任务来源适配与把 PLANKA 改成调度中心是两种量级。前者边界清晰；后者要新增核心调度领域，不是关闭某个可选依赖或把服务包装成一次 Agent 调用就能完成。

## 调研目标

- 判断工作对象、对象关系与任务生命周期是否构成 Stateful 调度。
- 核验客户端直接接入、Agent 分派及执行连续性边界。
- 分别核验 Windows/macOS 工作机部署及 Local 优先适配程度。
- 说明自托管与云端的依赖、数据、权限和持久化边界。
- 识别许可、架构范式、硬依赖及后续改造范围。

## 产品调研

### 产品定位与目标用户

**已确认**：PLANKA 是以项目、看板、列表和卡片组织工作的实时协作应用。主要面向需要自行控制工作数据的个人、团队与组织，不是以运行自主 Agent 为产品入口。Community 提供看板主体，Pro 面向需要额外角色、统一身份、多视图和重复工作模板的组织。[官方介绍](https://docs.planka.cloud/docs/about-planka/)、[版本说明](https://docs.planka.cloud/docs/community-or-pro/)

### 核心流程

**已确认**：管理员部署实例并创建账号；有权限的用户创建项目、看板与列表，录入卡片，在卡片中安排任务清单、成员、日期和资料。协作者通过移动卡片、勾选任务、评论与附件更新工作记录，服务端保存结果并向其他在线客户端同步。[Windows 入门流程](https://docs.planka.cloud/docs/installation/manual/windows/)、[官方 v2 API](https://documenter.getpostman.com/view/48263477/2sBXcDGMDt)

**边界**：这一流程解释的是人或外部 API 客户端如何管理工作；实际业务执行发生在 PLANKA 之外。卡片被标为完成并不等于系统已独立验证代码、产物或业务结果。

### 功能地图与边界

| 功能域 | 已确认能力 | 对调度问题的含义 |
| --- | --- | --- |
| 工作组织 | 项目、看板、列表、卡片、清单与任务 | 真实工作记录，不自动产生可执行队列 |
| 任务推进 | 用户编辑、移动、指派、勾选完成、日期和计时 | 记录协作进展，不是完整执行状态机 |
| 接入 | REST API、实时更新、Webhook | 能做事件输入与结果回写，但不证明消息可靠交付或原子领取 |
| 权限 | 实例管理、项目管理、看板编辑与查看 | 控制数据操作，不等于执行沙箱或机器能力授权 |
| Pro 增量 | 周期卡片、模板、跨看板视图、OIDC、额外角色 | 周期工作来源和协作增强；不能外推为依赖调度 |
| 规划能力 | Automated Workflows 标为 Soon | 不作为已发布能力计入结论 |

依据：[公开 API](https://documenter.getpostman.com/view/48263477/2sBXcDGMDt)、[官方功能表](https://planka.app/features)、[Pro 2.5.0](https://planka.app/blog/planka-pro-v2-5-0)。官网版本表和 API 发布窗口并不完全相同，精确字段支持仍需以目标 Community Release 为准。

### 维护状态与版本演进

**已确认**：截至调研时，仓库未归档，最新 Community Release 为 **2.2.1，2026-08-10**，发布提交为 `266246e242430d921c32badecdd447514107c568`。默认 master 另指向 2026-09-17 的 `627701dda3459fa25830b0fd5bb2f5668d033284`；仓库 `pushed_at` 为 2026-10-21，不应误写成 master 提交日期。本报告实现核验固定在 2.2.1，不把主干变化算入稳定版。[Release](https://github.com/plankanban/planka/releases/tag/v2.2.1)、[发布提交](https://github.com/plankanban/planka/commit/266246e242430d921c32badecdd447514107c568)、[master 快照](https://github.com/plankanban/planka/commit/627701dda3459fa25830b0fd5bb2f5668d033284)

**部署影响**：2.2.1 是修复已认证用户经静态资源路径读取本地文件问题的安全版本；说明升级直接影响本地文件边界，不能为保留旧功能就不评估旧版本风险。本轮不展开漏洞利用或源码安全审计。[发布说明](https://github.com/plankanban/planka/releases/tag/v2.2.1)

**已确认**：Pro 2.3.0 于 2025-12-23 加入周期卡片，2.4.4 于 2026-08-21 对齐 Community 2.2 的变化，2.5.0 于 2026-09-06 发布。其方向是周期工作记录、跨看板呈现、权限与商业运行能力，不能与 Community 发布节奏混用。[官方 Changelog](https://planka.app/changelog)

**重要版本差异**：Pro 2.4.4 的迁移说明明确指出 Community 2.2 移除了单点登录及相关身份关联，并会停用相应账户。不能因旧版 API 文档仍有 OIDC 示例，就宣称当前 Community 包含 SSO。[官方 Changelog](https://planka.app/changelog)、[当前版本说明](https://docs.planka.cloud/docs/community-or-pro/)

### 生态与反馈

**已确认**：官方文档列出 Python、PHP API 库、CLI、移动客户端与 MCP 等社区项目，并另有官方 API 参考。它们证明存在第三方接入生态，不构成 PLANKA 官方内置 Agent 运行或调度支持。[社区项目入口](https://docs.planka.cloud/docs/community/projects/)

**已确认**：官网应用目录中的 PLANKA Notes 是社区快捷建卡工具，列出 Windows 支持而将 macOS 标为 Coming soon；它不是完整看板服务器或官方双平台桌面客户端。[应用目录](https://planka.app/apps)

**反馈样本**：2026-10-23 按最近更新时间抽样 10 条非 PR Issue，只保留影响接入与部署的主题：2026-10-11 的 [#1791](https://github.com/plankanban/planka/issues/1791) 反馈升级代码后 OIDC 不见，2026-10-21 的 [#1807](https://github.com/plankanban/planka/issues/1807) 请求组织身份登录，说明身份接入是实际诉求；其缺失边界另由官方版本说明交叉确认。

**单例限制**：2026-09-21 的 [#1782](https://github.com/plankanban/planka/issues/1782) 报告 2.2.1 登录后 Bearer 访问返回 401、API Key 可用，检索时仍开放且未见评论。它构成升级和双鉴权测试线索，不证明全部 2.2.1 部署存在同样故障，也不能据此推荐绕过验证。

**证据边界**：样本不是总体质量统计；社区客户端的兼容版本与运行效果未逐一测试，收录不等于官方承诺。

## 技术架构调研

### 系统全貌与运行形态

**已确认**：Community 是 React／Redux 浏览器前端与 Node.js／Sails 中心服务，使用 PostgreSQL 持久化业务状态。官方构建将前端静态资源装入应用镜像，最小 Compose 启动应用和 PostgreSQL，不要求独立前端服务或 Redis；Python/Apprise 与 Squid 包含在应用镜像内。[客户端依赖](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/client/package.json)、[服务端依赖](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/package.json)、[镜像](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/Dockerfile)、[Compose](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/docker-compose.yml)

**架构推导**：中心应用和数据库是权威工作状态持有方，浏览器不是独立调度中心。两个服务可以同在工作机，也可以部署在组织服务器；访问端的操作系统不决定业务主体位置。

```text
Windows / macOS 浏览器，或外部 API 客户端
                │ HTTP(S) 请求 / 实时连接
                ▼
       PLANKA 中心应用服务
          │              │
          ▼              ▼
      PostgreSQL      上传文件存储
          │
          └── 工作对象、关系与协作状态的权威持有方

中心应用 ── 按配置 ──> Webhook 接收方 / 邮件等外部服务
Pro 自托管额外依赖：Valkey、有效授权；可申请离线授权
托管 Pro：应用、数据库与文件均进入供应商环境
```

图中是文档推导的部署角色，不代表已验证具体托管拓扑。Pro 的 Valkey 用途、商业内部服务拆分和多实例协调实现仍需商业资料确认。

### 工作对象、关系与生命周期

| Index 对象 | PLANKA 对应事实 | 持久化、归属与推进边界 |
| --- | --- | --- |
| Workspace | 当前文档未建立独立 Workspace 领域对象；实例承载项目 | 不能把实例或项目自动命名成调度 Workspace |
| Project | 真实项目对象，下辖 Board | 服务端所有；权限主体为用户与项目管理关系 |
| Issue | 未发现与 Card 分离的专门 Issue 对象 | 卡片可表达问题，但不附带 Issue→Task 编排转换语义 |
| Plan | 未发现持久化依赖编排 Plan | 描述、模板或时间轴不能替代执行计划 |
| Task | 真实清单任务，下属 TaskList；TaskList 属于 Card | 含标识、排序、完成标记及可选成员／卡片关联 |
| 辅助层级 | Board→List→Card，Card→TaskList→Task | 是组织与展示层级；不等于 Task 间 DAG |

**已确认**：存在项由官方 API 与 2.2.1 的 Task、TaskList 定义交叉确认；记录使用独立 ID 和外键式归属，数据由服务端持有。缺失项表示本轮官方资料及定点验证未建立相应对象，不是全仓穷举证明。[API](https://documenter.getpostman.com/view/48263477/2sBXcDGMDt)、[Task](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/models/Task.js)、[TaskList](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/models/TaskList.js)

**状态责任——已确认**：普通任务由看板 editor 修改完成标记，并可指派给该看板成员；关联卡片的任务仅允许调整所在清单及排序，不能直接修改完成标记、名称或成员。List 有 `active`、`closed`、`archive`、`trash` 类型，不仅是任意标题；卡片移入 active／closed 列表可改变 `isClosed`，事务再将此状态同步到引用它的任务。[任务更新入口](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/controllers/tasks/update.js)、[列表定义](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/models/List.js)、[卡片状态入口](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/helpers/cards/update-one.js#L221-L237)、[事务传播](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/hooks/query-methods/models/Card.js#L178-L224)

**调度语义——架构判定**：这实现关联对象的一致完成显示，不是“阻塞边被解除后，下游自动运行”。`position` 是界面排序，`assigneeUserId` 是用户归属；日期、计时、成员和列表状态没有在已核验链路中参与资源选择、并发额度或 Agent 调用。未建立独立 Plan、Issue→Task 编排转换、DAG 分支、失败重试及取消传播机制的证据。

**Agent 连续性——未确认**：没有已确认的 Agent 注册、执行租约、超时接管或检查点。服务重启后可保留工作记录，不代表恢复外部进程；外部 Agent 的完成、失败与产物验证仍需外部执行侧负责。

### 主要组件与核心链路

#### 链路一：用户或 API 客户端创建并推进工作

1. 客户端登录获得凭据，或使用目标版本支持的 API 凭据。
2. 用户在授权项目／看板创建卡片、清单和任务，指定成员与日期。
3. 中心服务校验访问权限，持久化变更，并向相关在线客户端反馈。
4. 人或外部执行方完成实际工作后，更新任务或卡片、添加说明与附件。

**已确认／边界**：任务更新入口检查看板编辑权限与成员，处理器写入任务，再向 `board:<id>` Socket 房间广播并发出 Webhook；完成标记变化还形成协作活动记录。PLANKA 接收完成更新，不代表它独立验证了实际工作结果。[任务更新入口](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/controllers/tasks/update.js)、[持久化与反馈](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/helpers/tasks/update-one.js)

#### 链路二：外部自动化接收事件并回写

**已确认**：管理员可配置 Webhook 的接收 URL、凭据及事件筛选。外部客户端接到事件后可调用 API 查询／变更工作记录。[Webhook API](https://documenter.getpostman.com/view/48263477/2sBXcDGMDt)

**架构推导**：外部调度组件可据此形成工作来源，但必须自行判定任务可执行性、授权 Agent、协调并发、执行验证并回写状态。Webhook 是跨网络的数据出口，不应直接向任意外部地址发送敏感卡片信息。

**已确认**：2.2.1 的投递处理器在当前应用进程直接发出 HTTP POST，正文含事件、当前／此前数据及操作者，配置凭据时使用 Bearer Header。失败分支记录错误，没有在该链路中入持久队列、重试或重放；业务更新方也不等待这些投递完成。因此不能将其作为可靠工作队列。[Webhook 投递实现](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/helpers/utils/send-webhooks.js)、[调用方](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/helpers/tasks/update-one.js)

**架构推导／未决**：进程退出或接收端不可用可能造成通知丢失；运行级失效行为未测试，外部系统不应依靠未经承诺的恰好一次投递或顺序性。

#### 链路三：Pro 周期工作与托管运行

**已确认**：Pro 支持周期卡片，可周期性形成工作记录；托管 Pro 由供应商维护实例，用户通过浏览器访问。当前官方资料没有建立周期卡片与 Agent 选择、运行、失败接管之间的调度闭环。[功能说明](https://planka.app/features)、[托管与条款](https://planka.app/terms)

### 主要依赖

| 依赖 | 已确认性质 | 剥离／替换影响 |
| --- | --- | --- |
| Node.js ≥24、Sails | 2.2.1 服务端运行要求；镜像也使用 Node 24 | Windows 文档的 v22 已不足以代表目标版本 |
| PostgreSQL | 应用适配器为 `sails-postgresql`，迁移客户端为 `pg`；Compose 使用 `postgres:16-alpine` | 是关系持久层硬依赖，无已确认的内嵌数据库开关；16 是部署基线，不是已证明的最低版本 |
| `pg_trgm`、PL/pgSQL、数据库序列 | v2 初始化迁移创建扩展及 `next_id()`，多类工作对象使用数据库生成的 ID | 初始化账号须能创建所需对象；迁移到内嵌库必须重做这些数据库语义，不是只换连接串 |
| Python／Apprise | `requirements.txt` 指定 Apprise；安装脚本执行 Python 配置，最终镜像也保留 Python | 不是纯构建期依赖，其用途是通知适配而非 Agent 执行；剥离需调整安装／构建和相关能力，未验证现成关闭开关 |
| Docker / Compose | 推荐封装；最小方案是 PLANKA 应用与 PostgreSQL 两个服务 | 宿主不必另外安装应用所需 Node/Python，但需运行容器环境 |
| Squid 出站代理 | 官方应用镜像内置；也可配置外部代理 | 是外联安全边界，不是消息中间件；不能泛称为 Docker 引擎自带 |
| Valkey | Pro 迁移时新增；Community 最小 Compose 没有该服务 | 不能将技术 FAQ 泛称 Redis 套用到 Community；Pro 中确切职责未公开核验 |
| 有效授权 | Pro 在线验证或离线密钥 | 商业运行条件，不是可随意关闭的增值配置 |
| S3、外部身份、邮件等 | 依版本及启用功能而定 | 与基础看板的本地状态存储分开评估 |

证据：[服务端依赖](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/package.json)、[适配器](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/config/datastores.js)、[迁移配置](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/db/knexfile.js)、[初始化前置](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/db/migrations/20250228000022_version_2.js#L6-L30)、[Python 依赖](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/requirements.txt)、[Dockerfile](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/Dockerfile)、[Compose](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/docker-compose.yml)、[Pro 迁移](https://docs.planka.cloud/docs/community-or-pro/)。

### 接口形态与权限

**已确认**：REST API 可不经过官方 Web UI 管理工作。2.2.1 支持 Bearer 会话和 `x-api-key`：Bearer 路径验证 JWT、数据库中的未删除 Session、账号激活／密码变更等状态；如果会话绑定了 HTTP-only token，还必须带对应 Cookie。API Key 经哈希匹配有效用户，同样继承用户权限，而非独立机器管理员权限。[鉴权入口](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/hooks/current-user/index.js#L14-L124)

**已确认**：任务创建与修改要求看板 editor，指派用户须属于看板；配置 Webhook 要求管理员。它们控制数据操作，不授予 Agent 的 shell、文件系统或网络执行权限。Swagger 暴露可由实例配置启用，不应将公开示例集误当目标版本完全一致的运行契约。[任务权限](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/controllers/tasks/update.js)、[Webhook API](https://documenter.getpostman.com/view/48263477/2sBXcDGMDt)、[Swagger 配置](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/docker-compose.yml)

**接入判断**：Windows 与 macOS 可用同一 HTTP 协议接入，不需专有 Agent SDK。官方客户端创建／管理工作与外部 Agent 领取任务是不同语义；后者及服务端唤起工作机的执行协议均未确认。社区 CLI、SDK、MCP 不自动补足这些中心职责。

### 持久化方式

**已确认**：业务对象及会话写入外置 PostgreSQL；应用经 Sails PostgreSQL 适配器访问，Knex 管理迁移，非内嵌数据库或纯内存状态。卡片关闭与关联任务完成标记在同一数据库事务中更新。官方 Compose 分别持久化 `/app/data` 与 PostgreSQL 数据目录；只备份 SQL 不能恢复所有上传资产。[数据适配器](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/config/datastores.js)、[状态事务](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/hooks/query-methods/models/Card.js#L178-L224)、[持久卷](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/docker-compose.yml)、[备份指南](https://docs.planka.cloud/docs/installation/docker/backup-and-restore/)

**已确认／边界**：S3 是可配置文件存储路径，不是默认必需云服务。浏览器缓存／Redux 状态不代替中心数据库；保留数据库和文件可恢复工作记录，但本轮未实测恢复，且这不恢复外部 Agent 的进程、租约或检查点。[存储配置](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/docker-compose.yml)

### 通信方式

**已确认**：官方浏览器使用 Sails.io 封装 Socket.IO，连接 `/socket.io`，并通过 `socket.request` 承载类似 HTTP 方法的 `/api` 请求；外部客户端也可直接使用 REST。服务端向看板房间广播工作变更。应将其描述为带应用协议的实时连接，而不是可任意接入的裸 WebSocket。[客户端通信](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/client/src/api/socket.js#L6-L42)、[广播调用](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/helpers/tasks/update-one.js)

**已确认**：客户端启用自动重连；重连处理会重新获取 bootstrap 和核心工作数据，再更新客户端状态。这是重新同步中心状态，不是重放可靠事件日志，更不代表离线编辑合并或 Agent 任务接管。[重连处理](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/client/src/sagas/core/services/socket.js#L18-L109)

**网络边界**：反向代理需要正确支持实时连接并配置 HTTPS；Webhook 则是应用向外部接收方发出的独立 HTTP POST。Community 最小部署不要求独立消息中间件，不能把 Pro 的 Valkey 或浏览器连接推定为调度消息总线。[反向代理](https://docs.planka.cloud/docs/configuration/reverse-proxy/nginx/)、[Compose](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/docker-compose.yml)

### 任务队列

**当前证据未确认**任务 claim、原子抢占、租约、多执行者互斥、超时回收或转派接口。数据库中的工作记录与 Webhook 事件不足以证明持久调度队列；也不能因为 Pro 新增 Valkey 就推断它用于 Agent 任务领取。

**架构影响**：并发 Agent 不能仅凭读取卡片后更新成员字段来假设独占执行。若采用外部调度，需要单独建立执行协调的权威状态；本轮不为此扫描 PLANKA 内部无关的异步处理。

### 部署形态

#### Windows 工作机

**浏览器客户端——已确认**：连接自托管实例或托管实例，使用现代浏览器。无需在每台客户端另装数据库，但工作对象实际位于被访问的服务器，不能声称浏览器安装后就是本地中心。[浏览器要求](https://planka.app/terms)

**本机手工服务器——已确认**：官方指南要求管理员 PowerShell，下载预构建 ZIP、安装依赖，配置 `BASE_URL`、`DATABASE_URL`、`SECRET_KEY`，初始化数据库与管理员，再启动服务并从浏览器访问。2.2.1 的 Release 资产确实提供 `planka-prebuild.zip`，不是桌面安装器。[Windows 指南](https://docs.planka.cloud/docs/installation/manual/windows/)、[Release 资产](https://github.com/plankanban/planka/releases/tag/v2.2.1)

**版本冲突——已确认**：指南列 PostgreSQL tested v16、Node.js tested v22、Python tested v3.10，并给出 `npm start --prod` 入口；但 2.2.1 的服务端要求 **Node.js ≥24**。应固定目标 Release、采用其运行时要求并验证生产启动，不把指南样例当成完整可复制的已测试安装步骤。数据库初始化还要求可创建 `pg_trgm`、序列及 PL/pgSQL 函数。[运行时声明](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/package.json)、[初始化前置](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/db/migrations/20250228000022_version_2.js#L6-L30)

**安装性质**：预构建 Web 应用加服务器运行时，而非 `.exe` 桌面应用。指南未给出完整 Windows 服务托管方案；另外的 run-as-a-service 文档面向 Linux，不应直接搬用。[服务运行说明](https://docs.planka.cloud/docs/configuration/run-as-a-service/)

**权限和网络**：安装指南的管理员权限不意味着应让所有运行进程长期以管理员身份执行。客户端需连通服务端，应用需连通 PostgreSQL；对外暴露时需要适当的 TLS、监听地址与 Windows 防火墙规则。下载与 npm 安装需要网络；手工路径需另配出站代理或防火墙控制服务器外联。后两项为文档要求和部署推导，不是本次实测。

**容器替代——有条件支持**：官方推荐通用 Docker Compose，并声明支持能够运行 Docker 的系统；在 Windows 实际属于宿主上的容器服务，不是 Windows 原生应用。具体 Docker 后端、系统版本和虚拟化权限未由 PLANKA 文档完整确认。[技术 FAQ](https://planka.app/faq/technical)

**升级**：容器路径先备份，再按官方步骤停止旧服务、拉取镜像并重新启动；应固定并核对目标版本。手工路径未发现完整 Windows 专用升级说明，不能用覆盖程序文件代替数据库迁移与回滚验证。[Docker 升级](https://docs.planka.cloud/docs/installation/docker/how-to-update/)

**卸载——架构推导，非官方完整卸载教程**：先导出并验证数据库和上传文件备份；停止手工服务及自行配置的启动项，再移除 PLANKA 程序和仅属于该实例的数据。单独安装的 PostgreSQL、Node.js、Python 可能为其他应用共享，不应一并卸载。容器方式删除容器不等于删除持久卷；清除卷必须与“卸载程序、保留数据”明确分开。仅作为浏览器客户端时，退出账号、撤销必要凭据并清理站点数据，不会删除服务器数据。

**支持缺口**：官网付费代安装服务不支持 Windows，但这不否定手工安装指南存在；两者分别是商业服务范围和产品安装路径。[代安装范围](https://planka.app/pricing)

#### macOS 工作机

**浏览器客户端——已确认**：与 Windows 使用同一中心服务和 Web 协议。浏览器既可连接本机服务，也可连接远端实例；是否符合“主体在本机”取决于服务及数据库部署位置，不能只看客户端形式。[浏览器要求](https://planka.app/terms)

**本机服务——文档支持加架构推导**：使用通用 Docker Compose，将 PLANKA 与数据库运行在工作机的容器环境中，配置密钥、实例地址、持久卷并创建管理员后启动。官方步骤中的 `/opt/planka` 是通用示例，不是已经验证的 macOS 原生安装目录。[Docker 生产部署](https://docs.planka.cloud/docs/installation/docker/production-version/)

**依赖和权限——已确认／未决**：需要可工作的 Docker 与 Compose，应用所需 Node 24、Python 和 Squid 在镜像内。发布流程声明构建 `linux/amd64`、`linux/arm64`，覆盖 Intel／Apple Silicon 对应指令架构；但宿主虚拟化、最低 macOS 版本、Docker 安装权限、具体发布镜像拉取与启动仍未实测。绑定目录须对容器用户可写，不能直接把 Linux `chown` 示例当成已验证的 macOS 权限配置。未发现独立 macOS 原生服务安装包或专用指南。[镜像构建](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/.github/workflows/build-and-push-docker-image.yml#L74-L80)、[最终镜像](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/Dockerfile)

**网络**：初次取得镜像及更新依赖网络；日常浏览器需连到本地实例，应用需连数据库。**架构推导**：Community 全部核心组件部署在本机、使用本地账号且未启用外部功能时，基础登录、读写应不需要公网，但尚未通过断网测试确认；本机浏览器与应用间的连接仍必需。机器休眠或 Docker 停止会令服务不可用。

**升级**：遵循官方容器备份、拉取、重建流程，额外验证宿主架构对应镜像可用以及数据迁移；不将 nightly 当作正式稳定安装。[更新指南](https://docs.planka.cloud/docs/installation/docker/how-to-update/)

**卸载——架构推导**：先保留数据库和上传资源备份，停止并移除该实例容器；确认不再需要数据后才删除专属卷或绑定目录。不要为卸载一个 PLANKA 实例删除其他项目共用的 Docker 环境。仅浏览器接入时清理账号与站点数据即可，云端或远程服务器实例仍需独立处置。

**选型缺陷**：macOS 本机运行主要依靠通用容器路径，缺少已确认的原生安装、服务自启和卸载体验。Notes 的 macOS “Coming soon”不能作为当前支持。[应用目录](https://planka.app/apps)

#### 主体功能运行位置与最小部署

| 形态 | 主体与数据位置 | Local 优先判断 |
| --- | --- | --- |
| Community 全部组件位于工作 PC | 本机中心服务、数据库与文件；浏览器连接本机 | 对看板能力有条件适配，仍非 Agent 调度器；持续服务与数据库运维不可省略 |
| Community／Pro 位于组织服务器 | 数据和业务在组织服务器，PC 是访问端 | 私有化成立，但不属于工作 PC 主体运行 |
| Pro 本机自托管 | 本机业务与存储，增加 Valkey 和授权条件 | 可以本地运行，但有商业依赖、到期锁定和单向迁移约束 |
| 托管 Pro | 供应商实例、数据库和文件；PC 浏览器 | 核心能力依赖远端，不满足本机 Local 优先 |

**最小部署——已确认**：2.2.1 的官方 Compose 是 PLANKA 应用加 PostgreSQL 16，默认映射宿主 `3000` 到应用 `1337`，两个持久卷分别保管应用数据和数据库。应用镜像内部另含 Python/Apprise、Squid，不存在 Community 必需的独立 Redis 服务。[Compose](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/docker-compose.yml)、[Dockerfile](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/Dockerfile)

**运维边界**：样例使用 `latest` 和占位 `SECRET_KEY`，数据库以容器网络内 trust 模式连接且没有映射数据库端口。正式安装应固定经确认的版本、替换密钥并隔离数据库网络；不能将该样例直接推广成跨主机可信部署。数据库迁移、文件／数据库联合备份、升级、TLS 和主机持续运行是实际运维成本。

**资源边界**：FAQ 为小团队给出 2 GB RAM、10 GB 存储建议，不是 benchmark、最低保证或包含 Windows/macOS 容器宿主开销的测量。[技术 FAQ](https://planka.app/faq/technical)

#### 云端形态

**职责边界——已确认**：供应商提供托管 Pro、独立实例和隔离数据库；负责服务器运行与更新。浏览器把工作内容发往托管实例，客户中心另承担授权、支持及合同入口，不能把整个云端缩写成“认证网关”。[托管产品](https://planka.app/pricing)、[服务条款](https://planka.app/terms)

**组件与依赖——已确认／推导**：独立应用实例及数据库有官方承诺；Web/API、文件存储、实时连接是产品主体在托管环境中的职责。基于自托管 Pro 的 Valkey 依赖，可以推导托管版也需要相应后台能力，但不能认定每租户独占 Valkey、具体容器编排方式或数据库高可用拓扑；这些未公开核实。

**接口、持久化和通信**：用户经 HTTPS 与实时连接操作应用；工作记录、账号及上传内容保留在服务商环境。启用 Webhook、对象存储、邮件或 OIDC 时还会跨越相应外部边界。托管 Pro 的全部 API／凭据能力是否与自托管许可完全一致，需结合实际订购版本确认，不凭公开 Community API 保证。

**数据和地域——已确认**：安全页面说明德国托管运营及基础设施提供方；公开 DPA 对 EU／EEA 控制者规定欧盟处理范围，其他客户不应一律套用同一地域保证。实例具体位置应以适用合同及供应商确认结果为准。[安全说明](https://planka.app/security)、[DPA](https://planka.app/dpa)

**权限——已确认／边界**：提供应用角色隔离、TLS、TOTP／OIDC 等能力；供应商在受约束条件下承担运维访问。隔离数据库不等于已证明独立物理服务器、端到端加密或所有静态数据加密，公开材料不足以作此承诺。[安全说明](https://planka.app/security)、[DPA](https://planka.app/dpa)

**授权网络边界**：自托管 Pro 通常需要在线验证授权，离线密钥绑定主机名；这条厂商连接与托管业务数据路径应分别记录。官方 FAQ 未在公开说明中给出完整授权协议、交换字段或离线密钥所有失效条件，不能断言授权服务读取全部业务内容。[技术 FAQ](https://planka.app/faq/technical)

**授权失联——未决**：有效在线授权在验证端不可达时能否启动、继续读写以及是否存在宽限期，官方公开材料不足以确认。“授权到期锁定”“授权服务暂时失联”和“PC 无法连接托管实例”是三种不同故障，不能用其中一种的结论替代另外两种。

**故障与退出——已确认／推导**：PC 到实例断网或实例不可用会阻断协作；数据库／存储不可用影响对应记录和资产。官方有自动更新与备份承诺，但本轮未取得可适用于所有套餐的数值 RPO/RTO。终止托管后的导出申请与删除窗口由合同规定，公开 DPA 给出 30 天申请导出及后续删除安排，不代表随时可以无损降回 Community。[条款](https://planka.app/terms)、[DPA](https://planka.app/dpa)

### 依赖根源、架构范式与改造边界

**架构判定**：中心化、持久化、多用户协作 Web 应用；不是已证实的 Stateful Agent 调度器。中心服务掌握工作记录，浏览器或一次性 Agent 调用不能等价替代中心数据库与权限边界。

**数据库根源——已确认＋推导**：关系对象持久化和卡片／任务状态事务是业务基础；PostgreSQL 绑定不仅来自驱动名称，还包括迁移中的 `pg_trgm`、序列、PL/pgSQL ID 生成和 PostgreSQL 类型。`pg_trgm` 不是 Agent 任务锁或向量检索组件，但当前迁移无条件安装它，不能把“不是调度核心”误解为可通过配置直接删除。换成内嵌库须调整数据访问、迁移及事务语义，超出部署配置修改。[迁移前置](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/db/migrations/20250228000022_version_2.js#L6-L30)、[PostgreSQL 客户端](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/db/knexfile.js)、[状态事务](https://github.com/plankanban/planka/blob/266246e242430d921c32badecdd447514107c568/server/api/hooks/query-methods/models/Card.js#L178-L224)

**两种改造范围——架构推导**：

- 保持 PLANKA 为工作记录系统：通过 API／Webhook 与外部调度中心对接；主要风险是状态同步、权限和版本变化，不能假定事件可靠投递。
- 让 PLANKA 自己承担调度：新增依赖解释、执行尝试、就绪与领取协调、超时回收、失败恢复和结果验证；这改变其领域模型与运行职责，不是简单增加状态标签。

**扩展边界**：官网把“运行多个服务器实例”列为 Pro 能力。不能因可以启动多个 Community 容器，就宣称其跨实例事件同步与状态协调已有官方支持；也不能把商业版多实例协作等同于多 Agent 任务抢占。[功能表](https://planka.app/features)

## 未决项与证据边界

- Windows 和 macOS 均未实装；没有启动 PLANKA、执行迁移、断网、休眠或故障恢复测试。Linux 双架构构建声明不等于相应工作机已通过验证。
- Community 2.2.1 明确要求 Node.js ≥24，PostgreSQL 16 是官方容器基线；PostgreSQL、Python、宿主操作系统的精确最低支持版本仍未统一声明。Windows 文档的 Node 22 是已确认的版本冲突。
- 官方 v2 Postman 集合发布于 2026-02-17，早于 Community 2.2 和 Pro 2.5.0；对象、关联完成传播、鉴权及关键通信已用 2.2.1 源码补证，未逐端点验证兼容性。
- “未发现 Agent 调度闭环”是官方资料加有限关键链路的架构判定，不是无边界源码审计得出的全功能不存在证明；也未对商业内部实现作同等源码验证。
- Pro 标准客户不能取得源码；Valkey 具体职责、周期工作恢复、多实例协调与托管拓扑仍待商业资料或运行验证。有效在线授权暂时失联时的宽限期和运行行为同样未决。
- 近期反馈来自 10 条按更新时间抽样的 Issue；仅收录接入相关主题，没有用单一 JWT 故障样本推断普遍故障。

## 后续验证建议

- 固定 Community 2.2.1 及对应镜像，在 Windows 验证 Node 24 手工路径与容器路径，在 macOS 验证匹配宿主架构的容器；检查本地账号断公网登录／读写、重启、休眠与联合备份恢复。
- 使用最小权限账号验证 Bearer、绑定 Cookie 与 `x-api-key` 的行为，并检查两个客户端并发编辑和关联卡片完成传播；不要将协作编辑成功当成独占领取成功。
- 对已确认无持久投递队列的 Webhook 做受控接收端中断和应用重启测试，量化本实例的事件丢失边界；外部执行闭环不得只依赖通知到达。
- 若考虑 Pro，在数据副本上验证单向迁移、到期锁定、在线验权失联、离线密钥与数据导出，并书面确认源码访问、Valkey、托管地域和终止条款。
