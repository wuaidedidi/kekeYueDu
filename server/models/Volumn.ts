// src/models/User.ts
import connectDB from '../config/db.js'
import type { Database } from 'sqlite'

// 初始化草稿表
const initVolumeTable = async (db: Database) => {
  // 创建 Volumes 表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Volumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      \`order\` INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES drafts(id) ON DELETE CASCADE
    );
  `)
  // 插入默认数据
  const volumes = [
    { book_id: 1, title: '第一卷', order: 1 },
    { book_id: 1, title: '第二卷', order: 2 },
  ]
  // 插入默认卷
  for (const volume of volumes) {
    await db.run(
      'INSERT INTO Volumes (book_id, title, `order`) VALUES (?, ?, ?)',
      [volume.book_id, volume.title, volume.order]
    )
  }
}

// 主函数
const createVolumeTable = async () => {
  const db = await connectDB()

  // 检查草稿表是否存在
  const result = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='Volumes'"
  )

  if (!result) {
    // 表不存在，初始化
    await initVolumeTable(db)
    console.log('卷表已初始化并插入数据')
  } else {
    console.log('卷表已存在')
  }

  await db.close()
}

const saveVolume = async (title: string, order: number, bookId: number) => {
  const db = await connectDB()

  // 检查草稿表是否存在
  // console.log(id + '=========' + content)
  const result = await db.run(
    `
      INSERT INTO Volumes  (title,\`order\`,book_id) 
      VALUES (?, ?,?) 
      `,
    [title, order, bookId]
  )

  await db.close()

  return result
}

// 主函数
const getVolume = async (vid: number) => {
  const db = await connectDB()

  // 检查草稿表是否存在
  const result = db.get('SELECT * FROM Volumes WHERE id = ?', [vid])

  if (result) {
    // 表不存在，初始化
    return result
  } else {
    console.log('卷表已存在')
  }

  await db.close()
}

export { createVolumeTable, saveVolume, getVolume }
