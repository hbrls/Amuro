# `$AppClick` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 15:22:18

## 1. 事件概览

`$AppClick` 是神策 App 端全埋点预置的 **App 元素点击**事件，用于描述用户点击页面内控件的行为。iOS、Android、HarmonyOS 均支持该事件，跨端语义一致，但控件模型、采集实现和自动采集范围不同。

### 端侧触发口径

**iOS：**控件进入标准点击响应链路时触发。SDK 通过 Method Swizzling 拦截 `UIControl.sendAction:to:forEvent:`、`UITableView` / `UICollectionView` 的 `didSelectRowAtIndexPath:` 代理方法，以及 `UIGestureRecognizer` 的相关响应方法。

**Android：**标准点击回调执行时触发。SDK 对 `View.OnClickListener.onClick`、`AdapterView.OnItemClickListener`、CheckBox、RadioGroup 等回调做 ASM 字节码插桩或运行时 Hook。

**HarmonyOS：**支持 `$AppClick`。具体触发实现和元素级属性覆盖范围以神策 HarmonyOS 全埋点文档及项目 SDK 版本为准，现有公开资料未在当前口径中展开细节。

未走标准点击响应链路的自定义控件、纯绘制点击区域或自行处理 `onTouchEvent` 的控件可能不会自动采集，需要手动埋点或额外配置。

## 2. 关键属性

| 属性名 | 类型 | 默认显示名 | 属性值说明 | 备注 |
| --- | --- | --- | --- | --- |
| `$screen_name` | 字符串 | 页面名称 | Android 为 Activity 包名.类名；iOS 为 ViewController 类名 | 与页面级事件同口径，可手动覆盖 |
| `$title` | 字符串 | 页面标题 | Android 为 Activity 标题；iOS 为 ViewController 标题 | 与页面级事件同口径 |
| `$element_id` | 字符串 | 元素 ID | Android 取 `android:id` 资源名；iOS 需通过 `sensorsAnalyticsViewID` 手动设置 | 用于稳定标识控件 |
| `$element_type` | 字符串 | 元素类型 | 控件类名，如 Android `Button`、iOS `UIButton` | 元素级属性 |
| `$element_content` | 字符串 | 元素内容 | 按钮文字、标签文字等可提取文本 | 无文本控件可能为空 |
| `$element_selector` | 字符串 | 元素选择器 | 控件在视图层级中的 viewPath | 点击图和元素路径分析核心字段 |
| `$element_position` | 字符串 | 元素位置 | 列表控件中被点击项的位置，如 `group:child` 或 `position` | 仅列表类控件有值 |

`$AppClick` 是 App 页面 / 点击事件组中唯一携带完整元素级属性的事件。`$AppViewScreen` 和 `$AppPageLeave` 只提供页面身份，不提供 `$element_*` 属性。

`$screen_name`、`$title` 用于把点击归属到具体页面。业务未手动覆盖时，`$AppClick.$screen_name` 应与对应页面的 `$AppViewScreen.$screen_name` 一致。

`$AppClick` 不携带 `$event_duration`。点击是瞬时行为；App 会话时长来自 `$AppEnd`，页面浏览时长来自 `$AppPageLeave`。

## 3. 神策口径下的场景解释

### 场景一：点击普通按钮

**iOS：**用户在 `ProductDetailViewController` 点击“加入购物车”按钮。UIButton 执行 `sendAction:to:forEvent:` 时，SDK 上报 `$AppClick`，记录 `$screen_name = ProductDetailViewController`、`$element_type = UIButton`、`$element_content = 加入购物车` 和控件视图路径。

例子：一次商品详情页浏览中，事件流可能包含 1 次 `$AppViewScreen`、多次 `$AppClick` 和 1 次 `$AppPageLeave`。

**Android：**用户点击普通 Button 或 TextView，标准 `OnClickListener` 回调执行时触发 `$AppClick`，SDK 可自动读取控件类型、`android:id`、文本和 viewPath。

### 场景二：点击列表项

**Android：**用户在 `com.example.shop.CategoryActivity` 点击 RecyclerView 中第 3 个商品。列表项点击回调触发 `$AppClick`，记录页面名称、元素类型和 `$element_position`，例如从 0 开始的 `2`。

**iOS：**用户点击 UITableView 或 UICollectionView 的某个单元格，SDK 拦截 `didSelectRowAtIndexPath:`，并记录对应的元素位置。

`$element_position` 可用于分析列表首屏与滚动后、不同坑位之间的点击分布。

### 场景三：点击无文本控件

用户点击纯图标按钮时，`$AppClick` 仍可触发，但 `$element_content` 可能为空，需要依赖 `$element_id` 或 `$element_selector` 识别控件。

**iOS：**`$element_id` 默认不会自动生成，需要业务通过 `sensorsAnalyticsViewID` 设置；未设置时只能依赖 selector 或内容识别，长期聚合稳定性较弱。

**Android：**若控件设置了 `android:id`，SDK 可自动读取资源名作为 `$element_id`。

### 场景四：自定义控件未走标准点击回调

**Android：**自定义 View 在 `onTouchEvent` 中自行处理点击，未走标准 `OnClickListener` 时，可能不会自动产生 `$AppClick`。

**iOS：**自定义手势或纯绘制可点击区域未进入 SDK 拦截的标准响应链路时，可能不会自动产生 `$AppClick`。

此类情况会形成“页面上有点击行为，但全埋点中缺失 `$AppClick`”的漏采，需要手动埋点或额外配置补齐。

### 场景五：崩溃前的最后一次点击

用户点击控件后 App 崩溃。如果点击回调和 SDK 上报已经完成，则 `$AppClick` 已落库，崩溃不会回滚该事件；如果崩溃发生在点击事件上报之前，则最后一次 `$AppClick` 可能丢失。

是否存在崩溃前最后一次点击，需要结合 `AppCrashed`、事件时序和实际发送机制验证，不能默认一定有记录。

## 4. 与相近事件的边界

### 与 `$AppViewScreen`

`$AppViewScreen` 是页面级会话入口，`$AppClick` 是页面内元素级交互。

一次 `$AppViewScreen` 后、对应 `$AppPageLeave` 前，可能出现零到多次 `$AppClick`。用户可能进入页面后不点击，也可能连续点击多个控件。

| 维度 | `$AppViewScreen` | `$AppClick` |
| --- | --- | --- |
| 事件粒度 | 页面级 | 元素级 |
| 触发时机 | 页面进入前台可见 | 控件被点击 |
| 页面内频次 | 通常每次进入一次 | 同一页面可触发多次 |
| 核心属性 | `$screen_name`、`$title`、`$url`、`$referrer` | 页面身份属性及 `$element_*` 元素属性 |

两者可以构造“页面浏览 → 页面内点击”的漏斗，但页面归属依赖 `$screen_name` 未被不一致地手动覆盖。

### 与 `$AppPageLeave`

`$AppPageLeave` 是页面级会话出口并携带 `$event_duration`；`$AppClick` 是页面可见期间的瞬时交互，不携带时长。

同一页面的 `$AppPageLeave.$event_duration` 与页面内 `$AppClick` 序列结合，可以分析“停留多久、期间点了什么”，例如停留久但零点击或停留短但多点击。该用途属于基于字段语义的推导。

### 与 `$AppStart`、`$AppEnd`

`$AppStart`、`$AppEnd` 是 App 级会话起止；`$AppViewScreen`、`$AppPageLeave` 是页面级起止；`$AppClick` 是元素级交互。

一次 App 会话可以跨多个页面，每个页面可产生多次 `$AppClick`。`$AppClick` 不参与 App 会话切分，会话时长以 `$AppEnd.$event_duration` 为准。

### 与 `AppCrashed`

`AppCrashed` 表示 App 崩溃；`$AppClick` 表示用户点击控件。

若点击事件已上报，崩溃不会回滚；若点击直接触发崩溃且上报尚未完成，该次点击可能丢失。崩溃前最后一次 `$AppClick` 是定位触发操作的重要线索，可与 `app_crashed_reason`、最近页面和会话时序关联，但是否存在必须用数据验证。

### 与 `$AppStartPassively`

`$AppStartPassively` 触发时 App 在后台运行，用户不可见且没有正常交互。

**iOS：**被动启动后台会话内不应出现用户 `$AppClick`。如果出现，可能来自后台代码模拟点击或埋点误调用，应作为异常模式识别。

## 5. 核验结论与适用边界

### 当前结论

`$AppClick` 是 App 页面内元素级交互事件，核心价值在于回答“用户在哪个页面点击了哪个控件”。它覆盖广但业务语义依赖元素身份字段的完整性和稳定性。

### 指标处理口径

神策官方没有直接定义 `$AppClick` 在各项产品指标中的处理方式。以下口径基于事件和属性语义推导：

| 指标 | 是否依赖 `$AppClick` | 理由 |
| --- | --- | --- |
| 元素点击次数（PV） | 强依赖 | 直接按事件或元素身份聚合 |
| 点击用户数（UV） | 强依赖 | 按满足元素条件的用户去重计算 |
| 页面内 / 跨页面漏斗 | 强依赖 | 关键步骤可由控件点击条件定义 |
| 页面内交互路径 | 强依赖 `$element_selector`、`$element_position` | 可按时序还原点击顺序和坑位偏好 |
| 点击图 / 热力分析 | 强依赖 `$element_selector` | selector 用于定位控件 |
| 点击率（CTR） | 强依赖并需配合曝光 / PV | 点击数需要对应曝光或页面浏览作为分母 |
| DAU / 留存 | 不直接依赖 | 不需要元素点击事件定义活跃或首次访问 |
| 会话时长 / 页面浏览时长 | 不依赖 | 时长来自 `$AppEnd` / `$AppPageLeave` |

元素点击次数与点击用户数需要区分：前者直接计数，后者按用户去重，二者均需与项目指标定义对齐。

### 使用限制

- 漏斗转化和点击率依赖曝光 / PV 口径。神策 `$AppClick` 文档没有定义曝光，可能需要 `$AppElementView` 或业务自定义曝光事件。
- `$element_selector` 对视图层级变化敏感。页面改版、组件升级或列表结构调整会导致 selector 漂移，跨版本分析需要版本对齐。
- iOS `$element_id` 需业务手动设置。未设置时，依赖 selector 或内容聚合的稳定性较弱。
- `$element_content` 可能因多语言、动态文本或无文本控件而变化或为空。

### 待核验事项

- CLKLOG / CDP 是否实际采集 `$AppClick`，以及三端覆盖范围。
- iOS 是否普遍设置 `sensorsAnalyticsViewID`，`$element_id` 完整度如何。
- HarmonyOS 端具体采集哪些元素级属性。
- 自定义控件、手势和 `onTouchEvent` 场景是否存在漏采。
- `$screen_name` 是否与 `$AppViewScreen` 保持一致，是否被业务手动覆盖。
- `$element_selector` 是否存在跨版本漂移，是否有版本对齐策略。
- 崩溃前最后一次 `$AppClick` 是否可靠上报。
- 曝光事件或曝光属性的来源，以及点击率分母口径。

### 关键假设与适用限制

- 当前口径以神策公开 App SDK 文档为基准；如果 CLKLOG / CDP 对事件做过二次封装，应以项目内实现为准。
- 神策官网没有直接定义点击次数、漏斗、点击率和页面内路径等产品指标；本文的指标依赖关系属于语义推导。
- 神策官网没有保证 `$element_selector` 在页面改版后稳定。
- 神策官网没有定义曝光口径，CTR 和曝光后点击分析需要额外数据源。
- 神策官网没有明确崩溃前最后一次 `$AppClick` 是否补发或丢失。
- HarmonyOS 元素级属性采集范围未在当前资料中展开。
- 当前尚未验证生产数据中的事件存在性、字段完整性、iOS 元素 ID 设置和自定义控件漏采情况。

## 附录一：参考文献

- 神策官方，App SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_app_preset_properties/v0300>
- 神策官方，iOS 快速使用：<https://www.sensorsdata.cn/manual/fast_access_ios.html>
- 神策官方，基础 API 介绍（iOS）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_ios_super/v0300>
- 神策官方，基础 API 介绍（Android）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_android_super/v0205>
- 神策官方，全埋点（HarmonyOS）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_harmony_autotrack/v0300>
- 神策 SDK 全埋点白皮书，王灼洲《Android 全埋点解决方案》、任淏《iOS 全埋点解决方案》及相关博客转述：说明 Android 点击回调 ASM 插桩 / Hook 与 iOS Method Swizzling 的采集机制。
- 神策官方，点击图（HeatMap）：<https://www.sensorsdata.cn/manual/js_sdk_heatmap.html>
- 已建立口径文档，`$AppStart.md`：提供 App 级启动与点击事件的粒度边界。
- 已建立口径文档，`$AppStartPassively.md`：提供后台被动启动与用户交互的边界。
- 已建立口径文档，`$AppEnd.md`：提供 App 会话时长和崩溃边界。
- 已建立口径文档，`$AppViewScreen.md`：提供页面浏览与元素点击的边界。
- 已建立口径文档，`$AppPageLeave.md`：提供页面离开、页面时长与元素点击的边界。

## 附录二：调查背景与过程记录

### 调查目标

原任务只讨论 `$AppClick` 对应的实际业务场景、触发时机、语义边界和分析价值，不展开其他 event 的完整定义，也不扩展业务侧加工或下游产品口径设计。

`$AppStart.md`、`$AppStartPassively.md`、`$AppEnd.md`、`$AppViewScreen.md`、`$AppPageLeave.md` 已形成 App 生命周期和页面起止口径。原任务在此基础上补充页面内元素点击 `$AppClick`，明确元素级与页面级、App 级事件的粒度关系及崩溃链路边界。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 待覆盖事件清单包含 `$AppStart`、`$AppStartPassively`、`$AppEnd`、`$AppViewScreen`、`$AppPageLeave`、`$AppClick` 等事件。
- 每个 event 至少需要分析实际场景、端类型、触发时机、与相近事件差异，以及分析价值。
- `Index.md` 本身没有对 `$AppClick` 给出额外语义说明，仅将其列入事件清单。

### 来源区分与推导过程

事件定义、端类型、触发时机、预置属性和逐端采集机制来自神策官方文档及神策 SDK 全埋点白皮书。

点击次数、漏斗、页面内路径、点击图、CTR、PV / UV 区分及页面停留质量判断，是基于元素属性和事件粒度形成的推导，不属于神策官方直接定义。

### 原约束回写记录

原调查报告建议向 `Index.md` 或上游可信输入补充以下约束：

- `$AppClick` 在 iOS、Android、HarmonyOS 三端均存在；
- 它是 App 页面 / 点击事件组中唯一携带完整元素级属性的事件；
- 它不携带 `$event_duration`；
- iOS `$element_id` 需要手动设置，Android 可自动读取 `android:id`；
- 未走标准点击回调的自定义控件可能需要手动埋点。

原调查报告建议向 `$AppStart.md` 补充 `$AppClick` 才是页面内元素点击事件，与 App 级启动不可互相替代。

原调查报告建议向 `$AppViewScreen.md` 补充元素属性、页面到点击漏斗，以及 `$screen_name` 一致性依赖未被手动覆盖。

原调查报告建议向 `$AppPageLeave.md` 补充页面停留时长与点击序列结合的推导用途，以及崩溃链路中页面离开和最后点击都需验证。

### 原任务完成状态

- 已基于神策官方文档说明 `$AppClick` 的事件定义、端类型、预置属性和逐端采集机制。
- 已给出普通按钮、列表项、无文本控件、自定义控件漏采和崩溃前点击等典型场景。
- 已明确与 `$AppViewScreen`、`$AppPageLeave`、`$AppStart` / `$AppEnd`、`AppCrashed`、`$AppStartPassively` 的边界。
- 已给出点击次数、漏斗、交互路径、点击图、CTR 等指标的推导，并保留曝光、selector、元素 ID 等限制。
- 已记录需要回写到 `Index.md`、`$AppStart.md`、`$AppViewScreen.md`、`$AppPageLeave.md` 的关键约束。
- 已标注曝光口径、iOS 元素 ID、selector 稳定性、崩溃路径、HarmonyOS 差异、自定义控件漏采和生产数据未验证等来源限制。
