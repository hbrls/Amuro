# WORKSHOP-002 · GLNT-5 采集执行契约与前端遵守规则 — checkpoint 收束

> updated_by: Codex - GPT-5
> updated_at: 2026-07-06 11:31:36
>
> Vision Id: GLNT-5
> 视角：checkpoint
> 来源：TASK-011（GLNT-5），已整合 WORKSHOP-002 关键契约结果
> 主题：采集执行契约与前端遵守规则（编排 / 频率 / 状态机 / collect_instruction_snapshot 字段集）

---

## 0. 决断

- **是否结束：是**
- **核心理由**：WORKSHOP-002 的 7 个核心问题（Q1–Q7）已按主题 A→B→C 顺序推进，主题 A 关键问题 Q2（编排契约）、主题 B 关键问题 Q4（频率契约）、主题 C 关键问题 Q6（状态机 / 幂等）与 Q7（collect_instruction_snapshot 字段集）四份契约已收束为可派单契约（详见 §3–§6）。§11.2 与 USE-002 已显式登记 Q1 / Q3 / Q5 作为"预留接口 / 不阻塞派单"项，本轮不强制收束。
- **Vision Id**：GLNT-5
- **基准时间**：2026-07-02T12:23:00+08:00（Asia/Shanghai）
- **派单入口**：Q2 / Q4 / Q6 / Q7 契约可派单至前端 SDK owner、后端规则引擎 owner、后端业务接口 owner、落库 owner；派单范围与边界见 §11、§12。
- **仍未收束（预留接口）**：Q1 业务节点触发采集指令的方式、Q3 规则裁决引用字段、Q5 能力不可用 / 部分失败上报契约——三项不阻塞本轮派单，作为 USE-002 移交人工，留待 WORKSHOP-003 或后续轮次单独处理。

---

## 1. GLNT-5 Vision 背景与本轮定位

GLNT-5 的 Vision 目标是建设一套**可配置、可追踪、可扩展**的设备信息采集能力。本 Vision 暂不讨论用户授权、PII、合规限制，仅聚焦采集功能本身。

WORKSHOP-001 已交付 snapshot 采集的主体方案（4 张核心表：device_collect_task / device_basic_snapshot / device_app_snapshot / device_sms_snapshot），并把"采集指令获取、规则下发、前端执行、上报落库"这条链路标注为后续 WORKSHOP 的关键缺口。

WORKSHOP-002 把 GLNT-5 从"方案骨架"推进到"可派单的执行契约"。本轮目标是把"规则命中 → 前端执行 → 结果上报"链路上的契约固定下来，使下游可按契约分别派单至前端 SDK / 后端业务接口 / 后端规则系统 / 落库 owner。本轮不讨论规则内容本身、不讨论身份建模、不讨论合规授权。

---

## 2. 输入与产物范围

本 checkpoint 已整合当前 Vision 目录 `.context/GLNT-5/` 下的阶段性结论。`WORKSHOP-002.md` 是本轮最终产物；如历史 C 文件与本文件存在分歧，以本文件为准。

| 文件 | 角色 |
| --- | --- |
| `Index.md` | Vision 级 workshop 路线图：记录 `WORKSHOP-001`、`WORKSHOP-002` 等每轮讨论的方向和纲领 |
| `WORKSHOP-001.md` | 上轮 checkpoint 收束：snapshot 主体方案、4 张核心表、7 节点推荐矩阵、采集开关 / 失败策略 / 频率规则 |
| `TASK-011.md` | 本轮触发文件，调用 checkpoint 工作流 |

---

## 3. Q2 编排契约（采集接口 × 业务提交接口）

### 3.1 编排关系三档

| 档位 | 前端执行条件（来自采集指令） | 业务提交与采集的关系 |
| --- | --- | --- |
| `serial_collect_then_submit` | `orchestration_mode = serial_collect_then_submit` | 前端先执行采集，采集到达终态后再提交业务 |
| `serial_submit_then_collect` | `orchestration_mode = serial_submit_then_collect` | 前端先完成业务提交，业务提交完成后再触发采集 |
| `parallel_background_collect` | `orchestration_mode = parallel_background_collect` | 业务提交与采集均由前端发起；采集在业务主路径之外后台执行，业务提交不等待采集结果 |

三档由后端规则引擎在采集指令下发时通过 `orchestration_mode` 字段给出，前端按字段执行。后端可以按业务节点、规则版本、产品、渠道等条件决定本次下发哪一档；前端只消费最终下发的 `orchestration_mode`，不得参与编排裁决。

### 3.2 MUST

- **M1** 每次业务节点进入时，前端必须获取一次采集指令，且必须使用本次指令返回的 `task_id` 与 `orchestration_mode` 作为本次编排依据；不得用本地缓存或上次残留指令覆盖。
- **M2** `orchestration_mode = serial_collect_then_submit` 时，前端必须在采集接口返回终态（`success / partial_success / failed / skipped / expired` 之一）后，再调用业务提交接口；不得在采集未到达终态前提交业务表单。
- **M3** `orchestration_mode = serial_submit_then_collect` 时，前端必须先完成业务提交，再按采集指令触发采集；业务提交接口不得等待采集结果。
- **M4** `orchestration_mode = parallel_background_collect` 时，业务提交与采集均由前端发起；采集在业务主路径之外后台执行，业务提交接口不得等待采集结果。
- **M5** `orchestration_mode` 必须由后端规则引擎在采集指令下发时给出，且取值必须是 `serial_collect_then_submit` / `serial_submit_then_collect` / `parallel_background_collect` 三者之一；前端不得根据本地时间、网络条件、设备能力等私自推断编排关系。
- **M6** 采集超时上限必须由后端在采集指令中以 `collect_timeout_ms` 显式给出；前端不得使用未经指令授权的本地默认超时。
- **M7** 采集任务一旦创建即落库生成 `device_collect_task`；业务提交接口不得在没有关联 `task_id` 的情况下发起上报。
- **M8** 当前节点"必须等待采集完成后再提交业务"的唯一判定依据是 `orchestration_mode = serial_collect_then_submit`；除此之外，前端不得自行判定为阻塞式编排。
- **M9** 业务节点进入与采集指令获取必须在同一执行上下文内完成；前端不得跨业务节点沿用其它上下文中的采集指令。
- **M10** `collect_instruction_snapshot` 必须保存 `orchestration_mode` 字段，便于服务端复盘本次为何采用该编排。

### 3.3 MUST NOT

- **MN1** 前端不得私自把 `serial_submit_then_collect` / `parallel_background_collect` 改写为 `serial_collect_then_submit` 来"保证质量"；编排关系是后端契约，前端不可越权。
- **MN2** 前端不得在采集失败 / 超时 / 跳过时自动重试直到成功后才决定是否提交业务；采集失败的处理路径必须来自后端指令的 `failure_policy`，不允许前端自定义重试次数与放弃阈值。
- **MN3** 业务提交接口不得内嵌采集逻辑；业务表单与采集是两套独立契约，编排关系由前端在两者之间按指令粘合。
- **MN4** 前端不得把 `collect_instruction_snapshot` 当作开关配置主表使用；它只是规则命中结果快照，不参与编排判定。
- **MN5** 后端不得在采集指令中省略 `orchestration_mode`；缺失即视为契约违规，前端按"无可用指令"处理，不得自行补默认值或猜测编排模式。
- **MN6** 前端不得在 `parallel_background_collect` 模式下主动 await 采集接口；该模式下采集不得阻塞业务提交路径。
- **MN7** 业务提交接口不得因采集超时而返回业务错误；超时属于采集链路问题，不应传导到业务结果。
- **MN8** 后端不得在同一业务节点的同一次进入上下文内给出冲突的 `orchestration_mode`。

### 3.4 非法状态与处理

| 编号 | 非法状态 | 技术处理 |
| --- | --- | --- |
| T1 | `serial_collect_then_submit` 模式下，采集未到达终态就提交业务 | 前端不得发起业务提交；若业务接口收到未满足前置采集终态的提交，应按业务幂等规则拒绝或返回可重试错误 |
| T2 | `serial_submit_then_collect` / `parallel_background_collect` 模式下，业务提交路径等待采集结果 | 前端不得阻塞业务提交；采集结果只能通过独立上报通道提交 |
| T3 | 前端根据本地时间、网络条件、设备能力等改写 `orchestration_mode` | 前端必须丢弃本地改写结果，只能按后端指令执行 |
| T4 | 业务提交接口返回采集链路错误码（如 `COLLECT_TIMEOUT`、`COLLECT_FAILED`） | 业务接口不得把采集链路失败表达为业务失败；采集失败应落到采集任务状态与 `failure_policy` 路径 |
| T5 | 采集指令缺少 `orchestration_mode` / `collect_timeout_ms` / `task_id` 等执行字段 | 前端按无可执行采集指令处理，不得自行补默认值或创建本地任务 |
| T6 | 前端在采集失败时绕过 `failure_policy`，自定义重试次数、放弃阈值或提交策略 | 前端必须停止本地策略分支，回到后端指令给出的失败处理路径 |

### 3.5 技术落盘要求

- 后端下发采集任务时，必须把本次 `orchestration_mode`、`collect_timeout_ms`、`failure_policy` 与规则引用字段写入服务端任务记录或 `collect_instruction_snapshot`，用于解释本次编排选择。
- 前端上报采集结果时，只上报 `task_id` 与采集结果，不上报本地推断出的编排模式或频率判断。
- 后端写入终态时，应能从任务记录还原：本次采用哪一档编排、采集是否达到终态、失败处理路径来自哪个后端指令。
- `collect_instruction_snapshot` 只用于服务端复盘与审计，不参与前端运行时判定。

### 3.6 契约变更边界

- `orchestration_mode` 新增或改名会影响前端状态机、业务提交时序、采集上报链路与 `collect_instruction_snapshot` 字段解释，必须作为接口契约版本变化处理。
- 旧版客户端不认识新的 `orchestration_mode` 取值时，应按无可执行采集指令处理，不得猜测为任一已有模式。
- 服务端如需调整某节点的编排选择，只能改变后端下发的 `orchestration_mode`，不得要求前端用本地规则覆盖服务端指令。
- Q1 触发方式、Q6 任务状态机、Q7 `collect_instruction_snapshot` 字段集变化，会影响本节 M1 / M2 / M5 / M6 / M10 的执行路径；变更时应同步回写本文件。

### 3.7 与其他契约的依赖

- `orchestration_mode` / `collect_timeout_ms` 必须写入 `collect_instruction_snapshot`（Q7 M10）。
- "采集到达终态"依赖 Q6 状态机的六状态定义（§5）。
- "每次业务节点进入时获取一次采集指令"的触发时机与 Q1 有依赖，详见 USE-002。

---

## 4. Q4 频率契约（采集频率如何执行）

### 4.1 频率判定责任边界与时机

| 角色 | 责任 |
| --- | --- |
| 后端规则引擎 / 配置后台 | 唯一判定主体；按业务节点、规则版本、历史频次、强制突破条件决定本次是否需要采集 |
| 后端业务接口 / 设备采集服务 | 消费规则裁决，并折算为前端可执行的采集指令：需要采集则下发任务，不需要采集则不下发任务或返回 `required = false` |
| 前端 SDK | 只识别“是否需要采集”和采集任务本身；不理解、不计算、不缓存频率规则 |
| 服务端落库 | 保存服务端规则裁决摘要，供审计和复盘；不要求前端参与频率留痕 |

判定时机：

- **D1 默认**：采集指令下发时由后端规则引擎一次性判定。
- **D2 强制突破**：业务节点或风控事件命中强制突破条件时，由后端在规则裁决阶段覆盖历史频次；该原因只用于服务端复盘，不暴露为前端执行语义。
- **D3 不在前端再判**：前端进入业务节点后不二次判定频率，只按后端是否下发采集任务执行。

### 4.2 前端可见表达

| 字段 | 含义 |
| --- | --- |
| `required = true` | 本次需要采集；后端必须同时下发可执行的 `task_id`、采集类型、编排模式、失败策略和超时等字段 |
| `required = false` | 本次不需要采集；前端不得自行创建采集任务，也不需要知道跳过原因 |

前端可见字段只表达“本次是否需要采集”。频率命中、频率窗口、强制突破、跳过原因等规则语义不得作为前端执行字段下发。

服务端如需复盘频率命中原因，可在服务端规则日志或 `collect_instruction_snapshot` 中保存规则裁决摘要。该摘要只用于审计、复盘和指标分析，不参与前端运行时判断。

### 4.3 MUST

- **M1** 频率是否命中、是否跳过、是否强制突破，必须由后端规则引擎或配置后台判定；前端不得自行判定频率。
- **M2** 后端必须将频率裁决折算为前端可执行结果：`required = true` 时下发采集任务，`required = false` 时不下发采集任务。
- **M3** `required = true` 时，采集指令必须包含 `task_id`、采集类型、`orchestration_mode`、`failure_policy`、`collect_timeout_ms`、`task_ttl` 或等价有效期字段等执行字段；前端只按这些执行字段采集。
- **M4** `required = false` 时，前端不得创建本地采集任务、主动调用采集接口或上报任何采集终态。
- **M5** 强制突破历史频次只影响后端是否下发采集任务；前端执行契约只关心本次是否需要采集。
- **M6** 后端如需复盘跳过或强制突破原因，必须在服务端侧留痕；留痕字段不得成为前端运行时判断依据。
- **M7** 后端必须在 `collect_instruction_snapshot` 或服务端规则日志中保存频率裁决摘要，便于复盘为什么本次下发或未下发采集任务。
- **M8** 频率裁决摘要必须使用后端字段命名，如 `frequency_rule_id`、`frequency_rule_version`、`frequency_hit_reason`、`frequency_override_reason`；这些字段只供服务端复盘。
- **M9** 规则后台必须提供“频率规则模拟运行”能力，方便新规则上线前离线复盘。
- **M10** 后端必须在规则裁决日志中记录强制突破原因与原始频次窗口，便于服务端审计。
- **M11** 前端必须把 `required = false` 视为无采集任务，不展示“设备校验已跳过”等暴露规则语义的 UI。

### 4.4 MUST NOT

- **MN1** 前端不得根据本地时间、网络条件、设备能力或历史采集记录自行推断“本次不需要采集”。
- **MN2** 前端不得缓存任何频率规则结果，并据此跳过后续采集指令获取。
- **MN3** 后端不得下发频率规则细节作为前端执行字段。
- **MN4** 后端不得要求前端为“无需采集”的结果上报采集终态；未下发采集任务时没有前端采集任务生命周期。
- **MN5** 前端不得在 `required = false` 时上报采集终态或构造空采集结果；业务流程按无采集任务继续。
- **MN6** 后端不得把频率规则细节埋入 `orchestration_mode`；`orchestration_mode` 只表达采集任务已下发后的业务提交与采集编排关系。
- **MN7** 后端不得把频率判定下沉到前端或要求前端理解频率规则。
- **MN8** 前端不得在任何本地存储中保存频率规则结果，用于影响下一次是否采集。
- **MN9** 规则后台不得在同一节点的不同版本规则间切换频率口径时不做灰度；切版本必须灰度。

### 4.5 接口校验

- 获取采集指令接口返回 `required = true` 时，必须同时返回可执行采集任务字段，包括 `task_id`、采集类型、`orchestration_mode`、`failure_policy`、`collect_timeout_ms`、`task_ttl` 或等价有效期字段。
- 获取采集指令接口返回 `required = false` 时，不得返回 `task_id`，不得要求前端调用采集接口或上报采集终态。
- 前端请求采集指令时不得携带本地频率判断结果；后端不得信任前端传入的任何频率裁决。
- 采集上报接口只接受已下发的有效 `task_id`；未下发采集任务时，不存在前端采集上报。

### 4.6 服务端落盘要求

- 后端应在服务端侧保存频率裁决摘要，用于解释本次为什么下发或未下发采集任务。
- 频率裁决摘要至少应能关联到业务节点、规则版本、裁决时间和裁决结果。
- 若本次采集由强制条件触发，强制原因应进入服务端裁决摘要或 `collect_instruction_snapshot`，但不得进入前端执行字段。
- 频率裁决摘要只用于审计、复盘和指标分析，不参与前端运行时判断。

### 4.7 与其他契约的依赖

- `required` 与采集任务下发方式依赖 Q1（业务节点如何拿到采集指令）；若 Q1 决定由业务接口响应附带采集入口，则 `required` 的承载位置需在 Q1 口径下重新表述。
- `task_ttl`、规则引用字段等执行字段依赖 Q3 规则下发契约；若 Q3 调整字段命名或版本管理方式，本契约需同步更新。
- 服务端频率裁决摘要与 Q7 强耦合；若 Q7 不保存频率复盘字段，则该摘要应落到服务端规则日志而不是 `collect_instruction_snapshot`。
- Q4 不定义任务生命周期与幂等规则；这些问题由 Q6 状态机与幂等契约处理。
- 当前 Q4 契约对 Q1 / Q2 / Q3 / Q6 / Q7 存在隐式依赖；若任一相关问题后续调整口径，应同步更新本节 M2 / M3 / M6 的执行路径。
---

## 5. Q6 状态机契约（任务生命周期 + 幂等）

### 5.1 六状态定义

Q6 任务状态机面向 `device_collect_task` 一条记录的全生命周期，定义六个状态：

| 状态 | 含义 | 是否终态 |
| --- | --- | --- |
| `pending` | 任务已落库，前端尚未开始执行 | 否 |
| `success` | 全部采集类型成功完成 | 是 |
| `partial_success` | 部分类型成功，部分失败 / 未执行 / 不可用 | 是 |
| `failed` | 全部类型均失败 | 是 |
| `skipped` | 后端明确判定本次任务无需执行采集 | 是 |
| `expired` | 任务超过有效期未到达任何终态，被后端判废 | 是 |

六状态中 `pending` 为非终态，其余五种为终态。终态不可再向其他状态转换。

### 5.2 状态转换图

```
[create] → pending
pending → success / partial_success / failed / skipped
pending → expired
[end]
```

- `pending → success`：所有采集类型均完成且上报成功
- `pending → partial_success`：至少一种类型完成，至少一种类型失败 / 不可用 / 未执行
- `pending → failed`：所有类型均失败 / 不可用 / 客户端能力异常
- `pending → skipped`：后端明确判定本次任务无需执行采集
- `pending → expired`：超过 `task_ttl` 或 `collect_timeout_ms` 仍未到达终态，由后端判废

终态之间禁止转换。`success` / `partial_success` / `failed` / `skipped` / `expired` 一旦写入即固化。

### 5.3 终态判定原则

- 终态由"采集类型 × 上报结果"二维矩阵决定，由后端在任务终态写入时判定，前端只上报不判定终态。
- `partial_success` 必须显式列出成功与失败类型；不得用"成功 + 一个失败"隐式表达。
- `failed` 要求所有类型均失败；只要有一个类型成功就必须用 `partial_success`。
- `skipped` 仅在后端明确判定本次任务无需执行采集时使用；其他场景的"未执行"必须落到 `failed`。
- `expired` 由后端判废，前端不得自行把 `pending` 改写为 `expired`。

### 5.4 幂等与重复触发

#### 5.4.1 同一节点重复进入

- 同一业务节点重复进入时，前端仍必须重新请求采集指令；不得自行复用本地缓存的 `task_id`。
- 后端可基于幂等规则返回已有有效任务，也可创建新任务；前端只执行后端返回的结果。
- “复用”指后端返回已有有效 `device_collect_task`，沿用原 `task_id` 与 `collect_instruction_snapshot`，用于避免同一节点短时间内重复创建多个采集任务。
- 后端复用判定条件至少包含：业务节点标识相同、`device_collect_task.status = pending`、未超过 `task_ttl`、后端判定原任务仍可作为本次采集指令。

#### 5.4.2 同一任务重复上报

- 同一 `task_id` 的上报接口必须接受重试；写入时按"幂等键 + 状态机终态"判定。
- 终态未变时，接受重试但不改写终态。
- 终态冲突时，后端按幂等键与终态写入规则裁决，并保留冲突原因；不得回退已固化终态。
- 前端在 `pending` 状态可重试上报；终态写入后禁止再次修改。

#### 5.4.3 过期任务处理

- `task_ttl` 是 `device_collect_task` 的任务有效期，用于判定一个 `task_id` 是否仍可执行、上报或被后端返回为已有有效任务。
- `device_collect_task` 到达 `expired` 后，终态固化，不可再作为后端复用任务返回。
- 同一节点重新进入时，前端必须重新获取采集指令；是否创建新 `task_id` 由后端决定。
- `collect_instruction_snapshot` 或任务记录必须保留原 `expired_at` 与 `expired_reason`。

#### 5.4.4 异步重试的 task_id 处理

- 异步重试（`failure_policy = async_retry`）必须沿用原 `task_id`，不得创建新任务。
- 异步重试最多 N 次，N 由 `failure_policy.max_retry` 给出；超过 N 次后必须落到 `failed`。
- 重试期间状态保持 `pending`。
- 最后一次重试成功时，转 `success` 或 `partial_success`；最后一次失败时，转 `failed`。
- 异步重试间隔必须由 `failure_policy.retry_interval_ms` 给出，前端不得自定义。

### 5.5 MUST

- **M1** 任务一经创建即落库为 `pending`；前端必须在创建后立即可获取 `task_id`。
- **M2** 前端必须在采集到达终态后调用上报接口；不得在 `pending` 状态长期停留而无任何上报。
- **M3** `partial_success` 必须在 `collect_instruction_snapshot` 或 `device_collect_task` 字段中显式列出"成功的类型 / 失败或跳过的类型"。
- **M4** `failed` 仅在全部类型均失败时使用；只要有一种类型成功，必须用 `partial_success`。
- **M5** `expired` 必须由后端判定写入；前端不得自行将 `pending` 改写为 `expired`。
- **M6** 同一节点重复进入时，前端必须重新请求采集指令；后端必须基于幂等规则返回已有有效任务或创建新任务。
- **M7** 同一 `task_id` 的上报必须幂等；终态已写则接受重试不改写终态；终态冲突以"幂等键 + 既有终态"裁决，不得覆盖已固化终态。
- **M8** 异步重试必须沿用原 `task_id`；不得因重试创建新 `task_id`。
- **M9** 任务过期后再次进入同一节点，前端必须重新获取采集指令；不得自行沿用过期 `task_id`。
- **M10** 状态机终态固化；`success / partial_success / failed / skipped / expired` 之间不得互相转换。
- **M11** `collect_instruction_snapshot` 必须包含 `task_id` 与 `created_at`；终态写入时必须包含 `terminal_at` 与 `terminal_reason`。
- **M12** `task_ttl` 必须随任务创建写入或可由任务记录稳定推导；后端必须用它判定任务是否过期。
- **M13** `partial_success` 的类型清单必须区分"失败 / 不可用 / 未执行"三种原因；不可用属于能力问题，失败属于执行问题，未执行属于任务结果口径。
- **M14** 同一 `task_id` 的上报接口必须接受幂等键（如 `report_id`）作为去重依据，避免重试间互相覆盖。

### 5.6 MUST NOT

- **MN1** 前端不得自行判定终态；终态由后端在收到完整上报后写入。
- **MN2** 前端不得把 `failed` 当作"部分失败"的兜底；部分失败必须用 `partial_success`。
- **MN3** 前端不得私自把 `skipped` 用于"未执行"的任意场景；`skipped` 只能由后端按任务结果口径写入。
- **MN4** 前端不得使用超过 `task_ttl` 的 `task_id` 发起采集或上报；超时后由后端写入 `expired`。
- **MN5** 异步重试不得改变 `task_id`，也不得改变 `collect_instruction_snapshot` 中的编排 / 频率字段。
- **MN6** 前端不得因"上报超时"而重置终态；终态已写则禁止回退。
- **MN7** 后端不得接受 `pending → pending` 的重复写入；同一 `task_id` 的多次上报必须以"幂等键 + 终态判定"处理。
- **MN8** 后端不得在终态写入后修改 `created_at`；`created_at` 是任务生命周期起点，不可被终态写入覆盖。
- **MN9** 异步重试不得跨业务节点复用 `task_id`；一个 `task_id` 必须严格对应一个业务节点的一次进入。

### 5.7 非法状态与处理

| 编号 | 非法状态 | 技术处理 |
| --- | --- | --- |
| T1 | 前端使用超过 `task_ttl` 的 `task_id` 发起采集或上报 | 后端必须拒绝写入采集结果，并将任务判定为 `expired` 或返回任务已过期错误 |
| T2 | 终态写入后被再次覆盖（如 `success → failed`） | 后端必须保持已固化终态不变；重复上报只按幂等结果返回 |
| T3 | 同一节点重复进入时，前端自行复用本地 `task_id` | 前端必须重新请求采集指令；后端只接受本次指令返回的有效 `task_id` |
| T4 | 异步重试时创建了新的 `task_id` | 后端必须拒绝将该重试结果关联到新任务；异步重试只能沿用原 `task_id` |
| T5 | `partial_success` 未列出类型清单 | 后端不得写入 `partial_success` 终态；必须要求补齐类型结果或按完整结果重新判定终态 |
| T6 | `failed` 被用于部分失败场景 | 后端必须改判为 `partial_success`，并写入成功 / 失败 / 不可用 / 未执行的类型明细 |
| T7 | 前端私自上报或改写 `skipped` | 后端必须拒绝该状态写入；`skipped` 只能由后端按任务结果口径写入 |
| T8 | 同一 `task_id` 终态冲突未做幂等判定 | 后端必须以幂等键与既有终态为准，禁止直接覆盖终态 |
| T9 | 跨业务节点复用 `task_id` | 后端必须拒绝上报；一个 `task_id` 只能绑定一个业务节点的一次进入 |

### 5.8 技术落盘要求

- `device_collect_task` 必须保存任务生命周期字段，至少包括 `task_id`、`status`、`created_at`、`task_ttl`，以及终态写入时的 `terminal_at`、`terminal_reason`。
- `expired` 写入时必须能还原过期原因：超过 `task_ttl`、超过 `collect_timeout_ms`，或后端判定任务不再有效。
- 幂等写入必须保留幂等键与既有终态的匹配结果；终态冲突时不得覆盖已固化终态。
- 异步重试必须保存重试次数与最后一次结果，用于判断是否超过 `failure_policy.max_retry` 并落到 `failed`。

### 5.9 契约变更边界

- `task_ttl` 的命名、单位或计算方式变化会影响任务过期判定、后端复用判定和前端是否可继续上报，必须作为任务生命周期契约变化处理。
- 任务状态枚举新增、删除或改名会影响前端上报、后端终态判定、`collect_instruction_snapshot` 终态字段和下游消费，必须同步更新状态机转换规则。
- 幂等键策略变化会影响重复上报与异步重试处理；后端不得在未定义替代去重策略时移除幂等键。
- 服务端如需调整同一节点重复进入时返回已有任务还是创建新任务，只能改变后端裁决结果；前端不得本地复用 `task_id` 来模拟后端复用。

### 5.10 与其他契约的依赖

- 任务一经创建即落库与 §3 M7 一致；若 Q2 后续调整"无 task_id 不上报"的执行路径，本契约 M1 的执行时序需同步调整。
- `task_ttl` 超时定义任务生命周期有效期；若 Q3 的规则下发字段采用不同命名，本契约的过期判定需在 Q3 口径下重新对齐字段名。
- 复用 `task_id` / 重新创建属于后端幂等与任务生命周期问题；Q4 频率契约不定义该执行路径。
- 类型清单依赖 Q5 能力不可用 / 部分失败契约；若 Q5 决定不区分"失败 / 不可用 / 未执行"三种原因，M3 / M13 的清单粒度需重新设计。
- `collect_instruction_snapshot` 包含 `task_id` / `created_at` / `terminal_at` / `terminal_reason` 为 Q7 字段集设计的输入；若 Q7 决定不保存其中任一字段，本契约的留痕路径需重新表述。
- 幂等键 + 终态判定假定上报接口接受幂等键；若后续接口设计不接受幂等键，本契约的执行路径需替换为"时间窗去重"或等价方案。
- 当前 Q6 契约对 Q1 / Q2 / Q3 / Q4 / Q5 / Q7 存在隐式依赖；若任一相关问题后续调整口径，应同步更新本节 M1 / M2 / M5 / M6 / M9 / M11 / M12 的执行路径。

---

## 6. Q7 collect_instruction_snapshot 字段结构

`collect_instruction_snapshot` 是 `device_collect_task.collect_instruction_snapshot` 的 JSON 字段，不是独立表。它保存该采集任务创建时服务端下发的采集指令快照，用于还原本次任务的执行参数。

### 6.1 写入规则

- 创建 `device_collect_task` 时一次性写入创建期字段。
- `pending` 写入后，创建期字段不得被后续写入覆盖。
- 任务进入终态时，只允许追加终态字段。
- 前端不得构造、修改或依赖 `collect_instruction_snapshot` 作为运行时判定依据。
- `collect_instruction_snapshot` 不保存规则内容或其它后台配置原文。

### 6.2 字段结构

| 字段 | 类型 | 必填 | 写入时机 | 含义 |
| --- | --- | --- | --- | --- |
| `task_id` | string | 是 | 创建时 | 对应 `device_collect_task.id` |
| `business_node` | string | 是 | 创建时 | 业务节点标识，格式待 Q1 收束 |
| `trigger_context` | object | 否 | 创建时 | 触发上下文摘要，schema 待 Q1 收束 |
| `created_at` | timestamp | 是 | 创建时 | 任务创建时间 |
| `required` | bool | 是 | 创建时 | 本次是否下发采集任务 |
| `orchestration_mode` | string | 是 | 创建时 | Q2 编排模式 |
| `collect_types` | array&lt;string&gt; | 是 | 创建时 | 本次需采集的类型，枚举待 Q5 收束 |
| `failure_policy` | string | 是 | 创建时 | 失败处理策略 |
| `collect_timeout_ms` | int | 是 | 创建时 | 采集超时上限 |
| `task_ttl` | int | 是 | 创建时 | 任务有效期 |
| `rule_id` | string | 否 | 创建时 | 外部规则系统生成的雪花 ID，用于回查本次裁决来源 |
| `instruction_issued_at` | timestamp | 是 | 创建时 | 采集指令下发时间 |
| `terminal_at` | timestamp | 否 | 终态时 | 终态写入时间 |
| `terminal_reason` | string | 否 | 终态时 | 终态原因 |
| `collect_type_results` | object | 否 | 终态时 | 各采集类型执行结果 |
| `partial_success_type_breakdown` | object | 否 | 终态时 | `partial_success` 时的类型明细 |

### 6.3 技术校验摘要

- 创建期必填字段缺失时，不得创建可执行采集任务。
- `required = false` 时，不得写入前端采集任务生命周期字段，也不得要求前端上报采集终态。
- `task_id` 必须与 `device_collect_task.id` 一致。
- `required` 必须与本次采集指令一致。
- 终态字段只能在任务终态写入时追加；不得覆盖创建期字段。
- `collect_instruction_snapshot` 只用于服务端还原任务创建时的执行参数；运行时判定依据是采集指令本体与 `device_collect_task` 的状态字段。

---

## 7. 综合执行 SOP（跨契约整合）

本节把 Q2 / Q4 / Q6 / Q7 四份契约串联为端到端 SOP，覆盖业务节点进入 → 采集指令下发 → 前端执行 → 上报落库 → 终态判定。

### 7.1 SOP · 业务节点进入 → 采集指令下发

1. 业务系统进入关键节点（登录成功后 / 授信申请开始 / 授信资料提交前 / 授信审批完成后 / 用信申请开始 / 用信确认提交前 / 贷中复核或风险召回）。节点清单见 WORKSHOP-001 §5。
2. 设备采集服务调用后端规则引擎或风控策略平台，传入用户 ID / 业务节点 / 产品 / 渠道 / 操作系统 / 客户端版本。
3. 规则引擎按 §4.1 责任边界判定本次是否需要采集，并折算为前端可执行的 `required`。
4. 规则引擎按 §3.1 决定 `orchestration_mode`（`serial_collect_then_submit` / `serial_submit_then_collect` / `parallel_background_collect`）。
5. 规则引擎产出 `failure_policy`（`block` / `soft_skip` / `async_retry` / `fallthrough`）、`collect_timeout_ms`、`task_ttl`、`rule_id`、`instruction_issued_at`。
6. `required = true` 时，设备采集服务创建 `device_collect_task`，落库 `pending`，并在 `collect_instruction_snapshot` 一次性写入 §6 字段清单（12 个核心字段 + 可选字段）。
7. 设备采集服务返回采集指令给前端：`required = true` 时包含 `task_id` + 编排字段 + 失败策略 + 超时 + 有效期；`required = false` 时不得返回 `task_id`，也不得要求前端上报采集终态。

### 7.2 SOP · 前端执行

1. 前端按 §3.2 M1 获取本次采集指令，不沿用本地缓存或上次残留指令。
2. 若 `required = false`：前端不创建本地采集任务、不调用采集接口、不上报采集终态，业务流程按本节点原路径继续。
3. 若 `required = true`：前端按本次指令的 `task_id` 与 `orchestration_mode` 执行采集，受 `collect_timeout_ms` 与 `failure_policy` 约束。
4. 按 §5.4.4 异步重试规则处理 `failure_policy = async_retry`：沿用原 `task_id`，按 `retry_interval_ms` 间隔重试，最多 `max_retry` 次。
5. 同一业务节点重复进入时，前端重新请求采集指令；是否返回已有有效任务或创建新任务由后端裁决。

### 7.3 SOP · 上报落库 → 终态判定

1. 前端按 §5.4.2 上报：调用上报接口，携带 `task_id` + 幂等键（如 `report_id`）+ 各类型执行结果。
2. 后端按 §5.3 终态判定原则计算六状态之一（`success` / `partial_success` / `failed` / `skipped` / `expired`）。
3. 后端按 §6.1 / §6.2 在 `collect_instruction_snapshot` 追加 `terminal_at` / `terminal_reason` / `partial_success_type_breakdown`（仅 partial_success 时）。
4. 终态写入后，`device_collect_task.status` 与 `collect_instruction_snapshot` 终态字段固化，禁止互相转换（§5.5 M10 / §5.6 MN6）。
5. 后端按 §3 / §4 / §5 / §6 的技术校验要求拒绝非法上报或非法状态变更。

### 7.4 SOP · 过期与异常路径

| 触发条件 | 处理路径 |
| --- | --- |
| `pending` 状态超过 `task_ttl` | 后端写入 `expired`；同一节点再次进入时前端重新请求采集指令，由后端决定是否创建新 `task_id`（§5.5 M9 / M12） |
| 同一 `task_id` 终态已写，前端继续重试上报 | 接受重试但不改写终态；冲突时按幂等键与既有终态裁决（§5.4.2） |
| `failure_policy = async_retry` 超过 `max_retry` | 落到 `failed`（§5.4.4） |
| `failure_policy = block` 且采集超时 / 失败 | `serial_collect_then_submit` 模式阻断业务提交；`serial_submit_then_collect` / `parallel_background_collect` 模式业务继续 |

### 7.5 跨契约一致性约束

- `orchestration_mode`（Q2） + `required`（Q4） + 状态终态（Q6） + `collect_instruction_snapshot` 字段（Q7）必须保持术语与字段命名一致。
- 任一契约的字段命名变更应通过新的 C 文件或后续 WORKSHOP 讨论产物收束，不直接覆盖历史讨论结论。
- 同一业务节点的同一次进入上下文内不得给出冲突的 `orchestration_mode`；跨契约字段冲突应以服务端最终下发的采集指令为准，并在 `collect_instruction_snapshot` 留痕。

---

## 8. 字段总表（采集指令 + collect_instruction_snapshot + 任务状态）

### 8.1 采集指令下发字段（运行时执行依据）

| 字段 | 类型 | 必填 | 来源契约 | 说明 |
| --- | --- | --- | --- | --- |
| `task_id` | string | 是 | Q6 M1 | 任务唯一标识 |
| `orchestration_mode` | string | 是 | Q2 §1 | `serial_collect_then_submit` / `serial_submit_then_collect` / `parallel_background_collect` |
| `required` | bool | 是 | Q4 §2 | 是否需要执行采集；为 `false` 时不得返回 `task_id` |
| `collect_types` | array&lt;string&gt; | 是 | Q5（预留） | `basic_info` / `app_list` / `sms_list` 子集 |
| `failure_policy` | string | 是 | Q2 | `block` / `soft_skip` / `async_retry` / `fallthrough` |
| `collect_timeout_ms` | int | 是 | Q2 M5 | 采集超时上限（毫秒） |
| `task_ttl` | int | 是 | Q6 M12 | 任务有效期（毫秒） |
| `rule_id` | string | 否 | Q3 | 外部规则系统生成的雪花 ID，用于回查本次裁决来源 |
| `instruction_issued_at` | timestamp | 是 | Q6 M1 | 指令下发时间 |
| `max_retry` | int | 否 | Q6 §4.4 | 仅 `async_retry` 时填 |
| `retry_interval_ms` | int | 否 | Q6 §4.4 | 仅 `async_retry` 时填 |

### 8.2 collect_instruction_snapshot 字段（见 §6.2）

完整字段清单与必填约束见 §6.2。`collect_instruction_snapshot` 是留痕快照，不参与运行时判定（M11）；运行依据是 §8.1 字段。

### 8.3 任务状态字段（device_collect_task）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | bigint | 主键，与 `collect_instruction_snapshot.task_id` 一致 |
| `status` | varchar | `pending` / `success` / `partial_success` / `failed` / `skipped` / `expired`（Q6 §1） |
| `collect_types` | json | 与采集指令一致 |
| `collect_instruction_snapshot` | json | §6 字段清单 |
| `failure_reason` | varchar | 失败原因 |
| `requested_at` | datetime | 请求时间 |
| `completed_at` | datetime | 完成时间（终态写入时填） |
| `created_at` | datetime | 创建时间 |

### 8.4 上报接口字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `task_id` | string | 是 | 与 `device_collect_task.id` 一致 |
| `report_id` | string | 是 | 幂等键（§5.5 M14），用于去重 |
| `collect_type_results` | object | 是 | 各类型执行结果 |
| `collected_at` | timestamp | 是 | 采集时间 |

---

## 9. 状态矩阵（任务终态判定）

### 9.1 终态判定矩阵（采集类型 × 上报结果）

| `collect_types` | `basic_info` 结果 | `app_list` 结果 | `sms_list` 结果 | 终态 |
| --- | --- | --- | --- | --- |
| `[basic_info]` | success | — | — | `success` |
| `[basic_info]` | failed / 不可用 | — | — | `failed` |
| `[basic_info, app_list]` | success | success | — | `success` |
| `[basic_info, app_list]` | success | failed / 不可用 | — | `partial_success` |
| `[basic_info, app_list]` | failed | success | — | `partial_success` |
| `[basic_info, app_list]` | failed | failed | — | `failed` |
| `[basic_info, app_list, sms_list]` | success | success | success | `success` |
| `[basic_info, app_list, sms_list]` | success | success | failed / 不可用 | `partial_success` |
| `[basic_info, app_list, sms_list]` | success | failed | success | `partial_success` |
| `[basic_info, app_list, sms_list]` | failed | failed | failed | `failed` |
| 任意组合 | 超过 `task_ttl` 未到终态 | — | — | `expired`（后端判废） |

`partial_success` 的类型清单在 `collect_instruction_snapshot.partial_success_type_breakdown` 中显式列出（§5.5 M3），区分"成功 / 失败 / 不可用 / 未执行"三类原因。

### 9.2 required × 编排模式 决策表

| `required` | `orchestration_mode` | 前端行为 |
| --- | --- | --- |
| `false` | 不返回 / 不适用 | 不创建采集任务、不调用采集接口、不上报采集终态，业务流程按本节点原路径继续 |
| `true` | `serial_collect_then_submit` | 等待采集到达终态后再提交业务 |
| `true` | `serial_submit_then_collect` | 业务提交先完成，采集随后触发 |
| `true` | `parallel_background_collect` | 业务提交与采集均由前端发起，采集在业务主路径之外后台执行 |

### 9.3 失败策略 × 终态 决策表

| `failure_policy` | 终态 | 后续行为 |
| --- | --- | --- |
| `block` | `success` / `partial_success` | 业务提交继续 |
| `block` | `failed` / `expired` | `serial_collect_then_submit` 模式阻断业务提交；`serial_submit_then_collect` / `parallel_background_collect` 模式业务继续 |
| `soft_skip` | `failed` / `expired` | 业务提交继续，采集链路记录失败 |
| `async_retry` | `failed` | 沿用 `task_id` 重试，最多 `max_retry` 次 |
| `async_retry` | `success` / `partial_success`（重试成功） | 终态写入，重试结束 |
| `fallthrough` | 任意 | 业务提交继续，采集结果仅留痕 |

---

## 10. 判定规则与停止条件

### 10.1 关键判定规则

1. **编排判定**：唯一判定依据是 `orchestration_mode = serial_collect_then_submit`；其余模式不得自行判定为阻塞式编排（§3.2 M8）。
2. **频率判定**：唯一判定主体是后端规则引擎；前端 SDK 不得自行判断频率（§4.3 M1 / §4.4 MN1）。
3. **终态判定**：由后端在收到完整上报后写入；前端只上报不判定终态（§5.6 MN1）。
4. **幂等判定**：同一 `task_id` 的多次上报以"幂等键 + 终态判定"处理；终态已写则接受重试不改写终态（§5.5 M7 / §5.6 MN7）。
5. **字段判定**：`collect_instruction_snapshot` 的创建期必填字段缺一即视为契约违规（§6.2 / §6.3）。
6. **冲突裁决**：跨契约字段冲突（编排 / 频率 / 状态机）以服务端最终下发的采集指令为准，并在 `collect_instruction_snapshot` 留痕。

### 10.2 停止条件

WORKSHOP-002 checkpoint 已满足：

- Q2 编排契约（§3）：10 条 MUST / 8 条 MUST NOT，收束 `orchestration_mode` 的执行边界。
- Q4 频率契约（§4）：11 条 MUST / 9 条 MUST NOT，收束为后端裁决、前端只接收 `required = true/false`。
- Q6 状态机契约（§5）：14 条 MUST / 9 条 MUST NOT，收束六状态、幂等与 `task_ttl` 边界。
- Q7 字段结构契约（§6）：收束 `device_collect_task.collect_instruction_snapshot` 的 JSON 字段边界、写入规则与技术校验。

四份契约共同构成"采集执行契约"的派单依据，前端 SDK / 后端业务接口 / 后端规则引擎 / 落库 owner 可按各自规则集启动实现。

### 10.3 关键假设（沿用本轮目标澄清与 WORKSHOP-001 §11.2）

- **A1** 后端规则引擎或配置后台能稳定产出规则命中结果（采集类型 / 频率 / 失败策略 / 版本）。
- **A2** 同一业务节点不会并发进入；若会成立，幂等设计需更复杂（§5.4.1 复用策略需扩展）。
- **A3** snapshot 采集是单次、非流式；若改成流式，状态机和上报口径要重做。
- **A4** 前端能可靠地等待采集完成或在合理超时内放弃。
- **A5–A8** 见 WORKSHOP-001 §11.2（设备身份建模 / 客户端能力 / 风控消费 / 节点 6 阻塞等待 / PII / 频率规则 / 存储成本 / AppList 不拆明细）。

---

## 11. 不变量与留给后续 WORKSHOP

### 11.1 本轮不变量（保留）

- Q2 编排契约的 3 档编排关系 + 10 条 MUST + 8 条 MUST NOT（§3）。
- Q4 频率契约的后端频率裁决 + 前端 `required = true/false` + 11 条 MUST + 9 条 MUST NOT（§4）。
- Q6 状态机契约的 6 状态定义 + 14 条 MUST + 9 条 MUST NOT（§5）。
- Q7 `collect_instruction_snapshot` JSON 字段结构、写入规则与技术校验（§6）。
- `device_collect_task` 表结构（WORKSHOP-001 §3.1）+ 3 张 snapshot 表（WORKSHOP-001 §3.2–§3.4）。
- 7 节点推荐采集矩阵（WORKSHOP-001 §9）+ 失败策略 / 频率规则执行原则（WORKSHOP-001 §6.3 / §6.4）。
- 非目标边界（WORKSHOP-001 §10）。

### 11.2 留给后续 WORKSHOP（不阻塞本轮派单）

| 编号 | 内容 | 依赖来源 | 阻塞程度 |
| --- | --- | --- | --- |
| Q1 | 业务节点触发采集指令的方式（独立采集指令接口 vs 业务接口响应附带） | §6.2 / §11.3 | 不阻塞派单，留待 WORKSHOP-003 或后续 |
| Q3 | 规则裁决引用字段（`rule_id` 雪花 ID） | §6.2 / §5.10 | 不阻塞派单，留待 WORKSHOP-003 或后续 |
| Q5 | 能力不可用 / 部分失败上报契约（`collect_types` / `partial_success_type_breakdown` 字段粒度） | §6.2 / §5.5 M3 / M13 | 不阻塞派单，留待 WORKSHOP-003 或后续 |

### 11.3 Q1 / Q3 / Q5 字段在 `collect_instruction_snapshot` 的预留接口

`collect_instruction_snapshot` 已为 Q1 / Q3 / Q5 留字段：

- `business_node`（Q1）：来自后端业务接口响应附带 / 独立采集指令接口，Q1 收束后给出具体格式。
- `trigger_context`（Q1）：触发上下文摘要，Q1 收束后给出 schema。
- `rule_id`（Q3）：外部规则系统生成的雪花 ID，用于回查本次裁决来源。
- `collect_types` / `collect_type_results` / `partial_success_type_breakdown`（Q5）：Q5 收束后给出"失败 / 不可用 / 跳过"三原因的区分粒度。

当前契约已假定这些字段存在并能按预留规则保存；Q1 / Q3 / Q5 收束后由下一轮 pilot 回写本文件对应章节。

---

## 12. 后续接手方式

### 12.1 派单入口

WORKSHOP-002 checkpoint 完成后，下游进入实施派单阶段：

| Owner | 派单依据 | 派单范围 |
| --- | --- | --- |
| 前端 SDK owner | §3 / §4 / §5 / §7 | 按 `required` / `orchestration_mode` / 状态机执行采集、上报、重试；不自行判定频率 / 编排 / 终态 |
| 后端规则系统 owner | §3 / §4 / §6 / §7 | 下发 `required`、`orchestration_mode`、`failure_policy`、`collect_timeout_ms`、`rule_id`、`task_ttl` 等字段；task 侧只接收并执行裁决结果 |
| 后端业务接口 owner | §7 / §9 | 业务节点进入时调用规则引擎；返回采集指令；不参与判定频率 / 编排 |
| 落库 owner | §5 / §6 / §8 | `device_collect_task` 落库；`collect_instruction_snapshot` 写入与追加；终态判定与固化；幂等键去重 |
| 异步重试 owner | §5 §4.4 / §8.1 | 按 `failure_policy = async_retry` + `max_retry` + `retry_interval_ms` 执行异步重试 |

实施阶段应按 §8 字段总表产出 DDL 与接口契约；按 §9 状态矩阵产出终态判定逻辑；按 §10 判定规则与停止条件产出 owner 自测用例。

### 12.2 维护入口

- 调整 Vision 级 workshop 路线图或下一轮讨论纲领：修改 `Index.md`。
- 调整 Q2 / Q4 / Q6 / Q7 任一契约的规则：写入新的 `C-NNN.md` 或后续 WORKSHOP 讨论产物，由 pilot 重新调度 LENS 复审。
- 调整 WORKSHOP-002 总结：修改本文件；不回写历史 `C-*` / `TASK-*`。
- 处理 Q1 / Q3 / Q5 预留接口：在 `Index.md` 追加 `WORKSHOP-003`，创建空 `WORKSHOP-003.md`，开启下一轮讨论。

### 12.3 不写入本轮的内容

- 不重复 WORKSHOP-001 的 4 张核心表字段定义（详见 WORKSHOP-001 §3）。
- 不重复 WORKSHOP-001 的 7 节点推荐采集矩阵（详见 WORKSHOP-001 §9）。
- Q2 / Q4 / Q6 完整规则已分别并入 §3 / §4 / §5；Q7 最终字段结构以 §6 为准。
- 不预设 Q1 / Q3 / Q5 的结论（详见 §11.2 与 USE-002）。

---

# USE-002

> Target: 项目 / 业务 / 产品 / 客户端 owner

本轮 checkpoint 识别到三组预留问题：Q1 业务节点触发采集指令的方式、Q3 规则裁决引用字段、Q5 能力不可用 / 部分失败上报契约。Q1 已收束为独立原子采集指令接口；Q3 / Q5 仍需在后续轮次补齐字段格式、命名与可选值。

---

## Q1 业务节点触发采集指令的方式

### 技术结论

业务节点进入时，task 相关方应把采集指令获取建模为独立原子接口，例如 `GET /device/collect/instruction`。该接口返回本次业务节点的 `required`、`task_id`、`orchestration_mode`、`failure_policy`、`collect_timeout_ms`、`task_ttl`、`collect_instruction_snapshot` 等采集任务执行信息。

如果出于性能、端到端延迟或网关聚合考虑，将采集指令与业务接口响应合并返回，该合并只属于接口聚合层优化。对 `device_collect_task`、状态机、编排、频率裁决、上报与落库契约而言，采集指令仍应被视为独立原子接口结果，不与业务提交接口互相依赖。

### 技术边界

- task 相关方不得假设采集指令一定来自业务接口响应。
- 业务接口不得依赖采集任务终态来决定是否返回采集指令。
- 采集指令接口的输入应包含业务节点、用户上下文、产品、渠道、客户端版本等规则裁决所需信息。
- 采集指令接口的输出是后端裁决后的执行结果；前端只消费该结果，不参与频率或编排裁决。
- 接口聚合层可以把独立采集指令结果嵌入业务接口响应，但不得改变采集指令字段语义、任务生命周期或幂等规则。

### 仍需补齐

- `business_node` 的枚举、命名空间、长度与字符集。
- `trigger_context` 的 schema。
- 独立采集指令接口的请求 / 响应 JSON。

---

## Q3 规则裁决引用字段

### 技术结论

规则由外部规则系统负责。采集 task 不设计规则系统，不保存规则内容，也不解释规则内容；task 只执行外部规则系统已经裁决完成的采集指令。

如果采集任务需要冗余规则引用，只保存 `rule_id`。`rule_id` 是外部规则系统生成的雪花 ID，用于回查本次裁决来源；task 不保存规则内容。

### 技术边界

- `collect_instruction_snapshot.rule_id` 可作为可选冗余字段保存。
- `rule_id` 只用于服务端排查与回查外部规则系统，不参与前端运行时判断。
- task 不关心规则如何生成或同步；这些属于外部规则系统职责。
- 已创建的 `device_collect_task` 只保存创建时收到的裁决结果；外部规则后续变化不得反向修改已创建 task 的执行字段。
- 没有 `rule_id` 时，task 仍必须能按采集指令执行；不得因为缺少规则引用而让前端参与规则判断。

### 仍需补齐

- 外部规则系统的 `rule_id` 雪花 ID 类型、长度与序列化格式。
- `collect_instruction_snapshot.rule_id` 是否必填；如果必填，缺失时后端如何处理采集指令创建。

---
## Q5 能力不可用 / 部分失败上报契约

> Target: 客户端 owner / 数据平台 owner / 风控特征工程 owner

### 需要什么人工

客户端 owner 与数据平台 owner 决定：**采集能力不可用、采集为空、部分类型失败**的上报契约。`collect_instruction_snapshot.collect_types` / `collect_type_results` / `partial_success_type_breakdown` 字段已留位（§6.2 / §5.5 M3 / M13），但"失败 / 不可用 / 未执行"三种原因的区分粒度、采集类型的命名规范、各平台能力差异的契约表达尚未定义。

### 执行请求

请在 `Index.md` 追加 `WORKSHOP-003` 章节并创建 `WORKSHOP-003.md`，按以下格式明确 Q5 结论：

1. `collect_types` 枚举值：`basic_info` / `app_list` / `sms_list` 的命名是否调整（如 `device_basic` / `device_app` / `device_sms`）。
2. "失败 / 不可用 / 跳过"三原因区分粒度：
   - **失败**（执行问题）：采集过程出错、超时、上报失败。
   - **不可用**（能力问题）：iOS SmsList 平台不支持、Android 权限被拒。
   - **跳过**（任务结果）：后端明确判定本次任务无需执行采集。
3. `partial_success_type_breakdown` 的 schema：每类型一行，列出原因 + 错误码 + 错误描述。
4. 采集为空时的表达：成功采集但内容为空数组时如何上报（如 `raw_payload = []`，不进入 `partial_success`）。

### 完成判据

- `Index.md` 已追加 `WORKSHOP-003` 章节并包含 Q5 结论。
- `.context/GLNT-5/C-NNN.md`（Q5 LENS 输出）已给出 `collect_types` / `collect_type_results` / `partial_success_type_breakdown` 的 schema 与三原因区分粒度。
- `.context/GLNT-5/Index.md` 的"待澄清"段已记录本 USE 的回写结果。
- §5.5 M3 / M13 / §6.2 / §6.3 的依赖说明已在 Q5 收束后由后续 pilot 回写。

### 影响

- **阻塞主流程**：否
- **完成后下一步**：后续 pilot 重新调度一次 Q5 收束，复审 §5 / §6 依赖路径；客户端 owner 按更新后的能力差异契约实现。
- **未完成时策略**：不阻塞派单；客户端 owner 按 WORKSHOP-001 §6.4 + §5 已收束契约启动实现，"失败 / 不可用 / 未执行"三原因的区分在 Q5 收束前使用占位枚举。

---

## USE 回写要求

USE-002 过程产出的 Q1 / Q3 / Q5 收束结果应沉淀至后续 WORKSHOP-003（或独立 WORKSHOP）的输出文件；`Index.md` 只保留问题索引与方向性结论，不承载完整 USE 细节。回写时应同步更新本文件 §3 / §4 / §5 / §6 的依赖章节与本 WORKSHOP-002.md 的 §11.2 表格。

USE 完成判据中没有显式验证用户已读、已回写的环节；下游 cron 调度方（amuro）只负责把 Q1 / Q3 / Q5 三项 USE 移交人工，不做"是否已回写"的回环检查。

---

## checkpoint 收束确认

WORKSHOP-002 checkpoint 已完成：

- §0–§12 已完整化（含决断 / 概述 / 输入 / 编排契约 / 频率契约 / 状态机契约 / JSON 字段结构 / 综合 SOP / 字段总表 / 状态矩阵 / 判定规则 / 不变量与接手方式）。
- USE-002 已生成，包含 Q1 / Q3 / Q5 三个 USE 子章节，每个子章节带完整四段结构（需要什么人工 / 执行请求 / 完成判据 / 影响）。
- 派单依据已对齐至 §3 / §4 / §5 / §6；其中 Q2 完整规则已内嵌在 §3。
- 下游可按 §12 派单入口分别启动前端 SDK / 后端规则引擎 / 后端业务接口 / 落库 owner / 异步重试 owner 实施。
