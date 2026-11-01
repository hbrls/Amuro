# QoderWake 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-22 23:12:57
> evidence_window: 2026-07-22；QoderWake 官网、下载清单 0.1.30、官方 Changelog 0.1.28 与 Qoder CLI 1.0.48 文档快照

## 交付结论

1. **符合本 RUNBOOK 的核心焦点要求。** QoderWake 当前提供 Windows 10+ x64 与 macOS 13+ arm64/amd64 原生安装包；官方公测说明将它定义为“在本机创建数字员工团队的 runtime platform”，安装包捆绑本地 `qoderwake` daemon 与专用 `qodercli-wake`，主体工具执行位于工作 PC。
2. **产品定位**：QoderWake 不是普通代码补全插件，而是常驻后台的“数字员工”平台。每个 Waker 拥有身份、角色、工作区、技能和长期记忆，可由对话、定时任务、API、GitHub 事件或 IM 消息触发，并可组成团队与 WakerFlow。
3. **运行形态是“桌面壳 + 本地 daemon + 本地 Agent CLI + 外部云服务”。** 本地控制台默认连接 `127.0.0.1:19820`，Qoder CLI 在本地工作区读写文件、执行命令和调用工具；Qoder 账号认证、模型推理、跨设备状态、技能市场及 IM/MCP 集成需要网络。
4. **macOS 安装边界明确。** 当前 0.1.30 提供 Apple silicon 与 Intel 两种 DMG，最低 macOS 13.0，分别捆绑 QoderWake 0.1.30、原生 Shell 0.0.20 和 Qoder CLI 1.0.48。
5. **Windows 安装边界明确。** 当前 0.1.30 提供 Windows x64 EXE，官网要求 Windows 10+；没有 Windows on Arm 安装资产。Windows 支持于 0.1.3（2026-06-22）正式发布。
6. **本地权限可配置，但不是天然无风险。** Qoder CLI 能读写本地工作区、运行 Shell、访问 Web 与 MCP；Allow/Ask/Deny 规则、权限模式和受保护路径用于约束动作。`bypass_permissions` 会跳过审批，不能在普通工作机上当作默认模式。
7. **持久化同时包含已确认本地状态与未决云端状态。** 本地 runtime 默认位于 `~/.qoderwake`，更新通道写入其 `config/config.json`；产品还维护跨会话记忆、项目共享记忆、版本快照、工作记录和跨设备状态，但官方专页没有完整披露这些数据各自的本地/云端归属。
8. **维护活跃但成熟度仍需验证。** 产品于 2026-05-26 以 0.0.10 开放公测，约两个月内快速演进至下载通道 0.1.30；官网宣称 production ready，但版本仍为 0.x，且本次未实机验证长期运行、更新、权限和恢复能力。

## 调研目标、范围与边界

### 调研目标

理解 QoderWake 是什么、如何让数字员工常驻工作，以及它能否在 Windows/macOS 工作机上安装并以本地 PC 为执行主体。

### 核心问题

- QoderWake 的目标用户、核心流程与功能边界是什么？
- 桌面应用、本地 daemon、专用 Qoder CLI、工作区、记忆和外部服务如何协作？
- Windows/macOS 的安装入口、版本、架构、依赖、权限、网络、更新与卸载边界是什么？
- “24/7 在线”依赖本机还是云端，主体工具执行发生在哪里？
- 当前维护状态、版本演进和公开反馈反映了什么？

### 覆盖范围

- QoderWake 官网、下载页、公开版本清单、安装脚本和官方 Changelog。
- QoderWake 捆绑的 Qoder CLI 在工具、权限和本地工作区上的公开行为。
- Windows/macOS 原生安装与本地 daemon 运行形态。
- 账号、模型、IM、MCP、GitHub 与跨设备功能只调查到系统边界。

### 明确排除

- 不做竞品比较、选型矩阵或优劣排名。
- 不反编译二进制，不审计内部 API、数据库 schema、进程监督或云端实现。
- 不做遥测、监控、埋点或运营数据调研。
- 不下载、安装或运行 QoderWake，不创建真实 Waker，不连接 Qoder 账号、IM、MCP 或 GitHub。
- 不验证官网“production ready”、角色数量、技能数量、可靠性或性能宣传。

## 证据口径

- **官方产品页**用于确认定位、公开功能、平台和最低系统版本；“生产级”“安全可控”等宣传语不直接视为运行验证。
- **官方下载清单**用于确认当前版本、发布时间、安装包格式、CPU 架构、捆绑版本、哈希和最低 macOS 版本。
- **官方安装脚本**用于确认本地 runtime、回环端口、登录、启动、更新通道和 Shell 安装依赖；脚本标注的 Linux 流程不作为 Windows/macOS 原生安装的默认入口。
- **官方 Release Notes**用于确认生命周期、Windows 发布时间、关键能力演进和重复修复主题；修复记录不能推导问题发生率。
- **Qoder CLI 文档**只用于解释捆绑 CLI 的工具与权限模型；QoderWake 是否覆盖个别 CLI 默认值，仍需运行验证。
- **公开反馈**：官方 Changelog 仓库不承担用户 Issue 入口，通用 GitHub 搜索结果大多是同名测试或第三方集成；本次没有足够独立反馈样本，不归纳普遍口碑。
- **架构推导**：桌面壳、本地 daemon、CLI 与外部服务的关系由下载清单、安装脚本和公测说明交叉确认；未公开的数据位置与内部协议保留为未决。

主要证据入口：

- [QoderWake 官网](https://qoder.com/en/qoderwake)
- [QoderWake 中文官网](https://qoder.com/zh/qoderwake)
- [Qoder 下载页](https://qoder.com/en/download)
- [QoderWake 版本清单](https://download.qoder.com/qoderwake/channels/manifest.json)
- [QoderWake 安装脚本](https://download.qoder.com/qoderwake/install.sh)
- [QoderWake Changelog](https://github.com/QoderAI/changelog-QoderWake/releases)
- [0.0.10 公测说明](https://github.com/QoderAI/changelog-QoderWake/releases/tag/0.0.10)
- [0.1.3 Windows Release](https://github.com/QoderAI/changelog-QoderWake/releases/tag/0.1.3)
- [0.1.18 WakerFlow Release](https://github.com/QoderAI/changelog-QoderWake/releases/tag/0.1.18)
- [0.1.28 Release Notes](https://github.com/QoderAI/changelog-QoderWake/releases/tag/0.1.28)
- [Qoder CLI Quick Start](https://docs.qoder.com/en/cli/quick-start)
- [Qoder CLI Tools](https://docs.qoder.com/en/cli/tools)
- [Qoder CLI Permissions](https://docs.qoder.com/en/cli/permissions)
- [Qoder CLI Skills](https://docs.qoder.com/en/cli/Skills)

## 产品调研

### 产品定位与目标用户

QoderWake 是运行在用户工作机上的数字员工 runtime。它把角色模板、长期记忆、技能、工具、自动触发、工作区与多渠道入口组合为可常驻运行的 Waker，并在 Console 中管理单个员工、员工团队和工作流。

目标用户可以从公开能力归纳为：

- 希望将重复的软件工程、测试、产品、数据分析或内容运营工作交给常驻 Agent 的个人专业人士。
- 需要用定时、API、GitHub 事件或 IM 消息自动触发任务的开发者和运营人员。
- 希望一个人调度多个角色明确的数字员工，并在统一任务板中跟踪交付的用户。
- 需要将本地文件和工作区交给 Agent，同时通过审批与权限规则限制敏感动作的团队。

### 核心流程

1. 用户在 Windows 10+ 或 macOS 13+ 下载对应原生安装包并安装 QoderWake。
2. 原生应用准备并启动本地 `qoderwake` daemon 与 `qodercli-wake`，用户通过浏览器登录或 Personal Access Token 完成 Qoder 认证。
3. Console 连接本地 daemon。Shell 安装流程明确以 `http://127.0.0.1:19820` 为默认入口，并在启动后打开该地址。
4. 用户从预置岗位创建 Waker，配置名称、角色、工作区、技能、记忆、模型、工具和权限；也可创建自定义岗位。
5. 用户从 Console、CLI、IM、定时任务、API 或 GitHub 事件发起工作。
6. Waker 规划任务，通过本地 Qoder CLI 读取和修改工作区、执行命令，并按权限规则自动允许、询问或拒绝工具动作。
7. Console 以会话、任务板、Artifact、运行历史和工作记录展示状态；失败恢复和 daemon 重启尽量维持任务连续性。
8. 任务完成后，系统将可用经验沉淀到个人或项目记忆；用户可查看、纠正、遗忘、回滚或治理记忆与 Skill 演进。
9. 多个 Waker 可组成 Team Group，或通过 WakerFlow 编排多步骤任务，并由用户处理待审批事项。

其中第 4 至第 9 步是依据官网和 Release Notes 整理的产品流程，不是本次实机观察。

### 功能地图与边界

**当前公开能力：**

- **数字员工**：身份、岗位、入职日期、工作记录、独立记忆、技能和工作区。
- **岗位与 Skill**：官网宣称 6+ 预置岗位、100+ 岗位技能；支持自定义 Skill、市场安装、版本历史和选择性自进化。
- **本地执行**：原生桌面应用、本地 daemon、专用 Qoder CLI、本地工作目录和工具调用。
- **长期记忆**：跨会话持久化、个人/项目共享记忆、语义搜索、自动整理、版本快照与回滚。
- **触发器**：对话、定时任务、GitHub Webhook、API Trigger 和 IM 命令。
- **团队协作**：Waker Group、动态计划、成员进度、任务板和审批工作台。
- **流程编排**：WakerFlow 多步骤工作流、参数化运行、记录和故障诊断。
- **外部工具**：MCP、OAuth、插件、Web、Shell、文件工具和工作区工具。
- **多渠道**：本地 Web Console、CLI、钉钉、飞书、微信、企业微信、QQ 等通道；具体入口随版本和地区可用性变化。

**功能边界与约束：**

- QoderWake 不等同于 Qoder Desktop IDE；它是独立安装的常驻数字员工 runtime，虽然捆绑 Qoder CLI。
- Agent 的模型推理依赖 Qoder 账号、可用模型与 Credits；本地执行不代表完全离线。
- “24/7 在线”要求本地 daemon 和工作机持续运行。Global Settings 曾加入“任务运行时防止系统睡眠”和“开机启动”，说明机器关机或 daemon 停止会中断本地执行。
- IM、GitHub、API、MCP 和 Skill Marketplace 引入外部网络与凭据边界。
- 权限系统可以限制动作，但用户仍可启用绕过审批模式；工作区隔离和权限规则不能代替系统级隔离验证。
- 官网“独立权限环境”和“production ready”属于官方表述；隔离机制、故障恢复上限和生产可靠性本次未实测。

### 维护状态与版本演进

- **公测起点**：0.0.10 于 2026-05-26 宣布 public beta，首次公开多 Waker、自动触发、Skill/MCP、长期记忆、本地 Console、IM 与 CLI。
- **渠道扩展**：0.0.12 加入更多 IM 通道并强化 SSE/daemon 恢复；0.0.18 加入 Skill 自进化、记忆时间线和后台记忆整理；0.0.21 加入 API Trigger、Launch at Login 与空闲资源优化。
- **Windows 支持**：0.1.3 于 2026-06-22 正式发布 Windows 版本，补足 Windows/macOS 双平台要求。
- **编排能力**：0.1.17 发布全局任务板，0.1.18 于 2026-07-07 正式发布 WakerFlow，并增强 API 会话连续性和团队计划阶段。
- **近期方向**：0.1.20 至 0.1.28 持续改进 IM 多实例路由、团队协作、Skill 市场、跨设备未读状态、Windows/macOS 更新与启动稳定性。
- **最新下载通道**：证据窗口内 manifest 的 latest 为 0.1.30，发布时间为 2026-07-22，捆绑 Qoder CLI 1.0.48 和原生 Shell 0.0.20。
- **版本记录差异**：官方 GitHub 最新 Release Notes 为 0.1.28（2026-07-21），落后下载通道两个补丁版本；0.1.29/0.1.30 的公开变更说明在证据窗口内未出现。
- **成熟度边界**：官网当前称 production ready，但产品仍使用 0.x 版本号，唯一明确的整体生命周期公告仍是 0.0.10 public beta。本报告不将营销定位等同于 GA 或生产验证。

### 生态与反馈

- **Skill 生态**：内置 Skill、Skill Marketplace、用户级/项目级自定义 Skill、版本历史与自进化治理。
- **工具生态**：本地文件、Shell、Web、MCP、OAuth 外部服务和插件机制。
- **渠道生态**：钉钉、飞书、微信、企业微信和 QQ；不同通道支持配对、开放模式、多实例和工作目录绑定。
- **触发生态**：定时、GitHub Webhook、API Trigger 与 IM 命令。
- **官方支持入口**：Qoder 文档、Changelog、GitHub 组织、Discord 与社交媒体。
- **重复修复主题**：Release Notes 多次涉及 daemon 重连/重启、更新交接、会话卡住、IM 消息丢失或路由错误、Windows 开机启动/换行/安装授权，以及权限工作目录判断。
- **反馈边界**：这些是官方修复记录，不代表所有用户都会遇到。官方 Changelog 仓库没有用户 Issue，通用 GitHub 搜索缺少可归因的独立反馈样本，因此无法判断真实采用率、总体稳定性或满意度。

### 当前可用、实验性与规划能力

- **当前可用**：Windows/macOS 原生应用、Linux Shell 安装、本地 daemon/Console、Waker、Group、Task Board、WakerFlow、长期记忆、Skill、MCP、自动触发和多 IM 通道。
- **早期能力信号**：0.x 版本、高频补丁、更新与 daemon 稳定性修复说明产品仍处于快速迭代期；不将其直接标记为“实验性”，但应按早期产品验收。
- **未发现明确路线图**：官网和 Release Notes 没有给出可核验的未来版本日期或弃用列表。

## 技术架构调研

### 系统全貌与运行形态

QoderWake 可概括为“原生桌面壳 + 本地 Web Console/daemon + 专用 Qoder CLI + 外部账号/模型/集成服务”：

```text
Windows/macOS 原生应用
  QoderWake Shell 0.0.20
        |
        | 本机回环地址，默认 127.0.0.1:19820
        v
QoderWake daemon 0.1.30
  Waker / Group / WakerFlow / Trigger / Task Board
  Memory / Skill / Approval / Run history
        |
        +-- qodercli-wake 1.0.48
        |     +-- 本地工作区文件
        |     +-- Shell / Web / MCP / 其他工具
        |
        +-- Qoder 账号与模型服务
        +-- IM / GitHub / API Trigger / Skill Marketplace
        +-- 可选远程与跨设备状态
```

0.0.10 公测说明直接写明 Waker 运行在本机，并把 Web Console 描述为本地可视化管理界面；安装脚本也会启动本地 daemon 并探测回环 URL。这两个直接证据足以确认主体工具执行在工作 PC，而不是纯 Web SaaS。

### 主要组件与核心链路

**主要组件：**

- **Native Shell**：Windows/macOS 原生入口、托盘/菜单栏、开机启动、退出/重启与更新交接。
- **QoderWake daemon**：管理 Waker、会话、自动任务、触发器、插件、恢复和本地 Console。
- **Local Console**：浏览器式管理 UI，连接本地 daemon；Release Notes 明确提及多标签状态同步、SSE 重连与事件回放。
- **Qoder CLI Runtime**：专用 `qodercli-wake` 负责本地工作区探索、文件修改、命令、工具、权限、Skill 和 Agent 执行。
- **Persistence Layer**：本地 runtime/config、工作区、记忆、Skill、会话、运行历史和工作记录；具体数据分布未完全公开。
- **External Services**：Qoder 认证与模型、Credits、IM 平台、GitHub、MCP、API Trigger 与 Skill Marketplace。

**核心执行链路：**

1. Native Shell 启动或重启本地 daemon，并打开本地 Console。
2. 用户通过 Qoder 账号登录，选择 Waker、工作区、模型、技能和权限。
3. Console、IM、定时器、API 或 GitHub 事件向 daemon 触发任务。
4. Daemon 创建会话并调用专用 Qoder CLI；CLI 在受信任工作目录内规划、读写文件、执行命令或调用外部工具。
5. 需要审批的动作按 Allow/Ask/Deny 和当前权限模式处理；异步 IM/自动任务不能依赖无法回答的交互提示。
6. 执行事件通过本地 Console 流式展示，外部通道收到进度或最终结果；任务板和运行历史更新。
7. 完成后，产物与经验进入工作区、Artifact、工作记录和记忆系统；失败时 daemon/会话恢复机制尝试继续或明确结束状态。

### 主要依赖

- **Windows**：Windows 10+、x64 CPU；当前没有 arm64 原生安装资产。
- **macOS**：macOS 13.0+；Apple silicon arm64 与 Intel amd64 分别提供 DMG。
- **捆绑 runtime**：QoderWake 0.1.30、Qoder CLI 1.0.48、Native Shell 0.0.20。
- **账号与网络**：Qoder 账号浏览器登录或 PAT，模型调用与 Credits，安装/更新 CDN。
- **工作区工具链**：实际任务所需的 Git、语言 runtime、包管理器、构建工具和凭据仍由工作机环境提供。
- **可选集成**：IM 平台账号、GitHub、MCP Server、OAuth 和自定义插件/Skill。

Shell 安装脚本还需要 Bash、下载/解压和校验工具，并可能安装 Python 3；该路径在官网标为 Linux 安装入口，不应把这些依赖直接外推为 Windows/macOS 原生安装器的用户前置条件。

### 接口形态

- **原生桌面 UI**：托盘/菜单栏、启动、退出、更新和系统设置入口。
- **本地 Web Console**：默认通过 HTTP 回环地址管理 Waker、会话、项目、记忆、Skill、任务板与流程。
- **CLI**：`qoderwake` 负责登录、daemon 生命周期、插件与诊断；`qodercli-wake` 执行 Agent 工作。
- **文件与 Shell**：本地工作区、Artifact、项目配置和系统命令。
- **SSE/事件流**：Release Notes 明确记录 Console 的 SSE 重连、事件回放和重复输出修复；内部完整协议未公开。
- **API Trigger/GitHub Webhook**：外部系统可按规则启动自动任务。
- **IM**：钉钉、飞书、微信、企业微信和 QQ 等消息通道。
- **MCP/OAuth/Plugin/Skill**：扩展工具、数据源和岗位能力。

本报告不枚举内部 HTTP 端点、SSE 事件类型或外部网关 API。

### 持久化方式

- **本地 runtime**：Shell 安装默认使用 `~/.qoderwake`，二进制位于其根目录和 `qodercli/`，软链接位于 `~/.qoderwake/bin` 或已有 PATH 目录。
- **更新配置**：安装脚本将 manifest URL 和运行环境写入 `~/.qoderwake/config/config.json`。
- **本地工作区**：Waker 和 IM 通道可绑定本地目录或项目；Qoder CLI 在该目录内读写文件和执行命令。
- **长期记忆**：官方确认个人记忆、项目共享记忆、语义搜索、每日整理、版本快照与回滚。
- **运行状态**：Waker 身份、工作记录、会话、任务板、自动任务历史、Artifact 和 Skill 版本属于产品持久状态。
- **备份/恢复**：0.0.10 将备份/恢复列为 CLI 能力，但没有公开备份格式与覆盖范围。
- **跨设备状态**：Release Notes 明确提到跨设备未读同步、Remote Session 和账号下公共项目，说明并非所有状态都能假定只在单机保存。

官方没有公开逐类数据的本地/云端归属、加密方式、保留期或删除传播规则。因此只能确认 runtime/config 和工作区具有本地形态，不能断言长期记忆与工作记录完全离线。

### 通信方式

- Native Shell 与 Console 通过本机 daemon 协作，默认只监听 `127.0.0.1:19820`。
- Daemon 调用本机专用 Qoder CLI；CLI 通过本地文件系统和进程执行工具，具体 IPC 未公开。
- Console 使用事件流接收会话和任务状态；Release Notes 的 SSE 重连与回放修复是直接证据。
- 账号登录、模型推理、Credits、更新清单、Skill Marketplace 和跨设备状态需要访问 Qoder 服务。
- IM、GitHub Webhook、API Trigger 和远程 MCP 会经过对应外部平台或网关。
- Shell 安装允许覆盖 `QODERWAKE_HOST`；如果用户将 daemon 从回环地址改为非本机地址，网络暴露和访问控制需单独验收。

### 部署形态

#### 工作机安装（Windows / macOS）

**Windows：**

- 官网要求 Windows 10+；当前清单只提供 `windows/amd64`，没有 Windows on Arm 资产。
- 0.1.30 使用原生 EXE Installer，约 139 MB，捆绑 QoderWake 0.1.30 与 Qoder CLI 1.0.48。
- 下载 EXE 后运行安装器，登录 Qoder 账号并启动本地服务。官方公开材料没有说明默认安装目录、是否需要管理员权限、企业静默安装参数或代理配置。
- Windows 支持始于 0.1.3；后续版本修复了首启终端显示、更新交接、后台重启、Launch at Login 和 Skill 换行兼容问题。

**macOS：**

- 官网要求 macOS 13+；0.1.30 同时提供 arm64 和 amd64 DMG，覆盖 Apple silicon 与 Intel。
- 两个 DMG 均捆绑 QoderWake 0.1.30 与 Qoder CLI 1.0.48；manifest 标明最低系统版本 13.0。
- 用户下载与 CPU 对应的 DMG 并安装原生应用。官网没有写明 Gatekeeper、公证、默认应用目录、企业部署或首次启动权限流程。
- Release Notes 表明应用支持 Launch at Login、任务运行时防睡眠、更新完成后的重启提示，以及退出前识别仍在运行的会话。

**依赖、权限与网络：**

- 原生安装包已捆绑 QoderWake 和专用 Qoder CLI，不要求用户另行安装这两个 runtime。
- 用户必须登录 Qoder；自动化场景可使用 PAT。模型、Credits 和外部集成需要网络。
- CLI 能读取/修改工作区文件、运行 Shell、访问 Web 和 MCP。默认权限模式会对敏感动作确认；受保护路径和 deny 规则优先。
- `auto` 用于无人值守执行，`dont_ask` 会拒绝本应询问的动作，`bypass_permissions` 则跳过审批。工作 PC 应使用明确的工作目录和最小权限规则。
- 默认 daemon 只绑定回环地址，不需要对局域网或公网开放 19820；IM/API/GitHub 等远程入口通过外部服务进入产品工作流。

**更新：**

- 官方 manifest 是更新通道，列出版本、SHA-256、原生安装包和 native app zip。
- Release Notes 明确存在后台下载、更新提醒、重启交接与 Windows/macOS 热更新修复。
- Shell 安装流程会读取 latest manifest 并持久化更新通道；重新执行安装流程可覆盖 runtime。
- 当前 manifest 0.1.30 已领先 GitHub Release Notes 0.1.28。更新前应记录版本与哈希，不能只依赖 Changelog 页面。
- 官方没有公开回滚、长期支持通道、企业版本冻结或离线升级方案。

**卸载：**

- 官网与公开文档没有给出 Windows/macOS 完整卸载流程。
- Shell 安装脚本没有 `--uninstall` 选项；已确认它会创建 `~/.qoderwake`、PATH 软链接和更新配置，但原生安装器的数据目录是否完全相同未公开。
- 由于 Waker 记忆、项目共享记忆、自动任务和未完成会话可能需要保留，不能把删除应用等同于完整、安全的数据清理。
- 正式采用前应由人工分别验证 Windows“已安装的应用”和 macOS 应用移除流程、后台服务/开机启动注销、PATH 项、工作区、记忆备份与账号端数据删除。

#### 主体功能运行位置

QoderWake 的 Waker runtime、daemon、专用 Qoder CLI、工作区文件、Shell 命令和工具执行位于 Windows/macOS 工作机。0.0.10 公测说明与 0.1.30 安装清单、安装脚本相互印证，因此它**符合“主体功能运行在工作 PC”要求**。

这个结论不代表完全离线：模型推理、Qoder 账号、Credits、IM/GitHub/MCP、Skill Marketplace 与跨设备状态仍依赖网络。若工作机关机、睡眠或 daemon 停止，本地 Waker 无法继续 24/7 执行；“防睡眠”和“开机启动”只能降低中断概率。

#### 云端网关与外部服务

Qoder 云端承担账号认证、模型访问、Credits、远程/跨设备状态以及部分外部路由；IM、GitHub、MCP 和 Skill Marketplace 还会连接各自服务。公开资料未表明 QoderWake 将本地文件执行迁移到云端。

这些云端能力属于本地 runtime 的必要或可选外部服务。本报告只记录边界，不调查服务端部署、扩缩容、队列、高可用或 SLA。

## 未决项与证据边界

- **0.1.30 缺少公开 Release Notes**：下载通道已发布 0.1.30，GitHub Changelog 最新为 0.1.28，无法确认两个补丁版本的具体变化。
- **产品成熟度未闭合**：官网宣称 production ready，但版本仍为 0.x，且没有找到从 public beta 转为 GA 的明确公告。
- **Windows/macOS 未实机验证**：未检查签名、公证、安装目录、管理员权限、杀毒软件提示、首次启动、开机启动或企业设备管理行为。
- **长期记忆数据位置未公开**：已确认功能和本地 runtime，但个人/项目记忆、跨设备状态、工作记录和账号端删除规则没有逐项说明。
- **原生卸载流程未公开**：无法确认卸载器是否停止 daemon、取消开机启动、移除本地数据或保留备份。
- **权限继承关系未验证**：Qoder CLI 的规则模型已公开，但 QoderWake 自动任务、IM 会话和 WakerFlow 对默认权限的具体覆盖需要运行确认。
- **恢复语义未验证**：Release Notes 多次修复 daemon 重连、SSE 回放、更新重启和卡住会话；本次未测试断网、睡眠、重启、更新或任务中断。
- **24/7 资源成本未验证**：未测量空闲 CPU/内存、长任务资源、模型 Credits、网络流量或工作机防睡眠影响。
- **独立反馈样本不足**：只能归纳官方修复主题，不能据此判断缺陷率、采用率或总体口碑。
- **不构成安全审计**：权限、受保护路径和安全扫描是产品能力，不证明沙箱隔离或企业安全合规。

## 后续验证建议

1. 在 Windows 11 x64 和 macOS 13+ 的 Apple silicon/Intel 测试机上安装 0.1.30，核对签名、公证、安装目录、进程、回环端口、开机启动和资源占用；这是人工验收。
2. 创建一个只绑定测试目录的 Waker，使用默认权限完成“读取文件 → 修改文件 → 运行命令 → Ask/Allow/Deny → 产出 Artifact”的最小本地闭环。
3. 断网、睡眠、重启 daemon、重启系统和执行版本更新，验证任务状态、SSE 恢复、记忆、工作记录和未完成自动任务是否一致。
4. 分别测试 Console、定时任务、API、GitHub 和一个 IM 通道，确认每种入口的身份、工作目录、审批、超时与停止行为。
5. 导出或备份 Waker 后，在隔离测试账号执行卸载，确认 Windows/macOS 后台服务、Launch at Login、PATH、`~/.qoderwake`、工作区与账号端数据的实际保留策略。
6. 若用于企业代码或数据，先由安全 owner 审查模型数据流、跨设备同步、记忆存储、PAT、IM/MCP 凭据和 `bypass_permissions` 管控，再决定是否准入。
