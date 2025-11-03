"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.deleteUser = exports.updateUser = exports.findUserById = exports.findUserByUsername = exports.registerUser = exports.createUserTable = void 0;
// src/models/User.ts
const db_1 = require("../config/db");
const bcryptjs_1 = require("bcryptjs");
// 创建用户表
const createUserTable = async () => {
    const db = await (0, db_1.default)();
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
  `);
};
exports.createUserTable = createUserTable;
// 用户注册
const registerUser = async (username, password, email) => {
    const db = await (0, db_1.default)();
    // 哈希密码
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const result = await db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email || null]);
    return result.lastID;
};
exports.registerUser = registerUser;
// 根据用户名查找用户
const findUserByUsername = async (username) => {
    const db = await (0, db_1.default)();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    return user || null;
};
exports.findUserByUsername = findUserByUsername;
// 根据ID查找用户
const findUserById = async (id) => {
    const db = await (0, db_1.default)();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    return user || null;
};
exports.findUserById = findUserById;
// 更新用户信息
const updateUser = async (id, updates) => {
    const db = await (0, db_1.default)();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const result = await db.run(`UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
    return result.changes > 0;
};
exports.updateUser = updateUser;
// 删除用户
const deleteUser = async (id) => {
    const db = await (0, db_1.default)();
    const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
    return result.changes > 0;
};
exports.deleteUser = deleteUser;
// 验证用户密码
const validatePassword = async (username, password) => {
    const user = await findUserByUsername(username);
    if (!user)
        return null;
    // 使用 bcrypt 验证密码
    const isValid = await bcryptjs_1.default.compare(password, user.password);
    return isValid ? user : null;
};
exports.validatePassword = validatePassword;
