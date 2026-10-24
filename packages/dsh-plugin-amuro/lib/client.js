window.__ModuleLoader__.load({
	id: "dsh-plugin-amuro",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		// node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		// \0dsh-css:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-amuro/src/client/Amuro.module.css.mjs
		const css$1 = ".UtjRDG_page{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}.UtjRDG_title{font-size:var(--dsw-font-l-20-font-size);line-height:var(--dsw-font-l-20-line-height);font-weight:var(--dsw-font-l-20-font-weight)}.UtjRDG_card{background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md)}.UtjRDG_caption{color:var(--dsw-alias-label-tertiary);font-size:var(--dsw-font-base-16-font-size);line-height:var(--dsw-font-base-16-line-height)}";
		const tagId$1 = "dsh-plugin-amuro/Amuro.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-plugin-amuro";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var Amuro_module_css_default = {
			"caption": "UtjRDG_caption",
			"card": "UtjRDG_card",
			"page": "UtjRDG_page",
			"title": "UtjRDG_title"
		};
		// src/client/AmuroPage.tsx
		/**
		* main keyed slot 页面。两层样式示例（手册 §6.2）：
		* 布局用 tw: 工具类，业务视觉用 CSS Modules + dsw token。
		*/
		function AmuroPage() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(Amuro_module_css_default.page, "tw:flex tw:h-full tw:flex-col tw:gap-4 tw:p-6"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
					className: Amuro_module_css_default.title,
					children: "Hello Amuro"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "tw:flex tw:gap-4",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
						className: clsx(Amuro_module_css_default.card, "tw:flex-1 tw:p-4"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: Amuro_module_css_default.caption,
							children: "卡片 A"
						})
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
						className: clsx(Amuro_module_css_default.card, "tw:flex-1 tw:p-4"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: Amuro_module_css_default.caption,
							children: "卡片 B"
						})
					})]
				})]
			});
		}
		// \0dsh-global-css:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-amuro/src/client/styles.css.mjs
		const css = "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */\n:root, :host {\n  --tw-spacing: 0.25rem;\n}\n.tw\\:flex {\n  display: flex;\n}\n.tw\\:h-full {\n  height: 100%;\n}\n.tw\\:flex-1 {\n  flex: 1;\n}\n.tw\\:flex-col {\n  flex-direction: column;\n}\n.tw\\:gap-4 {\n  gap: calc(var(--tw-spacing) * 4);\n}\n.tw\\:p-4 {\n  padding: calc(var(--tw-spacing) * 4);\n}\n.tw\\:p-6 {\n  padding: calc(var(--tw-spacing) * 6);\n}\n";
		const tagId = "dsh-plugin-amuro/styles.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-plugin-amuro";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		// src/client/index.tsx
		/** Sidebar 面板图标，照 sidebar.panellist 契约转发官方图标。 */
		function Icon({ size }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlayOutlineRegular, { size });
		}
		const inject = ["slots"];
		function apply(ctx) {
			ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
				name: "sidebar.panellist",
				id: "plugin-amuro",
				order: 1,
				label: "Amuro"
			}, Icon));
			ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: "plugin-amuro"
			}, () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AmuroPage, {})));
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map