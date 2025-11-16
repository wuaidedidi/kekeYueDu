// src/models/Version.ts
import connectDB from '../config/db.js'
import type { Database } from 'sqlite'

interface ChapterVersion {
  id: number
  chapterId: number
  versionSeq: number
  contentHtml: string
  contentText: string
  wordCount: number
  isSnapshot: boolean
  source: 'auto' | 'manual' | 'revert'
  label?: string | null
  isPinned: boolean
  createdAt: string
  authorId: number
}

// 初始化版本表
const initVersionTable = async (db: Database) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS chapter_versions (
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
    CREATE INDEX IF NOT EXISTS idx_chapter_versions_chapter_id ON chapter_versions(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_chapter_versions_created_at ON chapter_versions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chapter_versions_is_pinned ON chapter_versions(is_pinned);
  `)
}

// 主函数
const createVersionTable = async () => {
  const db = await connectDB()

  // 检查版本表是否存在
  const result = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='chapter_versions'"
  )

  if (!result) {
    // 表不存在，初始化
    await initVersionTable(db)
    console.log('版本表已初始化')
  } else {
    console.log('版本表已存在')
  }

  await db.close()
}

// 创建新版本
const createVersion = async (
  chapterId: number,
  contentHtml: string,
  source: 'auto' | 'manual' | 'revert' = 'manual',
  label?: string | null,
  isSnapshot: boolean = false,
  authorId: number = 1
): Promise<ChapterVersion> => {
  const db = await connectDB()

  // 获取当前章节的最新版本号
  const latestVersion = await db.get(
    'SELECT MAX(version_seq) as max_seq FROM chapter_versions WHERE chapter_id = ?',
    [chapterId]
  )
  const newVersionSeq = (latestVersion?.max_seq || 0) + 1

  // 提取纯文本内容
  const contentText = contentHtml
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()

  // 计算字数统计（中文字符和英文单词）
  const chineseChars = (contentText.match(/[\u4e00-\u9fff]/g) || []).length
  const englishWords = (contentText.match(/[a-zA-Z]+/g) || []).length
  const wordCount = chineseChars + englishWords

  const result = await db.run(
    `INSERT INTO chapter_versions (
      chapter_id, version_seq, content_html, content_text,
      word_count, is_snapshot, source, label, is_pinned, author_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      chapterId,
      newVersionSeq,
      contentHtml,
      contentText,
      wordCount,
      isSnapshot ? 1 : 0,
      source,
      label || null,
      false, // 默认不置顶
      authorId,
    ]
  )

  // 获取创建的版本信息
  const version = await db.get('SELECT * FROM chapter_versions WHERE id = ?', [result.lastID])
  await db.close()

  return {
    id: version.id,
    chapterId: version.chapter_id,
    versionSeq: version.version_seq,
    contentHtml: version.content_html,
    contentText: version.content_text,
    wordCount: version.word_count,
    isSnapshot: Boolean(version.is_snapshot),
    source: version.source as 'auto' | 'manual' | 'revert',
    label: version.label,
    isPinned: Boolean(version.is_pinned),
    createdAt: version.created_at,
    authorId: version.author_id,
  }
}

// 获取章节版本列表
const getChapterVersions = async (
  chapterId: number,
  page: number = 1,
  limit: number = 20,
  source?: string
): Promise<{ versions: ChapterVersion[]; total: number }> => {
  const db = await connectDB()
  const offset = (page - 1) * limit

  let whereClause = 'WHERE chapter_id = ?'
  let params: any[] = [chapterId]

  if (source) {
    whereClause += ' AND source = ?'
    params.push(source)
  }

  // 获取总数量
  const totalResult = await db.get(
    `SELECT COUNT(*) as total FROM chapter_versions ${whereClause}`,
    params
  )
  const total = totalResult.total

  // 获取版本列表
  const versions = await db.all(
    `SELECT
      id, chapter_id, version_seq, content_html, content_text,
      word_count, is_snapshot, source, label, is_pinned,
      created_at, author_id
    FROM chapter_versions
    ${whereClause}
    ORDER BY is_pinned DESC, version_seq DESC
    LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  await db.close()

  return {
    versions: versions.map(v => ({
      id: v.id,
      chapterId: v.chapter_id,
      versionSeq: v.version_seq,
      contentHtml: v.content_html,
      contentText: v.content_text,
      wordCount: v.word_count,
      isSnapshot: Boolean(v.is_snapshot),
      source: v.source as 'auto' | 'manual' | 'revert',
      label: v.label,
      isPinned: Boolean(v.is_pinned),
      createdAt: v.created_at,
      authorId: v.author_id,
    })),
    total,
  }
}

// 切换版本置顶状态
const togglePinVersion = async (
  chapterId: number,
  versionId: number,
  pinned: boolean
): Promise<ChapterVersion> => {
  const db = await connectDB()

  await db.run(
    'UPDATE chapter_versions SET is_pinned = ? WHERE id = ? AND chapter_id = ?',
    [pinned ? 1 : 0, versionId, chapterId]
  )

  const version = await db.get(
    'SELECT * FROM chapter_versions WHERE id = ? AND chapter_id = ?',
    [versionId, chapterId]
  )

  await db.close()

  if (!version) {
    throw new Error('版本不存在')
  }

  return {
    id: version.id,
    chapterId: version.chapter_id,
    versionSeq: version.version_seq,
    contentHtml: version.content_html,
    contentText: version.content_text,
    wordCount: version.word_count,
    isSnapshot: Boolean(version.is_snapshot),
    source: version.source as 'auto' | 'manual' | 'revert',
    label: version.label,
    isPinned: Boolean(version.is_pinned),
    createdAt: version.created_at,
    authorId: version.author_id,
  }
}

// 删除版本
const deleteVersion = async (chapterId: number, versionId: number): Promise<void> => {
  const db = await connectDB()

  const result = await db.run(
    'DELETE FROM chapter_versions WHERE id = ? AND chapter_id = ?',
    [versionId, chapterId]
  )

  await db.close()

  if (result.changes === 0) {
    throw new Error('版本不存在或无权限删除')
  }
}

// 获取指定版本
const getVersion = async (chapterId: number, versionId: number): Promise<ChapterVersion | null> => {
  const db = await connectDB()

  const version = await db.get(
    'SELECT * FROM chapter_versions WHERE id = ? AND chapter_id = ?',
    [versionId, chapterId]
  )

  await db.close()

  if (!version) {
    return null
  }

  return {
    id: version.id,
    chapterId: version.chapter_id,
    versionSeq: version.version_seq,
    contentHtml: version.content_html,
    contentText: version.content_text,
    wordCount: version.word_count,
    isSnapshot: Boolean(version.is_snapshot),
    source: version.source as 'auto' | 'manual' | 'revert',
    label: version.label,
    isPinned: Boolean(version.is_pinned),
    createdAt: version.created_at,
    authorId: version.author_id,
  }
}

// 回退到指定版本
const revertToVersion = async (
  chapterId: number,
  toVersionId: number,
  authorId: number = 1
): Promise<{ newVersion: ChapterVersion; revertedVersion: ChapterVersion }> => {
  const db = await connectDB()

  // 开始事务
  await db.run('BEGIN TRANSACTION')

  try {
    // 获取目标版本内容
    const targetVersion = await db.get(
      'SELECT * FROM chapter_versions WHERE id = ? AND chapter_id = ?',
      [toVersionId, chapterId]
    )

    if (!targetVersion) {
      throw new Error('目标版本不存在')
    }

    // 更新章节内容
    await db.run(
      'UPDATE Chapters SET content = ? WHERE id = ?',
      [targetVersion.content_html, chapterId]
    )

    // 创建回退版本
    const latestVersionResult = await db.get(
      'SELECT MAX(version_seq) as max_seq FROM chapter_versions WHERE chapter_id = ?',
      [chapterId]
    )
    const newVersionSeq = (latestVersionResult?.max_seq || 0) + 1

    const result = await db.run(
      `INSERT INTO chapter_versions (
        chapter_id, version_seq, content_html, content_text,
        word_count, is_snapshot, source, label, is_pinned, author_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chapterId,
        newVersionSeq,
        targetVersion.content_html,
        targetVersion.content_text,
        targetVersion.word_count,
        false, // 回退版本不是快照
        'revert',
        `回退到版本 ${targetVersion.version_seq}`,
        false,
        authorId,
      ]
    )

    // 获取新创建的版本
    const newVersion = await db.get('SELECT * FROM chapter_versions WHERE id = ?', [result.lastID])

    // 提交事务
    await db.run('COMMIT')

    await db.close()

    return {
      newVersion: {
        id: newVersion.id,
        chapterId: newVersion.chapter_id,
        versionSeq: newVersion.version_seq,
        contentHtml: newVersion.content_html,
        contentText: newVersion.content_text,
        wordCount: newVersion.word_count,
        isSnapshot: Boolean(newVersion.is_snapshot),
        source: newVersion.source as 'auto' | 'manual' | 'revert',
        label: newVersion.label,
        isPinned: Boolean(newVersion.is_pinned),
        createdAt: newVersion.created_at,
        authorId: newVersion.author_id,
      },
      revertedVersion: {
        id: targetVersion.id,
        chapterId: targetVersion.chapter_id,
        versionSeq: targetVersion.version_seq,
        contentHtml: targetVersion.content_html,
        contentText: targetVersion.content_text,
        wordCount: targetVersion.word_count,
        isSnapshot: Boolean(targetVersion.is_snapshot),
        source: targetVersion.source as 'auto' | 'manual' | 'revert',
        label: targetVersion.label,
        isPinned: Boolean(targetVersion.is_pinned),
        createdAt: targetVersion.created_at,
        authorId: targetVersion.author_id,
      },
    }
  } catch (error) {
    // 回滚事务
    await db.run('ROLLBACK')
    await db.close()
    throw error
  }
}

export {
  createVersionTable,
  createVersion,
  getChapterVersions,
  togglePinVersion,
  deleteVersion,
  getVersion,
  revertToVersion,
}