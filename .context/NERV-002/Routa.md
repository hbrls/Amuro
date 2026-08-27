# Routa 产品调研补充

> updated_by: Qoder - Qoder
> updated_at: 2026-08-22 15:30:00
> evidence_window: 2026-08-21 / main 分支快照

本文档补充 GLNT-013/Index.md 中未覆盖的 Routa 产品调研内容，主要包括产品定位、Stateful 调度能力判定、详细产品调研和技术架构细节。

## 产品定位与核心能力

Routa 是一个**以工作区为核心、面向软件交付的多智能体协同平台**。它把目标、任务、会话、追踪、证据和评审状态放回看板，而不是让这些信息淹没在单一聊天线程里。

核心能力包括：

- **结构化任务管理**：目标、范围、验收标准、验证方式
- **多角色 Agent 协同**：ROUTA / CRAFTER / GATE / DEVELOPER 角色分工
- **看板驱动的工作流**：Backlog → Todo → Dev → Review → Done / Blocked
- **事件驱动协作**：EventBus 支持 one-shot、priority、after_all 订阅语义
- **状态持久化与容错恢复**：支持 InMemory / Postgres / SQLite 多种存储后端

## Stateful 调度能力判定

**该产品具备完整的 Stateful 调度能力**，应归类为**Stateful 调度器（Stateful Scheduler）**。

关键判定依据：

- **持久拥有工作对象**：Task 是一等数据对象，包含 title/objective/scope/acceptanceCriteria/verificationCommands/dependencies/parallelGroup/status/assignedTo 等结构化字段
- **任务依赖关系**：支持 dependencies 字段定义任务依赖，支持 parallelGroup 定义并行组
- **任务生命周期管理**：看板泳道（Backlog/Todo/Dev/Review/Done/Blocked）显式管理任务状态推进
- **调度决策**：支持列自动化（column automation）、requiredArtifacts、requiredTaskFields、contractRules、deliveryRules、autoAdvanceOnSuccess
- **状态持久化**：支持 InMemory/Postgres/SQLite 多种存储后端，可从断点恢复执行

## 产品调研

### 产品定位与目标用户

**一句话定位**：以工作区为核心、面向软件交付的多智能体协同平台。

**目标用户**：

- 软件研发团队：需要管理多 Agent 协作完成软件交付
- AI Coding 用户：需要结构化任务管理和可验证交付
- 企业用户：需要审计追踪、权限控制和治理能力的组织

### 核心流程

```text
用户描述目标 → Workspace + 看板
    ↓
Backlog → Todo → Dev → Review → Done
    ↓
Backlog Refiner → Todo Orchestrator → Dev Crafter → Review Guard → Done Reporter
    ↓
Blocked Resolver（处理阻塞）
```

### 功能地图与边界

| 功能域 | 当前能力 | 边界 |
|--------|----------|------|
| 任务管理 | 结构化 Task（目标/范围/验收标准/验证方式）| 无甘特图等高级项目管理 |
| 多 Agent 协同 | ROUTA/CRAFTER/GATE/DEVELOPER 角色分工 | 角色边界固定，不可自定义 |
| 看板工作流 | Backlog/Todo/Dev/Review/Done/Blocked 泳道 | 泳道数量固定，不可增减 |
| 状态持久化 | SQLite/Postgres/InMemory | 无分布式存储支持 |
| 协议支持 | ACP/MCP/A2A/AG-UI/A2UI/REST/SSE | 需外部 Agent 支持对应协议 |

### 维护状态与版本演进

- **开源协议**：MIT
- **维护状态**：活跃维护中，2026 年 2 月发布桌面版
- **版本演进**：从 AutoDev 演进而来，强调开放生态和协议融合

### 生态与反馈

- **协议生态**：支持 ACP、MCP、A2A 等开放协议，可接入 Claude Code、OpenCode、Codex、Qwen Code 等外部 Agent
- **社区**：Slack 社区、GitHub Issues
- **演示**：Bilibili、YouTube 演示视频

## 技术架构调研

### 主要组件与核心链路

| 组件 | 职责 | 技术栈 |
|------|------|--------|
| RoutaSystem | 协调平面中心对象 | TypeScript/Rust |
| Stores | 状态持久化（AgentStore/TaskStore/ConversationStore/WorkspaceStore）| SQLite/Postgres |
| EventBus | 事件驱动协作 | 内存事件总线 |
| Tools | 协作动作封装（MCP 工具）| MCP Server |
| Kanban | 看板工作流管理 | Next.js + Rust |
| Harness | 交付 Gate 控制 | Entrix Fitness |

**核心链路**（任务交付流程）：

```text
用户输入目标 → ROUTA Coordinator 拆解任务
    → 创建 Task（含 acceptanceCriteria/verificationCommands）
    → 委派给 CRAFTER Implementor 执行
    → CRAFTER 提交代码 + Dev Evidence
    → GATE Verifier 独立验证 acceptance criteria
    → 通过 → Done / 打回 → Dev / 阻塞 → Blocked
```

### 主要依赖

| 依赖 | 版本要求 | 用途 | 可替代性 |
|------|----------|------|----------|
| Node.js | ≥20 | Web 前端、CLI | 不可替代 |
| Rust | 最新稳定版 | 桌面端、后端服务 | 不可替代 |
| SQLite | 3.x | 本地存储 | 可替换为 Postgres |
| Git | ≥2.25 | 仓库管理 | 不可替代 |

### 接口形态

| 接口类型 | 用途 | 备注 |
|----------|------|------|
| REST | Workspace/Session/Task/Trace APIs | 双后端一致 |
| SSE | 实时流式通信 | Agent 会话流 |
| MCP | 工具暴露 | create_task、delegate_task_to_agent 等 |
| ACP | Agent 进程管理 | 外部 Agent 接入 |
| A2A | 联邦协作 | 跨平台 Agent 协作 |

### 持久化方式

**多存储后端支持**：

- **SQLite**：本地桌面模式默认，零配置
- **Postgres**：自托管 Web 模式，支持多用户
- **InMemory**：测试/开发模式

**持久化对象**：

- Workspace、Session、Task、Trace、Codebase、Worktree、Review

### 通信方式

- **前端-后端**：HTTP + SSE
- **后端-Agent**：ACP（进程管理）+ MCP（工具调用）
- **事件驱动**：EventBus 支持 one-shot、priority、after_all 订阅语义
- **联邦协作**：A2A Bridge 跨平台 Agent 协作

### 部署形态

#### 工作机安装（Windows / macOS）

**Windows 安装**：

```bash
# 方式 1：桌面应用（推荐）
# 从 GitHub Releases 下载 .exe 安装包

# 方式 2：CLI
npm install -g routa-cli
routa -p "解释这个仓库的架构"
```

**macOS 安装**：

```bash
# 方式 1：桌面应用（推荐）
# 从 GitHub Releases 下载 .dmg（x64 版本，因 Apple 证书原因）

# 方式 2：CLI
npm install -g routa-cli
```

**依赖、权限与网络要求**：

- 需要 Git 仓库读写权限
- 需要 LLM Provider API Key（OpenAI/Anthropic 等）
- 桌面端需要本地端口 3210 可用
- 网络：仅模型推理时需要联网

**卸载方式**：

- Windows：控制面板卸载
- macOS：删除 Applications 中的 Routa.app
- CLI：npm uninstall -g routa-cli

#### 主体功能运行位置

**完全本地运行**，符合 Local 优先标准：

- 桌面应用：本地 Tauri 应用
- 后端服务：本地 Rust Server（127.0.0.1:3210）
- 数据存储：本地 SQLite 或自托管 Postgres
- 代码仓库：本地 Git 仓库 / Worktree

**云端组件**：无云端强依赖，仅模型推理需调用外部 LLM API。

## 未决项与证据边界

| 未决项 | 原因 | 建议验证方式 |
|--------|------|--------------|
| 最新 Release 版本号 | 证据窗口为 2026-08-21 | 访问 GitHub Releases 确认 |
| Windows arm64 支持状态 | 官方提及支持，未验证 | 实际下载安装验证 |
| Postgres 自托管配置细节 | 文档提及，未深入 | 查看 docker-compose.yml |
| A2A 联邦协作实际案例 | 协议支持，实际使用场景待验证 | 查看 Issues 和 Discussions |

## 后续验证建议

1. **运行验证**：在 Windows 和 macOS 上实际安装桌面版，验证安装流程和核心功能
2. **协议测试**：验证 ACP/MCP 协议接入外部 Agent（Claude Code、OpenCode）的实际效果
3. **看板流程测试**：验证完整任务交付流程（Backlog → Done）和 Review Gate 机制
4. **断点恢复测试**：验证状态持久化和容错恢复能力

## 证据来源

- [WORKSHOP-079: Routa 技术产品调研](../GLNT-10/WORKSHOP-079.md)（已归档）
- [GLNT-013: Routa 二开调研与 Backlog Manager 适配分析](./Index.md)
