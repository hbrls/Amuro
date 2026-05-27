# Lead 0003 - HiCash 页面业务场景分组 Checklist

## Purpose

把 HiCash 页面分组从技术判断推进成可反复业务核对的映射表。

## Page Inventory

- [ ] 收集 HiCash 全量页面清单 → **已确认来源缺失：需从 HiCash 代码仓库或产品 owner 获取**
- [ ] 标记每个页面当前 Activity / Fragment / 路由路径 → **已确认来源缺失：需从 AndroidManifest.xml 和路由配置提取**
- [ ] 标记每个页面入口来源 → **已确认来源缺失**
- [ ] 标记每个页面是否为主流程页、中转页、结果页、复用页、弹窗或 WebView → **已确认来源缺失**

## Business Taxonomy

- [ ] 为每个页面标记业务属性
- [ ] 合并属于同一业务闭环的页面
- [ ] 拆出需要业务确认的歧义页面
- [ ] 标记页面间关键跳转和状态依赖
- [ ] 标记业务 owner 或确认人

## Target Structure

- [ ] 为每个业务场景提出目标 Activity
- [ ] 为 Activity 内页面提出 Fragment 划分
- [ ] 标记不适合迁移到 Fragment 的例外页面
- [ ] 标记历史兼容约束
- [ ] 标记迁移风险和回滚点

## Business Review Loop

- [ ] 产出第一版“页面 -> 业务场景 -> 目标 Activity / Fragment”映射
- [ ] 与业务 owner 核对场景边界
- [ ] 根据业务反馈更新映射
- [ ] 锁定优先改造范围
- [ ] 明确验收标准
