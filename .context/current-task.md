# 知识库写入闭环 — 实现执行

## 背景

C-003（arch-design lens）已输出完整的写入闭环架构设计，包含：
- 5类产出的写入协议（APPEND/OVERWRITE/UPSERT）
- analysis.md 新文件结构
- Index.md 新增字段（Confidence/Confidence History/Stage History）
- followups.md 新增 status=proposed
- 人机分工边界（Exit Conditions 不可写）

## 目标

把 C-003 的设计落地为实际文件：
1. 为现有 leads 创建 analysis.md 骨架
2. 为 Index.md 追加 LLM 可写区
3. 建立 followups.md 的 proposed 状态约定
4. 确保下一次追单循环能跑起来

## 约束

- 不重写现有内容
- 最小增量
- 旧 lead 兼容

## 期望产出

执行完成后的文件变更，以及可用性验证