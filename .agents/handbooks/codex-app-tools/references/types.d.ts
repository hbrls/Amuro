/**
 * `codex_app__list_projects` 的入参。
 *
 * 验证：空对象调用成功；加入筛选字段会被参数校验拒绝。
 */
export type ListProjectsArgs = Record<string, never>;

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

/**
 * 当前项目创建本地 Project Thread 时使用的入参。
 *
 * 验证：Project target 必须包含 `projectId` 和 `environment`；没有 repo、path 或独立的
 * worktree 禁用参数。多 repo Project 无法在调用时选择具体 repo。
 */
export interface CreateLocalProjectThreadArgs {
  title?: string;
  prompt: string;
  target: {
    type: "project";
    projectId: string;
    environment: {
      type: "local";
    };
  };
}

export interface CreateLocalProjectThreadResult {
  threadId: string;
  hostId: "local";
}
