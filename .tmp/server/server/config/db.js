// src/config/db.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
const connectDB = async () => {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database,
    });
    return db;
};
// 数据库配置
export const config = {
    database: './database.sqlite',
};
export default connectDB;
