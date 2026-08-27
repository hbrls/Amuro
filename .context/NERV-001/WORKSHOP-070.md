# Wekan 技术产品调研

> updated_by: Qoder - Claude-Sonnet
> updated_at: 2026-08-10 15:30:00
> evidence_window: 2026-08-10；目标版本 v10.79（2026-08-10 发布，与调研同日）；分支 `main`；运行时 Meteor 3.5 + Node.js 24.x

## 交付结论

### Wekan 是协作看板，不是 Stateful 任务调度器

已确认：Wekan 的核心持久对象是 Board、Swimlane、List、Card、Checklist、ChecklistItem、CustomField、Attachment、Comment、Activity，以及用于自动化的 Rule / Trigger / Action。这些对象由 Meteor 服务器持有并落入 MongoDB 或 FerretDB（默认 SQLite）。Wekan 没有 Agent、Worker、Run、执行归属、任务队列、租约或失败转移等概念，也没有任何"把任务分派给执行者并推进其执行生命周期"的机制。

架构判断：Wekan 的自动化是**看板规则自动化**（trigger → action），动作由系统直接应用到卡片（移动、创建、加标签、加泳道），而不是唤起一个执行者去完成工作。它不满足本专项对 Stateful 调度的判定基准——不持久拥有执行归属、不判断任务何时可被谁执行、不负责失败后的执行恢复。Wekan 应归类为**协作工作管理工具（看板）**，而非任务执行宿主或调度中心。

边界同样明确：Wekan 确有类型化卡片依赖和定时规则，但二者都不构成调度。卡片依赖是关系标记，定时规则是日历/到期/老化触发的状态变更，二者都不驱动"依赖满足后自动解锁下游任务"的可执行性判定。

### 卡片是真实持久工作对象，支持父子子任务与类型化依赖，但依赖不参与自动推进

已确认：[Card 模型](https://github.com/wekan/wekan/blob/main/models/cards.js)包含 `parentId` 与 `subtaskSort` 字段，子任务通过 `parentId` 形成父子层级，复制时经 `wouldCreateCycle`（[subtaskHelpers](https://github.com/wekan/wekan/blob/main/imports/lib/subtaskHelpers.js)）防环。Card 还有 `cardDependencies` 字段承载类型化卡片间依赖。

依赖类型在 [models/metadata/dependencies.js](https://github.com/wekan/wekan/blob/main/models/metadata/dependencies.js) 中定义为 `DEPENDENCY_TYPES`：`related-to`（无向）、`blocks` / `is-blocked-by`（有向阻塞）、`fixes` / `is-fixed-by`（有向修复），源自 #3392 PI Program Board "Red Strings"，含颜色、图标、防环，可导出 JSON/SVG。

关键判定：这些依赖是**数据关系标注**，当前证据未发现任何机制在前置卡片完成/移动后自动解锁、推进或通知被 `blocks` 的下游卡片。依赖不进入规则引擎的可执行性判定，也没有拓扑排序或 DAG 解锁。因此不能把卡片依赖当作依赖驱动调度。

### 自动化是事件触发与定时规则，不是任务生命周期调度

已确认：Rule 数据模型（[models/rules.js](https://github.com/wekan/wekan/blob/main/models/rules.js)）是单条 `triggerId + actionId + boardId` 映射，可选 `buttonType`（card/board 手动按钮）。Trigger 类型在 [server/triggersDef.js](https://github.com/wekan/wekan/blob/main/server/triggersDef.js) 中按事件 `activityType` 匹配：`createCard`、`moveCard`、`archivedCard`、`addChecklist`、`addedChecklistItem`、`addAttachment`、`addedLabel`、`removedLabel` 等看板活动事件。

定时规则由 [server/scheduledRules.js](https://github.com/wekan/wekan/blob/main/server/scheduledRules.js) 用 SyncedCron（[server/cron/syncedCron.js](https://github.com/wekan/wekan/blob/main/server/cron/syncedCron.js)）评估，支持日历调度（`once`/`daily`/`weekday`/`weekly`/`monthly`）和两种 `scheduleKind`：`due`（到期/将到期/逾期）与 `aging`（卡片在列表停留天数）。看板级动作包括 `createCard`、`addSwimlane`、`moveAllCardsInList`。

架构判断：这是"到期自动移动卡片""每天创建重复卡片""卡片老化提醒"类的看板自动化。动作由系统直接落库，没有执行者分派、没有任务状态机推进责任方、没有执行结果回收。它接近"事件/定时驱动的状态自动变更"，而非"调度执行"。

### 运行形态是自托管服务器 + 浏览器客户端，符合 Local 优先，但双平台都无原生桌面应用

已确认：Wekan 是 Meteor 全栈服务器应用，客户端是"启用 JavaScript 的移动或桌面网页浏览器"（可装为 PWA）。官方定位是自托管（"self-hosting is the point"），核心能力完全在本地实例运行，不强制依赖任何官方云服务。

双平台形态一致：官方提供 [Windows/Mac/Linux bundle .zip](https://wekan.fi/install/)，内含 Node.js + FerretDB v1 + SQLite + `start-wekan` 脚本，无容器、无原生安装包。即在工作机上"解压 bundle + 跑脚本启动本地 Node 服务器 + 浏览器访问"。这不是原生桌面应用，而是把服务器跑在工作机上。

Local 优先判断：架构原则适配——数据完全留在自托管实例，无云端强绑定。选型缺陷是：Windows 与 macOS 都没有原生桌面应用或一体化安装器，只有"手动拼装服务器"的 bundle 路径，对普通终端用户不友好；且官方未提供签名、公证、后台自启动或一键卸载。

### 存在可选官方 SaaS，但不构成主体能力的云端依赖

已确认：Wekan 提供官方 SaaS（[WeKan Cloud at EU Finland](https://wekan.fi/saas/)，50 欧元/年），以及多个第三方托管（Elestio、Stellar Hosted 等）。但官方文档明确"没有官方 wekan.io 云服务，自托管才是重点"，SaaS 只是可选托管形态。

架构判断：Wekan 主体能力（看板、卡片、自动化、API）完整运行在自托管实例本地，不依赖云端。官方 SaaS 与自托管实例功能等价，仅是部署位置差异。因此 Wekan 无 Local 优先选型缺陷——它不是"桌面壳套云端服务"，核心数据与逻辑可完全留在工作机或私有服务器。断网（相对公网）不影响局域网内自托管实例的核心流程。

### 数据库可剥离替换，MongoDB 非硬依赖，FerretDB/SQLite 为默认

已确认：默认 [docker-compose.yml](https://github.com/wekan/wekan/blob/main/docker-compose.yml) 使用 FerretDB v1 + 内嵌 SQLite（讲 MongoDB wire 协议），无独立 MongoDB/PostgreSQL 服务。同时提供 MongoDB 7、FerretDB v1（PostgreSQL/MySQL/MariaDB/SAP HANA）、FerretDB 2 on PostgreSQL 等多种 compose 变体，并支持数据库间迁移。

架构判断：Wekan 通过 MongoDB 协议抽象层（Meteor 的 Mongo.Collection + FerretDB 兼容层）解耦了底层存储，数据库是可替换的运行时依赖而非架构硬依赖。SQLite（经 FerretDB）默认形态使单机/工作机部署成本极低。这是看板存储层的可替换性，与调度一致性无关——Wekan 没有需要分布式事务或行锁保护的调度状态。

## 调研目标

- 判断 Wekan 是否持久拥有工作对象、执行归属和可恢复的 Stateful 调度状态
- 明确 Board、Card、子任务、卡片依赖的实际对象模型及任务关系与生命周期
- 核验自动化（Rules/Trigger/Action/定时规则）是否构成任务调度或执行分派
- 分别评估 Windows、macOS 工作机接入及本地、云端运行形态
- 识别核心依赖、标准接入面和私有化改造范围

## 产品定位与核心流程

### 定位与用户

Wekan 是 MIT 许可的开源协作看板应用，用 Meteor 构建，提供实时 UI。定位是个人待办、团队协作与项目可视化管理，强调数据自主（自托管、不信任第三方）。已被翻译为 154 种语言，最大单实例约 3 万用户。目标用户是需要自托管看板、重视数据主权与隐私的个人与团队。

### 端到端流程

1. 用户注册/登录（首个用户为 Admin），创建或进入 Board，可设泳道与列表。
2. 用户在列表中创建 Card，可填描述、标签、成员、受让人、各类日期、checklist、子任务、自定义字段、附件、卡片依赖。
3. 多人实时协作：拖拽移动卡片、评论、watch/track/mute 看板，通知抽屉与邮件提醒。
4. 自动化：用户定义 Rule（trigger → action），事件（移动/建卡/加标签等）或定时（日历/到期/老化）触发系统直接修改卡片；也可用看板/卡片按钮手动触发规则；outgoing webhook 向外推送。
5. 数据经 REST API 可读写（含 Python 客户端），支持 Trello/Jira/CSV 等导入与 JSON/Excel 导出。

## 工作对象与调度模型

### Board、List、Card、子任务、依赖映射

| 对象 | 结论 | 持久化与归属 | 调度影响 |
| --- | --- | --- | --- |
| Board | 一等持久协作容器 | Meteor 服务器持有，落入 MongoDB/FerretDB | 是工作组织边界，不表达任务依赖或执行归属 |
| List / Swimlane | 持久看板结构 | 同上；列表为看板级（每泳道共享同一组列） | 是卡片状态的可视化分区，移动即状态变更，非任务生命周期状态机 |
| Card | 一等持久工作对象 | 服务器持有 ID、标题、描述、成员、日期、`parentId`、`cardDependencies` 等 | 是核心工作项，但无"可执行/运行/失败"执行态，仅看板位置与字段 |
| 子任务 | 真实持久（Card 的 `parentId`） | 父子层级，防环 | 仅层级包含，父卡完成不自动级联，无依赖解锁 |
| 卡片依赖 | 真实持久（`cardDependencies`，类型化） | `blocks`/`fixes`/`related-to` 等，防环，可导出 | 关系标注，不参与自动推进或可执行性判定 |
| Plan / Issue / Agent / Run / Task(调度义) | 当前证据未发现一等对象 | 无对应模型 | 不构成调度对象模型 |

### 任务关系、可执行性与状态所有者

Wekan 的"状态"主要是卡片所在列表/泳道的位置及自定义字段，没有独立的任务生命周期状态机（如 todo/doing/done 的受控迁移与责任方）。卡片移动由用户拖拽或规则动作直接写入，无"谁把任务从等待推进到可执行"的调度角色。

卡片依赖（含 `blocks`）不改变可执行性：被阻塞卡片仍可自由移动、编辑、归档，系统不阻止也不自动解锁。定时规则按日历/到期/老化触发，与卡片间依赖无交集。没有持续扫描依赖并自动推进下游的调度器。

### 自动化规则与定时触发

规则是单条 trigger→action，绑定看板。事件 trigger 匹配看板活动；scheduledTrigger 由 SyncedCron 周期性评估到期/老化条件并执行动作；button 由用户手动触发。动作直接落库（移动卡片、建卡、加泳道、移动列表内全部卡片等），无执行者、无队列、无并发抢占、无失败重试或转移。outgoing webhook 可把事件推出到外部系统，但那是通知，不是任务分派。

## 技术架构

### 系统全貌

```text
Browser / PWA (desktop & mobile layouts)
      | HTTPS + WebSocket (Meteor DDP, real-time)
      v
Meteor Server (Node.js 24.x, Meteor 3.5)  -- REST API + DDP + Rules engine + SyncedCron
      | MongoDB wire protocol
      v
FerretDB v1 + SQLite (default)  /  MongoDB 7  /  FerretDB→PostgreSQL/MySQL/MariaDB/SAP HANA
      |
      +-- Attachments/Avatars: filesystem / GridFS / S3 / MinIO / Azure Blob / GCS
```

本地 bundle 形态下这些组件位于同一工作机；Docker 形态为 wekan-app + 数据库两容器；Snap 为单包自更新；Sandstorm 为 grain；Kubernetes 经 Helm。

### 持久化与并发

所有看板对象、规则、活动流持久化于 MongoDB 协议数据库。Meteor 的实时性依赖 OpLog 尾部订阅（docker-compose 中 FerretDB 以 `--repl-set-name=rs0` 提供 capped `local.oplog.rs`，配合 `MONGO_OPLOG_URL`，避免忙看板高 CPU 的 poll-and-diff）。附件/头像可放文件系统、GridFS 或对象存储。无 Redis/Kafka 等第二队列；定时规则由 SyncedCron 在服务器进程内调度。

### 接口与鉴权

| 边界 | 主要接口 | 鉴权/约束 |
| --- | --- | --- |
| Browser ↔ Server | Meteor DDP over WebSocket + HTTPS | 密码 / LDAP / CAS / OIDC / OAuth2 / Sandstorm；邀请码；可关自注册与找回密码 |
| 第三方 ↔ Server | REST API（含 Python 客户端 `api.py`） | API 登录取 token；9 种看板角色控制权限 |
| Server → 外部 | outgoing webhook（全局/每看板） | 事件推送，单向通知 |
| Server ↔ DB | MongoDB wire protocol | FerretDB/MongoDB；OpLog 用于实时 |

### 数据边界

自托管实例持久化账号、看板、卡片、规则、活动、附件于本地数据库与所选存储。无强制云端回传。官方 SaaS 时数据位于其欧盟芬兰机房；自托管则完全在本地。断网不影响局域网自托管实例核心流程。

## 部署与工作机支持

### macOS

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .app/.dmg。提供 Mac bundle .zip（含 Node.js + FerretDB v1 + SQLite + `start-wekan.sh`），解压后跑脚本启动本地服务器；或 Docker / 源码（Meteor） |
| 运行入口 | `./start-wekan.sh` 启动 Node 服务器，浏览器访问 `http://IP:PORT/sign-in`；可创建 PWA 图标 |
| 依赖 | bundle 已含 Node.js 与 FerretDB/SQLite；源码需 Node 24.x + Meteor |
| 权限 | 默认写用户目录，不需 root；端口冲突时改 `PORT`/`ROOT_URL` |
| 网络 | 局域网自托管可离线运行；公网需自行配 TLS（如 Caddy） |
| 升级 | 下载新 bundle 替换，必要时升级 Node/DB 并 mongorestore |
| 卸载 | 官方未提供一键卸载；删除 bundle 目录与数据目录为合理推导，数据保留由用户决定 |

macOS 路径与 Windows 同为"本地跑服务器"，无签名/公证/登录项生命周期管理。

### Windows

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .exe 安装器。提供 win64 bundle .zip（含 `main.js` 与 `start-wekan.bat`），需另行下载 `node.exe` 与 MongoDB `.msi`（或用 FerretDB/SQLite），手动拼装 |
| 运行入口 | 编辑 `start-wekan.bat` 设 `ROOT_URL`/`PORT`/`WRITABLE_PATH`，双击运行 `node.exe main.js`，浏览器访问 `http://IP/sign-in`；可能需管理员/放行网络 |
| 依赖 | Node.js（匹配版本）、MongoDB 7.0.x（.msi）或 FerretDB/SQLite；或 Docker Desktop / WSL / VirtualBox |
| 权限 | 写 `WRITABLE_PATH`（附件/头像）；端口 80 常被占用需改端口 |
| 网络 | 局域网自托管可离线；公网需自行配 Caddy + 证书（文档详述 CloudFlare/Caddy/自签 CA） |
| 升级 | 备份（mongodump + WRITABLE_PATH）→ 换 bundle → 必要时升级 Node/MongoDB → mongorestore |
| 卸载 | 无官方卸载流程；手动删 bundle、Node、MongoDB 与数据目录 |

Windows 无原生工作机应用，仅"手动拼装服务器"或浏览器端访问远端实例。WSL/Docker/VirtualBox 属社区路径，非官方原生支持。

### 自托管服务器与可选 SaaS

生产推荐 Snap（amd64/arm64 自动更新）或 Docker（多架构）。资源要求：Wekan 至少 1 GB 空闲内存，生产建议整机 4 GB；数千用户时多前端 + 单后端 DB。磁盘满会损坏 MongoDB，需每日备份（无 undo）。官方 SaaS（欧盟芬兰）为可选托管，与自托管功能等价。

## 接入与改造边界

### 最小接入路径

1. 读写看板数据用官方 REST API（含 Python 客户端），需复用登录与 9 种看板角色权限，不应绕过服务器直写数据库。
2. 事件外发用 outgoing webhook 对接外部系统（通知语义）。
3. 若要把 Wekan 当"工作对象来源"接入外部调度：可由外部系统经 REST API 读取卡片/依赖/子任务，自行维护任务生命周期与执行归属；Wekan 本身不提供执行分派或调度状态。

### 私有化与依赖剥离

| 组件 | 性质 | 改造判断 |
| --- | --- | --- |
| MongoDB 协议层 | 可替换存储抽象 | FerretDB/SQLite 默认，可换 PostgreSQL/MySQL/MariaDB/SAP HANA/MongoDB，支持迁移；非硬依赖 |
| Meteor 实时（DDP/OpLog） | 核心实时机制 | 与服务器进程耦合，替换成本高；但仅服务实时协作，与调度无关 |
| Rules / SyncedCron | 看板自动化 | 进程内定时与事件规则，可扩展 trigger/action；非调度一致性组件 |
| 附件存储 | 可插拔 | 文件系统/GridFS/S3/MinIO/Azure/GCS 可换 |
| 认证 | 可配置 | 密码/LDAP/CAS/OIDC/OAuth2/Sandstorm，可对接私有 IdP |

Wekan 没有"调度最小核心职责"可剥离——它本就不含调度中心。若目标是 Stateful 调度，Wekan 只能作为工作对象（卡片）的来源或可视化层，调度状态、依赖解析、执行归属、失败恢复都需外部系统另行实现。

### 扩展约束

Wekan 的实时与规则引擎运行在 Meteor 服务器进程内，定时规则由 SyncedCron 驱动。水平扩展靠多前端 + 单后端数据库（官方资源示例），未提供多调度节点协调或任务抢占机制——因为它本非调度器。卡片依赖与定时规则不构成可扩展的执行编排底座。

## 维护状态、开源与公开反馈

仓库为 [MIT 许可](https://github.com/wekan/wekan/blob/main/LICENSE)，主分支 `main`，主语言 JavaScript，2014 年创建。截至 2026-08-10：约 21.0k stars、3.0k forks、347 open issues，`pushed_at` 为当日，最新 Release v10.79 于 2026-08-10 发布（与调研同日），近期标签 v10.70–v10.79 密集，属高频活跃维护。README 称"每天多次新增功能与修复"，仅支持最新版本。

安全治理较完整：CodeQL、Dependabot、secret scanning、安全/事件日志、48 个具名漏洞修复（Hall of Fame）、207 个 Node 测试套件与 45 个 Playwright 规格（含 24 个安全回归）。公开反馈以 GitHub Issues 为主（如子任务增强 #3626），个案不代表整体，本报告不据此外推稳定性结论。

## 未决项与证据边界

- 本次未实际部署或运行 Wekan；bundle 启动、OpLog 实时、定时规则触发与 webhook 行为来自官方文档与定点源码证据，未在目标环境复现。
- 卡片依赖（`blocks`/`fixes`）"不参与自动推进"是基于 triggersDef/scheduledRules 与依赖元数据的定点证据之"未发现"，非对未来版本的永久否定；依赖是否在任何规则 action 中被读取未逐行穷举。
- 官方未提供 Windows/macOS 的签名、公证、后台自启动与一键卸载说明；bundle 在长期后台运行与系统安全策略下的体验未决。
- 官方 SaaS 的开放范围、SLA 与数据驻留承诺未核验；自托管与 SaaS 的功能等价性来自官方表述，未逐项比对。
- FerretDB v2/PostgreSQL/DocumentDB 官方标注"未测试"；MySQL/MariaDB/SAP HANA 标注"请测试"，这些后端的实际兼容性未决。
- 定时规则的并发与幂等（多前端实例下 SyncedCron 是否重复触发）未在源码层确认。

## 后续验证建议

1. 在干净 macOS 与 Windows 环境各执行一次 bundle 安装、启动、改端口、备份、升级与手动卸载，记录依赖拼装、权限与数据保留行为。
2. 用真实实例验证定时规则（due/aging/日历）与事件规则的触发时机、动作边界，以及多前端下 SyncedCron 的并发行为。
3. 若拟以 Wekan 为工作对象来源外接调度器，先验证 REST API 读取卡片/子任务/依赖的完整性与 webhook 事件覆盖面，再设计外部任务生命周期与执行归属的映射。
4. 若需依赖驱动编排，明确 Wekan 卡片依赖仅作展示/参考，依赖解析与自动推进须由外部系统实现，不要把 `cardDependencies` 当作可调度的 DAG。
5. 若数据库选型关键，对目标后端（PostgreSQL/MySQL 等）做独立兼容性验证，不据"请测试"表述假定可用。
