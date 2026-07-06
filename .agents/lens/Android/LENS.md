---
name: Android
description: Android 平台与标准接口视角 LENS，用于分析 Android API、包可见性、权限模型、targetSdk、设备标识、存储、通知、位置、网络和兼容层行为。
metadata:
  version: 0.0.1
---

# Android LENS

> updated_by: Codex - GPT-5
> updated_at: 2026-06-13 11:40:42

## 目标

Android LENS 用于从 Android 标准接口和运行时语义出发，判断一个问题是否可能来自 Android API 本身、包可见性策略、权限模型、targetSdk 行为变化、manifest 声明、API level、厂商兼容层或容器代理。

## 适用场景

- Android App 调用标准接口返回空、不完整、异常或与预期不一致。
- 需要判断 `PackageManager`、设备标识、位置、网络、电池、传感器、存储、通知、剪贴板等接口的真实语义。
- 需要区分 Android 原生行为、厂商定制行为、兼容层行为和业务封装行为。
- 需要设计最小验证矩阵，而不是靠大量样本穷举。

## 分析范围

- `PackageManager#getInstalledPackages`
- `PackageManager#getInstalledApplications`
- `PackageManager#queryIntentActivities`
- Android 11+ package visibility
- `queries` manifest 声明
- `QUERY_ALL_PACKAGES`
- targetSdkVersion / compileSdkVersion
- Android 版本与 API level 差异
- 权限声明、授权状态、系统返回值、异常类型

## 分析维度

1. API 语义：接口在 Android 标准文档中的定义、返回范围、异常条件。
2. 权限模型：manifest 声明、运行时授权、特殊权限、隐私限制。
3. 包可见性：包查询权限、intent 可见性、系统过滤策略。
4. targetSdk：不同 targetSdk 下行为是否收紧或兼容。
5. 用户与空间：多用户、工作资料、沙箱、容器、应用克隆等上下文。
6. 厂商层：系统服务代理、权限管理器、隐私保护、后台策略。
7. 调用边界：直接系统 API、上层 SDK、业务 wrapper、bridge 或容器代理。
8. 证据等级：官方文档、源码、日志、直接 API 对照、最小复现实验、对照组分别标注。

## 输出要求

使用本 LENS 时，至少输出：

- Android 标准行为基线。
- 可能受权限、targetSdk、包可见性影响的接口清单。
- 原生 Android、厂商系统、容器环境之间的差异判断。
- Android 版本矩阵建议。
- 直接系统 API 的最小诊断代码或诊断入口要求。
- 最小验证用例和对照组设计。
- 不能仅凭单一样本外推的结论清单。

## 判断原则

- 不得把“Android 标准接口”默认等同于“设备真实状态”。
- 不得把上层 SDK 或业务入口的返回值直接等同于 Android 系统 API 行为。
- 不得忽略 targetSdk、权限和包可见性对返回值的影响。
- 不得把空列表自动归因于权限拒绝。
- 不得把 package visibility 与运行时弹窗授权混为一谈。
- 不得把容器内 Android 视图直接当作宿主系统视图。
- 不得用样本数量替代架构分析。
- 优先要求直接 `PackageManager` 对照。
- targetSdk、manifest、API level 必须作为矩阵字段。
