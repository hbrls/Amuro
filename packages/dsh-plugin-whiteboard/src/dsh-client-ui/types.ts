/**
 * Local structural types for the DSH 0.2.2-rc.1 APIs consumed by this UI.
 * Checked against ui-conversation, ui-chat and api-session-controller sources.
 * These describe the fields we use, not the complete upstream SDK.
 */

export interface SessionEvent<Type extends string = string, Data = unknown> {
  readonly type: Type
  readonly seq: number
  readonly time: number
  readonly data: Data
}

export type TurnStartEvent = SessionEvent<'turn/start', { turn: number }>
export type TurnEndEvent = SessionEvent<'turn/end', { turn: number }>
export type StepStartEvent = SessionEvent<'step/start', { turn: number; step: number }>
export type StepEndEvent = SessionEvent<'step/end', { turn: number; step: number }>

/** A Turn owns ordered Steps; User messages are indexed separately as Chat nodes. */
export interface Turn {
  readonly turn: number
  readonly start: TurnStartEvent | undefined
  readonly end: TurnEndEvent | undefined
  readonly status: 'open' | 'closed' | 'unknown'
  readonly steps: readonly Step[]
  readonly data: ReadonlyMap<string, unknown>
}

/** A Step has no kind; its data map holds contributions such as assistant-step. */
export interface Step {
  readonly turn: number
  readonly step: number
  readonly start: StepStartEvent | undefined
  readonly end: StepEndEvent | undefined
  readonly status: 'open' | 'closed'
  readonly data: StepData
}

export interface StepData extends ReadonlyMap<string, unknown> {
  get(key: 'assistant-step'): AssistantStepData | undefined
  get(key: string): unknown
}

export interface AssistantStepData {
  readonly turn: number
  readonly step: number
  readonly status: 'running' | 'settled' | 'interrupted'
  readonly time: number
  readonly blocks: readonly AssistantBlock[]
}

/** Chat projection blocks use kind; original message content blocks use type. */
export type AssistantBlock =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'reasoning'; readonly text: string }
  | { readonly kind: 'image'; readonly attachment: unknown }
  | { readonly kind: 'tool-call'; readonly callId: string; readonly name: string; readonly argsRaw: string }
  | { readonly kind: 'other'; readonly block: unknown }

/** Only the original message fields needed for text rendering are described here. */
export interface MessageContentBlock {
  readonly type: string
  readonly text?: string
}

export interface ChatNode {
  readonly key: string
  readonly kind: string
  readonly data: unknown
}

export interface UserMessageNode extends ChatNode {
  readonly kind: 'user'
  readonly data: {
    readonly kind: 'user'
    readonly content: readonly MessageContentBlock[]
  }
}

export interface ConversationTimeline {
  readonly turnOrder: readonly number[]
  readonly turns: ReadonlyMap<number, Turn>
}

export interface ChatSnapshot {
  readonly timeline: ConversationTimeline
  readonly locations: {
    getTurn(turn: number): readonly string[]
    getStep(turn: number, step: number): readonly string[]
  }
  readonly nodes: {
    get(key: string): ChatNode | undefined
  }
}

export interface SnapshotSource<Value> {
  getSnapshot(): Value
  subscribe(listener: () => void): () => void
}

export interface SessionEventEntry {
  readonly event: SessionEvent
}

export interface SessionEventSnapshot {
  readonly change: {
    readonly kind: 'replace' | 'prepend' | 'append'
    readonly entries: readonly SessionEventEntry[]
  } | {
    readonly kind: 'settle-assistant'
    readonly attemptId: string
    readonly entry?: SessionEventEntry
  }
}

/** Structural subset of the session binding used to load and observe history. */
export interface SessionBinding {
  readonly session: {
    open(): Promise<unknown>
    loadThrough(seq: number): Promise<unknown>
  }
  readonly eventSource: SnapshotSource<SessionEventSnapshot>
}

export interface BoundConversation {
  activate(target: 'chat'): void
  target(target: 'chat'): SnapshotSource<ChatSnapshot | undefined>
  /** The open Turn's number, rather than the Turn record itself. */
  readonly openTurn: SnapshotSource<number | undefined>
}
