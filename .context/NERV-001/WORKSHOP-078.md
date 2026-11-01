# OpenYak 技术产品调研

> updated_by: Qoder - Qoder
> updated_at: 2026-08-21 15:00:00
> evidence_window: 2026-08-21 / v1.4.0 / main 分支快照

## 交付结论

### 产品定位与核心能力

OpenYak 是一款**本地优先的桌面 AI Agent 工作台**，定位为 Claude Code、Claude for Work 和 OpenAI Codex 的**私人 BYOK（Bring Your Own Key）替代方案**。

核心能力包括：处理本机文件（DOCX、XLSX、PPTX、PDF、CSV）、保留对话/记忆/工作流状态、生成可复用 Artifact（Markdown 简报、表格、图表、清单）、支持本地和云端模型推理。

### Stateful 调度能力判定

**该产品不具备 Stateful 调度能力**，应归类为**任务执行宿主（Task Execution Host）**。

关键判定依据：
- **无中心调度器**：Ultra 模式的父 Agent 可创建 2-4 个子会话，但这是**任务拆分**而非**调度决策**
- **无任务依赖关系**：不支持 DAG、父子任务、前后置依赖等调度语义
- **无任务生命周期管理**：任务状态推进依赖 LLM 推理循环，而非调度状态机
- **单用户单会话**：面向个人桌面使用，无多租户、多任务队列概念

系统架构是**持久化 Agent Runtime**，而非调度器。

### Windows 与 macOS 支持情况

| 平台 | 支持状态 | 安装方式 | 包大小 |
|------|----------|----------|--------|
| Windows | **完整支持** | .exe (NSIS Installer) x64 | ~98 MB |
| macOS (Apple Silicon) | **完整支持** | .dmg (M1/M2/M3/M4) | ~194 MB |
| macOS (Intel) | **完整支持** | .dmg (x64) | ~191 MB |
| Linux | **完整支持** | .deb / .rpm (x64) | ~189 MB |

**系统要求**：
- OS: Windows 10+, macOS 10.15+, Linux (x64)
- RAM: 4 GB 最低，8 GB 推荐（本地 LLM 需 16 GB+）
- Disk: 500 MB 安装空间（+ Ollama 模型存储）
- Network: 云端模型需要联网，本地 Ollama 模型无需联网

**无平台缺陷**：Windows 和 macOS 均为原生支持，无功能阉割。

### Local 优先适配判断

**完全符合 Local 优先标准**。

- **无需账号**：不需要 OpenYak 账号、登录、计费资料或托管后端
- **本地存储**：对话、记忆、工件、工作流状态均存储在本地 SQLite
- **本地推理**：支持 Rapid-MLX（Apple Silicon）、Ollama、自定义 OpenAI-compatible 端点
- **BYOK 云端**：用户自行配置 OpenAI、Anthropic、OpenRouter 等云端服务，数据不经过 OpenYak 服务器
- **离线可用**：使用本地模型时可完全离线运行

### 架构范式与改造边界

**架构范式**：**本地桌面 Agent Workbench**

- **前端**：Tauri v2 + Rust + Next.js 15
- **后端**：FastAPI Agent Runtime（Python）
- **存储**：SQLite（本地文件）
- **推理层**：可插拔（Rapid-MLX / Ollama / 自定义本地端点 / BYOK 云端）

**核心机制**：
- **持久化运行状态**：支持可恢复 SSE 流、取消、受限重试、子运行失败隔离
- **分层权限策略**：allow/ask/deny 权限控制，按应用和网站来源批准
- **Ultra 模式**：父 Agent 创建 2-4 个持久化子会话，汇总结果
- **Remote Access**：通过 Cloudflare Tunnel 实现移动设备访问

**改造边界**：
- 可剥离：Remote Access（Cloudflare Tunnel）、特定云端提供商集成
- 难剥离：Tauri 桌面框架、FastAPI 后端、SQLite 持久化、本地文件工具
- 核心依赖：Python 后端（已打包，无需用户安装）、Node.js（开发环境）

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

**一句话定位**：本地优先的桌面 AI Agent 工作台，在本机文件和模型边界内完成文档分析、任务编排与可复用产出。

**目标用户**：
- 部门经理：将长篇 DOCX 备忘录转为高管简报、风险、负责人、下一步行动
- 财务人员：分析预算与实际差异、异常、驱动因素
- 项目负责人：整合备忘录、预算表、演示文稿和 PDF 形成董事会简报
- 运营人员：连续推进工作，生成 RACI、30 天计划、议程和后续邮件
- 复杂任务用户：使用 Ultra 模式拆分多部分任务

### 核心流程

```
用户安装桌面应用 → 新建对话并附加文件 → 选择推理位置（本地/云端）
    ↓
OpenYak 读取办公文档/表格/PDF/CSV → 调用文件工具（读/写/重命名/整理）
    ↓
生成 Artifact（Markdown 简报、表格、图表、清单）→ 呈现在右侧 Artifact workspace
    ↓
复杂任务 → Ultra 模式 → 父 Agent 创建 2-4 个子会话 → 汇总结果
```

### 功能地图与边界

| 功能域 | 当前能力 | 边界 |
|--------|----------|------|
| 文件处理 | DOCX、XLSX、PPTX、PDF、CSV、本地文件夹 | 不支持视频/音频文件 |
| 模型推理 | Rapid-MLX、Ollama、自定义本地端点、BYOK 云端 | 本地模型需用户自行准备 |
| 任务编排 | Ultra 模式（2-4 个子会话） | 无 DAG、无依赖关系、无优先级调度 |
| 权限控制 | 分层 allow/ask/deny、按应用/网站来源批准 | 无细粒度资源配额 |
| 远程访问 | Cloudflare Tunnel + 令牌认证 | 依赖网络，非离线功能 |

### 维护状态与版本演进

- **开源协议**：Apache-2.0
- **当前版本**：v1.4.0（2026-08-21 证据窗口）
- **维护状态**：活跃维护中，有 CI/CD 和版本化发布流程
- **已知限制**：Linux Computer Use 不在 v1.5 发布门槛

### 生态与反馈

- **工具生态**：20+ 工具，支持文件操作、代码执行、网页浏览等
- **模型生态**：支持 Rapid-MLX、Ollama、OpenAI、Anthropic、OpenRouter 等
- **社区反馈**：Product Hunt 热榜产品，GitHub 3.5k+ star
- **评估评分**：FollowAgents FARS-2.1 评分 63/100（谨慎使用）

---

## 技术架构调研

### 系统全貌与运行形态

**运行形态**：本地桌面应用（Tauri）+ 本地后端服务（FastAPI）

```
┌─────────────────────────────────────────┐
│           用户工作机                     │
│  ┌─────────────────────────────────┐    │
│  │      Tauri v2 桌面应用           │    │
│  │  ┌─────────┐  ┌─────────────┐   │    │
│  │  │ Next.js │  │  Rust 原生   │   │    │
│  │  │  前端    │  │  窗口/托盘   │   │    │
│  │  └────┬────┘  └─────────────┘   │    │
│  │       │ SSE streaming            │    │
│  │  ┌────▼─────────────────────┐   │    │
│  │  │   FastAPI Agent Runtime   │   │    │
│  │  │   (Python, port 8000)     │   │    │
│  │  │   - Agent 执行            │   │    │
│  │  │   - LLM streaming         │   │    │
│  │  │   - 工具执行              │   │    │
│  │  │   - SQLite 存储           │   │    │
│  │  └──────────────────────────┘   │    │
│  └─────────────────────────────────┘    │
│              ↓ 本地调用                  │
│  ┌─────────────────────────────────┐    │
│  │   Rapid-MLX / Ollama / 本地端点  │    │
│  │   或 BYOK 云端 (OpenAI 等)       │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 主要组件与核心链路

| 组件 | 职责 | 技术栈 |
|------|------|--------|
| Tauri 桌面应用 | 用户界面、系统托盘、原生窗口 | Tauri v2 + Rust + Next.js 15 |
| FastAPI 后端 | Agent 执行、LLM streaming、工具执行 | Python + FastAPI |
| SQLite | 对话、记忆、工件、工作流状态持久化 | SQLite |
| 推理层 | 模型推理（本地或云端） | Rapid-MLX / Ollama / OpenAI-compatible |
| Ultra 模式 | 复杂任务拆分与汇总 | 父 Agent + 2-4 个子会话 |

**核心链路**（文档分析）：
```
用户上传 DOCX → FastAPI 解析文件 → 调用 LLM 分析
    → 生成 Markdown 简报 → 存储到 SQLite
    → SSE streaming 到前端 → 呈现在 Artifact workspace
```

### 主要依赖

| 依赖 | 用途 | 备注 |
|------|------|------|
| Python | FastAPI 后端运行时 | 已打包，无需用户安装 |
| Tauri | 桌面应用框架 | 跨平台（Windows/macOS/Linux）|
| SQLite | 本地数据存储 | 内嵌，无需配置 |
| Rapid-MLX / Ollama | 本地模型推理 | 可选，用户自行安装 |

### 接口形态

| 接口类型 | 用途 | 备注 |
|----------|------|------|
| HTTP | 前端与后端通信 | localhost:8000 |
| SSE | LLM streaming | 可恢复流 |
| 文件系统 | 本地文件读写 | 受权限策略控制 |
| Cloudflare Tunnel | 远程访问 | 可选功能 |

### 持久化方式

**本地 SQLite 数据库存储**：
- 对话历史
- 记忆/上下文
- 工件（Artifact）
- 工作流状态
- Ultra 子会话状态

**无外部数据库**：所有数据存储在本地，无需外部数据库服务。

### 通信方式

- **前端-后端**：HTTP + SSE streaming
- **后端-模型**：HTTP（本地端点或云端 API）
- **进程间**：Tauri 原生 IPC
- **远程访问**：Cloudflare Tunnel（WebSocket）

### 部署形态

#### 工作机安装（Windows / macOS）

**Windows 安装**：
```bash
# 下载 OpenYak_1.4.0_x64-setup.exe
# 运行 NSIS 安装程序
# 安装后自动启动
```

**macOS 安装**：
```bash
# Apple Silicon: 下载 OpenYak_1.4.0_aarch64.dmg
# Intel: 下载 OpenYak_1.4.0_x64.dmg
# 拖拽到 Applications 文件夹
```

**依赖、权限与网络要求**：
- 无需 Python 安装（后端已打包）
- 本地模型需自行安装 Ollama 或 Rapid-MLX
- 云端模型需配置 API key
- 网络：云端模型需要联网，本地模型无需联网
- 权限：文件读写权限受分层策略控制

**卸载方式**：
- Windows：控制面板卸载
- macOS：删除 Applications 中的 OpenYak.app
- 数据清理：删除本地 SQLite 数据库和配置文件

#### 主体功能运行位置

**完全本地运行**，符合 Local 优先标准：
- 桌面应用：本地 Tauri 应用
- 后端服务：本地 FastAPI（port 8000）
- 数据存储：本地 SQLite
- 模型推理：本地（Rapid-MLX/Ollama）或用户配置的云端

**云端组件**：仅 Remote Access 功能使用 Cloudflare Tunnel，非核心功能。

---

## 未决项与证据边界

| 未决项 | 原因 | 建议验证方式 |
|--------|------|--------------|
| 最新版本是否为 v1.4.0 | 证据窗口为 2026-08-21 | 访问 GitHub Releases 确认 |
| Linux Computer Use 具体限制 | 官方未详细说明 | 查看 v1.5 Roadmap 或 Issue |
| 依赖安全审计结果 | FollowAgents 评估指出证据不足 | 检查 CI 中的安全步骤 |
| 回滚机制具体实现 | 仅提及持久化状态，未说明恢复方式 | 查看 AGENT_RUNTIME.md 文档 |

---

## 后续验证建议

1. **运行验证**：在 Windows 和 macOS 上实际安装 v1.4.0，验证安装流程和核心功能
2. **离线测试**：验证使用 Ollama 本地模型时是否完全离线可用
3. **Ultra 模式测试**：验证复杂任务拆分和子会话汇总功能
4. **权限策略测试**：验证分层 allow/ask/deny 权限控制的实际效果
