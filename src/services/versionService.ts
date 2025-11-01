import http from '@/utils/http'
import type {
  ChapterVersion,
  VersionDiff,
  CreateVersionRequest,
  CreateVersionResponse,
  RevertVersionRequest,
  RevertVersionResponse,
  PinVersionResponse,
  VersionListResponse
} from '@/components/VersionHistory/types'

/**
 * 版本管理服务
 */
export class VersionService {
  /**
   * 创建新版本
   */
  static async createVersion(chapterId: number, data: CreateVersionRequest): Promise<CreateVersionResponse> {
    const response = await http.post(`/chapters/${chapterId}/versions`, data)
    return response.data
  }

  /**
   * 获取章节版本列表
   */
  static async getVersionList(
    chapterId: number,
    params: {
      page?: number
      limit?: number
      source?: string
    } = {}
  ): Promise<VersionListResponse> {
    const response = await http.get(`/chapters/${chapterId}/versions`, { params })
    return response.data
  }

  /**
   * 计算版本差异
   */
  static async getVersionDiff(
    chapterId: number,
    params: {
      baseVersionId: number
      compareVersionId?: number | 'current'
      format?: 'json' | 'html'
    }
  ): Promise<{ success: boolean; data: VersionDiff }> {
    const response = await http.get(`/chapters/${chapterId}/diff`, { params })
    return response.data
  }

  /**
   * 回退到指定版本
   */
  static async revertToVersion(
    chapterId: number,
    data: RevertVersionRequest
  ): Promise<RevertVersionResponse> {
    const response = await http.post(`/chapters/${chapterId}/revert`, data)
    return response.data
  }

  /**
   * 置顶/取消置顶版本
   */
  static async togglePinVersion(
    chapterId: number,
    versionId: number,
    pinned: boolean
  ): Promise<PinVersionResponse> {
    const response = await http.post(`/chapters/${chapterId}/versions/${versionId}/pin`, { pinned })
    return response.data
  }

  /**
   * 删除版本
   */
  static async deleteVersion(chapterId: number, versionId: number): Promise<{ success: boolean; message: string }> {
    const response = await http.delete(`/chapters/${chapterId}/versions/${versionId}`)
    return response.data
  }

  /**
   * 自动创建版本（防抖处理）
   */
  private static autoSaveTimeout: NodeJS.Timeout | null = null
  private static pendingAutoSave: Map<number, CreateVersionRequest> = new Map()

  static scheduleAutoSave(chapterId: number, data: CreateVersionRequest, delay = 30000): void {
    // 清除之前的定时器
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout)
    }

    // 存储待保存的数据
    this.pendingAutoSave.set(chapterId, {
      ...data,
      source: 'auto',
      is_snapshot: false
    })

    // 设置新的定时器
    this.autoSaveTimeout = setTimeout(async () => {
      const pendingData = this.pendingAutoSave.get(chapterId)
      if (pendingData) {
        try {
          const resp = await this.createVersion(chapterId, pendingData)
          console.log(`自动保存版本成功，章节ID: ${chapterId}`)
          this.pendingAutoSave.delete(chapterId)

          // 广播版本创建事件，便于界面刷新与状态更新
          try {
            const eventDetail = {
              chapterId,
              newVersionId: resp?.data?.id,
              versionSeq: resp?.data?.versionSeq,
              createdAt: resp?.data?.createdAt,
              source: resp?.data?.source,
            }
            window.dispatchEvent(new CustomEvent('versionCreated', { detail: eventDetail }))
          } catch (e) {
            // 事件派发失败不影响正常流程
            console.warn('派发版本创建事件失败:', e)
          }
        } catch (error) {
          console.error('自动保存版本失败:', error)
        }
      }
    }, delay)
  }

  /**
   * 立即执行待保存的版本
   */
  static async flushAutoSave(chapterId: number): Promise<void> {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout)
      this.autoSaveTimeout = null
    }

    const pendingData = this.pendingAutoSave.get(chapterId)
    if (pendingData && pendingData.content_html && pendingData.content_html.trim()) {
      try {
        const resp = await this.createVersion(chapterId, pendingData)
        this.pendingAutoSave.delete(chapterId)

        // 同步广播版本创建事件
        try {
          const eventDetail = {
            chapterId,
            newVersionId: resp?.data?.id,
            versionSeq: resp?.data?.versionSeq,
            createdAt: resp?.data?.createdAt,
            source: resp?.data?.source,
          }
          window.dispatchEvent(new CustomEvent('versionCreated', { detail: eventDetail }))
        } catch (e) {
          console.warn('派发版本创建事件失败:', e)
        }
      } catch (error) {
        console.error('立即保存版本失败:', error)
        throw error
      }
    }
  }

  /**
   * 清除待保存的版本
   */
  static clearAutoSave(chapterId: number): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout)
      this.autoSaveTimeout = null
    }
    this.pendingAutoSave.delete(chapterId)
  }

  /**
   * 检查是否有待保存的版本
   */
  static hasPendingAutoSave(chapterId: number): boolean {
    return this.pendingAutoSave.has(chapterId)
  }
}

/**
 * 版本比较工具类
 */
export class VersionDiffUtils {
  /**
   * 格式化差异显示
   */
  static formatDiffForDisplay(diff: VersionDiff): string {
    const { diffs } = diff
    return diffs.map(item => {
      const prefix = item.type === 'insert' ? '+' : item.type === 'delete' ? '-' : ' '
      return `${prefix}${item.value}`
    }).join('\n')
  }

  /**
   * 获取差异统计摘要
   */
  static getDiffSummary(stats: { insertions: number; deletions: number }): string {
    const { insertions, deletions } = stats
    const net = insertions - deletions

    let summary = `新增 ${insertions} 字，删除 ${deletions} 字`
    if (net !== 0) {
      summary += `，净变化 ${net > 0 ? '+' : ''}${net} 字`
    }

    return summary
  }

  /**
   * 判断差异是否显著
   */
  static isSignificantChange(stats: { insertions: number; deletions: number }, threshold = 50): boolean {
    return stats.insertions > threshold || stats.deletions > threshold
  }
}

/**
 * 版本管理工具类
 */
export class VersionUtils {
  /**
   * 生成版本标签
   */
  static generateVersionLabel(source: string, customLabel?: string): string {
    if (customLabel) return customLabel

    const labels: Record<string, string> = {
      auto: '自动保存',
      manual: '手动创建',
      revert: '回退版本'
    }

    return labels[source] || '版本更新'
  }

  /**
   * 格式化版本号显示
   */
  static formatVersionNumber(versionSeq: number): string {
    return `v${versionSeq}`
  }

  /**
   * 判断是否应该创建快照
   */
  static shouldCreateSnapshot(versionSeq: number, isManual = false): boolean {
    return isManual || versionSeq % 10 === 0
  }

  /**
   * 计算文本统计信息
   */
  static calculateTextStats(html: string): { wordCount: number; charCount: number; paragraphCount: number } {
    // 提取纯文本
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

    // 字数统计（中文字符和英文单词）
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const wordCount = chineseChars + englishWords

    // 字符数统计
    const charCount = text.length

    // 段落数统计
    const paragraphCount = text.split(/\n\n+/).filter(p => p.trim()).length

    return {
      wordCount,
      charCount,
      paragraphCount
    }
  }
}