# The Zeroth / The One 技术产品调研

> updated_by: Codex - GPT-5.6
> updated_at: 2026-07-31 00:05:28
> evidence_window: 调研日期 2026-07-31；The One Desktop v0.3.10（2026-07-14）；The Zeroth 中文官网、官方文档、下载元数据、隐私政策与服务条款快照

## 交付结论

1. **The Zeroth 是产品与云端控制平面，The One 是实际安装在工作机上的 Multi-Agent Graph 桌面工作台。** The One 用于定义 Agent、Prompt、Skill、MCP 和 Graph，绑定本地项目目录，运行多智能体团队，并从 Work Chain、Agent 名册、上下文、工具调用、共享数据和 TaskBoard 观察及介入整个执行过程。
2. **主体工作运行在 PC 本地，符合本次 RUNBOOK 的核心要求，但依赖云端账户授权。** 官方隐私政策确认工作流定义、运行状态、日志和配置可以保存在用户设备上，模型请求由桌面客户端直接发往 OpenRouter 或用户配置的 Provider，不经过 The Zeroth 的托管模型中转；与此同时，登录、桌面授权、订阅、权益、额度和官方 Provider 配置由云端控制平面负责。
3. **当前正式支持 Windows x64 与 macOS Apple Silicon。** 最新稳定构建为 v0.3.10，发布于 2026-07-14；Windows 安装包是 `The-One-Setup-0.3.10-x64.exe`，macOS 安装包是 `The-One-0.3.10-arm64.dmg`。官网明确说明 Intel Mac 暂无版本，也未提供 Linux 工作机路径。
4. **安装包交付成熟度较好。** 官网声明 macOS 构建经过 Apple 签名和公证，Windows 构建完成代码签名；更新服务同时发布每个资产的 SHA-512、大小和发布日期。相比 unsigned 安装包，这更适合受管工作机，但本次没有下载资产实测签名证书链、时间戳和 Gatekeeper/SmartScreen 行为。
5. **The One 不是离线授权软件。** 下载后需要登录控制台并授权桌面应用，访问权限与账号绑定。公开定价只有 Starter、Pro、Max 三档，所有档位提供相同桌面与 Graph 功能，差异主要是官方模型服务容量；即使使用自有 Provider，仍没有文档证明可以脱离 The Zeroth 账号和授权服务长期使用。
6. **产品核心不是固定工作流，而是可运行、可观察、可动态生长的 Agent Graph。** Graph 的节点绑定 Agent 预设，边表示允许的通信和 handoff 关系；Agent 可根据运行状态选择是否移交，0.3.x 还允许动态创建子 Graph、创建或克隆节点、管理上下文、挂载 Skill/MCP 并把经验写回 Definition Space。
7. **数据本地性强，但模型和账号数据仍跨网络。** Definition Space、运行记录、项目工作区、Markdown memory 和本地后端状态位于设备侧；模型请求直接到相应 Provider。The Zeroth 控制平面可能处理账号、授权 token、订阅与额度，以及用于向桌面分发 Provider 访问的加密 API key 材料。
8. **高权限扩展能力带来显著的主机安全风险。** 本地 MCP server 可以执行 command、args、环境变量和工作目录；默认 Space 预置桌面控制与浏览器自动化 MCP，内置 Agent 使用 `mcp:*` 自动拾取新增 Server。外部 `.zerospace` 还可以携带 Agent、Prompt、Skill、MCP 与 Graph。官方提供导入预览、敏感字段清理、definition 版本与回滚，但没有公开 Windows/macOS 的 OS 级沙箱、逐工具审批矩阵或文件系统隔离模型。
9. **桌面应用应按闭源商业软件评估。** 官网唯一公开 GitHub 入口明确标注为“文档仓库”，未发现 The One 桌面源码、构建说明或适用于应用的开源许可证；服务条款还禁止逆向受保护组件。公开证据只能证明文档可公开访问，不能把它解释为产品开源。
10. **项目仍处早期 0.x 快速迭代阶段，供应商连续性风险高于成熟商业软件。** 最新安装包是 0.3.10，但公开 Release Notes 只覆盖 0.1.0、0.2.0、0.3.0，0.3.1–0.3.10 缺少逐版变更说明；隐私政策和条款还明确说明产品当前由独立个人开发者运营，尚未成立法律实体。适合小范围验证，不宜在未确认合同主体、支持承诺、数据恢复和权限边界时承载关键生产流程。

## 调研目标、范围与边界

### 调研目标

理解 The Zeroth 与 The One 的产品及系统边界，并重点回答：

1. The One 是什么产品，为谁解决什么问题？
2. Windows 与 macOS 工作机如何安装、授权、升级和卸载？
3. Multi-Agent Graph 的主体运行在 PC 本地还是云端？
4. 桌面应用、本地后端、Definition Space、MCP、模型 Provider 与云端控制平面如何协作？
5. 产品的维护状态、许可、商业依赖、安全边界和公开反馈如何？

### 覆盖范围

- 产品定位、目标用户、核心流程和功能边界。
- v0.3.10 Windows/macOS 安装包、签名、架构与账号要求。
- Definition Space、Graph、运行观察、memory、MCP 与 Provider。
- 本地执行、云端控制平面、模型数据流、分享与更新服务。
- 维护状态、商业条款、源码与许可边界。

### 明确排除

- 不进行逐文件源码审计、逆向工程或安全渗透测试。
- 不进行竞品比较、模型优劣比较或 Agent 框架选型矩阵。
- 不调研遥测、监控、站点分析或运营指标实现。
- 不下载和安装 v0.3.10，不运行模型，不验证官方服务价格优势。
- Linux 不作为本次工作 PC 的合格安装路径。

## 证据口径

- **直接事实**：来自官网、Quick Start、下载页、更新 YAML、产品文档、版本记录、隐私政策和服务条款。
- **架构推导**：用于解释桌面 UI、本地后端、Definition Space、Provider、MCP 与云端控制平面的关系；内部 IPC、数据库和进程结构未公开。
- **官方声明**：安装包签名、公证、官方模型服务价格与安全承诺来自 The Zeroth，自身未做独立验证。
- **公开反馈**：分享平台在本次快照中没有展示可下载 Space；GitHub 文档仓库读取不稳定，未取得足够 Issue、Discussion 或用户评价样本。
- **“未发现”边界**：未发现应用源码和许可证，不等于证明其永远不存在；当前只能按已公开材料将产品视为闭源。

## 产品调研

### 产品定位与目标用户

**一句话定位**：The One 是一款桌面优先的 Multi-Agent Graph 设计、运行、观察和演化工作台，把原本需要编码实现的多 Agent 协作结构产品化为可编辑的 Definition Space。

目标用户包括：

- 希望通过图形化方式设计复杂 Agent 协作结构的开发者和研究者。
- 需要让多个角色围绕本地代码、资料或项目目录协作的高级用户。
- 需要观察每个 Agent 的上下文、推理、工具调用和 token 使用的操作者。
- 希望复用、导入、导出和分享整套 Agent/Skill/MCP/Graph 架构的团队。
- 希望实验动态子 Graph、长期运行、自管理上下文和自我改进的 Agent 工程人员。

它不面向只需要简单聊天或单轮代码补全的普通用户。官方 0.1.0 文档也将早期目标用户描述为愿意探索 Multi-Agent 架构的开发者、研究者和高级用户。

### 核心流程

#### 安装与授权

1. 用户从官网下载安装包。
2. Windows 运行 x64 安装器；Apple Silicon Mac 打开 ARM64 DMG。
3. 首次启动登录 The Zeroth 账号。
4. 控制平面向桌面签发账号绑定的访问 token 和设备授权状态。
5. 用户选择官方模型服务，或配置自有 API Key/OAuth/兼容 Provider。
6. 桌面启动本地后端并进入 Definition Space。

#### 建立 Definition Space

1. 系统提供只读、由安装器管理的 Default Space。
2. 用户复制 Default Space，创建自己的可编辑副本，或导入 `.zerospace`。
3. 在 Space 中维护 Prompt/Profile、Skill、MCP、Agent Preset、Graph Blueprint 和 memory。
4. 用户可直接编辑文件，也可在 Atlas 可视化画布中编辑。
5. Definition 有独立版本、审计与回滚，不要求项目本身使用 Git。

#### 设计 Graph

1. 在画布中创建节点并绑定 Agent Preset。
2. 为节点追加专属 prompt。
3. 用边定义允许的通信关系和 handoff 说明。
4. 边的文字需要明确何时移交、传递什么以及期望产出。
5. 校验并保存可复用 Graph Blueprint。

#### 运行与观察

1. 在 Sessions 中选择 Graph Blueprint，并可选绑定本地项目路径。
2. Agent 根据 Graph、上下文和工具开始协作。
3. Work Chain 显示执行链路，Agent 名册显示状态、LLM/工具调用与 token 使用。
4. 操作者可查看消息、上下文、工具、共享数据和当前 Graph 拓扑。
5. 操作者可以随时向任意 Agent 补充上下文、回答问题、暂停、恢复或取消。
6. 用户可以编辑历史消息后重跑，或从某条消息 fork 出新的 Agent 节点。

#### 长期运行与演化

1. Agent 在上下文占用较高时调用 Meditation 压缩历史。
2. 可复用经验写入 Space 的 Markdown memory。
3. Capability Manager 在运行中发现 Skill、绑定 MCP 和惰性加载工具 schema。
4. Agent 可以创建子 Graph、创建或克隆 Agent 节点。
5. Self-Evolution Lab 用多角色 Graph 对重复失败进行诊断、修补、评审、测试、归档和回滚。

### 功能地图与边界

| 功能域 | 当前能力 | 主要边界 |
| --- | --- | --- |
| Agent 定义 | 独立模型、prompt、Skill、内置工具与 MCP | 配置复杂，错误权限可能扩大主机风险 |
| Graph | 节点、边、handoff、动态节点和子 Graph | 边是允许关系，不保证执行顺序或结果 |
| Definition Space | 隔离、复制、导入、导出、分享与 memory | 外部 Space 可能包含可执行资源 |
| Atlas | 可视化浏览与自然语言修改 Definition | Agent 自动修改定义需要依赖审计和回滚 |
| 运行观察 | Work Chain、拓扑、上下文、工具、token、共享数据 | 可观察不等于已安全隔离 |
| 人工介入 | 提问、确认、选择、补充上下文、暂停和取消 | 自进化内部循环刻意减少人工审批 |
| 长期运行 | Meditation、memory、热更新、append-only 历史 | 仍需实测长时间稳定性和恢复行为 |
| 模型 | 官方 OpenRouter 服务、API Key、OAuth、自定义兼容端点 | 模型内容受相应 Provider 条款约束 |
| 扩展 | 本地 stdio MCP、远程 HTTP MCP、Skill、桌面控制 | 可执行命令、环境变量和远端 token 风险高 |
| 分享 | `.zerospace` 上传、下载、深链导入和预览 | 社区生态在本次快照中尚未形成可见规模 |

The One 当前不是：

- 纯云端 Multi-Agent SaaS；核心执行和项目工作在桌面本地。
- 完全离线的桌面软件；登录、授权、订阅和官方 Provider 依赖云端。
- 开源 Agent Runtime；当前公开入口只指向文档仓库。
- 有公开强沙箱保证的自主执行环境。
- 已证明可以无人值守稳定运行关键生产任务的成熟平台。

## 技术架构调研

### 系统全貌与运行形态

| 组件 | 运行位置 | 主要职责 |
| --- | --- | --- |
| The One Desktop UI | Windows/macOS 工作机 | Definition、Atlas、Graph、Session、观察、设置和更新 |
| 本地后端 Runtime | 工作机本地 | Agent cycle、Graph 生命周期、工具、MCP、项目操作、历史与日志 |
| Definition Space | 工作机本地文件与应用状态 | Prompt、Skill、MCP、Agent、Graph、请求和 Markdown memory |
| Agent Runtime | 本地后端 | ReAct、handoff、TaskBoard、Meditation、动态 Graph 和自进化 |
| MCP Runtime | 本地进程或远程服务 | stdio command、Streamable HTTP、Resources、Prompts 与工具 |
| 模型 Provider | 网络远端或企业端点 | 模型推理；官方路径基于 OpenRouter，也支持自有连接 |
| The Zeroth 控制平面 | 云端 | 账号、Clerk 登录、桌面授权、token、订阅、权益和 Provider 配置分发 |
| 分享平台 | 云端 | `.zerospace` 上传、检索、下载和深链导入 |
| 更新服务 | Cloudflare/对象存储 | 更新 YAML、签名安装包、SHA-512 与应用内更新 |

官方没有公开桌面技术栈、本地后端语言、数据库、内部端口或 UI 与 Runtime 的具体 IPC。报告不从安装包命名反推实现。

### 主体功能运行位置判定

**判定：符合，但云端授权是必要辅助依赖。**

以下主体能力位于 PC：

- Definition Space 与本地项目工作区。
- Graph 设计、Agent 实例和运行状态。
- 本地后端 Runtime、工具执行和 MCP stdio 进程。
- 会话、Work Chain、日志、配置和运行观察。
- Markdown memory、definition 历史、版本与回滚。
- Provider 请求的客户端发起与响应接收。

云端承担：

- 登录认证、桌面访问 token 和设备授权。
- 订阅、账单、额度、权益与官方模型服务配置。
- 加密 Provider key 材料与相关限制元数据。
- 分享平台、更新元数据与安装包。

模型推理位于：

- 官方模型服务：桌面直接调用 OpenRouter/所选模型。
- 第三方 Provider：桌面直接调用 OpenAI、Anthropic、Google 或兼容端点。
- 企业兼容网关：桌面调用用户配置的 `/v1` Base URL。

The Zeroth 当前不托管客户 prompt 的模型中转服务，但这不代表 prompt 不出本机；它会直接到用户选择的模型 Provider。

### 核心技术链路

#### 启动与授权链路

1. Desktop 启动并读取本地授权状态。
2. 用户通过 Clerk/The Zeroth 账号完成登录。
3. 控制平面签发或刷新桌面访问 token、设备授权和权益。
4. Desktop 启动本地后端 Runtime。
5. 应用加载受管 Default Space 或用户选中的 Definition Space。
6. 本地 Runtime 根据 Provider 配置准备模型连接。

#### Graph 执行链路

1. 用户选择 Graph 与项目路径。
2. Runtime 根据 Blueprint 创建 Agent 节点与允许通信的边。
3. 入口 Agent 接收用户任务，执行推理、工具、观察和后续推理。
4. Agent 按自身判断沿允许边 handoff、唤醒节点或创建子 Graph。
5. 工具直接作用于本地项目、MCP server 或外部服务。
6. 运行事件进入 append-only 历史，并通过 Desktop 实时呈现。
7. 用户可从 UI 介入、暂停、恢复、取消或修改历史分支。

#### Provider 调用链路

1. Agent 或全局 Default Model 选择具体连接。
2. Desktop/本地 Runtime 从本地或控制平面取得相应授权材料。
3. 客户端直接向 OpenRouter、第三方 Provider 或企业网关发送请求。
4. Provider 的流式内容、推理摘要和工具调用返回本地 Runtime。
5. The Zeroth 控制平面不接收这条链路中的 prompt 与模型响应。

#### MCP 链路

1. 本地 stdio MCP 使用 command、args、环境变量和独立工作目录启动。
2. 远程 MCP 通过 Streamable HTTP、headers 或 Bearer token 连接。
3. 每个 MCP server 维持持久会话，支持 Tools、Resources 与 Prompts。
4. Agent 可以在运行时绑定 Server，并在下一个 cycle 获得其工具。
5. 完整工具 schema 按需加载，以降低上下文占用。

### 主要依赖

#### Windows

- x64 工作机。
- 约 160 MB 的签名 EXE 安装包。
- The Zeroth 账号与桌面授权。
- 官方模型服务或自有 Provider。
- 本地项目、Definition Space、日志和 MCP 工作目录的读写权限。
- 登录、授权、模型、更新和分享所需网络。

#### macOS

- Apple Silicon（M 系列）Mac。
- 约 195 MB 的签名、公证 DMG。
- The Zeroth 账号与桌面授权。
- 官方模型服务或自有 Provider。
- 本地项目和应用数据的读写权限。
- 登录、授权、模型、更新和分享所需网络。

官方文档没有给出最低 Windows/macOS 版本、内存、磁盘余量、代理要求或企业证书要求。

### 接口与通信方式

- **Desktop GUI**：Graph、Definition、Atlas、Session、设置、诊断和更新。
- **本地 UI ↔ Runtime**：存在本地后端控制、重启与热更新，但具体 IPC/API 未公开。
- **模型 HTTPS**：客户端直接调用官方或第三方 Provider。
- **MCP stdio**：启动本地命令并通过持久进程会话交换工具消息。
- **MCP Streamable HTTP**：连接远程 MCP Server。
- **控制平面 HTTPS**：登录、OAuth、token、桌面授权、账单和权益。
- **分享平台 HTTPS**：上传和下载 `.zerospace`。
- **更新 YAML/资产**：客户端读取 `latest-mac.yml` 或 `latest.yml` 并下载签名构建。

### 持久化方式

| 数据 | 位置/介质 | 说明 |
| --- | --- | --- |
| Definition Space | 本机应用数据与可浏览文件 | Agent、Prompt、Skill、MCP、Graph 与请求 |
| Memory | Space 内纯文本 Markdown | 可读、可编辑，随 Space 导入导出 |
| 运行历史 | 本地 append-only 历史 | 事件发布事务化，并提供恢复与回滚语义 |
| 项目文件 | 用户选择的本地目录 | 工具和 Agent 可直接工作 |
| MCP 工作目录 | 应用专属 `mcp-workspace` 或用户指定目录 | 未指定目录的 stdio Server 默认隔离到自己的目录 |
| 桌面设置与授权 | 设备本地 + 云端授权记录 | 具体本地路径和加密方式未公开 |
| 账号、订阅和额度 | The Zeroth 控制平面 | Clerk 身份、访问 token、设备授权和账单状态 |
| Provider key 材料 | 本地/控制平面组合 | 控制平面可能保存加密 key 材料并分发给桌面 |
| 可分享 Space | `.zerospace` 包 | 可本地导入导出或上传分享平台 |

## 部署形态

### Desktop 模式

- 唯一正式产品运行形态。
- Windows x64 与 macOS ARM64 本地安装。
- 本地 Runtime 直接访问项目、MCP 与模型 Provider。
- 需要账号授权，不是免登录桌面工具。

### 云端控制平面

- 不承担 Graph 主体执行。
- 提供账号、授权、计费、权益、Provider 配置、分享和更新。
- Clerk、支付服务商、Vercel、Google Cloud、Cloudflare/对象存储等第三方参与运行。

### 企业自有 Provider

- 可以配置 OpenAI-compatible `/v1` Base URL。
- 模型费用与数据流进入企业或第三方 Provider，不消耗官方模型服务额度。
- Desktop 授权是否可以在完全隔离网络中持续有效，官方未说明。

## 工作机安装（Windows / macOS）

### Windows

**判定：官方支持，x64 安装包已签名。**

当前安装包：

- 文件：`The-One-Setup-0.3.10-x64.exe`
- 版本：0.3.10
- 发布：2026-07-14
- 大小：167,687,072 bytes（官网显示约 159.9 MB）
- SHA-512：由下载页与 `latest.yml` 同时发布

安装流程：

1. 从官方更新域名下载固定版本 EXE。
2. 对照下载页或 `latest.yml` 校验 SHA-512。
3. 检查 Windows 文件属性中的数字签名与发布者。
4. 运行安装器并启动 The One。
5. 登录控制台，授权桌面访问。
6. 选择官方模型服务或配置自有 Provider。
7. 复制 Default Space 或导入自己的 Space，运行第一个 Graph。

权限与网络：

- 需要应用数据、项目目录与 MCP 工作目录权限。
- 本地 stdio MCP 可能启动任意用户配置的命令。
- 需要访问账号、控制平面、Provider、更新和可选分享服务。

升级：

- 应用启动后自动检查更新，也支持手动检查。
- 更新下载完成后可在 About 菜单安装。
- 更新元数据包含签名构建、SHA-512、大小和发布日期。

卸载：

- 官方文档未提供专门的 Windows 卸载与数据清理清单。
- 可通过 Windows 应用管理卸载程序，但本地 Space、运行历史、授权和 MCP 数据是否保留需要实机确认。
- 删除任何本地数据前应先导出需要保留的 `.zerospace` 和诊断信息。

### macOS

**判定：官方支持 Apple Silicon；Intel Mac 不符合当前桌面安装要求。**

当前安装包：

- 文件：`The-One-0.3.10-arm64.dmg`
- 版本：0.3.10
- 发布：2026-07-14
- 大小：204,296,569 bytes（官网显示约 194.8 MB）
- SHA-512：由下载页与 `latest-mac.yml` 同时发布

安装流程：

1. 从官方更新域名下载 ARM64 DMG。
2. 校验 SHA-512。
3. 打开 DMG，按标准 macOS 应用安装流程安装。
4. 首次启动检查 Gatekeeper 结果、签名和公证状态。
5. 登录控制台并授权桌面访问。
6. 配置模型来源，建立或导入 Definition Space。

架构限制：

- 当前只支持 Apple Silicon。
- 官网明确说明 Intel 版本暂未提供。
- 没有终端版或其他 Intel Mac 替代安装路径。

升级与卸载：

- 应用内提供自动检查和一键安装更新。
- 官方未给出 macOS 应用数据目录和完整卸载步骤。
- 删除应用包不一定会删除 Space、历史、缓存、授权和 MCP 工作目录，应先备份并实测残留。

## 云端服务与商业依赖

### 账号与授权

- 桌面访问绑定 The Zeroth 账号。
- 控制平面处理 OAuth 状态、桌面访问 token、过期时间和设备授权。
- 账号、授权或控制平面不可用时的离线宽限期未公开。

### 官方模型服务

- 基于 OpenRouter。
- 无需用户自行准备 API Key。
- Starter：20 美元/月。
- Pro：60 美元/月。
- Max：200 美元/月。
- 所有套餐产品功能相同，主要区别是官方模型容量。
- 20 美元用量包按 1.25 倍速计量，额度在账号有效期间不过期。

### 自有 Provider

- OpenAI API Key。
- OpenAI Codex OAuth。
- Anthropic API Key 或 Claude Code OAuth。
- Google Gemini API Key 或相关订阅 OAuth。
- 任意 OpenAI-compatible `/v1` 端点。

自有 Provider 调用不消耗 The Zeroth 官方额度，但没有证据表明可以免除桌面订阅或账号授权。

## 安全、隐私与许可边界

### 有利因素

- macOS 签名并公证，Windows 完成代码签名。
- 下载页和更新元数据发布 SHA-512。
- 模型请求不经过 The Zeroth 托管中转。
- 本地文件默认留在设备上。
- Graph 运行、上下文和工具调用高度可见。
- 外部 Space 导入前展示结构与可疑脚本。
- 导出时清理明显敏感的 MCP 字段。
- Definition 修改支持预览、审计、版本和回滚。
- 写和远程变更按顺序执行，只有明确标记安全的工具才并行。

### 关键风险

1. **无公开 OS 沙箱模型**：文档没有说明 Windows/macOS 的进程、文件、网络或系统调用隔离。
2. **默认高权限 MCP**：Computer Use Harness 可观察屏幕、点击、键入和驱动浏览器。
3. **自动能力发现**：内置 Agent 使用 `mcp:*`，新增 Server 会在下一个 cycle 自动进入能力面。
4. **外部 Space 供应链**：`.zerospace` 可包含 Skill、MCP 和执行结构，预览无法替代代码审查。
5. **动态自修改**：Agent 可修改 Definition、挂载能力、创建节点和运行子 Graph。
6. **自进化减少人工审批**：官方称内部 reviewer/tester/rollback 替代人类，但安全边界尚未独立验证。
7. **项目路径权限**：未指定项目路径时 Agent 可以自行决定工作位置，可能扩大文件访问范围。
8. **加密 key 材料分发**：控制平面可能处理并向桌面分发 Provider 访问材料，具体加密、轮换和撤销实现未公开。

### 数据边界

The Zeroth 控制平面可能处理：

- 账号、邮箱、显示名称和登录状态。
- 桌面访问 token、过期时间和设备授权。
- 订阅、支付、额度和权益。
- Provider key 标识、加密 key 材料、限制和重置元数据。
- 服务日志、安全事件和诊断信息。

桌面与模型 Provider 之间直接传输：

- prompt、模型输入与输出。
- Agent 上下文、选中的文件内容和工具结果。
- 对应 Provider 处理请求所需的其他数据。

### 运营与合同主体

- 隐私政策与条款均声明 The Zeroth 当前由独立个人开发者运营。
- 在成立法律实体之前，服务由个人运营者承担。
- 对企业采购而言，这会影响合同、发票、数据处理协议、支持 SLA、责任承担和持续经营评估。

### 源码与许可

- 官网公开 GitHub 链接明确标注为文档仓库。
- 未发现 The One Desktop 或本地 Runtime 的源码仓库。
- 未发现适用于桌面应用的 Apache、MIT、GPL 等开源许可证。
- 服务条款禁止逆向受保护组件。

结论：**The One 应按闭源商业桌面软件评估；文档公开不等于应用开源。**

## 维护状态、版本演进与生态

### 当前版本

- 最新稳定构建：0.3.10。
- 更新元数据发布日期：2026-07-14。
- macOS 与 Windows 资产同时发布。
- 应用支持启动自动检查、手动检查和下载后安装。

### 方向性演进

- **0.1.0**：Definition 仓储、Graph 编辑、本地项目运行、观察、TaskBoard 和人工介入。
- **0.2.0**：多 Provider、多个独立 Definition Space、`.zerospace` 分享与 Graph 语义。
- **0.3.0**：Meditation、Space memory、运行时能力扩展、动态子 Graph、Atlas、自进化和更可靠的历史/事件模型。

### 版本治理边界

- 当前安装包已经到 0.3.10。
- 公开 Release Notes 只列出 0.1.0、0.2.0、0.3.0。
- 0.3.1–0.3.10 的修复、兼容性变化和安全变更没有逐版公开说明。
- 最低操作系统版本、数据迁移策略和回滚支持没有集中发布。

综合判断：**产品更新活跃、方向明确，但发布治理仍偏早期。**

### 生态与公开反馈

- 官方分享平台用于交换完整 Definition Space。
- 本次快照中分享平台显示“暂无匹配的分享空间”，尚不能证明存在活跃社区内容供给。
- 官网提供中英文文档和支持邮箱。
- 未取得足够 GitHub Issue、Discussion、第三方评测或用户评论样本。
- 不能从官网演示推导真实任务成功率、长期稳定性或采用规模。

## 未决项与证据边界

1. **最低系统要求**：Windows/macOS 最低版本、内存、磁盘和 GPU 要求未公开。
2. **Intel Mac**：当前明确无安装包，也没有替代运行路径。
3. **离线授权**：账号服务不可用时能否启动、宽限多久、能否仅使用自有 Provider 未公开。
4. **本地数据目录**：Space、历史、日志、MCP 和授权数据的具体路径未公开。
5. **卸载清理**：Windows/macOS 的程序与数据清理范围未说明。
6. **本地 Runtime 架构**：语言、数据库、IPC、端口、进程所有权和崩溃恢复实现未公开。
7. **OS 沙箱**：没有可确认的 Windows/macOS 强隔离或权限矩阵。
8. **签名实测**：未验证 v0.3.10 的证书链、时间戳、公证票据和撤销状态。
9. **版本记录**：0.3.1–0.3.10 没有公开逐版 Release Notes。
10. **应用许可**：未发现桌面应用源码和许可证，需要官方提供商业 EULA 或采购许可说明。
11. **企业合同**：当前由个人运营，需确认签约、DPA、发票、支持和责任主体。
12. **公开反馈**：社区 Space、Issue 和独立用户反馈样本不足。

## 后续验证建议

若 The One 进入候选验证，建议进行以下小范围实测：

1. **Windows 安装验证**：检查 EXE 发布者、证书链、时间戳、SmartScreen、更新签名和卸载残留。
2. **macOS 安装验证**：检查 `codesign`、notarization、Gatekeeper、更新与应用数据残留。
3. **账户中断验证**：登录后断网、token 过期、控制平面不可用时测试启动和自有 Provider。
4. **网络边界验证**：记录登录、授权、官方 Provider、自有 Provider、分享和更新的实际目标域名。
5. **主机权限验证**：在测试项目中检查本地工具、MCP、Computer Use、未指定项目路径和动态能力挂载。
6. **外部 Space 审查**：导入一个测试 `.zerospace`，验证敏感字段清理、脚本提示、MCP 自动绑定和回滚。
7. **数据与恢复验证**：定位所有本地目录，测试导出、备份、崩溃恢复、版本迁移和完整删除。
8. **长期运行验证**：运行多小时 Graph，观察 Meditation、动态子 Graph、事件恢复和 token/成本。
9. **商务核验**：要求官方提供 EULA、许可范围、签约主体、DPA、支持承诺和安全响应流程。

## 主要证据锚点

- [The Zeroth 中文官网](https://the-zeroth.com/zh)
- [The One 下载页](https://the-zeroth.com/zh/download)
- [macOS 更新元数据](https://updates.the-zeroth.com/desktop/mac/latest-mac.yml)
- [Windows 更新元数据](https://updates.the-zeroth.com/desktop/win/latest.yml)
- [Quick Start](https://the-zeroth.com/zh/docs/start/quick-start)
- [模型与价格](https://the-zeroth.com/zh/docs/start/models-and-pricing)
- [公开 Release Notes](https://the-zeroth.com/zh/docs/start/release-notes)
- [The One 0.3.0 Release Notes](https://the-zeroth.com/zh/docs/start/release-notes/0-3-0)
- [The One 0.2.0 Release Notes](https://the-zeroth.com/zh/docs/start/release-notes/0-2-0)
- [The One 0.1.0 Release Notes](https://the-zeroth.com/zh/docs/start/release-notes/0-1-0)
- [Definition Space](https://the-zeroth.com/zh/docs/the-one-app/definition-space)
- [Graph](https://the-zeroth.com/zh/docs/the-one-app/definition-space/graph)
- [MCP](https://the-zeroth.com/zh/docs/the-one-app/definition-space/mcp)
- [运行与观察](https://the-zeroth.com/zh/docs/the-one-app/run)
- [设置](https://the-zeroth.com/zh/docs/the-one-app/settings)
- [Space 管理](https://the-zeroth.com/zh/docs/the-one-app/settings/space-management)
- [API 配置](https://the-zeroth.com/zh/docs/the-one-app/settings/api-configuration)
- [分享平台](https://the-zeroth.com/zh/spaces)
- [隐私政策](https://the-zeroth.com/zh/privacy)
- [服务条款](https://the-zeroth.com/zh/terms)
- [官方文档索引 llms.txt](https://the-zeroth.com/llms.txt)
- [GitHub 文档仓库](https://github.com/the-zeroth/the-zeroth-docs)
