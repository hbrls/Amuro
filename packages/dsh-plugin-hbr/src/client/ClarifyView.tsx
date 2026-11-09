import { Button, Tag } from '@deepseek-ai/dsh-client-ui-primitives'
import clsx from 'clsx'
import type { ClarifyRecord, ClarifySnapshot } from './clarifyProjection'
import styles from './ClarifyView.module.css'

export interface ClarifyViewProps {
  snapshot: ClarifySnapshot
}

interface ClarifyCountButtonProps extends ClarifyViewProps {
  onOpen(): void
}

export function ClarifyCountButton({ snapshot, onOpen }: ClarifyCountButtonProps) {
  const count = snapshot.records.length

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={styles.ClarifyCountButton}
      aria-label={`Open Clarify: ${count}`}
      title="Open Clarify"
      onClick={onOpen}
    >
      {count}
    </Button>
  )
}

function ClarifyRecordView({ record }: { record: ClarifyRecord }) {
  return (
    <li className={clsx(
      styles.ClarifyRecord,
      'tw:grid tw:h-8 tw:grid-cols-[6.5rem_minmax(0,1fr)] tw:items-center tw:gap-3 tw:px-3',
    )}>
      <Tag className={clsx(styles['ClarifyRecord-type'], 'tw:justify-self-start')}>{record.type}</Tag>
      <p className={styles['ClarifyRecord-payload']} title={record.payload}>{record.payload}</p>
    </li>
  )
}

export function ClarifyView({ snapshot }: ClarifyViewProps) {
  const { records } = snapshot

  return (
    <section className={clsx(styles._, 'tw:flex tw:h-full tw:min-h-0 tw:flex-col')} aria-label="Clarify calls">
      {records.length === 0 ? (
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:p-6">
          <p className={clsx(styles['ClarifyView-empty'], 'tw:m-0')}>No clarify calls in the loaded conversation window.</p>
        </div>
      ) : (
        <ol className="tw:m-0 tw:flex tw:min-h-0 tw:flex-1 tw:list-none tw:flex-col tw:gap-1 tw:overflow-y-auto tw:p-3">
          {records.map((record) => <ClarifyRecordView key={record.callId} record={record} />)}
        </ol>
      )}
    </section>
  )
}
