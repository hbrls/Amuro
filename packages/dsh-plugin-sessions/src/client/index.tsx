import React from 'react'
import { Button, IconArchiveOutlineRegular, IconTrashOutlineRegular, IconWarningOutlineRegular, MarkdownText, Modal, relativeTime } from '@deepseek-ai/dsh-client-ui-primitives'
import styles from './Sessions.module.css'
import dialogStyles from './DeleteDialog.module.css'
import './styles.css'

const h = React.createElement
/** Locale namespace owned by this plugin. */
const NS = 'plugin-sessions';
/** The single read-only route owned by this plugin's Host half. */
const ROUTE = '/api/sessions';
/** How long one simulated deletion line takes to appear. */
const STEP_MS = 220;
/** Draft prompt carried into the Chat when a live session row is opened. */
const OPEN_PROMPT = '这是一个从 Dsh-Plugin-Sessions 跳过来的 Prompt';
/** Dialog class names, passed through the official Modal `className` props. */
const DLG = 'dsh-sessions-delete-dialog';
const DLG_CONTENT = 'dsh-sessions-delete-dialog-content';

const zh = {
  'col.workspace': '工作区',
  'col.session': '会话标题',
  'col.state': '状态',
  'col.updated': '最近活动',
  'col.id': '会话 ID',
  'col.action': '操作',
  'state.active': '活跃',
  'state.archived': '已归档',
  'session.untitled': '未命名',
  'workspace.none': '未归属工作区',
  'loading': '读取中…',
  'empty': '没有会话',
  'error': '读取失败',
  'time.now': '刚刚',
  'time.minutes': '{n}分钟',
  'time.hours': '{n}小时',
  'time.days': '{n}天',
  'time.months': '{n}个月',
  'time.years': '{n}年',
  'action.delete': '删除',
  'dialog.title': '删除会话',
  'dialog.intro': '我们将删除以下几个文件',
  'dialog.none': '没有找到可删除的文件',
  'dialog.running': '正在删除…',
  'dialog.deleted': '已删除',
  'dialog.restart': '请重启',
  'dialog.cancel': '取消',
  'dialog.confirm': '删除',
  'dialog.close': '关闭',
  'dialog.simulated': '模拟删除：不会真正修改任何文件。',
};

const en = {
  'col.workspace': 'Workspace',
  'col.session': 'Session',
  'col.state': 'State',
  'col.updated': 'Last active',
  'col.id': 'Session ID',
  'col.action': 'Actions',
  'state.active': 'Active',
  'state.archived': 'Archived',
  'session.untitled': 'Untitled',
  'workspace.none': 'No workspace',
  'loading': 'Loading…',
  'empty': 'No sessions',
  'error': 'Read failed',
  'time.now': 'now',
  'time.minutes': '{n}min',
  'time.hours': '{n}h',
  'time.days': '{n}d',
  'time.months': '{n}mo',
  'time.years': '{n}y',
  'action.delete': 'Delete',
  'dialog.title': 'Delete session',
  'dialog.intro': 'The following files will be deleted',
  'dialog.none': 'Nothing to delete was found',
  'dialog.running': 'Deleting…',
  'dialog.deleted': 'deleted',
  'dialog.restart': 'Please restart',
  'dialog.cancel': 'Cancel',
  'dialog.confirm': 'Delete',
  'dialog.close': 'Close',
  'dialog.simulated': 'Simulated deletion: no file is actually changed.',
};

/**
 * The sidebar panel glyph. The sidebar renders every `sidebar.panellist`
 * entry as `{ size, active }` at 16px (rail) or 18px (wide) and owns the
 * active styling itself, so the entry only forwards the official icon at
 * the requested size — the shape every shipped panel icon uses.
 */
const Icon = ({ size }) => h(IconArchiveOutlineRegular, { size });

/**
 * Compact relative time through the official primitives bucketing and the
 * official locale copy (same shape as dsh-client-ui-workspace's timeLabel).
 */
function timeLabel(updatedAt, now, t) {
  if (typeof updatedAt !== 'number') return '—';
  const { unit, n } = relativeTime(updatedAt, now);
  return unit === 'now' ? t('time.now') : t(`time.${unit}`, { n });
}


/**
 * One read-only request. The Host half owns the join between the Workspace
 * registry (which session is archived, and its workspace) and the Session
 * controller (title, activity, running state), and also resolves the files
 * a real delete would remove. It returns EVERY session; each row carries an
 * `archived` flag.
 */
async function readSessions(signal, t) {
  const response = await fetch(ROUTE, {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.json();
  if (body.error !== undefined) throw new Error(String(body.error));
  return body.rows.map((row) => ({
    ...row,
    workspaceTitle: row.workspaceTitle ?? t('workspace.none'),
    targets: Array.isArray(row.targets) ? row.targets : [],
  }));
}

/** All sessions as a real table, so each row can carry an action. */
function SessionTable({ rows, t, now, onDelete, onOpen }) {
  return h('table', { className: styles.table },
    h('thead', null, h('tr', null,
      h('th', { className: styles.th }, t('col.workspace')),
      h('th', { className: styles.th }, t('col.session')),
      h('th', { className: styles.th }, t('col.state')),
      h('th', { className: styles.th }, t('col.updated')),
      h('th', { className: styles.th }, t('col.id')),
      h('th', { className: styles.th }, t('col.action')))),
    h('tbody', null, rows.map((row) => {
      const archived = row.archived === true;
      const empty = row.targets.length === 0;
      return h('tr', { key: row.sessionId },
        h('td', { className: styles.td }, row.workspaceTitle),
        h('td', { className: styles.td }, row.title ?? t('session.untitled')),
        // Archived rows stay plain text. Every live session's state is a
        // Button that jumps into its Chat through the official uiWorkspace
        // navigation service.
        h('td', { className: styles.td }, archived
          ? t('state.archived')
          : h(Button, { variant: 'outline', size: 'sm', onClick: () => onOpen(row) }, t('state.active'))),
        h('td', { className: styles.td }, timeLabel(row.updatedAt, now, t)),
        h('td', { className: styles.td }, h('code', { className: styles.sessionId }, String(row.sessionId).slice(-8))),
        h('td', { className: styles.td }, h(Button, {
          variant: 'outline',
          size: 'sm',
          icon: h(IconTrashOutlineRegular, { size: 14 }),
          disabled: empty,
          onClick: () => onDelete(row),
        }, t('action.delete'))));
    })));
}

/**
 * The delete dialog. It first lists what a real delete would remove, then
 * walks that list printing one `N. <path> 已删除` line per step and ends
 * with `请重启`. Nothing is sent to the Host: this is a simulation.
 */
function DeleteDialog({ row, t, onClose }) {
  const targets = row.targets;
  const [phase, setPhase] = React.useState('confirm');
  const [done, setDone] = React.useState(0);

  React.useEffect(() => {
    if (phase !== 'running') return undefined;
    if (done >= targets.length) {
      setPhase('done');
      return undefined;
    }
    const timer = setTimeout(() => setDone((n) => n + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [phase, done, targets.length]);

  const start = React.useCallback(() => {
    setDone(0);
    setPhase('running');
  }, []);

  const requestClose = React.useCallback(() => {
    if (phase === 'running') return;
    onClose();
  }, [phase, onClose]);

  const finished = phase === 'done';
  // Only the confirm and running phases carry a notice; the finished phase
  // states the restart instead, so `请重启` is never printed twice.
  const notice = phase === 'confirm'
    ? t('dialog.intro')
    : phase === 'running'
      ? t('dialog.running')
      : null;

  const footer = phase === 'confirm'
    ? [
      h(Button, { key: 'cancel', variant: 'outline', onClick: requestClose }, t('dialog.cancel')),
      h(Button, {
        key: 'confirm',
        variant: 'primary',
        disabled: targets.length === 0,
        onClick: start,
      }, t('dialog.confirm')),
    ]
    : [
      h(Button, {
        key: 'close',
        variant: 'outline',
        disabled: phase === 'running',
        onClick: requestClose,
      }, t('dialog.close')),
    ];

  const body = [];
  if (notice !== null) {
    body.push(h('div', { key: 'warning', className: dialogStyles['DeleteDialog-warning'] },
      h(IconWarningOutlineRegular, { size: 18, className: dialogStyles['DeleteDialog-warning-icon'] }),
      h('p', null, notice)));
  }
  body.push(h('div', { key: 'list', className: dialogStyles['DeleteDialog-list'] },
    targets.length === 0
      ? h('div', { className: dialogStyles['DeleteDialog-note'] }, t('dialog.none'))
      : targets.map((target, index) => h('div', { key: index, className: dialogStyles['DeleteDialog-line'] },
        h('span', { className: dialogStyles['DeleteDialog-num'] }, `${index + 1}.`),
        h('code', { className: dialogStyles['DeleteDialog-path'] }, target.path),
        phase !== 'confirm' && index < done
          ? h('span', { className: dialogStyles['DeleteDialog-state'] }, t('dialog.deleted'))
          : null))));
  if (finished) {
    body.push(h('div', { key: 'restart', className: dialogStyles['DeleteDialog-restart'] }, t('dialog.restart')));
  }
  body.push(h('div', { key: 'note', className: dialogStyles['DeleteDialog-note'] }, t('dialog.simulated')));

  return h(Modal, {
    open: true,
    onClose: requestClose,
    title: t('dialog.title'),
    closeLabel: t('dialog.cancel'),
    className: `${dialogStyles._} ${DLG}`,
    contentClassName: DLG_CONTENT,
    footer,
  }, body);
}

/** The main-area page: the panel title, the table, and the dialog. */
function SessionsPage({ ctx }) {
  const t = React.useMemo(() => ctx.locale.bind(NS), [ctx]);
  const [state, setState] = React.useState({ status: 'loading' });
  const [pending, setPending] = React.useState(null);

  // Jump into the session's Chat. openSession retains the session, selects it
  // in the main view and reveals the conversation panel (selectPanel(null) is
  // built into its "reveal" path). A vanished session would throw from
  // sessions.retain; keep the click non-fatal.
  //
  // The jump also carries a draft prompt: openSession's retain materializes
  // the session binding synchronously, so the official draft-initialization
  // entry (the same one uiWorkspace.startSession uses) can write OPEN_PROMPT
  // into that session's composer right after the navigation. The draft waits
  // for the user to review and send — nothing is submitted here.
  const openSession = React.useCallback((row) => {
    try {
      ctx.uiWorkspace.openSession(row.sessionId);
      const binding = ctx.sessions.binding(row.sessionId);
      if (binding === undefined) return;
      const result = ctx.conversation.input.requestDraftInitialization(binding, {
        prompt: OPEN_PROMPT,
        // Never clobber an unsent draft the user already typed.
        whenDraftExists: 'keep',
      });
      if (result === 'blocked') console.warn('draft initialization blocked:', row.sessionId);
    } catch (error) {
      console.warn('open session failed:', row.sessionId, error);
    }
  }, [ctx]);

  React.useEffect(() => {
    const lifetime = new AbortController();
    readSessions(lifetime.signal, t).then(
      (rows) => {
        if (!lifetime.signal.aborted) setState({ status: 'ready', rows });
      },
      (error) => {
        if (!lifetime.signal.aborted) {
          setState({ status: 'error', message: String(error?.message ?? error) });
        }
      },
    );
    return () => {
      lifetime.abort();
    };
  }, [t]);

  if (state.status === 'loading') {
    return h('div', { className: styles._ }, h(MarkdownText, { text: `# Sessions\n\n${t('loading')}` }));
  }
  if (state.status === 'error') {
    return h('div', { className: styles._ }, h(MarkdownText, { text: `# Sessions\n\n${t('error')}: ${state.message}` }));
  }
  if (state.rows.length === 0) {
    return h('div', { className: styles._ }, h(MarkdownText, { text: `# Sessions\n\n${t('empty')}` }));
  }

  return h('div', { className: styles._ },
    h(MarkdownText, { text: '# Sessions' }),
    h(SessionTable, { rows: state.rows, t, now: Date.now(), onDelete: setPending, onOpen: openSession }),
    pending ? h(DeleteDialog, { row: pending, t, onClose: () => setPending(null) }) : null);
}

export const inject = ['slots', 'locale', 'uiWorkspace', 'sessions', 'conversation']

export function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'plugin-sessions: dictionaries')

  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id: 'plugin-sessions', order: 1, label: 'Sessions',
  }, Icon))

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: 'plugin-sessions',
  }, () => h(SessionsPage, { ctx })))
}
