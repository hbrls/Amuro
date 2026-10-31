---
name: deepseek-desktop-plugin
description: "DeepSeek Desktop 插件（dsh-plugin-*）的最小骨架、安装、加载链路验证、卡片/会话召唤、样式体系（Tailwind + CSS Modules）的接入规范"
metadata:
  version: 0.0.2
---

# DeepSeek Desktop 插件手册

## 定位

本手册记录 DeepSeek Desktop 插件（包名 `dsh-plugin-*`）的最小落地形态、加载链路、调试手段，以及「卡片界面 + 官方会话召唤」的接入规范。§1-§5、§7-§8 的结论均已在 `dsh-plugin-amuro` 骨架上实测验证；§6 样式体系为 2026-10-23 定稿，实施状态以该节开头注记为准。

本文不解释 Desktop 内部架构的推导过程；那些细节见 `.context/AppHost.md` 和 asar 源码里的 `@deepseek-ai/dsh-client-modules` 实现。§9 补充已验证的 Codex 外部开发与桌面界面验收流程。开头的「UI 布局概念」是与 slot 名同构的界面地图，建议先读；后文只引用它，不再重复展开。

## UI 布局概念

Desktop 的界面是一张三列骨架，主区在「官方会话」与「插件面板」之间二选一。slot 名大量直接取自这张骨架（`sidebar.*`、`main`、`rightbar`、`conversation.*`），先建立地图再读后面的 slot 表。

### 三列骨架（`dsh-client-ui-layout` 的 `AppFrame`）

| 区域 | slot | 说明 |
|------|------|------|
| 左侧栏 | `sidebar`（single, root） | 品牌区、面板列表、会话列表、底部动作与设置 |
| 主区 | `main`（keyed, root） | `activePanelId === null` 时渲染 key 为 `conversation` 的官方会话；否则渲染被选中的插件面板 |
| 右侧栏 | `rightbar`（single, root） | 一条可伸缩轨道（300px–70%，默认 45%，可全屏）；占位者把面板贴在 frame 右缘 |
| 外围 | `shell.bottom` / `shell.overlay` / `shell.leading` | 底部条、浮层、导航左侧座位，插件日常不用 |

- 左栏宽度 264–420（默认 280）；折叠态保留 56px 图标轨，macOS 上该列收为 0、切换按钮移到 `shell.leading`。窗口宽度 < 1024 自动折叠，⌘B 切换。
- `activePanelId` 是唯一的「当前主页面」状态：`layout.selectPanel(key)` 进插件面板，`selectPanel(null)` 回会话；`uiWorkspace.openSession` 的 reveal 路径已内含后者。
- 右侧栏只在主视图是官方会话时挂载（`activePanelId === null`）；插件主面板下调用 `sidebarRight.openResource` 会抛 `no session surface is mounted`。

### 「面板」与「会话」

- **面板**指主区的一张全局页面：`main` 的 keyed entry，key 由插件自定。左侧 `sidebar.panellist`（list）条目的 `id` 就是这张面板的 key，点击等于 `selectPanel(id)`；它只是切换器，不是页面本体。
- **会话**指某个 Session 的对话界面：`main` 的 `conversation` key 由官方 `dsh-client-ui-conversation` 注册（子项 `main.conversation`），插件不接管。插件放自己的页面就注册新 key；要回到会话，走 `selectPanel(null)` 或 `openSession`。
- 左栏没有名为 chat 的 slot：`sidebar.chat` / `sidebar.chat.conversation` 属于右侧栏的子代理聊天 tab（见下文），左侧的会话入口是 `sidebar.workspaces` 列表。

### 会话区内部

```text
main (key=conversation)
└─ main.conversation
   ├─ conversation.header          会话标题、视图 tab、操作/工具区
   └─ conversation.content         工厂：按 hero / active 排布
      ├─ conversation.session      消息/视图区（single, session）
      │  └─ conversation.view      list：chat 等视图，官方 chat 视图的 target 是 "chat"
      ├─ conversation.composer.bar 输入卡片（single, session-maybe）
      │  ├─ conversation.input.attachments / .overlay / .permission / .plan
      │  ├─ conversation.input.left / .right   工具区两侧（list, session）
      │  ├─ conversation.input.model           模型选择器（single, session）
      │  │  └─ conversation.input.model.label  模型文案（single, inline, session）
      │  ├─ conversation.input.activity        可展开活动区（single, session）
      │  └─ conversation.composer.dock         卡片下方的 dock 行（list，仅 active 相）
      ├─ conversation.input.dock    输入卡片上方的 dock 区（list）
      └─ conversation.hero.*        hero 专用：brand.mark / workspace / agentPreset / options
```

- `conversation.content` 是 **factory**：复用官方会话时用 `renderFactorySlot('conversation.content', { variant, phase, hero }, { slots: { views } })`；`variant: 'main' | 'embedded'`，`views` 决定 `conversation.session` 渲染哪个视图。
- `conversation.session` 是普通 slot：也可直接 `renderSlot('conversation.session', { view: 'chat' })`，等价于只渲染消息区、不带 header 与 composer。
- 同一会话的这套结构可能同时出现在主区、右侧栏 tab、插件抽屉里；`scope: 'session'` 的条目按会话解析，不是只对发起方生效。

### hero 与 active

| 概念 | 触发 | 排布 |
|------|------|------|
| **hero** | 会话还没有消息（`session.blank`）或 `sessionId` 缺省 | 内容居中：HeroShell（品牌图 + headline）→ workspace 行（工作区 chip、`hero.workspace`、`hero.agentPreset`、`hero.options` 靠右）→ `conversation.input.dock` → 输入卡片 |
| **active** | 已有消息、正在运行或有活动目标 | `conversation.session` 视图区滚动，composer 座位 sticky 吸底 |
| **settling** | 空会话正在加载 | composer 隐藏，等数据就绪 |

- hero 下 composer 的禁用条件是 `inert = hero && chipTitle === undefined`。workspaces 列表就绪后 `chipTitle` 只认工作区成员身份（cwd 目录标签只是列表未就绪窗口的兜底）；inert 时整张输入卡片被改造成工作区选择器触发器，点选即 `openWorkspace` 跳主视图——这是官方对「安置对话」的定义，不是 bug。官方 `startSession` 因此把目标解析的三级兜底全指向 workspace，解析不到就拒绝创建。嵌入场景的规避方式见 §4.9。
- 嵌入场景统一 `variant: 'embedded'`：排布不变，去掉主区 header 与宽度控制；容器必须是全高 flex，否则 hero 贴顶、active 不吸底。
- `hero.options` 只在会话存在时渲染；`sessionId` 缺省的空白视图不渲染 workspace 行上的 options 与 `input.dock`。

### 两个 dock

| slot | 位置 | 渲染阶段 | 官方占用 |
|------|------|----------|----------|
| `conversation.input.dock` | 输入卡片**上方**，composer 栈内 | 会话存在时的 hero 与 active | todo 面板、排队条 |
| `conversation.composer.dock` | 输入卡片**下方**的 dock 行（`data-composer-dock`），与 ContextMeter 同排 | 仅 active | Activity / Usage 小药丸 |

- 两者都是 `kind: 'list'`、`scope: 'session'`，支持 `id` / `order`。
- `conversation.input.dock` 的条目收到 zone props `{ session, input }`：会话或输入状态缺省时整个区域不渲染，所以条目要能容忍 `session` 为 `undefined`。`conversation.composer.dock` 以空 props 渲染，会话信息从 `scope: 'session'` 的上下文取。
- `conversation.hero.options` 位于 workspace 行末端靠右，空间紧凑；`input.left` / `input.right` 位于输入卡片工具区两侧，排列由官方 Composer 决定。Logo 与输入框之间没有通用 slot。

### 输入卡片工具区与 activity（2026-10-31，0.2.1-rc.5 实读）

`conversation.input.*` 是 `conversation.composer.bar` 的 children，不是 `conversation.session` 的直接 children。右下角从左到右的实际顺序为：

```text
conversation.input.right → conversation.input.model → conversation.input.activity
→ 停止按钮（特定状态）→ 发送按钮
```

| slot | kind / scope | zone props 与用途 |
|------|--------------|-------------------|
| `conversation.input.left` | `list`, `session` | 空 props；在权限、Plan 之后追加左侧工具条目 |
| `conversation.input.right` | `list`, `session` | 空 props；在模型选择器左侧追加按钮，支持 `id` / `order`，是普通右下角动作的默认接入点 |
| `conversation.input.model` | `single`, `session` | `{ locked }`；官方模型选择器占用，可整体替换，不用于追加按钮 |
| `conversation.input.model.label` | `single`, `inline`, `session` | `{ provider, model, placement, selected }`；定制模型文案，`placement` 为 `trigger` / `menu` / `option`，未定制时 fallback 为 `model.name` |
| `conversation.input.activity` | `single`, `session` | `{ locked, onActiveChange }`；“紧凑触发器 ↔ 展开活动行”专用座位，当前官方占用者是实验性语音输入 |

普通按钮注册形态：

```tsx
ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
  name: 'conversation.input.right',
  id: 'plugin-example-action',
  order: 10,
}, MyActionButton))
```

- `input.left` / `input.right` 只在 `sessionId` 与 input 状态都存在时渲染；条目不接收 `locked`，需按业务自行处理禁用态。Activity 展开时，左右工具与模型选择器所在的标准控件组整体隐藏。
- `input.activity` 的空闲态是麦克风等紧凑按钮；组件调用 `onActiveChange(true)` 后展开为录音波形、转写、取消/停止等整行 UI，并暂时接管工具行。它不是 Agent 运行状态指示器，也不是 `conversation.composer.dock` 的 Activity / Usage 药丸；不要用它堆普通按钮。
- 发送按钮没有独立扩展 slot；只在左侧追加动作时用 `input.right`，不要为追加按钮替换整个 `conversation.composer.bar`。

### 右侧栏与「侧栏里的对话」

- 右栏内容 = `rightbar.session`（single, session）→ `sidebar.right.pane.tab`（keyed, session）；tab 类型由 `sidebarRightTabs.register` 注册。官方包已提供引导（guide）、文档预览、文件、交付物、计划、终端、浏览器、子代理聊天等 tab（实验包另有会话检查器）。
- 「侧栏聊天」的官方先例是子代理：kind `subagentchat`，tab 标题文案键为 `sidebar.chat`（「聊天」/ Chat），内容 slot `sidebar.chat.conversation` 里渲染官方 `conversation.content`。它跟随主区在屏会话，不是独立聊天面板。
- 插件主面板下没有右栏停靠面；要在插件自己的页面里内嵌对话，走 §4.9 的 L4（插件容器 + `SessionProvider` + `renderFactorySlot`），不要用 `sidebarRight`。

### 术语速读

| 说法 | 落到代码 |
|------|----------|
| 左侧栏 / 面板列表 / 会话列表 | `sidebar` / `sidebar.panellist` / `sidebar.workspaces` |
| 主区、当前页面 | `main` keyed entry + `layout.panelInfo.activePanelId` |
| 插件面板 | `main` 的自定义 key；左侧 `sidebar.panellist` 的 `id` 与它一致 |
| 官方会话 | `main` 的 `conversation` key（`main.conversation`） |
| 消息区 / 视图 | `conversation.session` / `conversation.view`（chat 等） |
| Hero / Active | 空会话居中态 / 有消息后的常规态 |
| 输入卡片 | `conversation.composer.bar`（内部工具区与 `composer.dock`） |
| 右侧栏 / 右栏 tab | `rightbar` → `rightbar.session` → `sidebar.right.pane.tab` |
| 侧栏聊天 | `sidebar.chat`（标题键）/ `sidebar.chat.conversation`（子代理 tab 内容） |

> 证据：安装版 0.2.1-rc.3 的 `dsh-client-ui-layout`（三列宽高与 `activePanelId`）、`dsh-client-ui-sidebar`（`sidebar` 子 slot）、`dsh-client-ui-sidebar-right`（`rightbar` / `sidebar.right.pane.tab`）、`dsh-client-ui-conversation`（phase、slot 声明树、两个 dock 的 DOM 位置）、`dsh-client-ui-chat`（chat 视图与 composer.dock 占用）、`dsh-client-ui-subagent`（`sidebar.chat.conversation`）的 client bundle。

## 术语速查

| 术语 | 含义 |
|------|------|
| **Host 半** | Node 侧，运行在主进程；用 cordis 插件形态（`name` / `inject` / `apply(ctx)`）。负责 `/api/*` 路由、会话控制、logger 等 |
| **Client 半** | Renderer 侧，运行在浏览器；用 `window.__ModuleLoader__.load({ id, factory })` 注册懒加载工厂。负责 slot 注册、UI 渲染 |
| **Loader entry** | cordis 组合图里的一行；由 `cordis.patch.yml` 通过 `- insert: { id, name }` 登记。**插件必须显式 insert 才会被 host 扫到** |
| **Boot manifest** | `__DSH_BOOT__`，注入到 `/` 的 HTML 里；列出每个 client 插件的 id、bundle URL、rev、inject 依赖 |
| **Slot** | Client 侧的 UI 接入点（`sidebar.panellist`、`main`、`conversation.composer.dock` 等），通过 `ctx.slots.inject` 注入条目 |
| **基线模块表** | `PLATFORM_MODULES`，shell 冻结的 11 个共享模块 specifier（react、cordis、ui-primitives 等）；client bundle 的 `require` 只能解析这些，其余依赖必须内联打包。权威来源：官方仓库 `packages/client/web/src/platform.ts` |

---

## 1. 最小骨架（5 个文件）

实测可工作的最小插件由以下文件组成，全部放在 `packages/<your-plugin>/` 下：

```text
packages/dsh-plugin-amuro/
├── package.json          # 插件清单
├── cordis.patch.yml      # cordis Loader 入口（必须有 insert）
├── README.md             # 自描述，可选
└── lib/
    ├── index.js          # Host 半（构建版插件中由 src/index.js 拷贝生成，见 §5.2）
    └── client.js         # Client 半
```

### 1.1 `package.json`

```json
{
  "name": "dsh-plugin-<your-name>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./lib/index.js",
    "./client": "./lib/client.js"
  },
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    },
    "client": {
      "platform": "web",
      "immediately": true
    }
  }
}
```

**字段约束（实测验证）：**
- `dsh.client.platform` 必填，client 半的 `web` 是常用值
- `dsh.client.immediately` 控制启动时是否立即加载；本仓库 UI 插件暂用 `true`。⚠️ 官方约定（`packages/client/AGENTS.md`）：`immediately: true` 仅限基础设施行（stage-one-prefetch），业务面板建议省略以保持懒加载
- `dsh.bundle.patch` 指向 patch 文件；**patch 文件内容决定插件是否真的进入 Loader**，详见 §1.2
- `exports["./client"]` 是 host 用来定位 client bundle 的字段，必须是字符串或带 `default` 字段的对象

### 1.2 `cordis.patch.yml`（关键文件）

```yaml
- insert:
    - id: plugin-<your-name>
      name: 'dsh-plugin-<your-name>'
```

**这是本次实测踩到的最大坑：** patch 文件**不能是空数组 `[]` 或纯注释**。host 的 `webPlugins` 服务只扫 Loader entries，Loader entries 由 patch 的 `- insert` 显式登记。

| patch 内容 | 结果 |
|-----------|------|
| `[]` 或纯注释 | ❌ 插件不进 boot manifest；`/plugins/<id>/client.js` 404；插件管理器显示 "no components" |
| `- insert: [{ id, name }]` | ✅ 进 Loader；boot manifest 出现；renderer 能拉到 client.js |

### 1.3 `lib/index.js`（Host 半）

> **注意：以下是手写形态，用于理解产物契约。本仓库插件的 Host 半源码在 `src/index.js`，`lib/index.js` 由构建时原样拷贝生成（见 §5.2/§5.3），不要手改。**

```js
/**
 * Host half of the <your-name> plugin. <简短定位>.
 * 后续按需挂 /api/* 路由（ctx.connection.fetch.register）、
 * 会话钩子（sessionController）等。
 */

export const name = 'plugin-<your-name>';

export const inject = [];

export function apply(ctx) {
  ctx.logger.info('dsh-plugin-<your-name> host half loaded');
}
```

`apply(ctx)` 是注册 host 侧能力的入口。`ctx` 暴露 `logger`、`connection`、`sessionController` 等服务（按需 `inject` 进来）。

### 1.4 `lib/client.js`（Client 半）

> **注意：以下是手写形态，用于理解产物契约。本仓库插件已切换为 tsdown 构建（见 §5），`lib/client.js` 是构建产物，不要手改；源码在 `src/client/`。**

```js
window.__ModuleLoader__.load({
  id: 'dsh-plugin-<your-name>',
  factory: (require) => {
    const React = require('react');
    // TODO: 用项目主题图标替换占位
    const { IconPlayOutlineRegular } = require('@deepseek-ai/dsh-client-ui-primitives');

    const h = React.createElement;

    // Sidebar 图标
    const Icon = ({ size }) => h(IconPlayOutlineRegular, { size });

    // Main slot 页面
    function Page() {
      return h('div', {
        style: {
          flex: 1,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--dsw-alias-label-primary, inherit)',
        },
      }, 'Hello <YourName>');
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        // Sidebar 入口
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'plugin-<your-name>',
          order: 1,
          label: '<YourName>',
        }, Icon));

        // Main keyed slot
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'plugin-<your-name>',
        }, () => h(Page)));
      },
    };
  },
});
```

**约束：**
- `React.createElement` 必须用别名 `h` 调用（client.js 不走 JSX）
- `require('react')` 走 host 的基线模块表，**不要**额外装 react 或 import 别名
- `require('@deepseek-ai/dsh-client-ui-primitives')` 可直接用——它在 11 项基线模块表内，**不需要** `dsh.client.external` 声明；只有基线外的共享模块才需要声明（2026-10-22 查证官方 `platform.ts` 修正此条，旧版手册说法作废）。可用组件见 §6.7
- `factory` 必须返回 `{ inject, apply }`；`apply` 里只用 `ctx.effect` 注册副作用并返回清理函数，不要在 factory body 里跑副作用

---

## 2. 安装（只有 local link）

**本仓库有且只有一种安装/开发模式：在当前工作区开发，把同一个包目录以 `link:` 方式装进当前 dsh profile。** 没有发布模式，不发布到 npm 或任何公开源，也不使用 registry 包名、Git 仓库、tarball 或 `file:` 拷贝安装。

**安装必须由 dsh 自行完成。** Codex 负责准备符合本手册的源码、清单、patch 与构建产物；用户在 dsh 侧栏「插件」页用包的绝对目录发起安装并启用。Codex 不调用 `dsh` CLI 或 `plugin_manager` 代装，也不修改 profile 的 `package.json`、bundles、锁文件或手建软链接。仓库开发依赖的安装与插件安装到 dsh 是两件事，前者仍按 §5.5 处理。

安装完成后，profile 中该依赖的值形如 `link:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-whiteboard`；插件详情页应显示同一路径：

```text
Source
Code source   link:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-whiteboard
```

完整流程（安装前条件、界面步骤、落盘结果、只读验证、故障排查、禁止事项）见 [references/install-local.md](references/install-local.md)。

### 2.1 重启

安装或启用后，涉及 manifest / Loader 的变更仍需 recomposition 或**重启 Desktop GUI** 才会生效。文档原话：

> Two edits made directly to files during a session are judged only at the next recomposition or startup.

涉及文件：
- `cordis.patch.yml`（新增 insert）
- `package.json`（dsh.client 字段变更）
- `src/index.js`（Host 半；host 在激活/重启时才 import `lib/index.js`——2026-10-25 whiteboard 的 `ERR_MODULE_NOT_FOUND …/lib/index.js` 实证：产物缺失时整个插件激活失败、侧栏条目消失，补回产物后重试启用或重启恢复）

不能把安装或启用完成等同于运行中的 Host 已重新读取配置；界面出现「请重启 DSH 使更改生效」时按提示重启。原因码与更多排查见 [references/install-local.md](references/install-local.md)。

---

## 3. 加载链路验证

GUI 重启后，按以下三步验证插件真的进了 boot manifest：

### 3.1 抓 auth cookie

```bash
strings "$HOME/Library/Application Support/@deepseek-ai/dsh-desktop/Cookies" \
  | grep -oE 'dsh-auth-[^/]+' | head -1
```

返回的字符串形如 `dsh-auth-0exPercdGwj1vnIcTz9SFcRTWGd-owEQNWZc8Ax73_0v1.<base64>.<sig>`。

### 3.2 检查 boot manifest

```bash
COOKIE="<上一步拿到整串>"
COOKIE_VALUE=${COOKIE#dsh-auth-}   # 与 §8.3 同一写法：剥掉 dsh-auth- 前缀即 cookie 内容
curl -s -H "Cookie: ${COOKIE_VALUE}" \
  http://127.0.0.1:19387/ \
  | grep -oE '"id":"dsh-plugin-[^"]*"' | sort -u
```

预期看到你的 `dsh-plugin-<your-name>`。**没看到 = patch 没生效或 host 没扫到。**

### 3.3 检查 bundle 可达

```bash
curl -s -w "HTTP %{http_code}\n" \
  -H "Cookie: ${COOKIE_VALUE}" \
  -o /dev/null \
  "http://127.0.0.1:19387/plugins/dsh-plugin-<your-name>/client.js"
```

期望 `HTTP 200`。`404` 表示插件没在 host 的 bundle 表里。

### 3.4 在 GUI 里确认

- 左侧 sidebar 出现 `<YourName>` 条目
- 点击后 main slot 渲染 `Hello <YourName>`
- 插件管理器打开插件 → Components 区不再显示 "no components"

---

## 4. 卡片界面与会话召唤（来自原 Char.md）

### 4.1 形态

- 主界面：卡片化 UI，挂在 `main` keyed slot
- 功能优先界面化：Card 直接调数据写接口，理想情况下全程不需要对话
- 每个 Card 右上角有「唤出对话」入口，作为遇到问题时的兜底通道

### 4.2 数据链路

- Host 半注册 `/api/*` 路由（`ctx.connection.fetch.register`）
- Client 半 `fetch` 读写
- 卡片操作直接走写接口，不经过对话

### 4.3 会话策略（已定）

- **每次唤出 = 新建一个官方会话**，按业务对象/卡域完全隔离
- 不共享 Session，不共享 Memory
- 权限：**默认权限模式，普通权限给足**
- 会话 cwd 取数据所在目录，使 Agent 文件工具开箱可用
- Host 半用 `sessionController`（`session.create` / `session.prompt`）建会话、投递首条消息

### 4.4 唤出层级（按场景选用，可共存）

| 层 | 行为 | 适用场景 |
|----|------|---------|
| **L1 预填草稿（默认）** | 写入卡片上下文到输入框草稿，聚焦 composer，用户审核后发送。会话 scope 上 emit `slash/input-insert-text`，或会话 shell 的 `inputActions.setDraft` | 默认路径，所有卡片右上角入口走这条 |
| **L2 一键托管** | Host 半直接 `session.prompt` 发出「卡片上下文 + 求助模板」首条消息；客户端 `uiWorkspace.openSession(sessionId)` 跳转（`selectPanel(null)` 已内含在其 reveal 路径，见 §4.8）。**消息模板要求 Agent 先给方案再动手** | 仅用于语义明确的按钮 |
| **L3 右栏并排对话** | 照 ui-subagent 模式，`dsh-resource://` 资源 + Sidebar tab 内渲染 `conversation.content` Factory（固定 Chat view、省略主 Header），卡片页不跳转。**此路径要求主视图是官方会话页**——右栏只在 `activePanelId === null` 时挂载（见「UI 布局概念 › 三列骨架」），插件主面板下 `openResource` 抛 `no session surface is mounted` | 需要长驻对话辅助且发起方是会话页的场景 |
| **L4 插件容器内嵌对话** | 插件自绘容器（面板内抽屉、Dialog 等）+ `SessionProvider` + `renderFactorySlot('conversation.content', …)`，同样渲染官方 Factory、不跳转 | 主面板是插件页（非会话）时内嵌官方对话，契约见 §4.9 |

### 4.5 上下文载体（可叠加）

1. **消息内嵌快照**：卡片类型 + 关键字段 + 错误状态渲染成 Markdown。必做。
2. **数据接口指针**：消息中带 `/api/<plugin>/cards/<id>` 供 Agent 自取。
   - ⚠️ 待验证：`/api` 的 Host/Origin + 浏览器鉴权围栏是否挡住 Agent 侧请求，挡不住则改用快照内嵌。
3. **随包 skill**：教 Agent 数据 API 的读写语义与写操作约束。

### 4.6 反向通道

- Agent 经写接口改数据 → 卡片轮询/SSE 刷新
- 可选：Host 半监听会话事件，给卡片打「AI 处理中 / 已完成」徽标

### 4.7 非目标

- **不改造 Chat 对话框本体**
- **不跨卡片共享会话与记忆**

### 4.8 跳转到指定会话（uiWorkspace，2026-10-25 asar 查证）

插件内「按钮点击 → 跳进某个具体 Chat」的官方路径是 cordis 服务 **`uiWorkspace`**。证据全部来自本机 asar 构建产物实读：`@deepseek-ai/dsh-client-ui-workspace/lib/client.js` 的 `UiWorkspaceService extends cordis.Service`（`super(ctx, "uiWorkspace")` 注册具名服务），调用方 `dsh-client-ui-sidebar`（inject 列表含 `"uiWorkspace"`，会话行 `open` 即调它）与 `dsh-client-ui-conversation`（`ctx.get("uiWorkspace")`）。

**用法**（纯运行时服务注入，不是基线模块，零新依赖、不增加打包内容）：

```ts
export const inject = ['slots', 'uiWorkspace']
// 组件内：ctx.uiWorkspace.openSession(sessionId)
```

**行为**（`openSession(target)` → `replaceMain(target, signal, "reveal")`）：
1. `sessions.retain(target, { source: "mainView" })` 解析并持有会话
2. `selection.set({ sessionId, ... })` 切换主视图选中会话
3. `"reveal"` 路径内含 `layout.selectPanel(null)`——**从插件面板自动切回会话主视图**，不需要也不应该再手动 selectPanel

**`target` 两种形态**：sessionId 字符串跳普通会话；subagent address 对象跳子代理会话视图（`restoreSelection` 里有此用法）。

**配套 API（同一服务上）**：`startSession(workspaceId?, { prompt, agentPreset, ... })` 新建会话 + 预填草稿 + 直接跳转（L1/L2 的创建侧）；`forkSession`、`unarchiveSession`。

**边界与坑**：
- **归档会话**：sidebar 对归档项故意不调 `openSession`（弹 `archivedNotOpenable` 提示）；`openSession` 自身不检查归档。跳归档会话前先查 `workspaces.list.getSnapshot().archivedSessionIds`，归档了就先 `unarchiveSession` 或给提示
- **目标会话已删除**：`sessions.retain` 会抛，调用侧 `try/catch` 兜底，别让按钮点击炸掉页面
- 校验会话是否存在：`inject: ['sessions']` 后读 `ctx.sessions.list.getSnapshot().byId`
- 会话与卡片/节点的绑定关系（哪个 sessionId 属于哪个业务对象）由插件自己的数据层持久化，宿主不管

**落地实例**：`dsh-plugin-sessions` 表格 State 列（2026-10-25）——归档行纯文字，活跃行 `<Button>` 点击 `openSession(row.sessionId)` 跳进对应 Chat。

### 4.9 插件容器内嵌官方对话（2026-10-26 asar 查证 + whiteboard 实测）

在插件自己的面板/抽屉/Dialog 里嵌入**官方真实对话**（官方消息区 + 官方 Composer，可输入、发送、收流式回复、继续对话），全程不跳主视图。完整配方（与官方 ui-subagent 的嵌入用法同构，证据：`dsh-client-ui-subagent/lib/client.js` L755-838、`dsh-client-ui-conversation/lib/client.js`）：

```tsx
// 1) 建会话（不导航；不带 sessionId 时 Host 恒铸造新会话；workspaceId/cwd 互斥——
//    产品层只传 workspaceId，cwd 是底层设计不外露）
const sessionId = await ctx.sessions.create({ workspaceId })
// 2) 持有引用（options 必填；signal abort 只 reject ready，引用必须显式 release()）
const reference = ctx.sessions.retain(sessionId, { source: 'my-plugin:inlineChat', signal })
// 3) 显式绑定 session scope 并渲染官方 Factory
<SessionProvider session={reference}>
  {renderSlot('my-plugin.chat', {})}   // 该 slot 的内容组件里：
  // renderFactorySlot('conversation.content',
  //   { variant: 'embedded', phase, hero },
  //   { slots: { views: FixedChatConversationView } })  // = renderSlot('conversation.session', { view: 'chat' })
</SessionProvider>
```

**slot 机制要点**（`dsh-client-ui-renderer`）：`main` entry 的 `children` 声明表提供 `renderSlot`/`SessionProvider`；**factory 名不要写进 children**（只会造出同名死 slot，factory 由 `renderFactorySlot` 按名解析）；slot 组件 props 里**没有 ctx**（kit 只有标准 hooks + render* + SessionProvider），宿主服务从 `apply`/`ctx.inject` 闭包捕获传下去；`slots.register` 要求 slot 名已被某 entry 的 children 声明，`slots.inject(name, cb)` 会等声明出现。

**空白会话的硬规则**：composer 何时退化成工作区选择器，机制见「UI 布局概念 › hero 与 active」。对嵌入只落成一条规则——**空白会话创建时必须带 `workspaceId`**（或调用方对 hero 做可解析门控），否则用户一点输入框就跳主视图；`hero=false` 时 composer 恒可用且无品牌区。

**容器 CSS 契约**：factory 根高度是 `flex:1`（`.body`），只在**全高 flex 父容器**里生效；slot 锚点是 `display:contents`（不产生盒子，不用管）。官方嵌入容器的写法（ui-subagent 包内原文）：`{ width:100%; min-width:0; height:100%; min-height:0; display:flex }`。容器是块级时对话区塌缩成内容高度——hero 无法垂直居中（看起来"贴顶"），active 相 composer 不吸底、长对话不滚动。

**生命周期**：`reference.release()` 幂等，计数归零即 retireScope 关流；容器卸载/关闭时必须 release。嵌入渲染与发送只要求 reference 处于 retained 状态，与主视图显示什么无关。

**扩展官方 Chat / Composer**：只通过已声明的 conversation slots 扩展（各区域的名称、位置与渲染阶段见「UI 布局概念 › hero 与 active / 两个 dock」），不替换 Factory、不自行绘制输入区；`conversation.hero.brand.mark` 只用于替换品牌图形。

白板插件的演示只在 `conversation.input.dock` 保留一个会话动作「结束讨论」（`id: 'whiteboard-end-discussion'`，`order: 90`），**不替换 Composer**：点击时从 zone props 取 `session.sessionId`，`sessions.binding(sessionId)` 拿到绑定，再以 `conversation.input.requestDraftInitialization(binding, { prompt, whenDraftExists: 'append' })` 把提示词追加进当前会话草稿，等用户审阅后自行发送。`whenDraftExists: 'append'` 演示的是不覆盖用户已输入内容的合并方式。Hero、Left、Right 演示按钮已移除；这些扩展点仍可通过同名 slot 注册条目。

这些 slot 名是宿主全局的，`scope: 'session'` 按会话解析，不等同于只对某个插件的抽屉生效。若功能必须限定在插件持有的会话，组件里要核对拿到的会话标识并过滤，避免出现在其他 Chat 中。

---

## 5. 构建与热加载（tsdown，2026-10-22 重写）

### 5.1 官方结论

官方仓库 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 是公开的，构建体系已查证：

- **插件 client bundle 的官方构建工具是 tsdown**（rolldown 系），共享预设是 `packages/client/tsdown.client.ts` 的 `clientBundle()`；每个官方插件一个三行 `tsdown.config.ts`，scripts 约定 `"bundle": "tsdown"` / `"watch": "tsdown --watch"`，版本 pin `0.22.x`
- **Vite 在官方只用于构建 shell 前端**（`apps/web`），插件 bundle 明确不走 Vite——官方预设注释原话：*"Plugin code is fetched outside Vite's module graph"*
- 本仓库 `dsh-plugin-amuro`、`dsh-plugin-whiteboard` 已按官方契约接入（Light 复刻，去掉 typert/纯度门禁/workspace 编排等 monorepo 专属部分）

### 5.2 构建版插件的文件结构

```text
packages/dsh-plugin-<name>/
├── package.json        # + scripts: bundle/watch；+ devDeps: tsdown 0.22.14 及 §6 样式体系五件套
├── tsdown.config.ts    # Light 复刻官方 clientBundle 契约；id 从 package.json 读，零改动可复制给新插件
├── tsconfig.json       # jsx: react-jsx（automatic runtime）
├── src/
│   ├── index.js            # Host 半源码（手写，纳 git 跟踪）
│   ├── css-modules.d.ts    # *.module.css 类型声明（§6.4）
│   └── client/             # Client 半源码：index.tsx（inject/apply）+ 组件 + styles.css（Tailwind 入口）+ *.module.css（业务样式）
└── lib/                # 100% 构建产物，整体 gitignore（packages/dsh-*/lib/），删光也能 pnpm bundle 重建
    ├── index.js        # writeBundle 从 src/index.js 原样拷贝（不经 bundler，保持 Node ESM）
    └── client.js       # tsdown 输出，不要手改
```

> 2026-10-25 起 Host 半走 `src/index.js → lib/index.js` 构建流程。动因：whiteboard 的手写 `lib/index.js` 被误删且 `lib/` 不入 git，无记录可恢复，host 激活报 `ERR_MODULE_NOT_FOUND` 整插件掉落。源码入 `src/` 后，`lib/` 全目录都是产物，`.gitignore` 的 `packages/dsh-*/lib/` 规则无需例外。

### 5.3 产物契约（tsdown.config.ts 要点）

- `format: 'cjs'`、`platform: 'browser'`、`target: 'es2024'`、sourcemap、`dts: false`、**`clean: false`**（失败构建不炸掉 `lib/` 里上一份完整产物；2026-10-25 前的旧理由"保护手写的 lib/index.js"已随 Host 半入 `src/` 作废）
- wrapper 三件套（outputOptions）：
  - `banner`: `window.__ModuleLoader__.load({ id: "<包名>", factory: (require) => {`
  - `intro`: `var module = { exports: {} }; var exports = module.exports;`
  - `footer`: `return module.exports; } });`
  - 注入的是**代码**不是注释，不受 minify 剥注释影响
- externals：11 项基线 `neverBundle`（`react`、`react/jsx-runtime`、`react-dom`、`react-dom/client`、`@deepseek-ai/cordis`、`zod`、`@tanstack/react-virtual`、`@deepseek-ai/dsh-client-store`、`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-ui-primitives`、`@deepseek-ai/dsh-client-ui-dockkit`），其余一律 `alwaysBundle` 内联（官方规则："Silence means a private copy"）
- CSS：`.css` import 经虚拟模块插件编译为内联 JS，factory 物化时注入 `<style data-plugin="<包名>" data-plugin-css="<包名>/<文件>">`。**不能用 `@tsdown/css`**——它抽取独立 `style.css`，Host 只服务 JS bundle，且 HMR 热替换时要按 `data-plugin` 标记精确清除该插件的样式。样式体系的两层规则（Tailwind 布局 + CSS Modules 业务）与 modules 管线移植见 §6
- **`writeBundle` mtime stamp**：把 `client.js` mtime 拨到 `max(now, mtime+1)`，保证 Host 的 stat 轮询必见版本前进（官方预设同款 5 行，必须抄）
- **`writeBundle` Host 半拷贝**（`dsh-host-half-copy` 插件）：`copyFile(src/index.js → lib/index.js)`，原样拷贝不经 bundler——Host 半是 Node 侧 ESM，保持手写形态；`exports["."]` 指向该产物。`bundle` 与 `watch` 都覆盖；注意 Host 半不在 client entry 的依赖图里，改 `src/index.js` 不会触发 watch 重建（依 watch 机制推导，未单独实测），需手动 `pnpm bundle` + 重启 GUI（Host 半不热更）
- tsdown 无 dev server 概念，`--watch` 仅做增量重建；插件热加载不需要 dev server（见下）

### 5.4 热加载机制（修正旧结论）

**热加载完全由 dsh 自己负责**，插件侧唯一职责是重写 `lib/client.js`：

```text
tsdown --watch 重写 lib/client.js
  → Host webserver stat 轮询（mtime/ctime/size 判版本，默认 500ms）
  → /plugins/events SSE 广播 rebuilt 帧
  → 浏览器（dsh-client-hmr）：作废旧模块 → 预取新 bundle → 排空旧 fiber
    → 清除该插件拥有的 <style> → 物化新 exports → 重新挂载
```

- **不需要 `pnpm run dev:web`**——那只是 dsh monorepo 内部的四合一编排脚本（tsc watch + tsdown watch + vite build --watch + dsh web），外部插件用不到
- 官方 `scripts/dev-web.ts` 原话：*"the host webserver stat-polls the bundles it serves and broadcasts rebuilt frames itself, so any process that rewrites lib/client.js files triggers reloads"*
- `link:` 安装的插件，Host 服务的就是仓库里的文件本体，`tsdown --watch` 直接命中
- 热替换后插件内 React 状态重置；会话、工作区、连接状态保留；依赖它的插件会级联重载
- ⚠️ **旧结论"无 dev:web 不热更"作废**：那是 dsh 源码 checkout 内插件的场景（源码需先编译）；外部 link 插件只要产物被重写就热更。旧版手册 §5 表格第一行据此删除
- ⚠️ **bundle 内容变更热更，但 manifest 级变更仍需重启**：`cordis.patch.yml`、`package.json`（`dsh.client` 字段、`exports`）的修改只在下次 recomposition 或 GUI 重启时生效
- **开发回路**：dsh 自行完成本地 link 安装后，在插件目录下 `pnpm watch`，改 `src/client/` → GUI 无刷新热替换。Codex 使用的是同一套机制，只需遵守构建产物契约，无需额外接入或特殊处理。

### 5.5 pnpm 与沙箱（实测）

- **仓库是 pnpm workspace**（2026-10-23 起）：根 `pnpm-workspace.yaml`（成员 `packages/*`）+ 根最小 `package.json`；根 `.npmrc` 设 `shared-workspace-lockfile=false`，**lockfile 按包各自落在 `packages/*/pnpm-lock.yaml`**（2026-10-23 修正：此前"lockfile 只有根一份"的记载作废），依赖提升到根 `node_modules/.pnpm`
- **装依赖在仓库根用 filter，不要进插件目录单独 install**：
  ```bash
  pnpm --filter dsh-plugin-<name> install            # 装/同步某插件全部依赖
  pnpm --filter dsh-plugin-<name> add -D <pkg>       # 给某插件加 devDep
  ```
- pnpm 默认走全局共享 store（本机 `~/Library/pnpm/store`）；install 前做**硬链接探针**判定能否链到全局 store。探针失败的兜底落点是**包所在文件系统的挂载点** `<挂载点>/.pnpm-store/v3`（pnpm 源码 `storePathRelativeToHome` 实测查证）——本机仓库在系统卷上，兜底路径是 `/.pnpm-store/v3`，**永远不在仓库内**，无需 gitignore
- **workspace-write 沙箱下 `pnpm install` 直接失败**：全局 store 目录写不进去（探针败），挂载点兜底 `/.pnpm-store` 也在沙箱外，无处可退。装依赖需要 Full access 会话或用户在终端执行
- **日常 `pnpm bundle` / `pnpm watch` 不需要全局权限**：只写 workspace 内 `lib/`；沙箱管写不管读，读 `node_modules` 和全局 store 不受限
- 分工：**用户终端装依赖（根目录 `--filter` install/add），Agent 负责 `src/` 开发与构建**；Agent 需要新依赖时改 package.json 后交给用户安装
- 沙箱三档：`read-only` / `workspace-write` / `danger-full-access`；`/permission` 命令或 composer 权限控件切换当前会话（持久），Settings → General 改未来会话默认
- 仓库根 `.gitignore` 需含 `node_modules/`（已具备；`.pnpm-store` 不会出现在仓库内，见上文挂载点结论）

---

## 6. 样式体系（Tailwind + CSS Modules，2026-10-23 定稿）

> 状态：§6.1 为已查证的官方事实；§6.2-6.6 已于 2026-10-23 在 `dsh-plugin-amuro` 与 `dsh-plugin-whiteboard` 全量落地并实测通过（产物验收 + watch 热更 + 第三方库 CSS 接入）。
> 目标只有一条：**引入 utils 提升书写效率与可读性，不改写 UI**。全盘接受 dsh 设计 token，无自有风格、无别名层。

### 6.1 官方事实（三路查证：官方仓库 lockfile / 官方文档 / 本机 asar）

- **官方 doctrine**：`docs/web-styling.md`（权威，`packages/client/AGENTS.md` 指定）原话：*"Use CSS Modules and `clsx`; **do not add a component library or Tailwind**. Use `--dsw-alias-*` semantic tokens… Do not copy static palette values or write literal colors."*
- **宿主没有任何 utility 框架**：官方全仓 pnpm-lock.yaml 中 `tailwind`/`unocss`/`emotion`/`styled-components`/`sass` 均 0 命中；asar 内 `--spacing` 0 命中、`--tw-` 1 命中。
- **dsh 无内置布局语法**：`ui-theme/src/styles/` 全部 8 张全局表（base/scrollbar/focus/corner-shape/…）**零类选择器**——只有 `:root` 变量、`body`、伪元素、一个 `data-*` 选择器；ui-primitives 组件目录（Checkbox/Menu/Tooltip/Modal/CodeBlock/icons…）**无 Flex/Stack/Box 布局组件**。"优先用 dsh 内置工具类"这条优先级落空，通用布局实际全由 Tailwind 承担。
- **token 治理结构**：`ui-theme` 拥有全部 `--dsw-*`（约 420 个：语义色 `--dsw-alias-*`、排版 `--dsw-font-*`、圆角 `--dsw-radius-*`、阴影 `--dsw-elevation-*`、focus ring），含明暗切换；feature 包只消费不定义。**dsw 无 spacing token**——Tailwind 默认 0.25rem 间距尺度是唯一豁免项。
- 宿主 feature 组件 DOM 类名是 CSS Modules 哈希（asar 实测 `_actions_1pq26_43` 形态），与我们产物的撞名面趋近于零；残余风险只有宿主全局表的朴素语义类（markdown 渲染、静态页）。

### 6.2 本仓库两层样式规则

| 层 | 内容 | 机制 | 隔离手段 |
|----|------|------|---------|
| 通用布局 | flex/grid/gap/间距/尺寸/定位 | Tailwind v4，**仅布局类** | `tw:` 前缀 |
| 业务样式 | 颜色/字体/圆角/阴影/组件样式 | CSS Modules，值只写 `var(--dsw-*)` | lightningcss 哈希 |
| 组件 | 按钮/菜单/弹层等 | 优先 `@deepseek-ai/dsh-client-ui-primitives` / `dockkit`（基线模块，零打包；primitives 清单见 §6.7） | 宿主自带 |
| 类名组合 | 模块类 + 工具类 + 条件态 | `clsx`（官方同款胶水，与 CSS Modules 无从属关系） | — |

- 这是与官方 "no Tailwind" 的**有意识本地偏离**：偏离仅限布局书写方式；官方治理约束全部吸收（零调色板、零别名、不定义业务/语义 `:root` 变量——`--tw-*` 尺度变量是 Tailwind 机制必需的唯一例外、preflight 全禁）。
- **不引入 shadcn / RF UI**；dsw token 一律在 `.module.css` 里直引，不用 Tailwind 任意值形式（`tw:bg-(--dsw-*)` 本质是全局类，会绕开哈希隔离）。
- **边框属于业务视觉**：`tw:border` 生成 1px 边框，与 dsh 的 0.5px hairline 规范（`docs/web-styling.md` 明文）冲突——边框一律写进 `.module.css`（`border: 0.5px solid var(--dsw-alias-border-*)`）。同理 `--font-weight-*` 命名空间未清空，`tw:font-bold` 可用但业务排版仍应走 CSS Modules 的 `--dsw-font-*`。
- **CSS Modules 命名规范**（2026-10-23 定）：模块根元素恒为 `._`（tsx 里 `styles._`）；组件类用 PascalCase 且与组件同名（`.TaskNode` ↔ `<TaskNode>`）；组件内部元素用 `.TaskNode-title`（组件名-局部角色）；引用第三方库字面类时用 `:global()` 点名并收窄在模块类之下（`._ :global(.react-flow__background) { … }`）。哈希后这些名字不上页面，命名只为源码可读。

### 6.3 Tailwind 接入契约

`src/client/styles.css` 入口：

```css
@import "tailwindcss/theme" prefix(tw);
@import "tailwindcss/utilities" prefix(tw) source(none);  /* source(none) 只在 utilities import 上生效（实测） */

@source ".";  /* 相对 CSS 文件所在目录（= src/client），不是 cwd（实测） */

@theme {                        /* 机械强制"Tailwind 只管布局"：视觉命名空间清空， */
  --color-*: initial;           /* tw:bg-red-500 / tw:rounded-lg / tw:shadow 等类直接不生成， */
  --radius-*: initial;          /* 写错的人构建期即发现，不靠 Code Review 抓 */
  --shadow-*: initial;
  --text-*: initial;
}
```

- **preflight 全量禁用，不留作用域化兜底**：它是裸元素/通配符选择器的全局 reset，插件 `<style>` 注入共享 shell 后会静默打掉宿主列表符号、标题间距、按钮外观；有问题让组件显式暴露逐个修，不用全局 reset 掩盖。cascade layer 挡不住（只能救回宿主显式声明过的属性）。
- **prefix 的必要性**：Tailwind 类名是全局通用词（`.flex`/`.p-4`），撞名是双向的——我们的 `.p-4` 会改写宿主 DOM 里恰好的同名元素（恶劣方向），宿主/兄弟插件的同名类也会改写我们；HMR 重排 `<style>` 顺序会让无 prefix 冲突的胜负不确定。v4 原生 `prefix(tw)` 一行解决，顺带隔离 CSS 变量。
- ✅ 已实测（2026-10-23，amuro）：variant 写法是**前缀在前** `tw:hover:underline`（产物 `.tw\:hover\:underline:hover`）；`@theme` 清空在 prefix 下生效（违禁类零生成，`:root` 只剩 `--tw-spacing`）。
- ⚠️ **扫描范围陷阱（实测踩过）**：`source(none)` 写在 theme import 上会被静默忽略，自动探测保持开启且 base 是**包根**——`lib/client.js`（含上一轮的类名字符串与 sourcemap 内嵌旧源码）被当作候选扫描，造成**类名隔代残留**（删了类，下一次构建还在，再下一次才消失）。修复 = `source(none)` 挪到 utilities import + `@source "."` 显式收窄到 `src/client`。验收时注意：产物里的 CSS 是 JSON 转义的（`tw\\:flex` 双反斜杠），grep 要用解码后检查，否则会像我一样误判两轮。

### 6.4 CSS Modules 接入契约（能力只能由我们的 config 提供）

- 体系里没有别的提供者：Host 只服务 JS bundle 不管 CSS 语义；tsdown 自带 CSS 管线被架构禁用（抽独立 .css 文件，Host 不服务——同 `@tsdown/css` 禁用原因）；哈希是构建期行为，运行时无从补。
- 做法 = **移植官方预设 `dsh-css-modules-inline`**（`packages/client/tsdown.client.ts` L580-L603，约 25 行）：`*.module.css` → lightningcss `transform({ cssModules: { pattern } })` 出哈希 CSS + 映射 → `styleInjectionModule` 注入 `<style data-plugin>` 并 `export default` 类名映射。配 `src/css-modules.d.ts` 声明。devDep +`lightningcss`。
- 官方预设其实是**三条 CSS 管线**按文件名分流：`*.module.css`（哈希+映射）、`*.css?inline`（导出 CSS 文本）、其余 `*.css`（全局注入）。Light 复刻实现了第一、三条（modules + 全局）；`?inline` 暂无需求未移植。
- **裸 specifier 解析**：两条管线的 `resolveId` 都是 async，先 `this.resolve(source, importer, { skipSelf: true })` 交还 bundler 解析（node_modules、exports 映射），失败才回退相对路径直拼——否则 import 第三方库 CSS（如 `@xyflow/react/dist/style.css`）会被拼成 `src/client/@xyflow/...` 报 ENOENT（2026-10-23 whiteboard 接入 ReactFlow 实测修复）。
- **第三方库 CSS 的归类原则**：谁控制 markup，谁的类才能哈希。第三方库（ReactFlow 等）渲染自己写死类名的 DOM，其 CSS 只能走全局管线保持字面，隔离靠库自身的命名空间前缀（`.react-flow__*`）；覆盖时用 `:global()` 点名并收窄在模块类之下（§6.2 命名规范）。
- ⚠️ **现存暗坑**：Light 复刻全局管线的 `resolveId` 是 `endsWith('.css')` 一刀切，会**吞掉 `.module.css`**——不哈希（退化为全局类）且无映射导出（`styles.xxx` 运行时是 `undefined`），静默双坏。移植时必须照官方 L623 给全局管线加 `.module.css` 排除。

### 6.5 watch 与 HMR

- **`tsdown --watch` 是唯一 watcher**，不引入 Tailwind CLI 并行进程；编译插在内联插件的 `load` 钩子里（官方预设同构模式：`readFile → 编译 → 内联`）。
- **Tailwind 侧的失效问题**：产物内容依赖 tsx 里的类名扫描，tsx 变更触发重建但 `.css` 文件没变、虚拟模块 `load` 结果可能被缓存 → 新类不生成。解法：`postcss().process()` 的 `result.messages` 里 `dependency` 类型逐个 `this.addWatchFile`（实测单插件上报 14 条）。已实测 watch 下新增 `tw:` 类即时生成。残余边界：新建文件首轮不在依赖列表，实际无感（建组件必伴随改已有文件触发重建）。
- **CSS Modules 侧无此问题**：产物只取决于文件自身，`addWatchFile(fileId)` 即闭合（已实测 token 变更即时生效）。
- HMR 链路不变：产物重写 → Host stat 轮询 → SSE → 浏览器按 `data-plugin` 清 `<style>` 重挂。

### 6.6 验收（用产物说话，不看过程）

- `grep` `lib/client.js`：见到 `[hash]_[local]` 形态哈希类名（如 `xBGS5G_page`，根元素 `._` 哈希为 `xBGS5G__`）+ 类名映射（cjs 产物里是 `var Xxx_module_css_default = {...}` 而非字面 `export default`）；工具类全带 `tw:` 前缀；无 preflight 痕迹；`:root` 无裸 Tailwind 变量。
- GUI 实测：改 tsx 加新 `tw:` 类、改 `.module.css` 换 token，均热更新生效；宿主界面零影响。
- 依赖分工照旧（§5.5）：devDeps 新增 `tailwindcss` `@tailwindcss/postcss` `postcss` `lightningcss` `clsx`，install 由用户终端执行。

### 6.7 UI primitives（组件与图标）

dsh 自带一套 React 原语，覆盖控件与输入、菜单与浮层、Markdown 与工具输出卡片、设置表单，以及品牌/文件/权限图形。它在 11 项基线模块内：`require('@deepseek-ai/dsh-client-ui-primitives')` 由宿主解析，**不需要安装、不会被打包**，也不需要 `dsh.client.external` 声明。零 Cordis、零 slot，样式只消费 `--dsw-*` token。

- 本机 `0.2.1-rc.3` 共 **290 个运行时导出**：52 个组件、202 个图标/图形（190 个产品图标 + 8 个权限 + 2 个引用 + 2 个链接）、36 个 hook/工具/常量。
- **没有 Flex / Stack / Box / Grid 布局原语**。布局继续用 §6.2 的 Tailwind `tw:` 层；原语只负责控件、浮层、输出卡片和图形。
- **所有面向用户的文案由调用方提供**：包不读 locale，也没有语言回退；固定文案通过 `label` / `labels` 等 props 传入，遗漏是类型错误。
- 选型原则：先查原语，不要复制已有控件；确有视觉差异先加 prop，第二个功能包也需要同一控件时再考虑上游。

完整清单（每个组件的用途、关键 props、行为边界与常见坑）见 [references/dsh-ui-primitives.md](references/dsh-ui-primitives.md)。

---

## 7. 常见坑速查

| 症状 | 根因 | 修复 |
|------|------|------|
| 插件管理器显示 "no components" | `cordis.patch.yml` 是 `[]` 或注释；插件没进 Loader | 写 `- insert: [{ id, name }]` |
| sidebar 没条目 | 同上 | 同上 |
| dsh 安装时提示 "must be a top-level YAML array" | patch 文件格式不对 | Codex 将源码中的 patch 改为 `- insert: [...]` 顶层数组形式，再交由 dsh 安装 |
| dsh 安装时无法写入 `~/.dsh/profiles/desktop/` | dsh 侧权限或环境问题 | 交由 dsh 处理；Codex 不通过提权、调用 CLI 或手改 profile 绕过 |
| `__DSH_BOOT__` 里有插件但 `/plugins/<id>/client.js` 404 | host 没把 bundle 编进表格 | 检查 `cordis.patch.yml` + 重启 |
| 重启后 sidebar 仍无条目 | GUI 没真重启（cmd+Q 后再开） | 确认进程 PID 变化 |
| 看到 "no components" 第一直觉是 dev:web 没跑 | ❌ 走偏了 | 先按 §3 链路验证：manifest 没插件 → patch；bundle 404 → host 表 |
| 仓库根出现 `.pnpm-store/` | ~~沙箱内 install 探针失败降级~~ **旧记载有误**：pnpm 兜底 store 落点是挂载点（本机 `/.pnpm-store`），不可能在仓库内；若真见到，检查是否有软件 symlink 了 store-dir | 无需处理；沙箱内 install 的真实表现是直接报错 |
| 改了 `src/client/` 页面没热更 | 没跑 `tsdown --watch`，或构建没重写产物 | 插件目录 `pnpm watch`；确认 `lib/client.js` mtime 前进（config 里的 stamp 已保证） |
| 手改 `lib/client.js` 被覆盖 | 它是 tsdown 构建产物 | 改 `src/client/` 源码后 `pnpm bundle` |
| 手改 `lib/index.js` 被覆盖 | 2026-10-25 起它也是产物（从 `src/index.js` 拷贝） | 改 `src/index.js` 后 `pnpm bundle` |
| 插件管理器启用时报 `Could not enable the component … ERR_MODULE_NOT_FOUND …/lib/index.js`，侧栏条目消失 | Host 半产物缺失（`lib/` 不入 git，误删无信号——2026-10-25 whiteboard 实测踩过） | `pnpm bundle` 从 `src/index.js` 重新生成；若 `src/index.js` 也丢，照 §1.3 模板重建后重装/重启 |
| `styles.xxx` 是 `undefined`，类名也没哈希 | `.module.css` 被全局管线误吞（Light 复刻未排除） | 全局 `resolveId` 加 `.module.css` 排除 + 移植 modules 管线（§6.4） |
| import 第三方库的 CSS（如 `@xyflow/react/dist/style.css`）构建报 ENOENT，路径拼成 `src/client/@xyflow/...` | 全局/Modules 管线的 `resolveId` 把裸 specifier 当相对路径直拼 | `resolveId` 改 async，先 `this.resolve(source, importer, { skipSelf: true })` 交给 bundler 解析，失败再回退直拼（2026-10-23 whiteboard 接入 ReactFlow 时实测修复，两插件 config 已同步） |
| 改了 tsx 新加的 `tw:` 类不生效 | css 虚拟模块 `load` 结果被缓存，Tailwind 没重扫 | `result.messages` 的 dependency 逐个 `addWatchFile`（§6.5） |
| `tw:bg-red-500` / `tw:rounded-lg` 不生成 | 故意的：`@theme` 已清空视觉命名空间 | 视觉值写进 `.module.css` 用 `var(--dsw-*)`（§6.2） |
| 样式没生效但选择器没错 | token 名字不存在，浏览器静默失效（实测踩过：`--dsw-alias-bg-l1`、`--dsw-font-s-12-*` 均不存在；12px 档真名是 `--dsw-font-xxs-12-*`） | **Client `Theme.listTokens` 只返回部分颜色 token，不能当权威**；权威核对 = 从 asar 内 `@deepseek-ai/dsh-client-ui-theme/lib/client.js` 抓 `--dsw-*` 全表（约 403 个）。排版档位：xxxs-11 / xxs-12 / xs-13 / s-14 / base-16 / m-18 / l-20 / xl-24 |
| `__DSH_BOOT__` grep 不出来插件名 | host 在 GUI 启动时扫 Loader；新装插件需重启 | kill PID 或 Cmd+Q 后重开 |
| 401 拿不到 `/` 内容 | 缺 auth cookie | 用 `strings "$HOME/Library/Application Support/@deepseek-ai/dsh-desktop/Cookies"` 抓 `dsh-auth-*` |
| ReactFlow：MiniMap 无缩略图、节点拖不动、但画布渲染正常 | 受控 `nodes` 没配 `onNodesChange`：`userNode.measured` 只在 `applyNodeChanges` 里回写，MiniMap 用 `nodeHasDimensions(userNode)` 判定，永远 false 被跳过（@xyflow/react 12.10.2 实测确诊） | 只读/展示场景用非受控 `defaultNodes`；需要受控时必须 `onNodesChange = applyNodeChanges` 让 dimension 变化回流 |
| ReactFlow：MiniMap/Controls 等部件颜色与宿主主题脱节 | RF 部件颜色走 `--xy-*` CSS 变量链，明暗由它自己的 `.dark` 类（colorMode）切换，与 dsh 主题脱钩；默认浅色在亮主题下近隐形 | 在我们的模块类作用域设 `--xy-*` 变量指向 dsw token（如 `._ :global(.react-flow__minimap) { --xy-minimap-node-background-color: … }`），自动跟随宿主明暗 |
| 嵌入 `conversation.content` 的 composer 被禁用（placeholder"选择一个工作区开始"），点击输入框跳主视图 | hero 相 + 会话无工作区成员身份，官方 composer 退化为工作区选择器（机制见「UI 布局概念 › hero 与 active」） | 创建会话时传 `workspaceId`（不传 cwd，二者互斥）；或对 hero 做 chipTitle 可解析门控，见 §4.9 |
| 嵌入对话 hero 贴顶不居中 / active 相 composer 不吸底 / 长对话不滚动 | 容器不是全高 flex，factory 的 `flex:1` 根高度失效 | 容器给 `height:100%; min-height:0; display:flex`（照 ui-subagent 容器原文），见 §4.9 |
| `children` 里声明了 factory 名（如 `conversation.content`）却没渲染 | children 是 `renderSlot` 的声明表，声明 factory 名只会造出同名死 slot | factory 一律用 kit 里的 `renderFactorySlot(name, props, { slots })`，无需声明，见 §4.9 |
| slot 组件 props 里读不到 `ctx` | kit 只有标准 hooks + render* + SessionProvider，无 ctx | 在 `apply` / `ctx.inject` 回调闭包里捕获服务，自己传进组件树 |
| `strings …/Cookies` 抓到的 `dsh-auth-*` 全部 401 | cookie 按 authority（含端口）区分，Host 端口是随机的，文件里历史端口的价值全失效（2026-10-26 实测 40+ 条全 401） | 先确认当前实际监听端口对应的 cookie；抓不到就走 §9.3 的 AX 路径，别在 HTTP 上耗 |
| AX 脚本第一步就 `FAIL: no AX trust` | AX/录屏权限挂在 responsible process 上；从 DSH 内嵌 Agent 的 shell 起 Swift 进程无权限（2026-10-26 实测），与手册 §9.3 的已授权环境不同 | 由用户在系统设置给对应进程授辅助功能 + 屏幕录制；未授权前验收只能请用户操作并转述 |

---

## 8. 调试速查

### 8.1 找 host 进程

```bash
lsof -nP -iTCP:19387 -sTCP:LISTEN
```

返回的 PID 是 GUI 主进程（Electron）。Renderer 子进程的 PID 也可看：

```bash
ps -ax -o pid,command | grep "DeepSeek Harness Helper (Renderer)"
```

### 8.2 看 host 实际打开了哪些文件

```bash
lsof -p <PID> 2>/dev/null | grep -E "<plugin-name>|<workspace-name>"
```

如果 host 一直没开过你的 `lib/client.js`，说明它根本没扫到这个 plugin。

### 8.3 抓 auth cookie（一行）

```bash
COOKIE=$(strings "$HOME/Library/Application Support/@deepseek-ai/dsh-desktop/Cookies" \
  | grep -oE 'dsh-auth-[^[:space:]]+' | head -1)
COOKIE_VALUE=${COOKIE#dsh-auth-}
```

`COOKIE_VALUE` 用作 `Cookie: ${COOKIE_VALUE}` 的值（去掉 `dsh-auth-` 前缀后整串就是 cookie 内容）。

⚠️ 2026-10-26 实测：cookie 按 authority（含端口）绑定，而 Host 端口是随机的（§9.4），Cookies 文件里堆积的历史端口 cookie 对当前实例全部 401。`head -1` 抓到的很可能就是旧值。抓不到有效 cookie 时不要在 HTTP 上耗时，改用 §9.3 的 AX 路径验收。

### 8.4 一站式验证脚本

```bash
PID=$(lsof -nP -iTCP:19387 -sTCP:LISTEN -t | head -1)
COOKIE=$(strings "$HOME/Library/Application Support/@deepseek-ai/dsh-desktop/Cookies" \
  | grep -oE 'dsh-auth-[^[:space:]]+' | head -1)
COOKIE_VALUE=${COOKIE#dsh-auth-}

echo "== host PID: $PID =="
echo "== boot manifest =="
curl -s -H "Cookie: $COOKIE_VALUE" http://127.0.0.1:19387/ \
  | grep -oE '"id":"dsh-plugin-[^"]*"' | sort -u

echo "== bundle HTTP 状态 =="
for id in dsh-plugin-<your-name>; do
  curl -s -o /dev/null -w "$id: HTTP %{http_code}\n" \
    -H "Cookie: $COOKIE_VALUE" \
    "http://127.0.0.1:19387/plugins/$id/client.js"
done
```

预期输出：manifest 行有你的插件 id，bundle 行 `HTTP 200`。

### 8.5 看图变推送（SSE）

```bash
curl -N -H "Cookie: $COOKIE_VALUE" \
  http://127.0.0.1:19387/plugins/events
```

会持续看到 host 推送的 graph / rebuilt 帧。修 `lib/client.js` 后如果 watcher 没接上，这路不会有动静——那就是 plugin 文件没变化需要重启。

### 8.6 Host 日志位置

```bash
ls -la "$HOME/Library/Logs/DeepSeek Harness/"
```

生产 GUI 一般不写日志（目录存在但常常为空）。例外：`crash-<ISO 时间>-web-boot.log` 会记录 web boot 期的**插件激活失败**（含 renderer console 的 error 级输出），例如 `web boot: 1 entry did not activate / dsh-plugin-whiteboard: failed`——插件疑似没激活时先翻这里。运行时的 slot 错误优先看浏览器 DevTools console（Host 的注入错误、`slot entry crashed in '<slot>'` 等会在那里）。

---

## 9. 如何使用 Codex 开发 Dsh Plugin

### 9.1 角色与开发链路

**先由 dsh 自行完成本地 link 安装，再由 Codex 开发同一工作区内的插件。** 安装职责按 §2 执行；Codex 负责源码修改、构建与界面验收。

Codex 能使用热更新，是 dsh 插件机制本身的优势，不需要针对 Codex 做特殊处理。只要插件符合本手册的开发规范，尤其是 §5 的 bundle、样式注入与 mtime 契约，任何开发工具重写所链接的产物，都能自然进入同一条热更新链路。

已验证的完整链路：

```text
dsh 自行完成本地 link 安装，指向 Codex 使用的工作区，并完成加载
  → Codex 编辑该工作区里的插件源码
  → Codex 执行 pnpm bundle，或已有 pnpm watch 自动重建
  → 写入 lib/client.js（遵守 §5 的构建与 mtime 契约）
  → dsh 自行检测产物变化并热替换界面
  → Codex 从外部读取界面、点击控件、截图验收
```

这里的热更新由 dsh 自身负责，与生成源码的 Agent 是谁无关。本地 link 安装完成后，Codex 开发、构建并触发热更新是符合规范后的天然开发流程，无需为此再次安装或重新链接。**构建成功只能证明产物生成；验收还需观察实际界面。** 用户确认界面变化也是有效的验收证据。

### 9.2 开始前与日常操作

- dsh 已自行完成本地 link 安装，并指向 Codex 当前工作区；首次安装与后续 link 安装均按 §2 交由 dsh 进行。
- dsh 正在运行，插件能从侧栏打开；已有依赖可用，新增依赖仍按 §5.5 的分工处理。
- Codex 先读源码，按真实项目结构定位改动。whiteboard 的页面在 `src/client/WhiteBoardPage.tsx`，注册入口在 `src/client/index.tsx`；不要因需求中泛称 `src/index.js` 而另造入口。
- 修改源码后，在仓库根执行一次构建即可，不必为了热更新另起开发服务器：

```bash
pnpm --filter dsh-plugin-whiteboard bundle
```

也可以用 `pnpm --filter dsh-plugin-whiteboard watch` 持续构建。两者都由 Codex 在外部终端执行，不依赖 dsh 内部 Agent。`lib/client.js` 与 sourcemap 由构建生成，不手改。

### 9.3 不改启动参数的桌面验收（macOS，已实测）

**首选已跑通的路径是 macOS 辅助功能（Accessibility / AX）加窗口截图。** 通过系统接口操作现有 dsh 进程，不要求重启、开放远程调试端口或修改应用。它适用于基于可见文字、控件名称和实际画面的验收，不等同于 DOM 或控制台调试。

本机实测环境：Swift 可用，**当时的**执行进程（Codex 外部终端）已获辅助功能与屏幕录制权限。可用 `AXIsProcessTrusted()`、`CGPreflightScreenCaptureAccess()` 检查当前执行进程的权限；其他机器缺少权限时需由用户在系统设置授予，不能假定自动具备。⚠️ 2026-10-26 补：权限按 responsible process 授予，**换执行者就要重查**——从 DSH 内嵌 Agent 的 shell 起 Swift 实测 `AXIsProcessTrusted() === false`、无录屏权限，AX 路径整体不可用。

Electron 的无障碍树可能尚未开启，或窗口不在前台时 `AXWindows` 返回空数组。实测做法是激活现有应用，临时设置 `AXManualAccessibility = true`，短暂等待后读取窗口；结束时恢复原值。这只是运行时辅助功能开关，**不是启动参数**。

以下 Swift 示例可保存到临时目录后用 `swift <脚本路径>` 执行。它按名称打开 White Board 并检查四张 mock 卡片；后续应按具体需求调整预期文字：

```swift
import Cocoa
import ApplicationServices

func value(_ element: AXUIElement, _ key: String) -> CFTypeRef? {
  var result: CFTypeRef?
  _ = AXUIElementCopyAttributeValue(element, key as CFString, &result)
  return result
}

func descendants(_ element: AXUIElement, _ depth: Int = 0) -> [AXUIElement] {
  guard depth < 30 else { return [] }
  let children = value(element, "AXChildren") as? [AXUIElement] ?? []
  return [element] + children.flatMap { descendants($0, depth + 1) }
}

func verifyWhiteboard() throws {
  guard AXIsProcessTrusted(),
        let app = NSRunningApplication
          .runningApplications(withBundleIdentifier: "com.deepseek.dsh").first
  else { throw NSError(domain: "DshUI", code: 1) }

  let ax = AXUIElementCreateApplication(app.processIdentifier)
  let original = value(ax, "AXManualAccessibility")
  let status = AXUIElementSetAttributeValue(
    ax, "AXManualAccessibility" as CFString, kCFBooleanTrue)
  guard status == .success else { throw NSError(domain: "DshUI", code: 2) }
  defer {
    if let original = original {
      _ = AXUIElementSetAttributeValue(ax, "AXManualAccessibility" as CFString, original)
    }
  }
  app.activate(options: [])
  RunLoop.current.run(until: Date().addingTimeInterval(1))

  func elements() -> [AXUIElement] {
    (value(ax, "AXWindows") as? [AXUIElement] ?? [])
      .flatMap { descendants($0) }
  }
  guard let button = elements().first(where: {
    value($0, "AXRole") as? String == "AXButton"
      && value($0, "AXDescription") as? String == "White Board"
  }), AXUIElementPerformAction(button, kAXPressAction as CFString) == .success
  else { throw NSError(domain: "DshUI", code: 3) }

  let expected = ["华东渠道季度回访", "新客户首访：明州制造",
                  "样品迟迟未签收", "报价单口径不一致"]
  for _ in 0..<10 {
    let texts = elements().compactMap { value($0, "AXValue") as? String }
    if expected.allSatisfy(texts.contains) {
      print("PASS: White Board 显示全部四张卡片")
      return
    }
    RunLoop.current.run(until: Date().addingTimeInterval(0.5))
  }
  throw NSError(domain: "DshUI", code: 4)
}

try verifyWhiteboard()
```

界面验收要先确认当前面板。当前停留在聊天页时读不到卡片，不代表插件失败；通过侧栏 `AXButton` 的 `AXDescription = White Board` 执行 `AXPress` 后再读白板。

需要检查视觉布局时，通过 `CGWindowListCopyWindowInfo` 按应用 PID 查找目标窗口，取得当次 `kCGWindowNumber`，再截图并实际查看图片：

```bash
screencapture -x -o -l <当次窗口ID> /tmp/dsh-whiteboard.png
```

窗口 ID 会变化，不能复用旧值。优先截目标应用窗口；文字验证优先按 AX 控件名称查找，避免依赖固定屏幕坐标。交互验收可执行可恢复的操作，例如点击 `Zoom In`，读取百分比变化，再点击百分比按钮恢复原缩放。

### 9.4 边界与排查顺序

- **不要求端口连接。** 日常插件界面验收用上述桌面路径；§3、§8 的 HTTP/SSE 步骤是加载链路故障时的诊断手段。
- **`19387` 不是所有 Desktop 实例的固定端口。** 本次调查实际发现 Host 使用随机端口；旧示例端口连接失败不能据此判断 dsh 未运行。确需诊断 HTTP 时先查实际监听地址，且需处理鉴权。
- **Playwright 可用不代表能控制当前 dsh。** 本次 Codex 的 `load_workspace_dependencies` 返回的配套 Node 环境包含 Playwright；它不是项目依赖或 dsh 插件能力，运行时路径随环境变化。没有已开放的 CDP 入口，`connectOverCDP()` 不能直接附加现有窗口。
- **不以改变启动参数为前提。** `--remote-debugging-port` 方案未实测，也不属于本节已验证的工作流。不能要求用户为日常开发重新启动 dsh 或开放该端口。
- AX 和截图已经覆盖文字、可访问控件与视觉交互；**尚未验证**通过此路径读取 DOM、执行页面 JavaScript 或捕获控制台错误。需要这些能力时再单独调查，不把界面验证说成 DOM/CDP 验证。
- 客户端源码与样式变更按 §5 热替换，React 局部状态可能重置；manifest/Loader 变更仍按 §2、§5 的重启规则处理。Host 半修改的更新行为不在本次验证范围内。

### 9.5 已验证案例（2026-10-23 至 2026-10-24）

1. **侧栏改名**：Codex 将 `WhiteBoard` 改为 `White Board` 后构建，用户确认立即生效；随后 Codex 通过窗口截图与 AX 树再次读到新名称。
2. **外部操作界面**：Codex 用 AX 点击 `Zoom In`，读到 `100% → 120%`，再点击百分比恢复 `100%`。无需修改启动参数或调用 dsh Agent。
3. **mock 数据抽取**：Codex 把四个节点从页面移入 `src/client/database.js`，页面使用 `import { nodes } from './database.js'`；构建成功后从桌面侧栏打开白板，AX 读取到全部四张卡片，用户确认结果正常。

这些案例确认第三方开发与实际界面验收可行；数据抽取案例验证的是重构后功能正常，未单独测量热替换时延。

---

## 10. 相关文档

- `.context/AppHost.md` —— App Host 能力边界、Thread / Turn 语义
- asar 源码：`@deepseek-ai/dsh-client-modules` —— boot manifest、webPlugins、`/plugins/` 路由的实现
- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)（公开仓库）—— `packages/client/tsdown.client.ts`（clientBundle 官方预设）、`packages/client/web/src/platform.ts`（基线模块表）、`packages/client/hmr/README.md`（热替换链路）、`packages/client/AGENTS.md`（client 编写规范）、`scripts/dev-web.ts`（官方开发回路编排）、`docs/web-styling.md`（样式权威：CSS Modules + clsx + `--dsw-alias-*`，no Tailwind）、`packages/client/ui-theme/src/styles/`（token 与全局表本体）
- [references/dsh-ui-primitives.md](references/dsh-ui-primitives.md) —— 安装版 UI 原语完整清单（52 个组件 / 202 个图标与图形 / 36 个 hook、工具与常量）、关键 props、行为边界、常见坑与版本核对方法
- [references/install-local.md](references/install-local.md) —— 唯一安装方式（local link）：界面步骤、profile 落盘结果、`Code source` 验收、开发回路与故障排查
