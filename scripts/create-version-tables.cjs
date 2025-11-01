/**
 * 历史版本管理功能 - 数据库迁移脚本
 * 创建 chapter_versions 表和相关索引
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('开始创建历史版本管理相关表...');

// 创建 chapter_versions 表
const createChapterVersionsTable = `
  CREATE TABLE IF NOT EXISTS chapter_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    version_seq INTEGER NOT NULL,
    content_html TEXT NOT NULL,
    content_text TEXT NOT NULL,
    is_snapshot BOOLEAN DEFAULT FALSE,
    base_version_id INTEGER,
    diff_json TEXT,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    pinned BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (chapter_id) REFERENCES chapters (id) ON DELETE CASCADE,
    FOREIGN KEY (base_version_id) REFERENCES chapter_versions (id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL,
    UNIQUE(chapter_id, version_seq)
  );
`;

// 为 chapters 表添加 current_version_id 字段
const addCurrentVersionIdColumn = `
  ALTER TABLE chapters ADD COLUMN current_version_id INTEGER DEFAULT NULL;
`;

// 创建索引
const createIndexes = [
  // (chapter_id, created_at DESC) 索引 - 用于按时间顺序查询版本历史
  `CREATE INDEX IF NOT EXISTS idx_chapter_versions_chapter_created ON chapter_versions(chapter_id, created_at DESC);`,

  // (chapter_id, version_seq) 索引 - 用于按版本号查询
  `CREATE INDEX IF NOT EXISTS idx_chapter_versions_chapter_seq ON chapter_versions(chapter_id, version_seq);`,

  // (base_version_id) 索引 - 用于查找基于某个版本的所有增量版本
  `CREATE INDEX IF NOT EXISTS idx_chapter_versions_base_version ON chapter_versions(base_version_id);`,

  // (pinned, created_at) 索引 - 用于查找置顶版本
  `CREATE INDEX IF NOT EXISTS idx_chapter_versions_pinned ON chapter_versions(pinned, created_at DESC);`,

  // (author_id, created_at) 索引 - 用于按作者查询版本历史
  `CREATE INDEX IF NOT EXISTS idx_chapter_versions_author ON chapter_versions(author_id, created_at DESC);`,

  // chapters 表的 current_version_id 索引
  `CREATE INDEX IF NOT EXISTS idx_chapters_current_version ON chapters(current_version_id);`
];

db.serialize(() => {
  // 创建 chapter_versions 表
  db.run(createChapterVersionsTable, (err) => {
    if (err) {
      console.error('创建 chapter_versions 表失败:', err);
      process.exit(1);
    }
    console.log('✅ chapter_versions 表创建成功');
  });

  // 为 chapters 表添加 current_version_id 字段（如果不存在）
  db.all("PRAGMA table_info(chapters);", (err, rows) => {
    if (err) {
      console.error('查询 chapters 表结构失败:', err);
      return;
    }

    const hasCurrentVersionId = rows && rows.some(column => column.name === 'current_version_id');

    if (!hasCurrentVersionId) {
      db.run(addCurrentVersionIdColumn, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('添加 current_version_id 字段失败:', err);
          return;
        }
        console.log('✅ current_version_id 字段添加成功');
      });
    } else {
      console.log('✅ current_version_id 字段已存在');
    }
  });

  // 创建所有索引
  createIndexes.forEach((indexSql, index) => {
    db.run(indexSql, (err) => {
      if (err) {
        console.error(`创建索引 ${index + 1} 失败:`, err);
        return;
      }
      console.log(`✅ 索引 ${index + 1} 创建成功`);
    });
  });
});

// 关闭数据库连接
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接失败:', err);
      process.exit(1);
    }
    console.log('🎉 历史版本管理数据表创建完成！');
    process.exit(0);
  });
}, 2000);