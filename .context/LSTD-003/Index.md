# 调度中心（flowablex 集成）Vision

> 本 Vision 由外部 Agent 负责更新进度。本仓库 Agent 只读取，不介入实现细节。

## Requirements

### Goals

- 确认 flowablex 作为 Magii 调度中心的外部实现可用
- 建立 Magii 与 flowablex 的集成接口
- 记录云设施关键节点，为 LSTD-004 提供依赖前提

### Scope

- 跟踪 flowablex 部署状态（里程碑）
- 记录 flowablex 使用的云设施关键点
- 验证 Magii 与 flowablex 集成接口可用

### Non-Scope

- flowablex 内部实现细节
- flowablex 的具体技术方案（由 flowablex 项目自行管理）
- Magii 核心模块（注册中心、学习、进化）的实现

### Constraints

- 本 Vision 仅跟踪关键进度/里程碑，不跟踪 flowablex 内部实现过程
- 调度中心由外部应用 **flowablex** 实现，本 Vision 仅讨论必要的集成规范

## Visions

- [x] **V-200**: 复核前置条件（来自 LSTD-002）
  - **Dependencies**: LSTD-002 V-100 完成
  - **Act**: PASS and Continue to V-201

- [ ] **V-201**: 跟踪 flowablex 部署状态
  - **Dependencies**: V-200
  - **Do**: 跟踪 flowablex 外部应用的部署状态 -> {输出：部署状态更新}
  - **Check**:
    - 确认 flowablex 可用（里程碑）
    - IF PASS  : 将 Act 设置为 PASS and Continue to V-202
    - ELSE FAIL: 将 Act 设置为 Pause and HITL，{阻塞点}
  - **Act**: {根据 Check 的结果设置}

- [ ] **V-202**: 记录云设施关键点
  - **Dependencies**: V-201
  - **Do**: 记录 flowablex 可能使用的云设施关键点（阿里云 Step Function、EventBridge 等） -> {输出：关键点清单}
  - **Check**:
    - 仅记录关键点位置，不涉及实现细节
    - IF PASS  : 将 Act 设置为 PASS and Continue to V-203
    - ELSE FAIL: 将 Act 设置为 Pause and HITL，{失败原因/阻塞点}
  - **Act**: {根据 Check 的结果设置}

- [ ] **V-203**: 验证调度集成接口
  - **Dependencies**: V-202
  - **Do**: 验证 Magii 与 flowablex 的集成接口可用 -> {输出：接口验证结果}
  - **Check**:
    - 接口可正常通信
    - IF PASS  : 将 Act 设置为 PASS and Continue to V-299
    - ELSE FAIL: 将 Act 设置为 Pause and HITL，{失败原因/阻塞点}
  - **Act**: {根据 Check 的结果设置}

- [ ] **V-299**: Vision 收尾判断
  - **Dependencies**: V-203
  - **Do**: 复盘本 Vision 产出与集成规范一致性 -> {输出：需要返修的点（如有）与修改建议}
  - **Check**:
    - 是否存在关键变更/口径不一致/验收标准不清导致后续不可执行
    - IF PASS  : 将 Act 设置为 PASS and Pause and HITL，{Vision 收尾确认} → 通知 LSTD-002 可进入 LSTD-004
    - ELSE FAIL: 将 Act 设置为 Pause and HITL，{需要返修点清单}
  - **Act**: {根据 Check 的结果设置}
