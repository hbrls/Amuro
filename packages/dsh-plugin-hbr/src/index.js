import { defineTool } from '@deepseek-ai/dsh-tools'
import PROMPT from './prompts/clarify.js';
import WRITE_DOWN_PROMPT from './prompts/write-down.js';

/** Cordis plugin name. */
export const name = 'plugin-hbr';

/** Host services: tools and commands registries, and the host module loader. */
export const inject = ['tools', 'commands', 'loader'];

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

  ctx.effect(() => ctx.commands.register({
    name: 'write-down',
    description: '将当前讨论形成的实施方案写入 .context/current-task.md',
    async handler({ agent }) {
      const { createUserMessage } = await ctx.loader.import('@deepseek-ai/dsh-llm');
      agent.followup(createUserMessage({
        content: [{ type: 'text', text: WRITE_DOWN_PROMPT }],
        source: { kind: 'write-down-command' },
      }));
      return { kind: 'success' };
    },
  }), 'plugin-hbr: write-down command');

  ctx.logger.info('dsh-plugin-hbr host half loaded');
}
