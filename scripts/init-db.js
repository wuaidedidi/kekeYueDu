const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, '..', 'database.sqlite')

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message)
    process.exit(1)
  }
  console.log('已连接到 SQLite 数据库')
})

// 创建表
db.serialize(() => {
  // 创建用户表
  db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error('创建用户表失败:', err.message)
      } else {
        console.log('用户表创建成功或已存在')
      }
    }
  )

  // 创建卷表
  db.run(
    `
    CREATE TABLE IF NOT EXISTS volumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `,
    (err) => {
      if (err) {
        console.error('创建卷表失败:', err.message)
      } else {
        console.log('卷表创建成功或已存在')
      }
    }
  )

  // 创建草稿表
  db.run(
    `
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      volume_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      word_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (volume_id) REFERENCES volumes (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `,
    (err) => {
      if (err) {
        console.error('创建草稿表失败:', err.message)
      } else {
        console.log('草稿表创建成功或已存在')
      }
    }
  )

  // 创建角色表
  db.run(
    `
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      aliases TEXT, -- JSON array of aliases
      description TEXT,
      tags TEXT, -- JSON array of tags
      avatar TEXT,
      user_id INTEGER NOT NULL,
      draft_id INTEGER,
      first_appearance INTEGER, -- Line number where character first appears
      mentions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (draft_id) REFERENCES drafts (id) ON DELETE SET NULL
    )
  `,
    (err) => {
      if (err) {
        console.error('创建角色表失败:', err.message)
      } else {
        console.log('角色表创建成功或已存在')
      }
    }
  )

  // 创建设定表
  db.run(
    `
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT, -- e.g., '世界观', '设定', '笔记' etc.
      tags TEXT, -- JSON array of tags
      user_id INTEGER NOT NULL,
      draft_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (draft_id) REFERENCES drafts (id) ON DELETE SET NULL
    )
  `,
    (err) => {
      if (err) {
        console.error('创建设定表失败:', err.message)
      } else {
        console.log('设定表创建成功或已存在')
      }
    }
  )
})

// 关闭数据库连接
db.close((err) => {
  if (err) {
    console.error('关闭数据库失败:', err.message)
  } else {
    console.log('数据库连接已关闭')
    console.log('数据库初始化完成！')
  }
})
