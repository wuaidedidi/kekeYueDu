import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './auth'

const Index = () => import('../view/index/index.vue')
const HelloWorld = () => import('../components/HelloWorld.vue')
import Workspace from '@/view/Analytics/Workspace/WorkSpace.vue'
import SubscriptionStats from '@/view/Analytics/SubscriptionStats.vue'
import WriterConsultation from '@/view/Analytics/WriterConsultation.vue'
import WritingStats from '@/view/Analytics/Workspace/WritingStats/WritingStats.vue'
import HelpCenter from '@/view/Analytics/HelpCenter.vue'
import AllBooks from '@/view/Analytics/Workspace/AllBooks/AllBooks.vue'
import Store from '@/view/Analytics/Workspace/Store/Store.vue'
import InkShop from '@/view/Analytics/Workspace/InkShop/InkShop.vue'
import CommitManage from '@/view/Analytics/CommitManage.vue'
import DraftDetail from '@/view/Analytics/DraftDetail.vue'
const Login = () => import('@/view/Login/login.vue')

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'index',
    redirect: '/workspace/all-books', // 登录后重定向到工作台
    meta: {
      title: '首页',
      keepAlive: true,
      requireAuth: true,
    },
    component: Index,
    children: [
      {
        path: 'workspace',
        component: Workspace,
        meta: {
          requireAuth: true,
        },
        children: [
          {
            path: 'all-books',
            component: AllBooks,
            meta: {
              requireAuth: true,
            },
          },
          {
            path: 'store',
            component: Store,
            meta: {
              requireAuth: true,
            },
          },
          {
            path: 'ink-shop',
            component: InkShop,
            meta: {
              requireAuth: true,
            },
          },
          {
            path: 'writing-stats',
            component: WritingStats,
            meta: {
              requireAuth: true,
            },
          },
        ],
      },
      {
        path: 'subscription-stats',
        component: SubscriptionStats,
        meta: {
          requireAuth: true,
        },
      },
      {
        path: 'writer-consultation',
        component: WriterConsultation,
        meta: {
          requireAuth: true,
        },
      },
      {
        path: 'help-center',
        component: HelpCenter,
        meta: {
          requireAuth: true,
        },
      },
      {
        path: 'commitManage',
        component: CommitManage,
        meta: {
          requireAuth: true,
        },
      },
      {
        path: 'draft-detail/:id',
        name: 'draftDetail',
        component: DraftDetail,
        meta: {
          requireAuth: true,
        },
      },
    ],
  },
  {
    path: '/helloworld',
    name: 'helloworld',
    meta: {
      title: 'helloworld',
      keepAlive: true,
      requireAuth: true,
    },
    component: HelloWorld,
  },
  {
    path: '/login',
    name: 'login',
    meta: {
      title: 'login',
      keepAlive: true,
      requireAuth: false, // 登录页面不需要认证
    },
    component: Login,
  },
  {
    path: '/404',
    name: '404',
    component: () => import('../view/error/404.vue'),
    meta: {
      title: '页面未找到',
      requireAuth: false,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 设置路由守卫
setupRouterGuards(router)

export default router
