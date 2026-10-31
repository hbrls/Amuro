import { Background, BackgroundVariant, Controls, MiniMap, Panel, ReactFlow, useReactFlow, useViewport } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import clsx from 'clsx'
import { twigs } from './database.js'
import { VisitNode, type VisitNodeRenderType } from './VisitNode'
import styles from './WhiteBoard.module.css'
import { WhiteBoardConversationContext, WhiteBoardContext, type IWhiteBoardContext } from './WhiteBoardContext'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import conversationStyles from './WhiteBoardConversation.module.css'

/** nodeTypes 必须是模块级常量（RF v12 稳定引用要求）。 */
const DEFAULT_ZOOM = 0.75
const nodeTypes = { visit: VisitNode }

// 每条 Twig 取最上方节点的 y 作为共同顶边；横向位置与推进关系仍来自数据源。
const nodes: VisitNodeRenderType[] = twigs.flatMap(twig => {
  const y = Math.min(...twig.nodes.map(node => node.position.y))
  return twig.nodes.map(node => ({
    ...node,
    position: { ...node.position, y },
    data: { ...node.data, isCurrent: node.id === twig.currentNodeId },
  }))
})
const edges = twigs.flatMap(twig => twig.edges)

/** 当前 zoom 百分比；点击恢复默认的 75%。 */
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

/** main keyed slot 页面：画布 + VisitNode mock 贴签。点击进详情留待后续接入。 */
export function WhiteBoardPage({ ctx, SessionProvider, renderSlot }: { ctx: IWhiteBoardContext; SessionProvider: any; renderSlot: (name: string, props: any) => any }) {
  const [reference, setReference] = useState<any>(null)
  const referenceRef = useRef<any>(null)
  const openConversation = (nextReference: any) => { referenceRef.current?.release(); referenceRef.current = nextReference; setReference(nextReference) }
  const closeConversation = () => { referenceRef.current?.release(); referenceRef.current = null; setReference(null) }
  useEffect(() => () => { referenceRef.current?.release(); referenceRef.current = null }, [])
  return (
    <WhiteBoardContext.Provider value={ctx}>
      <WhiteBoardConversationContext.Provider value={{ open: openConversation }}>
        <div className={conversationStyles._}>
          <div className={styles._}>
            {/* 非受控模式（defaultNodes）：受控 nodes 不配 onNodesChange 时，userNode.measured
                永远不被回写，MiniMap 缩略图与拖拽都会失效（实测确诊 2026-10-23）。 */}
            <ReactFlow<VisitNodeRenderType>
              defaultNodes={nodes}
              defaultEdges={edges}
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
          </div>
          {reference && <aside className={conversationStyles.conversationPane}>
            <div className={conversationStyles.conversationHeader}>
              <Button type="button" variant="ghost" onClick={closeConversation}>关闭</Button>
              <Button
                type="button"
                variant="ghost"
                className={conversationStyles.officialSessionButton}
                onClick={() => ctx.uiWorkspace.openSession(reference.sessionId)}
              >Goto 官方 Session</Button>
            </div>
            <SessionProvider session={reference}>
              <div className={conversationStyles.conversation}>{renderSlot('whiteboard.conversation', {})}</div>
            </SessionProvider>
          </aside>}
        </div>
      </WhiteBoardConversationContext.Provider>
    </WhiteBoardContext.Provider>
  )
}
