import { IconPlayOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import { AmuroPage } from './AmuroPage'
import { ClarifyView } from './ClarifyView'
import {
  CLARIFY_TARGET,
  EMPTY_CLARIFY_SNAPSHOT,
  clarifyCallDefinition,
  clarifyViewDefinition,
  type ClarifySnapshot,
} from './clarifyProjection'
import './styles.css'

// TODO: swap IconPlayOutlineRegular for an Amuro-themed icon once available.
/** Sidebar 面板图标，照 sidebar.panellist 契约转发官方图标。 */
function Icon({ size }: { size?: number }) {
  return <IconPlayOutlineRegular size={size} />
}

interface SnapshotSource<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

interface SlotsContext {
  slots: {
    inject(name: string, callback: () => unknown): void
    register(meta: Record<string, unknown>, component: unknown): unknown
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
}

interface ClarifySlotProps {
  useClarify<T>(selector: (snapshot: ClarifySnapshot) => T): T
}

function ClarifyViewSlot({ useClarify }: ClarifySlotProps) {
  const snapshot = useClarify((value) => value)
  return <ClarifyView snapshot={snapshot} />
}

export const inject = ['slots', 'uiConversation', 'uiSession']

export function apply(ctx: SlotsContext) {
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: 'plugin-amuro',
    order: 1,
    label: 'Amuro',
  }, Icon))

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: 'plugin-amuro',
  }, () => <AmuroPage />))

  ctx.uiConversation.events.register(clarifyCallDefinition)
  ctx.uiConversation.views.register(clarifyViewDefinition)

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

  ctx.uiSession.provide({
    hooks: ['clarify'],
    resolve: (binding) => ({ hooks: { clarify: clarifySource(binding) } }),
  })

  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'plugin-amuro-clarify',
    order: 20,
    label: 'Clarify',
  }, ClarifyViewSlot))
}
