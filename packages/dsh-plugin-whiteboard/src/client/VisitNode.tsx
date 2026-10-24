import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import styles from './VisitNode.module.css'

/** 概念数据均为 mock，验证三段式结构用。 */
export interface VisitNodeData extends Record<string, unknown> {
  header: { title: string }
  body: string[]
  footer: { text: string; tag: string }
}

export type VisitNodeType = Node<VisitNodeData, 'visit'>

/**
 * 原子节点组件：Header / Body / Footer 三段，不拆分组合件。
 * 选中态走 NodeProps.selected + 条件类，不依赖 RF wrapper 的 .selected 全局类。
 */
export function VisitNode({ data, selected }: NodeProps<VisitNodeType>) {
  return (
    <div className={clsx(styles._, 'tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pb-3 tw:pt-4', selected && styles.selected)}>
      <Handle type="target" position={Position.Left} isConnectable={false} className={styles['VisitNode-handle']} />
      <header className={clsx(styles['VisitNode-header'], 'tw:pl-1.5')}>
        <strong className={styles['VisitNode-title']}>{data.header.title}</strong>
      </header>
      <ul className={clsx(styles['VisitNode-body'], 'tw:m-0 tw:pl-5 tw:flex tw:flex-col tw:gap-2')}>
        {data.body.map(sentence => <li key={sentence}>{sentence}</li>)}
      </ul>
      <footer className={clsx(styles['VisitNode-footer'], 'tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-1.5')}>
        <span>{data.footer.text}</span>
        <span className={clsx(styles['VisitNode-tag'], 'tw:shrink-0')}>{data.footer.tag}</span>
      </footer>
      <Handle type="source" position={Position.Right} isConnectable={false} className={styles['VisitNode-handle']} />
    </div>
  )
}
