/**
 * Host half of the Amuro plugin. 最小骨架：当前不注册任何路由，
 * 后续按 .context/Char.md 在这里挂 /api/* 数据接口。
 */

/** Cordis plugin name. */
export const name = 'plugin-amuro';

/** No Host services required yet. */
export const inject = [];

/**
 * Register Host-side capabilities.
 * @param ctx - Host plugin context.
 */
export function apply(ctx) {
  ctx.logger.info('dsh-plugin-amuro host half loaded');
}
