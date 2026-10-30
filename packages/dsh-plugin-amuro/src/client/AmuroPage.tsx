import clsx from 'clsx'
import styles from './Amuro.module.css'

/**
 * main keyed slot 页面。两层样式示例（手册 §6.2）：
 * 布局用 tw: 工具类，业务视觉用 CSS Modules + dsw token。
 */
export function AmuroPage() {
  return (
    <div className={clsx(styles.page, 'tw:flex tw:h-full tw:flex-col tw:gap-4 tw:p-6')}>
      <h1 className={styles.title}>Hello Amuro</h1>
      <div className="tw:flex tw:gap-4">
        <section className={clsx(styles.card, 'tw:flex-1 tw:p-4')}>
          <p className={styles.caption}>卡片 A</p>
        </section>
        <section className={clsx(styles.card, 'tw:flex-1 tw:p-4')}>
          <p className={styles.caption}>卡片 B</p>
        </section>
      </div>
    </div>
  )
}
