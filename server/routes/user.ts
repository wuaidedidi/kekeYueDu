// src/routes/user.ts
import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { createUserTable, registerUser } from '../models/User'
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
import { send } from 'process'

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
/** */
// 创建草稿表
createDraftTable()

router.get('/allDraft', async (req: any, res: any) => {
  try {
    const drafts = await getAllDrafts() // 获取草稿数据
    return res.status(200).json(drafts)
  } catch (error) {
    return res.status(500).send('获取失败')
  }
})

//创建卷表
createVolumeTable()
//创建章节表
createChapterTable()

router.get('/treeData', async (req: Request, res: Response) => {
  try {
    const treeData = await getTreeData()
    res.status(200).json(treeData)
  } catch (error) {
    res.status(500).send('获取树形数据失败')
  }
})
router.post('/saveChapter', async (req: Request, res: Response) => {
  const { id, content, vid, title, order } = req.body
  console.log(id, content, vid, title, order)
  try {
    saveChapterContent(id, content, vid, title, order)
    res.status(200).send('保存成功')
  } catch (error) {
    res.status(500).send('获取树形数据失败')
  }
})
router.get('/getChapter/:id', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const result = await getChapterContent(Number(id))
    console.log(result)
    res.status(200).send(result)
  } catch (error) {
    console.log('获取chapter出错' + error)
    res.status(500).send('获取树形数据失败')
  }
})

router.get('/chapters', async (req, res) => {
  try {
    const chapters = await getAllChapters()
    res.status(200).json(chapters)
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve chapters' })
  }
})

router.post('/saveVolume', async (req: Request, res: Response) => {
  const { title, order, bookId } = req.body

  try {
    const result = await saveVolume(title, order, bookId)

    // 使用 lastID 查询完整的分卷数据
    const savedVolume = await getVolume(result.lastID)

    console.log(savedVolume)
    res.status(200).send(savedVolume)
  } catch (error) {
    console.log(error)
    res.status(500).send('获取树形数据失败')
  }
})

router.post('/createChapter', async (req: Request, res: Response) => {
  const { content, vid, title, order } = req.body
  console.log(content, vid, title, order)
  try {
    const result = await createChapter(content, vid, title, order)
    res.status(200).send(result)
  } catch (error) {
    res.status(500).send('获取树形数据失败')
  }
})
/**/
export default router
