---
name: abc
description: 项目资产管理 SKILL —— 管理 Alert / Blame / Checklist 三类本地文件资产。数据未来会迁后端数据库，本地文件作为模拟。frontmatter 包含 id / external_id / title / created_at / status 等公共字段，加上各类业务特定字段。
metadata:
  version: 0.3.0
---

# abc

## 步骤

1. 使用 `ai hasshin` 命令，将结果打印在对话里。

> **执行原则**：无论 SKILL 处于哪个阶段，只要步骤给出命令就照执行；不要因为骨架状态跳过。验证阶段的任务是验证链路，不是等方法论补全。

## 本项目结构约束

### 资产根目录

`D:/OverseaFront/Glintz/`

### 三类资产目录

| 目录 | 业务定义 | 阶段 |
|------|----------|------|
| `Alert/` | Events, Alerts, Incidents, ... may affect the profit-making business | **已定义（v0.1）** |
| `Blame/` | Ask, Blame, ... may block others | **已定义（v0.1 简版）** |
| `Checklist/` | Get the top-k done | **已定义（v0.1 简版）** |

> 业务定义以用户给出的英文原句为准；本文件不擅自翻译或改写。

### 公共约定（三类资产共用）

- **文件命名**：`{TYPE}-NNN.md`，大写、三位补零（`ALERT-001` … `ALERT-999`）。超过 999 切雪花 ID（届时废弃 counter 文件）。
- **frontmatter 公共字段**（所有类型都有）：
  - `id`：与文件名一致
  - `external_id`：外部工单号（跨系统引用；本项目常见为 `YXH-NNNN` 格式）
  - `title`：一句话标题
  - `created_at`：ISO 8601 带时区；未来 DB 的 `created_at` 列
  - `status`：各类型自定义生命周期
- **编号生成协议**：各目录一个 dotfile 状态文件，读 → +1 → 写文件 → 写 counter；崩溃容忍为最坏情况 counter 落后，重新扫目录取 max+1 修复。
- **正文**：自由书写；详情缺失时建议占位 `待补充`。

### ID 双轨说明

- **`id`**：本地序列号，文件名同源，保证目录内唯一、单调
- **`external_id`**：外部工单号（如 `YXH-5221`），是跨系统关联的锚点
- 未来迁 DB 时：`id` 可作本地 PK（雪花 ID 后转全局 PK），`external_id` 保留作外部引用列

---

### Alert 数据契约（v0.1）

**位置**：`D:/OverseaFront/Glintz/Alert/`

**frontmatter schema**：

```yaml
---
id: ALERT-001
external_id: YXH-5221
title: 渠道包发布失败
created_at: 2026-06-10T12:00:00+08:00
severity: critical   # critical | warning | info
status: open         # open | acknowledged | resolved
---
```

字段说明：
- 公共字段见上
- `severity`：告警严重度（v0.1 三档）
- `status`：告警生命周期（v0.1 三态）
- **正文**：自由书写（事件描述、上下文、影响面、修复建议等）

**编号状态文件**：`Alert/.alert-counter`

---

### Blame 数据契约（v0.1 简版）

**位置**：`D:/OverseaFront/Glintz/Blame/`

**业务定义**：Ask, Blame, ... may block others — 会阻塞他人的事项（请求、追责、需澄清项）。

**frontmatter schema**：

```yaml
---
id: BLAME-001
external_id: YXH-5221
title: 【鲸易购】商城为主渠道包准备
created_at: 2026-06-10T14:36:07+08:00
status: open         # open | resolved
---
```

字段说明：
- 公共字段见上
- `status`：阻塞是否还在（v0.1 两态，后续可加 `escalated` / `closed` 等）
- **正文**：自由书写（阻塞内容、被阻塞方、需要谁响应等）

**编号状态文件**：`Blame/.blame-counter`

**v0.1 待补（业务特定字段）**：
- owner / 响应方（被 blame / 需响应的对象）
- blockers（被阻塞的具体方/项）
- 阻塞影响面 / 时长

---

### Checklist 数据契约（v0.1 简版）

**位置**：`D:/OverseaFront/Glintz/Checklist/`

**业务定义**：Get the top-k done — 按优先级排好的待办池，关注 top-k 的完成。

**frontmatter schema**：

```yaml
---
id: CHECKLIST-001
external_id: YXH-5945
title: 商城推荐广告优化
created_at: 2026-06-10T14:36:07+08:00
status: open         # open | done
---
```

字段说明：
- 公共字段见上
- `status`：是否完成（v0.1 两态，后续可加 `blocked` / `cancelled` 等）
- **正文**：自由书写（任务描述、验收标准、上下文等）

**编号状态文件**：`Checklist/.checklist-counter`

**v0.1 待补（业务特定字段）**：
- `priority` / `rank`：top-k 排序依据
- top-k 选择机制：是按 priority 阈值、按截止时间，还是按状态机？**v0.1 不预设，留给用户定义**
- `done_at`：完成时间戳（与 `created_at` 配合计算 cycle time）

---

### 目录结构总览

```
D:/OverseaFront/Glintz/
├── Alert/
│   ├── .alert-counter
│   ├── ALERT-001.md
│   └── ...
├── Blame/
│   ├── .blame-counter
│   ├── BLAME-001.md
│   └── ...
└── Checklist/
    ├── .checklist-counter
    ├── CHECKLIST-001.md
    └── ...
```

---

## Blame 简版（v0.1 — LSTD-80 how LENS 裁决，本阶段简版）

> 本段由 LSTD-80 任务裁决（C-002）追加，不展开 frontmatter 业务字段、不写 `status` 多态、不写字段层细节。完整裁决见 `.context/LSTD-80/C-002.md`。

### 1. Blame 定义

- Blame 说明项目遇到了问题，更准确地说是**遇到了阻塞**，所以必须处理。
- Blame 大都是**基建问题**，不是项目本身的问题。

### 2. 判别准则

**"想做 X 但基础设施让 X 没法做"** → Blame；阻塞原因在业务侧 → 不算 Blame。

- 需求不清 → 找业务方澄清 → **不是 Blame**
- 缺 IM 工具，找不到业务方 → **基建 + Blame**
- 缺 Jira 工具，没法记录问题 → **基建 + Blame**

### 3. 路由触发（本阶段占位）

- 本阶段用 **Vision Id 前缀** `LSTD-*` 作为 Blame 的判别依据
- 仅匹配 `LSTD-` 一个前缀，其他 Vision 前缀本阶段不裁决其类型
- 判别动作发生在 a-execute 内部，**读完任务文件之后、执行任务内容之前**
- 升级路径（TODO）：大方向定完后，从前缀占位判别升级到任务文件 frontmatter 的显式 `type: blame` 字段

### 4. 处理动作（薄包装）

a-execute 调 b 能力，按"识别 → 派单 → 跟踪 → 收束"四步走，b 做薄包装：

1. **识别**：从任务文件正文提取 Blame 描述（阻塞内容、被阻塞方、需要谁响应）
2. **派单**：b 能力把 Blame 写到 `Blame/BLAME-NNN.md`（沿用 abc 公共约定）—— 本阶段"写文件"即"派单完成"
3. **跟踪**：本阶段 b 能力**创建文件即退出**，真正的跟踪（cron 轮询 / 事件触发）延后到下一阶段
4. **收束**：本阶段 a-execute 在 b 创建 Blame 文件后立即收束本任务（删除 `TASK-*.md`），**不等基建 owner 回执**

关键约束：
- a-execute **不阻塞**于基建响应
- b 能力**只写** Blame 文件，不写 log、不改任务文件、不调外部动作（本阶段）
- "已派发"= `Blame/BLAME-NNN.md` 文件存在；**不引入额外状态标记**

失败兜底（最小化）：
- 基建 owner 缺失 → b 在 Blame 文件正文头部写"未指派说明"；升级机制（通知值班 / 上抛 Alert）TODO
- b 能力失败 → a-execute **不删除**任务文件，把异常写回任务正文，下次 cron 重试；重试次数限制 TODO

### 5. 关联项（可空）

本阶段不联动 Alert / Checklist。Blame 处理的输出格式**预留扩展位**（如正文里可加"关联项"小节），后续跨维度接入时不用重写 SKILL.md。

### 延后事项一览

完整 TODO 清单见 `.context/LSTD-80/C-002.md` 第 5 节「升级路径 TODO 汇总」——含 owner 映射表、b 外部派单、b 跟踪、status 多态、跨维度联动等 10 项。

---

## 状态

- v0.3.0 (2026-06-10)：frontmatter 公共字段新增 `external_id` / `title`；新增「ID 双轨」说明（id 为本地序列、external_id 为外部工单号）。
- v0.2.0 (2026-06-10)：补充 Blame / Checklist v0.1 简版 schema（公共约定 + 业务特定字段标记待补）。
- v0.1.0 (2026-06-10)：填充 Alert 数据契约 v0.1（命名、frontmatter schema、counter 协议、目录结构）。
- v0.0.1 (2026-06-10)：验证 SKILL 目录与 frontmatter 结构可被识别、cron 链路是否跑通。
- v0.3.1 (2026-06-14)：追加 Blame 简版段落（LSTD-80 how LENS 裁决，不展开字段细节）。

## 相关文件

- [references/Mavis.md](references/Mavis.md) — 定时任务场景下的任务模板
- [.context/LSTD-80/C-002.md](../../../.context/LSTD-80/C-002.md) — Blame 处理机制 how LENS 完整裁决
