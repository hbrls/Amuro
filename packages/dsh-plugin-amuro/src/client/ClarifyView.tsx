import clsx from 'clsx'
import type { ClarifyRecord, ClarifySnapshot } from './clarifyProjection'
import styles from './ClarifyView.module.css'

export interface ClarifyViewProps {
  snapshot: ClarifySnapshot
}

function ClarifyTime({ time }: Pick<ClarifyRecord, 'time'>) {
  if (!Number.isFinite(time)) return null
  return <time className={styles.time}>{new Date(time).toLocaleString()}</time>
}

function ClarifyRecordView({ record }: { record: ClarifyRecord }) {
  return (
    <li className={clsx(styles.record, 'tw:flex tw:flex-col tw:gap-2 tw:p-4')}>
      <div className="tw:flex tw:min-w-0 tw:items-center tw:justify-between tw:gap-3">
        <span className={styles.type}>{record.type ?? 'clarify'}</span>
        <ClarifyTime time={record.time} />
      </div>
      {record.parseError === undefined ? (
        <p className={styles.payload}>{record.payload}</p>
      ) : (
        <>
          <p className={styles.error}>Invalid clarify arguments: {record.parseError}</p>
          <pre className={clsx(styles.raw, 'tw:m-0 tw:p-3')}>{record.argumentsText}</pre>
        </>
      )}
    </li>
  )
}

/** Pure renderer for the in-memory target snapshot. */
export function ClarifyView({ snapshot }: ClarifyViewProps) {
  const { records } = snapshot

  return (
    <section className={clsx(styles.view, 'tw:flex tw:h-full tw:min-h-0 tw:flex-col')} aria-label="Clarify calls">
      <header className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
        <h2 className={clsx(styles.heading, 'tw:m-0')}>Clarify</h2>
        {records.length > 0 && <span className={styles.count}>{records.length}</span>}
      </header>
      {records.length === 0 ? (
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:p-6">
          <p className={clsx(styles.empty, 'tw:m-0')}>No clarify calls in the loaded conversation window.</p>
        </div>
      ) : (
        <ol className="tw:m-0 tw:flex tw:min-h-0 tw:flex-1 tw:list-none tw:flex-col tw:gap-3 tw:overflow-y-auto tw:p-4">
          {records.map((record) => <ClarifyRecordView key={record.callId} record={record} />)}
        </ol>
      )}
    </section>
  )
}
