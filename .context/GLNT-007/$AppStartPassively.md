# `$AppStartPassively` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 14:34:54

## 1. 事件概览

`$AppStartPassively` 是神策预置的 **App 被动启动**事件，用于描述 iOS App 被系统拉活后在后台启动并运行的场景。它不是用户主动启动，也不表示 App 已进入前台。

### 端类型与触发条件

**iOS：**存在 `$AppStartPassively`。当通知、用户位置信息变化等系统条件唤醒 App，使程序在后台启动并运行时，SDK 触发该事件。

**Android：**没有 `$AppStartPassively`，不存在同名同语义事件。

**HarmonyOS：**没有 `$AppStartPassively`，不存在同名同语义事件。

神策官方对触发时机的概括是“iOS APP 被系统拉活”。该事件需要同时满足三个条件：

> 对于 iOS 设备，除了用户主动启动 App。设备中某些条件触发时（如收到通知、用户位置信息变化等），系统可能会唤醒 App，使程序在后台运行，当程序在后台启动并运行时，SDK 触发 `$AppStartPassively` 事件。

1. 不是用户主动启动；
2. 由通知、位置变化等 iOS 系统能力触发；
3. App 在后台启动并运行，不进入前台。

## 2. 关键属性

| 属性名 | 类型 | 默认显示名 | 端侧获取行为 |
| --- | --- | --- | --- |
| `$app_state` | 字符串 | App 状态 | iOS 端默认获取；Android 端不获取 |
| `$resume_from_background` | 布尔值 | 是否从后台唤醒 | iOS 端默认采集 |
| `$is_first_time` | 布尔值 | 是否首次 | 表示是否首次启动 App，含义与 `$AppStart` 一致 |

`$app_state` 是区分 `$AppStartPassively` 与 `$AppStart` 上下文状态的重要辅助属性。

`$resume_from_background` 在两个事件中都可能出现，但不能单独用于区分事件：在 `$AppStart` 上表示从后台恢复到前台；在 `$AppStartPassively` 上需要结合 `$app_state` 和事件名理解为系统后台拉活。

## 3. 神策口径下的场景解释

### 支持的 iOS Background Modes 场景

神策 SDK 全埋点白皮书将 `$AppStartPassively` 与 iOS Background Modes 对应。App 启用相应后台运行模式后，可能在以下条件下被系统拉起并触发 `$AppStartPassively`：

1. **Location updates**：地理位置变化触发应用启动，常见于出行、运动、外卖等需要持续或周期性获取位置的 App。
2. **Remote notifications（静默推送 / Silent Push）**：收到无界面提示的静默推送后，系统拉起 App 在后台处理消息，常见于新闻、社交和消息同步场景。
3. **Background fetch**：iOS 按自身算法周期性拉起 App 获取最新数据，时间间隔可能为数小时甚至数天。
4. **Background processing（iOS 13+）**：用于数据同步、清理等可延迟的耗时后台任务。
5. **Audio、AirPlay、Picture in Picture**：后台音频、AirPlay 或画中画期间，系统可能在音频中断恢复时拉起 App。
6. **Voice over IP**：网络电话应用在来电或通话建立时被拉起。
7. **External Accessory communication**：MFi 外设通过蓝牙或 Lightning 接头向 App 发送消息时触发启动。
8. **Uses Bluetooth LE accessories**：蓝牙 LE 设备向 App 发送消息时触发启动。
9. **Acts as a Bluetooth LE accessory**：iPhone 作为蓝牙外设被其他设备连接时触发启动。
10. **Newsstand downloads**：报刊杂志类应用在有新报刊可下载时触发启动。

神策白皮书强调，后台应用程序刷新是最常见的被动启动来源之一；Remote notifications、Background fetch 和 Background processing 是生产环境中最常见的三类触发源。

### 场景一：静默推送拉起

**iOS：**新闻类 App 注册 Remote notifications 后，服务器发送一条无 UI 提示、带 `content-available=1` 的静默推送。系统在合适时机唤醒 App，App 在后台处理完成后挂起，用户对此无感知。

按神策公开口径，此时触发 `$AppStartPassively`，不触发 `$AppStart`。由于 App 没有进入前台活跃状态，因此也不会立即触发 `$AppViewScreen`，除非业务在后台任务中主动调用相关埋点。

### 场景二：地理位置变化拉起

**iOS：**出行类 App 启用 Location updates 后，用户位置发生显著变化，系统向 App 发起后台启动请求，App 在后台执行定位逻辑或更新服务状态。

按神策公开口径，此时触发 `$AppStartPassively`。该事件不应解释为用户主动打开 App，也不应进入用户使用时长统计或普通启动次数统计。

### 场景三：Background fetch 周期性拉起

**iOS：**新闻类 App 启用 Background fetch 后，系统可能每隔数小时或更长时间拉起 App，让其预取最新内容，用户对此无感知。

按神策公开口径，此时触发 `$AppStartPassively`。这是神策白皮书特别强调的常见被动启动场景。

### 场景四：蓝牙 LE 外设拉起

**iOS：**健康管理 App 注册 Uses Bluetooth LE accessories 模式后，蓝牙心率带、血压计等外设发起连接或发送数据，系统拉起 App 在后台接收数据。

按神策公开口径，此时触发 `$AppStartPassively`，常见于健康、运动和 IoT 类 App。

### 场景五：后台音频或通话模式拉起

**iOS：**音乐类 App 在后台播放音频时，若发生来电、闹钟等音频中断后恢复，系统可能重新拉起 App 处理音频。Voice over IP 类 App 在收到来电或建立通话时也可能被系统拉起。

按神策公开口径，此时触发 `$AppStartPassively`。这些场景属于业务后台会话，与 `$AppStart` 进入前台的语义完全不同。

## 4. 与相近事件的边界

### 与 `$AppStart`

`$AppStart` 描述 App 进入前台活跃链路；`$AppStartPassively` 描述 App 在系统拉活下进入后台运行，但不进入前台。

| 维度 | `$AppStart` | `$AppStartPassively` |
| --- | --- | --- |
| 端类型 | iOS / Android / HarmonyOS | 仅 iOS |
| 触发主体 | 用户主动启动，或从后台切回前台 | 系统后台拉活 |
| App 状态 | 进入前台活跃状态 | 在后台运行，不进入前台 |
| 用户感知 | 用户可见 | 通常对用户透明、无感知 |
| 是否计入普通启动 | 是 | 否，神策将其作为独立事件分流 |
| `$app_state` | iOS 默认采集 | iOS 默认采集 |
| `$resume_from_background` | 标识是否从后台恢复到前台 | 需结合事件名和 `$app_state` 理解系统拉活背景 |
| `$is_first_time` | 采集 | 采集 |

关键差异是触发主体、App 所处状态和用户是否可见。下游分析不能仅凭 `$resume_from_background` 区分两者，必须结合事件名。

### 与 `$AppEnd`

`$AppEnd` 描述 App 退出或进入后台后的结束事件；`$AppStartPassively` 描述后台被动启动。

**iOS：**一次 `$AppStartPassively` 触发后，App 在后台运行。当 App 进入挂起或被系统终止时，会产生 `$AppEnd`。该 `$AppEnd` 表示后台会话结束，不是前台会话结束，也不应与后续用户主动打开 App 产生的 `$AppStart` 配对。

**Android：**`$AppEnd` 在 App 退到后台或关闭后等待 30 秒触发；Android 不存在 `$AppStartPassively`。

**HarmonyOS：**`$AppEnd` 在退出 App 时触发；HarmonyOS 不存在 `$AppStartPassively`。

### 与 `$AppViewScreen`

`$AppStartPassively` 触发时 App 处于后台，正常情况下不会立即触发 `$AppViewScreen`。

如果后台任务通过代码渲染或预加载页面，可能意外触发 `$AppViewScreen`。神策白皮书将其视为需要识别的异常模式，可能成为数据脏数据来源。

### 与 `$AppDeeplinkLaunch`

`$AppStartPassively` 是 iOS Background Modes 等系统能力触发的后台启动；`$AppDeeplinkLaunch` 是 DeepLink URL 触发的业务唤起，两者不应混用。

**iOS：**`$AppDeeplinkLaunch` 自 iOS SDK 2.1.2+ 支持；`$AppStartPassively` 由系统后台拉活触发。

**Android：**`$AppDeeplinkLaunch` 自 Android SDK 4.2.1+ 支持；Android 不存在 `$AppStartPassively`。

### 与 `AppCrashed`

`$AppStartPassively` 触发的后台任务如果发生崩溃，会产生 `AppCrashed`。这是相对少见的链路，异常分析需要单独标识崩溃是否来自被动启动的后台会话。

## 5. 核验结论与适用边界

### 当前结论

`$AppStartPassively` 是 iOS-only 的系统后台拉活事件，不是普通启动、前台恢复或用户主动行为。它的核心作用是将用户不可见的后台启动从 `$AppStart` 中分离，避免污染普通启动分析。

### 指标处理口径

神策官方没有直接定义 `$AppStartPassively` 在各项业务指标中的处理方式。以下口径基于“被动启动不构成用户主动行为”的事件语义推导：

| 指标 | 是否计入 `$AppStartPassively` | 理由 |
| --- | --- | --- |
| DAU | 不应计入 | 被动启动对用户不可见，不构成活跃语义 |
| 普通启动次数 | 不应计入 | 会污染启动次数统计 |
| 留存入口 | 不应计入 | 留存分析应基于用户主动行为 |
| 会话入口 | 不应计入 | 被动启动不形成用户主动会话 |
| 异常分析 | 应保留 | 可排查后台拉活链路异常、崩溃和 SDK 配置问题 |
| 后台任务触达分析 | 应保留 | 可评估静默推送、Background fetch、地理围栏等机制 |
| 系统能力分析（iOS） | 应保留 | 可分析 App 对 iOS Background Modes 的依赖和覆盖 |

上述“不应计入”属于推导判断，不能表述为神策官方指标定义。

### 会话切分影响

`$AppStartPassively` 不应参与 `$AppStart` 前台会话入口，也不应通过 `$AppEnd` 与普通 `$AppStart` 形成会话配对。后台拉活期间不应计入用户使用时长，启动次数、DAU 和留存入口也不应包含该事件。

后台拉活产生的 `$AppEnd` 不能简单归零，否则可能影响前台会话 `$event_duration` 的解释。会话切分时应将 `$AppStartPassively` 标识为后台会话入口。

### 待核验事项

- 当前 CLKLOG / CDP 体系是否实际采集 `$AppStartPassively`；在确认事件真实存在前，不能直接对启动数据执行排除处理。
- 当前项目是否完整保留 `$app_state`、`$resume_from_background` 和 `$is_first_time`。
- 当前项目的神策 SDK 版本、配置或二次封装是否改变了默认采集行为。
- `$AppStartPassively` 后产生的 `$AppEnd` 在当前数据中如何入库和参与 `$event_duration` 计算。
- 当前 `Index.md` 是否需要明确所有 event 枚举以神策公开预置事件为主要解释基准。

### 关键假设与适用限制

- 当前口径以神策公开 App SDK 文档为基准；如果 CLKLOG / CDP 对事件做过二次封装，应以项目内实现为准。
- 神策官网给出了端类型、触发时机和预置属性，但没有直接给出 DAU、启动、留存等指标口径；本文的指标处理建议属于语义推导。
- 神策白皮书对 Background Modes 的列举属于 SDK 参考；细化拉活原因时，应同时参考 Apple 官方 Background Execution Sequence 文档。
- 当前尚未验证生产数据中是否真实存在 `$AppStartPassively`，因此不能确认其数据完整性和实际覆盖范围。
- `$AppStartPassively` 必须与 `$AppStart` 分别处理，不能并入同一启动口径。

## 附录一：参考文献

- 神策官方，App SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_app_preset_properties/v0300>
- 神策官方，基础 API 介绍（iOS）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_ios_super/v0300>
- 神策 SDK 全埋点白皮书，任淏《iOS 全埋点解决方案》及相关博客转述：列出 Location updates、Remote notifications、Background fetch、Background processing、Audio / AirPlay / Picture in Picture、Voice over IP、External Accessory communication、Uses Bluetooth LE accessories、Acts as a Bluetooth LE accessory、Newsstand downloads 等被动启动场景。
- Apple，About the Background Execution Sequence：<https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background/about_the_background_execution_sequence>
- 已建立口径文档，`$AppStart.md`：提供 `$AppStart` 的事件定义和边界对照。

## 附录二：调查背景与过程记录

### 调查目标

原任务只讨论 `$AppStartPassively` 对应的实际业务场景、触发时机、语义边界和分析价值，不展开其他 event 的完整定义。

`$AppStart.md` 已对 `$AppStart` 做出基于神策官网口径的解释，并指出 `$AppStartPassively` 是其关键边界事件。原任务在此基础上单独澄清被动启动，使启动类事件组的口径可执行。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 待覆盖事件清单包含 `$AppStart`、`$AppStartPassively`、`$AppEnd`、`$AppViewScreen` 等事件。
- 每个 event 至少需要分析实际场景、端类型、触发时机、与相近事件差异，以及分析价值。
- `Index.md` 本身没有对 `$AppStartPassively` 给出额外语义说明，仅将其列入事件清单。

### 来源区分与推导过程

事件定义、端类型、触发时机和预置属性来自神策官方公开文档。具体 Background Modes 场景来自神策 SDK 全埋点白皮书及 Apple 后台执行文档。

DAU、普通启动次数、留存入口、会话入口的排除建议，以及异常分析、后台任务触达分析、系统能力分析的保留建议，是基于事件语义形成的推导判断，不属于神策官方直接定义。

### 原约束回写记录

原调查报告建议向 `Index.md` 或上游可信输入补充以下约束：

- event 枚举以神策公开预置事件为主要解释基准；
- `$AppStartPassively` 是 iOS-only 事件，Android 和 HarmonyOS 没有同名同语义事件；
- `$AppStartPassively` 与 `$AppStart` 必须分别处理；
- 后续事件解释应优先检索神策官网公开文档，再做项目内差异校验。

原调查报告建议向 `$AppStart.md` 补充以下约束：

- `$AppStartPassively` 包含 `$app_state`、`$resume_from_background`、`$is_first_time`，其中 `$app_state` 是 iOS 默认获取的关键辅助属性；
- 两个启动事件的差异不仅是用户主动与系统拉活，还包括进入前台活跃与进入后台运行；
- 启动分析必须排除 `$AppStartPassively`，否则会污染 DAU、启动次数、留存入口和会话入口。

### 原执行边界

- 后续事件解释任务保持“一轮一个 event”的节奏，不在该任务中扩展 `$AppEnd` 或其他 event 的完整定义。
- `$AppEnd` 与 App 会话切分的细化分析留给后续专门任务。
- 在确认 CLKLOG / CDP 实际采集 `$AppStartPassively` 之前，不直接对启动数据执行排除处理；先验证事件是否真实存在，再决定分析口径。

### 原任务完成状态

- 已基于神策官方文档说明 `$AppStartPassively` 的事件定义、端类型、预置属性和触发时机。
- 已明确它与 `$AppStart` 的差异，并补充 `$app_state` 和 Background Modes 场景。
- 已给出 DAU、启动、留存、会话入口排除，以及异常和系统能力分析保留的推导判断。
- 已记录需要回写到 `Index.md` 与 `$AppStart.md` 的关键约束。
- 已标注神策官网未直接给出的指标口径和生产数据未验证等来源限制。
