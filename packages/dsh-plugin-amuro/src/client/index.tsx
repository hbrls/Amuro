import { IconPlayOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import { AmuroPage } from './AmuroPage'
import './styles.css'

// TODO: swap IconPlayOutlineRegular for an Amuro-themed icon once available.
/** Sidebar 面板图标，照 sidebar.panellist 契约转发官方图标。 */
function Icon({ size }: { size?: number }) {
  return <IconPlayOutlineRegular size={size} />
}

interface SlotsContext {
  slots: {
    inject(name: string, callback: () => unknown): void
    register(meta: Record<string, unknown>, component: unknown): unknown
  }
}

export const inject = ['slots']

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
}
