# `$pageview` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 20:29:02

## 1. 事件概览

`$pageview` 是神策 Web JS SDK 全埋点中的 **Web 页面浏览**事件，用于记录用户打开或浏览一个 Web 页面时的页面地址、路径、标题和来源等上下文。

它是 Web 页面级入口事件，回答“用户浏览了哪个页面、从哪里进入”。它不是元素点击、视区停留或页面整体浏览时长事件。

### 运行环境与触发口径

**多页面 Web 应用：**每次浏览器加载新页面并正确初始化 Web JS SDK、调用自动采集入口时，通常产生一条 `$pageview`。

**SPA 单页应用：**首次加载可以产生 `$pageview`；后续路由变化不刷新页面，需要启用 SDK 的 SPA 采集配置或手动补采，才能把虚拟路由视为新的页面浏览。

**H5 页面：**移动浏览器中的 H5 页面按 Web URL 和页面上下文采集 `$pageview`。

**App 内嵌 H5：**WebView 内 H5 接入 Web JS SDK 后，页面浏览上报为 `$pageview`，不是 App 原生 `$AppViewScreen`。

**App 原生端：**iOS、Android、HarmonyOS App SDK 不使用 `$pageview`；原生页面浏览使用 `$AppViewScreen`。

**小程序端：**小程序页面浏览使用 `$MPViewScreen`，不使用浏览器 `$pageview`。

神策 Web 全埋点包含 Web 页面浏览、Web 元素点击、Web 视区停留三类事件，分别对应 `$pageview`、`$WebClick`、`$WebStay` 的核心语义位置。

### 自动采集与手工采集

Web JS SDK 通常通过 `sensors.quick('autoTrack')` 在页面加载后自动采集一条 `$pageview`。多页面应用的每个新页面需要正确初始化或调用采集入口。

SPA 路由切换不会天然触发页面刷新。如果只在首次加载调用一次 `autoTrack`，后续虚拟页面可能没有新的 `$pageview`；开启路由监听或手工调用页面浏览采集后，每次符合规则的路由变化可产生对应事件。

业务主动调用页面浏览接口也可能触发 `$pageview`。自动采集和手工采集同时覆盖同一次浏览时，会造成重复事件、PV 虚高和漏斗起点膨胀。

## 2. 关键属性

| 属性名 | 显示名 | 类型 | 含义 |
| --- | --- | --- | --- |
| `$url` | 页面地址 | 字符串 | 当前页面完整 URL |
| `$url_path` | 页面路径 | 字符串 | 当前页面 path |
| `$title` | 页面标题 | 字符串 | 当前 `document.title` |
| `$referrer` | 前向地址 | 字符串 | 浏览器 referrer |
| `$referrer_host` | 前向域名 | 字符串 | referrer 的 host |
| `$latest_referrer` | 最近一次站外来源 | 字符串 | 最近一次来源地址，具体口径依赖 SDK 版本和配置 |
| `$latest_traffic_source_type` | 最近一次流量来源类型 | 字符串 | 搜索、直接、引荐等流量来源分类 |
| `$latest_search_keyword` | 最近一次搜索关键词 | 字符串 | 搜索来源关键词，是否存在依赖来源解析 |

`$url` 和 `$url_path` 是页面识别与聚合的基础。参数过多、URL 规范化不足或虚拟页面命名不一致，会把同一业务页面拆成多个统计对象。

`$title` 便于业务人员阅读，但动态标题、多语言和运行时更新会影响长期稳定性，不能脱离 URL 规则单独作为唯一页面标识。

`$referrer`、`$referrer_host` 和 `$latest_*` 系列用于来源分析，但会受浏览器隐私策略、跨域 referrer、广告参数清洗、SDK 版本和配置影响。

## 3. 神策口径下的场景解释

`$pageview` 记录一次 Web 页面级浏览入口。是否产生事件取决于页面加载、SPA 路由配置、手工调用、合规授权和实际发送状态。

### 场景一：打开普通 Web 页面

**多页面 Web 应用：**用户从搜索结果进入官网首页，页面加载后初始化 Web JS SDK 并调用 `sensors.quick('autoTrack')`。SDK 发送 `$pageview`，记录 URL、标题和来源地址。

该事件是页面 PV / UV、入口页、来源和路径分析的基础。

### 场景二：从首页进入详情页

**多页面 Web 应用：**用户点击商品详情链接，浏览器加载新页面。详情页再次初始化 SDK 并自动采集 `$pageview`。

首页和详情页两条 `$pageview` 可构成页面路径；中间点击可由 `$WebClick` 补充。

### 场景三：SPA 路由切换

**SPA 单页应用：**用户在 React 或 Vue 应用中从 `/home` 切换到 `/product/123`，页面不刷新，只改变路由和组件状态。

未配置 SPA 页面浏览采集时，可能只有首次加载的一条 `$pageview`；配置路由监听或手工补采后，路由切换会产生新事件。该差异直接决定页面路径和漏斗是否完整。

### 场景四：App 内嵌 H5 页面浏览

**App 内嵌 H5：**WebView 打开 H5 活动页，H5 初始化 Web JS SDK 后产生 `$pageview`。该事件属于 Web 页面浏览，不是 App 原生 `$AppViewScreen`。

原生页面和 H5 页面应分端分析；跨端路径需要明确页面类型和事件来源。

### 场景五：重复触发页面浏览

**Web 页面：**页面初始化时自动调用 `autoTrack`，业务代码又手工上报同一次页面浏览，导致两条 `$pageview`。

重复上报会抬高 PV、虚增漏斗起点。数据恢复和校验时需要同时检查 SDK 初始化与手工采集逻辑。

### 场景六：隐私同意前不采集

**Web 页面：**合规模式要求用户授权后才采集或发送。用户打开页面但未同意即离开，可能没有 `$pageview`。

漏斗起点分析必须区分“没有访问”和“访问但未授权采集”，不能把合规缺失解释为真实未访问。

## 4. 与相近事件的边界

### 与 `$WebClick`

`$pageview` 是页面级入口，描述用户浏览了哪个页面；`$WebClick` 是元素级交互，描述用户点击了哪个 DOM 元素。

一个页面浏览内可以有多条点击，也可以没有点击。解释 `$WebClick` 时通常需要关联 `$pageview` 的页面上下文；SPA、缓存和延迟上报场景应结合 URL、会话和用户标识核验。

### 与 `$WebStay`

`$pageview` 描述页面是否被浏览；`$WebStay` 描述页面内某个浏览器视区是否形成有效停留。

一个 `$pageview` 内可以产生多条 `$WebStay`。有页面浏览不代表一定达到视区停留阈值；`$WebStay` 也不能替代 `$pageview` 统计页面 PV。

### 与 `$AppViewScreen`

两者都处于页面级浏览入口，但运行环境和页面标识不同。

**iOS：**原生页面浏览使用 `$AppViewScreen`，页面身份按 ViewController 等 App 端口径处理。

**Android：**原生页面浏览使用 `$AppViewScreen`，页面身份按 Activity 等 App 端口径处理。

**HarmonyOS：**原生页面浏览使用 `$AppViewScreen`，页面身份按 UIAbility 等 App 端口径处理。

**Web / H5：**浏览器页面和 App 内嵌 H5 使用 `$pageview`，页面身份依赖 URL、path、title、referrer 和 SPA 路由。

跨端路径分析需要保留原生页面与 H5 页面类型，不能直接合并事件或页面标识。

### 与 `$MPViewScreen`

**微信小程序：**页面进入使用 `$MPViewScreen`，页面身份基于小程序 Page 路由和宿主生命周期。

**Web / H5：**页面浏览使用 `$pageview`，页面身份基于浏览器 URL、document title、referrer 和 SPA 路由。

两者都表示页面级浏览，但生命周期、URL / path 规则和来源字段不同，不能直接合并统计。

### 与 `$WebPageLeave`

`$pageview` 是页面浏览入口；`$WebPageLeave` 是页面浏览出口 / 页面整体时长事件，通常在页面离开、隐藏或可见状态变化时上报。

`$pageview` 本身不提供完整页面浏览时长。页面时长应结合 `$WebPageLeave.$event_duration` 或业务自定义口径。

`Index.md` 没有把 `$WebPageLeave` 列为既定调查对象，本文仅用它说明边界。

### 与 `AppCrashed`

`AppCrashed` 是 App 原生端崩溃事件；`$pageview` 是 Web 页面浏览事件，两者没有直接配对关系。

App WebView 崩溃可能使后续页面离开或点击事件丢失；已经成功发送的 `$pageview` 不会因此回滚。页面浏览是否成功上报仍取决于 SDK 发送时机、缓存策略和崩溃时机，神策文档没有给出确定保证。

## 5. 核验结论与适用边界

### 当前结论

`$pageview` 是 Web 页面浏览的基础全埋点事件，是页面 PV / UV、入口页、来源、路径和 Web 漏斗起点的主要数据源。

它最适合回答“用户浏览了哪个 Web 页面”，不能单独回答“点击了什么”“哪些区域被有效看到”或“页面整体停留多久”。

### 指标处理口径

| 指标 | 是否依赖 `$pageview` | 理由 |
| --- | --- | --- |
| 页面 PV / UV | 强依赖 | Web 页面浏览基础事件 |
| 入口页分析 | 强依赖 | 首次页面浏览可作为入口页判断基础 |
| 页面路径分析 | 强依赖 | 多条 `$pageview` 可串联页面路径 |
| Web 漏斗起点 | 强依赖 | 页面浏览通常是页面级漏斗起点 |
| 点击转化分析 | 中依赖 | 需与 `$WebClick` 关联判断浏览后点击 |
| 区域触达率 | 不直接依赖 | 应使用 `$WebStay` |
| 页面整体停留时长 | 不建议单独依赖 | 需要 `$WebPageLeave` 或自定义时长事件 |
| 异常分析 | 弱依赖 | 可辅助定位异常前所在的 H5 页面 |

### 待核验事项

- Web 端是否实际接入神策 Web JS SDK，SDK 版本及页面浏览采集开关。
- 站点是多页面应用、SPA 还是混合模式。
- SPA 路由是否配置页面浏览补采，哪些路由变化应计为页面浏览。
- 是否同时存在 `autoTrack` 和手工页面浏览，是否产生重复上报。
- CLKLOG / CDP 是否对 `$pageview` 二次封装、改名或补充业务字段。
- 8 个页面和来源字段在生产数据中的完整性、类型和版本差异。
- URL 参数清洗、规范化、虚拟页面命名和动态标题规则。
- 浏览器隐私、跨域和广告参数清洗对 referrer / `$latest_*` 的影响。
- App WebView 内 `$pageview` 的初始化、缓存和发送可靠性。
- 用户授权前后的页面浏览采集和发送差异。

### 关键假设与适用限制

- 当前口径假设页面接入神策 Web JS SDK，并启用页面浏览采集；生产体系二次封装或改名后只能以本文作为基准对照。
- 多页面应用必须在每次页面加载时正确初始化或调用采集入口，否则页面浏览会缺失。
- SPA 必须监听虚拟路由或手工补采，否则通常只有首次加载事件。
- 自动和手工采集重叠会造成重复 `$pageview`、PV 虚高和漏斗起点膨胀。
- `$url`、`$url_path` 和虚拟页面命名不规范会拆分同一页面或错误合并不同页面。
- 动态 title 和多语言会降低 `$title` 的稳定性。
- referrer 和 `$latest_*` 会受浏览器隐私、跨域、来源解析、SDK 版本和配置影响。
- 合规授权前禁止采集会造成预期内首访缺失，不能解释为没有访问。
- `$pageview` 不是页面整体时长事件，也不能与 App、小程序页面浏览直接合并。
- 当前尚未验证生产数据中的事件存在性、字段完整性、SPA 归属、WebView 发送和授权差异。

## 附录一：参考文献

- 神策官方，Web JS SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_js_preset_properties/v0300>
- 神策官方，全埋点和点击图（Web）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_web_all_use/v0300>
- 神策官方，Web JS SDK 基础集成：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_web_use/v0300>
- 神策官方，Web JS SDK 单页面应用采集：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_web_spa/v0300>
- 已建立口径文档，`$WebClick.md`：提供 Web 元素点击与页面浏览的边界。
- 已建立口径文档，`$WebStay.md`：提供 Web 视区停留与页面浏览的边界。
- 已建立口径文档，`$MPHide.md`：提供 App 与小程序事件组已完成的阶段状态。

## 附录二：调查背景与过程记录

### 调查目标

原调查任务用于澄清 `$pageview` 的实际业务场景、触发时机、属性、自动与手工采集边界、相近事件差异和分析价值，并建立 Web 页面级入口基准。

调查以神策 Web JS SDK 公开文档为主要解释基础，不展开 `AppCrashed` 的完整定义。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 剩余清单包含 `$WebStay`、`$WebClick`、`$pageview`、`AppCrashed`。
- 每个 event 至少需要分析实际场景、端类型、触发时机、相近事件差异和分析价值。
- `Index.md` 没有单独定义 `$pageview`。

### 来自 `$MPHide.md` 的阶段输入

- App 事件组 6 个事件已完成调查。
- 小程序事件组 4 个事件已完成调查。
- 后续范围是 Web 事件组 `$WebStay` / `$WebClick` / `$pageview` 与异常事件 `AppCrashed`。
- `$MPHide.md` 只提供阶段状态，不用于套用 Web 页面定义。

### 来源区分与推导过程

事件定义、端归属、页面浏览语义、页面和来源属性、`sensors.quick('autoTrack')`、Web 全埋点分类及 SPA 路由采集要求来自神策官方文档。

PV / UV、入口页、页面路径、漏斗、异常辅助等指标关系，以及 URL 规范化、重复上报、WebView 可靠性和授权差异，属于基于字段和采集机制的推导或待核验判断。

### 原任务完成状态

- 已说明 `$pageview` 是 Web 页面级浏览入口，不是点击、视区停留或页面整体时长事件。
- 已明确多页面、SPA、H5、App 内嵌 H5 等运行环境和页面采集依赖。
- 已说明普通页面自动采集、SPA 路由补采、手工触发及重复上报风险。
- 已记录 8 个页面和流量来源字段。
- 已给出普通页面、详情页、SPA 路由、App 内嵌 H5、重复采集、隐私授权等场景。
- 已明确与 `$WebClick`、`$WebStay`、`$AppViewScreen`、`$MPViewScreen`、`$WebPageLeave`、`AppCrashed` 的边界。
- 已标注 SDK、采集开关、SPA、重复上报、URL / title 规范化、WebView、授权和生产数据未验证等限制。
