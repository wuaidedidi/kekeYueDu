// src/routes/user.ts
import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import {
  createUserTable,
  registerUser,
  findUserByUsername,
  findUserById,
  updateUser,
  validatePassword
} from '../models/User'
import { createDraftTable, getAllDrafts } from '../models/Draft'
import { createVolumeTable, saveVolume, getVolume } from '../models/Volumn'
import {
  createChapterTable,
  getTreeData,
  saveChapterContent,
  getChapterContent,
  getAllChapters,
  createChapter,
} from '../models/Chapter'
import connectDB from '../config/db'
import jwt from 'jsonwebtoken'

const router = express.Router()

// JWT认证中间件
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失'
    })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '令牌无效或已过期'
      })
    }
    req.user = user
    next()
  })
}

// 数据验证中间件
const validateRegistration = (req: Request, res: Response, next: Function) => {
  const { username, password, confirmPassword } = req.body

  // 用户名验证
  if (!username || username.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: '用户名至少需要3个字符'
    })
  }

  if (username.trim().length > 20) {
    return res.status(400).json({
      success: false,
      message: '用户名不能超过20个字符'
    })
  }

  // 密码验证
  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: '密码至少需要6个字符'
    })
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: '两次输入的密码不一致'
    })
  }

  // 密码强度验证（至少包含字母和数字）
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!hasLetter || !hasNumber) {
    return res.status(400).json({
      success: false,
      message: '密码必须包含字母和数字'
    })
  }

  next()
}

// 创建用户表
createUserTable()

// 用户登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    // 基础验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入用户名和密码'
      })
    }

    // 验证用户密码
    const user = await validatePassword(username, password)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 登录成功，返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userInfo,
        token: 'mock-token-' + Date.now() // 这里应该使用JWT
      }
    })

  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    })
  }
})

// 用户注册
router.post('/register', validateRegistration, async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body

    // 检查用户名是否已存在
    const existingUser = await findUserByUsername(username.trim())
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '用户名已存在'
      })
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '邮箱格式不正确'
        })
      }
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 12)

    // 注册用户
    const userId = await registerUser(username.trim(), hashedPassword, email?.trim())

    // 获取新注册的用户信息
    const newUser = await findUserById(userId)

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: newUser!.id,
          username: newUser!.username,
          email: newUser!.email,
          created_at: newUser!.created_at
        }
      }
    })

  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    })
  }
})

// 获取用户信息
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // 这里应该从token中获取用户ID，现在暂时使用query参数
    const userId = req.query.userId as string

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      })
    }

    const user = await findUserById(parseInt(userId))

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 不返回密码
    const { password: _, ...userInfo } = user

    res.json({
      success: true,
      data: { user: userInfo }
    })

  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新用户信息
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId
    const updates = req.body.updates

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      })
    }

    // 验证更新数据
    const allowedFields = ['email', 'avatar']
    const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key))

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `不允许更新以下字段: ${invalidFields.join(', ')}`
      })
    }

    const success = await updateUser(parseInt(userId), updates)

    if (!success) {
      return res.status(400).json({
        success: false,
        message: '更新失败'
      })
    }

    const updatedUser = await findUserById(parseInt(userId))
    const { password: _, ...userInfo } = updatedUser!

    res.json({
      success: true,
      message: '更新成功',
      data: { user: userInfo }
    })

  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// === 以下是原有的写作相关功能 ===

// 创建草稿表
createDraftTable()

router.get('/allDraft', async (req: Request, res: Response) => {
  try {
    const drafts = await getAllDrafts()
    return res.json({
      success: true,
      data: drafts
    })
  } catch (error) {
    console.error('获取草稿错误:', error)
    return res.status(500).json({
      success: false,
      message: '获取草稿失败'
    })
  }
})

// 创建卷表
createVolumeTable()
// 创建章节表
createChapterTable()

router.get('/treeData', async (req: Request, res: Response) => {
  try {
    const treeData = await getTreeData()
    res.json({
      success: true,
      data: treeData
    })
  } catch (error) {
    console.error('获取树形数据错误:', error)
    res.status(500).json({
      success: false,
      message: '获取树形数据失败'
    })
  }
})

router.post('/saveChapter', async (req: Request, res: Response) => {
  const { id, content, vid, title, order } = req.body

  try {
    await saveChapterContent(id, content, vid, title, order)
    res.json({
      success: true,
      message: '保存成功'
    })
  } catch (error) {
    console.error('保存章节错误:', error)
    res.status(500).json({
      success: false,
      message: '保存章节失败'
    })
  }
})

router.get('/getChapter/:id', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const result = await getChapterContent(Number(id))
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('获取章节错误:', error)
    res.status(500).json({
      success: false,
      message: '获取章节失败'
    })
  }
})

router.get('/chapters', async (req: Request, res: Response) => {
  try {
    const chapters = await getAllChapters()
    res.json({
      success: true,
      data: chapters
    })
  } catch (error) {
    console.error('获取章节列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取章节列表失败'
    })
  }
})

router.post('/saveVolume', async (req: Request, res: Response) => {
  const { title, order, bookId } = req.body

  try {
    const result = await saveVolume(title, order, bookId)
    const savedVolume = await getVolume(result.lastID)

    res.json({
      success: true,
      message: '保存分卷成功',
      data: savedVolume
    })
  } catch (error) {
    console.error('保存分卷错误:', error)
    res.status(500).json({
      success: false,
      message: '保存分卷失败'
    })
  }
})

router.post('/createChapter', async (req: Request, res: Response) => {
  const { content, vid, title, order } = req.body

  try {
    const result = await createChapter(content, vid, title, order)
    res.json({
      success: true,
      message: '创建章节成功',
      data: result
    })
  } catch (error) {
    console.error('创建章节错误:', error)
    res.status(500).json({
      success: false,
      message: '创建章节失败'
    })
  }
})

export default router