# Lead 0003 - HiCash 页面业务场景分组 - Follow-ups

## FUP-001

- **Status**: ready_to_send (已补充仓库访问请求)
- **Target**: HiCash 业务 owner / 产品 owner / 熟悉 App 页面流转的人
- **Purpose**: 获取页面清单和业务场景边界，确认页面分组口径，获取代码仓库访问权限。
- **Expected Reply**: 全量页面清单、HiCash Android 代码仓库 Git 地址和访问权限、每个页面所属业务场景、关键入口、业务闭环边界、不能改动的历史约束、优先级和验收标准。

### Message

```text
我准备推进 HiCash 的页面业务场景分组。这个不是单纯按代码结构拆 Activity / Fragment，而是要先按业务属性确认每个页面属于哪个业务场景，再决定技术结构。

我的目标口径是：尽量做到每一种业务场景一个 Activity，Activity 内部由 Fragment 组成。但最终分组需要和业务核对。

目前我这边没有 HiCash 的代码仓库和页面清单，需要你帮我提供：

1. HiCash Android 代码仓库的 Git 地址和访问权限（我需要从 AndroidManifest.xml 和路由配置中提取完整的 Activity / Fragment 列表）。
2. HiCash 当前所有页面清单在哪里？如果没有清单，谁最熟悉全量页面流转？
3. 每个页面分别属于哪个业务场景？例如注册、登录、授信、借款、还款、展期、账单、银行卡、支付、客服、设置、活动等。
4. 哪些页面必须归在同一个业务闭环里？哪些只是中转页、结果页、复用页或弹窗？
5. 现在线上有哪些不能轻易改的约束？例如埋点、风控、Deep Link、支付回调、登录态、历史 Activity 路径等。
6. 这次优先核对或优先改造哪些页面？验收标准是什么？

拿到代码仓库和页面信息后，我会先产出一版"页面 -> 业务场景 -> 目标 Activity / Fragment"的映射表，再逐轮和业务核对。
```

## If No Reply

### FUP-002

- **Trigger**: FUP-001 发出后 24 小时无回复
- **Status**: scheduled (已补充具体请求)

```text
我先按高优先级推进 HiCash 页面业务场景分组。当前最关键的前置条件是拿到 HiCash Android 代码仓库访问权限和全量页面清单。

如果暂时没有正式页面清单，请先提供以下任一信息：
1. HiCash Android 代码仓库 Git 地址和访问权限
2. 最熟悉页面流转的技术负责人联系方式
3. AndroidManifest.xml 或路由配置文件

有了代码仓库我就能自己提取 Activity / Fragment 列表，先整理初版页面分组，再拿给业务核对。
```
