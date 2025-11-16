// src/models/User.ts
import connectDB from '../config/db.js';
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
    const db = await connectDB();
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
const getTreeData = async (bookId) => {
    const db = await connectDB();
    // 查询卷 - 如果有bookId则过滤
    let volumes;
    if (bookId) {
        volumes = await db.all('SELECT * FROM Volumes WHERE book_id = ? ORDER BY order_index', [bookId]);
    }
    else {
        volumes = await db.all('SELECT * FROM Volumes ORDER BY order_index');
    }
    // 查询所有章节
    const chapters = await db.all('SELECT * FROM Chapters ORDER BY `order`');
    // 创建一个卷的映射
    const volumeMap = {};
    let onlyOne = 1;
    // 填充卷的结构
    for (const volume of volumes) {
        // 使用卷的ID作为键来确保唯一性
        volumeMap[volume.id] = {
            label: volume.title,
            title: volume.title,
            id: volume.id,
            key: onlyOne++,
            vid: volume.id,
            type: 'volume',
            order: volume.order_index || 0,
            isVolumn: true,
            children: [],
        };
    }
    // 填充章节到对应的卷中
    for (const chapter of chapters) {
        if (volumeMap[chapter.volume_id]) {
            volumeMap[chapter.volume_id].children.push({
                label: chapter.title,
                title: chapter.title,
                id: chapter.id,
                key: onlyOne++,
                vid: chapter.volume_id,
                type: 'chapter',
                order: chapter.order,
                isVolumn: false,
            });
        }
    }
    // 返回树形结构数据，按order排序
    return Object.values(volumeMap).sort((a, b) => a.order - b.order);
};
// 保存章节内容的函数
const saveChapterContent = async (id, content, vid, title, order) => {
    try {
        const db = await connectDB();
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
// 保存章节内容的函数
const createChapter = async (content, vid, title, order) => {
    try {
        const db = await connectDB();
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
const getChapterContent = async (id) => {
    try {
        const db = await connectDB();
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
const getAllChapters = async () => {
    try {
        const db = await connectDB();
        // 查询指定章节的内容
        const chapters = await db.all('SELECT * FROM Chapters');
        return chapters;
    }
    catch (error) {
        console.error('获取全部章节内容出错:', error);
        return '';
    }
};
export { createChapterTable, getTreeData, saveChapterContent, getChapterContent, getAllChapters, createChapter, };
