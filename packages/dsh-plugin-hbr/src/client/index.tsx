import { ClarifyCountButton, ClarifyView } from './ClarifyView'
import {
  CLARIFY_TARGET,
  EMPTY_CLARIFY_SNAPSHOT,
  clarifyCallDefinition,
  clarifyViewDefinition,
  type ClarifySnapshot,
} from './clarifyProjection'
import './styles.css'

interface SnapshotSource<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

interface HbrContext {
  effect(effect: () => unknown, label: string): unknown
  slots: {
    inject(name: string, callback: () => unknown): void
    register(meta: Record<string, unknown>, component: unknown): unknown
    entries(name: string): Array<{ store?: unknown }>
  }
  uiConversation: {
    events: { register(definition: unknown): unknown }
    views: { register(definition: unknown): unknown }
    binding(binding: object): {
      target(target: string): SnapshotSource<ClarifySnapshot | undefined>
    }
  }
  uiSession: {
    provide(descriptor: {
      hooks: string[]
      resolve(binding: object): { hooks: { clarify: SnapshotSource<ClarifySnapshot> } }
    }): unknown
  }
  uiWorkspace: {
    openSession(sessionId: string): void
  }
}

const CLARIFY_VIEW_ID = 'plugin-hbr-clarify'

interface ClarifySlotProps {
  useClarify<T>(selector: (snapshot: ClarifySnapshot) => T): T
}

interface ClarifyCountButtonSlotProps extends ClarifySlotProps {
  sessionId: string
  actions: {
    setView(view: string): void
  }
  openSession(sessionId: string): void
}

function ClarifyViewSlot({ useClarify }: ClarifySlotProps) {
  const snapshot = useClarify((value) => value)
  return <ClarifyView snapshot={snapshot} />
}

function ClarifyCountButtonSlot({ sessionId, actions, openSession, useClarify }: ClarifyCountButtonSlotProps) {
  const snapshot = useClarify((value) => value)
  return (
    <ClarifyCountButton
      snapshot={snapshot}
      onOpen={() => {
        openSession(sessionId)
        actions.setView(CLARIFY_VIEW_ID)
      }}
    />
  )
}

export const inject = ['slots', 'uiConversation', 'uiSession', 'uiWorkspace']

export function apply(ctx: HbrContext) {
  ctx.effect(
    () => ctx.uiConversation.events.register(clarifyCallDefinition),
    'plugin-hbr: clarify event projection',
  )
  ctx.effect(
    () => ctx.uiConversation.views.register(clarifyViewDefinition),
    'plugin-hbr: clarify target',
  )

  const clarifySources = new WeakMap<object, SnapshotSource<ClarifySnapshot>>()
  const clarifySource = (binding: object): SnapshotSource<ClarifySnapshot> => {
    let source = clarifySources.get(binding)
    if (source === undefined) {
      const target = ctx.uiConversation.binding(binding).target(CLARIFY_TARGET)
      source = {
        getSnapshot: () => target.getSnapshot() ?? EMPTY_CLARIFY_SNAPSHOT,
        subscribe: (listener) => target.subscribe(listener),
      }
      clarifySources.set(binding, source)
    }
    return source
  }

  ctx.effect(() => ctx.uiSession.provide({
    hooks: ['clarify'],
    resolve: (binding) => ({ hooks: { clarify: clarifySource(binding) } }),
  }), 'plugin-hbr: clarify session hook')

  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: CLARIFY_VIEW_ID,
    order: 20,
    label: 'Clarify',
  }, ClarifyViewSlot))

  ctx.slots.inject('conversation.input.right', () => {
    const conversationStore = ctx.slots.entries('conversation.session')
      .find((entry) => entry.store !== undefined)?.store
    if (conversationStore === undefined) {
      throw new Error('plugin-hbr: conversation View store is unavailable')
    }
    return ctx.slots.register({
      name: 'conversation.input.right',
      id: 'plugin-hbr-clarify-count',
      order: 20,
      store: conversationStore,
      inject: () => ({
        openSession: (sessionId: string) => ctx.uiWorkspace.openSession(sessionId),
      }),
    }, ClarifyCountButtonSlot)
  })
}
