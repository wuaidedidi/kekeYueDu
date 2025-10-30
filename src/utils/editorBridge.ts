// src/utils/editorBridge.ts
import { nextTick } from 'vue'

/**
 * 防抖工具函数
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流工具函数
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export interface TextPosition {
  line: number
  column: number
  offset: number
}

export interface TextRange {
  start: TextPosition
  end: TextPosition
}

export interface TextStats {
  characterCount: number
  wordCount: number
  paragraphCount: number
  lineCount: number
}

export interface OutlineItem {
  level: number
  text: string
  line: number
  offset: number
}

/**
 * 编辑器桥接工具，提供统一的编辑器操作接口
 */
export class EditorBridge {
  private trixEditor: HTMLElement | null = null
  private trixInstance: any = null

  // 缓存相关
  private cachedContent: string = ''
  private cachedStats: TextStats | null = null
  private cachedOutline: OutlineItem[] = []
  private lastCacheUpdate: number = 0

  // 防抖方法
  private debouncedUpdateStats: () => void
  private debouncedUpdateOutline: () => void
  private throttledCheckContent: () => void

  constructor() {
    this.init()

    // 初始化防抖方法
    this.debouncedUpdateStats = debounce(() => {
      this.updateStatsCache()
    }, 500) // 500ms防抖延迟

    this.debouncedUpdateOutline = debounce(() => {
      this.updateOutlineCache()
    }, 300) // 300ms防抖延迟

    this.throttledCheckContent = throttle(() => {
      this.checkContentChanged()
    }, 200) // 200ms节流限制
  }

  /**
   * 初始化编辑器实例
   */
  init(): void {
    // 等待DOM加载完成
    nextTick(() => {
      this.trixEditor = document.querySelector('trix-editor') as HTMLElement
      if (this.trixEditor) {
        this.trixInstance = (this.trixEditor as any).editor
      }
    })
  }

  /**
   * 检查编辑器是否已准备好
   */
  isReady(): boolean {
    return !!(this.trixEditor && this.trixInstance)
  }

  /**
   * 获取编辑器内容（纯文本）
   */
  getTextContent(): string {
    if (!this.trixInstance) return ''
    return this.trixInstance.getDocument().toString()
  }

  /**
   * 获取编辑器内容（HTML）
   */
  getHTMLContent(): string {
    if (!this.trixEditor) return ''
    return this.trixEditor.innerHTML
  }

  /**
   * 设置编辑器内容
   */
  setContent(content: string, isHTML: boolean = false): void {
    if (!this.trixInstance) return

    if (isHTML) {
      this.trixInstance.loadHTML(content)
    } else {
      this.trixInstance.loadHTML('')
      this.trixInstance.insertString(content)
    }
  }

  /**
   * 获取当前选区
   */
  getSelection(): TextRange | null {
    if (!this.trixInstance) return null

    const range = this.trixInstance.getSelectedRange()
    if (!range) return null

    const document = this.trixInstance.getDocument()
    const text = document.toString()

    return {
      start: this.getRangePosition(range[0], text),
      end: this.getRangePosition(range[1], text)
    }
  }

  /**
   * 设置选区
   */
  setSelection(range: TextRange): void {
    if (!this.trixInstance) return

    const startOffset = this.getOffsetFromPosition(range.start)
    const endOffset = this.getOffsetFromPosition(range.end)

    this.trixInstance.setSelectedRange([startOffset, endOffset])
  }

  /**
   * 选择全部内容
   */
  selectAll(): void {
    if (!this.trixInstance) return

    const document = this.trixInstance.getDocument()
    const length = document.toString().length
    this.trixInstance.setSelectedRange([0, length])
  }

  /**
   * 在当前位置插入文本
   */
  insertText(text: string): void {
    if (!this.trixInstance) return

    this.trixInstance.insertString(text)
  }

  /**
   * 在当前位置插入HTML
   */
  insertHTML(html: string): void {
    if (!this.trixInstance) return

    this.trixInstance.insertHTML(html)
  }

  /**
   * 替换选中的文本
   */
  replaceSelectedText(text: string, isHTML: boolean = false): void {
    if (!this.trixInstance) return

    // 先删除选中文本
    this.trixInstance.deleteInDirection('forward')

    // 插入新内容
    if (isHTML) {
      this.trixInstance.insertHTML(html)
    } else {
      this.trixInstance.insertString(text)
    }
  }

  /**
   * 在指定位置插入文本
   */
  insertTextAt(position: TextPosition, text: string): void {
    const range = { start: position, end: position }
    this.setSelection(range)
    this.insertText(text)
  }

  /**
   * 删除指定范围内的文本
   */
  deleteRange(range: TextRange): void {
    if (!this.trixInstance) return

    this.setSelection(range)
    this.trixInstance.deleteInDirection('forward')
  }

  /**
   * 获取指定位置的文本
   */
  getTextAtPosition(position: TextPosition, length: number = 1): string {
    const text = this.getTextContent()
    const offset = this.getOffsetFromPosition(position)
    return text.substring(offset, offset + length)
  }

  /**
   * 获取指定行号的文本
   */
  getLineText(lineNumber: number): string {
    const lines = this.getTextContent().split('\n')
    return lines[lineNumber - 1] || ''
  }

  /**
   * 滚动到指定位置
   */
  scrollToPosition(position: TextPosition): void {
    if (!this.trixEditor) return

    const offset = this.getOffsetFromPosition(position)
    const range = this.trixInstance.getDocument().getRangeAtOffset(offset)

    if (range && range[1]) {
      const element = range[1]
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  /**
   * 滚动到指定行
   */
  scrollToLine(lineNumber: number): void {
    const position = this.getPositionFromLine(lineNumber)
    if (position) {
      this.scrollToPosition(position)
    }
  }

  /**
   * 高亮指定范围的文本
   */
  highlightRange(range: TextRange, className: string = 'highlighted'): void {
    if (!this.trixInstance) return

    const startOffset = this.getOffsetFromPosition(range.start)
    const endOffset = this.getOffsetFromPosition(range.end)
    const document = this.trixInstance.getDocument()

    // 创建高亮标记
    const markerElement = document.createMarkerElement()
    markerElement.className = className
    markerElement.textContent = this.getTextContent().substring(startOffset, endOffset)

    // 插入标记
    this.trixInstance.insertHTML(markerElement.outerHTML)
  }

  /**
   * 清除所有高亮
   */
  clearHighlights(className: string = 'highlighted'): void {
    if (!this.trixEditor) return

    const highlights = this.trixEditor.querySelectorAll(`.${className}`)
    highlights.forEach(highlight => {
      highlight.remove()
    })
  }

  /**
   * 应用文本样式
   */
  applyTextStyle(style: string): void {
    if (!this.trixInstance) return

    switch (style) {
      case 'bold':
        this.trixInstance.activateAttribute('bold')
        break
      case 'italic':
        this.trixInstance.activateAttribute('italic')
        break
      case 'underline':
        this.trixInstance.activateAttribute('underline')
        break
      case 'strike':
        this.trixInstance.activateAttribute('strike')
        break
      case 'code':
        this.trixInstance.activateAttribute('code')
        break
      default:
        break
    }
  }

  /**
   * 移除文本样式
   */
  removeTextStyle(style: string): void {
    if (!this.trixInstance) return

    switch (style) {
      case 'bold':
        this.trixInstance.deactivateAttribute('bold')
        break
      case 'italic':
        this.trixInstance.deactivateAttribute('italic')
        break
      case 'underline':
        this.trixInstance.deactivateAttribute('underline')
        break
      case 'strike':
        this.trixInstance.deactivateAttribute('strike')
        break
      case 'code':
        this.trixInstance.deactivateAttribute('code')
        break
      default:
        break
    }
  }

  /**
   * 获取文本统计信息（带缓存）
   */
  getTextStats(): TextStats {
    const currentContent = this.getTextContent()

    // 如果内容未变化，返回缓存结果
    if (currentContent === this.cachedContent && this.cachedStats) {
      return this.cachedStats
    }

    // 内容已变化，更新缓存
    this.cachedContent = currentContent
    this.updateStatsCache()

    return this.cachedStats!
  }

  /**
   * 更新统计缓存
   */
  private updateStatsCache(): void {
    const text = this.getTextContent()

    // 字符数（排除空格和换行）
    const characterCount = text.replace(/\s/g, '').length

    // 词数（中英文混合统计）
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
    const englishWords = text.match(/[a-zA-Z]+/g) || []
    const wordCount = chineseChars.length + englishWords.length

    // 段落数
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
    const paragraphCount = paragraphs.length || 1

    // 行数
    const lines = text.split('\n')
    const lineCount = lines.length

    this.cachedStats = {
      characterCount,
      wordCount,
      paragraphCount,
      lineCount
    }
  }

  /**
   * 从内容生成大纲（带缓存）
   */
  generateOutline(): OutlineItem[] {
    const currentContent = this.getHTMLContent()

    // 如果内容未变化，返回缓存结果
    if (currentContent === this.cachedContent && this.cachedOutline.length > 0) {
      return this.cachedOutline
    }

    // 内容已变化，更新缓存
    this.cachedContent = currentContent
    this.updateOutlineCache()

    return this.cachedOutline
  }

  /**
   * 更新大纲缓存
   */
  private updateOutlineCache(): void {
    const html = this.getHTMLContent()
    const outline: OutlineItem[] = []

    // 使用正则表达式提取标题
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi
    let match
    let lineNumber = 1

    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1])
      const text = match[2].replace(/<[^>]*>/g, '').trim()

      // 计算行号
      const beforeText = html.substring(0, match.index)
      lineNumber = beforeText.split('\n').length

      outline.push({
        level,
        text,
        line: lineNumber,
        offset: match.index
      })
    }

    this.cachedOutline = outline
  }

  /**
   * 检查内容是否变化
   */
  private checkContentChanged(): void {
    const currentContent = this.getTextContent()
    if (currentContent !== this.cachedContent) {
      // 内容变化，清理缓存
      this.cachedContent = currentContent
      this.lastCacheUpdate = Date.now()

      // 防抖更新缓存
      this.debouncedUpdateStats()
      this.debouncedUpdateOutline()
    }
  }

  /**
   * 手动触发内容变化检查
   */
  contentChanged(): void {
    this.throttledCheckContent()
  }

  /**
   * 查找文本在文档中的位置
   */
  findText(searchText: string, caseSensitive: boolean = false): TextPosition | null {
    const text = caseSensitive ? this.getTextContent() : this.getTextContent().toLowerCase()
    const search = caseSensitive ? searchText : searchText.toLowerCase()
    const index = text.indexOf(search)

    if (index === -1) return null

    return this.getPositionFromOffset(index)
  }

  /**
   * 查找所有匹配的文本位置
   */
  findAllText(searchText: string, caseSensitive: boolean = false): TextPosition[] {
    const text = caseSensitive ? this.getTextContent() : this.getTextContent().toLowerCase()
    const search = caseSensitive ? searchText : searchText.toLowerCase()
    const positions: TextPosition[] = []
    let index = 0

    while ((index = text.indexOf(search, index)) !== -1) {
      const position = this.getPositionFromOffset(index)
      if (position) {
        positions.push(position)
      }
      index += search.length
    }

    return positions
  }

  // 私有辅助方法

  private getRangePosition(offset: number, text: string): TextPosition {
    const beforeText = text.substring(0, offset)
    const lines = beforeText.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length + 1

    return { line, column, offset }
  }

  private getOffsetFromPosition(position: TextPosition): number {
    const text = this.getTextContent()
    let offset = 0

    for (let i = 1; i < position.line; i++) {
      const lineIndex = text.indexOf('\n', offset)
      if (lineIndex === -1) break
      offset = lineIndex + 1
    }

    return offset + position.column - 1
  }

  private getPositionFromOffset(offset: number): TextPosition | null {
    const text = this.getTextContent()
    if (offset < 0 || offset > text.length) return null

    return this.getRangePosition(offset, text)
  }

  private getPositionFromLine(lineNumber: number): TextPosition | null {
    const text = this.getTextContent()
    let offset = 0

    for (let i = 1; i < lineNumber; i++) {
      const lineIndex = text.indexOf('\n', offset)
      if (lineIndex === -1) return null
      offset = lineIndex + 1
    }

    return { line: lineNumber, column: 1, offset }
  }
}

// 创建全局实例
export const editorBridge = new EditorBridge()

// 导出类型
export type { TextPosition, TextRange, TextStats, OutlineItem }