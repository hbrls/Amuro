---
name: dsh-inject-services
description: "dsh 安装版可 inject 的 Cordis 服务：Host 98 个业务服务 + 2 个框架服务、Client 39 个、Gateway 33 个 remote 命名空间；默认可用性、provider 包、关键 API 与选型"
metadata:
  version: 0.1.0
---

# dsh inject 服务实测清单

> 适用版本：DeepSeek Harness Desktop `0.2.1-rc.3`，Cordis `4.0.5`（本机安装版，2026-10-25 核对）。
> 权威来源：`/Applications/DeepSeek Harness.app/Contents/Resources/app.asar` 内 `@deepseek-ai/*` 的 `lib/index.js`、`lib/client*.js` 服务注册，以及 `~/.dsh/profiles/desktop/package.json` 的实际 bundle 组合。计数口径：Host 原始扫描 101 个名字，剔除 Error code（`DECLINED`）与 Cordis 基础设施 `loader`、`timer` 后为 **98 个业务服务**；Client 为 **39 个**；Gateway 动态安装 **33 个 `remote.<namespace>`**（Desktop 默认组合装载 30 个）。`logger` 是 Context 能力，不是服务，不在表中。
> 本文件只回答“能 inject 什么、在哪一侧、默认有没有、找谁要 API”。UI 组件另见 [dsh-ui-primitives.md](./dsh-ui-primitives.md)；插件骨架与构建见 [../HANDBOOK.md](../HANDBOOK.md)。

## 0. 先记住七条

1. **`inject` 是激活门，不是 import**：声明即要求；缺少任何一个，插件保持 pending/不激活，`apply` 不会执行，也不会在模块加载时抛错。服务名写错与“服务不存在”表现相同。
2. **Host 与 Client 是两张独立服务表**：同一个名字不保证同一套 API。`connection`、`sessions`、`jobs`、`remoteAccess`、`typert`、`productAnalytics`、`inspector` 两侧都有，但实现和用途不同。
3. **服务名是运行时字符串，不是 TypeScript 类型**：拼写错误不会被编译器发现。`inject` 数组写在模块顶层，不能写进 `apply` 内部。
4. **`logger` 不需要 inject**：它是 Context 能力。`timer` 两侧都有（Host 来自 `cordis-plugin-timer`，Client 由 `dsh-cordis-client-runner` 重新提供）；Host 另有 Cordis `loader`。三者都不占业务服务计数。
5. **`remote.<namespace>` 是动态服务**：由 `dsh-api-gateway` 按 Remote 描述安装，不是普通包静态 provide。业务插件优先用 `sessions`、`workspaces`、`jobs` 等包装服务，不要直接拼 `ctx.remote.session.*`。
6. **默认组合 = `dsh-base` + `dsh-web-app` + 用户插件**：asar 里存在某个包，不等于它已进入 profile。实验包、终端包、插件市场等都必须先加入 profile 才会提供对应服务。
7. **选服务优先级**：业务服务（`workspaceRegistry`、`sessionController`、`uiWorkspace`、`slots`）> Remote 控制器（`*Controller`）> `remote.*` > 底层 `connection` / `fs` / `shell`。能用高层就不要碰底层，除非你在写新的接入层。

## 1. 使用契约

### 1.1 Host 插件

你给的片段就是标准形态：

```js
export const name = 'plugin-sessions';

/** Required Host services: the /api route registry and both data domains. */
export const inject = ['connection', 'workspaceRegistry', 'sessionController'];

export function apply(ctx) {
  ctx.effect(() => ctx.connection.fetch.register({
    path: '/api/sessions',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: async (request) => Response.json({ rows: [] }),
  }), 'plugin-sessions: sessions route');
}
```

逐项对应：

| 服务 | 在这个插件里的职责 |
|------|--------------------|
| `connection` | 注册精确 `/api/sessions` Fetch 路由，继承 Host/Origin 与浏览器鉴权栅栏 |
| `workspaceRegistry` | 读取工作区列表、归档集合、pin 状态 |
| `sessionController` | 读取会话行（标题、更新时间、运行/空会话状态） |

- 三者都是**必需依赖**。缺任意一个，插件不会激活，路由也不会注册。
- `ctx.effect(..., label)` 负责清理。`fetch.register` 本身返回 disposer，必须交给 effect；不要只调用不保存。
- Host 服务的 `ctx.foo` 只有在 `inject` 声明后才可靠。直接读一个未声明且缺失的服务会抛 `cannot get property "foo" without inject`；服务恰好存在时可能读到，但不会登记为依赖，热重载/替换后会失效。

### 1.2 Client 插件

Client 插件由 `window.__ModuleLoader__.load({ id, factory })` 装载，factory 返回 `{ inject, apply }`。源码入口通常是 `src/client/index.tsx`：

```ts
export const inject = ['slots', 'locale', 'uiWorkspace', 'sessions', 'conversation'];

export function apply(ctx: ClientContext) {
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: 'plugin-example',
    order: 1,
    label: 'Example',
  }, Icon));
}
```

注意两个不同的 `inject`：

| 位置 | 内容 | 作用 |
|------|------|------|
| 插件 `package.json` 的 `dsh.client.inject` | **包 ID**，如 `@deepseek-ai/dsh-client-locale` | 浏览器模块的加载/排序依赖 |
| Client 入口导出的 `inject` | **服务名**，如 `'locale'` | Cordis 激活门；缺服务则插件 pending |

### 1.3 可选依赖与延迟绑定

不要为了“可能用不到”把核心服务写成可选。确实可选时：

```js
export function apply(ctx) {
  // 不阻塞父插件；settings 就绪后才执行回调
  ctx.inject(['settings'], (scope) => {
    scope.effect(() => scope.settings.configure({ auto: false }, scope.fiber), 'settings policy');
  });
}
```

- 嵌套 `ctx.inject([...], callback)` 是 waitpoint：父插件保持激活，回调在依赖满足后执行；回调里的 `scope` 才是带该服务的上下文。
- `ctx.get('settings')` 在服务缺失时返回 `undefined`，且**不会**把依赖登记进 `inject`。只适合探测可选能力，不要拿它替代声明。
- 不要用 `ctx.get(name, false)` 绕过未就绪检查做常规依赖注入；那会让生命周期与热替换失配。

## 2. 默认组合与可用性

Desktop 当前 profile：

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-plugin-amuro",
        "dsh-plugin-sessions",
        "dsh-plugin-whiteboard"
      ]
    }
  }
}
```

`dsh-base` 提供核心 Host 能力，`dsh-web-app` 提供浏览器 surface、控制器、Gateway 与工作区/终端 UI。

| 侧 | 数量 | 构成 |
|----|-----:|------|
| Host | 100 | 98 个业务服务 + 2 个框架服务（`loader`、`timer`） |
| Client | 39 | 含 `timer`，不含 `loader` |
| Gateway | 33 | 动态 `remote.<namespace>`；Desktop 默认装载 30 个 |

**服务定义包**和**默认实现包**经常不是同一个：

| 服务 | 定义包 | Desktop 默认实现 |
|------|--------|------------------|
| `fs` | `dsh-fs` | `dsh-fs-sandbox`（内部组合 `dsh-fs-local`） |
| `shell` | `dsh-shell` | `dsh-bash-sandbox` / `dsh-pwsh-sandbox` |
| `jobs` | `dsh-jobs` | `dsh-jobs-local` |
| `fileReferences` | `dsh-file-reference` | `dsh-file-reference-local` |
| `attachments` | `dsh-attachment` | `dsh-attachment-local` |
| `credentials` | `dsh-credentials` | `dsh-credentials-local` |
| `spillStore` | `dsh-spill` | `dsh-spill-local` |
| `subprocess` | `dsh-subprocess` | `dsh-subprocess-local` |
| `sandbox` | `dsh-sandbox` | `dsh-sandbox-local` |
| `sessionPersistence` | `dsh-session-persistence` | `dsh-session-persistence-jsonl` |
| `sessionQuery` | `dsh-session-query` | `dsh-session-query-sqlite` |
| `sessionTelemetry` | `dsh-session-telemetry` | `dsh-session-telemetry-otel` |
| `compaction` | `dsh-compaction` | `dsh-compaction-basic` |
| `workflowEngine` | `dsh-workflow` | `dsh-workflow-ptc` |
| `ptcRuntime` | `dsh-ptc-runtime` | `dsh-ptc-runtime-node` |
| `directoryPicker` | `dsh-host-directory-picker` | `dsh-host-directory-picker-auto` |
| `deepseekAccount` | `dsh-deepseek-account` | `dsh-deepseek-account-platform` |
| `storage` | `dsh-storage` | `dsh-storage-json` + `dsh-storage-domain` |

非默认、需要额外加入 profile 才会出现的服务：

| 侧 | 服务 |
|----|------|
| Host | `agentTeams`、`cotTranslation`、`inspector`、`pluginMarket`、`speechController`、`speechToText`、`terminals`、`translator`、`worktrees` |
| Client | `inspector` |

特别注意 `terminals`：Desktop 的终端 UI 与 `terminalController` / `webTerminals` 默认存在，但 Host 的 `ctx.terminals` 属于实验终端包，默认**没有**。写终端功能先看 `terminalController`，不要假设 `terminals` 可 inject。

## 3. Host 服务目录（98）

> provider 省略 `@deepseek-ai/` 前缀。用途列只回答“什么时候需要它”，精确 API 见 §6。

### 3.1 接入、传输与授权（9）

| 服务 | provider | 用途 |
|------|----------|------|
| `connection` | `dsh-client-connection` | `/api` Fetch 路由与 RPC 通道注册；Host/Origin 与浏览器鉴权入口 |
| `webServer` | `dsh-host-webserver` | 宿主 HTTP/HTTPS 服务器、协议、监听信息 |
| `remoteAccess` | `dsh-api-remote-access` | 非 owner Peer 的方法级访问控制 |
| `typert` | `dsh-typert-registry` | 跨进程服务的类型/方法描述注册表 |
| `typertGateway` | `dsh-api-gateway` | 把 Remote 描述挂载为 `remote.<namespace>` |
| `clientModules` | `dsh-client-modules` | 浏览器插件模块清单与加载 |
| `fileUploads` | `dsh-client-file-upload` | 上传通道的 Host 半边 |
| `webApp` | `dsh-web-app` | Web 应用组合入口/运行时标记 |
| `authorization` | `dsh-authorization` | 权限策略判定 |

### 3.2 配置、凭证与存储（8）

| 服务 | provider | 用途 |
|------|----------|------|
| `settings` | `dsh-settings` | 插件设置命名空间、自动设置页策略、读写 profile 配置 |
| `configEditor` | `dsh-config-editor` | 原生配置文件定位与编辑 |
| `credentials` | `dsh-credentials` | 凭证解析、写入、记录管理 |
| `storage` | `dsh-storage` | KV/域存储后端入口 |
| `storageDomain` | `dsh-storage-domain` | **域子上下文内**的强类型数据域；不在根上下文 |
| `spillStore` | `dsh-spill` | 大文本落盘与回收 |
| `deepseekAccount` | `dsh-deepseek-account` | DeepSeek 账户状态与令牌 |
| `deepseekLlmApiExtensions` | `dsh-deepseek-llm-api-extensions` | DeepSeek 模型 API 扩展参数 |

### 3.3 工作区、文件与执行（11）

| 服务 | provider | 用途 |
|------|----------|------|
| `workspaceRegistry` | `dsh-workspace` | 工作区列表、会话归属、归档/pin 状态 |
| `workspaceFiles` | `dsh-api-workspace-files` | 工作区相对路径的文件读取与变更 |
| `directoryPicker` | `dsh-host-directory-picker` | 原生目录选择或浏览式目录选择能力 |
| `fileReferences` | `dsh-file-reference` | 文件引用解析与去重 |
| `attachments` | `dsh-attachment` | 图片/文件附件的校验、落盘与引用 |
| `fs` | `dsh-fs` | 受沙箱约束的文件系统读写 |
| `shell` | `dsh-shell` | 受沙箱约束的命令执行 |
| `shellEnv` | `dsh-shell-env` | shell 环境变量/路径解析 |
| `subprocess` | `dsh-subprocess` | 长驻子进程管理 |
| `workingDirectory` | `dsh-working-directory` | 当前工作目录解析 |
| `workspaceChanges` | `dsh-workspace-changes` | 工作区变更聚合 |

### 3.4 会话与 Agent（8）

| 服务 | provider | 用途 |
|------|----------|------|
| `sessions` | `dsh-session` | Host 会话存储：创建、进入、fork、消息投影 |
| `agents` | `dsh-agent` | Agent 创建、恢复、当前 initiator 上下文 |
| `agentLoop` | `dsh-agent-loop` | Agent 主循环 |
| `agentPresets` | `dsh-agent-preset-registry` | Agent 预设目录 |
| `agentDefaultModel` | `dsh-agent-default-model` | 默认模型选择 |
| `subagents` | `dsh-subagent` | 子 Agent 编排 |
| `goals` | `dsh-goal` | 会话目标 |
| `planMode` | `dsh-plan-mode` | Plan 模式状态与控制 |

### 3.5 会话周边与后台（17）

| 服务 | provider | 用途 |
|------|----------|------|
| `sessionProjections` | `dsh-session-projection` | 消息投影注册与快照 |
| `sessionProjectionCache` | `dsh-session-projection-cache` | 投影缓存 |
| `sessionQuery` | `dsh-session-query` | 跨会话/事件查询与标题读取 |
| `sessionPersistence` | `dsh-session-persistence` | 追加式会话日志持久化 |
| `sessionTitle` | `dsh-session-title` | 会话标题生成与刷新 |
| `sessionTelemetry` | `dsh-session-telemetry` | 会话遥测记录 |
| `sessionFeedback` | `dsh-command-feedback` | 命令/会话级反馈 |
| `messageFeedback` | `dsh-message-feedback` | 单条消息点赞/点踩 |
| `sessionReferenceResolver` | `dsh-session-reference` | 会话引用解析 |
| `sessionFileReferences` | `dsh-api-session-controller` | 会话内的文件引用 |
| `sessionSkillCatalog` | `dsh-api-session-controller` | 会话可用技能目录 |
| `compaction` | `dsh-compaction` | 上下文压缩 |
| `tokenMeter` | `dsh-token-meter` | token 估算与计量 |
| `systemPrompt` | `dsh-system-prompt` | 系统提示词分段与变量 |
| `toolResultPruner` | `dsh-compaction-tool-result-pruner` | 工具结果裁剪 |
| `schedule` | `dsh-schedule` | 定时任务 |
| `jobs` | `dsh-jobs` | 后台任务启动、查询、终止 |

### 3.6 工具、模型与交互（14）

| 服务 | provider | 用途 |
|------|----------|------|
| `tools` | `dsh-tools` | 注册/限制/执行模型工具 |
| `commands` | `dsh-commands` | slash 命令注册与执行 |
| `llm` | `dsh-llm` | 模型目录、调用准备、流式响应 |
| `web` | `dsh-web` | 网页抓取与搜索 |
| `userQuestions` | `dsh-user-questions` | 向用户提问并等待回答 |
| `approval` | `dsh-user-approval` | 工具/操作审批策略与决策 |
| `permissionPresets` | `dsh-permission-presets` | 只读/工作区写/完全访问等预设 |
| `sandbox` | `dsh-sandbox` | 沙箱能力与状态 |
| `sandboxPolicy` | `dsh-sandbox-policy` | 当前沙箱策略解析 |
| `officeToPdf` | `dsh-office-to-pdf` | Office 文档转 PDF |
| `ptcRuntime` | `dsh-ptc-runtime` | PTC 工具运行时 |
| `workflowEngine` | `dsh-workflow` | 工作流执行 |
| `skills` | `dsh-skill` | 技能注册与 provider |
| `mcpResources` | `dsh-mcp-resources` | MCP 资源/工具注册与请求 |

### 3.7 Remote API 控制器（8）

| 服务 | provider | 用途 |
|------|----------|------|
| `accountController` | `dsh-api-account-controller` | `remote.account` 的 Host 实现 |
| `credentialsController` | `dsh-api-settings-controller` | `remote.credentials` |
| `directoryPickerController` | `dsh-api-workspace-controller` | `remote.directoryPicker` |
| `jobController` | `dsh-api-job-controller` | `remote.job` |
| `sessionController` | `dsh-api-session-controller` | `remote.session`；会话列表/创建/提示词 |
| `settingsController` | `dsh-api-settings-controller` | `remote.settings` |
| `terminalController` | `dsh-api-terminal-controller` | `remote.terminal` |
| `workspaceController` | `dsh-api-workspace-controller` | `remote.workspace` |

这些是 Remote API 层。业务插件通常直接用 `workspaceRegistry`、`sessions` 等核心服务；只有写跨端 API 或需要与浏览器同构时才 inject 控制器。

### 3.8 运行时与插件框架（14）

| 服务 | provider | 用途 |
|------|----------|------|
| `appReady` | `dsh-cmdline` | 应用启动完成信号 |
| `appExit` | `dsh-cmdline` | 退出请求/清理 |
| `cmdlineArgs` | `dsh-cmdline` | 命令行参数 |
| `dshHomePath` | `dsh-app-boot` | DSH home 路径 |
| `pluginPackages` | `dsh-app-boot` | 已安装插件包信息 |
| `pluginManager` | `dsh-plugin-manager` | 插件安装/启停 |
| `pluginInventory` | `dsh-host-plugin-inventory` | 插件清单快照 |
| `pluginRegistryProbe` | `dsh-client-ui-plugin-manager` | 插件注册探测 |
| `hmr` | `dsh-hmr` | 插件热替换 |
| `otel` | `dsh-otel` | OpenTelemetry 运行时 |
| `productTelemetry` | `dsh-host-product-telemetry-otel` | Host 产品遥测 |
| `productAnalytics` | `dsh-client-product-analytics` | 产品分析（Desktop 组合） |
| `cordisInspect` | `dsh-cordis-host-runner` | Cordis 运行时检查 |
| `dynamicCordisRunner` | `dsh-cordis-host-runner` | 动态 Cordis 脚本执行 |

### 3.9 实验与可选（9）

| 服务 | provider | 说明 |
|------|----------|------|
| `agentTeams` | `dsh-experimental-agent-team` | 多 Agent 团队；需实验包 |
| `cotTranslation` | `dsh-experimental-client-ui-cot-translation` | CoT 翻译；需实验包 |
| `inspector` | `dsh-experimental-inspector` | 检查器；两侧都有实验实现 |
| `pluginMarket` | `dsh-plugin-market` | 插件市场；需额外包 |
| `speechController` | `dsh-experimental-api-speech-to-text` | 语音 API 控制器 |
| `speechToText` | `dsh-experimental-speech-to-text` | 语音转写 |
| `terminals` | `dsh-terminal` | 实验终端服务；不是默认终端功能 |
| `translator` | `dsh-experimental-translator` | 翻译 |
| `worktrees` | `dsh-experimental-worktree` | Git worktree 管理 |

### 3.10 框架服务（2，不计入 98）

| 服务 | provider | 说明 |
|------|----------|------|
| `loader` | `cordis-plugin-loader` | Cordis 插件加载器；Host 可用 |
| `timer` | `cordis-plugin-timer` | Host 定时器；Client 由 `dsh-cordis-client-runner` 另提供同名服务 |

## 4. Client 服务目录（39）

> provider 同样省略 `@deepseek-ai/`。Client 服务只在浏览器模块的 factory `inject` 中有效。

### 4.1 渲染、布局与导航（13）

| 服务 | provider | 用途 |
|------|----------|------|
| `slots` | `dsh-client-ui-renderer` | slot 注册与渲染；侧栏、主区、设置页的扩展点 |
| `uiRenderer` | `dsh-client-ui-renderer` | 根渲染器；通常只给 `dsh-web-app` 用 |
| `layout` | `dsh-client-ui-layout` | 主面板选择、侧栏开合、右栏导航 |
| `theme` | `dsh-client-ui-theme` | 主题状态与切换 |
| `locale` | `dsh-client-locale` | 注册词典、绑定 namespace、解析文案 |
| `shortcuts` | `dsh-client-shortcuts` | 快捷键注册与分发 |
| `commandUi` | `dsh-client-ui-commands` | 命令面板条目注册与装饰 |
| `inputTriggers` | `dsh-client-ui-input-trigger` | 输入框触发器（@、/ 等） |
| `configForms` | `dsh-client-ui-settings` | 设置表单读取、校验、保存 |
| `settingsSchema` | `dsh-client-ui-settings` | 设置 schema 的路径读写工具 |
| `pluginNavigation` | `dsh-client-ui-plugin-manager` | 插件页导航 |
| `sidebarRight` | `dsh-client-ui-sidebar-right` | 右侧栏打开/关闭/分屏/浮动 |
| `sidebarRightTabs` | `dsh-client-ui-sidebar-right` | 右侧栏 tab 类型注册表 |

### 4.2 会话、工作区与传输（13）

| 服务 | provider | 用途 |
|------|----------|------|
| `sessions` | `dsh-api-session-controller` | 浏览器会话 store、绑定、scope、创建/fork |
| `workspaces` | `dsh-api-workspace-controller` | 浏览器工作区 store 与便捷操作 |
| `uiWorkspace` | `dsh-client-ui-workspace` | 打开会话/工作区、启动会话、目录选择 |
| `uiSession` | `dsh-client-ui-session` | 会话与 UI 的绑定、pending interaction、发布 |
| `uiConversation` | `dsh-client-ui-conversation` | 会话视图注册、事件注册、图片 URL |
| `conversation` | `dsh-client-ui-conversation` | 会话输入/消息/send/cancel；根上只有单例，操作需 scope |
| `webTerminals` | `dsh-api-terminal-controller` | 浏览器终端标签与 PTY |
| `jobs` | `dsh-api-job-controller` | 浏览器后台任务观察与控制 |
| `remote` | `dsh-api-gateway` | `remote.<namespace>` 的挂载点 |
| `remoteAccess` | `dsh-api-remote-access` | 浏览器侧访问控制 Hook |
| `typert` | `dsh-typert-registry` | 浏览器侧类型/方法描述 |
| `connection` | `dsh-client-connection` | 浏览器连接状态、重连、WebSocket、generation |
| `modules` | `dsh-client-modules` | 浏览器模块清单 |

### 4.3 内容与功能注册（12）

| 服务 | provider | 用途 |
|------|----------|------|
| `fileUpload` | `dsh-client-file-upload` | 浏览器文件上传队列 |
| `modelDirectories` | `dsh-client-ui-model-selection` | 模型目录 UI 数据 |
| `chatFileMentions` | `dsh-client-ui-deliverables` | 聊天文件提及 |
| `feedbackUi` | `dsh-client-ui-message-feedback` | 消息反馈 UI |
| `userQuestionPanels` | `dsh-client-ui-user-questions` | 用户提问面板 |
| `documentPreviews` | `dsh-client-ui-sidebar-documentpreview` | 文档预览类型 |
| `sessionLogDownload` | `dsh-session-log-export` | 会话日志下载 |
| `resources` | `dsh-client-resources` | 资源地址注册、pin、source |
| `timer` | `dsh-cordis-client-runner` | 浏览器定时器 |
| `cordisInspect` | `dsh-cordis-client-runner` | 浏览器 Cordis 检查 |
| `dynamicCordisRunner` | `dsh-cordis-client-runner` | 浏览器动态脚本 |
| `productAnalytics` | `dsh-client-product-analytics` | 浏览器产品分析 |

### 4.4 实验与可选（1）

| 服务 | provider | 说明 |
|------|----------|------|
| `inspector` | `dsh-experimental-inspector` | 浏览器检查器；需实验包 |

## 5. `remote.<namespace>`（33）

`dsh-api-gateway` 读取生成的 Typert Remote 描述，为每个命名空间安装一个动态服务。它们**不是**普通包静态 provide，也没有 JS Proxy；`ctx.remote.session` 只在 Gateway 与对应 Host 控制器都激活时存在。

| namespace | 典型用途 |
|-----------|----------|
| `account` | 账户状态与登录 |
| `agentPresets` | Agent 预设 |
| `commands` | slash 命令 |
| `cotTranslation` | CoT 翻译（实验） |
| `credentials` | 凭证记录 |
| `directoryPicker` | 目录选择/浏览 |
| `dynamicCordisRunner` | 动态 Cordis 脚本（诊断） |
| `fileReferences` | 文件引用 |
| `fileUploads` | 上传 |
| `goals` | 会话目标 |
| `job` | 后台任务 |
| `llm` | 模型目录与调用 |
| `messageFeedback` | 消息反馈 |
| `officeToPdf` | Office 转 PDF |
| `permissionPresets` | 权限预设 |
| `pluginInventory` | 插件清单 |
| `pluginManager` | 插件管理 |
| `pluginMarket` | 插件市场（实验） |
| `pluginRegistryProbe` | 插件注册探测 |
| `productAnalytics` | 产品分析 |
| `remoteAccess` | 远程访问控制 |
| `schedule` | 定时任务 |
| `session` | 会话主入口 |
| `sessionFeedback` | 会话反馈 |
| `sessionReferenceResolver` | 会话引用解析 |
| `settings` | 设置 |
| `skills` | 技能 |
| `speech` | 语音转写（实验） |
| `subagents` | 子 Agent |
| `terminal` | 终端 |
| `userQuestions` | 用户提问 |
| `workspace` | 工作区 |
| `workspaceFiles` | 工作区文件 |

Desktop 默认组合装载 **30 个**；`cotTranslation`、`speech`、`pluginMarket` 需要额外启用对应实验/市场包。产品分析仅在 Desktop profile 启用。

消费建议：

- 浏览器里读会话/工作区/任务，优先用 `sessions`、`workspaces`、`jobs`、`webTerminals` 这些包装服务，它们把 scope、store、错误处理都封好了。
- `ctx.remote.<ns>` 返回的是 Host 控制器的方法描述；方法签名由 Typert 生成，改动控制器就会变。业务插件不要把它当作稳定内部 API。
- 需要判断可选命名空间时用 `ctx.get('remote')?.session` 之类的探测，并把缺失当成功能不可用，而不是崩溃。

## 6. 高频服务 API 速查

### 6.1 `connection`

Host：

| 成员 | 行为 |
|------|------|
| `fetch.register({ path, methods, requestBody, fetch })` | 注册精确 `/api/...` 路由；`requestBody`: `buffered` / `streaming`；返回 disposer；重复 path 直接抛错；路由属于调用方 effect；非 owner Peer 返回 403 |
| `rpc.handle(channel, handler)` | 注册前缀 RPC 通道；`rpc.intercept(channel, matches, handler)` 做拦截 |
| `admit(request)` | 执行 Host/Origin + 鉴权，返回 `{ peer }` 或 `{ rejection: 401/403 }` |
| `requestRejection(request)` | `admit` 的拒绝码或 `undefined` |
| `createPeer(options)` | 创建进程内 Peer；`browserPeer` 是所有已认证浏览器共享的 owner Peer |
| `admitConnection(request)` | API socket 所有权认领；`isTrusted(request)` 只做 Host/Origin 栅栏 |

```js
ctx.effect(() => ctx.connection.fetch.register({
  path: '/api/example',
  methods: ['GET', 'POST'],
  requestBody: 'buffered',
  fetch: async (request) => Response.json({ ok: true }),
}), 'example: route');
```

Client：

| 成员 | 行为 |
|------|------|
| `generation.getSnapshot()` / `subscribe()` | 当前连接代次；代次变化意味着重连 |
| `state.getSnapshot()` / `subscribe()` | 连接状态 |
| `reconnect()` | 请求重连 |
| `openWebSocket(path)` | 打开同源 WebSocket |
| `isLoopback` | 是否本地回环宿主 |
| `registerGenerationSource(source)` | 注册代次来源；只能注册一个 |
| `start(sinks, config)` | 启动流循环；只能有一个 owner |
| `rpc` | 原始 RPC 通道；通常改用 `remote.*` |
| `interactions` | 交互参与模式 |

Client `connection` **没有** `fetch.register`。不要照搬 Host 路由代码。

### 6.2 工作区与文件

`workspaceRegistry`（Host）：

| 成员 | 行为 |
|------|------|
| `create(path, title)` / `initializeDefault(resolveDirectory)` | 创建工作区 / 初始化默认工作区 |
| `get(id)` / `list()` | 同步读取单个 / 全部工作区 |
| `delete(id)` / `insertBefore(id, beforeId)` | 删除 / 调整顺序 |
| `archiveSession(id, options)` / `unarchiveSession(id)` | 归档 / 取消归档 |
| `pinSession(id)` / `unpinSession(id)` | pin / 取消 pin |
| `sessionKnown(id)` / `stopSessionActivity(id)` / `resolveByPath(path)` | 会话是否存在 / 停止活动 / 按路径查找 |
| `archivedSessionIds` / `pinnedSessionIds` | 当前集合（getter） |

工作区实体至少含 `{ id, title, path, sessionIds }`。`list()` 与 `get()` 是同步的；写操作是异步的。

`workspaceFiles`（Host，下表省略首参 `workspaceFileScope`）：

| 成员 | 行为 |
|------|------|
| `read(path)` / `readBytes(path)` | 读文本 / 字节 |
| `stat(path)` / `list(path)` | 元信息 / 目录列表 |
| `changes(path)` | 变更信息 |
| `relativePath(path)` / `inspect(path)` / `locateFile(path)` | 相对路径 / 检查 / 定位 |

`directoryPicker.capability()` 返回判别联合：

- `{ kind: 'native', pick(signal) }`：弹系统目录选择器；
- `{ kind: 'browse', list(path, signal), createDirectory(path, name) }`：应用内浏览。

未知 `kind` 应隐藏入口，不要抛错。

`fs` / `shell` 是沙箱约束后的底层能力：

```js
const target = await ctx.fs.resolve(path);
await ctx.fs.readText(target);
await ctx.fs.writeText(target, text);
const spec = await ctx.shell.resolve({ command: 'git', args: ['status'] });
await ctx.shell.execute(spec);
```

`fs` 主力方法：`resolve`、`stat`、`lstat`、`readText`、`streamText`、`readBytes`、`readByteRange`、`listDir`、`writeText`、`editText`、`watch`；`shell` 的核心是 `resolve`、`execute`，另有 `sandboxMode`。两者都带 `sandboxMode` 能力标记。

### 6.3 会话与 Agent（Host）

`sessions` 是 Host 会话存储：

| 成员 | 行为 |
|------|------|
| `create` / `prepare` / `enter` / `detachEntered` | 创建、准备、进入、分离 |
| `announce` / `flush` | 发布 / 刷盘 |
| `get` / `list` / `fork` | 读取 / 列表 / fork |
| `registerMessageProjection` / `messageProjections` | 消息投影注册与读取 |

`sessionController` 是会话 API 层，也是浏览器 `sessions` 的 Host 对端：

| 成员 | 行为 |
|------|------|
| `list(request, signal)` | 返回 `{ items }`；行含 `sessionId`、`updatedAt`、`running`、`blank`、`projections` |
| `search` / `create` / `rename` / `fork` | 搜索、创建、重命名、fork |
| `selectModel` / `initializeDefaultModel` / `modelCatalog` | 模型选择与目录 |
| `canOpenWorkspacePath` / `workspaceDesktop` / `openWorkspacePath` / `workspacePathApplications` | 工作区路径能力 |
| `prompt` / `attachment` / `updateQueue` / `cancel` | 发送、附件、队列、取消 |
| `page` / `follow` / `projections` / `control` / `inspect` | 分页、跟随、投影、控制、检查 |

标题不要假设在平铺字段上：列表行是投影结构，常见读法是 `row.projections.values.title`。

`agents`：`create`、`resume`、`get`、`currentInitiator`、`requireInitiator`、`withInitiator`、`withoutInitiator`、`setFactory`。需要“当前是谁触发的”时用 initiator 系列，不要自己传全局状态。

`sessionQuery` 实测方法：

| 成员 | 行为 |
|------|------|
| `listSessions` / `filterSessions` | 会话列表 / 条件过滤 |
| `readSession` / `readTitle` / `readTitleSnapshot` / `readTitleSnapshots` | 读会话 / 标题 |
| `listEvents` / `filterEvents` / `readEvent` / `readSurface` | 事件读取与过滤 |
| `observeSession` / `traceSession` / `traceEvent` | 观察 / 追踪 |

### 6.4 会话、工作区与 Conversation（Client）

`sessions`（Client）：

| 成员 | 行为 |
|------|------|
| `retain(target, { source, signal })` / `using(target, options, op)` / `retainInfo(id)` | 保留会话 / 使用会话 / 保留信息。**options 必填**；target 可为 sessionId 字符串或 subagent 地址；返回 `{ sessionId, binding, ready, release() }`；signal abort 只 reject `ready`，不自动释放，仍需 `release()`（2026-10-26 实读订正签名） |
| `binding(id)` | 返回绑定；**可能为 `undefined`** |
| `scope(id)` / `scopeOf(id)` / `sessionOf(id)` | 取会话 scope / 反查 |
| `create` / `fork` / `search` / `refresh` / `refreshProjections` | 创建、fork、搜索、刷新。`create(opts)` resolve 为 sessionId 字符串、失败抛 `SessionCreateError`、**不导航**；opts 的 `workspaceId`/`cwd` 互斥，不带 `sessionId` 时 Host 恒铸造新会话（2026-10-26 实读补充） |

store 读取：`ctx.sessions.list.getSnapshot()`，含 `byId` 与 `phase`。

`workspaces`（Client）：`create`、`initializeDefault`、`rename`、`delete`、`insertBefore`、`archiveSession`、`unarchiveSession`、`pinSession`、`unpinSession`、`insertSessionBefore`。store：`ctx.workspaces.list.getSnapshot()`，含 `items`、`phase`、`pinnedSessionIds`、`archivedSessionIds`。

`uiWorkspace`：

| 成员 | 行为 |
|------|------|
| `openSession(target)` | 只提交导航；不创建、不校验会话 |
| `openWorkspace(id, beforeOpen?, options?)` / `openWorkspaceSession(...)` | 打开工作区 / 工作区内会话 |
| `startSession(workspaceId?, options?)` | 新建会话；支持 `prompt`、`clearPreviousDraft`、`whenDraftExists`、`agentPreset` |
| `forkSession` / `archiveSession` / `unarchiveSession` / `pinSession` / `unpinSession` | 会话操作 |
| `listDirectory` / `pickDirectory` / `createDirectory` / `createNamed` | 目录浏览与创建 |
| `replaceMain` / `clearMain` / `watchNavigation` | 主面板替换/清空、导航观察 |

`uiSession`：`provide(descriptor)`、`bindingSource`、`registerPendingInteraction`、`materialize`、`publishMain`、`publishStatus`。这是宿主级绑定层，普通面板插件优先用 `uiWorkspace` / `sessions`。

`uiConversation`：

| 成员 | 行为 |
|------|------|
| `binding(source)` | 按来源取该会话的视图 |
| `events.register` / `events.registerFallback` | 注册事件渲染 |
| `views.register` | 注册视图 |
| `userText.register` | 注册用户文本转换规则 |
| `imageUrl` / `seedImageUrl` | 图片地址 |
| `inspectRequestPrompt` / `inspectSystemPrompt` | 检查请求/系统提示词 |

`conversation` 是根单例，但操作按会话 scope 寻址：

```ts
const binding = ctx.sessions.binding(sessionId);
if (binding) {
  ctx.conversation.input.requestDraftInitialization(binding, { prompt: '...' });
}

const scoped = ctx.sessions.scope(sessionId)?.conversation;
scoped?.send(...);
```

根上下文调用 `send` / `updateQueue` / `cancel` / `loadOlder` 会抛：`conversation.<op> requires a session scope — address one via ctx.sessions.scope(id).conversation`。

### 6.5 UI 扩展点

`slots`：

| 成员 | 行为 |
|------|------|
| `inject(name, callback)` | 等待 slot 就绪后执行注册；回调返回 disposer |
| `register(meta, component)` | 注册条目；`meta` 至少含 `name`，主区可用 `key` |
| `entries(name)` / `renderSlot` / `spec` / `snapshot` / `subscribe` | 读取/渲染/观察 |
| `provideRoot` / `installScope` / `installLocale` | 宿主内部使用 |

真实注册形态：

```ts
ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
  name: 'sidebar.panellist',
  id: 'plugin-example',
  order: 1,
  label: 'Example',
}, Icon));

ctx.slots.inject('main', () => ctx.slots.register({
  name: 'main',
  key: 'plugin-example',
}, () => <ExamplePage />));
```

`resources`：`register(provider)`、`pin(address, signal)`、`source(address)`。资源地址必须符合 `dsh-resource://` 约定。

`sidebarRight`（2026-10-26 补充硬性前提：右栏是"每个**在屏会话**一个停靠面"，onScreen 仅在主视图是官方会话页即 `activePanelId === null` 时设置；插件主面板下无 surface，`openResource` 抛 `sidebarRight: no session surface is mounted`。插件面板内嵌对话不要用本服务，走 HANDBOOK §4.9 的 L4 路径）：

| 成员 | 行为 |
|------|------|
| `openResource(address, options?)` / `openTab(kind, options?)` | 在屏会话打开 |
| `openResourceIn(sessionId, ...)` / `openTabIn(sessionId, ...)` | 指定会话打开 |
| `closeIn(sessionId, tabId)` / `close(tabId)` | 关闭 |
| `active()` / `isExpanded()` / `toggleExpanded()` / `toggleFullscreen()` | 状态与开合 |
| `focus(tabId)` / `split(...)` / `float(...)` / `dock(...)` | 焦点、分屏、浮动、停靠 |
| `mounted` / `openTabs` | 在屏会话 store / 打开标签 store |

`sidebarRightTabs`：`register(definition)`、`entries()`、`get(kind)`、`claim(address, kind)`、`enter(kind, entry)`、`leave(kind, slot, entry)`、`active()`。

`layout`：`selectPanel(panelId)`、`beginNavigation()`、`toggleSidebar()`、`openRightbar(track, fullscreen)`、`closeRightbar()`；`panelInfo` 是快照 store（`getSnapshot` / `subscribe`），不是方法。

`locale`：`register(ns, { zh, en })`、`addLanguage(input)`、`bind(ns)`、`resolveText(text)`。`bind` 返回的 `t()` 是同步查表；词典对象按 locale 版本稳定引用，避免每次渲染新建。

`commandUi`：`register`、`decorate`、`dismiss`。`inputTriggers`：`registerSource`。

`configForms`：`get(entryId)`、`whileServed(namespaces, register)`、`describe()`；`developerTools` 是属性。`settingsSchema`：`rehydrate`、`validate`、`nodeAtPath`、`getPath`、`hasPath`、`setPath`、`deletePath`。

### 6.6 设置、凭证、工具与模型

`settings`（Host，建议按可选处理）：

| 成员 | 行为 |
|------|------|
| `configure(presentation, owner?)` | 注册本插件实例的自动设置页策略；返回 disposer；`owner` 传当前 `ctx.fiber` |
| `describe(options?)` | 读取所有活动插件表单与实时值 |
| `update(ns, patch, expectedRevision?)` / `replace(ns, section, expectedRevision?)` / `mutate(ns, ops, expectedRevision?)` | 写 profile |
| `schema(entry)` / `writable` / `documentPath` | schema / 可写性 / 文档路径 |

`credentials`：`resolve`、`set`、`unset`、`describe`、`readRecord`、`describeRecord`、`listRecords`、`modifyRecord`、`deleteRecord`。

`tools`：`register(defineTool({...}))`、`restrict(filter)`、`guard(guard)`、`get(name, scope)`、`schemas(scope)`、`execute`、`presentAs`。`defineTool` 从 `@deepseek-ai/dsh-tools` 导入。

`commands`：`register(definition)`、`registerFileReceiptResolver`、`list(agent)`、`find(agent, name)`、`execute(agent, line, attachments, signal)`、`view(agent)`。命令对象至少含 `{ definitionId, name, description, handler }`。

`llm`：`listProviders`、`listModels`、`resolveModelInfo`、`prepareCall`、`stream`、`imageRequestPricing`、`fileRequestText`。

### 6.7 交互与后台

| 服务 | 关键 API |
|------|----------|
| `schedule` | `create`、`list`、`catalog`、`history`、`delete`、`update` |
| `jobs` | `start`、`kill`、`list`、`get` |
| `goals` | `get`、`create`、`edit`、`pause`、`resume`、`complete`、`block`、`clear` |
| `permissionPresets` | `names`、`catalog()`、`current(session)`、`derive(state)`、`resolve(name)`、`set(session, name)`、`apply(session, name, setApproval)`、`pinInitialPermission(session)` |
| `userQuestions` | `ask`、`askTimed`、`attachWait`、`answer`、`releaseReply`、`continued` |
| `approval` | `request(req)`、`setPolicy(agent, policy)`、`effectivePolicy(session)`、`decide(req, session)` |
| `attachments` | `validateImageBatch`、`saveImages`、`admitEncodedFile`、`isAttachmentError`、`readImageRequest`、`saveFile`、`saveFileStream`；`imageLimits` 是属性 |
| `web` | `fetch`、`search` |
| `officeToPdf` | `convert` |
| `configEditor` | `edit` |
| `spillStore` | `saveText` |

会话周边服务的常用入口：

| 服务 | 关键 API |
|------|----------|
| `sessionProjections` | `register`、`snapshot` |
| `sessionPersistence` | `create`、`list`、`stat`、`open`、`flush` |
| `sessionTitle` | `refresh`、`register` |
| `sessionTelemetry` | `emit`、`shutdown` |
| `tokenMeter` | `estimateMessage`、`measure` |
| `systemPrompt` | `getSectionOrder`、`section`、`suppressRuntimeContext`、`variable` |
| `skills` | `register`、`registerProvider` |
| `mcpResources` | `register`、`registerTools`、`request` |

### 6.8 Client 任务与终端

`jobs`（Client）：`watchRows`、`observe`、`acquire`、`kill`。它观察的是 Host 的 `jobs`，不是另起一套任务。

`webTerminals`：`view`、`inventory`、`launchShells`、`selectShell`、`close`、`retainTabs`、`hold`、`release`、`recover`。终端 UI 自己管理 xterm 实例；Host `terminals` 服务默认不存在，见 §2。

## 7. 选型速查

| 需求 | 选择 | 理由 |
|------|------|------|
| 新增 `/api` 路由 | `connection`（Host） | 唯一官方 Fetch 注册点，自带鉴权栅栏 |
| 列工作区/读归档状态 | `workspaceRegistry`（Host） | 同步读、领域单一 |
| 列会话/建会话/发提示词 | `sessionController`（Host） | 会话 API 层，浏览器对端稳定 |
| 浏览器跳到某个会话 | `uiWorkspace` | 封装导航与主面板 |
| 浏览器读会话状态 | `sessions`（Client） | store + binding + scope |
| 编辑输入框草稿 | `conversation.input` + `sessions.binding` | 唯一的草稿初始化入口 |
| 侧栏入口 | `slots` | `sidebar.panellist` 是标准 seat |
| 主区域页面 | `slots` | `main` 用 `key` 区分 |
| 右侧面板 | `sidebarRight` + `sidebarRightTabs` | 打开、分屏、tab 类型注册；**前提是主视图在屏会话**（插件主面板下不可用，见 §6.5） |
| 插件设置页 | `configForms` / `settingsSchema` | 表单模型与 schema 工具 |
| Host 插件配置 | `settings`（可选） | 自动设置页策略；缺失时功能降级 |
| 凭证 | `credentials` | 不要自己读文件 |
| 文件读写 | `fs` / `workspaceFiles` | 前者通用沙箱，后者工作区相对路径 |
| 执行命令 | `shell` | 不要直接 `child_process` |
| 注册模型工具 | `tools` + `defineTool` | schema、权限、结果呈现统一 |
| 注册 slash 命令 | `commands` | 与命令面板/执行链一致 |
| 调模型 | `llm` | 不要绕过 provider 直连 |
| 向用户提问 | `userQuestions` | 有等待、超时、恢复协议 |
| 审批 | `approval` / `permissionPresets` | 不要自造权限枚举 |
| 跨端 API | `remote.<ns>` 或 `*Controller` | 仅当核心服务不够时 |
| 定时任务 | `schedule` | 不要自己 setInterval 持久化 |
| 后台任务 | `jobs` | 有生命周期与观察接口 |
| 技能/MCP | `skills` / `mcpResources` | 官方注册面 |

## 8. 行为边界与坑

- **缺依赖是静默 pending**：不只是 `apply` 不跑，插件在 Cordis 面板里可能只显示 inactive。服务名拼错、包未加入 profile、同名服务在另一侧，表现都一样。
- **不要直接读 `ctx.foo` 代替 inject**：缺失时抛 `cannot get property "foo" without inject`；存在时虽然能读，但不登记依赖，热替换后会拿到旧/空引用。
- **同名不同物**：`connection`、`sessions`、`jobs`、`remoteAccess`、`typert`、`productAnalytics`、`inspector` 两侧都有；`fileUploads`（Host）vs `fileUpload`（Client）；`clientModules`（Host）vs `modules`（Client）；`conversation`（Client 根单例）vs `uiConversation`；`workspaceRegistry`（Host 核心）vs `workspaceController`（Remote API）vs `workspaces`（Client store）；`sessionController`（Host API）vs Host `sessions`（存储）vs Client `sessions`（store）。
- **两个 inject 不是一回事**：`package.json` 的 `dsh.client.inject` 是包 ID，决定浏览器模块加载顺序；入口导出的 `inject` 是服务名，决定 Cordis 激活。
- **asar 存在 ≠ 已启用**：`dsh-terminal`、`dsh-experimental-*`、`dsh-plugin-market` 都在安装包里，但 Desktop profile 没装它们。inject 后插件会一直 pending。
- **`terminals` 不是默认终端**：默认终端功能走 `terminalController` / `webTerminals`。Host `terminals` 属于实验包。
- **路由必须精确**：`connection.fetch.register` 的 `path` 是完整 `/api/...`；重复 path 抛错；路由随 effect 释放；非 owner Peer 访问返回 403。
- **`workspaceRegistry.list()` 是同步的**：不要 `await` 它；写操作才是异步。`sessionController.list()` 是异步的，返回 `{ items }`，不是数组。
- **会话标题在投影里**：`row.projections.values.title`，不要假设 `row.title`。不同投影可能没有标题。
- **`uiWorkspace.openSession` 只导航**：它不创建会话、不验证 id。创建用 `startSession` 或 `sessionController.create`。
- **`ctx.sessions.binding(id)` 可能为空**：先判空再取 `conversation` / scope；会话被释放或尚未 retain 时就是 `undefined`。
- **`conversation` 根上不能发消息**：`send` / `updateQueue` / `cancel` / `loadOlder` 都要求 session scope；用 `ctx.sessions.scope(id).conversation`，或只调用 `conversation.input.requestDraftInitialization(binding, ...)`。
- **`storageDomain` 不在根上**：它由 `dsh-storage-domain` 在域子上下文里 provide；根插件 inject 不到，必须通过 `ctx.storage.domain(name)` 进入。
- **`settings` 要按可选处理**：`configure` 返回 disposer，必须包在 effect 里；`owner` 传当前 `ctx.fiber`。不要把设置读取放在 `apply` 顶层同步执行。
- **`remote.*` 的存在性依赖组合**：Gateway 或控制器缺失时该 namespace 不存在；用 `ctx.get` 探测并降级，不要假定 33 个永远齐全。
- **控制器不是业务 API**：`sessionController`、`workspaceController` 等是 Remote 层。能在 Host 用 `sessions` / `workspaceRegistry` 就不要用控制器。
- **`uiRenderer` 是宿主入口**：普通插件注册 `slots` 即可，不要自己 mount 根渲染器。
- **Client `timer` 与 Host `timer` 是两套实现**：同名但生命周期/宿主不同；不要跨端传递 timer 句柄。
- **`ctx.get` 不算依赖**：它返回 `undefined` 只是探测；靠它拿到的服务不参与激活与热替换。

## 9. 版本核对方法（维护者）

本文件锁定安装版 Desktop `0.2.1-rc.3`。升级后按以下步骤重核：

```bash
# 版本
defaults read "/Applications/DeepSeek Harness.app/Contents/Info.plist" CFBundleShortVersionString

# 解包安装版 asar
APP="/Applications/DeepSeek Harness.app/Contents/Resources/app.asar"
npx --yes @electron/asar extract "$APP" /tmp/dsh-asar
cd /tmp/dsh-asar/dsh/node_modules/@deepseek-ai
```

Host 服务名：

```bash
# 0.2.1-rc.3 原始 101 个；剔除 DECLINED、loader、timer 后为 98
grep -rhoE '(super\([^,]+,\s*"[A-Za-z][A-Za-z0-9]*"|\.(reflect\.)?provide\("[A-Za-z][A-Za-z0-9]*")' \
  */lib/index.js \
  | sed -E 's/.*"([A-Za-z][A-Za-z0-9]*)"/\1/' \
  | sort -u
```

Client 服务名：

```bash
# 0.2.1-rc.3 为 39（含 timer，不含 loader）
grep -rhoE '(super\([^,]+,\s*"[A-Za-z][A-Za-z0-9]*"|\.(reflect\.)?provide\("[A-Za-z][A-Za-z0-9]*")' \
  */lib/client.js */lib/client.browser.js \
  | sed -E 's/.*"([A-Za-z][A-Za-z0-9]*)"/\1/' \
  | sort -u
```

Remote 命名空间：

```bash
# 显式 namespace（0.2.1-rc.3 只有 13 个）
grep -rhoE 'namespace:\s*"[^"]+"' */lib/*.js \
  | sed -E 's/.*"([^"]+)"/\1/' | sort -u

# Remote service id（其余 namespace 由 controller 服务名推导）
grep -rhoE 'service:\s*"[^"]+"' */lib/*.js \
  | sed -E 's/.*"([^"]+)"/\1/' | sort -u
```

默认组合：

```bash
jq -r '.dsh.profile.bundles[]' ~/.dsh/profiles/desktop/package.json

# 两个 bundle 实际装载的包行
grep -hoE "name: '@deepseek-ai/[^']+'" \
  dsh-base/cordis.patch.yml dsh-web-app/cordis.patch.yml \
  | sed -E "s/name: '//; s/'//" | sort -u > /tmp/active-pkgs.txt

# 某个 provider 是否默认启用
grep -F '@deepseek-ai/dsh-settings' /tmp/active-pkgs.txt
```

核对要点：

1. `lib/index.js` 是 Host 入口，`lib/client.js` / `lib/client.browser.js` 是浏览器入口；同一包可能在两侧注册不同服务。
2. `super(ctx, "name")` 是最常见的服务注册；还要检查 `ctx.reflect.provide("name")`、`ctx.provide("name")`、`rootCtx.reflect.provide("name")`。
3. Error 子类的 `super(message, "CODE")` 会污染扫描结果，必须人工剔除全大写业务码（本版是 `DECLINED`）。
4. 服务定义包与默认实现包要分开记；`dsh-base` / `dsh-web-app` 里出现的是**组合行**，实现可能由另一个 `*-local` / `*-sandbox` / `*-sqlite` 包提供。
5. `remote` 的 namespace 不是 1:1 对应 service id：`sessionController`、`sessionFileReferences`、`sessionSkillCatalog` 等共享 `session` 命名空间。以 Gateway 实际安装结果为准。
6. 安装版与 npm 包版本可能不一致；本文件以 `/Applications/DeepSeek Harness.app` 内的 asar 为准，并在文件顶部更新适用版本。
