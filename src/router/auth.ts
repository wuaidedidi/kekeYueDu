import { useUserStore } from '@/store/userStore'

// 路由守卫
export const setupRouterGuards = (router: any) => {
  router.beforeEach(async (to: any, from: any, next: any) => {
    const userStore = useUserStore()

    // 如果用户状态还未初始化，先初始化
    if (!userStore.user && !userStore.token) {
      userStore.initAuth()
    }

    // 检查路由是否需要认证（兼容 requireAuth 与 requiresAuth）
    const requiresAuth = to.matched.some(
      (record: any) => record.meta?.requireAuth || record.meta?.requiresAuth
    )

    if (requiresAuth && !userStore.isLoggedIn) {
      // 需要认证但用户未登录，跳转到登录页
      next('/login')
    } else if (to.path === '/login' && userStore.isLoggedIn) {
      // 已登录用户访问登录页，跳转到主页
      next('/workspace/all-books')
    } else {
      // 正常访问
      next()
    }
  })
}
