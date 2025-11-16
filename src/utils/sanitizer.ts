import DOMPurify from 'dompurify'

// 确保DOMPurify已加载
if (!DOMPurify) {
  throw new Error('DOMPurify is not available')
}

/**
 * HTML内容安全处理工具
 */
export class Sanitizer {
  private static defaultConfig: DOMPurify.Config = {
    // 允许的标签
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'del',
      'ins',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'a',
      'img',
      'div',
      'span',
      'hr',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'sup',
      'sub',
    ],

    // 允许的属性
    ALLOWED_ATTR: [
      'href',
      'title',
      'alt',
      'src',
      'width',
      'height',
      'class',
      'id',
      'style',
      'target',
      'rel',
      'data-*',
    ],

    // 允许的URL协议
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

    // 强制HTTPS协议
    FORCE_BODY: true,

    // 移除不安全的HTML
    REMOVE_HTML_COMMENTS: true,

    // 保持空白字符
    KEEP_CONTENT: true,

    // 自定义配置
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
  }

  /**
   * 清理HTML内容
   */
  static sanitize(dirty: string, config?: Partial<DOMPurify.Config>): string {
    if (!dirty || typeof dirty !== 'string') {
      return ''
    }

    const finalConfig = {
      ...this.defaultConfig,
      ...config,
    }

    return DOMPurify.sanitize(dirty, finalConfig)
  }

  /**
   * 为预览模式清理HTML
   */
  static sanitizeForPreview(dirty: string): string {
    return this.sanitize(dirty, {
      ALLOWED_TAGS: [
        ...this.defaultConfig.ALLOWED_TAGS,
        'mark',
        'kbd',
        'samp',
        'var',
      ],
      ALLOWED_ATTR: [
        ...this.defaultConfig.ALLOWED_ATTR,
        'data-line-number',
        'data-word-count',
      ],
    })
  }

  /**
   * 为导出模式清理HTML
   */
  static sanitizeForExport(dirty: string): string {
    return this.sanitize(dirty, {
      ALLOWED_TAGS: [
        ...this.defaultConfig.ALLOWED_TAGS,
        'meta',
        'title',
        'link',
        'style',
      ],
      ALLOWED_ATTR: [
        ...this.defaultConfig.ALLOWED_ATTR,
        'charset',
        'name',
        'content',
        'rel',
        'type',
        'media',
      ],
      // 允许内联样式用于导出
      ALLOWED_STYLES: [
        'color',
        'background-color',
        'font-size',
        'font-weight',
        'text-align',
        'margin',
        'padding',
        'border',
        'line-height',
        'width',
        'height',
        'display',
        'position',
        'text-decoration',
      ],
    })
  }

  /**
   * 清理用户输入的纯文本
   */
  static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return ''
    }

    // 转义HTML特殊字符
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * 清理Markdown转换为HTML后的内容
   */
  static sanitizeMarkdown(html: string): string {
    return this.sanitize(html, {
      ALLOWED_TAGS: [
        ...this.defaultConfig.ALLOWED_TAGS,
        'mark',
        'kbd',
        'samp',
        'var',
        'abbr',
        'cite',
        'dfn',
      ],
      ALLOWED_ATTR: [
        ...this.defaultConfig.ALLOWED_ATTR,
        'data-footnote-ref',
        'data-footnote-id',
      ],
    })
  }

  /**
   * 添加自定义钩子函数
   */
  static addHook(
    name: 'uponSanitizeAttribute' | 'uponSanitizeElement',
    hook: DOMPurify.Hook
  ): void {
    DOMPurify.addHook(name, hook)
  }

  /**
   * 移除钩子函数
   */
  static removeHook(
    name: 'uponSanitizeAttribute' | 'uponSanitizeElement',
    hook: DOMPurify.Hook
  ): void {
    DOMPurify.removeHook(name, hook)
  }

  /**
   * 初始化全局安全配置
   */
  static initialize(): void {
    // 添加自定义安全检查
    this.addHook('uponSanitizeAttribute', (node, data, config) => {
      // 检查src属性的安全性
      if (data.attrName === 'src') {
        const src = data.attrValue
        if (
          src &&
          !src.startsWith('data:') &&
          !src.startsWith('http://') &&
          !src.startsWith('https://')
        ) {
          // 阻止非安全的URL
          data.keepAttr = false
        }
      }

      // 检查href属性的安全性
      if (data.attrName === 'href') {
        const href = data.attrValue
        if (href && href.startsWith('javascript:')) {
          // 阻止JavaScript协议
          data.keepAttr = false
        }
      }

      // 检查style属性的安全性
      if (data.attrName === 'style') {
        // 可以在这里添加更严格的样式检查
        const dangerousStyles = [
          'position: fixed',
          'position: absolute',
          'z-index',
        ]
        if (dangerousStyles.some((style) => data.attrValue.includes(style))) {
          // 过滤危险的样式
          data.attrValue = data.attrValue
            .replace(/position\s*:\s*(fixed|absolute)/gi, 'position: relative')
            .replace(/z-index\s*:\s*\d+/gi, '')
        }
      }
    })

    // 添加元素检查
    this.addHook('uponSanitizeElement', (node, data, config) => {
      // 可以在这里添加额外的元素检查
      if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
        // 对于预览模式，允许一些安全的样式
        if (node.nodeName === 'STYLE' && node.textContent) {
          // 检查样式内容是否安全
          const dangerousCSS = ['position: fixed', 'position: absolute']
          const hasDangerousCSS = dangerousCSS.some((css) =>
            node.textContent!.includes(css)
          )
          if (hasDangerousCSS) {
            // 过滤危险样式
            node.textContent = node.textContent!.replace(
              /position\s*:\s*(fixed|absolute)/gi,
              'position: relative'
            )
          }
        }
      }
    })
  }
}

// 初始化安全配置
Sanitizer.initialize()

// 导出便捷方法
export const sanitizeHTML = (
  dirty: string,
  config?: Partial<DOMPurify.Config>
) => Sanitizer.sanitize(dirty, config)
export const sanitizeText = (text: string) => Sanitizer.sanitizeText(text)
export const sanitizeForPreview = (dirty: string) =>
  Sanitizer.sanitizeForPreview(dirty)
export const sanitizeForExport = (dirty: string) =>
  Sanitizer.sanitizeForExport(dirty)
export const sanitizeMarkdown = (html: string) =>
  Sanitizer.sanitizeMarkdown(html)

// 统一的HTML安全渲染方法
export const sanitizeHtml = (
  dirty: string,
  context: 'preview' | 'export' | 'general' = 'general'
): string => {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }

  switch (context) {
    case 'preview':
      return sanitizeForPreview(dirty)
    case 'export':
      return sanitizeForExport(dirty)
    case 'general':
    default:
      return sanitizeHTML(dirty)
  }
}

// 验证HTML安全性
export const validateHtmlSafety = (
  html: string
): { isSafe: boolean; warnings: string[] } => {
  const warnings: string[] = []
  let isSafe = true

  // 检查危险标签
  const dangerousTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'textarea',
  ]
  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}[^>]*>`, 'gi')
    if (regex.test(html)) {
      warnings.push(`检测到危险标签: <${tag}>`)
      isSafe = false
    }
  })

  // 检查危险属性
  const dangerousAttrs = [
    'onclick',
    'onload',
    'onerror',
    'onmouseover',
    'javascript:',
    'data:text/html',
  ]
  dangerousAttrs.forEach((attr) => {
    if (html.toLowerCase().includes(attr.toLowerCase())) {
      warnings.push(`检测到危险属性: ${attr}`)
      isSafe = false
    }
  })

  return { isSafe, warnings }
}
