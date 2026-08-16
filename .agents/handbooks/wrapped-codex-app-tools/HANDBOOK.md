---
name: wrapped-codex-app-tools
description: "使用项目级包装方法调用 Codex App Tools"
metadata:
  version: 0.0.0
  status: draft
---

# Wrapped Codex App Tools 手册

本手册定义基于 Codex App Tools 的项目级包装方法。

## Project 与 Task

### `find_project_by_name(projectName)`

按名称查找当前 Codex App 中唯一的本地 Git Project，并转换为仅包含 `id`、`name`、
`dir` 的对象。

```ts
async function find_project_by_name(projectName: string) {
  const result = await tools.codex_app__list_projects({});
  const matches = result.projects.filter(
    (project) =>
      project.projectKind === "local" &&
      project.label === projectName &&
      project.isGitRepository === true,
  );

  if (matches.length === 0) {
    throw new Error(`找不到本地 Project: ${projectName}。应终止执行。`);
  }

  if (matches.length > 1) {
    throw new Error(`存在多个同名本地 Project: ${projectName}。应终止执行。`);
  }

  const project = matches[0];
  return {
    id: project.projectId,
    name: project.label,
    dir: project.path,
  };
}
```

### `project_start_thread(projectId, threadName, prompt)`

在指定的本地 Project 中启动 Task，并将结果转换为仅包含 `id` 的对象。

```ts
async function project_start_thread(
  projectId: string,
  threadName: string,
  prompt: string,
) {
  const res = await tools.codex_app__create_thread({
    title: threadName,
    prompt,
    target: {
      type: "project",
      projectId,
      environment: { type: "local" },
    },
  });

  return { id: res.threadId };
}
```

`projectId`、`threadName` 和 `prompt` 必填。包装方法固定使用
`environment: { type: "local" }`，创建成功即返回，不等待 Task 执行完成。
