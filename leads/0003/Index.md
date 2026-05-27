# Lead 0003 - HiCash 页面业务场景分组 - Index

## Current State

`waiting_for_business_page_taxonomy` (blocked - 页面清单来源缺失)

## Priority

`high`

## Goal

将 HiCash 的所有页面按业务属性分组，理想状态是每一种业务场景对应一个 Activity，Activity 内部由 Fragment 组成。

## Account

HiCash

## Lead

`0003`

## Source Signal

用户明确提出：HiCash 页面分组不能只按技术结构决定，需要反复和业务核对；该事项优先级较高。

## Current Objective

先建立 HiCash 页面清单、业务场景分类口径和需要业务确认的问题，把页面分组推进成可反复核对的业务-技术映射。

## Waiting On

HiCash 业务 owner / 产品 owner / 熟悉现有页面流转的人。

## Required Context

- HiCash 当前所有页面清单
- 每个页面的业务属性、入口和用户意图
- 当前 Activity / Fragment / 页面路由结构
- 已知的业务场景边界
- 哪些页面必须属于同一个业务闭环
- 哪些页面只是技术复用页、弹窗页、中转页或结果页
- 业务是否接受“一种场景一个 Activity”的目标结构
- 需要保留的历史兼容、埋点、风控、支付、登录或 Deep Link 约束
- 优先重构或优先核对的页面范围
- 验收标准和 deadline

## Next Follow-up

见 `followups.md` 的 `FUP-001`。

## Exit Conditions

### Move to Plan

满足以下条件后转入执行 Plan：

- HiCash 全量页面清单已获得
- 页面业务属性和入口已初步标注
- 业务场景分组口径已和业务 owner 核对
- Activity / Fragment 目标结构已确认
- 迁移优先级和验收标准已明确

### Move to Blocked

如果无法获得页面清单、业务 owner 无法确认场景边界，或现有页面结构无人能说明，则进入 `blocked_waiting_for_business_context`。

### Keep as Lead

只要页面归属仍需要业务反复核对，本事项保持 Lead 状态，不降级为普通技术任务。

## Confidence

**Score**: —
**Trend**: —
**Reasoning**: 业务场景分组方案待业务确认，当前处于 blocked 状态。

## Confidence History

| Date | Score | Delta | Trigger |
|------|-------|-------|---------|
| — | — | — | 尚未开始有效评估 |

## Stage History

| Date | From | To | Rationale |
|------|------|----|-----------|
| 2026-05-27 | — | waiting_for_business_page_taxonomy | lead 创建，等待业务页面清单来源 |
