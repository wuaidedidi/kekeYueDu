import express from 'express';
import { getChapterContent, getAllChapters, saveChapterContent, createChapter, } from '../models/Chapter.js';
import { createVersion, getChapterVersions, } from '../models/Version.js';
const router = express.Router();
// 获取单个章节
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const chapterId = parseInt(id);
        if (isNaN(chapterId)) {
            return res.status(400).json({
                success: false,
                message: '无效的章节ID'
            });
        }
        const content = await getChapterContent(chapterId);
        if (content === '') {
            return res.status(404).json({
                success: false,
                message: '章节不存在'
            });
        }
        res.json({
            success: true,
            data: {
                id: chapterId,
                content
            }
        });
    }
    catch (error) {
        console.error('获取章节失败:', error);
        res.status(500).json({
            success: false,
            message: '获取章节失败'
        });
    }
});
// 获取所有章节
router.get('/', async (req, res) => {
    try {
        const chapters = await getAllChapters();
        res.json({
            success: true,
            data: chapters
        });
    }
    catch (error) {
        console.error('获取章节列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取章节列表失败'
        });
    }
});
// 保存章节内容
router.post('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, vid, title, order } = req.body;
        const chapterId = parseInt(id);
        if (isNaN(chapterId)) {
            return res.status(400).json({
                success: false,
                message: '无效的章节ID'
            });
        }
        await saveChapterContent(chapterId, content, vid, title, order);
        res.json({
            success: true,
            message: '章节保存成功'
        });
    }
    catch (error) {
        console.error('保存章节失败:', error);
        res.status(500).json({
            success: false,
            message: '保存章节失败'
        });
    }
});
// 创建新章节
router.post('/', async (req, res) => {
    try {
        const { content, vid, title, order } = req.body;
        if (!vid || !title) {
            return res.status(400).json({
                success: false,
                message: '卷ID和标题不能为空'
            });
        }
        const result = await createChapter(content || '', vid, title, order || 0);
        res.json({
            success: true,
            message: '章节创建成功',
            data: {
                id: result.lastID
            }
        });
    }
    catch (error) {
        console.error('创建章节失败:', error);
        res.status(500).json({
            success: false,
            message: '创建章节失败'
        });
    }
});
// 获取章节版本列表
router.get('/:id/versions', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const chapterId = parseInt(id);
        if (isNaN(chapterId)) {
            return res.status(400).json({
                success: false,
                message: '无效的章节ID'
            });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const result = await getChapterVersions(chapterId, pageNum, limitNum);
        res.json({
            success: true,
            data: {
                versions: result.versions,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limitNum)
                }
            }
        });
    }
    catch (error) {
        console.error('获取版本列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取版本列表失败'
        });
    }
});
// 创建章节版本
router.post('/:id/versions', async (req, res) => {
    try {
        const { id } = req.params;
        const { contentHtml, source = 'manual', label, isSnapshot = false, authorId = 1 } = req.body;
        const chapterId = parseInt(id);
        if (isNaN(chapterId)) {
            return res.status(400).json({
                success: false,
                message: '无效的章节ID'
            });
        }
        if (!contentHtml) {
            return res.status(400).json({
                success: false,
                message: '内容不能为空'
            });
        }
        const version = await createVersion(chapterId, contentHtml, source, label, isSnapshot, authorId);
        res.json({
            success: true,
            message: '版本创建成功',
            data: version
        });
    }
    catch (error) {
        console.error('创建版本失败:', error);
        res.status(500).json({
            success: false,
            message: '创建版本失败'
        });
    }
});
export default router;
