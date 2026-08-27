# Agent Orchestrator 技术产品调研

> updated_by: Qoder - Qoder
> updated_at: 2026-08-21 14:30:00
> evidence_window: 2026-08-21 / main 分支快照

## 交付结论

### 产品定位与核心能力

Agent Orchestrator 是一款开源的 AI 编码智能体编排工具，定位为**并行 AI 编码智能体的编排层**。它不替代现有 AI 编码工具（如 Claude Code、Codex），而是作为"总指挥"统一管理、调度、协调多个智能体并行工作。

核心能力包括：为每个智能体创建独立的 Git worktree 隔离环境、自动分配任务、自动处理 CI 失败修复和评审意见响应、实时状态追踪与通知。

### Stateful 调度能力判定

**该产品不具备完整的 Stateful 调度能力**，应归类为**任务执行宿主（Task Execution Host）**。

关键判定依据：
- 系统**不持久拥有工作对象**：Task 来源于外部 Issue 追踪系统（GitHub/Linear），AO 仅作为任务承接方
- **无中心调度决策**：不支持任务依赖关系（DAG）、优先级调度、资源约束调度
- **无任务生命周期管理**：任务状态推进依赖外部 PR 生命周期（CI/Review/Merge），而非内部调度状态机
- **单节点运行**：所有会话运行在单机 tmux 中，无分布式调度能力

系统架构更接近 **K8s Operator 模式**（轮询 + 反应式修复），而非真正的调度器。

### Windows 与 macOS 支持情况

| 平台 | 支持状态 | 安装方式 | 备注 |
|------|----------|----------|------|
| macOS | **完整支持** | 桌面应用（Apple Silicon/Intel）或 npm CLI | 官方主推平台，支持防止休眠 |
| Windows | **通过 WSL 支持** | WSL 内运行 CLI | 无原生 Windows 桌面应用 |

**选型缺陷**：Windows 平台缺失原生桌面应用，需通过 WSL 运行，增加部署复杂度。

### Local 优先适配判断

**符合 Local 优先标准**。

- 主体功能完全运行在本地工作机
- 无云端强依赖：核心编排、调度、执行均在本地完成
- 外部依赖仅为 GitHub/Linear 等代码托管平台（用于 Issue 追踪和 PR 管理），非 Composio 云端服务
- 支持完全离线工作（除外部 Git 平台交互外）

### 架构范式与改造边界

**架构范式**：单机版 K8s Operator for AI Coding Agents

- **轮询机制**：30 秒定时轮询，非事件驱动
- **反应系统**：基于状态转换的自动消息路由（CI 失败→发送修复指令）
- **插件架构**：7 个可插拔槽位 + 1 个核心 LifecycleManager

**改造边界**：
- 可剥离：通知器（Slack/Desktop）、终端类型（iTerm2/Web）
- 难剥离：Git worktree 隔离、tmux 运行时、Claude Code JSONL 活动检测
- 核心依赖：Node.js 20+、Git 2.25+、tmux、gh CLI

---

## 调研目标、范围与边界

### 调研目标

1. 判断产品是否具备 Stateful 调度能力（持久拥有工作对象、对象关系和任务生命周期）
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
- 平台支持：Windows、macOS
- 开源协议与维护状态

### 明确排除

- 源码审计（逐文件分析）
- 竞品比较
- 遥测/监控调研
- 性能 benchmark

---

## 产品调研

### 产品定位与目标用户

**一句话定位**：并行 AI 编码智能体的编排层，让多个 AI 智能体协同开发而不互相干扰。

**目标用户**：
- 个人开发者：同时处理多个任务，解放双手
- 小型研发团队：多项目并行，降低协调成本
- 大型企业团队：标准化 AI 开发流程，保障代码质量
- 开源项目维护者：高效处理大量 Issue 与 PR

### 核心流程

```
开发者启动 → 编排器扫描任务 → 创建隔离环境 → 启动智能体
    ↓
智能体编码 → 提交 PR → CI 测试 → 评审反馈
    ↓
自动修复 ← 反馈路由 ← 状态轮询
    ↓
开发者评审 → 合并 PR → 清理环境
```

### 功能地图与边界

| 功能域 | 当前能力 | 边界 |
|--------|----------|------|
| 环境隔离 | Git worktree + 独立分支 | 仅支持 Git，不支持其他 VCS |
| 任务分配 | 从 Issue 自动创建会话 | 无手动任务优先级调整 |
| 自动修复 | CI 失败、评审意见自动路由 | 仅支持预定义反应，无学习能力 |
| 状态追踪 | 16 种会话状态 + Web Dashboard | 状态持久化在平文件，非数据库 |
| 通知 | Desktop/Slack/Webhook | 无邮件、短信通知 |

### 维护状态与版本演进

- **开源协议**：Apache License 2.0（部分来源显示 MIT，以仓库 LICENSE 文件为准）
- **维护状态**：活跃维护中，2026 年 2 月仍有博客更新
- **最新动态**：持续迭代插件生态，支持更多 AI 智能体和平台

### 生态与反馈

- **插件生态**：7 大插件槽位，支持 Claude Code、Codex、Aider、OpenCode 等主流 AI 编码工具
- **社区反馈**：Reddit 有用户报告成功管理 30 个并行智能体
- **已知限制**：无自改进循环（retrospect/learning 功能未实现）

---

## 技术架构调研

### 系统全貌与运行形态

**运行形态**：单机 CLI + Web Dashboard

```
┌─────────────────────────────────────────┐
│           开发者工作机                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │  CLI    │  │Dashboard│  │  tmux   │ │
│  │ (ao)    │  │(:3000)  │  │ Sessions│ │
│  └────┬────┘  └────┬────┘  └────┬────┘ │
│       └─────────────┴─────────────┘      │
│              LifecycleManager            │
│         （轮询 + 状态机 + 反应引擎）        │
└─────────────────────────────────────────┘
              ↓ 外部调用
┌─────────────────────────────────────────┐
│  GitHub / Linear  │  Claude Code / Codex │
│  （Issue/PR）     │  （AI 编码智能体）    │
└─────────────────────────────────────────┘
```

### 主要组件与核心链路

| 组件 | 职责 | 运行位置 |
|------|------|----------|
| CLI (ao) | 启动、停止、管理会话 | 本地 |
| Web Dashboard | 可视化监控 | 本地 :3000 |
| LifecycleManager | 状态轮询、反应执行 | 本地后台 |
| PluginRegistry | 插件注册与查找 | 本地 |
| Runtime (tmux) | 会话执行环境 | 本地 |
| Workspace (worktree) | 代码隔离 | 本地文件系统 |

**核心链路**（CI 失败自动修复）：
```
pollAll() → determineStatus() → scm.getCISummary() = "failing"
    → 状态转换: pr_open → ci_failed
    → 事件: "ci.failing" → 反应键: "ci-failed"
    → executeReaction() → send-to-agent
    → 向 tmux 发送修复指令 → Agent 修复 → 重新提交
```

### 主要依赖

| 依赖 | 版本要求 | 用途 | 可替代性 |
|------|----------|------|----------|
| Node.js | ≥20 | 运行时 | 不可替代 |
| Git | ≥2.25 | 版本控制 | 不可替代 |
| tmux | 最新 | 会话管理 | 可替换为 process/Docker |
| gh CLI | 最新 | GitHub API | 仅 GitHub 插件需要 |

### 接口形态

| 接口类型 | 用途 | 备注 |
|----------|------|------|
| CLI | 用户交互入口 | `ao start/stop/list` |
| HTTP | Web Dashboard | localhost:3000 |
| WebSocket | Terminal 连接 | localhost:3001/3003 |
| 文件 | 配置与状态 | agent-orchestrator.yaml, ~/.agent-orchestrator/ |

### 持久化方式

**会话元数据**：平文件存储（key=value 格式）
```
~/.agent-orchestrator/{hash}-{projectId}/sessions/{sessionName}
```

**配置**：YAML 文件（Zod schema 验证）
```
agent-orchestrator.yaml
```

**无数据库**：所有状态存储在文件系统，重启后可恢复。

### 通信方式

- **轮询模式**：30 秒定时轮询（非事件驱动）
- **进程间通信**：tmux send-keys 向 Agent 发送消息
- **外部 API**：gh CLI 调用 GitHub GraphQL/REST API

### 部署形态

#### 工作机安装（Windows / macOS）

**macOS 安装**：
```bash
# 方式 1：桌面应用（推荐）
# 下载 AO desktop app (Apple Silicon / Intel)

# 方式 2：npm CLI
npm install -g @aoagents/ao

# 前置依赖
brew install tmux
brew install gh
```

**Windows 安装**：
```bash
# 通过 WSL 运行
wsl
npm install -g @aoagents/ao
sudo apt install tmux
```

**依赖、权限与网络要求**：
- 需要 Git 仓库读写权限
- 需要 GitHub/Linear 账号授权（gh CLI）
- 需要本地端口 3000/3001/3003 可用
- 网络要求：仅访问外部 Git 平台时需要联网

**卸载方式**：
```bash
npm uninstall -g @aoagents/ao
rm -rf ~/.agent-orchestrator
rm -rf ~/.worktrees
```

#### 主体功能运行位置

**完全本地运行**，符合 Local 优先标准：
- 编排器核心：本地进程
- 会话执行：本地 tmux
- 代码存储：本地 Git worktree
- 状态持久化：本地文件系统

**无云端组件**：不依赖 Composio 云端服务，仅调用外部 Git 平台 API。

---

## 未决项与证据边界

| 未决项 | 原因 | 建议验证方式 |
|--------|------|--------------|
| 最新 Release 版本号 | 网络限制无法访问 GitHub Releases | 直接访问仓库 Releases 页面 |
| Windows 原生桌面应用计划 | 官方未明确说明 | 查看 Roadmap 或 Issue |
| 分布式调度支持 | 当前版本为单机设计 | 确认是否有多节点协调计划 |
| 自改进循环（ao-52） | 源码中未找到实现 | 确认是否为规划中功能 |

---

## 后续验证建议

1. **运行验证**：在 macOS 和 Windows (WSL) 上实际安装并运行，验证安装流程和核心功能
2. **源码核验**：确认 LICENSE 文件确切协议类型（Apache 2.0 或 MIT）
3. **Issue 追踪**：查看 GitHub Issues 中关于 Windows 原生支持和分布式调度的讨论
4. **性能测试**：验证大规模并行会话（30+）时的系统资源占用和稳定性
