# Vikunja Plugin 机制专项调查

> updated_by: Codex - GPT-6
> updated_at: 2026-11-01（Asia/Shanghai）
> evidence_window: Vikunja 官方文档；官方仓库 `main` 快照 `d013ec416685d5258f952556b22c9b2e795c9f34`（2026-11-01）
> status: 已完成本轮调查

## 交付结论

### 插件主要用 Go 编写，推荐交付 Go 源码目录，不是二进制

Vikunja 官方插件系统提供两种 loader。推荐的 **Yaegi loader** 读取插件目录中的 `.go` 源文件，在 Vikunja 进程内解释执行；不需要编译步骤，也不需要交付插件二进制。插件目录按“每个插件一个子目录”组织，至少导出 `NewPlugin() plugins.Plugin`。可选能力通过额外的 typed factory 暴露，包括认证/非认证 HTTP 路由和数据库迁移。[官方 Plugins 文档](https://vikunja.io/docs/plugins/)；[官方 Plugin Development](https://vikunja.io/docs/plugin-development/)；源码：[Yaegi loader](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/plugins/yaegi/loader.go)、[插件接口](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/plugins/interfaces.go)。

Vikunja 仍保留 **Native loader**，但官方标记为 deprecated。Native 插件是编译后的 Go `.so` 共享库，必须与宿主使用完全匹配的 Go 版本和依赖；当前只支持 Linux、macOS，不支持 Windows，且未来会移除。它是共享库，不是独立服务或独立 Worker。[官方 manager 源码](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/plugins/manager.go)。

Yaegi 插件的实际交付物可以是一个目录，例如：

```text
plugins/
└── my-plugin/
    └── main.go
```

官方文档说明当前 Yaegi loader 会逐个解释目录内的 `.go` 文件；多文件插件可能受文件处理顺序影响，单文件 `main.go` 是最稳妥的交付形态。插件代码不是沙箱：与 Vikunja 共享进程内存，并拥有 Vikunja 暴露给 Yaegi 的 API 和进程权限。[Yaegi loader 源码](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/plugins/yaegi/loader.go)。

### 安装后由 Vikunja 主程序在启动阶段加载，不是独立启动的服务

配置默认关闭插件，需设置：

```yaml
plugins:
  enabled: true
  dir: "/path/to/plugins"
  loader: yaegi
```

Yaegi 下把插件子目录复制到 `plugins.dir`；Native 下把 `.so` 文件放入该目录。然后重启 Vikunja。官方文档的安装步骤是“复制文件/目录、重启、查看日志”；当前没有热加载或运行中卸载。卸载需要停止 Vikunja、删除插件目录或 `.so`，再重启。[安装与配置文档](https://vikunja.io/docs/plugins/)。

在当前官方源码中，`initialize.FullInitWithoutAsync()` 的顺序是：先执行核心 `migration.Migrate(nil)`，再调用 `plugins.Initialize()`；完整初始化由 `web` 命令的 `PreRun` 执行。插件管理器随后加载插件、登记插件迁移，运行迁移并调用每个插件的 `Init()`。HTTP 路由在 `routes.RegisterRoutes()` 中、且仅当 `plugins.enabled` 时注册到 `/api/v1/plugins/`（认证）和 `/plugins/`（未认证）。进程收到退出信号时，主程序调用 `plugins.Shutdown()`。[初始化源码](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/initialize/init.go)、[web 命令源码](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/cmd/web.go)、[路由注册源码](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/routes/routes.go)。

### 插件通过宿主提供的 xorm 会话访问同一个数据库，可注册自己的迁移和表

插件不是拥有第二个数据库服务。官方插件开发接口把数据库迁移定义为 `MigrationPlugin`：插件返回 `[]*xormigrate.Migration`，每条迁移包含唯一 ID、`Migrate` 和 `Rollback`。管理器加载插件后调用 `migration.AddPluginMigrations(...)`，把插件迁移加入全局迁移列表；插件初始化流程随后调用 `migration.Migrate(nil)`。迁移列表按 ID 排序，由与 Vikunja 核心迁移相同的 `xormigrate` 机制执行，并写入同一个数据库的迁移跟踪表。[MigrationPlugin 接口](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/plugins/interfaces.go)、[插件管理器](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/plugins/manager.go)、[迁移实现](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/migration/migration.go)。

插件迁移可以用宿主提供的 xorm 引擎执行 `Sync2` 等操作创建插件自己的表；官方开发示例建立 `PluginData` 表并使用 `xorm:"text"` 字段。插件的自有数据因此通常与 Vikunja 主数据库共存，但表和模型由插件自行定义。删除插件文件不会自动删除插件表或数据；除非插件显式提供并执行 rollback，数据会留在数据库中。这一点是依据迁移机制和卸载文档的架构推导，官方未承诺“删除插件即清理数据”。

插件路由处理器通过 `github.com/vikunja/vikunja/pkg/db` 使用宿主数据库：

```go
s := db.NewSession()
defer s.Close()
// xorm query / insert / update
```

当前官方源码中，`db.NewSession()` 创建 xorm session 并立即 `Begin()` 开启事务；成功写入后插件需要显式 `Commit()`，出错时 `Rollback()`，`Close()` 会回滚未提交事务。只读或自行控制提交时，也可使用暴露给 Yaegi 的 `NewReadSession()` / `NewAutocommitSession()`。数据库连接由 Vikunja 的全局 xorm engine 管理，数据库类型仍由宿主配置（SQLite、MySQL 或 PostgreSQL）决定。[数据库源码](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/db/db.go)、[Yaegi 暴露的数据库符号](https://github.com/go-vikunja/vikunja/blob/d013ec416685d5258f952556b22c9b2e795c9f34/pkg/yaegi_symbols/vikunja_db.go)。

### 数据库与接口的边界

- 插件可以通过迁移创建自己的表，也可以读写 Vikunja 的现有模型/表，但后者会与版本、模型和权限耦合；官方插件文档没有提供独立 schema 隔离或自动兼容保证。
- 插件 API 路由挂在主程序的 Echo 实例中，认证路由由宿主 JWT/API token 中间件体系处理；插件不是单独监听端口的进程。
- 插件与主程序共享内存、数据库连接和进程权限。恶意或有缺陷的插件可能读取/修改用户数据、访问网络或影响主进程；官方文档明确要求只安装可信来源插件。
- Yaegi 插件在运行时解释，性能和兼容性取决于宿主暴露的符号；Native `.so` 则有严格 Go 版本、依赖和平台耦合。

### 直接给现有 `tasks` 表加列，不会自动扩展原有 Task 接口

本节按“迁移由外部离线作业负责”的前提回答。离线作业当然可以对宿主数据库执行 `ALTER TABLE tasks ADD COLUMN ...`；插件也可以用自己的 xorm 映射或 SQL 读写该列。但这只改变数据库 schema，不会改变已经编译进 Vikunja 的 Go 类型和 HTTP handler。

当前官方 `models.Task` 是静态 Go struct；官方任务路由直接把 `&models.Task{}`交给通用 `WebHandler`，而 `Task.Update` 还维护了一个明确的 `colsToUpdate` 白名单（包含 `title`、`description`、`priority` 等核心列）。新增数据库列不在这个 struct 和白名单中，因此：

- 原 `/tasks` 的 JSON 请求不会因为数据库多了一列就自动得到同名可写字段；
- 原 `Task.Create`/`Task.Update` 不会把这个新增列纳入自己的 insert/update 语义；
- 原 `Task.ReadOne`/列表接口返回的 `models.Task` 不会序列化这个新增字段；
- 查询、过滤、排序和 Swagger/API schema 也不会自动出现这个字段。

插件可以定义自己的扩展 struct（例如只声明 `ID` 和新增列）或执行定点 SQL，通过 `db.NewSession()` / `NewAutocommitSession()` 读写同一张 `tasks` 表，再提供 `/api/v1/plugins/...` 路由。这样能让插件自己的 API 读写新增列，但不能让官方 `/tasks` handler 使用它。插件也可以监听任务事件，在任务创建/更新后同步新增列；这仍然是旁路同步，不会改变原接口的请求模型和响应模型。

官方插件接口没有模型字段注册、CRUD 装饰、handler 替换、JSON schema 注入或方法 monkey-patch 能力。Go 运行时也不能向已编译的 `models.Task` 类型追加字段。因此，如果要求**原有** `/tasks` 接口直接接受、保存并返回新增字段，实际需要修改 Vikunja 核心源码中的 `models.Task`、创建/更新逻辑、序列化/API 文档及相关查询，再重新构建 Vikunja；仅安装 Yaegi 插件做不到。

## 未决项与证据边界

- 本报告锁定了官方 `main` 快照和官方文档，但没有在本地启动 Vikunja 做安装与迁移 round-trip；插件在目标版本上的实际兼容性需要运行验证。
- 官方插件系统仍标记为 experimental，插件 API 可能变化；当前只支持 backend plugin，没有官方 frontend plugin 支持。
- “插件可读写现有 Vikunja 表”由宿主暴露的 db、models 和 xorm 符号推导；实际可访问的符号和权限应按目标版本核对，不能把它理解成稳定的跨版本数据库 ABI。
- 直接修改现有表的新增列未在本地做数据库 round-trip；本报告依据官方 `models.Task`、任务路由和 `Task.Update` 的静态字段/更新白名单判断其不会自动进入原接口。
- 多文件 Yaegi 插件的文件顺序限制来自官方文档；建议交付单文件或明确控制文件加载依赖。

## 后续验证建议

1. 在目标 Vikunja 版本上用最小 Yaegi 插件验证：加载、日志、认证路由、插件迁移建表、写入、重启后的迁移幂等和 graceful shutdown。
2. 验证 SQLite、PostgreSQL、MySQL 至少一种实际数据库上的 `xorm:"text"`、事务提交和 rollback 行为。
3. 将插件表命名、迁移 ID、版本升级和卸载保留数据策略写入插件自己的兼容性契约；不要依赖删除插件自动清理。
