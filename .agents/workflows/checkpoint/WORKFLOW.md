---
name: checkpoint
description: 讨论结束标记：在当前 Vision Id 目录内先输出完整交付包 WORKSHOP-NNN.md，再创建 .done/ 目录。
---

# checkpoint · 结束标记工作流

## 目的

本工作流负责讨论结束时在当前 Vision 目录内执行两项操作：

1. **先交付**：基于当前讨论产出生成完整输出物 `.context/<Vision Id>/WORKSHOP-NNN.md`
2. **后标记**：创建 `.context/<Vision Id>/.done/` 目录，作为该 Vision 讨论已结束的标记

checkpoint 不参与讨论过程，不启动新的讨论循环。

## Vision Id 边界

Vision Id 是 `.context/` 下的一级目录名，例如 `LSTD-48`。当前 Vision 目录为 `.context/<Vision Id>/`。

checkpoint 由当前 TASK 唤起，Vision Id 必须由当前 TASK 文件所在目录推导。例如当前 TASK 为 `.context/LSTD-48/TASK-003.md` 时，当前 Vision Id 为 `LSTD-48`，当前 Vision 目录为 `.context/LSTD-48/`。

所有输入、输出、编号扫描和结束标记都必须限制在当前 Vision 目录内。不得跨 Vision Id 读取或写入，不得向 `.context/` 根目录写入 `WORKSHOP` 或 `.done`。

## 编号格式

所有 `TASK`、`C`、`WORKSHOP` 序列文件名必须使用三位数字零补齐格式：`TASK-001.md`、`C-001.md`、`WORKSHOP-001.md`。

不得创建 `TASK-1.md`、`C-1.md`、`WORKSHOP-1.md`、`TASK-01.md`、`C-01.md`、`WORKSHOP-01.md` 等非规范文件。编号扫描只认可三位数字格式。

## WORKSHOP 编号机制

WORKSHOP 编号由当前 Vision 目录下已有的 `WORKSHOP-NNN.md` 文件决定：

- 扫描 `.context/<Vision Id>/` 下所有 `WORKSHOP-*.md` 文件，只解析符合 `WORKSHOP-NNN.md` 三位格式的文件，解析出最大编号 M
- 下一个 WORKSHOP 编号 N = M + 1
- 若当前 Vision 目录中无任何规范 `WORKSHOP-NNN.md` 文件，则 N = 1
- 文件名格式：`.context/<Vision Id>/WORKSHOP-{N:03d}.md`（三位零补齐，如 `WORKSHOP-001.md`、`WORKSHOP-002.md`）
- 不扫描其他 Vision Id 目录下的 `WORKSHOP-*.md`

使用下方 Python 脚本获取编号 N：

```python
import os
import re

vision_dir = '.context/<Vision Id>'
existing = []
if os.path.isdir(vision_dir):
    for f in os.listdir(vision_dir):
        m = re.match(r'^WORKSHOP-(\d{3})\.md$', f)
        if m:
            existing.append(int(m.group(1)))

next_num = max(existing) + 1 if existing else 1
print(f"{next_num:03d}")
```

## WORKSHOP 输出

checkpoint 在创建结束标记之前，必须先回顾本轮讨论的全部产出（由当前 TASK 的输入字段指定的当前 Vision 目录内 `C-NNN.md` 文件，以及当前 TASK 明确列入输入的同 Vision 历史 `WORKSHOP-NNN.md` 参照文件），生成完整输出物并写入 `.context/<Vision Id>/WORKSHOP-NNN.md`。

WORKSHOP 是当前 Vision 内会被保留并供后续接手的完整交付物，不是 `C-NNN` 的摘要，也不是关闭标记本身。checkpoint 应：

- 读取当前 TASK 指定的输入文件
- 确认输入文件位于当前 Vision 目录内
- 将当前 TASK 指定输入中的有效结论、方案、字段、SOP、状态矩阵、判定规则、停止条件、执行入口、人工验收点和后续接手方式合并与完整化
- 若当前 TASK 指定同 Vision 历史 `WORKSHOP-NNN.md` 作为结构参照或基线，读取它并对齐其覆盖度；成熟样板应达到类似 `WORKSHOP-001` 的完整章节深度（如 §0-§11，含字段表 / SOP / 状态矩阵 / 判定规则 / 停止条件）
- 将完整交付包写入 `.context/<Vision Id>/WORKSHOP-NNN.md`

checkpoint 的合并动作只写入新的 `WORKSHOP-NNN.md`，不得回头修改已有 `WORKSHOP-NNN.md`、`C-NNN.md` 或 `TASK-NNN.md`。如果历史产物本身需要修正，应由上游重新运行 workshop / workflow 生成新产物，而不是由 checkpoint 直接编辑原产物。

## 执行步骤

### 步骤 1：读取任务

读取当前任务文件，确认任务为结束标记操作，并根据当前 TASK 文件所在目录推导 Vision Id。

### 步骤 2：确定 WORKSHOP 编号

扫描当前 Vision 目录下已有规范 `WORKSHOP-NNN.md` 文件，按"WORKSHOP 编号机制"计算下一个编号 N。

### 步骤 3：生成 WORKSHOP 完整输出物

1. 读取当前 TASK 指定应读取的输入文件（如当前 Vision 目录内的 `C-NNN.md`，以及被当前 TASK 明确列入输入的同 Vision 历史 `WORKSHOP-NNN.md`）
2. 基于输入整合并完整化本轮讨论的全部有效结论与可执行细节
3. 将完整输出物写入 `.context/<Vision Id>/WORKSHOP-{N:03d}.md`

### 步骤 4：创建结束标记

1. 确认当前 Vision 目录 `.context/<Vision Id>/` 存在
2. 创建 `.context/<Vision Id>/.done/` 目录
3. 报告完成状态

### 步骤 5：停止

上述步骤全部完成后，checkpoint 必须立即停止。

## 约束

- 先输出 WORKSHOP，后创建 `.done/`；顺序不可颠倒
- 扫描编号时只关注当前 Vision 目录内的规范 `WORKSHOP-NNN.md` 文件，不与 C-NNN 或 TASK-NNN 编号混淆
- 仅读取当前 TASK 指定的输入文件，不读取其他 TASK 或未指定的 C-* 文件
- 不读取或写入其他 Vision Id 目录
- 不向 `.context/` 根目录创建 `WORKSHOP` 或 `.done`
- 不修改任何已有文件
- 不启动新的讨论循环
- 不创建新的 TASK 文件
- 不使用一位或两位数字编号创建 `WORKSHOP` 文件
