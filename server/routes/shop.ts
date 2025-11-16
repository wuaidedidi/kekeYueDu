import express from 'express'
import { ShopModel } from '../models/Shop.js'
import { authenticateToken } from './user.js'
import sqlite3 from 'sqlite3'
import { config } from '../config/db.js'

const router = express.Router()
const db = new sqlite3.Database(config.database)
const shopModel = new ShopModel(db)

// 获取用户余额
router.get('/shop/balance', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id || req.user.userId
    let balance = await shopModel.getUserBalance(userId)

    // 如果余额不存在，创建默认余额
    if (!balance) {
      balance = await shopModel.upsertUserBalance(userId, 100)
    }

    res.json({
      success: true,
      data: {
        points: balance.ink_points,
      },
    })
  } catch (error) {
    console.error('Get balance error:', error)
    res.status(500).json({
      success: false,
      message: '获取余额失败',
    })
  }
})

// 获取商品列表
router.get('/shop/products', async (req, res) => {
  try {
    const {
      type = 'all',
      status = 'active',
      page = 1,
      pageSize = 20,
    } = req.query

    const pageNum = parseInt(page as string)
    const pageSizeNum = parseInt(pageSize as string)

    const result = await shopModel.getProducts({
      type: type as string,
      status: status as string,
      page: pageNum,
      pageSize: pageSizeNum,
    })

    // 如果有token，获取用户权益信息
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      try {
        const { default: jwt } = await import('jsonwebtoken')
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        ) as any
        const userId = decoded.id || decoded.userId
        const userRights = await shopModel.getUserRights(userId)
        const ownedProductIds = new Set(
          userRights.map((right) => right.product_id)
        )

        // 为商品添加用户拥有状态
        const productsWithOwnership = result.products.map((product) => ({
          ...product,
          owned: ownedProductIds.has(product.id!),
        }))

        res.json({
          success: true,
          data: productsWithOwnership,
          page: pageNum,
          pageSize: pageSizeNum,
          total: result.total,
        })
      } catch (error) {
        // Token无效，返回普通商品列表
        res.json({
          success: true,
          data: result.products,
          page: pageNum,
          pageSize: pageSizeNum,
          total: result.total,
        })
      }
    } else {
      // 未登录，返回普通商品列表
      res.json({
        success: true,
        data: result.products,
        page: pageNum,
        pageSize: pageSizeNum,
        total: result.total,
      })
    }
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({
      success: false,
      message: '获取商品列表失败',
    })
  }
})

// 兑换商品
router.post('/shop/redeem', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id || req.user.userId
    const { productId, quantity = 1 } = req.body

    if (!productId) {
      res.status(400).json({
        success: false,
        message: '商品ID不能为空',
      })
      return
    }

    const result = await shopModel.redeemProduct(
      userId,
      parseInt(productId),
      parseInt(quantity)
    )

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: result.message,
      })
    } else {
      // 根据错误类型返回不同的状态码
      if (result.message === '余额不足') {
        res.status(402).json({
          success: false,
          message: result.message,
        })
        return
      } else if (result.message === '库存不足') {
        res.status(409).json({
          success: false,
          message: result.message,
        })
        return
      } else {
        res.status(422).json({
          success: false,
          message: result.message,
        })
        return
      }
    }
  } catch (error) {
    console.error('Redeem product error:', error)
    res.status(500).json({
      success: false,
      message: '兑换失败，请重试',
    })
  }
})

// 获取用户权益
router.get('/shop/user-rights', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id || req.user.userId
    const rights = await shopModel.getUserRights(userId)

    // 获取商品详细信息
    const rightsWithProducts = await Promise.all(
      rights.map(async (right) => {
        const product = await shopModel.getProduct(right.product_id)
        return {
          ...right,
          product,
        }
      })
    )

    res.json({
      success: true,
      data: rightsWithProducts,
    })
  } catch (error) {
    console.error('Get user rights error:', error)
    res.status(500).json({
      success: false,
      message: '获取用户权益失败',
    })
  }
})

// 获取订单记录
router.get('/shop/orders', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id || req.user.userId
    const { page = 1, pageSize = 20 } = req.query

    const pageNum = parseInt(page as string)
    const pageSizeNum = parseInt(pageSize as string)

    const result = await shopModel.getUserOrders(userId, pageNum, pageSizeNum)

    res.json({
      success: true,
      data: result.orders,
      page: pageNum,
      pageSize: pageSizeNum,
      total: result.total,
    })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({
      success: false,
      message: '获取订单记录失败',
    })
  }
})

// 充值墨水（管理员功能或测试用）
router.post('/shop/recharge', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id || req.user.userId
    const { amount } = req.body

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: '充值金额必须大于0',
      })
      return
    }

    const currentBalance = await shopModel.getUserBalance(userId)
    const currentPoints = currentBalance?.ink_points || 0
    const newBalance = await shopModel.upsertUserBalance(
      userId,
      currentPoints + amount
    )

    res.json({
      success: true,
      data: {
        newBalance: newBalance.ink_points,
        recharged: amount,
      },
      message: '充值成功',
    })
  } catch (error) {
    console.error('Recharge error:', error)
    res.status(500).json({
      success: false,
      message: '充值失败',
    })
  }
})

export default router
