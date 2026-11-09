import type { XYPosition } from '@xyflow/react'
import type { VisitNodeSourceId, VisitEdge, VisitNodeSource, Twig } from './types'

/**
 * Whiteboard Twig 分组与布局推导；源数据只包含 nodes 和 edges。
 *
 * 每个连通分量计算为一个临时 Twig。每条链从唯一链头沿 source → target 遍历；
 * 孤立节点各自成 Twig。Twig 按链头的 (workspaceId, id) 排序后放置为画布行。
 * 单线无环是图结构约束；本模块负责校验，不依赖数据源预先分组。
 */

/** 列间距；卡片实际宽度 360px（VisitNode.module.css），480 保证不重叠。 */
const COLUMN_SPACING = 480
/** Minimum Twig row pitch and the breathing room after the tallest node above it. */
const MIN_ROW_SPACING = 300
const ROW_GAP = 32

/** 布局输出：节点 id → 画布坐标。 */
export type VisitNodePositions = ReadonlyMap<VisitNodeSourceId, XYPosition>

/** 节点 id → 所属工作区（Twig 排序的第一排序键）。 */
export type WorkspaceOf = (id: VisitNodeSourceId) => string

function compare(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0
}

function wrappedLines(text: string, width: number, fontSize: number) {
  let lines = 1
  let used = 0
  for (const character of text) {
    const code = character.codePointAt(0)!
    const isWide = code >= 0x2e80 || (code >= 0xff01 && code <= 0xff60)
    const advance = isWide ? fontSize : fontSize * 0.55
    if (used > 0 && used + advance > width) {
      lines++
      used = advance
    } else {
      used += advance
    }
  }
  return lines
}

function estimatedNodeHeight(node: VisitNodeSource) {
  const titleLines = wrappedLines(node.data.header.title, 324, 16)
  const bodyLines = node.data.body.reduce((sum, line) => sum + wrappedLines(line, 312, 14), 0)
  return 112 + titleLines * 20 + bodyLines * 20 + Math.max(0, node.data.body.length - 1) * 8
}

/** 从原始节点与边计算 Twig 连通分量；Twig ID 只在本次结果中有效。 */
export function deriveTwigs(
  nodes: readonly VisitNodeSource[],
  edges: readonly VisitEdge[],
  workspaceOf: WorkspaceOf = id => id,
): Twig[] {
  const nodeById = new Map<VisitNodeSourceId, VisitNodeSource>()
  for (const node of nodes) {
    if (nodeById.has(node.id)) throw new Error(`Duplicate Whiteboard node ID: ${node.id}`)
    nodeById.set(node.id, node)
  }

  const outgoing = new Map<VisitNodeSourceId, VisitEdge>()
  const incoming = new Map<VisitNodeSourceId, VisitEdge>()
  const neighbors = new Map([...nodeById.keys()].map(id => [id, new Set<VisitNodeSourceId>()]))
  const edgeIds = new Set<string>()
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate Whiteboard edge ID: ${edge.id}`)
    edgeIds.add(edge.id)
    if (edge.id !== `${edge.source}->${edge.target}`) throw new Error(`Invalid Whiteboard edge ID: ${edge.id}`)
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
      throw new Error(`Whiteboard edge endpoint is missing: ${edge.id}`)
    }
    if (outgoing.has(edge.source)) throw new Error(`Whiteboard node has multiple outgoing edges: ${edge.source}`)
    if (incoming.has(edge.target)) throw new Error(`Whiteboard node has multiple incoming edges: ${edge.target}`)
    outgoing.set(edge.source, edge)
    incoming.set(edge.target, edge)
    neighbors.get(edge.source)!.add(edge.target)
    neighbors.get(edge.target)!.add(edge.source)
  }

  const components: VisitNodeSource[][] = []
  const assigned = new Set<VisitNodeSourceId>()
  for (const node of nodes) {
    if (assigned.has(node.id)) continue
    const component: VisitNodeSource[] = []
    const pending = [node.id]
    assigned.add(node.id)
    while (pending.length > 0) {
      const id = pending.pop()!
      component.push(nodeById.get(id)!)
      for (const neighbor of neighbors.get(id)!) {
        if (assigned.has(neighbor)) continue
        assigned.add(neighbor)
        pending.push(neighbor)
      }
    }
    components.push(component)
  }

  const ordered = components.map(component => {
    const members = new Set(component.map(node => node.id))
    const heads = component.filter(node => !incoming.has(node.id))
    if (heads.length !== 1) throw new Error(`Whiteboard component must have one chain head: ${component[0]?.id}`)

    const twigNodes: VisitNodeSource[] = []
    const twigEdges: VisitEdge[] = []
    const traversed = new Set<VisitNodeSourceId>()
    let current: VisitNodeSourceId | undefined = heads[0]!.id
    while (current !== undefined) {
      if (traversed.has(current)) throw new Error(`Whiteboard component contains a cycle: ${current}`)
      traversed.add(current)
      twigNodes.push(nodeById.get(current)!)
      const edge = outgoing.get(current)
      if (!edge || !members.has(edge.target)) {
        current = undefined
      } else {
        twigEdges.push(edge)
        current = edge.target
      }
    }
    if (traversed.size !== component.length) throw new Error(`Whiteboard component is not a single chain: ${heads[0]!.id}`)
    return { head: heads[0]!, nodes: twigNodes, edges: twigEdges }
  })
  ordered.sort((left, right) =>
    compare(workspaceOf(left.head.id), workspaceOf(right.head.id)) || compare(left.head.id, right.head.id))

  return ordered.map(({ nodes: twigNodes, edges: twigEdges }, index) => ({
    id: `TWIG-${index + 1}` as Twig['id'],
    nodes: twigNodes,
    edges: twigEdges,
  }))
}

/** Coordinates for calculated Twigs; each Twig occupies one row. */
export function derivePositions(twigs: readonly Twig[]): VisitNodePositions {
  const positions = new Map<VisitNodeSourceId, XYPosition>()
  let rowY = 0
  twigs.forEach(twig => {
    twig.nodes.forEach((node, column) => {
      positions.set(node.id, { x: column * COLUMN_SPACING, y: rowY })
    })
    const rowHeight = Math.max(0, ...twig.nodes.map(estimatedNodeHeight))
    rowY += Math.max(MIN_ROW_SPACING, rowHeight + ROW_GAP)
  })
  return positions
}
