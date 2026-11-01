# Raft 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-27 22:45:40
> evidence_window: 2026-07-27；Raft 1.0 官网、公开文档、CDN `raft-computer` 1.0.14、npm 与 GitHub 公开快照

## 交付结论

1. **有条件符合本 RUNBOOK 的“工作 PC 为主体执行环境”要求。** Raft 的消息、任务和团队空间由托管 Web 服务提供，真正读取文件、运行命令和调用 coding-agent runtime 的过程由用户电脑上的 `raft-computer` 完成；模型请求由本地 runtime 直接连接用户自己的 provider。它不是纯本地产品，也不是当前可自托管的完整调度中心。
2. **产品定位**：Raft 是面向人类与 AI Agent 混合团队的协作平台。它以频道、私信、线程、任务、成员和提醒为公共工作面，把 Claude Code、Codex CLI、Gemini CLI、OpenCode 等本地 runtime 包装为具有长期身份、工作区和记忆的团队成员。
3. **主体架构是“托管 Web/PWA + Raft 云端协作控制面 + 本地 Computer 服务 + 本地 runtime/provider”。** Web 端管理服务器、成员、消息和任务；本地 Computer 负责 Agent 进程生命周期、消息投递、崩溃恢复和工作区；runtime 负责推理与工具执行。
4. **macOS 安装链路已较明确。** CDN 1.0.14 提供 Apple silicon 与 Intel 两种自包含二进制；安装器写入 `~/.local/bin`，不要求 Node.js，并执行压缩包及解压后双重 SHA-256 校验、平台校验。manifest 还提供 Developer ID 签名和 Apple 公证证据。
5. **Windows x64 已有原生资产，但官方口径尚未收敛。** CDN manifest 和 `install.ps1` 已提供 Windows x64 自包含 EXE，支持 PowerShell 5.1+，安装到用户目录；同日 onboarding 文档仍写“没有 native Windows app、使用 WSL”，Computers 文档又把 Windows 称为 transitional daemon，并要求保持进程窗口。若验收标准要求“官方稳定支持的 Windows 后台服务”，当前不能仅凭安装资产判定通过，必须实机验证。
6. **标准版依赖 Raft 托管服务。** 官网 Enterprise 的 private deployment、SSO 和高级访问控制仍标记为 Coming soon。当前服务器、消息、附件、任务和服务端元数据由 Botiverse 处理，服务器位于美国；本地代码、文件、终端输出和 Agent workspace 按隐私政策留在用户电脑，除非 Agent 明确把内容发送到 Raft。
7. **本地权限面取决于所选 runtime，公开资料未证明存在 OS 沙箱。** Agent workspace 彼此分目录，Member/Admin 控制的是 Raft 服务端操作权限；本地 runtime 仍以当前用户身份读写文件和执行工具。目录隔离不能外推为进程、网络或凭据隔离。
8. **产品迭代活跃但仍处在快速迁移期。** 官网已宣布 Raft 1.0，CDN Computer 为 1.0.14，公开文档在调研当日仍持续更新；但旧 npm `raft-computer`、新 SEA 分发、legacy daemon、Windows 过渡流程和文档存在多套版本语义。建议先完成 Windows/macOS 双机 PoC，再进入团队生产使用。

## 调研目标、范围与边界

### 调研目标

理解 Raft 如何把不同 coding-agent runtime 组织为可持续工作的团队成员，并判断它能否在 Windows/macOS 工作机上安装、以本地 PC 为工具执行主体，同时明确托管服务、数据和权限边界。

### 核心问题

- Raft 的目标用户、核心工作流和功能边界是什么？
- Web 服务、Raft Server、Computer、本地 Agent runtime 与模型 provider 如何协作？
- Windows/macOS 的当前安装资产、架构、依赖、权限、运行与卸载边界是什么？
- Agent 的身份、会话、workspace、记忆、任务和提醒分别保存在哪里？
- 多 Agent 如何领取任务、并行工作、交接与审查？
- 当前版本、公开源码、维护活动和文档一致性反映了什么成熟度？

### 覆盖范围

- Raft 1.0 官网、Pricing、FAQ、Privacy Policy 和公开产品文档。
- CDN 最新 `raft-computer` manifest、macOS/Linux Shell 安装器与 Windows PowerShell 安装器。
- 公开的 Server、Computer、Agent、Runtime、Workspace、Lifecycle、Task、Reminder 和 External Agent 文档。
- npm `@botiverse/raft`、旧 `@botiverse/raft-computer` 元数据，以及 Botiverse GitHub 组织和 `raft-docs` 仓库快照。
- Windows x64、macOS arm64/x64 的终端用户安装与本地执行边界。

### 明确排除

- 不安装、运行、注册或登录 Raft，不连接真实代码仓库、模型账号、API Key 或团队数据。
- 不做性能、并发、可靠性、安全合规、渗透或 SLA benchmark。
- 不审计未公开的 Raft 服务端、Computer 或核心 CLI 源码，不猜测数据库、队列和网络协议实现。
- 不做竞品排名或最终采购决策。
- 不把官网 testimonials、组织 Logo 或第一方博客直接当作独立采用率与质量证据。

## 证据口径

- **官网与 FAQ**用于确认产品定位、当前商业计划和公开承诺；宣传性收益不视为实测结果。
- **公开文档**用于确认对象模型、工作流、生命周期和用户可见行为；与实际分发资产冲突时，冲突本身作为未决项保留。
- **CDN manifest 与安装器**用于确认当前版本、操作系统/CPU 资产、安装目录、校验机制和基础依赖；存在资产不等于已完成稳定性验收。
- **隐私政策**用于确认 Botiverse 声明的数据边界、第三方处理和服务器地域，不等同于独立安全审计。
- **npm/GitHub 元数据**只描述公开分发和公开源码面。核心仓库 `botiverse/slock` 未出现在公开组织仓库列表，GitHub API 公开访问返回 404；因此无法进行源码级架构核验。
- **公开反馈**不足：可见 testimonials 均来自产品官网，公开 GitHub 主要是文档与周边项目，不能代表核心产品 Issue 情况或真实生产成熟度。
- **未实机验证项**一律标记为未决，不将文档描述外推为运行表现。

主要证据入口：

- [Raft 官网](https://raft.build/)
- [Raft 文档](https://docs.raft.build/welcome/)
- [首次连接 Computer](https://docs.raft.build/meet-your-onboarding-agent/)
- [Computers](https://docs.raft.build/features/server/computers/)
- [Agent Basics](https://docs.raft.build/features/agents/)
- [Runtime](https://docs.raft.build/features/agents/runtime/)
- [Workspace](https://docs.raft.build/features/agents/workspace/)
- [Lifecycle](https://docs.raft.build/features/agents/lifecycle/)
- [Tasks](https://docs.raft.build/features/collaboration/tasks/)
- [Reminders](https://docs.raft.build/features/agents/reminders/)
- [External Agents](https://docs.raft.build/features/agents/external/)
- [跨设备访问](https://docs.raft.build/raft-on-every-device/)
- [Privacy Policy](https://raft.build/privacy/)
- [`raft-computer` 最新 manifest](https://cdn.raft.build/computer/manifest.json)
- [macOS/Linux 安装器](https://cdn.raft.build/computer/install.sh)
- [Windows 安装器](https://cdn.raft.build/computer/install.ps1)
- [`@botiverse/raft` npm 包](https://www.npmjs.com/package/@botiverse/raft)
- [`@botiverse/raft-computer` npm 包](https://www.npmjs.com/package/@botiverse/raft-computer)
- [Botiverse GitHub 组织](https://github.com/botiverse)
- [`raft-docs` 公开仓库](https://github.com/botiverse/raft-docs)

## 产品调研

### 产品定位与目标用户

Raft 不是新的基础模型或单一 coding agent，而是 Agent 团队协作层。它让不同 runtime 驱动的 Agent 以成员身份进入同一个 Server，在频道、线程、私信和任务板中持续工作，并把人类保留在方向设定、反馈和最终审批位置。

目标用户可从公开流程归纳为：

- 已使用 Claude Code、Codex CLI、Cursor CLI、Gemini CLI、OpenCode、Kimi Code 或 Pi，希望统一组织多个 Agent 的个人与团队。
- 需要让 Agent 跨任务保持身份、记忆、workspace 和领域分工的开发者或知识工作者。
- 希望把讨论、任务领取、进度、审查和交接放在同一消息上下文中的团队。
- 需要 Agent 在个人工作机、团队服务器或云 VM 上长时间运行，同时从浏览器和手机查看状态的用户。
- 已有自定义 Agent，希望通过 CLI 将其接入协作空间的开发者。

### 核心流程

1. 用户在 `app.raft.build` 创建一个 Server；Server 是频道、私信、Agent、人类、Computer、任务和文件的顶层容器。
2. 用户在 macOS/Linux 终端或 Windows PowerShell/过渡环境安装 `raft-computer`，通过设备登录把机器连接到 Server。
3. Computer 扫描机器上已安装的 runtime；用户选择 runtime、provider 和 model，创建首个 onboarding Agent 或其他 Agent。
4. Raft 为 Agent 创建长期身份、频道成员关系和本地 workspace，并由 Computer 启动对应 runtime 进程。
5. 人类把消息转换为 Task，或直接发送 Task；Agent 领取任务，状态从 `todo` 进入 `in progress`，在任务线程中持续回报。
6. Agent 在本地 workspace 中读取文件、克隆仓库、运行命令和生成产物；runtime 使用用户自己的订阅或 API Key 直接连接 provider。
7. 完成后 Agent 将 Task 置为 `in review`；人类或队友复核并标记 `done`，不满意则在线程中反馈，Agent 从已有上下文继续。
8. 多 Agent 可以拆分子任务、领取不同工作、互相 @mention 和交接；任务的单一 owner 语义用于减少重复领取。
9. Reminder 可在未来时间或周期触发 Agent；只要对应 Computer 在线，Agent 会被唤醒继续工作。
10. 用户通过任意现代浏览器或手机 PWA 查看同一消息、任务和历史；本地执行仍发生在承载 Agent 的 Computer 上。

### 功能地图与边界

**当前公开能力：**

- **统一协作空间**：Server、频道、私信、线程、@mention、消息、附件、成员与搜索。
- **任务治理**：Task 编号、`todo`、`in progress`、`in review`、`done`、`closed` 状态、单 owner、任务线程和频道任务板。
- **持久 Agent**：名称、描述、频道成员关系、runtime 配置、长期 workspace、记忆、活动视图和状态指示。
- **多 runtime**：Claude Code、Codex CLI、Antigravity CLI、Copilot CLI、Cursor CLI、Gemini CLI、Kimi Code、OpenCode 和 Pi；同一 Server 可混用。
- **生命周期管理**：启动、停止、idle/active、重启、会话重置、完整重置、崩溃恢复和 Computer 重连。
- **主动跟进**：一次性或周期 Reminder，支持更新、延后、取消与历史查看。
- **多 Computer**：Laptop、Desktop 或 Cloud VM 可加入同一 Server，每台机器承载自己的 Agent 与 workspace。
- **外部 Agent**：实验性 CLI 接入，可将 Hermes、独立 Claude Code 或自定义 Agent 作为完整成员连接。
- **跨设备 UI**：桌面和移动浏览器，iOS/Android 通过 PWA 添加到主屏幕，并支持 Push Notification。

**当前边界：**

- Agent 只在它加入的频道中稳定接收消息；频道成员关系同时是上下文和可见性边界。
- Agent workspace 与特定 Computer 绑定，当前不能迁移到另一台 Computer。
- Computer 离线时，该机器上的 Agent 停止；“持续在线”需要电脑持续运行，或把 Agent 放在云 VM。
- Runtime 的工具、模型、成本和登录由对应 provider/CLI 决定，Raft 不提供统一模型额度。
- External Agents 明确标记为 Experimental，活动状态可能不准确；独立 Claude Code 接入还需要 development channel 参数。
- Agent 成员角色分为 Member 与 Admin；Admin 可管理部分 Server 结构，Server owner 必须是人类。
- 现有 Free 计划只保留 30 天消息历史并限制每月 100 MB 上传；Pro 年付页面显示每个人类 1 seat、每个 Agent 0.1 seat。
- Private deployment、SSO 和高级访问控制仍属于 Enterprise Coming soon，当前不能当作已交付能力。

### 维护状态与版本演进

- 官网顶部已宣布 **Raft 1.0**。
- 2026-07-27 CDN 最新 `raft-computer` 为 **1.0.14**，manifest 提供 macOS arm64/x64、Linux arm64/x64 和 Windows x64 资产。
- 同日公开文档仍在更新；`raft-docs` 最近提交涉及开发者接入、onboarding 和当前 UI 行为修正，说明产品与文档都处于高频迭代。
- 旧 npm `@botiverse/raft-computer` 的 latest 为 0.0.70，安装器明确说明 npm 全局分发已被 SEA 自包含二进制取代。
- Agent-facing `@botiverse/raft` CLI 的 npm latest 为 0.0.17；它与 Computer 的 1.0.x 版本不是同一版本线。
- 安装器注释记录过 manifest 解析、平台误分发和 macOS signing pipeline 的历史修复。当前脚本已增加目标 body 解析、双重哈希和平台/架构检查，但仍应在受控测试机验证升级与回滚。
- 没有公开核心 Changelog、核心仓库或稳定版 Release 页面可用于建立完整版本时间线。

### 生态与公开反馈

- **Runtime 生态**：覆盖多种主流 coding-agent CLI，并允许同一团队混用模型与 provider。
- **扩展入口**：`raft` CLI、External Agent device login、Hermes bridge、Claude Code channel plugin 和 Login with Raft 开发者能力。
- **公开源码面**：文档、外部 Agent 插件、示例和周边项目可见；核心 Raft Server、Computer 与 CLI 指向的 `botiverse/slock` 仓库不在公开仓库列表。
- **第一方反馈**：官网展示多位用户对共享 Agent、跨成员复用与多 Agent 协作的评价；这些内容可以解释使用场景，不能证明采用规模或可靠性。
- **独立反馈不足**：没有可核验的核心产品公开 Issue 入口或足量第三方评测，因此不归纳普遍口碑。

## 技术架构调研

### 系统全貌与运行形态

```text
桌面/移动浏览器或 PWA
        |
        | HTTPS、登录、消息、任务、附件、管理操作
        v
Raft 托管协作服务（美国）
  Server / Members / Channels / DMs / Threads / Tasks / Files / Reminders
        |
        | Computer 长连接与设备授权；具体协议未公开
        v
用户工作机或云 VM
  raft-computer 1.0.14（本地后台服务）
    +-- Agent 进程生命周期与崩溃恢复
    +-- Runtime 探测、启动、休眠与唤醒
    +-- 每 Agent 独立 workspace
    +-- 消息投递与结果回传
        |
        +-- Claude Code / Codex CLI / Gemini CLI / OpenCode / ...
        +-- 用户自己的模型订阅、API Key 与外部工具
```

该形态是“云端协作控制面 + 本地 Agent 执行面”。浏览器可以在任意设备打开，但 Agent 并不在浏览器内执行；Computer 也不是完整 Raft Server 的本地副本。

### 主要组件与职责

- **Raft Web/PWA**：Server、频道、私信、线程、任务板、Agent/Computer 管理、workspace 浏览、通知与审批入口。
- **Raft 托管服务**：账号、Server、成员、消息、附件、任务、提醒和服务端元数据的权威协作面。
- **`raft-computer`**：连接机器到 Server，管理 Agent 进程，投递消息，回传结果，处理 idle/wake、重启和崩溃恢复。
- **Managed Agent**：由 Computer 启动，在指定机器和 workspace 中运行，由 Raft 管理生命周期。
- **Runtime**：真正执行推理、文件读取、命令和工具调用的 coding-agent CLI；直接连接其 provider。
- **Agent Workspace**：机器上的长期目录，保存记忆、草稿、脚本、克隆仓库和知识文件。
- **`raft` CLI**：Agent 面向 Server 的消息、任务、搜索、提醒和身份接口，也用于 External Agent 登录与接入。
- **External Agent Bridge**：由用户自己管理 runtime，通过 CLI/device authorization 接入 Raft；不由 Computer 统一托管。

### 核心技术链路

#### Managed Agent 任务链路

1. 用户或 Agent 在频道中创建 Task。
2. Agent 领取 Task，服务端记录 owner 与状态，其他 Agent 看到已领取后转向其他工作。
3. Raft 服务将消息或唤醒信号送到承载 Agent 的 Computer。
4. Computer 激活本地 runtime；runtime 在 Agent workspace 中执行文件、命令和工具操作。
5. Agent 将进度和结果显式发送回 Task thread，并把状态置为 `in review`。
6. 人类或其他成员复核；通过后标记 `done`，否则在线程追加反馈并再次唤醒 Agent。

公开资料确认了单 owner 和 claim-failure 行为，但没有公开抢占事务、锁、幂等键或队列实现，不能把产品语义外推为数据库级原子性证明。

#### 生命周期与长任务

1. Agent 无任务时进入 idle，进程保持但使用较少资源。
2. 新消息、@mention 或 Reminder 触发 active。
3. Computer 负责启动、停止、休眠、唤醒和崩溃恢复。
4. Restart 保留 runtime session；Session reset 清除对话上下文但保留 workspace；Full reset 同时清除上下文和 workspace。
5. Computer 离线时 Agent 停止，机器恢复连接后继续可用。

#### External Agent 链路

1. 人类在 Raft 创建 External Agent。
2. 本地安装 `@botiverse/raft` CLI，并通过 `raft agent login` 发起 device authorization。
3. 人类在浏览器批准，CLI 获得 Agent 身份凭据并通过 `RAFT_PROFILE` 选择身份。
4. Hermes、Claude Code channel plugin 或自定义进程调用 `raft` CLI 读取消息、领取任务和回传结果。
5. Hermes bridge 只接收不含消息正文的 wake hint，再由 Agent 主动通过 CLI 拉取实际内容。

### 主要依赖

**Managed Computer 终端用户依赖：**

- Raft 账号、现代浏览器和可访问 Raft 托管服务的网络。
- macOS arm64/x64、Linux arm64/x64，或当前分发存在的 Windows x64 环境。
- 至少一个受支持且已登录的 runtime，或用户自己的 API Key。
- Runtime 执行具体任务所需的 Git、语言工具链、项目依赖和外部凭据。
- macOS/Linux 安装器需要 POSIX Shell、`curl` 或 `wget`、SHA-256 工具和基础文件命令；Node.js 不再是 Computer 前置依赖。
- Windows 安装器支持 PowerShell 5.1+；只有特定上游 Bash-only runtime 才需要 Git Bash，managed Pi 文档说明不要求。

**External Agent 依赖：**

- Node.js/npm 用于安装 `@botiverse/raft` CLI。
- 自行运行的 Agent framework、runtime、模型凭据和进程守护方式。
- External Agent 当前属于实验能力，不应作为生产接入的唯一无备份路径。

### 接口与通信形态

- **Web HTTPS**：浏览器/PWA 访问 Raft Server、消息、任务、附件和设置。
- **Device authorization**：Computer 和 External Agent 登录时在浏览器中由人类批准设备请求。
- **Computer 与 Server 连接**：文档确认 Computer 保持机器在线、接收消息并发送回复，但没有披露 WebSocket、SSE、gRPC 或轮询等具体协议。
- **本地进程边界**：Computer 探测、启动和管理 coding-agent runtime；公开文档未披露具体 stdio、PTY、socket 或 RPC 契约。
- **`raft` CLI**：External Agent 和 Agent runtime 通过 CLI 访问消息、任务、提醒、搜索和 Server 信息。
- **Provider 网络**：runtime 使用用户自己的订阅或 API Key 直接访问模型 provider，Raft 文档声明不做模型请求中转。
- **Push Notification**：浏览器或 PWA 获得授权后接收移动/桌面推送。

### 持久化方式

**用户电脑：**

- `~/.slock/agents/`：隐私政策明确提到的 Agent workspace 根目录，保存本地工作文件、记忆、克隆仓库和 runtime 上下文。
- `~/.slock/computer/`：安装器默认使用的 Computer 本地状态目录，包含 release channel 等状态；可由 `SLOCK_HOME` 或 `RAFT_HOME` 覆盖。
- `~/.local/bin/raft-computer` 或 Windows `%USERPROFILE%\.local\bin\raft-computer.exe`：默认可执行文件位置。
- 所选 runtime 自己的登录、session、缓存和工具数据仍按各自产品规则保存。

**Raft 托管服务：**

- 账号、Server、成员、频道、私信、消息、附件、Task、Reminder 与相关元数据。
- Privacy Policy 声明 Botiverse 不读取或保存本地 workspace、终端输出以及 Agent 在本机读写的文件，除非这些内容被明确发送到 Raft 消息、附件、Task 或 workspace record。
- 服务端数据库、对象存储、备份、消息保留和导出实现未公开；Free 计划的 30 天历史是产品保留限制，不代表底层删除机制已核验。

### 权限与安全边界

- **本地进程权限**：runtime 在用户电脑运行，公开资料未说明容器、虚拟机或 OS sandbox。Agent 对本地文件、命令、网络和凭据的实际能力由当前 OS 用户、runtime 和工具配置共同决定。
- **Workspace 隔离**：每个 Agent 有独立目录，其他 Agent 默认有自己的 workspace；这是组织层隔离，不能证明跨目录访问被系统强制阻止。
- **Server 角色**：Agent 可为 Member 或 Admin。Admin 可创建/编辑频道、管理频道成员和编辑 Server profile；普通 Member 只能把部分管理动作准备为 action card 等待人类提交。Agent 不能成为 Server owner。
- **生命周期控制**：停止、重启、Session reset、Full reset 和删除由人类 owner/admin 发起，Agent 不能自行执行这些动作。
- **凭据边界**：runtime 使用用户自己的 provider 登录；External Agent 通过 device authorization 获取自身身份。公开资料未说明 Computer 凭据在磁盘上的加密、Keychain/Credential Manager 使用或轮换策略。
- **云端数据边界**：Botiverse 声明服务器位于美国，并可能使用托管、数据库、对象存储和 AI 推理供应商；消息、附件和 Task 进入 Raft 后不再属于“只在本机”的数据。
- **诊断上报**：用户主动使用 Report Issue 时会发送 Agent diagnostics 和 session trace，正式使用前应核对其脱敏与确认界面。
- **安装链路**：官方命令是 `curl | sh` 或 `irm | iex`，随后安装器根据 manifest 校验二进制 SHA-256。哈希保护下载资产，但入口脚本本身仍是实时远程脚本；企业环境应固定版本、审查脚本并通过内部软件分发。

## 部署形态

### Windows 工作机

- **UI**：官方客户端是 Web/PWA，没有必须安装的桌面 UI。
- **当前资产**：CDN 1.0.14 manifest 包含 `win32-x64` EXE，未包含 Windows arm64。
- **安装入口**：`irm https://cdn.raft.build/computer/install.ps1 | iex`；支持 PowerShell 5.1+。
- **默认位置**：`%USERPROFILE%\.local\bin\raft-computer.exe`，安装器修改当前进程和用户级 `PATH`，未显示必须提升管理员权限。
- **完整性**：验证 gzip SHA-256、解压后 EXE SHA-256、PE header 架构和二进制自报版本；升级时使用临时文件与备份替换。
- **关键冲突**：onboarding 文档仍要求 WSL 并称无 native Windows app；Computers 文档称 Windows transitional daemon 仅在前台进程存活时运行；而 PowerShell 安装器包含 detached lifecycle 和 managed Computer 迁移逻辑。当前究竟是正式后台服务还是过渡支持，必须人工验收。
- **运行依赖**：至少一个已安装并登录的 runtime；部分上游 CLI 可能额外依赖 Git Bash、Git、语言 runtime 或项目工具链。
- **卸载**：未发现完整官方卸载文档。删除 Server 中的 Computer 只证明解除服务端关联，不能证明本地 EXE、用户 `PATH`、`~/.slock` 状态和 Agent workspace 被清除。

### macOS 工作机

- **UI**：使用现代浏览器或 PWA，没有桌面 DMG 应用。
- **当前资产**：CDN 1.0.14 同时提供 arm64 与 x64 自包含二进制。
- **安装入口**：`curl -fsSL https://cdn.raft.build/computer/install.sh | sh`，默认安装到 `~/.local/bin/raft-computer`。
- **前置工具**：Shell、`curl`/`wget`、`shasum`、基础文件工具；不要求 Node.js。若默认目录不在 `PATH`，安装器会修改 `.zshrc` 或 `.bashrc`，除非显式禁用。
- **完整性与签名**：验证压缩包和解压后二进制 SHA-256，并用 `file` 校验 Mach-O 架构；manifest 记录 Developer ID、Hardened Runtime 和 Apple Notarization Accepted。公证票据标为在线交付且未 stapled，离线 Gatekeeper 行为需实机确认。
- **权限**：默认写入用户 Home，没有文档要求管理员权限；runtime 对项目文件和命令的权限仍继承当前用户。
- **系统要求**：未发现最低 macOS 版本、内存、磁盘和 CPU 资源要求。
- **卸载**：未发现官方完整流程，需要分别验证后台 service、登录项、`PATH` 修改、二进制、`~/.slock/computer` 和 Agent workspace 的残留策略。

### 主体功能运行位置

| 能力 | 主要位置 | 结论 |
| --- | --- | --- |
| Web UI、频道、私信、线程、任务板 | Raft 托管服务 + 浏览器 | 依赖云端，不是本地 Server |
| Agent 进程与工具执行 | 用户 Computer/云 VM | 本地执行主体 |
| 代码、终端输出、workspace | 用户 Computer | 默认留在本机 |
| 模型推理 | 用户选择的 provider | 由本地 runtime 直连，不由 Raft 中转 |
| 消息、附件、Task、Reminder、成员元数据 | Raft 托管服务 | 进入云端协作状态 |
| 移动访问与推送 | Web/PWA + Push 服务 | 依赖网络和云端服务 |
| Private deployment | 尚未公开交付 | Enterprise Coming soon |

Raft 满足“Agent 工具执行在工作 PC”的要求，但不满足“完整平台可离线或自托管”的更严格要求。云端不可用时，公开资料没有证明本地 Computer 能继续独立调度、排队和恢复完整协作工作流。

### 云端与外部服务

- **必要 Raft 云服务**：账号、Server、设备登录、消息、任务、附件、提醒、成员与浏览器 UI。
- **模型 provider**：Claude、OpenAI、Google、Moonshot、OpenCode/自选 provider 等，按 runtime 选择直接通信。
- **身份与支付**：Google/GitHub 社交登录可选，Stripe 处理支付。
- **服务供应链**：Privacy Policy 表明可能使用 hosting、database、object storage、AI model inference 和邮件等第三方供应商。
- **地域**：Privacy Policy 声明服务器位于美国，其他地区用户的数据可能跨境传输。
- **企业治理**：当前公开计划尚未提供 SSO、高级访问控制和 private deployment，受监管团队应等待正式能力或取得书面方案。

## 未决项与证据边界

- Windows 原生 Computer 1.0.14 是否已正式 GA，还是仍属于需要前台保活的 transitional daemon；WSL 指引何时失效。
- Windows/macOS 的最低系统版本、资源消耗、后台 service/登录项、自动启动、自动升级、回滚和完整卸载流程。
- Computer 与 Raft Server 的实际协议、出站域名/端口、TLS 终止、重连、心跳、消息确认、离线队列和幂等机制。
- Task claim 的事务、锁和防重复领取实现，以及多 Computer 并发下的故障恢复语义。
- 托管服务的数据库、对象存储、备份、灾难恢复、SLA、数据导出、删除时限和租户隔离实现。
- Computer/Agent device credential、provider token 和本地 profile 的加密、权限、轮换与撤销方式。
- Agent workspace 的真实目录权限、跨 Agent/跨仓库访问边界，以及 runtime 自身审批模式能否统一治理。
- Report Issue 实际包含哪些 diagnostics/session trace，发送前是否可预览与脱敏。
- Enterprise private deployment、SSO 和高级 RBAC 的发布日期、部署模型与现有客户可用性。
- 核心源码、许可证和安全响应策略未公开，无法完成源码级依赖与供应链审计。
- 第一方 testimonials 之外缺少足量独立反馈，生产可靠性、长期运行和团队采用成本仍无公开证据。

## 后续验证建议

1. **Windows 人工验收**：在干净的 Windows 11 x64 普通用户环境安装 1.0.14，确认是否完全不依赖 WSL、是否形成后台自启动服务、关闭终端后是否在线、重启系统后是否自动恢复。
2. **macOS 人工验收**：分别在 Apple silicon 与 Intel Mac 验证下载、签名、公证、Gatekeeper、安装目录、Shell profile 修改、后台进程、系统重启和卸载残留。
3. **端到端最小闭环**：连接 Codex CLI 或 Claude Code，创建 Agent，领取 Task，读写测试仓库，进入 `in review`，人工驳回后继续，最终 `done`；记录实际进程、目录、网络和 provider 账单。
4. **多 Agent/多 Computer**：并发领取同一 Task、Computer 断网、runtime 崩溃、provider 限流、Reminder 到期和服务重启，确认是否重复执行、丢消息或失去 owner。
5. **数据边界**：用无敏感数据的 canary 文件验证本地文件、终端输出、workspace、消息、附件和诊断上报分别流向何处，并测试账号/Server/Computer/Agent 删除后的残留。
6. **权限基线**：使用专用 OS 用户、最小权限仓库凭据和 runtime 审批模式；不要把 Agent workspace 的“独立目录”视为安全沙箱。
7. **网络与治理**：抓取 Computer 的出站域名和连接模式，核对企业代理、防火墙、审计、SSO、数据驻留与跨境要求；在 Enterprise 能力正式交付前，不把官网 Coming soon 作为采购承诺。
8. **退出标准**：只有 Windows/macOS 双平台均通过安装、重启、长任务、权限、数据清理和故障恢复验收，才把 Raft 判定为满足生产工作机要求。
