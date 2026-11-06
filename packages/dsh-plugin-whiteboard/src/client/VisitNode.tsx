import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import styles from './VisitNode.module.css'

/** 离线节点数据。 */
export interface VisitNodeData extends Record<string, unknown> {
  workspace: string
  workspaceId?: string
  header: { title: string }
  body: string[]
  /** 进度展示（如 "0%"）；footer 的日期与 tag 已废弃。 */
  progress: string
}

/** 全局稳定编号，离线数据使用 VISIT-NNN；编号不代表推进顺序。 */
export type VisitNodeId = `VISIT-${number}`

export type VisitNodeType = Node<VisitNodeData, 'visit'> & { id: VisitNodeId }

export type VisitNodeRenderType = VisitNodeType

/**
 * 原子节点组件：Header / Body / Footer 三段，不拆分组合件。
 * 选中态走 NodeProps.selected + 条件类，不依赖 RF wrapper 的 .selected 全局类。
 */
export function VisitNode({ id, data, selected }: NodeProps<VisitNodeRenderType>) {
  return (
    <div className={clsx(styles._, 'tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pb-3 tw:pt-4', selected && styles.selected)}>
      <header className={clsx(styles['VisitNode-header'], 'tw:pl-1.5')}>
        {/* 标题行延展至卡片左右边沿，连接点的 50% 高度只相对标题计算。 */}
        <div className="tw:relative tw:-ml-4.5 tw:-mr-3 tw:pl-4.5 tw:pr-3">
          <Handle type="target" position={Position.Left} isConnectable={false} className={styles['VisitNode-handle']} />
          <strong className={styles['VisitNode-title']}>{`${id} · ${data.header.title}`}</strong>
          <Handle type="source" position={Position.Right} isConnectable={false} className={styles['VisitNode-handle']} />
        </div>
      </header>
      <ul className={clsx(styles['VisitNode-body'], 'tw:m-0 tw:pl-5 tw:flex tw:flex-col tw:gap-2')}>
        {data.body.map(sentence => <li key={sentence}>{sentence}</li>)}
      </ul>
      <footer className={clsx(styles['VisitNode-footer'], 'tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-1.5')}>
        <span>{data.progress}</span>
        <span className={clsx(styles['VisitNode-tag'], 'nodrag nopan')}>{data.workspace}</span>
      </footer>
    </div>
  )
}
