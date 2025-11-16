# 脚本工具说明

## 概述

本目录包含项目的各种辅助脚本，包括数据库初始化、图片优化等工具。

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

---

## 图片优化工具

### 概述

项目提供了多个图片优化脚本来帮助分析和压缩图片文件，减少应用体积并提升加载性能。

### 使用方法

#### 1. 图片分析工具

```bash
# 分析当前图片使用情况
node scripts/compress-images.cjs analyze public

# 分析并创建压缩示例
node scripts/compress-images.cjs example public
```

#### 2. 高级优化工具（需要系统工具）

```bash
# 分析图片（需要 cwebp, optipng 等工具）
node scripts/optimize-images-advanced.cjs analyze public

# 优化图片（转换为 WebP 格式）
node scripts/optimize-images-advanced.cjs optimize public

# 生成详细优化报告
node scripts/optimize-images-advanced.cjs report public
```

#### 3. 简易优化工具（基于 Jimp）

```bash
# 快速优化大文件
node scripts/optimize-images-simple.cjs optimize public
```

### 优化结果

当前项目图片分析结果：

- **总文件数**: 25 个图片文件
- **总大小**: 7.31 MB
- **主要格式**: PNG (25个文件)
- **需要优化的大文件**: 6个 (>500KB)

#### 大文件列表：
1. `loginBackground.png` - 1.75 MB (23.9%)
2. `carousel4.png` - 1.05 MB (14.4%)
3. `carousel3.png` - 990.83 KB (13.2%)
4. `carousel2.png` - 861.92 KB (11.5%)
5. `carousel1.png` - 853.79 KB (11.4%)
6. `bookTemplate1.png` - 502 KB (6.7%)

### 推荐工具

- **TinyPNG**: https://tinypng.com/ (在线压缩)
- **Squoosh**: https://squoosh.app/ (批量转换)
- **ImageOptim**: macOS 图片优化工具

### 压缩建议

1. **照片类图片**: 使用 JPEG 格式，质量 80-85%
2. **图标/插画**: 使用 PNG（需透明）或 WebP 格式
3. **复杂图片**: 优先考虑 WebP 格式（体积小，质量好）
4. **批量处理**: 使用 Squoosh 进行格式转换和压缩

### 自动化

可以在 CI/CD 流水线中集成图片优化：

```bash
# 在构建前检查图片大小
node scripts/compress-images.cjs analyze public

# 防止大图片提交的 pre-commit hook
#!/bin/bash
node scripts/compress-images.cjs analyze public
if [ $? -ne 0 ]; then
  echo "发现未优化的图片，请压缩后再提交"
  exit 1
fi
```

---

## 注意事项

1. 所有脚本都会在相应的目录生成报告文件，便于查看详细信息
2. 图片优化是可选步骤，建议在发布前进行
3. 数据库文件已被添加到 `.gitignore` 中，不会被提交到版本控制系统
4. 图片优化脚本支持递归扫描子目录
