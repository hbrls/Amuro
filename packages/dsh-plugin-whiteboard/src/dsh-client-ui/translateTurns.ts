import type { BoundConversation, SessionBinding, UserMessageNode } from './types'

export interface TurnSummary {
  turn: number
  completed: boolean
  user: UserMessageNode | undefined
  lastStep: number | undefined
  blockKinds: string[]
  text: string | undefined
}

export interface TurnListSnapshot {
  turns: TurnSummary[]
  running: boolean
}

export type TurnBoundary = 'turn/start' | 'turn/end' | 'user/message'

/** Publish User input immediately, but expose Assistant output only for completed Turns. */
export function createTurnSource(binding: SessionBinding, conversation: BoundConversation) {
  return {
    getTurns: async (): Promise<TurnListSnapshot> => {
      await binding.session.open()
      await binding.session.loadThrough(0)
      conversation.activate('chat')
      const snapshot = conversation.target('chat').getSnapshot()
      if (!snapshot) throw new Error('Whiteboard: Chat snapshot is unavailable')
      return {
        running: conversation.openTurn.getSnapshot() !== undefined,
        turns: snapshot.timeline.turnOrder
          .map(turn => {
            const record = snapshot.timeline.turns.get(turn)
            const completed = record?.end !== undefined
            const user = snapshot.locations.getTurn(turn)
              .map(key => snapshot.nodes.get(key))
              .find((node): node is UserMessageNode => node?.kind === 'user')
            const lastStep = completed ? record?.steps.at(-1) : undefined
            const blocks = lastStep?.data.get('assistant-step')?.blocks ?? []
            const lastBlock = blocks.at(-1)
            return {
              turn,
              completed,
              user,
              lastStep: lastStep?.step,
              blockKinds: blocks.map(block => block.kind),
              text: lastBlock?.kind === 'text' ? lastBlock.text : undefined,
            }
          }).filter(turn => turn.completed || turn.user !== undefined),
      }
    },
    subscribeTurnEvents: (listener: (boundary: TurnBoundary) => void) => {
      let disposed = false
      const unsubscribe = binding.eventSource.subscribe(() => {
        const { change } = binding.eventSource.getSnapshot()
        if (change.kind !== 'append') return
        for (const { event } of change.entries) {
          if (event.type !== 'turn/start' && event.type !== 'turn/end' && event.type !== 'user/message') continue
          const boundary: TurnBoundary = event.type
          // Finish feed assembly before the component reads the updated Chat snapshot.
          queueMicrotask(() => { if (!disposed) listener(boundary) })
        }
      })
      return () => { disposed = true; unsubscribe() }
    },
  }
}
