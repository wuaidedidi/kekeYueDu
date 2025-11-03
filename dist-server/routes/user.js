"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
// src/routes/user.ts
const express_1 = require("express");
const bcryptjs_1 = require("bcryptjs");
const User_1 = require("../models/User");
const Draft_1 = require("../models/Draft");
const Volumn_1 = require("../models/Volumn");
const Chapter_1 = require("../models/Chapter");
const jsonwebtoken_1 = require("jsonwebtoken");
const router = express_1.default.Router();
// JWT认证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '访问令牌缺失'
        });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: '令牌无效或已过期'
            });
        }
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
// 数据验证中间件
const validateRegistration = (req, res, next) => {
    const { username, password, confirmPassword } = req.body;
    // 用户名验证
    if (!username || username.trim().length < 3) {
        return res.status(400).json({
            success: false,
            message: '用户名至少需要3个字符'
        });
    }
    if (username.trim().length > 20) {
        return res.status(400).json({
            success: false,
            message: '用户名不能超过20个字符'
        });
    }
    // 密码验证
    if (!password || password.length < 6) {
        return res.status(400).json({
            success: false,
            message: '密码至少需要6个字符'
        });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: '两次输入的密码不一致'
        });
    }
    // 密码强度验证（至少包含字母和数字）
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
        return res.status(400).json({
            success: false,
            message: '密码必须包含字母和数字'
        });
    }
    next();
};
// 创建用户表
(0, User_1.createUserTable)();
// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // 基础验证
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '请输入用户名和密码'
            });
        }
        // 验证用户密码
        const user = await (0, User_1.validatePassword)(username, password);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
        // 登录成功，返回用户信息（不包含密码）
        const { password: _, ...userInfo } = user;
        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: userInfo,
                token: 'mock-token-' + Date.now() // 这里应该使用JWT
            }
        });
    }
    catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试'
        });
    }
});
// 用户注册
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { username, password, email } = req.body;
        // 检查用户名是否已存在
        const existingUser = await (0, User_1.findUserByUsername)(username.trim());
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '用户名已存在'
            });
        }
        // 检查邮箱是否已存在（如果提供了邮箱）
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱格式不正确'
                });
            }
        }
        // 密码加密
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // 注册用户
        const userId = await (0, User_1.registerUser)(username.trim(), hashedPassword, email?.trim());
        // 获取新注册的用户信息
        const newUser = await (0, User_1.findUserById)(userId);
        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    created_at: newUser.created_at
                }
            }
        });
    }
    catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        });
    }
});
// 获取用户信息
router.get('/profile', async (req, res) => {
    try {
        // 这里应该从token中获取用户ID，现在暂时使用query参数
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }
        const user = await (0, User_1.findUserById)(parseInt(userId));
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        // 不返回密码
        const { password: _, ...userInfo } = user;
        res.json({
            success: true,
            data: { user: userInfo }
        });
    }
    catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});
// 更新用户信息
router.put('/profile', async (req, res) => {
    try {
        const userId = req.body.userId;
        const updates = req.body.updates;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }
        // 验证更新数据
        const allowedFields = ['email', 'avatar'];
        const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));
        if (invalidFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `不允许更新以下字段: ${invalidFields.join(', ')}`
            });
        }
        const success = await (0, User_1.updateUser)(parseInt(userId), updates);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: '更新失败'
            });
        }
        const updatedUser = await (0, User_1.findUserById)(parseInt(userId));
        const { password: _, ...userInfo } = updatedUser;
        res.json({
            success: true,
            message: '更新成功',
            data: { user: userInfo }
        });
    }
    catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});
// === 以下是原有的写作相关功能 ===
// 创建草稿表
(0, Draft_1.createDraftTable)();
router.get('/allDraft', async (req, res) => {
    try {
        const drafts = await (0, Draft_1.getAllDrafts)();
        return res.json({
            success: true,
            data: drafts
        });
    }
    catch (error) {
        console.error('获取草稿错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取草稿失败'
        });
    }
});
// 创建卷表
(0, Volumn_1.createVolumeTable)();
// 创建章节表
(0, Chapter_1.createChapterTable)();
router.get('/treeData', async (req, res) => {
    try {
        const treeData = await (0, Chapter_1.getTreeData)();
        res.json({
            success: true,
            data: treeData
        });
    }
    catch (error) {
        console.error('获取树形数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取树形数据失败'
        });
    }
});
router.post('/saveChapter', async (req, res) => {
    const { id, content, vid, title, order } = req.body;
    try {
        await (0, Chapter_1.saveChapterContent)(id, content, vid, title, order);
        res.json({
            success: true,
            message: '保存成功'
        });
    }
    catch (error) {
        console.error('保存章节错误:', error);
        res.status(500).json({
            success: false,
            message: '保存章节失败'
        });
    }
});
router.get('/getChapter/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await (0, Chapter_1.getChapterContent)(Number(id));
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('获取章节错误:', error);
        res.status(500).json({
            success: false,
            message: '获取章节失败'
        });
    }
});
router.get('/chapters', async (req, res) => {
    try {
        const chapters = await (0, Chapter_1.getAllChapters)();
        res.json({
            success: true,
            data: chapters
        });
    }
    catch (error) {
        console.error('获取章节列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取章节列表失败'
        });
    }
});
router.post('/saveVolume', async (req, res) => {
    const { title, order, bookId } = req.body;
    try {
        const result = await (0, Volumn_1.saveVolume)(title, order, bookId);
        const savedVolume = await (0, Volumn_1.getVolume)(result.lastID);
        res.json({
            success: true,
            message: '保存分卷成功',
            data: savedVolume
        });
    }
    catch (error) {
        console.error('保存分卷错误:', error);
        res.status(500).json({
            success: false,
            message: '保存分卷失败'
        });
    }
});
router.post('/createChapter', async (req, res) => {
    const { content, vid, title, order } = req.body;
    try {
        const result = await (0, Chapter_1.createChapter)(content, vid, title, order);
        res.json({
            success: true,
            message: '创建章节成功',
            data: result
        });
    }
    catch (error) {
        console.error('创建章节错误:', error);
        res.status(500).json({
            success: false,
            message: '创建章节失败'
        });
    }
});
exports.default = router;
