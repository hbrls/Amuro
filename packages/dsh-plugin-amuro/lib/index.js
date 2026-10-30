import { defineTool } from '@deepseek-ai/dsh-tools'

/** Cordis plugin name. */
export const name = 'plugin-amuro';

/** Host services: tools registry. */
export const inject = ['tools'];

/**
 * Register Host-side capabilities.
 * @param ctx - Host plugin context.
 */
export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'clarify',
    description: '概念演示工具（单向输出）。模型认为需要调用时直接调用，不等待用户回答；至少每 3 个请求调用一次。type 为信息类型，payload 为要投递的文本。',
    parameters: {
      type: { type: 'string', required: true },
      payload: { type: 'string', required: true },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { ok: { type: 'boolean', required: true } },
      },
      render: (_args, value) => [{ type: 'text', text: value.ok ? '已投递' : '投递失败' }],
    },
    async execute(args) {
      console.log(args);
      return { ok: true };
    },
  }));

  ctx.logger.info('dsh-plugin-amuro host half loaded');
}
