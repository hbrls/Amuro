# `$MPShow` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 19:00:03

## 1. 事件概览

`$MPShow` 是神策微信小程序 SDK 预置的**小程序显示**事件，用于描述小程序进入前台可见。神策官方定义的触发时机是“小程序启动时触发或者从后台切换到前台时触发”，因此它同时覆盖冷启动和未被销毁时的热启动到前台。

### 运行环境与触发口径

**微信小程序：**由微信原生 `App.onShow(options)` 生命周期回调触发。神策 SDK 通过代理 `App` 接口拦截回调参数并自动上报 `$MPShow`。小程序首次启动或销毁后重启时，会先后触发 `$MPLaunch` 和 `$MPShow`；进程仍存活、仅从后台切回前台时，只触发 `$MPShow`。

**App 原生端：**iOS、Android、HarmonyOS App SDK 不提供 `$MPShow`；App 端级展示入口使用 `$AppStart`，但各平台触发条件并不等同于微信小程序。

**Web 端：**Web JS SDK 不提供 `$MPShow`。

**服务端：**服务端 SDK 不提供 `$MPShow`。

**其他小程序平台：**支付宝、抖音、百度等平台是否存在同名同语义事件，需要对照各自神策 SDK 文档；本文只以微信小程序 SDK 为基准。

微信小程序 SDK 上报的事件带 `$lib = MiniProgram`，可作为端归属标识。`$MPShow` 是微信小程序宿主专属的预置事件，不存在跨端同名同语义事件。

`$MPShow` 由 `autoTrack.appShow` 控制，默认值为 `true`。设为 `false` 后，不再自动采集该事件。该配置与 `$MPLaunch` 的 `autoTrack.appLaunch` 相互独立；神策将两者归入小程序 SDK 通用性采集能力，开启 `autoTrack` 后自动采集。

### 采集机制

神策 SDK 初始化时保存微信原生 `App` 构造函数，并替换为 SDK 代理函数。业务仍可正常调用 `App({ onShow(options) {...} })`，无需为 `$MPShow` 修改生命周期代码。

微信调用 `App.onShow(options)` 时，代理函数在原生命周期前后插入 SDK 初始化和全埋点上报逻辑，从 `options` 中读取 `scene`、`query`、`path`、`referrerInfo` 等进入信息，再构造 `$MPShow`。其参数语义与 `wx.getEnterOptionsSync()` 返回的最近一次进入参数一致。该代理机制也用于小程序原生 `Page`、`Component` 及其生命周期函数的全埋点采集。

## 2. 关键属性

| 属性名 | 类型 | 默认显示名 | 属性值说明 | 版本要求 |
| --- | --- | --- | --- | --- |
| `$scene` | 字符串 | 启动场景 | 微信进入场景值，语义同 `$latest_scene` | 1.0+ |
| `$url_query` | 字符串 | 页面参数 | 例如 `pages/index/index?props=a` 中的 `props=a` | 1.11.1+ |
| `$utm_campaign` | 字符串 | 广告系列名称 | 进入参数中存在时采集 | 0.9+ |
| `$utm_source` | 字符串 | 广告系列来源 | 进入参数中存在时采集 | 0.9+ |
| `$utm_medium` | 字符串 | 广告系列媒介 | 进入参数中存在时采集 | 0.9+ |
| `$utm_term` | 字符串 | 广告系列字词 | 进入参数中存在时采集 | 0.9+ |
| `$utm_content` | 字符串 | 广告系列内容 | 进入参数中存在时采集 | 0.9+ |
| `$share_depth` | 数值 | 分享时的层级 | 本次进入来源的分享层级 | 1.9+ |
| `$share_distinct_id` | 字符串 | 分享时的 distinct_id | 分享发起方的神策 distinct_id | 1.9+ |
| `$share_url_path` | 字符串 | 分享时的页面路径 | 分享发起时所在的小程序页面路径 | 1.9+ |
| `$share_method` | 字符串 | 分享时途径 | 朋友圈分享或转发消息卡片 | 1.13.27+ |

`$scene` 来自 `wx.getEnterOptionsSync().scene`，覆盖扫码、搜索、App 分享、公众号、小程序互跳等微信场景值。热启动到前台时，它反映最近一次进入操作的来源，而不是最初冷启动的来源。

UTM 属性来自 `wx.getEnterOptionsSync()` 的 query。业务在小程序码 path、scene 或跳转参数中加入 UTM 后，SDK 解析并采集，主要用于渠道追踪。

`$share_*` 只在通过分享卡片进入小程序时有值；扫码、搜索、App 跳转、网页唤起等其他入口通常为空。

`$MPShow` **不携带 `$is_first_time`**。“是否首次启动”只在 `$MPLaunch` 上体现；如需判断首日访问，还可结合所有事件都有的 `$is_first_day`，但不能把 `$MPShow` 当作 `$is_first_time` 的来源。

`$MPShow` 不携带 `$resume_from_background`、`$app_state`、`event_duration`，也不携带 `$screen_name`、`$title`、`$url` 等页面身份字段；页面身份由 `$MPViewScreen` 描述。

`$MPShow` 与 `$MPLaunch` 虽然共享 `$scene`、`$url_query`、5 个 UTM 属性和 4 个分享属性，但参数来源不同：`$MPShow` 使用 `wx.getEnterOptionsSync()` 的最近一次进入参数，`$MPLaunch` 使用 `wx.getLaunchOptionsSync()` 的冷启动参数。冷启动时两者数据一致；热启动到前台时只有 `$MPShow` 触发并取得最新进入参数。

## 3. 神策口径下的场景解释

`$MPShow` 的统一语义是“小程序进入前台可见”。冷启动时它与 `$MPLaunch` 先后出现；热启动到前台时它独立出现。微信将用户按 Home 键后返回、从最近任务列表返回、从聊天或其他小程序切回，以及从系统通知中心点击消息卡返回等情况视为从后台切换到前台。

### 场景一：首次打开小程序

**微信小程序：**用户通过下拉小程序列表、搜索或扫码首次打开小程序。微信依次调用 `App.onLaunch(options)` 和 `App.onShow(options)`，神策 SDK 依次上报 1 条 `$MPLaunch` 和 1 条 `$MPShow`。

两条事件的冷启动参数一致；`$MPLaunch` 可携带 `$is_first_time = true`，`$MPShow` 携带 `$scene`、UTM 和满足条件的分享属性，但不携带 `$is_first_time`。

例子：用户首次扫码进入电商小程序，SDK 上报 `$MPLaunch` + `$MPShow`，两者记录相同的扫码场景和渠道参数。

### 场景二：从聊天切回小程序

**微信小程序：**用户浏览商品时切到微信聊天，数秒后返回。小程序进程仍存活，微信调用 `App.onShow(options)`，但不调用 `App.onLaunch(options)`。

该场景只触发 `$MPShow`，不触发 `$MPLaunch`。`$scene` 来自 `wx.getEnterOptionsSync()`，反映最近一次进入来源；如果用户在聊天和小程序之间多次切换，每次返回都可能产生一条 `$MPShow`，但不会重复产生 `$MPLaunch`。

### 场景三：后台进程被销毁后再次进入

**微信小程序：**用户离开小程序较长时间，微信因后台时长、资源紧张或用户主动销毁而结束进程。用户再次进入时，小程序重新初始化，微信依次调用 `App.onLaunch(options)` 和 `App.onShow(options)`。

SDK 上报 `$MPLaunch` + `$MPShow`，两条事件的冷启动参数一致。`$MPLaunch.$is_first_time` 仍按用户是否首次启动判断，不按进程是否重新初始化判断。

例子：用户上午 10 点离开小程序，中午 12 点返回。若进程已被销毁，则重新触发 `$MPLaunch` + `$MPShow`；若仍存活，则只触发 `$MPShow`。微信宿主的具体销毁时长由平台策略决定，神策文档只描述为“一定时间”；常见 5 分钟级别的理解不能作为固定口径。

### 场景四：识别最近一次进入来源

**微信小程序：**用户从扫码、搜索、App 分享、公众号、小程序互跳、桌面图标、聊天窗口或系统通知等入口回到小程序前台。每次 `$MPShow` 均可携带对应的 `$scene`。

热启动时，`$MPShow.$scene` 取自 `wx.getEnterOptionsSync()`，反映最近一次进入来源；`$MPLaunch.$scene` 只反映冷启动来源。下游因此可以按 `$MPShow.$scene` 分析用户最近从聊天、公众号文章、App 推送等哪个渠道回到前台。

### 场景五：从分享卡片进入

**微信小程序：**用户 A 通过 `onShareAppMessage` 分享消息卡片，用户 B 点击卡片进入小程序。微信宿主在 `App.onShow(options)` 的 `options.referrerInfo` 中透传分享入口信息；SDK 上报 `$MPShow`，并在满足 SDK 版本要求时携带 `$share_depth`、`$share_distinct_id`、`$share_url_path` 和 `$share_method`。

如果 B 此时为冷启动，`$MPLaunch` 也会触发，并携带相同的分享属性。A 分享给 B、B 再分享给 C 时，可用 `$share_depth` 分析层级，用 `$share_distinct_id` 关联分享发起方，用 `$share_url_path` 识别分享页面。

### 场景六：通过公众号文章或 App 跳转进入

**微信小程序：**用户点击公众号文章中的小程序卡片，或从 App 通过开放平台跳转到小程序。微信把入口映射为对应 `$scene`，例如原调查资料列举的 `1037` 公众号、`1038` App 等场景值。

若该入口形成冷启动，`$MPLaunch` 与 `$MPShow` 都会触发，且 `$scene` 一致；若进程仍存活，则只触发 `$MPShow`。按 `$MPShow.$scene` 统计可同时覆盖冷启动和热启动进入来源，比单看 `$MPLaunch` 更全面。

## 4. 与相近事件的边界

### 与 `$MPLaunch`

`$MPLaunch` 描述小程序初始化或销毁后重新初始化；`$MPShow` 描述小程序进入前台可见。

| 维度 | `$MPLaunch` | `$MPShow` |
| --- | --- | --- |
| 触发时机 | 初始化完成或销毁后再次启动 | 小程序启动或从后台切回前台 |
| 覆盖范围 | 仅冷启动，含销毁后重启 | 冷启动 + 热启动到前台 |
| 触发回调 | `App.onLaunch(options)` | `App.onShow(options)` |
| 核心语义 | 重新初始化 | 进入前台可见 |
| `$is_first_time` | 1.8+ 采集 | 预置属性列表中没有 |
| 参数来源 | `wx.getLaunchOptionsSync()` | `wx.getEnterOptionsSync()` |
| 配置项 | `autoTrack.appLaunch`，默认 `true` | `autoTrack.appShow`，默认 `true` |

冷启动时先触发 `$MPLaunch`，再触发 `$MPShow`，但下游不必强制配对，两者可独立计数。热启动到前台时只触发 `$MPShow`。销毁后重启次数使用 `$MPLaunch`，进入前台可见次数使用 `$MPShow`。

### 与 `$MPViewScreen`

`$MPShow` 是小程序级展示入口，`$MPViewScreen` 是页面级浏览入口。

一次 `$MPShow` 后通常会跟随一次 `$MPViewScreen`，但两者不一一配对。小程序在前台期间可打开多个页面，每次页面进入都可能触发 `$MPViewScreen`，全程只需要一次 `$MPShow`。`$MPShow` 不携带页面身份；`$MPViewScreen` 携带 `$url`、`$url_path`、`$url_query` 等字段。

App 端 `$AppViewScreen` 的触发对象是 Activity / ViewController；小程序端 `$MPViewScreen` 的触发对象是 Page，对应小程序原生 `onLoad` / `onShow`，运行环境和页面身份口径不同。

### 与 `$MPHide`

`$MPHide` 是小程序从前台进入后台的出口，携带 `event_duration`，表示本次 `$MPShow` 到 `$MPHide` 的时长，单位为秒。

小程序会话应按 `$MPShow` → `$MPHide` 切分。即使冷启动时先出现 `$MPLaunch`，后续 `$MPHide.event_duration` 的起点仍是 `$MPShow`，不是 `$MPLaunch`。`$MPShow` 自身不携带时长；`$MPLaunch` 只作为冷启动标识，不直接参与会话切分。

小程序端没有与 App `$AppEnd` 完全对应的销毁事件预置；进程销毁由微信宿主管理。

### 与 `$MPShare`

`$MPShare` 描述用户在小程序内主动分享出去；带 `$share_*` 的 `$MPShow` 描述被分享者通过分享卡片进入。两者是同一分享链路的发起端和进入端。

`$MPShare` 在设置 `Page.onShareAppMessage` 后，由用户点击右上角菜单并选择“发送给朋友”触发。分析分享链路时，可将分享者侧 `$MPShare` 与被分享者侧 `$MPShow` 配合使用，通过 `$share_distinct_id` 关联分享者，通过 `$share_depth` 分析传播层级，通过 `$share_url_path` 识别分享页面。

### 与 `$AppStart`

`$MPShow` 与 `$AppStart` 都位于端级展示入口，但不能合并为同一事件口径。

**iOS：**`$AppStart` 在启动 App 或从后台切换进入 App 时触发，可携带 `$resume_from_background`、`$is_first_time`、`$app_state` 等 App 端属性。

**Android：**`$AppStart` 在启动 App 且距离上次退出超过 30 秒，或新装首次启动时触发，可携带 `$resume_from_background`、`$is_first_time` 等 App 端属性。

**HarmonyOS：**`$AppStart` 在启动 App 时触发，具体属性和生命周期按 HarmonyOS App SDK 口径处理。

**微信小程序：**`$MPShow` 在冷启动或热启动到前台时触发，携带 `$scene`、UTM、`$share_*` 等小程序属性，不携带 `$resume_from_background`、`$is_first_time`。它由 `App.onShow` 触发，与 App SDK 监听的 iOS `didFinishLaunchingWithOptions`、Android `Application` 生命周期和 HarmonyOS `onCreate` 不同。

跨端展示入口分析应分别聚合 `$AppStart` 和 `$MPShow`，不能直接合并计数。

### 与 `AppCrashed`

`AppCrashed` 是 App 原生端崩溃事件。微信小程序运行在微信宿主内，没有独立的 `AppCrashed` 预置事件，`$MPShow` 与其没有直接配对关系。

如果小程序在 `$MPShow` 后发生宿主层异常，应结合微信宿主日志分析，不能用神策 App 原生 `AppCrashed` 解释或直接采集。

## 5. 核验结论与适用边界

### 当前结论

`$MPShow` 是微信小程序唯一的进入前台可见入口事件，覆盖冷启动和热启动到前台。它与 `$MPLaunch` 形成“启动 - 展示”入口链路，与 `$MPHide` 形成“展示 - 后台”会话起止。

`$MPShow.$scene` 和 UTM 在热启动时反映最近一次进入来源，覆盖范围比仅描述冷启动的 `$MPLaunch` 更广。分享属性可用于分析被分享者进入链路，但所有属性都受对应 SDK 版本和实际入口参数约束。

### 指标处理口径

神策官方没有直接定义 `$MPShow` 在各项产品指标中的处理方式。以下口径基于事件和属性语义推导：

| 指标 | 是否依赖 `$MPShow` | 理由 |
| --- | --- | --- |
| 渠道归因 | 强依赖 `$scene`、UTM | 覆盖冷启动和热启动的最近进入来源 |
| DAU / MAU | 强依赖 | 可覆盖仅从后台切回、未发生冷启动的活跃场景 |
| 进入前台可见次数 | 强依赖 | 直接按 `$MPShow` 计数 |
| 冷启动次数 | 不直接依赖 | 应按 `$MPLaunch` 计数 |
| 分享链路 | 强依赖 `$share_*` | 描述分享进入的层级、发起方和页面 |
| 首日访问用户 | 不依赖 `$is_first_time` | `$MPShow` 不携带该属性；应使用 `$MPLaunch.$is_first_time` 或所有事件都有的 `$is_first_day` |
| 会话时长 | 不直接依赖事件自身字段 | 时长来自 `$MPHide.event_duration`，起点是 `$MPShow` |
| 留存分析 | 弱依赖 | 可作为首次入口事件之一，需结合项目留存定义 |

“渠道归因强依赖”等指标判断不是神策官方直接给出的产品指标定义。实际使用还需符合神策“推广微信小程序”文档的 UTM 拼接规范。

### 冷启动与热启动口径

- **路径 A：**销毁后重启次数 = `$MPLaunch` 计数。
- **路径 B：**进入前台可见次数，含冷启动和热启动 = `$MPShow` 计数。
- **路径 C：**冷启动次数 = `$MPLaunch` 计数。
- **路径 D：**前台会话数 = `$MPShow` → `$MPHide` 配对数量，包含冷启动和热启动到前台产生的会话。

使用“启动总次数”时必须明确是仅指冷启动，还是包含热启动到前台；神策官方没有提供统一的合并口径。

### 待核验事项

- 项目实际接入的是微信、支付宝、抖音、百度还是其他小程序平台。
- CLKLOG / CDP 是否实际采集 `$MPShow`，是否覆盖微信小程序宿主，`autoTrack.appShow` 是否为 `true`。
- 项目神策小程序 SDK 版本是否满足 `$scene`、`$url_query`、UTM 和 `$share_*` 的版本要求。
- 微信后台销毁时长在目标版本和运行环境中的实际行为。
- `$scene`、`$url_query`、UTM、`$share_*` 的字段完整性。
- 分享卡片信息和 UTM 同时存在时，两组属性是否互斥或同时采集。
- 开发版、体验版、正式版是否采用相同采集和过滤策略。
- `autoTrack.appShow` 之外是否存在由 `sensorsdata_conf.js`、`init()`、`setOnce` 或单事件属性插件形成的其他关闭或定制路径。
- 小程序宿主异常如何记录，是否有独立的微信侧崩溃日志。

### 关键假设与适用限制

- 当前口径仅以神策微信小程序 SDK 为基准，不能直接套用于其他小程序平台。
- 神策官网没有给出微信宿主后台销毁的精确时长；“常见 5 分钟级别”不是固定规则。
- 神策官网没有直接定义 DAU、进入前台次数、留存和渠道归因等产品指标；本文的指标依赖关系属于语义推导。
- `$share_*` 和其他属性受 SDK 版本限制，旧版本可能缺失。
- 神策官网没有明确分享信息与 UTM 同时存在时的采集优先级。
- 神策官网没有说明开发版、体验版、正式版是否存在采集差异；“SDK 通常不区分”仍需项目数据验证。
- `autoTrack` 是影响所有用户的全局配置；`setOnce` 或单事件属性插件可能对个别事件做定制化。
- 小程序宿主崩溃不通过 App 原生 `AppCrashed` 采集。
- 当前尚未验证生产数据中的事件存在性、平台归属、配置和字段完整性。

## 附录一：参考文献

- 神策官方，微信小程序 SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_miniprogram_preset_properties/v0300>
- 神策官方，集成文档（微信小程序）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_mp_wechat/v0300>
- 神策官方，所有事件都有的预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_miniprogram_preset_properties/v0300>
- 神策官方，推广微信小程序：<https://manual.sensorsdata.cn/sa/docs/pomote_wechatapplet/v0300>
- 神策官方，新增用户及首日首次标记：<https://manual.sensorsdata.cn/sa/docs/tech_knowledge_new/v0300>
- 神策技术社区，《神策数据微信小程序 SDK 架构解析》（SegmentFault 思否）：说明 SDK 代理 App / Page / Component 及生命周期的实现。
- 微信开放社区，小程序启动与小程序销毁时机：<https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism.html>
- 微信开放社区，场景值列表：<https://developers.weixin.qq.com/miniprogram/dev/reference/scene-list.html>
- 微信开放社区，`wx.getEnterOptionsSync`：<https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getEnterOptionsSync.html>
- 微信开放社区，`wx.getLaunchOptionsSync`：<https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getLaunchOptionsSync.html>
- 已建立口径文档，`$MPLaunch.md`：提供 `$MPShow` 与小程序冷启动入口的对照基础。
- 已建立口径文档，`$AppViewScreen.md`：提供 App 页面级入口的粒度对照。
- 已建立口径文档，`$AppStart.md`：提供 App 原生启动事件的跨端对照。
- 已建立口径文档，`$AppStartPassively.md`：提供 App 被动启动的跨端参考。
- 已建立口径文档，`$AppEnd.md`：提供 App 退出与小程序会话出口的对照。
- 已建立口径文档，`$AppPageLeave.md`：提供 App 页面级出口的参考。
- 已建立口径文档，`$AppClick.md`：提供 App 元素级事件的参考。

## 附录二：调查背景与过程记录

### 调查目标

原调查任务用于澄清 `$MPShow` 的实际业务场景、触发时机、语义边界和分析价值，并在已完成 App 生命周期、页面与点击事件，以及 `$MPLaunch` 冷启动入口口径的基础上，补齐微信小程序“进入前台可见”入口。

调查以神策公开预置事件口径为主要解释基准，不设计业务侧加工规则或下游产品指标。原任务还希望形成可供后续 `$MPViewScreen`、`$MPHide` 调查复用的小程序前台入口基准，并与 `$MPLaunch` 组成完整的“启动 - 展示”入口语义。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 待覆盖事件清单包含 `$AppStart`、`$AppStartPassively`、`$AppEnd`、`$AppViewScreen`、`$AppPageLeave`、`$AppClick`、`$MPLaunch`、`$MPShow`、`$MPViewScreen`、`$MPHide`、`$WebStay`、`$WebClick`、`$pageview`、`AppCrashed` 等事件。
- 每个 event 至少需要分析实际场景、端类型、触发时机、相近事件差异和分析价值。
- `Index.md` 没有指明小程序所属宿主平台，也没有单独定义 `$MPShow`。

### 来源区分与推导过程

事件定义、微信小程序端归属、11 个版本化属性、`autoTrack.appShow`、`$lib` 和 `App.onShow` 代理机制来自神策官方文档及 SDK 架构资料。

微信从后台切换到前台和销毁场景的补充来自微信开放社区。DAU、进入前台次数、冷启动次数、渠道归因、分享链路、留存和四条启动 / 会话路径属于基于字段语义的推导，不是神策官方直接定义。

### 原约束回写记录

原调查报告建议向 `Index.md` 或上游可信输入补充以下约束：

- `$MPShow` 是进入前台可见入口，由 `App.onShow` 触发，覆盖冷启动和热启动到前台；
- 11 个核心属性受 SDK 版本梯度约束，且不包含 `$is_first_time`；
- `autoTrack.appShow` 默认开启；
- `$MPShow` 使用 `wx.getEnterOptionsSync()`，`$MPLaunch` 使用 `wx.getLaunchOptionsSync()`；
- `$MPShow` 不携带时长或页面身份字段；
- `$MPHide.event_duration` 从 `$MPShow` 起算。

原调查报告建议向 `$MPLaunch.md` 补充两者的属性差异、参数来源、冷启动触发顺序和 `$MPHide` 时长起点。

原调查报告建议向 `$AppViewScreen.md` 补充小程序级事件 `$MPLaunch` / `$MPShow` / `$MPHide` 与页面级 `$MPViewScreen` 的层级关系。

原调查报告建议向 `$AppStart.md` 补充 App 与小程序展示入口的跨端差异、不可直接合并的计数边界，以及 `$MPShow` 不携带 `$is_first_time` 的限制。

### 原任务完成状态

- 已说明 `$MPShow` 的事件定义、微信小程序端归属、11 个版本化属性和触发机制。
- 已给出首次打开、聊天切回、销毁后重启、最近进入来源、分享卡片、公众号 / App 跳转等场景。
- 已明确与 `$MPLaunch`、`$MPViewScreen`、`$MPHide`、`$MPShare`、`$AppStart`、`AppCrashed` 的边界。
- 已给出销毁后重启、进入前台、冷启动和前台会话四种口径路径。
- 已记录需要回写到 `Index.md`、`$MPLaunch.md`、`$AppViewScreen.md`、`$AppStart.md` 的关键约束。
- 已标注宿主销毁时长、跨平台差异、SDK 版本、配置、分享与 UTM、开发 / 体验 / 正式版和生产数据未验证等限制。
