# Orca 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-20 23:02:58
> evidence_window: 2026-07-19；官方文档 onorca.dev/docs 全量导航页（含 What is Orca、Worktrees、Supported agents、Agents & sessions、Hibernation、Usage-tracking、Hooks & memory、Annotate AI Diff、Design Mode、Orca CLI、Orchestration、Computer use、Skills & MCP、Mobile companion、SSH worktrees、Remote Orca Servers、Privacy & Telemetry、Settings reference 等）；官方下载页 onorca.dev/download；GitHub 仓库 stablyai/orca（README、Releases 列表共 84 页，Release Notes v1.4.144 / v1.4.145 / v1.4.146-rc.0）；Y Combinator 公司页 ycombinator.com/companies/stably-ai-orca

## 交付结论

1. **Orca 是面向专业开发者的桌面 ADE（Agent Development Environment）**，定位为"AI Orchestrator for 100x builders"——把多个 AI 编码 Agent（Claude Code、Codex、OpenCode、Pi 等）放在同一桌面应用内并行运行，每个任务独占一个 Git worktree、一个 Agent 终端、一个浏览器标签。由 Stably AI（Y Combinator 公司）开发，MIT 开源，仓库 stablyai/orca。
2. **运行形态是"本地桌面应用 + 可选 SSH 远端执行 + 可选 Remote Orca Server + 移动端只读伴侣"**：桌面应用在用户工作 PC 上承担主体运行时（终端、编辑器、浏览器、Agent 编排、worktree 管理），所有 Agent CLI 直接在本地执行，使用用户自有的 Claude/Codex 等订阅。官方明确写道"Not cloud-only. Orca runs locally. Remote agents happen through SSH to machines you own."
3. **完全符合本调研的核心焦点要求**：Windows 与 macOS 工作机均有官方签名安装包（Windows 由 SignPath.io/SignPath Foundation 代码签名，macOS 同时提供 Apple Silicon、Intel DMG 与 Homebrew cask），主体功能运行在 PC 本地而非云端，云端仅承担极轻的辅助角色（匿名遥测经 PostHog，且可一键关闭；第三方账号由用户直接与 GitHub/Linear/Jira 等对接，不经 Orca 中转）。
4. **官方明确无云中继、无账号系统**：移动伴侣与桌面"配对交换直接发生在桌面与手机之间；Orca 不使用云端中继；关闭桌面即断开连接"；遥测文档直接写明"Orca has no account system"。这意味着 Orca 不存在"客户端只是壳、真正工作在云端"的形态。
5. **项目处于高度活跃的日常迭代状态**：GitHub 21.8k Stars、1.6k Forks，Release 列表共 84 页；2026-07-18 同日发布稳定版 v1.4.145 与候选版 v1.4.146-rc.0；README 自述"we ship daily"；近期版本引入跨端 native chat、Jira 自托管支持、SSH relay 持久化、Computer Use、macOS 菜单栏状态项等方向性能力。
6. **架构上是 Electron 类桌面应用**：依据 Releases 资产清单（`.blockmap`、`latest.yml`、`latest-mac.yml` 等 electron-builder 标志）、Release Notes 中对 Monaco editor、xterm.js AltGr 处理、WebGL 终端 glyph atlas、renderer/main 进程、native macOS menu bar item 的描述，以及下载页对 Windows 10/11 x64 安装包与 macOS DMG 的命名，可判定为基于 Electron + TypeScript 的桌面应用，内嵌 Monaco 编辑器、自研 WebGL 终端渲染器（Ghostty-class）、Chromium 浏览器标签（Design Mode）。
7. **本地编排采用“交互式 GUI 为主 + CLI 命令式可脚本化”**：不存在声明式多 Agent 编排配置文件；GUI 逐个创建 worktree，CLI 可批量创建，Orchestration `run` 可自动派发到 worker。
8. **结果选择与合并由用户主导**：Diff Viewer、多 pane split 与 Annotate AI Diff 用于比较和反馈；胜出 worktree 由用户 commit/push/PR，败者可删除，不自动 merge/cherry-pick。
9. **Agent 与 Orca 通过 PTY/CLI 双向协作**：Orca→Agent 由 `terminal send` 注入 stdin；Agent→Orca 依靠 `orca` CLI 与 Skills。Orca 是 MCP client/宿主，不是 MCP server。
10. **状态、权限与会话治理依赖 Agent 自身能力**：状态检测组合 OSC title、退出码、Agent 事件与 lifecycle marker；Yolo/Manual 通过各 Agent CLI 参数实现；限流读取本地状态；Hibernation 依靠 Agent 原生 resume 能力。
11. **协作拓扑同时支持 race 与 supervisor/worker**：默认多个 worktree 纯并行、无 Agent 间通信；启用 `orca orchestration` 后使用 coordinator、worker、共享 inbox、task records 与 decision gate。
12. **PTY daemon 是本地编排的运行底座**：托管 PTY 生命周期、跨应用重启重连、scrollback 持久化与远端 runtime；内部职责仍有部分仅由 Release Notes 与文档推导。

## 调研目标、范围与边界

### 调研目标

理解 Orca 是什么、为谁解决什么问题、如何在技术上工作，特别验证其在 Windows/macOS 工作机上的安装方式、主体功能运行位置，以及在工作 PC 本地编排多个 AI 编码 Agent 的具体机制。

### 核心问题

- 产品：Orca 解决什么问题？目标用户是谁？核心流程与功能边界如何？维护状态、版本演进、生态反馈如何？
- 架构：系统以什么形态运行？由哪些主要部分组成？各部分如何协作？关键约束（部署、隔离、远端）是什么？
- 焦点：Windows 与 macOS 工作机如何安装与运行？主体功能在 PC 本地还是云端？是否存在云端网关？
- 编排：Agent 如何被检测、启动、并行派发、反馈、判定状态、恢复会话并形成 supervisor/worker 协作？

### 覆盖范围

- 产品定位、目标用户、核心流程、功能边界、维护状态、版本演进、生态与反馈。
- 技术运行形态、主要组件、核心链路、主要依赖、接口形态、持久化、通信、部署形态。
- Windows/macOS 工作机安装方式、入口、依赖、权限与卸载；主体功能运行位置；云端网关存在与否。
- 本地编排机制：并行与扇出、Agent 检测与启动、双向反馈、状态检测、权限与限流、Hibernation、Computer Use、协作拓扑与 PTY daemon。

### 明确排除

- 不做源码审计：不逐文件检查实现、并发、锁、队列或心跳；不为确认一个接口而枚举整个路由层。
- 不做竞品比较：不引入 Cursor、Copilot、Zencoder、Cline 等做横向对比或选型矩阵。
- 不做遥测/监控调研：不展开埋点、上报通道、指标定义、Dashboard 或告警规则的调查；仅在"主体功能运行位置"结论中引用官方遥测页的一句话证据。
- 不做性能 benchmark、不做集成实施。
- 编排机制部分不读 `src/` 源码；文档未明确的实现细节标记为未决，不将推导包装为确认事实。

## 证据口径

| 证据类型 | 使用方式 | 边界说明 |
| --- | --- | --- |
| 官方产品页（onorca.dev 首页） | 定位、slogan、核心特性、生态入口 | 宣传性表述需与官方文档、Release 交叉确认 |
| 官方文档（onorca.dev/docs/*） | 产品定义、运行形态、移动配对、SSH worktrees、Remote Orca Servers、Settings、Privacy & Telemetry | 直接权威来源；文档可能滞后，已记录证据时间为 2026-07-19 |
| 官方编排文档（onorca.dev/docs/*） | Worktrees、Supported agents、Agents & sessions、Hibernation、Usage-tracking、Hooks & memory、Annotate AI Diff、Design Mode、Agents feed、CLI、Orchestration、Computer Use、Skills & MCP | 直接权威来源；文档可能滞后，已记录证据时间为 2026-07-19 |
| 官方下载页（onorca.dev/download） | Windows/macOS/Linux 安装包形态、Homebrew 命令、移动端入口 | 仅证明当前快照，不外推历史最低支持版本 |
| GitHub 仓库元数据（stablyai/orca） | README、License（MIT）、Stars/Forks、Releases 列表、Release Notes 标题与资产清单 | 仅证明当前快照与发布活跃度，不等于产品质量或采用率 |
| Release Notes 文本（PR 标题与 commit message） | 技术栈推断（Monaco、xterm.js、WebGL、Electron 资产、SSH relay）、版本演进方向 | 用于验证已提出的架构问题，不展开为源码审计 |
| Y Combinator 公司页 | 公司身份、定位 | 仅公司层信息，不涉产品实现 |
| 架构推导 | 组件关系与数据流解释 | 标注为推导，不等同于运行验证 |
| 未决 | 缺少运行验证、官方说明或足够反馈 | 不得包装为已确认结论 |

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Orca 是为专业开发者打造的桌面 ADE（Agent Development Environment），把多个 AI 编码 Agent 放在同一桌面应用内并行运行，每个任务独占一个 Git worktree、一个 Agent 终端、一个浏览器标签，由用户自带模型订阅。
- **目标用户**：官方文档明确"people who already write code for a living and want to use AI as leverage — not as a replacement"——即已经以写代码为生、希望把 AI 当作杠杆而非替代品的工程师；"假设你读 diff、关心 commit、保持 worktree 整洁"；并明确"如果你在找无代码工具，Orca 不是"。
- **核心痛点**：单 Agent 串行运行导致需要 stash、branch 切换、上下文丢失；多个 Agent 分散在不同终端难以追踪；AI 生成 diff 缺乏严肃评审；已有 Claude Code/Codex/Cursor CLI 订阅但缺一处编排。
- **商业模式与实体**：开发方为 Stably AI，在 Y Combinator 公司页登记为"Orca is an ADE built for engineers who run 10 to 100 coding agents at once"。产品本体以 MIT 开源（仓库 stablyai/orca），不卖模型订阅、不卖账号；用户自带 Claude/Codex/OpenCode 等订阅。当前未发现付费层、企业版或私有化部署的独立商业产品线（相对 WORKSHOP-010 中 Zencoder 的多档定价）。

### 核心流程

依据官方"What is Orca?"与 README，端到端流程为：

1. 用户在 Windows 或 macOS 工作机安装 Orca 桌面应用（或 Linux，但 Linux 不在本调研焦点内）。
2. 在 Orca 中打开一个 Git 仓库作为 Project；Orca 为每个新任务创建独立 Git worktree（真实 git worktree，可在外部用 plain git 操作）。
3. 用户在 worktree 内启动一个或多个 Agent CLI（Claude Code、Codex、OpenCode、Pi 等任意 CLI Agent），Agent 进程在本地运行，使用用户自有订阅与本地 PATH 中的 Agent 二进制。
4. 多个 worktree 可并行——同一 prompt 扇出到 5 个 Agent、5 个 worktree，比较结果后合并胜出者；每个 worktree 拥有独立终端（Ghostty-class WebGL 渲染、可无限分屏、scrollback 跨重启保留）与独立浏览器标签（Design Mode 可点击任意 UI 元素将 HTML/CSS/截图送入 Agent prompt）。
5. Agent 产出 diff 后，用户在 Orca 内对 diff 行做评论（Annotate AI Diffs）、审查、编辑、提交，无需离开应用；GitHub/Linear PR 与 issue 可在应用内浏览、从任务直接开 worktree。
6. 可选远端：通过 SSH worktrees，把 worktree 与 Agent 进程放到用户自有的远端机器（GPU box、长跑构建机）；通过 Remote Orca Servers，让远端机器跑 `orca serve` 作为主体运行时，本地桌面、浏览器、移动端都作为 UI 客户端连接。
7. 可选移动：移动伴侣（iOS/Android）与桌面配对后提供只读视图与少量控制（回复 prompt、休眠 worktree、提交源码、切换账号），桌面始终是 source of truth。

### 功能地图与边界

**当前可用能力**（依据 README 特性表与 Settings reference，非穷举）：

- **桌面应用核心**：Parallel Worktrees（并行 worktree 隔离）、Terminal Splits（Ghostty-class WebGL 终端、无限分屏、scrollback 跨重启）、Design Mode（Chromium 窗口内点击 UI 元素送 HTML/CSS/截图给 Agent）、GitHub & Linear 原生集成（PR/issue/项目板浏览、从任务开 worktree）、SSH Worktrees（远端执行）、Annotate AI Diffs（diff 行评论回送 Agent）、Drag Files to Agents（VS Code 编辑器、拖文件入 prompt）、Orca CLI（`orca worktree create`、`snapshot`、`click`、`fill` 等供 Agent 驱动 Orca）。
- **辅助能力**：Quick Open、Account switcher & usage tracking（Claude/Codex 用量与限流重置显示、账号热切换）、Rich repo previews（Markdown/图片/PDF 预览）、Computer Use（让 Agent 操作桌面应用与可见 UI）、Notifications & unread state。
- **远端与多端**：SSH Worktrees（laptop 拥有 runtime、远端为执行目标）、Remote Orca Servers（远端机器跑 `orca serve` 拥有 runtime、本地为 UI 客户端）、Mobile companion（iOS/Android，与桌面直接配对、无云中继）、Browser client（`orca serve` 打印 browser URL，含 web 客户端 bundle）。
- **集成**：GitHub OAuth、Linear API token、Jira（含自托管 Server/DC，PAT + username/password）、MiniMax（本地 session cookie）、MCP servers、OpenAI Transcription（用户自带 API key 用于云端 STT）。
- **设置面**：General、Appearance、Git、Terminal（含 Warp 主题导入、Ghostty 主题导入、JIS Yen 转换、Windows 默认 shell）、Quick Commands、Agents（已检测/自定义 Agent、Agent Permissions Yolo/Manual、Claude/Codex 账号列表、Startup hooks）、Browser、Integrations、Notifications、Voice、SSH、Remote Orca Servers、Shortcuts、Repository、Experimental。

**实验性能力**（Settings → Experimental）：Activity Page（Slack 风格 worktree 事件流）、Compact worktree cards、Agent hibernation（暂停空闲后台 Agent 并在重开时自动恢复）。

**边界**：

- Orca 不是模型，也不替代 Git——worktree 是真实 git worktree，可外部用 plain git。
- Orca 不是 no-code 工具，假设用户读 diff、关心 commit。
- 移动伴侣"intentionally not a full editor——它是你已经运行的桌面的遥控器"。
- 平台本体 MIT 开源（仓库可见），不存在"平台闭源 + 配置库开源"的拆分；与 WORKSHOP-010 中 Zencoder 的"平台闭源 + zenagents-library 开源"形成对照。
- 远端能力（SSH worktrees、Remote Orca Servers）依赖用户自有的远端机器与可达地址（LAN IP / Tailscale / SSH 转发 / 隧道），Orca 不提供云中继或托管远端。

### 维护状态与版本演进

- **维护状态判断**：高度活跃。README 自述"we ship daily, so this list is perpetually behind. The changelog is the real feature list."。GitHub Releases 列表共 84 页，2026-07-18 同日发布稳定版 v1.4.145 与候选版 v1.4.146-rc.0；当前 Stars 21.8k、Forks 1.6k。
- **发布渠道**：stable、rc（Release Candidate）、perf-tagged prerelease（Settings 中 Cmd-click/Ctrl-click Check for Updates 触发）、GHES（GitHub Enterprise Server，从 v1.4.145-rc.0.ghes 标签可见）。
- **关键版本演进**（不穷举，依据 v1.4.144 / v1.4.145 Release Notes）：
  - v1.4.144（2026-07-17）：引入"native chat view across mobile, desktop, and web"（跨端 native chat）、"Add a native macOS menu bar status item with activity indicator"、Jira 自托管 Server/DC 支持（PAT + username/password）、AI Vault view options 持久化、SSH 持久 PTY 重连修复（"Remote terminal sessions are leased through the relay running on the remote host, so they survive Orca closing on the laptop"）。
  - v1.4.145（2026-07-18）：i18n 修复（韩文、中文、日文术语）、Pi session resume、SSH relay native deps 修复、mobile WebSocket 接受路径硬化、terminal viewport ownership 事务化、Codex 限流 chip 与重置倒计时同步、skill freshness 检测与更新 rail。
  - 方向性观察：从"并行 worktree + 多 Agent 编排"基础能力 → 跨端 native chat（移动/桌面/Web 同一 chat 视图）→ macOS 原生集成（菜单栏状态项）→ 自托管 Jira 等企业集成 → SSH relay 持久化与 Computer Use，重心从"桌面并行 Agent"向"多端协同 + 企业集成 + 远端持久运行"扩展。
- **新贡献者**：v1.4.144 与 v1.4.145 各引入 4–6 位 new contributors（@ghee-yeh、@geelen、@nasagong、@hanjoonchoe、@weibiansanjue、@eisen0419、@jiyongjung0、@haazz、@itisbryan、@syabro 等），显示社区贡献活跃。

### 生态与反馈

- **生态入口**：官网 onorca.dev、文档 onorca.dev/docs、下载页 onorca.dev/download、GitHub 仓库 stablyai/orca、GitHub Releases、Discord 社区、Twitter/X @orca_build、WeChat 群（官方 README 提到"Groups 1 and 2 are both full — now you can join the third one"，反映中文用户基数较大）、App Store（iOS，id6766130217）、TestFlight、GitHub Releases 提供 Android APK。
- **支持渠道**：GitHub Issues、Discord、Twitter、WeChat；官方明确"We ship fast. Missing something? Request a new feature."。
- **反馈样本及其边界**：
  - 首页引用 Jason Zhou（@jasonzhou1993）推文："I tried almost every parallel ADE. So far loving @orca_build the most. Native TUI + File viewer, Custom Commands, Mobile app support, CC/Codex usage tracking, Design mode built in, Github -> Agent task tracking. Truly feeling the 10x."——**单个样本，不代表普遍反馈**。
  - 高 Stars 数（21.8k）与 WeChat 群饱和（前两群满）反映社区活跃，但 Stars 与群饱和度只是公开快照，**不直接等于产品质量或采用率**。
  - 未在本次证据窗口内系统抽样 Issue/Discussion 的重复主题，相关反馈主题留为未决。
- **官方承诺 vs 已发布**：README 与 Changelog 自述"ship daily"，与 Releases 同日多版本发布互相印证；Mobile companion、SSH Worktrees、Remote Orca Servers、Design Mode、Computer Use 均为已发布能力（非规划）。

## 技术架构调研

### 系统全貌与运行形态

- **运行形态**：Electron 类桌面应用 + 可选 headless 服务端（`orca serve`）+ 可选移动伴侣 + 可选浏览器/web 客户端。**主体运行时位于桌面应用所在的工作 PC**，远端能力通过 SSH 或 Remote Orca Server 模式扩展，但远端是用户自有机器而非 Orca 托管云。
- **系统边界**：
  - 本地桌面应用：承担 UI、终端、编辑器、浏览器、worktree 管理、Agent 编排、PTY 持有、Settings/账号/状态存储。
  - Orca CLI：随桌面应用捆绑的命令行工具（`orca` 或 Linux 上的 `orca-ide`），可被 shell 与 Agent 调用（`orca worktree create`、`snapshot`、`click`、`fill`、`orca environment add`、`orca terminal create`、`orca serve` 等）。
  - SSH worktree relay：用户远端机器上由 Orca 通过 SSH 启动的辅助进程，租赁 PTY 会话、跨 Orca 关闭存活、5 分钟宽限重连窗口。
  - Remote Orca Server：远端机器跑 `orca serve` 拥有完整 Orca runtime（repos、worktrees、terminals、tabs、provider checks、agent sessions），桌面/浏览器/移动端作为 UI 客户端连接。
  - 移动伴侣：iOS/Android 应用，配对后只读视图 + 少量控制，**直接与桌面或 Remote Server 通信，无云中继**。
  - 外部第三方：GitHub、Linear、Jira、MiniMax、MCP servers、OpenAI Transcription——均由用户直接认证，不经 Orca 中转。
- **初步假设与未决点**：
  - 假设（架构推导）：桌面应用基于 Electron + TypeScript，内嵌 Monaco editor、xterm.js（自研 WebGL 渲染层）、Chromium 浏览器标签；依据是 Release 资产形态（`.blockmap`/`latest.yml`/`latest-mac.yml`）、Release Notes 中对 Monaco、xterm.js AltGr、WebGL glyph atlas、renderer/main 进程的描述。
  - 未决：移动伴侣与桌面"无云中继"的具体连接方式（LAN 直连？Tailscale？NAT 穿透？）官方文档未在 2026-07-19 抓取的页面中详述；Pairing 流程提到"配对交换直接发生在桌面与手机之间"，但物理网络路径未明确。

### 主要组件与核心链路

**主要组件**（不按文件树，按运行时角色）：

1. **Orca Desktop App（主进程 + renderer）**——Electron 类桌面应用。承担 UI、Quick Open、Settings、Account switcher、worktree 侧栏、diff 视图、Source Control 抽屉、菜单栏状态项（macOS）。
2. **Editor 子系统**——Monaco editor（Release Notes #9286 明确"Monaco's registered proto language id for .proto files"）；autosave、文件树、Markdown/图片/PDF 预览。
3. **Terminal 子系统**——xterm.js 基座 + 自研 WebGL 渲染器（Release Notes 提及"WebGL atlas changes"、"Ghostty-class terminals with WebGL rendering"）；无限分屏；scrollback 跨重启（cold restores replay at recovered grid）。
4. **PTY / Runtime 层**——本地 PTY 守护进程（Release Notes #7836"stop daemon reattach/kill race from orphaning restored terminals"）；可被 whole-tab close 拆除；与 SSH relay、Remote Server 通信。
5. **Worktree / Git 层**——真实 git worktree 管理；git status 轮询带 duty-cycle、cancel、cache（#8922）；commit 签名、external git tools 集成；branch 自动重命名。
6. **Agent 编排层**——检测已安装 Agent（claude-code、codex、gemini 等 fixed list）、Startup hooks、Agent Permissions（Yolo/Manual）、Claude/Codex 账号列表与限流跟踪、Pi session resume、subagent agent_end 抑制。
7. **Browser 子系统**——内嵌 Chromium 窗口；Design Mode 点击 UI 元素提取 HTML/CSS/截图进 prompt；local HTTPS cert proceed；Web/Mobile viewport 切换；Devtools opt-in。
8. **Orca CLI**——`orca` 命令，供 shell 与 Agent 调用；子命令 `worktree create`、`terminal create`、`environment add`、`serve`、`file open`、`snapshot`、`click`、`fill` 等。
9. **SSH relay（远端可选）**——SSH 目标主机上的辅助进程；租赁 PTY 会话；端口转发（扫描 `/proc/net/tcp`、特权端口自动 remap）；passphrase 仅内存持有、session 关闭即清。
10. **Remote Orca Server（远端可选）**——`orca serve --pairing-address <host> [--port 6768] [--mobile-pairing]`，前台运行，打印 runtime endpoint + pairing URL；可被桌面、浏览器、移动端、外部 backend 通过 CLI/API 接入。
11. **Mobile Companion**——iOS/Android 应用；与桌面或 Remote Server 配对；只读 worktree 列表、终端 scrollback、源码控制、账号切换；push 通知镜像桌面通知。
12. **Integrations 层**——GitHub OAuth、Linear API token、Jira（含自托管 Server/DC）、MiniMax session cookie、MCP servers——均在 Settings → Integrations 配置，凭据本地存储。

**核心链路 1：本地并行 Agent 链路**（最能解释系统）

1. 用户在 Orca 桌面应用打开 Project，触发"Create Worktree"——Orca 在本地调 `git worktree add`，分配 marine-creature 命名分支。
2. 用户在 worktree 内启动 Agent（如 Claude Code）；Orca 在本地 PTY 中 spawn 该 Agent CLI 进程，使用本地 PATH 中的 `claude-code` 二进制与本地凭据/订阅。
3. Agent 产出 diff；Orca diff 视图渲染，用户对 diff 行 Add Review Note（Mod+Alt+N），评论回送给 Agent。
4. Agent 完成时触发系统通知与 unread 状态；用户在 Source Control 抽屉 stage/unstage/commit，或在 GitHub/Linear 抽屉创建 PR、Link 现有 PR。
5. 全程 Agent 进程、worktree 文件、PTY 会话都在本地工作 PC；不跨云。

**核心链路 2：SSH worktree 链路**（解释远端执行边界）

1. 用户在 Settings → SSH 添加目标（host/user/port/identity file；从 OpenSSH config 导入）。
2. 创建 worktree 时选择 SSH target；Orca 通过 SSH 在远端主机执行 `git worktree add`、启动 Agent CLI 进程；Agent 进程与 PTY 都在远端主机。
3. Orca 在远端主机上启动 relay，租赁 PTY 会话；用户在本地编辑器看到文件事件同步、diff、浏览器都"feel local"。
4. Orca 关闭后远端 PTY 不被杀死（relay 在远端运行，5 分钟宽限内重连可恢复，scrollback 完整）。
5. 远端机器必须是用户自有（GPU box、构建机），Orca 不提供托管远端。

**核心链路 3：移动伴侣链路**（解释"无云中继"）

1. 用户在桌面 Orca 的 account/status 菜单触发配对，桌面显示 one-time pairing code。
2. 移动端 Orca 选择 Pair，粘贴 code 或扫描 deep link。
3. 配对交换"直接发生在桌面与手机之间"；Orca 用产生的 device token 标识该手机。
4. 关闭桌面即断开连接；重开桌面手机自动重连。
5. 移动端可看 worktree 列表、终端 scrollback、源码控制、账号切换、push 通知；不是完整编辑器。

### 主要依赖

**用户运行时硬依赖**（影响安装与运行）：

- **桌面应用本身**：Windows 10/11 x64、macOS（Apple Silicon 或 Intel）、Linux（AppImage 或 AUR）；自包含 Electron 包，不要求预装 Node.js 或浏览器运行时。
- **Git**：worktree 是真实 git worktree，需要本地有 git 可执行（Orca 在 Windows 上设置 UTF-8 console code page for Git Bash terminals，说明对 Windows Git Bash 有具体处理）。
- **Agent CLI**：用户自带的 `claude-code`、`codex`、`opencode`、`pi` 等 CLI；Orca 不捆绑这些 Agent，只在 PATH 中检测；Agent 凭据/订阅由用户自有。
- **OpenSSH（SSH worktrees 可选）**：远端 SSH 目标主机需要可达；Orca 支持 OpenSSH config 与 Include 指令、connection reuse、jump host、proxy。
- **Node/npm（SSH relay 可选）**：Release Notes #9165"select a complete Node/npm toolchain for the relay"与 #8686"repair unbuilt relay native deps"显示 SSH relay 在远端需要 Node/npm 工具链。

**开发依赖**（不在本调研焦点内）：从 Release Notes 推断开发栈含 TypeScript、Vitest（"native-smoke vitest"）、electron-builder、Monaco、xterm.js，但不展开。

**不做的事**：不输出完整依赖树、不区分 dev 与 runtime 的次要依赖。

### 接口形态

- **GUI**：桌面应用主接口；Settings、Quick Open、worktree 侧栏、diff 视图、终端分屏、浏览器标签、菜单栏状态项。
- **CLI**：`orca` 命令，子命令含 `worktree create`、`terminal create`、`environment add`、`serve`、`file open`、`snapshot`、`click`、`fill`；供 shell 与 Agent 驱动 Orca 本身。
- **WebSocket**：移动伴侣与桌面/Remote Server 通信（Release Notes #9247"harden WebSocket accept path against socket overload"、#9142"cancel unread fetch response bodies so a peer socket close cannot crash the app"）。
- **HTTP/HTTPS**：`orca serve` 暴露 runtime endpoint 与 browser URL；浏览器 web 客户端经此连接；local HTTPS cert proceed（#8454/#9104）。
- **SSH**：SSH worktrees 模式下与远端主机通信；支持 OpenSSH config、jump host、proxy、connection reuse。
- **MCP**：用户在 Settings → Integrations 配置 MCP servers，Orca 作为 MCP 客户端接入。
- **第三方 API**：GitHub OAuth、Linear API、Jira（含自托管 PAT+username/password）、MiniMax session cookie、OpenAI Transcription API——均由用户直接认证。

**不穷举端点/handler/命令注册项**。

### 持久化方式

- **本地 JSON 状态文件**：Release Notes #9290"compact JSON for durable-state save payload (drop pretty-print)"直接证明 Orca 用本地 JSON 持久化 durable state，且近期做了性能优化（去掉 pretty-print、压缩 payload）。
- **真实 git worktree**：所有 worktree 是真实 git worktree，文件在用户工作 PC 的本地磁盘；可在外部用 plain git 操作。
- **本地凭据/账号列表**：Claude/Codex 账号列表、SSH passphrase（session 内存，关闭即清，可选更长 TTL）、MiniMax session cookie、Linear/Jira API token、OpenAI API key（用于 STT）均在本地。
- **远端 PTY 会话**：SSH worktree 模式下，远端 relay 租赁 PTY 会话，**跨 Orca 关闭存活**，5 分钟宽限内重连可恢复完整 scrollback。
- **Remote Orca Server 模式**：远端机器拥有 repos、worktrees、terminals、tabs、provider checks、agent sessions——所有 runtime state 都在远端机器；本地桌面是 UI 客户端。
- **遥测本地 ID**：匿名随机 ID 存储在本地机器（不展开，仅作为"无账号系统"的佐证）。
- **不扫描全部 schema 或枚举数据表**。

### 通信方式

- **WebSocket**：移动伴侣与桌面/Remote Server 之间（#9247）；Orca 关闭桌面即断开移动连接（无云中继），重开自动重连。
- **HTTP/HTTPS**：`orca serve` 的 runtime endpoint 与 browser URL；浏览器 web 客户端经此连接；第三方 OAuth/API（GitHub/Linear/Jira/MiniMax/OpenAI）。
- **SSH**：SSH worktrees 模式下与远端主机通信；OpenSSH connection reuse 在 macOS/Linux 默认启用以减少 SSH 握手开销；jump host 与 proxy 可配。
- **进程间**：Orca 主进程与 renderer、PTY daemon、终端子系统的进程间通信；具体 IPC 机制不在本调研焦点内（不为确认通信模式而审计所有锁、队列、心跳、重试代码）。
- **同步/异步/轮询/长连接**：Agent status 在 sidebar 与 Agents feed 实时传播（local 与 SSH 模式相同）；git status 轮询带 duty-cycle、cancel、cache 以降低 idle git load；推送通知镜像桌面通知（agent finishes）。

### 部署形态

#### 工作机安装（Windows / macOS）

**Windows**：

- **安装方式与入口**：从 onorca.dev/download 抓取"Windows — Windows 10/11 x64 installer"（指向 `/download/started?platform=windows`），或从 GitHub Releases 直接下载 `.exe` 安装包（资产列表中可见 `Orca-1.4.145.exe` 类资产）。
- **代码签名**：README 明确"Windows code signing sponsored/provided by SignPath.io, certificate by SignPath Foundation"——安装包经 SignPath 代码签名，Windows SmartScreen 不会误拦。
- **依赖与权限**：自包含 Electron 包，无需预装 Node.js 或浏览器运行时；需要本地 git 与用户自带的 Agent CLI（claude-code/codex 等在 PATH 中）。Release Notes 显示对 Windows Git Bash 有具体处理（#9054"set UTF-8 console code page for Git Bash terminals"、#8948"route Droid Shift+Enter to CSI-u in no-OSC shells (Git Bash)"、#8810"Fix Ctrl+Alt terminal input on Windows by repairing xterm's AltGr misclassification"），反映 Windows Git Bash 是受支持路径。
- **权限等级**：普通用户安装即可（未发现需要管理员权限的官方说明）；具体 UAC 行为留为未决。
- **卸载方式**：标准 Windows 应用卸载（具体控制面板/设置路径未在抓取页面详述）。

**macOS**：

- **安装方式与入口**：从 onorca.dev/download 抓取两份 DMG——"macOS Apple Silicon DMG"与"macOS Intel DMG"；或用 Homebrew cask 安装：`brew install --cask stablyai/orca/orca`；或从 GitHub Releases 直接下载 `Orca-1.4.145-arm64-mac.zip`（Apple Silicon，183 MB）或 `Orca-1.4.145-mac.zip`（Intel，189 MB）。
- **代码签名与公证**：抓取页面未明确展示 macOS 代码签名/公证细节，但 Homebrew cask 与 DMG 双通道发布显示符合 macOS 分发惯例；具体 Developer ID 与 notarization 状态留为未决。
- **依赖与权限**：自包含 Electron 包；需要本地 git 与 Agent CLI；SSH worktree 模式下 macOS 默认启用 OpenSSH connection reuse；菜单栏状态项使用原生 macOS menu bar status item（#9042）。
- **权限等级**：普通用户安装；Homebrew cask 标准路径。
- **卸载方式**：DMG 安装的应用拖入 Applications，卸载即拖到废纸篓；Homebrew cask 可用 `brew uninstall --cask stablyai/orca/orca`。

**Linux**（不在本调研焦点内，仅简述）：AppImage、AUR（`yay -S stably-orca-bin` 或 `stably-orca-git`）、aarch64/x86_64 RPM；headless 服务器可用 `orca serve`。**依据本 RUNBOOK 焦点约束，Linux 不作为工作机首选路径调研**。

#### 主体功能运行位置

- **结论**：主体功能运行在 PC 本地，**完全符合本 RUNBOOK 焦点要求**。
- **直接证据 1**：官方"What is Orca?"文档明确"Not cloud-only. Orca runs locally. Remote agents happen through SSH to machines you own."
- **直接证据 2**：移动伴侣文档明确"Closing the desktop app drops the connection — there is no cloud relay. Reopen the desktop and the phone reconnects automatically."
- **直接证据 3**：遥测文档明确"Orca has no account system"——不存在云端账号层。
- **行为印证**：所有 Agent CLI 在本地 PATH 中检测、在本地 PTY 中 spawn、使用本地凭据；worktree 是本地真实 git worktree；远端执行（SSH worktrees、Remote Orca Servers）必须由用户提供远端机器与可达地址，Orca 不提供托管远端；移动伴侣是"intentionally not a full editor——它是你已经运行的桌面的遥控器"。
- **不存在"客户端只是壳、真正工作在云端"的形态**：UI、终端、编辑器、浏览器、Agent 编排、worktree 管理、PTY 持有、Settings/账号/状态存储全在本地桌面应用。

#### 云端网关（如存在）

- **结论**：Orca 不存在云端网关。云端成分仅承担极轻的辅助角色，简单提及如下，不展开：
  - **匿名遥测**：经 PostHog Cloud（US region）上报匿名产品使用事件；本地随机 ID，无账号/邮箱/IP/用户名/文件内容/prompt/agent output/terminal output/repo name/branch/URL/path/commit message；可用 Settings → Privacy → "Share anonymous usage data" 关闭，或设 `DO_NOT_TRACK=1` / `ORCA_TELEMETRY_DISABLED=1`。（依据 RUNBOOK 焦点，不展开遥测细节，仅作为"无账号系统"佐证。）
  - **第三方账号对接**：GitHub OAuth、Linear API、Jira API、MiniMax session、OpenAI Transcription API——均由用户直接与第三方认证，不经 Orca 云中转；凭据本地存储。
  - **可选云端 STT**：用户自带 OpenAI API key 用于云端语音转文字；key 本地存储，仅用于调用 OpenAI transcription API。
- **不存在 Orca 自营的云中继、云账号、云网关或云后端**；远端能力完全由用户自有机器承担。

## 本地 Agent 编排机制

本节回答 Orca 在工作 PC 本地如何编排多个 AI 编码 Agent，覆盖本地机制，不展开远端、SSH 或移动端编排。

### A. 并行与扇出机制

- **A1 扇出方式**：GUI 手动（Create Worktree→选 Agent→粘 prompt，重复 N 次，见 parallel-agents recipe）；CLI 可脚本化 `orca worktree create --name <n> --agent claude --prompt "..." --json`；Orchestration `run --spec "..." --max-concurrent 3 --worktree active` 自动拆解派发。无“一键 5 个 worktree”专属按钮。
- **A2 结果比较**：内置 Diff Viewer（按 start-from ref）+ 多 pane split 同屏 + Annotate AI Diff。
- **A3 胜出合并**：手动。胜出 worktree 直接 commit/push/PR；败者一键删 worktree+branch；可手动 git cherry-pick。Orca 不自动 merge。
- **A4 声明式配置文件**：不存在。编排由 GUI 交互或 CLI 命令式参数驱动；Scheduled automations 是唯一持久化“声明式”形态，但只调度单条 prompt，非多 Agent 扇出 DAG。

### B. Agent 检测与启动

- **B1 检测范围**：30+ 预置 CLI（Claude Code/Claude Agent Teams/Codex/Grok/GitHub Copilot CLI/OpenCode/Pi/OMP/Gemini/Antigravity/Ante/Aider/Goose/Amp/Kilocode/Kiro/Charm Crush/Auggie/Autohand/Cline/Codebuff/Command Code/Continue/Cursor CLI/Devin/Droid(Factory)/Kimi/Mistral Vibe/MiniMax/Qwen Code/Rovo Dev/Hermes/OpenClaw 等）+ 任意自定义二进制（“Works with any CLI agent — if it runs in a terminal, it runs in Orca”）。
- **B2 启动注入**：权限旁路 flag（Yolo 模式）+ status-line hook（Claude Code 注入 OSC title 让 Orca 检测状态）+ worktree 作 cwd + 转发订阅凭据；Orchestration dispatch 额外注入 worker preamble（含 worker 契约）。常规启动是否注入 Orca CLI 可用性 system prompt，文档未明示；Agent 需手动 `npx skills add ... --skill orca-cli` 安装 SKILL.md 才知道 orca 命令存在，此点标记为未决。
- **B3 Startup hooks**：shell 命令字符串（例 `source .envrc`）。两类触发时机——worktree setup hook（创建后触发，`--setup run|skip|inherit` 控制）+ per-agent startup hook（Agent 启动前触发）。hook endpoint 写入用户数据目录下的 `agent-hooks/endpoint.env`（POSIX）或 `agent-hooks/endpoint.cmd`（Windows），app 重启后重新 source。
- **B4 PTY daemon**：存在。Agent 进程经 PTY daemon 中介而非直接 spawn。daemon 托管 PTY 生命周期、跨 app 重启重连、scrollback 持久化、远端 runtime 支持（PR #7836/8403/9114）。内部职责细节文档未逐条列，标记为源码未读。

### C. Agent ↔ Orca 反馈通道

- **C1 Annotate AI Diff 回送**：用户在 diff 行加 markdown 注释→点 “Send to agent”→Orca 组装成单条 line-anchored prompt→选目标 Agent→通过 `terminal send` 注入 Agent 的 stdin/PTY。非 MCP、非落地文件、非专用协议。快捷键 Mod+Alt+N（PR #8250）。
- **C2 Orca CLI 子命令语义**：
  - `snapshot --worktree active --json`：对内置浏览器 tab 做可访问性快照，返回元素引用 `@e1, @e3`。
  - `click --element @e3`：按引用点击浏览器元素。
  - `fill --element @e1 --value "..."`：表单填值。
  - `worktree create --repo ... --name ... --agent <X> --prompt "..."`：创建 worktree + 启动 Agent + 发初始 prompt。
  - `terminal create --worktree active --command "npm test"`：新建终端跑命令（非 Agent）。
  - `file open <path>` / `file diff <path> --staged` / `file open-changed --mode both`：编辑器操作。
- **C3 MCP 角色**：Orca 是 **MCP client/宿主**（Settings→Integrations→MCP 注册外部 server endpoint，工具转交给 Agent CLI 使用），自身**不作为** MCP server 对外暴露 orca 命令。默认无预置 MCP server。Agent→Orca 反向靠 `orca` CLI + Skills 机制，非 MCP。

### D. Agent 状态检测

- **D1 完成判断**：OSC title 序列识别 working→idle 转换 + 无待输入→触发 agent-finished 通知；退出/失败靠进程退出码/结束（Restart chip）；受阻靠 “waiting on input” 状态。CLI 入口 `orca terminal wait --for tui-idle`。Pi/OMP 走自有事件流（`agent_end`/`agent_settled`）。
- **D2 状态传播**：事件驱动（OSC/Agent 事件触发 feed/通知）；git 状态=轮询+duty-cycle（PR #8922）。事件源是 PTY daemon 解析出的 OSC title 与 Agent CLI 事件 marker。
- **D3 subagent agent_end suppression**：指 Pi（及 OMP）执行任务时内部嵌套子会话会发 `agent_end` 事件，若不抑制会被 Orca 误判为“Agent 完成”产生虚假通知（PR #8545 抑制 subagent agent_end；#8826 改为在 `agent_settled` 整体停稳时报完成）。

### E. 权限与限流

- **E1 Yolo/Manual**：Yolo=预填 Agent 权限旁路 flag（Claude `--dangerously-skip-permissions`、Codex `--dangerously-bypass-approvals-and-sandbox`、Gemini/Cursor 等 `--yolo`），在 worktree 内全自动批准工具、命令与文件写入，靠 worktree 隔离兜底；Manual=不预填旁路 flag，保留 Agent 自带逐项审批流。粒度由 Agent CLI flag 决定，Orca 不另设权限层，可 per-agent override。
- **E2 限流获取**：解析本地磁盘状态文件（`~/.claude`/`~/.codex`/Gemini/OpenCode 等对应路径），非 API、非手动录入。新鲜度取决于 Agent 自身写盘时机。多账号一键热切换不重启 session（Claude 用 guard 防止 overlapping auth refreshes）。
- **E3 Pi session resume**：Pi = pi.dev 出品 Agent CLI。Resume 机制见 PR #8876，与 Claude `--resume <id>`、Codex `codex resume <id>` 同形。但 Pi **不支持** hibernation 暂停（hibernation 仅列 Claude/Codex/Gemini/Antigravity/OpenCode/Droid/Grok）。具体 resume flag 文档未给，标记为未决。

### F. Hibernation 与 Computer Use

- **F1 Hibernation**：Agent done + idle 满 30 分钟（默认可调 1min~24h）后 “quietly stop those terminals”。停止机制（SIGSTOP vs kill+relaunch）文档未明示；结合 “relaunches the agent CLI” 推测为后者，标记为源码未读。scrollback 由 PTY daemon 持久化；session 凭据、launch command、私有 env 在首次打开 Agent 时捕获，resume 时复用；上下文重建用 Agent 自带 resume flag（`claude --resume <id>`、`codex resume <id>`）。仅 resumable agents；多 pane worktree 整组一起 hibernate；实验性，默认关闭。
- **F2 Computer Use**：非 Anthropic Computer Use API 集成，是 Orca 自有 `orca computer` CLI，任何 Agent 可调用。桥接方式为原生 accessibility tree + 截图 + 安全 UI 动作；每平台使用 native helper，macOS 需 Accessibility + Screen Recording 权限。流程为 `get-app-state --app <bundleId>`→Agent 取得元素 index→`click --element-index`/`set-value`/`type-text`/`press-key`/`scroll`/`drag`→再次 `get-app-state` 验证。优先语义动作而非 raw 键盘。作为 skill 分发：`npx skills add ... --skill computer-use`。
- **F3 Design Mode 与 Computer Use 关系**：互补不重叠。Design Mode=内置 Chromium pointer→code（HTML+CSS+screenshot+sourcemap 注入 prompt，只读上下文）；Computer Use=任意桌面 app 的 accessibility 操控（可写可点，snapshot→act→snapshot 循环）。

### G. 多 Agent 协作拓扑

- **G1 Agent 间通信**：默认 race 场景**无直接通信**，仅通过用户介导的 review。启用 `orca orchestration` 后有共享 inbox + task records + dispatch state + decision gates；`orca orchestration send --to <terminalHandle>`，group 地址 `@all / @idle / @codex / @cursor / @grok / @droid / @worktree:<id>`。worktree `comment` 字段作轻量 blackboard。
- **G2 Supervisor/Worker**：存在。`orca orchestration run --spec "..." --max-concurrent 3` 运行 coordinator loop 自动派发；手动版为 task-create→worktree create→terminal wait→dispatch --inject→check --wait。worker 契约要求发 `worker_done`、包含 task+dispatch ID、长任务发 heartbeat、提问用 `orca orchestration ask`（阻塞）。Decision gate 由 coordinator 拥有，阻塞 task 直到 resolve。默认 race=纯并行无协作；启用 orchestration=supervisor/worker。
- **G3 同 worktree 多 Agent**：模型上支持（“If a worktree has multiple agent panes, they hibernate together as a unit”），可 `orca terminal split` 在同 worktree 分屏开启终端/Agent。但 race 场景刻意一 worktree 一 Agent 以保证隔离。

### 编排能力地图

| 维度 | 结论 | 证据等级 |
| --- | --- | --- |
| 编排范式 | 交互式 GUI 为主 + CLI 命令式可脚本化；无声明式编排配置文件 | 已核官方文档 |
| 扇出自动化 | GUI 手动逐个；CLI 可批量；Orchestration `run` 自动派发；无一键 5 个按钮 | 已核官方文档 |
| 结果比较 | 内置 Diff Viewer + 多 pane split + Annotate AI Diff | 已核官方文档 |
| 胜出合并 | 手动 commit/push/PR；败者一键删；可手动 cherry-pick | 已核官方文档 |
| Agent 检测 | 30+ 预置 + 任意自定义二进制；OSC title + Pi 事件流 | 已核官方文档 |
| Agent 启动注入 | 权限旁路 flag + OSC status-line hook + worktree 作 cwd + 订阅凭据；Orchestration 注入 worker preamble | 已核官方文档 |
| 反馈通道 Orca→Agent | Annotate→组装 prompt→`terminal send` 注入 stdin；非 MCP | 已核官方文档 |
| 反馈通道 Agent→Orca | Agent 执行 `orca` CLI；靠 Skills（SKILL.md）让 Agent 自觉调用 | 已核官方文档 |
| 双向 MCP | Orca 是 MCP client/宿主，自身不作 server；默认无预置 MCP server | 已核官方文档 |
| 状态检测 | OSC title + 退出码 + Agent 自有事件 + turn lifecycle marker；`terminal wait --for tui-idle` | 已核官方文档 + Release Note |
| 状态传播 | 事件驱动（OSC/Agent 事件）；git 状态=轮询+duty-cycle | 已核官方文档 + Release Note |
| 权限模型 | Yolo（预填旁路 flag）/Manual（保留自带审批）；可 per-agent override | 已核官方文档 |
| 限流获取 | 读本地磁盘状态（`~/.claude` 等），非 API/非手动；多账号热切换不重启 | 已核官方文档 |
| Hibernation | 停进程 + 保留 session ID + resume 时 relaunch 用 Agent 自带 resume flag；仅 resumable agents；实验性 | 已核官方文档 |
| Computer Use | Orca 自有 `orca computer` CLI（非 Anthropic 专属），accessibility tree + 截图 + 语义动作，跨 Agent | 已核官方文档 |
| Design Mode | 内置 Chromium pointer→code，HTML+CSS+screenshot+sourcemap 注入 prompt | 已核官方文档 |
| 协作拓扑 | 默认纯并行无通信（race）；可选 Orchestration supervisor/worker + 共享 inbox/task/gate；worktree comment 作轻量 blackboard | 已核官方文档 |
| PTY daemon | 存在，托管 PTY 生命周期/重连/scrollback 持久化/远端 runtime | Release Note + 文档推导 |

## 未决项与证据边界

- **B2 Orca CLI 可用性注入**：常规 Agent 启动是否注入“Orca CLI 可用性”system prompt 前缀，文档未明示；从 Skills 需手动 `npx skills add` 推断不注入，但源码未读确认。
- **B4 PTY daemon 内部职责**：文档只通过 PR 标题与相关说明侧面提及，未逐条列出，标记为源码未读。
- **A4 `orca.yaml`**：仓库根存在该文件，但文档未将其描述为编排 DSL；推测是 app 配置，未读源码确认。
- **E3 Pi resume 具体命令**：文档用 “and so on” 省略，未给出 Pi 的确切 resume flag。
- **F1 Hibernation 暂停机制**：文档只说 “stop terminals”，未说明是 SIGSTOP 冻结还是 kill+relaunch，源码未读。

- **移动配对物理网络路径未明**：官方文档明确"无云中继、配对交换直接发生在桌面与手机之间"，但 2026-07-19 抓取的页面未详述具体网络方式（LAN 直连、Tailscale、NAT 穿透、P2P 打洞等）。Mobile 文档"make sure your desktop and phone are signed into the same Orca account"与遥测文档"Orca has no account system"在字面上存在张力——可能"Orca account"指配对 device token 而非真实账号系统，**未决，待运行验证**。
- **macOS 代码签名与公证细节未明**：抓取页面未展示 Developer ID 与 notarization 状态；Homebrew cask 与 DMG 双通道发布显示符合 macOS 分发惯例，但具体签名链留为未决。
- **Windows UAC 行为未明**：未发现官方说明 Windows 安装是否需要管理员权限；SignPath 代码签名已确认，但具体安装权限等级留为未决。
- **Electron 技术栈为架构推导**：依据 Release 资产形态（`.blockmap`/`latest.yml`/`latest-mac.yml` 等 electron-builder 标志）、Release Notes 中 Monaco、xterm.js、WebGL glyph atlas、renderer/main 进程的描述推断为 Electron + TypeScript，未读取仓库 `package.json` 直接验证（依据 RUNBOOK，源码只用于验证已提出的关键问题，且当前证据已足够支撑架构层结论）。
- **远端 SSH relay 的 Node/npm 依赖为推导**：Release Notes #9165 与 #8686 显示 SSH relay 在远端需要 Node/npm 工具链，但具体版本要求未在抓取页面详述。
- **反馈主题样本不足**：本次证据窗口内未系统抽样 GitHub Issues 与 Discord 讨论；首页引用的 Jason Zhou 推文为单个样本，**不代表普遍反馈**。
- **Star/Fork 数与 WeChat 群饱和度只是公开快照**：21.8k Stars 与 WeChat 群饱和反映社区活跃，**不直接等于产品质量或采用率**。

## 后续验证建议

1. **运行验证主体功能位置**：在 Windows 10/11 工作机安装 Orca，断网后启动一个 Claude Code Agent worktree，确认 Agent 进程在本地、PTY 在本地、worktree 文件在本地磁盘——直接验证"主体功能在 PC 本地"。
2. **验证移动配对网络路径**：在桌面与手机处于不同 LAN（手机用蜂窝、桌面用家庭 Wi-Fi）时尝试配对，观察是否能成功——若成功说明存在某种 NAT 穿透或中继；若失败说明仅 LAN/Tailscale 可用。此为"无云中继"声明的运行验证。
3. **核验 macOS Developer ID 与 notarization**：用 `spctl --assess --verbose=4` 与 `codesign -dv --verbose=4` 检查下载的 `.app` 包，确认签名链与公证状态。
4. **核验 Windows 安装权限**：在干净 Windows 账户下运行 `.exe` 安装包，记录是否触发 UAC 与所需权限等级。
5. **抽样反馈主题**：从 GitHub Issues 与 Discord 抽样近 30 天反馈，归纳重复出现的主题（如 SSH relay 稳定性、Windows Git Bash 终端、移动伴侣连接稳定性、远端 PTY 重连等），以补齐生态反馈样本边界。
6. **运行验证 Orchestration supervisor/worker**：在 macOS/Windows 工作机启用 Experimental→Orchestration，用 `orca orchestration run --spec "..."` 跑一个 supervisor+3 worker 的 fan-out，记录 `worker_done` 时序、decision gate 阻塞行为与 heartbeat 频率。
7. **验证 Annotate→terminal send 注入路径**：在 Agent 终端开启 verbose stdin 日志，触发一次 Annotate→Send，确认 prompt 组装格式与注入时机。
8. **验证 PTY daemon 职责**：读取 `src/` 下 PTY daemon 实现文件，确认 scrollback 持久化、跨重启重连、远端 runtime 接入的具体实现。
9. **验证 Pi resume 具体命令**：实机安装 Pi，触发一次 session resume，记录实际执行的 CLI 命令；Pi 当前不在官方 Hibernation 支持列表中，不应将此项表述为 Pi hibernation 验证。
10. **若需竞品对比**：使用独立 RUNBOOK，将 Orca 与 WORKSHOP-010 Zencoder、WORKSHOP-005 OpenCove 按本 RUNBOOK 同口径逐项对齐填表——但**不得在本调研文件中追加**。
