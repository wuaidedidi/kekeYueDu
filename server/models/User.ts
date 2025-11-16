// src/models/User.ts
import connectDB from '../config/db.js'
import bcrypt from 'bcryptjs'

// 用户接口定义
export interface User {
  id: number
  username: string
  password: string
  email?: string
  avatar?: string
  created_at: string
  updated_at: string
}

// 创建用户表
const createUserTable = async () => {
  const db = await connectDB()
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// 用户注册
const registerUser = async (
  username: string,
  password: string,
  email?: string
): Promise<number> => {
  const db = await connectDB()
  // 哈希密码
  const hashedPassword = await bcrypt.hash(password, 12)
  const result = await db.run(
    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
    [username, hashedPassword, email || null]
  )
  return result.lastID!
}

// 根据用户名查找用户
const findUserByUsername = async (username: string): Promise<User | null> => {
  const db = await connectDB()
  const user = await db.get('SELECT * FROM users WHERE username = ?', [
    username,
  ])
  return user || null
}

// 根据ID查找用户
const findUserById = async (id: number): Promise<User | null> => {
  const db = await connectDB()
  const user = await db.get('SELECT * FROM users WHERE id = ?', [id])
  return user || null
}

// 更新用户信息
const updateUser = async (
  id: number,
  updates: Partial<Omit<User, 'id' | 'created_at'>>
): Promise<boolean> => {
  const db = await connectDB()
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(', ')
  const values = Object.values(updates)

  const result = await db.run(
    `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [...values, id]
  )
  return result.changes! > 0
}

// 删除用户
const deleteUser = async (id: number): Promise<boolean> => {
  const db = await connectDB()
  const result = await db.run('DELETE FROM users WHERE id = ?', [id])
  return result.changes! > 0
}

// 验证用户密码
const validatePassword = async (
  username: string,
  password: string
): Promise<User | null> => {
  const user = await findUserByUsername(username)
  if (!user) return null

  // 使用 bcrypt 验证密码
  const isValid = await bcrypt.compare(password, user.password)
  return isValid ? user : null
}

export {
  createUserTable,
  registerUser,
  findUserByUsername,
  findUserById,
  updateUser,
  deleteUser,
  validatePassword,
}
