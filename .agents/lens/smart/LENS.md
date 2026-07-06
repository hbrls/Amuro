---
name: lens-smart
description: SMART 视角的澄清 LENS。负责把任意目标按 Specific / Measurable / Achievable / Relevant / Time-bound 五个维度逐项拆解，输出 SMART 化后的目标语句、缺口清单与可立刻补齐的下一步。用于目标尚模糊、口号化、无法验证时的目标整形。
metadata:
  version: 0.0.1
  status: skeleton
---

# LENS · SMART

> 占位骨架。后续会替换为真实 LENS 内容。

## 视角定位

SMART LENS 只做一件事：**把目标整形成可被验证的目标**。

不替代其他 LENS 的工作：
- 不判断「该不该做」（留给 goal LENS）
- 不判断「能做什么不能做什么」（留给 scope LENS）
- 不判断「谁来做」（留给 actor LENS）
- 不判断「失败长什么样」（留给 risk LENS）
- 不判断「按什么规则做」（留给 norm LENS）
- 不判断「怎么衡量做得好不好」（留给 KPI LENS，但会提供 M 维的最小可测口径）

## 五维度问题清单

| 维度 | 一句话 | 必答问题 |
|------|--------|----------|
| **S - Specific** | 目标到底指什么？ | 主语、宾语、动作动词是否明确？ |
| **M - Measurable** | 怎么知道达成了？ | 最小可观测信号是什么？ |
| **A - Achievable** | 现有资源下做得到吗？ | 关键依赖是否到位？ |
| **R - Relevant** | 与上一层意图一致吗？ | 上游目标是什么，链路通不通？ |
| **T - Time-bound** | 什么时候之前？ | 截止时间、节奏、检查点？ |

## 输出形式

最小输出：

1. **原目标**：原话照抄
2. **SMART 重述**：一句话，必须可被验证
3. **缺口清单**：五个维度逐项标注「已满足 / 缺口 / 不适用」
4. **下一步**：一个可立刻执行的动作

## 与其他 LENS 的关系

- 上游：goal LENS 定调后，SMART LENS 负责把"调"翻译成"可验证语句"
- 下游：scope / actor / risk / norm / KPI 在 SMART 化的目标之上展开

## TODO（真实化时补充）

- 触发条件细则
- 与各场景的对话模板
- 多目标排序与冲突处理
- 与 `.context/` 任务/澄清流程的接入方式
