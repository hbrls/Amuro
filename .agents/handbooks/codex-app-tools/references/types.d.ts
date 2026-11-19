/**
 * 2026-11-19：按当前 ChatGPT Desktop 注入定义记录六个工具的入参。
 * 工具均声明返回 Promise<CallToolResult>；本文件不另造该宿主类型。
 * 返回数据类型仅记录明确标注的实测样本，不作为正式输出 schema。
 */

/** `mcp__codex_app__list_projects` 的入参；空对象调用已现场验证。 */
export type ListProjectsArgs = Record<string, never>;

/** list_projects 的实测 JSON 数据，位于 CallToolResult.content 的 text 块中。 */
export interface ListProjectsResult<TProject extends Project = Project> {
  schemaVersion: 2;
  projects: TProject[];
}

export interface Project {
  /** 供 `create_thread` 使用的 Project ID。 */
  projectId: string;
  projectKind: "local" | "remote" | "chatgpt";
  label: string;
  path?: string;
  hostId: string | null;
  hostDisplayName: string | null;
  isGitRepository?: boolean;
}

/** 参数枚举以注入定义为准；具体可用值还受所选模型约束。 */
export type Thinking =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max"
  | "ultra";

export type WorktreeStartingState =
  | { type: "working-tree" }
  | {
      type: "branch";
      branchName: string;
      onMissing?: "error" | "create-branch";
    };

export type ProjectEnvironment =
  | { type: "local" }
  | { type: "worktree"; startingState?: WorktreeStartingState };

export type CreateThreadTarget =
  | {
      type: "project";
      projectId: string;
      environment: ProjectEnvironment;
    }
  | { type: "projectless"; directoryName?: string }
  | { type: "chatgptWorkCloud"; projectId?: string };

/** `mcp__codex_app__create_thread` 的完整入参。 */
export interface CreateThreadArgs {
  title?: string;
  prompt: string;
  target: CreateThreadTarget;
  /** 仅用户明确指定模型时传入；chatgptWorkCloud 目标省略。 */
  model?: string;
  /** 需符合所选模型；chatgptWorkCloud 目标省略。 */
  thinking?: Thinking;
}

/** 当前项目使用的 local Project 子集；不代表原生接口只有这一种 target。 */
export interface CreateLocalProjectThreadArgs
  extends Omit<CreateThreadArgs, "target"> {
  target: {
    type: "project";
    projectId: string;
    environment: {
      type: "local";
    };
  };
}

/** `mcp__codex_app__list_threads` 的完整入参。 */
export interface ListThreadsArgs {
  mode?: "recent" | "history";
  /** 最多 50；recent 模式另外完整返回置顶项。 */
  limit?: number;
  /** 仅 history 模式。 */
  source?: "codex" | "chatgpt";
  /** 仅 history 模式的 Codex 来源；ChatGPT 来源省略。 */
  hostId?: string;
  /** 仅 history 模式，默认 false。 */
  archived?: boolean;
  /** 仅 history 模式，沿用相同分页条件下返回的 nextCursor。 */
  cursor?: string;
}

/** `mcp__codex_app__read_thread` 的完整入参。 */
export interface ReadThreadArgs {
  threadId: string;
  hostId?: string;
  cursor?: string;
  turnLimit?: number;
  includeOutputs?: boolean;
  maxOutputCharsPerItem?: number;
}

/** `mcp__codex_app__send_message_to_thread` 的完整入参。 */
export interface SendMessageToThreadArgs {
  threadId: string;
  prompt: string;
  hostId?: string;
  /** 以下两个覆盖字段仅适用于 Codex Thread；省略时沿用目标设置。 */
  model?: string;
  thinking?: Thinking;
}

export interface WaitThreadTarget {
  threadId: string;
  hostId?: string;
  afterCursor?: string;
}

/** `mcp__codex_app__wait_threads` 的完整入参。 */
export interface WaitThreadsArgs {
  /** 最多 8 个 Codex Thread。 */
  targets: WaitThreadTarget[];
  /** 默认 120000；0 表示获取即时快照。 */
  timeoutMs?: number;
}
