import { IconLoadingOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import styles from './Turns.module.css'

/** Presentational UI for dsh-client-ui-infra; all data and state come from props. */
export function Turns({ turns, loading, loadError, pending, className }) {
  return (
    <section className={[styles.turnList, className].filter(Boolean).join(' ')} aria-label="当前会话 Turn 列表">
      {loadError ? <div role="alert">Turn 加载失败</div> : loading ? <div role="status">正在加载 Turn…</div> : turns.length === 0 && !pending ? <div>暂无 Turn</div> : turns.map(({ id, userText, assistantText, assistantTitle, loading }) => (
        <div key={id} className={styles.turnRow}>
          <div className={styles.turnLine}>{userText}</div>
          {loading ? <div className={styles.turnLoading} role="status" aria-label="Turn 进行中"><IconLoadingOutlineRegular size={16} /></div> : <div className={styles.turnLine} title={assistantTitle}>{assistantText}</div>}
        </div>
      ))}
      {pending && <div className={styles.turnLoading} role="status" aria-label="Turn 进行中"><IconLoadingOutlineRegular size={16} /></div>}
    </section>
  )
}
