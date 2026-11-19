import { defineTool } from '@deepseek-ai/dsh-tools'
import { z } from 'zod'
import { buildPrompt, MCP_URL } from './prompts/use.ts'

/** Cordis plugin name. Must match the id in cordis.patch.yml. */
export const name = 'plugin-whiteboard';

export const inject = ['tools', 'sessionProjections', 'commands', 'loader', 'workspaceRegistry'];

const PROJECTION_KEY = 'com.lisitede.backstage/dsh-plugin-whiteboard'

/**
 * 一次远程调用的完整描述。Host 只理解 method 对应的协议机制（tools/call → MCP
 * 客户端完整生命周期），url、工具名、参数全部来自 Agent 的显式提交（源自启用命令
 * 注入的 prompt），Host 不持有任何地址或工具名知识。
 */
const callSpecSchema = z.object({
  method: z.literal('tools/call'),
  url: z.url({ protocol: /^https?$/ }),
  params: z.object({
    name: z.string().min(1),
    arguments: z.record(z.string(), z.unknown()).optional(),
  }),
})

/** 工具入参契约：{ highlight, nodes, edges } 三键，显式、无默认、无 fallback。 */
const toolArgsSchema = z.object({
  type: z.literal('reload'),
  payload: z.object({
    highlight: z.string().min(1),
    nodes: callSpecSchema,
    edges: callSpecSchema,
  }),
})

// --- Board（projection 状态）schema：backstage 返回的原始 Visit 形状，Host 原样透传 ---

const visitNodeSchema = z.object({
  Id: z.string().min(1),
  Workspace: z.string(),
  Session: z.string(),
  Title: z.string(),
  Description: z.record(z.string(), z.array(z.string())),
  Progress: z.string(),
  Type: z.enum(['Task', 'Vision']),
})
const visitEdgeSchema = z.object({
  Source: z.string().min(1),
  Target: z.string().min(1),
})

const boardSchema = z.object({
  highlight: z.string().min(1),
  nodes: z.array(visitNodeSchema),
  edges: z.array(visitEdgeSchema),
}).superRefine(({ nodes, edges }, ctx) => {
  const fail = message => ctx.addIssue({ code: 'custom', message })
  const ids = new Set(nodes.map(node => node.Id))
  if (ids.size !== nodes.length) fail('节点 ID 不能重复')
  const seen = new Set()
  const next = new Map()
  const incoming = new Set()
  for (const edge of edges) {
    const id = `${edge.Source}->${edge.Target}`
    if (seen.has(id)) fail(`边重复：${id}`)
    seen.add(id)
    if (!ids.has(edge.Source) || !ids.has(edge.Target)) fail(`边端点不存在：${id}`)
    if (next.has(edge.Source) || incoming.has(edge.Target)) fail(`仅支持单线链：${id}`)
    next.set(edge.Source, edge.Target)
    incoming.add(edge.Target)
  }
  const visited = new Set()
  for (const id of ids) {
    if (incoming.has(id)) continue
    let current = id
    while (current !== undefined && !visited.has(current)) {
      visited.add(current)
      current = next.get(current)
    }
  }
  if (visited.size !== ids.size) fail('白板不能包含环')
})

const boardEventSchema = z.object({ type: z.literal('reload'), payload: boardSchema })
const stateSchema = boardEventSchema.nullable()

// DSH author schemas mark requiredness on each property, including nested ones.
const callSpecParameter = {
  type: 'object', required: true, additionalProperties: false,
  properties: {
    method: { type: 'string', enum: ['tools/call'], required: true },
    url: { type: 'string', required: true, description: '调用端点 URL；由启用命令在 prompt 中提供，原样透传，不要猜测或改写。' },
    params: {
      type: 'object', required: true, additionalProperties: false,
      properties: {
        name: { type: 'string', required: true, description: 'MCP 工具名；由启用命令在 prompt 中提供，原样透传。' },
        arguments: { type: 'object', additionalProperties: true, description: '该工具的入参；省略时按 {} 处理。' },
      },
    },
  },
}
const payloadParameter = {
  type: 'object', required: true, additionalProperties: false,
  properties: {
    highlight: { type: 'string', required: true, description: '高亮 Workspace 字段等于该值的节点；由启用命令在 prompt 中提供（当前 Session 所在 Workspace 的名称），原样透传，不要猜测或改写。' },
    nodes: { ...callSpecParameter, description: '获取节点数据的一次调用描述。' },
    edges: { ...callSpecParameter, description: '获取边数据的一次调用描述。' },
  },
}
const boardParameter = {
  type: 'object', required: true, additionalProperties: false,
  properties: {
    highlight: { type: 'string', required: true },
    nodes: { type: 'array', required: true, items: { type: 'object', additionalProperties: true } },
    edges: { type: 'array', required: true, items: { type: 'object', additionalProperties: true } },
  },
}

/** 从一次 tools/call 结果中提取 JSON 对象：优先 structuredContent，否则解析文本内容。 */
function extractResultJson(toolName, result) {
  let data = result.structuredContent
  if (data === undefined || data === null) {
    const text = (result.content ?? []).filter(block => block.type === 'text').map(block => block.text).join('')
    if (text === '') throw new Error(`MCP 工具 ${toolName} 未返回 structuredContent 或文本内容`)
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`MCP 工具 ${toolName} 的文本内容不是合法 JSON`)
    }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`MCP 工具 ${toolName} 的返回不是 JSON 对象`)
  }
  return data
}

/**
 * Register Host-side capabilities.
 * @param ctx - Host plugin context.
 */
export async function apply(ctx) {
  await ctx.sessionProjections.register({
    key: PROJECTION_KEY,
    // 状态不做历史兼容；本字段永不递增。
    // 若未来变更 stateSchema 形状，必须修改本值以使旧 checkpoint 行失效。
    stateVersion: 0,
    stateSchema,
    init: () => null,
    apply: (state, event) => {
      const data = event.data
      if (event.type === 'tool/result') {
        if (data.message?.isError || data.error) return state
      } else if (event.type === 'tool/ptc-dispatch') {
        if (data.isError || data.error) return state
      } else {
        return state
      }

      const projection = boardEventSchema.safeParse(data.meta?.[PROJECTION_KEY])
      return projection.success ? projection.data : state
    },
    wire: {
      viewSchema: stateSchema,
      view: state => state,
      summary: false,
    },
  })

  const whiteboardTool = defineTool({
    name: 'whiteboard',
    description: '重绘当前 Session 的 Whiteboard。type 为 reload。payload 三个键均必填：highlight 为用于高亮的 Workspace 名称；nodes、edges 各是一次调用的完整描述（method 固定为 "tools/call"，url 与 params.name 由启用命令在 prompt 中提供，原样透传）。Host 执行这两次调用并用返回数据整体替换画布，不追加、不合并——Agent 无需自行取数。节点和边须构成单线无环链，前端自动计算分组与位置。',
    parameters: {
      type: { type: 'string', enum: ['reload'], required: true },
      payload: payloadParameter,
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ['reload'], required: true },
          payload: boardParameter,
        },
      },
      render: (_args, event) => [{ type: 'text', text: `已提交白板重绘：${event.payload.nodes.length} 个节点，${event.payload.edges.length} 条边。` }],
      presentationMeta: (_args, event) => ({ [PROJECTION_KEY]: event }),
    },
    async execute(args, exec) {
      if (!exec.agent) throw new Error('whiteboard requires an owning Agent Session')
      const { payload } = toolArgsSchema.parse(args)

      const callTool = async spec => {
        const { Client, StreamableHTTPClientTransport } = await ctx.loader.import('@modelcontextprotocol/client')
        const client = new Client({ name: 'dsh-plugin-whiteboard', version: '0' })
        try {
          await client.connect(new StreamableHTTPClientTransport(new URL(spec.url)))
          const result = await client.callTool({ name: spec.params.name, arguments: spec.params.arguments ?? {} })
          if (result.isError) {
            const text = (result.content ?? []).filter(block => block.type === 'text').map(block => block.text).join('\n')
            throw new Error(`MCP 工具 ${spec.params.name} 返回错误：${text || '（无详情）'}`)
          }
          return extractResultJson(spec.params.name, result)
        } finally {
          await client.close().catch(() => {})
        }
      }

      // nodes 与 edges 各自持有 url，独立建连，不复用连接。
      const [nodesResult, edgesResult] = await Promise.all([
        callTool(payload.nodes),
        callTool(payload.edges),
      ])

      // 临时硬编码（Host 唯一持有的一点点业务知识）：backstage 的返回键是
      // visit_nodes / visit_edges 而非 nodes / edges；待对端契约演进时再调整。
      if (!Array.isArray(nodesResult.visit_nodes)) throw new Error(`MCP 工具 ${payload.nodes.params.name} 的返回缺少 visit_nodes 数组`)
      if (!Array.isArray(edgesResult.visit_edges)) throw new Error(`MCP 工具 ${payload.edges.params.name} 的返回缺少 visit_edges 数组`)

      const board = boardSchema.parse({
        highlight: payload.highlight,
        nodes: nodesResult.visit_nodes,
        edges: edgesResult.visit_edges,
      })
      return { type: 'reload', payload: board }
    },
  })

  ctx.commands.register({
    name: 'whiteboard',
    description: '为当前 Session 启用 Whiteboard',
    async handler({ agent }) {
      let fiber
      try {
        const workspace = ctx.workspaceRegistry.list().find(item => item.sessionIds.includes(agent.id))
        if (!workspace) return { kind: 'error', text: '当前 Session 不属于任何 Workspace，无法启用 Whiteboard。' }
        const { createUserMessage } = await ctx.loader.import('@deepseek-ai/dsh-llm')
        const mcpClient = await ctx.loader.import('@deepseek-ai/dsh-mcp-client')
        fiber = agent.ctx.plugin(mcpClient, {
          serverName: 'backstage-whiteboard',
          transport: 'streamable-http',
          url: MCP_URL,
          failOnStartupError: true,
        })
        await fiber.await()
        agent.ctx.tools.register(whiteboardTool)
        agent.followup(createUserMessage({
          content: [{ type: 'text', text: buildPrompt(workspace.title) }],
          // The command merely types a canned phrase on the user's behalf;
          // declare 'user' so human-input consumers (session title, etc.) apply.
          source: { kind: 'user' },
        }))
        return { kind: 'success' }
      } catch (error) {
        if (fiber) await fiber.dispose()
        return { kind: 'error', text: `Whiteboard 启用失败：${error instanceof Error ? error.message : String(error)}` }
      }
    },
  })
  ctx.logger.info('dsh-plugin-whiteboard host half loaded');
}
