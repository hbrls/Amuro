import type { XYPosition } from '@xyflow/react'
import type { VisitNodeSourceId, VisitEdge, VisitNodeSource } from './types'

/**
 * Whiteboard 布局推导（数据库不携带 position，坐标在渲染前实时计算）。
 *
 * 规则（确定性，同一数据两次推导结果完全一致）：
 * 1. 行分组：沿 edges 求连通分量，每个分量 = 一条链 = 一行；链可跨 Workspace，不按 Workspace 拆分。
 * 2. 列序号：链内从链头（无入边的节点）沿 source → target 遍历，序号即列；孤立节点各自视为单节点链。
 * 3. 坐标：x = 列 × COLUMN_SPACING；y = 行 × ROW_SPACING。
 * 4. 行排序：链（含孤立节点）按链头的 (workspaceId, id) 字典序排序，保证同一数据集的行序稳定。
 *
 * 前置约束（database.js 保证）：单线链——每个节点至多一条入边、至多一条出边，无分叉、无环、无跨链连线。
 */

/** 列间距；卡片实际宽度 360px（VisitNode.module.css），480 保证不重叠。 */
const COLUMN_SPACING = 480
/** 行间距；沿用 database.js 时代的人工行高。 */
const ROW_SPACING = 440

/** 布局输出：节点 id → 画布坐标。 */
export type VisitNodePositions = ReadonlyMap<VisitNodeSourceId, XYPosition>

/** 节点 id → 所属工作区（行排序的第一排序键）。 */
export type WorkspaceOf = (id: VisitNodeSourceId) => string

/** 与 Twig.edges 同形的纯数据边；推导只需要 source/target。 */
export type LayoutEdge = Pick<VisitEdge, 'source' | 'target'>

/**
 * 派生整幅白板的节点坐标。
 *
 * @param nodes 全部节点（布局只读 id 与 workspaceId 归属）
 * @param edges 全部边（推进关系）
 * @param workspaceOf id → Workspace 名称；缺省按 id 原样比较（同 Workspace 内等价）
 */
export function derivePositions(
  nodes: readonly VisitNodeSource[],
  edges: readonly LayoutEdge[],
  workspaceOf: WorkspaceOf = id => id,
): VisitNodePositions {
  const out = new Map<VisitNodeSourceId, VisitNodeSourceId[]>()
  const indegree = new Map<VisitNodeSourceId, number>()
  for (const node of nodes) {
    out.set(node.id, [])
    indegree.set(node.id, 0)
  }
  for (const edge of edges) {
    out.get(edge.source)?.push(edge.target)
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1)
  }

  // 行分组：union-find 求连通分量（不经过方向；分量的行归属与边方向无关）。
  const parent = new Map([...out.keys()].map(id => [id, id]))
  const find = (id: VisitNodeSourceId): VisitNodeSourceId => {
    let root = id
    while (parent.get(root) !== root) root = parent.get(root)!
    while (parent.get(id) !== root) { const next = parent.get(id)!; parent.set(id, root); id = next }
    return root
  }
  for (const edge of edges) {
    const left = find(edge.source)
    const right = find(edge.target)
    if (left !== right) parent.set(left, right)
  }

  // 链头：分量内唯一无入边节点（单线链约束保证唯一）。
  const headOfComponent = new Map<VisitNodeSourceId, VisitNodeSource>()
  for (const node of nodes) {
    if (indegree.get(node.id) !== 0) continue
    const root = find(node.id)
    const known = headOfComponent.get(root)
    if (known === undefined || node.id < known.id) headOfComponent.set(root, node)
  }

  // 行序：按链头的 (workspaceId, id) 字典序。
  const heads = [...headOfComponent.values()].sort((left, right) => {
    const leftKey = [workspaceOf(left.id), left.id]
    const rightKey = [workspaceOf(right.id), right.id]
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
  })

  const positions = new Map<VisitNodeSourceId, XYPosition>()
  heads.forEach((head, row) => {
    let current: VisitNodeSourceId | undefined = head.id
    for (let column = 0; current !== undefined; column++) {
      positions.set(current, { x: column * COLUMN_SPACING, y: row * ROW_SPACING })
      current = out.get(current)?.[0]
    }
  })
  return positions
}
