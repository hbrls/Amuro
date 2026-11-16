# Rover 技术产品调研

> updated_by: Qoder
> updated_at: 2026-07-18
> evidence_window: 2026-07-18 调研；目标版本 CLI v2.3.2（2026-02-27 发布）；仓库 main 分支快照

## 交付结论

1. **产品定位**：Rover 是一个本地运行的 AI 编码代理（AI Coding Agent）管理器，让 Claude Code、Codex、Cursor、Gemini、Qwen 等多个代理在同一代码库上并行工作，互不干扰。它不替代代理本身，而是负责隔离环境编排、工作流驱动与结果回收。
2. **核心价值**：通过 git worktree + 容器（Docker/Podman）为每个任务建立隔离沙箱，用户可在代理后台执行任务时继续自己的工作；所有运行都在本地、使用用户已安装的工具，不引入云端服务或新的仓库权限。
3. **架构关键**：Rover 是一个 pnpm monorepo，包含两个 CLI 组件——面向用户的 `packages/cli`（运行在宿主机）和运行在容器内的 `packages/agent`；两者通过 Rover 自实现的 ACP（Agent Communication Protocol，代理通信协议）统一驱动不同 AI 代理。
4. **维护状态**：仓库创建于 2025-07-22，最新 CLI 版本 v2.3.2 发布于 2026-02-27，最后一次代码推送为 2026-03-27；截至调研日（2026-07-18）已约 4 个月无新代码推送，处于低活跃/维护暂停状态，但 Issues 与社区渠道仍开放。
5. **适用边界**：Rover 适合希望并行化 AI 编码代理任务、且本地具备 Node.js 22+、Git、Docker/Podman 与至少一个支持代理的开发者；它不提供代理订阅，不改变用户既有工作流，当前对 Windows 的支持程度未在官方资料中明确说明。

## 调研目标、范围与边界

### 调研目标

理解 endorhq/rover 这个开源项目的产品定位、目标用户、核心使用流程，以及其技术架构如何实现"多 AI 代理并行、本地隔离执行"这一核心能力。

### 核心问题

- 产品是什么、为谁解决什么问题、如何被使用？
- 系统以什么形态运行，由哪些主要部分组成？
- 一个核心任务链路如何从创建走到合并/推送？
- 关键技术约束（依赖、接口、持久化、通信、部署）有哪些？
- 当前维护状态与版本演进方向如何？

### 覆盖范围

- 产品调研：定位、用户、核心流程、功能边界、维护状态、版本演进、生态反馈
- 技术架构调研：运行形态、主要依赖、接口形态、持久化方式、通信方式、部署形态

### 明确排除

- 不做逐文件源码审计（不盘点 schema、路由、锁、队列等实现细节）
- 不做竞品比较或选型矩阵
- 不做性能 benchmark
- 不做集成实施

## 证据口径

| 证据类型 | 使用边界 |
| --- | --- |
| 官方产品资料（GitHub README、官网 endor.dev/rover） | 用于定位、用户、核心流程、功能边界；宣传性表述已与文档、版本记录交叉确认 |
| 官方版本记录（GitHub Releases API） | 用于维护状态、版本演进、功能变化；记录了发布时间与 PR 级变更 |
| 仓库元数据与配置（package.json、目录结构、GitHub Contents API） | 用于运行入口、构建形态、包结构；只能证明当前快照 |
| Issue 抽样（GitHub Issues API，open 状态前 20 条） | 用于反馈主题；样本为开放 Issue，不代表全部用户反馈 |
| 架构推导 | 用于组件关系与核心链路解释；已标注为推导，不等同运行验证 |
| 未决 | 缺少运行验证或官方明确说明的事项，标注为未决 |

## 产品调研

### 产品定位与目标用户

**一句话定位**：Rover 是一个本地运行的 AI 编码代理管理器，让多个 AI 代理（Claude Code、Codex、Cursor、Gemini、Qwen 等）在隔离环境中并行处理同一代码库的不同任务。

**目标用户与使用场景**：
- 已在使用一个或多个 AI 编码代理（如 Claude Code、Gemini CLI）的开发者
- 希望并行化代理任务、减少上下文切换、在代理后台工作时继续自己编码的开发者
- 偏好本地执行、不希望引入云端服务或给仓库新增权限的开发者
- 同时使用终端与 VSCode 的开发者（Rover 提供两种入口）

典型场景：用户创建一个任务（如"修复 issue X"或"补充文档"），交给 Rover 与某个代理；Rover 在隔离容器中让代理完成工作流，产出代码变更与说明文档；用户稍后检查、迭代或合并。

### 核心流程

以用户视角描述一条端到端核心流程：

1. **创建任务**：在项目目录运行 `rover task --agent claude`，描述要完成的任务；Rover 自动检测项目并注册到中央存储。
2. **隔离环境准备**：Rover 为该任务创建独立的 git worktree（工作区）和分支，启动一个容器（Docker/Podman），挂载所需文件，安装并配置所选 AI 代理。
3. **工作流执行**：Rover 按"工作流"（predefined steps）驱动代理完成任务；代理在容器后台运行直到结束，期间用户可继续其他工作或并行创建新任务。
4. **结果回收**：任务完成后，代码变更与输出文档（如 changes.md）保存在任务工作区；用户用 `rover inspect`、`rover diff` 查看结果，或 `rover iterate` 让代理按新指令再做一轮。
5. **合并/推送**：满意后用 `rover merge` 合并变更，或 `rover push` 推送分支到远端；也可 `rover shell` 进入工作区手动控制。

### 功能地图与边界

**当前可用能力**：
- 任务全生命周期管理：task（创建）、list（列出，含 watch）、inspect（查看）、diff（差异）、iterate（迭代）、logs（日志）、shell（进入工作区）、merge（合并）、push（推送）、rebase（变基）、restart（重启）、stop（停止）、reset（重置）、delete（删除）、cleanup（清理）
- 多代理支持：Claude Code、Codex、Cursor、Gemini CLI、Qwen Code，以及通过 ACP 新增的 GitHub Copilot 与 OpenCode（v2.1.0 引入）
- 模型选择：`agent:model` 语法（如 `claude:sonnet`）和每代理默认模型配置
- 多项目管理：`--project` 标志与 `ROVER_PROJECT` 环境变量，中央项目存储与 `rover info` 查看所有项目
- 工作流管理：内置工作流 + 自定义工作流（`workflow add/inspect/list`），支持 command 步骤类型（v2.3.0）
- 沙箱网络控制：allowlist/blocklist 模式，规则支持域名、IP、CIDR
- 沙箱定制：自定义 agent 镜像、init 脚本、extraArgs、envs/envsFile、excludePatterns
- 任务生命周期钩子：onComplete / onMerge / onPush
- MCP 服务器模式：`rover mcp` 将核心命令暴露为 MCP 工具，供 AI 助手程序化调用
- 上下文提供者：LocalFile / GitHub / HTTPS 上下文提供者（v2.1.0 引入）
- 遥测：匿名命令使用统计，可关闭
- VSCode 扩展：Marketplace 可安装，复用 Rover CLI

**实验性/规划能力**：
- Autopilot（事件驱动自治流水线）：在 Issues 与 `packages/cli/src/commands/autopilot/` 目录中可见，包含 resolver、pusher、notify、noop、wait、cleanup 等步骤，以及 dashboard TUI、inspector TUI、maintainers 配置——截至调研日仍为开放 Issue，未见对应正式发布

**功能边界**：
- Rover 不提供 AI 代理订阅，用户需自备已安装的代理与对应 API 凭证
- Rover 不改变代理的工作方式，只负责编排与隔离
- 官方明确只支持 GitHub 作为 Git 托管（Issue #533 请求 GitLab 支持，未实现）

### 维护状态与版本演进

**维护状态判断**：

- 仓库创建于 2025-07-22，主语言为 TypeScript，Apache 2.0 许可证
- 最新 CLI 发布为 v2.3.2（2026-02-27 发布）；最后一次代码推送为 2026-03-27
- 截至 2026-07-18 调研日，已约 4 个月无新代码推送；但 Issues 仍有新提交（最近一条开放 Issue 创建于 2026-06-22），仓库未归档
- 判断：**低活跃 / 维护暂停**。2025-07 至 2026-02 为密集开发期（多次发布），2026-03 后放缓；尚未达到"已废弃"，但当前无明确恢复信号

**关键版本演进**：

| 版本 | 发布日期 | 方向性变化 |
| --- | --- | --- |
| v1.6.0 | 2025-11-25 | 自定义 agent 镜像与 init 脚本；config schemas 迁移到独立包；自动沙箱工具安装 |
| v1.7.0 | 2025-12-03 | 交互式会话模式；单任务多代理并行；动态 pre-context 步骤注入 |
| v2.0.0 | 2026-01-28 | **重大版本**：实现 ACP（代理通信协议）并迁移 Claude；npm→pnpm；引入 biome；多项目中央存储（ProjectManager）；网络 allowlist/blocklist；任务生命周期钩子；中央目录管理 |
| v2.1.0 | 2026-02-06 | 上下文提供者体系（LocalFile/GitHub/HTTPS）；新增 GitHub Copilot 与 OpenCode（均经 ACP）；agent 基础镜像 Alpine→Debian |
| v2.2.0 | 2026-02-17 | 容器镜像缓存（重启一致性）；jsonl 结构化日志；git worktree 上下文检测；CLI JSON 输出类型集中化 |
| v2.3.0 | 2026-02-25 | Flutter/Dart 语言支持；Gemini 与 Qwen 迁移到 ACP 模式；command 步骤类型；cacheFiles 支持 |
| v2.3.1 / v2.3.2 | 2026-02-25 / 2026-02-27 | verbose 输出控制；容器启动时安装代理凭证修复 |

**方向性归纳**：从"支持单个代理执行任务"演进到"通过 ACP 统一多代理集成 + 多项目中央管理 + 上下文提供者体系"，并向"Autopilot 自治流水线"方向探索（尚未发布）。

### 生态与反馈

**生态入口**：
- 官网：endor.dev/rover；文档站：docs.endor.dev/rover
- VSCode Marketplace 扩展
- 社区：Discord、Twitter/X（@EndorHQ）、Mastodon、Bluesky
- 主题标签：agentic-ai、ai、ai-agents、claude、codex、gemini、qwen

**反馈主题**（基于 open Issues 前 20 条抽样，证据边界：样本为开放 Issue，不代表全部用户反馈，且最近 4 个月仓库无代码推送）：

1. **Autopilot 自治流水线需求集中**：#555 及 #573–#580、#584 共 9 条 Issue 围绕"事件驱动自治流水线"及其各步骤（resolver、pusher、notify、noop、wait、cleanup、dashboard/inspector TUI、maintainers 配置）——这是当前最集中的功能方向
2. **macOS 容器兼容问题**：#601 报告 macOS 上初始化容器因缺少 /etc/shadow 挂载导致注入用户账户验证失败
3. **多项目/多代理扩展**：#529 请求多项目工作区（前端+后端+e2e）；#547 请求 AI 冲突解决的并发与更智能上下文；#546 请求 `rover merge` 支持 `-a/--agent`
4. **Git 托管扩展**：#533 请求 GitLab 支持（当前仅 GitHub）

**公开快照**（仅描述当前状态，不等同产品质量）：269 stars、31 forks、41 open issues、1 subscriber。

## 技术架构调研

### 系统全貌与运行形态

Rover 以**本地工具组合**形态运行，包含：

1. **用户侧入口**（运行在宿主机）：
   - `packages/cli`：终端命令 `rover`，通过 npm 全局安装（`@endorhq/rover`），是核心编排器
   - `packages/extension`：VSCode 扩展，复用 Rover CLI，提供图形化任务管理
2. **容器内运行时**（运行在每个任务的隔离沙箱中）：
   - `packages/agent`：容器内的 agent 端 CLI，负责在容器内接收 Rover 指令并驱动具体 AI 代理
3. **共享库**（构建期依赖，不独立运行）：
   - `packages/core`：核心共享逻辑（项目管理、显示辅助、上下文管理）
   - `packages/schemas`：配置 schema 定义
   - `packages/prompts`：提示词模板
   - `packages/telemetry`：遥测上报

**系统边界**：
- 宿主机：Node.js 22+、Git、Docker 或 Podman、用户已安装的 AI 代理（Claude Code 等）及其 API 凭证
- 容器：Rover 构建/拉取的 agent 镜像（Debian 基础，v2.1.0 起从 Alpine 迁移），内含 agent 端 CLI 与工作流执行环境
- 外部服务：可选的 GitHub（issue/PR 关联、上下文提供者）、HTTPS 资源（上下文提供者）、npm registry（镜像构建）；遥测上报到 PostHog（可关闭）
- 数据存储：本地中央存储（项目、任务、工作流、配置），无云端后端

### 主要组件与核心链路

**主要组件与职责**：

| 组件 | 运行位置 | 职责 |
| --- | --- | --- |
| Rover CLI（packages/cli） | 宿主机 | 命令入口；项目管理；任务创建/查询/合并；编排容器与工作流；MCP 服务器 |
| Agent CLI（packages/agent） | 容器内 | 接收 Rover 指令；通过 ACP 驱动具体 AI 代理；执行工作流步骤 |
| Core（packages/core） | 共享库 | ProjectManager、GlobalConfigManager、上下文管理、显示辅助 |
| Schemas / Prompts / Telemetry | 共享库 | 配置校验、提示词模板、匿名遥测 |
| Docker/Podman | 宿主机 | 提供隔离容器运行时 |
| Git worktree | 宿主机文件系统 | 为每个任务提供独立代码副本与分支 |
| VSCode 扩展 | 宿主机（VSCode 内） | 图形化前端，调用 Rover CLI |

**核心链路（任务执行链路）**：

这是最能解释系统的关键链路：

1. **触发入口**：用户在项目目录运行 `rover task --agent claude`，CLI（program.ts）解析命令，ProjectManager 自动检测并注册项目到本地中央存储。
2. **隔离环境创建**：Rover 为任务创建 git worktree（独立分支，路径如 `rover/1-xxx`）和容器（如 `rover-1-1`）；挂载项目文件（按 excludePatterns 排除）；按 sandbox 配置注入 envs、initScript、网络规则。
3. **代理配置与启动**：容器启动时安装并配置所选 AI 代理（v2.3.2 起每次容器启动都安装代理凭证）；Rover 通过 ACP 与代理建立通信。
4. **工作流执行**：Rover 按工作流定义的步骤驱动代理；步骤类型包括 pre-context 注入、代理执行、command 执行（v2.3.0）；执行过程产生 jsonl 结构化日志（v2.2.0）；代理在容器后台运行直到完成。
5. **状态边界**：跨进程边界——CLI(宿主) ↔ 容器(agent CLI + AI 代理)；跨网络边界——容器可选地访问外部（受 allowlist/blocklist 约束）。
6. **结果回收与交付**：任务完成后代码变更与输出文档留在 worktree；用户经 `rover inspect/diff` 查看、`rover iterate` 再迭代、`rover merge/push` 合并推送；钩子（onComplete/onMerge/onPush）可在关键节点触发外部脚本。

**关键约束**：
- 隔离依赖容器运行时（Docker/Podman 必须可用）；无容器运行时则无法工作
- 代理凭证需从宿主机注入容器（macOS 上 #601 反映 /etc/shadow 挂载问题）
- 容器镜像缓存（v2.2.0）用于保证任务重启后一致性
- 网络默认 allowall，需用户主动配置 allowlist/blocklist 才能收紧

### 主要依赖

**运行时硬依赖**（影响安装、运行、部署）：
- Node.js 22+（CLI 与构建均要求；v2.0.0 起用 rmSync 兼容 Node 22+）
- Git（worktree、分支、合并、推送的基础）
- Docker 或 Podman（隔离沙箱运行时；无替代方案）
- 至少一个支持的 AI 代理及其 API 凭证（Claude Code / Codex / Cursor / Gemini CLI / Qwen Code / Copilot / OpenCode）

**构建期依赖**（不影响终端用户运行，仅影响源码构建）：
- pnpm（>=10，v2.0.0 起从 npm 迁移）作为包管理器与 workspace 编排
- tsdown 作为构建工具
- biome（v2.0.0 起）作为格式化与 lint

> 说明：不输出完整依赖树；上述均为影响安装、运行或部署的关键依赖。CLI 具体第三方库（如命令解析、容器 SDK 等）未在本次证据窗口中逐一核验，属未决项。

### 接口形态

Rover 在系统边界上提供以下接口类型：

- **CLI**（主要接口）：`rover <command>`，面向终端用户；命令覆盖任务全生命周期（task/list/inspect/diff/iterate/merge/push/rebase/restart/stop/reset/delete/cleanup/shell/logs/info/init）+ 工作流管理 + MCP。多数命令支持 `--json` 结构化输出（v2.2.0 集中化 JSON 输出类型）。
- **MCP 服务器**：`rover mcp` 将核心命令暴露为 MCP 工具，供 AI 助手程序化调用（如让 Claude Code 直接创建/检查 Rover 任务）。
- **VSCode 扩展 API**：通过扩展面板交互，底层调用 Rover CLI。
- **配置文件**：`rover.json`（项目级）与 `.rover/settings.json`（用户级）作为声明式接口，控制 sandbox、envs、hooks、网络、默认模型等。
- **ACP（代理通信协议）**：Rover 与容器内 AI 代理之间的内部通信协议，v2.0.0 起实现并逐步迁移所有代理到 ACP 模式（Claude/Gemini/Qwen/Copilot/OpenCode）。

> 不穷举端点或命令注册项；上述为接口类型与用途。

### 持久化方式

- **项目与任务状态**：存放在本地中央存储（ProjectManager 管理，v2.0.0 引入）；任务含状态、分支、迭代历史、上下文跟踪、沙箱元数据（含远程 DOCKER_HOST）。
- **代码变更**：持久化在 git worktree（本地文件系统分支），由 Git 管理；不存入数据库。
- **工作流定义**：内置工作流 + 用户自定义工作流（workflow add），存于本地工作流存储。
- **配置**：`rover.json`（项目级）与 `.rover/settings.json`（用户级）+ `~/.config/rover/` 全局配置目录（含遥测标记文件 `.no-telemetry`）。
- **容器镜像缓存**：v2.2.0 起缓存容器镜像以保证任务重启一致性。

> 无云端后端，所有状态本地持久化。具体存储格式（文件/JSON/SQLite）未在本次证据窗口中逐一核验，属未决项。

### 通信方式

- **宿主 CLI ↔ 容器**：通过容器运行时（Docker/Podman）的 exec/log follow 机制交互；CLI 启动容器、注入配置、跟随日志（SIGINT 时停止 log follow，见 v2.0.0 PR#457）。
- **Rover ↔ AI 代理**：通过 ACP（Agent Communication Protocol），v2.0.0 起实现的统一通信协议，逐步替代各代理的专有调用方式；ACP 支持模型/token/cost 提取（v2.0.0 PR#404/409）。
- **容器 ↔ 外部网络**：同步出站访问，受 allowlist/blocklist 规则约束（v2.0.0 PR#398）；支持 DNS、localhost 控制。
- **遥测**：异步上报到 PostHog（v2.1.0 PR#507 修复了遥测阻塞 CLI 退出的问题）。
- **钩子**：在生命周期事件（onComplete/onMerge/onPush）时同步执行用户 shell 命令，通过环境变量传递任务上下文。

> 不逐一审计心跳、锁、重试实现；上述为总体通信模式。

### 部署形态

**官方支持的部署方式**：

- **终端用户安装**：`npm install -g @endorhq/rover@latest`（CLI）+ VSCode 扩展（Marketplace）；需本地具备 Node.js 22+、Git、Docker/Podman
- **源码构建**：`pnpm install && pnpm build`（monorepo，需 pnpm>=10）；用于贡献者与自定义构建
- **运行形态**：纯本地，无服务端部署；Rover 不需要任何云端组件即可工作

**平台与权限**：
- 平台：macOS、Linux（官方文档与 Issue #601 反映 macOS 是主要平台之一）；Windows 支持程度官方未明确说明，属未决项
- 权限：需访问宿主机 Git 凭证（macOS 上尝试用 Keychain 读取，见 v1.6.0 PR#295）；需 Docker/Podman 守护进程；需将代理 API 凭证注入容器
- 网络边界：默认 allowall，可收紧为 allowlist；遥测可关闭

**重要区分**：
- Rover 是本地工具，不是 SaaS；不存在"部署到服务器"的形态
- 容器是运行时隔离手段，不等同于"产品本身是容器化服务"
- VSCode 扩展依赖本地已安装的 Rover CLI；若 CLI 不在 PATH，扩展会引导安装

## 未决项与证据边界

| 事项 | 状态 | 说明 |
| --- | --- | --- |
| ACP 协议具体规范 | 推导+未决 | 从 Release 记录可确认 ACP 是 Rover 自实现的统一代理通信协议，且各代理正在迁移到该模式；但协议的具体报文格式、传输层、是否为公开规范未在官方资料中说明 |
| 本地存储格式 | 未决 | 官方明确使用本地中央存储（ProjectManager），但具体是 JSON 文件、SQLite 还是其他格式未在证据窗口中核验 |
| CLI 第三方依赖清单 | 未决 | CLI 的具体第三方库（命令解析框架、容器 SDK、日志库等）未逐一核验；package.json 获取多次超时 |
| Windows 支持 | 未决 | 官方文档未明确说明 Windows 是否支持；macOS 与 Linux 可从文档与 Issue 推断为主要平台 |
| Autopilot 功能状态 | 推导 | Issues 与源码目录显示 Autopilot 正在开发中，但未见对应正式发布；具体设计仍在演进 |
| 维护恢复信号 | 未决 | 最近 4 个月无代码推送，但仓库未归档、Issues 仍开放；是否恢复开发需持续观察 |
| 远程沙箱执行 | 推导 | v2.1.0 PR#478 提及 sandboxMetadata 存储 DOCKER_HOST 用于远程沙箱执行，暗示支持远程容器主机，但官方未详细说明配置方式 |

**证据边界说明**：
- 本报告的架构结论基于 README、官网、Release 记录、仓库目录结构四类相互一致的直接证据，置信度较高
- 通信与持久化部分含架构推导（已标注），不等同于运行验证
- Issue 抽样为 open 状态前 20 条，不代表全部用户反馈；且最近 4 个月仓库无代码推送，反馈时效性有限

## 后续验证建议

1. **运行验证**：在本地安装 Rover 并执行一次完整任务链路（`rover init` → `rover task` → `rover inspect` → `rover merge`），以验证核心链路与持久化方式的实际表现
2. **ACP 协议核验**：阅读 `packages/agent/src/lib` 与 `packages/core` 中 ACP 相关实现，确认协议的传输层与报文格式，以回答"ACP 是否为公开规范"这一未决项
3. **本地存储格式核验**：定位 ProjectManager 实现，确认中央存储使用的是文件/JSON/SQLite
4. **Windows 支持核验**：查阅文档站或 Issue 中是否有 Windows 相关讨论，或尝试在 Windows 环境运行
5. **维护状态跟踪**：观察仓库 2026 年 Q3 是否有新提交或 Release，以判断是否为长期暂停还是暂时放缓
6. **Autopilot 进展跟踪**：关注 #555 及相关 Issues 的状态变化，了解自治流水线的发布时间表