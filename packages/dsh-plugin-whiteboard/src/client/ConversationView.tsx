import { Background, BackgroundVariant, Controls, MiniMap, Panel, ReactFlow, useReactFlow, useViewport } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import clsx from 'clsx'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Turns } from '../dsh-client-ui/Turns.jsx'
import type { TurnBoundary, TurnListSnapshot, TurnSummary } from '../dsh-client-ui/translateTurns'
import { derivePositions, deriveTwigs } from './whiteboardLayout'
import { FillDraftContext, type InputActionsLike, type UseInputLike } from './fillDraft'
import { VisitNode, type VisitNodeRenderType } from './VisitNode'
import type { RawVisitNode, VisitEdge, VisitNodeSource, WhiteboardEvent, WhiteboardPayload } from './types'
import styles from './WhiteBoard.module.css'
import viewStyles from './ConversationView.module.css'

const DEFAULT_ZOOM = 0.75
// RF v12 requires a stable nodeTypes reference across renders.
const nodeTypes = { visit: VisitNode }

interface BoardData {
  nodes: VisitNodeRenderType[]
  edges: VisitEdge[]
  revision: number
}

/**
 * backstage 原始节点 → 渲染源节点。Description 各节展平为 body 行：
 * 单节直接取条目；多节时每节先插入一行节标题。
 */
function toSourceNode(raw: RawVisitNode): VisitNodeSource {
  const sections = Object.entries(raw.Description)
  const body = sections.length <= 1
    ? (sections[0]?.[1] ?? [])
    : sections.flatMap(([section, items]) => [`【${section}】`, ...items])
  return {
    id: raw.Id,
    type: 'visit',
    data: {
      workspace: raw.Workspace,
      kind: raw.Type,
      header: { title: raw.Title },
      body,
      progress: raw.Progress,
    },
  }
}

function deriveBoard({ highlight, nodes: rawNodes, edges: rawEdges }: WhiteboardPayload) {
  const sourceNodes = rawNodes.map(toSourceNode)
  const edges: VisitEdge[] = rawEdges.map(edge => ({
    id: `${edge.Source}->${edge.Target}` as VisitEdge['id'],
    source: edge.Source,
    target: edge.Target,
  }))
  const nodeById = new Map(sourceNodes.map(node => [node.id, node]))
  const twigs = deriveTwigs(sourceNodes, edges, id => nodeById.get(id)?.data.workspace ?? id)
  const positions = derivePositions(twigs)
  const nodes: VisitNodeRenderType[] = sourceNodes.map(node => ({
    id: node.id,
    type: node.type,
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    data: { ...node.data, highlight: node.data.workspace === highlight },
  }))
  return { nodes, edges }
}

interface ConversationViewProps {
  // Supplied by the Session-scoped conversation.view slot.
  useProjection?: (key: string) => WhiteboardEvent | null | undefined
  getTurns?: () => Promise<TurnListSnapshot>
  subscribeTurnEvents?: (listener: (boundary: TurnBoundary) => void) => () => void
  // 宿主经 uiSession.provide 注入的 session 标准 props（hooks:['conversation','input']、props:['inputActions']）。
  useInput?: UseInputLike
  inputActions?: InputActionsLike
}

/**
 * 读取当前草稿并向下提供 fillDraft：已有草稿时追加（保留原文），空草稿时直接填入。
 * 只写草稿、不调用 submit，发送与否由用户决定。
 */
function FillDraftProvider({ useInput, inputActions, children }: Required<Pick<ConversationViewProps, 'useInput' | 'inputActions'>> & {
  children: ReactNode
}) {
  const draft = useInput(input => input.draft)
  const fillDraft = useCallback((text: string) => {
    inputActions.setDraft(draft.trim() === '' ? text : `${draft}\n\n${text}`)
  }, [inputActions, draft])
  return <FillDraftContext.Provider value={fillDraft}>{children}</FillDraftContext.Provider>
}

function SessionBoardUpdates({ useProjection, onReload }: Required<Pick<ConversationViewProps, 'useProjection'>> & {
  onReload: (payload: WhiteboardPayload) => void
}) {
  const event = useProjection('com.lisitede.backstage/dsh-plugin-whiteboard')

  useEffect(() => {
    if (event?.type === 'reload') onReload(event.payload)
  }, [event, onReload])

  return null
}

function SessionTurnList({ getTurns, subscribeTurnEvents }: Required<Pick<ConversationViewProps, 'getTurns' | 'subscribeTurnEvents'>>) {
  const [turns, setTurns] = useState<TurnSummary[] | null>(null)
  const [running, setRunning] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let disposed = false
    const refresh = () => {
      void getTurns().then(snapshot => {
        if (disposed) return
        setTurns(snapshot.turns)
        setRunning(snapshot.running)
        setLoadError(false)
      }).catch(() => {
        if (!disposed) setLoadError(true)
      })
    }
    const unsubscribe = subscribeTurnEvents(boundary => {
      if (boundary === 'turn/start') setRunning(true)
      refresh()
    })
    refresh()
    return () => { disposed = true; unsubscribe() }
  }, [getTurns, subscribeTurnEvents])

  return (
    <Turns
      className={viewStyles.turnList}
      loading={turns === null}
      loadError={loadError}
      pending={running && !turns?.some(turn => !turn.completed)}
      turns={(turns ?? []).map(({ turn, completed, user, lastStep, blockKinds, text }) => ({
        id: turn,
        turnTag: `T${turn}`,
        stepTag: `S${lastStep ?? '—'}`,
        stepLabel: `Step ${lastStep ?? '—'}`,
        userText: user?.data.content.filter(block => block.type === 'text').map(block => block.text).join('\n') || '（无用户文本）',
        assistantText: text ?? '（末块不是 Text）',
        assistantTitle: `Blocks: ${blockKinds.join(', ')}`,
        loading: !completed,
      }))}
    />
  )
}

function ZoomIndicator() {
  const { zoom } = useViewport()
  const { zoomTo } = useReactFlow()
  return (
    <Panel position="top-right">
      <button
        type="button"
        className={clsx(styles.ZoomIndicator, 'tw:px-2 tw:py-1')}
        title="恢复默认缩放 75%"
        aria-label={`当前缩放 ${Math.round(zoom * 100)}%，点击恢复 75%`}
        onClick={() => zoomTo(DEFAULT_ZOOM, { duration: 200 })}
      >
        {Math.round(zoom * 100)}%
      </button>
    </Panel>
  )
}

/** The host mounts only the active conversation view; each mount resets the viewport. */
export function ConversationView({ useProjection, getTurns, subscribeTurnEvents, useInput, inputActions }: ConversationViewProps) {
  const [board, setBoard] = useState<BoardData | null>(null)
  const firstNode = board?.nodes.reduce<VisitNodeRenderType | undefined>((first, node) => {
    if (!first || node.position.y < first.position.y
      || (node.position.y === first.position.y && node.position.x < first.position.x)) return node
    return first
  }, undefined)

  // reload 携带完整画布数据，直接替换，不再合并本地 fixture。
  const reloadBoard = useCallback((payload: WhiteboardPayload) => {
    const next = deriveBoard(payload)
    setBoard(current => ({ ...next, revision: (current?.revision ?? 0) + 1 }))
  }, [])

  const boardArea = (
    <>
      {useProjection && <SessionBoardUpdates useProjection={useProjection} onReload={reloadBoard} />}
      {getTurns && subscribeTurnEvents && <SessionTurnList getTurns={getTurns} subscribeTurnEvents={subscribeTurnEvents} />}
      {/* Each reload remounts RF and fits the top-left node after measurement. */}
      {board === null ? <div role="status">正在加载白板…</div> : (
        <ReactFlow<VisitNodeRenderType>
          key={board.revision}
          defaultNodes={board.nodes}
          defaultEdges={board.edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: 'arrowclosed', color: 'var(--dsw-alias-label-tertiary)' },
          }}
          fitView
          fitViewOptions={{
            nodes: firstNode ? [{ id: firstNode.id }] : [],
            minZoom: DEFAULT_ZOOM,
            maxZoom: DEFAULT_ZOOM,
          }}
        >
          <Background variant={BackgroundVariant.Dots} />
          {/* MiniMap 画 SVG rect 而非节点组件；节点底色经 nodeColor 注入：highlight 品牌色、Vision 浅黄，其余回落到主题变量。 */}
          <MiniMap<VisitNodeRenderType>
            pannable
            nodeColor={node => node.data.highlight ? 'var(--dsw-alias-brand-primary)' : node.data.kind === 'Vision' ? '#FFFCC8' : ''}
          />
          <Controls showInteractive={false} />
          <ZoomIndicator />
        </ReactFlow>
      )}
    </>
  )

  return (
    <div className={clsx(styles._, viewStyles._)}>
      {useInput && inputActions
        ? <FillDraftProvider useInput={useInput} inputActions={inputActions}>{boardArea}</FillDraftProvider>
        : boardArea}
    </div>
  )
}
