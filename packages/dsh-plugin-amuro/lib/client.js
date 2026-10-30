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
		const css$2 = ".UtjRDG_page{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}.UtjRDG_title{font-size:var(--dsw-font-l-20-font-size);line-height:var(--dsw-font-l-20-line-height);font-weight:var(--dsw-font-l-20-font-weight)}.UtjRDG_card{background:var(--dsw-alias-bg-l1);border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md)}.UtjRDG_caption{color:var(--dsw-alias-label-tertiary);font-size:var(--dsw-font-base-16-font-size);line-height:var(--dsw-font-base-16-line-height)}";
		const tagId$2 = "dsh-plugin-amuro/Amuro.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-plugin-amuro";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
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
		// \0dsh-css:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-amuro/src/client/ClarifyView.module.css.mjs
		const css$1 = ".WWtQgG_view{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}.WWtQgG_heading{font-size:var(--dsw-font-base-16-font-size);line-height:var(--dsw-font-base-16-line-height);font-weight:var(--dsw-font-base-16-font-weight)}.WWtQgG_count,.WWtQgG_time,.WWtQgG_empty{color:var(--dsw-alias-label-tertiary)}.WWtQgG_count,.WWtQgG_time{font:var(--dsw-font-xxs-12)}.WWtQgG_empty{text-align:center}.WWtQgG_record{background:var(--dsw-alias-bg-l1);border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);min-width:0}.WWtQgG_type{overflow-wrap:anywhere;min-width:0;color:var(--dsw-alias-label-secondary);font-weight:var(--dsw-font-base-16-font-weight)}.WWtQgG_time{white-space:nowrap;flex:none}.WWtQgG_payload{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}.WWtQgG_error{color:var(--dsw-alias-state-error-primary);white-space:pre-wrap;overflow-wrap:anywhere;margin:0}.WWtQgG_raw{white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-markdown-code-block);border-radius:var(--dsw-radius-sm);font:var(--dsw-font-markdown-code-block-small);overflow:auto}";
		const tagId$1 = "dsh-plugin-amuro/ClarifyView.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-plugin-amuro";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ClarifyView_module_css_default = {
			"count": "WWtQgG_count",
			"empty": "WWtQgG_empty",
			"error": "WWtQgG_error",
			"heading": "WWtQgG_heading",
			"payload": "WWtQgG_payload",
			"raw": "WWtQgG_raw",
			"record": "WWtQgG_record",
			"time": "WWtQgG_time",
			"type": "WWtQgG_type",
			"view": "WWtQgG_view"
		};
		// src/client/ClarifyView.tsx
		function ClarifyTime({ time }) {
			if (!Number.isFinite(time)) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", {
				className: ClarifyView_module_css_default.time,
				children: new Date(time).toLocaleString()
			});
		}
		function ClarifyRecordView({ record }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: clsx(ClarifyView_module_css_default.record, "tw:flex tw:flex-col tw:gap-2 tw:p-4"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "tw:flex tw:min-w-0 tw:items-center tw:justify-between tw:gap-3",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: ClarifyView_module_css_default.type,
						children: record.type ?? "clarify"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClarifyTime, { time: record.time })]
				}), record.parseError === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: ClarifyView_module_css_default.payload,
					children: record.payload
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
					className: ClarifyView_module_css_default.error,
					children: ["Invalid clarify arguments: ", record.parseError]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
					className: clsx(ClarifyView_module_css_default.raw, "tw:m-0 tw:p-3"),
					children: record.argumentsText
				})] })]
			});
		}
		/** Pure renderer for the in-memory target snapshot. */
		function ClarifyView({ snapshot }) {
			const { records } = snapshot;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: clsx(ClarifyView_module_css_default.view, "tw:flex tw:h-full tw:min-h-0 tw:flex-col"),
				"aria-label": "Clarify calls",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: "tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: clsx(ClarifyView_module_css_default.heading, "tw:m-0"),
						children: "Clarify"
					}), records.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: ClarifyView_module_css_default.count,
						children: records.length
					})]
				}), records.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "tw:flex tw:flex-1 tw:items-center tw:justify-center tw:p-6",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: clsx(ClarifyView_module_css_default.empty, "tw:m-0"),
						children: "No clarify calls in the loaded conversation window."
					})
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
					className: "tw:m-0 tw:flex tw:min-h-0 tw:flex-1 tw:list-none tw:flex-col tw:gap-3 tw:overflow-y-auto tw:p-4",
					children: records.map((record) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClarifyRecordView, { record }, record.callId))
				})]
			});
		}
		// src/client/clarifyProjection.ts
		const CLARIFY_TARGET = "amuro-clarify";
		const EMPTY_CLARIFY_SNAPSHOT = Object.freeze({ records: Object.freeze([]) });
		function invalidFieldsError(fields) {
			return `Expected ${fields.join(" and ")} to be ${fields.length === 1 ? "a string" : "strings"}.`;
		}
		function parseArguments(argumentsText) {
			try {
				const parsed = JSON.parse(argumentsText);
				if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { parseError: "Expected a JSON object with string type and payload fields." };
				const { type, payload } = parsed;
				const invalidFields = [];
				if (typeof type !== "string") invalidFields.push("type");
				if (typeof payload !== "string") invalidFields.push("payload");
				return {
					...typeof type === "string" ? { type } : {},
					...typeof payload === "string" ? { payload } : {},
					...invalidFields.length > 0 ? { parseError: invalidFieldsError(invalidFields) } : {}
				};
			} catch (error) {
				return { parseError: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}` };
			}
		}
		function createClarifyRecord(event) {
			const argumentsText = event.data.arguments;
			return Object.freeze({
				callId: String(event.data.callId),
				seq: event.seq,
				time: event.time,
				argumentsText,
				...parseArguments(argumentsText)
			});
		}
		function matchClarifyCall(event) {
			if (event.data.name !== "clarify") return null;
			return {
				id: String(event.data.callId),
				role: "start"
			};
		}
		const clarifyCallDefinition = {
			kind: "amuro-clarify-call",
			target: CLARIFY_TARGET,
			match: { "tool/call": matchClarifyCall },
			start: (_context, match) => createClarifyRecord(match.event),
			update: (context) => context.state,
			buildViewNode: (context) => {
				if (context.state === void 0) return null;
				return Object.freeze({
					key: context.key,
					kind: context.kind,
					id: context.id,
					target: CLARIFY_TARGET,
					anchorSeq: context.state.seq,
					data: context.state
				});
			}
		};
		function compareRecords(left, right) {
			return left.seq - right.seq || (left.callId < right.callId ? -1 : left.callId > right.callId ? 1 : 0);
		}
		var ClarifySnapshotBuilder = class {
			empty = EMPTY_CLARIFY_SNAPSHOT;
			nodes = /* @__PURE__ */ new Map();
			currentSnapshot = EMPTY_CLARIFY_SNAPSHOT;
			replace(input) {
				this.nodes = new Map(input.nodes.map((node) => [node.key, node]));
				return this.rebuildSnapshot();
			}
			apply(input) {
				if (input.upserts.length === 0) return this.currentSnapshot;
				for (const node of input.upserts) this.nodes.set(node.key, node);
				return this.rebuildSnapshot();
			}
			rebuildSnapshot() {
				if (this.nodes.size === 0) {
					this.currentSnapshot = EMPTY_CLARIFY_SNAPSHOT;
					return this.currentSnapshot;
				}
				const records = Object.freeze([...this.nodes.values()].map((node) => node.data).sort(compareRecords));
				this.currentSnapshot = Object.freeze({ records });
				return this.currentSnapshot;
			}
		};
		const clarifyViewDefinition = {
			target: CLARIFY_TARGET,
			create: () => new ClarifySnapshotBuilder()
		};
		// \0dsh-global-css:/Users/shuaizhexu/github/Amuro/packages/dsh-plugin-amuro/src/client/styles.css.mjs
		const css = "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */\n:root, :host {\n  --tw-spacing: 0.25rem;\n}\n.tw\\:m-0 {\n  margin: 0px;\n}\n.tw\\:flex {\n  display: flex;\n}\n.tw\\:h-full {\n  height: 100%;\n}\n.tw\\:min-h-0 {\n  min-height: 0px;\n}\n.tw\\:min-w-0 {\n  min-width: 0px;\n}\n.tw\\:flex-1 {\n  flex: 1;\n}\n.tw\\:list-none {\n  list-style-type: none;\n}\n.tw\\:flex-col {\n  flex-direction: column;\n}\n.tw\\:items-center {\n  align-items: center;\n}\n.tw\\:justify-between {\n  justify-content: space-between;\n}\n.tw\\:justify-center {\n  justify-content: center;\n}\n.tw\\:gap-2 {\n  gap: calc(var(--tw-spacing) * 2);\n}\n.tw\\:gap-3 {\n  gap: calc(var(--tw-spacing) * 3);\n}\n.tw\\:gap-4 {\n  gap: calc(var(--tw-spacing) * 4);\n}\n.tw\\:overflow-y-auto {\n  overflow-y: auto;\n}\n.tw\\:p-3 {\n  padding: calc(var(--tw-spacing) * 3);\n}\n.tw\\:p-4 {\n  padding: calc(var(--tw-spacing) * 4);\n}\n.tw\\:p-6 {\n  padding: calc(var(--tw-spacing) * 6);\n}\n.tw\\:px-4 {\n  padding-inline: calc(var(--tw-spacing) * 4);\n}\n.tw\\:py-3 {\n  padding-block: calc(var(--tw-spacing) * 3);\n}\n";
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
		function ClarifyViewSlot({ useClarify }) {
			const snapshot = useClarify((value) => value);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClarifyView, { snapshot });
		}
		const inject = [
			"slots",
			"uiConversation",
			"uiSession"
		];
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
			ctx.uiConversation.events.register(clarifyCallDefinition);
			ctx.uiConversation.views.register(clarifyViewDefinition);
			const clarifySources = /* @__PURE__ */ new WeakMap();
			const clarifySource = (binding) => {
				let source = clarifySources.get(binding);
				if (source === void 0) {
					const target = ctx.uiConversation.binding(binding).target(CLARIFY_TARGET);
					source = {
						getSnapshot: () => target.getSnapshot() ?? EMPTY_CLARIFY_SNAPSHOT,
						subscribe: (listener) => target.subscribe(listener)
					};
					clarifySources.set(binding, source);
				}
				return source;
			};
			ctx.uiSession.provide({
				hooks: ["clarify"],
				resolve: (binding) => ({ hooks: { clarify: clarifySource(binding) } })
			});
			ctx.slots.inject("conversation.view", () => ctx.slots.register({
				name: "conversation.view",
				id: "plugin-amuro-clarify",
				order: 20,
				label: "Clarify"
			}, ClarifyViewSlot));
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map