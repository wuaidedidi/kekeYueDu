import connectDB from '../.tmp/server/server/config/db.js'

async function resetDatabase() {
  const db = await connectDB()

  try {
    console.log('正在重置数据库...')

    // 删除版本表
    await db.run('DROP TABLE IF EXISTS chapter_versions')
    console.log('已删除 chapter_versions 表')

    // 重新创建版本表
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

      -- 创建索引
      CREATE INDEX idx_chapter_versions_chapter_id ON chapter_versions(chapter_id);
      CREATE INDEX idx_chapter_versions_created_at ON chapter_versions(created_at DESC);
      CREATE INDEX idx_chapter_versions_is_pinned ON chapter_versions(is_pinned);
    `)
    console.log('已重新创建 chapter_versions 表，包含正确的 word_count 列')

    // 验证表结构
    const columns = await db.all('PRAGMA table_info(chapter_versions)')
    console.log('新表结构:')
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (NOT NULL: ${col.notnull})`)
    })

  } catch (error) {
    console.error('重置数据库失败:', error)
  } finally {
    await db.close()
    console.log('数据库重置完成')
  }
}

resetDatabase()