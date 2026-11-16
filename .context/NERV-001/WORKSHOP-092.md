# FreeTodo 技术产品调研

> updated_by: Qoder
> updated_at: 2026-10-23 16:02:07 CST
> evidence_window: 2026-10-23 调研；main / 0.1.2 提交 800cd27344fe1eb99f429d0aec22e99ed189d921（2026-02-06）；桌面安装包单独以 0.1.1（2026-01-12）为证据；开发分支与社区反馈截至调研日

## 交付结论

### FreeTodo 是持久化个人待办应用，附带 Agent 执行宿主和定时自动化运行器，不满足本轮 Stateful 调度判定

**已确认**：FreeTodo 拥有持久化 Todo、父子关系、聊天上下文，以及使用 SQLite JobStore 的 APScheduler。不能把它整体称为无状态应用，也不能因为存在持久化 scheduler 就判为 Agent 调度中心。[工作对象](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/storage/models.py#L98-L174)、[调度器](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/jobs/scheduler.py#L34-L65)

**已确认**：现有自动化链路按时间触发 `web_fetch`，不是按 Todo 前置依赖选择和唤起 Agent；Agno Agent 则由单次聊天请求创建。当前核验链路没有持久执行归属、依赖解锁、任务转交和崩溃后执行续接的调度闭环。[自动化动作](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/automation_task_service.py#L115-L185)、[动作边界](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/automation_task_service.py#L209-L242)、[按请求创建 Agent](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/modes/agno.py#L148-L208)

**选型影响**：适合作为个人意图输入、待办管理和交互式工具执行的研究样本；不能直接承担本轮要求的持续工作分派中心。补齐调度能力属于新增调度核心，不是打开已有选项。

### Todo 的树形组织与 Plan 会话是真实能力，但不构成任务依赖图和持久编排计划

**已确认**：Todo 持有父子关系、展示排序、日程、状态和完成百分比；Plan 使用 `chat_type="plan"` 的持久聊天记录，生成问卷、总结和子任务文本。Plan 不是独立的依赖解释器，也没有独立运行归属。[Todo 语义](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/storage/models.py#L98-L152)、[Plan 会话](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/plan.py#L153-L175)、[总结链路](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/plan.py#L215-L275)

**证据边界**：Workspace 在已核验的 Agent 入口中是本地工具工作目录参数，不是持久化的组织／调度对象；未发现独立 Project、Issue 调度对象。没有将字段名称、任务树或会话恢复外推为 DAG 调度。[工作目录用途](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/modes/agno.py#L64-L141)

### 主体应用和状态在 PC 本地，默认智能能力依赖云端，属于混合运行而非完整离线产品

**已确认**：官方运行模型为桌面／浏览器界面加本地 Python 后端；待办和会话进入本地 SQLite，向量数据可存本地 ChromaDB。默认文本与视觉模型连接阿里云百炼，语音识别配置连接其 WSS 服务；联网搜索和 Dify 测试通道也存在独立外部服务边界。[官方架构与启动方式](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/README.md)、[默认模型及语音配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L168-L228)、[Dify 客户端](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/dify_client.py#L162-L211)

**合理推导**：不使用 AI 的待办读写不需要云端推理；默认配置下，断网将影响 AI 对话、拆解和相关识别／搜索，不能宣称完整核心流程离线可用。模型 API 的 `base_url` 可配置，为本地兼容推理服务留下接入点，但这不等于仓库交付了完整本地模型部署方案。[可配置客户端](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/llm_client.py#L52-L84)

**选型影响**：满足本地持有数据与应用主体的部分要求，但默认智能能力云依赖仍是 Local 优先缺口；全离线适配必须分别处理文本、视觉、语音和联网工具，不能只替换一个 URL 后宣布完成。

### Windows 与 macOS 均有桌面发布，但最新源码标签不等于最新可安装版本

**已确认**：0.1.1 提供 Windows x64 EXE、macOS arm64 和 x64 DMG；0.1.2 是最新正式产品 Release，但没有附带桌面二进制。2026-02-08 的媒体抓取插件预发布不是 FreeTodo 主产品升级。[0.1.1](https://github.com/FreeU-group/FreeTodo/releases/tag/0.1.1)、[0.1.2](https://github.com/FreeU-group/FreeTodo/releases/tag/0.1.2)、[插件预发布](https://github.com/FreeU-group/FreeTodo/releases/tag/plugin/media-crawler/v1.0.0)

**证据边界**：macOS 0.1.1 发布说明要求移除下载隔离属性，且有 Intel Mac 启动问题的公开反馈；不能将安装包存在视为签名、公证及启动兼容性已通过验证。[macOS 启动反馈](https://github.com/FreeU-group/FreeTodo/issues/58)

**选型影响**：双平台不是整体缺失，但发布完整性和可验证安装体验存在缺口；main 的代码能力不得不加区分地归入 0.1.1 已发布桌面包。

### SQLite 是本地状态硬依赖，向量与识别栈是上层能力依赖，不是任务协调的根源

**已确认**：业务数据库和 APScheduler JobStore 都显式使用 SQLite。ChromaDB、嵌入模型和重排序模型用于语义检索，不参与 Todo 任务的原子领取；向量库可以配置禁用。[业务数据库](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/storage/database_base.py#L36-L61)、[JobStore](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/jobs/scheduler.py#L34-L65)、[向量开关](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/vector_db.py#L501-L524)

**改造影响**：不用额外部署中心数据库或消息代理即可运行单机形态，但默认安装仍包含较重的 AI／图像依赖。功能关闭、安装依赖裁剪与生产构建裁剪是三个不同问题，不能将配置开关当成已验证的最小发行包。[Python 依赖声明](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/pyproject.toml)

### 可以绕过界面调用本地 API，但没有现成的外部 Agent 领取协议和多租户治理边界

**已确认**：Todo REST API 与流式聊天入口直接由 FastAPI 提供；Agno 在后端进程内使用工具，自动化模块另有管理和立即执行 API。它们分别是数据管理、一次执行和时间触发语义，不是 Worker 注册／领取／回报协议。[Todo API](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/todo.py#L29-L54)、[聊天入口](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/core.py#L71-L107)、[自动化 API](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/automation.py#L13-L83)

**合理推导**：本机桥接待办数据是可行方向；把 API 暴露给多台工作机则需要新增认证、授权、执行者登记和状态协调。当前服务默认绑定回环地址，已检查的应用入口和这些关键路由没有账户认证依赖；CORS 不是调用者身份校验。[服务入口](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/server.py)、[回环绑定](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L10-L13)

### FreeU Community License 不是纯 Apache 2.0 授权，衍生分发是明确的改造约束

**已确认**：许可允许不修改源码的商业使用，包括前后端服务；开发并分发基于 FreeTodo 的衍生作品需要向生产方取得商业许可。全文没有按租户数量单独收费或禁止多租户的条款，不能据此推定衍生托管、免费衍生发行自动获准。[LICENSE 第 1 条](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/LICENSE#L7-L15)

**判断与未决**：应按受限源码许可管理，不能仅凭“基于 Apache”当作无附加条件的开源底座；文本写有“From 1.0”，但当前 0.1.2 快照即附带此许可，版本适用范围需权利人确认。没有因源码可见就推断云端模型或其他服务端实现同样开放。

## 调研目标

- 判断是否持久拥有工作对象、任务关系、生命周期与执行归属。
- 核验任务推进、Agent 分派以及失败、断线和重启后的连续性。
- 分别确认 Windows、macOS 工作机部署及本地／云端运行边界。
- 识别客户端接入方式、必要依赖及依赖剥离的影响。
- 判断架构范式、私有化与扩展改造边界。

## 产品调研

### 产品定位与目标用户

FreeTodo 是面向个人工作者的 AI 待办与个人上下文管理应用：先帮助用户表达、收集和拆解意图，再以待办和日历组织工作。官方定位不是组织级工单分派，也不是跨机器 Agent 集群控制平面。[README](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/README.md)

仓库保留 `lifetrace` 后端名称，来自同一项目此前的个人活动记录阶段；在本报告中它是 FreeTodo 的组成部分，不另立调研对象。其屏幕和语音输入只在说明任务来源、PC 权限与数据外发时纳入，不展开与本轮调度无关的功能细节。[路线图](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/.github/ROADMAP.md#L13-L61)

### 核心流程

1. 用户手动输入待办，或在对话、截图／OCR、音频相关入口中形成候选工作信息；后台采集默认需要用户启用，不能理解为安装后自动具备持续自治能力。
2. 用户围绕 Todo 发起 Plan 问卷或 Agent 对话，模型结合任务及上下文输出建议；已启用的 Todo 工具可以创建、更新或完成待办。
3. Todo 进入本地任务树和日历，用户或工具修改状态；日程提醒到时通知用户，而不是自动把该 Todo 分派给执行 Agent。
4. 若显式启用自动化模块，可以另行定义定时 HTTP 动作，结果记录回本地并生成通知；此链路与 Todo 依赖和 Agent 执行归属分离。

以上是官方流程与定点代码形成的系统解释，不是运行验收结果。[Plan](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/plan.py#L88-L146)、[Agent 完成 Todo](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/agno_tools/tools/todo_tools.py#L99-L121)、[提醒动作](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/jobs/deadline_reminder.py#L100-L169)

### 功能地图与边界

| 功能域 | 当前可确认的形态 | 对调度判定的影响 |
| --- | --- | --- |
| 待办／日历 | 本地持久 Todo、父子树、标签、日程、附件、状态和 iCalendar 字段 | 管理工作记录，不自动产生可执行依赖图 |
| Plan | 问卷、总结、任务树上下文和持久聊天记录 | 是交互式规划内容，不是长寿命编排实例 |
| Agent | 聊天请求触发的工具调用，可选 Todo、搜索、文件和 Shell 工具 | 是执行宿主，未建立持久 Agent—Task 分派关系 |
| 输入采集 | 可选截图、OCR、音频和自动待办检测；部分输入能力有平台差异 | 可产生工作输入，但“发现待办”不等于自主执行待办 |
| 后台作业 | APScheduler 定时执行内置作业、提醒和可选 HTTP 自动化动作 | 有持久化定时机制，不具有本轮要求的任务依赖与执行者调度闭环 |

**已确认**：README／路线图仍将部分多工具能力和主动服务列为开发中或长期规划，但固定 main 已有 Agno 请求入口与工具实现。报告因此将其记为“源码已具备的实现”，不机械沿用过时勾选项，也不外推为 0.1.1 包中已验证的功能。[路线图时间与规划](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/.github/ROADMAP.md#L173-L218)、[实际入口](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/core.py#L93-L107)

### 维护状态与版本演进

- **0.1.0，2026-01-11**：首次 FreeTodo Release，已有 Windows x64 和 macOS arm64 包；发布形态开始面向终端用户。[Release](https://github.com/FreeU-group/FreeTodo/releases/tag/0.1.0)
- **0.1.1，2026-01-12**：提供 macOS x64 包，扩大工作机架构覆盖；发布说明仍有 macOS 隔离属性处理提示。[Release](https://github.com/FreeU-group/FreeTodo/releases/tag/0.1.1)
- **0.1.2，2026-02-06**：最新正式产品标签，对应本次 main 快照；Release 没有桌面资产，不能当作已经交付的终端升级包。[Release](https://github.com/FreeU-group/FreeTodo/releases/tag/0.1.2)、[main 提交](https://github.com/FreeU-group/FreeTodo/commit/800cd27344fe1eb99f429d0aec22e99ed189d921)
- **开发分支，2026-03-18**：抽样可见待办轮询相关更新，只证明开发分支此时仍演进，不证明已经进入 main 或正式安装包。[提交](https://github.com/FreeU-group/FreeTodo/commit/d9ce40bea9653e1f3d75aafd33346c978324569f)

**判断**：仓库未归档，但主干和正式发布距调研日已有较长间隔；不能用仓库整体 `pushed_at` 或开发分支活跃替代主产品发布维护结论，也不足以断言项目已停止维护。

### 生态与反馈

公开反馈抽样以创建时间倒序排除 PR，读取返回的 11 条 Issue 及 7 条相关评论，时间覆盖 2025-10-15 至 2026-05-16。样本小、部分早于 0.1.2，仅用来识别部署和接入风险，不推算故障率。

- **平台体验主题重复出现，但不是同一故障**：[#57](https://github.com/FreeU-group/FreeTodo/issues/57) 请求 macOS x64 包，后续已有对应发布；[#58](https://github.com/FreeU-group/FreeTodo/issues/58) 仍反馈启动失败。讨论提到缺少该测试平台及 dev 脚本更新，不能据此宣布正式包已修复。[后续回复](https://github.com/FreeU-group/FreeTodo/issues/58#issuecomment-3881893807)
- **模型接入诉求重复出现**：[#14](https://github.com/FreeU-group/FreeTodo/issues/14)、[#50](https://github.com/FreeU-group/FreeTodo/issues/50) 希望扩充本地／API 模型选择。这是用户需求；本报告关于可配置 API 的判断另由当前客户端源码支持，不把需求单当成功能发布记录。
- **安装门槛和资源占用仅有有限样本**：[#49](https://github.com/FreeU-group/FreeTodo/issues/49) 希望简化安装；[#52](https://github.com/FreeU-group/FreeTodo/issues/52) 的 CPU 反馈缺少正文和可复现实测，不能量化性能，也不据此追加 benchmark。

扩展入口主要是前后端源码模块、Agno 工具及 API；媒体抓取插件有独立预发布，但不能仅凭该包证明已有稳定第三方插件协议，更不能推断已有外部 Worker 调度生态。[模块注册](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/core/module_registry.py#L20-L68)、[工具构建](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/agno_agent.py#L295-L329)

## 技术架构调研

### 系统全貌与运行形态

```text
Windows / macOS 工作机
  桌面壳或浏览器
       │ 本机 HTTP：页面、REST、流式响应
  Next.js 前端 ── 本地 FastAPI 后端
                         ├─ Todo / Plan / Chat → lifetrace.db（SQLite）
                         ├─ 可选检索 → 本地 ChromaDB + 嵌入／重排序模型
                         ├─ APScheduler → scheduler.db + 本进程线程池
                         │                  ├─ 内置采集／提醒作业
                         │                  └─ 可选 AutomationTask → HTTP 目标
                         └─ 请求级 Agent → Todo／文件／Shell 等本地工具
                                      └─ 可配置的模型、搜索等外部 API
外部服务边界
  百炼文本／视觉推理、可选语音 WSS、搜索服务、Dify 测试应用 API
```

**架构推导**：这是单工作机拥有数据的本地客户端—服务端组合，不是“只有 UI 在本地”的纯云 SaaS 壳。模型推理可在外部，但 Todo 数据库和定时器不是由远端统一中心持有。当前官方模型也没有要求一套额外 FreeTodo 云调度服务器。[README](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/README.md)、[应用生命周期](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/server.py#L34-L68)

### 主要组件与核心链路

**链路一：形成和管理工作。** 前端提交 Todo，由服务层保存到业务数据库；Plan 从 Todo 父链、同级和子树构造提示，调用 LLM 生成问卷与总结，保存会话消息。数据库持有工作记录，但模型生成的拆解内容不是已领取的执行队列。[Todo 创建](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/todo_service.py#L63-L138)、[Plan 上下文](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/plan.py#L17-L85)

**链路二：一次 Agent 执行。** HTTP 聊天请求选择 Agno 模式，后端读取聊天历史，按请求配置创建 Agent 和工具；模型通过外部兼容 API 运行，工具在本地后端执行。流式结果和工具事件发回界面，正常结束后将回复及工具事件元数据保存为聊天消息。这不是持久 Run 的检查点恢复协议。[执行与结果落库](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/modes/agno.py#L148-L217)、[模型与运行构造](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/agno_agent.py#L276-L285)

**链路三：时间驱动自动化。** 用户创建 AutomationTask，业务库保存定义，再同步到 APScheduler；线程池到时执行 HTTP 动作，更新最近运行时间、结果或错误并生成通知。单次任务无论成功还是失败，执行完成后都会被禁用；周期任务下一次按周期触发不等于针对失败的重试策略。[完整动作闭环](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/automation_task_service.py#L45-L71)、[结果与一次性任务收尾](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/automation_task_service.py#L153-L207)

**默认边界**：默认 `backend_modules.enabled` 没有 `automation`，且 JobManager 仅在模块启用、可用时同步用户自动化。源码中有此能力不代表初装即暴露它；内置采集和提醒作业也多为默认关闭。[默认模块](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L15-L40)、[同步条件](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/jobs/job_manager.py#L437-L453)

### 工作对象、关系与生命周期

| 对象 | 持久化、标识与归属 | 调度含义及缺口 |
| --- | --- | --- |
| Workspace | Agent 请求中的 `workspace_path`；未指定而启用本地工具时默认用户 Home | 是工具访问目录，不是持有任务、成员和调度状态的 Workspace 对象 |
| Project | 当前产品模型和关键链路未发现独立持久对象；大任务可以用根 Todo 表达 | 不把 Todo 容器包装成项目级策略调度 |
| Issue | 当前核验未发现产品内独立 Issue 对象或外部 Issue 分派链路 | 仓库的 GitHub Issue 是产品反馈，不是其自身可领取工作池 |
| Plan | `Chat.session_id` 标识的 plan 类型会话，可通过 `context_id` 关联 Todo；问卷和总结为消息内容 | 规划文本可持久保存，但不是可执行的计划实例，无计划级依赖推进和执行归属 |
| Task / Todo | 本地整数 ID、iCalendar UID；父 Todo 引用、状态、时间和展示顺序由本地业务库持有 | 是个人工作记录，非外部 Agent claim 的工作租约 |
| AutomationTask | 独立本地 ID，保存时间触发定义、HTTP 动作和最近一次结果；由后端同步与执行 | 比纯内存定时更有状态，但没有 Todo 依赖边、Agent 归属或多次运行实例的完整生命周期 |

对象证据来自 [Todo／AutomationTask／Chat 模型](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/storage/models.py)、[Plan 会话](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/plan.py#L153-L175) 和 [Workspace 参数](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/modes/agno.py#L115-L141)。缺失判断限于该快照的产品资料、对象定义和核心链路，没有通过无边界搜索证明全仓绝对不存在。

**任务关系。** `parent_todo_id` 是树形组织，`order` 明确为同级展示排序；`related_to_uid` 等字段用于 iCalendar 关系表达。当前证据不支持把这些字段解释成“等待前置完成”“并行汇合”或 DAG 的可执行关系。优先级和日程用于表达与提醒，未进入一个跨 Task 的执行者选择器。[字段语义](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/storage/models.py#L111-L146)

**状态所有者。** API 接受 `draft / active / completed / canceled`，由用户请求或工具写入；TodoService 做业务字段更新和提醒刷新。没有已确认的调度中心将任务从 blocked 推到 ready、running，再驱动下游解锁。Agent 的 `complete_todo` 是把状态写成 completed，不附带结果验证、审批或执行身份的证明。[状态枚举](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/schemas/todo.py#L14-L29)、[更新责任](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/todo_service.py#L140-L251)、[工具完成动作](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/agno_tools/tools/todo_tools.py#L99-L121)

**失败与下游。** 对本次检查的 Todo 更新、Agent 执行和自动化动作链路，没有上游失败／取消／超时导致下游阻塞、跳过或重新分派的实现证据。AutomationTask 的 `last_status` 只反映最近一次动作结果，不是依赖图节点状态机。

### Agent 分派、连续性与人工控制

- **谁启动和执行**：用户的一次请求在本地后端创建 Agent；模型选择的是工具，不是另一台工作机上的执行者。工具选择列表、目录和文件删除开关由请求输入决定。[Agent 入口](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/modes/agno.py#L94-L164)
- **什么可以恢复**：Todo、聊天上下文和已完成回复保存在 SQLite；应用重启后具备再次读取记录的基础。Agno 构造未注入持久运行存储，当前请求的流式片段／工具事件先积累在内存，正常结束后才保存消息，不能据会话 ID 宣称中途运行可续接。[会话持久化](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/chat_service.py#L71-L114)、[请求内累积与保存](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/modes/agno.py#L171-L208)
- **没有确认的能力**：Agent 退出后转交另一 Agent、失联租约回收、持久检查点和自动恢复执行。客户端断开时后端生成器是否继续、取消到哪一步属于运行未决，不能仅按 Web 框架名称下结论。
- **人工与权限边界**：用户显式选择功能和工具；文件删除默认通过独立开关控制。目录参数与本进程工具不构成已验证的操作系统沙箱，当前链路没有独立的多用户授权、执行审批和配额调度层；启用 Shell 需要按宿主账号可执行权限评估，而非当成隔离 Worker。[工具配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/agno_agent.py#L107-L184)

### 主要依赖与依赖根源

| 依赖层 | 作用与强制程度 | 关闭、替换或剥离影响 |
| --- | --- | --- |
| Python 3.12、FastAPI／Uvicorn、SQLModel／SQLAlchemy | Python 声明范围为 `>=3.12,<3.13`，承担本地 API 与状态访问 | 是当前后端实现基础；不是只有开发机才需要，打包版可由内嵌运行时承担 |
| SQLite | 业务状态及 APScheduler 作业分别持久化 | 两个连接入口都写明 SQLite；换外置数据库需要代码与迁移适配，不是填写任意连接串即可 |
| APScheduler 与线程池 | 单进程时间触发、持久计划和并发上限 | 关闭后台调度会影响采集、提醒和自动化；Todo 本身不是被领取的作业队列 |
| Next.js、Node／pnpm 与桌面壳 | Web UI、开发／构建及桌面交付 | 源码开发需要工具链；终端安装包不能与开发要求混为一谈 |
| ChromaDB、sentence-transformers、嵌入／重排序模型 | 本地语义检索；默认启用向量库 | 可关闭向量实例，代价是检索能力缺失；不是任务锁、事务或领取协议所需 |
| OCR、屏幕／音频组件及平台绑定 | 自动输入、环境上下文 | 不影响“有无任务依赖调度器”的判定；裁剪会降低输入能力并涉及平台构建验证 |
| 模型 SDK、Agno 与外部 API | AI 推理和请求内工具执行 | 不启用 AI 可保留基础待办；替换模型不能补出缺失的持久调度闭环 |

[运行依赖](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/pyproject.toml)、[业务存储连接](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/storage/database_base.py#L36-L61)、[向量模型与持久客户端](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/vector_db.py#L62-L99)

**已确认**：向量模块存在缺依赖降级及 `vector_db.enabled` 开关，API 模块也有启用配置；但标准 Python 依赖仍列入 AI／图像组件。**合理推导**：制作纯 Todo 轻量发行包需同时调整依赖、路由导入和构建资源，再验证 UI 降级；仅禁用向量路由不能保证所有聊天入口不再初始化相关服务。[模块依赖](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/core/module_registry.py#L41-L57)、[RAG 延迟入口](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/core/lazy_services.py#L15-L28)

没有在本次材料中确认产品级 SQLite 最低版本或专属数据库扩展要求；不能把依赖包下限、运行机自带 SQLite 版本和产品最低支持版本混为一谈。完整安装和模型缓存成本未实测。

### 接口形态与客户端接入

官方标准使用载体是桌面 UI 或浏览器 UI，源码启动入口是 Python 后端与前端开发服务。HTTP API 可由本机第三方程序直接访问，不要求模拟桌面点击；典型边界是 Todo CRUD、Plan／聊天流、可选自动化管理，而非全量端点清单。[官方入口](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/README.md)、[Todo 路由](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/todo.py)、[聊天入口](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/core.py#L71-L107)

| 接入语义 | 当前事实 | 桥接边界 |
| --- | --- | --- |
| 创建或管理工作 | REST 写本地 Todo，状态归本地后端／数据库 | 可做本地数据适配；需自行约定外部系统标识和冲突处理 |
| 触发一次 Agent | POST 聊天请求并选择模式／工具 | 是请求级执行，不会自动获得持久任务租约 |
| 客户端领取工作 | 未发现 Worker 注册、claim、续租、结果回报协议 | 要新增执行协议和持久归属，不能把列表查询当原子领取 |
| 服务端唤起外部执行者 | 定时动作只定义 HTTP 请求；没有 Agent 选择器 | 即使 HTTP 目标是外部执行服务，也只增加一次调用，不会自动形成完整调度语义 |

**权限边界**：服务配置默认 `127.0.0.1`，关键 API 的依赖用于业务服务注入，不是身份认证。外部 AI 服务的 API Key 是出站凭据，不是 FreeTodo 入站鉴权。若需要跨机器接入，应保持网络隔离并新增身份与授权机制，不能简单把监听地址改为公网可达。[默认绑定](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L10-L13)、[依赖注入](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/core/dependencies.py#L64-L78)

Windows 与 macOS 的本地 REST／聊天语义相同；差异主要在安装打包、系统输入权限和本地工具命令环境，而不是两套任务领取协议。

### 持久化方式

- **业务状态**：本地 `lifetrace.db` 保存 Todo、父子关联、Plan／Chat 消息、自动化定义及最近结果。数据库由本地 Python 后端访问，当前数据模型没有相应的持久 Agent 执行归属。[模型](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/storage/models.py#L98-L174)、[聊天对象](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/storage/models.py#L309-L341)
- **时间计划**：`scheduler.db` 由 SQLAlchemyJobStore 持有；这是作业和触发器持久化，不是正在运行的线程调用栈持久化。[JobStore 与执行器](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/jobs/scheduler.py#L34-L65)
- **向量与文件**：ChromaDB 使用 `PersistentClient(path=...)`，附件、截图和音频使用本地目录；它们属于内容和检索状态，不应混称任务调度数据库。[向量存储](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/vector_db.py#L75-L99)、[路径配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L42-L46)
- **请求内状态**：Agent 生成中的文本、工具事件及执行上下文不等于已提交业务状态；最终消息可恢复与中途执行可恢复必须区分。

没有官方外置中心数据库或内存临时库部署形态的正面证据；即使将文件放到其他路径，也不会自动变成多节点共享状态服务。

### 通信方式

前端和本地后端主要通过 HTTP 请求交换业务数据；聊天响应使用 `StreamingResponse` 和 `text/plain` 分块文本，Agno 工具事件嵌在响应流中，不应统一写成 SSE 或 WebSocket。`X-Session-Id` 用来关联会话，不是可从偏移继续消费的持久事件游标。[Agno 返回方式](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/modes/agno.py#L171-L217)

Dify 出站客户端读取其 SSE，再转换成 FreeTodo 的文本流；语音配置使用对外 WSS；后台作业与本地工具直接在后端进程／线程中协作。当前核心运行模型不要求额外消息中间件，也没有已确认的跨工作机分布式任务总线。[Dify SSE 处理](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/dify_client.py#L111-L134)、[语音配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L216-L228)

客户端刷新业务记录与自动恢复正在进行的 Agent 执行不是同一能力。本次没有运行验证重连补发、流中断后的工具副作用和跨进程恢复，因此不承诺自动续跑。

### 任务队列与并发协调

**已确认的实现形态**：持久化 APScheduler JobStore 加本进程线程池，而不是外部 Worker 从持久消息队列领取 Todo。默认配置为 10 个线程、单 Job 最多一个实例、合并错过的触发，允许的错过时间为 60 秒。[配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L56-L65)、[执行器接线](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/jobs/scheduler.py#L42-L65)

**防重复的边界**：自动化使用稳定 Job ID 和 `replace_existing=True` 避免重复注册，`max_instances` 限制该调度器中的同一作业并发；这些都不是多 Agent 原子 claim 或跨进程租约。立即运行 API 直接调用动作服务，不经过外部工作池。[注册](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/automation_task_service.py#L115-L151)

**重启与故障**：启用自动化后，JobManager 启动时从业务定义重新同步任务；已有持久计划不意味着中断执行能恢复。错过触发的合并／宽限处理不是失败重试；未确认租约、超时回收、执行者迁移和基于中心状态的失败转移。[启动同步](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/jobs/job_manager.py#L437-L453)

**扩展判断**：当前最小运行单位是一个后端与其本地状态文件。没有多调度节点协调协议的证据，不应把共享同一个 SQLite 文件视为受支持的多节点方案；没有据此进一步审计锁、心跳或逐条重试实现。

### 部署形态

#### 工作机安装（Windows / macOS）

**版本边界**：现成终端安装包依据 0.1.1 Release；以下 Electron／Tauri 构建和运行时细节依据 main / 0.1.2。没有解包并运行 0.1.1，不能用 main 的打包配置反向保证旧安装包包含相同后端和依赖。

##### Windows 工作机

- **安装方式与入口**：0.1.1 提供 `FreeTodo-0.1.1-win-x64.exe`，安装后通过 FreeTodo 桌面入口使用。当前 Electron 打包目标为 x64 NSIS；本窗口没有 Windows ARM64 原生安装包的证据。安装器是否需要提权、安装耗时和空白机器首启成功率未实测。[发布资产](https://github.com/FreeU-group/FreeTodo/releases/tag/0.1.1)、[当前安装器配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron-builder.web.script.yml#L43-L77)
- **源码开发**：准备 Python 3.12、uv、Node.js 20+、pnpm 和 Git；在仓库根运行 `uv sync`，需要激活环境时使用 `.venv\Scripts\activate`，启动 `python -m lifetrace.server`；前端目录运行 `pnpm install`、`pnpm dev`。这是两个本地服务的开发启动，不是后台 Windows 服务安装。[源码说明](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/README_CN.md#L106-L145)
- **运行依赖**：当前 Electron `script` 形态包含后端源码与依赖清单，首启仍需准备 Python 环境；缺少 Python 时可尝试用户级 winget／Python 安装器。`pyinstaller` 形态则复制预构建后端，二者不能混称为自带完整 Python。[script 资源](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron-builder.web.script.yml#L30-L41)、[PyInstaller 资源](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron-builder.web.pyinstaller.yml#L30-L33)、[Python 安装路径](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron/python-runtime-installer.ts#L136-L210)
- **权限与功能边界**：普通 Todo 管理不依赖屏幕或录音采集；启用采集需要按系统策略验证屏幕、麦克风及窗口信息访问。主动 OCR 配置明确标注 Windows 专用，不能认定两平台全部输入能力对等。文件／Shell 工具按启动后端的账号权限运行；是否触发额外系统授权未实测。[主动 OCR 限制](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L141-L153)
- **网络要求**：script 首启可能访问 Python 官网、PyPI 或配置的包镜像；之后默认智能功能仍需要相应模型／搜索／语音服务。不能以用户级安装方式推导首次启动可离线。[依赖网络设置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron/python-runtime-env.ts#L41-L79)
- **升级与卸载**：没有确认桌面自动更新或回滚保证；升级需区分可下载版本和源码构建。可按 Windows 已安装应用的卸载入口移除程序，但当前 NSIS 明确 `deleteAppDataOnUninstall: false`，不能把卸载当成清空任务和配置。数据目录应先备份再单独处理；由运行时安装流程添加的系统 Python 也不能推定随 FreeTodo 一并卸载。[卸载保留配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron-builder.web.script.yml#L43-L77)

##### macOS 工作机

- **安装方式与入口**：0.1.1 提供 `FreeTodo-0.1.1-mac-arm64.dmg` 和 `FreeTodo-0.1.1-mac-x64.dmg`；根据 Apple Silicon／Intel 选择对应包，将应用放入 Applications 后启动。发布说明记录隔离属性问题，不能把要求清除隔离或忽略警告视作正常公证分发已成立。[Release 与提示](https://github.com/FreeU-group/FreeTodo/releases/tag/0.1.1)
- **源码开发**：Python／uv／Node／pnpm 要求与 Windows 相同；激活环境使用 `source .venv/bin/activate`，随后运行 Python 后端及前端开发服务。当前 macOS Python 依赖还包含 Cocoa／Quartz 绑定，作用是系统集成，不是数据库或中心调度依赖。[Python 平台依赖](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/pyproject.toml)、[启动说明](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/README_CN.md#L106-L145)
- **运行依赖与提权**：main 的 Electron script 形态同样不是完整预置 Python；自动准备环境时若需要安装 Python，会下载官方 PKG 并通过 AppleScript 请求管理员权限。这个提权发生在依赖安装环节，不能概括为“所有操作都要管理员”或“整个应用完全无提权”。[安装实现](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron/python-runtime-installer.ts#L136-L210)
- **系统权限**：截图入口使用 Electron `desktopCapturer.getSources`，因此屏幕录制权限是必要验收项；麦克风、辅助功能及拒绝权限后的降级提示本次未确认。不要为运行普通 Todo 功能默认放开全部隐私权限。macOS 没有配置中 Windows 专用主动 OCR 的同等支持证据。[截图入口](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron/ipc-handlers-todo-capture.ts#L249-L266)
- **网络与签名**：script 首启下载依赖、默认 AI 出站要求与 Windows 同类；签名、公证、Gatekeeper 和 Intel Mac 首启仍须实测。维护者提及 dev 脚本调整不证明 0.1.1 DMG 已修复。[Intel Mac 反馈](https://github.com/FreeU-group/FreeTodo/issues/58)、[打包指南限制](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron/PACKAGING_GUIDE_CN.md#L301-L314)
- **升级与卸载**：未确认自动更新、应用专用卸载器或完整数据迁移／回滚流程。按 macOS 应用的一般移除方式，应先退出应用与后台后端，再移除应用包；用户数据不在应用包内，需备份并单独决定是否清理。安装过的共享 Python 不应默认删除。上述是基于目录布局的操作推导，不是已执行的卸载测试。

##### 双平台的端口、数据目录与后台生命周期

**已确认**：当前 Electron 开发版端口起点是前端 3001／后端 8001，打包版为 3100／8100，并可向后寻找空闲端口。打包前端绑定 localhost，后端配置默认回环地址；源码前端开发命令没有显式限制 hostname，不能把所有开发运行一概称为只监听本机。[Electron 端口](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron/config.ts#L46-L90)、[打包前端绑定](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron/next-server.ts#L293-L298)、[开发启动](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/scripts/dev-with-auto-port.js#L247-L259)

**已确认／路径推导**：Electron 将用户运行根设为 `userData/lifetrace-data`，其下再组织 config、data 等目录。按 Electron 默认用户目录规则，Windows 通常对应 `%APPDATA%\FreeTodo\lifetrace-data`，macOS 对应 `~/Library/Application Support/FreeTodo/lifetrace-data`；以实际 `userData` 和环境覆盖为准，不是根目录直接等同数据库文件。源码默认根位于检出目录的 `lifetrace/data`，可由 `LIFETRACE_DATA_DIR` 覆盖。[桌面数据根](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron/backend-server.ts#L111-L116)、[目录组织](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/util/base_paths.py#L80-L141)

Python runtime 的位置另有选择逻辑，优先考虑安装目录；备份和卸载应区分应用程序、运行时和用户业务数据，不能只保留安装包。[runtime 路径](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron/runtime-paths.ts#L33-L59)

后台调度依赖本地后端继续运行；没有把桌面托盘、关闭窗口或进程启动成功解释成跨重启常驻服务保证。应用退出、窗口关闭与系统重启时是否保持／恢复任务，需要分别验收。

##### 构建、源码引导与 Tauri 第二壳

当前仓库不仅有 Electron，也有 Tauri 的 Rust 启动实现；后者确实启动后端、Next.js、托盘和快捷键，但明确存在尚未实现的 Island 功能。其发布路径仍查找机器上的 Node.js，不能称为不依赖外部 Node 的独立交付物。[Tauri 入口](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/src-tauri/src/lib.rs#L26-L80)、[Node 运行依赖](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/src-tauri/src/nextjs.rs#L165-L241)

安装文档的“一键安装”是拉取源码、准备工具链并构建，默认选项为 Tauri／web／build／script，需要 Rust，不是从 Release 下载已签名的应用。其默认分支是 main，不能当成自动锁定本报告提交；前端原生构建的平台工具链和具体系统最低版本仍需构建验证。[安装文档](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/.github/INSTALL_CN.md#L5-L38)

当前 Electron 构建脚本使用 `build:electron:web:script:full:win`／`:mac` 等命名，并有独立后端打包步骤；旧指南的命令不能直接当成当前可执行命令。NSIS 配置还引用 `build/installer.nsh`，本次在固定 SHA 获取该文件失败，因此将干净检出能否完整构建列为未决，不宣布必然构建失败。[脚本定义](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/package.json#L15-L32)、[安装器配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/free-todo-frontend/electron-builder.web.script.yml#L43-L77)

**部署判断**：官方源码支持 Windows、macOS、Linux 后端，但本轮工作机判断以双平台原生安装／构建为准。没有用 Linux、容器或额外中心服务器替代缺失的桌面运行验证，也未确认官方容器化中心调度部署方案。最小结构不需要外置数据库或消息服务；默认完整功能的运行时准备、AI 模型和系统权限使其不能等同于一个零依赖小型本地调度器。

#### 主体功能运行位置

| 能力 | 本地／外部边界 | 断网或外部故障影响 |
| --- | --- | --- |
| Todo、日历、会话记录、任务定义 | 本地前后端和 SQLite | 从架构看可继续本地访问，完整离线体验未实测 |
| 定时器与提醒 | 本地 Python 进程 | 网络不是定时器必要条件，但退出后端／关机期间不能执行；恢复要受触发策略影响 |
| 模型理解、拆解、Agent 决策 | 默认外部百炼 API，可替换兼容地址 | 默认智能流程受密钥、网络和服务可用性约束 |
| 文件／Shell 工具 | 本地后端权限范围 | 工具本身可在本地执行；由默认 Agent 自动决策调用时仍需要模型服务 |
| 输入采集、OCR、向量检索 | 本地能力为主，具体 AI 分析／语音链路可能出站 | 缓存、权限和所选模型决定离线完整度 |
| 搜索、Dify、HTTP 自动化目标 | 依启用模式连接外部或用户配置目标 | 失败只应归入相应能力；不据此推断本地数据库无法访问 |

**Local 优先判断**：应用主体本地化成立，默认智能功能完全本地化不成立。模型参数可配置属于适配基础，而非全离线交付承诺；既不把它错误归为纯 SaaS，也不以本地数据库掩盖云端推理与数据外发。

#### 云端形态与出站数据边界

**百炼文本／视觉模型：默认外部推理服务，而非 FreeTodo 云调度中心。** 本地 LLM 客户端读取模型名、Base URL 和 Key，通过兼容 API 调用托管模型；Agno 同样使用这组配置。模型负责理解与生成，本地后端负责工作记录和工具执行。[默认端点](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L168-L176)、[客户端构造](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/llm_client.py#L52-L84)、[Agno 模型构造](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/agno_agent.py#L276-L285)

**数据与权限**：Plan 会把 Todo 名称、描述、笔记、父子上下文或问卷回答组成模型输入；Agent 可将对话历史及工具结果用于后续推理。若启用读取本地文件的工具，不能再以“文件位于本地”推断内容不会进入外部模型。出站 Key 是模型服务访问权，FreeTodo 本地数据权限仍由宿主进程掌握。[Plan 载荷形成](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/plan.py#L17-L85)、[Agent 历史输入](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/agno_agent.py#L331-L347)

**托管与持久化边界**：仓库提供 API 客户端，不提供托管模型的推理集群、内部数据库和服务端部署清单。外部服务是否保存请求、保存多久、数据区域和删除承诺，不能从 FreeTodo 的本地 SQLite 设计得出；这些事项本次证据未决。没有凭空补写供应商内部数据库或扩缩容实现。

**语音识别：独立的可选外部 WSS 边界。** 默认配置指定百炼 `fun-asr-realtime`、语音 Key、采样与音频格式；本地音频文件另有目录配置。配置所表达的运行形态是工作机与托管识别服务连接，不是随 FreeTodo 安装包交付识别服务器。音频内容出站、服务故障后的识别降级和服务端留存需按该通道单独验证；替换文本模型不会替换它。[语音配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L216-L233)

**搜索：可选出站查询服务。** 传统 Agent 工具侧有 Tavily 配置，Agno 支持搜索工具。查询与返回内容经过外部搜索服务；它们不是持有 Todo 状态的同步服务。禁用搜索保留本地任务管理，但失去对应联网信息获取能力。[搜索配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/config/default_config.yaml#L208-L214)、[外部工具注册](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/llm/agno_agent.py#L78-L98)

**Dify 测试通道：外部应用后端，不是透明认证网关。** 仅当聊天请求选择 `dify_test` 才走此分支；默认 Base URL 为 `https://api.dify.ai/v1`，须配置应用 API Key，也可以关闭或换成用户提供的地址。本地发送 `query`、`inputs`、用户标识和显式传入的附加参数，以 Bearer Key 访问 `/chat-messages`，支持阻塞或 SSE 回答，然后保存本地聊天副本。[模式选择](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/core.py#L93-L107)、[服务配置](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/dify_client.py#L27-L49)、[请求与鉴权](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/services/dify_client.py#L181-L211)

该通道的远端应用、模型、会话与存储策略由所配置的服务提供方拥有；当前仓库没有交付对应的具体应用配置、远端数据库和私有化部署清单。故只能确认集成边界，不能断言所有远端逻辑与数据都可直接迁回 PC。远端失败会使该模式返回错误；不是本地 Todo 状态失效。[本地副本与错误路径](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/lifetrace/routers/chat/modes/dify.py#L51-L75)

**FreeTodo 自身的账户／云同步／许可服务器**：本次官方运行模型与核验入口没有发现必需的 FreeTodo 账户登录、远端同步或联网许可校验步骤。许可证提及可能的 cloud edition 只是许可措辞，不能据此创造一个已确认部署的 FreeTodo 云组件。[许可措辞](https://github.com/FreeU-group/FreeTodo/blob/800cd27344fe1eb99f429d0aec22e99ed189d921/LICENSE#L18-L24)

### 架构范式与改造边界

**当前范式**是单用户、单机状态所有者，加进程内工具执行和持久时间作业。它不是多执行节点共享任务池，不存在已确认的中心特权分派器；模型服务虽在云端，也不替本地应用持有任务生命周期。

| 目标变化 | 可以复用的部分 | 必须新增或验证的部分 |
| --- | --- | --- |
| 本机接入另一工作入口 | Todo REST、Plan／Chat、现有 SQLite 状态 | 外部对象映射、调用权限、接口兼容；不是新增调度器 |
| 更严格 Local 优先 | 本地后端、数据库、可配置模型 API 和可关闭功能 | 本地模型及工具调用兼容、语音／视觉替代、模型缓存与完整断网验证 |
| 轻量纯任务管理 | Todo 模型和服务层、模块启用机制 | 依赖与构建资源裁剪、相关 UI 功能降级；没有已验证的最小官方发行物 |
| 持续 Agent 调度中心 | Todo 作为工作输入、既有时间触发机制可作有限基础 | 持久依赖和执行实例、可执行性判断、归属／领取、恢复／转交、结果验证与权限治理 |
| 多工作机／多调度节点 | API 边界可作为改造接入点 | 服务身份、租户隔离、状态一致性和多节点协调；不能靠增加 Uvicorn 进程或共享数据库文件实现等价能力 |

**调度能否下沉为普通 Agent 节点**：Todo 管理或一次工具执行可以封装为普通节点调用；但若要保留现有定时任务的持久计划与触发，仍需长寿命的本地数据库和调度器。若只把文本 Plan 放进 Agent 上下文，将连现有的持久时间作业能力都丢失，更不能称为等价 Stateful 调度。

上述是架构影响评估，没有实施改造。涉及定制版本分发时，还必须先解决 FreeU Community License 的授权与版本适用问题。

## 未决项与证据边界

- 未安装或运行 FreeTodo，未执行桌面包、源码构建、真实模型调用和跨机器接入；所有代码链路结论均不等于运行通过。
- 官方独立文档站在本次访问中失败，GitHub CLI 不可用且临时下载未成功，公开 API 也出现限额；使用可达的公开 API、固定提交 raw 内容，少量文件通过固定提交 CDN 镜像读取。关键结论锚定原仓库；未把访问失败当作产品能力不存在。
- 源码以 main / 0.1.2 固定快照为准，0.1.1 桌面包、开发分支及插件预发布分别标注，不混算可交付功能。
- Windows 与 macOS 的安装、签名、权限提示、后台退出和残留数据处理仍需双平台验收；Intel Mac 的公开故障是否在可下载正式包修复未决。
- 模型与语音／搜索／Dify 服务端的数据留存、删除、区域、运行依赖及对应自托管配置，超出仓库可直接证明的部分仍未决；没有以这些缺口省略外部链路。
- Agent 流中断的实际取消行为、进程崩溃时的工具副作用和作业错过触发后的实际恢复结果尚未验证；当前没有足够证据承诺检查点续跑、去重执行或失败转移。
- 许可中的版本适用、内部修改、衍生托管和分发授权需权利人明确；本文不是法律意见。

## 后续验证建议

1. 对 Windows x64、macOS arm64／x64 分别验证 0.1.1 正式包的安装、启动、系统权限、升级和卸载残留；单独构建固定 0.1.2 源码核对差异，不将开发版成功覆盖发布版问题。
2. 使用独立测试数据验证 Todo、Plan 会话、自动化定义在重启后保留；再分别中断 HTTP 自动化动作和 Agent 工具执行，确认“记录恢复”和“执行恢复”的边界。
3. 如继续评估调度适配，要求产品给出依赖任务解锁、执行者归属、失败转交的明确接口和验收场景；不要用任务树、Cron 成功或聊天历史恢复替代这些证据。
4. 在授权测试环境中分别断开文本模型、语音、搜索和 Dify 通道，记录基础待办与智能功能的降级；使用本地兼容模型时单独验证工具调用、视觉和上下文能力。
5. 在开始定制分发或服务化前取得许可解释；若计划跨机器调用，先明确本地 API 的认证、权限与宿主工具隔离边界，再讨论部署。
