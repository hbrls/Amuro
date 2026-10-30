export const CLARIFY_TARGET = 'amuro-clarify'

export interface ClarifyRecord {
  readonly callId: string
  readonly seq: number
  readonly time: number
  readonly type?: string
  readonly payload?: string
  readonly argumentsText: string
  readonly parseError?: string
}

export interface ClarifySnapshot {
  readonly records: readonly ClarifyRecord[]
}

export const EMPTY_CLARIFY_SNAPSHOT: ClarifySnapshot = Object.freeze({
  records: Object.freeze([]),
})

export interface ClarifyToolCallEvent {
  readonly type: 'tool/call'
  readonly seq: number
  readonly time: number
  readonly data: {
    readonly callId: string | number
    readonly name: string
    readonly arguments: string
  }
}

export interface ClarifyMatch {
  readonly event: ClarifyToolCallEvent
  readonly role: 'start'
}

export interface ClarifyContext {
  readonly key: string
  readonly kind: string
  readonly id: string
  readonly state?: ClarifyRecord
}

export interface ClarifyViewNode {
  readonly key: string
  readonly kind: string
  readonly id: string
  readonly target: typeof CLARIFY_TARGET
  readonly anchorSeq: number
  readonly data: ClarifyRecord
}

function invalidFieldsError(fields: string[]): string {
  return `Expected ${fields.join(' and ')} to be ${fields.length === 1 ? 'a string' : 'strings'}.`
}

function parseArguments(argumentsText: string): Pick<ClarifyRecord, 'type' | 'payload' | 'parseError'> {
  try {
    const parsed: unknown = JSON.parse(argumentsText)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { parseError: 'Expected a JSON object with string type and payload fields.' }
    }

    const { type, payload } = parsed as Record<string, unknown>
    const invalidFields: string[] = []
    if (typeof type !== 'string') invalidFields.push('type')
    if (typeof payload !== 'string') invalidFields.push('payload')

    return {
      ...typeof type === 'string' ? { type } : {},
      ...typeof payload === 'string' ? { payload } : {},
      ...invalidFields.length > 0 ? { parseError: invalidFieldsError(invalidFields) } : {},
    }
  } catch (error) {
    return {
      parseError: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export function createClarifyRecord(event: ClarifyToolCallEvent): ClarifyRecord {
  const argumentsText = event.data.arguments
  return Object.freeze({
    callId: String(event.data.callId),
    seq: event.seq,
    time: event.time,
    argumentsText,
    ...parseArguments(argumentsText),
  })
}

export function matchClarifyCall(event: ClarifyToolCallEvent): { id: string; role: 'start' } | null {
  if (event.data.name !== 'clarify') return null
  return { id: String(event.data.callId), role: 'start' }
}

export const clarifyCallDefinition = {
  kind: 'amuro-clarify-call',
  target: CLARIFY_TARGET,
  match: {
    'tool/call': matchClarifyCall,
  },
  start: (_context: unknown, match: ClarifyMatch) => createClarifyRecord(match.event),
  update: (context: ClarifyContext) => context.state,
  buildViewNode: (context: ClarifyContext): ClarifyViewNode | null => {
    if (context.state === undefined) return null
    return Object.freeze({
      key: context.key,
      kind: context.kind,
      id: context.id,
      target: CLARIFY_TARGET,
      anchorSeq: context.state.seq,
      data: context.state,
    })
  },
}

function compareRecords(left: ClarifyRecord, right: ClarifyRecord): number {
  return left.seq - right.seq || (left.callId < right.callId ? -1 : left.callId > right.callId ? 1 : 0)
}

export class ClarifySnapshotBuilder {
  readonly empty = EMPTY_CLARIFY_SNAPSHOT
  private nodes = new Map<string, ClarifyViewNode>()
  private currentSnapshot = EMPTY_CLARIFY_SNAPSHOT

  replace(input: { nodes: readonly ClarifyViewNode[] }): ClarifySnapshot {
    this.nodes = new Map(input.nodes.map((node) => [node.key, node]))
    return this.rebuildSnapshot()
  }

  apply(input: { upserts: readonly ClarifyViewNode[] }): ClarifySnapshot {
    if (input.upserts.length === 0) return this.currentSnapshot
    for (const node of input.upserts) this.nodes.set(node.key, node)
    return this.rebuildSnapshot()
  }

  private rebuildSnapshot(): ClarifySnapshot {
    if (this.nodes.size === 0) {
      this.currentSnapshot = EMPTY_CLARIFY_SNAPSHOT
      return this.currentSnapshot
    }

    const records = Object.freeze(
      [...this.nodes.values()].map((node) => node.data).sort(compareRecords),
    )
    this.currentSnapshot = Object.freeze({ records })
    return this.currentSnapshot
  }
}

export const clarifyViewDefinition = {
  target: CLARIFY_TARGET,
  create: () => new ClarifySnapshotBuilder(),
}
