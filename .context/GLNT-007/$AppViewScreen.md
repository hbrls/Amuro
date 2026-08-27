# `$AppViewScreen` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 14:59:05

## 1. 事件概览

`$AppViewScreen` 是神策 App 端全埋点预置的 **App 浏览页面**事件，用于描述页面进入前台可见状态。iOS、Android、HarmonyOS 均有该事件，跨端语义一致，但触发对象和采集能力不同。

### 端侧触发口径

**iOS：**打开一个 ViewController 页面时触发。神策 iOS 快速使用文档将触发时机写作 `Controller viewViewAppear`，对应 `UIViewController.viewDidAppear:`。SDK 通过 Method Swizzling 交换该方法，在页面已渲染并可见时上报 `$AppViewScreen`。

**Android：**打开一个 Activity 页面时触发。SDK 利用 `Application.ActivityLifecycleCallbacks.onActivityResumed` 监听 Activity 进入已显示状态。Fragment 默认不触发 `$AppViewScreen`；如需采集，必须单独开启。

**HarmonyOS：**支持 `$AppViewScreen`。具体触发实现以神策 HarmonyOS 全埋点文档为准，现有公开资料未在当前口径中展开实现细节。

## 2. 关键属性

| 属性名 | 类型 | 默认显示名 | 属性值说明 | 备注 |
| --- | --- | --- | --- | --- |
| `$screen_name` | 字符串 | 页面名称 | Android 为 Activity 包名.类名；iOS 为 ViewController 类名；可手动设置 | 三端核心页面身份字段 |
| `$title` | 字符串 | 页面标题 | Android 为 Activity 标题；iOS 为 ViewController 标题 | HarmonyOS SDK 不采集 |
| `$url` | 字符串 | 页面地址 | Android 3.2.8+、iOS 1.11.5+ 自动采集 | HarmonyOS SDK 不采集 |
| `$referrer` | 字符串 | 前向地址 | Android 3.2.8+、iOS 1.11.5+ 自动采集 | HarmonyOS SDK 不采集 |

`$screen_name` 是页面身份的核心字段。业务可手动覆盖，因此下游使用前需要确认默认值是否仍保持 Activity / ViewController 类名口径。

`$referrer` 用于描述前向页面，可与 `$screen_name` 或 `$url` 一起构建页面路径。

与 `$AppStart`、`$AppEnd` 不同，神策文档没有把 `$AppViewScreen` 标注为支持属性插件化二次加工，但业务仍可手动设置 `$screen_name` 和 `$title`。

## 3. 神策口径下的场景解释

### 场景一：打开新的 App 页面

**iOS：**用户在电商 App 首页点击商品卡片，通过 UINavigationController push 到 `ProductDetailViewController`。当详情页执行 `viewDidAppear:` 时，SDK 触发 `$AppViewScreen`，记录 `$screen_name = ProductDetailViewController`、`$title = 商品详情`，并可能记录 `$referrer`。

例子：用户从 `HomeViewController` 进入 `ProductDetailViewController`，形成对应的 `$screen_name` 页面序列，`$referrer` 可用于路径分析。

**Android：**用户点击底部“分类”Tab，进入 `CategoryActivity`。当 Activity 执行 `onResume` 并进入已显示状态时，SDK 触发 `$AppViewScreen`，记录 `$screen_name = com.example.shop.CategoryActivity`。

例子：用户从 `com.example.shop.MainActivity` 进入 `com.example.shop.CategoryActivity`，形成页面浏览序列。

### 场景二：从后台恢复到原页面

App 从后台恢复时，如果当前页面没有重新进入相应的页面显示回调，则不会重复触发 `$AppViewScreen`。这是页面浏览事件与 App 启动 / 恢复事件的重要差异。

**iOS：**用户将 App 切到后台，几分钟后回到原页面。如果该页面的 `viewDidAppear:` 没有再次执行，则不重复触发 `$AppViewScreen`。只有进入新页面或返回旧页面并重新触发显示回调时，才会产生新的页面浏览事件。

**Android：**用户从后台切回原 Activity 时，如果没有重新触发 `onActivityResumed`，则不重复触发 `$AppViewScreen`。神策全埋点白皮书将“App 热启动 / 后台恢复时第一个界面不触发 `$AppViewScreen`”列为实现层面的遗留问题。

### 场景三：HarmonyOS 页面浏览

**HarmonyOS：**用户切换到某个页面时可产生 `$AppViewScreen`。该端不采集 `$title`、`$url`、`$referrer`，因此按神策默认 SDK 口径，页面浏览主要依赖 `$screen_name`。

### 场景四：后台被动启动时意外产生页面浏览

**iOS：**`$AppStartPassively` 触发时 App 在后台运行，正常情况下不会立即触发 `$AppViewScreen`。如果后台任务通过代码渲染或预加载页面，可能意外产生 `$AppViewScreen`，需要作为异常模式或脏数据识别。

## 4. 与相近事件的边界

### 与 `$AppPageLeave`

`$AppViewScreen` 描述页面进入，`$AppPageLeave` 描述页面离开并携带浏览时长。两者属于页面级会话的入口和出口，与 App 级 `$AppStart` / `$AppEnd` 是不同粒度的配对关系。

| 维度 | `$AppViewScreen` | `$AppPageLeave` |
| --- | --- | --- |
| 触发时机 | 页面进入前台可见 | 页面离开并变为不可见 |
| 端支持 | iOS / Android / HarmonyOS | Android SDK v5.4.2+、iOS SDK v3.1.5+；HarmonyOS 暂不支持 |
| 是否带浏览时长 | 否 | 是，`$event_duration` 表示本次页面浏览时长 |
| 关键属性 | `$screen_name`、`$title`、`$url`、`$referrer` | `$event_duration`、`$screen_name`、`$title`、`$url`、`$referrer` |
| 是否强制成对 | 否 | 否，但语义上对应之前的页面进入 |

如果项目使用较早的 Android 或 iOS SDK，可能只有 `$AppViewScreen` 而没有 `$AppPageLeave`，页面浏览时长将无法直接按神策该事件口径获取。

### 与 `$AppStart`、`$AppEnd`

`$AppStart` 和 `$AppEnd` 是 App 级会话入口与出口；`$AppViewScreen` 是单次页面浏览入口，不构成 App 级会话。

一次 `$AppStart` 后通常会出现一次或多次 `$AppViewScreen`，冷启动后用户看到的第一个页面也可能触发 `$AppViewScreen`。但 `$AppStart` 不能说明用户浏览了哪个页面，`$AppViewScreen` 也不能替代启动事件。

`$AppEnd` 不影响已经上报的最后一次 `$AppViewScreen`。`$AppEnd` 与最近一次 `$AppViewScreen` 的时间差也不构成 App 会话时长；App 会话时长以 `$AppEnd.$event_duration` 为准。

### 与 `$AppStartPassively`

`$AppStartPassively` 是 iOS-only 的系统后台拉活事件；`$AppViewScreen` 是页面进入前台可见事件。

**iOS：**被动启动时 App 在后台运行，正常情况下不会立即触发 `$AppViewScreen`。若后台任务意外触发页面渲染或预加载，则需要识别该异常模式，避免把后台行为解释为用户页面浏览。

### 与 `AppCrashed`

App 崩溃前最后浏览的页面如果已经触发 `$AppViewScreen`，崩溃不会回滚该事件。

崩溃路径可能没有对应的 `$AppPageLeave`，因为页面离开事件依赖正常生命周期回调。因此，崩溃前最后一次 `$AppViewScreen` 可能没有页面离开配对，页面浏览时长会缺失一段。异常分析应结合 `AppCrashed` 识别这种断尾链路。

### 与 `$AppClick`

`$AppViewScreen` 是页面级浏览事件，`$AppClick` 是页面内元素级点击事件。

| 维度 | `$AppViewScreen` | `$AppClick` |
| --- | --- | --- |
| 事件粒度 | 页面级 | 元素级 |
| 触发时机 | 页面进入前台可见 | 用户点击控件 |
| 页面内频次 | 通常每次页面进入一次 | 同一页面可触发多次 |
| 主要作用 | 提供页面上下文 | 描述页面内交互 |

两者可结合构造页面浏览到页面内点击的漏斗。业务未手动覆盖时，`$AppClick.$screen_name` 应与对应页面的 `$AppViewScreen.$screen_name` 一致。

## 5. 核验结论与适用边界

### 当前结论

`$AppViewScreen` 是 App 页面级浏览入口，核心身份字段为 `$screen_name`，可配合 `$referrer` 分析页面路径。它不携带页面浏览时长；时长由 `$AppPageLeave.$event_duration` 提供。

### 指标处理口径

神策官方没有直接定义 `$AppViewScreen` 在各项业务指标中的处理方式。以下口径基于事件和属性语义推导：

| 指标 | 是否依赖 `$AppViewScreen` | 理由 |
| --- | --- | --- |
| 页面路径分析 | 强依赖 `$screen_name`、`$referrer` | 页面身份和前向页面用于构建路径 |
| 页面级漏斗 | 强依赖 | 可按 `$screen_name` 序列构造 |
| 页面浏览次数（PV） | 强依赖 | 直接按 `$AppViewScreen` 计数 |
| 页面浏览时长 | 不直接依赖 | 时长来自 `$AppPageLeave.$event_duration` |
| DAU | 一般不直接依赖 | DAU 按是否有事件触发计算 |
| 留存分析 | 不直接依赖 | 留存按首次事件时间计算 |

“页面路径强依赖”属于基于 `$screen_name` 和 `$referrer` 的语义推导，不能表述为神策官方产品指标定义。

神策产品中的页面浏览数与活跃页面数也应区分：页面浏览数可直接按 `$AppViewScreen` 计数；活跃页面数通常按一段时间内出现的不同 `$screen_name` 数量计算，属于推导口径。

### 待核验事项

- CLKLOG / CDP 是否实际采集 `$AppViewScreen`，以及 iOS、Android、HarmonyOS 的覆盖范围。
- Android 是否启用 Fragment 页面浏览采集。
- 项目 SDK 版本是否满足 `$url`、`$referrer` 的自动采集要求：Android 3.2.8+、iOS 1.11.5+。
- 项目是否启用 `$AppPageLeave`，以及 SDK 是否满足 Android v5.4.2+、iOS v3.1.5+。
- `$screen_name`、`$title` 是否被业务手动覆盖，页面身份是否仍稳定。
- HarmonyOS 端是否按默认口径不采集 `$title`、`$url`、`$referrer`。
- 热启动 / 后台恢复时第一个页面是否在当前 SDK 版本中确实缺少 `$AppViewScreen`。
- 崩溃路径是否存在 `$AppViewScreen` 无 `$AppPageLeave` 的断尾数据。

### 关键假设与适用限制

- 当前口径以神策公开 App SDK 文档为基准；如果 CLKLOG / CDP 对事件做过二次封装，应以项目内实现为准。
- 神策官网未直接定义页面路径、漏斗、留存等产品指标；本文的指标依赖关系属于语义推导。
- HarmonyOS 的具体触发实现未在当前公开资料中展开，只能确认事件存在及属性采集差异。
- Android Fragment 默认不触发 `$AppViewScreen`；具体开启方式不在本口径范围内。
- “热启动时第一个界面不触发 `$AppViewScreen`”来自神策全埋点白皮书的实现层说明，不是官网预置事件表的直接定义，需结合实际 SDK 版本验证。
- 当前尚未验证生产数据中的事件存在性、HarmonyOS 覆盖、Fragment 配置和属性完整性。

## 附录一：参考文献

- 神策官方，App SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_app_preset_properties/v0300>
- 神策官方，iOS 快速使用：<https://www.sensorsdata.cn/manual/fast_access_ios.html>
- 神策官方，全埋点（HarmonyOS）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_harmony_autotrack/v0300>
- 神策 SDK 全埋点白皮书，王灼洲《Android 全埋点解决方案》、任淏《iOS 全埋点解决方案》及相关博客转述：说明 Android `Application.ActivityLifecycleCallbacks.onActivityResumed`、iOS Method Swizzling + `viewDidAppear:` 的触发机制，以及热启动首个界面不触发 `$AppViewScreen` 的遗留问题。
- 神策官方，基础 API 介绍（iOS）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_ios_super/v0300>
- 神策官方，基础 API 介绍（Android）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_android_super/v0205>
- 已建立口径文档，`$AppStart.md`：提供 `$AppStart` 与页面浏览事件的边界说明。
- 已建立口径文档，`$AppStartPassively.md`：提供被动启动下页面误触发的边界说明。
- 已建立口径文档，`$AppEnd.md`：提供 App 级会话出口与页面事件的边界说明。

## 附录二：调查背景与过程记录

### 调查目标

原任务只讨论 `$AppViewScreen` 对应的实际业务场景、触发时机、语义边界和分析价值，不展开其他 event 的完整定义，也不替其他分析视角扩展业务侧加工或下游产品口径设计。

`$AppStart.md`、`$AppStartPassively.md`、`$AppEnd.md` 已形成 App 启动和退出的口径。原任务在此基础上澄清页面浏览入口 `$AppViewScreen`，使其与 `$AppPageLeave` 的页面级起止关系、以及与 App 级 `$AppStart` / `$AppEnd` 的粒度边界明确。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 待覆盖事件清单包含 `$AppStart`、`$AppStartPassively`、`$AppEnd`、`$AppViewScreen`、`$AppPageLeave` 等事件。
- 每个 event 至少需要分析实际场景、端类型、触发时机、与相近事件差异，以及分析价值。
- `Index.md` 本身没有对 `$AppViewScreen` 给出额外语义说明，仅将其列入事件清单。

### 来源区分与推导过程

事件定义、端类型、触发时机、预置属性、版本要求、Fragment 默认行为和 HarmonyOS 属性差异来自神策官方公开文档。

页面路径、漏斗、PV、DAU、留存的指标依赖关系，以及热启动首个页面缺失的影响判断，是基于属性语义和 SDK 实现形成的推导，不属于神策官方直接定义。

### 原约束回写记录

原调查报告建议向 `Index.md` 或上游可信输入补充以下约束：

- `$AppViewScreen` 在 iOS、Android、HarmonyOS 三端均存在；
- 核心属性包括 `$screen_name`、`$title`、`$url`、`$referrer`；
- `$url`、`$referrer` 自 Android 3.2.8、iOS 1.11.5 起自动采集；
- Android Fragment 默认不触发，需要单独开启；
- HarmonyOS 不采集 `$title`、`$url`、`$referrer`；
- `$AppViewScreen` 与 `$AppPageLeave` 是页面级起止事件，但后者有版本和端支持限制。

原调查报告建议向 `$AppStart.md` 补充页面属性、`$screen_name` 取值和页面时长来自 `$AppPageLeave` 的说明。

原调查报告建议向 `$AppEnd.md` 补充 `$AppEnd` 不影响已上报的 `$AppViewScreen`，且两者时间差不构成会话时长。

原调查报告建议向 `$AppStartPassively.md` 补充热启动首个页面不触发，以及被动启动误触发页面浏览需要识别的约束。

### 原任务完成状态

- 已基于神策官方文档说明 `$AppViewScreen` 的事件定义、端类型、预置属性和触发时机。
- 已明确与 `$AppPageLeave`、`$AppStart` / `$AppEnd`、`$AppStartPassively`、`AppCrashed`、`$AppClick` 的边界。
- 已保留 `$url` / `$referrer` 版本要求、Android Fragment 默认不触发、HarmonyOS 属性缺失等细节。
- 已给出页面浏览次数、页面路径、漏斗、页面浏览时长等指标的推导判断。
- 已记录需要回写到 `Index.md`、`$AppStart.md`、`$AppStartPassively.md`、`$AppEnd.md` 的关键约束。
- 已标注神策官网未直接给出的指标口径和生产数据未验证等来源限制。
