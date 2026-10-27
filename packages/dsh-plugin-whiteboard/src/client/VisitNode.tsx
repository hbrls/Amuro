import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { useContext, useState } from 'react'
import clsx from 'clsx'
import { Button, IconSendOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import styles from './VisitNode.module.css'
import { DEFAULT_CONVERSATION_WORKSPACE_ID } from './config.js'
import { WhiteBoardConversationContext, WhiteBoardContext } from './WhiteBoardContext'

function useWhiteBoardContext() {
  return useContext(WhiteBoardContext)
}

/** 离线节点数据；未指定工作区时使用固定的 Amuro 工作区。 */
export interface VisitNodeData extends Record<string, unknown> {
  workspaceId?: string
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
  const ctx = useWhiteBoardContext()
  const conversation = useContext(WhiteBoardConversationContext)
  const [conversationError, setConversationError] = useState('')
  const [creatingConversation, setCreatingConversation] = useState(false)

  const startConversation = async () => {
    if (!ctx || !conversation || creatingConversation) return
    setCreatingConversation(true)
    setConversationError('')
    try {
      const workspaceId = data.workspaceId ?? DEFAULT_CONVERSATION_WORKSPACE_ID
      const sessionId = await ctx.sessions.create({ workspaceId })
      const reference = ctx.sessions.retain(sessionId, { source: 'whiteboard:inlineConversation', signal: new AbortController().signal })
      conversation.open(reference)
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : '创建新会话失败。'
      setConversationError(message)
    } finally {
      setCreatingConversation(false)
    }
  }

  return (
    <>
      <div className={clsx(styles._, 'tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pb-3 tw:pt-4', selected && styles.selected)}>
        <Handle type="target" position={Position.Left} isConnectable={false} className={styles['VisitNode-handle']} />
        <Handle id="top" type="target" position={Position.Top} isConnectable={false} className={styles['VisitNode-handle']} />
        <header className={clsx(styles['VisitNode-header'], 'tw:pl-1.5')}>
          <strong className={styles['VisitNode-title']}>{data.header.title}</strong>
        </header>
        <ul className={clsx(styles['VisitNode-body'], 'tw:m-0 tw:pl-5 tw:flex tw:flex-col tw:gap-2')}>
          {data.body.map(sentence => <li key={sentence}>{sentence}</li>)}
        </ul>
        <footer className={clsx(styles['VisitNode-footer'], 'tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-1.5')}>
          <span>{data.footer.text}</span>
          <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1">
            <span className={styles['VisitNode-tag']}>{data.footer.tag}</span>
            <span className="nodrag nopan tw:flex" onClick={event => event.stopPropagation()}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="tw:h-7 tw:w-7 tw:justify-center tw:p-0"
                aria-label={creatingConversation ? '正在创建对话' : '在右侧开始新对话'}
                title={creatingConversation ? '正在创建对话' : '在右侧开始新对话'}
                disabled={creatingConversation}
                onClick={event => {
                  event.stopPropagation()
                  void startConversation()
                }}
              >
                <IconSendOutlineRegular size={16} />
              </Button>
            </span>
          </div>
        </footer>
        {conversationError && <p role="alert" className={clsx(styles['VisitNode-error'], 'tw:m-0 tw:px-1.5')}>{conversationError}</p>}
        <Handle type="source" position={Position.Right} isConnectable={false} className={styles['VisitNode-handle']} />
        <Handle id="bottom" type="source" position={Position.Bottom} isConnectable={false} className={styles['VisitNode-handle']} />
      </div>

    </>
  )
}
