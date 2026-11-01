# Coze Loop 技术产品调研

> updated_by: Qoder
> updated_at: 2026-08-28
> evidence_window: 2026-08-28 / Coze Loop v1.5.1（2026-01-20 Release）/ 分支 main

## 交付结论

### 产品定位与核心能力

Coze Loop（扣子罗盘）是字节跳动 Coze 团队开源的 **AI Agent 全生命周期管理（LLMOps）平台**，核心能力为三大模块：**Prompt 开发与调试、自动化评测、全链路观测（Trace）**。它解决的是"AI Agent 效果如何开发、评估、监控"的问题，而非"任务如何被调度、分派、推进"的问题。

产品对象模型中不存在通用的 Task / Plan / Issue 调度对象；其"任务"概念仅出现在评测业务内部（评测实验执行、Trace 自动评测），属于领域业务功能。

### Stateful 调度能力判定

**该产品不具备 Stateful 调度能力**，应归类为**任务执行宿主 / 无状态任务消费者**（此处"任务"指评测任务，非通用工作任务）。

关键判定依据：
- **无通用工作对象**：不存在持久化的 Workspace/Project/Issue/Plan/Task 调度对象及其依赖关系。其"Space（空间）"仅为资源隔离容器，"Experiment（实验）"是评测业务记录，均非调度对象。
- **无调度职责**：不存在"判断任务何时可执行、按何种顺序推进、由谁执行、失败后如何继续"的中心调度。评测实验由用户手动触发或 Trace 数据触发自动评测（auto task），执行过程为经 RocketMQ 分发的异步批处理，而非基于依赖与策略的持续调度。
- **无 Agent 分派**：Coze Loop 自身不运行 Agent 执行体，仅通过 SDK 接收外部 Agent 上报的 Trace，或调用在线 LLM 完成单次推理；不存在 Agent 唤起、续跑、失败转移机制。

系统架构是**自托管 LLMOps 服务端平台**，而非调度器。

### Windows 与 macOS 支持情况

| 平台 | 支持状态 | 安装方式 | 备注 |
|------|----------|----------|------|
| Windows | **支持（仅作 Docker 宿主机）** | Docker Desktop + Compose | 需启用 Hyper-V/WSL2 |
| macOS | **支持（仅作 Docker 宿主机）** | Docker Desktop + Compose | 与 Windows 步骤一致 |
| Linux | **完整支持** | Docker / Docker Compose / Kubernetes | 生产推荐 |

**关键结论**：Coze Loop **不存在 Windows 或 macOS 原生桌面客户端 / CLI 工作机程序**。PC 仅作为两种角色：部署宿主机（通过 Docker Desktop 运行整套服务端）或访问终端（浏览器）。两平台能力完全一致、无平台专属差异。

**系统要求**：建议 2 核 4G 及以上（Minikube 方式建议 4 核 8G 及以上）；仅需 Docker 常规权限。

**平台缺陷**：若以"PC 原生 Agent 运行载体"为标准，属于能力缺失；但对 LLMOps 平台定位而言属预期形态。

### Local 优先适配判断

**部分符合 Local 优先标准**，存在功能性云端依赖。

- **数据本地化达标**：开源版可完全部署在本地/内网，账号、空间、Prompt、评测、Trace 数据均存储于本地 MySQL / ClickHouse / MinIO，无外传云端。
- **能力本地化不达标**：核心智能能力（Prompt 调试、LLM 评估器打分）需调用**在线 LLM 服务**（OpenAI、火山方舟等），模型推理不在本地完成；断网或无私有 LLM 端点时，Prompt 执行与 LLM 评估不可用。
- **云端组件**：开源版自身无强制云端组件；另有独立商业版 SaaS（loop.coze.cn），与开源版账号、数据不互通。

**选型缺陷**：平台可本地运行，但核心智能能力依赖云端模型服务，构成 Local 优先的功能性选型缺陷（可通过接入私有部署模型端点缓解，但默认形态依赖在线服务）。

### 架构范式与改造边界

**架构范式**：**前后端分离的自托管服务端平台（DDD 单体后端 + 多基础设施组件）**

- **后端**：Go 1.24+ 单体应用（coze-loop-app），CloudWeGo（Hertz HTTP + Kitex RPC），DDD 分层，内部按领域划分 data / evaluation / foundation / llm / observability / prompt 六模块。
- **前端**：React 18 + TypeScript SPA，Rush.js Monorepo，Rsbuild 构建，经 Nginx 提供。
- **FaaS**：Python FaaS 与 JS FaaS（Deno）两个独立容器，运行代码评估器。

**核心机制**：
- **Prompt 调试**：浏览器 → Nginx → app(Hertz) → Prompt 领域 → Eino 统一接入 → 外部在线 LLM；Tracer 同步将调用链写入 MySQL/ClickHouse。
- **评测实验**：用户创建实验 → app 投递评测任务至 RocketMQ → app 内消费者拉取执行（调用 LLM / FaaS 代码评估器）→ 结果写入 MySQL/ClickHouse → 前端查询统计（异步批处理，非依赖驱动调度）。

**改造边界**：
- 可剥离/替换：特定 LLM Provider（Eino 多模型）、MinIO（S3 兼容）、外置 MySQL/ClickHouse/Redis/RocketMQ 实例。
- 难剥离：DDD 领域内核、Thrift IDL 服务契约、RocketMQ 异步分发、ClickHouse 观测存储。
- 核心依赖：Docker、MySQL、Redis、ClickHouse、RocketMQ、MinIO、在线 LLM 端点。

---

## 调研目标、范围与边界

### 调研目标

1. 判定 Coze Loop 是否具备 Stateful 编排调度能力
2. 确认 Windows 与 macOS 工作机支持情况
3. 评估 Local 优先适配程度与云端依赖
4. 识别架构范式、主要组件与私有化改造边界

### 核心问题

- 产品是否持久拥有 Task 对象及其依赖关系、生命周期？
- 任务状态由谁持有，如何推进，失败如何恢复？
- Windows 和 macOS 分别如何安装和运行？
- 主体功能运行在本地还是云端？

### 覆盖范围

- 产品定位、目标用户、核心流程、功能边界
- 技术架构：运行形态、组件、依赖、接口、持久化、通信、部署
- 平台支持：Windows、macOS、Linux
- 开源协议、维护状态与生态

### 明确排除

- 源码审计（逐文件分析）
- 竞品比较 / 选型矩阵
- 遥测/监控调研
- 性能 benchmark

---

## 产品调研

### 产品定位与目标用户

**一句话定位**：开源的 AI Agent 全生命周期 LLMOps 平台（Prompt 工程 + 自动化评测 + 全链路观测）。

**目标用户**：需要开发、调试、评估、监控 LLM 应用与 Agent 的研发团队。

### 核心流程

```
注册登录 → 进入 Space（工作空间）
→ Playground 编写/调试 Prompt（选在线模型实时对比）
→ Prompt 版本管理 / Prompt as a Service
→ 准备评测集(Dataset) + 评估器(Evaluator: LLM/代码)
→ 创建评测实验(Experiment) → 平台异步批量执行 → 结果统计
→ SDK/OpenTelemetry 上报线上 Agent Trace → 全链路观测/人工标注/自动评测
```

### 功能地图与边界

| 功能域 | 当前能力 | 边界 |
|--------|----------|------|
| Prompt 开发 | Playground 调试对比、版本管理、Prompt as a Service | 不含 Agent 编排 / 工作流编排 |
| 评测 | 评测集管理、评估器（LLM/代码）、实验管理统计、Trace 自动评测 | 评测对象为 Prompt/Agent 输出，非通用任务 |
| 观测 | SDK Trace 上报、OpenTelemetry 接入、Trace 查询、轨迹观测、人工标注 | 只读观测与标注，不控制 Agent 执行 |
| 模型接入 | 经 Eino 接入 OpenAI、火山方舟、千帆、通义、Gemini、Claude 等 | 模型推理在外部服务，平台不托管模型 |

**明确边界**：Coze Loop 不提供 Agent 运行时、工作流编排、任务调度、Agent 分派能力；它观测与评估 Agent，但不驱动 Agent。

### 维护状态与版本演进

- **开源协议**：Apache 2.0
- **维护状态**：活跃。v1.0.0（2025-08-01）→ v1.5.1（2026-01-20），约 6 个月发布 8 个版本（证据：[Releases](https://github.com/coze-dev/coze-loop/releases)）。
- **仓库快照**：Star 5.7k、Fork 796（2026-08-28）。
- **版本演进方向**：v1.1 K8s 部署与多架构镜像；v1.2 OpenTelemetry 接入与 Trace 导出；v1.3 Prompt as a Service；v1.4 代码评估器（Python/JS FaaS）与自动化任务（auto task）；v1.5 轨迹观测、A2A agentkit、离线指标。整体围绕 LLMOps 深度演进，未出现向通用任务调度方向演进的信号。

### 生态与反馈

- **官方生态**：多语言 SDK（Python/Go/Java/JS，开源版与商业版通用）、OpenTelemetry Collector 接入、Eino/veADK/A2A agentkit 集成、火山引擎一键部署。
- **社区渠道**：GitHub Issues、Discord、Telegram、Lark 群。
- **反馈主题**（样本：公开技术博客与对比文章，2025-08 ~ 2026）：普遍认为其 Tracing、实验、评测一体化程度高、适合较大团队构建统一 LLM 运维平台；同时多次指出**外部组件多（ClickHouse、RocketMQ、Redis、MinIO）、部署与维护成本偏高**，对中小团队偏重。该反馈为样本观点，不代表全体用户。

---

## 技术架构调研

### 系统全貌与运行形态

**运行形态**：开源自托管服务端平台，前后端分离，单仓 Monorepo，多容器组合。

```
┌──────────────────────────────────────────────┐
│              部署宿主机（Docker / K8s）         │
│  浏览器 → Nginx(:8082, 静态资源+反代)           │
│              ↓                                │
│  ┌────────────────────────────────────┐      │
│  │  coze-loop-app (Go/Hertz+Kitex)    │      │
│  │  DDD: data/evaluation/foundation/  │      │
│  │       llm/observability/prompt     │      │
│  │  内嵌 RocketMQ 消费者               │      │
│  └────────────────────────────────────┘      │
│   ↓ MySQL  ↓ Redis  ↓ ClickHouse  ↓ MinIO     │
│   ↓ RocketMQ(namesrv/broker)                  │
│   ↓ python-faas / js-faas(Deno) 代码评估器     │
└──────────────────────────────────────────────┘
              ↓ 外部调用（联网）
┌──────────────────────────────────────────────┐
│   在线 LLM：OpenAI / 火山方舟 / 千帆 / 通义等    │
└──────────────────────────────────────────────┘
```

### 主要组件与核心链路

Docker Compose 部署组件（证据：[docker-compose.yml](https://github.com/coze-dev/coze-loop/blob/main/release/deployment/docker-compose/docker-compose.yml)）：

| 组件 | 职责 | 持久化 |
|------|------|--------|
| app | Go 后端，承载全部业务 API 与异步消费者 | — |
| nginx | 前端静态资源 + API 反向代理，对外 8082 | — |
| mysql(+init) | 结构化业务数据（用户、空间、Prompt、评测配置与结果元数据） | 数据卷 |
| redis | 缓存、分布式锁、限流、ID 生成 | 数据卷 |
| clickhouse(+init) | 海量 Trace/观测数据列式存储与分析 | 数据卷 |
| minio(+init) | 对象存储（数据集文件、导出文件） | 数据卷 |
| rocketmq-namesrv/broker/init | 消息队列，承载评测任务、Trace 上报、auto task 异步分发 | 数据卷 |
| python-faas / js-faas | 代码评估器沙箱执行环境 | — |

**核心链路一（Prompt 调试）**：浏览器 → Nginx → app(Hertz) → Prompt 领域 → Eino → 外部在线 LLM；Tracer 写入 MySQL/ClickHouse。

**核心链路二（评测实验）**：创建实验 → app 投递任务至 RocketMQ → app 内消费者执行（LLM/FaaS）→ 结果写 MySQL/ClickHouse → 前端查询统计。

### 主要依赖

| 依赖 | 用途 | 可替代性 |
|------|------|----------|
| Docker / Docker Compose | 运行环境（或 K8s+Helm） | 生产可换 K8s |
| MySQL | 业务元数据 | 可外置实例 |
| Redis | 缓存/锁/限流 | 可外置实例 |
| ClickHouse | 观测数据 | 可外置实例 |
| RocketMQ | 异步消息 | 可外置实例 |
| MinIO | 对象存储 | S3 兼容可替换 |
| 在线 LLM 端点 | Prompt 调试 / LLM 评估（**功能性硬依赖**） | 可接私有 OpenAI 兼容端点 |
| Go 1.24+ / Node 20 | 源码构建 | 仅开发需要 |

### 接口形态

| 接口类型 | 用途 | 备注 |
|----------|------|------|
| 对外 HTTP API | 前端/SDK/第三方 | Hertz，容器内 8888，经 Nginx 8082 代理；OpenAPI 用 PAT 鉴权 |
| Thrift IDL | 服务间契约 | Kitex 生成代码；前端经 IDL 生成 API Schema |
| 多语言 SDK | Trace 上报 / Prompt 调用 / 评测触发 | Python/Go/Java/JS |
| OpenTelemetry | Trace 接入 | 支持 OTel Collector |

### 持久化方式

- **业务元数据**（用户、空间、Prompt 版本、评测配置、实验记录）：MySQL，平台自有。
- **观测数据**（Trace/Span/轨迹）：ClickHouse，面向分析查询。
- **文件与数据集**：MinIO（S3 兼容）。
- **缓存/锁/限流**：Redis（非权威持久化）。
- 所有数据默认持久化于部署宿主机 Docker 数据卷，归部署方所有，无外传云端。

### 通信方式

- **客户端 ↔ 服务端**：浏览器 HTTP 短连接经 Nginx 代理；未见服务端推送/长连接作为核心交互（评测进度以前端查询获取）。
- **服务内部异步**：RocketMQ（评测任务、Trace 摄入、auto task），消费者内嵌于 app 进程。
- **LLM 调用**：同步 HTTP（经 Eino），支持流式返回。
- 未见第三方分布式协调（如 etcd）作为核心依赖。

### 部署形态

#### 工作机安装（Windows / macOS）

**形态**：无原生安装包。两平台均通过 Docker Desktop + Compose 部署整套服务端，步骤一致、无平台专属差异（证据：[快速开始](https://github.com/coze-dev/coze-loop/wiki/2.-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)）。

**安装方式**（Windows 与 macOS 相同）：
```bash
git clone https://github.com/coze-dev/coze-loop.git
cd coze-loop
# 编辑 release/deployment/docker-compose/conf/model_config.yaml，填入在线模型 api_key 与 model
make compose-up
# 浏览器访问 http://localhost:8082
```

**依赖、权限与网络要求**：
- Docker Desktop（Windows 需启用 Hyper-V/WSL2）
- 建议 2 核 4G 以上（Minikube 方式 4 核 8G 以上）
- 部署时需拉取多个容器镜像；运行时必须能访问所配置的在线 LLM 端点
- 默认仅 Nginx 8082、OpenAPI 8888、Debug 40000 三个端口对外

**卸载方式**：
```bash
docker compose down        # 停止并移除容器
# 删除对应数据卷与源码目录即完成卸载，无系统级残留
```

#### 主体功能运行位置

**混合运行形态**：
- **平台主体**（Web、API、评测执行、Trace 存储与分析）：部署方本地/内网
- **数据存储**：本地 MySQL/ClickHouse/MinIO
- **LLM 推理**：外部云端模型服务（OpenAI/火山方舟等），平台不托管模型

**Local 优先判断**：数据本地化达标，能力本地化不达标——存在对云端模型服务的功能性依赖，记为 Local 优先选型缺陷（可经私有模型端点缓解）。

#### 云端形态（如存在）

- 开源版自身无云端组件。
- 关联商业版"扣子罗盘"（loop.coze.cn）为字节托管 SaaS，提供 Coze 平台集成、托管模型与增值能力；与开源版独立，账号与数据不互通。本调研不展开商业版架构，仅记录其存在作为生态背景。

---

## 未决项与证据边界

| 未决项 | 原因 | 建议验证方式 |
|--------|------|--------------|
| auto task 内部状态机细节（任务表结构、租约、并发协调） | 已确认其为评测领域自动评测，足以判定非通用调度；未逐行核验 | 定点源码核验 evaluation 模块 |
| 开源版与商业版能力差清单 | 官方未提供逐项对照 | 查看商业版官网/文档 |
| 私有 LLM 端点适配范围 | Eino 支持多模型，未逐一验证私有兼容性 | 实际接入私有 OpenAI 兼容端点测试 |
| 部署与端口结论的运行验证 | 本报告未实际部署，结论来自官方文档与 Compose 配置快照 | 实际执行 Docker Compose 部署 |

---

## 后续验证建议

1. **评测可靠性语义核验**：若需确认评测任务执行的重试、超时、失败转移，针对 evaluation 模块的实验执行与 RocketMQ 消费逻辑做定点源码核验。
2. **私有化落地验证**：实际执行一次 Docker Compose 部署，并验证接入私有 OpenAI 兼容模型端点后 Prompt 调试与 LLM 评估是否完全可用，以闭环 Local 优先缺陷的缓解路径。
