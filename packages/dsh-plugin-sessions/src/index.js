/**
 * Host half of the sessions panel.
 *
 * It owns the join between the two domains so the browser makes a single
 * read-only request: archivedness lives in the Workspace registry, while the
 * session rows (title, activity, running state) live in the Session
 * controller. The route is registered on the official `/api` Fetch extension
 * point, behind the same Host/Origin + browser-auth fence as every other
 * `/api` endpoint.
 *
 * The route lists EVERY session, each row flagged with `archived` from the
 * registry; filtering is left to the table. Each row also carries the
 * concrete list of things a real delete would remove, enumerated against the
 * DSH 0.2.2 storage layout:
 *
 * - the session-log directory (`sessions/<project-slug>/<session-id>/`);
 * - the projection-cache document (`storages/session_projcache/sessions/<id>.json`);
 * - the workspace accounting slots in `storages/workspace.json`
 *   (`global.archivedSessionIds`, `global.pinnedSessionIds`, and the owning
 *   record's `sessionIds` — archive keeps the last one, a real delete must not);
 * - schedule tasks targeting the session (`storages/schedule.json`);
 * - attachment objects the session's log references
 *   (`attachments/v1/{file-objects,objects,files}/<sha256>/…`);
 * - worktree checkouts under `<workspace>/.agents/worktrees/` (official
 *   archive reclaims them; the development policy forbids them, so any hit
 *   here is a violation worth seeing);
 * - the session-query-sqlite full-text index row (the desktop profile keeps
 *   it `:memory:`, so there is no file — the entry says so).
 *
 * SIMULATION ONLY. Nothing on this half deletes anything: the client prints
 * that plan instead. There is deliberately no destructive endpoint here.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

/** Cordis plugin name. */
export const name = 'plugin-sessions';

/** Required Host services: the /api route registry and both data domains. */
export const inject = ['connection', 'workspaceRegistry', 'sessionController'];

/** The one read-only endpoint this plugin owns. */
export const ROUTE = '/api/sessions';

/** Session ids appear either as a raw uuid or with the `session-` prefix. */
const SESSION_ID_RE = /^(session-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** DSH home directory; the same override every other storage consumer honours. */
function dshHome() {
  return process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
}

/** Root of the per-session JSONL logs: `<root>/<workspace-slug>/<session-id>/`. */
function sessionsRoot() {
  return path.join(dshHome(), 'sessions');
}

/** Per-record projection-cache documents: `<root>/<session-id>.json`. */
function projectionCacheRoot() {
  return path.join(dshHome(), 'storages', 'session_projcache', 'sessions');
}

/** The whole-unit workspace document holding the archive/pin accounting. */
function workspaceStateFile() {
  return path.join(dshHome(), 'storages', 'workspace.json');
}

/** The whole-unit schedule document holding tasks that may target a session. */
function scheduleStateFile() {
  return path.join(dshHome(), 'storages', 'schedule.json');
}

/** Content-addressed attachment store (`file-objects/`, `objects/`, `files/`). */
function attachmentsRoot() {
  return path.join(dshHome(), 'attachments', 'v1');
}

/** Worktree pool directory, relative to a workspace root (plugin default). */
const WORKTREE_POOL = path.join('.agents', 'worktrees');
/** Generated worktree names are `<prefix><uuid8>-<rand4>`; default prefix. */
const WORKTREE_PREFIX = 'dsh-';
/** Decompressed session-log bytes scanned for attachment refs at most. */
const LOG_SCAN_MAX_BYTES = 64 * 1024 * 1024;
/** Attachment references inside a session log look like `sha256:<64 hex>`. */
const ATTACHMENT_REF_RE = /sha256:([a-f0-9]{64})/g;

/**
 * Every spelling one session id may carry across the stores.
 * @param sessionId - the id as the registry spells it.
 * @returns the distinct spellings to look for.
 */
function sessionIdVariants(sessionId) {
  const variants = new Set([sessionId]);
  if (sessionId.startsWith('session-')) variants.add(sessionId.slice('session-'.length));
  else if (SESSION_ID_RE.test(sessionId)) variants.add(`session-${sessionId}`);
  return [...variants];
}

/**
 * Locate every `<root>/<workspace-slug>/<session-id>/` directory. The slug
 * level is scanned rather than re-derived, so the workspace path encoding
 * never has to be reproduced here.
 * @param sessionId - the session to locate.
 * @returns absolute directories that exist on disk.
 */
function findSessionDirs(sessionId) {
  const found = [];
  let entries;
  try {
    entries = fs.readdirSync(sessionsRoot(), { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    for (const variant of sessionIdVariants(sessionId)) {
      const candidate = path.join(sessionsRoot(), entry.name, variant);
      try {
        if (fs.statSync(candidate).isDirectory()) found.push(candidate);
      } catch {
        /* not this slug */
      }
    }
  }
  return found;
}

/**
 * Every regular file below one directory, depth-first.
 * @param dir - directory to walk.
 * @returns absolute file paths.
 */
function listFilesUnder(dir) {
  const files = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFilesUnder(full));
    else files.push(full);
  }
  return files;
}

/**
 * Parse a JSON document, tolerating a missing or unreadable file.
 * @param file - absolute path.
 * @returns the parsed document, or `undefined`.
 */
function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

/**
 * Every workspace-accounting slot one session occupies in `workspace.json`.
 * Archive adds to `archivedSessionIds` and drops `pinnedSessionIds` in one
 * write while deliberately keeping the record's `sessionIds` slot (so
 * unarchive can restore the position); a real delete must remove all three.
 * The stored document is read directly because the registry entity filters
 * `sessionIds` against the live header index.
 * @param sessionId - the session being deleted.
 * @param workspaceDoc - parsed `workspace.json`, or `undefined`.
 * @returns one target per occupied slot.
 */
function workspaceAccountingTargets(sessionId, workspaceDoc) {
  const targets = [];
  const variants = sessionIdVariants(sessionId);
  const global = workspaceDoc?.global ?? {};
  for (const field of ['archivedSessionIds', 'pinnedSessionIds']) {
    const ids = Array.isArray(global[field]) ? global[field] : [];
    for (const variant of variants) {
      const slot = ids.indexOf(variant);
      if (slot >= 0) {
        targets.push({
          kind: 'workspace-accounting',
          path: `${workspaceStateFile()} › global.${field}[${slot}]`,
        });
      }
    }
  }
  const workspaces = workspaceDoc?.tables?.workspaces ?? {};
  for (const [workspaceId, record] of Object.entries(workspaces)) {
    const ids = Array.isArray(record?.sessionIds) ? record.sessionIds : [];
    for (const variant of variants) {
      const slot = ids.indexOf(variant);
      if (slot >= 0) {
        targets.push({
          kind: 'workspace-accounting',
          path: `${workspaceStateFile()} › tables.workspaces["${workspaceId}"] › sessionIds[${slot}]`,
        });
      }
    }
  }
  return targets;
}

/**
 * Schedule tasks still pointing at the session. Archive only stops their
 * runtime activity; the task records stay and would fail every delivery
 * with `schedule/target-archived` once the session is gone.
 * @param sessionId - the session being deleted.
 * @param scheduleDoc - parsed `schedule.json`, or `undefined`.
 * @returns one target per bound task.
 */
function scheduleTargets(sessionId, scheduleDoc) {
  const targets = [];
  const variants = new Set(sessionIdVariants(sessionId));
  const tasks = scheduleDoc?.tables?.tasks ?? {};
  for (const [taskId, task] of Object.entries(tasks)) {
    const bound = variants.has(String(task?.target?.sessionId ?? ''))
      || (Array.isArray(task?.involvedSessionIds)
        && task.involvedSessionIds.some((id) => variants.has(String(id))));
    if (bound) {
      targets.push({
        kind: 'schedule-task',
        path: `${scheduleStateFile()} › tables.tasks["${taskId}"]`,
      });
    }
  }
  return targets;
}

/**
 * The attachment objects one session's log references. The store is
 * content-addressed (`sha256:<digest>` refs in log events) and shared
 * across sessions; a REAL delete could not reclaim safely without a
 * refcount, but the simulation lists exactly which objects the session
 * mentions.
 * @param sessionDirs - the session's log directories already located.
 * @returns existing attachment files the session references.
 */
function attachmentTargets(sessionDirs) {
  const hashes = new Set();
  for (const dir of sessionDirs) {
    for (const file of listFilesUnder(dir)) {
      if (!/session\.v\d+\.jsonl(\.zstd)?$/.test(file)) continue;
      let text;
      try {
        const raw = fs.readFileSync(file);
        text = file.endsWith('.zstd')
          ? zlib.zstdDecompressSync(raw, { maxOutputLength: LOG_SCAN_MAX_BYTES }).toString('utf8')
          : raw.toString('utf8');
      } catch {
        continue; // unreadable or oversized log: skip its refs
      }
      for (const match of text.matchAll(ATTACHMENT_REF_RE)) hashes.add(match[1]);
    }
  }
  const targets = [];
  for (const hash of hashes) {
    const shard = hash.slice(0, 2);
    for (const group of ['file-objects', 'objects']) {
      const object = path.join(attachmentsRoot(), group, shard, hash);
      try {
        if (fs.statSync(object).isFile()) targets.push({ kind: 'attachment', path: object });
      } catch {
        /* not stored in this group */
      }
    }
    // `files/<shard>/<hash>/` holds one alias per display name.
    for (const alias of listFilesUnder(path.join(attachmentsRoot(), 'files', shard, hash))) {
      targets.push({ kind: 'attachment', path: alias });
    }
  }
  return targets;
}

/**
 * Worktree checkouts the experimental worktree feature created for the
 * session. Official archive already reclaims them; the development policy
 * forbids the feature entirely, so every hit flags a violation. Generated
 * names are `dsh-<uuid8>-<rand4>` where `uuid8` is the first eight hex
 * digits of the session's UUID.
 * @param sessionId - the session being deleted.
 * @param workspacePaths - absolute paths of every registered workspace.
 * @returns checkout directories still on disk.
 */
function worktreeTargets(sessionId, workspacePaths) {
  const targets = [];
  const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(sessionId)?.[0];
  if (uuid === undefined) return targets;
  const namePrefix = `${WORKTREE_PREFIX}${uuid.slice(0, 8).toLowerCase()}-`;
  for (const workspacePath of workspacePaths) {
    const pool = path.join(workspacePath, WORKTREE_POOL);
    let entries;
    try {
      entries = fs.readdirSync(pool, { withFileTypes: true });
    } catch {
      continue; // no pool in this workspace
    }
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(namePrefix)) {
        targets.push({ kind: 'worktree', path: path.join(pool, entry.name) });
      }
    }
  }
  return targets;
}

/**
 * The session-query-sqlite full-text index row. The desktop profile keeps
 * the index `:memory:` (dsh-web-app's bundle patch), so there is no file to
 * list; the entry records that a persistent configuration would drop the
 * session's rows instead.
 * @returns the single informational target.
 */
function searchIndexTarget() {
  return {
    kind: 'search-index',
    path: 'session-query-sqlite 索引行（当前配置 :memory:，无磁盘文件；若为持久路径则按 session 删除索引行）',
  };
}

/**
 * The concrete things a real delete would remove for one session.
 * Exported so the enumeration can be smoke-tested outside the Host.
 * @param sessionId - the session being deleted.
 * @param context - shared per-request reads: the parsed workspace and
 *   schedule documents plus every registered workspace path.
 * @returns ordered targets, each `{ kind, path }`.
 */
export function listDeleteTargets(sessionId, context) {
  const targets = [];
  const sessionDirs = findSessionDirs(sessionId);
  for (const dir of sessionDirs) {
    for (const file of listFilesUnder(dir)) targets.push({ kind: 'session-log', path: file });
  }
  for (const variant of sessionIdVariants(sessionId)) {
    const cached = path.join(projectionCacheRoot(), `${variant}.json`);
    try {
      if (fs.statSync(cached).isFile()) targets.push({ kind: 'projection-cache', path: cached });
    } catch {
      /* no cache row for this spelling */
    }
  }
  targets.push(...workspaceAccountingTargets(sessionId, context.workspaceDoc));
  targets.push(...scheduleTargets(sessionId, context.scheduleDoc));
  targets.push(...attachmentTargets(sessionDirs));
  targets.push(...worktreeTargets(sessionId, context.workspacePaths));
  targets.push(searchIndexTarget());
  return targets;
}

/**
 * The session's category. Only one category is detected this round: 'seed'
 * marks a session whose projection cache reports zero completed turns
 * (`turnBoundary.val.lastTurn === 0`) — opened but never conversed with.
 * Every other session returns '' (undetected), by design; further categories
 * (subagent, orphan, …) are deliberately left for later rounds.
 * @param sessionId - the session to classify.
 * @returns 'seed' or ''.
 */
export function sessionCategory(sessionId) {
  for (const variant of sessionIdVariants(sessionId)) {
    const doc = readJson(path.join(projectionCacheRoot(), `${variant}.json`));
    if (doc === undefined) continue;
    return doc?.record?.rows?.turnBoundary?.val?.lastTurn === 0 ? 'seed' : '';
  }
  return '';
}

/**
 * Read every session with its workspace, archive flag and display fields.
 * @param ctx - Host context carrying the Workspace registry and Session controller.
 * @param signal - request lifetime.
 * @returns session rows, most recently active first.
 */
async function readSessions(ctx, signal) {
  const archivedSessionIds = ctx.workspaceRegistry.archivedSessionIds.map(String);
  const archivedSet = new Set(archivedSessionIds);

  const workspaceOf = new Map();
  const workspacePaths = [];
  for (const workspace of ctx.workspaceRegistry.list()) {
    workspacePaths.push(workspace.path);
    for (const sessionId of workspace.sessionIds) workspaceOf.set(String(sessionId), workspace.title);
  }

  const listed = await ctx.sessionController.list({}, signal);

  // Read once per request: every row's simulated delete plan shares them.
  const context = {
    workspaceDoc: readJson(workspaceStateFile()),
    scheduleDoc: readJson(scheduleStateFile()),
    workspacePaths,
  };

  return listed.items
    .map((row) => {
      const sessionId = String(row.sessionId);
      return {
        sessionId,
        workspaceTitle: workspaceOf.get(sessionId) ?? null,
        title: row?.projections?.values?.title ?? null,
        updatedAt: row?.updatedAt ?? null,
        running: row?.running === true,
        blank: row?.blank === true,
        archived: archivedSet.has(sessionId),
        category: sessionCategory(sessionId),
        targets: listDeleteTargets(sessionId, context),
      };
    })
    .sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
}

/**
 * Register the read-only session-list route.
 * @param ctx - Host plugin context.
 */
export function apply(ctx) {
  ctx.effect(() => ctx.connection.fetch.register({
    path: ROUTE,
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: async (request) => {
      const headers = { 'cache-control': 'no-store' };
      try {
        return Response.json({ rows: await readSessions(ctx, request.signal) }, { headers });
      } catch (error) {
        return Response.json({ error: String(error?.message ?? error) }, { status: 500, headers });
      }
    },
  }), 'plugin-sessions: sessions route');
}
