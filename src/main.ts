import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'trix/dist/trix.css'
import '@/assets/styles/global.scss'
import { createPinia } from 'pinia'
import { useUserStore } from './store/userStore'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(ElementPlus)
app.use(pinia)

// 配置 Vue 将 trix-editor 视为自定义元素
app.config.isCustomElement = (tag) => {
  return tag.startsWith('trix-')
}

// 初始化用户认证状态
const userStore = useUserStore()
userStore.initAuth()

app.mount('#app')
