import { defineTool } from '@deepseek-ai/dsh-tools'
import { z } from 'zod'
import PROMPT from './prompts/use.ts'

/** Cordis plugin name. Must match the id in cordis.patch.yml. */
export const name = 'plugin-whiteboard';

export const inject = ['tools', 'sessionProjections', 'commands', 'loader'];

const PROJECTION_KEY = 'com.lisitede.backstage/dsh-plugin-whiteboard'
const nodeIdSchema = z.string().min(1)
const eventSchema = z.object({
  type: z.literal('reload'),
  payload: z.object({
    nodes: z.array(z.object({
      id: nodeIdSchema,
      type: z.literal('visit'),
      data: z.object({
        workspace: z.string(),
        workspaceId: z.string().optional(),
        header: z.object({ title: z.string() }),
        body: z.array(z.string()),
        progress: z.string(),
      }),
    })),
    edges: z.array(z.object({
      id: z.string(),
      source: nodeIdSchema,
      target: nodeIdSchema,
    })),
  }),
}).superRefine(({ payload: { nodes, edges } }, ctx) => {
  const fail = message => ctx.addIssue({ code: 'custom', message })
  const ids = new Set(nodes.map(node => node.id))
  if (ids.size !== nodes.length) fail('节点 ID 不能重复')
  const edgeIds = new Set()
  const next = new Map()
  const incoming = new Set()
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) fail(`边 ID 重复：${edge.id}`)
    edgeIds.add(edge.id)
    if (edge.id !== `${edge.source}->${edge.target}`) fail(`边 ID 必须为 source->target：${edge.id}`)
    if (!ids.has(edge.source) || !ids.has(edge.target)) fail(`边端点不存在：${edge.id}`)
    if (next.has(edge.source) || incoming.has(edge.target)) fail(`仅支持单线链：${edge.id}`)
    next.set(edge.source, edge.target)
    incoming.add(edge.target)
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
const stateSchema = eventSchema.nullable()

// DSH author schemas mark requiredness on each property, including nested ones.
const payloadParameter = {
  type: 'object', required: true, additionalProperties: false,
  properties: {
    nodes: {
      type: 'array', required: true,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          id: { type: 'string', required: true, description: '保留来源提供的原生节点 ID；在本次图数据中唯一。不要改写成其他格式。' },
          type: { type: 'string', enum: ['visit'], required: true },
          data: {
            type: 'object', required: true, additionalProperties: false,
            properties: {
              workspace: { type: 'string', required: true },
              workspaceId: { type: 'string' },
              header: {
                type: 'object', required: true, additionalProperties: false,
                properties: { title: { type: 'string', required: true } },
              },
              body: { type: 'array', items: { type: 'string' }, required: true },
              progress: { type: 'string', required: true, description: '进度文本，例如 0%。' },
            },
          },
        },
      },
    },
    edges: {
      type: 'array', required: true,
      items: {
        type: 'object', additionalProperties: true,
        properties: {
          id: { type: 'string', required: true, description: '格式 source->target。' },
          source: { type: 'string', required: true },
          target: { type: 'string', required: true },
        },
      },
    },
  },
}

/**
 * Register Host-side capabilities.
 * @param ctx - Host plugin context.
 */
export async function apply(ctx) {
  await ctx.sessionProjections.register({
    key: PROJECTION_KEY,
    stateVersion: 3,
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

      const projection = eventSchema.safeParse(data.meta?.[PROJECTION_KEY])
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
    description: '重绘当前 Session 的 Whiteboard。type 为 reload，payload 为完整的 nodes 和 edges；替换整幅画布，不追加、不合并。节点和边构成单线无环链，前端自动计算分组与位置，无需传入 Twig 或坐标。空数组可清空画布。',
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
          payload: payloadParameter,
        },
      },
      render: (_args, event) => [{ type: 'text', text: `已提交白板重绘：${event.payload.nodes.length} 个节点，${event.payload.edges.length} 条边。` }],
      presentationMeta: (_args, event) => ({ [PROJECTION_KEY]: event }),
    },
    async execute(args, exec) {
      if (!exec.agent) throw new Error('whiteboard requires an owning Agent Session')
      return eventSchema.parse(args)
    },
  })

  ctx.commands.register({
    name: 'whiteboard',
    description: '为当前 Session 启用 Whiteboard',
    async handler({ agent }) {
      let fiber
      try {
        const mcpClient = await ctx.loader.import('@deepseek-ai/dsh-mcp-client')
        fiber = agent.ctx.plugin(mcpClient, {
          serverName: 'backstage-whiteboard',
          transport: 'streamable-http',
          url: 'http://127.0.0.1:20080/mcp-whiteboard',
          failOnStartupError: true,
        })
        await fiber.await()
        agent.ctx.tools.register(whiteboardTool)
        agent.followup({
          content: [{ type: 'text', text: PROMPT }],
          source: { kind: 'whiteboard-command' },
        })
        return { kind: 'success' }
      } catch (error) {
        if (fiber) await fiber.dispose()
        return { kind: 'error', text: `Whiteboard 启用失败：${error instanceof Error ? error.message : String(error)}` }
      }
    },
  })
  ctx.logger.info('dsh-plugin-whiteboard host half loaded');
}
