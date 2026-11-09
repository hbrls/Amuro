import type { Edge } from '@xyflow/react'
import type { VisitNodeId, VisitNodeData } from './VisitNode'

/** 本次客户端计算生成的临时分组编号，不作为稳定身份。 */
export type TwigId = `TWIG-${number}`

export type VisitEdge = Omit<Edge, 'id' | 'source' | 'target'> & {
  id: `${VisitNodeId}->${VisitNodeId}`
  source: VisitNodeId
  target: VisitNodeId
}

/** Source-provided node ID. Offline and Hub sources retain their own ID formats. */
export type VisitNodeSourceId = VisitNodeId

/**
 * 节点数据不携带 position；Twig 分组和坐标均由 client 从 nodes/edges 推导。
 */
export interface VisitNodeSource {
  id: VisitNodeId
  type: 'visit'
  data: VisitNodeData
}

/** 单向单线连通分量，由 client 从节点和边计算得到。 */
export interface Twig {
  id: TwigId
  nodes: VisitNodeSource[]
  edges: VisitEdge[]
}

/** Complete source graph submitted by the whiteboard tool; layout is computed by the client. */
export interface WhiteboardPayload {
  nodes: VisitNodeSource[]
  edges: VisitEdge[]
}

export interface WhiteboardEvent {
  type: 'reload'
  payload: WhiteboardPayload
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
  uiConversation: any
  sessions: any
  conversation: any
}
