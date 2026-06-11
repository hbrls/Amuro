# WORKSHOP-001 · Amuro 总项目「推进所有子项目」机制设计

> 讨论周期：C-001 ~ C-007（goal → pilot → scope → pilot → risk → pilot → actor）
> 输入文件：`.context/LSTD-1234/C-001.md` ~ `.context/LSTD-1234/C-007.md`
> 任务起点：`.context/LSTD-1234/Index.md` ·「为 Amuro 总项目设计并落地推进所有子项目的机制」
> 计划元数据：PLAN-101

---

## 1. 本轮讨论的目标

Amuro 是一组并行的真实子项目（LLM wiki、设备指纹算法、cf workflow 迁移……）。本仓库作为**总项目**，目标是：

> **管理所有子项目的进展，并主动推动它们继续前进。用尽一切方法去推进项目，推进所有项目。**

用户约束：
- 不局限于既有的 "leads 管理" 范式；
- 鼓励多样化、有创意的推进方法；
- 评判标准是「是否真的推动了子项目向前走」。

本轮讨论的目的是：完成机制的**立项澄清**——给出目标定调、动作边界、风险对策、执行主体配置，为后续 C-002（方法库）/ C-003（机制草案）/ 试运行阶段提供稳定输入。

---

## 2. 讨论链条与节奏

| 轮次 | 视角 | 文件 | 关键产出 |
|------|------|------|---------|
| C-001 | goal LENS | `.context/LSTD-1234/C-001.md` | 目标锚点（一句话） + 三原则 + 两拒绝项 |
| C-002 | pilot | `.context/LSTD-1234/C-002.md` | 选定 scope 为 P0，继续讨论 |
| C-003 | scope LENS | `.context/LSTD-1234/C-003.md` | 动作空间 5 项允许集合 + 4 条硬约束 |
| C-004 | pilot | `.context/LSTD-1234/C-004.md` | 选定 risk 为 P1，继续讨论 |
| C-005 | risk LENS | `.context/LSTD-1234/C-005.md` | 10 项风险 + P×S 排序 + 9 类 kill-switch |
| C-006 | pilot | `.context/LSTD-1234/C-006.md` | 选定 actor 为 P1 次项，继续讨论 |
| C-007 | actor LENS | `.context/LSTD-1234/C-007.md` | 三池协作 + 27 格角色矩阵 + K-9 X=18h/周 |

讨论节奏：**LENS（实质澄清）→ pilot（收束评估）→ 决策下一 LENS**，三步循环；每轮 pilot 严格按"是否阻塞 MVP 试运行"重排优先级，避免提前锁定 LENS 链。

---

## 3. 累计共识（可作为后续阶段的稳定前提）

### 3.1 目标锚点（C-001 §5.1）

> **Amuro 总项目 = 一台推进引擎，目标是缩短子项目「从想到做」的等待时间，方法库开放、信号驱动、强制收束。**

唯一硬指标：**子项目下一可观测进展的等待时间是否缩短**。

### 3.2 三条原则 + 两条拒绝项（C-001 §5.2 / §5.3）

原则：
1. 观测先于行动（无可观测证据不触发推进动作）；
2. 方法库不锁定（任何单一方法包括 leads 不得成为唯一通道）；
3. 每轮推进必须收束（动作发出后必须有可验证反馈）。

拒绝：
- ❌ 管理框架化（不输出 PMO/看板/Gantt）；
- ❌ 目标漂移（不以"机制是否完善"为成功标准）。

### 3.3 动作边界锚点（C-003 §5.1）

> **Amuro 对子项目的动作空间 = `{只读观测, 提 issue, 留 comment, 提 PR, 发外部信号}`，默认全异步、非阻塞、owner 决策权不可让渡；越界动作必须显式授权、必须有时窗、必须可回退。**

四条硬约束：
1. 写权限默认零（不持 push / 合并 / 改设置权）；
2. 决策权不可让渡（owner 优先，Amuro 无否决权）；
3. 信息流入最小化（只采公开 + owner 自报，owner 可 opt-out）；
4. 默认异步非阻塞（同步介入是 owner 显式请求触发的例外）。

渐进授权机制：L0 冷启动 → L1 信任建立 → L2 主动推进 → L3 深度协作。

### 3.4 风险态势（C-005）

- **10 项合并后风险**：MR1 推进空转、MR2 owner 反感、MR3 方法无主线、MR4 总项目失维、MR5 协调成本失控、MR6 越权、MR7 opt-out 误伤、MR8 代决滑坡、MR9 采集失控、MR10 信任反噬；
- **排序**：0 P0 / 9 P1 / 1 P2 / 0 无解；
- **对策**：9 项 P1 风险均有「预防 + 检测 + 回退」三段式对策，全部落在 C-003 §5.1 5 项允许集合内；
- **9 类 kill-switch**：K-1 ~ K-9（指标型 K-1/K-2/K-4、事件型 K-3/K-5/K-6/K-7/K-8、预算型 K-9）；触发后 90 天决策窗口（T+0/T+7/T+30/T+60/T+90），K-8 数据红线有独立快通道。

### 3.5 执行主体配置（C-007）

> **Owner Pool（2 primary + 1 backup）+ Reviewer Pool（最小 3 人，与 owner 物理分离）+ Bot-Operator Pool（最小 2 人）+ Agent Fleet（L0/L1 全自主 / L2/L3 必经人工 review）。**

四条硬约束：
1. 三池物理分离（无人员复用）；
2. L2/L3 人工 review 不可绕过；
3. owner 集体决议 + 外部仲裁背书（T+30/T+60/T+90 决策均需 ≥ 2/3 owner 通过）；
4. 轮值与降级显式化（14 天失联备援，30 天全失联启用 agent-as-owner 降级，仅在 MR4 yellow/red alert 时）。

工时分配：Agent 14h/周 + 人工 9.75h/周 + 混合 0.5h/周 = ~24.25h/周；**K-9 周预算 X 初值 = 18 小时/周**。

`AMURO_MAINTAINERS.yaml` schema 草案已就位（C-007 §3.2）。

---

## 4. 已回答的核心问题（对 current-task.md 的回应度）

| 待澄清问题 | 累计回应位置 | 回应度 |
|-----------|------------|--------|
| 「推进」在本项目语境下到底意味着什么？ | C-001 §核心问题1（可观测前进步骤） | **充分** |
| 总项目与子项目的接口边界在哪里？ | C-003 §5.1（动作空间 5 项） + C-007 §2（27 格角色矩阵） | **充分** |
| 一个「推进方法」要满足哪些最低标准？ | C-001 §5.2 三原则 + C-003 边界约束 | **原则 + 边界充分**，方法清单待 C-002 阶段 |
| 失败/停滞的子项目如何处理？ | C-003 §2.4 代决机制 + §2.3 opt-out + C-005 §3 MR8 / C-007 §3.3 接管 | **充分** |
| 总项目本身的成功标准是什么？ | C-001 §核心问题3（唯一硬指标） | **充分** |

---

## 5. 未完成 / 下放的工作

按"是否阻塞 MVP 试运行"排序：

| 优先级 | 缺口 | 建议承接 |
|--------|------|---------|
| P2 | 方法库具体清单 + 互斥/顺序/独立标注 + MR3 主方法身份指派 | C-002（方法库枚举） |
| P2 | 可观测前进步骤的量化口径、月度越界率 / PR 接受率 / 投诉率指标、K-2/K-4/K-9 阈值锁定、K-9 X 最终值 | KPI LENS |
| P3 | 催办频率 / 投诉通道形式 / 公开道歉边界 / agent-as-owner 降级伦理 | norm LENS |
| P3 | `SUBPROJECT_TRUST.yaml` schema、`AMURO_PROXY_DECISIONS.log` 模板、信号健康度仪表盘、协调工时监控实现 | C-003（机制草案） |
| —  | 首月试运行后周工时实测校准、agent-as-owner 沙盒演练、K-N 监测阈值实测 | 试运行阶段 |

**当前阶段结束位置**：「立项 + 目标 + 边界 + 风险量化 + 对策化 + 执行主体配置」全链路闭环完成。「方法库 + 机制草案 + 试运行」尚未开始。

---

## 6. 关键决策与拒绝清单

### 6.1 关键决策

- **不采用 leads 管理范式作为唯一通道**（C-001 §5.2 第 2 条）；
- **不持子项目 push 权**（C-003 §5.1）；
- **owner opt-out 不产生负面后果**（C-003 §2.3）；
- **代决仅 2 类场景**：代填默认值 + 冷库化建议（C-003 §2.4）；
- **kill-switch 触发后 90 天内必须决策恢复或下线**，K-8 数据红线无快速恢复通道（C-005 §4.3）；
- **三池物理分离**（C-007 §0 第 1 条）；
- **K-9 X = 18h/周**（C-007 §6.4）。

### 6.2 显式拒绝清单（跨 LENS 汇总）

- ❌ 管理框架化（C-001）
- ❌ 目标漂移（C-001）
- ❌ 自动化越权（C-003）
- ❌ 沉默 = 同意（C-003）
- ❌ 零风险幻觉（C-005）
- ❌ 对策越界（C-005）
- ❌ agent 化一切（C-007）
- ❌ owner 独裁（C-007）

---

## 7. 关键假设链（任一证伪需回溯）

| 来源 | 假设要点 | 备选 |
|------|---------|------|
| C-001 A1~A6 | 子项目状态可观测 / owner 愿意配合 / 多样化方法可控 / 异步可行 / 总项目有投入 / N 可分层 | 各自有备选降级 |
| C-003 B1~B8 | 子项目多数公开 / PR 流程可用 / API 稳定 / 一次授权可用 / opt-out 不成主流 / 代决不滑坡 / N<50 | 各自有备选 |
| C-005 K1~K10 | 对策检测段数据可低成本采集 / 投诉通道可工作 / 主+辅可识别主线 / 维护工时下限够 / N<30 / 越权可检测 / 代决可审计 / 物理隔离可执行 / 双 review 可承担 / kill-switch 可执行 | 各自有备选 |
| C-007 A1~A6 | Owner Pool 至少 3 名 human owner / 三池物理分离 / agent runtime 白名单可强制 / 工时可采集 / 外部仲裁 7 天到位 / Agent 工时可被人工兜底 | 各自有备选 |

---

## 8. 本轮讨论的元层反思

- **节奏稳定**：每轮 LENS 之后必有 pilot 收束，没有跳过结构性判断；
- **范围自律严**：每个 LENS 都显式列出"不在本 LENS 范围"的下放问题，未越界；
- **拒绝项对称**：每个 LENS 都给出"显式拒绝清单"，与"允许清单"对偶；
- **可引用性高**：C-001 / C-003 / C-005 / C-007 的 §5.1 / §5.1 / §7.1 / §9.1 均为可被下游直接引用的一句话锚点；
- **未触发 checkpoint 直至本轮**：C-002 / C-004 / C-006 三次 pilot 收束均判定"继续讨论"，本轮（C-007 完成后）由用户显式请求结束。

---

## 9. C-007 行动建议明细（actor LENS 落地稿）

> 本节是从已删除的 `C-007.md` 抽取并保留下来的**可执行行动建议**，作为下一阶段（C-002 方法库 / C-003 机制草案 / 试运行）的输入清单。

### 9.1 三池 + Agent Fleet 组织结构

```
Owner Pool          Reviewer Pool        Bot-Operator Pool       Agent Fleet
2 primary           ≥ 3 人（独立 on-     ≥ 2 人（runtime          L0/L1 自主
+ 1 backup          call / 季度复用 /     权限唯一持有者）         L2/L3 必经
≥ 3 人              T+7 应急储备）                                人工 review
```

硬约束：**三池物理分离**（无人员复用），违反时必须显式披露 + 计入 MR8 事件簿。

### 9.2 对策执行主体角色矩阵（27 段汇总）

9 项 P1 风险 × 3 阶段（预防 / 检测 / 回退）= 27 段对策；执行人类型分布：

| 主体类型 | 段数 | 占比 |
|---------|------|------|
| Agent 自动化（A） | 2 / 27 | 7.4% |
| 人工触发（H） | 6 / 27 | 22.2% |
| 混合（M，Agent 产物 + 人工 review） | 19 / 27 | 70.4% |
| 其中"不可委托" | 11 / 27 | 41% |

关键分配示例：
- **MR1 推进空转**：M / 每日采集 + 季度核验 + 7/30/60 天回退；季度核验不可委托；
- **MR2 owner 反感**：M / M / **H**；投诉回执必须 reviewer 7 天内人工；
- **MR3 方法无主线**：M / **A** / M；主方法重选需 Owner Pool 决议；
- **MR4 总项目失维**：M / M / **H**；yellow/red alert 决议不可委托；
- **MR6 越权**：M / M / M；白名单维护必须 owner PR + reviewer 签字；
- **MR9 采集失控**：M / M / M；物理白名单配置需 Bot-Operator + Reviewer 双签；
- **MR10 信任反噬**：**H** / M / **H**；L2/L3 PR 人工 review 不可委托。

### 9.3 `AMURO_MAINTAINERS.yaml` Schema 草案

> 存放位置：Amuro 总项目根目录；更新方式：每次 owner 变动提交 PR + CI 校验；强制要求：文件变更必经 Reviewer Pool 至少 1 人 review。

```yaml
version: 1
last_updated: <iso-8601-date>

maintainers:
  # === Owner Pool（2 primary + 1 backup）===
  - id: O001
    name: <string>
    role: primary-owner           # primary-owner | backup-owner | reviewer | bot-operator
    contact: {email: <email>, im: <im-handle>}
    responsibility:
      mr_ids: [MR4, MR5, MR10]    # 重点负责的对策
      methods: []
    backup_for: null
    rotation_cycle: 4w
    active_since: <iso-date>
    last_active: <iso-date>       # 由 agent 自动更新
    timezone: Asia/Shanghai
    oncall_window:
      - start: <iso-datetime>
        end: <iso-datetime>

  # === Reviewer Pool（独立于 Owner Pool，物理隔离）===
  - id: R001
    role: reviewer
    responsibility:
      review_cycles:
        - daily-audit-MR6
        - quarterly-self-check-MR1
        - quarterly-proxy-audit-MR8
        - incident-diagnosis-T7
    rotation_cycle: 12w

  # === Bot-Operator Pool（runtime 权限唯一持有者）===
  - id: B001
    role: bot-operator
    responsibility:
      bot_ids: [amuro-bot, amuro-scanner, amuro-collector]
      physical_whitelist_endpoints: [api.github.com, api.gitlab.com]
    rotation_cycle: 4w

pools:
  owner_pool: [O001, O002, O003]            # 最小 3 人
  reviewer_pool: [R001, R002, R003]         # 最小 3 人
  bot_operator_pool: [B001, B002]           # 最小 2 人

escalation:
  owner_primary_chain: [O001, O002, O003]
  reviewer_on_call: R001
  bot_operator_on_call: B001
  fail_safe_order:
    - owner_primary_chain: O001 -> O002 -> O003
    - reviewer_pool: R001 -> R002 -> R003
    - external_arbitrator: <org-name>

opt_out_policy:
  owner_grace_period_days: 14
  owner_cool_down_days: 30
  reviewer_quarantine_days: 90
```

### 9.4 owner 失联（14 天无响应）接管协议

```
[14 天失联判定] （Bot-Operator Pool 自动判定）
   ↓
T+0   通知 backup owner + Reviewer Pool on-call
   ↓
T+1   backup 确认接管；启动代签机制（仅限 14 天应急窗口）
   ↓
T+7   backup 提交「临时 owner 任命」PR
   ↓
T+14  原 owner 仍未响应 → backup 正式接管，yaml 更新
   ↓
T+30  原 owner 永久失联 → 空缺补位流程（30 天公示 + 集体决议）
```

补充规则：
- 14 天内原 owner 恢复：原 owner 复职，backup 退出代签；
- 14–30 天 backup 接管：原 owner 需补签所有代签动作方为有效；
- 30 天后：原 owner 视为退出。

### 9.5 「agent-as-owner」降级路径（兜底，非默认）

**触发条件（必须 4 个全部满足）**：
1. Owner Pool 全部失联 ≥ 30 天；
2. Reviewer Pool 中至少 1 人仍可响应；
3. Bot-Operator Pool 中至少 1 人仍可响应；
4. 外部仲裁方在 7 天内未到位。

**降级形态**：
- agent 仅维持 L0 只读观测 + 紧急 freeze；**不允许任何 L2/L3 写入**；
- on-call reviewer 担任"监护者"，对 agent 紧急动作有 24 小时 veto 权。

**退出条件**：
- 任意 1 名 human owner 上线 → 立即退出；
- Reviewer Pool 全失联 → 立即触发机制归档（不进入更深的 agent 自主）。

### 9.6 独立 reviewer 任职资格与回避规则

**任职资格清单**（最低 / 推荐）：
- 利益关联：与 Amuro 无经济利益 / 与被审子项目无代码贡献历史；
- 资历：≥ 3 年开源协作 / ≥ 1 年 Amuro 观察期；
- 技术能力：熟悉 Git/PR review / 熟悉 GitHub Actions + 审计日志；
- 中立性：与 Owner Pool 成员无亲属/雇佣/投资关系 / 与 Owner + Bot-Operator Pool 三年内无合作；
- 响应能力：14 天内响应紧急审计 / 7 天内响应（T+7 诊断窗口）；
- 体力：单次审计 ≤ 4 小时 / ≤ 2 小时；
- 语言：中/英可读 / 双语可读。

**回避规则**（强制换人 vs 披露不换人）：
- 强制换人：代码贡献历史（12 月内）/ 亲属雇佣投资 / 12 月内合作发表 / 12 月内曾被该 owner 投诉；
- 披露不换人：仅社交关系（非利益关联）→ 写入审计备注。

**reviewer 池复用规则**：
- 每日越权审计（MR6）：不可复用，必须独立 on-call；
- 月度数据流审计（MR9）+ 季度审计（MR1 / MR8）：可复用；
- T+7 诊断 / T+30 验证 / T+60 试运行评估：T+7 与 T+30 必须不同人；
- 最小池规模 = 3 人（1 on-call + 1 季度复用 + 1 应急储备）。

**reviewer 失职处置**：
- 单次未发现已知问题 → yellow card；
- 连续 2 次 → red card + 暂停 90 天；
- 连续 3 次 → 永久移除 + 公开披露 + 计入 K-7 候选事件；
- 故意隐瞒 → 立即永久移除 + 触发 MR8/MR10 联合事件；
- 失联 14 天 → 按 §9.4 同等协议启动备援。

### 9.7 kill-switch 五段窗口执行人映射

| 阶段 | 决策权 | 主要执行人 | 是否可委托 |
|------|--------|----------|-----------|
| **T+0 自动 freeze** | Bot-Operator 自动 + Owner 任 1 人手动确认 | Bot-Operator on-call 通知所有子项目 owner | 监测/freeze 可委托；人工通知不可 |
| **T+7 诊断** | Reviewer Pool on-call（不可与 owner 复用）+ 外部仲裁备援 | Reviewer 撰写 + Owner 1 人复核 | 撰写可委托助理；签字不可 |
| **T+30 修复** | Owner Pool 集体决议（≥ 2/3） | Bot-Operator 执行技术修复 + Owner 协调跨子项目沟通 | 技术修复可委托；方案批准不可 |
| **T+30 验证** | Reviewer Pool 指定人（与 T+7 不同人） | Reviewer 抽样验证 | 抽样可委托；签字不可 |
| **T+60 试运行** | Owner Pool 集体决议选范围；采纳权 = Owner + Reviewer 联合签字 | Bot-Operator + 子项目 owner 联合执行 | 监控可委托；范围/采纳不可 |
| **T+90 决策** | **Owner Pool 集体决议 + 外部仲裁方背书**（单一 owner 不可独裁） | Owner 提交决策草案 + 仲裁方 7 天内出书面意见 | 草案可委托；集体决议/背书不可 |

**T+7 诊断 reviewer 指派顺序**：on-call → 非 on-call 但 7 天内可响应 → 外部仲裁方指派 → 随机抽签（排除回避者）。

### 9.8 K-8 数据红线独立快通道（4 步严格按序）

| 步骤 | 动作 | 执行人 | 期限 |
|------|------|--------|------|
| 1. 清退数据 | 删除非白名单数据 + 关闭对应 agent 子模块 | Bot-Operator on-call（runtime 权限唯一） | 触发后 24h |
| 2. 通知 owner | 通知所有受影响子项目 owner（含被采集清单） | Owner Pool 1 名 primary（按 O001 → O002 顺序） | 步骤 1 后 24h |
| 3. 公开披露 | GitHub Discussion + 公邮发布事件简报 | Owner Pool 集体决议（≥ 2/3）+ Reviewer 1 人复核事实 | 步骤 2 后 7 天 |
| 4. 法律评估 | 委托外部法律顾问 | Owner Pool collective + 外部仲裁联合决议 | 步骤 3 后 30 天 |

零宽限原则：任一步骤失败/超期不阻塞后续；步骤 1–3 完成后汇入 T+30 修复窗口，步骤 4 独立进行。

### 9.9 K-9 周预算 X 工时估算

**9 项 P1 风险周工时汇总**：

| MR | Agent | 人工 | 混合 | 合计 |
|----|-------|------|------|------|
| MR1 推进空转 | 3.5h | 1.0h | — | 4.5h |
| MR2 owner 反感 | 1.5h | 0.5h | 0.25h | 2.25h |
| MR3 方法无主线 | 0.5h | 0.5h | — | 1.0h |
| MR4 总项目失维 | 2.0h | 4.0h | — | 6.0h |
| MR5 协调成本 | 0.5h | 1.25h | — | 1.75h |
| MR6 越权 | 3.5h | 0.5h | 0.25h | 4.25h |
| MR8 代决滑坡 | 0.5h | 1.5h | — | 2.0h |
| MR9 采集失控 | 1.5h | 0.5h | — | 2.0h |
| MR10 信任反噬 | 0.5h | 0.25h | — | 0.75h |
| **小计** | **14.0h** | **9.75h** | **0.5h** | **~24.25h/周** |

工时占比：Agent 57.7% / 人工 40.2% / 混合 2.1%。

**最小兜底工时**（Agent 失效时人工必须承担）= 9.5h + 2.5h 未预期缓冲 = **12 h/周**。

**K-9 X 建议初值 = 18 h/周**（= 最小 12h × 1.5 安全系数）：
- K-9 触发条件 = 连续 4 周 > 18 h/周；
- 比 C-005 §4.2 建议的 16 h/周 上调 12.5%，反映 actor 阶段的具体汇总校准；
- 最终值由 KPI LENS 在试运行后回填实测锁定；
- 安全余量 = 6h/12h = 50%。

### 9.10 9 类 kill-switch 与对策映射完整性核验

| Kill-Switch | 对应 MR | T+0 | T+7 | T+30 | T+60 | T+90 | 覆盖 |
|-------------|--------|-----|-----|------|------|------|------|
| K-1 信号源全失效 | MR1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| K-2 owner 全局投诉 | MR2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| K-3 主方法重选失败 | MR3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| K-4 维护工时不足 | MR4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| K-5 协调结构失败 | MR5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| K-6 越权信任崩塌 | MR6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| K-7 代决信任崩塌 | MR8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| K-8 数据红线（独立快通道） | MR9 | 步骤1 | — | 汇入 | 汇入 | 汇入 | ✅ |
| K-9 项目维护工时超预算 | 工时 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 10. 下一阶段建议

按 C-007 §8 的下放清单，下一阶段建议优先级：

1. **C-002 方法库枚举**（P2 高优）：列出可调用的推进方法清单 + 互斥/顺序/独立矩阵 + 主方法身份指派；
2. **KPI LENS**（P2 高优）：量化「可观测前进步骤」口径 + 锁定 K-2/K-4/K-9 阈值；
3. **C-003 机制草案 / 工具落地**（P3）：实现 §9.3 `AMURO_MAINTAINERS.yaml` 的 CI 校验脚本 + 自动 `last_active` 更新机制；`SUBPROJECT_TRUST.yaml` 与 `AMURO_MAINTAINERS.yaml` 的关联；`AMURO_PROXY_DECISIONS.log` 与"proxy decisions 简报"模板；信号健康度仪表盘 MVP；
4. **norm LENS**（P3）：催办伦理 + 投诉通道 + agent-as-owner 降级伦理 + §9.4 代签机制伦理边界 + §9.6 "披露不换人"披露形式 + K-8 步骤 3 公开披露措辞边界；
5. **试运行**：选 1-2 个子项目沙盒演练 §9.5 agent-as-owner 降级路径 + §9.7 T+0 自动 freeze 误报演练 + §9.9 首月周工时实测校准。

---

> **本 WORKSHOP 仅作为讨论结束标记的总结。** 不开启新的讨论循环，不创建新的 TASK。后续阶段由用户在新的 plan 中启动。
