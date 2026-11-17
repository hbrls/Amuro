import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import { useFillDraft } from './fillDraft'
import styles from './VisitNode.module.css'

export interface VisitNodeData extends Record<string, unknown> {
  workspace: string
  header: { title: string }
  body: string[]
  /** 进度展示（如 "0%"）；footer 的日期与 tag 已废弃。 */
  progress: string
}

/** 节点 ID；ID 不代表推进顺序。 */
export type VisitNodeId = string

export type VisitNodeType = Node<VisitNodeData, 'visit'> & { id: VisitNodeId }

/** 渲染数据：highlight 由 deriveBoard 推导注入，不属于工具提交的数据。 */
export type VisitNodeRenderData = VisitNodeData & { highlight: boolean }

export type VisitNodeRenderType = Node<VisitNodeRenderData, 'visit'> & { id: VisitNodeId }

/**
 * 卡片带入对话框的文本。卡片没有 Description 字段：backstage 的 Description
 * 各节在 reload 时已展开为 body 条目，这里按标题行 + 列表项还原为可读文本。
 */
function describeCard(id: string, data: VisitNodeData) {
  return [`${id} · ${data.header.title}`, ...data.body.map(sentence => `- ${sentence}`)].join('\n')
}

/**
 * 原子节点组件：Header / Body / Footer 三段，不拆分组合件。
 * 选中态走 NodeProps.selected + 条件类，不依赖 RF wrapper 的 .selected 全局类。
 * 高亮态（data.highlight）与选中态共用同一条边框规则。
 */
export function VisitNode({ id, data, selected }: NodeProps<VisitNodeRenderType>) {
  const fillDraft = useFillDraft()
  return (
    <div className={clsx(styles._, 'tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pb-3 tw:pt-4', selected && styles.selected, data.highlight && styles.highlight)}>
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
        <button
          type="button"
          className={clsx(styles['VisitNode-tag'], 'nodrag nopan')}
          title="将本卡片的描述填入对话框（不发送）"
          disabled={fillDraft === null}
          onClick={() => fillDraft?.(describeCard(id, data))}
        >
          {data.workspace}
        </button>
      </footer>
    </div>
  )
}
