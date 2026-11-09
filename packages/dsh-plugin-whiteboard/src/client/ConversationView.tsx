import { Background, BackgroundVariant, Controls, MiniMap, Panel, ReactFlow, useReactFlow, useViewport } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import clsx from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Turns } from '../dsh-client-ui/Turns.jsx'
import type { TurnBoundary, TurnListSnapshot, TurnSummary } from '../dsh-client-ui/translateTurns'
import { mockCompute } from './database.js'
import { derivePositions, deriveTwigs } from './whiteboardLayout'
import { VisitNode, type VisitNodeRenderType } from './VisitNode'
import type { VisitEdge, WhiteboardEvent, WhiteboardPayload } from './types'
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

function deriveBoard({ nodes: sourceNodes, edges }: WhiteboardPayload) {
  const nodeById = new Map(sourceNodes.map(node => [node.id, node]))
  const twigs = deriveTwigs(sourceNodes, edges, id => nodeById.get(id)?.data.workspaceId ?? id)
  const positions = derivePositions(twigs)
  const nodes: VisitNodeRenderType[] = sourceNodes.map(node => ({
    id: node.id,
    type: node.type,
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    data: node.data,
  }))
  return { nodes, edges }
}

interface ConversationViewProps {
  // Supplied by the Session-scoped conversation.view slot.
  useProjection?: (key: string) => WhiteboardEvent | null | undefined
  getTurns?: () => Promise<TurnListSnapshot>
  subscribeTurnEvents?: (listener: (boundary: TurnBoundary) => void) => () => void
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
        userText: `Turn ${turn} | User | ${user?.data.content.filter(block => block.type === 'text').map(block => block.text).join('\n') || '（无用户文本）'}`,
        assistantText: `Turn ${turn} | Step ${lastStep ?? '—'} | Assistant | ${text ?? '（末块不是 Text）'}`,
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
export function ConversationView({ useProjection, getTurns, subscribeTurnEvents }: ConversationViewProps) {
  const [board, setBoard] = useState<BoardData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const reloadRevision = useRef(0)
  const firstNode = board?.nodes.reduce<VisitNodeRenderType | undefined>((first, node) => {
    if (!first || node.position.y < first.position.y
      || (node.position.y === first.position.y && node.position.x < first.position.x)) return node
    return first
  }, undefined)

  const reloadBoard = useCallback((payload: WhiteboardPayload) => {
    const revision = ++reloadRevision.current
    void (async () => {
      try {
        const source = await mockCompute()
        if (revision !== reloadRevision.current) return

        const next = deriveBoard({
          nodes: [...source.nodes, ...payload.nodes],
          edges: [...source.edges, ...payload.edges],
        })
        setBoard(current => ({ ...next, revision: (current?.revision ?? 0) + 1 }))
        setLoadError(false)
      } catch {
        if (revision === reloadRevision.current) setLoadError(true)
      }
    })()
  }, [])

  useEffect(() => {
    let disposed = false
    const revisionAtStart = reloadRevision.current

    async function initialize() {
      try {
        const source = await mockCompute()
        if (disposed) return

        const initial = deriveBoard(source)
        // A tool reload received while mockCompute was pending owns the canvas.
        setBoard(current => current ?? { ...initial, revision: 0 })
      } catch {
        if (!disposed && revisionAtStart === reloadRevision.current) setLoadError(true)
      }
    }

    void initialize()
    return () => { disposed = true }
  }, [])

  return (
    <div className={clsx(styles._, viewStyles._)}>
      {useProjection && <SessionBoardUpdates useProjection={useProjection} onReload={reloadBoard} />}
      {getTurns && subscribeTurnEvents && <SessionTurnList getTurns={getTurns} subscribeTurnEvents={subscribeTurnEvents} />}
      {/* Each reload remounts RF and fits the top-left node after measurement. */}
      {loadError ? <div role="alert">白板加载失败，请切换视图后重试。</div> : board === null ? <div role="status">正在加载白板…</div> : (
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
          <MiniMap pannable />
          <Controls showInteractive={false} />
          <ZoomIndicator />
        </ReactFlow>
      )}
    </div>
  )
}
