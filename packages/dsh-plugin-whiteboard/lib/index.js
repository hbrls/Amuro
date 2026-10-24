/**
 * Host half of the WhiteBoard plugin. 最小骨架：当前不注册任何路由。
 */

/** Cordis plugin name. */
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
