"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// src/config/db.ts
const sqlite3_1 = require("sqlite3");
const sqlite_1 = require("sqlite");
const connectDB = async () => {
    const db = await (0, sqlite_1.open)({
        filename: './database.sqlite',
        driver: sqlite3_1.default.Database,
    });
    return db;
};
// 数据库配置
exports.config = {
    database: './database.sqlite'
};
exports.default = connectDB;
