# `$MPHide` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 20:08:35

## 1. 事件概览

`$MPHide` 是神策微信小程序 SDK 预置的**小程序进入后台**事件，用于描述小程序从前台进入后台或关闭。它是小程序级会话出口，与 `$MPShow` 组成“进入前台 - 离开前台”的会话起止。

### 运行环境与触发口径

**微信小程序：**由微信原生 `App.onHide()` 生命周期回调触发。用户切到聊天、系统桌面、其他小程序、公众号或其他 App 时，小程序从前台进入后台，神策 SDK 自动上报 `$MPHide`。神策属性说明还把“关闭”纳入时长终点，因此原调查报告将用户主动销毁和系统强制销毁归入关闭路径。

**App 原生端：**iOS、Android、HarmonyOS App SDK 不提供 `$MPHide`；App 端级退出使用 `$AppEnd`，但触发延迟、属性和会话起点与小程序不同。

**Web 端：**Web JS SDK 不提供 `$MPHide`。

**服务端：**服务端 SDK 不提供 `$MPHide`。

**其他小程序平台：**支付宝、抖音、百度等平台是否存在同名同语义事件，需要对照各自神策 SDK 文档；本文只以微信小程序 SDK 为基准。

微信小程序 SDK 上报的事件带 `$lib = MiniProgram`，可作为端归属标识。`$MPHide` 是微信小程序宿主专属的预置事件，不存在跨端同名同语义事件。

`$MPHide` 由 `autoTrack.appHide` 控制，默认值为 `true`。设为 `false` 后，不再自动采集该事件。它与 `autoTrack.appLaunch`、`autoTrack.appShow` 相互独立，关闭其中一项不会自动级联关闭其他事件。神策将其归入小程序 SDK 通用性采集能力，开启 `autoTrack` 后自动采集。

### 采集机制

神策 SDK 初始化时保存微信原生 `App` 构造函数，并替换为 SDK 代理函数。业务仍可正常调用 `App({ onHide() {...} })`，无需为 `$MPHide` 修改生命周期代码。

宿主调用 `App.onHide()` 时，SDK 读取最近一次 `$MPShow` 时间戳，按原调查资料给出的实现公式计算 `event_duration = (now - last_MPShow_time) / 1000`，再构造 `$MPHide`。采集属性名是 `event_duration`，入库后字段名是 `$event_duration`。

`autoTrack.appLaunch`、`autoTrack.appShow`、`autoTrack.appHide` 是三项独立配置。校验完整小程序生命周期时必须逐项核对；特别是关闭 `$MPShow`、保留 `$MPHide` 时，时长是否仍能取得有效起点需要实际验证。

## 2. 关键属性

神策官网为 `$MPHide` 列出一个事件级预置属性：

| 属性名（采集时） | 类型 | 默认显示名 | 属性值说明 | 版本要求 |
| --- | --- | --- | --- | --- |
| `event_duration` | 数值 | 停留时长 | 从本次小程序显示 `$MPShow` 到进入后台或关闭 `$MPHide` 的时间，单位为秒 | 官网未注明下限；入库后为 `$event_duration` |

`event_duration` 的起点是最近一次 `$MPShow`，不是 `$MPLaunch`，也不是 `$MPViewScreen`；终点是进入后台或关闭。一次 `$MPShow` → `$MPHide` 配对表示一次小程序级前台会话。

采集时使用 `event_duration`，入库查询和神策分析筛选时使用 `$event_duration`。App 端 `$AppEnd` 也使用入库字段 `$event_duration`，但两者的会话起点不同，不能仅凭字段同名合并口径。

`$MPHide` 不携带 `$scene`、`$url_query`、UTM、`$share_*`、`$is_first_time`，也不携带 `$url`、`$url_path`、`$screen_name`、`$title`、`$referrer` 等页面身份字段。它只描述小程序级离开及本次前台时长，不描述入口渠道或离开页面。

小程序 SDK 在 `1.14.20+` 起提供页面级 `$MPPageLeave`，其 `event_duration` 从页面 `Page.onShow` 起算，入库后同样是 `$event_duration`。`$MPPageLeave` 表示页面级时长，`$MPHide` 表示小程序级会话时长，两者不能混用。

## 3. 神策口径下的场景解释

`$MPHide` 的统一语义是“小程序离开前台或关闭”。普通切后台时可直接对应 `App.onHide()`；用户主动销毁或系统销毁是否产生额外事件、何时上报，神策官网没有逐项说明，应结合实际 SDK 数据验证。

### 场景一：首次打开后立即切到聊天

**微信小程序：**用户首次打开小程序，宿主依次调用 `App.onLaunch(options)` 和 `App.onShow(options)`，SDK 上报 `$MPLaunch` 与 `$MPShow`。用户浏览 5 秒后切到聊天，宿主调用 `App.onHide()`，SDK 上报 `$MPHide`，`event_duration` 约为 5 秒。

入库后可按 `$MPHide.$event_duration` 统计短会话时长分布。

### 场景二：切到聊天后再次返回

**微信小程序：**用户从小程序切到聊天时，`App.onHide()` 结束第一个前台会话，产生 `$MPHide_1`，其时长是 `$MPShow_1` 到 `$MPHide_1`。用户随后返回，`App.onShow(options)` 开始第二个会话，产生 `$MPShow_2`，但不触发 `$MPLaunch`。

一次离开和再次返回会形成两个独立会话。前台会话数可按 `$MPShow` → `$MPHide` 配对数量解释。

### 场景三：用户主动销毁小程序

**微信小程序：**用户离开小程序后，从最近任务列表上滑销毁进程。原调查报告根据神策“进入后台或者关闭”的属性说明，将主动销毁归入 `$MPHide` 关闭路径，`event_duration` 从最近一次 `$MPShow` 计算到关闭时刻。

普通切后台时通常已经发生 `App.onHide()`；销毁时是否再产生一条 `$MPHide`，神策官网没有单独说明，不能在未验证数据前假定必然二次上报。

### 场景四：长时间停留后离开

**微信小程序：**用户连续浏览 15 分钟，期间打开多个页面但始终未离开小程序。切到聊天时，宿主调用 `App.onHide()`，SDK 上报 `$MPHide`，`event_duration` 约为 900 秒。

页面跳转不会重置小程序级时长起点；`$MPHide.$event_duration` 统计的是整个 `$MPShow` → `$MPHide` 前台会话，而不是某一页面时长。原调查报告将长会话用户作为高粘性用户示例，该判断属于业务分析推导。

### 场景五：系统资源紧张导致销毁

**微信小程序：**用户切到聊天后长期未返回，微信因资源紧张或宿主策略销毁后台进程。原调查报告将这种系统销毁视为“关闭”路径，时长按最近一次 `$MPShow` 到关闭时刻解释。

系统销毁时是否能额外执行 `App.onHide()` 并成功上报，神策官网没有单独确认。已在切后台时上报的 `$MPHide` 与销毁时可能发生的上报应通过真实事件序列核验。用户随后再次进入时属于冷启动，会触发 `$MPLaunch` + `$MPShow`。

### 场景六：销毁后重新冷启动

**微信小程序：**上一个前台会话以 `$MPHide` 结束，后台进程随后被微信销毁。用户再次进入时，宿主依次调用 `App.onLaunch(options)` 和 `App.onShow(options)`，SDK 上报 `$MPLaunch` 与新的 `$MPShow`。

`$MPHide` 标识上一个会话结束，`$MPLaunch` 标识重新初始化，`$MPShow` 标识新会话进入前台。`$MPLaunch.$is_first_time` 仍按用户层面的首次启动判断，不按进程是否重新创建判断。

## 4. 与相近事件的边界

### 与 `$MPShow`

`$MPShow` 是小程序级会话入口，`$MPHide` 是小程序级会话出口。

| 维度 | `$MPShow` | `$MPHide` |
| --- | --- | --- |
| 显示名 | 小程序显示 | 小程序进入后台 |
| 触发时机 | 小程序启动或从后台切回前台 | 从前台进入后台或关闭 |
| 触发回调 | `App.onShow(options)` | `App.onHide()` |
| 核心语义 | 进入前台可见 | 离开前台 / 关闭 |
| 事件级属性 | `$scene`、`$url_query`、UTM、`$share_*` | `event_duration`，入库后为 `$event_duration` |
| 会话时长 | 不携带 | 携带，起点是 `$MPShow` |
| 配置项 | `autoTrack.appShow`，默认 `true` | `autoTrack.appHide`，默认 `true` |

一次 `$MPShow` → `$MPHide` 配对形成一次前台会话，覆盖冷启动和热启动会话。入口来源分析使用 `$MPShow`，离开次数和会话时长使用 `$MPHide`。

### 与 `$MPViewScreen`

`$MPHide` 是小程序级离开事件；`$MPViewScreen` 是页面级浏览事件。一个前台会话内可以产生多条 `$MPViewScreen`，离开小程序时只产生相应的 `$MPHide`，两者不一一配对。

`$MPHide` 不记录用户在哪个页面离开。页面级离开和时长应使用 `1.14.20+` 的 `$MPPageLeave.$event_duration`；小程序级会话时长使用 `$MPHide.$event_duration`。两者字段名相同，但起点和粒度不同。

### 与 `$MPLaunch`

`$MPLaunch` 是小程序级冷启动 / 销毁后重启入口；`$MPHide` 是小程序级出口。

`$MPHide.event_duration` 的起点是 `$MPShow`，不是 `$MPLaunch`。即使冷启动时先出现 `$MPLaunch`，后续时长仍从紧随其后的 `$MPShow` 起算。`$MPLaunch` 不携带时长；`$MPHide` 不携带 `$is_first_time`、`$scene`、UTM 或 `$share_*`。

会话切分按 `$MPShow` → `$MPHide`，`$MPLaunch` 只用于标识和分类冷启动。

### 与 `$AppEnd`

两者都位于端级离开 / 退出位置，但触发条件和会话时长起点不同。

**iOS：**`$AppEnd` 在退出 App 或进入后台时立即触发，无延迟；`$event_duration` 从 `$AppStart` 起算。

**Android：**`$AppEnd` 在退到后台或关闭 App 后等待 30 秒触发，包含 30 秒 session 机制；可携带 `$screen_name`、`$title`，`$event_duration` 从 `$AppStart` 起算。

**HarmonyOS：**`$AppEnd` 在退出 App 时触发，`$event_duration` 按 App 端 `$AppStart` → `$AppEnd` 口径解释。

**微信小程序：**`$MPHide` 在进入后台时立即触发，无 30 秒等待；只携带 `event_duration`，入库后为 `$event_duration`，起点是 `$MPShow`。

跨端会话时长应分别聚合 `$AppEnd.$event_duration` 和 `$MPHide.$event_duration`，不能直接合并求和或平均。

### 与 `AppCrashed`

`AppCrashed` 是 App 原生端崩溃事件。微信小程序运行在微信宿主内，没有独立的 `AppCrashed` 预置事件，`$MPHide` 与其没有直接配对关系。

原调查报告推断，宿主层异常可能沿关闭路径触发 `$MPHide`，使时长反映异常前最后一段停留；神策官网没有单独确认这一行为。崩溃原因仍需结合微信宿主日志分析，不能用 App 原生 `AppCrashed` 解释或直接采集。

## 5. 核验结论与适用边界

### 当前结论

`$MPHide` 是微信小程序离开前台 / 关闭的出口事件。它只提供小程序级 `event_duration`，入库字段为 `$event_duration`，明确从最近一次 `$MPShow` 起算。

`$MPShow` → `$MPHide` 是前台会话起止；`$MPLaunch` 只标识冷启动，`$MPViewScreen` 只标识页面浏览，均不是 `$MPHide` 时长的起点。

### 指标处理口径

神策官方没有直接定义 `$MPHide` 在各项产品指标中的完整处理方式。以下口径基于事件和属性语义推导：

| 指标 | 是否依赖 `$MPHide` | 理由 |
| --- | --- | --- |
| 小程序级会话时长 | 强依赖 `$event_duration` | 直接记录 `$MPShow` 到 `$MPHide` 的秒数 |
| 前台会话数 | 强依赖 | 可按 `$MPShow` → `$MPHide` 配对数量统计 |
| 离开次数 | 强依赖 | 可按 `$MPHide` 计数，关闭路径需结合实际上报验证 |
| 用户活跃度 | 弱依赖 | 作为活跃链路的出口，与 `$MPShow` 配合使用 |
| DAU / MAU | 弱依赖 | 可证明用户活动，但通常以入口或任意事件计算 |
| 渠道归因 | 不依赖 | 不携带 `$scene`、UTM、`$share_*` |
| 首日访问用户 | 不依赖 | 不携带 `$is_first_time`；应使用 `$MPLaunch.$is_first_time` 或 `$is_first_day` |
| 留存分析 | 弱依赖 | 不携带首次标识，通常以入口事件和项目留存定义为准 |

`$event_duration` 的字段含义由神策官方明确；“会话切分使用 `$MPShow` → `$MPHide`”及上述指标依赖关系属于基于该字段语义的推导。

### 跨端会话时长路径

- **路径 A：App 端会话时长。**聚合 `$AppEnd.$event_duration`，起点是 `$AppStart`。
- **路径 B：小程序端会话时长。**聚合 `$MPHide.$event_duration`，起点是 `$MPShow`。
- **路径 C：跨端会话时长。**不能直接合并前两者；如需统一，必须在产品口径中重新定义可比较的会话起点。

App 端 `$AppStart` 覆盖 App 的完整会话入口，小程序端则由 `$MPShow` 覆盖冷启动和热启动的全部前台入口，因此两个 `$event_duration` 虽同名，起点并不对称。

### 待核验事项

- 项目实际接入的是微信、支付宝、抖音、百度还是其他小程序平台。
- CLKLOG / CDP 是否实际采集 `$MPHide`，是否覆盖微信小程序宿主，`autoTrack.appHide` 是否为 `true`。
- `event_duration` 的 SDK 版本下限；神策官网未在事件表中注明。
- `$event_duration` 的实际精度和存储类型；官网只明确单位为秒。
- 用户主动销毁或系统销毁时是否会额外触发 `$MPHide`，以及是否存在重复上报。
- 宿主崩溃时能否执行 `App.onHide()` 并成功发送事件。
- 极短时间内多次 `$MPShow` → `$MPHide` 时，时长是否始终从最近一次 `$MPShow` 起算。
- `autoTrack.appShow = false`、`autoTrack.appHide = true` 时，时长是否缺失或异常。
- 开发版、体验版、正式版是否采用相同采集和过滤策略。
- `$MPPageLeave` 与 `$MPHide` 在实际 SDK 版本中的字段和粒度是否符合文档说明。

### 关键假设与适用限制

- 当前口径仅以神策微信小程序 SDK 为基准，不能直接套用于其他小程序平台。
- 神策官网没有注明 `event_duration` 的 SDK 版本下限。原调查报告参考 `$MPPageLeave` 的版本信息反推 `$MPHide` 可能自 1.0+ 起支持，但该推断没有直接文档依据，仍需实际核验。
- 用户主动销毁、系统销毁和宿主崩溃时的上报行为没有被官网逐项确认，相关场景说明不能替代真实事件序列验证。
- 并发或快速切换场景按“最近一次 `$MPShow`”解释，是基于“本次小程序显示”的语义推导。
- 神策官网没有直接定义会话数、离开次数、DAU、留存和跨端会话时长等产品指标；本文的指标关系属于语义推导。
- `$MPHide.$event_duration` 是小程序级时长，不能与 `$MPPageLeave.$event_duration` 的页面级时长混用。
- `$AppEnd.$event_duration` 与 `$MPHide.$event_duration` 字段同名但起点不同，不能直接跨端合并。
- 神策官网没有说明开发版、体验版、正式版是否存在采集差异。
- 小程序宿主崩溃不通过 App 原生 `AppCrashed` 采集。
- 当前尚未验证生产数据中的事件存在性、平台归属、配置和字段完整性。

## 附录一：参考文献

- 神策官方，微信小程序 SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_miniprogram_preset_properties/v0300>
- 神策官方，集成文档（微信小程序）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_mp_wechat/v0300>
- 神策官方，所有事件都有的预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_miniprogram_preset_properties/v0300>
- 神策技术社区，《神策数据微信小程序 SDK 架构解析》（SegmentFault 思否）：说明 SDK 代理 App / Page / Component 及生命周期的实现。
- 微信开放社区，小程序启动与小程序销毁时机：<https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism.html>
- 已建立口径文档，`$MPLaunch.md`：提供冷启动入口及其与会话出口的边界。
- 已建立口径文档，`$MPShow.md`：提供进入前台入口和 `$MPShow` → `$MPHide` 配对基础。
- 已建立口径文档，`$MPViewScreen.md`：提供页面浏览与小程序级会话时长的粒度对照。
- 已建立口径文档，`$AppEnd.md`：提供 App 端退出和 `$event_duration` 起点的跨端对照。
- 已建立口径文档，`$AppStart.md`：提供 App 端会话入口的跨端对照。

## 附录二：调查背景与过程记录

### 调查目标

原调查任务用于澄清 `$MPHide` 的实际业务场景、触发时机、属性命名、语义边界和分析价值，并在小程序冷启动、进入前台和页面浏览口径的基础上，补齐微信小程序会话出口。

调查以神策公开预置事件口径为主要解释基准，不设计业务侧加工规则或下游产品指标。原任务还希望形成可供 Web 事件调查复用的小程序级会话出口基准，并与 `$MPShow` 组成完整会话起止。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 待覆盖事件清单包含 `$AppStart`、`$AppStartPassively`、`$AppEnd`、`$AppViewScreen`、`$AppPageLeave`、`$AppClick`、`$MPLaunch`、`$MPShow`、`$MPViewScreen`、`$MPHide`、`$WebStay`、`$WebClick`、`$pageview`、`AppCrashed` 等事件。
- 每个 event 至少需要分析实际场景、端类型、触发时机、相近事件差异和分析价值。
- `Index.md` 没有指明小程序所属宿主平台，也没有单独定义 `$MPHide`。

### 来源区分与推导过程

事件定义、微信小程序端归属、`event_duration` / `$event_duration` 命名、秒单位、`$MPShow` 起点、`autoTrack.appHide`、`$lib` 和 App 代理机制来自神策官方文档及 SDK 架构资料。

微信前后台与销毁机制补充来自微信开放社区。销毁 / 崩溃时的具体上报行为、最近一次 `$MPShow`、会话数、离开次数、指标依赖关系和三条跨端时长路径属于基于生命周期或字段语义的推导，不是神策官方逐项直接定义。

### 原约束回写记录

原调查报告建议向 `Index.md` 或上游可信输入补充以下约束：

- `$MPHide` 是进入后台 / 关闭的出口，由 `App.onHide` 触发；
- 唯一事件级属性是 `event_duration`，入库后为 `$event_duration`，官网未注明版本下限；
- `autoTrack.appHide` 默认开启，并与 launch / show 配置相互独立；
- `$event_duration` 从 `$MPShow` 起算，不从 `$MPLaunch` 或 `$MPViewScreen` 起算；
- `$MPHide` 不携带渠道、首次启动或页面身份字段；
- `$MPShow` → `$MPHide` 表示小程序级前台会话。

原调查报告建议向 `$MPShow.md` 补充属性命名、独立配置、关闭路径和会话配对。

原调查报告建议向 `$MPLaunch.md` 补充 `$MPHide` 与冷启动入口没有字段共享关系，且 `$MPLaunch` 只用于入口分类。

原调查报告建议向 `$AppEnd.md` / `$AppStart.md` 补充 App 与小程序 `$event_duration` 起点不对称、不能直接跨端合并的约束。

### 原任务完成状态

- 已说明 `$MPHide` 的事件定义、微信小程序端归属、唯一事件级属性、命名差异和触发机制。
- 已给出短会话、切出再返回、主动销毁、长会话、系统销毁、销毁后冷启动等场景。
- 已明确与 `$MPShow`、`$MPViewScreen`、`$MPLaunch`、`$AppEnd`、`AppCrashed` 的边界。
- 已给出会话时长、会话数、离开次数等指标推导，以及 App、小程序、跨端 3 条时长路径。
- 已记录需要回写到 `Index.md`、`$MPShow.md`、`$MPLaunch.md`、`$AppEnd.md`、`$AppStart.md` 的关键约束。
- 已标注版本下限、精度、销毁 / 崩溃上报、快速切换、配置完整性、平台差异和生产数据未验证等限制。
- 已形成 App 端 6 个事件和小程序端 4 个事件的阶段性口径结果，为后续 Web 与异常事件调查提供状态输入。
