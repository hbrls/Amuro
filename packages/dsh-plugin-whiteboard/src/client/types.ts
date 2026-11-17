import type { Edge } from '@xyflow/react'
import type { VisitNodeId, VisitNodeData } from './VisitNode'

/** 本次客户端计算生成的临时分组编号，不作为稳定身份。 */
export type TwigId = `TWIG-${number}`

export type VisitEdge = Omit<Edge, 'id' | 'source' | 'target'> & {
  id: `${VisitNodeId}->${VisitNodeId}`
  source: VisitNodeId
  target: VisitNodeId
}

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

/** backstage MCP 返回的原始节点形状；Host 原样透传，渲染映射由 client 完成。 */
export interface RawVisitNode {
  Id: string
  Workspace: string
  Session: string
  Title: string
  /** 节标题 → 条目列表。 */
  Description: Record<string, string[]>
  Progress: string
}

/** backstage MCP 返回的原始边形状；id 由 client 派生为 `Source->Target`。 */
export interface RawVisitEdge {
  Source: string
  Target: string
}

/**
 * whiteboard 工具 reload 解析后的画布数据（原始 Visit 形状）；
 * Twig 分组、渲染节点与坐标均由 client 推导。
 */
export interface WhiteboardPayload {
  /** 高亮 Workspace 字段等于该值的节点。 */
  highlight: string
  nodes: RawVisitNode[]
  edges: RawVisitEdge[]
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
}
