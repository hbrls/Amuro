# `$AppStart` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-08-30

## 1. 事件概览

`$AppStart` 是神策 App 端全埋点预置的 App 启动事件。按神策公开口径，它描述 App 启动或从后台恢复进入前台活跃链路的行为，不应理解为抽象的“进程创建”事件。

### 端侧触发口径

| 端类型 | 触发条件 |
| --- | --- |
| iOS | 启动 App，或从后台切换进入 App |
| Android | 启动 App 且距离上次退出超过 30 秒，或新装后的首次启动 |

Android 侧存在 30 秒 session 机制：App 退到后台满 30 秒才触发退出，之后再次启动才触发启动；如果 30 秒内回到 App，则不会产生对应的退出和启动。

## 2. 关键属性

- `$resume_from_background`：是否从后台唤醒，用来区分「进程级冷启动进入前台」和「进程仍在、从后台切回前台」。它回答的是**这一次**怎么进来的，与用户是否第一次使用 App 无关。
- `$is_first_time`：是否首次触发 `$AppStart`（布尔值，显示名「是否首次」）。客户端是**这台设备、这次安装周期里的一次性标记**，不是登录账号终身，也不是当天首次（当天用 `$is_first_day`）。

#### 「这次安装周期 / 本地存储」指什么

官网原文（[新增用户及首日首次标记](https://manual.sensorsdata.cn/sa/docs/tech_knowledge_new/v0300)）：本地针对 `$pageview` / `$AppStart` / `$MPLaunch` 各存一个标记，默认未触发，第一次改为已触发，之后一直是未再首次；**App 缓存被清理或卸载重装会导致前端标记被清除**。

据此，「本地存储」= **当前这次 App 安装所占用的应用沙盒数据**（会随卸载或用户清 App 数据一起消失）。「这次安装周期」= 从装上 App（或上次清数据）到下一次卸载/清数据。杀进程、退后台、系统回收进程都不会清这块数据，所以 `$is_first_time` 不会因此变回 `true`。

官网没有写死实现细节，下面条目**不能当最终口径**，留给后续 Agent 对照 iOS / Android SDK 源码确认：

- 标记写在哪种持久化上（iOS `UserDefaults` / 文件？Android `SharedPreferences` / 文件？key 名是什么）。
- 是否只跟 App 沙盒绑定：杀进程、系统回收、升级覆盖安装是否保留；卸载、清存储、清缓存是否一定清掉。
- 是否按匿名 ID / 登录 ID 分 key，还是整机一个开关；换账号是否重置。
- 服务端按 `distinct_id` 校正 `$is_first_time = true` 的逻辑，项目所用 CLKLOG / CDP 是否同样执行。

#### `$is_first_time` 在四个常见生命周期下的取值

下面假设用户已经完成过至少一次正常启动，除非单独写明「终身第一次」。本地标记不随进程结束而重置；卸载重装或清理 App 存储会清掉标记，客户端可能再次报 `true`，服务端再按该 `distinct_id` 是否已有 `$AppStart` 首次记录决定是否改回 `false`。

| 场景 | 是否产生 `$AppStart` | `$is_first_time` | `$resume_from_background` |
| --- | --- | --- | --- |
| 1. 用户终身第一次打开 App（新装后首次启动） | 是 | `true` | 否（冷启动进入） |
| 1 的后续：同一用户、同一设备上以后每一次 `$AppStart` | 按端侧规则 | `false` | 按当次进入方式 |
| 2. 用户划掉 App / 强杀进程后再打开（冷启动） | 是 | `false`（只要以前启动过） | 否 |
| 3. 退到后台、进程未被杀，再切回 | **iOS：**是。**Android：**后台停留不足 30 秒则**不产生** `$AppStart`；满 30 秒后再进入才产生 | 有事件时为 `false` | 有事件时为是 |
| 4. 退到后台后进程被系统回收，用户再打开 | 是（进程已结束，相当于一次新的启动） | `false`（只要以前启动过） | 官网未按「系统杀进程」单独给值；进程已不在，应按新的启动链路理解，而不是「后台进程被唤醒」。与场景 2 一样，**不能**靠 `$is_first_time` 识别 |

例子：用户周一第一次安装并打开电商 App → 唯一一条 `$is_first_time = true` 的 `$AppStart`。周二划掉进程再打开、周三只切到微信再切回、周四被系统回收后再点图标，只要本地标记还在，这些 `$AppStart` 的 `$is_first_time` 都是 `false`。区分「杀进程冷启动」和「后台热启动」看 `$resume_from_background` 以及当次是否真的上报了 `$AppStart`，不看 `$is_first_time`。

当前文档的这些属性和端侧行为以神策公开预置事件文档为解释基准；CLKLOG / CDP 是否完整保留这些字段，需结合项目配置和实际数据核验。

## 3. 神策口径下的场景解释

### 场景一：用户冷启动 App

用户点击桌面图标、应用市场打开按钮、外部链接唤起 App 等，使 App 从未运行或已被系统结束的状态启动。

按神策公开口径，各端均使用 `$AppStart` 描述符合自身生命周期规则的 App 启动行为，但具体触发条件不同。

**iOS：**启动 App 时触发 `$AppStart`。

**Android：**启动 App 且距离上次退出超过 30 秒时触发；新装后的首次启动也会触发。

例子见第 2 节四个生命周期表：只有新装后的第一次 `$AppStart` 为 `$is_first_time = true`；之后的冷启动（含杀进程再打开）都是 `false`。当天是否仍算新用户看 `$is_first_day`，不看 `$is_first_time`。

### 场景二：用户从后台切回 App

用户之前打开过 App，随后切到系统桌面或其他应用；一段时间后再次从最近任务、桌面图标或系统切换器回到该 App。

按神策公开口径，后台恢复是否产生 `$AppStart` 需要按端侧生命周期规则判断。`$resume_from_background` 可用于识别是否从后台唤醒。

**iOS：**从后台切换进入 App 时触发 `$AppStart`。

**Android：**需要结合 30 秒 session 机制判断。App 退到后台后，若在 30 秒内返回，则不产生对应的 `$AppEnd` 和 `$AppStart`；达到 session 结束条件后再次进入，才产生新的启动事件。

例子：用户在支付 App 看完账单后切到聊天软件，进程仍在。iOS 切回时一定再记一条 `$AppStart`，`$resume_from_background = true`，`$is_first_time = false`。Android 若 30 秒内切回则没有新的 `$AppStart`；超过 30 秒再进入才有新的 `$AppStart`，同样 `$is_first_time = false`。若后台期间进程已被系统杀掉，再打开按场景 4：会产生新的 `$AppStart`，但 `$is_first_time` 仍为 `false`。

### 场景三：iOS 系统拉活 App

当 iOS 设备因为通知、用户位置信息变化等条件唤醒 App，让程序在后台运行时，神策口径下触发的是 `$AppStartPassively`，不是普通 `$AppStart`。

**iOS：**该场景由系统条件触发，App 在后台运行，并未进入用户主动打开或前台恢复的普通启动链路。

例子：用户没有主动打开 App，但系统因位置变化唤醒出行 App 在后台处理逻辑，SDK 记录 `$AppStartPassively`。这个行为不应被解释为用户主动启动 App。

## 4. 与相近事件的边界

### 与 `$AppStartPassively`

`$AppStart` 关注 App 启动或从后台切换进入 App 的启动行为；`$AppStartPassively` 关注 iOS 应用被系统从后台拉活的被动启动行为。

典型 `$AppStartPassively` 例子包括地理围栏、远程推送等系统能力导致应用在后台被拉起。该事件不应直接等同于用户打开 App，也不应直接计入普通启动路径。

### 与 `$AppEnd`

`$AppStart` 表示 App 启动或恢复，`$AppEnd` 表示 App 退出或进入后台后的结束行为。两者可以用于会话起止分析。

**Android：**`$AppStart` 与 `$AppEnd` 的配对需要遵循 30 秒 session 机制；强杀、补发和异常退出也可能影响配对结果。

### 与 `$AppViewScreen`

`$AppStart` 是 App 级启动 / 激活事件，`$AppViewScreen` 是页面级浏览事件。一次 `$AppStart` 后通常会出现一个或多个页面浏览事件，但页面浏览不能替代启动事件，启动事件也不能说明用户实际浏览了哪个页面。

## 5. 核验结论与适用边界

### 当前结论

`$AppStart` 的解释应以神策官网公开预置事件口径为基准，将其视为 App 启动 / 后台恢复到前台的启动类事件，并用 `$resume_from_background` 等属性区分具体启动来源。

`$AppStart` 不是页面浏览事件，也不是点击事件；它描述 App 从冷启动或后台恢复进入可用活跃链路的行为。iOS 被系统后台拉活的被动启动应优先归入 `$AppStartPassively` 的边界讨论，而不是混入普通 `$AppStart`。

### 待核验事项

- 当前 CLKLOG / CDP 体系是否完全沿用神策 `$AppStart` 口径。
- 当前项目内是否有神策 SDK 版本、配置或封装说明：阻塞程度高。神策官网给出公开口径，但项目可能有二次封装。
- CLKLOG / CDP 是否完整保留神策预置属性：阻塞程度高。需要重点确认 `$resume_from_background` 是否可用于区分冷启动和后台恢复，以及 `$is_first_time` 是否仍可用于识别首次启动（不要与 `$is_first_day` 混用）。
- `$is_first_time` 本地标记的存储实现：阻塞程度高。官网只写「本地存储、卸载/清缓存清除」。需在神策 iOS / Android SDK 源码中确认存储介质、key、是否随登录变化、升级覆盖安装是否保留。
- Android、iOS 是否都接入同一套 `$AppStart` 事件，还是存在端差异：阻塞程度中。端差异会影响跨端统一口径。
- iOS 的 `$AppStartPassively` 是否实际入库，以及是否需要从普通启动分析中排除：阻塞程度中。它影响 iOS 被动唤起是否需要单独解释。
- `$AppStart` 与 `$AppEnd` 的会话切分规则是否沿用神策默认 30 秒 session 机制，还是被 CLKLOG / CDP 做过二次加工。
- `$AppStart` 是否被下游指标直接用于 DAU、启动次数、留存或会话入口：阻塞程度中。它影响最终分析价值排序。

### 关键假设与适用限制

- 假设 CLKLOG / CDP 中这些字段确实来自神策公开字段。若不成立，神策官网只能作为参考，不能作为最终口径。
- 假设当前体系没有大幅改写神策 SDK 的默认全埋点行为。若不成立，需要以项目内 SDK 封装或埋点加工逻辑为准。
- 假设 `$resume_from_background` 在数据中可用。若不可用，冷启动与后台恢复只能通过其他上下文近似判断。
- 假设 `$AppStartPassively` 与 `$AppStart` 都可能存在。若当前只采集 `$AppStart`，被动启动场景可能已被丢弃或合并。

神策官网已经补足 `$AppStart` 的公开口径，但当前 `Index.md` 仍没有写明这些事件来自神策公开字段。后续需要将以下源约束回写到 `Index.md` 或更上游的可信输入中：

- 这些 event 枚举以神策公开预置事件为主要解释基准。
- `$AppStart` 按神策 App 启动事件理解。
- `$AppStartPassively` 是 `$AppStart` 的关键边界参照，尤其影响 iOS 被动启动场景。
- 后续每个 event 的解释应优先检索神策官网公开文档，再做项目内差异校验。

## 附录一：参考文献

- 神策 App SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_app_preset_properties/v0300>
- 神策新增用户及首日首次标记：<https://manual.sensorsdata.cn/sa/docs/tech_knowledge_new/v0300>
- 神策基础 API 介绍（iOS）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_ios_super/v0300>
- 神策基础 API 介绍（Android）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_android_super/v0205>

## 附录二：调查背景与过程记录

### 当前目标重述

本轮目标调整为：以神策公开官网文档为主要可信来源，澄清 `$AppStart` 在神策口径下对应的 App 启动场景、触发时机、典型例子和语义边界。

本轮仍只处理 `$AppStart`，但允许引用 `$AppStartPassively`、`$AppEnd`、`$AppViewScreen` 作为边界对照。其他事件不展开。

### 信息来源区分

#### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 待覆盖事件清单包含 `$AppStart`、`$AppStartPassively`、`$AppEnd`、`$AppViewScreen` 等事件。
- 每个 event 至少需要分析实际场景、端类型、触发时机、与相近事件差异，以及分析价值。

#### 来自神策官网的公开口径

- 神策将 `$AppStart` 定义为 App 启动事件，属于 App 端全埋点预置事件。
- 神策 App SDK 预置事件文档给出了 `$AppStart` 的端侧触发口径。

  iOS 在启动 App 或从后台切换进入 App 时触发。

  Android 在启动 App 且距离上次退出超过 30 秒，或新装首次启动时触发。
- 神策基础 API 文档进一步说明，App 启动、退出在 Android 侧存在 30 秒 session 机制：退到后台满 30 秒才触发退出，之后再启动才触发启动；如果 30 秒内回到 App，不会产生对应的退出和启动。
- 神策 App SDK 预置事件文档中，`$AppStartPassively` 是 App 被动启动事件，只存在于 iOS 端，典型触发是 iOS App 被系统拉活。
- 神策 iOS 基础 API 文档解释了被动启动场景：除用户主动启动外，通知、用户位置信息变化等条件可能唤醒 App，使程序在后台运行，此时 SDK 触发 `$AppStartPassively`。
- 神策文档说明 `$resume_from_background` 用于标识是否从后台唤醒；`$is_first_time` 是「是否首次触发该事件」，在 `$AppStart` 上表示是否首次启动 App。它与 `$is_first_day`（是否首日访问）不是同一属性。
- 神策文档写明 `$is_first_time` 在客户端本地为 `$AppStart` 存标记；卸载或清 App 缓存会清除。未写存储介质、key 名、是否按用户 ID 分 key。服务端在 `$is_first_time = true` 时按 `distinct_id` + 该事件首次记录校正。

### 本任务的推导判断

- `$AppStart` 不应被理解为抽象的“进程创建”事件，而应按神策口径理解为 App 进入前台活跃链路时产生的启动事件。
- `$AppStart` 同时覆盖启动 App，以及部分端上从后台切换进入 App 的启动 / 激活场景；Android 侧还需要注意 30 秒 session 规则。
- `$resume_from_background` 是区分“冷启动进入前台”和“后台恢复进入前台”的关键属性，应在后续事件解释中作为 `$AppStart` 的重要辅助语义。
- `$is_first_time` 按官网应理解为设备本次安装沙盒内的一次性开关，不是账号终身、不是会话、不是冷启动。存储实现需源码核验，不能从官网推出具体文件或 key。
- `$AppStartPassively` 不应并入 `$AppStart`。它描述 iOS 应用被系统后台拉活的被动启动场景，语义上不是用户主动打开或前台恢复。
- `$AppStart` 与 `$AppViewScreen` 的边界是启动 / 激活 vs 页面浏览。`$AppStart` 表示 App 进入活跃或恢复链路，`$AppViewScreen` 表示具体页面浏览。

### 过程记录说明

本附录保留原调查报告中的来源分类、推导判断与任务范围，供后续追溯；正文以可直接查阅的结果为准。
