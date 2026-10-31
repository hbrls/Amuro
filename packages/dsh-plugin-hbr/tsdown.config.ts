import { readFileSync } from 'node:fs'
import { copyFile, cp, stat, utimes, readFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, resolve as resolvePath } from 'node:path'
import { transform } from 'lightningcss'
import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'
import { defineConfig } from 'tsdown'

const packageDir = import.meta.dirname
const manifest = JSON.parse(readFileSync(resolvePath(packageDir, 'package.json'), 'utf8'))
const id = manifest.name

const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  'zod', '@tanstack/react-virtual',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

const isRequested = (specifier) => PLATFORM_MODULES.includes(specifier)

const CSS_MODULES_VIRTUAL_PREFIX = '\0dsh-css:'
const GLOBAL_CSS_VIRTUAL_PREFIX = '\0dsh-global-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

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

const tailwindProcessor = postcss([tailwindcss()])

export default defineConfig({
  name: `${id}/client`,
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  dts: false,
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
    name: 'dsh-css-modules-inline',
    async resolveId(source, importer) {
      if (!source.endsWith('.module.css') || importer === undefined) return null
      const resolved = await this.resolve(source, importer, { skipSelf: true })
      const abs = resolved?.id ?? (isAbsolute(source) ? source : resolvePath(dirname(importer), source))
      return CSS_MODULES_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId) {
      if (!virtualId.startsWith(CSS_MODULES_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(CSS_MODULES_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
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
    name: 'dsh-css-global-inline',
    async resolveId(source, importer) {
      if (!source.endsWith('.css') || source.endsWith('.module.css') || importer === undefined) return null
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
      for (const message of result.messages) {
        if (message.type === 'dependency') this.addWatchFile(message.file)
      }
      return styleInjectionModule(id, fileId, result.css)
    },
  }, {
    name: 'dsh-host-half-copy',
    async writeBundle() {
      await copyFile(resolvePath(packageDir, 'src/index.js'), resolvePath(packageDir, 'lib/index.js'))
      await cp(resolvePath(packageDir, 'src/prompts'), resolvePath(packageDir, 'lib/prompts'), { recursive: true })
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
