import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  RouteRecordRaw,
} from 'vue-router'

const Index = () => import('../view/index/index.vue')
const HelloWorld = () => import('../components/HelloWorld.vue')
import Workspace from '@/view/Analytics/Workspace/WorkSpace.vue'
import SubscriptionStats from '@/view/Analytics/SubscriptionStats.vue'
import WriterConsultation from '@/view/Analytics/WriterConsultation.vue'
import WritingStats from '@/view/Analytics/Workspace/WritingStats/WritingStats.vue'
import HelpCenter from '@/view/Analytics/HelpCenter.vue'
import AllBooks from '@/view/Analytics/Workspace/AllBooks/AllBooks.vue'
import Store from '@/view/Analytics/Workspace/Store/Store.vue'
import CommitManage from '@/view/Analytics/CommitManage.vue'
import DraftDetail from '@/view/Analytics/DraftDetail.vue'
import Login from '@/view/Login/login.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'index',
    redirect: '/login', // 设置重定向到登录页面
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
        children: [
          {
            path: 'all-books',
            component: AllBooks,
          },
          {
            path: 'store',
            component: Store,
          },
          {
            path: 'writing-stats',
            component: WritingStats,
          },
        ],
      },
      {
        path: 'subscription-stats',
        component: SubscriptionStats,
      },
      {
        path: 'writer-consultation',
        component: WriterConsultation,
      },

      {
        path: 'help-center',
        component: HelpCenter,
      },
      {
        path: 'commitManage',
        component: CommitManage,
      },
      {
        path: 'draft-detail/:id',
        name: 'draftDetail',
        component: DraftDetail,
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
      requireAuth: true,
    },
    component: Login,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
