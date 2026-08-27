# OpenTag（amplifthq/opentag）技术产品调研

> updated_by: Qoder
> updated_at: 2026-07-31 00:00:00
> evidence_window: 调研日期 2026-07-31；main 分支快照；最新版本 v0.9.0（2026-07-28 发布）

## 交付结论

1. **产品定位**：OpenTag 是一个开源（MIT）的"源线程 → 本地编码 Agent"路由与治理层：团队在 Slack、GitHub 等既有协作平台中 @mention OpenTag，它将请求打包为受控运行（Run），在用户本机通过 ACP 协议驱动 Codex / Claude Code 等编码 Agent 执行，并把结果与可审批的动作回执回帖到原线程。
2. **主体功能在 PC 本地，符合要求**：官方明确 local-first——本地 CLI 流程中不存在 OpenTag 云服务；dispatcher、runner、平台监听器、编码 Agent 全部运行在工作机本地，凭据也存本地。云端只有第三方协作平台（Slack/GitHub 等）作为消息入口，属辅助角色。
3. **macOS 工作机：符合要求**。通过 `npm install -g @opentag/cli`（要求 Node.js 22+）安装，`opentag setup` 引导配置；后台服务模式官方支持 macOS（LaunchAgent）。
4. **Windows 工作机：受限，官方口径未明确**。官方仅声明后台服务支持 macOS（LaunchAgent）与 Linux（systemd --user），"其他平台暂用终端模式（`opentag start`）"。npm 分发的 Node CLI 理论上可在 Windows 运行终端模式，但当前证据中**未发现任何 Windows 专属安装文档或验证声明**，Windows 可用性属未决项，需运行验证。
5. **维护状态非常活跃**：2026-06-29（v0.2.0）至 2026-07-28（v0.9.0）一个月内发布 7 个版本，每版含签名 commit、完整 changelog 与发布验证记录；但发布者为单一账号，社区反馈样本极少（公开 issue 极少），生态处于早期。

## 调研目标、范围与边界

### 调研目标

理解 OpenTag 是什么产品、为谁解决什么问题、系统如何构成；重点回答其能否在 Windows / macOS 工作 PC 上安装运行、主体功能是否位于 PC 本地。

### 核心问题

- 产品定位、目标用户、核心流程、功能边界、维护状态与生态反馈。
- 运行形态、主要组件、核心链路、依赖、接口、持久化、通信、部署形态。
- Windows / macOS 工作机安装方式、运行入口、依赖权限与卸载方式；主体功能位置判定。

### 覆盖范围

GitHub 仓库 README（中英）、Releases（v0.2.0–v0.9.0）、`docs/agent-install.md` 官方安装指南、docs 目录结构、公开 Issues 快照。

### 明确排除

不做源码审计、不做竞品比较、不调研遥测；云端若仅为网关只简单提及。

## 证据口径

- **官方资料（README / docs / Releases）**：本报告主要证据来源，记录时间为 2026-07-31 快照。
- **仓库元数据**：Star 1.4k / Fork 77 仅为公开快照，不等同采用率。
- **架构推导**：标注"推导"的内容基于官方文档描述，未经运行验证。
- **未决**：未经运行验证或官方未说明的事项列于"未决项"，不包装为已确认结论。
- 本次调研未执行安装或运行验证，全部结论基于公开文档证据。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：把既有工作线程（Slack、GitHub 等）变成一个受治理的 Agent 工作闭环——在线程里 @OpenTag，本地编码 Agent 干活，结果和可审批动作回到同一线程。
- **官方边界声明**：OpenTag 是"source-thread action layer"，不是通用聊天遥控台，也不只是一个连接器；强调三个属性：源线程原生（source-thread-native）、本地优先（local-first）、执行器中立（executor-neutral）。
- **目标用户**：已在 Slack / GitHub / GitLab / Linear / 飞书 / Telegram / Discord / Teams 上协作、且本机已具备 Codex / Claude Code 等编码 Agent 登录态的开发团队或个人开发者。

### 核心流程

用户视角的端到端流程（README Demo 场景）：

1. 在 Slack 线程中 `@opentag investigate this`；
2. OpenTag 本地监听器收到事件，dispatcher 做准入检查（权限、执行器能力），组装上下文包（context packet）；
3. 本地 runner 在隔离 worktree 中通过 ACP 启动所选编码 Agent（如 Claude Code）执行；
4. 运行结束后在原线程回帖：压缩后的结果摘要、产物链接（报告/补丁/PR 意向）与"动作回执"（receipt）；
5. 人在线程内点击 Apply 批准（仅当已配置的 adapter 确认可执行时才出现 Apply），得到真实的 GitHub PR；
6. 全程留有本地工作台账（agent work ledger），可用 `opentag status --run <run_id>` 审计。

### 功能地图与边界

- **平台接入**（8 个）：Slack、GitHub、GitLab、Linear、Lark/飞书、Telegram、Discord、Microsoft Teams。
- **编码 Agent 执行器**（7 个）：Codex、Claude Code、Cursor、OpenCode、Hermes、OpenClaw（取消为尽力而为）、Echo（仅测试）。全部经统一的 Generic ACP host 启动。
- **治理能力**：准入与权限检查、源线程审批（apply/approve/reject）、运行台账与审计 API、完成度契约评估（CompletionContract，v0.7.0 起）、人工升级（escalation）与豁免（waiver）、工厂化批量运行（factory recipes / workstreams，v0.8.0 起）。
- **边界**：规划权留在外部系统（backlog 归源系统、变更归 Git），OpenTag 不做依赖 DAG、不提供运营控制台；Echo 执行器仅供开发测试。
- **实验/受限能力**：OpenClaw 取消语义为 best effort；v0.9.0 的 Slack→Linear 查询路径官方明确"未做 provider-live 验证"。

### 维护状态与版本演进

- **维护状态判断**：非常活跃。最新版本 v0.9.0 发布于 2026-07-28（调研前 3 天）；发布带 GPG 签名、逐版 changelog、发布验证记录（v0.8.0 报告 138 个测试文件 / 1,798 个测试通过）。
- **关键版本演进**（只列方向性变化）：
  - v0.2.0（06-29）：CLI-first 包家族成型，五分钟本地安装路径。
  - v0.3.0（06-30）：Slack/GitHub 源线程审批按钮与回执。
  - v0.5.0（07-13）：新增 Discord/Linear/Teams 适配器；执行迁移到 ACP 与持久化 Attempt（租约、fencing token）。
  - v0.6.0（07-15）：所有内置 Agent 统一到 Generic ACP host，新增 Cursor/OpenCode/OpenClaw；强制 Node.js 22+。
  - v0.7.0（07-22）：完成度治理（执行成功 ≠ 有证据的完成），完成契约、豁免与升级。
  - v0.8.0（07-27）：软件工厂控制回路（immutable recipes、workstreams、批量准入）。
  - v0.9.0（07-28）：Slack 内只读 Linear backlog 查询。
- **趋势推导**：从"聊天触发单次运行"向"可治理、可审计、可批量的 Agent 软件工厂控制面"演进（推导，基于版本主题）。

### 生态与反馈

- **生态入口**：npm `@opentag` scope 下 16 个公共包；官网 opentag.im；docs 内含 adapter 编写指南与 hook ingest 契约，支持自定义 ACP Agent 与自定义 adapter。
- **公开反馈**：Star 1.4k、Fork 77（快照）；公开 issue 极少，抽样仅见 1 条开放 issue（#30"可以支持微信么"，2026-06-26），无法归纳普遍反馈主题。**样本边界**：issue 列表加载不完整且数量过少，社区真实使用情况证据不足。

## 技术架构调研

### 系统全貌与运行形态

组合形态：**本地 CLI + 本地常驻服务（或终端前台进程）+ 本地子进程执行器**。

- `@opentag/cli` 提供 `opentag` 命令，是安装、配置、启动、诊断的唯一入口。
- 启动后（服务模式或终端模式均）包含三个本地角色：本地 dispatcher、针对所选项目的本地 runner、所选平台的监听器（listener）。
- 编码 Agent 作为 ACP 子进程由 runner 拉起，运行于 OpenTag 创建的隔离 git worktree 或 scratch 目录。
- 无 OpenTag 云服务（官方 Privacy 声明）；另有 `opentag pair` 可将本地 runner 与远程 relay 配对（relay 属可选部署形态，本次不深入）。

### 主要组件与核心链路

主要组件（按 npm 包对应职责归纳）：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| CLI（@opentag/cli） | setup / start / service / status / doctor 等命令入口 | 本地 |
| Local Runtime（@opentag/local-runtime） | 进程内组装 dispatcher + runner + 平台运行时 | 本地 |
| Dispatcher（@opentag/dispatcher） | 准入、路由、审批、回调汇聚、审计 API | 本地 |
| Runner（@opentag/runner） | Attempt 租约执行、Generic ACP host、工作区隔离 | 本地 |
| 平台适配器（slack/github/…8 个包） | 事件接入、回帖、动作应用 | 本地（连接云端平台 API） |
| Governance（@opentag/governance） | 完成度评估、路由与 workstream 判定 | 本地 |
| Store（@opentag/store） | SQLite 持久化 | 本地 |

核心链路（README 官方流程图 + 文档描述）：

**链路 1：mention → 本地执行 → 回帖**
平台线程 @mention → 平台监听器接入（Socket Mode / webhook / polling / Gateway，视平台而定）→ 本地 dispatcher 准入（权限、执行器能力、上下文包）→ 本地 runner 认领 Attempt（租约 + fencing token）→ Generic ACP 执行器在隔离 worktree 启动编码 Agent → 产物与回执写入本地台账 → 回帖摘要 + 动作回执到原线程。跨网络边界仅两处：平台 API（入站事件/出站回帖）与编码 Agent 自身对其模型服务的访问。

**链路 2：线程内审批 → 系统写操作**
Agent 提议变更 → 线程内渲染 receipt → 仅当配置的 adapter 确认可执行时出现 Apply → 人批准 → adapter 以 Material Action（幂等键、去重、回执）方式应用（如创建 PR）。关键约束：外部副作用必须走受治理、可审计、防重放的动作通道。

### 主要依赖

- **运行时硬依赖**：Node.js 22+（v0.6.0 起强制）；npm registry（安装及 Codex/Claude Code/OpenCode 的 pinned ACP 启动包按需 npx 拉取）。
- **执行器依赖**：所选编码 Agent 的本地登录态（如 Codex/Claude Code 需 npx 可用且已登录；Cursor 需本地 cursor-agent CLI）。
- **平台侧依赖**：各平台的凭据（token / App / webhook）；Teams 额外要求公网 HTTPS 隧道直达本地 dispatcher。
- 不盘点完整依赖树。

### 接口形态

- **CLI**：安装、配置、服务管理、状态审计（`opentag status/doctor/…`）。
- **平台事件接口**：Slack Socket Mode / Events API、GitHub/GitLab/Linear webhook、Telegram 轮询、Discord Gateway、Teams Bot Framework webhook。
- **本地 HTTP**：dispatcher API（文档示例 `http://localhost:3030`），供 runner 客户端（@opentag/client）与审计使用。
- **进程间**：ACP（stdio、NDJSON 帧）连接编码 Agent；hook ingest 供外部 Agent 事件注入。
- 不穷举端点。

### 持久化方式

- 主要状态由本地 **SQLite**（@opentag/store）持有：Run、Attempt、审批、台账、完成度证据等（推导自包描述与 release 说明）。
- 配置：`~/.config/opentag/config.json`（本地、私有文件权限存凭据）。
- 运行态与隔离 worktree：`~/.local/state/opentag`。
- 全部本地形态，无云端持久化（官方声明）。

### 通信方式

- 平台 ↔ 本地：因平台而异——长连接（Slack Socket Mode、Discord Gateway）、入站 webhook（GitHub/GitLab/Linear/Teams）、轮询（Telegram）。
- 本地组件间：dispatcher HTTP + 进程内组装；runner 对 Attempt 使用租约/心跳/fencing（不深入实现细节）。
- runner ↔ 编码 Agent：ACP over stdio。
- 总体模式：事件驱动 + 异步运行 + 同步控制面命令。

### 部署形态

区分四种形态：

- **终端用户安装（本调研重点）**：npm 全局安装 CLI，见下节。
- **源码构建**：corepack pnpm install/build，另有 `opentag-dev` 开发命令（不属于终端用户路径）。
- **正式部署**：与终端用户安装同路径（本地服务模式），无独立服务端部署物。
- **可选 relay**：`opentag pair` 连接远程 relay；Teams 明确不支持 relay 模式。当前证据未展开 relay 细节。

#### 工作机安装（Windows / macOS）

**macOS（官方支持完整）**

- 安装：`npm install -g @opentag/cli@latest`（要求 Node.js 22+）→ `opentag setup`（交互式选择语言、监听地址、编码 Agent、本地项目、平台凭据、运行方式）；`opentag setup --service` 一步装好并启动后台服务。
- 运行入口：后台服务模式使用 **LaunchAgent**（`opentag service start/stop/status/logs`，支持登录自启）；或终端模式 `opentag start`。
- 依赖与权限：Node.js 22+、npm 网络可达；凭据以私有文件权限存于本地；无需管理员权限的系统级安装（LaunchAgent 为用户级，推导）。
- 卸载：`npm uninstall -g @opentag/cli` + 删除 `~/.config/opentag` 与 `~/.local/state/opentag`；服务用 `opentag service uninstall`。

**Windows（官方口径不明确，未决）**

- 官方仅声明：后台服务模式支持 macOS（LaunchAgent）与 Linux（systemd --user），"**on other platforms, use terminal mode with `opentag start` for now**"。
- 当前证据中未发现 Windows 专属安装文档、路径约定（config/state 目录写法均为 XDG 风格）或发布验证记录。
- 合理推导：作为 npm 分发的 Node CLI，Windows 上终端模式可能可运行，但涉及 git worktree、LaunchAgent/systemd 之外的服务管理、`~/.local/state` 路径等均未经官方确认——**Windows 可用性必须经运行验证后才能采信**。

**判定（对照本调研焦点）**：macOS 工作机符合要求；Windows 工作机官方支持缺乏明确证据，当前只能判定为"受限/未决"，不得当作已支持。产品并非仅 Linux 可用，不触发"仅 Linux 即不符合"的直接否决。

#### 主体功能运行位置

- **主体功能运行在 PC 本地**：dispatcher、runner、平台监听、编码 Agent 执行、持久化、凭据全部在本机；官方 Privacy 明确"本地 CLI 流程中没有 OpenTag 云服务"。**符合要求**。
- 云端角色仅为：第三方协作平台 API（消息入口/出口，产品外部依赖）与编码 Agent 各自的模型服务（属执行器自身，非 OpenTag 架构）。

#### 云端网关（如存在）

- OpenTag 自身无云端网关。可选的远程 relay（`opentag pair`）承担消息中转角色，属简单网关性质，按本 RUNBOOK 约束仅提及不深入。Teams 场景需用户自备公网 HTTPS 隧道（ngrok/devtunnel）作为入站转发，同样只是转发通道。

## 未决项与证据边界

1. **Windows 可用性**（关键未决）：官方无 Windows 安装口径；终端模式在 Windows 的实际可运行性、路径行为、服务化方案均未验证。
2. **安装与运行未实测**：本报告全部基于文档证据，未在任何机器上执行安装验证。
3. **relay 模式细节**：`opentag pair` 的 relay 部署形态、安全边界未调研（有 `docs/relay-security-hardening.md` 可作后续入口）。
4. **社区反馈**：issue 样本过少，无法评估真实使用中的稳定性与常见坑。
5. **SQLite 为唯一持久化**的判断来自包描述，未经 schema 或运行验证（且按 RUNBOOK 不做 schema 扫描）。

## 后续验证建议

1. 在一台 macOS 工作机上执行完整安装验证：`npm install -g @opentag/cli` → `opentag setup --service` → `opentag doctor`，记录权限提示与网络要求。
2. 在一台 Windows 工作机上验证终端模式：Node 22 + `npx @opentag/cli setup` + `opentag start`，确认是否可用及路径/服务化限制；结果直接决定 Windows 结论。
3. 若考虑团队采用，针对所选平台（如飞书或 Slack）做一次真实 mention → PR 的端到端冒烟，核对审批回执与审计台账行为是否与文档一致。
