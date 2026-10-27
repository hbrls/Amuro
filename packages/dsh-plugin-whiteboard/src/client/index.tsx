import { Button, IconPlayOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import { WhiteBoardPage } from './WhiteBoardPage'
import { WhiteBoardConversation } from './WhiteBoardConversation'
import type { BaseContext, WhiteBoardContextServices } from './types'
import './styles.css'

/** Sidebar 面板图标，照 sidebar.panellist 契约转发官方图标。 */
function Icon({ size }: { size?: number }) {
  return <IconPlayOutlineRegular size={size} />
}

const END_DISCUSSION_PROMPT = '分析具体的实施方案，并写入 .context/current-task.md，覆盖它。'

function EndDiscussionButton({ services, session }: {
  services: WhiteBoardContextServices
  session?: { sessionId?: string }
}) {
  const handleClick = () => {
    const sessionId = session?.sessionId
    if (!sessionId) return

    const binding = services.sessions.binding(sessionId)
    if (!binding) return

    services.conversation.input.requestDraftInitialization(binding, {
      prompt: END_DISCUSSION_PROMPT,
      whenDraftExists: 'append',
    })
  }

  return <Button type="button" variant="secondary" onClick={handleClick}>结束讨论</Button>
}

export const inject = ['slots', 'uiWorkspace']

export function apply(ctx: BaseContext) {
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: 'plugin-whiteboard',
    order: 1,
    label: 'White Board',
  }, Icon))

  ctx.slots.inject('whiteboard.conversation', () => ctx.slots.register({
    name: 'whiteboard.conversation',
    // 注意：不要在这里的 children 声明 'conversation.content' —— children 是
    // renderSlot 的声明表，factory 由 renderFactorySlot 按名解析，声明了也只是空 slot。
  }, WhiteBoardConversation))

  // Add a session-scoped action above the official input without replacing the Composer.
  ctx.inject(['sessions', 'conversation', 'slots'], (services: WhiteBoardContextServices) => {
    ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
      name: 'conversation.input.dock',
      kind: 'list',
      scope: 'session',
      id: 'whiteboard-end-discussion',
      order: 90,
    }, (props: { session?: { sessionId?: string } }) => <EndDiscussionButton services={services} {...props} />))
  })

  // Register the main panel as soon as the core board services are ready; the
  // Conversation providers are optional and must not gate panel navigation.
  ctx.inject(['uiWorkspace', 'sessions', 'conversation', 'workspaces', 'slots'], (services: WhiteBoardContextServices) => {
    ctx.slots.inject('main', () => ctx.slots.register({
      name: 'main',
      key: 'plugin-whiteboard',
      children: { 'whiteboard.conversation': { kind: 'single', scope: 'session' } },
    }, (props: any) => <WhiteBoardPage ctx={services} {...props} />))
  })
}
