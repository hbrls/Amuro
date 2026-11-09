const PROMPT: string = `当前 Session 已启用 Whiteboard。请调用 backstage-whiteboard MCP，读取完整的节点和边，再按本地 whiteboard 工具的参数要求，将结果通过 reload 提交给 client。完成后简要告知用户结果；失败时报告实际错误。

后续用户要求刷新白板时，重新读取并提交最新数据。`

export default PROMPT
