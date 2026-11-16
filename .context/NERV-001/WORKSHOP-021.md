# Superconductor 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-22 23:27:27
> evidence_window: 2026-07-22；Superconductor 官网与文档快照、桌面端 v1.0.0 Release（2026-06-05）

## 交付结论

1. **不符合本 RUNBOOK 的工作 PC 要求，且有两项独立硬门槛不通过。** 官方下载页明确把 Windows 标为 “Coming soon”，当前只有 macOS 与 Linux 桌面包；官方文档和定价页同时明确 coding agents 在隔离的云端开发环境中构建、运行和测试项目，主体工作不在用户 PC。
2. **Windows 当前不可安装。** 证据窗口内没有 Windows 安装包，下载页的 Windows 按钮处于禁用状态。未来支持承诺不能视为已发布能力，因此无法评估 Windows 安装、依赖、权限、更新和卸载流程。
3. **macOS 有原生桌面客户端，但它不是本地 Agent runtime 的证据。** 官方提供 Apple silicon 与 Intel 两种 DMG；桌面应用承载完整工作区界面、画中画预览和自动更新，但实际 Agent 执行及应用预览位于 Superconductor 提供的云端 sandbox。
4. **产品定位**：Superconductor 是团队与多种 coding agent 协作的云端软件工程工作区。用户从 Web、桌面、移动端、Slack 或 GitHub 创建任务，并行启动多个 Agent，随后通过聊天、实时预览、diff、QA 和引导式 Review 选择实现并创建 PR。
5. **本次到硬门槛判断即停止深入。** 按 RUNBOOK，Windows/macOS 双平台缺失或主体功能位于云端时应直接判定不符合要求，因此不继续调查云端服务内部架构、持久化实现、扩缩容、SLA、源码或性能。

## 调研目标、范围与边界

### 调研目标

确认 Superconductor 是什么、如何组织 coding agents 工作，以及它能否在 Windows/macOS 工作机上安装并以本地 PC 为主体执行任务。

### 核心问题

- 产品服务谁，用户如何从任务进入 Agent 实现与代码审查？
- Windows 与 macOS 是否都有可用安装包？
- 桌面应用是本地执行 runtime，还是云端工作区的客户端？
- Coding agent 在哪里检出代码、运行命令、启动应用与产出变更？
- 当前桌面端版本和公开维护状态如何？

### 覆盖范围

- Superconductor 官网、下载页、官方文档首页、快速入门、桌面端与开发环境说明。
- 官方定价页对 sandbox hour 和云端开发环境的定义。
- 官方 `desktop-releases` 仓库的最新 Release 与安装资产。
- 只调查到足以判断 RUNBOOK 两项硬门槛的系统边界。

### 明确排除

- 不做竞品比较、选型矩阵或优劣排名。
- 不注册账号，不连接 GitHub、Slack、模型订阅或 API Key。
- 不下载、安装或运行桌面应用，不创建云端 sandbox。
- 不做源码审计、遥测调查、性能 benchmark 或安全审计。
- 不调查云端服务的内部实现、扩缩容、高可用、SLA、队列或存储 schema。

## 证据口径

- **官方下载页**用于确认当前可安装平台和安装资产；“Coming soon”按规划能力处理，不算当前支持。
- **官方产品页与文档**用于确认产品定位、核心流程和运行位置；关于云端 Agent 的表述由文档首页、开发环境说明和定价页交叉验证。
- **GitHub Release**只用于确认桌面客户端的公开版本、发布时间与安装包，不把该二进制仓库视为产品源码。
- **官方宣传性表述**如隔离、安全或生产效率不等同于实机验证。
- **未决项**保留为未决，不用推测补齐；由于产品已在硬门槛失败，不为补全模板而继续下钻。

主要证据入口：

- [Superconductor 官网](https://www.superconductor.com/)
- [官方下载页](https://www.superconductor.com/download)
- [官方文档首页](https://www.superconductor.com/docs)
- [快速入门](https://www.superconductor.com/docs/quick-start)
- [桌面应用文档](https://www.superconductor.com/docs/desktop)
- [开发环境文档](https://www.superconductor.com/docs/project/development-environment)
- [定价与 sandbox hour 说明](https://www.superconductor.com/pricing)
- [桌面端 v1.0.0 Release API](https://api.github.com/repos/Superconductor/desktop-releases/releases/tags/v1.0.0)

## 产品调研

### 产品定位与目标用户

Superconductor 将自己定义为团队与 AI coding agents 的多人协作工作区。它不是单个模型或本地代码补全插件，而是把任务、多个 Agent 实现、云端开发环境、实时应用预览、聊天、diff、QA、代码审查和 PR 交付放在同一工作流中。

目标用户主要包括：

- 希望同时让多个 coding agent 处理不同 ticket 或同一 ticket 多种实现的软件团队。
- 需要产品、设计和工程成员从 Slack、GitHub、Web 或移动端共同发起与审查 Agent 工作的团队。
- 需要统一管理 GitHub、模型订阅/API Key、MCP、Skill 和项目开发环境的工作区管理员。
- 希望以实时预览和结构化 Review 缩短 Agent 代码验收时间的开发者。

### 核心流程

1. 用户注册 Superconductor 工作区并连接 GitHub。
2. 用户创建项目，选择仓库并配置云端开发环境、凭据、网络规则、MCP 与 Skill。
3. 用户从应用、Slack、GitHub 或其他入口创建 ticket。
4. 用户为 ticket 启动一个或多个 coding agent；官方支持 Claude Code、Codex、Amp、OpenCode、Pi 等 Agent 入口。
5. Superconductor 为每个实现启动隔离的云端环境，Agent 在其中检出代码、修改文件、运行与测试应用，并生成实时预览。
6. 团队成员通过聊天、Artifact、QA、diff、Guided Review 和 Implementation Recommendations 检查结果并提出后续修改。
7. 用户选择实现并创建或更新 GitHub PR；空闲云端环境会暂停，后续访问时再恢复。

第 5 步的运行位置是本次判定关键：官方不是把云端描述为简单认证或转发网关，而是明确由云端环境承载构建、运行、测试和预览。

### 功能地图与边界

**当前公开能力：**

- 多人工作区、ticket、并行 Agent 实现与共享聊天。
- 多种 coding agent、模型订阅或自带 API Key。
- GitHub、Slack、MCP、Skill 与项目级外部服务集成。
- 隔离云端开发环境、环境配置、凭据和网络访问规则。
- 实时应用预览、Web Terminal、Artifact、QA、diff、Guided Review 与 PR。
- Web、macOS/Linux 桌面端、iPhone/iPad 原生端和 Android PWA 入口。

**关键边界：**

- Windows 桌面端尚未发布。
- 桌面端提供访问和审查体验，不把 Agent 执行迁移到本机。
- 项目代码、凭据和 Agent 工具需要进入或连接云端运行边界；具体安全性不在本次调研范围。
- 模型调用依赖外部模型订阅、API Key 或平台集成；云端 sandbox compute 另行计量。

### 维护状态与版本证据

- 官方 `desktop-releases` 最新公开 Release 为 **v1.0.0**，发布时间为 **2026-06-05**。
- 该 Release 提供 macOS arm64、macOS x64、Linux AppImage 与 Linux DEB，以及自动更新元数据；没有 Windows 资产。
- 官网与文档在 2026-07-22 仍提供当前产品说明、下载入口和持续更新的功能资料，表明产品处于公开运营状态。
- `desktop-releases` 是二进制发布仓库，未开放 Issue 且不包含产品源码；其 Star、Issue 数不能用于判断采用率或产品质量。
- 因硬门槛已失败，本次不继续扩展社区反馈抽样或完整版本演进调查。

## RUNBOOK 硬门槛判断

| 硬门槛 | 官方现状 | 判断 |
| --- | --- | --- |
| Windows 工作机可安装 | 下载页禁用 Windows 下载并标注 “Coming soon”；v1.0.0 无 Windows 资产 | **不通过** |
| macOS 工作机可安装 | 提供 Apple silicon 与 Intel 两种 DMG | 通过平台可用性检查 |
| 主体工作运行在 PC | Agent 在隔离的云端开发环境中构建、运行、测试并提供预览 | **不通过** |
| 云端仅作简单网关 | 云端直接提供项目 sandbox、计算、开发服务与 Agent 执行 | **不通过** |

结论不是“macOS 客户端能力不足”，而是产品运行模型与本 RUNBOOK 的目标不同：Superconductor 明确是一套以云端 Agent 环境为主体、通过多端客户端访问的协作平台。

## 工作机安装与运行边界

### Windows

- **当前状态**：未发布；官网写明 “Windows support is on the way”。
- **安装入口**：无可用安装包，按钮禁用。
- **版本资产**：v1.0.0 Release 没有 EXE、MSI 或 Windows 自动更新清单。
- **依赖、权限、更新与卸载**：当前无受支持流程可供调查，不能以未来规划推断。

因此，仅 Windows 缺失一项就已经足以按 RUNBOOK 判定产品不符合要求。

### macOS

- **安装入口**：官方下载页提供 `Superconductor-mac-arm64.dmg` 和 `Superconductor-mac-x64.dmg`，分别面向 Apple silicon 与 Intel Mac。
- **当前版本证据**：v1.0.0，两个架构同时提供 DMG、ZIP、blockmap 和自动更新元数据。
- **运行入口**：原生桌面应用承载完整 Superconductor UI，官方提及独立窗口、画中画预览与自动更新。
- **最低系统版本**：官方下载页和 v1.0.0 Release 未明确给出，本次保留为未决。
- **权限与依赖**：账号、网络、GitHub、模型凭据及云端项目环境是核心依赖；本次未实机检查 Gatekeeper、公证、钥匙串、通知或文件系统权限。
- **卸载**：本次查阅的官方下载和桌面文档没有给出完整卸载及本地残留清理流程，需实机人工确认。

macOS 安装包只能证明存在原生访问客户端，不能证明主体功能在 Mac 本地运行。

## 最小技术架构结论

依据官方资料，足以支持门槛判断的系统边界如下：

```text
Web / macOS 桌面端 / 移动端 / Slack / GitHub
                    |
                    v
        Superconductor 云端工作区
        Ticket / Chat / Review / PR
                    |
                    v
      每个实现的隔离云端开发环境
      代码 + Agent + Shell + 构建/测试 + 预览
                    |
          +---------+---------+
          |                   |
          v                   v
   模型或 Agent 服务       GitHub / MCP / 外部服务
```

### 主体功能运行位置

主体功能位于云端。官方定价页将 sandbox hour 定义为 1 vCPU / 2 GB RAM 的云端开发环境使用一小时，并明确该环境是 Agent 构建、运行、测试应用和提供实时预览的隔离工作区。环境可配置 CPU、内存和磁盘，空闲时自动暂停。

这不是“本地执行 + 云端认证/转发”模型；云端承担了核心代码执行与开发环境计算。因此即使 macOS 桌面客户端可安装，产品仍不符合“主体工作必须在 PC”的要求。

### 停止条件

Windows 缺失与云端主体执行均由多个官方直接证据确认，继续调查内部接口、持久化、通信协议或云端部署不会改变准入结论。按 RUNBOOK 在此停止技术下钻。

## 未决项与证据边界

- Windows 只有 “coming soon” 表述，没有发布日期、系统要求、CPU 架构或安装格式。
- macOS 最低系统版本、签名/公证、企业部署、代理支持和完整卸载流程未公开或未在本次入口中发现。
- 桌面应用采用何种客户端框架、缓存哪些本地数据、凭据是否进入系统钥匙串，本次未调查。
- 云端开发环境的区域、保留期、备份、删除传播和故障恢复语义不影响本次门槛判断，因此未深入。
- 官方安全说明和隔离声明未做独立验证；本报告不构成安全或合规评估。
- 未注册账号或运行真实任务，产品流程来自官方资料而非实机观察。

## 后续建议

1. **当前从候选列表排除。** 原因是 Windows 不可用且主体 Agent 执行在云端，不需要进入实机 PoC。
2. 若未来需求允许云端执行，可另起一份面向 Cloud Agent 平台的调研，重点评估代码与凭据边界、sandbox 隔离、数据驻留、成本、审查流程和 GitHub 权限；不要复用本 RUNBOOK。
3. 若未来 Windows 正式发布，也只需重新核验平台安装门槛；除非产品同时推出本地执行 runtime，否则“主体工作在 PC”仍不会通过。
