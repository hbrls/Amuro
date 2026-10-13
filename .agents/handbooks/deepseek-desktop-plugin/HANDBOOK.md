---
name: deepseek-desktop-plugin
description: "DeepSeek Desktop 插件（dsh-plugin-*）的最小骨架、安装、加载链路验证、卡片/会话召唤的接入规范"
metadata:
  version: 0.1.0
---

# DeepSeek Desktop 插件手册

## 定位

本手册记录 DeepSeek Desktop 插件（包名 `dsh-plugin-*`）的最小落地形态、加载链路、调试手段，以及「卡片界面 + 官方会话召唤」的接入规范。所有结论均已在 `dsh-plugin-amuro` 骨架上实测验证。

本文不解释 Desktop 内部架构的推导过程；那些细节见 `.context/AppHost.md` 和 asar 源码里的 `@deepseek-ai/dsh-client-modules` 实现。

## 术语速查

| 术语 | 含义 |
|------|------|
| **Host 半** | Node 侧，运行在主进程；用 cordis 插件形态（`name` / `inject` / `apply(ctx)`）。负责 `/api/*` 路由、会话控制、logger 等 |
| **Client 半** | Renderer 侧，运行在浏览器；用 `window.__ModuleLoader__.load({ id, factory })` 注册懒加载工厂。负责 slot 注册、UI 渲染 |
| **Loader entry** | cordis 组合图里的一行；由 `cordis.patch.yml` 通过 `- insert: { id, name }` 登记。**插件必须显式 insert 才会被 host 扫到** |
| **Boot manifest** | `__DSH_BOOT__`，注入到 `/` 的 HTML 里；列出每个 client 插件的 id、bundle URL、rev、inject 依赖 |
| **Slot** | Client 侧的 UI 接入点（`sidebar.panellist`、`main`、`conversation.composer.dock` 等），通过 `ctx.slots.inject` 注入条目 |

---

## 1. 最小骨架（5 个文件）

实测可工作的最小插件由以下文件组成，全部放在 `packages/<your-plugin>/` 下：

```text
packages/dsh-plugin-amuro/
├── package.json          # 插件清单
├── cordis.patch.yml      # cordis Loader 入口（必须有 insert）
├── README.md             # 自描述，可选
└── lib/
    ├── index.js          # Host 半
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
- `dsh.client.immediately` 控制启动时是否立即加载；UI 类插件一般 `true`
- `dsh.bundle.patch` 指向 patch 文件；**patch 文件内容决定插件是否真的进入 Loader**，详见 §2
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
- `require('react')` 走 host 的 `staticModules` 表，**不要**额外装 react 或 import 别名
- `require('@deepseek-ai/dsh-client-ui-primitives')` 等 client 包应尽量避免，改用 host token（`--dsw-alias-*`）+ 自渲染控件；真要 require 必须走 build 流程并声明在 `dsh.client.external`
- `factory` 必须返回 `{ inject, apply }`；`apply` 里只用 `ctx.effect` 注册副作用并返回清理函数，不要在 factory body 里跑副作用

---

## 2. 安装与重启

### 2.1 安装

CLI 一次性完成安装、symlink、profile 更新：

```bash
dsh plugin --profile desktop add <本地绝对路径>
```

例如：

```bash
dsh plugin --profile desktop add /Users/<you>/github/Amuro/packages/dsh-plugin-amuro
```

CLI 行为：
- 校验 `cordis.patch.yml` 必须是顶层 YAML 数组（注释块、空 `[]` 都会被拒）
- 写入 `~/.dsh/profiles/desktop/package.json` 的 `dependencies` 和 `dsh.profile.bundles`
- 创建 `~/.dsh/profiles/desktop/node_modules/<plugin>` → workspace 的 pnpm link
- 失败时**会回滚** package.json、pnpm-lock.yaml、node_modules

**沙箱注意：** `~/.dsh/profiles/desktop/` 在 workspace 之外，首次安装需要 `danger-full-access` 沙箱权限（或交互式授权）。

### 2.2 重启

CLI 完成后**必须重启 Desktop GUI** 才会看到插件。文档原话：

> Two edits made directly to files during a session are judged only at the next recomposition or startup.

涉及文件：
- `cordis.patch.yml`（新增 insert）
- `package.json`（dsh.client 字段变更）

`dsh plugin add` 本身不触发 recomposition。

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
curl -s -H "Cookie: ${COOKIE#dsh-auth-*_*_*_*_*_*_*_*_*_*_*}" \
  http://127.0.0.1:19387/ \
  | grep -oE '"id":"dsh-plugin-[^"]*"' | sort -u
```

预期看到你的 `dsh-plugin-<your-name>`。**没看到 = patch 没生效或 host 没扫到。**

### 3.3 检查 bundle 可达

```bash
curl -s -w "HTTP %{http_code}\n" \
  -H "Cookie: ${COOKIE#dsh-auth-*_*_*_*_*_*_*_*_*_*_*}" \
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
| **L2 一键托管** | Host 半直接 `session.prompt` 发出「卡片上下文 + 求助模板」首条消息；客户端 `openSession` + `selectPanel(null)` 跳转。**消息模板要求 Agent 先给方案再动手** | 仅用于语义明确的按钮 |
| **L3 右栏并排对话** | 照 ui-subagent 模式，`dsh-resource://` 资源 + Sidebar tab 内渲染 `conversation.content` Factory（固定 Chat view、省略主 Header），卡片页不跳转 | 需要长驻对话辅助的场景 |

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

---

## 5. HMR 与重建（已知限制）

文档原话：

> The client-plugin HMR receiver is active, but client-plugin changes reload without a refresh only while `pnpm run dev:web` is also running from this same checkout to rebuild their bundles.

> Every other change — the apps/web shell and plain packages — requires rebuilding the affected Web artifacts and verifying this existing URL after a page refresh.

实测结论：

| 场景 | 行为 |
|------|------|
| 编辑 `lib/client.js`，无 `pnpm run dev:web` 监视器 | ❌ 不会热更；renderer 拉的 `/plugins/<id>/client.js` 内容不变 |
| GUI 重启 | ✅ plugin 的 cordis composition 重做；新 patch / 新 bundle 都生效 |
| 编辑 `cordis.patch.yml` 或 `package.json` | ✅ 只在下次 recomposition 或启动时生效（`dsh plugin add` 不触发） |
| 生产 GUI（Electron 桌面） | 没有 `/plugins/<id>.js` 的用户编译产物——用户插件要靠 host 启动时的 `webPlugins` 服务读源文件 |

**`pnpm run dev:web` 在本仓库实测不可用**（DSH 源码 checkout 不在 `app.asar.unpacked` 里）。如果后续需要热更，要么定位 DSH 源码 checkout，要么靠「修改 + 重启 GUI」的循环。

---

## 6. 常见坑速查

| 症状 | 根因 | 修复 |
|------|------|------|
| 插件管理器显示 "no components" | `cordis.patch.yml` 是 `[]` 或注释；插件没进 Loader | 写 `- insert: [{ id, name }]` |
| sidebar 没条目 | 同上 | 同上 |
| `dsh plugin add` 报错 "must be a top-level YAML array" | patch 文件格式不对 | 用 `- insert: [...]` 顶层数组形式 |
| CLI 报 EPERM 写 `~/.dsh/profiles/desktop/` | 沙箱限制 workspace 外 | 一次性 `danger-full-access` 沙箱权限 |
| `__DSH_BOOT__` 里有插件但 `/plugins/<id>/client.js` 404 | host 没把 bundle 编进表格 | 检查 `cordis.patch.yml` + 重启 |
| 重启后 sidebar 仍无条目 | GUI 没真重启（cmd+Q 后再开） | 确认进程 PID 变化 |
| 看到 "no components" 第一直觉是 dev:web 没跑 | ❌ 走偏了 | 先按 §3 链路验证：manifest 没插件 → patch；bundle 404 → host 表 |
| `__DSH_BOOT__` grep 不出来插件名 | host 在 GUI 启动时扫 Loader；新装插件需重启 | kill PID 或 Cmd+Q 后重开 |
| 401 拿不到 `/` 内容 | 缺 auth cookie | 用 `strings "$HOME/Library/Application Support/@deepseek-ai/dsh-desktop/Cookies"` 抓 `dsh-auth-*` |

---

## 7. 调试速查

### 7.1 找 host 进程

```bash
lsof -nP -iTCP:19387 -sTCP:LISTEN
```

返回的 PID 是 GUI 主进程（Electron）。Renderer 子进程的 PID 也可看：

```bash
ps -ax -o pid,command | grep "DeepSeek Harness Helper (Renderer)"
```

### 7.2 看 host 实际打开了哪些文件

```bash
lsof -p <PID> 2>/dev/null | grep -E "<plugin-name>|<workspace-name>"
```

如果 host 一直没开过你的 `lib/client.js`，说明它根本没扫到这个 plugin。

### 7.3 抓 auth cookie（一行）

```bash
COOKIE=$(strings "$HOME/Library/Application Support/@deepseek-ai/dsh-desktop/Cookies" \
  | grep -oE 'dsh-auth-[^[:space:]]+' | head -1)
COOKIE_VALUE=${COOKIE#dsh-auth-}
```

`COOKIE_VALUE` 用作 `Cookie: ${COOKIE_VALUE}` 的值（去掉 `dsh-auth-` 前缀后整串就是 cookie 内容）。

### 7.4 一站式验证脚本

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

### 7.5 看图变推送（SSE）

```bash
curl -N -H "Cookie: $COOKIE_VALUE" \
  http://127.0.0.1:19387/plugins/events
```

会持续看到 host 推送的 graph / rebuilt 帧。修 `lib/client.js` 后如果 watcher 没接上，这路不会有动静——那就是 plugin 文件没变化需要重启。

### 7.6 Host 日志位置

```bash
ls -la "$HOME/Library/Logs/DeepSeek Harness/"
```

生产 GUI 一般不写日志（目录存在但常常为空）。诊断客户端错误优先看浏览器 DevTools console（Host 的注入错误、`slot entry crashed in '<slot>'` 等会在那里）。

---

## 8. 相关文档

- `.context/AppHost.md` —— App Host 能力边界、Thread / Turn 语义
- asar 源码：`@deepseek-ai/dsh-client-modules` —— boot manifest、webPlugins、`/plugins/` 路由的实现
- `references/`（本手册预留）—— 类型、验证脚本、debug 速查

---

> 维护人：HBR - k3
> 最近更新：2026-10-13 23:50
