import { IconLoadingOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import styles from './Turns.module.css'

/** Presentational UI for dsh-client-ui-infra; all data and state come from props. */
export function Turns({ turns, loading, loadError, pending, className }) {
  return (
    <section className={[styles.turnList, className].filter(Boolean).join(' ')} aria-label="当前会话 Turn 列表">
      {loadError ? <div role="alert">Turn 加载失败</div> : loading ? <div role="status">正在加载 Turn…</div> : turns.length === 0 && !pending ? <div>暂无 Turn</div> : turns.map(({ id, turnTag, stepTag, stepLabel, userText, assistantText, assistantTitle, loading }) => (
        <div key={id} className={styles.turnRow}>
          <div className={styles.turnLine}>
            <span className={`${styles.kindTag} ${styles.neutral}`} aria-label={`Turn ${id}`}>{turnTag}</span>
            <span className={`${styles.kindTag} ${styles.user}`} data-role-kind="user">USER</span>
            {userText}
          </div>
          {loading ? <div className={styles.turnLoading} role="status" aria-label="Turn 进行中"><IconLoadingOutlineRegular size={16} /></div> : (
            <div className={styles.turnLine} title={assistantTitle}>
              <span className={`${styles.kindTag} ${styles.neutral}`} aria-label={stepLabel}>{stepTag}</span>
              <span className={`${styles.kindTag} ${styles.assistant}`} data-role-kind="message">ASSISTANT</span>
              {assistantText}
            </div>
          )}
        </div>
      ))}
      {pending && <div className={styles.turnLoading} role="status" aria-label="Turn 进行中"><IconLoadingOutlineRegular size={16} /></div>}
    </section>
  )
}
