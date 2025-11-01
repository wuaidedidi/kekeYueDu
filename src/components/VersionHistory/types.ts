// 版本历史相关类型定义

export interface ChapterVersion {
  id: number
  chapterId: number
  versionSeq: number
  wordCount: number
  isSnapshot: boolean
  source: 'auto' | 'manual' | 'revert'
  label?: string | null
  isPinned: boolean
  createdAt: string
  authorId: number
}

export interface VersionStats {
  insertions: number
  deletions: number
}

export interface DiffItem {
  type: 'equal' | 'insert' | 'delete'
  value: string
}

export interface VersionDiff {
  baseVersionId: number
  compareVersionId: number | 'current'
  stats: VersionStats
  diffs: DiffItem[]
}

export interface VersionListResponse {
  success: boolean
  data: {
    versions: ChapterVersion[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface CreateVersionRequest {
  content_html: string
  source?: 'auto' | 'manual' | 'revert'
  label?: string | null
  is_snapshot?: boolean
}

export interface CreateVersionResponse {
  success: boolean
  message: string
  data: {
    id: number
    chapterId: number
    versionSeq: number
    contentHtml: string
    contentText: string
    wordCount: number
    isSnapshot: boolean
    source: string
    label?: string | null
    isPinned: boolean
    createdAt: string
  }
}

export interface RevertVersionRequest {
  toVersionId: number
  label?: string
}

export interface RevertVersionResponse {
  success: boolean
  message: string
  data: {
    chapterId: number
    revertedToVersionId: number
    newVersionId: number
    content: string
  }
}

export interface PinVersionRequest {
  pinned: boolean
}

export interface PinVersionResponse {
  success: boolean
  message: string
  data: {
    id: number
    chapterId: number
    isPinned: boolean
  }
}

// 版本过滤器类型
export interface VersionFilters {
  source: string
  type: string
  pinnedOnly: boolean
}

// 版本操作类型
export type VersionAction = 'pin' | 'download' | 'delete' | 'view' | 'compare' | 'revert'