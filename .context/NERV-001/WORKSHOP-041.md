# Taku (taku.ai) 技术产品调研

> updated_by: Qoder
> updated_at: 2026-07-31 13:40:00
> evidence_window: 调研日期 2026-07-31；官方网站 taku.ai 与下载服务 download.taku.ai 快照（桌面端最新 v3.1.22，2026-07-22 发布）；官方更新源 latest-mac.yml 与 Release Notes 原文；AITNT 对 Taku 创始人 Austin 的访谈（2026-03-23 发布）；官网 Marketplace 页面实测数据

## 交付结论

1. **Taku 是"AI 应用市场 + AI 操作系统"形态的桌面产品：用自然语言生成应用/Agent/工具（Stacks），从市场"借用"（Borrow）他人应用与技能包（Stax），生成物之间通过统一后端协议互调并共享跨应用记忆。** 官方定位为 "The marketplace & OS for your AI"。
2. **主体功能运行位置：判定为 PC 本地（有官方一手佐证）。** 桌面端为 Electron 应用（更新源为标准 electron-updater 的 latest-mac.yml，直接事实）；v3.1.22 官方 Release Notes 明文描述了 Desktop（壳）与本机 "Core" 进程的生命周期管理——更新时须"停止事件入口并禁止旧 Desktop 重新拉起 Core"、"确认 managed Core 全部退出后才交给原生更新器"，且 Core 承载 **Planner 与 Builder 任务**。即 Agent 规划与构建执行的主体在用户 PC 本地进程中，不是"客户端只是壳、工作在云端"的形态。
3. **工作机覆盖存在硬伤：目前只有 macOS Apple Silicon 一个平台，Windows 完全不可用。** 官方下载端点实测：`download.taku.ai/mac` 返回真实安装包（Taku-arm64.dmg，约 200MB）；`/windows`、`/mac-intel`、`/linux` 均返回 "Coming Soon" 占位页。v3.1.22 Release Notes 亦明文："本版本仅支持 Apple Silicon Mac（arm64）。不支持 Intel Mac（x64）、Windows 或 Linux。"按 RUNBOOK"Windows/macOS 工作机安装"的核心焦点，Windows 侧路径不存在，Intel Mac 亦缺失。
4. **云端角色：账号/市场/分发 + 默认模型推理网关。** 市场与账号侧基于 Supabase（auth.taku.ai 为 Supabase 存储域）；定价为 credits 制（Standard $50/月 15,000 credits，Pro $200/月 60,000 credits），说明模型推理默认经 Taku 云端计量；Developer 档为 BYOK（自带模型与 API Key、API/CLI 访问）。云端属网关与分发角色，按 RUNBOOK 简单提及。
5. **成熟度与真实使用量是最大风险。** 官网营销数字（"12,000 apps"、"3,400+ creators"、"1.2M runs/month"）与 Marketplace 页面实测严重不符：实测"Top installs"榜首应用安装量仅 23 次，前五名合计约 64 次安装。营销数字不可采信。产品 2026-03 访谈时仍为 waitlist 测试阶段、团队很小、当时未融资；无公开文档站（docs.taku.ai 不存在）、无官方 GitHub、闭源。
6. **维护状态：活跃。** 桌面端 v3.1.22 发布于 2026-07-22（距调研 9 天），版本号推进至 3.x，Release Notes 质量较高（更新生命周期、构建隔离、失败恢复、发版门禁等工程细节），说明工程投入是认真的。
7. **综合判定：暂不符合准入要求，建议列入观察名单（低优先级）。** 主体功能在 PC 本地、"三层 Harness"（Runtime 生成即运行 / 统一后端协议互调 / 跨应用记忆共享）的设计方向与 GLNT-10 议题高度相关；但单一平台（仅 macOS AS、无 Windows）、真实使用量极低、闭源无文档、商业可持续性未验证四项叠加，现阶段不具备候选条件。若后续 Windows 版落地且生态数据真实增长，值得重新评估——其"生成物统一协议互调 + 跨应用记忆自动同步"是本轮已调研产品中独有的机制。

## 调研目标、范围与边界

### 调研目标

理解 Taku（taku.ai）的产品定位、运行形态与部署形态，重点回答：

1. Taku 是什么产品，为谁解决什么问题？
2. 主体功能运行在 PC 本地还是云端？
3. Windows / macOS 工作机如何安装与运行？
4. 模型与云端的绑定程度，维护与商业状态如何？

### 核心问题

- 产品定位、目标用户、核心流程与功能边界。
- 桌面端 / 本地 Core / 云端各自的职责边界。
- 安装方式与平台覆盖（Windows / macOS）。
- 维护状态、版本节奏与商业可持续性。

### 覆盖范围

- 官方网站（首页、Marketplace、定价）与官方下载/更新服务（download.taku.ai 实测）。
- 官方 Release Notes（更新源 latest-mac.yml 内嵌原文）。
- 创始人访谈报道（AITNT，2026-03-23，用于产品理念与公司背景）。

### 明确排除

- 不进行源码审计（产品闭源）。
- 不进行竞品比较与选型矩阵。
- 不调研遥测实现细节。
- 不深入调研 Taku 云端市场/账号架构（按 RUNBOOK 云端辅助角色简单提及）。
- 不安装、不运行、不注册账号实测；未下载安装包做包内容分析。
- Linux 不作为工作机合格路径（其 Linux 端亦未发布，仅占位页）。

## 证据口径

- **直接事实**：taku.ai 官网首页与定价页（产品形态、定价、BYOK 档位）；download.taku.ai 四个下载端点的实测响应（mac 返回 200MB dmg，windows/mac-intel/linux 返回 Coming Soon 页）；electron-updater 更新源 latest-mac.yml（版本 v3.1.22、发布时间 2026-07-22T05:50Z、Release Notes 原文，含"仅支持 Apple Silicon"与 Desktop/Core 生命周期描述）；Marketplace 页面实测安装量数据；auth.taku.ai 的 Supabase 存储域。
- **架构推导**："Core 承载 Planner/Builder 且运行于本机"为 Release Notes 原文直接支持；"模型推理默认经 Taku 云端"由 credits 计价制与 BYOK 档位对照推导；"Runtime 可在本机拉起含数据库/Redis 的复杂项目"来自创始人访谈演示描述（二手转述），其环境供给方式（是否 Docker）未决。
- **快照边界**：版本号、定价为 2026-07-31 快照；访谈内容（waitlist 阶段、未融资、团队规模）为 2026-03 时点信息，现状可能已变化；官网营销数字与实测数据矛盾，本报告采信实测。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Taku 是面向普通人（非开发者）的 AI 应用市场与"AI 操作系统"——描述需求即组装出可运行的应用栈（Stack），从市场借用他人的应用与技能，生成物之间自动协作。
- **目标用户**：普通用户/创作者为主（Standard/Pro 订阅），开发者为辅（Developer BYOK 档）；创作者经济是核心叙事——发布 Stax（技能包），"publish once, earn every time it runs"，按使用次数分成。
- **公司背景**（访谈，2026-03 时点）：创始人 Austin，加拿大背景连续创业者（男性化妆品品牌 Faculty 被雅诗兰黛收购；GPU 云游戏获奇绩创坛投资；AI 训练 Infra 服务过 MiniMax；Sapient Intelligence 联合创始人，$22M 种子轮）。Taku 团队规模很小，当时未融资、处 waitlist 测试阶段。

### 核心流程（用户视角）

1. 下载 macOS 桌面应用（目前仅 Apple Silicon），注册登录。
2. 用自然语言描述需求（"Make a habit tracker"），Taku 从市场拉取合适的应用/技能组装成属于用户的 Stack，直接运行。
3. 或在 Marketplace 直接 Borrow 单个应用/Bundle；创作者可把自己的工作流封装成 Stax 发布并获得分成。
4. 生成物（Agent / 工具 / 纯软件脚本）底层共享统一通讯协议，主 Agent 可将多个独立应用的后端串联调用；跨应用的数据、习惯、规则自动同步（记忆共享）。

### 产品理念："三层 Software Harness"（访谈一手表述）

- **第一层 Runtime**：生成即运行、无需部署。演示中在 Taku 内直接配置运行了依赖数据库与 Redis 的开源项目 OpenCut，并将另一个 AI 视频生成应用的 skill 原子化拼接进去。
- **第二层 统一后端通讯协议**：Taku 生态内所有生成物后端具备统一的对 Agent 接口，主 Agent 以"后端对后端"方式无缝互调（演示：Multi-agent 股票分析系统与纯量化脚本一句话串联），中间有转义层处理数据结构差异。
- **第三层 跨应用 context 与记忆共享**：某应用中积累的数据/习惯/规则自动同步至所有相关应用，无需显式命令（演示：知识图谱数据自动增强了写作 Agent 的输出风格）。

### 定价与商业模式

- Standard $50/月（15,000 credits）、Pro $200/月（60,000 credits，私有 Stack 与团队席位）、Developer 档 BYOK（自带模型与 Key、API/CLI 访问）；支持 credits 充值与自动充值。
- 创作者分成：Stax 按使用次数计费分成。
- 商业模式尚未经市场验证：实测市场安装量极低（见交付结论 5）。

## 技术架构调研

### 工作机安装（Windows / macOS）

| 平台 | 状态 | 证据 |
| --- | --- | --- |
| macOS Apple Silicon | **可用**。Taku-arm64.dmg，约 200MB，v3.1.22（2026-07-22） | download.taku.ai/mac 重定向至真实安装包（直接事实） |
| macOS Intel | 不可用，"Coming Soon" 占位页 | download.taku.ai/mac-intel 实测（直接事实） |
| Windows | **不可用**，"Coming Soon" 占位页 | download.taku.ai/windows 实测（直接事实） |
| Linux | 不可用（本轮亦不作为合格路径） | download.taku.ai/linux 实测 |

- 桌面端为 **Electron** 应用：更新源为标准 electron-updater 格式（latest-mac.yml + zip/dmg 双资产 + sha512），自建更新服务（download.taku.ai/app-update/v1/...）。
- 未发现 Docker/WSL 等前置依赖的官方说明（无公开文档站）；安装即 dmg 拖放，卸载路径未见官方说明。

### 主体功能运行位置：PC 本地（Desktop + 本机 Core 进程）

- v3.1.22 Release Notes（官方一手，中文原文）描述的更新流程证实了本地进程架构：Desktop（Electron 壳）管理本机 **Core** 进程的生命周期；更新时需停止事件入口、等待 "managed Core" 经 quiet window 全部退出后才交给原生更新器；新 Desktop 会校验 Core 的 "不可变 build identity"，拒绝旧安装包的 Core。
- Release Notes 明确更新完成后用户可"立即继续 **Planner 与 Builder** 任务"——即任务规划与应用构建的执行主体在本机 Core 中。
- 结论：主体功能运行在 PC 本地，符合本轮准入的形态要求（该项判定为"直接事实 + 少量推导"）。

### 云端角色（按 RUNBOOK 简单提及）

- **账号与市场分发**：基于 Supabase（auth.taku.ai 为 Supabase 存储域，应用资产托管其上）。
- **模型推理网关（默认）**：credits 计价说明默认推理经 Taku 云端计量结算；Developer 档 BYOK 可自带模型与 Key，是否支持本地模型端点（Ollama 类）未见文档，未决。
- **跨应用记忆共享的存储位置**（本地还是云端）未见官方说明，未决；若在云端，则数据边界需要重点评估。

### 维护状态与生态

- 版本节奏：v3.1.22（2026-07-22），版本号已推进至 3.x，距调研仅 9 天，维护活跃；Release Notes 工程细节充分（生命周期测试、发版门禁、失败恢复）。
- 生态真实度：Marketplace 实测 Top installs 为 23/13/11/9/8 次，与官网 "12,000 apps / 1.2M runs月" 的营销口径严重不符；生态处于极早期。
- 开源属性：闭源；无官方 GitHub 组织；无公开文档站（docs.taku.ai 不存在）；社区入口仅 Discord。

## 未决项

1. **Windows 版时间表**：官方仅有 Coming Soon 占位，无日期承诺——这是重新评估的首要触发条件。
2. **本地 Runtime 的环境供给方式**：访谈演示可运行含数据库/Redis 的复杂项目，本机如何供给这些依赖（内置容器/Docker/托管进程）未知。
3. **BYOK 是否支持本地模型端点**（Ollama / LM Studio 类），即模型推理可否完全脱离 Taku 云。
4. **跨应用记忆共享的数据存储位置与数据边界**（本地 / Supabase 云端）。
5. **公司现状**：2026-03 访谈称未融资、团队很小；当前融资与团队状态未见公开信息。
6. **Core 的技术栈与权限模型**（文件系统/终端/浏览器访问权限如何授予与约束）。

## 后续验证建议

1. **触发式重估**：监测 download.taku.ai/windows 端点，Windows 安装包一旦真实可下载即重启评估。
2. 若进入下一轮：注册账号并在 macOS AS 测试机安装，验证 (a) Core 进程形态与资源占用（`ps` 观察）；(b) 断网条件下本地已生成应用可否继续运行（区分本地运行时与云依赖）；(c) 生成一个含后端的应用，抓包确认代码与数据是否离开本机。
3. 联系官方（Discord）确认 BYOK 本地模型支持与记忆共享数据存储位置。
4. 跟踪其 Marketplace 安装量数据变化，以实测口径评估生态真实增长。
