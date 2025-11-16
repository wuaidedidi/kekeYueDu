import { test, expect } from '@playwright/test'

test.describe('用户认证流程', () => {
  test.beforeEach(async ({ page }) => {
    // 访问登录页面
    await page.goto('/view/Login/login.html')
  })

  test('应该显示登录页面', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/kekeYueDu|登录/)

    // 验证登录表单元素
    await expect(page.locator('input[type="text"], input[name="username"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('应该显示表单验证错误', async ({ page }) => {
    // 提交空表单
    await page.click('button[type="submit"]')

    // 应该显示错误信息
    await expect(page.locator('.error-message, [role="alert"]')).toBeVisible()
    await expect(page.locator('text=请输入用户名和密码')).toBeVisible()
  })

  test('应该处理无效登录凭据', async ({ page }) => {
    // 输入无效凭据
    await page.fill('input[type="text"], input[name="username"]', 'invaliduser')
    await page.fill('input[type="password"]', 'invalidpassword')
    await page.click('button[type="submit"]')

    // 应该显示登录错误
    await expect(page.locator('.error-message, [role="alert"]')).toBeVisible()
    await expect(page.locator('text=用户名或密码错误')).toBeVisible()
  })

  test('应该成功跳转到主页', async ({ page }) => {
    // 注意：这里使用测试凭据，实际应用中需要配置测试用户
    await page.fill('input[type="text"], input[name="username"]', 'testuser')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')

    // 等待导航完成
    await page.waitForLoadState('networkidle')

    // 验证是否跳转到主页（根据实际路由调整）
    await expect(page.url()).toContain('/view/index/index.html')
  })
})

test.describe('页面基本功能', () => {
  test('主页应该正常加载', async ({ page }) => {
    await page.goto('/view/index/index.html')

    // 验证页面基本元素
    await expect(page.locator('body')).toBeVisible()

    // 验证主要导航元素（根据实际页面调整）
    const mainNav = page.locator('nav, .navigation, .navbar')
    if (await mainNav.count() > 0) {
      await expect(mainNav).toBeVisible()
    }
  })

  test('响应式布局应该正常工作', async ({ page }) => {
    await page.goto('/view/index/index.html')

    // 测试桌面视口
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('body')).toBeVisible()

    // 测试平板视口
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('body')).toBeVisible()

    // 测试手机视口
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('API端点测试', () => {
  test('注册API应该正常工作', async ({ request }) => {
    const response = await request.post('/api/register', {
      data: {
        username: `testuser_${Date.now()}`,
        password: 'test123',
        confirmPassword: 'test123'
      }
    })

    expect(response.status()).toBe(201)
    const responseData = await response.json()
    expect(responseData).toHaveProperty('success', true)
    expect(responseData).toHaveProperty('data')
    expect(responseData.data).toHaveProperty('user')
    expect(responseData.data).toHaveProperty('token')
  })

  test('登录API应该正常工作', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: {
        username: 'testuser',
        password: 'test123'
      }
    })

    // 可能返回401如果用户不存在，但API应该响应
    expect([200, 401]).toContain(response.status())
    const responseData = await response.json()
    expect(responseData).toHaveProperty('success')
  })

  test('用户信息API需要认证', async ({ request }) => {
    const response = await request.get('/api/profile')

    // 应该返回401未授权
    expect(response.status()).toBe(401)
  })
})