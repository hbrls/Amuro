import { defineTool } from '@deepseek-ai/dsh-tools'
import PROMPT from './prompts/clarify.js';

/** Cordis plugin name. */
export const name = 'plugin-hbr';

/** Host services: tools registry. */
export const inject = ['tools'];

/**
 * Register Host-side capabilities.
 * @param ctx - Host plugin context.
 */
export function apply(ctx) {
  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'clarify',
    description: PROMPT,
    parameters: {
      type: {
        type: 'string',
        enum: ['GOAL', 'NONE_GOAL', 'STORY', 'SPEC'],
        required: true,
        description: '有效讨论类型。',
      },
      payload: {
        type: 'string',
        required: true,
        description: '有效讨论的正文，可包含多行文本和 Markdown。',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { ok: { type: 'boolean', required: true } },
      },
      render: (_args, value) => [{ type: 'text', text: value.ok ? '已投递' : '投递失败' }],
    },
    async execute() {
      return { ok: true };
    },
  })), 'plugin-hbr: clarify tool');

  ctx.logger.info('dsh-plugin-hbr host half loaded');
}
