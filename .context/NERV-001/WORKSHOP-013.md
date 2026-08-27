# Plane 技术产品调研

> updated_by: Kilo - glm-5.2
> updated_at: 2026-07-19 09:44:00
> evidence_window: 2026-07-19，Plane Cloud 官网 + 开发者文档 + GitHub makeplane/plane（默认分支 preview，最新 push 2026-07-17）

## 交付结论

1. **判定：不符合本次调研焦点要求。** Plane 的主体功能（项目管理逻辑、工作项数据存储、实时协作、Plane AI、Wiki）运行在服务端（Plane Cloud SaaS 或用户自托管的服务器集群），不在工作 PC 本地。工作 PC 上的桌面应用与移动应用只是连接到该服务端的客户端壳。
2. Plane 提供桌面应用（macOS / Windows / Linux）和移动应用（iOS / Android），但它们均通过连接 Plane Cloud 或自托管实例工作，本地不承载主体业务逻辑或数据所有权。
3. 即使选择"自托管"，主体功能仍运行在一组服务端进程（API、Worker、Live 等 + Postgres/Redis/RabbitMQ/MinIO）中；把这套服务端跑在工作 PC 的 Docker 里属于"在 PC 上跑服务器负载"，并非"主体功能为桌面应用"，且不是官方推荐的部署形态。
4. Plane 不是纯 Linux-only：官方明确支持在 Windows 与 macOS 工作机上安装桌面客户端；自托管 Docker 方案在 Windows/macOS 上可通过 Docker Desktop 运行。因此排除"仅 Linux"路径——失败点在"主体位置"，不在"平台支持"。
5. 由于核心焦点（主体在 PC 本地）不满足，依据 RUNBOOK 不再展开服务端实现、扩缩容、高可用等深入架构调研。

## 调研目标、范围与边界

### 调研目标

判断 Plane（plane.so）能否作为"主体功能运行在 Windows/macOS 工作 PC 本地"的产品，并说明其在工作机上的安装方式、运行形态、依赖与权限。

### 核心问题

- Plane 的主体功能运行在 PC 本地还是云端/服务端？
- Windows 与 macOS 工作机上如何安装、运行 Plane？依赖与权限是什么？
- 桌面应用是否独立可运行，还是必须连接后端服务？

### 覆盖范围

- Plane 官网（plane.so）产品定位与功能地图
- 官方下载页（plane.so/download）桌面/移动客户端支持矩阵
- 开发者文档 self-hosting overview 与 plane-architecture
- GitHub 仓库 makeplane/plane 元数据

### 明确排除

- 不做源码审计、不盘点路由/schema/锁/队列实现
- 不做竞品比较（Jira/Linear/Asana 等仅作为官方对照说明，不展开选型矩阵）
- 不调研遥测、监控、运营数据采集
- 不展开服务端扩缩容、高可用、SLA、内部部署细节
- 不把 Linux 安装作为默认路径

## 证据口径

- **官方产品资料（plane.so 首页、/download）**：用于定位、功能、客户端支持矩阵。宣传性表述（"AI-native""air-gapped ready"）需与文档/架构交叉确认。
- **官方开发者文档（developers.plane.so/self-hosting）**：用于运行形态、部署方式、架构组件。文档可能滞后，已记录证据时间。
- **GitHub 仓库元数据**：仅证明当前快照（星标、语言、许可证、活跃度），不外推运行时表现。
- **架构推导**：基于官方架构图与组件清单推断主体位置，标注为推导。
- **未决项**：桌面客户端的本地缓存/离线能力未由官方明确说明，标注为未决。

## 产品调研

### 产品定位与目标用户

Plane 自我定位为"AI-native 项目与知识管理平台"，面向需要在统一工作空间中管理项目、文档与 AI 工作流的团队。官方描述其为开源的 Jira / Linear / Monday / ClickUp 替代品。目标用户覆盖初创到企业级（官网列出 Sony、Aramco、Dolby、Accenture 等案例），并强调受监管行业（政府、国防、医疗、金融）的数据主权需求。

### 核心流程

以项目管理为主线：在 Plane 工作空间中创建项目 → 定义 Initiatives/Epic/Cycle → 拆分为 Work Item → 通过 Board/Spreadsheet/List/Gantt 视图跟踪 → 配合 Wiki 文档沉淀知识 → 通过 Plane AI 问答与代理执行分流、归派、总结。整个流程发生在 Plane 工作空间（服务端），用户通过浏览器、桌面客户端或移动客户端访问。

### 功能地图与边界

- **当前可用**：Projects（项目管理）、Wiki（知识库）、Plane AI（问答+代理）、Cycles/Epics/Initiatives、Workflows & Approvals、Dashboards、Teamspaces、Marketplace 集成（GitHub/GitLab/Slack/Sentry 等）、REST API/Webhooks/SDK/MCP Server。
- **规划/未发布**：Desk（客服模块，标注 Coming soon）、Microsoft Teams 集成（标注 Coming soon to Microsoft Teams）。
- **边界**：Plane 是团队协作 SaaS/自托管平台，不是单机离线生产力工具。

### 维护状态与版本演进

- GitHub makeplane/plane：星标约 5.47 万、Fork 约 5 千、Open Issues 约 1 千，最近 push 2026-07-17（截至证据窗口高度活跃）。
- 许可证 AGPL-3.0；主语言 TypeScript（前端 React/Vite）+ Python（后端 Django）。
- 桌面应用 v2.0.0 当前仅在 macOS 与 Linux 可用，Windows 仍停留在 v1.6.1，v2.0.0 标注"will be released soon"。

### 生态与反馈

- 集成生态：官方 Marketplace 含 GitHub、GitLab、Slack、Sentry 等；开放 API、OAuth Apps、Webhooks、原生 MCP Server 供构建 Agent。
- 客户案例（官网展示）以从 Jira/ClickUp/Trello 迁移为主；具体反馈样本边界：官网案例为遴选展示，不代表普遍反馈，未抽样 GitHub Issues。

## 技术架构调研

### 系统全貌与运行形态

Plane 由多个服务端进程 + 前端 + 基础设施依赖组成，运行在服务器上（自托管或 Plane Cloud）。桌面/移动客户端是连接到该服务端的访问层，不承载主体逻辑。

### 主要组件与核心链路

依据官方 plane-architecture 文档：

- **前端服务**：Web（主界面）、Space（公开分享）、Admin（实例管理）。
- **API 层**：API（核心 REST，所有数据操作）、Worker（异步任务，从 RabbitMQ 拉取）、Beat worker（定时任务）、Migrator（部署期 schema 迁移）。
- **支撑服务**：Proxy（Caddy 反向代理+SSL）、Live（WebSocket 实时协作）、Monitor（许可证校验）、Silo（GitHub/GitLab/Slack 集成后端）、Intake（邮件转工作项）。
- **基础设施依赖**：PostgreSQL 15.7+/16.x、Redis/Valkey、RabbitMQ、MinIO/S3 兼容对象存储、OpenSearch（可选，增强搜索）。

核心链路（以"创建并跟踪一个工作项"为例）：用户在桌面/移动/Web 客户端操作 → 请求经 Proxy 路由到 API 服务 → API 写入 PostgreSQL，附件入 MinIO/S3，异步任务入 RabbitMQ 由 Worker 处理 → Live 通过 WebSocket 向其他在线客户端推送实时更新 → Plane AI 读取全工作空间上下文回答/代理。整条链路的主体逻辑与状态全部在服务端，客户端只负责交互与渲染。

### 主要依赖

- 服务端运行时硬依赖：PostgreSQL、Redis/Valkey、RabbitMQ、MinIO/S3 兼容存储；可选 OpenSearch。
- 客户端依赖：官方未列详细系统要求；桌面客户端为各平台原生安装包，需网络访问 Plane Cloud 或自托管实例 URL。

### 接口形态

- 对终端用户：Web UI、桌面客户端、移动客户端（均通过 HTTPS/WSS 连接服务端）。
- 对集成/扩展：REST API（OAuth 2.0）、HMAC 签名 Webhooks、Node.js/Python 类型化 SDK、原生 MCP Server、@mention Agent 框架。
- 不穷举端点。

### 持久化方式

- 主体数据（项目、工作项、用户、Wiki 页面、配置）存于服务端 PostgreSQL；附件存于 MinIO/S3 兼容对象存储；会话与缓存存于 Redis；异步任务队列在 RabbitMQ。
- 客户端本地是否缓存工作项数据以支持离线编辑，官方资料未明确说明（未决）。

### 通信方式

- 客户端↔服务端：HTTPS（REST）+ WebSocket（Live 实时协作、光标、在场）。
- 服务端内部：API↔DB、API↔RabbitMQ、Worker↔RabbitMQ、Silo↔外部 OAuth/Webhook。
- 不审计心跳/锁/重试实现。

### 部署形态

#### 工作机安装（Windows / macOS）

- **桌面客户端（官方推荐的用户侧安装）**：
  - macOS：plane.so/download 提供 macOS Universal 安装包，支持连接 Plane Cloud 与自托管实例，当前 v2.0.0 可用。
  - Windows：plane.so/download 提供 Windows x64 安装包，但 v2.0.0 尚未发布（"Coming soon"），Windows 用户停留在 v1.6.1。
  - 安装入口：官网 /download 页或 `go.plane.so/macos` / `go.plane.so/windows`。
  - 依赖与权限：原生桌面安装包，需网络访问 Plane Cloud 或自托管实例；官方未详细列出系统版本/权限要求。桌面端使用既有 Plane Cloud 账号，自托管需填入实例 URL。OS 级推送通知当前不支持，仅有 dock/taskbar 未读角标。
  - 卸载：按各平台常规应用卸载方式（macOS 删 .app，Windows 卸载程序）；本地账号/工作项数据保留在服务端。
- **自托管（非工作机典型用法）**：部署形态为 Docker Compose / Docker AIO / Docker Swarm / Kubernetes(Helm) / Podman Quadlets / Airgapped，本质是服务器负载。可在 Windows/macOS 上借助 Docker Desktop 跑通，但这是"在工作机上跑服务端"，不是 Plane 设计的桌面用户形态，且需承担 Postgres/Redis/RabbitMQ/MinIO 等依赖的运维。

#### 主体功能运行位置

- **主体功能运行在服务端（云端或自托管服务器），不在工作 PC 本地。**
- 桌面/移动/Web 客户端均为访问层，主体业务逻辑、数据存储、实时协作、AI 全部在服务端进程与基础设施中完成。
- 依 RUNBOOK 判定：**不符合"主体功能在 PC 本地"的要求**。不得将"桌面客户端只是壳、真正工作在服务端"包装为符合要求。

#### 云端网关（如存在）

- Plane Cloud 作为 SaaS 承载全部主体功能，不属于"仅作简单网关"——它是产品本体本身，因此不可按"简单提及"处理；同时也不在本次焦点下展开其云后端实现细节。

## 未决项与证据边界

- 桌面客户端是否具备本地缓存/离线编辑能力，官方下载页与开发者文档未明确（未决）。即使存在有限离线缓存，也不改变主体逻辑在服务端的结论。
- Windows 桌面 v2.0.0 发布时间未公布（官方仅"Coming soon"），当前 Windows 用户仅能用 v1.6.1。
- 未抽样 GitHub Issues/Discussion 反馈，反馈主题边界未覆盖。

## 后续验证建议

- 若仍需考虑 Plane 作为团队协作平台（而非"主体在 PC 本地"的产品），应改用独立调研流程评估其作为 SaaS/自托管平台的部署、运维与集成能力，不在本 RUNBOOK 焦点下展开。
- 如需确认桌面客户端离线能力，可在 Windows/macOS 实机安装并断网验证工作项编辑/同步行为。
