# AI-worker 技术产品调研

> updated_by: Qoder - Qoder
> updated_at: 2026-10-23 16:07:44 +0800
> evidence_window: 2026-10-23；main@7c23acb408737adbb9c81cf10340c6855d026a7a，以 V4(latest) 为主体，补核同快照 V4 EX(For mobile support Expand)；历史 Release 仅用于说明演进

## 交付结论

### AI-worker 是无状态模型 API 网关，不是 Stateful 调度器，也不是 Agent 任务执行宿主

**已确认**：产品正式自称 Ultra Cloudflare Serverless AI worker，核心用途是提供聊天网页并转发模型请求。V4 的运行入口只有 HTTP `fetch`，请求处理链是“返回 HTML／调用 Google API／返回响应流”；这里的 Worker 指云端请求运行单元，不是接单工作的 Agent。[产品定位](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L4-L8)、[运行入口](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/worker.js#L4-L14)、[请求处理](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/request-handler.js#L18-L48)。

**选型影响**：应归类为 **Stateless / Serverless HTTP 请求处理网关**，而不是持久任务消费者。它没有中心持有的任务生命周期、依赖解释或执行归属，不能承担本轮寻找的 Stateful 工作调度职责。

### Workspace、Project、Issue、Plan、Task 均不是当前核心流程中的持久工作对象

**已确认（所核验链路）**：服务端接收的是 `model`、`history`、`currentTurnParts` 和可选密钥；聊天上下文由浏览器每次随请求提交。页面把会话保存在内存数组中，只将自带 API Key 写入 `localStorage`。没有可供调度器恢复、认领或重新分派的持久工作记录。[请求数据](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L20-L65)、[页面状态](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L316-L354)。

**架构推导**：浏览器刷新、调用中断或 Worker 实例更换，不存在相应的中心任务恢复过程。网页内“发送中／完成／报错”是交互状态，不是任务状态机；把会话历史重新送给模型也不是检查点恢复。

### 可以跳过网页直接调用 HTTP 接口，但不能接入不存在的调度中心

**已确认**：网页向当前 URL 发出自定义 JSON POST，后端返回 Google 风格的 SSE 内容。它既不是 Agent 注册／领取协议，也不是标准任务管理 API；当前 V4 不能仅凭“模型代理”名称推定具有 OpenAI 风格接口兼容性。[客户端请求](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L611-L627)、[上游请求与返回](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L51-L121)。

**改造影响**：自有客户端可适配请求体、上下文管理和响应流解析；但新增任务领取、依赖推进、执行者分派或完成验收，需要另建调度能力，不是替换官方客户端就能得到。

### Windows 与 macOS 均以浏览器访问云端，均没有已证实的完整本地调度服务或原生安装包

**已确认**：官方主安装流程是在 Cloudflare 控制台创建 Worker、上传模块、配置密钥并部署，终端用户访问生成的网页地址。两个工作机平台的标准客户端都是浏览器，不是本地常驻 Agent。[部署与使用说明](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L81-L140)。

**证据边界**：仓库没有给出 Windows/macOS 原生应用的安装、升级和卸载流程。Cloudflare 提供的 Wrangler 是开发与部署工具，不能据此认定本产品提供完整本地生产形态。双平台可以使用网页，但均不满足“工作机本地持有并推进调度状态”的要求。

### 主体能力在云端，Local 优先不满足；自行部署云端实例不等于本地运行

**已确认**：HTML 由 Cloudflare Worker 提供，API 转发也在 Cloudflare；模型推理位于 Google 服务。工作机主要承担界面、临时会话状态、附件读取和响应渲染。自带密钥同样经过 Worker 才到上游。[转发目标与密钥选择](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L43-L88)。

**选型缺陷**：断网或无法访问 Worker／上游模型服务时，核心对话流程不可用；自行拥有 Cloudflare 账号只改变部署和密钥的管理归属，不消除云端执行、数据出机或托管平台依赖。

### 当前最小核心不需要数据库或消息队列，剥离云平台仍不会产生调度能力

**已确认（所核验版本）**：默认密钥来自 Worker 的 `env.GEMINI_API_KEY`，上下文来自请求；核心链路未使用 KV、D1、R2 或外置数据库。README 提到“结合 KV”，并把 R2/D1 描述为后续方向，但不能用这些描述替代当前实现证据。[README 表述](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L6-L8)、[实际数据来源](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L20-L65)。

**改造影响**：没有需要因事务、任务锁或一致性而保留的数据库硬依赖。把网关迁到本地，需适配运行入口、密钥注入和访问边界；切换本地模型还需修改硬编码上游及协议适配。持久工作对象、调度决策和故障恢复则是缺失的新能力，不是可从现有代码中抽出的“最小调度核心”。

## 调研目标

- 判断是否持久拥有工作对象、任务关系、生命周期与执行归属。
- 核验客户端接入语义及 Windows、macOS 工作机部署形态。
- 明确本地、云端组件及数据、权限、网络边界。
- 识别关键依赖根源、持久化和队列形态。
- 判断架构范式、Local 优先适配与改造边界。

## 产品调研

### 产品定位与目标用户

**已确认**：唯一调研主体为 [qyjoy/AI-worker](https://github.com/qyjoy/AI-worker)，README 使用名称 Ultra Cloudflare Serverless AI worker。它面向希望自行部署模型访问网页和 API 转发服务的个人或部署者，解决浏览器到模型服务的接入与密钥配置问题，不是企业工作管理或 Agent 运营产品。[定位与概述](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L4-L43)。

**已确认**：前端及网关源代码公开；README 授予 GPL 第 3 版或之后版本许可，仓库 LICENSE 为 GPLv3 正文。许可不意味着 Google 模型服务或 Cloudflare 托管环境也由该仓库提供、能够离线复制。[许可声明](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L183-L196)、[LICENSE](https://github.com/qyjoy/AI-worker/blob/7c23acb/LICENSE)。

### 核心流程

1. **部署者准备服务**：在自己的 Cloudflare 账号下创建 Worker，上传同一版本目录内的模块，配置默认 `GEMINI_API_KEY` 并部署。默认密钥缺失时，代码允许用户通过请求自带密钥。[官方部署说明](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L85-L123)、[密钥逻辑](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L43-L49)。
2. **用户发起对话**：浏览器打开 Worker URL，选择模型、输入文字或选择附件，可把自己的密钥保存在该站点的浏览器存储中；前端提交当前输入及此前会话。[页面状态](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L326-L348)、[发送流程](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L564-L627)。
3. **网关完成单次调用**：Worker 校验请求和模型名，向 Google 发出生成请求并转发流；网页解析文本后追加到内存会话。失败只反馈到当前交互，没有独立工作系统承接后续处理。[服务端链路](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L24-L128)、[结果与异常处理](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L634-L748)。

### 功能地图与边界

| 功能域 | 当前证据与边界 |
| --- | --- |
| 模型访问 | V4 直接调用 Google Generative Language API，并非任意模型供应商路由器；模型白名单和目标地址写在代码里。 |
| 网页对话 | 支持会话内多轮上下文、流式文字、文件选择及发送；对话上下文不构成持久工作对象。 |
| 密钥配置 | 云端默认密钥与用户自带密钥二选一，后者优先；不是产品用户账号或工作权限体系。 |
| 移动扩展 | 同快照的 V4 EX 增加移动端识别和界面适配，但仍走相同的请求转发范式，不增加工作调度。 |
| 图像、视频及其他平台 | README 的广泛能力描述不能直接视为 V4 已交付。EX 包含额外模型及接口分支，但实际可用性未做上游运行验证。 |
| 持久工作调度 | 当前核心链路没有任务系统、依赖关系、Agent 进程管理或持续工作循环。 |

依据：[V4 白名单与上游](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L31-L65)、[文件与上下文提交](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L579-L627)、[EX 入口](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%20EX%28For%20mobile%20support%20Expand%29/worker.js#L4-L17)、[EX 模型分支](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%20EX%28For%20mobile%20support%20Expand%29/api-handler.js#L25-L58)。

**未决**：V4 当前白名单为 `gemini-3.8-flash` 和 `gemini-3.1-pro-preview`；这只证明代码允许这些标识，不证明它们在调研时对具体账号、地区和配额可调用。EX 的非流式上游分支仍经统一 SSE 响应处理，也不能仅凭选项存在宣称图像／视频端到端可用。部署前需验证目标模型及其响应协议，而不是照搬 README 的能力范围。[V4 配置](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L31-L53)、[EX 返回链路](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%20EX%28For%20mobile%20support%20Expand%29/api-handler.js#L48-L118)。

### 维护状态与版本演进

**已确认**：公开发布与主干更新不是同一个证据窗口，以下发布时间按 UTC 记录。

- **2025-05-16，3.0**：发布说明只有“3.0 - Structured”，不足以据此判断具体架构变化。[Release 3.0](https://github.com/qyjoy/AI-worker/releases/tag/3.0)。
- **2025-05-17，4.0 Pro**：发布说明增加附件上传、用户自带 API Key、移动端界面和背景设置，方向是聊天与接入体验，不是任务调度。[Release 4.0](https://github.com/qyjoy/AI-worker/releases/tag/4.0)。
- **2025-05-18，4.0 EX**：继续调整移动端布局、聊天气泡与主题，并称修复文件上传；查询时仍标为 Latest。部分发布附件的时间为 2025-06-20，晚于首次发布，故不能将附件、tag 和当前 main 视为同一份代码。[Release 4.0EX](https://github.com/qyjoy/AI-worker/releases/tag/4.0EX)。

**已确认（提交元数据）**：固定 SHA 的历史显示，2026-09-22 有 API handler 与 HTML renderer 更新，2026-09-23 有页面推广链接清理，2026-10-12 有 README 更新；最新提交即本次锁定 SHA。正式 Release 较旧，但主干仍有近期维护活动，不能据 Release 日期判定项目已停止维护。[提交历史](https://github.com/qyjoy/AI-worker/commits/7c23acb408737adbb9c81cf10340c6855d026a7a/)。

**部署影响**：使用者需明确取用历史发布附件还是 main 中的具体版本目录，避免混用模块。发布文字只能说明维护方向，不能代替功能实测或兼容性保证；本报告的架构结论以 header 所列 main 快照为准。

### 生态与反馈

**已确认**：官方贡献说明要求向 `discover` 分支提交，再选择性合并到 main；公开讨论公告将 UI／性能建议分流到 Discussions、功能问题分流到 Issues。当前标准接入载体仍是网页和 HTTP，没有在所核验官方资料中发现 Agent SDK、工作领取协议或调度插件生态。[贡献说明](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L146-L148)、[讨论公告 #3](https://github.com/qyjoy/AI-worker/discussions/3)。

**反馈样本**：2025-06-20 的 Issue #7 报告，在 Cloudflare 部署并配置 token 后，Gemini Preview 调用失败，问题标题包含 HTTP 400 的“User location is not supported for the API use”。维护者建议更新 Preview 模型标识或使用稳定模型、重新部署更新后的发布文件，并提出 Worker 出口地域可能影响接入。[Issue #7](https://github.com/qyjoy/AI-worker/issues/7)。

**证据边界**：该 Issue 当天关闭并锁定，但没有用户复测成功记录；维护者对出口地域的解释未经本次独立验证。取消状态过滤后的公开 Issues 页面只得到这一条相关样本，讨论公告之外未获得更多部署反馈，不能归纳为普遍故障或当前可用性结论。[Issues 检索范围](https://github.com/qyjoy/AI-worker/issues?q=is%3Aissue)。

**选型影响**：样本提示模型版本与云端访问地域会影响实际接入，不能把 README 的访问便利性表述当作保证。其反馈对象仍是模型调用，而非持续工作调度的生产实践。

## 技术架构调研

### 系统全貌与运行形态

**已确认**：这是“浏览器客户端 + 云端 Serverless 网关 + 外部模型服务”的组合；所核验官方资料及当前核心链路未提供本地常驻服务、中心调度进程或执行 Agent 池。网页脚本还通过外部 CDN 加载 Tailwind 与 marked。[Worker 入口](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/worker.js#L4-L14)、[前端外部脚本](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L764-L772)。

```text
Windows / macOS 浏览器
  ├─ 页面内存：聊天历史、当前附件、响应文本
  ├─ 站点 localStorage：用户自带 API Key
  ├─ HTTPS → 外部 CDN：界面与 Markdown 脚本
  └─ HTTPS GET / POST
       ↓
用户 Cloudflare 账号下的 Worker
  ├─ 返回 HTML、校验请求、选择密钥、转发响应流
  ├─ env：部署者配置的默认模型密钥
  └─ HTTPS POST → Google Generative Language API
                    └─ 模型生成 → 响应流经 Worker 返回浏览器
```

图中“用户账号下”指官方自行部署路径，不代表工作机本地部署。平台控制面负责发布 Worker 和管理配置，Google 服务负责模型推理；两者都不属于此仓库可独立复制的产品后端。

### 主要组件与核心链路

**链路一：页面及配置。** 浏览器 GET 请求由 Worker 返回内嵌页面；页面初始化会话内存，读取本站点保存的自带密钥。产品没有独立登录服务、账号同步或云端配置同步链路；Cloudflare 部署者账号与模型供应商凭证属于外部服务管理边界。[网页入口](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/request-handler.js#L24-L35)、[初始化](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L316-L348)。

**链路二：单次生成及结果反馈。** 浏览器将历史、当前文字／附件和可选密钥一并发给 Worker；Worker 构造 Google `contents` 请求，调用 `v1beta/models/{model}:streamGenerateContent`，再将响应体转回网页。最终结果由页面解释和显示，不经过任务验收、持久结果登记或下游解锁。[上下文组装](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L51-L88)、[结果显示](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L646-L725)。

**架构推导**：调用失败、流中断或关闭页面后，没有中心任务记录能够持续推进、重新派发或供客户端重新连接取回结果。上游是否已经完成生成或计费，需要实际服务验证，不能从浏览器报错推断已取消上游工作。

### 工作对象、任务关系与生命周期

核验问题是“是否存在中心拥有并可跨请求恢复的工作对象”，而不是网页能否保存一点配置。下表以已读取的入口、完整 API 处理链及客户端上下文管理为证据边界，不外推未发布分支。

| 对象 | 当前产品模型 | 对调度的影响 |
| --- | --- | --- |
| Workspace | 当前链路未提供持久工作空间对象；浏览器站点存储不是工作空间调度状态。 | 没有工作归属、成员或执行资源范围。 |
| Project | Cloudflare 中的应用／Worker 是部署单元，不是拥有任务关系的产品 Project。 | 不能把部署隔离当作项目任务编排。 |
| Issue | 未提供产品内 Issue 对象；仓库的 GitHub Issue 是项目反馈入口，未接入执行链。 | 没有从 Issue 自动生成、认领或回写工作记录的流程。 |
| Plan | 未提供可持久解释的 Plan 对象；输入和输出文本不构成编排计划。 | 没有步骤解锁、计划状态或执行进度所有者。 |
| Task | 未提供持久 Task；一次 POST 是模型请求，没有中心任务标识、归属和恢复协议。 | 不存在跨会话任务生命周期或 Agent 重新分派。 |

依据：[服务入口](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/worker.js#L4-L14)、[API 输入与执行](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L20-L88)、[客户端上下文](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L598-L627)。

**已确认（当前处理链）**：没有解释 Task 父子关系、先后依赖、阻塞关系、并行分支或 DAG 的组件，也没有由中心把工作从等待推进到可执行的决策。优先级、计划时间、事件规则与资源约束不参与本产品的调度，因为这里并不存在相应的调度阶段。

**已确认**：执行目标由请求中的模型名决定，服务端仅校验白名单并调用固定供应商；这不是选择或唤起一个持久 Agent。前端发送时禁用输入、结束后重新启用，只约束当前页面交互，不是跨用户并发协调。[模型选择](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L31-L53)、[页面忙碌状态](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L421-L436)。

**架构推导**：没有 Agent 与 Task 归属，因而不存在退出后交给原 Agent 恢复、转交其他 Agent、检查点接续或超时回收。模型调用结束与工作验收通过不是同一语义。

### 主要依赖

| 依赖 | 运行职责与必要性 | 可关闭、替换或剥离边界 |
| --- | --- | --- |
| Cloudflare Workers | 官方路径中的网页托管、HTTP 入口和转发执行环境；依赖其部署控制面及 Worker 运行时。 | 迁离需要运行入口、配置／密钥注入和服务边界适配，仓库未提供通用本地生产包装。 |
| Google Generative Language API 与密钥 | 当前 V4 的模型生成硬依赖；目标地址和协议在代码中确定。 | 更换服务需修改模型映射、请求及响应适配；仅换密钥不能消除依赖。 |
| 浏览器 Web API | `fetch`、ReadableStream、FileReader、localStorage 等用于交互、附件和上下文。 | 自定义客户端可替代浏览器，但需自行承担这些职责。 |
| 外部前端 CDN | 加载 Tailwind 与 marked；属于页面资源依赖，不是任务一致性依赖。 | 可本地打包以减少页面外部依赖，但不会将网关或模型推理移到本地。 |
| Wrangler、Node.js/npm | 选择命令行开发或部署时的工具依赖；控制台部署及终端网页使用不以此为前提。 | 不属于终端用户必须安装的常驻执行组件。 |

依据：[官方部署](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L72-L123)、[固定上游](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L43-L88)、[页面脚本](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L764-L772)、[Wrangler 安装要求](https://developers.cloudflare.com/workers/wrangler/install-and-update/)。

**已确认（当前核心）**：没有数据库类型、最低数据库版本或专属数据库扩展要求；没有必须为向量检索、智能匹配或任务事务保留的依赖。R2/D1 的未来描述不构成安装前提。

### 接口形态与客户端接入

**已确认**：官方用户载体是网页。服务边界采用 HTTP：GET 返回页面、POST 接收模型请求、OPTIONS 处理跨域预检。关键请求字段是模型、历史、当前输入及可选密钥；没有任务提交后返回任务 ID、查询状态、领取工作或回报完成的协议。[边界接口](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/request-handler.js#L18-L48)、[请求数据](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L20-L49)。

**已确认（代码边界）**：此处理链没有产品用户登录或调用者授权校验。`customApiKey` 是调用模型服务的凭证，不是 Worker 访问身份；配置默认密钥时，代码会为没有自带密钥的请求使用它。CORS 允许 `*`，允许出现 `Authorization` 头不等于验证了该头。[密钥选择](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L43-L49)、[CORS](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/utils.js#L4-L9)。

**改造影响**：组织内使用若要求访问准入、用户权限和费用归属，需要额外部署访问控制或改造服务端，不能将上游 API Key 当作产品权限模型。实际实例是否另配平台访问策略未知，本结论不等同于断言所有部署都公开可用。

**架构推导**：自有工具可以绕过 HTML 直接 POST，但必须管理上下文并解析 Google 响应格式；这属于模型调用适配。Windows/macOS 使用同一 HTTP 协议，没有不同的工作领取程序、桌面桥接服务或反向唤起机制。

### 持久化方式

| 状态 | 存放位置与所有者 | 恢复意义 |
| --- | --- | --- |
| 当前会话、附件与生成结果 | 浏览器页面内存，由前端拥有；每次请求重新携带历史。 | 刷新后初始化为空，不能据此恢复任务。 |
| 用户自带模型密钥 | 当前浏览器、当前站点的 localStorage。 | 可跨页面重载保留，但没有产品账号同步，也不是本产品加密的凭证保险库。 |
| 部署者默认密钥 | Cloudflare Worker 的运行环境配置；官方要求以加密变量保存。 | 随部署配置存在，而非单次请求状态；不是任务数据库。 |
| 工作对象、依赖、执行归属与检查点 | 当前核心链路未提供。 | 不存在由中心接管的恢复、失败转移或断线续作。 |

依据：[前端状态与存储](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L316-L354)、[部署密钥设置](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L108-L123)、[Cloudflare Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)。

**已确认（定点核验）**：针对“README 的 KV 是否构成运行硬依赖”，V4 和 EX 的 API 处理均只从请求或 `env.GEMINI_API_KEY` 取密钥，未在这条链路读写 KV/D1/R2。因此，当前最小部署不能把这些存储列为必需，也不能把它们推断为隐藏的持久调度中心。[V4](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L20-L65)、[EX](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%20EX%28For%20mobile%20support%20Expand%29/api-handler.js#L16-L78)。

**证据边界**：网关源码没有持久化聊天，不代表 Cloudflare 或模型供应商承诺零保留；供应商的数据处理条款及具体账号设置未在本次做合规验证。

### 通信方式

**已确认**：主要通信是浏览器与 Worker、Worker 与 Google 之间的 HTTPS 请求；文字生成通过 HTTP 响应体承载 SSE。浏览器使用 `fetch` 与 `getReader()` 主动读取流，而非任务服务的 WebSocket 推送或客户端轮询领单。[客户端读流](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L623-L660)、[Worker 转发流](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L110-L121)。

**已确认（当前链路）**：没有消息中间件、执行客户端保活、持久事件游标或断线续传协议。流式响应的 `keep-alive` 头不等于存在可恢复的工作通道；一次响应流也不是异步任务队列。

### 任务队列与并发协调

**已确认（当前核心）**：产品不提供持久任务队列或内存任务领取队列。请求到来即直接调用模型服务，不存在中心队列的等待、原子抢占、租约、超时回收或失败重排环节。[直接调用路径](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L71-L88)。

**架构推导**：单次请求的流缓冲以及页面的发送按钮禁用都不能防止跨客户端重复执行。Cloudflare 分发多个 HTTP 请求属于平台请求执行，不是本产品的多调度节点协调。若调用方重新提交，当前协议没有持久工作 ID 或去重状态来保证其与前一次调用是同一任务。

### 部署形态

#### Windows 工作机

- **安装与运行入口，已确认**：标准路径不安装 AI-worker 本地程序。在浏览器登录 Cloudflare 控制台完成 Worker 部署，或者直接访问部署者提供的 Worker URL。完整转发后端在云端，工作机没有对应的本地中心调度服务。[官方流程](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L81-L140)。
- **开发工具，平台文档事实**：若选择 Wrangler，Cloudflare 当前支持 Windows 11；Node.js 使用其 Current、Active 或 Maintenance 支持版本，官方推荐项目内安装 `npm i -D wrangler@latest`。这是 Wrangler 的支持条件，不是 AI-worker 网页的 Windows 最低版本保证。[工具安装](https://developers.cloudflare.com/workers/wrangler/install-and-update/)。
- **依赖与权限**：网页使用需要支持流式读取及站点存储的浏览器；附件由用户通过文件选择器授予读取。控制台部署需要相应 Cloudflare 账号的发布／配置权限以及模型密钥。官方网页路径没有要求安装系统服务或取得本机管理员权限。
- **网络**：工作机须能通过 HTTPS 访问 Worker 及页面依赖的 CDN；部署者还须访问 Cloudflare 控制台。Worker 须能访问 Google API。无需为工作机开放接受云端任务的入站端口。[页面外部资源](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L764-L772)、[上游连接](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L51-L88)。
- **升级**：终端用户随网页重新加载取得部署版本；部署者需要替换相应版本代码并重新发布。所核验官方资料及当前核心链路未提供 Windows 自动更新器或版本迁移流程；Wrangler 的工具更新与产品更新应分开处理。
- **卸载**：标准网页形态没有本地安装器可卸载；停止访问后，可清除该站点数据及其中保存的自带密钥。若另装了开发工具，需单独移除相关项目依赖和工作目录。以上为按存储位置给出的清理建议，不是已验证的项目卸载脚本。

#### macOS 工作机

- **安装与运行入口，已确认**：同样通过浏览器部署或访问云端 Worker；官方资料没有 macOS `.app`、DMG、PKG 或本地常驻 Agent 的安装说明，也没有原生本地中心调度服务。[官方流程](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L81-L140)。
- **开发工具，平台文档事实**：当前 Wrangler 官方支持 macOS 13.5 及以上；Node.js 使用 Current、Active 或 Maintenance 支持版本，推荐项目内 npm 安装。该门槛只适用于开发 CLI，仓库未分别承诺 macOS 浏览器最低版本及硬件架构支持。[工具要求](https://developers.cloudflare.com/workers/wrangler/install-and-update/)。
- **依赖与权限**：需要具备相关 Web API 的浏览器；上传通过文件选择器读取用户选定内容，不代表网页拥有整个文件系统权限。部署需要 Cloudflare 发布／配置权限和模型密钥；网页路径没有要求 root 权限、LaunchDaemon 或安装系统扩展。
- **网络**：浏览器访问 Worker 与前端 CDN，控制台部署另需平台连接；模型请求由 Worker 访问 Google。断网时不能继续生成，也没有本地推理兜底或后台待办队列。[客户端调用](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L618-L627)。
- **升级**：网页跟随云端部署版本；维护者更新源码并重新发布，开发者另行更新 Wrangler。未发现官方 macOS 原生更新渠道。
- **卸载**：停止使用网页并按需要清除站点存储；可在页面保存空密钥以删除自带 Key。另建的本地开发项目和工具需单独清理。清除浏览器数据不撤销供应商 API Key，也不会删除云端部署。[密钥删除逻辑](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L338-L346)。

**双平台共同的云端退役边界**：若要彻底停用自行部署的实例，还需由部署者确认后删除云端 Worker，并按需要撤销模型密钥；本地关闭网页或卸载工具都不会替代这一步。项目没有提供一体化卸载／退役流程，本次未执行资源删除。

#### 开发运行、正式部署与本地生产必须分开判断

**平台文档事实**：Wrangler 提供基于本地运行时的开发测试，远端开发模式则在 Cloudflare 网络执行。AI-worker README 提到 Wrangler，但没有给出锁定工具版本的项目安装清单或完整本地生产部署说明。[官方开发测试说明](https://developers.cloudflare.com/workers/development-testing/)、[项目部署说明](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L72-L123)。

**架构推导**：即使把当前 Worker 代码放进本地开发运行时，硬编码的 Google API 仍是外部依赖；这只能改变网关执行位置，不能得到离线模型或 Stateful 调度系统。本次未运行 Wrangler，也没有把框架通用能力冒充项目经过验证的平台支持。

#### 主体功能运行位置

**已确认**：官方完整形态是云端主导，浏览器作为轻客户端。它不是需要桌面壳连接隐藏后台的产品，而是直接以网页显露其云端依赖；但“没有桌面壳”同样不等于 Local 优先。

**选型缺陷**：Windows/macOS 上缺少完整本地产品安装交付，核心请求必须出机；当前模型推理无法脱离外部服务；未提供断网继续工作、离线排队、客户端恢复或本地中心状态。应保留这些缺陷，而不是因网关轻量就降低本轮标准。

#### 云端职责、持久化、接口与部署边界

| 云端部分 | 职责与运行边界 | 配置、数据与故障影响 |
| --- | --- | --- |
| Cloudflare 部署控制面 | 由部署者创建、发布 Worker 并管理默认密钥；官方路径为托管运行，不是用户在工作机启动中心服务。 | 配置管理归部署账号；控制面不可用时无法正常管理发布，不应无证据推断现有请求实例必然同步停止。 |
| Worker 执行层 | 提供页面、接收 HTTPS POST、请求校验、密钥选择、调用 Google、转发流。 | 接触提示词、历史、附件和自带密钥；当前链路没有持久任务存储。执行层或访问路径不可用时聊天失败。 |
| Google 模型服务 | 接收生成请求并返回模型内容；模型实际计算不在 Worker，也不在工作机。 | 接收 `contents` 及上游密钥；模型不可用、授权／配额错误会由网关反馈，产品没有另一个执行者接管。 |
| 页面资源 CDN | 提供客户端样式与 Markdown 脚本，不持有本产品的调度状态。 | 资源不可达可能影响界面或渲染；即使将这些资源本地化，也不改变模型调用的云端边界。 |

依据：[部署与默认密钥](https://github.com/qyjoy/AI-worker/blob/7c23acb/README.md#L85-L123)、[Worker 全部核心转发链](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L20-L128)、[前端外部脚本](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/html-renderer.js#L764-L772)。

**权限与数据边界，已确认／推导**：默认上游密钥不需要发送到网页，但用户自带密钥会从 localStorage 随请求发送到 Worker。HTTPS 保护传输，不意味着对 Worker 或上游服务端到端不可见。用户提交的历史和附件同样跨出工作机；浏览器中加载的第三方脚本属于页面的信任边界。

**部署成本边界**：最小形态是 Cloudflare 账号、一个模块化 Worker、可用模型密钥和浏览器，不需要另购数据库或消息服务。模型使用、托管额度与网络可达性仍受各供应商条件约束，不能从 README 的“免费”表述推断零成本、无额度限制或生产可靠性保证。

### 架构范式与改造边界

**已确认**：当前是无状态请求转发范式，不是中心化特权调度服务或分布式任务池。接入某个普通 Agent 时，它可以作为“调用模型 API”的工具节点；这里并无可下沉的调度状态或依赖解析能力。

**架构推导**：局部私有化可分为两个不同目标。其一是迁移网关运行位置并本地化页面资源、补访问控制，仍然可能依赖云端模型；其二是替换硬编码上游，使模型请求真正留在本地。后者必须处理模型名、输入格式、流式输出以及多模态能力差异，不能仅修改部署账号。[上游耦合点](https://github.com/qyjoy/AI-worker/blob/7c23acb/V4%28latest%29/api-handler.js#L31-L88)。

**改造结论**：要满足本议题，仍需新增持久工作对象与关系、可执行条件判断、执行归属、跨故障恢复及验证反馈。这已经超出当前产品的职责，不应描述成“去掉一个云依赖即可成为本地调度器”。本次仅评估边界，不设计或实施这些能力。

## 未决项与证据边界

- **未做运行验证**：本次未向 Cloudflare 账号部署服务，未提交真实模型密钥，未进行 Windows/macOS 浏览器或 Wrangler 实测；平台可达性、权限细节和实际运行结果仍需验证。
- **模型与能力可用性未决**：白名单标识、账号授权、配额以及 EX 非流式生成的端到端效果不能由代码选项证明；README 的功能范围大于当前主核验路径。
- **存储宣传与实现不一致**：README 提到 KV、后续 R2/D1；当前 V4/EX 处理链未发现对应使用，结论限于本次固定快照，不外推未来或未发布分支。
- **平台支持边界**：Windows 11、macOS 13.5+ 是调研时 Wrangler 官方支持条件，不是 AI-worker 原生应用或所有浏览器版本的承诺。
- **云端实例边界**：公开源代码不能证明某个实际站点是否另配访问策略、修改代码或采用不同的数据处理设置。本次没有登录或检查他人部署。
- **调度缺失结论的范围**：依据官方定位、主要运行入口、完整请求处理链和客户端上下文管理形成判断；未为证明“绝对不存在”扫描历史所有目录或审计相邻实现。

## 后续验证建议

- 若继续验证其模型接入用途，在自有测试账号中先确认可用模型及协议，部署固定版本，覆盖正常流式返回、无效密钥、上游错误和中途断线；核对计费与结果是否可追踪。
- 分别在 Windows、macOS 验证网页访问、文件上传、页面刷新后的会话丢失、自带密钥保存与清除；需要开发路径时再按各平台支持条件验证 Wrangler，而非把开发预览作为本地产品验收。
- 在受控环境核对 Worker 访问准入及默认密钥的使用范围；确认提示词、历史和附件可否按组织要求经过云端网关及模型供应商。
- 若本轮目标仍是 Stateful 调度，保留“不符合”的结论即可；不要为了验证其不存在的调度机制继续展开源码审计。任何另建调度系统的需求应作为独立任务讨论。
