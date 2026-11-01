# `$AppPageLeave` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 15:03:46

## 1. 事件概览

`$AppPageLeave` 是神策预置的 **页面离开**事件，用于描述 App 页面离开前台可见状态，并记录本次页面浏览时长。该事件与 `$AppViewScreen` 分别构成页面级会话的出口和入口。

### 端侧触发口径

**iOS：**iOS SDK v3.1.5+ 支持。页面离开并变为不可见时触发。神策 iOS 全埋点白皮书说明，SDK 通过 Method Swizzling 交换 `UIViewController.viewDidDisappear:`，以 `viewDidAppear:` 到 `viewDidDisappear:` 的时间计算页面浏览时长。

**Android：**Android SDK v5.4.2+ 支持。Activity 进入不可见或暂停状态时触发。神策 Android 全埋点白皮书说明，SDK 通过 `Application.ActivityLifecycleCallbacks.onActivityPaused` 上报事件。

**HarmonyOS：**神策官网明确标注暂不支持 `$AppPageLeave`。HarmonyOS 端只有 `$AppViewScreen` 页面入口，没有对应的页面离开出口，无法按该预置事件直接获取页面浏览时长。

如果项目使用早期 SDK，即 Android 低于 v5.4.2 或 iOS 低于 v3.1.5，`$AppPageLeave` 不会出现。

## 2. 关键属性

| 属性名 | 类型 | 默认显示名 | 属性值说明 | 备注 |
| --- | --- | --- | --- | --- |
| `$event_duration` | 数值 | 事件时长 | 页面离开不可见时计算的本次页面浏览时长 | 核心字段，单位为秒 |
| `$screen_name` | 字符串 | 页面名称 | Android 为 Activity 包名.类名；iOS 为 ViewController 类名；可手动设置 | 与 `$AppViewScreen` 同口径 |
| `$title` | 字符串 | 页面标题 | Android 为 Activity 标题；iOS 为 ViewController 标题 | HarmonyOS 不支持该事件 |
| `$url` | 字符串 | 页面地址 | Android 3.2.8+、iOS 1.11.5+ 自动采集 | 与 `$AppViewScreen` 同版本起点 |
| `$referrer` | 字符串 | 前向地址 | Android 3.2.8+、iOS 1.11.5+ 自动采集 | 与 `$AppViewScreen` 同版本起点 |

神策对 `$event_duration` 的原始说明是：“在页面离开不可见时触发页面离开事件，并计算浏览时长，此处特指页面浏览的时长。”该字段是页面浏览时长的核心数据源。

`$screen_name`、`$title`、`$url`、`$referrer` 与 `$AppViewScreen` 的同名属性取值口径一致，便于按页面身份关联进入和离开事件。

与 `$AppViewScreen` 相比，`$AppPageLeave` 多出 `$event_duration`；它不携带 `$referrer_title` 或 `$element_*` 等元素级属性，元素级属性集中在 `$AppClick`。

神策文档没有明确标注 `$AppPageLeave.$event_duration` 支持属性插件化修改。若实际值异常，应优先核对 SDK 版本和实现，不应直接假设可被业务覆盖。这一点与 `$AppEnd.$event_duration` 不同。

## 3. 神策口径下的场景解释

### 场景一：push 到新页面

**iOS：**用户在首页点击商品卡片，通过 UINavigationController push 到 `ProductDetailViewController`。旧页面 `HomeViewController` 执行 `viewDidDisappear:` 时触发 `$AppPageLeave`，记录 `$screen_name = HomeViewController` 和首页本次浏览的 `$event_duration`。新页面执行 `viewDidAppear:` 时触发 `$AppViewScreen`。

例子：从首页进入详情页时，首页的 `$AppPageLeave` 与详情页的 `$AppViewScreen` 时间戳通常紧邻，push 动画过渡约为 0.3～0.5 秒。

### 场景二：pop 返回上一页

**iOS：**用户从商品详情页返回首页。详情页执行 `viewDidDisappear:`，触发 `$AppPageLeave` 并记录详情页浏览时长；首页重新执行 `viewDidAppear:`，再次触发 `$AppViewScreen`。

返回首页时不会因为首页之前已经展示过而跳过 `$AppViewScreen`。这与 App 从后台恢复到原页面时可能不重复触发 `$AppViewScreen` 的情况不同。

### 场景三：按 Home 键切到后台

**Android：**用户浏览订单详情页时按 Home 键退到桌面。Activity 执行 `onPause`，立即触发 `$AppPageLeave`，记录当前页面的 `$screen_name` 和可见时长。

`$event_duration` 不包含切到后台后的挂起时间。Android App 级 `$AppEnd` 需要等待 30 秒才触发，因此页面级 `$AppPageLeave` 与 App 级 `$AppEnd` 的时间轴存在约 30 秒错位。

**iOS：**App 切到后台导致当前 ViewController 执行 `viewDidDisappear:` 时，同样触发 `$AppPageLeave`，页面浏览时长不包含后台挂起时间。

### 场景四：App 崩溃前的最后一个页面

**Android：**App 在产品页发生崩溃。最后浏览的页面已经触发 `$AppViewScreen`，但崩溃路径不保证执行正常 `onPause`，因此可能没有对应的 `$AppPageLeave`。

神策官网没有明确说明崩溃路径是否补发 `$AppPageLeave`。按 Activity 生命周期语义推断，依赖 `onPause` 的页面离开事件不会补发，因此页面浏览时长会缺失最后一段。该结论需要用生产数据验证。

## 4. 与相近事件的边界

### 与 `$AppViewScreen`

`$AppViewScreen` 描述页面进入，`$AppPageLeave` 描述页面离开并携带浏览时长。两者是独立事件，神策 SDK 不强制一一配对，下游可按 `$screen_name`、事件顺序和时间窗口关联。

| 维度 | `$AppViewScreen` | `$AppPageLeave` |
| --- | --- | --- |
| 触发主体 | 页面进入前台可见 | 页面离开并变为不可见 |
| 端支持 | iOS / Android / HarmonyOS | Android v5.4.2+、iOS v3.1.5+；HarmonyOS 不支持 |
| 是否带浏览时长 | 否 | 是，`$event_duration` |
| 触发回调 | iOS `viewDidAppear:`、Android `onActivityResumed` | iOS `viewDidDisappear:`、Android `onActivityPaused` |
| 是否强制成对 | 否 | 否，但语义上对应之前的页面进入 |

`$AppPageLeave` 不带元素级属性；页面内控件交互应使用 `$AppClick`。

### 与 `$AppStart`、`$AppEnd`

`$AppStart`、`$AppEnd` 是 App 级会话入口和出口；`$AppPageLeave` 是单次页面浏览的出口，粒度不同。

一次 `$AppEnd` 之前可能已经产生多条 `$AppPageLeave`。最后一条 `$AppPageLeave` 通常对应最近一次 `$AppViewScreen`，但不能替代 `$AppEnd`。

**iOS：**页面切到不可见后触发 `$AppPageLeave`，App 进入后台时 `$AppEnd` 也立即触发，两者时间接近但语义不同。

**Android：**页面 `onPause` 后立即触发 `$AppPageLeave`，而 `$AppEnd` 在 App 退到后台 30 秒后触发，因此 `$AppEnd` 时间戳明显晚于最后一次页面离开。

`$AppEnd` 触发不会使已经上报的 `$AppPageLeave` 失效，也不会额外产生页面离开事件。

### 与 `$AppStartPassively`

`$AppStartPassively` 是 iOS-only 的系统后台拉活事件。App 在后台运行时，正常情况下不会产生 `$AppPageLeave`，因为页面没有进入前台可见状态后再离开。

**iOS：**如果后台任务异常触发页面跳转，使页面先进入前台可见再离开，可能同时产生 `$AppViewScreen` 和 `$AppPageLeave`。该链路属于需要识别的异常模式或脏数据。

### 与 `AppCrashed`

`AppCrashed` 表示 App 崩溃；`$AppPageLeave` 表示正常页面生命周期中的离开。

崩溃路径上，最后一次 `$AppViewScreen` 可能存在，但对应 `$AppPageLeave` 可能缺失。不能把缺失的页面离开事件解释为浏览时长为 0，应将其标记为异常断尾，并结合 `AppCrashed.app_crashed_reason` 分析。

### 与 `$AppClick`

`$AppClick` 是元素级点击事件，`$AppPageLeave` 是页面级离开事件。

`$AppClick` 在同一页面内可多次触发；`$AppPageLeave` 通常在一次页面离开时触发一次。业务未手动覆盖时，两者的 `$screen_name` 应一致，可用于关联页面内交互与页面停留时长。

## 5. 核验结论与适用边界

### 当前结论

`$AppPageLeave` 是 App 页面级会话出口，核心字段 `$event_duration` 表示本次页面浏览时长。其可用性受 SDK 版本和端支持限制；HarmonyOS 当前没有该预置事件。

### 指标处理口径

神策官方没有直接定义 `$AppPageLeave` 在各项产品指标中的处理方式。以下口径基于事件和属性语义推导：

| 指标 | 是否依赖 `$AppPageLeave` | 理由 |
| --- | --- | --- |
| 页面浏览时长 | 强依赖 `$event_duration` | 默认语义是本次页面浏览时长 |
| 页面浏览次数（PV） | 一般不直接依赖 | PV 基于 `$AppViewScreen` 计数 |
| 页面路径分析 | 弱依赖 `$referrer` | `$AppViewScreen` 也有相同字段 |
| 漏斗分析 | 一般不直接依赖 | 页面漏斗通常基于 `$AppViewScreen.$screen_name` 序列 |
| DAU | 不直接依赖 | DAU 按是否有事件触发计算 |
| 留存分析 | 不直接依赖 | 留存按首次事件时间计算 |
| 异常分析 | 应保留 | 可识别崩溃断尾、页面离开回调缺失等问题 |

“页面浏览时长强依赖”是基于 `$event_duration` 的语义推导。若项目使用神策页面分析模块，需要核对产品侧时长定义是否与该字段一致，不能把本文推导表述为神策官方产品指标定义。

### 页面浏览时长取数路径

页面浏览时长可能有以下取数方式，使用时必须明确选择的口径：

- **路径 A：**`$AppPageLeave.$event_duration`，从本次 `$AppViewScreen` 到 `$AppPageLeave`，是最直接的页面浏览时长。
- **路径 B：**使用 `$AppEnd.$event_duration` 与当前页面进入时间估算 App 会话结束前最后一个页面的时长；适用于最后一页缺少 `$AppPageLeave` 的近似补偿。
- **路径 C：**使用当前 `$AppViewScreen` 与下一次 `$AppViewScreen` 的时间差估算页面跳转场景的浏览时长。
- **路径 D：**使用神策分析后台“页面分析”模块，其结果可能包含产品侧加工。

路径 B、C 属于近似估算，在多页面切换、后台恢复和崩溃场景中误差较大。本文不替业务选择单一指标口径。

### 待核验事项

- CLKLOG / CDP 是否实际采集 `$AppPageLeave`。
- 项目 SDK 是否满足 Android v5.4.2+、iOS v3.1.5+。
- Android Fragment 是否触发 `$AppPageLeave`，是否启用相关采集。
- `$screen_name`、`$title` 是否被业务手动覆盖，页面进入与离开能否稳定关联。
- `$event_duration` 是否符合神策默认页面浏览时长口径，是否存在未公开的二次加工。
- 崩溃路径是否存在 `$AppViewScreen` 有记录、`$AppPageLeave` 缺失的断尾数据。
- HarmonyOS 后续 SDK 是否已新增 `$AppPageLeave` 支持。

### 关键假设与适用限制

- 当前口径以神策公开 App SDK 文档为基准；如果 CLKLOG / CDP 对事件做过二次封装，应以项目内实现为准。
- 神策官网没有直接定义页面浏览时长、PV / UV、路径和漏斗等产品指标；本文的指标依赖关系属于语义推导。
- 神策官网没有明确说明崩溃路径是否补发 `$AppPageLeave`；本文按生命周期语义推断为不补发，需用数据验证。
- 神策官网没有单独说明 Android Fragment 是否触发 `$AppPageLeave`。
- HarmonyOS “暂不支持”是当前文档快照，未来版本可能变化。
- 神策官网没有明确说明 `$AppPageLeave.$event_duration` 是否支持属性插件化修改。
- 当前尚未验证生产数据中的事件存在性、字段完整性和 SDK 版本。

## 附录一：参考文献

- 神策官方，App SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_app_preset_properties/v0300>
- 神策官方，iOS 快速使用：<https://www.sensorsdata.cn/manual/fast_access_ios.html>
- 神策官方，基础 API 介绍（iOS）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_ios_super/v0300>
- 神策官方，基础 API 介绍（Android）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_android_super/v0205>
- 神策官方，全埋点（HarmonyOS）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_harmony_autotrack/v0300>
- 神策 SDK 全埋点白皮书，任淏《iOS 全埋点解决方案》、王灼洲《Android 全埋点解决方案》及相关博客转述：说明 Android `Application.ActivityLifecycleCallbacks.onActivityPaused` 与 iOS Method Swizzling + `viewDidDisappear:` 的触发机制。
- 已建立口径文档，`$AppStart.md`：提供 App 级启动与页面级事件的边界说明。
- 已建立口径文档，`$AppStartPassively.md`：提供后台拉活下页面误触发的边界说明。
- 已建立口径文档，`$AppEnd.md`：提供 App 级退出与页面级离开的时间关系。
- 已建立口径文档，`$AppViewScreen.md`：提供页面级入口的字段口径及版本要求。

## 附录二：调查背景与过程记录

### 调查目标

原任务只讨论 `$AppPageLeave` 对应的实际业务场景、触发时机、语义边界和分析价值，不展开其他 event 的完整定义，也不扩展业务侧加工或下游产品口径设计。

`$AppStart.md`、`$AppStartPassively.md`、`$AppEnd.md`、`$AppViewScreen.md` 已形成 App 生命周期和页面入口口径。原任务在此基础上补充页面出口 `$AppPageLeave`，明确页面级起止关系、页面浏览时长和崩溃断尾边界。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 待覆盖事件清单包含 `$AppStart`、`$AppStartPassively`、`$AppEnd`、`$AppViewScreen`、`$AppPageLeave` 等事件。
- 每个 event 至少需要分析实际场景、端类型、触发时机、与相近事件差异，以及分析价值。
- `Index.md` 本身没有对 `$AppPageLeave` 给出额外语义说明，仅将其列入事件清单。

### 来源区分与推导过程

事件定义、端类型、SDK 版本、预置属性和 `$event_duration` 原始含义来自神策官方公开文档。

具体生命周期回调来自神策 SDK 全埋点白皮书。崩溃路径不补发、指标依赖关系、四条时长取数路径及其误差判断属于基于生命周期和字段语义的推导，不是神策官方直接定义。

### 原约束回写记录

原调查报告建议向 `Index.md` 或上游可信输入补充以下约束：

- `$AppPageLeave` 是页面级会话离开端点，核心字段为 `$event_duration`；
- 支持版本为 Android v5.4.2+、iOS v3.1.5+，HarmonyOS 暂不支持；
- 与 `$AppViewScreen` 构成页面级起止关系，但 SDK 不强制一一配对；
- 后续事件解释优先以神策公开文档为基准，再校验项目差异。

原调查报告建议向 `$AppStart.md` 补充页面级入口与出口并非同一事件，以及页面时长不包含后台挂起时间。

原调查报告建议向 `$AppEnd.md` 补充 Android 端最后一次 `$AppPageLeave` 与 `$AppEnd` 之间存在约 30 秒时间窗口，以及崩溃断尾的影响。

原调查报告建议向 `$AppViewScreen.md` 补充 `$AppPageLeave` 的属性、端支持版本和 HarmonyOS 无页面出口的限制。

### 原任务完成状态

- 已基于神策官方文档说明 `$AppPageLeave` 的事件定义、端支持版本、预置属性和触发时机。
- 已明确与 `$AppViewScreen`、`$AppStart` / `$AppEnd`、`$AppStartPassively`、`AppCrashed`、`$AppClick` 的边界。
- 已给出页面浏览时长、PV / UV、页面路径和漏斗等指标的依赖关系推导。
- 已保留 `$AppPageLeave.$event_duration`、`$AppEnd` 差值、`$AppViewScreen` 差值和神策页面分析模块四条取数路径。
- 已记录需要回写到 `Index.md`、`$AppStart.md`、`$AppEnd.md`、`$AppViewScreen.md` 的关键约束。
- 已标注崩溃路径、Fragment、HarmonyOS、属性插件化和 SDK 版本等来源限制。
