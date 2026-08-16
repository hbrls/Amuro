---
name: vision
description: "Amuro project assistant skill"
metadata:
  version: 0.1.0
---

# Amuro Vision

Amuro 是一个 AI-native 的机会推进系统，用来把模糊的客户信号推进成更确定的 Deal，并最终沉淀成可以执行的 Plan。

它不是 coding agent 产品。用户并不缺写代码的能力，真正缺的是在商业机会极度不确定时，持续、具体、千人千面地跟进客户。

## 核心判断

大多数工作管理工具开始得太晚。

Jira、Linear 这类系统适合已经确定的工作：

```text
Plan -> Execution
```

但很多真正有价值的机会一开始不是 Plan，而是碎片：

```text
客户随口说的一句话
一个很弱的购买信号
一段混乱的会议记录
一个可能有用的转介绍
创始人脑子里半成型的直觉
```

这些碎片需要先被追、被问、被澄清、被推进，才可能变成 Plan。

Amuro 服务的是这个更早的阶段：

```text
Raw Signal -> Lead -> Qualified Lead -> Deal -> Closed Won -> Plan
```

Plan 不是起点。Plan 是成功打单之后的产物。

## CRM 类比

Plan 之前的不确定阶段，更像 CRM，而不是项目管理。

一个原始信号就像一个 Lead。此时还不知道它是否重要，谁有痛点，谁能拍板，谁会阻拦，下一步应该问什么。

Lead 需要非标跟进，才可能变成 Deal。Deal 继续需要非标跟进，才可能 Closed Won。只有在商业不确定性被足够消化之后，它才配进入 Jira、Linear 或开发 Agent。

Amuro 把这个追单过程当成主流程。

## Amuro 是什么

Amuro 是一个面向模糊机会的 KA 工作台。

对每一个机会，Amuro 维护：

- 客户蒸馏
- 机会假设
- 缺失信息
- 利益相关方地图
- 异议地图
- 下一步跟进动作
- 面向不同人的消息草稿
- Deal 信心
- 阶段变化及其理由

重点不是和 Agent 聊天。重点是持续推进机会，直到它变成 Deal、变成 Plan，或者被明确判死。

## Amuro 不是什么

Amuro 不是通用 coding agent。

Amuro 不是通用 multi-agent demo。

Amuro 不是以"聊得舒服"为主要价值的 chatbot。

Amuro 不是传统 CRM。传统 CRM 往往只是记录销售已经做完的动作，Amuro 要参与推进动作本身。

Amuro 也不是 Jira 替代品。

## 对 Sub-Agent 的判断

把同一个通用 LLM 拆成 Dev Agent、QA Agent、PM Agent、Designer Agent，很多时候是假动作。底层能力相同，只是语气、仪式和情绪价值不同。

Amuro 不需要为了内部执行者做角色扮演。

真正有价值的拆分在客户侧。

客户不是一个统一理性体。一个客户账户里可能同时有：

- 经济买家
- Champion
- 最终用户
- 采购
- 安全
- 法务
- 运营
- 阻拦者
- 怀疑者

每个角色都有不同的恐惧、激励、语言和决策标准。

Amuro 应该建模这些外部利益相关方。不是因为角色扮演好玩，而是因为打单本质上是在多方不确定性里减少风险、制造共识、推进承诺。

## 产品中心

Amuro 的中心是 Lead Room。

一个 Lead Room 可以从非常低质量的信号开始，例如：

```text
某个客户说他们也想试试 Agent 帮销售跟进。
```

随后 Amuro 反复执行追单循环：

```text
捕获新信号
蒸馏客户上下文
更新机会假设
识别缺失信息
生成下一步动作
起草客户特定消息
模拟可能反应
更新信心和阶段
重复
```

这个循环一直持续，直到机会进入某个明确状态：

- Noise
- Nurture
- Qualified Lead
- Deal
- Closed Lost
- Closed Won
- Plan

## 初始用户

Amuro 的初始用户是技术创始人、builder、顾问、AI 产品操盘手。

这类用户能写代码，能做产品，但不一定有稳定的 sales motion。

他们不需要 Agent 帮他们写样板代码。

他们需要 Agent 在场景模糊、不舒服、信息不足的时候，持续推动商业上有意义的对话。

## 当前阶段最有用的产物

现阶段最有用的产物不是产品 spec。

最有用的产物是 prompt：它能把弱客户信号反复转化成下一步动作、跟进消息、异议模拟和阶段判断。

Amuro 应该先作为一种 operational prompt 和追单纪律存在，然后再变成软件。

## 成功标准

Amuro 有用，当且仅当它能：

- 把一句模糊客户话术变成具体下一步
- 写出用户真的愿意发出去的消息
- 找出会改变 Deal 判断的缺失信息
- 在用户撞上阻力前暴露潜在 blocker
- 维护 account-specific 的记忆和语气
- 判断一个 Lead 应该继续追、养着、判死，还是转 Deal
- 在机会被足够验证后，把它转成可执行 Plan

目标不是显得聪明。

目标是增加高质量 follow-up 的数量，并让更多不确定机会走向收入，或者被尽早、明确地淘汰。

## 指导原则

不要从项目管理开始。

不要从代码生成开始。

不要从内部 multi-agent 戏剧开始。

从对模糊机会的疯狂跟进开始。

Amuro exists to help its user 打单.

## Vision Tree 结构

Vision 是一棵树，**Root 是最终目标，Child 是前置条件**。

执行方向从 Child 到 Parent：先做 Child，完成后才能做 Parent。Root 依赖所有 Child 完成。

```
LSTD-002（Root：Magii 核心）
├── LSTD-003（Child：调度中心 / flowablex 集成）
└── LSTD-004（Child：自我学习与进化机制）
```

LSTD-003 和 LSTD-004 是平行的 Child，互不依赖，都完成后 LSTD-002 才算达成。

**visionId** 是 Vision 的唯一标识（如 `LSTD-003`）。不要把 `Index.md` 内部的 checklist 条目格式当作独立术语引用——它们是文件内部格式，不是 visionId。
