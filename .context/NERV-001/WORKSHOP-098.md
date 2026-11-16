# Task 依赖表达与业务扩展字段补充调查

> updated_by: Codex - GPT-6
> updated_at: 2026-11-01（Asia/Shanghai）
> evidence_window: 2026-11-01；官方文档及明确标注的源码快照
> status: 已完成本轮补充调查；按后续要求禁止 fork，Vikunja 按官方原版 + 插件 API 重新判定

本轮以用户补充需求为准：只要求能表达 block；必须能持久保存 workspaceId、sessionId 或等价自定义字段，优先支持独立 goals、stories、specs 长文本字段。自动 block 门禁、Agent 分派、部署形态不作为筛选门槛。后续新增约束：不允许 fork；插件不等同于 fork，但必须单独核实官方原版的兼容范围。

## 交付结论

### 既有调查中已经有符合项，但“关系符合”不等于“业务字段符合”

旧报告已经确认 Beads、Gas City、OpenProject、Redmine、Vikunja、Wekan、Gitea、Plane、Huly、Taskwarrior、tududi、GanttProject 等能表达任务关系。其中本轮按新增字段要求复核后，能够同时给出直接证据的优先候选是 **Redmine、OpenProject、Beads、Kanboard、Gas City**；**Vikunja 官方原版 + 第三方 Custom Fields 插件** 据作者文档可通过 API 保存业务字段，补列为待运行验证候选；依赖 fork 的任务详情页集成不允许采用；Wekan 可作为部分符合项。`block` 只按可持久表达的有向关系判定，不要求产品自行执行解锁或调度。

### 最贴合需求的候选是 Redmine、OpenProject 和 Beads

| 项目 | 许可 | block / previous / next | `workspaceId` / `sessionId` | `goals` / `stories` / `specs` 长文本 | 判定 |
| --- | --- | --- | --- | --- | --- |
| [Redmine](https://github.com/redmine/redmine) | GPL-2.0 | Issue 原生支持 `blocks/blocked by` 与 `precedes/follows`；可形成线性、多前置 DAG 和父子层级（[Issue 文档](https://www.redmine.org/projects/redmine/wiki/RedmineIssues)） | Issue custom field 可定义字符串字段，建议建 `workspaceId`、`sessionId`；字段值随 Issue 持久化并由 REST Issue 表示（[REST Issues](https://www.redmine.org/projects/redmine/wiki/Rest_Issues)） | 原生 `Long Text` 是可调整大小的多行字段，`Text` 也支持多行；可分别创建三个字段（[Custom fields](https://www.redmine.org/projects/redmine/wiki/RedmineCustomFields)） | **强符合**。字段名称是配置项，不是硬编码业务语义；长度可设置最小/最大值，0 表示不限制。 |
| [OpenProject](https://github.com/opf/openproject) | GPL-3.0 | Work Package 关系原生含 predecessor/successor、blocks/blocked by，并有父子层级（[relations and hierarchies](https://www.openproject.org/docs/user-guide/work-packages/work-package-relations-hierarchies/)） | Work Package custom field 可定义 `Text`/其他类型，建议配置两个字段；通过 Work Packages API 的 custom field 值读写（[API 文档](https://www.openproject.org/docs/api/endpoints/work-packages/)） | 官方 custom field 类型明确包含 `Long text`；可建立 `goals`、`stories`、`specs` 三个字段（[custom fields](https://www.openproject.org/docs/system-admin-guide/custom-fields/)） | **强符合**。普通自定义字段和 Long text 在 Community 文档中列出；Enterprise add-on 仅影响 Hierarchy/Weighted 等其他类型。 |
| [Beads](https://github.com/gastownhall/beads) | MIT | Issue 依赖支持 blocking、parent-child、conditional-blocks、waits-for，多边关系可表达 DAG；依赖会被持久化并可反向查询（[Dependencies and Gates](https://github.com/gastownhall/beads/blob/main/docs/core-concepts/dependencies.md)） | Issue 有任意 JSON `metadata`，可写 `{workspaceId, sessionId}`；不是产品内置这两个字段（[Issue 类型源码](https://github.com/gastownhall/beads/blob/main/internal/types/types.go)） | Issue 原生有 `Description`、`Design`、`AcceptanceCriteria`、`Notes` 四个文本字段，均适合映射业务长文；`metadata` 也可携带结构化扩展 | **强符合**。建议将 `goals/stories/specs` 映射为 `Design`/`AcceptanceCriteria`/`Notes` 或 metadata 键，并在 PoC 中验证 CLI/API 的写入路径。 |

### 也符合，但字段模型或长文本证据较弱

| 项目 | 许可 | 关系与扩展字段证据 | 长文本/限制 | 判定 |
| --- | --- | --- | --- | --- |
| [Kanboard](https://github.com/kanboard/kanboard) | MIT | Task 支持内部 links；Task Metadata API 提供 `saveTaskMetadata`, `getTaskMetadata` 等任意键值操作，可保存 `workspaceId`、`sessionId` 和业务键（[Task Metadata API](https://docs.kanboard.org/v1/api/task_metadata_procedures/)）；任务描述可表达 block 说明，内部链接可表达有向关系（[Task links](https://docs.kanboard.org/v1/user/tasks/)） | SQLite schema 的 `task_has_metadata.value` 是 `TEXT`；其他数据库和 UI 对超长值的实际上限需运行验证，未把它承诺为无限 textarea | **符合但需验证**。结构扩展很灵活，关系语义比 Redmine/OpenProject 弱。 |
| [Gas City](https://github.com/gastownhall/gascity) | MIT | Bead/Task 使用 `depends_on`/`needs` 表达 DAG；Formula v2 明确支持分支和汇合（[Formula v2](https://github.com/gastownhall/gascity/blob/main/docs/reference/specs/formula-spec-v2.md)） | Bead 有 `description` 与 `metadata map[string]string`，可保存两个 ID；metadata 值是字符串，三个长文可放 description 或编码后的 metadata，但没有三个原生 textarea 字段（[Bead model](https://github.com/gastownhall/gascity/blob/main/internal/beads/beads.go)） | **关系强、字段部分符合**。适合作为可执行 DAG 数据层，不是传统自定义字段表单。 |
| [Wekan](https://github.com/wekan/wekan) | MIT | Card 关系支持 `blocks/is-blocked-by`、`fixes`、`related-to`，另有 parent/subtask（[既有报告](../NERV-002/WeKan.md)） | 有 CustomField 和文本编辑器；本轮未获得官方模型对多行值存储上限的直接证据，不能承诺独立 Long Text 字段或无限长度 | **部分符合**。可表达关系和简单业务键，但长文字段需要 PoC 验证。 |

### 不应按本轮新增标准直接列为“已符合”

- **Taskwarrior**：`depends` 能表达多前置关系，UDA 能持久化命名字符串字段（[UDAs](https://taskwarrior.org/docs/udas/)），但 UDA 是配置型字符串/数值等属性，不是独立 textarea；长文需要使用 description/annotation，不能直接证明三个独立长文本字段。
- **Vikunja 官方原版与扩展方案必须区分**：本轮核验的官方 `main` Task 模型没有通用 custom fields/metadata 属性，但第三方插件文档说明官方原版可使用其 API 与字段管理页。禁止 fork 后仅保留这一 API 路径，任务详情页集成方案排除；见下一节。
- **Plane**：Issue 有关系字段和描述文本，但本轮确认到的 `metadata` 是 IssueLink/版本等对象字段，不是 Task 通用扩展 metadata；custom properties 的可用版别需要锁定版本和社区版运行验证。
- **Gitea、tududi、Huly、GanttProject、TaskJuggler**：任务关系已有调查证据，但本轮没有足够直接证据证明能在任务对象上同时持久保存两个 ID 和三个独立长文本字段，暂列待核验。
- **Task Master**：即使功能满足，仓库许可证是 MIT 加 Commons Clause，不应当作无附加限制的标准 MIT 开源候选。

### 禁止 fork 后，Vikunja 只保留官方版加插件的 API 路径，任务详情页集成排除

**已确认（2026-11-01 文档复核）**：这里的插件具体指第三方维护的 [Custom Fields for Vikunja](https://github.com/itrt4176/vikunja-custom-fields-plugin)，许可证 AGPL-3.0-or-later。它是由 Vikunja 服务端加载的 Go 扩展，不是浏览器插件，也不是修改官方核心代码后另行维护的 fork。[官方 Plugins 文档](https://vikunja.io/docs/plugins/)说明插件可增加 API、执行数据库迁移和监听事件；插件机制目前为实验性，仅支持后端，暂不支持前端插件。Yaegi 源码加载器从 Vikunja 2.3.0 起提供。

**上一轮表述需修正**：插件的[安装文档 Requirements](https://github.com/itrt4176/vikunja-custom-fields-plugin/blob/develop/docs/installation.md#requirements)明确区分：插件本身可运行在官方原版的插件加载器上，API 和字段管理 UI 可用；在 Task 详情页里显示及编辑字段才需要作者的 frontend fork。因此，不能把后端字段持久化也说成必须 fork；同样不能把插件独立的字段定义管理页说成官方 Task 编辑器已支持扩展字段。

| 部分 | 具体能力 | 不允许 fork 时的判定 |
| --- | --- | --- |
| 官方插件机制 | 开启插件配置后，由 Yaegi 在启动时解释加载插件 Go 源码；不需重编官方核心 | 文档层面可用，机制仍为实验性 |
| Custom Fields 后端插件 | 自建字段定义和值等数据库表，通过 Task ID 关联；提供独立 REST API 与字段定义管理页 | 可保留，尚未部署验证 |
| 作者配套 frontend fork | 在任务详情页显示、编辑自定义字段 | 不允许采用 |

[插件 README](https://github.com/itrt4176/vikunja-custom-fields-plugin/blob/develop/README.md)与[API 文档](https://github.com/itrt4176/vikunja-custom-fields-plugin/blob/develop/docs/api-reference.md)列出十种类型，包含 text 和 textarea。可创建 workspaceId、sessionId 两个 text 字段，以及 goals、stories、specs 三个独立 textarea 字段。字段名称是建议配置的业务语义；textarea 值按 HTML 字符串提交，原样保存。字段值经插件独立的 /api/v1/plugins/custom-fields 路径读写，不等于写入官方 Task JSON 的同名顶层属性。

定点核验长文持久化时，[插件 main.go](https://github.com/itrt4176/vikunja-custom-fields-plugin/blob/develop/main.go)中的 CustomFieldValue.Value 声明为数据库 TEXT，并关联任务与字段定义 ID。TEXT 不代表无限容量，仍需按目标数据库验证长文与多字节字符。原生 block、precedes/follows、父子关系见[官方 TaskRelation 模型](https://github.com/go-vikunja/vikunja/blob/main/pkg/models/task_relation.go)。

**修订判定**：按用户只要求数据表达、且禁止 fork 的条件，官方 Vikunja + 第三方插件的 API 路径在文档层面满足五个业务字段，列为待运行验证候选。若同时要求这些字段出现在官方 Task 详情页中，则当前方案不满足。作者只对插件和其 fork 的当前配对提供测试支持说明；官方原版上的具体版本兼容、API 读写及关系共同运行未实测，不能标成已验收。

## 调研目标

- 复核既有调查中是否已经存在满足 Task 管理、关系表达和业务字段扩展要求的项目。
- 补充公开网络中能表达 block/previous/next 且支持自定义字段或 metadata 的开源项目。
- 区分原生字段、自定义字段、JSON/键值 metadata、长文本字段和仅能外接映射的方案。
- 记录字段长度、版别和 API/CLI 读写证据，避免把普通描述字段误判为多个业务字段。

## 产品调研

### 本轮判定口径

必须存在持久 Task/Issue/Card/Work Package 等任务对象；必须能保存有向 `block` 或 `precedes/follows` 关系，从而表达 `Task 1 -> Task 2 -> Task 3`。`workspaceId`、`sessionId` 可以是原生字段，也可以是产品支持持久读写的自定义字段或 JSON/键值 metadata。`goals`、`stories`、`specs` 优先要求三个可分别读写的长文本字段；若只能塞进一个 description 或外接表，则降级说明。产品是否根据 block 自动阻塞、解锁、领取或启动 Agent 不参与本轮淘汰。

### 证据边界

官方文档和源码证明字段/关系存在；并不自动证明某个版本的 UI、REST、CLI 都完整暴露全部字段。因此强候选仍应通过同一个最小样例验证：创建 A/B/C，保存 A→B→C，写入两个 ID 和三段长文，再读回并检查长度和编码。

## 技术架构调研

### 数据关系与字段形态

Redmine/OpenProject 把关系和 custom fields 放在项目管理数据模型中，适合人工编辑、REST 集成和报表；Beads/Gas City 把关系作为 issue/bead 图的一部分，metadata 更适合程序写入；Kanboard 把扩展字段建模为 task metadata 键值行。所有这些都能表达 block 数据，但只有部分产品有原生 long-text 类型。

### 业务字段建议映射

对于 Redmine/OpenProject，直接创建 `workspaceId`、`sessionId`、`goals`、`stories`、`specs` 五个 Task/Issue custom fields。对于 Beads，可使用 `metadata.workspaceId`、`metadata.sessionId`，并把三个业务长文分别映射到 `design`、`acceptance_criteria`、`notes`；这是业务映射建议，不是 Beads 内置同名字段。对于 Kanboard，使用 task metadata 键名保存五个值，长文本上限必须在目标数据库上验证。

### 关系执行语义不再作为门槛

`blocks` 关系可以仅作为数据边保存；产品是否把它投影为 `ready`、排程约束或自动启动 Agent 是独立的执行层问题。本轮不因 Wekan、Kanboard、Gitea 或 Taskwarrior 没有自动解锁而降级其关系表达能力，只在字段扩展不足时降级。

## 未决项与证据边界

- Redmine/OpenProject 的 custom field API 写入细节应在锁定版本后做一次真实 REST round-trip；文档已确认字段类型和任务关系，但未在本地部署实例验证权限与序列化格式。
- Beads 的 `metadata` 必须是合法 JSON；其四个文本字段是强证据，但 `goals/stories/specs` 的同名字段需要应用层映射。数据库迁移对 LONGTEXT/TEXT 的具体上限应随版本确认。
- Kanboard 的 metadata schema 证明 SQLite `TEXT`，不代表所有后端和前端都提供无限多行编辑器；需要在目标后端测试 64 KiB 以上、多字节和 Markdown 内容。
- Wekan 的 text custom field 使用富文本编辑器，但本轮未完成模型层长度和 API round-trip 核验，故未列强符合。
- `workspaceId` 可能与产品自己的 Workspace/Project foreign key 语义不同；本报告中的字段名是业务租户/上下文 ID，建议保留为独立业务字段，不要直接复用产品内部 workspace 主键。

## 后续验证建议

1. 优先 PoC **Redmine、OpenProject、Beads**：按五个字段和 A→B→C / D,E→F 样例验证创建、更新、查询、导出和 Unicode 长文。
2. 若偏向程序化、轻量图数据，加入 **Kanboard、Gas City**；若需要人工卡片 UI，再验证 Wekan 的 custom field 长度和 API；同时加入 **官方 Vikunja + Custom Fields 插件（API 路径，不使用 fork）**，验证官方版本兼容、五个字段独立读写及任务关系。
3. 对每个候选锁定 tag/commit，并记录 Community/Enterprise 版别、字段实际存储类型、REST/CLI 序列化和导入导出保留性。
4. 单独定义业务字段命名和 schema 版本，例如 `workspaceId`、`sessionId`、`goals`、`stories`、`specs`；不要依赖 description 拼接多个字段。
