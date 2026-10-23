# `$MPLaunch` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 15:34:06

## 1. 事件概览

`$MPLaunch` 是神策微信小程序 SDK 预置的 **小程序启动**事件，用于描述小程序初始化完成，或小程序进入后台后被微信销毁进程、随后再次启动的场景。

### 运行环境与触发口径

**微信小程序：**由微信原生 `App.onLaunch(options)` 生命周期回调触发。神策 SDK 通过代理 `App` 接口拦截回调参数并自动上报 `$MPLaunch`。

**App 原生端：**iOS、Android、HarmonyOS App SDK 不提供 `$MPLaunch`；App 启动使用 `$AppStart`。

**Web 端：**Web JS SDK 不提供 `$MPLaunch`。

**其他小程序平台：**支付宝、抖音、百度等平台是否存在同名同语义事件，需要对照各自神策 SDK 文档；本文只以微信小程序 SDK 为基准。

微信小程序 SDK 上报的事件带 `$lib = MiniProgram`，可作为端归属标识。

`$MPLaunch` 由 `autoTrack.appLaunch` 控制，默认值为 `true`。设为 `false` 后，不再自动采集该事件。神策将其归入小程序 SDK 通用性采集能力，开启 `autoTrack` 后自动采集。

### 采集机制

神策 SDK 初始化时保存微信原生 `App` 构造函数，并替换为 SDK 代理函数。业务仍可正常调用 `App({ onLaunch(options) {...} })`，无需为 `$MPLaunch` 修改生命周期代码。

微信调用 `App.onLaunch(options)` 时，代理函数在原生命周期前后插入 SDK 初始化和全埋点上报逻辑，从 `options` 中读取 `scene`、`query`、`path`、`referrerInfo` 等启动信息，再构造 `$MPLaunch`。该代理机制也用于小程序原生 `Page`、`Component` 及其生命周期函数的全埋点采集。

## 2. 关键属性

| 属性名 | 类型 | 默认显示名 | 属性值说明 | 版本要求 |
| --- | --- | --- | --- | --- |
| `$scene` | 字符串 | 启动场景 | 微信启动场景值，语义同 `$latest_scene` | 1.0+ |
| `$url_query` | 字符串 | 页面参数 | 例如 `pages/index/index?props=a` 中的 `props=a` | 1.11.1+ |
| `$utm_campaign` | 字符串 | 广告系列名称 | 启动参数中存在时采集 | 0.9+ |
| `$utm_source` | 字符串 | 广告系列来源 | 启动参数中存在时采集 | 0.9+ |
| `$utm_medium` | 字符串 | 广告系列媒介 | 启动参数中存在时采集 | 0.9+ |
| `$utm_term` | 字符串 | 广告系列字词 | 启动参数中存在时采集 | 0.9+ |
| `$utm_content` | 字符串 | 广告系列内容 | 启动参数中存在时采集 | 0.9+ |
| `$is_first_time` | 布尔值 | 是否首次 | 本次是否为该用户首次启动小程序 | 1.8+ |
| `$share_depth` | 数值 | 分享时的层级 | 本次启动来源的分享层级 | 1.9+ |
| `$share_distinct_id` | 字符串 | 分享时的 distinct_id | 分享发起方的神策 distinct_id | 1.9+ |
| `$share_url_path` | 字符串 | 分享时的页面路径 | 分享发起时所在的小程序页面路径 | 1.9+ |
| `$share_method` | 字符串 | 分享时途径 | 朋友圈分享或转发消息卡片 | 1.13.27+ |

`$scene` 来自 `wx.getLaunchOptionsSync().scene`，覆盖扫码、搜索、App 分享、公众号、小程序互跳等微信场景值。

UTM 属性来自 `wx.getLaunchOptionsSync()` 的 query。业务在小程序码 path、scene 或跳转参数中加入 UTM 后，SDK 解析并采集，主要用于渠道追踪。

`$share_*` 只在通过分享卡片进入小程序时有值；扫码、搜索、App 跳转、网页唤起等其他入口通常为空。

`$is_first_time` 表示用户层面的首次启动，与小程序进程是否刚被销毁无关。销毁后再次启动时，该字段通常为 `false`。

`$MPLaunch` 不携带 `$resume_from_background`、`$app_state`、`$event_duration`，也不携带 `$screen_name`、`$title`、`$url` 等页面身份字段；页面身份由 `$MPViewScreen` 描述。

## 3. 神策口径下的场景解释

### 场景一：首次打开小程序

**微信小程序：**用户通过下拉小程序列表、搜索或扫码首次打开小程序。微信调用 `App.onLaunch(options)`，神策 SDK 上报 `$MPLaunch`。

事件可记录 `$scene`、`$is_first_time = true`，以及启动参数中存在的 UTM 或分享字段。

例子：用户首次扫码进入电商小程序，SDK 上报 1 条 `$MPLaunch`，记录扫码场景和渠道参数。

### 场景二：从后台切回但进程未被销毁

**微信小程序：**用户从小程序切到聊天，数秒后返回。小程序进程仍存活，微信只调用 `App.onShow(options)`，不调用 `App.onLaunch`。

该场景只触发 `$MPShow`，不触发 `$MPLaunch`。用户多次在聊天和小程序之间切换时，每次返回可触发 `$MPShow`，但不会重复产生 `$MPLaunch`。

### 场景三：后台进程被销毁后再次进入

**微信小程序：**用户离开小程序较长时间，微信因后台时长、资源紧张或用户主动销毁而结束进程。用户再次进入时，小程序重新初始化，触发 `$MPLaunch`。

微信宿主的具体销毁时长由平台策略决定，神策文档只描述为“一定时间”，未给出精确值；常见理解为 5 分钟级别，但不能作为固定口径。

例子：用户上午打开小程序，离开两小时后返回。如果中间进程已被销毁，则再次触发 `$MPLaunch`；`$is_first_time` 仍按用户是否首次使用判断，而不是按进程是否首次初始化判断。

### 场景四：扫码进入带 UTM 参数的小程序码

**微信小程序：**运营人员生成 `pages/index/index?utm_source=baidu&utm_campaign=spring` 等带 UTM 的小程序码。用户扫码进入后，微信把参数放入 `options.query`，SDK 上报 `$utm_source = baidu`、`$utm_campaign = spring`，并采集其他存在的 UTM 字段。

这些属性可用于分析不同投放渠道的冷启动贡献。

### 场景五：从分享卡片进入

**微信小程序：**用户 A 通过 `onShareAppMessage` 分享消息卡片，用户 B 点击卡片进入小程序。SDK 上报 `$MPLaunch`，并携带 `$share_depth`、`$share_distinct_id`、`$share_url_path` 和满足版本要求时的 `$share_method`。

例子：A 分享给 B，B 再分享给 C，可用 `$share_depth` 分析分享层级，用 `$share_distinct_id` 关联分享发起方。

### 场景六：通过公众号文章或 App 跳转进入

**微信小程序：**用户点击公众号文章中的小程序卡片，或从 App 通过开放平台跳转到小程序。微信将入口映射为对应 `$scene`，例如文档示例中的 `1037`、`1038` 等场景值。

下游可按 `$scene` 区分扫码、搜索、公众号、App、分享等冷启动来源。

## 4. 与相近事件的边界

### 与 `$MPShow`

`$MPLaunch` 描述小程序初始化或销毁后重新初始化；`$MPShow` 描述小程序进入前台可见。

| 维度 | `$MPLaunch` | `$MPShow` |
| --- | --- | --- |
| 触发时机 | 初始化完成或销毁后再次启动 | 小程序启动或从后台切回前台 |
| 覆盖范围 | 仅冷启动，含销毁后重启 | 冷启动 + 热启动到前台 |
| 触发回调 | `App.onLaunch(options)` | `App.onShow(options)` |
| 核心语义 | 重新初始化 | 进入前台可见 |
| `$is_first_time` | 1.8+ 采集 | 预置属性列表中没有 |
| 参数来源 | `wx.getLaunchOptionsSync()` | 冷启动或 `wx.getEnterOptionsSync()` |

冷启动时先触发 `$MPLaunch`，再触发 `$MPShow`；热启动到前台时只触发 `$MPShow`。销毁后重启次数使用 `$MPLaunch`，进入前台可见次数使用 `$MPShow`。

### 与 `$MPViewScreen`

`$MPLaunch` 是小程序级启动入口，`$MPViewScreen` 是页面级浏览入口。

一次 `$MPLaunch` 后通常会跟随一个或多个 `$MPViewScreen`。`$MPLaunch` 不携带页面身份；`$MPViewScreen` 携带 `$url`、`$url_path`、`$url_query` 等字段。两者不一一配对。

App 端 `$AppViewScreen` 的触发对象是 Activity / ViewController；小程序端 `$MPViewScreen` 的触发对象是 Page，运行环境和页面身份口径不同。

### 与 `$MPHide`

`$MPHide` 是小程序从前台进入后台的出口，携带 `event_duration`，表示本次 `$MPShow` 到 `$MPHide` 的时长。

`$MPLaunch` 不携带时长，也不直接与 `$MPHide` 配对。即使冷启动时先出现 `$MPLaunch`，会话时长起点仍是紧随其后的 `$MPShow`。小程序会话应按 `$MPShow` → `$MPHide` 切分，`$MPLaunch` 只作为冷启动标识。

小程序端没有与 App `$AppEnd` 完全对应的“销毁事件”预置；进程销毁由微信宿主管理。

### 与 `$AppStart`

`$MPLaunch` 与 `$AppStart` 都处于端级启动入口位置，但不能合并成同一事件口径。

**App 原生端：**`$AppStart` 覆盖冷启动和部分后台恢复，携带 `$resume_from_background`、`$is_first_time`、iOS `$app_state` 等属性。

**微信小程序：**`$MPLaunch` 仅覆盖冷启动及销毁后重启，携带 `$scene`、UTM、分享属性，不携带 `$resume_from_background`。

跨端启动分析应分别聚合，不能直接合并计数。

### 与 `$MPShare`

`$MPShare` 描述用户在小程序内主动分享出去；带 `$share_*` 的 `$MPLaunch` 描述被分享者通过分享卡片进入。两者是同一分享链路的发起端和进入端。

可通过 `$share_distinct_id` 关联分享者，通过 `$share_depth` 分析传播层级，通过 `$share_url_path` 识别分享页面。

### 与 `AppCrashed`

`AppCrashed` 是 App 原生端崩溃事件。微信小程序运行在微信宿主内，没有独立的 `AppCrashed` 预置事件。

如果小程序在 `$MPLaunch` 后发生宿主层异常，应结合微信宿主日志分析，不能用 App 原生 `AppCrashed` 解释。

## 5. 核验结论与适用边界

### 当前结论

`$MPLaunch` 是微信小程序的冷启动 / 销毁后重启入口，不是所有进入前台行为。它最直接地回答“小程序是否重新初始化、通过什么入口启动、是否为用户首次启动”。

### 指标处理口径

神策官方没有直接定义 `$MPLaunch` 在各项产品指标中的处理方式。以下口径基于事件和属性语义推导：

| 指标 | 是否依赖 `$MPLaunch` | 理由 |
| --- | --- | --- |
| 冷启动 / 销毁后重启次数 | 强依赖 | 直接按 `$MPLaunch` 计数 |
| 渠道归因 | 强依赖 `$scene`、UTM | 冷启动参数记录入口来源 |
| 分享链路 | 强依赖 `$share_*` | 描述分享进入的层级和发起方 |
| 首次访问 | 强依赖 `$is_first_time` | 标识用户首次启动小程序 |
| DAU / MAU | 弱依赖 | 热启动只触发 `$MPShow`，不能只看 `$MPLaunch` |
| 会话时长 | 不直接依赖 | 时长来自 `$MPHide.event_duration`，起点是 `$MPShow` |
| 留存分析 | 弱依赖 | 可作为首次入口之一，需结合首次标识和项目口径 |

“渠道归因强依赖”属于基于 `$scene`、UTM 的语义推导，实际使用还需符合神策推广微信小程序文档的参数拼接规范。

### 启动口径选择

- **路径 A：**销毁后重启次数 = `$MPLaunch` 计数。
- **路径 B：**进入前台可见次数，含冷启动和热启动 = `$MPShow` 计数。
- **路径 C：**“启动总次数”必须由业务明确是仅指冷启动，还是包含热启动；神策官方没有提供统一的合并口径。

### 待核验事项

- 项目实际接入的是微信、支付宝、抖音、百度还是其他小程序平台。
- CLKLOG / CDP 是否实际采集 `$MPLaunch`，`autoTrack.appLaunch` 是否为 `true`。
- 项目神策小程序 SDK 版本是否满足各属性的版本要求。
- 微信后台销毁时长在目标版本和运行环境中的实际行为。
- `$scene`、`$url_query`、UTM、`$share_*` 的字段完整性。
- 分享卡片信息与 UTM 同时存在时，两组属性是否互斥或同时采集。
- 开发版、体验版、正式版是否采用相同采集和过滤策略。
- 小程序宿主异常如何记录，是否有独立的微信侧崩溃日志。

### 关键假设与适用限制

- 当前口径仅以神策微信小程序 SDK 为基准，不能直接套用于其他小程序平台。
- 神策官网没有给出微信宿主后台销毁的精确时长；“常见 5 分钟级别”不是固定规则。
- 神策官网没有直接定义 DAU、启动次数、留存和渠道归因等产品指标；本文的指标依赖关系属于语义推导。
- `$share_*` 和其他属性受 SDK 版本限制，旧版本可能缺失。
- 神策官网没有明确分享信息与 UTM 同时存在时的优先级。
- 神策官网没有说明开发版、体验版、正式版是否存在采集差异。
- 小程序宿主崩溃不通过 App 原生 `AppCrashed` 采集。
- 当前尚未验证生产数据中的事件存在性、平台归属、配置和字段完整性。

## 附录一：参考文献

- 神策官方，微信小程序 SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_miniprogram_preset_properties/v0300>
- 神策官方，集成文档（微信小程序）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_mp_wechat/v0300>
- 神策官方，推广微信小程序：<https://manual.sensorsdata.cn/sa/docs/pomote_wechatapplet/v0300>
- 神策官方，新增用户及首日首次标记：<https://manual.sensorsdata.cn/sa/docs/tech_knowledge_new/v0300>
- 神策技术社区，《神策数据微信小程序 SDK 架构解析》（SegmentFault 思否）：说明 SDK 代理 App / Page / Component 及生命周期的实现。
- 微信开放社区，小程序启动与小程序销毁时机：<https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism.html>
- 微信开放社区，场景值列表：<https://developers.weixin.qq.com/miniprogram/dev/reference/scene-list.html>
- 微信开放社区，`wx.getLaunchOptionsSync`：<https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getLaunchOptionsSync.html>
- 已建立口径文档，`$AppStart.md`：提供 App 原生启动事件的跨端对照。
- 已建立口径文档，`$AppStartPassively.md`：提供 App 被动启动的跨端参考。
- 已建立口径文档，`$AppEnd.md`：提供 App 退出与小程序会话出口的对照。
- 已建立口径文档，`$AppViewScreen.md`：提供 App 页面级入口的粒度对照。
- 已建立口径文档，`$AppPageLeave.md`：提供 App 页面级出口的参考。
- 已建立口径文档，`$AppClick.md`：提供 App 元素级事件的参考。

## 附录二：调查背景与过程记录

### 调查目标

原任务只讨论 `$MPLaunch` 的实际场景、触发时机、语义边界和分析价值，不展开 `$MPShow`、`$MPViewScreen`、`$MPHide` 的完整定义。

原任务以神策微信小程序 SDK 为可信基础，在 App 端 6 个事件口径完成后进入小程序事件组，建立可供后续 `$MPShow` 使用的启动入口基准。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 待覆盖事件清单包含 6 个 App 事件、4 个小程序事件、3 个 Web 事件和 `AppCrashed`。
- 每个 event 至少需要分析实际场景、端类型、触发时机、相近事件差异和分析价值。
- `Index.md` 没有指明小程序所属宿主平台，也没有单独定义 `$MPLaunch`。

### 来源区分与推导过程

事件定义、微信小程序端归属、属性、版本、`autoTrack.appLaunch`、`$lib` 和 `App.onLaunch` 触发机制来自神策官方文档及 SDK 架构资料。

微信销毁场景补充来自微信开放社区。DAU、启动次数、渠道归因、分享链路、留存和三条启动口径路径属于基于字段语义的推导，不是神策官方直接定义。

### 原约束回写记录

原调查报告建议向 `Index.md` 或上游可信输入补充以下约束：

- `$MPLaunch` 是初始化 / 销毁后重启入口，由 `App.onLaunch` 触发；
- 核心属性受 SDK 版本梯度约束；
- `autoTrack.appLaunch` 默认开启；
- `$MPLaunch` 仅覆盖冷启动，`$MPShow` 覆盖冷启动和热启动；
- `$MPLaunch` 不携带时长或页面身份字段。

原调查报告建议向 `$AppStart.md` 补充 App 与小程序启动范围不同、跨端启动不能直接合并的约束。

原调查报告建议向 `$AppEnd.md` 补充小程序没有对应销毁事件、`$MPHide` 时长从 `$MPShow` 起算的约束。

原调查报告建议向 `$AppViewScreen.md` 补充小程序级与页面级层级关系，以及 `$MPLaunch` 与 `$MPViewScreen` 不一一配对的约束。

### 原任务完成状态

- 已说明 `$MPLaunch` 的事件定义、微信小程序端归属、版本化属性和触发机制。
- 已给出首次打开、热启动不触发、销毁后重启、UTM、小程序分享、公众号 / App 跳转等场景。
- 已明确与 `$MPShow`、`$MPViewScreen`、`$MPHide`、`$AppStart`、`$MPShare`、`AppCrashed` 的边界。
- 已给出冷启动、进入前台和启动总次数三种口径路径。
- 已记录需要回写到 `Index.md`、`$AppStart.md`、`$AppEnd.md`、`$AppViewScreen.md` 的关键约束。
- 已标注宿主销毁时长、跨平台差异、SDK 版本、配置、分享与 UTM、生产数据未验证等限制。
