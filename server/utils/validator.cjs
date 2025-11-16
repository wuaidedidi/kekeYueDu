const sanitizeHtml = require('sanitize-html')

/**
 * 清洗HTML内容，移除危险标签和属性
 * @param {string} html - 需要清洗的HTML内容
 * @returns {string} 清洗后的安全HTML
 */
function sanitizeHtmlContent(html) {
  if (!html) return ''

  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'ol',
      'ul',
      'li',
      'blockquote',
      'code',
      'pre',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'a',
      'img',
      'div',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      div: ['class'],
      span: ['class'],
      code: ['class'],
      pre: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
  })
}

/**
 * 从HTML提取纯文本
 * @param {string} html - HTML内容
 * @returns {string} 提取的纯文本
 */
function extractTextFromHtml(html) {
  if (!html) return ''

  return html
    .replace(/<[^>]*>/g, '') // 移除所有HTML标签
    .replace(/&nbsp;/g, ' ') // 替换空格实体
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

/**
 * 验证和清洗用户名
 * @param {string} username - 用户名
 * @returns {object} {isValid: boolean, sanitized: string, message?: string}
 */
function validateUsername(username) {
  if (!username) {
    return { isValid: false, sanitized: '', message: '用户名不能为空' }
  }

  const trimmed = username.trim()

  if (trimmed.length < 3) {
    return {
      isValid: false,
      sanitized: trimmed,
      message: '用户名至少需要3个字符',
    }
  }

  if (trimmed.length > 20) {
    return {
      isValid: false,
      sanitized: trimmed,
      message: '用户名不能超过20个字符',
    }
  }

  // 只允许字母、数字、中文和下划线
  if (!/^[\w\u4e00-\u9fa5]+$/.test(trimmed)) {
    return {
      isValid: false,
      sanitized: trimmed,
      message: '用户名只能包含字母、数字、中文和下划线',
    }
  }

  return { isValid: true, sanitized: trimmed }
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {object} {isValid: boolean, message?: string}
 */
function validatePassword(password) {
  if (!password) {
    return { isValid: false, message: '密码不能为空' }
  }

  if (password.length < 6) {
    return { isValid: false, message: '密码至少需要6个字符' }
  }

  if (password.length > 128) {
    return { isValid: false, message: '密码不能超过128个字符' }
  }

  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!hasLetter || !hasNumber) {
    return { isValid: false, message: '密码必须包含字母和数字' }
  }

  return { isValid: true }
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {object} {isValid: boolean, sanitized: string, message?: string}
 */
function validateEmail(email) {
  if (!email) {
    return { isValid: true, sanitized: '', message: null } // 邮箱是可选的
  }

  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, sanitized: trimmed, message: '邮箱格式不正确' }
  }

  return { isValid: true, sanitized: trimmed }
}

/**
 * 验证和清洗评论内容
 * @param {string} content - 评论内容
 * @returns {object} {isValid: boolean, sanitizedHtml: string, sanitizedText: string, message?: string}
 */
function validateCommentContent(content) {
  if (!content) {
    return {
      isValid: false,
      sanitizedHtml: '',
      sanitizedText: '',
      message: '评论内容不能为空',
    }
  }

  const trimmed = content.trim()

  if (trimmed.length < 1) {
    return {
      isValid: false,
      sanitizedHtml: '',
      sanitizedText: '',
      message: '评论内容不能为空',
    }
  }

  if (trimmed.length > 10000) {
    return {
      isValid: false,
      sanitizedHtml: '',
      sanitizedText: '',
      message: '评论内容不能超过10000个字符',
    }
  }

  // 清洗HTML内容
  const sanitizedHtml = sanitizeHtmlContent(trimmed)
  const sanitizedText = extractTextFromHtml(sanitizedHtml)

  if (sanitizedText.length < 1) {
    return {
      isValid: false,
      sanitizedHtml: '',
      sanitizedText: '',
      message: '评论内容不能为空',
    }
  }

  return {
    isValid: true,
    sanitizedHtml,
    sanitizedText,
    message: null,
  }
}

/**
 * 验证分页参数
 * @param {any} page - 页码
 * @param {any} pageSize - 每页数量
 * @returns {object} {isValid: boolean, page: number, pageSize: number, message?: string}
 */
function validatePaginationParams(page, pageSize) {
  let pageNum = parseInt(page) || 1
  let pageSizeNum = parseInt(pageSize) || 20

  if (pageNum < 1) {
    pageNum = 1
  }

  if (pageSizeNum < 1 || pageSizeNum > 100) {
    pageSizeNum = 20 // 默认和最大限制
  }

  return {
    isValid: true,
    page: pageNum,
    pageSize: pageSizeNum,
  }
}

module.exports = {
  sanitizeHtmlContent,
  extractTextFromHtml,
  validateUsername,
  validatePassword,
  validateEmail,
  validateCommentContent,
  validatePaginationParams,
}
