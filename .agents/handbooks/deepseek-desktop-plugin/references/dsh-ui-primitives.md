---
name: dsh-ui-primitives
description: "dsh 安装版实际导出的 UI 原语：52 个组件、202 个图标、36 个 hook/工具/常量；用途、关键 props、行为边界与选型"
metadata:
  version: 0.1.0
---

# dsh-ui-primitives 实测清单

> 适用版本：DeepSeek Harness Desktop `0.2.1-rc.3`（本机安装版，2026-10-25 核对）。
> 权威来源：`@deepseek-ai/dsh-client-ui-primitives@0.2.1-rc.3` 的 `lib/types/index.d.ts`、`lib/types/icons/index.d.ts` 与包内 README；导出面与安装版 shell bundle 的 `PLATFORM_MODULES` 逐项比对，共 **290 个运行时导出**。
> 本文件用于替代逐次翻阅 node_modules / asar 源码；[../HANDBOOK.md](../HANDBOOK.md) 只保留入口和结论。`dockkit` 是另一个基线模块，不在本清单范围内。

## 0. 先记住五条

1. **导入路径**：`@deepseek-ai/dsh-client-ui-primitives`。它是 11 项基线模块之一，client bundle 的 `require` 由宿主直接解析，**不需要安装、不会被打包**，也不需要 `dsh.client.external` 声明。
2. **零 Cordis、零 slot 知识**：包本身不 import Cordis 运行时，也不感知 slot；只输出纯 React 组件、hooks 和工具函数。
3. **没有布局原语**：没有 Flex / Stack / Box / Grid 容器。布局继续用手册 §6.2 的 Tailwind `tw:` 层；本包负责控件、浮层、输出卡片和图形。
4. **文案全部由调用方提供**：包不读 locale，也没有语言回退。固定文案通过 `label` / `labels` / `copyLabel` 等 props 传入；`Button`、`Pill`、`Tag` 的可见文字由 `children` 提供。遗漏文案是类型错误，不是运行时兜底。
5. **样式只消费 `--dsw-*` token**：组件自带视觉，`className` 只用于调用方定位和布局。不要复制一份已有控件；确实需要视觉差异时优先加 prop，第二个功能包也需要同一控件时再考虑上游。

## 1. 使用契约

源码里按普通 ESM 导入，tsdown 会把它保留为 external：

```tsx
import {
  Button,
  Menu,
  MenuItemButton,
  Modal,
  Toast,
  MarkdownText,
  TerminalBlock,
  IconPlayOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
```

手写 `lib/client.js` 或用 `require` 的场景：

```js
const {
  Button,
  Menu,
  MenuItemButton,
  Modal,
  Toast,
  MarkdownText,
  TerminalBlock,
  IconPlayOutlineRegular,
} = require('@deepseek-ai/dsh-client-ui-primitives');
```

约束：

- `react` 同样走基线模块表，用 `require('react')` 或源码里的 `import ... from 'react'`；不要从 primitives 包里取 React。
- 运行时不需要在插件 `package.json` 安装本包；仓库当前也未安装。需要编辑器类型提示时，可把同版本包加为 devDep，tsdown 的 `neverBundle` 仍会把它保持为 external，不会进入产物。
- 图标 API 是 `{ size?: number, className?: string }`，颜色走 `currentColor`。`Regular` 是 1px 描边，`Medium` 是同一几何的 1.3px 描边；选哪一档应在 import 处显式可见。
- 所有图形都是装饰性的，不自带可访问名称；需要名称时由调用方补文本或 `aria-label`。
- 浮层组件（`Tooltip`、`HoverCard`、`Menu`、`Modal`、`Toast`、`ImageLightbox`）都通过 body portal 或固定定位渲染；祖先的 `overflow`、`transform`、`filter` 不会裁剪它们。

## 2. 导出总量（0.2.1-rc.3）

| 类别 | 数量 | 构成 |
|------|-----:|------|
| 组件 | 52 | 控件、行/状态、菜单/浮层、Markdown/输出卡片、设置表单、品牌/插画/文件图形 |
| 产品图标 | 190 | 95 个基名 × `Regular` / `Medium` |
| 权限/引用/链接图形 | 12 | 8 个权限图标 + 2 个引用图标 + 2 个链接图标 |
| hook / 工具 / 常量 / 类 | 36 | 浮层与焦点、文件与格式化、代码高亮、设置模型、常量 |
| **合计** | **290** | 安装版运行时导出 |

> `ImagePreview`、`FoldToggle`、`CodeToolbar`、`useMarkdownDelegate`、`TooltipSuppression` 等名字在包内类型文件里出现，但**没有从包入口导出**，不属于公共 API。

## 3. 控件与输入

| 导出 | 功能特征 | 关键 props / 行为 |
|------|----------|-------------------|
| `Button` | 可点击操作按钮 | `variant`: `primary` / `ghost`（默认）/ `outline` / `toolbar`；`size`: `md`（36px 高、12px 圆角）或 `sm`（28px 高、8px 圆角）；`icon` 为前置 16px 图标；`ref` 指向原生 `<button>`，可用于焦点管理与浮层锚定；原生按钮属性透传 |
| `Switch` | 36×20 双态开关 | 完全受控：`checked` + `onChange(next)`；`label` 必填（可访问名称）；`disabled` 时半透明；`title` 用于解释锁定原因 |
| `Checkbox` | 带标签的原生复选框 | `checked` + `onChange(next)`；`label` 为可见且可访问的本地化文本；`disabled`、`title`、`className` |
| `Input` | 单行文本输入 | 可选 `icon`（16px 前置图标）；原生 input 属性透传；`ref` 指向原生 input，卸载时清空 |
| `InlineEditor` | 短草稿的多行行内编辑器 | 自动聚焦的 `<textarea>`；随文本长高，最多 6 行后滚动；Enter 保存，Shift+Enter 换行，IME 组合中的 Enter 不触发，Esc 取消；`value` / `label` / `onChange` / `onSave` / `onCancel` |
| `SegmentedControl` | 互斥模式切换的分段 tablist | 受控：`id`、`value`、`options`（至少 2 项）、`onChange`、`label`；`id` 派生每个 tab 的 `<id>-<value>` 与其控制的 `<id>-<value>-panel`；`disabled` 锁住全部分段 |
| `SegmentedTabs` | 等宽分段标签 + 滑动指示条 | 受控：`items`（每项含 `value` / `label` / `id` / `panelId`）、`value`、`onChange`、`label`；左右方向键、Home/End 导航；面板由调用方渲染 |
| `Pill` | 可选中胶囊 chip | 有 `onClick` 时渲染为按钮，否则为静态 span；`active` 控制选中态；适合视图切换与筛选器，或需要落在 24px 文本行上的静态胶囊 |
| `Tag` | 只读胶囊徽章 | `tone`: `outline`（默认）/ `solid` / `neutral` / `quiet` / `success` / `info` / `warning` / `danger`；不可交互 |
| `ShortcutKeys` | 展示一组快捷键 | `keys: readonly string[]`；`variant`: `plain`（默认，无键帽）或 `tooltip`（深色键帽，加号组合共用填充）；不拥有绑定默认值，也不负责本地化文案 |
| `CommandText` | 可选择的命令/参数文本 | `text`、`label`；只有横向溢出时才成为具名的键盘焦点目标，完整可见时不增加 Tab 停靠点 |

## 4. 行、状态与进度

| 导出 | 功能特征 | 关键 props / 行为 |
|------|----------|-------------------|
| `PathLabel` | 单行文件路径标签 | `path`；目录弱化、文件名主色；悬停显示完整路径；空间不足时保留尾部并在左侧渐隐；`ResizeObserver` 可用时随尺寸更新 |
| `StateDot` | 10px / 14px 状态圆点 | `state`: `done` / `warning` / `ongoing` / `error` / `idle`；`appearance`: `dot`（默认）或 `step`（实心勾完成、空心圆待办）；`ongoing` 默认 14px 旋转 loading；组件是 `aria-hidden`，名称由渲染点提供 |
| `DisclosureRow` | 24px 紧凑折叠行 | 受控 `open` + `onToggle`；`icon`、`title`、`expandable`、`running`、`collapsedContent`、`headerAccessory`；`previewChevron` 在收起悬停时预览下箭头；`expandOnRowClick` 让整行成为触发区；浅比较 memo，回调和 React 节点需保持稳定 |
| `TextShimmer` | 行内高光扫过动画 | `active` 控制动画；嵌套实例共享外层动画；装饰性分隔符加 `data-shimmer-decoration`；活动期间 children 会渲染两次，不得带副作用或元素 id；图标和箭头应放在组件外 |

## 5. 菜单与浮层

| 导出 | 功能特征 | 关键 props / 行为 |
|------|----------|-------------------|
| `Menu` | 锚定下拉菜单 | 受控 `open` + `onClose`；`anchor` 是触发器；`items` 支持可选项、分隔线、分组标题与嵌套子菜单；`children` 可放 `MenuItemButton` 组件行；`selectedId` / `selectedIds` 只负责视觉标记；`align`（`start` / `end`）、`side`（`bottom` / `top` / `right`）；`portal` 渲染到 body，`listClassName` 是 portal 模式下唯一能触达菜单卡片的样式钩子；键盘：上下/Home/End 走位，Tab 选定，Esc/Shift+Tab 关闭并归还焦点；`onClose` 在外部点击、Esc 或窗口 blur 时触发 |
| `MenuItemButton` | `Menu` 的组件行 | `children`、`shortcut`、`icon`、`current`（`aria-current`，不改变视觉选中）、`disabled`、`danger`、`separatorBefore`、`onSelect`；与数据行共享键盘走位与焦点归还 |
| `MenuSurface` | 菜单材质容器 | 转发 `div` 属性与 ref；`compact` 使用更小圆角；macOS 上附带非交互底层，让透明窗口可获得背景模糊；默认相对定位，调用方可用 className 改成 fixed/absolute |
| `MenuGroup` | 可访问的自定义菜单分组 | `label` + `children`；渲染带实例独立标题 id 的 `role="group"`；配合 `observeStickyMenuGroups(viewport)` 让吸顶标题获得 `data-stuck` 背景；分组变化或卸载前必须清理观察器 |
| `Tooltip` | 悬停/键盘聚焦提示 | `label` 为字符串或按需解析函数；`shortcutKeys` 追加键帽；`side` 默认 `right`，放不下时尝试对侧与垂直方向；`align` 只影响上下气泡；`delayMs` / `focusDelayMs` 默认 0；`gap` 默认 8（左右固定 10）；`portal` 逃逸裁剪与层叠上下文；`openOnClick` 让点击后保持可读；children 必须是**单个**锚点元素 |
| `HoverCard` | 悬停预览卡 | `anchor` + `content`；`openDelayMs` 默认 500；`variant`: `compact` 或 `preview`（上下放置、左右 24px 内缩、最高 420px、100ms 淡入淡出）；`widthAnchorRef` 指定宽度锚点；`inline` 让锚点留在文本流内；`grouped` 与同组卡片共享首次等待；`copyText` 存在时必须提供 `copyLabel` / `copiedLabel` |
| `HoverCardGroup` | 一组悬停卡片的协调器 | `children` + `className`；让组内 `grouped` 的卡片共享首次显示等待并互斥显示，指针可在列表与 portal 卡片之间移动 |
| `Modal` | 居中模态对话框 | 受控 `open` + `onClose`；`title` 必填；非 `headless` 时 `closeLabel` 必填；`description`、`children`、`footer`、`contentClassName`；`backdropBlur` 默认 true；`headless` 去掉默认头/关闭按钮/body 外壳；初始焦点控件用 `data-modal-autofocus`，不要用 React `autoFocus`；顶层 Esc/Tab 与焦点恢复由 `useModalLayer` 统一处理；嵌套菜单先消费 Esc |
| `ImageLightbox` | 原图预览浮层 | `src`、`alt`、`labels: { dialog, close }`、`onClose`；没有 `open` prop，由调用方按条件挂载；body portal；Esc、遮罩、关闭按钮均可关闭，卸载时恢复焦点 |
| `Toast` | 顶部居中瞬时横幅 | `text`、`icon`、`tone: 'success'`、`actions`、`anchor`、`holdMs`（默认 3000）、`onDone`；淡出结束后调用 `onDone`，调用方应在那里卸载；重复展示同一文本时用递增 key 重新挂载以重启周期 |
| `RiskConfirmation` | 敏感操作确认 | `open`、`title`、`description`、`acknowledgeLabel`、`cancelLabel`、`closeLabel`、`confirmLabel`、`acknowledged`、`disabled`、`onAcknowledgedChange`、`onCancel`、`onConfirm`；未勾选确认项前主操作不可用 |
| `ConnectionIndicator` | 行内连接恢复控件 | `state`: `disconnected` / `connecting` / `recovered` 或 `undefined`；`disconnectedLabel`、`connectingLabel`、`recoveredLabel`、`reconnectActionLabel`、`restartActionLabel`、`onReconnect`；`state` 为 `undefined` 时返回 `null`；断线与重试状态点击即请求重连 |

## 6. Markdown 与 agent 输出卡片

| 导出 | 功能特征 | 关键 props / 行为 |
|------|----------|-------------------|
| `MarkdownText` | 渲染不可信 assistant Markdown | `text`、`streaming`、`labels`、`fileMentions`、`pathImages`、`variant: 'body' / 'compact'`；GFM + TeX（KaTeX）；禁用原始 HTML 与不安全协议；流式时冻结尾部两个块之外的内容，只重解析尾部；`labels` 必须是引用稳定的对象，否则流式缓存会被丢弃；`fileMentions` / `pathImages` 只在消息落定后生效 |
| `MarkdownDelegateProvider` | 给 Markdown 注入导航能力 | `openExternalLink(href)`、`openFile(path, { line? })`、`fileImages`；嵌套 Provider 替换外层；回调变化能到达已渲染链接，无需重建 Markdown |
| `CodeBlock` | 高亮代码卡片 | `code`、`lang`、`streaming`、`className`、`contentRef`、`lineNumbers`、`showHeader`、`copyLabel`、`copiedLabel`、`toolbarLabels`、`wrap`；复制内容不含行号栏；`showHeader={false}` 用于调用方自备工具栏 |
| `JsonBlock` | JSON 折叠卡片 | `label`、`payload`、`defaultOpen`、`truncatedLabel(total)`；用于 Markdown 或工具输出中的 JSON 值 |
| `JsonTree` | 只读 JSON 检查树 | `data`、`label`、`labels`、`collapsedStringLines`（默认 3）、`stringWrapping`、`copyable`、`expandTopLevel`；键盘可访问；折叠字符串展开后保留原始文本和同级逗号 |
| `TerminalBlock` | shell 命令与输出卡片 | `command`、`cwd`、`home`、`output`、`exitCode`、`signal`、`running`、`background`、`maxLines`（默认 16，`Infinity` 关闭折叠）、`copyText`、`runStateDot`、`labels`；ANSI 颜色/回车/退格/行内擦除/制表位会处理，绝对光标定位、清屏、备用屏幕会被剥离；**不是交互式终端** |
| `ReadBlock` | 文件读取结果卡片 | `label`、`lines`（每行含 1-based `number` + `text`）、`totalLines`、`lang`、`maxLines`（默认 16）、`labels`；行号栏与文件行号一致；支持语法高亮 |
| `DiffBlock` | 文件修改内联 diff | `diffs: { path, oldText, newText }[]`、`labels`、`maxLines`（默认 16）；显示实际增删行与两侧最多 3 行上下文；超过 256 次行增删的片段退化为粗粒度替换；末尾换行差异不显示为改动 |
| `SearchBlock` | 搜索结果卡片 | `kind: 'matches'`（按文件分组）或 `'paths'`（扁平路径）；`files` / `paths`、`truncated`、`total`、`maxLines`（默认 16）、`labels`；截断时在摘要中同时显示保留数与总数 |
| `WebBlock` | 网页检索结果卡片 | `kind: 'search'`（`answer` + `sources`）或 `'fetch'`（`url` + `statusCode`）；`truncated`、`labels`（含 `markdown` 子标签）；URL 为 http(s) 时才渲染为安全外链 |
| `UserTextRun` | 不解析的行内文本 | `text`；不做 Markdown 解析，也不识别引用；沿用宿主排版与换行规则 |
| `ReferenceChip` | 已解析的引用标签 | `appearance`（`session` / `file` / `folder` / `skill` / `command`）、`label`、`title`、`onActivate?`；有 `onActivate` 时渲染为键盘可操作按钮；文本选区与重复指针点击不触发激活 |

## 7. 设置表单

| 导出 | 功能特征 | 关键 props / 行为 |
|------|----------|-------------------|
| `SettingsForm` | 插件设置页表单框架 | `labels`、`state: SettingsFormShell`、`onSave`、`onDiscard`、`children`；只有 Save 会写；离开页面即丢弃草稿，不提供独立 discard 控件；命名空间不可用时显示 unavailable 文案 |
| `SettingsValueField` | 暂存值字段 | `id`、`label`、`hint`、`text`、`overridden`、`invalid`、`overriddenLabel`、`resetLabel`、`invalidLabel`、`disabled`、`onEdit`、`onReset`；可选 `help`、`numeric`（只提示数字键盘，不改变校验）、`placeholder`；控件本身不写，只上报草稿 |
| `SettingsSecretField` | 只写凭证字段 | `id`、`label`、`hint`、`text`、`disabled`、`onEdit`、`configured`、`stateLabel`；值从不随响应返回，初始为空；空草稿不写入，保留已有凭证；请求浏览器不要自动填入登录密码 |
| `SettingsFormModel` | 设置表单的暂存模型 | 构造：`scope` + 字段 `specs` + 可选 `secrets`；`bind(project)` 返回快照 store；`shell()`、`field(field)`、`actions()`、`save()`、`dispose()`；保存是 revision-fenced 的原子写入，失败时保留草稿 |
| `settingsNumberField(field)` | 整数设置字段 spec | 空草稿清除字段；非有限数字使草稿 invalid 并阻止保存 |
| `settingsTextField(field)` | 文本设置字段 spec | 空草稿清除字段，等同重置回组合层 |

相关的公共类型：`SettingsFormScope`、`SettingsFormScopeSnapshot`、`SettingsFormShell`、`SettingsFormActions`、`SettingsFieldSpec`、`SettingsFieldState`、`SettingsSecretSpec`、`SettingsFormPathOp`。

## 8. 品牌、插画、文件与权限图形

| 导出 | 功能特征 | 关键 props / 行为 |
|------|----------|-------------------|
| `FishLogo` | 品牌鱼形标志 | `size`（宽度 px，默认 24，保持 23.16:17.04 比例）、`className`；`aria-hidden`，需与文字或 wordmark 搭配 |
| `BrandWordmark` | 品牌字标 | `size`（高度 px，默认 24）、`className`、`includeMark`（是否包含前置鲸鱼标记，默认 true） |
| `PluginArtworkTerminal` / `PluginArtworkLoop` / `PluginArtworkSubagent` / `PluginArtworkSearch` / `PluginArtworkDefault` | 36×36 固定配色插件插画 | `size`、`className`；SVG def id 按实例生成，可安全重复；`Terminal` 是浅蓝提示符，`Loop` 是四叶环绕，`Subagent` 是叠放圆角方块，`Search` 是 conic-gradient 环（内嵌 HTML，不适合 `<img>`），`Default` 用于无自有插画的插件 |
| `GuideArtworkBrowser` / `GuideArtworkFiles` | 36×36 侧栏引导插画 | `size`、`className`；浏览器窗口与文件夹两种固定配色图形 |
| `FileTypeIcon` | 28px 文件/文件夹分类图形 | `path` + 可选 `context`，或直接传 `kind`；`size`、`className`；装饰性；底板颜色可用 `--dsh-file-type-icon-color` 覆盖；代码/配置类使用全彩技术图形 |
| `LinkIconRegular` / `LinkIconMedium` | 可点击链接的前置分类图形 | `kind`: `url` / `folder` / `code` / `image` / `document` / `other`；`href` 为 http(s) 且命中已知站点时改用站点标记；`size`、`className` |
| `ReferenceIconRegular` / `ReferenceIconMedium` | 引用标签的前置图形 | `kind`: `session` / `file` / `folder`；`size`、`className` |
| `PermissionIconReadOnlyRegular` / `PermissionIconReadOnlyMedium` | 只读权限图形 | `size`、`className`；同一几何的 1px 与 1.3px 两档 |
| `PermissionIconWorkspaceWriteRegular` / `PermissionIconWorkspaceWriteMedium` | 工作区写入权限图形 | 同上 |
| `PermissionIconFullAccessRegular` / `PermissionIconFullAccessMedium` | 完全访问权限图形 | 同上 |
| `PermissionIconAutoReviewRegular` / `PermissionIconAutoReviewMedium` | 自动审查权限图形 | 同上 |

配套函数：

| 导出 | 功能 |
|------|------|
| `classifyFileType(path, context?)` | 按完整文件名、前缀、后缀、项目上下文、扩展名的顺序分类；未知回退 `other` |
| `fileExtension(path)` | 返回 basename 最后一个点之后的字符，保留大小写；无点或尾点返回空串 |
| `classifyLinkPath(path)` | 由扩展名得到链接图形类别；未知/缺失回退 `other` |

## 9. 图标全集

产品图标共 **190 个导出 = 95 个基名 × 2 档线重**。每个基名都有 `Regular`（1px）与 `Medium`（1.3px）两个组件，例如 `IconSearchOutline` 对应 `IconSearchOutlineRegular` 和 `IconSearchOutlineMedium`。所有图标接受 `{ size?: number, className?: string }`，颜色走 `currentColor`，且是装饰性的。

**导航与布局（14）**

`IconChevronDownOutline`、`IconChevronLeftOutline`、`IconChevronRightOutline`、`IconChevronUpOutline`、`IconChevronsUpDownOutline`、`IconTriangleRightFill`、`IconTreeCorner`、`IconPanelLeftOutline`、`IconFullscreenOutline`、`IconCompactOutline`、`IconFlatListOutline`、`IconWorkspaceTreeOutline`、`IconBrowseOutline`、`IconRightUpOutline`

**文件与项目（5）**

`IconFolderOpen`、`IconFolderOpenOutline`、`IconFolderClose`、`IconProjectAddOutline`、`IconNewChatOutline`

**操作与编辑（40）**

`IconPlusOutline`、`IconCloseOutline`、`IconCloseFill`、`IconCloseCircleFill`、`IconCheckOutline`、`IconCopyOutline`、`IconEditOutline`、`IconTrashOutline`、`IconDownloadOutline`、`IconShareOutline`、`IconLinkOutline`、`IconPaperclipOutline`、`IconPaperPlaneOutline`、`IconSendOutline`、`IconRefreshOutline`、`IconPlayOutline`、`IconPauseOutline`、`IconStopFill`、`IconLoadingOutline`、`IconSearchOutline`、`IconSettingsOutline`、`IconSlidersTwoOutline`、`IconEllipsisOutline`、`IconPinOutline`、`IconPinFill`、`IconUnarchiveOutline`、`IconArchiveOutline`、`IconArchiveCheckOutline`、`IconArchiveOffOutline`、`IconWrapLinesOutline`、`IconNowrapFill`、`IconWrapFill`、`IconCompareSplitOutline`、`IconQueueOutline`、`IconChecklistOutline`、`IconListPenOutline`、`IconAppsAddOutline`、`IconAlarmClockOutline`、`IconClockOutline`、`IconMicrophoneOutline`

**状态与提示（8）**

`IconCheckCircleFill`、`IconCheckCircleOutline`、`IconWarningOutline`、`IconWarningTriangleOutline`、`IconInfoOutline`、`IconQuestionOutline`、`IconShieldOutline`、`IconGaugeOutline`

**内容、工具与 Agent（19）**

`IconCodeOutline`、`IconDataOutline`、`IconDatabaseOutline`、`IconApiOutline`、`IconGlobeOutline`、`IconDeliverDoc`、`IconSparkle`、`IconThinkOutline`、`IconAgentPresetOutline`、`IconSkillOutline`、`IconGoalOutline`、`IconPlanOutline`、`IconInspectOutline`、`IconEnhanceOutline`、`IconContextInjectionOutline`、`IconPersonalizationOutline`、`IconCordisPluginOutline`、`IconPluginPinwheelOutline`、`IconBranchOutline`

**用户与反馈（6）**

`IconUserOutline`、`IconUsersOutline`、`IconLikeOutline`、`IconLikeFill`、`IconDislikeOutline`、`IconDislikeFill`

**外观与平台（3）**

`IconLightOutline`、`IconDarkOutline`、`IconFollowsystemOutline`

> 特殊图形：`IconWarningOutline` 是圆形警告，`IconWarningTriangleOutline` 是圆角三角警告；`IconThinkOutline` 的轨道在 16px 视口内保留内边距；`IconAppsAddOutline` 接受 `compact`，卡片尺寸下让方块更靠近。

## 10. Hooks、工具与常量

### 10.1 浮层、焦点与键盘

| 导出 | 功能 |
|------|------|
| `useAnchoredPosition(options)` | 让 fixed 浮层跟随锚点；监听 scroll（capture）、resize 与面板尺寸；返回 `{ left, top }` 或首次测量前 `null`；options：`open`、`anchorRef`、`panelRef`、`side`、`align`、`gap`、`margin` |
| `useAnchoredMaxHeight(ref, cap, signal, margin?)` | 把底部锚定浮层的 `max-height` 钳制在视口内；`signal` 变化时重新测量 |
| `useDismissOnOutsidePointer(root, open, setOpen, portal?)` | 外部 `pointerdown` 时关闭浮层；portal 容器也算内部 |
| `useModalLayer(dialog, open, onClose)` | 顶层模态的 Esc/Tab 所有权与焦点恢复；初始焦点用 `data-modal-autofocus` 标记 |
| `closeTopModal(document)` | 请求关闭前台已注册模态；上层的菜单或未注册对话框会阻止关闭其后的模态 |
| `isBehindModal(anchor)` | 判断控件是否位于当前模态之后，从而让出键盘输入 |
| `modalSelector` | 对话框/菜单选择器：`[role="dialog"][aria-modal="true"], [role="menu"]` |
| `focusWithoutRing(element, options?)` | 自动聚焦但不显示焦点外框，直到 Tab/方向键导航恢复常规焦点样式 |
| `observeComposition(document)` | 提供 IME composition 守卫与 `dispose()`；用于局部键盘处理，避免组合输入误触发 |
| `pointerModality()` | 上一次输入是否来自指针；供 Tooltip 与焦点环样式共用 |
| `observeStickyMenuGroups(viewport)` | 观察 `MenuGroup` 分组吸顶状态并维护 `data-stuck`；返回清理函数；分组变化或卸载前必须调用 |

### 10.2 文件、文本与格式化

| 导出 | 功能 |
|------|------|
| `classifyFileType(path, context?)` | 文件类型分类，见 §8 |
| `fileExtension(path)` | 提取最终扩展名，见 §8 |
| `classifyLinkPath(path)` | 链接图形分类，见 §8 |
| `fileSizeText(bytes)` | 紧凑字节数文本：`312B`、`4.2KB`、`1.5MB`、`2.4GB` |
| `relativeTime(at, now)` | 返回 `{ unit, n }` 结构化相对时间；文案由调用方本地化 |
| `rankByName(items, rawQuery)` | `/` 菜单候选排序：不区分大小写的有序子序列匹配；前缀命中优先，其次对齐分数，再按来源顺序 |
| `extractMarkdownPlainText(markdown, options?)` | 把 GFM 投影为纯文本；`mode`: `all` / `first-line` / `first-paragraph`；原始 HTML 保持字面，链接保留 label，图片保留 alt |
| `diffTotals(diffs)` | 统计显示层的增删行数；超过精确比较上限的片段按整体替换计数 |
| `writeClipboard(text)` | 优先 Clipboard API，回退 `execCommand('copy')`；返回是否成功 |
| `isDarwinDesktop()` | 是否运行在 macOS Electron 外壳（`<html data-platform="darwin">`）；纯 Web 为 false |

### 10.3 代码高亮

| 导出 | 功能 |
|------|------|
| `useCodeHighlighter(language)` | 绑定共享惰性高亮器；语法加载完成后刷新；未知/加载中语法返回 `undefined`，调用方回退纯文本 |
| `languageForPath(path)` | 由文件名选择 grammar；来自 `@deepseek-ai/dsh-util-code-language` |
| `CODE_HIGHLIGHT_EXTENSIONS` | 代码预览与 diff 共用的扩展名映射表 |

### 10.4 设置模型

见 §7：`SettingsFormModel`、`settingsNumberField`、`settingsTextField`。

### 10.5 常量

| 导出 | 值 / 用途 |
|------|-----------|
| `DEFAULT_TERMINAL_MAX_LINES` | `16`；终端卡片折叠前的最大行数 |
| `DEFAULT_READ_MAX_LINES` | `16`；读取卡片折叠前的最大行数 |
| `DEFAULT_DIFF_MAX_LINES` | `16`；diff 卡片折叠前的最大行数 |
| `DEFAULT_SEARCH_MAX_LINES` | `16`；搜索卡片折叠前的最大行数 |
| `ICON_REGULAR_STROKE` | `1`；Regular 图标描边宽度 |
| `ICON_MEDIUM_STROKE` | `1.3`；Medium 图标描边宽度 |
| `FISH_LOGO_PATH` | 鱼形 SVG path 数据，供自定义 SVG / 入场动画复用 |
| `FISH_LOGO_VIEWBOX` | `{ width, height }`，鱼形原始视口 |
| `SHIELD_OUTLINE_PATH` | 盾形轮廓 path，供复合图标复用 |

## 11. 选型速查

| 需求 | 选择 | 理由 |
|------|------|------|
| 只读状态徽章 | `Tag` | 11px 只读胶囊，8 种语义色 |
| 可选中/可筛选 chip | `Pill` | 有 `onClick` 时是可操作按钮；可同时激活多个 |
| 互斥模式切换 | `SegmentedControl` 或 `SegmentedTabs` | 带 tablist 语义与滑动指示条；前者自带 panel id 派生，后者由调用方管面板 |
| 折叠过程/详情行 | `DisclosureRow` | 固定 24px 的标题+内容行，不是卡片 |
| 名称叠描述的卡片 | 业务组件 | 不属于 primitives；参考 `ui-settings-plugins` 的 `PluginCard` |
| 小气泡提示 | `Tooltip` | 单锚点、键盘聚焦、可 portal；不要用于可阅读长内容 |
| 可阅读/可复制的悬停预览 | `HoverCard` | 支持指针进出、复制按钮、preview 布局与分组互斥 |
| 长驻模态表单 | `Modal` | 顶层 Esc/Tab、焦点恢复、遮罩与可访问标题 |
| 敏感操作二次确认 | `RiskConfirmation` | 勾选前禁止主操作；页内确认，不抢模态层级 |
| 原图查看 | `ImageLightbox` | 调用方条件挂载；Esc/遮罩/关闭按钮；焦点恢复 |
| 瞬时成功/失败提示 | `Toast` | 由 owner 控制 `holdMs` 与 `onDone`；不阻塞交互 |
| 连接恢复 | `ConnectionIndicator` | 断线/重试/恢复三态，点击立即重连 |
| 通用布局 | Tailwind `tw:` | primitives 没有 Flex/Stack/Box；不要为布局造组件 |
| 按钮/菜单/弹层基础件 | primitives | 不要复制已有控件；第二次出现同一需求时考虑上游 |

## 12. 行为边界与坑

- **文案必须自带**：没有 locale 上下文。`Menu`/`Modal`/`MarkdownText`/输出卡片/`Tooltip` 等的 label 漏传会在类型层失败；运行时不兜底。
- **`MarkdownText.labels` 必须引用稳定**：每 locale 版本 memo 一次；新对象身份会丢弃流式渲染缓存。
- **`MarkdownText` 的 `fileMentions` / `pathImages` 只在落定消息生效**：流式期间词表未定，不把处理器烘进冻结块。
- **`TextShimmer` 活动时 children 渲染两份**：一份可见、一份惰性装饰副本；children 不得有副作用或元素 id。
- **`DisclosureRow` 是浅比较 memo**：`onToggle`、React 节点等 props 需稳定，否则每次父渲染都重算。
- **`Menu` 的选中态只是视觉**：`selectedId` / `selectedIds` 不改变菜单状态；关闭、选中后的业务状态由 owner 管。
- **`Menu` portal 模式下 `listClassName` 是唯一样式钩子**：portal 列表渲染在 body 下，普通祖先选择器够不到。
- **`Tooltip` 只接受单个锚点元素**：多个子节点会破坏 ref/handler 注入；需要一组提示时分别包。
- **`Modal` 的初始焦点用 `data-modal-autofocus`**：React `autoFocus` 会在模态层保存触发控件之前执行，导致焦点无法归还。
- **`Modal` 内嵌菜单先消费 Esc**：菜单打开时 Esc 关菜单，不关模态；嵌套对话框可用 `onKeyDownCapture` 抢在文档级 Esc 前处理。
- **`ImageLightbox` 没有 `open` prop**：由调用方条件渲染；关闭后恢复 opener 焦点。
- **`Toast` 用递增 key 重启周期**：`holdMs` 不变时父重渲染不会延长生命周期；淡出结束后必须 `onDone` 卸载。
- **`HoverCard` 的复制标签是联合类型**：传 `copyText` 时必须同时传 `copyLabel` / `copiedLabel`。
- **`ConnectionIndicator` 可能返回 `null`**：`state` 为 `undefined` 时无渲染，调用方不要把布局挂在它必然存在上。
- **`CodeBlock` 复制不含行号**：行号是展示层；`lineNumbers` 不进入剪贴板。
- **`TerminalBlock` 不是终端模拟器**：支持 SGR、回车、退格、行内擦除、制表位、字符宽度；绝对光标定位、清屏、备用屏幕会被剥离；`maxLines: Infinity` 关闭折叠，改由宿主 `--dsl-terminal-output-max-height` 限高。
- **`TerminalBlock` 的 `background` 语义不同**：`running` 只描述启动调用；回执后保留命令，不显示 job 状态或输出。
- **`DiffBlock` 精确比较有上限**：单片段超过 256 次行增删即退化为整体替换；末尾换行差异不算改动。
- **`SearchBlock` 的截断要显示总数**：`truncated` 为 true 时摘要同时给保留数与 `total`，不能把截断结果说成完整。
- **`StateDot` 是 `aria-hidden`**：必须与文字配对；`ongoing` 默认 14px，实心状态默认 10px。
- **`SettingsForm` 离开即丢弃**：只有 Save 写；没有独立 discard 控件；卸载时调用 `onDiscard`。
- **`SettingsSecretField` 空草稿不写**：这是“保留已有 key”的语义，不是清空；要清空需由业务提供明确操作。
- **`SettingsFormModel` 保存失败保留草稿**：Host 的校验器才是权威，保存后会回读；不要在前端预测成功。
- **`FileTypeIcon` 的底板色可覆盖**：`--dsh-file-type-icon-color`；全彩技术图形保留内嵌调色板，不受该变量影响。
- **`PluginArtworkSearch` 含 HTML conic-gradient**：只在浏览器内联渲染有效，放进 `<img>` 或 mask 会显示为空。
- **`observeStickyMenuGroups` 必须先清理再重观察**：分组变化（含筛选）或卸载时 `dispose()`；否则旧观察器会继续写 `data-stuck`。

## 13. 版本核对方法（维护者）

本文件锁定安装版 `0.2.1-rc.3`。升级 dsh 后按以下步骤重新核对：

```bash
npm pack @deepseek-ai/dsh-client-ui-primitives@<version>
tar -xzf dsh-client-ui-primitives-<version>.tgz
```

然后以解包后的 `package/lib/types/index.d.ts` 与 `package/lib/types/icons/index.d.ts` 为准：

```bash
# 产品图标导出数（0.2.1-rc.3 为 190）
grep -cE '^export declare const Icon.*(Regular|Medium)' \
  package/lib/types/icons/index.d.ts

# 入口具名运行时导出（0.2.1-rc.3 为 97；另有 3 个图标常量经 export * 导出）
grep -oE 'export \{[^}]*\}' package/lib/types/index.d.ts \
  | sed -E 's/export \{//; s/\}//' \
  | tr ',' '\n' \
  | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' \
  | grep -v '^type ' | grep -v '^$' \
  | sort -u
```

核对要点：

1. `lib/types/index.d.ts` 是公共入口；只出现在其他 `.d.ts` 里、没有从入口 re-export 的名字不算公共 API。
2. 图标基名数量 × 2 应等于 `icons/index.d.ts` 里的产品图标导出数；当前为 95 × 2 = 190。`icons/index.d.ts` 另有 3 个常量（`ICON_REGULAR_STROKE`、`ICON_MEDIUM_STROKE`、`SHIELD_OUTLINE_PATH`），总计 193 条 `export declare const`。
3. 权限/引用/链接图形是单组件多 `kind`，不要按 kind 重复计数。
4. 安装版 shell bundle 的 `PLATFORM_MODULES` 也应包含 `@deepseek-ai/dsh-client-ui-primitives`；若 npm 包版本与 Desktop 版本不一致，以 Desktop 安装版为准，并在本文件顶部更新适用版本。
