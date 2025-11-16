# 端口配置与环境管理指南

本项目实现了统一的端口配置系统（`config.js`），符合现代化部署最佳实践。该系统提供环境检测、端口冲突检测与自动重试机制，并确保前后端共享同一命名规范的环境变量。

## 环境与策略

- 开发环境（development）
  - 前端：固定 `3000`
  - 后端：固定 `5000`
- 测试环境（test）
  - 通过环境变量配置：`FRONTEND_PORT=4000`，`BACKEND_PORT=6000`（示例）
  - 若未设置，默认回退为上述示例值
- 生产环境（production）
  - 必须通过环境变量动态提供：`FRONTEND_PORT` 与 `BACKEND_PORT`（或 `PORT` 作为后端兼容）

环境检测逻辑：优先读取 `APP_ENV`，其次 `NODE_ENV`，默认 `development`。

## 环境变量命名规范（前后端共享）

- `FRONTEND_PORT`：前端开发/测试/生产端口
- `BACKEND_PORT`：后端开发/测试/生产端口
- `PORT`：后端端口的兼容别名（仅生产允许作为后端端口）

说明：前端运行时代码不直接读取任意环境变量。端口信息在构建期间通过 Vite `define` 注入，运行时采用同源 + 代理方式访问后端。

## 自动端口冲突检测与重试

- Vite 开发/预览服务器：启用 `strictPort:false`，当端口被占用时会自动尝试下一个端口
- 后端 Express 服务：使用 `startServerWithRetry(app, initialPort, maxRetries)`，若端口占用自动递增重试，默认最多 20 次

## 文件与实现

- `config.js`（ESM）：
  - `getEnv()`：环境检测（development/test/production）
  - `resolvePorts(env)`：按环境解析端口（支持环境变量与默认值）
  - `buildOrigins(ports)`：生成 `serverOrigin` 与 `clientOrigin`
  - `buildProxy(serverOrigin)`：统一 Vite 代理配置（`/api`、`/allBooks`、`/uploads`）
  - `isPortFree()/pickAvailablePort()`：端口占用探测工具（提供给工具链使用）
- `config.cjs`（CJS）：
  - 与 `config.js` 等效的服务器端实现
  - `startServerWithRetry(app, initialPort, maxRetries)`：后端端口冲突自动重试
- `vite.config.ts`：
  - 读取 `config.js`，统一设置 `server.port` 与 `preview.port`
  - 使用 `buildProxy()` 代理到后端 Origin
  - 通过 `define.__SERVER_ORIGIN__` 注入后端 Origin 到前端运行时
- `server/index.cjs`：
  - 读取 `config.cjs`，使用统一端口与 CORS `CLIENT_ORIGIN`
  - 使用 `startServerWithRetry()` 启动后端并处理端口占用
- `src/utils/http.ts`：
  - 前端请求统一使用同源或注入的后端 Origin（`__SERVER_ORIGIN__`），构造 `BASE=/api`

## 环境变量优先级

1. `FRONTEND_PORT` 与 `BACKEND_PORT`（生产必须）
2. `PORT`（后端生产兼容，仅当 `BACKEND_PORT` 未设置时）
3. 环境默认值（dev: 3000/5000，test: 4000/6000）

## 示例

开发环境：

```
# .env 或 shell
APP_ENV=development
# 可选覆盖
FRONTEND_PORT=3000
BACKEND_PORT=5000
```

测试环境：

```
APP_ENV=test
FRONTEND_PORT=4000
BACKEND_PORT=6000
```

生产环境：

```
APP_ENV=production
FRONTEND_PORT=8080
BACKEND_PORT=9000
```

## 常见问题排查

- 端口被占用：
  - 前端：Vite 会自动切换到下一个端口（日志提示）
  - 后端：日志会提示占用并尝试递增端口，直至成功
- CORS 报错：
  - 确认后端 `CLIENT_ORIGIN` 与前端实际运行地址一致
  - 在开发/预览环境中，前端请求应使用同源相对路径（`/api/...`）并由代理转发
- 无法连接后端：
  - 检查 `.env` 中生产端口是否设置完整
  - 确认没有防火墙或占用冲突，查看后端启动日志

## 验证标准

- 各环境配置能正确加载：通过启动日志展示端口与环境信息
- 端口冲突自动处理：观察端口占用时的递增重试日志
- 配置变更无需改代码：只需修改环境变量，前后端均按新配置运行
- 文档完整一致：本文件即为规范与实现说明