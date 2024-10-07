// src/models/User.ts
import connectDB from '../config/db'

const createUserTable = async () => {
  const db = await connectDB()
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `)
}

const registerUser = async (username: string, password: string) => {
  const db = await connectDB()
  await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [
    username,
    password,
  ])
}

export { createUserTable, registerUser }
