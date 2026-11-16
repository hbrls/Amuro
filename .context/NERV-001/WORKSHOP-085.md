# Raft (slock.ai) 技术产品调研

> updated_by: Qoder - AI Assistant
> updated_at: 2026-09-03
> evidence_window: 2026-09-03，基于 raft.build 官网、官方文档、GitHub 公开仓库及公开报道

## 交付结论

### Raft 是云端 SaaS 多 Agent 协作平台，非 Stateful 调度器

Raft（前身 Slock）是 Botiverse 公司开发的云端 SaaS 多 Agent 协作平台，核心定位是"人类和 AI Agent 一起工作的地方"。产品采用频道（Channel）+ 任务（Task）+ 线程（Thread）的协作模型，让多个 Agent 以持久身份在共享工作空间中协作。

**关键判断**：Raft 不是 Stateful 调度器，而是任务执行宿主。产品存在 Task 对象和 Agent 认领机制，但任务生命周期管理（状态推进、依赖解析、失败恢复）由云端 Server 和本地 daemon 共同承担，而非由独立的调度中心持久拥有。

### 主体功能运行在云端，本地 daemon 仅作为执行代理

Raft 采用云端-本地混合架构：
- **云端 Server**：承载频道、消息、任务、成员关系等核心协作数据，是系统的事实中心
- **本地 Computer/daemon**：作为 Agent 的执行环境，负责启动/停止 Agent 进程、投递消息、维护本地工作空间

**选型缺陷**：主体功能依赖云端，本地 daemon 只是执行代理。断网后 Agent 无法接收新任务，本地工作空间虽保留但无法与云端同步。

### Windows 支持不完整，macOS 和 Linux 为主要支持平台

- **macOS**：完整支持，通过 `install.sh` 或 npm 安装 `raft-computer` CLI
- **Linux**：完整支持，同 macOS
- **Windows**：处于过渡期，需通过 WSL 运行，无原生 Windows 应用

**选型缺陷**：Windows 工作机支持不完整，不符合双平台要求。

### 开源状态：部分开源，主仓库计划公开

- **已开源**：文档、外部 Agent 插件、应用脚手架、部分工具库（Apache-2.0/MIT）
- **计划开源**：Raft 主仓库（创始人已宣布，但截至调研日尚未完全公开）
- **闭源**：核心 Server 端代码、云端协作逻辑

### Local 优先适配：不符合

Raft 是云端优先产品，不符合 Local 优先选型标准：
- 核心协作数据（频道、消息、任务）存储在云端
- Agent 身份、记忆虽保留在本地工作空间，但需云端 Server 协调
- 无自托管选项（与竞品 Multica 对比，后者支持 Docker Compose/K8s 自托管）

---

## 调研目标、范围与边界

### 调研目标

围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源、架构范式，以及本地、云端或混合运行形态，形成可追溯的独立产品调研与后续选型、改造依据。

### 核心问题

1. Raft 是否具备 Stateful 调度能力？
2. 工作对象模型（Workspace/Project/Issue/Plan/Task）是否真实持久化？
3. 任务关系与生命周期由谁持有和推进？
4. Windows 与 macOS 支持情况如何？
5. 主体功能运行在本地、云端还是混合环境？
6. 开源与服务边界如何？

### 覆盖范围

- 产品定位与目标用户
- 核心流程与功能边界
- 维护状态与版本演进
- 技术架构全貌（运行形态、组件、链路）
- 部署形态（Windows/macOS/云端）
- 开源与服务边界

### 明确排除

- 源码审计（仅使用公开文档和定点验证）
- 竞品比较（仅记录事实，不做横向排名）
- 遥测、监控、运营数据采集
- 实现代码或工作流改造

---

## 产品调研

### 产品定位与目标用户

**一句话定位**：Raft 是多 Agent 协作平台，让人类和 AI Agent 像队友一样在频道里共同工作。

**目标用户**：
- 已在用 Claude Code、Codex 等单 Agent 工具，希望升级到多 Agent 协作的开发者
- 一人公司或小团队，希望用 Agent 分担开发、测试、文档、运维等角色
- 需要 Agent 持久记忆和多轮协作的复杂项目团队

**使用场景**：
- 多 Agent 并行开发不同模块
- Agent 间任务交接与协作 review
- 长期项目中的上下文沉淀与知识复用

### 核心流程

**基本工作循环**（Bill → Contract → Gate → Launch）：

1. **Bill（提案）**：人类或 Agent 在频道中提出想法/需求
2. **Contract（契约）**：需求拆分为任务，分配给具体 Agent，明确验收标准
3. **Gate（关卡）**：Agent 完成后进入 review，人类或其他 Agent 审批
4. **Launch（上线）**：所有关卡通过，功能上线

**任务生命周期**：
- 状态流转：`todo → in_progress → in_review → done`（可重新打开）
- Agent 自动认领未分配任务
- 进度更新在任务线程中进行
- 支持任务重新打开和反馈迭代

### 功能地图与边界

**核心功能**：
- **频道（Channel）**：公开/私密协作空间，支持多 Agent 同时在线
- **私信（DM）**：1对1 定向沟通
- **线程（Thread）**：消息下的子对话，避免污染主频道
- **任务（Task）**：可追踪工作项，支持状态流转和认领
- **Agent 持久身份**：名称、描述、记忆（MEMORY.md）、工作空间
- **提醒（Reminder）**：Agent 可设置定时唤醒
- **每日汇报**：Agent 自动向 owner 汇报进度

**边界**：
- 无项目管理（Project）对象，以频道组织工作
- 无 Issue 对象，任务（Task）是最小工作单元
- 无 Plan 对象，任务分解在对话中完成
- 无 DAG 依赖关系，任务间通过线程上下文关联

### 维护状态与版本演进

**维护状态**：活跃开发中

**关键演进**：
- **2025 年**：Slock 创立，创始人 Richard Qian（前 Moonshot AI Kimi CLI 作者）
- **2026 年**：品牌升级为 Raft，从 slock.ai 迁移至 raft.build
- **2026 年 8-9 月**：宣布开源计划，主仓库将逐步公开（暂不接受外部 PR）

**团队背景**：
- 创始人：Richard Qian（钱宇超），前 Kimi CLI 作者
- 联合创始人：庄天翼（Tenny），清华计算机系，前阿里 PolarDB-X 团队
- 公司：Botiverse，旧金山，5-10 人团队

### 生态与反馈

**生态入口**：
- 官方文档：docs.raft.build
- GitHub：github.com/botiverse（28 个公开仓库）
- 社区：官方社区服务器、X (@raft_hq)、LinkedIn

**公开反馈主题**：
- 正面：多 Agent 协作的频道模型、持久记忆、任务认领机制
- 负面：云端依赖、Windows 支持不完整、token 成本
- 关注：开源进展、自托管可能性

---

## 技术架构调研

### 系统全貌与运行形态

**系统形态**：云端 SaaS + 本地 daemon 混合架构

```
┌─────────────────────────────────────────────────────────┐
│                    云端 Server                          │
│  (raft.build / api.slock.ai)                           │
│  - 频道、消息、任务、成员关系存储                        │
│  - Agent 身份与权限管理                                  │
│  - WebSocket 连接管理                                    │
└─────────────────────────────────────────────────────────┘
                           │
              WebSocket    │    HTTP
              (daemon协议)  │    (REST API)
                           │
┌─────────────────────────────────────────────────────────┐
│                  本地 Computer                          │
│  (macOS / Linux / Windows WSL)                         │
│  - raft-computer CLI / daemon                          │
│  - Agent 进程管理（启动/停止/唤醒）                      │
│  - 本地工作空间（文件、记忆）                            │
│  - Runtime 执行（Claude Code / Codex / 等）             │
└─────────────────────────────────────────────────────────┘
```

### 主要组件与核心链路

**核心组件**：

| 组件 | 位置 | 职责 |
|------|------|------|
| Server | 云端 | 协作数据中心，管理频道、任务、成员 |
| Computer/daemon | 本地 | Agent 执行环境，进程管理，消息投递 |
| Agent | 本地 | 具体工作执行者，由 Runtime 驱动 |
| Runtime | 本地 | AI 引擎（Claude Code、Codex CLI 等） |
| Web UI | 云端 | 用户界面，频道/任务/成员管理 |

**核心链路：任务认领与执行**

1. 人类在频道中发布消息，转换为 Task（todo 状态）
2. Server 通过 WebSocket 向在线 daemon 广播任务
3. Agent 认领任务（状态变为 in_progress）
4. daemon 启动/唤醒 Agent 进程，投递任务上下文
5. Agent 在本地执行，通过 daemon 回传进度
6. 完成后状态变为 in_review，等待人类确认
7. 确认后状态变为 done

### 主要依赖

**运行时依赖**：
- Node.js（npm 安装方式）或独立二进制（SEA installer）
- 本地 Runtime：Claude Code / Codex CLI / Gemini CLI / 等（可选）

**云端依赖**：
- Raft Server（必须，无自托管选项）
- 网络连接（WebSocket 长连接）

### 接口形态

**对外接口**：
- **WebSocket**：daemon 与 Server 之间的主要通信协议
  - 端点：`/daemon/connect?key=<apiKey>`
  - 消息类型：`agent:start`、`agent:deliver`、`agent:stop`、`reminder.*`、`machine:*`
- **REST API**：Server 管理操作（创建 Server、Agent、频道等）
- **CLI**：`raft-computer` 本地管理命令

**认证方式**：
- API Key（daemon 连接）
- 设备授权登录（浏览器 OAuth 流程）

### 持久化方式

**云端持久化**：
- 频道消息、任务状态、成员关系：存储在 Raft Server（具体数据库未公开）
- Agent 身份与权限：Server 端管理

**本地持久化**：
- Agent 工作空间：`$SLOCK_HOME/computer/servers/<server>/agents/<agent>/`
- 记忆文件：`MEMORY.md`
- 连接状态：`$SLOCK_HOME/computer/`

### 通信方式

**主要模式**：WebSocket 长连接 + 事件驱动

- daemon 与 Server 保持 WebSocket 长连接
- Server 主动推送消息到 daemon（`agent:deliver`）
- daemon 回传状态和结果（`agent:status`、`agent:deliver:ack`）
- 断线重连与消息去重（24 小时 idempotency）

### 部署形态

#### 工作机安装（Windows / macOS）

**macOS 安装**：
```bash
# 方式一：SEA installer（推荐）
curl -fsSL https://cdn.raft.build/computer/install.sh | sh && raft-computer setup /<server-slug>

# 方式二：npm
npm i -g @botiverse/raft-computer && raft-computer setup /<server-slug>
```

**Linux 安装**：同 macOS

**Windows 安装**：
- 当前处于过渡期，需通过 WSL 运行
- 无原生 Windows 应用
- 官方文档显示"Windows 版 Computer 仍在推进中"

**依赖、权限与网络要求**：
- 需要网络连接（WebSocket 到 raft.build）
- 需要本地文件系统读写权限（Agent 工作空间）
- 需要执行权限（启动 Runtime 进程）

**卸载方式**：
```bash
# 停止服务
raft-computer stop

# 删除 CLI（npm 安装）
npm uninstall -g @botiverse/raft-computer

# 删除本地数据（可选，谨慎）
# $SLOCK_HOME/computer/ 目录包含连接状态和 Agent 工作空间
```

#### 主体功能运行位置

**主体功能运行在云端**：
- 频道、消息、任务、成员关系：云端 Server
- Agent 身份与权限：云端 Server
- 协作上下文：云端 Server

**本地承担**：
- Agent 进程执行
- 本地文件读写
- Runtime 运行

**Local 优先适配判断**：**不符合**

Raft 是云端优先产品，核心协作数据存储在云端，本地仅作为执行环境。断网后 Agent 无法接收新任务，本地工作空间虽保留但无法与云端同步。

#### 云端形态

**职责边界**：
- 协作数据中心：频道、消息、任务、成员
- Agent 身份与权限管理
- 消息路由与投递
- 任务状态管理

**核心组件**：
- Web UI（app.raft.build）
- API Server（api.slock.ai）
- WebSocket 连接管理
- 数据存储（具体技术未公开）

**部署或托管形态**：
- 官方托管 SaaS（raft.build）
- 无自托管选项

**数据、权限、网络边界**：
- 数据：协作数据存储在云端，Agent 工作空间存储在本地
- 权限：Server 端管理成员角色（owner/admin/member）
- 网络：需要互联网连接，WebSocket 长连接

**故障影响**：
- 云端故障：Agent 无法接收新任务，本地工作空间保留但无法同步
- 本地故障：Agent 停止工作，云端任务状态保留

---

## 未决项与证据边界

### 未决项

1. **Raft 主仓库开源时间**：创始人已宣布开源计划，但具体时间表未公开
2. **云端数据库技术**：Server 端具体使用的数据库和存储技术未公开
3. **任务依赖关系**：是否支持 DAG 或任务间依赖，文档未明确说明
4. **Windows 原生支持时间表**：官方仅表示"仍在推进中"，无具体时间表
5. **自托管可能性**：官方未提供自托管选项，未来是否开放未知

### 证据边界

- 本调研基于 2026-09-03 的公开资料，产品可能已更新
- 部分技术细节（如 Server 端架构）来自第三方分析和逆向，非官方确认
- 开源状态基于创始人公开声明，实际进展需持续关注

---

## 后续验证建议

1. **持续关注开源进展**：Raft 主仓库开源后，可进一步验证 Server 端架构和调度逻辑
2. **实际部署测试**：在 macOS 和 Windows（WSL）环境实际部署，验证安装流程和功能完整性
3. **断网测试**：验证断网后 Agent 行为和本地工作空间可用性
4. **任务依赖验证**：实际测试复杂任务场景，验证是否支持任务间依赖
5. **性能测试**：多 Agent 并发场景下的性能和稳定性测试
