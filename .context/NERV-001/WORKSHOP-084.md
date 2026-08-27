# Mission Console 技术产品调研

> updated_by: Qoder - MiniMax-M3
> updated_at: 2026-08-31
> evidence_window: 2026-08-31 调研日；调研主体 `CuSO41108/mission-agent`，代码快照对应 `main` 分支最近 commit `3e4a94f`（2026-07-31）。**仓库无正式 Release 标签**；`package.json` 版本、提交节奏与 README 均已交叉确认。

## 调研目标

- 识别 Mission Console 作为「个人任务工作台 + 受控并行 Agent Run」的形态边界
- 判断其是否构成 NERV-001 Index.md 所定义的 Stateful 调度系统
- 分别核验 Windows 与 macOS 工作机上的安装、运行入口、依赖、权限、网络要求与卸载
- 梳理技术架构与组件关系（运行形态、依赖、接口、持久化、通信、部署）
- 评估 Local 优先适配程度与依赖可剥离性
- 输出对 Agent 持续运行工作模式的独立调研结论

## 交付结论

### 一句话产品定位

Mission Console 是基于 Electron + Node 内置 `node:sqlite` 的本地优先个人任务工作台，把「任务舱（Folder）+ 类型化 Agent 待办 + 持久化 Run 队列 + 资源锁 + 工作流引擎」整合为单机本地运行的 Stateful 任务调度系统，依赖单一桌面进程而非独立中心服务。

### 架构范式：单进程 Stateful 调度器，而非任务执行宿主

- **核心证据**：仓库于 2026-07-23 通过 PR #5 `feat(agent): add controlled parallel task runs`、PR #6 `feat(agent): add durable run queue and console`、PR #7 `ci: add pull request verification workflow`、2026-07-25 `feat(workflow): add durable data-flow graph execution` 完成了「持久化队列 + 受控并行 + 工作流引擎」三大支柱。
- **状态机已确认**：Agent Run 流转 `queued → running → terminal`，异常退出遗留项标记为 `APP_INTERRUPTED`，**应用重启会恢复排队项**（README「持久化 Run 队列与资源互斥」明确说明）。
- **资源锁已确认**：同一任务舱当前保持互斥；不同任务舱可受控并行（默认 2，可调 1–4）；Agent 与 Copilot 调用同一模型时共享并发额度。
- **判断**：满足 NERV-001 Index.md 所定义的 Stateful 调度系统条件（持久拥有 Run 状态、应用重启后调度状态可恢复、明确的状态机和资源锁语义）。**与 WORKSHOP-083 Cherry Studio 的"桌面工作台 + 嵌入式任务调度"不同，Mission Console 的调度是核心能力而非附加特性。**
- **未覆盖**：调度器运行在桌面进程内，**没有独立中心服务**；关闭主进程则巡检停止（虽然 Run 状态与排队项持久化，重启后会恢复执行）。

### Local 优先适配判断

- **数据本地化**：✅ 业务数据存 `node:sqlite`（Node 22.13+ 内置，无需 native module），普通配置存 `userData/config.yaml`，敏感字段（API Key、飞书凭据）经 **Electron safeStorage** 加密后落本地文件。
- **LLM 推理**：⚠️ 默认走 OpenAI 兼容 API（DeepSeek 是默认示例，可换其他兼容服务）；未内置本地 LLM 推理。Local 优先成立与否取决于用户配置的 Provider。
- **调度本地化**：✅ 心跳调度器、Run 队列、资源锁、工作流引擎全部本地运行。
- **飞书消息**：适配器凭据本地加密存储；群机器人 Webhook 直接打到飞书官方；企业自建应用经飞书开放平台 API。
- **数据共享边界**：用户材料通过「系统文件选择器」添加引用，**默认不复制磁盘原文件**——降低本地磁盘占用但绑定到文件系统原文件路径。
- **选型影响**：对要求"完全离线 + 完全本地 LLM"的用户仍需自备本地模型推理服务；对"本地状态 + 云端 LLM"是合理适配。

### Windows 与 macOS 工作机支持

- **Windows**：README Quickstart 明确「Windows 10/11」；`Ctrl+Alt+Space` 唤起主窗口；关闭主窗口后留在托盘；托盘菜单彻底退出。证据：[README Quickstart](https://github.com/CuSO41108/mission-agent)。
- **macOS**：README Quickstart 明确「macOS 12+」；`Option+Space` 唤起主窗口；托盘行为同 Windows。**Linux 未在 README 列出**——按 NERV-001 RUNBOOK 规定不能替代工作机调研，仅作旁证。
- **安装方式**：
  - 开发模式：`git clone` → `npm ci` → `npm run dev`
  - 正式部署：`npm run build` → `npm install -g .` → `mission-console`（全局命令）
  - 自动更新：`mission-console --check-update` 或 `mission-console --update`（下载、校验 SHA-256、安装并重启）；应用内「设置 → 应用更新」提供同等功能
- **卸载方式（明确边界）**：官方文档**未提供**专用卸载指南；npm 全局命令可通过 `npm uninstall -g mission-console` 卸载命令，但 `userData`（含 SQLite 数据库、YAML 配置、safeStorage 加密凭据、可能的本地材料引用路径）**不会自动清除**。证据边界：按 npm 全局包标准惯例推导。

### 核心组件与运行形态

```
┌──────────────────────────────────────────────────────────────────────┐
│              Mission Console 桌面进程（PC 本地）                      │
│  ┌────────────────────────┐   ┌──────────────────────────────┐      │
│  │ Renderer（React UI）   │   │ Main（Node 22.13+，Electron）│      │
│  │ Dashboard / Folders /  │   │ ┌──────────────┐            │      │
│  │ Settings / 集成 / 工作流│◄─►│ │ Scheduler    │ 心跳巡检  │      │
│  │ / Agent 控制台          │   │ └──────────────┘            │      │
│  └────────────────────────┘   │ ┌──────────────┐            │      │
│                               │ │ Run Worker   │ FIFO + 锁  │      │
│  ┌────────────────────────┐   │ └──────────────┘            │      │
│  │ Preload（contextBridge）│   │ ┌──────────────┐            │      │
│  │ 白名单 IPC API + 类型   │   │ │ Workflow     │ 事件总线    │      │
│  └────────────────────────┘   │ └──────────────┘            │      │
│                               │ ┌──────────────┐            │      │
│                               │ │ SafeStorage  │ 加密凭据    │      │
│                               │ └──────────────┘            │      │
│                               └──────────────────────────────┘      │
│                                       ▲                              │
│                                       │ Core（业务大脑）              │
│                          ┌────────────┴───────────┐                  │
│                          │ zero Electron dependency│                 │
│                          │ db / config / services  │                 │
│                          │ agent / workflow        │                 │
│                          └────────────┬────────────┘                 │
│                                       │                              │
│                          ┌────────────▼────────────┐                 │
│                          │ node:sqlite（11 张业务表）│                │
│                          │ userData/config.yaml    │                 │
│                          │ SafeStorage 加密文件     │                │
│                          └─────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────────┘
                ▲                            ▲
        OpenAI 兼容 Provider          飞书消息 API
       （云端 / 自托管 / 本地）     （群机器人 / 企业自建）
```

四段式目录已确认：`src/main`（Electron 生命周期与 IPC）/ `src/preload`（contextBridge 白名单）/ `src/renderer`（React UI）/ `src/core`（业务与数据层，零 Electron 依赖）。

### 主要依赖与可剥离性

#### 架构刚需（不可剥离）

- **Electron**：桌面应用骨架，承担 IPC、托盘、安全存储、contextBridge 隔离。
- **Node.js ≥ 22.13**：利用内置 `node:sqlite` 模块（**无需 native module / electron-rebuild**），降低跨平台维护成本。
- **React 渲染层**：UI 框架。
- **node:sqlite**：业务数据真相源；11 张业务表含 Agent Run 与资源租约记录。剥离将丢失全部状态。
- **YAML 配置文件**：普通应用配置持久化。

#### 核心能力依赖（难剥离）

- **Electron safeStorage**：API Key 与适配器敏感字段加密；改用其他加密方案需重写凭据管理链路。
- **IPC 双通道**（`ipcMain.handle` + `webContents.send`）：架构层定义的事件推送与 CRUD 分离模式。
- **Worker 持久化队列**：与 `node:sqlite` 强耦合的状态机实现。
- **工作流引擎**：独立事件总线与定时轮询策略（durable data-flow graph execution）。
- **OpenAI 兼容客户端**：未指定具体 SDK，可换其他兼容协议。

#### 上层附加依赖（可剥离）

- **飞书消息适配器**：标注「实验性」，仅支持群机器人 Webhook 与企业自建应用；Gmail / 通用 Webhook 待后续实现。
- **Copilot / 模型 Profile**：`feat(models): add reusable multimodal model profiles` 引入的多模态 profile 管理。
- **OAuth 通道**：README 未见展开 OAuth/SSO；当前仅依赖用户填入 API Key。
- **遥测**：OpenTelemetry SDK 等典型遥测栈未在 README 出现；按 NERV-001 RUNBOOK 排除项不展开。

### 接口形态

- **Electron IPC**：
  - `ipcMain.handle`：CRUD 请求/响应
  - `webContents.send`：事件推送（Agent Run 状态变化、调度触发等）
- **Preload contextBridge 白名单**：仅暴露类型化 API；渲染进程无法直接访问 `safeStorage` 完整密钥。
- **OpenAI 兼容 HTTP**：模型 API 调用（Base URL + 模型名 + API Key 可换）。
- **飞书开放接口**：
  - 群机器人 Webhook：HTTPS POST 纯文本消息（需先完成连接测试）
  - 企业自建应用：飞书开放平台 API（凭据本地加密）
- **文件系统**：通过系统文件选择器添加引用；Agent 运行时受权限控制读取本地文本材料。

### 持久化方式

- **业务数据库**：`node:sqlite` 嵌入式 SQLite；**11 张业务表 + schema_version**；含 Agent Run 与资源租约记录（README「数据层」明确说明）。
- **应用配置**：`userData/config.yaml`（普通字段）。
- **敏感凭据**：Electron safeStorage 加密本地文件（旧版 YAML 中 API Key 自动迁移至此；渲染层只能看到「已配置」状态，无法读取完整 Key）。
- **本地材料**：默认引用模式，**不复制磁盘原文件**；移除引用不删除磁盘原文件。
- **备份策略**：README 未明示自动备份机制；按需备份需用户自行处理 `userData` 目录。证据边界：官方未提供备份方案。
- **迁移机制**：README Quickstart 提示「模型 API Key 会从旧版 YAML 自动迁移至 Electron safeStorage 加密文件」，说明存在旧版→新版的迁移路径；具体版本边界需源码验证。

### 通信方式

- **Electron IPC**：主↔渲染双向（请求/响应 + 事件推送）。
- **OpenAI 兼容 HTTP**：同步请求 + 流式响应（具体取决于 Provider）。
- **心跳定时器**：调度器默认 60 分钟触发一次任务舱巡检（可调 5–1440 分钟）。
- **事件总线**：工作流引擎独立事件总线 + 定时轮询策略。
- **Run Worker**：FIFO 扫描持久化队列，跳过资源冲突项；资源释放、Run 结束、配置变化或应用启动都会立即泵队列。
- **OpenTelemetry**：未见明显 SDK 依赖；按排除项不展开。

### 部署形态

#### 工作机安装（Windows / macOS）

- **安装命令**：
  ```bash
  git clone https://github.com/CuSO41108/mission-agent.git
  cd mission-agent
  npm ci
  npm run dev              # 开发模式
  # 或
  npm run build
  npm install -g .
  mission-console          # 启动正式版本
  ```
- **依赖要求**：Node.js ≥ 22.13（内置 `node:sqlite`），无需 native module 重编译；`engines` 字段需在运行验证中确认。
- **快捷键**：`Ctrl+Alt+Space`（Windows）/ `Option+Space`（macOS）唤起主窗口。
- **后台常驻**：关闭主窗口后留在系统托盘；托盘菜单彻底退出；macOS 首次启动需在「系统设置 → 隐私与安全性」放行（按 macOS 通用规范）。
- **网络要求**：仅在使用 OpenAI 兼容 Provider API、飞书消息、Web 自动更新时需要。
- **权限要求**：托盘常驻、自动启动更新、文件选择器均按需授权；无强制管理员权限。

#### 主体功能运行位置

- **桌面本地**：所有调度、Run 队列、工作流引擎、数据库、配置都在 PC 本地运行。
- **云端依赖**：
  - LLM 推理：经用户配置的 OpenAI 兼容 Provider（云端或自托管）
  - 飞书消息：经飞书官方服务中转（不持久化内容于 Cherry 之外的第三方）
  - 自动更新：经 GitHub Release 下载并 SHA-256 校验
- **Local 优先成立**——数据、调度、配置全部本地；LLM 推理位置由 Provider 配置决定。

#### 云端形态（如存在）

- **社区版（GitHub 仓库）无自有云端**：Mission Console 不提供云端账户、云端同步或云端调度中心。
- **云端接触面仅限于外部服务**：OpenAI 兼容 Provider（用户自配）、GitHub Releases（自动更新源）、飞书官方（消息中转）。
- **企业版 / 商业版**：README 未提及商业版本；项目以 MIT 协议开源（MIT License © 2026 CuSO41108），无私有部署或商业 SKU 出现。

### 维护状态与版本演进

- **无正式 Release**：仓库 0 个 Release 标签；安装与更新依赖 `main` 分支 commit 或 `mission-console --update` 命令。
- **近期提交密度**（[Commits on main](https://github.com/CuSO41108/mission-agent/commits/main)）：
  - 2026-07-23 ~ 2026-07-31 期间密集合并 5 个 PR（#4 ~ #9）；最近 commit `3e4a94f` 于 2026-07-31。
  - 距 2026-08-31 调研日约一个月未提交新 commit；活跃度需运行验证。
- **关键能力演进**：
  - 2026-07-23：受控并行 Run（PR #5）+ 持久化 Run 队列与控制台（PR #6）
  - 2026-07-25：持久化数据流图工作流执行 + 多模态模型 profile
  - 2026-07-26：飞书适配器（安全发送、引导设置、工作流节点）+ 集成测试 + Material 审计
  - 2026-07-30：托盘行为解耦 + 退出策略
  - 2026-07-31：材料流式接入 + 模型 profile 删除 + 工作流独立 prompt 节点
- **生态规模**：19 Star / 2 Fork（仅描述公开热度，不等同采用率）；Issues 列表为空；社区反馈样本不足。
- **维护风险判断**：个人维护者（CuSO41108）；缺少正式 Release 流程与发布管线（`Add GitHub Release update checks and installation flow` 已合并但尚无实际 Release）；商业化路径未明确。

### 选型缺陷与改造边界

- **单一桌面进程，无独立调度服务**：关闭主进程则巡检停止；不具备跨机器分布式调度能力；不能作为团队级中心调度器。
- **调度器与 UI 强耦合**：调度器运行在 Electron Main 进程，与 IPC、React UI、文件系统共享同一进程空间；剥离 UI 仅保留调度器需要重写进程边界。
- **生态与影响力有限**：19 Star / 0 Issue / 0 Release；个人项目风险（bus factor = 1）；无独立社区运营（无 Discord / QQ 群 / 文档站）。
- **飞书消息节点标记为「实验性」**：仅支持纯文本；Gmail、Webhook 等其他连接器「待后续实现」。
- **LLM 默认走云端 API**：未内置本地模型推理；离线场景需用户自行接入 Ollama / vLLM 等兼容服务。
- **备份与版本回退**：README 未提供自动备份或回退机制；卸载 npm 全局包不会清理 `userData`。
- **macOS 最低版本**：官方明示 macOS 12+，证据较 WORKSHOP-083 Cherry Studio（macOS 11+）更明确；但 Linux 支持未提及。
- **技术架构文档（TechnicalArchitecture.md）路径未找到**：README 引用但 404（`raw.githubusercontent.com` 抓取返回 404）；实际路径需在仓库根目录或 docs/ 下确认。

## 调研目标、范围与边界

### 调研目标

参见本文档顶部「调研目标」与「交付结论」章节。

### 核心问题

- Mission Console 是否构成 NERV-001 Index.md 所定义的 Stateful 调度系统？
- Windows 与 macOS 工作机支持完整度如何？
- Local 优先适配程度及哪些能力强制依赖云端？
- 持久化 Run 队列、资源锁、工作流引擎的可靠性能否覆盖实际任务？
- 与 WORKSHOP-083 Cherry Studio 相比，调度范式差异在哪里？

### 覆盖范围

- 产品调研：定位、用户、流程、功能、维护、生态
- 技术架构调研：运行形态、依赖、接口、持久化、通信、部署
- 工作机平台：Windows、macOS（必查）、Linux（仅作旁证）

### 明确排除

- 不做源码审计；不枚举路由、数据库表、端点
- 不做竞品比较、选型矩阵、优劣排名（与 WORKSHOP-083 Cherry Studio 等的差异仅作架构范式背景说明，不构成比较）
- 不调研遥测、监控、指标采集、链路追踪、错误上报通道
- 不调研飞书 / DeepSeek 等外部服务的实现细节

## 产品调研

### 产品定位与目标用户

Mission Console 由个人开发者 `CuSO41108` 维护，定位「任务指挥中心」，目标用户是希望**把任务编排交给 Agent、把任务调度、Run 队列与工作流留在本地**的个人用户或极小团队。产品宣传包含「本地优先、支持受控并行 Agent Run」「每类任务一个舱」「定时巡检 + 手动触发」「持久化队列 + 资源互斥」「类型化 Agent 待办」「OpenAI 兼容模型」「可执行工作流」（[README Features](https://github.com/CuSO41108/mission-agent)）。证据边界：宣传性表述已与架构图、commit 演进、目录结构交叉确认。

### 核心流程

用户视角的端到端核心流程为：**安装 Node 22.13+ → `git clone` 或 `npm install -g` → 配置 OpenAI 兼容 Provider 与 API Key → 配置飞书适配器（可选） → 创建任务舱 → 添加本地材料引用 → 定义类型化待办 → 启用 Agent 并设置心跳间隔 → 等待 Run 自动执行或手动触发 → 在控制台查看 Run 状态与产物 → 通过工作流编排跨任务自动化**。

### 功能地图与边界

- **任务舱（Folder）**：每类任务一个舱，集中管理待办、材料、时间线、Agent 配置。
- **本地材料管理**：通过系统文件选择器添加引用；可打开或移除引用；不删除磁盘原文件。
- **Agent 定时巡检**：默认 60 分钟执行；支持 5–1440 分钟调整；手动触发；超时取消；运行事件推送。
- **受控并行**：不同任务舱默认最多 2 个 Run 并发；可调 1–4；同一任务舱互斥。
- **持久化 Run 队列**：Run 按 `queued → running → terminal` 流转；资源忙时持续等待并在释放后自动启动；**应用重启会恢复排队项**。
- **安全中断**：异常退出遗留的 running Run 标记为 `APP_INTERRUPTED`，**不会自动重放潜在副作用**；可在控制台取消或创建关联记录的新重试 Run。
- **类型化 Agent 待办**：分析、生成产物、跟进提醒、材料整理、进度摘要、工作流任务；**只有明确选择产物任务才写文件**。
- **多种本地产物**：Markdown（推荐默认）、纯文本、JSON。
- **可执行工作流**：创建、编辑、删除、启停、手动 / 定时 / 事件触发、拖拽节点、条件判断、运行记录、循环保护。
- **适配器注册表**：服务商、地址、端口、认证信息；敏感字段经 Electron safeStorage 加密后落库。
- **飞书消息节点（实验性）**：群机器人 Webhook + 企业自建应用；仅可向完成连接测试并明确授权的目标群发送纯文本消息。
- **本地优先**：业务数据存 `node:sqlite`；应用配置存 YAML；本地文件默认采用引用模式。

### 维护状态与版本演进

- **版本策略**：**无 GitHub Release 标签**；自动更新依赖 `main` 分支 commit；`mission-console --check-update` / `--update` 命令可下载、校验 SHA-256 并安装最新版。
- **关键能力演进**（[Commits on main](https://github.com/CuSO41108/mission-agent/commits/main)）：见上文「维护状态与版本演进」章节。
- **活跃度判断**：基于 2026-07-23 ~ 2026-07-31 的密集提交 + PR 合并 + CI workflow + 文档同步提交综合判断为**开发者个人阶段性活跃**；距调研日约一个月未提交新 commit，存在维护节奏不确定风险。证据边界：单次活跃周期不构成持续活跃证明。

### 生态与反馈

- **官方生态**：GitHub 仓库主入口；无独立文档站、无 Discord / QQ 群 / 微信群 / Telegram 等社区运营渠道（README 未列出）。
- **公开反馈样本**：GitHub Issues 列表为空；社区讨论、博客评测、外部使用反馈样本均不足。证据边界：缺乏反馈样本不证明产品成熟或问题缺失。
- **第三方教程 / 评测**：WebSearch 仅返回 GitHub 主仓库链接，未见独立评测或教程。证据边界：搜索覆盖度有限。

## 技术架构调研

### 系统全貌与运行形态

四段式目录已确认（README Project Structure）：

```
src/
├── main/         # 主进程：窗口/托盘/快捷键/生命周期/IPC 注册/scheduler
├── preload/      # contextBridge 白名单 API + 类型导出
├── renderer/     # React UI（Dashboard/Folders/Settings/...）
└── core/         # 业务大脑（零 electron 依赖）
    ├── db/           # node:sqlite + Schema + 迁移 + Repository
    ├── config/       # AppConfig + YAML 读写
    ├── services/     # 任务舱、材料、适配器等业务服务
    ├── agent/        # 持久化 Run Worker + OpenAI 兼容客户端 + 类型化单舱 Agent 执行器
    └── workflow/     # 工作流引擎、事件总线与心跳巡检策略
```

**核心架构判断（已确认）**：`core` 是业务大脑，**零 Electron 依赖**——这意味着 Mission Console 的调度、Run 队列、工作流引擎可以独立于 Electron 测试或集成到其他前端壳；但当前产品以 Electron 形式分发。

### 主要组件与核心链路

#### 核心链路：心跳触发 Agent Run

1. 心跳调度器（默认 60 分钟）扫描所有**活动状态且已启用 Agent 的任务舱**。
2. 对每个匹配任务舱创建持久化 Run（状态 `queued`）。
3. Run Worker 按 FIFO 扫描队列；遇到资源冲突项跳过；资源释放、Run 结束、配置变化或应用启动都会立即泵队列。
4. Worker 拉取 Run 后写入状态 `running`；读取任务舱上下文与本地材料（受权限控制）；调用 OpenAI 兼容 Provider。
5. 产出结果写入 SQLite；产物按类型（Markdown / 纯文本 / JSON）落盘到任务舱仓库目录。
6. Run 流转到 `terminal`；运行事件经 `webContents.send` 推送至 Renderer 重新读取 SQLite。
7. 异常退出时遗留的 running Run 标记为 `APP_INTERRUPTED`，**不自动重放**；可手动取消或创建新重试 Run。

证据锚点：README「Architecture」「持久化 Run 队列与资源互斥」「安全中断与人工重试」。

#### 核心链路：工作流执行

1. 用户在 UI 创建工作流（节点、连接、条件）。
2. 触发器（手动 / 定时 / 事件）激活工作流。
3. 工作流引擎经独立事件总线 + 定时轮询驱动本地节点；按依赖图持久化执行（durable data-flow graph execution）。
4. 节点类型包含：本地触发器、条件、动作、Agent Run、飞书消息、应用内通知、修改任务舱状态、创建待办、写时间线。
5. 飞书消息节点需关联已通过连接测试并授权目标群的适配器；其他第三方连接器（Gmail、Webhook）尚未接入。
6. 运行记录持久化；循环保护防止意外递归。

证据锚点：README「可执行工作流」「飞书消息节点（实验性）」。

### 主要依赖

详见「交付结论 → 主要依赖与可剥离性」章节。

### 接口形态

详见「交付结论 → 接口形态」章节。

### 持久化方式

详见「交付结论 → 持久化方式」章节。

### 通信方式

详见「交付结论 → 通信方式」章节。

### 部署形态

详见「交付结论 → 部署形态」章节。

## 关键证据链接

- 仓库主页：<https://github.com/CuSO41108/mission-agent>
- README（已读取，含 Architecture 与 Project Structure）：<https://github.com/CuSO41108/mission-agent>
- Commit 历史：<https://github.com/CuSO41108/mission-agent/commits/main>
- PR 历史：<https://github.com/CuSO41108/mission-agent/pulls>
- Issues（当前为空）：<https://github.com/CuSO41108/mission-agent/issues>
- 技术架构文档路径未找到（README 引用 `TechnicalArchitecture.md`，`raw.githubusercontent.com` 抓取返回 404；实际路径需源码定位）

## 未决项与证据边界

- **TechnicalArchitecture.md 路径**：README 引用但抓取失败；详细数据表 schema、IPC 链路完整定义需源码验证。
- **macOS 实际最低版本**：官方明确 macOS 12+；具体补丁版本要求、ARM64 / x64 区分、Gatekeeper 处理流程需运行验证。
- **`node:sqlite` 跨平台稳定性**：Node 22.13+ 内置模块避免了 native module 重编译，但跨平台（特别是 Windows ARM64 / macOS 旧版本）的兼容性需运行验证。
- **持久化队列的可靠性边界**：README 声明「应用重启会恢复排队项」，但 `APP_INTERRUPTED` 状态下手动重试的恢复保证、断电 / 强制终止的恢复保证、SQLite 损坏后的修复路径未明确。
- **资源锁语义边界**：跨任务舱「共享并发额度」的具体实现（基于 Provider 连接池还是进程级信号量）需源码验证。
- **生态影响力**：19 Star / 0 Issue / 0 Release / 无社区渠道；样本不足以评估真实使用反馈。
- **维护持续性**：调研日前一个月无 commit；个人项目 bus factor = 1。
- **Linux 支持**：README 未列出；需源码验证（package.json `engines` / `os` 字段、CI matrix）。
- **卸载流程**：npm 全局包可卸载但 `userData` 数据残留未提供官方清理指南。

## 后续验证建议

- **运行验证**：在 macOS 14+ 与 Windows 11 上分别安装 Node 22.13+，执行 `git clone` → `npm ci` → `npm run dev`，记录首次启动时间、托盘常驻内存占用、SQLite 数据库初始化耗时、`node:sqlite` 启动稳定性。
- **持久化队列验证**：触发 Run → 强制退出应用 → 重启应用，确认排队项恢复执行；触发 Run → 关闭网络 → 确认 `APP_INTERRUPTED` 标记正确生成。
- **资源锁验证**：同一任务舱并发触发两个 Run，确认互斥；不同任务舱并发触发两个 Run，确认并行；并发额度调整为 1 / 4 验证边界。
- **OpenAI 兼容 Provider 验证**：分别配置 DeepSeek、OpenAI、Ollama（兼容服务）、自托管 LLM 验证接入与并发额度共享。
- **飞书适配器验证**：群机器人 Webhook + 企业自建应用分别配置；连接测试；目标群授权；工作流节点触发。
- **持久化与备份验证**：备份 `userData` 目录后卸载应用、清理 `userData`、重装应用并恢复备份，确认 SQLite / YAML / safeStorage 文件完整恢复。
- **Local 优先边界验证**：完全断网场景下确认心跳调度、Run 队列恢复、工作流执行、本地材料读取均可用；记录必须联网才能使用的功能（自动更新、Provider API、飞书消息）。
- **架构文档定位**：在仓库根目录与 docs/ 下查找 `TechnicalArchitecture.md` 真实路径；与 README 架构图交叉确认数据表 schema、IPC 链路、状态机定义。