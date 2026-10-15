# `$MPViewScreen` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 19:12:00

## 1. 事件概览

`$MPViewScreen` 是神策微信小程序 SDK 预置的**小程序浏览页面**事件，用于描述用户打开一个小程序页面。神策官方定义的触发时机是“打开一个小程序页面时触发”，它属于页面级浏览入口，不等同于小程序进入前台可见。

### 运行环境与触发口径

**微信小程序：**神策 SDK 通过代理微信原生 `Page.onLoad(options)` / `Page.onShow()` 生命周期回调采集 `$MPViewScreen`。冷启动进入首个页面、打开新页面或通过外部入口直接打开指定页面时均可能触发。

**App 原生端：**iOS、Android、HarmonyOS App SDK 不提供 `$MPViewScreen`；App 页面浏览使用 `$AppViewScreen`，但触发对象和页面身份口径与小程序不同。

**Web 端：**Web JS SDK 不提供 `$MPViewScreen`。

**服务端：**服务端 SDK 不提供 `$MPViewScreen`。

**其他小程序平台：**支付宝、抖音、百度等平台是否存在同名同语义事件，需要对照各自神策 SDK 文档；本文只以微信小程序 SDK 为基准。

微信小程序 SDK 上报的事件带 `$lib = MiniProgram`，可作为端归属标识。`$MPViewScreen` 是微信小程序宿主专属的预置事件，不存在跨端同名同语义事件。

`$MPViewScreen` 由 `autoTrack.mpViewScreen` 控制，默认值为 `true`。设为 `false` 后，不再自动采集该事件。神策将其归入小程序 SDK 通用性采集能力，开启 `autoTrack` 后自动采集。

### 采集机制

神策 SDK 初始化时保存微信原生 `Page` 构造函数，并替换为 SDK 代理函数。业务仍可正常调用 `Page({ onLoad(options) {...}, onShow() {...} })`，无需为 `$MPViewScreen` 修改生命周期代码。

宿主调用 `Page.onLoad(options)` / `Page.onShow()` 时，代理函数读取 `Page.route`、`Page.options`，以及 `wx.getLaunchOptionsSync()` / `wx.getEnterOptionsSync()` 提供的场景信息，构造 `$MPViewScreen`。该代理机制也用于小程序原生 `App`、`Component` 及其生命周期函数的全埋点采集。

原调查资料将默认采集行为概括为：页面首次加载或重新加载时上报，`wx.navigateBack` 返回已存在页面时，虽然 `onShow` 会再次调用，但默认不会重复上报 `$MPViewScreen`。神策官网没有单独确认这一细节，不同 SDK 版本可能有差异，因此应以实际版本和数据验证为准。若业务要求“返回上一页也计为一次浏览”，可通过 `track()` 上报自定义事件。

## 2. 关键属性

| 属性名 | 类型 | 默认显示名 | 属性值说明 | 版本要求 |
| --- | --- | --- | --- | --- |
| `$url` | 字符串 | 页面地址 | 小程序页面完整路径，含 query，例如 `pages/index/index?props=a` | 1.11.1+ |
| `$url_path` | 字符串 | 页面路径 | 不含 query 的页面路径，例如 `pages/index/index` | 1.13.27+ |
| `$url_query` | 字符串 | 页面参数 | 仅 query 部分，例如 `props=a` | 1.13.27+ |
| `$screen_name` | 字符串 | 页面名称 | 默认取 `Page.route`，业务可手动覆盖 | 1.0+ |
| `$referrer` | 字符串 | 前向页面 | 小程序内上一个浏览页面的 `$url`，首次打开时为空 | 1.13.27+ |
| `$title` | 字符串 | 页面标题 | 页面配置或 `wx.setNavigationBarTitle` 设置的标题，可手动覆盖 | 1.0+ |
| `$scene` | 字符串 | 启动场景 | 微信进入场景值，语义同 `$MPLaunch.$scene` | 1.0+ |

`$url` 是小程序页面身份的主要字段；`$url_path` 和 `$url_query` 是它的拆分形式，便于按不含参数的页面路径聚合。`$screen_name` 默认也取 `Page.route`，通常与 `$url_path` 接近，但可被业务覆盖，因此路径分析宜优先核验 `$url_path`。

`$referrer` 记录小程序内前一个浏览页面的 `$url`，不表示完整 `Page.route` 数组，首次从外部入口打开页面时为空。跨小程序进入时的具体取值，神策官网没有单独说明。

`$scene` 与 `$MPLaunch.$scene` / `$MPShow.$scene` 同源。冷启动首个页面的场景值来自 `wx.getLaunchOptionsSync()`；热启动后新打开页面时，原调查报告按 `wx.getEnterOptionsSync()` 的最近一次进入场景解释，但其是否始终与 `$MPShow.$scene` 一致仍需数据核验。

`$MPViewScreen` 不携带 UTM、`$share_*`、`$is_first_time`、`$resume_from_background` 或 `event_duration`。UTM、分享和端级启动标识集中在 `$MPLaunch` / `$MPShow`；小程序级会话时长集中在 `$MPHide`。

与 App 端不同，小程序没有 `$MPPageLeave` 这种页面级离开事件，神策默认口径不能直接提供单页面浏览时长。

## 3. 神策口径下的场景解释

`$MPViewScreen` 的统一语义是“打开一个小程序页面”。它记录页面身份和前向页面；小程序进入前台但仍停留在已加载页面时，不应直接等同于一次新的页面浏览。

### 场景一：冷启动进入首个页面

**微信小程序：**用户扫码进入电商小程序，宿主依次调用 `App.onLaunch` → `App.onShow` → 首页 `Page.onLoad` → `Page.onShow`。SDK 依次上报 `$MPLaunch` → `$MPShow` → `$MPViewScreen`。

`$MPLaunch` 可携带 `$is_first_time = true` 和 UTM；`$MPShow` 携带进入场景和 UTM；`$MPViewScreen` 可记录 `$url = pages/index/index`、`$url_path = pages/index/index`、`$screen_name = pages/index/index`、空 `$referrer`，以及与冷启动入口一致的 `$scene`。

例子：用户首次扫码进入首页，产生 1 条 `$MPLaunch`、1 条 `$MPShow` 和 1 条首页 `$MPViewScreen`。

### 场景二：热启动回到已浏览页面

**微信小程序：**用户浏览首页和详情页后切到聊天，再切回仍存活的小程序。宿主调用 `App.onShow`，但不调用 `App.onLaunch`。

按原调查报告概括的默认 SDK 行为，已加载页面的 `Page.onShow` 不会重复产生 `$MPViewScreen`，因此只新增 `$MPShow`。例子：首页和详情页已产生 2 条 `$MPViewScreen`，切出再切回只新增 1 条 `$MPShow`。该行为需按实际 SDK 版本核验。

### 场景三：通过 `navigateTo` 打开详情页

**微信小程序：**用户在首页点击商品卡片，通过 `wx.navigateTo` 打开商品详情页。宿主调用详情页 `Page.onLoad` → `Page.onShow`，SDK 上报 `$MPViewScreen`。

事件示例：

- `$url = pages/product/detail?id=123`
- `$url_path = pages/product/detail`
- `$url_query = id=123`
- `$screen_name = pages/product/detail`，默认取 `Page.route`，业务可覆盖
- `$referrer = pages/index/index`，记录上一个页面的 `$url`
- `$scene` 在冷启动链路中与 `$MPLaunch.$scene` 对应，在热启动链路中按最近一次进入场景解释

下游可按 `$url` 序列分析页面路径，并用 `$referrer` 构建页面转化漏斗。

### 场景四：通过分享卡片打开指定页面

**微信小程序：**用户 A 从商品详情页通过 `onShareAppMessage` 生成 path 为 `pages/product/detail?id=123` 的消息卡片，用户 B 点击卡片冷启动小程序。宿主依次调用 `App.onLaunch` → `App.onShow` → 详情页 `Page.onLoad` → `Page.onShow`。

SDK 上报 `$MPLaunch`、`$MPShow` 和 `$MPViewScreen`。分享链路属性 `$share_depth`、`$share_distinct_id`、`$share_url_path`、`$share_method` 位于 `$MPLaunch` / `$MPShow`；`$MPViewScreen` 记录详情页 `$url`、`$url_path`、`$screen_name`、空 `$referrer` 和冷启动 `$scene`，但不携带 `$share_*`。

### 场景五：通过 UTM 参数进入指定页面

**微信小程序：**运营人员生成 path 为 `pages/promo/spring?utm_source=baidu&utm_campaign=spring` 的小程序码。微信把 UTM 放入启动参数，SDK 在 `$MPLaunch` / `$MPShow` 中采集渠道字段。

神策官方没有把 UTM 列入 `$MPViewScreen` 的预置属性。该页面事件只记录页面路径、参数拆分和 `$scene`，不能用 `$MPViewScreen` 替代 `$MPLaunch` / `$MPShow` 进行 UTM 渠道归因。

### 场景六：通过 `switchTab` 切换页面

**微信小程序：**用户点击底部“分类”Tab，通过 `wx.switchTab` 进入 `pages/category/index`。原调查报告按新 Tab 页触发 `Page.onLoad` / `Page.onShow` 并上报 `$MPViewScreen` 解释，`$referrer` 为上一个 Tab 页面的 `$url`，例如 `pages/index/index`。

Tab 页通常常驻，不会因切换而销毁。首次进入和再次切换时是否都会上报、`onLoad` 是否再次触发，需结合微信页面生命周期和项目 SDK 版本分别验证，不能只凭“切换 Tab”统一判断。

## 4. 与相近事件的边界

### 与 `$MPShow`

`$MPShow` 是小程序级展示入口；`$MPViewScreen` 是页面级浏览入口。

| 维度 | `$MPShow` | `$MPViewScreen` |
| --- | --- | --- |
| 触发时机 | 小程序启动或从后台切回前台 | 打开一个小程序页面 |
| 触发主体 | `App.onShow(options)` | `Page.onLoad(options)` / `Page.onShow()` |
| 核心属性 | `$scene`、`$url_query`、UTM、`$share_*` | `$url`、`$url_path`、`$url_query`、`$screen_name`、`$referrer`、`$title`、`$scene` |
| 页面身份 | 不携带 | 携带完整页面身份 |
| 启动参数 | 强，含 UTM 和分享属性 | 弱，仅 `$scene`，不含 UTM / `$share_*` |
| 层级 | 小程序级 | 页面级 |

冷启动时通常依次出现 `$MPLaunch` → `$MPShow` → `$MPViewScreen`。热启动回到已加载页面时可只出现 `$MPShow`；同一前台会话内打开多个页面可产生多条 `$MPViewScreen`，因此两者不一一配对。

小程序级活跃度和 DAU 应主要使用 `$MPShow`；页面路径、漏斗和 PV 应使用 `$MPViewScreen`。

### 与 `$MPLaunch`

`$MPLaunch` 是小程序级冷启动 / 销毁后重启入口，触发 `App.onLaunch`；`$MPViewScreen` 是页面级入口，触发 `Page.onLoad` / `Page.onShow`。

一次 `$MPLaunch` 后通常会跟随一条或多条 `$MPViewScreen`：首个落地页产生一条，后续打开新页面继续产生。`$MPLaunch` 不携带页面身份；`$MPViewScreen` 不携带 `$is_first_time`、UTM 或 `$share_*`。两者不一一配对，不能混用销毁后重启次数与页面浏览次数。

冷启动时两者的 `$scene` 同源于 `wx.getLaunchOptionsSync()`。热启动时 `$MPLaunch` 不触发；此后新页面的 `$scene` 如何取值应以实际 SDK 数据为准。

### 与 `$MPHide`

`$MPHide` 是小程序从前台进入后台的出口，携带 `event_duration`，表示 `$MPShow` 到 `$MPHide` 的小程序级会话时长，单位为秒。

`$MPViewScreen` 不携带时长，也不直接与 `$MPHide` 配对。小程序没有 `$MPPageLeave`，因此 `$MPHide.$event_duration` 无法直接拆分为具体页面时长。业务若需要单页面时长，可记录进入和离开时间，例如使用 `wx.getStorageSync('enter_time')` / `wx.getStorageSync('leave_time')`，再通过 `track('page_duration', { duration: ... })` 上报自定义事件。

### 与 `$MPShare`

`$MPShare` 描述用户在小程序内主动分享出去；`$MPViewScreen` 描述页面浏览，两者没有直接配对关系。

`$MPShare` 在设置 `Page.onShareAppMessage` 后，由用户点击右上角菜单并选择“发送给朋友”触发。分享进入链路依赖 `$MPLaunch` / `$MPShow` 的 `$share_*`，`$MPViewScreen` 只记录落地页面和 `$scene`，不记录分享层级或分享者 distinct_id。

### 与 `AppCrashed`

`AppCrashed` 是 App 原生端崩溃事件。微信小程序运行在微信宿主内，没有独立的 `AppCrashed` 预置事件，`$MPViewScreen` 与其没有直接配对关系。

如果小程序在 `$MPViewScreen` 后发生宿主层异常，应结合微信宿主日志分析，不能用神策 App 原生 `AppCrashed` 解释或直接采集。

### 与 `$AppViewScreen`

两者都处于页面级浏览入口，但触发对象、字段含义和时长配对不同。

**iOS：**`$AppViewScreen` 通常由 `UIViewController.viewDidAppear:` 触发，`$screen_name` 是 ViewController 类名，页面离开可与 `$AppPageLeave` 配对。

**Android：**`$AppViewScreen` 通常由 `Application.ActivityLifecycleCallbacks.onActivityResumed` 触发，`$screen_name` 是 Activity 包名和类名，页面离开可与 `$AppPageLeave` 配对。

**HarmonyOS：**`$AppViewScreen` 的触发对象按 UIAbility 口径处理，页面离开可与 `$AppPageLeave` 配对。

**微信小程序：**`$MPViewScreen` 的触发对象是 `Page`，`$screen_name` 默认取路由 `Page.route`，并提供 `$url`、`$url_path`、`$url_query`。小程序没有页面级离开事件。

跨端页面浏览应分别聚合，不能直接合并计数或 `$screen_name`。如需统一路径，必须明确是映射 `$url_path` 还是 `$screen_name`。

### 与 `$AppPageLeave`

**App 原生端：**`$AppViewScreen` 与 `$AppPageLeave` 可组成页面级进入和离开，页面浏览时长来自 `$AppPageLeave.$event_duration`。

**微信小程序：**`$MPViewScreen` 没有对应的 `$MPPageLeave`。神策默认只通过 `$MPShow` → `$MPHide` 提供小程序级会话时长，无法直接获取单页面浏览时长。

不能把 `$MPHide.$event_duration` 直接解释为某一条 `$MPViewScreen` 的页面时长。采用会话平均分配或业务自定义事件时，应明确标注估算或自定义口径。

## 5. 核验结论与适用边界

### 当前结论

`$MPViewScreen` 是微信小程序的页面级浏览入口事件，是页面路径、漏斗和 PV 的主要数据源。页面身份以 `$url` / `$url_path` 为主，`$referrer` 提供小程序内前向页面，`$scene` 仅作为入口场景辅助字段。

它不能替代 `$MPShow` 统计小程序进入前台，也不能提供 UTM、分享链路、首次启动或单页面时长。页面级浏览和小程序级会话必须分别理解。

### 指标处理口径

神策官方没有直接定义 `$MPViewScreen` 在各项产品指标中的处理方式。以下口径基于事件和属性语义推导：

| 指标 | 是否依赖 `$MPViewScreen` | 理由 |
| --- | --- | --- |
| 页面路径分析 | 强依赖 `$url`、`$url_path`、`$referrer` | 页面身份和前向页面用于构建路径 |
| 页面漏斗 | 强依赖 | 可按 `$url` / `$url_path` 序列构造 |
| 页面浏览次数（PV） | 强依赖 | 直接按 `$MPViewScreen` 计数 |
| 单页面浏览时长 | 不直接依赖 | 默认无页面离开事件和页面时长字段 |
| 小程序级会话时长 | 不直接依赖 | 来自 `$MPHide.$event_duration`，起点是 `$MPShow` |
| DAU | 弱依赖 | 可作为活跃事件之一，但热启动回到已有页面可能只触发 `$MPShow` |
| 留存分析 | 不直接依赖 | 留存按首次事件时间及项目定义计算 |
| 渠道归因 | 弱依赖 `$scene` | 仅作辅助；UTM 位于 `$MPLaunch` / `$MPShow` |

“页面路径强依赖”等判断不是神策官方直接给出的产品指标定义，实际使用需结合项目页面路径口径校验。

### 页面浏览次数与活跃页面数

页面浏览次数（PV）可按 `$MPViewScreen` 事件数统计。活跃页面数通常按指定时间内触发过事件的不同 `$url` / `$url_path` 数量统计，属于基于页面身份字段的推导口径，不等同于 PV。

### 单页面浏览时长路径

- **路径 A：业务自定义事件。**记录页面进入和离开时间，通过 `track('page_duration', { duration: ... })` 上报，能够形成明确的单页面时长，但需要业务实现。
- **路径 B：会话平均估算。**使用 `$MPHide.$event_duration` 得到整个前台会话时长，再按页面浏览次数平均分配，误差较大，不能视为真实页面时长。
- **路径 C：神策页面分析模块。**使用产品侧加工结果，可能包含神策产品逻辑，应单独核对其定义和版本。

三条路径不能混用。采用哪一条属于后续产品口径选择，不是 `$MPViewScreen` 事件字段本身给出的答案。

### 待核验事项

- 项目实际接入的是微信、支付宝、抖音、百度还是其他小程序平台。
- CLKLOG / CDP 是否实际采集 `$MPViewScreen`，是否覆盖微信小程序宿主，`autoTrack.mpViewScreen` 是否为 `true`。
- 项目神策小程序 SDK 版本是否满足 7 个属性的版本要求。
- `wx.navigateBack` 返回上一页时是否重复触发 `$MPViewScreen`，不同 SDK 版本是否一致。
- `wx.navigateTo`、`wx.redirectTo`、`wx.switchTab`、`wx.reLaunch` 的首次和重复进入行为是否一致。
- `$screen_name` 是否被 `setScreenName()` 等自定义接口覆盖，以及覆盖规则。
- `$referrer` 在跨小程序 `navigateToMiniProgram` 场景下的实际取值。
- 热启动后新页面 `$scene` 是否始终与最近一条 `$MPShow.$scene` 一致。
- 开发版、体验版、正式版是否采用相同采集和过滤策略。
- 小程序宿主异常如何记录，是否有独立的微信侧崩溃日志。

### 关键假设与适用限制

- 当前口径仅以神策微信小程序 SDK 为基准，不能直接套用于其他小程序平台。
- “`wx.navigateBack` 不重复上报”及不同跳转 API 的行为主要来自 SDK 机制推导，神策官网没有逐项明确，必须按项目版本验证。
- `$screen_name` 默认取 `Page.route`，但业务覆盖后的具体优先级需在项目中验证。
- `$referrer` 按小程序内上一个 `$url` 解释，跨小程序入口不保证同样适用。
- 热启动页面 `$scene` 与 `$MPShow.$scene` 同源的一致性尚未由神策官网单独确认。
- 神策官网没有直接定义页面路径、漏斗、PV、活跃页面数和单页面时长等产品指标；本文的指标关系属于语义推导。
- 小程序没有神策预置的页面级离开事件，`$MPHide.$event_duration` 只能表示小程序级会话时长。
- 小程序宿主崩溃不通过 App 原生 `AppCrashed` 采集。
- 神策官网没有说明开发版、体验版、正式版是否存在采集差异。
- 当前尚未验证生产数据中的事件存在性、平台归属、配置和字段完整性。

## 附录一：参考文献

- 神策官方，微信小程序 SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_miniprogram_preset_properties/v0300>
- 神策官方，集成文档（微信小程序）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_mp_wechat/v0300>
- 神策官方，所有事件都有的预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_miniprogram_preset_properties/v0300>
- 神策技术社区，《神策数据微信小程序 SDK 架构解析》（SegmentFault 思否）：说明 SDK 代理 App / Page / Component 及生命周期的实现。
- 微信开放社区，小程序页面生命周期：<https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/page-life-cycle.html>
- 微信开放社区，场景值列表：<https://developers.weixin.qq.com/miniprogram/dev/reference/scene-list.html>
- 已建立口径文档，`$AppViewScreen.md`：提供 App 页面浏览事件和页面级时长的跨端对照。
- 已建立口径文档，`$AppPageLeave.md`：提供 App 页面级离开事件的跨端对照。
- 已建立口径文档，`$MPLaunch.md`：提供小程序冷启动入口、属性和场景值的对照。
- 已建立口径文档，`$MPShow.md`：提供小程序进入前台入口及其与页面级入口的层级对照。

## 附录二：调查背景与过程记录

### 调查目标

原调查任务用于澄清 `$MPViewScreen` 的实际业务场景、触发时机、语义边界和分析价值，并在 App 页面进入 / 离开、小程序冷启动和进入前台口径的基础上，补齐微信小程序页面级入口。

调查以神策公开预置事件口径为主要解释基准，不设计业务侧加工规则或下游产品指标。原任务还希望形成可供 `$MPHide` 调查复用的页面入口基准，并与 `$MPShow` 组成“小程序级 → 页面级”的层级关系。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 待覆盖事件清单包含 `$AppStart`、`$AppStartPassively`、`$AppEnd`、`$AppViewScreen`、`$AppPageLeave`、`$AppClick`、`$MPLaunch`、`$MPShow`、`$MPViewScreen`、`$MPHide`、`$WebStay`、`$WebClick`、`$pageview`、`AppCrashed` 等事件。
- 每个 event 至少需要分析实际场景、端类型、触发时机、相近事件差异和分析价值。
- `Index.md` 没有指明小程序所属宿主平台，也没有单独定义 `$MPViewScreen`。

### 来源区分与推导过程

事件定义、微信小程序端归属、7 个版本化属性、`autoTrack.mpViewScreen`、`$lib` 和 Page 代理机制来自神策官方文档及 SDK 架构资料。

小程序页面生命周期补充来自微信开放社区。`wx.navigateBack`、不同跳转 API、热启动 `$scene`、页面路径、漏斗、PV、活跃页面数和三条单页面时长路径属于基于生命周期或字段语义的推导，不是神策官方逐项直接定义。

### 原约束回写记录

原调查报告建议向 `Index.md` 或上游可信输入补充以下约束：

- `$MPViewScreen` 是页面级浏览入口，由 `Page.onLoad` / `Page.onShow` 触发；
- 7 个核心属性受 SDK 版本梯度约束；
- `autoTrack.mpViewScreen` 默认开启；
- `$MPViewScreen` 与 `$MPShow` 分属页面级和小程序级，不能一一配对；
- `$MPViewScreen` 不携带时长、UTM、分享或首次启动字段；
- 小程序没有 `$MPPageLeave`，单页面时长不能由默认预置事件直接获得。

原调查报告建议向 `$MPShow.md` 补充两者的属性差异、触发顺序和热启动关系。

原调查报告建议向 `$MPLaunch.md` 补充冷启动 `$scene` 同源、页面身份和 `$is_first_time` / `$share_*` 的差异。

原调查报告建议向 `$AppViewScreen.md` 补充 App 与小程序的触发对象、`$screen_name`、URL 字段和页面时长配对差异。

原调查报告建议向 `$AppPageLeave.md` 补充小程序没有页面离开事件，以及单页面时长需要自定义实现的限制。

### 原任务完成状态

- 已说明 `$MPViewScreen` 的事件定义、微信小程序端归属、7 个版本化属性和触发机制。
- 已给出冷启动首屏、热启动返回、`navigateTo`、分享落地页、UTM 落地页、`switchTab` 等场景。
- 已明确与 `$MPShow`、`$MPLaunch`、`$MPHide`、`$MPShare`、`AppCrashed`、`$AppViewScreen`、`$AppPageLeave` 的边界。
- 已给出页面路径、漏斗、PV、活跃页面数和单页面浏览时长的指标推导，以及三条单页面时长候选路径。
- 已记录需要回写到 `Index.md`、`$MPShow.md`、`$MPLaunch.md`、`$AppViewScreen.md`、`$AppPageLeave.md` 的关键约束。
- 已标注返回行为、跳转 API、字段覆盖、跨小程序 `$referrer`、平台差异、热启动 `$scene`、配置、版本和生产数据未验证等限制。
