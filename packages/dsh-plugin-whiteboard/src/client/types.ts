import type { Edge } from '@xyflow/react'
import type { VisitNodeId, VisitNodeData } from './VisitNode'

/** 全局稳定编号，离线数据使用 TWIG-NNN。 */
export type TwigId = `TWIG-${number}`

export type VisitEdge = Omit<Edge, 'id' | 'source' | 'target'> & {
  id: `${VisitNodeId}->${VisitNodeId}`
  source: VisitNodeId
  target: VisitNodeId
}

/** 全局稳定编号，离线数据使用 VISIT-NNN（VisitNode.tsx 定义，此处别名引用）。 */
export type VisitNodeSourceId = VisitNodeId

/**
 * database.js 数据节点：不携带 position。
 * 坐标由 whiteboardLayout 在渲染前按 edges 推导，数据侧只维护推进关系。
 */
export interface VisitNodeSource {
  id: VisitNodeId
  type: 'visit'
  data: VisitNodeData
}

/** 单向单线：每个节点属于一个 Twig，内部 Edge 显式定义推进关系。 */
export interface Twig {
  id: TwigId
  nodes: VisitNodeSource[]
  edges: VisitEdge[]
}

/** Host services and registration APIs available to the White Board plugin entry. */
export interface BaseContext {
  effect<T>(effect: () => T, label?: string): T
  inject(names: string[], callback: (scope: WhiteBoardContextServices) => void): void
  slots: {
    inject(name: string, callback: () => unknown): void
    register(meta: Record<string, unknown>, component: unknown): unknown
  }
}

export interface WhiteBoardContextServices extends BaseContext {
  uiWorkspace: any
  sessions: any
  conversation: any
  workspaces: any
}
