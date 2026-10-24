import { Background, BackgroundVariant, Controls, MiniMap, Panel, ReactFlow, useReactFlow, useViewport } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import clsx from 'clsx'
import { nodes, edges } from './database.js'
import { VisitNode, type VisitNodeType } from './VisitNode'
import styles from './WhiteBoard.module.css'

/** nodeTypes 必须是模块级常量（RF v12 稳定引用要求）。 */
const nodeTypes = { visit: VisitNode }
const DEFAULT_ZOOM = 0.75

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
export function WhiteBoardPage() {
  return (
    <div className={styles._}>
      {/* 非受控模式（defaultNodes）：受控 nodes 不配 onNodesChange 时，userNode.measured
          永远不被回写，MiniMap 缩略图与拖拽都会失效（实测确诊 2026-10-23）。 */}
      <ReactFlow<VisitNodeType>
        defaultNodes={nodes}
        defaultEdges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ minZoom: DEFAULT_ZOOM, maxZoom: DEFAULT_ZOOM }}
      >
        <Background variant={BackgroundVariant.Dots} />
        <MiniMap />
        <Controls />
        <ZoomIndicator />
      </ReactFlow>
    </div>
  )
}
