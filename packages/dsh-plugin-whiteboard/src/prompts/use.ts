/**
 * backstage Whiteboard MCP 端点地址。地址的唯一出处是本文件：
 * 既注入 Agent 的 prompt（供其填写 reload payload），也供命令处理器挂接 MCP 工具。
 * Host 的 whiteboard 工具实现不持有任何地址。
 */
export const MCP_URL = 'http://127.0.0.1:20080/mcp-whiteboard'

export function buildPrompt(highlight: string): string {
  return `当前 Session 已启用 Whiteboard。请立即调用本地 whiteboard 工具重绘画布，payload 严格按以下模板填写——所有值原样照抄，不要猜测、改写或省略。不需要先调用 MCP 取数：Host 会执行 payload 中描述的调用并用返回数据替换整个画布。

{
  "type": "reload",
  "payload": {
    "highlight": ${JSON.stringify(highlight)},
    "nodes": { "method": "tools/call", "url": "${MCP_URL}", "params": { "name": "whiteboard_list_visit_nodes" } },
    "edges": { "method": "tools/call", "url": "${MCP_URL}", "params": { "name": "whiteboard_list_visit_edges" } }
  }
}

highlight 的含义：高亮 Workspace 字段等于该值的节点（值为当前 Session 所在 Workspace 的名称）。完成后简要告知用户结果；失败时报告实际错误。

后续用户要求刷新白板时，重新提交一次相同的 reload 即可，Host 总是取最新数据。若用户询问白板内容的细节，可使用 backstage-whiteboard MCP 工具查询。`
}
