import { ConversationView } from './ConversationView'
import { createTurnSource } from '../dsh-client-ui/translateTurns'
import type { BaseContext } from './types'
import './styles.css'

export const inject = ['slots']

export function apply(ctx: BaseContext) {
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
