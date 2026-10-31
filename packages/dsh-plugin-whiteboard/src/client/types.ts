import type { Edge } from '@xyflow/react'
import type { VisitNodeId, VisitNodeType } from './VisitNode'

/** 全局稳定编号，离线数据使用 TWIG-NNN。 */
export type TwigId = `TWIG-${number}`

export type VisitEdge = Omit<Edge, 'id' | 'source' | 'target'> & {
  id: `${VisitNodeId}->${VisitNodeId}`
  source: VisitNodeId
  target: VisitNodeId
}

/** 单向单线：每个节点属于一个 Twig，内部 Edge 显式定义推进关系。 */
export interface Twig {
  id: TwigId
  /** 必须引用本 Twig 内唯一的 Current；仅由数据指定，不提供 UI 切换入口。 */
  currentNodeId: VisitNodeId
  nodes: VisitNodeType[]
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
