# DSPy 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-07 17:00:00
> evidence_window: 2026-08-07, main 分支, v3.3.0

## 调研目标

- 围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源与架构范式，形成可追溯的独立产品调研。
- 判断产品是否持久拥有工作对象、对象关系和任务生命周期，并依据依赖、状态与策略持续推进任务。
- 核验 Windows 与 macOS 工作机支持情况、Local 优先适配程度、云端依赖与最小部署成本。
- 识别调度最小核心职责与非调度增值能力的边界，评估改造范围与风险。

## 交付结论

### DSPy 是 LM 编程框架，不是 Stateful 调度系统

DSPy（Declarative Self-improving Python）是一个用于编程——而非提示——语言模型的开源 Python 框架。产品不持久拥有 Workspace、Project、Issue、Plan 或 Task 等调度工作对象，不维护任务间的父子关系、先后顺序、前置依赖或 DAG，不负责判断任务何时可执行、按何种顺序推进、由谁执行以及失败后如何继续。DSPy 的核心抽象是 Signature（声明式任务定义）、Module（执行策略）和 Optimizer（编译优化），这些抽象服务于 LM 程序的构建和优化，不构成跨会话的中心调度状态。

以上为已确认事实，依据官方[首页](https://dspy.ai/)和 [GitHub README](https://github.com/stanfordnlp/dspy)。

### 工作对象模型中不存在 Workspace / Project / Issue / Plan / Task

DSPy 的对象模型如下：

- **Signature**：声明式任务接口，定义输入字段和输出字段。不是持久化对象，是 Python 类或字符串，在程序代码中定义，不独立存储。
- **Module**：执行策略容器，类似 PyTorch 的 `nn.Module`。内置模块包括 `Predict`、`ChainOfThought`、`ReAct`、`RLM`、`Flex`、`BestOfN` 等。Module 是可调用对象，在进程内执行，不是持久化工作对象。
- **Prediction**：Module 调用的返回值，包含输出字段和可选的 `trajectory`（ReAct 执行轨迹）。是临时对象，调用结束后不持久化。
- **Example**：训练/评估数据样本，包含输入和可选标签。是内存对象，不构成调度工作记录。
- **Optimizer 编译结果**：以 JSON 文件保存的优化后指令和 few-shot 演示，可通过 `.save()` 和 `.load()` 序列化。这是程序状态的快照，不是调度状态。

Index 定义的 Workspace、Project、Issue、Plan、Task 对象在 DSPy 中均不存在。DSPy 没有任何持久化的工作对象模型。

以上为已确认事实，依据[首个程序文档](https://dspy.ai/getting-started/first-program/)和[模块文档](https://dspy.ai/getting-started/changing-modules/)。

### 任务关系、生命周期与调度决策不存在

DSPy 不存在任务 DAG、前置依赖、阻塞关系、并行分支或优先级等调度概念。程序的执行流程由 Python 代码的 `forward()` 方法控制，是开发者在代码中编写的确定性流程，不是运行时调度。

- **无状态机**：Module 没有等待/运行/完成/失败等调度状态。Module 的 `_compiled` 布尔标志仅表示是否经过优化器编译，不构成调度状态机。
- **无续推机制**：`ReAct` 模块在单次调用内运行推理-行动循环，由模型决定循环次数（可设 `max_iters` 上限）。循环结束后返回结果，不跨调用续推。`RLM` 模块在单次调用内运行代码解释器循环，行为类似。
- **无失败恢复**：Module 调用失败时抛出 Python 异常（如 `dspy.LMError`），由调用方代码处理。没有自动重试、重新排队或任务转移机制。Optimizer 编译过程中的失败由优化器内部的候选淘汰逻辑处理，不是调度恢复。
- **无优先级或并发约束**：不存在任务优先级。DSPy 支持线程化评估和编译（`num_threads`），但这是 Python 线程池并行，不是调度并发控制。

以上为已确认事实，依据[ReAct 文档](https://dspy.ai/getting-started/react-and-tools/)和[组合模块文档](https://dspy.ai/getting-started/composing-modules/)。

### Agent 分派由 Python 代码驱动，不存在中心调度器选择执行者

DSPy 不存在 Agent 分派机制。程序中的 Module 调用顺序由开发者在 `forward()` 方法中编写，是硬编码的控制流，不是运行时分派。

- **无执行者选择**：Module 的调用是直接的 Python 函数调用，不存在调度器选择执行者。
- **无 Agent 持久化归属**：Module 不与"Agent"绑定。每次调用创建临时的执行上下文，调用结束后释放。
- **`ReAct` 和 `RLM` 是单次执行循环**：`ReAct` 在一次调用内完成推理-工具调用-合成的完整循环。`RLM`（Recursive Language Model）在一次调用内运行 IPython 代码解释器循环。两者都是测试时（test-time）执行策略，不是持续运行的 Agent。
- **无跨会话恢复**：Module 调用结束后，执行状态不保留。下次调用从头开始，除非开发者显式保存和加载编译结果。

以上为已确认事实，依据[首个程序文档](https://dspy.ai/getting-started/first-program/)和[自定义模块文档](https://dspy.ai/tutorials/custom_module/)。

### 持久化仅限程序状态快照，无外置数据库

DSPy 不使用任何外部数据库。所有持久化通过本地文件系统完成：

- **优化程序状态**：以 JSON 文件保存优化后的指令和 few-shot 演示，通过 `.save("program.json")` 和 `.load("program.json")` 操作。JSON 是人类可读的，可版本控制。这是程序优化状态的快照，不是调度状态。
- **完整程序序列化**：通过 `.save("dir/", save_program=True)` 将完整 Module 以 pickle 保存到目录。文档明确警告"只加载可信来源的程序"。
- **LM 响应缓存**：默认开启的磁盘缓存，位于 `DSPY_CACHEDIR` 环境变量指定目录。缓存 LM API 响应以减少重复调用成本。可通过 `cache=False` 关闭。
- **LM 状态序列化**：v3.3.0 新增 `BaseLM.dump_state()` 和 `load_state()`，支持 LM 运行时状态的清理序列化，排除 API 密钥。

无强制数据库依赖，无专属数据库扩展。这是 Local 优先架构的正面特征。

以上为已确认事实，依据[保存与加载文档](https://dspy.ai/getting-started/saving-and-loading/)和[FAQ](https://dspy.ai/faqs/)。

### 接口形态为纯 Python API，无 REST/gRPC/WebSocket

DSPy 的唯一接口形式是 Python API。用户通过 `import dspy` 导入框架，在 Python 代码中定义 Signature、实例化 Module、调用 `forward()` 方法。

- **无 CLI**：DSPy 不提供命令行工具。安装通过 `pip install dspy` 完成。
- **无 REST API**：DSPy 本身不提供 HTTP 接口。生产部署需要用户自行使用 [FastAPI](https://dspy.ai/tutorials/deployment/) 封装 DSPy 程序为 REST API，或使用 [MLflow](https://dspy.ai/production/) 进行模型服务和版本管理。
- **无 gRPC 或 WebSocket**：不提供这些接口。
- **流式输出**：通过 `dspy.streamify` 将 Module 转换为异步流式输出，适用于 Server-Sent Events 场景。这是 Python 异步生成器，不是独立协议。
- **SDK 嵌入**：DSPy 本身就是 Python 库，直接在用户应用中 import 使用，无需 SDK 适配层。

以上为已确认事实，依据[安装文档](https://dspy.ai/getting-started/installation/)和[部署文档](https://dspy.ai/tutorials/deployment/)。

### 通信方式为进程内函数调用，无分布式消息中间件

DSPy 的所有通信在同一 Python 进程内通过函数调用完成。

- **Module 间通信**：`forward()` 方法中直接调用子 Module，是 Python 函数调用。
- **LM 通信**：通过 LiteLLM 库（v3.3 正在解耦）向 LM Provider 发起 HTTP API 调用。这是唯一的网络出口。
- **工具通信**：`ReAct` 模块中的工具是普通 Python 函数，通过函数调用执行。
- **RLM 代码解释器通信**：`RLM` 模块通过 `CodeInterpreter`（默认 `PythonInterpreter`，可选 Deno）在子进程中执行代码。子进程通信使用 JSONRPC 格式。这是进程间通信，但限于单机，不跨网络。
- **无消息中间件**：不依赖 Redis、RabbitMQ、Kafka 或任何外部消息队列。

以上为已确认事实，依据[架构文档](https://dspy.ai/getting-started/first-program/)和[v3.3.0 Release Notes](https://github.com/stanfordnlp/dspy/releases/tag/3.3.0)。

### 任务队列不存在，无持久化分布式队列

DSPy 不存在任务队列概念。

- **无全局任务队列**：Module 调用是同步的 Python 函数调用，没有入队/出队机制。
- **ReAct 循环不是队列**：`ReAct` 的推理-行动循环是单次调用内的迭代逻辑，不是持久化队列。循环次数由模型决定或受 `max_iters` 限制。
- **Optimizer 编译不是调度**：Optimizer 编译过程在训练集上运行程序、评分、迭代改进指令。这是离线优化流程，不是运行时任务调度。编译过程中的并行通过 Python 线程池实现（`num_threads`），不是分布式任务队列。
- **无任务防重复领取或原子抢占**：不存在这些机制。

以上为已确认事实，依据[GEPA 优化文档](https://dspy.ai/getting-started/gepa-optimization/)和[组合模块文档](https://dspy.ai/getting-started/composing-modules/)。

### Windows 与 macOS 均原生支持，无平台缺陷

DSPy 是纯 Python 库，通过 `pip install dspy` 安装，在 Python 3.10+ 环境下运行。

- **macOS**：原生支持。`pip install dspy` 即可使用。无特殊依赖、权限或网络要求（除 LM API 调用外）。Apple Silicon 和 Intel 架构均支持。
- **Windows**：原生支持。`pip install dspy` 即可使用。无 POSIX 依赖、无 bash 要求、无 WSL 需求。历史上有过 Windows 安装问题（[Issue #7807](https://github.com/stanfordnlp/dspy/issues/7807)，v2.6.3），但已修复。
- **Linux**：原生支持，安装方式与 macOS/Windows 相同。

无选型缺陷。三个平台均原生支持，无平台特定的能力缺失。

以上为已确认事实，依据[安装文档](https://dspy.ai/getting-started/installation/)和 [GitHub Issue #7807](https://github.com/stanfordnlp/dspy/issues/7807)。

### 主体功能完全运行在 PC 本地，Local 优先适配良好

DSPy 是一个纯本地运行的 Python 库。所有核心能力——Signature 定义、Module 执行、Optimizer 编译、缓存、序列化——均在用户的 Python 进程中运行。

- **无云端组件**：DSPy 产品本身不包含任何云端服务、SaaS 后端或中心化调度服务。DSPy 的官方文档站（dspy.ai）和 GitHub 仓库是信息资源，不是运行依赖。
- **模型 Provider 依赖**：DSPy 需要调用外部 LLM API（Anthropic、OpenAI、Google 等）进行模型推理。通过 LiteLLM 库统一接入，v3.3.0 正在将 LiteLLM 解耦为可选回退。这是 API 调用依赖，不是云端运行依赖。断网后 Module 无法调用模型，但已加载的程序状态和缓存不受影响。
- **Local 优先判断**：DSPy 在 Local 优先维度适配良好。主体功能完全运行在 PC 本地，无云端强绑定依赖，数据不离开工作机（模型 API 调用除外）。

以上为已确认事实，依据[首页](https://dspy.ai/)和[部署文档](https://dspy.ai/production/)。

### 依赖根源为 Python + LiteLLM，无不可剥离的硬依赖

DSPy 的运行时依赖如下：

| 依赖 | 用途 | 是否可替换 |
| --- | --- | --- |
| Python 3.10+ | 核心运行时 | 不可替换 |
| LiteLLM | LM Provider 接入标准化 | v3.3.0 正在解耦为可选回退，可实现自定义 `BaseLM` 替代 |
| NumPy | 嵌入、KNN、SIMBA 等 | v3.3.0 起可选，通过 `dspy[numpy]` 安装 |
| optuna | MIPROv2 优化器 | 可选，通过 `dspy[optuna]` 安装 |

以上为已确认事实，依据[安装文档](https://dspy.ai/getting-started/installation/)和 [v3.3.0 Release Notes](https://github.com/stanfordnlp/dspy/releases/tag/3.3.0)。

- **模型 Provider**：运行时依赖外部 LLM API。没有 LLM API，Module 无法执行。这不是可剥离的依赖。
- **无数据库依赖**：不依赖任何外部数据库。
- **无消息中间件依赖**：不依赖外部消息队列。
- **改造边界**：要将 DSPy 改造为 Stateful 调度系统，需要从零新增工作对象模型（Workspace/Project/Issue/Plan/Task）、任务关系与状态机、中心任务队列、执行者选择逻辑和跨会话调度状态持久化。DSPy 的 Module 系统可以作为 Agent 执行单元，Optimizer 可以作为离线任务优化器，但框架当前不提供任何调度基础设施。改造范围极大。这是架构推导。

### 架构范式为 PyTorch 式模块化编程框架，不支持分布式扩展

DSPy 的架构范式是**单进程 Python 模块化编程框架**：

- **模块系统**：`dspy.Module` 直接借鉴 PyTorch 的 `nn.Module`，通过 `__init__` 定义子模块、`forward()` 定义执行逻辑。Module 可组合、可嵌套、可优化。
- **执行模型**：Module 调用是同步的 Python 函数调用。`ReAct` 和 `RLM` 在单次调用内运行推理循环，循环结束后返回。没有后台进程、守护进程或持续运行的 Agent。
- **无分布式扩展**：不存在多节点协调、分布式锁或集群调度。DSPy 的线程化（`num_threads`、`dspy.asyncify`）是单机 Python 线程池/异步并发，不是分布式调度。
- **调度逻辑不可下沉**：DSPy 不存在独立的调度逻辑。程序的执行流程由开发者编写的 Python 代码决定，不是运行时调度产物。
- **扩展约束**：任务隔离依赖 Python 进程隔离（每个 Python 进程独立运行），多调度节点协调不存在。互斥机制不存在。

以上为已确认事实和架构推导，依据[首个程序文档](https://dspy.ai/getting-started/first-program/)和[自定义模块文档](https://dspy.ai/tutorials/custom_module/)。

### 客户端接入通过 Python import，不存在调度中心

DSPy 不存在独立的"调度中心"。接入方式如下：

- **标准接入**：`import dspy`，在 Python 代码中直接使用。`dspy.configure(lm=...)` 设置全局 LM，Module 调用时自动使用。
- **上下文切换**：`with dspy.context(lm=...)` 临时切换 LM，适用于同一程序内不同步骤使用不同模型的场景。
- **生产部署**：用户自行使用 FastAPI 封装为 REST API，或使用 MLflow 进行模型版本管理和服务。这是用户侧的部署选择，不是 DSPy 提供的调度中心。
- **异步化**：`dspy.asyncify(program)` 将同步 Module 转换为异步执行，适用于高吞吐量 FastAPI 部署。默认线程池上限为 8，可通过 `async_max_workers` 配置。
- **Windows 与 macOS 差异**：无差异。两个平台上 DSPy 的行为一致。

由于产品不提供调度中心，不存在"跳过客户端直接接入调度中心"的场景。如需将 DSPy 作为执行节点接入外部调度系统，可通过在 Python 代码中添加任务接收和状态上报逻辑实现。改造范围限于用户侧代码，不影响 DSPy 框架本身。这是架构推导。

## 产品调研

### 产品定位与目标用户

DSPy 是 Stanford NLP（Hazy Research）发布的开源 LM 编程框架，全称 Declarative Self-improving Python。产品定位为"编程而非提示语言模型"（Program, don't prompt），面向需要在生产环境中构建、优化和部署 LM 程序的开发者和研究人员。产品始于 2022 年 12 月的 Demonstrate-Search-Predict 论文，后发展为独立的通用框架。

以上为已确认事实，依据[官方首页](https://dspy.ai/)和 [GitHub](https://github.com/stanfordnlp/dspy)。

### 核心流程

用户通过 `pip install dspy` 安装，在 Python 代码中导入。配置 LM（如 `dspy.LM("openai/gpt-4o-mini")`）后，定义 Signature（任务输入输出声明），选择 Module（执行策略如 `Predict`、`ChainOfThought`、`ReAct`），调用 Module 完成任务。可选使用 Optimizer（如 `GEPA`）在训练集上编译优化程序的指令和 few-shot 演示。优化后的程序保存为 JSON 文件，可在不同模型上加载使用。

以上为已确认事实，依据[首个程序文档](https://dspy.ai/getting-started/first-program/)和[安装文档](https://dspy.ai/getting-started/installation/)。

### 功能地图与边界

- **当前可用**：Signature（字符串和类定义）、Module（Predict、ChainOfThought、ReAct、ReActV2、RLM、Flex、BestOfN、ProgramOfThought、CodeAct 等）、Optimizer（GEPA、MIPROv2、BootstrapFewShot、BootstrapFinetune、BetterTogether 等）、Adapter（ChatAdapter、JSONAdapter、XMLAdapter、TwoStepAdapter）、多模态（Image、Audio、File）、MCP 集成、流式输出、异步执行、缓存、MLflow 集成、LangChain 集成。
- **实验性**：`dspy.Flex`（优化器自动发现程序结构）、`dspy.ReActV2`（原生工具调用 ReAct）、typed LM API（`LMRequest`/`LMResponse`）。
- **不支持**：Workspace/Project/Issue/Plan/Task 调度对象模型、任务 DAG、分布式调度、多节点协调、后台守护进程、持续运行的 Agent、跨会话状态恢复、原生 REST/gRPC 接口。

以上为已确认事实，依据[官方首页](https://dspy.ai/)和 [v3.3.0 Release Notes](https://github.com/stanfordnlp/dspy/releases/tag/3.3.0)。

### 维护状态与版本演进

- **创建时间**：仓库创建于 2023-01-09，截至调研日（2026-08-07）约 3 年 7 个月。
- **最新版本**：v3.3.0（2026-08-03），另有 beta 通道 v3.3.0b1（2026-05-28）。
- **版本密度**：v3.1.3 至 v3.3.0 共 4 个正式版本加 1 个 beta，约 6 个月内发布，迭代速度高。
- **方向性变化**：v3.3.0 引入 Flex 优化器（优化器发现程序结构）、ReActV2（原生工具调用）、typed LM API（解耦 LiteLLM）、BaseLM 运行时状态管理。v3.2.0 引入 BetterTogether（链式优化器组合）和 LiteLLM 解耦开始。v3.3.0 将 NumPy 和 optuna 改为可选依赖，进一步精简安装。
- **仓库热度**：36,676 stars，3,175 forks，645 个 open issues，439+ contributors，7.5M+ 月下载量。对于 3 年半仓库，热度高且持续增长。
- **提交活跃度**：最后 push 日期为 2026-08-07（调研当天），表明项目处于活跃维护状态。

以上为已确认事实，依据 [GitHub API](https://api.github.com/repos/stanfordnlp/dspy) 和 [Releases](https://github.com/stanfordnlp/dspy/releases)。

### 生态与反馈

- **学术背景**：DSPy 起源于 Stanford NLP 的 Hazy Research，有多篇关联论文（DSPy 2023、MIPROv2 2024、BetterTogether 2024、GEPA 2025、RLM 2025）。
- **生产用户**：Shopify（元数据提取，约 550x 成本降低）、Dropbox（Dash 相关性判断，准确率翻倍）、Databricks、JetBlue、AWS（Amazon Nova 迁移）、Replit（代码修复）、Sephora、VMware、Moody's 等。
- **社区入口**：Discord（8.4k 成员）、GitHub Discussions（已启用）。
- **集成生态**：MLflow（原生集成，可观测性和部署）、LangChain（可选 extra）、MCP（Model Context Protocol 工具集成）、ColBERTv2（检索）、RAGatouille。
- **社区端口**：有 R 语言社区端口。
- **Issue 反馈样本**：v3.2.0 修复了大量社区报告的问题（多个首次贡献者 PR），包括安全修复（pickle 反序列化限制、CI SHA 固定）、RLM 和 CodeInterpreter 硬化。样本量有限，不能代表普遍反馈。

以上为已确认事实，依据[官方首页](https://dspy.ai/)和 [v3.2.0 Release Notes](https://github.com/stanfordnlp/dspy/releases/tag/3.2.0)。反馈样本边界：645 个 open issues 中部分可能是使用问题而非产品缺陷。

## 技术架构调研

### 系统全貌与运行形态

DSPy 以**单进程 Python 库**形态运行。系统由以下组件角色组成：

| 角色 | 职责 | 运行位置 |
| --- | --- | --- |
| Signature | 声明任务输入输出接口 | Python 类/字符串，进程内 |
| Module | 执行策略容器（Predict、ChainOfThought、ReAct 等） | Python 对象，进程内 |
| Adapter | 将 Signature 渲染为 LM 消息 | Python 对象，进程内 |
| LM (BaseLM) | LM Provider 接入，发起 API 调用 | Python 对象，进程内（HTTP 出站到 Provider） |
| Optimizer | 离线编译优化程序指令和演示 | Python 对象，进程内 |
| Cache | LM 响应磁盘缓存 | 本地文件系统 |
| CodeInterpreter (RLM) | 子进程代码执行沙箱 | 独立子进程（单机） |

系统边界完全在单台工作机内。唯一网络出口是对 LM Provider 的 API 调用。

以上为已确认事实，依据[首个程序文档](https://dspy.ai/getting-started/first-program/)和[部署文档](https://dspy.ai/production/)。

### 主要组件与核心链路

**核心链路：用户定义 Signature → Module 执行 → 结果返回**

1. 用户定义 Signature（如 `"question -> answer"`），DSPy 解析为带类型字段的 Signature 类。
2. 用户选择 Module（如 `dspy.ChainOfThought`），DSPy 实例化 Module 并绑定 Signature。
3. 用户调用 Module（如 `program(question="...")`），DSPy 的 `__call__` 方法处理内部流程。
4. Adapter 将 Signature 指令、字段 schema 和输入值渲染为 LM 消息。
5. LM 对象通过 LiteLLM 向 Provider 发起 API 调用。
6. Provider 返回响应，Adapter 解析输出字段。
7. Module 返回 `Prediction` 对象，包含可访问的输出字段。
8. 调用记录在 LM history 中，可通过 `dspy.inspect_history()` 查看。

**优化链路：定义程序 → 提供训练集和指标 → Optimizer 编译 → 保存优化结果**

1. 用户定义程序（`dspy.Module` 子类）和评估指标（Python 函数）。
2. 用户选择 Optimizer（如 `dspy.GEPA`），提供训练集和验证集。
3. Optimizer 在训练集上执行程序，使用指标评分。
4. 反射 LM 分析评分结果，提出新的指令候选。
5. Optimizer 用新指令重新执行程序，保留最优候选。
6. 循环直到预算耗尽，返回优化后的程序。
7. 用户保存优化结果为 JSON 文件。

以上为已确认事实，依据[首个程序文档](https://dspy.ai/getting-started/first-program/)和[GEPA 优化文档](https://dspy.ai/getting-started/gepa-optimization/)。

### 主要依赖

见"依赖根源"结论。核心运行时依赖为 Python 3.10+ 和 LiteLLM（正在解耦）。无外部数据库、消息中间件或云服务依赖。

### 接口形态

见"接口形态"结论。纯 Python API，无 REST/gRPC/WebSocket/CLI。生产部署通过 FastAPI 或 MLflow 由用户自行封装。

### 持久化方式

见"持久化"结论。JSON 程序状态 + pickle 完整程序 + 磁盘缓存，无数据库。

### 通信方式

见"通信方式"结论。进程内函数调用 + HTTP 到 LM Provider，无分布式中间件。

### 部署形态

#### 工作机安装（Windows / macOS）

**macOS**：
- 安装方式：`pip install dspy` 或 `uv add dspy`
- 运行入口：Python `import dspy`
- 依赖：Python 3.10+（用户自行安装），LiteLLM（自动安装），可选 NumPy 和 optuna
- 权限：当前用户权限，无 root 要求
- 网络要求：安装时需要下载 PyPI 包；运行时需要访问 LM Provider API
- 卸载方式：`pip uninstall dspy`

**Windows**：
- 安装方式：与 macOS 相同，`pip install dspy`
- 运行入口：与 macOS 相同，Python `import dspy`
- 依赖：与 macOS 相同
- 权限：当前用户权限
- 网络要求：与 macOS 相同
- 卸载方式：与 macOS 相同
- 无选型缺陷

以上为已确认事实，依据[安装文档](https://dspy.ai/getting-started/installation/)。

#### 主体功能运行位置

主体功能完全运行在 PC 本地。Local 优先适配良好，无云端强绑定依赖。

#### 云端形态

DSPy 产品本身不存在云端组件。LM Provider（Anthropic、OpenAI、Google 等）是外部依赖，不是 DSPy 的云端组件。MLflow 部署是用户侧选择，不是 DSPy 内置的云服务。

## 未决项与证据边界

- **RLM 子进程在 Windows 上的行为**：RLM 模块使用 `CodeInterpreter`（默认 `PythonInterpreter`，可选 Deno）。Deno 在 Windows 上的文件系统权限行为可能与 Unix 存在差异。文档未明确验证 Windows 上的 RLM 行为。需要实际运行验证。
- **大规模 Optimizer 编译的内存和性能**：文档提到 GEPA 编译可使用 `num_threads` 并行，但未提供大规模训练集（数千样本）的内存和编译时间基准数据。
- **多进程共享 LM 缓存的并发安全**：文档提到磁盘缓存和 `restrict_pickle` 选项，但未明确多进程同时访问同一缓存目录时的并发安全行为。
- **typed LM API 的成熟度**：v3.3.0 的 `LMRequest`/`LMResponse` typed API 标记为实验性，需通过 `dspy.context(experimental=True)` 启用。生产可用性待验证。

## 后续验证建议

- 在 Windows 上实际安装和运行 DSPy，验证 RLM 模块的 CodeInterpreter 行为和 Deno 兼容性。
- 测试 GEPA 优化器在大规模训练集上的编译性能和内存占用。
- 评估将 DSPy 的 Module 系统作为外部调度系统的执行节点接入的可行性和改造范围——Module 的 `forward()` 方法可作为单次任务执行入口，但需要外部系统负责任务接收、状态管理和失败恢复。
- 如需 Stateful 调度能力，DSPy 不提供任何可复用的调度基础设施，需从零构建调度层。
