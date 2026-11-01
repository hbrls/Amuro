# NocoBase AI 知识库 技术产品调研

> updated_by: Qoder - Qoder
> updated_at: 2026-08-21 16:00:00
> evidence_window: 2026-08-21 / NocoBase 2.x / 知乎专栏文章（2026-04-01）

## 交付结论

### 产品定位与核心能力

NocoBase 是一个**可扩展性优先、AI 驱动的开源无代码/低代码平台**，专为构建业务应用和企业解决方案而设计。AI 知识库（@nocobase/plugin-ai-knowledge-base）是其**专业版功能**，为 AI 员工提供 RAG 检索增强能力。

核心能力包括：文档向量化存储、基于 PGVector 的向量检索、多 LLM 支持（OpenAI/Gemini/Anthropic/本地 LLM）、工作流集成（Text Chat/Multimodal Chat/Structured Output 三种节点）。

### Stateful 调度能力判定

**该产品不具备 Stateful 调度能力**，应归类为**任务执行宿主（Task Execution Host）**。

关键判定依据：
- **无任务调度中心**：AI 知识库是 RAG 检索组件，负责任务的文档检索和上下文增强，而非任务调度
- **无任务依赖关系**：不支持 DAG、父子任务、前后置依赖等调度语义
- **无任务生命周期管理**：知识库管理状态机仅涉及文档处理状态（索引中/已完成/失败），非任务执行状态
- **工作流节点**：LLM 节点是工作流中的执行单元，由工作流引擎驱动，非独立调度器

系统架构是**低代码平台 + RAG 增强**，而非调度器。

### Windows 与 macOS 支持情况

| 平台 | 支持状态 | 安装方式 | 备注 |
|------|----------|----------|------|
| Windows | **支持（WSL/Server）** | Docker / WSL / Windows Server | 生产环境推荐 Linux |
| macOS | **支持（开发/测试）** | Docker / 本地开发 | 不建议作为生产服务器 |
| Linux | **完整支持（推荐）** | Docker / 源码构建 | 生产环境推荐 Ubuntu LTS/Debian 等 |

**系统要求**：
- 最低：CPU 1 核 / 内存 2 GB（功能验证）
- 推荐：CPU 2 核 / 内存 ≥4 GB（生产环境）
- 生产环境强烈推荐 Linux，Windows Server 需自行配置，macOS 仅适合开发测试

**平台缺陷**：Windows 和 macOS 均非生产环境推荐平台，存在部署复杂度。

### Local 优先适配判断

**部分符合 Local 优先标准**，存在云端依赖。

- **自托管支持**：支持 Docker 自托管、源码部署，数据可完全本地存储
- **本地数据库**：支持 PostgreSQL（含 PGVector）本地部署
- **LLM 依赖**：支持本地 LLM 服务，但默认配置依赖 OpenAI/Gemini/Anthropic 等云端 API
- **商业授权**：AI 知识库为专业版功能，需购买商业授权

**选型缺陷**：核心 AI 功能为商业版专属，开源社区版不包含；默认 LLM 配置依赖云端服务。

### 架构范式与改造边界

**架构范式**：**插件化微内核低代码平台**

- **核心架构**：数据模型驱动 + 插件化微内核（类似 WordPress）
- **AI 知识库**：独立插件（@nocobase/plugin-ai-knowledge-base），与 AI 员工插件协同
- **RAG 技术栈**：PGVector 向量数据库 + LangChain 框架
- **工作流集成**：Text Chat / Multimodal Chat / Structured Output 三种 LLM 节点

**核心机制**：
- **文档向量化**：文档 → 分段 → Embedding → PGVector 存储
- **RAG 检索**：用户问题 → Embedding → 向量检索 → Top-K 召回 → 增强 Prompt → LLM 生成
- **权限控制**：基于角色的知识库访问权限管理

**改造边界**：
- 可剥离：特定 LLM Provider 集成、云端向量数据库
- 难剥离：插件化架构、数据模型驱动核心、工作流引擎
- 核心依赖：Node.js、PostgreSQL（含 PGVector）、Redis（可选）

---

## 调研目标、范围与边界

### 调研目标

1. 判断产品是否具备 Stateful 调度能力
2. 确认 Windows 与 macOS 工作机支持情况
3. 评估 Local 优先适配程度与云端依赖
4. 识别架构范式与私有化改造边界

### 核心问题

- 产品是否持久拥有 Task 对象及其依赖关系？
- 任务状态由谁持有，如何推进？
- Windows 和 macOS 分别如何安装和运行？
- 主体功能运行在本地还是云端？

### 覆盖范围

- 产品定位、目标用户、核心流程
- 技术架构：运行形态、组件、接口、持久化、通信、部署
- 平台支持：Windows、macOS、Linux
- 开源协议与维护状态

### 明确排除

- 源码审计（逐文件分析）
- 竞品比较
- 遥测/监控调研
- 性能 benchmark

---

## 产品调研

### 产品定位与目标用户

**一句话定位**：可扩展性优先、AI 驱动的开源无代码/低代码平台，专为构建业务应用和企业解决方案而设计。

**目标用户**：
- 企业 IT 团队：构建内部业务应用（ERP/CRM/OA）
- 开发者：基于低代码平台快速交付项目
- 外包交付团队：需要高度自定义和扩展能力的团队
- AI 应用开发者：需要 RAG 增强的 AI 员工和知识库能力

### 核心流程

```
用户上传文档 → 文档分段 → Embedding 向量化 → PGVector 存储
    ↓
用户提问 → 问题向量化 → 向量检索 → Top-K 召回
    ↓
增强 Prompt 构建 → LLM 生成 → 返回答案（含溯源）
```

### 功能地图与边界

| 功能域 | 当前能力 | 边界 |
|--------|----------|------|
| 知识库管理 | 文档上传、分段、向量化、检索 | 仅支持文本，不支持图片/音频/视频 |
| RAG 检索 | PGVector 向量检索、Top-K 召回 | 仅内置 PGVector，其他向量数据库需自行集成 |
| LLM 支持 | OpenAI、Gemini、Anthropic、本地 LLM | 需自行配置 API Key |
| 工作流集成 | Text Chat、Multimodal Chat、Structured Output | 节点类型固定，不可自定义 |
| 权限控制 | 基于角色的知识库访问权限 | 无细粒度文档级权限 |

### 维护状态与版本演进

- **开源协议**：Apache-2.0 + 补充条款（社区版），商业版需购买授权
- **当前版本**：2.x（2026 年 2 月发布 2.0，转向 AI 驱动）
- **维护状态**：活跃维护中，有商业公司支持（北京深度进化科技有限公司）
- **版本演进**：2.0 版本开始逐步转向 AI 驱动，AI 知识库为专业版功能

### 生态与反馈

- **插件生态**：丰富的插件体系，支持自定义插件开发
- **社区**：GitHub、文档站点、知乎专栏
- **商业支持**：提供标准版、专业版、企业版三个商业版本

---

## 技术架构调研

### 系统全貌与运行形态

**运行形态**：自托管 Web 应用（Docker / 源码部署）

```
┌─────────────────────────────────────────┐
│           用户服务器                     │
│  ┌─────────────────────────────────┐    │
│  │      NocoBase 应用服务           │    │
│  │  ┌─────────┐  ┌─────────────┐   │    │
│  │  │ Next.js │  │  Node.js    │   │    │
│  │  │  前端    │  │  后端服务    │   │    │
│  │  └────┬────┘  └─────────────┘   │    │
│  │       │ HTTP/REST                │    │
│  │  ┌────▼─────────────────────┐   │    │
│  │  │   插件化微内核            │   │    │
│  │  │   - AI 知识库插件         │   │    │
│  │  │   - AI 员工插件           │   │    │
│  │  │   - 工作流引擎            │   │    │
│  │  └──────────────────────────┘   │    │
│  └─────────────────────────────────┘    │
│              ↓ 本地调用                  │
│  ┌─────────────────────────────────┐    │
│  │   PostgreSQL + PGVector         │    │
│  │   Redis（可选缓存）              │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
              ↓ 外部调用
┌─────────────────────────────────────────┐
│   OpenAI / Gemini / Anthropic           │
│   或本地 LLM 服务                        │
└─────────────────────────────────────────┘
```

### 主要组件与核心链路

| 组件 | 职责 | 技术栈 |
|------|------|--------|
| NocoBase 核心 | 数据模型驱动、插件化微内核 | Node.js + TypeScript |
| AI 知识库插件 | 文档向量化、RAG 检索 | @nocobase/plugin-ai-knowledge-base |
| AI 员工插件 | 智能问答、任务执行 | @nocobase/plugin-ai-employees |
| 工作流引擎 | 流程编排、LLM 节点执行 | 内置工作流引擎 |
| PGVector | 向量数据存储与检索 | PostgreSQL 扩展 |

**核心链路**（RAG 检索增强生成）：
```
用户问题 → Embedding 模型向量化 → PGVector 向量检索
    → Top-K 相关文本块召回 → 增强 Prompt 构建
    → LLM 生成答案 → 返回结果（含溯源信息）
```

### 主要依赖

| 依赖 | 版本要求 | 用途 | 可替代性 |
|------|----------|------|----------|
| Node.js | ≥18 | 应用运行时 | 不可替代 |
| PostgreSQL | ≥14 | 数据库 + PGVector | 可替换为 MySQL（无向量支持）|
| PGVector | 最新 | 向量检索 | 可替换为 Milvus/Pinecone（需自行集成）|
| Redis | ≥6 | 缓存（可选）| 可关闭 |

### 接口形态

| 接口类型 | 用途 | 备注 |
|----------|------|------|
| REST API | 前端与后端通信 | 标准 RESTful |
| GraphQL | 数据查询（可选）| 需配置 |
| WebSocket | 实时通信 | 工作流执行状态 |
| 插件 API | 插件扩展 | 基于插件规范 |

### 持久化方式

**主数据库**：PostgreSQL（含 PGVector 扩展）
- 业务数据：表结构存储
- 向量数据：PGVector 向量类型存储
- 文档元数据：JSONB 存储

**缓存**：Redis（可选，用于会话缓存、队列等）

**文件存储**：本地文件系统或对象存储（S3 兼容）

### 通信方式

- **前端-后端**：HTTP/REST + WebSocket
- **后端-数据库**：PostgreSQL 协议
- **后端-LLM**：HTTP API（OpenAI/Gemini/Anthropic/本地端点）
- **插件间通信**：事件驱动 + 直接调用

### 部署形态

#### 工作机安装（Windows / macOS）

**Windows 安装**：
```bash
# 方式 1：Docker（推荐）
docker-compose up -d

# 方式 2：WSL + 源码
wsl
npm install -g @nocobase/cli
nocobase init my-app
cd my-app
npm run dev
```

**macOS 安装**：
```bash
# 方式 1：Docker（推荐）
docker-compose up -d

# 方式 2：源码开发
npm install -g @nocobase/cli
nocobase init my-app
cd my-app
npm run dev
```

**依赖、权限与网络要求**：
- Docker Desktop（Windows/macOS）
- Node.js ≥18（源码开发）
- PostgreSQL ≥14 + PGVector（生产环境）
- 网络：LLM API 调用需要联网

**卸载方式**：
```bash
# Docker
docker-compose down -v

# 源码
rm -rf my-app
npm uninstall -g @nocobase/cli
```

#### 主体功能运行位置

**混合运行形态**：
- **应用服务**：本地/自托管服务器（Docker/源码）
- **数据存储**：本地 PostgreSQL + PGVector
- **LLM 推理**：云端 API（OpenAI/Gemini/Anthropic）或本地 LLM 服务

**云端组件**：默认 LLM 配置依赖云端 API，可配置为本地 LLM 服务实现完全离线。

---

## 未决项与证据边界

| 未决项 | 原因 | 建议验证方式 |
|--------|------|--------------|
| AI 知识库具体价格 | 商业版功能，价格未公开 | 联系 NocoBase 销售或查看官网定价页 |
| 向量数据库性能指标 | 官方未提供 benchmark | 实际部署测试 |
| 本地 LLM 支持列表 | 文档提及支持，具体列表未详述 | 查看插件配置文档 |
| 集群模式 AI 知识库支持 | 文档提及集群模式，AI 插件支持情况待验证 | 查看集群部署文档 |

---

## 后续验证建议

1. **运行验证**：在 Docker 环境中实际部署 NocoBase 2.x，验证 AI 知识库插件安装和配置
2. **RAG 效果测试**：上传文档并测试检索准确性和回答质量
3. **本地 LLM 集成**：验证本地 LLM 服务（如 Ollama）的集成效果
4. **商业授权确认**：确认 AI 知识库功能的具体授权方式和价格
