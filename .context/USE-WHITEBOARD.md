# Whiteboard 数据更新规范

## 适用范围

Whiteboard 当前未对接数据库。需要新增、修改或删除白板计划节点时，**直接维护** `packages/dsh-plugin-whiteboard/src/client/database.js`，通过 tsdown 重建触发 dsh 客户端热更新。

本流程只用于白板离线数据调整；不要为此修改 Host、插件清单或 `lib/` 构建产物，也不要重新安装插件。

## 数据模型

`database.js` 导出 `twigs: Twig[]`。每个 Twig 是一条独立的单向推进链：

```js
{
  id: 'TWIG-001',
  nodes: [{
    id: 'VISIT-001',
    type: 'visit',
    data: {
      workspaceId: '...',
      header: { title: '节点标题' },
      body: ['要点一', '要点二', '要点三'],
      progress: '0%',
    },
  }],
  edges: [{
    id: 'VISIT-001->VISIT-002',
    source: 'VISIT-001',
    target: 'VISIT-002',
    type: 'smoothstep',
    markerEnd: {
      type: 'arrowclosed',
      color: 'var(--dsw-alias-label-tertiary)',
    },
  }],
}
```

约束：

- `TWIG-NNN`、`VISIT-NNN` 是稳定身份；节点 ID 在整个白板内唯一，不复用已用于其他节点的 ID。
- 每条 Twig 内只能有单向、无分叉、无环的推进关系；不创建跨 Twig 连线。推进顺序只由 `edges` 的 `source → target` 表达，不依赖编号、数组顺序或坐标。
- 所有节点全量展示（标题 + 正文 + 进度）。历史记录：曾有 Current 概念（每条 Twig 由 `currentNodeId` 指定唯一完整展示节点，其余只显标题），2026-11-05 起删除，不再存在。
- `body` 保持三条简短要点；箭头不附文字。`progress` 为进度文本（当前一律 `'0%'`，后续再接入真实进度）；footer 的日期与 tag 已废弃，不要新增。
- 节点数据不携带 `position`。渲染前由 `src/client/whiteboardLayout.ts` 按 `edges` 推导坐标：每条链占一行，列 = 链内推进序，行按链头的 (workspaceId, id) 字典序排布；同一数据集推导结果完全一致，新增节点只追加列或行，不需要也无法手工调整坐标。
- `data.workspaceId` 决定点击节点对话按钮时创建会话所属的工作区。省略时使用 `src/client/config.js` 中的固定默认值；不要为普通数据更新修改该配置。

## 更新步骤

1. 阅读 `database.js` 与相关 Twig，按上述约束直接编辑目标数据。
2. 在**仓库根目录**执行一次构建：

   ```bash
   pnpm --filter dsh-plugin-whiteboard bundle
   ```

   若已有该插件的 `pnpm --filter dsh-plugin-whiteboard watch` 正在运行，可等待其自动重建，不必重复启动 watcher。
3. 构建会更新 `lib/client.js`；dsh 检测产物变化后自动热替换 White Board 页面。无需运行 `dev:web`、重启 Desktop 或重新安装插件。
4. 构建成功后，在 Desktop 侧栏打开 **White Board**，检查目标 Twig、节点内容、连线和工作区对话入口。构建成功本身不等于界面验收完成。

## 注意事项

- 热更新会重置插件内 React 状态；已打开的白板抽屉等局部状态可能关闭。
- 仅 `database.js` 数据变更适用上述热更新流程。修改 `src/index.js`、`package.json` 或 `cordis.patch.yml` 时，按插件手册另行处理构建与重启。
- 不手改 `lib/client.js`、`lib/client.js.map` 或 `lib/index.js`；它们都是构建产物。
