import { describe, it, expect } from 'vitest'
import { sanitizeHtml, validateHtmlSafety } from '../sanitizer'

describe('sanitizeHtml', () => {
  it('应该清理基本的HTML内容', () => {
    const dirtyHtml = '<p>Hello <strong>world</strong>!</p>'
    const clean = sanitizeHtml(dirtyHtml, 'general')
    expect(clean).toBe('<p>Hello <strong>world</strong>!</p>')
  })

  it('应该移除危险的脚本标签', () => {
    const dirtyHtml = '<p>Hello</p><script>alert("xss")</script>'
    const clean = sanitizeHtml(dirtyHtml, 'general')
    expect(clean).toBe('<p>Hello</p>')
    expect(clean).not.toContain('<script>')
  })

  it('应该移除危险的onclick属性', () => {
    const dirtyHtml = '<p onclick="alert(\'xss\')">Click me</p>'
    const clean = sanitizeHtml(dirtyHtml, 'general')
    expect(clean).toBe('<p>Click me</p>')
    expect(clean).not.toContain('onclick')
  })

  it('应该处理预览模式的内容', () => {
    const html = '<h1>Title</h1><p>Content</p>'
    const clean = sanitizeHtml(html, 'preview')
    expect(clean).toContain('<h1')
    expect(clean).toContain('<p')
  })

  it('应该处理导出模式的内容', () => {
    const html = '<h1>Title</h1><style>body { color: red; }</style>'
    const clean = sanitizeHtml(html, 'export')
    expect(clean).toContain('<h1')
    expect(clean).toContain('<style')
  })

  it('应该处理空内容', () => {
    expect(sanitizeHtml('', 'general')).toBe('')
    expect(sanitizeHtml(null as any, 'general')).toBe('')
    expect(sanitizeHtml(undefined as any, 'general')).toBe('')
  })
})

describe('validateHtmlSafety', () => {
  it('应该检测安全的HTML', () => {
    const safeHtml = '<p>Hello <strong>world</strong>!</p>'
    const result = validateHtmlSafety(safeHtml)
    expect(result.isSafe).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('应该检测危险的脚本标签', () => {
    const dangerousHtml = '<p>Hello</p><script>alert("xss")</script>'
    const result = validateHtmlSafety(dangerousHtml)
    expect(result.isSafe).toBe(false)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('script')
  })

  it('应该检测危险的iframe标签', () => {
    const dangerousHtml = '<iframe src="javascript:alert(\'xss\')"></iframe>'
    const result = validateHtmlSafety(dangerousHtml)
    expect(result.isSafe).toBe(false)
    expect(result.warnings.some((w) => w.includes('iframe'))).toBe(true)
  })

  it('应该检测JavaScript协议', () => {
    const dangerousHtml = '<a href="javascript:alert(\'xss\')">Click</a>'
    const result = validateHtmlSafety(dangerousHtml)
    expect(result.isSafe).toBe(false)
    expect(result.warnings.some((w) => w.includes('javascript:'))).toBe(true)
  })

  it('应该检测危险的事件属性', () => {
    const dangerousHtml = '<img src="image.jpg" onload="alert(\'xss\')" />'
    const result = validateHtmlSafety(dangerousHtml)
    expect(result.isSafe).toBe(false)
    expect(result.warnings.some((w) => w.includes('onload'))).toBe(true)
  })
})
