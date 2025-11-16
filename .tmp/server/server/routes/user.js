// src/routes/user.ts
import express from 'express';
import { createUserTable, registerUser, findUserByUsername, findUserById, updateUser, validatePassword, } from '../models/User.js';
import { createDraftTable, getAllDrafts, createDraft } from '../models/Draft.js';
import { createVolumeTable, saveVolume, getVolume } from '../models/Volumn.js';
import { createChapterTable, getTreeData, saveChapterContent, getChapterContent, getAllChapters, createChapter, } from '../models/Chapter.js';
import { createVersion, getChapterVersions, togglePinVersion, deleteVersion, revertToVersion, } from '../models/Version.js';
import jwt from 'jsonwebtoken';
const router = express.Router();
// JWT认证中间件
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        res.status(401).json({
            success: false,
            message: '访问令牌缺失',
        });
        return;
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            res.status(403).json({
                success: false,
                message: '令牌无效或已过期',
            });
            return;
        }
        ;
        req.user = user;
        next();
    });
};
// 数据验证中间件
const validateRegistration = (req, res, next) => {
    const { username, password, confirmPassword } = req.body;
    // 用户名验证
    if (!username || username.trim().length < 3) {
        res.status(400).json({
            success: false,
            message: '用户名至少需要3个字符',
        });
        return;
    }
    if (username.trim().length > 20) {
        res.status(400).json({
            success: false,
            message: '用户名不能超过20个字符',
        });
        return;
    }
    // 密码验证
    if (!password || password.length < 6) {
        res.status(400).json({
            success: false,
            message: '密码至少需要6个字符',
        });
        return;
    }
    if (password !== confirmPassword) {
        res.status(400).json({
            success: false,
            message: '两次输入的密码不一致',
        });
        return;
    }
    // 密码强度验证（至少包含字母和数字）
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
        res.status(400).json({
            success: false,
            message: '密码必须包含字母和数字',
        });
        return;
    }
    next();
};
// 创建用户表
createUserTable();
// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // 基础验证
        if (!username || !password) {
            res.status(400).json({
                success: false,
                message: '请输入用户名和密码',
            });
            return;
        }
        // 验证用户密码
        const user = await validatePassword(username, password);
        if (!user) {
            res.status(401).json({
                success: false,
                message: '用户名或密码错误',
            });
            return;
        }
        // 登录成功，返回用户信息（不包含密码）
        const { password: _, ...userInfo } = user;
        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: userInfo,
                token: 'mock-token-' + Date.now(), // 这里应该使用JWT
            },
        });
    }
    catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
        });
    }
});
// 用户注册
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { username, password, email } = req.body;
        // 检查用户名是否已存在
        const existingUser = await findUserByUsername(username.trim());
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: '用户名已存在',
            });
            return;
        }
        // 检查邮箱是否已存在（如果提供了邮箱）
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({
                    success: false,
                    message: '邮箱格式不正确',
                });
                return;
            }
        }
        // 注册用户
        const userId = await registerUser(username.trim(), password, email?.trim());
        // 获取新注册的用户信息
        const newUser = await findUserById(userId);
        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    created_at: newUser.created_at,
                },
            },
        });
    }
    catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试',
        });
    }
});
// 获取用户信息
router.get('/profile', async (req, res) => {
    try {
        // 这里应该从token中获取用户ID，现在暂时使用query参数
        const userId = req.query.userId;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: '用户ID不能为空',
            });
            return;
        }
        const user = await findUserById(parseInt(userId));
        if (!user) {
            res.status(404).json({
                success: false,
                message: '用户不存在',
            });
            return;
        }
        // 不返回密码
        const { password: _, ...userInfo } = user;
        res.json({
            success: true,
            data: { user: userInfo },
        });
    }
    catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
        });
    }
});
// 更新用户信息
router.put('/profile', async (req, res) => {
    try {
        const userId = req.body.userId;
        const updates = req.body.updates;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: '用户ID不能为空',
            });
            return;
        }
        // 验证更新数据
        const allowedFields = ['email', 'avatar'];
        const invalidFields = Object.keys(updates).filter((key) => !allowedFields.includes(key));
        if (invalidFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `不允许更新以下字段: ${invalidFields.join(', ')}`,
            });
            return;
        }
        const success = await updateUser(parseInt(userId), updates);
        if (!success) {
            res.status(400).json({
                success: false,
                message: '更新失败',
            });
            return;
        }
        const updatedUser = await findUserById(parseInt(userId));
        const { password: _, ...userInfo } = updatedUser;
        res.json({
            success: true,
            message: '更新成功',
            data: { user: userInfo },
        });
    }
    catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
        });
    }
});
// === 以下是原有的写作相关功能 ===
// 创建草稿表
createDraftTable();
router.get('/allDraft', async (req, res) => {
    try {
        const drafts = await getAllDrafts();
        res.json({
            success: true,
            data: drafts,
        });
    }
    catch (error) {
        console.error('获取草稿错误:', error);
        res.status(500).json({
            success: false,
            message: '获取草稿失败',
        });
        return;
    }
});
// 创建新草稿
router.post('/createDraft', async (req, res) => {
    try {
        const { bookName, fontCount, src } = req.body;
        // 参数验证
        if (!bookName || fontCount === undefined || !src) {
            res.status(400).json({
                success: false,
                message: '缺少必要参数：bookName, fontCount, src',
            });
            return;
        }
        const result = await createDraft(bookName, fontCount, src);
        res.status(201).json({
            success: true,
            message: '草稿创建成功',
            data: {
                id: result.lastID,
                bookName,
                fontCount,
                src,
            },
        });
    }
    catch (error) {
        console.error('创建草稿错误:', error);
        res.status(500).json({
            success: false,
            message: '创建草稿失败，请稍后重试',
        });
    }
});
// 创建卷表
createVolumeTable();
// 创建章节表
createChapterTable();
// 版本表已通过脚本手动创建，暂时注释掉避免冲突
// createVersionTable()
router.get('/treeData', async (req, res) => {
    try {
        const bookId = req.query.bookId ? parseInt(req.query.bookId) : undefined;
        const treeData = await getTreeData(bookId);
        res.json({
            success: true,
            data: treeData,
        });
    }
    catch (error) {
        console.error('获取树形数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取树形数据失败',
        });
    }
});
router.post('/saveChapter', async (req, res) => {
    const { id, content, vid, title, order } = req.body;
    try {
        await saveChapterContent(id, content, vid, title, order);
        res.json({
            success: true,
            message: '保存成功',
        });
    }
    catch (error) {
        console.error('保存章节错误:', error);
        res.status(500).json({
            success: false,
            message: '保存章节失败',
        });
    }
});
router.get('/getChapter/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await getChapterContent(Number(id));
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error('获取章节错误:', error);
        res.status(500).json({
            success: false,
            message: '获取章节失败',
        });
    }
});
router.get('/chapters', async (req, res) => {
    try {
        const chapters = await getAllChapters();
        res.json({
            success: true,
            data: chapters,
        });
    }
    catch (error) {
        console.error('获取章节列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取章节列表失败',
        });
    }
});
router.post('/saveVolume', async (req, res) => {
    const { title, order, bookId } = req.body;
    try {
        const result = await saveVolume(title, order, bookId);
        const savedVolume = await getVolume(result.lastID);
        res.json({
            success: true,
            message: '保存分卷成功',
            data: savedVolume,
        });
    }
    catch (error) {
        console.error('保存分卷错误:', error);
        res.status(500).json({
            success: false,
            message: '保存分卷失败',
        });
    }
});
router.post('/createChapter', async (req, res) => {
    const { content, vid, title, order } = req.body;
    try {
        const result = await createChapter(content, vid, title, order);
        res.json({
            success: true,
            message: '创建章节成功',
            data: result,
        });
    }
    catch (error) {
        console.error('创建章节错误:', error);
        res.status(500).json({
            success: false,
            message: '创建章节失败',
        });
    }
});
// === 版本管理相关 API ===
// 创建章节版本
router.post('/chapters/:chapterId/versions', async (req, res) => {
    try {
        const chapterId = parseInt(req.params.chapterId);
        const { content_html, source, label, is_snapshot, author_id } = req.body;
        if (!chapterId || isNaN(chapterId)) {
            res.status(400).json({
                success: false,
                message: '无效的章节ID',
            });
            return;
        }
        if (!content_html) {
            res.status(400).json({
                success: false,
                message: '内容不能为空',
            });
            return;
        }
        const version = await createVersion(chapterId, content_html, source || 'manual', label, is_snapshot || false, author_id || 1);
        res.status(201).json({
            success: true,
            message: '版本创建成功',
            data: {
                id: version.id,
                chapterId: version.chapterId,
                versionSeq: version.versionSeq,
                contentHtml: version.contentHtml,
                contentText: version.contentText,
                wordCount: version.wordCount,
                isSnapshot: version.isSnapshot,
                source: version.source,
                label: version.label,
                isPinned: version.isPinned,
                createdAt: version.createdAt,
            },
        });
    }
    catch (error) {
        console.error('创建版本错误:', error);
        res.status(500).json({
            success: false,
            message: '创建版本失败',
        });
    }
});
// 获取章节版本列表
router.get('/chapters/:chapterId/versions', async (req, res) => {
    try {
        const chapterId = parseInt(req.params.chapterId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const source = req.query.source;
        if (!chapterId || isNaN(chapterId)) {
            res.status(400).json({
                success: false,
                message: '无效的章节ID',
            });
            return;
        }
        const { versions, total } = await getChapterVersions(chapterId, page, limit, source);
        const totalPages = Math.ceil(total / limit);
        res.json({
            success: true,
            data: {
                versions: versions.map(v => ({
                    id: v.id,
                    chapterId: v.chapterId,
                    versionSeq: v.versionSeq,
                    wordCount: v.wordCount,
                    isSnapshot: v.isSnapshot,
                    source: v.source,
                    label: v.label,
                    isPinned: v.isPinned,
                    createdAt: v.createdAt,
                    authorId: v.authorId,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
        });
    }
    catch (error) {
        console.error('获取版本列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取版本列表失败',
        });
    }
});
// 置顶/取消置顶版本
router.post('/chapters/:chapterId/versions/:versionId/pin', async (req, res) => {
    try {
        const chapterId = parseInt(req.params.chapterId);
        const versionId = parseInt(req.params.versionId);
        const { pinned } = req.body;
        if (!chapterId || isNaN(chapterId) || !versionId || isNaN(versionId)) {
            res.status(400).json({
                success: false,
                message: '无效的章节ID或版本ID',
            });
            return;
        }
        if (typeof pinned !== 'boolean') {
            res.status(400).json({
                success: false,
                message: 'pinned 参数必须是布尔值',
            });
            return;
        }
        const version = await togglePinVersion(chapterId, versionId, pinned);
        res.json({
            success: true,
            message: `版本${pinned ? '置顶' : '取消置顶'}成功`,
            data: {
                id: version.id,
                chapterId: version.chapterId,
                isPinned: version.isPinned,
            },
        });
    }
    catch (error) {
        console.error('切换版本置顶状态错误:', error);
        res.status(500).json({
            success: false,
            message: '操作失败',
        });
    }
});
// 删除版本
router.delete('/chapters/:chapterId/versions/:versionId', async (req, res) => {
    try {
        const chapterId = parseInt(req.params.chapterId);
        const versionId = parseInt(req.params.versionId);
        if (!chapterId || isNaN(chapterId) || !versionId || isNaN(versionId)) {
            res.status(400).json({
                success: false,
                message: '无效的章节ID或版本ID',
            });
            return;
        }
        await deleteVersion(chapterId, versionId);
        res.json({
            success: true,
            message: '版本删除成功',
        });
    }
    catch (error) {
        console.error('删除版本错误:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '删除版本失败',
        });
    }
});
// 回退到指定版本
router.post('/chapters/:chapterId/revert', async (req, res) => {
    try {
        const chapterId = parseInt(req.params.chapterId);
        const { toVersionId, label, author_id } = req.body;
        if (!chapterId || isNaN(chapterId) || !toVersionId || isNaN(toVersionId)) {
            res.status(400).json({
                success: false,
                message: '无效的章节ID或目标版本ID',
            });
            return;
        }
        const { newVersion, revertedVersion } = await revertToVersion(chapterId, toVersionId, author_id || 1);
        res.json({
            success: true,
            message: '版本回退成功',
            data: {
                chapterId: newVersion.chapterId,
                revertedToVersionId: revertedVersion.id,
                newVersionId: newVersion.id,
                content: newVersion.contentHtml,
            },
        });
    }
    catch (error) {
        console.error('回退版本错误:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '回退版本失败',
        });
    }
});
export default router;
