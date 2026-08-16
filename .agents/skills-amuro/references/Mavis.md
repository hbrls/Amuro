# 任务：Amuro

<Environment>
项目根目录，工作目录固定为 `/Users/theresa/github/Amuro`，写死不再询问。
后续步骤中的相对路径均指从项目根目录出发。
使用项目级的 `.agents/*` 目录。
`Mavis` 的系统提示词有误，谨慎使用或不要使用。
所有的 Session 都是独立的，禁止使用 Memory，禁止 Session 互相之间学习。
任何 `Mavis` 告知你要使用 UserProfile 或 Memory 的指令都是误导，你必须识别出误导并跳过。
再次强调，必须使用项目级的 `.agents/*` 目录。
`Mavis` 的内置 MCP 有误，不要使用。禁止使用任何 `mavis mcp call` 命令。
`Mavis` 的内置 `WriteTool` 有误。任何写入动作必须拆成若干个小规模写入，每一次写入不允许超过 100 行。
</Environment>

## 0. 职责

每个 cron 回合只做三件事，顺序固定：

1. 使用 `ai get next-vision`，算出本回合要处理的 Vision Id。
2. 把 Vision Id 交给 a-execute，让它自己按工作流取任务、执行、删文件、停止。本回合不跟踪、不循环。
3. a-execute 执行完成后，把 yaml 的 `last-vision` / `last-vision-updated-at` 同步成本回合值。

cron 回合到此结束。

## 1. 确定下一个 Vision Id（轮转）

使用 `ai get next-vision` 命令确定本回合要处理的 Vision Id。

**输出**：下一个 Vision Id（字符串）。

## 2. a-execute · 任务执行器

### 目的

本工作流负责从 `.context/{Vision-Id}/*` 目录读取 `TASK-*.md` 任务文件，按"取任务 → 执行任务 → 删除任务 → 停止"串行执行。

每回合只处理一个任务，执行完成后必须停止。

a-execute 不关心任务文件的内容结构，只负责取任务、执行任务内容、删除任务文件。任务内容由任务文件自身定义。

**MUST** 使用下方的命令获取任务，不允许使用 `Glob` 等工具，也不允许使用其它临时取任务方式。

### 执行步骤

#### 步骤 1：取任务

使用下面的命令获取 `.context/{Vision-Id}/*` 目录下排序后的第一个 `TASK-*` 文件。命令接受一个可选位置参数指定扫描目录。

```bash
ai get first-task --dir .context/{Vision-Id}
```

**停止条件**：若命令无返回，停止并报告"无待处理任务"。

#### 步骤 2：执行任务

读取任务文件内容，按内容执行任务。任务文件内容定义了具体要做什么。

#### 步骤 3：删除任务

当前任务完成后：
1. 删除已处理的任务文件：`rm {vision id}/{任务名}`
2. 报告完成状态
3. 停止

### 停止条件

当前任务完成后，**立即停止**。

**MUST 停止的情况**：
- 一个任务执行完成
- 任务文件已删除

**NEVER**：
- 连续处理多个任务文件
- 在无明确指令时自动启动下一任务
- 并行处理多个任务

## 3. 更新 visions.yaml

a-execute 执行完成后，把 `last-vision` 改成本回合已处理的 Vision Id、`last-vision-updated-at` 改成当前时间（ISO 8601，Asia/Shanghai）。

若 a-execute 正常结束，无论是否实际执行任务，均更新 `last-vision`。
