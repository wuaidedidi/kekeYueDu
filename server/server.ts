import express from 'express'
import { app as electronApp } from 'electron'
import cors from 'cors'
import useRouter from './routes/user' // 导入用户路由
const server = express()
const PORT = 8080

server.use(cors())
// 中间件示例
server.use(express.json())

// 使用认证路由
server.use('/api', useRouter) // 将认证路由挂载到 /api 路径下
// 路由示例
server.get('/', (req, res) => {
  res.send('Hello from Express!')
})

// 启动 Express 服务器
server.listen(PORT, () => {
  console.log(`Express server is running at http://localhost:${PORT}`)
})
