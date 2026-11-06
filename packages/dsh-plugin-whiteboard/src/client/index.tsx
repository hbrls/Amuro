import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { ConversationView } from './ConversationView'
import { createTurnSource } from '../dsh-client-ui/translateTurns'
import type { BaseContext, WhiteBoardContextServices } from './types'
import './styles.css'

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

export const inject = ['slots']

export function apply(ctx: BaseContext) {
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

  ctx.inject(['sessions', 'uiConversation'], services => {
    ctx.slots.inject('conversation.view', () => ctx.slots.register({
      name: 'conversation.view',
      id: 'whiteboard',
      order: 90,
      label: 'Whiteboard',
      inject: (sessionId: string) => {
        const binding = services.sessions.binding(sessionId)
        if (!binding) throw new Error(`Whiteboard: unknown session "${sessionId}"`)
        return createTurnSource(binding, services.uiConversation.binding(binding))
      },
    }, ConversationView))
  })
}
