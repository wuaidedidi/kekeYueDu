# kekeYueDu 技术文档

## 概述

kekeYueDu 是一个基于 Electron + Vue 3 的桌面阅读写作平台，提供丰富的写作工具、评论系统和商城功能。

## 技术架构

### 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Electron 主进程  │    │  Electron 渲染进程 │    │   Node.js 后端   │
│                 │    │                 │    │                 │
│  - 窗口管理       │    │  - Vue 3 应用     │    │  - Express.js    │
│  - IPC 通信       │◄──►│  - Pinia 状态     │◄──►│  - SQLite 数据库 │
│  - 文件系统       │    │  - Element Plus  │    │  - JWT 认证      │
│  - 应用生命周期   │    │  - ECharts       │    │  - API 路由       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                      ▲                       ▲
         │                      │                       │
         └──────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │  API 文档 Swagger │
                    │  单元测试 Vitest │
                    │  E2E测试 Playwright│
                    │  CI/CD GitHub Actions│
                    └─────────────────┘
```

### 技术栈

#### 前端
- **框架**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **UI库**: Element Plus
- **构建工具**: Vite
- **图表**: ECharts
- **编辑器**: Trix
- **桌面框架**: Electron

#### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: SQLite
- **认证**: JWT
- **文档**: Swagger/OpenAPI
- **安全**: Helmet, Rate Limiting

#### 开发工具
- **代码质量**: ESLint, Prettier
- **测试**: Vitest (单元), Playwright (E2E)
- **CI/CD**: GitHub Actions
- **文档**: PlantUML
- **性能**: 自定义性能监控

## 核心功能模块

### 1. 用户认证系统
- 用户注册/登录
- JWT Token 管理
- 权限控制（管理员/普通用户）
- 安全中间件（速率限制、输入验证）

### 2. 写作编辑器
- 富文本编辑器（Trix）
- 图片插入和管理
- 实时保存
- 版本历史管理
- 字数统计

### 3. 评论系统
- 评论发布和管理
- 实时更新（Server-Sent Events）
- 评论状态管理（新/已读/已处理）
- 批量操作
- 操作日志记录

### 4. 商城系统
- 商品管理
- 用户权益管理
- 积分系统
- 订单管理
- 充值功能

### 5. 数据可视化
- 写作统计
- 用户活跃度分析
- 商城数据报表
- ECharts 图表展示

## 数据库设计

### 主要数据表

```sql
-- 用户表
users (id, username, password, email, role, created_at, updated_at)

-- 评论表
comments (id, book_id, chapter_id, user_id, content_html, content_text,
          is_read, status, created_at, updated_at)

-- 商城商品表
products (id, title, subtitle, description, type, price, charge_mode,
          duration_days, times, status, stock)

-- 用户权益表
user_rights (id, user_id, product_id, status, expires_at, created_at)

-- 操作日志表
admin_logs (id, user_id, action, target_type, target_id, details,
             ip_address, user_agent, created_at)
```

## API 接口文档

### 认证接口

#### POST /api/register
用户注册

**请求体:**
```json
{
  "username": "testuser",
  "password": "password123",
  "confirmPassword": "password123",
  "email": "test@example.com"
}
```

**响应:**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/login
用户登录

**请求体:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

### 访问API文档
- Swagger UI: http://localhost:9999/api-docs
- JSON格式: http://localhost:9999/api-docs.json
- YAML格式: http://localhost:9999/api-docs.yaml

## 测试策略

### 单元测试 (Vitest)
- 工具函数测试
- 组件逻辑测试
- API接口测试
- 覆盖率目标: 70%+

```bash
npm run test:coverage
```

### E2E测试 (Playwright)
- 用户流程测试
- 页面交互测试
- 跨浏览器测试
- API集成测试

```bash
npm run test:e2e
```

### 质量保证
- ESLint 代码检查
- Prettier 代码格式化
- TypeScript 类型检查
- 自动化 CI/CD 流水线

## 部署流程

### 开发环境
```bash
# 安装依赖
npm install

# 开发模式
npm run dev:full

# 类型检查
npm run type-check

# 测试
npm run test
```

### 生产构建
```bash
# 前端构建
npm run build:renderer

# Electron 打包
npm run build

# 启动应用
npm start
```

## 性能优化

### 前端优化
- 代码分割（手动分包）
- 懒加载组件
- 图片优化
- 构建压缩

### 后端优化
- 数据库索引
- 查询优化
- 缓存策略
- 速率限制

### 监控指标
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- API 响应时间

## 安全措施

### 认证安全
- JWT Token 认证
- 密码强度要求
- 登录速率限制
- Token 过期机制

### 数据安全
- 输入验证和清洗
- SQL注入防护
- XSS 攻击防护
- CSRF 保护

### 网络安全
- HTTPS 加密
- 安全头部设置
- 跨域控制
- 文件上传限制

## 开发指南

### 代码规范
- 使用 ESLint 检查代码质量
- 使用 Prettier 统一代码格式
- 遵循 Vue 3 组合式API 最佳实践
- 使用 TypeScript 类型系统

### Git 工作流
1. 从 develop 分支创建功能分支
2. 开发完成后提交 Pull Request
3. 代码审查和自动化测试
4. 合并到 develop 分支
5. 定期合并到 main 分支

### 分支管理
- `main`: 生产环境分支
- `develop`: 开发环境分支
- `feature/*`: 功能开发分支
- `hotfix/*`: 紧急修复分支

## 架构图解

### PlantUML 图表
项目包含以下 PlantUML 架构图：

1. **系统架构图** (`docs/architecture.puml`)
   - 整体技术架构
   - 组件关系图
   - 部署结构图

2. **组件架构图** (`docs/components.puml`)
   - Vue 组件层次结构
   - 组件依赖关系
   - 状态管理架构

3. **数据流图** (`docs/dataflow.puml`)
   - 用户认证流程
   - API 请求流程
   - 实时更新流程
   - 文件上传流程

生成图片：
```bash
# 使用 PlantUML 服务生成图片
docker run -v $(pwd)/docs:/data plantuml/plantuml -tpng /data/architecture.puml
```

## 故障排除

### 常见问题

#### 1. Electron 应用无法启动
- 检查 Node.js 版本兼容性
- 验证依赖包完整性
- 检查端口占用情况

#### 2. 数据库连接失败
- 确认 SQLite 文件权限
- 检查数据库文件完整性
- 验证 SQL 语句语法

#### 3. API 请求失败
- 检查服务器是否启动
- 验证 CORS 配置
- 确认认证 Token 有效性

### 调试技巧
- 使用浏览器开发者工具
- 启用详细日志输出
- 使用 Vitest 调试测试
- 利用 Playwright 调试 E2E

## 贡献指南

### 提交代码
1. Fork 项目仓库
2. 创建功能分支
3. 编写代码和测试
4. 更新文档
5. 提交 Pull Request

### 代码审查
- 代码风格检查
- 功能完整性测试
- 性能影响评估
- 安全性审查

## 许可证

本项目采用 MIT 许可证。详情请参见 [LICENSE](../LICENSE) 文件。