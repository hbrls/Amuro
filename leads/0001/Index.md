# HiCash / 同盾 SDK 接入 - Index

## Current State

`waiting_for_required_context`

## Goal

在 HiCash App 中接入同盾 SDK。

## Account

HiCash

## Lead

`0001`

## Current Objective

拿到足够上下文，把一句话目标推进成可执行接入任务。

## Waiting On

需求 owner。

## Required Context

- iOS / Android / 两端范围
- 同盾 SDK 文档
- 同盾 AppKey / AppId / 环境配置
- 测试环境
- 技术支持联系人或群
- 验收标准
- 上线 deadline
- 是否涉及服务端回调 / 事件上报 / 业务拦截
- 隐私合规和上架审核要求

## Next Follow-up

见 `followups.md` 的 `FUP-001`。

## Exit Conditions

### Move to Plan

满足以下条件后转入 Plan：

- 端范围明确
- SDK 文档已获得
- AppKey / 环境配置已获得
- 验收标准明确
- deadline 明确
- owner 明确

### Move to Blocked

如果 owner 无法提供 SDK 文档、AppKey 或验收口径，则进入 `blocked_waiting_for_external_resource`。

### Move to Dead / Nurture

如果没有 owner、没有 deadline、没有接入资源，且需求只是口头想法，则停止主动推进。

## Confidence

**Score**: —
**Trend**: —
**Reasoning**: 尚未开始有效推进，等待需求 owner 提供 Required Context。

## Confidence History

| Date | Score | Delta | Trigger |
|------|-------|-------|---------|
| — | — | — | 尚未开始有效评估 |

## Stage History

| Date | From | To | Rationale |
|------|------|----|-----------|
| 2026-05-27 | — | waiting_for_required_context | lead 创建，等待 Required Context 收集 |
