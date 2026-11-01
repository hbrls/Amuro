# DevStar 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-07 23:00:00
> evidence_window: 2026-08-07, main 分支, v2.0 (DevStar AI 2.0 Agent Teams)

## 调研目标

- 围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源与架构范式，形成可追溯的独立产品调研。
- 判断产品是否持久拥有工作对象、对象关系和任务生命周期，并依据依赖、状态与策略持续推进任务。
- 核验 Windows 与 macOS 工作机支持情况、Local 优先适配程度、云端依赖与最小部署成本。
- 识别调度最小核心职责与非调度增值能力的边界，评估改造范围与风险。

## 交付结论

### DevStar 是 Gitea 商业发行版，具备 CI/CD 和 AI 增强能力，但核心调度能力取决于闭源的 Agent Team 模块

DevStar（DevStar Studio）是孟宁软件（Mengning Software）开发的 Gitea 商业发行版，定位为"一站式 AI 原生研发平台"。产品以 Docker 容器形式部署 Gitea 实例，在 Gitea 原生的 Git 托管、Issue 追踪、项目看板和 CI/CD（Gitea Actions）之上，叠加了 AI 增强功能（AI Issues、AI Actions、AI Coding、AI Code Review、AI Testing）、内置 MCP Server、内置 AI Chatbot、DevContainer 环境和 Agent Team 编排方案。

DevStar 的开源代码仓库（[GitHub](https://github.com/mengning/DevStar)，MIT 许可）展示的是标准 Gitea 服务结构——actions、issue、projects、cron、task 等目录与 Gitea 上游一致。增强功能（包括 Agent Team）标注为商业许可，在开源仓库中未见对应实现代码。官方文档（devstar.cn/docs）需要登录访问，Agent Team 的架构细节、任务模型和调度机制均未公开。

基于 Gitea 上游能力判断：Gitea Actions 是事件触发的 CI/CD 流水线（GitHub Actions 兼容），runner 注册后轮询任务；Gitea Issues 是持久化的数据库记录，拥有标签、里程碑和指派人，但不具备任务依赖、DAG 或调度决策能力；Gitea Projects 是看板式项目管理，无自动化调度。这些能力不构成 Stateful 调度。Agent Team 作为 v2.0 新增的"内置 Agent 编排方案"，是判断 DevStar 是否具备调度能力的关键，但当前证据不足以确认或否认其 Stateful 调度属性。

以上为已确认事实，依据[DevStar 官网](https://devstar.cn/)、[GitHub README](https://github.com/mengning/DevStar)、[GitHub Releases](https://github.com/mengning/DevStar/releases)和[安装脚本](https://devstar.cn/assets/install.sh)。Agent Team 部分为未决项。

### 工作对象模型继承 Gitea，以 Organization、Repository、Issue、Project 和 Actions Workflow 为核心

DevStar 继承 Gitea 的工作对象模型，开源代码中未发现自定义调度对象：

- **Organization**：组织实体，拥有成员、团队和仓库。持久化在数据库中。
- **Repository**：Git 仓库实体，拥有分支、标签、Webhook、Actions 配置。Git 数据存储在文件系统，元数据在数据库。
- **Issue**：持久化数据库记录，拥有标题、内容、标签、里程碑、指派人、时间跟踪和评论。支持关联 PR。这是 DevStar 最接近"工作对象"的结构，但 Issue 不具备任务依赖、DAG、状态机迁移或调度决策——它是工单追踪，不是调度单元。
- **Project（看板）**：看板式项目管理，Issue 可组织到看板列中。持久化在数据库。无自动化调度或依赖解析。
- **Actions Workflow**：YAML 定义的 CI/CD 工作流（`.gitea/workflows/*.yaml`），由 Git 事件（push、PR 等）触发。Workflow 中的 Job 拥有 `needs` 依赖（DAG），但 Job 不是持久化调度对象——它们是事件触发的临时执行单元。
- **Milestone**：里程碑，可关联多个 Issue，有截止日期。无调度决策能力。
- **Task（内部）**：Gitea 内部任务队列（`services/task`），用于异步操作如仓库镜像和迁移。是简单 FIFO 队列，不是通用调度系统。
- **Cron**：Gitea 内置定时任务（`services/cron`），用于系统维护操作。是预定义的系统任务，不是用户自定义调度。

Index.md 定义的 Workspace、Plan、Task 作为全局持久化调度对象在 DevStar 开源代码中均不存在。Project 是看板容器，不是调度系统。Agent Team 可能引入自定义工作对象，但因闭源无法确认。

以上为已确认事实，依据 [Gitea 文档](https://docs.gitea.com)和[DevStar GitHub 仓库 services 目录](https://github.com/mengning/DevStar/tree/main/services)。Agent Team 对象模型为未决项。

### 任务关系与生命周期以 Gitea Actions 为最接近形态，具备事件触发和 Job 依赖但不构成持久化调度

DevStar 继承 Gitea 的任务关系和生命周期管理：

- **Gitea Actions 生命周期**：Workflow 由 Git 事件触发（push、PR、schedule cron）。Job 拥有 `needs` 依赖形成 DAG。Job 状态：waiting → running → success/failure/cancelled。Runner 注册到 Gitea 实例后轮询任务。这是事件驱动的 CI/CD 执行，不是 Stateful 调度——任务不持久化在调度器中、不跨执行周期恢复、调度策略由 YAML 定义而非运行时决策。
- **Issue 生命周期**：open → closed（可 reopen）。拥有标签和里程碑但不具备状态机迁移责任方、前置依赖或阻塞关系。Issue 是工单状态管理，不是调度生命周期。
- **Actions Runner 注册与领取**：Runner 通过 registration token 注册到 Gitea 实例，然后以 daemon 模式轮询任务。这是 runner 主动领取模式，不是调度器选择执行者。Runner 可在 instance、organization 或 repository 三个级别注册。
- **Agent Team（未决）**：v2.0 发布说明将 Agent Team 列为"内置 Agent 编排方案"，暗示存在某种 Agent 协调能力。但任务状态是否持久化、Agent 如何被分派、失败后如何恢复、是否存在跨会话连续性——均因文档闭源而无法确认。

以上为已确认事实（Gitea 部分），依据 [Gitea Actions 文档](https://docs.gitea.com/usage/actions/quickstart)。Agent Team 部分为未决项。

### 持久化基于关系型数据库，Gitea 原生支持 SQLite、MySQL 和 PostgreSQL

DevStar 继承 Gitea 的持久化模型：

- **关系型数据库**：所有 Gitea 元数据（用户、组织、仓库元数据、Issue、PR、Project、Actions 记录、Webhook、密钥等）存储在关系型数据库中。支持 SQLite（内嵌、零配置）、MySQL 和 PostgreSQL。首次安装时通过 Web 安装向导配置数据库。
- **Git 仓库数据**：存储在文件系统（Docker 容器内 `/var/lib/gitea/git`），通过 Docker volume 持久化到宿主机 `~/.devstar/data`。
- **配置文件**：Gitea 配置存储在 `app.ini`（`/etc/gitea/app.ini`），通过 Docker volume 持久化。
- **Docker volume**：`~/.devstar/data` 映射到容器的 `/var/lib/gitea` 和 `/etc/gitea`，确保容器重启后数据不丢失。
- **Actions 产物**：CI/CD 构建日志和产物存储在 Gitea 数据库和文件系统中。

不存在外置数据库与内嵌数据库的运行差异问题——SQLite 用于轻量部署，MySQL/PostgreSQL 用于生产环境，三者存储相同的数据模型。数据库依赖可按部署规模选择，SQLite 可零配置启动。

以上为已确认事实，依据 [Gitea 文档](https://docs.gitea.com/installation/install-from-binary)和[DevStar 安装脚本](https://devstar.cn/assets/install.sh)。

### Windows 与 macOS 均通过 Docker 支持，但安装脚本为 bash 且 Windows 需 WSL 环境

DevStar 的安装和运行完全依赖 Docker：

- **macOS 安装方式**：通过 `curl -fsSL https://devstar.cn/install | bash` 下载 `devstar` CLI（bash 脚本）到 `~/.devstar/`。安装脚本检测 macOS 后使用 `docker` 命令（非 sudo）。Docker 依赖通过 Homebrew 安装 Docker Desktop 或 Colima（`brew install qemu colima && colima start`）。运行 `devstar start` 后通过浏览器访问 `http://localhost:8080`。
- **Windows 安装方式**：安装脚本支持 `windows-x64`，但脚本本身是 bash——需要 WSL、Git Bash 或 MSYS2 环境。Docker Desktop（WSL2 后端）是硬性依赖。安装脚本在 Windows 上使用 `sudo docker` 命令。`devstar` CLI 下载的 binary 在 Windows 上可能需要通过 WSL 运行。
- **Linux 安装方式**：支持 ubuntu、debian、centos、rhel、fedora、alpine、openEuler。安装脚本自动检测发行版并安装 Docker（通过阿里云镜像或官方脚本）。
- **运行入口**：所有平台通过 Web 浏览器访问 `http://localhost:8080`（或自定义端口）。SSH 端口 2222 用于 Git SSH 访问。

Windows 安装方式存在明显摩擦——bash 脚本、WSL 依赖、Docker Desktop 要求。macOS 安装相对顺畅，Docker Desktop 或 Colima 均可。两个平台都通过 Docker 容器运行相同的 Gitea 实例，不存在平台差异导致的功能缺失。但 Docker 作为硬性依赖增加了部署复杂度。

以上为已确认事实，依据[DevStar 安装脚本](https://devstar.cn/assets/install.sh)和[初始安装脚本](https://devstar.cn/install)。

### Local 优先适配判断：自托管强匹配，但部署形态为容器化服务端应用

DevStar 的全部主体功能运行在用户本地 Docker 容器中。产品不存在 DevStar 运营的云端服务——没有 SaaS 托管、没有云端调度、没有云端认证。数据存储在本地 Docker volume（`~/.devstar/data`）中。LLM 可通过"一键部署主流 LLM"在本地运行（private code LLM），也可配置外部 API。

但 DevStar 的部署形态是容器化服务端应用——它不是轻量级桌面工具或 CLI，而是运行在 Docker 中的 Web 服务器。用户通过浏览器访问，而非原生应用。Docker 是硬性依赖，增加了部署门槛。对于需要极简本地部署的场景，Docker 依赖是额外的复杂度。

选型结论：DevStar 在 Local 优先维度上不存在云端依赖的选型缺陷。主体功能自托管在本地，数据不离开工作机。但容器化服务端形态比轻量级本地工具更重，适合团队/组织级部署而非个人开发者快速使用。

以上为已确认事实，依据[DevStar 官网](https://devstar.cn/)和[安装脚本](https://devstar.cn/assets/install.sh)。

### 不存在 DevStar 云端组件，Docker 镜像仓库使用 HTTP 需手动配置 insecure-registry

DevStar 不存在云端组件。不存在需要调研的 DevStar 云端职责、组件、依赖、接口或数据边界。

唯一经过网络的非 LLM 数据是 Docker 镜像拉取——从 `devstar.cn` 镜像仓库拉取 `devstar-studio:latest` 和 `actions-runner:latest` 镜像。镜像仓库使用 HTTP 协议（非 HTTPS），安装脚本会自动配置 Docker `insecure-registries` 以允许 HTTP 拉取。这是一个安全注意事项——HTTP 镜像拉取存在中间人攻击风险，仅应在可信内网或开发环境中使用。

LLM API 调用通过出站 HTTP/HTTPS 发向配置的 LLM Provider 端点（可本地部署或外部 API）。

以上为已确认事实，依据[DevStar 安装脚本](https://devstar.cn/assets/install.sh)中的 `set_insecure_registry` 函数和 `pull_images` 函数。

## 技术架构调研

### 系统全貌与运行形态

DevStar 以 Docker 容器为部署单元，运行 Gitea 商业发行版：

1. **devstar CLI（bash 脚本）**：安装在 `~/.devstar/devstar`，管理 Docker 容器生命周期——start、stop、logs、clean。脚本自动检测宿主机 OS 并安装 Docker 依赖。
2. **DevStar Studio 容器**：Docker 镜像 `devstar.cn/devstar/devstar-studio:latest`（或 `devstarcn/devstar-studio:latest`）。容器内运行 Gitea Web 服务（端口 3000 映射到宿主机 80 或 8080）、SSH 服务（端口 2222）。Docker socket 通过 bind-mount 挂载到容器内（DooD 模式），允许容器内启动 DevContainer 和 Actions Runner。
3. **Actions Runner 容器**：Docker 镜像 `devstarcn/actions-runner:latest`，独立的 CI/CD runner 容器，注册到 DevStar Studio 实例后轮询执行 CI/CD 任务。
4. **DevContainer**：基于 Dockerfile 的开发环境容器（Ubuntu、openEuler、Alpine Linux），通过 DevStar 的 DevContainer 功能一键启动。
5. **Web UI**：用户通过浏览器访问 DevStar Studio 的 Web 界面，进行 Git 仓库管理、Issue 追踪、CI/CD 配置、AI 功能使用和 Agent Team 操作。

系统边界：DevStar Studio 容器是自包含的服务端应用。所有组件运行在用户本地 Docker 环境中。唯一的外部网络依赖是 Docker 镜像拉取（devstar.cn）和 LLM API 调用（用户配置的 Provider）。

### 主要组件与核心链路

DevStar 的组件结构继承 Gitea（`services/` 目录）：

- **actions**：Gitea Actions CI/CD 系统，GitHub Actions 兼容。管理工作流定义、触发、执行记录。
- **issue**：Issue 追踪系统，拥有标签、里程碑、指派、时间跟踪。
- **projects**：看板式项目管理。
- **pull**：Pull Request 管理，代码审查。
- **repository**：Git 仓库管理，包括分支、标签、Webhook。
- **cron**：内置定时任务调度器，用于系统维护。
- **task**：内部任务队列，用于异步操作（仓库镜像、迁移等）。
- **org**：组织和团队管理。
- **packages**：多包注册表管理。
- **secrets**：密钥管理（用于 Actions 和其他功能）。
- **webhook**：Webhook 通知系统。

DevStar 增强组件（闭源，商业许可）：
- **Agent Team**：Agent 编排方案（v2.0 新增，实现细节未公开）。
- **MCP Server**：内置 MCP 协议服务器。
- **AI Chatbot**：内置 AI 聊天助手。
- **AI Code Review**：自动代码审查。
- **DevContainer**：开发环境容器管理。

核心链路：一次 CI/CD 自动化任务的完整流程。

1. 开发者在 DevStar Web UI 中创建仓库，推送代码。
2. 仓库根目录下的 `.gitea/workflows/*.yaml` 定义 CI/CD 工作流。
3. Git 事件（push、PR）触发 Workflow 执行。
4. Actions Runner（独立容器）轮询到任务后执行 Job。
5. Job 在 Docker 容器中执行步骤（检出代码、构建、测试、部署）。
6. 执行结果记录在 DevStar 数据库中，可通过 Web UI 查看。
7. Webhook 可将事件通知发送到外部系统。

### 主要依赖

- **Docker**：硬性运行时依赖。DevStar Studio、Actions Runner 和 DevContainer 均以 Docker 容器形式运行。无 Docker 则无法部署。
- **Go**：后端构建依赖（`go.mod` 定义版本）。Gitea 后端使用 Go 编写。
- **Node.js + pnpm**：前端构建依赖。Gitea 前端使用 Node.js 构建。
- **关系型数据库**：运行时持久化依赖。支持 SQLite（内嵌，零配置）、MySQL 和 PostgreSQL。SQLite 可用 `TAGS="bindata sqlite sqlite_unlock_notify" make build` 启用。
- **LLM Provider API**：AI 功能运行时依赖。可本地部署（"一键部署主流 LLM"）或使用外部 API。

Docker 是影响安装、运行和部署的最关键依赖。数据库可按规模选择。LLM 依赖可本地化。

### 接口形态

- **Web UI（HTTP）**：主要用户界面，端口 3000（容器内）映射到宿主机 80 或 8080。支持 Git 仓库浏览、Issue 管理、CI/CD 配置、AI 功能使用。
- **Git SSH（端口 2222）**：Git over SSH 协议，用于代码推送和拉取。
- **Git HTTP**：Git over HTTP 协议，用于代码推送和拉取。
- **REST API**：Gitea 原生 REST API，提供仓库、Issue、PR、用户、组织等资源的编程访问。
- **Gitea Actions API**：Actions 相关 API，用于工作流管理和 runner 注册。
- **MCP Server**：内置 MCP（Model Context Protocol）服务器，供 AI Agent 接入。协议细节未公开。
- **Webhook**： outgoing HTTP 通知，支持 Git 事件、Issue 事件等触发外部系统。

### 持久化方式

- **关系型数据库**：SQLite（默认，零配置）、MySQL、PostgreSQL。存储所有 Gitea 元数据——用户、组织、仓库元数据、Issue、PR、Project、Actions 记录、Webhook、密钥等。首次安装通过 Web 安装向导配置。
- **Git 仓库文件**：存储在容器内 `/var/lib/gitea/git`，通过 Docker volume 持久化到宿主机 `~/.devstar/data`。
- **配置文件**：`app.ini` 存储在 `/etc/gitea/app.ini`，通过 Docker volume 持久化。
- **CI/CD 产物**：构建日志和产物存储在 Gitea 数据库和文件系统中。

状态所有权：所有状态由 DevStar Studio 容器（Gitea 实例）拥有。数据库、文件系统和配置均通过 Docker volume 持久化到宿主机。容器删除后数据仍可通过 volume 恢复（`devstar clean` 会删除数据）。

### 通信方式

- **用户与 DevStar**：HTTP/HTTPS（Web UI 和 REST API）、SSH（Git 协议）、Git HTTP。
- **DevStar 与 Runner**：Runner 通过 HTTP 轮询 Gitea 实例获取任务。注册时使用 registration token 认证。
- **DevStar 与 LLM**：出站 HTTP/HTTPS 调用用户配置的 LLM Provider 端点。
- **DevStar 与外部系统**：Webhook（outgoing HTTP 通知）。
- **MCP 通信**：内置 MCP Server 提供协议接口供 AI Agent 接入（细节未公开）。
- **容器间通信**：Docker socket bind-mount（DooD），DevStar Studio 容器可启动和管理 DevContainer 和 Actions Runner 容器。

### 部署形态

#### 工作机安装（Windows / macOS）

**macOS 安装方式与入口**：

- 通过 `curl -fsSL https://devstar.cn/install | bash` 安装 `devstar` CLI（bash 脚本）到 `~/.devstar/`。
- 依赖：Docker Desktop 或 Colima（`brew install qemu colima && colima start`）。
- 运行 `devstar start` 启动 Docker 容器，通过浏览器访问 `http://localhost:8080`。
- 首次启动需完成 Gitea 安装向导（配置数据库、注册管理员账户）。
- 权限：Docker 容器以 root 运行，bind-mount Docker socket。macOS 上不需要 sudo。
- 网络：出站 HTTP 到 devstar.cn（拉取镜像）和 LLM Provider API。入站端口 80（或 8080）和 2222。
- 卸载：`devstar clean`（停止容器并删除数据），删除 `~/.devstar/` 目录。

**Windows 安装方式与入口**：

- 安装脚本支持 `windows-x64`，但脚本为 bash，需要 WSL、Git Bash 或 MSYS2 环境。
- 依赖：Docker Desktop（WSL2 后端）。
- 运行 `devstar start`（在 WSL/bash 中），启动 Docker 容器。
- 通过浏览器访问 `http://localhost:8080`。
- 首次启动需完成 Gitea 安装向导。
- 权限：安装脚本使用 `sudo docker`，在 WSL 中可能需要 sudo 权限。
- 网络：同 macOS。
- 卸载：同 macOS（在 WSL/bash 中运行 `devstar clean`）。

Windows 安装存在摩擦——bash 脚本、WSL 依赖、Docker Desktop 要求。macOS 安装相对顺畅。

#### 主体功能运行位置

- 主体功能运行在用户本地 Docker 容器中。DevStar Studio 是自包含的 Gitea 实例。
- 不存在 DevStar 运营的云端服务。
- LLM 推理可本地部署（private code LLM）或使用外部 API。
- Web UI、Git 服务、CI/CD 和 AI 功能均在本地容器中运行。
- Local 优先适配判断：**自托管强匹配，无云端依赖选型缺陷**。但部署形态为容器化服务端应用，比轻量级本地工具更重。

#### 云端形态

DevStar 不存在云端组件。不存在需要调研的云端职责或数据边界。

唯一经过网络的数据：
- Docker 镜像拉取（devstar.cn，HTTP 协议，需配置 insecure-registry）。
- LLM API 调用（用户配置的 Provider 端点，可本地或外部）。
- Webhook 通知（outgoing HTTP，用户配置的外部系统）。

Docker 镜像仓库使用 HTTP 是一个安全注意项——安装脚本会自动配置 `insecure-registries`，存在中间人攻击风险，仅应在可信内网或开发环境中使用。

## 未决项与证据边界

### Agent Team 的实现架构和调度能力为核心未决项

DevStar v2.0 将 Agent Team 列为"内置 Agent 编排方案"，是判断产品是否具备 Stateful 调度能力的关键。但当前所有公开证据均不足以确认或否认其调度属性：

- 官方文档（devstar.cn/docs）需要登录，Agent Team 的架构、任务模型、状态机和调度机制均未公开。
- GitHub 开源仓库展示的是标准 Gitea 服务结构，未见自定义 Agent 相关模块。
- 增强功能（包括 Agent Team）标注为商业许可，闭源部分不在开源代码中。
- GitHub 仓库仅 7 stars、3 forks，社区反馈样本不足以判断 Agent Team 的实际能力。
- 无第三方评测或技术分析文章覆盖 Agent Team 功能。

合理推导：Agent Team 可能是 Gitea Issues/PR/Actions 与 AI Agent 的集成层——通过 AI Agent 自动处理 Issue、执行代码审查、触发 CI/CD——而非独立的 Stateful 调度系统。但这仅为推导，不构成已确认结论。需获取商业版文档或运行环境访问权限后才能确认。

### Gitea Actions 的 runner 轮询与任务领取机制需源码验证

Gitea Actions 文档描述 runner 通过 `./runner daemon` 运行，注册后轮询任务。但轮询机制的具体实现——是否支持持久化任务队列、任务防重复领取、原子抢占、租约超时回收——在文档层面未充分说明。Gitea 上游代码中 Actions 的实现（基于 `act`/`act_runner`）使用 HTTP 长轮询，任务状态存储在 Gitea 数据库中。这是 CI/CD runner 模式，不是 Stateful 调度，但对于评估改造可行性有参考价值。

### DevStar 增强功能的闭源边界需商业版验证

DevStar 的增强功能（Agent Team、MCP Server、AI Chatbot、AI Code Review、DevContainer、一键 LLM 部署）均在商业许可下。开源仓库仅包含 Gitea 核心代码。增强功能的实现方式（是否为 Gitea 插件、独立微服务、前端集成或 Gitea 代码修改）未公开。需获取商业版或试用版后验证。

### Docker 镜像仓库 HTTP 协议的安全性需评估

DevStar 安装脚本自动配置 Docker `insecure-registries` 以允许从 devstar.cn 通过 HTTP 拉取镜像。这意味着镜像完整性依赖网络可信度。在不可信网络环境中，可能存在中间人攻击风险。对于企业部署，应评估是否需要配置 HTTPS 或使用内部镜像仓库。

## 后续验证建议

1. **获取 Agent Team 文档或试用版**：注册 DevStar 账户或申请试用版，获取 Agent Team 的官方文档、架构说明和任务模型定义。这是确认或否认 DevStar Stateful 调度能力的必要步骤。

2. **运行验证 Agent Team 功能**：在本地部署 DevStar v2.0，创建 Agent Team，观察任务如何创建、分派、执行和恢复。验证是否存在持久化任务状态、跨重启恢复、失败转交和依赖解析。

3. **源码验证 Gitea Actions 任务队列**：定位 Gitea 上游 `services/actions` 和 `act_runner` 的实现，确认任务领取的原子性机制和持久化行为。这不影响"Gitea Actions 不是 Stateful 调度"的结论，但有助于评估改造可行性。

4. **评估 MCP Server 协议**：验证 DevStar 内置 MCP Server 的协议实现——它暴露哪些工具、资源和提示，AI Agent 如何通过 MCP 接入 DevStar 的 Issue、PR 和 Actions 系统。

5. **追踪社区和版本演进**：DevStar GitHub 仓库当前仅 7 stars，社区活跃度低。需追踪后续版本发布、Issue 反馈和功能演进，判断产品的维护投入和长期可行性。
