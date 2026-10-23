# `$AppEnd` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 14:46:11

## 1. 事件概览

`$AppEnd` 是神策 App 端全埋点预置的 **App 退出**事件，用于描述 App 退出、进入后台或满足端侧结束条件后的会话出口。iOS、Android、HarmonyOS 均有该事件，跨端语义一致，但触发时机不同。

### 端侧触发口径

**iOS：**退出 App 或 App 进入后台时立即触发，没有 30 秒 session 等待。用户按 Home 键、切换到其他 App、主动退出或 App 被系统后台化，都会触发 `$AppEnd`。

**Android：**App 退到后台或关闭后等待 30 秒触发。若用户在 30 秒内切回 App，则不触发 `$AppEnd`。该规则与 `$AppStart` 的 Android 30 秒 session 机制对称。

**HarmonyOS：**退出 App 时触发。神策公开口径没有把“进入后台”列为触发条件，因此其语义范围最窄。

## 2. 关键属性

| 属性名 | 类型 | 默认显示名 | 端侧获取行为 |
| --- | --- | --- | --- |
| `$event_duration` | 数值 | 事件时长 | 本次 App 启动到 App 退出的时长，单位为秒；三端均有 |
| `$screen_name` | 字符串 | 页面名称 | Activity 的包名.类名，仅 Android 端有 |
| `$title` | 字符串 | 页面标题 | Activity 的标题，仅 Android 端有 |

`$event_duration` 是 `$AppEnd` 唯一在三端都存在的事件级预置属性，也是 App 启动到退出时长的核心字段。

**iOS：**退出逻辑不需要跳转到某个页面即可判断是否退出，因此退出时采集不到 `$screen_name` 和 `$title`。iOS 端 `$AppStart` 同样不采集这两个对应属性，启动与退出的关联只能依赖 `$event_duration` 和时间戳，不能依赖页面名称。

**Android：**`$screen_name` 取 Activity 的包名.类名，`$title` 取 Activity 标题。

神策文档注明 `$AppStart`、`$AppEnd` 支持通过属性插件化修改属性，因此项目可能对 `$event_duration` 做二次加工，使用时需要核对实际值是否仍符合神策默认口径。

## 3. 神策口径下的场景解释

### 场景一：用户主动退出 App

**iOS：**用户使用 App 后按 Home 键退到主屏，或从最近任务列表上滑关闭 App，SDK 立即触发 `$AppEnd`，并记录从本次 `$AppStart` 到当前时刻的 `$event_duration`。

例子：用户在电商 App 浏览 3 分钟后按 Home 键。事件流中出现 1 次 `$AppStart` 和 1 次 `$AppEnd`。

### 场景二：切到其他 App 后返回

**iOS：**用户把当前 App 切到后台去查看其他 App 时，切到后台立即触发 `$AppEnd`；之后切回前台会触发新的 `$AppStart`。两者没有 30 秒等待，按 SDK 端语义形成一条被中断的短会话。

例子：用户进入 App 查看账单 5 秒，切到微信回复消息 30 秒，再切回 App。SDK 会记录 2 条 `$AppStart` 和 2 条 `$AppEnd`，两个 `$event_duration` 分别对应约 5 秒和后续会话的实际时长。

### 场景三：退到后台超过 30 秒后返回

**Android：**用户退到桌面后超过 30 秒才返回。SDK 在退到后台 30 秒后触发 `$AppEnd`；用户返回时触发新的 `$AppStart`。如果在 30 秒内返回，则不产生 `$AppEnd`。

例子：用户在支付 App 操作后退到桌面查看短信，30 秒后返回。会话结束发生在退到桌面后的第 30 秒，而不是退到桌面的瞬间。

### 场景四：主动关闭 App

**Android：**用户从最近任务列表上滑关闭 App，或在系统设置中强制停止。按神策公开口径，关闭 App 后同样等待 30 秒触发 `$AppEnd`；如果 30 秒内再次启动，则不触发 `$AppEnd`。

Android 对“关闭 App”和“退到后台”的触发口径不作区分，均遵循“等待 30 秒”规则。

### 场景五：退出 App

**HarmonyOS：**用户退出 App 时立即触发 `$AppEnd`。公开口径不包含“进入后台”这一条件。

如果项目使用的 HarmonyOS SDK 确实只在显式退出时触发，则其会话长度更接近实际使用时长，不包含后台停留时间。

### 场景六：系统被动拉活后的后台会话结束

**iOS：**App 被通知、位置变化等系统条件拉活后触发 `$AppStartPassively`，并在后台运行。后续 App 退出后台时仍会触发 `$AppEnd`，但这条事件表示后台会话结束，不是前台会话结束。

例子：出行类 App 因位置变化被系统拉活，在后台执行 10 秒后挂起。SDK 记录 1 条 `$AppStartPassively` 和 1 条 `$AppEnd`，其中 `$event_duration` 仅反映后台停留时长。

## 4. 与相近事件的边界

### 与 `$AppStart`

`$AppStart` 表示 App 启动或后台恢复到前台，是会话起点；`$AppEnd` 表示 App 退出或进入后台后的结束行为，是会话终点。

| 维度 | `$AppStart` | `$AppEnd` |
| --- | --- | --- |
| 触发主体 | 用户主动启动、从后台切回前台、新装首次启动 | 用户主动退出、系统后台化、关闭 App |
| 端差异 | iOS 立即；Android 30 秒 session；HarmonyOS 启动时触发 | iOS 立即；Android 等待 30 秒；HarmonyOS 仅退出时触发 |
| `$event_duration` | 无 | 有，表示启动到本次退出的时长 |
| `$is_first_time` | 默认采集首次启动标识 | 官网未单独列出；按通用预置属性推算可能附带所有事件共有的预置属性 |

**iOS：**`$AppEnd` 包含“进入后台”，切到其他 App 也会触发，因此可能产生短会话。

**Android：**30 秒规则意味着 `$AppEnd` 与对应 `$AppStart` 在时间上不一定紧邻，可能相差 30 秒。

被动启动产生的 `$AppStartPassively` 也可能伴随 `$AppEnd`，但这条 `$AppEnd` 不应与普通 `$AppStart` 配对。

### 与 `$AppStartPassively`

`$AppStartPassively` 表示 iOS App 被系统拉活后在后台运行；`$AppEnd` 表示该后台运行结束时的出口。

**iOS：**`$AppStartPassively` 之后通常会跟随一条 `$AppEnd`，但神策官网没有直接规定两者的配对约束。该 `$AppEnd` 表示后台会话结束，不是前台会话结束，也不应与 `$AppStart` 形成前台会话。

### 与 `$AppViewScreen`、`$AppPageLeave`

`$AppViewScreen` 是页面浏览入口，神策原文为“打开一个 Activity / ViewController 页面时触发”。`$AppPageLeave` 是页面离开事件，神策原文为“离开页面后，上报页面离开事件”，支持 Android SDK v5.4.2+ 和 iOS SDK v3.1.5+。

`$AppEnd` 是 App 级退出或后台化事件，粒度高于页面级的 `$AppViewScreen` 和 `$AppPageLeave`。App 级退出不意味着最后一次页面浏览事件就是会话结束标志，页面级事件不能替代 `$AppEnd`。

### 与 `AppCrashed`

`AppCrashed` 表示 App 崩溃，`$AppEnd` 表示退出或后台化，两者是不同事件。

如果 App 崩溃后系统清理进程，是否仍会触发 `$AppEnd`，神策公开文档没有给出统一保证。需要在生产数据中验证崩溃前后是否伴随 `$AppEnd`，不能把缺失 `$AppEnd` 的会话直接视为崩溃。

## 5. 核验结论与适用边界

### 当前结论

`$AppEnd` 是 App 级会话出口。核心字段 `$event_duration` 表示本次 App 启动到退出的时长，但三端的退出触发时机不同，不能忽略端差异直接统一切分会话。

### 会话切分口径

神策官网没有在 `$AppEnd` 文档中直接给出完整会话切分规则。从 `$event_duration` 的定义可以推断，SDK 的设计意图是让每次 `$AppStart` 与下一次 `$AppEnd` 形成会话，`$event_duration` 表示客户端计时。

**iOS：**`$AppEnd` 在进入后台时立即触发。如果业务要形成更稳定的会话口径，可进一步叠加 30 秒静默规则，即后台停留超过 30 秒才视为真正结束，而不是把每次进入后台都作为硬切割。该做法属于实操惯例推导，不是神策 `$AppEnd` 文档直接给出的规则。

**Android：**由于 30 秒等待，`$AppEnd` 不会在退到后台时立即上报。下游应以 `$AppEnd` 实际上报时间戳为准，不应自行用“最后活跃时间 + 30 秒”替代事件时间。

**HarmonyOS：**公开口径仅包含退出 App，端侧会话切分相对直接，但仍需核验 `$AppStart` 与 `$AppEnd` 是否一一对应。

**iOS 被动启动：**`$AppStartPassively` 后的 `$AppEnd` 应识别为后台会话出口，不应与普通 `$AppStart` 会话合并。

项目若通过属性插件化修改 `$event_duration`，应先核对实际值是否仍符合神策默认定义。

### 与 Session 分析的区别

神策分析后台提供 Session 分析模块，其会话切分基于事件流时间窗口，例如 30 秒静默；这与 `$AppStart` 到 `$AppEnd` 的事件配对规则不同。两者可以结合使用，但不能互相替代。

### 指标处理口径

神策官方没有直接定义 `$AppEnd` 在各项业务指标中的处理方式。以下口径基于事件和属性语义推导：

| 指标 | 是否依赖 `$AppEnd` | 理由 |
| --- | --- | --- |
| 会话时长 | 强依赖 `$event_duration` | 默认语义是启动到退出的时长 |
| DAU | 一般不直接依赖 | DAU 按是否有事件触发计算，不需要 `$AppEnd` 切分 |
| 启动次数 | 一般不直接依赖 | 启动次数基于 `$AppStart` 计数 |
| 留存分析 | 不直接依赖 | 留存按首次事件时间计算 |
| 异常分析 | 应保留 | 可对比正常退出与崩溃退出的分布 |

“会话时长强依赖 `$event_duration`”是基于字段语义的推导。若项目采用神策 Session 分析模块，会话切分不一定严格遵循 `$AppStart` 到 `$AppEnd` 配对，不能把该推导表述为神策官方产品口径。

### 待核验事项

- CLKLOG / CDP 是否实际采集 `$AppEnd`，以及 iOS、Android、HarmonyOS 的覆盖范围。
- 当前项目的神策 SDK 版本、配置或二次封装是否改变默认触发行为。
- `$event_duration` 是否被属性插件化二次加工，例如异常检测后的回填。
- iOS 端进入后台触发 `$AppEnd` 后，项目实际采用事件配对还是额外静默窗口进行会话切分。
- HarmonyOS 端 `$AppEnd` 是否仅覆盖显式退出，是否包含进入后台。
- 崩溃退出后是否伴随 `$AppEnd`。
- `$AppStartPassively` 后的 `$AppEnd` 如何入库并参与后台会话时长计算。

### 关键假设与适用限制

- 当前口径以神策公开 App SDK 文档为基准；如果 CLKLOG / CDP 对事件做过二次封装，应以项目内实现为准。
- 神策官网没有直接给出会话时长、DAU、留存等产品指标口径；本文的指标依赖关系属于语义推导。
- iOS 端叠加静默窗口的会话建议属于实操惯例推导，不是神策 `$AppEnd` 文档的直接定义。
- 神策官网没有明确说明崩溃退出后是否仍触发 `$AppEnd`。
- 神策官网没有明确说明 HarmonyOS 的 `$AppEnd` 是否包含进入后台；本文按“退出 App 触发”的字面含义理解为仅退出场景。
- 当前尚未验证生产数据中是否真实存在 `$AppEnd`，也未核实 `$event_duration` 是否被项目内属性插件修改。

## 附录一：参考文献

- 神策官方，App SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_app_preset_properties/v0300>
- 神策官方，iOS 快速使用：<https://www.sensorsdata.cn/manual/fast_access_ios.html>
- 神策官方，基础 API 介绍（Android）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_android_super/v0205>
- 神策官方，HarmonyOS SDK：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_harmony/v0205>
- 神策官方，Session 分析：<https://manual.sensorsdata.cn/sa/docs/guide_analytics_session/v0300>
- 已建立口径文档，`$AppStart.md`：提供 `$AppStart` 及 Android 30 秒 session 规则的边界说明。
- 已建立口径文档，`$AppStartPassively.md`：提供 `$AppStartPassively` 与后台会话的边界说明。

## 附录二：调查背景与过程记录

### 调查目标

原任务只讨论 `$AppEnd` 对应的实际业务场景、触发时机、语义边界和分析价值，不展开其他 event 的完整定义。

`$AppStart.md` 已澄清 `$AppStart`，`$AppStartPassively.md` 已澄清 `$AppStartPassively`。原任务在启动类事件口径基础上补充退出侧 `$AppEnd`，闭合 App 会话起止口径。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 待覆盖事件清单包含 `$AppStart`、`$AppStartPassively`、`$AppEnd`、`$AppViewScreen` 等事件。
- 每个 event 至少需要分析实际场景、端类型、触发时机、与相近事件差异，以及分析价值。
- `Index.md` 本身没有对 `$AppEnd` 给出额外语义说明，仅将其列入事件清单。

### 来源区分与推导过程

事件定义、端类型、触发时机、预置属性和属性插件化说明来自神策官方公开文档。

会话时长依赖、iOS 静默窗口建议、DAU / 启动 / 留存的指标处理，以及崩溃配对判断，是基于事件语义和实操惯例形成的推导，不属于神策官方直接定义。

Android 30 秒规则用于避免频繁切换产生噪声会话，是对神策会话设计动机的推导说明。

### 原约束回写记录

原调查报告建议向 `Index.md` 或上游可信输入补充以下约束：

- `$AppEnd` 在 iOS、Android、HarmonyOS 三端均存在；
- 端侧触发差异为 iOS 立即、Android 等待 30 秒、HarmonyOS 仅退出；
- `$event_duration` 是会话时长的关键字段，但支持属性插件化修改；
- iOS 端同时覆盖退出 App 和进入后台，业务会话切分可进一步叠加静默规则。

原调查报告建议向 `$AppStart.md` 补充以下约束：

- Android 30 秒 session 规则同时影响 `$AppStart` 和 `$AppEnd`；
- `$event_duration` 可能被项目内属性插件二次加工。

原调查报告建议向 `$AppStartPassively.md` 补充以下约束：

- `$AppStartPassively` 之后的 `$AppEnd` 是后台会话结束，不应与 `$AppStart` 配对形成前台会话；
- 该 `$AppEnd` 的 `$event_duration` 仅反映后台停留时长，不构成用户使用时长。

### 原任务完成状态

- 已基于神策官方文档说明 `$AppEnd` 的事件定义、端类型、预置属性和触发时机。
- 已明确 `$AppEnd` 与 `$AppStart`、`$AppStartPassively`、`$AppViewScreen`、`$AppPageLeave`、`AppCrashed` 的边界。
- 已说明 `$event_duration` 的三端差异和 Android 30 秒 session 规则在退出侧的对称行为。
- 已按 iOS 立即触发、Android 等待 30 秒、HarmonyOS 仅退出分析启动到退出的会话切分影响。
- 已给出会话时长强依赖 `$event_duration`，而 DAU、留存和启动次数不直接依赖 `$AppEnd` 的推导判断。
- 已记录需要回写到 `Index.md`、`$AppStart.md` 和 `$AppStartPassively.md` 的关键约束。
- 已标注神策官网未直接给出的指标口径和生产数据未验证等来源限制。
