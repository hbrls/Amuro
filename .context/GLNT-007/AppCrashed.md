# `AppCrashed` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 20:32:50

## 1. 事件概览

`AppCrashed` 是神策 App SDK 的 **App 崩溃 / APP 崩溃**事件，用于记录 App 原生进程运行过程中发生、并被 SDK 捕获的崩溃。

它属于异常事件，不是用户主动行为，也不是正常退出、页面离开、Web 错误或小程序宿主异常。核心用途是统计崩溃、聚类原因，并结合版本、设备和崩溃前行为定位问题。

### 运行环境与触发口径

**Android：**Android App 接入神策 SDK 并开启崩溃采集后，可捕获支持范围内的原生运行时崩溃。具体异常类型、初始化方式和上报时机依 SDK 版本而定。

**iOS：**iOS App 接入神策 SDK 并开启崩溃采集后，可捕获支持范围内的原生运行时崩溃。具体异常类型、初始化方式和上报时机依 SDK 版本而定。

**HarmonyOS：**是否支持同名事件及具体崩溃采集能力，需要按项目使用的 HarmonyOS SDK 文档和版本验证，不能直接套用 Android / iOS 结论。

**Web / H5：**Web 页面 JavaScript 异常不属于 `AppCrashed`。App 内嵌 H5 只有在异常最终导致 App 原生进程崩溃、且被 App SDK 捕获时，才可能进入该口径。

**微信小程序：**小程序运行在微信宿主内，不产生项目 App SDK 的 `AppCrashed`；宿主异常需要使用微信侧日志分析。

**服务端：**服务端异常不属于 `AppCrashed`。

### 触发条件与接入边界

产生 `AppCrashed` 需要同时满足：App SDK 已接入并开启崩溃采集；SDK 在崩溃发生前已完成必要初始化；崩溃类型在 SDK 可捕获范围内；崩溃信息能够写入缓存或发送。

如果崩溃发生在 SDK 初始化之前、采集未开启、进程被系统直接杀死，或异常无法被 SDK 捕获，则可能没有 `AppCrashed`。

崩溃采集属于异常采集能力，不等同于页面 / 点击全埋点。项目还需确认是否与 Firebase Crashlytics、Bugly、Sentry 等其他崩溃 SDK 共存，异常 handler 是否被覆盖或调用链是否中断。

事件是在崩溃当下发送、下次启动补发，还是两者结合，需按实际 SDK 版本验证。该差异直接影响崩溃事件的时间戳、送达率和与前序行为的关联方式。

## 2. 关键属性

| 属性名 | 显示名 | 类型 | 含义 |
| --- | --- | --- | --- |
| `app_crashed_reason` | 崩溃原因 | 字符串 | 崩溃堆栈、异常原因或 SDK 捕获到的崩溃信息 |

`app_crashed_reason` 是 `AppCrashed` 的核心分析字段，可用于崩溃原因聚类。字段是否包含完整堆栈、是否被截断或脱敏，取决于 SDK 版本和项目处理方式。

作为 App 端事件，`AppCrashed` 通常还携带 App 版本、设备型号、操作系统、SDK 版本、用户标识和时间戳等公共预置属性。具体字段完整性依赖初始化时机和公共属性配置。

崩溃前页面、点击和启动链路不是 `AppCrashed` 自身属性。能否关联取决于用户 / 设备 / 会话标识、时间顺序，以及前序事件是否已成功上报。

## 3. 神策口径下的场景解释

`AppCrashed` 的统一语义是“App 原生进程发生可捕获崩溃”。异常结束、进程消失或功能报错本身都不足以证明发生了该事件。

### 场景一：点击按钮后发生原生崩溃

**Android：**用户点击“立即支付”后，业务代码触发空指针或数组越界，导致原生进程崩溃。SDK 已开启采集时，可上报 `AppCrashed`，并在 `app_crashed_reason` 中记录异常摘要或堆栈。

**iOS：**用户执行操作后触发可捕获的原生异常并导致进程崩溃，SDK 可按 iOS 版本支持范围记录 `AppCrashed`。

崩溃前最后一次 `$AppClick` 可作为定位线索，但若点击事件尚未完成发送就崩溃，该事件可能缺失。

### 场景二：页面加载后立即崩溃

**App 原生端：**用户进入页面，`$AppViewScreen` 已上报，页面初始化过程中发生崩溃。SDK 捕获后上报 `AppCrashed`。

最近一条 `$AppViewScreen` 可辅助定位问题页面；页面进入事件未成功发送时，仍需依靠崩溃堆栈和原生日志。

### 场景三：后台任务中崩溃

**iOS：**App 被动启动或执行后台任务时发生崩溃。若异常处于 SDK 可捕获范围，则产生 `AppCrashed`。

后台崩溃不一定存在页面或点击链路，可结合 `$AppStartPassively`、系统任务信息和崩溃原因区分前台操作与后台任务问题。

### 场景四：用户杀进程或系统回收

**App 原生端：**用户从最近任务列表关闭 App，或系统因资源紧张回收后台进程。这类行为通常不是代码异常崩溃，不应直接记为 `AppCrashed`。

不能把所有非正常结束都归因于崩溃；该事件应保留给 SDK 捕获到异常原因的场景。

### 场景五：App 内嵌 H5 发生 JavaScript 错误

**App 内嵌 H5：**H5 页面发生 JavaScript 异常，但 WebView 和 App 原生进程未崩溃。此时不应产生 `AppCrashed`。

H5 JavaScript 错误应由 Web 错误监控或自定义事件采集。只有错误导致原生进程崩溃并被 App SDK 捕获时，才可能产生 `AppCrashed`。

### 场景六：小程序宿主异常

**微信小程序：**微信或小程序宿主环境发生异常，神策小程序 SDK 不直接采集 `AppCrashed`。

小程序宿主异常与项目 App 原生崩溃属于不同问题域，需要结合微信宿主日志处理。

## 4. 与相近事件的边界

### 与 `$AppEnd`

`$AppEnd` 描述正常退出、进入后台或 SDK 定义下的会话结束；`AppCrashed` 描述异常崩溃。

崩溃是否同时伴随 `$AppEnd`，神策公开文档没有给出统一保证。不能把缺少 `$AppEnd` 的会话全部当作崩溃，也不能用 `AppCrashed` 替代正常会话出口。

### 与 `$AppClick`

`$AppClick` 回答用户点击了什么；`AppCrashed` 回答 App 因什么异常崩溃。

崩溃前最后一次 `$AppClick` 是重要定位线索，但不是崩溃事件本身。点击回调或事件发送尚未完成时发生崩溃，前序点击可能缺失。

### 与 `$AppViewScreen` / `$AppPageLeave`

`$AppViewScreen` 描述页面进入，`$AppPageLeave` 描述页面离开，`AppCrashed` 描述异常终止。

崩溃前最近一条 `$AppViewScreen` 可辅助定位页面；崩溃路径上 `$AppPageLeave` 可能缺失，使页面时长断尾。`AppCrashed` 可用于识别异常断尾，但不能补造缺失的页面离开时长。

### 与 `$AppStart` / `$AppStartPassively`

`$AppStart` / `$AppStartPassively` 是启动事件，`AppCrashed` 是运行期异常事件。

崩溃后重新打开 App 可能产生新的 `$AppStart`；后台任务崩溃可能与 `$AppStartPassively` 相关。新的启动和之前的崩溃是两个事件，不能混为同一语义。

### 与 Web 事件组

`$pageview`、`$WebClick`、`$WebStay` 是 Web JS SDK 的页面、元素和视区事件，不属于 App 原生崩溃。

H5 页面浏览、点击或 JavaScript 错误不会天然产生 `AppCrashed`。WebView 问题只有导致原生 App 进程崩溃并被 SDK 捕获时才进入该口径；崩溃前 Web 事件是否送达取决于发送与缓存机制。

### 与小程序事件组

`$MPLaunch`、`$MPShow`、`$MPViewScreen`、`$MPHide` 是小程序 SDK 事件；`AppCrashed` 是 App 原生 SDK 异常事件。

小程序运行在微信宿主内，不产生项目 App SDK 的 `AppCrashed`。小程序异常或宿主崩溃需要微信侧日志，不能通过 `AppCrashed` 分析。

## 5. 核验结论与适用边界

### 当前结论

`AppCrashed` 只表示被神策 App SDK 捕获的原生进程崩溃，核心字段是 `app_crashed_reason`。它不表示所有异常结束，也不覆盖 Web JavaScript 错误、小程序宿主异常或服务端异常。

崩溃分析必须同时核对采集覆盖、送达机制、字段完整性和崩溃前行为链路，事件数不等于真实崩溃总数。

### 指标处理口径

| 指标 | 是否依赖 `AppCrashed` | 理由 |
| --- | --- | --- |
| 崩溃次数 / 崩溃用户数 | 强依赖 | 原生崩溃事件本身 |
| 崩溃率 | 强依赖 | 作为分子，并需启动、活跃或会话作为分母 |
| 崩溃原因聚类 | 强依赖 | `app_crashed_reason` 是核心字段 |
| 崩溃前行为链路 | 中依赖 | 需关联 `$AppViewScreen`、`$AppClick`、启动等事件 |
| 页面浏览时长修正 | 中依赖 | 可识别 `$AppPageLeave` 缺失造成的异常断尾 |
| Web / 小程序异常 | 不直接依赖 | Web 错误和小程序宿主异常不等于 App 原生崩溃 |
| 留存分析 | 弱依赖 | 崩溃影响体验，留存仍需启动 / 活跃和回访定义 |

崩溃率必须明确分母是启动次数、活跃用户还是会话数；不同分母不可直接比较。

### 待核验事项

- Android、iOS、HarmonyOS 各端是否接入神策崩溃采集，SDK 版本和支持能力。
- 崩溃采集是否开启，初始化是否早于潜在崩溃点。
- 是否共存 Firebase Crashlytics、Bugly、Sentry 等 SDK，handler 是否冲突。
- `app_crashed_reason` 是否完整入库、是否脱敏或被长度截断。
- 崩溃事件是在当下发送、下次启动补发，还是两者结合。
- CLKLOG / CDP 是否对 `AppCrashed` 二次封装、改名或增加公共属性。
- 生产数据中是否真实存在 `AppCrashed`，不同平台覆盖是否一致。
- `AppCrashed` 与 `$AppEnd`、`$AppPageLeave` 的实际伴随和缺失关系。
- 崩溃前页面、点击和启动事件能否通过用户、设备、会话和时间稳定关联。
- 系统杀进程、OOM、信号异常及启动早期崩溃是否处于实际 SDK 捕获范围。

### 关键假设与适用限制

- 当前口径假设 App 使用神策 App SDK 并开启崩溃采集；未开启时不会产生 `AppCrashed`。
- SDK 初始化前发生的启动早期崩溃可能无法捕获。
- 多个崩溃 SDK 共存可能覆盖异常 handler 或中断上报链路。
- `app_crashed_reason` 被截断或过度脱敏时，原因聚类能力会下降。
- 崩溃前行为关联依赖标识、会话、时间顺序和前序事件成功发送。
- 崩溃事件可能依赖本地缓存与下次启动补发，不能假定崩溃当下已经送达。
- 系统杀进程、资源回收和用户主动关闭通常不等于可捕获崩溃。
- `AppCrashed` 与 `$AppEnd` / `$AppPageLeave` 的伴随关系没有统一保证。
- HarmonyOS 支持能力不能直接从 Android / iOS 推导。
- 当前尚未验证生产数据中的事件存在性、字段完整性、发送可靠性、平台覆盖和链路可关联性。

## 附录一：参考文献

- 神策官方，App SDK 预置事件和预置属性相关文档：列出 `AppCrashed` / APP 崩溃事件及 `app_crashed_reason` 崩溃原因字段。
- 神策官方，Android SDK / iOS SDK 基础 API 与异常采集相关文档：说明 App SDK 崩溃采集能力；具体开启方式、支持范围和上报时机需按 SDK 版本核对。
- 已建立口径文档，`$MPHide.md`：提供小程序宿主异常不属于 `AppCrashed` 的边界。
- 已建立口径文档，`$WebStay.md`、`$WebClick.md`、`$pageview.md`：提供 Web 事件与 App 原生崩溃的边界。

## 附录二：调查背景与过程记录

### 调查目标

原调查任务用于澄清 `AppCrashed` 的实际业务场景、触发时机、关键属性、相近事件差异和异常分析价值，并完成 `Index.md` 既定事件清单的覆盖。

调查以神策 App SDK 公开文档为主要解释基础，不展开 Web 或小程序事件的完整定义。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 最后一个待覆盖事件是 `AppCrashed`。
- 每个 event 至少需要分析实际场景、端类型、触发时机、相近事件差异和分析价值。
- `Index.md` 没有单独定义 `AppCrashed`。

### 来自 `$MPHide.md` 的阶段输入

- App 事件组 6 个事件已完成调查。
- 小程序事件组 4 个事件已完成调查。
- 小程序运行在微信宿主内，不存在独立 `AppCrashed` 预置事件。
- `$MPHide.md` 只提供阶段状态和小程序异常边界，不用于套用 App 崩溃定义。

### 来源区分与推导过程

事件定义、App 原生端归属、崩溃采集能力和 `app_crashed_reason` 来自神策 App SDK 公开资料。

崩溃率分母、原因聚类、版本 / 设备分析、崩溃前行为链路和页面断尾修正属于基于事件与公共属性的分析推导。捕获范围、SDK 共存、补发机制和各平台覆盖需要项目实际验证。

### 原任务完成状态

- 已说明 `AppCrashed` 是 App 原生崩溃异常事件，不是退出、页面离开、点击、Web 错误或小程序宿主异常。
- 已明确 Android / iOS 主要运行环境和 HarmonyOS 待核验边界。
- 已说明采集开启、初始化时机、可捕获异常和发送 / 补发等触发条件。
- 已记录 `app_crashed_reason` 及 App 版本、系统、设备、标识和时间等公共属性。
- 已给出点击后崩溃、页面加载崩溃、后台任务崩溃、杀进程、H5 错误、小程序宿主异常等场景。
- 已明确与 `$AppEnd`、`$AppClick`、`$AppViewScreen` / `$AppPageLeave`、`$AppStart` / `$AppStartPassively`、Web 和小程序事件组的边界。
- 已标注采集开关、SDK 版本、handler 冲突、字段完整性、补发、伴随事件和生产覆盖等限制。
- 已形成 14 个既定事件的口径结果：`$AppStart`、`$AppStartPassively`、`$AppEnd`、`$AppViewScreen`、`$AppPageLeave`、`$AppClick`、`$MPLaunch`、`$MPShow`、`$MPViewScreen`、`$MPHide`、`$WebStay`、`$WebClick`、`$pageview`、`AppCrashed`。
