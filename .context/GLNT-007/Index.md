# 恢复 CLKLOG 全埋点数据体系

> updated_by: Codex - GPT-5
> updated_at: 2026-07-07 14:32:00

## 目标

分析 CLKLOG / CDP 事件体系中每种 event 实际对应的业务场景、触发时机和可观测行为，明确这些事件在全埋点数据体系中的语义边界，避免仅停留在事件枚举名称层面。

需要覆盖的 event 枚举包括：

```text
$AppStart
$AppStartPassively
$AppEnd
$AppViewScreen
$AppPageLeave
$AppClick
$MPLaunch
$MPShow
$MPViewScreen
$MPHide
$WebStay
$WebClick
$pageview
AppCrashed
```

每个 event 至少需要分析：

- 实际发生的用户或系统场景
- 所属端类型或运行环境，例如 App、Web、小程序
- 典型触发时机
- 与相近事件之间的差异
- 对后续用户行为分析、页面路径分析、留存分析、转化分析或异常分析的价值
