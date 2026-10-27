/** Host services and registration APIs available to the White Board plugin entry. */
export interface BaseContext {
  effect<T>(effect: () => T, label?: string): T
  inject(names: string[], callback: (scope: WhiteBoardContextServices) => void): void
  slots: {
    inject(name: string, callback: () => unknown): void
    register(meta: Record<string, unknown>, component: unknown): unknown
  }
}

export interface WhiteBoardContextServices extends BaseContext {
  uiWorkspace: any
  sessions: any
  conversation: any
  workspaces: any
}
