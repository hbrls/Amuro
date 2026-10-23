/**
 * Light 复刻 dsh 官方 clientBundle 预设（packages/client/tsdown.client.ts），
 * 只保留外部插件必需的产物契约，不含 monorepo 专属门禁：
 *
 * - cjs/browser 产物，banner/intro/footer 包出 window.__ModuleLoader__.load 契约
 * - 11 项基线模块保持 external（neverBundle），其余一律内联（alwaysBundle）
 * - CSS 三条管线按文件名分流（对齐官方预设 L580-L634）：
 *   - *.module.css → lightningcss cssModules 哈希 + export default 类名映射
 *   - 其余 .css    → postcss(@tailwindcss/postcss) 编译后全局内联
 *   factory 物化时注入带 data-plugin 标记的 <style>
 *   （不用 @tsdown/css：它抽取独立 .css 文件，Host 只服务 JS bundle）
 * - Tailwind 编译依赖的源文件经 result.messages 的 dependency 逐个 addWatchFile，
 *   保证 tsx 类名变更能失效 css 虚拟模块（手册 §6.5）
 * - writeBundle 后把 client.js mtime 拨到 max(now, mtime+1)，
 *   保证 Host 的 stat 轮询（mtime/ctime/size 判版本）一定能看到版本前进
 */
import { readFileSync } from 'node:fs'
import { stat, utimes, readFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, resolve as resolvePath } from 'node:path'
import { transform } from 'lightningcss'
import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'
import { defineConfig } from 'tsdown'

const packageDir = import.meta.dirname
const manifest = JSON.parse(readFileSync(resolvePath(packageDir, 'package.json'), 'utf8'))
const id = manifest.name

/**
 * 官方 web/src/platform.ts 的 PLATFORM_MODULES：shell 冻结模块表，
 * 插件 bundle 的 require 只能解析这些 specifier，其余必须内联。
 */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  'zod', '@tanstack/react-virtual',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

const isRequested = (specifier) => PLATFORM_MODULES.includes(specifier)

/** 官方约定：virtual id 不能以 .css 结尾，否则被 tsdown 自己的 css 管线截获。 */
const CSS_MODULES_VIRTUAL_PREFIX = '\0dsh-css:'
const GLOBAL_CSS_VIRTUAL_PREFIX = '\0dsh-global-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/** 官方 styleInjectionModule 全量移植：注入 <style> + 可选的 CSS Modules 类名映射导出。 */
function styleInjectionModule(id, fileId, css, classMap) {
  const source = [
    `const css = ${JSON.stringify(css)};`,
    `const tagId = ${JSON.stringify(`${id}/${basename(fileId)}`)};`,
    'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
    '  const tag = document.createElement(\'style\');',
    `  tag.dataset.plugin = ${JSON.stringify(id)};`,
    '  tag.dataset.pluginCss = tagId;',
    '  tag.textContent = css;',
    '  document.head.appendChild(tag);',
    '}',
  ]
  source.push(classMap === undefined ? 'export {};' : `export default ${JSON.stringify(classMap)};`)
  return source.join('\n')
}

/** Tailwind v4（@tailwindcss/postcss）。所有全局 .css 统一过这一道编译。 */
const tailwindProcessor = postcss([tailwindcss()])

export default defineConfig({
  name: `${id}/client`,
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  dts: false,
  // clean 必须关闭：lib/index.js 是手写的 Host 半，不能被清掉。
  clean: false,
  sourcemap: true,
  deps: {
    neverBundle: isRequested,
    alwaysBundle: (specifier) => !isRequested(specifier),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  plugins: [{
    // 管线一：CSS Modules（官方 dsh-css-modules-inline 移植）
    name: 'dsh-css-modules-inline',
    async resolveId(source, importer) {
      if (!source.endsWith('.module.css') || importer === undefined) return null
      // 裸 specifier（node_modules 的 CSS）交给 bundler 解析；相对/绝对路径按旧逻辑直拼。
      // skipSelf 避免本钩子递归。
      const resolved = await this.resolve(source, importer, { skipSelf: true })
      const abs = resolved?.id ?? (isAbsolute(source) ? source : resolvePath(dirname(importer), source))
      return CSS_MODULES_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId) {
      if (!virtualId.startsWith(CSS_MODULES_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(CSS_MODULES_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      // The virtual id otherwise hides the physical stylesheet from Rolldown's watch graph.
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code, exports: cssExports } = transform({
        filename: fileId,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap = {}
      const exportEntries = Object.entries(cssExports ?? {})
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      for (const [local, exp] of exportEntries) classMap[local] = exp.name
      return styleInjectionModule(id, fileId, code.toString(), classMap)
    },
  }, {
    // 管线二：全局 CSS + Tailwind 编译
    name: 'dsh-css-global-inline',
    async resolveId(source, importer) {
      // 必须排除 .module.css，否则抢在管线一前面误吞（不哈希且无映射导出）
      if (!source.endsWith('.css') || source.endsWith('.module.css') || importer === undefined) return null
      // 裸 specifier（如 @xyflow/react/dist/style.css）交给 bundler 解析，
      // 否则会被当成相对路径拼出 src/client/@xyflow/... → ENOENT。
      const resolved = await this.resolve(source, importer, { skipSelf: true })
      const abs = resolved?.id ?? (isAbsolute(source) ? source : resolvePath(dirname(importer), source))
      return GLOBAL_CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId) {
      if (!virtualId.startsWith(GLOBAL_CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(GLOBAL_CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      this.addWatchFile(fileId)
      const raw = await readFile(fileId, 'utf8')
      const result = await tailwindProcessor.process(raw, { from: fileId })
      // Tailwind 产物内容依赖扫描到的源文件类名；把依赖注册进 watch，
      // 否则 tsx 变更触发重建时本虚拟模块的 load 结果被缓存，新类不生成。
      for (const message of result.messages) {
        if (message.type === 'dependency') this.addWatchFile(message.file)
      }
      return styleInjectionModule(id, fileId, result.css)
    },
  }, {
    name: 'dsh-client-revision-stamp',
    async writeBundle(outputOptions, bundle) {
      const entry = Object.values(bundle).find((output) => output.type === 'chunk' && output.isEntry)
      if (entry === undefined || outputOptions.dir === undefined) return
      const entryPath = resolvePath(outputOptions.dir, entry.fileName)
      const current = await stat(entryPath)
      const completedAt = new Date(Math.max(Date.now(), current.mtimeMs + 1))
      await utimes(entryPath, current.atime, completedAt)
    },
  }],
  outputOptions: {
    entryFileNames: 'client.js',
    chunkFileNames: 'client.[name].js',
    banner: (chunk) =>
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, ${chunk.isEntry ? '' : `chunk: ${JSON.stringify(chunk.fileName)}, `}factory: (require) => {`,
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
})
