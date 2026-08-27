# Dify 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-31 16:49:41
> evidence_window: 调研日期 2026-07-31；Dify v1.16.1（2026-07-28）与同日仓库快照

## 调研目标

- 判断 Dify 是否持久拥有工作对象、依赖关系、任务状态和执行归属，并据此持续推进任务。
- 明确 Workspace、Project、Issue、Plan、Task 的实际对象模型及任务生命周期。
- 核验 Agent 分派、失败恢复、队列、接口、持久化和依赖边界。
- 分别判断 Windows 与 macOS 工作机部署、客户端接入及本地、云端边界。
- 判断架构范式、Local 优先适配程度、私有化成本和改造边界。

## 交付结论

### 当前证据不能将 Dify 认定为 Stateful 中心调度器

**已确认事实：** Dify 是面向 LLM 应用的 Web 开发平台，提供可视化 Workflow、Chatflow、Agent、RAG、模型管理和应用 API。自托管版还包含 PostgreSQL、Redis、Celery Worker、Plugin Daemon、Agent Backend 等运行组件。

**证据边界：** 当前证据只确认了应用工作流执行、异步后台作业及相关持久化组件，没有确认 Dify 持久拥有本专项所指的 Task、Task 依赖、状态机、执行归属和恢复策略。Redis/Celery 的存在只能证明异步任务处理，不能单独证明产品具有 Stateful 中心调度能力。

**判定：** 按当前证据，Dify 应视为 **LLM 应用编排平台和自动化运行器**，不能作为已验证的 Stateful 工作调度器进入选型。该判定是对现有证据能力上限的判断，不等同于证明相关能力一定不存在。

### Workspace、Project、Issue、Plan、Task 调度对象模型尚未建立

**已确认事实：** 自托管版使用 PostgreSQL 保存租户、应用、工作流和日志等平台状态；Workflow 是可视化应用编排定义，应用可被调试并发布为 Web 应用或 API。

| 专项目标对象 | 现有报告可确认的对应物 | 结论 |
| --- | --- | --- |
| Workspace | 未确认 | 不能把租户、应用容器或本地文件目录直接视为调度 Workspace |
| Project | 未确认 | 没有现成证据说明其标识、状态和生命周期 |
| Issue | 未确认 | 没有现成证据说明 Dify 持有 Issue 工作记录 |
| Plan | Workflow | Workflow 是持久应用编排定义，但不能据此确认存在独立 Plan 对象 |
| Task | Worker 后台作业、Workflow 节点执行 | 只确认执行载体；未确认它们是中心调度拥有的持续工作 Task |

**选型影响：** 当前无法回答对象的创建来源、层级、归属、相互转换和状态所有者，也无法把 Dify 对象无损映射为 Workspace → Project → Issue → Plan → Task。若目标系统依赖这套对象语义，需要另行验证或建设领域适配层。

### Task 关系、生命周期和调度决策均属未决

**已确认事实：** Dify Workflow 支持通过可视化节点组织一次 LLM 应用执行，Worker 负责文档索引等异步后台作业，Redis 承担缓存与任务队列 Broker。

**未决项：** 当前证据没有确认 Task 之间的父子关系、前置依赖、阻塞关系、并行分支或 DAG 由何种产品对象持久化，也没有确认等待、可执行、运行、完成、失败、阻塞等状态及迁移责任方。

**未决项：** 优先级、计划时间、事件触发、并发限制和资源约束是否参与中心调度决策，以及上游完成、失败、取消或超时后下游如何解锁、跳过、重试或终止，均无现成证据。Workflow 节点有图式编排能力，不足以自动回答持续工作 Task 的生命周期问题。

### Agent 分派、断线恢复和执行连续性尚未确认

**已确认事实：** Dify 可配置 Agent 应用和工具，`agent_backend` 与 `plugin_daemon` 提供相应运行支撑；模型执行者由应用配置的模型 Provider 决定。

**未决项：** 现有报告没有说明系统是否在多个 Agent 之间选择、分派或重新唤起执行者，也没有说明 Agent 与 Task 的归属是否持久化。已有 Agent 领取任务、服务端主动选择执行者和一次性运行 Agent 三种语义无法据此区分。

**未决项：** Agent 退出、客户端断线、Worker 失败或服务重启后，执行是否从检查点恢复、重新排队、转交其他 Agent 或仅形成失败记录，均未经过文档或运行验证。因此不能宣称 Dify 具备本专项要求的任务连续性。

### 自托管平台主体可在 PC 本地运行，但模型与工具决定外部网络边界

**已确认事实：** Dify 同时提供 Cloud SaaS 与自托管社区版。[官方部署文档](https://docs.dify.ai/en/self-host/deploy/quick-start/docker-compose)给出的自托管路径会在工作机上启动 Web、API、Worker、PostgreSQL、Redis、向量库、Nginx、沙箱等容器，平台状态与知识数据默认保存在本地 Docker Volume；自托管版不依赖 Dify 云端网关才能运行。

**已确认事实：** Dify 本体负责编排而不提供底层模型推理。推理可调用外部模型 Provider，也可接入本地或自托管模型；外部工具请求同样可能跨越工作机网络边界。因此“平台主体在本地”成立，“核心使用过程完全离线”则由模型和工具配置决定。

**判定：** 自托管社区版符合平台主体 Local 优先要求；Dify Cloud 的主体位于官方托管环境，不符合主体运行在 PC 的要求。当前证据未覆盖 Cloud 内部组件、持久化、权限、数据路径和故障影响，不能用自托管架构替代其云端架构结论。

### Windows 与 macOS 均可部署自托管版，但都是容器化 Web 服务而非原生桌面应用

**Windows：** 官方路径是 Windows 主机、WSL 2 后端与 Docker Desktop。源码和数据需放在 WSL 的 Linux 文件系统中，再通过 Docker Compose 启动服务并在浏览器访问 `http://localhost/install`。该路径受官方文档支持，但不是原生 Windows 二进制或 MSI/EXE 桌面应用。

**macOS：** 官方路径要求 macOS 10.14+、Docker Desktop 和 Docker Compose 2.24.0+，通过相同 Compose 流程启动并使用浏览器访问。当前证据记录的最低资源要求为 2 核 CPU、4 GiB RAM，macOS Docker 虚拟机建议至少 2 vCPU、8 GiB 内存。

**共同边界：** 两个平台通常都需要安装 Docker Desktop 的管理权限、拉取镜像和访问所配置模型 Provider 的网络。默认入口由 Nginx 提供，工作机运行的是一组 Linux 容器，不是双击即用的桌面客户端。

**未决项：** 两个平台的实际安装体验、端口冲突、资源占用、升级平滑度和卸载彻底性均未实测。当前证据仅可推导使用 `docker compose down` 保留数据、使用 `docker compose down -v` 连同 Volume 删除数据；官方专用卸载器未确认。

### 标准接入面是 Web、HTTP/WebSocket 与应用 API，不是已验证的调度客户端协议

**已确认事实：** Dify 提供浏览器 Web UI、后端 HTTP REST API、WebSocket、发布后的 Backend-as-a-Service API，以及插件和自定义工具扩展接口。前端经 Nginx 访问 API，后台作业经 Redis/Celery 通信，模型和外部工具调用经 SSRF 防护代理出站。

**判定：** 外部工具可以通过应用 API 使用已发布的 Dify 能力，也可以通过插件/工具接口扩展应用；现有报告没有证明这些接口支持创建、领取、分派和恢复本专项定义的中心 Task。能够跳过 Web UI 调用应用 API，不等于能够跳过官方执行层直接接入一个 Stateful 调度中心。

**改造影响：** 若要将 Dify 接入外部中心调度，应把它视为应用执行服务，通过现有 API 触发工作流并回收结果。若要求 Dify 自身拥有跨 Agent Task 状态、依赖和执行归属，则需要额外状态层或服务端协议改造；改造范围因对象和状态机证据缺失而暂不能估算。

### PostgreSQL、Redis/Celery 与向量库支撑完整平台，但不能据此提取调度最小核心

**已确认事实：** 自托管 Compose 包含 `api`、`api_websocket`、`worker`、`worker_beat`、`web`、`plugin_daemon`、`agent_backend`，以及 PostgreSQL、Redis、默认 Weaviate、Nginx、SSRF Proxy 和 Sandbox。PostgreSQL 保存平台主状态，Redis 负责缓存和异步队列，向量库保存 RAG 索引，文件保存于本地 Volume。

**架构推导：** 一条典型 RAG 请求链路是：浏览器 → Nginx → API → PostgreSQL 读取应用配置 → 向量库检索 → SSRF Proxy → 本地或外部模型 API → 返回结果；文档索引等后台作业交给 Worker。该模型来自现有组件职责的整合，未经流量抓取或本地运行验证。

**依赖边界：** PostgreSQL、Redis/Celery 和向量库是当前证据所描述完整 Dify 平台的组成部分；向量库可由 Weaviate 替换为其他实现，模型 Provider 可本地或外置。现有证据没有定位任务锁、原子领取、租约、超时回收或失败转移机制，因此无法判断哪些依赖属于 Stateful 调度底层刚需，也无法证明关闭 RAG 等上层能力后能得到独立调度核心。

### 私有化可行，但许可和运维成本需要纳入准入条件

**已确认事实：** 自托管社区版通过 Docker Compose 交付，完整平台数据可留在本机，并可接入本地模型。项目在证据窗口内维护活跃，[GitHub Releases](https://github.com/langgenius/dify/releases) 最新版本为 v1.16.1；版本与服务清单仍可能持续变化。

**许可边界：** [官方仓库](https://github.com/langgenius/dify)采用带附加条件的 Dify Open Source License。现有证据表明其允许商业使用，但未经书面授权不得利用源码运营多租户 SaaS，并要求保留控制台 Logo 与版权信息。私有化自用通常可行，对外经营、二次分发或去品牌前应取得正式许可意见。

**选型影响：** 本地部署需要持续维护 Docker Desktop、数据库、Redis、向量库、Volume、配置与升级，不是零运维桌面应用。若选型目标是 Stateful 中心调度，还需先补齐对象、状态机、队列一致性和恢复证据；仅凭现有平台私有化能力不能进入该能力结论。

## 产品与运行形态

### 产品定位与核心流程

[Dify 官方站点](https://dify.ai/)与[官方仓库](https://github.com/langgenius/dify)将其定位为开源 LLM 应用开发平台。目标用户是需要通过可视化工作台构建 Workflow、Chatflow、Agent 或 RAG 应用，并以 Web 应用或 API 交付能力的产品和工程团队。

自托管路径的核心流程为：使用 Docker Compose 启动平台 → 浏览器初始化管理员 → 配置外部或本地模型 Provider → 创建应用及知识库 → 调试工作流 → 发布 Web 应用或 API。该流程说明 Dify 的中心对象是 LLM 应用及其运行配置，不直接证明其拥有持续工作调度对象。

### 自托管系统全貌

```text
Windows / macOS 工作 PC

浏览器
  └─ Nginx
       ├─ Web / API / API WebSocket
       ├─ Worker / Worker Beat
       ├─ Plugin Daemon / Agent Backend
       ├─ PostgreSQL / Redis / Weaviate
       └─ SSRF Proxy / Sandbox / 本地文件 Volume

可选外部边界
  ├─ 云端模型 Provider API
  ├─ 本地或自托管模型 API
  └─ 外部工具服务
```

这是基于现有组件清单的架构整理。不同版本的 Compose 服务可能增减，实际服务、端口、健康状态和数据流未经本次重新部署验证。

### Cloud 形态的现有证据边界

Dify Cloud 是官方托管的完整 SaaS，用户通过浏览器使用，平台主体和平台数据不在工作 PC。当前证据没有记录 Cloud 的内部服务清单、数据库、队列、部署拓扑、账号鉴权、数据驻留和断网故障语义，因此这些内容保持未决。

现有证据将 Cloud 与自托管版描述为能力基本对齐，但未经同版本逐项验证。选择 Cloud 时应按云端主体处理，不能沿用自托管版“数据默认位于本机 Volume”的结论。

## 未决项与后续验证

### 调度能力验证

1. 定点核验 Dify 是否存在独立、持久的 Workspace、Project、Issue、Plan、Task 对象，以及对象的标识、状态所有者和转换关系。
2. 核验 Workflow Run 与节点执行是否持久保存依赖、状态、执行归属、进度和结果，并明确与中心 Task 生命周期的差异。
3. 核验任务进入可执行状态、Worker 领取、原子防重、租约、心跳、超时回收、重试和失败转移的实际机制。
4. 模拟 API、Worker、Agent 和整机重启，确认在途执行是恢复、重排、转交还是失败封口。

### 工作机与 Local 验证

1. 在 macOS 与启用 WSL 2 的 Windows 工作机分别按官方 Compose 路径实测部署，记录权限、端口、资源占用和运行稳定性。
2. 接入本地模型并限制外部网络，验证核心应用流程能否在无外部出站条件下完整运行。
3. 演练版本升级、配置迁移、Volume 备份恢复和卸载，确认数据保留与彻底清理边界。
4. 若考虑 Dify Cloud，另行补齐其组件、接口、持久化、权限、数据路径、网络依赖和故障影响。

### 私有化准入验证

1. 在确定改造目标后，定点定位调度相关状态和一致性机制，区分 PostgreSQL、Redis/Celery、向量库与模型 Provider 的可替换边界。
2. 若对外经营、二次分发或去品牌，正式核对 Dify Open Source License 并取得书面授权意见。
3. 在上述证据补齐前，保持“可本地部署的 LLM 应用编排平台，Stateful 中心调度能力未确认”的选型标签。
