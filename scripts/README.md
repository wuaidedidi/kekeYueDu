# 数据库初始化说明

## 概述

本项目使用 SQLite 作为数据库存储用户数据、卷、草稿、角色和设定信息。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run init-db
```

这将在项目根目录创建 `database.sqlite` 文件，并包含以下表结构：

- **users** - 用户表
- **volumes** - 卷表
- **drafts** - 草稿表
- **characters** - 角色表
- **settings** - 设定表

### 3. 启动开发服务器

```bash
npm run dev:full
```

## 数据库表结构

### users (用户表)
- `id` - 主键
- `username` - 用户名 (唯一)
- `email` - 邮箱
- `password` - 密码
- `avatar` - 头像URL
- `created_at` - 创建时间
- `updated_at` - 更新时间

### volumes (卷表)
- `id` - 主键
- `title` - 卷标题
- `description` - 卷描述
- `user_id` - 用户ID (外键)
- `created_at` - 创建时间
- `updated_at` - 更新时间

### drafts (草稿表)
- `id` - 主键
- `title` - 草稿标题
- `content` - 草稿内容
- `volume_id` - 卷ID (外键)
- `user_id` - 用户ID (外键)
- `word_count` - 字数统计
- `created_at` - 创建时间
- `updated_at` - 更新时间

### characters (角色表)
- `id` - 主键
- `name` - 角色名称
- `aliases` - 别名 (JSON数组)
- `description` - 角色描述
- `tags` - 标签 (JSON数组)
- `avatar` - 头像URL
- `user_id` - 用户ID (外键)
- `draft_id` - 草稿ID (外键，可为空)
- `first_appearance` - 首次出现行号
- `mentions` - 提及次数
- `created_at` - 创建时间
- `updated_at` - 更新时间

### settings (设定表)
- `id` - 主键
- `title` - 设定标题
- `content` - 设定内容
- `category` - 设定分类
- `tags` - 标签 (JSON数组)
- `user_id` - 用户ID (外键)
- `draft_id` - 草稿ID (外键，可为空)
- `created_at` - 创建时间
- `updated_at` - 更新时间

## 注意事项

1. `database.sqlite` 文件已被添加到 `.gitignore` 中，不会被提交到版本控制系统
2. 数据库文件会在首次运行时自动创建，也可以通过 `npm run init-db` 手动初始化
3. 所有表都包含外键约束，确保数据完整性
4. 时间字段会自动设置为当前时间戳

## 重置数据库

如需重置数据库，删除 `database.sqlite` 文件后重新运行 `npm run init-db` 即可。