import { Background, BackgroundVariant, Controls, MiniMap, Panel, ReactFlow, useReactFlow, useViewport } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Toast } from '@deepseek-ai/dsh-client-ui-primitives'
import { Turns } from '../dsh-client-ui/Turns.jsx'
import type { TurnBoundary, TurnListSnapshot, TurnSummary } from '../dsh-client-ui/translateTurns'
import { mockCompute } from './database.js'
import { derivePositions } from './whiteboardLayout'
import { VisitNode, type VisitNodeRenderType } from './VisitNode'
import type { VisitEdge } from './types'
import styles from './WhiteBoard.module.css'
import viewStyles from './ConversationView.module.css'

const DEFAULT_ZOOM = 0.75
// RF v12 requires a stable nodeTypes reference across renders.
const nodeTypes = { visit: VisitNode }

interface BoardData {
  nodes: VisitNodeRenderType[]
  edges: VisitEdge[]
}

interface ProjectionEvent {
  type: string
  payload: string
}

interface ConversationViewProps {
  // Supplied by the Session-scoped conversation.view slot.
  useProjection?: (key: string) => ProjectionEvent | null | undefined
  getTurns?: () => Promise<TurnListSnapshot>
  subscribeTurnEvents?: (listener: (boundary: TurnBoundary) => void) => () => void
}

function SessionEventToast({ useProjection }: Required<Pick<ConversationViewProps, 'useProjection'>>) {
  const event = useProjection('com.lisitede.backstage/dsh-plugin-whiteboard')
  const [toast, setToast] = useState<ProjectionEvent | null>(null)

  useEffect(() => {
    setToast(event?.type === 'toast' ? event : null)
  }, [event])

  return toast && <Toast text={toast.payload} onDone={() => setToast(null)} />
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

  useEffect(() => {
    let disposed = false

    async function initialize() {
      try {
        const twigs = await mockCompute()
        if (disposed) return

        // Derive the entire board together: chains can cross Twig / Workspace boundaries.
        // Deriving each Twig separately would restart row numbering and overlap the rows.
        const sourceNodes = twigs.flatMap(twig => twig.nodes)
        const edges = twigs.flatMap(twig => twig.edges)
        const positions = derivePositions(sourceNodes, edges, id =>
          sourceNodes.find(node => node.id === id)?.data.workspaceId ?? id)
        const nodes: VisitNodeRenderType[] = sourceNodes.map(node => ({
          id: node.id,
          type: node.type,
          position: positions.get(node.id) ?? { x: 0, y: 0 },
          data: node.data,
        }))
        setBoard({ nodes, edges })
      } catch {
        if (!disposed) setLoadError(true)
      }
    }

    void initialize()
    return () => { disposed = true }
  }, [])

  return (
    <div className={clsx(styles._, viewStyles._)}>
      {useProjection && <SessionEventToast useProjection={useProjection} />}
      {getTurns && subscribeTurnEvents && <SessionTurnList getTurns={getTurns} subscribeTurnEvents={subscribeTurnEvents} />}
      {/* Uncontrolled nodes let RF retain measurements needed by the MiniMap. */}
      {loadError ? <div role="alert">白板加载失败，请切换视图后重试。</div> : board === null ? <div role="status">正在加载白板…</div> : (
        <ReactFlow<VisitNodeRenderType>
          defaultNodes={board.nodes}
          defaultEdges={board.edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          fitView
          fitViewOptions={{ minZoom: DEFAULT_ZOOM, maxZoom: DEFAULT_ZOOM }}
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
