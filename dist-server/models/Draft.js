"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDrafts = exports.createDraftTable = void 0;
// src/models/User.ts
const db_1 = require("../config/db");
// const createUserTable = async () => {
//   const db = await connectDB()
//   await db.exec(`
//     CREATE TABLE IF NOT EXISTS users (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       username TEXT UNIQUE,
//       password TEXT
//     )
//   `)
// }
// const registerUser = async (username: string, password: string) => {
//   const db = await connectDB()
//   await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [
//     username,
//     password,
//   ])
// }
// 书籍模板数据
const bookTemplates = [
    {
        bookName: '虽随便白色大是大非快疯了分开了开放；群里看到',
        fontCount: 1,
        src: './allBooks/bookList/bookTemplate1.png',
    },
    {
        bookName: 'asdasasdasd',
        fontCount: 2,
        src: './allBooks/bookList/bookTemplate2.png',
    },
    {
        bookName: '3333333',
        fontCount: 3.5,
        src: './allBooks/bookList/bookTemplate3.png',
    },
    {
        bookName: '奥萨达实打实的',
        fontCount: 0.5,
        src: './allBooks/bookList/bookTemplate4.png',
    },
    {
        bookName: '奥萨达',
        fontCount: 1.6,
        src: './allBooks/bookList/bookTemplate1.png',
    },
    {
        bookName: '爱上打扫打扫打扫大',
        fontCount: 5.5,
        src: './allBooks/bookList/bookTemplate2.png',
    },
];
// 初始化草稿表
const initDraftTable = async (db) => {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookName TEXT NOT NULL,
        fontCount REAL NOT NULL,
        src TEXT NOT NULL
      )
    `);
    // 插入书籍模板数据
    for (const template of bookTemplates) {
        await db.run('INSERT INTO drafts (bookName, fontCount, src) VALUES (?, ?, ?)', [template.bookName, template.fontCount, template.src]);
    }
};
// 查询所有草稿数据
const getAllDrafts = async () => {
    const db = await (0, db_1.default)();
    const drafts = await db.all('SELECT * FROM drafts');
    return drafts;
};
exports.getAllDrafts = getAllDrafts;
// 主函数
const createDraftTable = async () => {
    const db = await (0, db_1.default)();
    // 检查草稿表是否存在
    const result = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='drafts'");
    if (!result) {
        // 表不存在，初始化
        await initDraftTable(db);
        console.log('草稿表已初始化并插入数据');
    }
    else {
        console.log('草稿表已存在');
    }
    await db.close();
};
exports.createDraftTable = createDraftTable;
