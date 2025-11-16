const {
  validateUsername,
  validatePassword,
  validateEmail,
  validateCommentContent,
  sanitizeHtmlContent,
  extractTextFromHtml,
  validatePaginationParams
} = require('./validator.cjs')

describe('Validator Utils', () => {
  describe('validateUsername', () => {
    test('应该验证有效的用户名', () => {
      const result = validateUsername('testuser123')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('testuser123')
    })

    test('应该验证中文用户名', () => {
      const result = validateUsername('测试用户')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('测试用户')
    })

    test('应该拒绝空用户名', () => {
      const result = validateUsername('')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('用户名不能为空')
    })

    test('应该拒绝过短的用户名', () => {
      const result = validateUsername('ab')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('用户名至少需要3个字符')
    })

    test('应该拒绝过长的用户名', () => {
      const result = validateUsername('a'.repeat(21))
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('用户名不能超过20个字符')
    })

    test('应该拒绝包含特殊字符的用户名', () => {
      const result = validateUsername('test@user')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('用户名只能包含字母、数字、中文和下划线')
    })

    test('应该修剪空白字符', () => {
      const result = validateUsername('  testuser  ')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('testuser')
    })
  })

  describe('validatePassword', () => {
    test('应该验证有效的密码', () => {
      const result = validatePassword('test123')
      expect(result.isValid).toBe(true)
    })

    test('应该拒绝空密码', () => {
      const result = validatePassword('')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('密码不能为空')
    })

    test('应该拒绝过短的密码', () => {
      const result = validatePassword('12345')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('密码至少需要6个字符')
    })

    test('应该拒绝过长的密码', () => {
      const result = validatePassword('a'.repeat(129))
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('密码不能超过128个字符')
    })

    test('应该拒绝只有字母的密码', () => {
      const result = validatePassword('abcdef')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('密码必须包含字母和数字')
    })

    test('应该拒绝只有数字的密码', () => {
      const result = validatePassword('123456')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('密码必须包含字母和数字')
    })
  })

  describe('validateEmail', () => {
    test('应该验证有效的邮箱', () => {
      const result = validateEmail('test@example.com')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('test@example.com')
    })

    test('应该允许空邮箱', () => {
      const result = validateEmail('')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('')
    })

    test('应该转换为小写', () => {
      const result = validateEmail('Test@Example.COM')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('test@example.com')
    })

    test('应该拒绝无效的邮箱格式', () => {
      const result = validateEmail('invalid-email')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('邮箱格式不正确')
    })
  })

  describe('validateCommentContent', () => {
    test('应该验证有效的评论内容', () => {
      const result = validateCommentContent('<p>这是一个测试评论</p>')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedHtml).toContain('<p>')
      expect(result.sanitizedText).toBe('这是一个测试评论')
    })

    test('应该拒绝空内容', () => {
      const result = validateCommentContent('')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('评论内容不能为空')
    })

    test('应该拒绝过长的内容', () => {
      const longContent = 'a'.repeat(10001)
      const result = validateCommentContent(longContent)
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('评论内容不能超过10000个字符')
    })

    test('应该清洗危险的HTML', () => {
      const result = validateCommentContent('<script>alert("xss")</script><p>安全内容</p>')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedHtml).not.toContain('<script>')
      expect(result.sanitizedHtml).toContain('<p>安全内容</p>')
    })
  })

  describe('sanitizeHtmlContent', () => {
    test('应该允许安全标签', () => {
      const html = '<p><strong>粗体</strong><em>斜体</em></p>'
      const result = sanitizeHtmlContent(html)
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>粗体</strong>')
      expect(result).toContain('<em>斜体</em>')
    })

    test('应该移除危险脚本', () => {
      const html = '<script>alert("xss")</script><p>安全内容</p>'
      const result = sanitizeHtmlContent(html)
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>安全内容</p>')
    })

    test('应该处理空值', () => {
      const result = sanitizeHtmlContent('')
      expect(result).toBe('')
      expect(sanitizeHtmlContent(null)).toBe('')
      expect(sanitizeHtmlContent(undefined)).toBe('')
    })
  })

  describe('extractTextFromHtml', () => {
    test('应该提取纯文本', () => {
      const html = '<p><strong>粗体</strong>和<em>斜体</em></p>'
      const result = extractTextFromHtml(html)
      expect(result).toBe('粗体和斜体')
    })

    test('应该处理HTML实体', () => {
      const html = '<p>&lt;script&gt;标签&lt;/script&gt;</p>'
      const result = extractTextFromHtml(html)
      expect(result).toBe('<script>标签</script>')
    })

    test('应该处理空值', () => {
      expect(extractTextFromHtml('')).toBe('')
      expect(extractTextFromHtml(null)).toBe('')
      expect(extractTextFromHtml(undefined)).toBe('')
    })
  })

  describe('validatePaginationParams', () => {
    test('应该验证有效的分页参数', () => {
      const result = validatePaginationParams(2, 20)
      expect(result.isValid).toBe(true)
      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(20)
    })

    test('应该使用默认值处理无效参数', () => {
      const result = validatePaginationParams('invalid', 'invalid')
      expect(result.isValid).toBe(true)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    test('应该限制最大值', () => {
      const result = validatePaginationParams(1, 200)
      expect(result.isValid).toBe(true)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20) // 限制为20
    })

    test('应该处理小于1的值', () => {
      const result = validatePaginationParams(0, -5)
      expect(result.isValid).toBe(true)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })
  })
})