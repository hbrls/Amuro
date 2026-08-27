# `$WebStay` 口径说明

> updated_by: Codex - GPT-5
> updated_at: 2026-07-13 20:15:34

## 1. 事件概览

`$WebStay` 是神策 Web JS SDK 全埋点中的 **Web 视区停留**事件，用于记录用户在网页某一可视区域内形成的有效停留，主要服务于神策热力图中的触达率图。

它不是页面打开事件、点击事件或页面整体停留时长事件。它回答的是“当前浏览器视区是否被用户实际停留观察过、停留了多久”。

### 运行环境与触发口径

**普通 Web 页面：**页面接入神策 Web JS SDK，并开启触达图 / 视区停留采集后，SDK 根据浏览器 `window` 的滚动和关闭行为采集 `$WebStay`。

**H5 页面：**移动浏览器中的 H5 页面可按同一 Web JS SDK 口径采集。

**App 内嵌 H5：**只要 WebView 页面使用 Web JS SDK，也属于 `$WebStay` 的运行环境；App 容器异常可能影响页面关闭前事件发送。

**App 原生端：**iOS、Android、HarmonyOS App SDK 不提供 `$WebStay`；App 页面时长使用 `$AppPageLeave` 等 App 事件口径。

**微信小程序：**小程序 SDK 不提供 `$WebStay`；小程序会话时长使用 `$MPHide`，页面级时长可使用符合版本要求的 `$MPPageLeave`。

神策 Web 全埋点包含 Web 页面浏览、Web 元素点击、Web 视区停留三类事件，分别对应 `$pageview`、`$WebClick`、`$WebStay` 的核心语义位置。

### 有效停留与发送时机

用户关注某一网页区域且不滚动时，期间可以移动鼠标或点击；停留超过默认 4 秒或自定义阈值后，该视区构成有效停留。

发生页面滚动时，如果上一个视区已经满足有效停留条件，SDK 发送一条 `$WebStay`。关闭页面时，神策文档也说明会发送一次页面停留事件。

自动采集基于绑定在 `window` 上的 `scroll` 事件。若主滚动发生在内部 `div` 等容器而不是 `window`，默认机制可能无法采集对应视区停留。

### 采集配置

| 配置项 | 默认值 / 取值 | 作用 |
| --- | --- | --- |
| `heatmap.scroll_notice_map` | `default` | 开启触达图和 `$WebStay` 自动采集；`not_collect` 表示关闭 |
| `heatmap.scroll_delay_time` | `4000` 毫秒 | 有效停留时间阈值，默认超过 4 秒 |
| `heatmap.scroll_event_duration` | `18000` 秒 | 限制 `$event_duration` 最大值，默认 5 小时 |
| `scrollmap.collect_url` | 返回真 / 假 | 按当前页面决定是否采集 `$WebStay` |

该能力要求 Web JS SDK 版本大于 `1.9.1`。合规场景中，用户未同意隐私条款前可将 `scroll_notice_map` 设置为 `not_collect`，从而关闭自动采集。

## 2. 关键属性

| 属性名 | 显示名 | 类型 | 含义 |
| --- | --- | --- | --- |
| `$viewport_width` | 视区宽度 | 数值 | 当前浏览器可视区域宽度，单位 px |
| `$viewport_position` | 视区距顶部的位置 | 数值 | 当前滚动位置距页面顶部的高度，单位 px |
| `$viewport_height` | 视区高度 | 数值 | 当前浏览器可视区域高度，单位 px |
| `$event_duration` | 停留时长 | 数值 | 距上次触发 `scroll` 事件的时间差 |
| `$url_path` | 页面路径 | 字符串 | 当前页面路径 |

`$viewport_position`、`$viewport_height`、`$viewport_width` 共同描述用户实际停留的视区位置和尺寸，是触达率图判断页面区域是否被有效看到的基础。

`$event_duration` 表示当前视区停留时长，不等同于整个页面浏览时长，并受 `heatmap.scroll_event_duration` 最大值限制。

`$url_path` 用于定位页面。完整 URL、来源、标题等通用 Web 属性是否存在，需要结合项目 SDK 公共属性配置确认。

神策官网说明 `$WebStay` 不支持增加自定义属性。若需要业务模块 ID、栏目 ID 等维度，应确认能否通过公共属性或另行设计自定义事件实现。

## 3. 神策口径下的场景解释

`$WebStay` 只记录满足阈值的有效视区停留。页面被打开、发生滚动或元素被点击，都不单独保证产生该事件。

### 场景一：在长页面首屏停留后向下滚动

**Web 页面：**用户打开商品详情页，在首屏停留 8 秒后向下滚动。首屏停留超过默认 4 秒，滚动发生时 SDK 发送 `$WebStay`，记录首屏视区位置、尺寸和停留时长。

该事件可用于计算首屏触达率、评估首屏模块曝光质量和内容吸引力。

### 场景二：快速滑过页面

**Web 页面：**用户打开文章页后连续快速滚动，每个视区停留都不足 4 秒。按默认配置，这些视区不满足有效停留条件，不会分别产生 `$WebStay`。

快速滑过不被当成实际看过，使 `$WebStay` 比单纯滚动深度更接近有效触达。

### 场景三：停留后直接关闭页面

**Web 页面：**用户打开页面，在当前视区停留 20 秒，没有继续滚动，随后关闭页面。神策文档说明关闭页面时会发送一次页面停留事件，因此该视区可形成 `$WebStay`。

关闭前事件能否可靠送达仍受浏览器关闭时机、发送方式和本地缓存策略影响，必须通过项目数据验证。

### 场景四：页面使用内部滚动容器

**Web 页面：**页面主体在内部 `div` 中滚动，`window` 本身不滚动。由于默认采集监听 `window.scroll`，内部滚动可能无法触发 `$WebStay`。

大量使用内部滚动容器的站点可能低估真实内容触达，需要单独验证或用自定义埋点补齐。

### 场景五：合规模式关闭触达图

**Web 页面：**用户未同意隐私条款前，项目将 `heatmap.scroll_notice_map` 设置为 `not_collect`。此时不会自动采集 `$WebStay`。

触达率分析必须同时确认用户授权状态和 SDK 初始化配置，否则事件缺失不能直接解释为用户没有看到内容。

## 4. 与相近事件的边界

### 与 `$pageview`

`$pageview` 是 Web 页面级入口事件，描述页面被打开或路由被浏览；`$WebStay` 是视区级停留事件，描述页面中的某个可视区域被有效停留。

一个 `$pageview` 页面内可以产生多条 `$WebStay`，对应不同滚动位置或关闭前视区。有 `$pageview` 不代表一定有 `$WebStay`：用户可能快速离开、停留不足阈值、使用内部滚动容器，或触达图采集被关闭。

有 `$WebStay` 通常应有页面浏览上下文，但关联时仍需结合 URL、会话和用户标识验证。

### 与 `$WebClick`

`$WebClick` 记录用户点击的 DOM 元素；`$WebStay` 记录用户停留的浏览器视区。

鼠标移动或点击不会破坏“不滚动的有效停留”语义。一个区域有 `$WebStay`、没有 `$WebClick`，表示用户可能看到了但未点击；有 `$WebClick`、没有 `$WebStay`，可能表示点击发生在有效停留阈值之前。

`$WebClick` 用于点击图，`$WebStay` 用于触达率图。两者同属热力分析体系，但回答的问题不同。

### 与 `$WebPageLeave`

`$WebPageLeave` 的显示名是 Web 页面浏览时长，关注页面整体浏览时长和页面可见状态切换；`$WebStay` 关注单个视区的有效停留。

`$WebStay.$event_duration` 表示距上次 `scroll` 的视区停留时长；`$WebPageLeave.$event_duration` 表示页面整体浏览时长。页面整体时长不应直接用多条 `$WebStay.$event_duration` 替代。

`Index.md` 没有把 `$WebPageLeave` 列为既定调查对象，本文仅用它说明边界。

### 与 App / 小程序端时长事件

各端事件都可能带 `$event_duration`，但粒度不同。

**iOS：**`$AppPageLeave` 表示 App 页面级离开时长。

**Android：**`$AppPageLeave` 表示 App 页面级离开时长，按 Android 页面生命周期口径采集。

**HarmonyOS：**`$AppPageLeave` 表示 HarmonyOS App 页面级离开时长。

**微信小程序：**`$MPHide` 表示小程序级前台会话时长；符合版本要求的 `$MPPageLeave` 表示小程序页面级时长。

**Web 页面：**`$WebStay` 表示页面内部某一浏览器视区的有效停留时长。

这些字段粒度不同，不能直接合并为统一平均停留时长。跨端分析必须先定义统一的比较对象。

### 与 `AppCrashed`

`AppCrashed` 是 App 原生端崩溃事件；`$WebStay` 是 Web 端视区停留事件，两者没有直接配对关系。

App 内嵌 H5 随 App 崩溃时，页面关闭前的 `$WebStay` 可能发送失败或延迟到后续发送，具体取决于 Web SDK 发送方式、WebView 和本地缓存策略。神策 `$WebStay` 文档没有给出与 App 崩溃的直接关系，不能下确定结论。

## 5. 核验结论与适用边界

### 当前结论

`$WebStay` 是 Web 视区有效停留事件，是神策触达率图的依赖数据。它适合回答“页面哪些区域被有效看到”，不适合单独回答“页面是否被访问”或“整个页面停留多久”。

其完整性高度依赖 SDK 版本、触达图开关、有效停留阈值、页面滚动模型和用户合规授权状态。

### 指标处理口径

| 指标 | 是否依赖 `$WebStay` | 理由 |
| --- | --- | --- |
| 页面区域触达率 | 强依赖 | 触达率图依赖事件，记录视区位置和有效停留 |
| 首屏有效曝光 | 强依赖 | 首屏停留超过阈值后可形成 `$WebStay` |
| 页面滚动深度 | 中依赖 | `$viewport_position` 只覆盖形成有效停留的视区，不是完整滚动轨迹 |
| 点击转化分析 | 弱依赖 | 需与 `$WebClick` 结合判断看到后是否点击 |
| 页面浏览 PV | 不依赖 | 页面浏览应以 `$pageview` 为主 |
| 页面整体停留时长 | 不建议直接依赖 | `$WebStay` 是视区时长，整体时长应参考 `$WebPageLeave` 或自定义口径 |
| 异常分析 | 弱依赖 | 可提供关闭或异常前最后视区的辅助上下文 |

### 待核验事项

- Web 端是否实际接入神策 Web JS SDK，是否启用全埋点和触达图。
- Web JS SDK 版本是否大于 `1.9.1`。
- `heatmap.scroll_notice_map`、`scroll_delay_time`、`scroll_event_duration`、`scrollmap.collect_url` 的生产配置。
- 页面是否大量使用内部 `div` 或其他非 `window` 滚动容器。
- 用户授权前后是否切换 `scroll_notice_map`，以及切换时机。
- CLKLOG / CDP 是否对 `$WebStay` 二次封装、改名或增加公共属性。
- 生产数据中是否真实存在 `$WebStay`，5 个属性是否完整。
- 页面关闭和 App 内嵌 H5 异常时，事件是否能可靠发送或由缓存补发。
- 业务是否需要模块 ID、栏目 ID 等 `$WebStay` 不支持直接增加的维度。
- 页面整体停留时长应采用 `$WebPageLeave` 还是业务自定义事件。

### 关键假设与适用限制

- 当前口径假设页面接入神策 Web JS SDK，并使用其全埋点能力；生产体系若二次封装或改名，只能以本文作为基准对照。
- 自动采集要求 `heatmap.scroll_notice_map = default` 且 SDK 版本大于 `1.9.1`。
- 默认有效停留阈值是 4 秒；业务修改 `scroll_delay_time` 后，不同页面或时期的触达率不一定可直接比较。
- `$event_duration` 默认最大值是 18000 秒；超长停留受配置截断。
- 默认机制监听 `window.scroll`，内部滚动容器可能缺失。
- 合规授权前关闭触达图会造成预期内缺失，不能解释为未触达。
- `$WebStay` 不支持直接增加自定义属性，业务维度需要公共属性或自定义事件承载。
- `$WebStay.$event_duration` 不是页面整体时长，也不能与 App、小程序的不同时长粒度直接合并。
- 页面关闭和 App 崩溃前的发送可靠性未由该事件文档明确保证。
- 当前尚未验证生产数据中的事件存在性、配置、字段完整性和发送方式。

## 附录一：参考文献

- 神策官方，Web JS SDK 预置事件和预置属性：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_js_preset_properties/v0300>
- 神策官方，全埋点和点击图（Web）：<https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_web_all_use/v0300>
- 神策官方，用户分群安全合规（Web）：<https://docs.sensorsdata.com/sa/docs/tech_sdk_client_web_policy/v0300>
- 已建立口径文档，`$MPHide.md`：提供 App 与小程序事件组已完成的阶段状态，以及小程序时长粒度对照。

## 附录二：调查背景与过程记录

### 调查目标

原调查任务用于澄清 `$WebStay` 的实际业务场景、触发时机、属性、配置、语义边界和分析价值，并在 App 与小程序事件口径完成后建立 Web 事件组基准。

调查以神策 Web JS SDK 公开文档为主要解释基础，不展开 `$WebClick`、`$pageview` 或 `AppCrashed` 的完整定义。

### 来自 `Index.md` 的原始输入

- 项目目标是恢复 CLKLOG / CDP 全埋点数据体系。
- 需要分析每种 event 对应的业务场景、触发时机和可观测行为。
- 需要明确事件语义边界，避免只停留在事件枚举名称层面。
- 剩余清单包含 `$WebStay`、`$WebClick`、`$pageview`、`AppCrashed`。
- 每个 event 至少需要分析实际场景、端类型、触发时机、相近事件差异和分析价值。
- `Index.md` 没有单独定义 `$WebStay`。

### 来自 `$MPHide.md` 的阶段输入

- App 事件组 6 个事件已完成调查。
- 小程序事件组 4 个事件已完成调查。
- 后续范围是 Web 事件组 `$WebStay` / `$WebClick` / `$pageview` 与异常事件 `AppCrashed`。
- `$MPHide.md` 只提供阶段状态和时长粒度对照，不用于套用 Web 事件定义。

### 来源区分与推导过程

事件定义、端归属、有效停留、4 秒阈值、触发条件、5 个属性、触达率图依赖、采集配置和合规关闭示例来自神策官方文档。

首屏曝光、滚动深度、点击转化、异常辅助等指标依赖关系，以及内部滚动容器对生产数据的实际影响，属于基于字段和采集机制的推导或待核验判断。

### 原任务完成状态

- 已说明 `$WebStay` 是 Web 视区停留事件，服务触达率图，不是页面浏览、点击或页面整体时长事件。
- 已明确 Web / 浏览器 / H5 / App 内嵌 H5 运行环境，以及 Web JS SDK 和触达图依赖。
- 已说明默认超过 4 秒、滚动时发送、关闭页面时发送、监听 `window.scroll` 等触发条件。
- 已记录 4 个配置项和 5 个预置属性。
- 已给出长页面停留、快速滑过、关闭页面、内部滚动容器、合规关闭等场景。
- 已明确与 `$pageview`、`$WebClick`、`$WebPageLeave`、App / 小程序时长事件、`AppCrashed` 的边界。
- 已标注版本、开关、授权、滚动模型、自定义属性、页面整体时长和生产发送可靠性等限制。
