import { createContext } from 'react'

export interface IWhiteBoardContext {
  effect<T>(effect: () => T, label?: string): T
  uiWorkspace: { openSession(target: string): unknown }
  sessions: {
    binding(sessionId: string): unknown
    list: { getSnapshot(): { byId: Record<string, unknown> } }
    /** Resolves to the created session id; rejects with SessionCreateError on failure. */
    create(options?: { cwd?: string; workspaceId?: string }): Promise<string>
    retain(sessionId: string, options: { source: string; signal: AbortSignal }): SessionReference
  }
  conversation: {
    input: {
      requestDraftInitialization(
        binding: unknown,
        options: { prompt: string; whenDraftExists: 'append' | 'keep' | 'replace' },
      ): string
    }
  }
  workspaces: { list: { getSnapshot(): { archivedSessionIds: string[] } } }
}

export interface SessionReference {
  sessionId: string
  binding: unknown
  ready: Promise<unknown>
  release(): void
}

export const WhiteBoardContext = createContext<IWhiteBoardContext | null>(null)
export const WhiteBoardConversationContext = createContext<{ open(reference: SessionReference): void } | null>(null)
