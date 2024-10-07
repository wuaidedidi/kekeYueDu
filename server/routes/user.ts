// src/routes/user.ts
import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { createUserTable, registerUser } from '../models/User'
import connectDB from '../config/db'

const router = express.Router()

// 创建用户表
createUserTable()

router.post('/login', async (req: any, res: any) => {
  const { username, password } = req.body
  const db = await connectDB()
  const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [
    username,
  ])
  if (existingUser) {
    return res.status(201).send('用户登陆成功')
  } else {
    return res.status(400).send('用户登陆失败')
  }
})

router.post('/register', async (req: any, res: any) => {
  const { username, password, confirmPassword } = req.body
  console.log(req.body)

  const db = await connectDB()
  const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [
    username,
  ])

  if (existingUser) {
    return res.status(400).send('用户名已存在')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await registerUser(username, hashedPassword)
    res.status(201).send('用户注册成功')
  } catch (error) {
    res.status(500).send('注册失败：' + error.message)
  }
})

export default router
