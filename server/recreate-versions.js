import connectDB from '../.tmp/server/server/config/db.js'

async function recreateVersionTable() {
  const db = await connectDB()

  try {
    // 先检查现有表结构
    try {
      const columns = await db.all('PRAGMA table_info(chapter_versions)')
      console.log('当前表结构:', columns)
    } catch (e) {
      console.log('表不存在，将创建新表')
    }

    // 删除现有表
    await db.run('DROP TABLE IF EXISTS chapter_versions')
    console.log('已删除现有的 chapter_versions 表')

    // 创建新表
    await db.exec(`
      CREATE TABLE chapter_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapter_id INTEGER NOT NULL,
        version_seq INTEGER NOT NULL,
        content_html TEXT NOT NULL,
        content_text TEXT NOT NULL,
        word_count INTEGER NOT NULL DEFAULT 0,
        is_snapshot BOOLEAN NOT NULL DEFAULT 0,
        source TEXT NOT NULL DEFAULT 'manual',
        label TEXT,
        is_pinned BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        author_id INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (chapter_id) REFERENCES Chapters(id) ON DELETE CASCADE
      );

      -- 创建索引以提高查询性能
      CREATE INDEX idx_chapter_versions_chapter_id ON chapter_versions(chapter_id);
      CREATE INDEX idx_chapter_versions_created_at ON chapter_versions(created_at DESC);
      CREATE INDEX idx_chapter_versions_is_pinned ON chapter_versions(is_pinned);
    `)

    console.log('已成功创建新的 chapter_versions 表')
  } catch (error) {
    console.error('重建表失败:', error)
  } finally {
    await db.close()
  }
}

recreateVersionTable()