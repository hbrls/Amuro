# CodeBanana / CBBot 技术产品调研

> updated_by: Qoder
> updated_at: 2026-07-31 12:40:00
> evidence_window: 调研日期 2026-07-31；官方网站 codebanana.com（en/zh）、官方文档站 docs.codebanana.com（Changelog 更新至 2026-07-28）快照；GitHub `mobvoi/CBbot` 仓库快照（68 Stars、MIT、最新 Release v3.8.2 2026-05-15）；Google Play 应用信息（com.mobvoi.cbapp）

## 交付结论

1. **CodeBanana 是出门问问（Mobvoi）推出的 "AI Native OS for Organizations"——把 Agent、聊天与项目工作空间统一在一个平台的团队协作产品。** 产品有两个官方形态：**Web 版**（浏览器访问，项目运行在云端 VM）与 **CBBot 桌面版**（macOS / Windows 原生应用，Agent 在本机执行）。两者是"同一产品的两种形态"，共享账号、计费、组织与项目数据（官方文档一手表述）。
2. **CBBot 桌面形态下，Agent 执行主体在 PC 本地，形态上满足"主体工作必须在 PC"的核心焦点。** 官方文档明确：CBBot 让 Agent 直接操作本地文件系统（读写/批处理）、执行终端命令、控制本地应用（模拟点击输入）、浏览器自动化、屏幕捕获与理解，并支持 Bot-only Skills、全盘 File Watch 与系统通知。这些能力是 Web 版不具备、只在本机运行的。
3. **但云端绑定深，不是"可独立运行的本地产品"。** AI 功能必须联网；模型推理全部经 CodeBanana 云端（聚合 Claude / GPT / DeepSeek / Gemini / GLM / Kimi / Doubao / MiniMax / Qwen），未发现自带 API Key 或本地模型（Ollama 类）选项；账号、计费（token 按量 + 云 VM 订阅费）、项目同步、技能市场均在云端。若使用"云项目"，执行则发生在云端 VM 而非本机。判定为**有条件符合**：仅当以 CBBot 本地项目为主要用法时，主体在 PC 成立，云端角色可视为"账号 + 同步 + 模型推理网关"（按 RUNBOOK 简单提及，不展开）。
4. **Windows / macOS 双平台有官方原生安装包，零外部依赖，但 macOS 仅支持 Apple Silicon。** README 明确 "Zero Dependencies：无 Docker、无 WSL"，Windows 10/11 x64 用 `.exe`、macOS 用 `.dmg` 安装，浏览器一键登录后即用。**注意：v3.x 起 macOS 只提供 arm64 包（M1–M4），Intel Mac 无法使用**（仅早期 1.0.82 有 x64 包）；Windows 首次启动建议管理员权限，macOS 需手动授予辅助功能、完全磁盘访问、屏幕录制权限。
5. **"开源"仅限于分发与 Skills，应用本体闭源。** GitHub `mobvoi/CBbot` 挂 MIT 许可，但仓库只有 LICENSE / README / docs / skills 四项（约 124 KB），是安装包分发页 + 技能库，没有应用源码。不可按开源产品对待，无自托管/私有化路径。
6. **维护活跃，但产品很年轻。** 平台 Changelog 更新至 2026-07-28（每两周左右一版）；CBBot 仓库创建于 2026-02-05，半年内从 v1.0 迭代到 v3.8.2（2026-05-15），另发布 CN 专版安装包。GitHub 社区极小（68 Stars、下载量个位数，主分发渠道是官网 CDN），公开第三方反馈样本几乎为零。
7. **综合判定：CodeBanana/CBBot 可进入候选观察名单，但有四个硬约束需在准入裁决时权衡**：(a) 闭源、无私有化，数据经由其云端（服务器在海外，大陆访问官方建议 VPN 优化）；(b) Intel Mac 不支持；(c) 模型推理与计费强绑定其云服务，无法替换为自有模型通道（当前证据下）；(d) 产品成熟度低、公开反馈缺失，商业持续性依赖出门问问的投入。

## 调研目标、范围与边界

### 调研目标

理解 CodeBanana（codebanana.com）的产品定位、运行形态与部署形态，重点回答：

1. CodeBanana 是什么产品，为谁解决什么问题？
2. 主体功能运行在 PC 本地还是云端？
3. Windows / macOS 工作机上如何安装、运行、卸载，依赖与权限如何？
4. 桌面形态（CBBot）与 Web/云端的关系及边界是什么？

### 核心问题

- 产品定位、目标用户、核心流程与功能边界。
- Web 版与 CBBot 桌面版的分工：哪些能力在本地、哪些在云端。
- 安装方式、依赖、权限、卸载路径（Windows / macOS）。
- 开源属性、维护状态、版本演进与生态反馈。

### 覆盖范围

- 官方网站（首页、CBBot 产品页、下载页）与官方文档站（含 Changelog、计费、CBBot 文档）。
- GitHub `mobvoi/CBbot` 仓库元数据、README 与 Release 记录。
- 应用商店信息（Google Play）作为移动端形态旁证。

### 明确排除

- 不进行源码审计（应用本体闭源，亦无源码可审）。
- 不进行竞品比较与选型矩阵。
- 不调研遥测、监控与运营数据采集。
- 不深入调研 CodeBanana 云后端（云 VM 调度、协作服务架构等），云端仅按"网关/辅助角色"简单提及。
- 不安装、不运行、不注册账号实测。
- Linux 不作为工作机合格路径（官方也未提供 Linux 桌面端）。

## 证据口径

- **直接事实**：官方文档站（docs.codebanana.com）的 CBBot Introduction、Billing & Plan、Changelog 页面；GitHub API 仓库元数据与 Release 资产清单；`mobvoi/CBbot` README 原文；官网下载页。
- **架构推导**："模型推理全部经 CodeBanana 云端、无 BYO Key/本地模型"基于 README 计费说明与文档模型页推导，未实测客户端设置项，标注为推导。
- **快照边界**：版本号、Changelog、Stars 均为 2026-07-31 快照；官网"trusted by users worldwide"无可验证数字；公开第三方反馈样本极少，本报告未纳入用户口碑结论。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：CodeBanana 是面向"超级组织"（Super Organization）的 AI 原生协作平台——把需求讨论（chat）、Agent 执行（agent）与项目资产沉淀（workspace）合并到一处，从对话直达交付。
- **目标用户**：需要人机混合协作的团队（开发者、设计师、产品经理同一空间协作），以及需要本地自动化的个人用户（CBBot）。官方叙事强调"老板可直接指挥 Agent 干活"的组织级用法。
- **公司背景**：出门问问（Mobvoi，GitHub org `mobvoi`，上市公司），CodeBanana 为其 2026 年推出的 AI 协作平台产品线；另有 iOS / Android 移动 App（`com.mobvoi.cbapp`）。

### 核心流程（用户视角）

1. 注册 CodeBanana 账号，创建/加入组织，创建项目（空白、模板或导入 GitHub 仓库）。
2. 在项目内与 Team Agent / Discussion 协作：讨论需求、@agent 下发任务，Agent 在云 VM（Web 版）或本机（CBBot 本地项目）中执行。
3. Agent 产出代码、文档、应用；通过 Project Viewer 查看/评审文件，Dev Tools 管理终端与服务，Deploy 发布可分享链接。
4. 通过 Skills 系统（SKILL.md + 脚本）扩展 Agent 能力，可发布到技能市场共享；Cron Job / Heartbeat / File Watch 驱动定时与事件触发的自动化。
5. 计费：Free（$5 一次性 token）/ Personal（$25/月 token + 云 VM 费，2c4G–8c16G 三档）/ Professional（$130/月）/ Team Plan（$45–105/席位/月，共享 token 池）。

### 功能地图与边界

- **Web 版独有场景**：多人协作、组织管理、云项目（云 VM 执行环境）、随处访问。
- **CBBot 独有能力**：本地文件系统全盘读写、终端命令执行、本地应用控制（模拟交互）、浏览器自动化、屏幕捕获与理解、Bot-only Skills、全盘 File Watch、系统通知；并可外接 Feishu / Telegram / Discord / Slack / 钉钉 / 企微 / QQ / Mattermost 等 IM 渠道作为 Agent 入口。
- **共享**：账号、计费、组织、云项目、聊天记录、技能，跨端实时同步；CBBot 亦可创建云项目。
- **边界**：本地项目仅在客户端在线时对其他端可见；AI 功能必须联网，无离线模式。

### 维护状态、版本演进与生态反馈

- **平台**：Changelog 更新至 2026-07-28，节奏约两周一版，近期迭代集中在 Team Plan 计费、组织管理、Personal Agent、A2A（Agent 间协作）与多媒体生成——判定为**活跃开发期**。
- **CBBot**：仓库 2026-02-05 创建；Release 轨迹 v1.0.2（02-05，pre-release）→ 1.0.82（02-11，当时尚有 mac x64 包）→ v3.7.4（04-17）→ v3.8.2（05-15，新增 CN 专版）；版本号跳跃大，v3.x 起放弃 Intel Mac。GitHub 最后推送 2026-05-15，但平台 Changelog 中 CBBot 相关修复持续出现（如 07 月的 CBBot 项目权限修复），说明桌面端仍在维护，GitHub 仓库只是低频同步的分发窗口。
- **生态与反馈**：官方 Discord、飞书群、微信群为主要社区入口；技能市场为官方生态机制。GitHub 社区体量极小（68 Stars / 2 Forks / 2 open issues），公开第三方评测与用户反馈样本当前证据下几乎未发现，无法形成口碑结论。

## 技术架构调研

### 系统全貌与运行形态

- **整体**：云端多租户 SaaS 平台（账号/组织/聊天/云项目/云 VM/技能市场/计费）+ 三类客户端（浏览器 Web、CBBot 桌面、移动 App）。
- **CBBot 桌面端**：原生桌面应用（官方强调 Fully Native、无 Docker/WSL；具体 GUI 框架未公开，应用闭源，未决）。本机内 Agent 具备系统级操作能力；登录、项目同步、模型推理走 CodeBanana 云端。
- **执行位置的双轨制**（关键架构特征）：同一项目体系下，**云项目**在云端 VM 内执行（Web/CBBot 均可访问），**本地项目**在用户 PC 上执行（仅 CBBot）。"主体在哪"取决于用户选择的项目类型。

### 核心链路（本地自动化场景，基于官方文档描述整理）

1. 用户在 CBBot 中对本地项目下达任务（或由 Cron/File Watch/IM 渠道触发）。
2. CBBot 将任务上下文发送至 CodeBanana 云端进行模型推理（跨网络边界；推理模型由用户在平台模型列表中选择）。
3. 模型返回的操作计划由 CBBot 在本机执行：文件读写、终端命令、应用控制、浏览器自动化、屏幕捕获验证。
4. 执行结果与聊天记录同步回云端，跨端可见；token 消耗计入账户配额。

关键约束：断网即不可用；数据（任务上下文、文件内容片段）必然经过 CodeBanana 海外服务器；执行安全依赖客户端的"安全执行环境"声明（隔离机制细节未公开，未决）。

### 主要依赖

- CBBot 运行时零外部依赖（无 Docker/WSL/Node 前置）；硬依赖仅为网络连接与 CodeBanana 云服务可达性。
- 大陆网络环境：官方称可直连但建议 VPN 全局代理以改善速度（README 一手表述，侧面证实服务器在海外）。

### 接口形态

- 用户侧：桌面 GUI、Web、移动 App；IM 渠道机器人（Feishu/Telegram/Discord 等）作为 Agent 对话入口。
- 平台侧：存在 OpenAPI 规范（docs 站点公布 openapi.json），说明有对外 HTTP API；细节未展开（超出判定所需）。

### 持久化方式

- 本地项目文件在用户 PC；云项目、聊天记录、组织数据、技能在云端（Free 20MB / Personal 1GB / Professional 5GB 云存储）。

### 通信方式

- 客户端与云端为长连接/同步通道（项目列表实时同步、客户端离线则本地项目显示 offline），具体协议未公开，未决；判定不依赖此项。

### 部署形态

#### 工作机安装（Windows / macOS）

- **Windows**：官网/GitHub Release 下载 `CBbot-lite-win-x64-v*.exe`，向导式安装；Windows 10/11 x64；建议 8GB 内存、2GB 磁盘；首次启动建议以管理员身份运行；可能需在 Windows 安全中心"仍要运行"并给防火墙放行。卸载走系统"应用和功能"标准流程。
- **macOS**：下载 `.dmg` 拖入 Applications；**仅支持 Apple Silicon（M1–M4）**，macOS 10.15+；首次打开需在"隐私与安全性"中允许（安装包签名/公证状态不完善）；核心权限需手动授予：**辅助功能**（UI 自动化）、**完全磁盘访问**（全盘文件读写）、**屏幕录制**（屏幕理解），另有可选的 Keep Awake。卸载为拖入废纸篓。
- 登录方式：浏览器一键 OAuth 回跳，无需手工配置密钥。
- 另有 CN 专版安装包（CBbotCN），推测面向大陆网络/合规差异，官方未说明具体区别（未决）。

#### 主体功能运行位置

- **CBBot 本地项目场景：主体执行在 PC 本地，符合要求**——文件、终端、应用、浏览器、屏幕操作均发生在本机。
- **Web / 云项目场景：执行在云端 VM，不符合要求。**
- **总判定：有条件符合**——取决于用法锁定在 CBBot 本地项目；且模型推理环节始终在云端，无本地推理选项（当前证据）。

#### 云端网关（简单提及，不展开）

- 云端对 CBBot 承担：账号与授权、跨端数据同步、技能市场分发、**模型推理网关**（聚合多家模型供应商）与计费计量。按 RUNBOOK 仅记录方案与作用，不调研其服务端实现。

## 未决项与证据边界

1. **CBBot 技术栈与"安全执行环境"实现**：应用闭源，GUI 框架、沙箱/隔离机制均未公开；"Safe Execution Environment"仅为 README 声明，未经验证。
2. **是否支持自带模型通道（BYO API Key / 本地模型）**：当前官方资料未发现；若存在隐藏设置需实测确认。此项直接影响"云端强绑定"结论的强度。
3. **CN 版与国际版安装包的差异**：官方未说明（推测涉及接入点/合规，未验证）。
4. **通信协议与本地数据上行范围**：任务执行时哪些本地内容会上传至云端推理，官方未披露粒度；涉及数据安全评估时必须实测抓包或获取官方说明。
5. **公开用户反馈缺失**：产品发布约半年，第三方评测与规模化用户口碑几乎空白，可靠性只能通过试用验证。

## 后续验证建议

1. 若进入候选：注册免费账号（$5 试用额度），在一台 macOS（Apple Silicon）与一台 Windows 工作机上实装 CBBot，验证本地项目的文件/终端/应用自动化真实能力与稳定性。
2. 重点实测：设置项中是否存在模型通道自定义；断网行为；本地任务执行时的数据上行范围（配合网络抓包）。
3. 向官方确认：私有化/企业本地化部署是否在路线图（当前无自托管路径是与内网/数据合规场景的主要冲突点）；Intel Mac 支持计划。
4. 若对"本地 Agent + 云推理网关 + IM 多渠道接入"范式感兴趣，可将其与此前调研的同类桌面 Agent 形态（如 Kuse Cowork，见 WORKSHOP-038）在后续独立任务中做同口径比较（本报告按 RUNBOOK 不做比较）。
