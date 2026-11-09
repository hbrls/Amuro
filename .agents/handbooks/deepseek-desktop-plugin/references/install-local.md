---
name: install-local
description: "dsh 插件唯一的安装方式：在当前工作区用绝对目录发起 local link；profile 记录 link:/绝对路径，插件详情页 Code source 显示同一路径"
metadata:
  version: 0.1.0
---

# 本地 link 安装（唯一安装方式）

> 适用版本：DeepSeek Harness Desktop `0.2.1-rc.3`（本机安装版，2026-10-25 核对）。
> 事实来源：安装版 `@deepseek-ai/dsh-client-ui-plugin-manager` 的 `lib/client.js`、`@deepseek-ai/dsh-plugin-manager` 的 `lib/index.js` / `lib/install-spec.js` 与包内 README，以及本机 `~/.dsh/profiles/desktop/` 的实际状态。
> 本文件接管 [../HANDBOOK.md](../HANDBOOK.md) §2 的操作细节；主手册只保留结论和入口。

## 0. 先记住五条

1. **有且只有一种安装/开发模式**：在当前仓库开发，把同一个包目录以 pnpm `link:` 依赖装进当前 dsh profile。运行中的 Host 读到的就是仓库里的文件本体，不存在“构建后发布，再从另一个来源安装”的第二条链路。
2. **不存在发布模式**：不执行 `pnpm publish` / `npm publish`，不发布到 npm 或任何公开源，不安装 registry 包名；本仓库也不使用 Git 仓库、tarball 或 `file:` 拷贝形式。dsh 界面里出现这些入口，不代表本仓库需要它们。
3. **安装由 dsh 执行**：Codex 只准备源码、清单、patch 与 `lib/` 产物；用户在 dsh 侧栏「插件」页发起安装并启用。Codex 不调用 `dsh` CLI / `plugin_manager` / `pnpm add` 代装，也不手改 profile。
4. **落盘结果必须是 `link:` 依赖**：`~/.dsh/profiles/desktop/package.json` 中该包的值形如 `link:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-whiteboard`。
5. **验收看「代码来源 / Code source」**：插件详情页该行显示同一条 `link:/...`。用户给出的验收形态就是：

```text
Code source
link:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-whiteboard
```

整条链路只有这一条：

```text
仓库源码  /Users/shuaizhexu/github/Amuro/packages/dsh-plugin-whiteboard
    │  用户在 dsh「插件」页选择这个绝对目录
    ▼
dsh-plugin-manager  pnpm add <绝对目录>
    │
    ▼
profile package.json  "dsh-plugin-whiteboard": "link:/Users/.../packages/dsh-plugin-whiteboard"
    │
    ▼
插件详情页  Source → Code source  link:/Users/.../packages/dsh-plugin-whiteboard
```

## 1. 职责边界

| 角色 | 负责 | 不负责 |
|---|---|---|
| Codex | 源码、`package.json`、`cordis.patch.yml`、`lib/` 构建产物；只读核对 profile 与界面 | 不安装、不调用 `dsh` CLI 或 `plugin_manager`、不改 profile、不建软链 |
| 用户 + dsh | 在「插件」页选择本地目录、完成安装、启用、必要时重启 | — |

安装工具是否可用、Codex 是否有文件系统权限，都不改变这个分工。仓库开发依赖的安装（根目录 `pnpm --filter`）与插件装进 dsh 是两件事，前者按 HANDBOOK §5.5 由用户在终端执行。

## 2. 安装前条件

dsh 只读取目录里的清单与产物；以下缺一项，安装会在检查或应用阶段失败。

### 2.1 目录与清单

- 目录必须是**绝对路径**，位于当前工作区，例如 `/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-whiteboard`。Host 拒绝相对路径（`a local path must be absolute`）。
- 目录根部有有效的 `package.json`，字段按 HANDBOOK §1.1：`name`、`version`、`type`、`exports`、`dsh.bundle.patch`，有 client 半时还要 `dsh.client`。
- `private: true` 不妨碍 link 安装；本地模式不需要为每次改动 bump `version`，版本号只用于界面显示。

### 2.2 `cordis.patch.yml`

必须是顶层 YAML 数组，且真正 insert 了入口；`[]` 或纯注释会被判为没有组合包：

```yaml
- insert:
    - id: plugin-whiteboard
      name: 'dsh-plugin-whiteboard'
```

patch 在校验失败时会让安装失败，并恢复 profile 的清单与锁文件。格式细节见 HANDBOOK §1.2。

### 2.3 构建产物与依赖

- `lib/index.js` 存在；有 client 半时 `lib/client.js` 存在。产物由 `pnpm --filter dsh-plugin-whiteboard bundle` 生成，不手写、不手改。
- 插件自身的依赖已由用户在仓库根安装（`pnpm --filter dsh-plugin-whiteboard install`）。profile 的 link 依赖不代替插件的 `node_modules`。

## 3. 安装步骤（dsh 插件页）

1. 打开侧栏「插件」/ **Plugins** 页。
2. 点右上角主按钮「添加插件」/ **Add plugin**。它直接打开安装对话框；旁边的下拉箭头 →「安装第三方插件」/ **Install a third-party plugin** 打开的是同一个对话框。
3. 在「添加插件」/ **Add plugin** 对话框的「包名或地址」/ **Package name or address** 字段填入包的**绝对目录**：

   ```text
   /Users/shuaizhexu/github/Amuro/packages/dsh-plugin-whiteboard
   ```

   直接填路径即可，不需要 `link:` 前缀，更不要填相对路径。Host 的检查阶段只读取该目录的 `package.json`，不向 registry 查询。
4. 点「安装」/ **Install**。检查通过后显示 subject 卡片（包名、版本、简介；包没有简介时显示类型「本地目录」/ **Local directory**），随后进入「插件安装中…」/ **Installing…**。
5. 完成页标题为「已安装」/ **Installed**。点「立即启用」/ **Enable now**。手工输入 spec 的安装默认不选入组合包，这一步不能省；如果按钮是「完成」/ **Done**，说明它已经启用，可以跳过。
6. 如果出现「请重启 DSH 使更改生效。」/ **Restart DSH to apply the change.**，按提示重启 Desktop；没有出现则说明当前进程已经应用。
7. 点开该插件卡片进入详情页，核对「来源信息 → 代码来源」/ **Source → Code source** 的值是本包目录对应的 `link:/绝对路径`（与 §0 第 4 条一致）。

界面实际渲染为同一行（标签 + code 值）：

```text
来源信息 / Source
  代码来源 / Code source    link:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-whiteboard
  当前版本 / Current version  0.0.1
```

## 4. 安装后的落盘形态

`~/.dsh/profiles/desktop/package.json`（节选）：

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-plugin-whiteboard"
      ]
    }
  },
  "dependencies": {
    "dsh-plugin-whiteboard": "link:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-whiteboard"
  }
}
```

`~/.dsh/profiles/desktop/pnpm-lock.yaml`（节选）：

```yaml
dsh-plugin-whiteboard:
  specifier: link:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-whiteboard
  version: link:../../../github/Amuro/packages/dsh-plugin-whiteboard
```

`~/.dsh/profiles/desktop/node_modules/` 中是 pnpm 生成的软链：

```text
dsh-plugin-whiteboard -> ../../../../github/Amuro/packages/dsh-plugin-whiteboard/
```

这些文件和软链由 dsh / pnpm 生成。Codex 只读核对，不手写、不补建。

只完成安装、还没点「立即启用」时，`dependencies` 已有该 `link:` 依赖，但 `dsh.profile.bundles` 里还没有它；可以稍后在列表里再启用。

## 5. 只读验证

```bash
# 1) profile 依赖值，应为 link:/绝对路径
node -p 'require(process.env.HOME + "/.dsh/profiles/desktop/package.json").dependencies["dsh-plugin-whiteboard"]'

# 2) 软链目标，应指回仓库
readlink "$HOME/.dsh/profiles/desktop/node_modules/dsh-plugin-whiteboard"

# 3) lockfile 记录
grep -n -A2 'dsh-plugin-whiteboard:' "$HOME/.dsh/profiles/desktop/pnpm-lock.yaml"

# 4) 是否已选入组合包
node -p 'require(process.env.HOME + "/.dsh/profiles/desktop/package.json").dsh.profile.bundles.join("\n")'
```

最终验收仍以界面为准：`Code source` 行显示 `link:/Users/...`，且插件行处于运行状态。命令只证明磁盘记录，不证明 Loader 已加载。

## 6. 开发回路：安装一次，之后只改代码

本地 link 安装完成后，不需要为了代码改动重新安装：

```bash
# 在仓库根
pnpm --filter dsh-plugin-whiteboard watch     # 持续构建
# 或
pnpm --filter dsh-plugin-whiteboard bundle    # 一次性构建
```

- Host 通过 profile 里的软链直接服务仓库中的 `lib/client.js`；重写产物即触发 client 热替换。
- 纯 `src/client/` 代码与样式改动：构建后热更新，不需要重启。
- `cordis.patch.yml`、`package.json` 的 `dsh.client` / `exports` 等 manifest、Loader 级改动：按 HANDBOOK §2.1 重启，热替换不覆盖这类变更。
- 新增插件依赖：改 `package.json` 后交给用户在仓库根执行 `pnpm --filter ... install/add`，不要由 Codex 在 profile 里安装。
- 移动了 checkout 或换了包目录：让 dsh 卸载后重新安装，不要手改 profile 的 `link:` 路径。

## 7. 重启与生效

安装完成不等于当前 Host 已重新读取配置。界面出现「请重启 DSH 使更改生效。」时，退出并重新打开 DeepSeek Harness Desktop。原因码：

| reason | 含义 |
|---|---|
| `no-hmr` | 这个 profile 只在启动时应用更改。 |
| `package-moved` | 已安装的包解析到了另一个目录，或更改替换了 DSH 安装自带的包。 |
| `host-module` | 更改涉及 DSH 自身已加载的模块。 |
| `unmanaged-plugin` | 更改涉及一个不受插件列表管理的插件。 |
| `module-comparison` | DSH 无法把已加载的插件与磁盘上的文件进行比较。 |

`package-moved` 不应靠手改 profile 解决：卸载后从当前目录重新安装。

## 8. 故障排查

| 界面文案（中 / EN） | 原因 | 处理 |
|---|---|---|
| 该路径不存在或不是有效的插件包 / The path does not exist or is not a valid plugin package | 路径错误、目录根部没有 `package.json` 或不可读 | 改为绝对路径，确认清单在目录根部 |
| 这个包没有声明组合包，无法作为插件安装：{reason} / This package declares no bundle… | 缺少或无法读取 `dsh.bundle.patch`，或 patch 未声明组合包 | 按 §2.2 修复 patch 后重试 |
| `dsh: overlay ... must be a top-level YAML array of loader patch entries` | patch 不是顶层数组 | 改成 `- insert: [...]` 顶层数组；安装失败会恢复 profile 清单与锁文件 |
| 该插件已安装。如需升级，请卸载后重新安装 / This plugin is already installed… | profile 已声明同名依赖 | 代码改动只需重新构建，不必重装；要换目录或版本则先卸载再装 |
| 请重启 DSH 使更改生效。{reason} / Restart DSH to apply the change. {reason} | 已保存但当前进程未应用 | 重启；原因见 §7 |
| 已安装的插件包解析到了另一个目录… / package-moved | `link:` 目标变化 | 卸载后从当前目录重新安装 |
| 插件安装失败 / Plugin installation failed | pnpm、构建或 patch 校验失败 | 查看安装详情与 profile 的 `.plugin-manager/logs/`；失败的运行会恢复 `package.json` 与 `pnpm-lock.yaml`（已下载的文件可能保留），修复后重试 |
| 需要允许安装脚本 / Install scripts need permission | pnpm 拦下了依赖脚本 | 由用户确认后点「允许这些脚本并重试」/ **Allow these scripts and retry**；Codex 不代为批准 |
| 未收到安装结果 / 安装状态尚未确认 | 响应丢失 | 点「核对安装状态」/ **Check installation status**，不要盲目重装 |

## 9. 禁止事项

- 不发布：不执行 `pnpm publish` / `npm publish`，不把包发布到 npm 或任何公开源。
- 不用 registry 包名、Git 仓库、tarball、`file:` 拷贝安装；本仓库只认本地目录的 `link:` 结果。
- Codex 不调用 `dsh` CLI、`plugin_manager` 或 `pnpm add` 代装。
- Codex 不修改 profile 的 `package.json`、`dsh.profile.bundles`、`pnpm-lock.yaml`，不手建或改 `node_modules` 软链，不把包复制进 profile。
- 不为普通代码改动重装插件；不通过重装来“刷新”热更新。
- 不操作其他 profile，不编辑 agent 预设组合。

## 10. 事实核对

- 界面字符串来自安装版 asar 中的 `dsh/node_modules/@deepseek-ai/dsh-client-ui-plugin-manager/lib/client.js`：`sourceTitle`（来源信息 / Source）、`sourceSpec`（代码来源 / Code source）、`installSubjectPath`（本地目录 / Local directory）、`installEnableNow`（立即启用 / Enable now）、`restartNotice`（请重启 DSH 使更改生效 / Restart DSH to apply the change）。
- 详情页 `SourceSection` 直接渲染 `pkg.source`；本地 link 的 `source` 由 Host 的 `dependencySpec` 生成：去掉 `file:` / `link:` 前缀后按 profile 目录解析为绝对路径，再拼回 `link:`。
- Host `parseInstallSpec` 对绝对路径返回 `{ kind: 'path' }`，对相对路径报 `a local path must be absolute`；`installBundle` 运行 `pnpm add <spec>`，失败、取消或包没有组合包 patch 时恢复 `package.json` 与 `pnpm-lock.yaml`。
- `listBundles` 只为“profile 已安装且非 DSH 随附”的组合包给出 `source`；`Code source` 显示的是记录下来的依赖 spec，不是插件主页或版本号。
- 2026-10-25 本机 profile 实际状态：`dsh-plugin-amuro`、`dsh-plugin-sessions`、`dsh-plugin-whiteboard` 三项均为 `link:/Users/shuaizhexu/github/Amuro/packages/...`，`node_modules` 软链指回同一批目录。
- dsh 产品界面本身还提供 npm 包、Git 仓库等入口；本仓库的工作流不使用它们，本文也不把它们列为可选方案。
