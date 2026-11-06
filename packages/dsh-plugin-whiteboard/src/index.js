import { defineTool } from '@deepseek-ai/dsh-tools'
import { z } from 'zod'

/** Cordis plugin name. Must match the id in cordis.patch.yml. */
export const name = 'plugin-whiteboard';

export const inject = ['tools', 'sessionProjections'];

const PROJECTION_KEY = 'com.lisitede.backstage/dsh-plugin-whiteboard'
const eventSchema = z.object({ type: z.string(), payload: z.string() })
const stateSchema = eventSchema.nullable()

/**
 * Register Host-side capabilities.
 * @param ctx - Host plugin context.
 */
export async function apply(ctx) {
  await ctx.sessionProjections.register({
    key: PROJECTION_KEY,
    stateVersion: 1,
    stateSchema,
    init: () => null,
    apply: (state, event) => {
      const data = event.data
      if (event.type === 'tool/result') {
        if (data.message.isError || data.error) return state
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

  ctx.tools.register(defineTool({
    name: 'whiteboard_notify',
    description: '向当前 Session 的 Whiteboard 视图发送事件。type 为 toast 时弹出 payload 文本。',
    parameters: {
      type: { type: 'string', required: true, description: '事件类型，例如 toast。' },
      payload: { type: 'string', required: true, description: '事件文本。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', required: true },
          payload: { type: 'string', required: true },
        },
      },
      render: (_args, event) => [{ type: 'text', text: JSON.stringify(event) }],
      presentationMeta: (_args, event) => ({ [PROJECTION_KEY]: event }),
    },
    async execute(args, exec) {
      if (!exec.agent) throw new Error('whiteboard_notify requires an owning Agent Session')
      return { type: args.type, payload: args.payload }
    },
  }))
  ctx.logger.info('dsh-plugin-whiteboard host half loaded');
}
