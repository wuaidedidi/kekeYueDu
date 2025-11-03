"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChapter = exports.getAllChapters = exports.getChapterContent = exports.saveChapterContent = exports.getTreeData = exports.createChapterTable = void 0;
// src/models/User.ts
const db_1 = require("../config/db");
// 初始化草稿表
const initChapterTable = async (db) => {
    // 创建 Chapters 表
    await db.exec(`
    CREATE TABLE IF NOT EXISTS Chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volume_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      \`order\` INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (volume_id) REFERENCES Volumes(id) ON DELETE CASCADE
    );
  `);
    // 插入默认数据
    const chapters = [
        { volume_id: 1, title: '第一章', content: '这是第一章的内容', order: 1 },
        { volume_id: 1, title: '第二章', content: '这是第二章的内容', order: 2 },
        { volume_id: 2, title: '第三章', content: '这是第三章的内容', order: 1 },
    ];
    // 插入默认章节
    for (const chapter of chapters) {
        await db.run('INSERT INTO Chapters (volume_id, title, content, `order`) VALUES (?, ?, ?, ?)', [chapter.volume_id, chapter.title, chapter.content, chapter.order]);
    }
};
// 主函数
const createChapterTable = async () => {
    const db = await (0, db_1.default)();
    // 检查草稿表是否存在
    const result = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Chapters'");
    if (!result) {
        // 表不存在，初始化
        await initChapterTable(db);
        console.log('卷表已初始化并插入数据');
    }
    else {
        console.log('卷表已存在');
    }
    await db.close();
};
exports.createChapterTable = createChapterTable;
const getTreeData = async () => {
    const db = await (0, db_1.default)();
    // 查询所有卷
    const volumes = await db.all('SELECT * FROM Volumes');
    // 查询所有章节
    const chapters = await db.all('SELECT * FROM Chapters');
    // 创建一个卷的映射
    const volumeMap = {};
    let onlyOne = 1;
    // 填充卷的结构
    for (const volume of volumes) {
        // 使用卷的标题作为键来确保唯一性
        if (!volumeMap[volume.title]) {
            volumeMap[volume.title] = {
                label: volume.title,
                children: [],
                $treeNodeId: volume.id, // 假设有一个 ID 属性
                key: onlyOne++,
                id: volume.id,
            };
        }
    }
    // 填充章节到对应的卷中
    for (const chapter of chapters) {
        const volumeKey = volumes.find((v) => v.id === chapter.volume_id)?.title;
        if (volumeKey && volumeMap[volumeKey]) {
            volumeMap[volumeKey].children.push({
                label: chapter.title,
                id: chapter.id,
                vid: chapter.volume_id,
                title: chapter.title,
                order: chapter.order,
                key: onlyOne++,
            });
        }
    }
    // 返回树形结构数据
    return Object.values(volumeMap);
};
exports.getTreeData = getTreeData;
// 保存章节内容的函数
const saveChapterContent = async (id, content, vid, title, order) => {
    try {
        const db = await (0, db_1.default)();
        // console.log(id + '=========' + content)
        await db.run(`
      INSERT INTO Chapters  (id, content,volume_id,title,\`order\`) 
      VALUES (?, ?,?,?,?) 
      ON CONFLICT(id) DO UPDATE SET content = excluded.content;`, [id, content, vid, title, order]);
        await db.close();
    }
    catch (error) {
        console.log('保存章节的时候出错', error);
    }
};
exports.saveChapterContent = saveChapterContent;
// 保存章节内容的函数
const createChapter = async (content, vid, title, order) => {
    try {
        const db = await (0, db_1.default)();
        // console.log(id + '=========' + content)
        const result = await db.run(`
      INSERT INTO Chapters  ( content,volume_id,title,\`order\`) 
      VALUES ( ?,?,?,?) `, [content, vid, title, order]);
        await db.close();
        return result;
    }
    catch (error) {
        console.log('保存章节的时候出错', error);
    }
};
exports.createChapter = createChapter;
const getChapterContent = async (id) => {
    try {
        const db = await (0, db_1.default)();
        // 查询指定章节的内容
        const chapter = await db.get('SELECT content FROM Chapters WHERE id = ?', [
            id,
        ]);
        await db.close();
        // 返回章节内容，如果没有找到，返回空字符串
        return chapter ? chapter.content : '';
    }
    catch (error) {
        console.error('获取章节内容时出错:', error);
        return '';
    }
};
exports.getChapterContent = getChapterContent;
const getAllChapters = async () => {
    try {
        const db = await (0, db_1.default)();
        // 查询指定章节的内容
        const chapters = await db.all('SELECT * FROM Chapters');
        return chapters;
    }
    catch (error) {
        console.error('获取全部章节内容出错:', error);
        return '';
    }
};
exports.getAllChapters = getAllChapters;
