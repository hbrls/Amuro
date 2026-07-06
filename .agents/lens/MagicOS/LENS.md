---
name: MagicOS
description: MagicOS / 荣耀 Android 系统视角 LENS，用于分析 MagicOS 版本差异、Android 底层、厂商权限弹窗、隐私授权层、包可见性、权限策略和机型矩阵。
metadata:
  version: 0.0.1
---

# MagicOS LENS

> updated_by: Codex - GPT-5
> updated_at: 2026-06-13 11:40:42

## 目标

MagicOS LENS 用于从荣耀 MagicOS 的 Android 系统基础、厂商定制策略和版本矩阵出发，分析 Android 标准接口在荣耀设备上的返回行为和影响范围，重点判断异常是否来自厂商隐私授权层、系统管控策略、版本升级边界、机型族差异或系统 API 行为改造。

## 适用场景

- 需要判断 MagicOS 上 Android 标准接口返回空、不完整、异常或受限的原因。
- 需要分析荣耀设备的包可见性、权限管理、隐私策略、后台策略和系统服务定制。
- 需要设计 MagicOS 版本、Android 底层版本、机型系列、targetSdk 的覆盖矩阵。
- 需要区分 Android 原生限制、MagicOS 定制限制和业务封装问题。

## 分析范围

- MagicOS 版本差异
- Android 底层版本差异
- 厂商隐私授权弹窗
- 应用列表读取管控
- 权限状态与缓存状态
- 机型族差异：数字系列、Magic 系列、X / Play / Lite 系列、折叠屏系列
- 系统升级前后行为变化

## 分析维度

1. Android 底层版本：不同 Android 基线带来的权限和包可见性变化。
2. MagicOS 版本：厂商策略随版本变化的收紧、放开或兼容行为。
3. 机型系列：旗舰、中端、折叠屏、平板等设备形态和系统分支。
4. targetSdk：调用方 targetSdk 对可见性、权限和接口返回的影响。
5. 权限与隐私：系统权限、特殊权限、隐私保护、设备标识访问策略。
6. 系统服务定制：包管理、通知、网络、位置、电池、后台管理等厂商实现差异。
7. 调用路径：厂商授权层、Android 系统 API、SDK 封装、业务封装和 bridge 边界。

## 输出要求

使用本 LENS 时，至少输出：

- MagicOS 版本与 Android 底层版本矩阵。
- MagicOS × Android × 机型族矩阵。
- 接口异常的厂商策略候选原因。
- 最小机型和版本覆盖方案。
- Android 原生行为与 MagicOS 定制行为的对照。
- 需要采集的系统版本、设备指纹、授权弹窗、权限状态和二次调用证据。
- 证据等级和待补证清单。

## 判断原则

- 不得把 MagicOS 行为直接等同于 AOSP 原生 Android 行为。
- 不得忽略 Android 底层版本和 targetSdk 的共同影响。
- 不得用单一机型结论外推全部荣耀设备。
- 不得在缺少证据时把厂商定制写成确定根因。
- 不得把厂商弹窗直接等同于 Android 原生权限。
- 不得把同步返回 `False` 直接等同于用户拒绝。
- 优先用版本边界和调用路径对照定位问题。
