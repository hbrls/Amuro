/**
 * Host half of the Whiteboard plugin. 最小骨架：当前不注册任何路由，
 * 会话/数据能力后续按手册 §4 在这里挂 /api/* 接口。
 */

/** Cordis plugin name. Must match the id in cordis.patch.yml. */
export const name = 'plugin-whiteboard';

/** No Host services required yet. */
export const inject = [];

/**
 * Register Host-side capabilities.
 * @param ctx - Host plugin context.
 */
export function apply(ctx) {
  ctx.logger.info('dsh-plugin-whiteboard host half loaded');
}
