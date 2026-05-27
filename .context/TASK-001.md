# TASK-001 · 知识库写入闭环实现

> 视角：implementation
> 主题：将 C-003 设计落地为实际文件

## 背景

C-003（arch-design lens）已输出完整的写入闭环架构设计，包含 5 类产出的写入协议。新讨论方向：**怎么落地**。

## 输入

读取以下文件以了解当前状态：
- `.context/C-003.md` — 写入闭环架构设计
- `.context/C-004.md` — coordinator 收束结论
- `leads/0001/Index.md`、`leads/0002/Index.md`、`leads/0003/Index.md` — 现有 lead 文件
- `leads/0001/followups.md` — FUP 格式参考

## 目标

执行以下文件变更，把 C-003 设计落地：

1. **创建 analysis.md**（如不存在）为每个 lead 创建骨架模板
2. **扩展 Index.md** 追加 LLM 可写区（Confidence / Confidence History / Stage History）
3. **确认 followups.md** 的 proposed 状态已可使用（status 值域扩展）
4. **验证** 文件结构符合 C-003 的兼容方案

## 约束

- 不重写现有内容
- 最小增量
- 旧 lead 兼容

## 输出

执行完成后的变更报告，写入 `.context/C-005.md`