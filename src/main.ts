import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/assets/styles/global.scss'
import { createPinia } from 'pinia' // 引入 Pinia
const app = createApp(App)

app.use(router)
app.use(ElementPlus)
const pinia = createPinia() // 创建 Pinia 实例
app.use(pinia) // 使用 Pinia
app.mount('#app')
