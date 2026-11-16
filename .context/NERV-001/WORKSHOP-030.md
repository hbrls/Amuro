# OpenSquilla 技术产品调研

> updated_by: Codex - GPT-5.6
> updated_at: 2026-07-30 23:45:57
> evidence_window: 调研日期 2026-07-30；OpenSquilla v0.5.2（2026-07-30）；opensquilla/opensquilla main 分支、官方产品网站与官方文档快照

## 交付结论

1. **OpenSquilla 是一个本地优先、面向个人与小团队的通用 AI Agent Runtime**。它以本地 Gateway 为核心，把 CLI、Web UI、桌面应用、消息渠道、定时任务和 MCP 接入统一到同一套 Agent 轮次、工具、记忆、审批与成本记录链路中。它不是只针对代码修改的 IDE 插件，也不是纯云端聊天产品。
2. **主体功能运行在工作 PC，符合本次 RUNBOOK 的核心要求**。Gateway、Web UI、CLI、会话、SQLite、记忆、工具执行、SquillaRouter 和本地嵌入都可以位于用户电脑；默认 Gateway 只监听 `127.0.0.1:18791`。远端主要承担用户主动配置的模型推理、搜索、消息渠道和发布下载，不承载 OpenSquilla 的核心状态。
3. **Windows 与 macOS 都有官方安装路径，但桌面包覆盖并不对称**。v0.5.2 提供 Windows x64 的 Electron 安装器和 macOS Apple Silicon 的 DMG/ZIP；没有文档化的 macOS Intel 桌面包。两平台都可以使用 `uv` 安装 Python wheel，因而 Intel Mac 的官方可行路径是终端安装而非原生桌面安装器。
4. **Windows 桌面交付存在明确的代码签名风险**。官方签名策略确认当前 Windows 安装器、更新元数据和校验和均未使用 Authenticode 证书，可能触发 SmartScreen、Smart App Control 或企业策略阻断。官方提供 `SHA256SUMS` 只能证明下载字节与项目发布物一致，不能替代发布者身份签名。
5. **“本地优先”不等于“模型请求不出本机”**。SquillaRouter 的分类判断和默认嵌入可在设备端运行，项目状态也默认留在本地；但一旦使用 OpenAI、Anthropic、OpenRouter、Gemini、DeepSeek、DashScope 等外部提供方，提示词、消息、工具结果、选中文件和生成上下文会发送给对应服务。只有选用本地模型端点并禁用外部搜索、渠道和集成后，才可能形成真正的离线路径。
6. **产品的关键差异点是本地模型路由、共享运行循环和长期状态**。本地 LightGBM + ONNX 路由器按任务特征选择模型档位；CLI、Web UI、Gateway RPC 和消息渠道共用 TurnRunner；SQLite 会话、Markdown 记忆、调度器和压缩后的工具结果共同支持长时间 Agent 工作。
7. **安全控制体系完整，但 Windows/macOS 的底层隔离仍不成熟**。产品提供 restricted/on/bypass/full 权限档位、人工审批、工作区严格读取、写入 lockdown 和拒绝记录；然而官方 README 明确说明 macOS Seatbelt 后端目前只生成 profile、尚未实际执行，Windows 尚无沙箱后端。因此在这两个核心工作平台上，安全主要依赖应用层策略和人工审批，不能视为强 OS 沙箱。
8. **项目完全以 Apache-2.0 发布，源码与运行时边界较清晰**。根许可证和 `pyproject.toml` 都声明 Apache-2.0，Python Gateway、工具、路由、Web UI 构建与桌面发布均在同一公开项目中管理。第三方模型资产、内置技能和依赖仍应结合 `THIRD_PARTY_NOTICES.md` 单独核对。
9. **维护非常活跃，但产品成熟度信号互相矛盾**。官方称 v0.5.2 为 0.5 稳定线维护版本，且 0.5.0、0.5.1、0.5.2 在一周内快速发布；但 `pyproject.toml` 仍标记 `Development Status :: 3 - Alpha`，官网首页在调研时仍显示 v0.5.1。当前适合受控试用，不宜在没有固定版本、备份、权限收紧和实机验证时直接承担无人值守的高权限生产任务。

## 调研目标、范围与边界

### 调研目标

理解 OpenSquilla 是什么产品、如何组织 Agent 工作，并重点回答：

1. 产品定位、目标用户、核心流程和功能边界是什么？
2. Windows 与 macOS 工作机如何安装、启动、升级和卸载？
3. 产品主体运行在 PC 本地还是云端？
4. Desktop、Gateway、Web UI、SquillaRouter、SQLite、工具和外部模型如何协作？
5. 项目的维护状态、开源许可、交付成熟度和安全边界如何？

### 覆盖范围

- 产品定位、目标用户、核心流程、功能边界和维护状态。
- Windows/macOS 桌面安装与终端安装路径。
- 本地 Gateway、Web UI、CLI、模型路由、工具、记忆与持久化。
- 为确认主体位置、安装资格、签名状态与安全边界所需的定点证据。

### 明确排除

- 不进行逐文件源码审计、代码质量审计或安全渗透测试。
- 不进行竞品比较、模型排名或 Agent 框架选型矩阵。
- 不调研遥测、监控、运营指标或站点分析实现。
- 不实际安装 OpenSquilla，不运行模型，不执行官方 benchmark 的复现。
- Linux 不作为本次工作 PC 的合格安装路径，只在说明容器和沙箱边界时简要提及。

## 证据口径

- **直接事实**：来自官方 README、产品指南、Quickstart、Gateway、权限、安全、隐私、版本说明、CHANGELOG、许可证和 `pyproject.toml`。
- **架构推导**：用于解释 Electron、Vue 控制台、Starlette Gateway、TurnRunner、Agent 工具、SQLite 和外部提供方之间的关系；本次未做运行时抓包。
- **营销指标**：官网的 Token 节省、路由质量和离线能力表述只作为官方主张，不作为独立验证结果。
- **公开反馈**：GitHub 页面和 Issue 快照在本次环境中无法稳定读取；CHANGELOG 可证明存在社区贡献，但不足以判断用户满意度和故障分布。
- **版本冲突处理**：以仓库 v0.5.2 README、CHANGELOG 和版本说明为当前版本依据；官网首页仍显示 v0.5.1，视为站点同步滞后。

## 产品调研

### 产品定位与目标用户

**一句话定位**：OpenSquilla 是一个运行在本机的通用 Agent 平台，通过统一 Gateway 为终端、浏览器、桌面应用和消息渠道提供共享的模型路由、工具、记忆、调度与审批能力。

目标用户包括：

- 希望用同一工作流切换多个模型提供方的个人开发者和知识工作者。
- 需要把 Agent 长期运行在本机，并保留会话、记忆、成本和产物记录的用户。
- 希望通过 Web UI 与 CLI 同时管理高权限工具、审批和项目工作区的操作者。
- 需要通过消息渠道、计划任务或 MCP 客户端调用同一 Agent Runtime 的团队。
- 希望用本地模型路由降低推理成本，同时保留强模型处理复杂任务的用户。

### 核心流程

#### 首次安装与启动

1. 用户选择 Desktop 安装器或 `uv` 终端安装。
2. 执行 `opensquilla onboard`，配置模型提供方、本地模型或可选能力。
3. 启动 `opensquilla gateway run` 或后台 Gateway。
4. Gateway 默认绑定 `127.0.0.1:18791`，用户打开本地 Control UI。
5. 配置、会话、日志、记忆、调度状态和提供方设置保存在本机。

#### 交互式 Agent 流程

1. 用户从 Web UI 或 `opensquilla chat` 发起会话。
2. 共享 TurnRunner 读取会话、记忆、技能、工作区和权限配置。
3. SquillaRouter 可在本机判断任务复杂度并选择模型档位；禁用路由时直接使用指定模型。
4. Provider 层向本地或远端模型发送请求。
5. 模型请求文件、Shell、Git、搜索、记忆、产物或其他工具。
6. 策略层根据权限、工作区限制和审批状态决定执行、暂停或拒绝。
7. 流式事件通过 Gateway 返回 Web UI、CLI 或消息渠道，结果写入本地会话与使用记录。

#### 自动化与长期运行

1. 用户通过 `opensquilla agent` 发起一次性任务，或通过调度器创建周期任务。
2. 任务可以绑定明确工作区、严格读取边界、写入 lockdown、超时和权限档位。
3. Agent 可以派生深度受限的子 Agent，调用技能并生成文件、报告、图片或消息。
4. 敏感工具可进入人工审批；完成状态、产物、成本和会话保存在本地。

### 功能地图与边界

| 功能域 | 当前能力 | 主要边界 |
| --- | --- | --- |
| 使用入口 | Electron Desktop、Web UI、CLI、一次性命令、消息渠道 | 各入口共用 Gateway，Desktop 不是独立云客户端 |
| 模型 | 20 多种提供方、本地端点、主用与回退配置 | 外部模型的数据处理受第三方政策约束 |
| 路由 | 本地 SquillaRouter、复杂度分级、多模型集合路径 | 成本与质量收益主要来自项目自身测试 |
| 工具 | 文件、Shell、Git、搜索、抓取、文档、媒体、渠道和管理工具 | 工具权限高，错误配置可能修改或泄露本地数据 |
| 记忆 | Markdown 记忆、SQLite 全文搜索、sqlite-vec、本地嵌入 | 不应保存密钥或不必要的敏感原文 |
| 会话 | 持久会话、回放、压缩、导出、恢复和成本统计 | 长会话恢复与迁移仍在频繁修复 |
| 自动化 | 定时任务、后台 Gateway、渠道投递、子 Agent | 无人值守任务必须限制权限、工作区和网络 |
| 扩展 | Skills、MetaSkills、MCP 客户端与可选 MCP Server | 可选依赖与第三方技能需要单独信任评估 |
| 产物 | HTML、PDF、文档、表格、幻灯片、图片和消息投递 | 生成与发布属于有副作用操作 |

OpenSquilla 当前不是：

- 完全本地推理模型；它是可连接本地或远端模型的 Agent Runtime。
- 只面向代码仓库的编程助手；其工具、渠道、定时任务和文档能力覆盖更广场景。
- 在 Windows/macOS 上提供强制 OS 级隔离的安全执行环境。
- 已由独立第三方证明可稳定实现官网全部成本与质量指标的成熟平台。

## 技术架构调研

### 系统全貌与运行形态

| 组件 | 运行位置 | 主要职责 |
| --- | --- | --- |
| Electron Desktop | Windows/macOS 工作机 | 打包本地 Gateway 与 Vue 控制台，管理启动、更新、项目选择和桌面 Profile |
| CLI | 工作机终端 | 安装配置、聊天、一次性 Agent、Gateway 生命周期、诊断、会话和卸载 |
| Starlette Gateway | 工作机本地 Python 进程 | Web UI、渠道、RPC、会话、审批、工具、调度和提供方调用的统一服务 |
| Vue Control UI | Electron 窗口或本地浏览器 | 配置、聊天、审批、健康、日志、使用量、会话和产物界面 |
| TurnRunner | Gateway 进程 | 统一所有入口的 Agent 轮次、工具调度、重试、压缩和状态写入 |
| SquillaRouter | 工作机本地 | 使用 LightGBM、ONNX、tokenizer 和本地特征选择模型档位 |
| Provider 层 | Gateway 与外部/本地端点之间 | 统一多种模型协议、模型选择、流式输出与回退 |
| 工具与策略层 | 工作机本地 | 文件、Shell、Git、搜索、产物、技能、审批和工作区控制 |
| SQLite 与本地文件 | 工作机本地 | 会话、转录、调度、缓存、记忆索引、配置和日志 |
| 外部服务 | 网络远端或局域网端点 | 模型推理、搜索、消息渠道、GitHub 和发布下载 |

### 主体功能运行位置判定

**判定：符合工作 PC 本地运行要求。**

以下核心能力在 PC 本地：

- Gateway、Control UI 和 CLI。
- 会话、配置、日志、记忆、调度器、缓存和提供方设置。
- SQLite、Markdown 记忆和默认本地嵌入。
- SquillaRouter 的任务分类与模型档位选择。
- 文件、Shell、Git、工作区和本地产物操作。
- Desktop Profile 与 Electron 专用数据。

远端或可选外部部分包括：

- 外部 LLM 提供方的实际推理。
- 网络搜索、消息渠道、GitHub 和其他集成。
- GitHub Releases 与 Alibaba Cloud OSS 发布镜像。

因此产品应被理解为**本地控制平面与执行面 + 可替换的模型和集成服务**。若配置 Ollama、LM Studio、vLLM 等本地端点并关闭外部能力，可以形成更强的本地化路径；这仍需要实机网络验证。

### 核心技术链路

#### Desktop 启动链路

1. 用户启动 Electron Desktop。
2. Desktop 使用平台 Electron `userData` 和独立 Desktop Profile。
3. 打包的本地 Gateway 启动并进行 Profile、进程所有权和健康检查。
4. Vue Control UI 连接本机 Gateway。
5. 退出应用时，Desktop 对运行中的 Agent 轮次执行排空与停止；Windows 使用仅限 owner、loopback 的关闭端点完成优雅停机。

#### Agent 轮次链路

1. Web UI、CLI、RPC 或消息渠道向 Gateway 发起会话输入。
2. Gateway 加载会话、工作区、记忆、技能、权限和模型配置。
3. 本地路由器决定单模型档位或复杂任务路径。
4. Provider 层调用本地或远端模型。
5. 模型生成工具调用；策略层检查副作用、工作区、权限和审批。
6. 工具在工作机执行，较大结果可压缩为模型可见摘要，同时保留原始结果引用。
7. 流式结果和状态经 WebSocket/RPC 返回客户端，持久状态写回 SQLite 与本地文件。

#### 调度与渠道链路

1. SchedulerEngine 从本地持久化读取周期或一次性任务。
2. 任务进入与交互会话相同的 TurnRunner。
3. 结果可写入本地产物或投递到启用的消息渠道。
4. 渠道采用 WebSocket、轮询、Socket Mode 或 webhook，部分模式需要公网可达 URL。

### 主要依赖

#### 桌面发布版

- Windows x64 或 macOS Apple Silicon。
- Electron Desktop 内含 Gateway Runtime 和已构建的 Vue 控制台。
- 不要求用户预装系统 Python、Node.js 或 npm。
- 至少一个本地或远端模型提供方。
- 首次配置、模型调用、搜索、渠道和更新所需网络。

#### 终端发布版

- `uv` 管理的 Python 3.12+ 隔离环境。
- `opensquilla[recommended]` 包含路由、记忆和本地模型相关依赖。
- Windows 的 ONNX Runtime 可能需要 Visual C++ 2015–2022 x64 Runtime。
- macOS 的 LightGBM 终端路径可能需要 `libomp`；桌面包会携带所需运行库。
- 发布 wheel 已包含 Web UI，不需要 Node.js 或 npm。

#### 源码路径

- Git、Git LFS、Node.js 22.12+、npm 和 `uv`。
- 源码安装器先构建 Vue 控制台，再安装 Python 包。
- 这是维护者和跟踪 main 的路径，不是普通工作机首选安装方式。

### 接口与通信方式

- **CLI**：配置、聊天、Agent、Gateway、会话、记忆、调度、成本、诊断和卸载。
- **本地 HTTP**：Control UI、健康检查与部分系统操作。
- **WebSocket RPC**：Gateway 客户端、会话事件和远端状态访问。
- **消息渠道协议**：WebSocket、轮询、Socket Mode、webhook 或平台 SDK。
- **MCP**：OpenSquilla 可作为 MCP 客户端；安装可选 extra 后也可运行 MCP Server。
- **模型 HTTPS/本地 HTTP**：连接外部 API 或本地模型服务。
- **本地进程与文件系统**：工具、Shell、Git、项目工作区和产物执行。

### 持久化方式

| 数据 | 默认位置或介质 | 说明 |
| --- | --- | --- |
| CLI/Gateway 主目录 | `~/.opensquilla` | 配置、会话、日志、记忆、调度、缓存和提供方设置 |
| Desktop 数据 | 平台 Electron `userData` 与 Desktop Profile | 桌面设置、Gateway 日志和可用时的加密凭据 |
| Windows Desktop Profile | `%APPDATA%\OpenSquilla` | 官方升级说明明确要求旧版本升级前备份 |
| 会话与运行状态 | SQLite | 会话、转录、调度与运行状态的主要持久化 |
| 记忆 | Markdown + SQLite/SQLite-vec 索引 | 精选事实与语义、关键词召回 |
| 项目与产物 | 用户指定的本地工作区 | 文件和 Git 工作树由用户拥有 |
| 提供方密钥 | 环境变量、`.env`、配置引用或 Desktop 加密存储 | 取决于安装与配置方式 |

## 部署形态

### Desktop 模式

- Windows/macOS 的主要图形化入口。
- Electron 打包 Gateway Runtime 和 Vue 控制台。
- 适合本地交互、审批、项目选择和产物预览。
- Desktop Profile 与终端 `~/.opensquilla` 是两套独立状态，迁移需要显式操作。

### 终端模式

- 使用 `uv tool install` 安装发布 wheel。
- 支持 CLI、Web UI、本地 Gateway、后台任务和自动化。
- 依赖最透明，适合需要固定版本和脚本化安装的团队。

### Docker 模式

- 官方提供 `amd64` 与 `arm64` 的 Gateway 镜像。
- 可在 Windows/macOS 的 Docker Desktop 中运行，但不是本次首选工作机路径。
- 适合家庭服务器、NAS 或局域网服务；暴露非 loopback 地址时必须配置 token 与网络边界。

## 工作机安装（Windows / macOS）

### Windows

**判定：官方支持，但 unsigned 安装器可能被组织策略阻断。**

#### Desktop 安装

1. 下载固定版本的 `OpenSquilla-0.5.2-win-x64.exe`。
2. 对照同一 Release 的 `SHA256SUMS` 校验文件摘要。
3. 退出旧 Desktop 与 Gateway，直接运行新安装器覆盖升级。
4. 首次启动后完成 provider onboarding，并确认本地 Gateway 和 Health 状态。

交付限制：

- Windows 安装器当前未签名。
- SmartScreen 可提示“More info → Run anyway”，但 Smart App Control 或企业策略可能完全阻止运行。
- 不应在企业基线中普遍关闭系统安全策略；被阻断时可改用终端 wheel 安装。

运行依赖与权限：

- Desktop 已打包 Python Runtime 和 Web UI，不需要系统 Node/npm。
- 需要对 Desktop Profile、项目工作区和本地日志目录的读写权限。
- Gateway 默认使用 loopback 18791 端口。
- 外部模型、搜索、渠道和更新需要出站网络。

升级与卸载：

- 从 RC3 或更旧预览版升级时，不要先卸载；旧卸载器可能删除 `%APPDATA%\OpenSquilla`。
- Preview 4、0.5.0、0.5.1 与 0.5.2 的正常卸载默认保留 Profile。
- 桌面应用通过 Windows 应用管理卸载；如要删除状态，应先备份，再按应用引导清理 Profile。
- 终端安装可先运行 `opensquilla uninstall --dry-run`，再选择保留数据或显式 purge。

### macOS

**判定：官方支持；Desktop 仅覆盖 Apple Silicon，Intel Mac 需要终端路径。**

#### Apple Silicon Desktop 安装

1. 下载 `OpenSquilla-0.5.2-mac-arm64.dmg`。
2. 打开 DMG，将应用拖入 Applications。
3. 弹出 DMG，从 Applications 中启动应用。
4. 完成 provider onboarding，确认 Gateway 和 Health 状态。

签名与架构边界：

- 官方签名策略称 macOS 产物走 Apple signing 与 notarization 路径。
- 本次未下载 DMG 实测 `codesign`、notarization ticket 或 Gatekeeper 行为，因此 v0.5.2 的实际签名状态仍需验证。
- v0.5.2 没有文档化的 Intel/x64 Desktop 资产。

#### Intel Mac 或终端安装

- 使用 `uv` 安装 Python 3.12 发布 wheel。
- 发布 wheel 内含 Web UI，不要求 Node/npm。
- SquillaRouter 的 LightGBM 运行时若提示缺少 `libomp.dylib`，需要由 Human 安装系统 `libomp`；本任务不自行安装依赖。
- 在 `libomp` 可用前，OpenSquilla 会降级为直接单模型路由。

卸载：

- Desktop 通过 macOS 应用管理方式移除应用包。
- Desktop Profile 和终端 `~/.opensquilla` 不会因删除应用自动等同于清空。
- 终端安装使用 `opensquilla uninstall`；`--purge-state`、`--purge-config` 和 `--purge-all` 都需要用户显式选择。

## 安全、隐私与许可边界

### 安全控制

- Gateway 默认只监听 loopback。
- 非 loopback 暴露必须配置 token、CORS 与可信网络边界。
- restricted/on/bypass/full 控制执行权限。
- `--workspace-strict` 限制读取，`--workspace-lockdown` 限制写入范围。
- Web UI 与终端可以暂停敏感调用等待人工审批。
- 系统拒绝 Agent 直接终止自身 Gateway 进程。

### 关键安全缺口

- Windows 当前没有沙箱后端。
- macOS Seatbelt 后端尚未实际执行 profile。
- bypass/full 会允许高权限主机执行，不能依赖应用层标签替代主机隔离。
- 消息渠道与无人值守计划任务会放大误操作和凭据泄漏影响。
- 文件、Shell、Git、HTTP、发布和渠道工具都具有真实副作用。

### 数据与模型边界

- 本地保存配置、会话、日志、记忆、调度、缓存和 provider 设置。
- OpenSquilla 不要求创建 OpenSquilla 账号。
- 外部 provider 请求可能包含提示词、消息、工具结果、文件和生成上下文。
- 搜索、渠道、GitHub 与浏览器自动化仅在启用或调用时访问外部服务。
- 本地路由决策不需要把提示词发送给额外的远端分类器。

### 开源许可

- 根项目许可证：Apache License 2.0。
- `pyproject.toml`：`license = "Apache-2.0"`。
- 允许使用、修改和分发，需遵守许可证、NOTICE、修改声明和商标边界。
- 官方安全策略只承诺评估当前 main 与最新公开 Release；旧版本不保证持续获得修复。

## 维护状态、版本演进与生态

### 维护状态

- v0.5.0 于 2026-07-23 成为 0.5 系列首个稳定版。
- v0.5.1 于 2026-07-29 发布，v0.5.2 于 2026-07-30 发布。
- v0.5.2 重点修复 Desktop/Gateway 启动、会话恢复、SQLite 争用、项目选择和产物预览。
- CHANGELOG、产品指南和发布 README 同步到 v0.5.2，说明发布维护活跃。

### 成熟度冲突

1. 项目文档称 v0.5.2 为 stable line maintenance release。
2. `pyproject.toml` 仍声明 Alpha 开发状态。
3. 官网首页仍显示 v0.5.1，而仓库已经发布 v0.5.2。
4. 0.5.0 稳定版发布后一周内连续两个维护版本，说明稳定化速度快，但变更密度也高。

综合判断：**工程活动强、发布节奏快，但版本治理和生产成熟度尚需观察。**

### 生态与公开反馈边界

- 提供多模型 provider、消息渠道、Skills、MetaSkills、MCP、搜索、文档和媒体扩展。
- CHANGELOG 明确记录多个社区贡献与 PR，说明存在外部协作。
- 本次无法稳定访问 GitHub Issue 页面，因此没有足够样本归纳用户投诉、常见故障或满意度。
- 官网成本节省和路由质量数据来自项目自身测试，本次未复现，不应视为独立 benchmark。

## 未决项与证据边界

1. **Windows 签名**：当前明确 unsigned；需要确认 SignPath 或其他签名计划何时实际启用。
2. **macOS 实际签名**：政策说明存在 Apple signing/notarization 流程，但未验证 v0.5.2 DMG 的实际签名与 Gatekeeper 结果。
3. **macOS Intel**：没有 x64 Desktop 包；需要实测终端 wheel、ONNX、LightGBM 和本地嵌入在 Intel Mac 上的完整兼容性。
4. **Windows/macOS 沙箱**：两平台缺少可依赖的 OS 级隔离，需要验证 workspace lockdown、敏感路径和审批在真实攻击/误操作场景中的边界。
5. **离线能力**：未实测关闭所有外部服务后，Desktop、Gateway、本地模型、搜索、渠道和更新路径的实际网络行为。
6. **长期运行**：v0.5.2 正在修复启动、恢复和 SQLite 争用；尚未做多日 Gateway、定时任务或多会话压力验证。
7. **公开反馈**：未取得可靠的 GitHub Issue/Discussion 样本，不能判断真实采用规模和稳定性。
8. **第三方资产许可**：根项目是 Apache-2.0，但本地路由模型、内置技能和第三方内容仍需在正式引入前复核 notices。

## 后续验证建议

若 OpenSquilla 进入候选验证，建议进行以下小范围实测：

1. **Windows 安装与升级**：在启用 SmartScreen/企业安全策略的环境中测试 unsigned 安装器、SHA-256 校验、覆盖升级和完整卸载残留。
2. **macOS 签名与架构**：对 Apple Silicon DMG 执行签名、公证和 Gatekeeper 检查；在 Intel Mac 上验证终端安装及 `libomp` 依赖。
3. **权限与逃逸验证**：分别测试 restricted、workspace strict、workspace lockdown、审批、bypass/full，确认 Windows/macOS 的真实文件和命令边界。
4. **网络边界**：使用本地模型与外部模型各执行一组会话，记录 provider、搜索、渠道和更新请求，确认离线配置是否符合预期。
5. **数据与恢复**：验证 Desktop Profile、`~/.opensquilla`、SQLite、记忆、定时任务的备份、迁移、升级和 purge 行为。
6. **稳定性**：固定 v0.5.2，运行多会话、长工具输出、定时任务和优雅停机，观察 Gateway 恢复与 SQLite 争用。

## 主要证据锚点

- [OpenSquilla 官方网站](https://opensquilla.ai/)
- [OpenSquilla GitHub 仓库](https://github.com/opensquilla/opensquilla)
- [英文 README](https://raw.githubusercontent.com/opensquilla/opensquilla/main/README.md)
- [中文 README](https://raw.githubusercontent.com/opensquilla/opensquilla/main/README.zh-Hans.md)
- [产品指南](https://raw.githubusercontent.com/opensquilla/opensquilla/main/README.product.md)
- [文档索引](https://raw.githubusercontent.com/opensquilla/opensquilla/main/docs/README.md)
- [Quickstart](https://raw.githubusercontent.com/opensquilla/opensquilla/main/docs/quickstart.md)
- [Gateway 指南](https://raw.githubusercontent.com/opensquilla/opensquilla/main/docs/gateway.md)
- [工具与沙箱](https://raw.githubusercontent.com/opensquilla/opensquilla/main/docs/tools-and-sandbox.md)
- [审批与权限](https://raw.githubusercontent.com/opensquilla/opensquilla/main/docs/approvals-and-permissions.md)
- [记忆指南](https://raw.githubusercontent.com/opensquilla/opensquilla/main/docs/features/memory.md)
- [隐私政策](https://raw.githubusercontent.com/opensquilla/opensquilla/main/PRIVACY.md)
- [代码签名策略](https://raw.githubusercontent.com/opensquilla/opensquilla/main/docs/code-signing-policy.md)
- [安全策略](https://raw.githubusercontent.com/opensquilla/opensquilla/main/SECURITY.md)
- [CHANGELOG](https://raw.githubusercontent.com/opensquilla/opensquilla/main/CHANGELOG.md)
- [v0.5.2 发布说明](https://raw.githubusercontent.com/opensquilla/opensquilla/main/docs/releases/0.5.2.md)
- [Python 包元数据](https://raw.githubusercontent.com/opensquilla/opensquilla/main/pyproject.toml)
- [Apache-2.0 许可证](https://raw.githubusercontent.com/opensquilla/opensquilla/main/LICENSE)
