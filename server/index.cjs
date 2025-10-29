const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 8080;

// 数据库连接
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('SQLite数据库连接成功');
    initDatabase();
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 初始化数据库表
function initDatabase() {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 草稿表
  db.run(`
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // 分卷表
  db.run(`
    CREATE TABLE IF NOT EXISTS volumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      book_id INTEGER,
      order_index INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 章节表
  db.run(`
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      volume_id INTEGER,
      order_index INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (volume_id) REFERENCES volumes (id)
    )
  `);

  console.log('数据库表初始化完成');
}

// === 用户认证路由 ===

// 用户注册
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // 数据验证
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '请填写所有字段'
      });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: '用户名至少需要3个字符'
      });
    }

    if (password.length < 6) {
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

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: '密码必须包含字母和数字'
      });
    }

    // 检查用户名是否已存在
    db.get('SELECT id FROM users WHERE username = ?', [username.trim()], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '服务器错误'
        });
      }

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '用户名已存在'
        });
      }

      // 密码加密
      const hashedPassword = await bcrypt.hash(password, 12);

      // 插入新用户
      db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username.trim(), hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: '注册失败'
            });
          }

          const newUserId = this.lastID;

          // 获取新注册的用户信息
          db.get(
            'SELECT id, username, created_at FROM users WHERE id = ?',
            [newUserId],
            (err, newUser) => {
              if (err) {
                console.error('获取用户信息错误:', err);
                return res.status(500).json({
                  success: false,
                  message: '注册成功但获取用户信息失败'
                });
              }

              if (!newUser) {
                console.error('未找到新注册的用户，ID:', newUserId);
                return res.status(500).json({
                  success: false,
                  message: '注册成功但用户信息创建失败'
                });
              }

              console.log('新用户注册成功:', newUser);
              res.status(201).json({
                success: true,
                message: '注册成功',
                data: {
                  user: newUser,
                  token: 'mock-token-' + Date.now()
                }
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入用户名和密码'
      });
    }

    // 查找用户
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username.trim()],
      async (err, user) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: '服务器错误'
          });
        }

        if (!user) {
          return res.status(401).json({
            success: false,
            message: '用户名或密码错误'
          });
        }

        // 验证密码
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
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
            token: 'mock-token-' + Date.now()
          }
        });
      }
    );
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 获取用户信息
app.get('/api/profile', (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: '用户ID不能为空'
    });
  }

  db.get(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '服务器错误'
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    }
  );
});

// 更新用户信息
app.put('/api/profile', (req, res) => {
  const { userId, updates } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: '用户ID不能为空'
    });
  }

  const allowedFields = ['email'];
  const updateFields = [];
  const updateValues = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      message: '没有有效的更新字段'
    });
  }

  updateValues.push(userId);

  db.run(
    `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    updateValues,
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '更新失败'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        message: '更新成功'
      });
    }
  );
});

// === 写作相关路由 ===

// 获取所有草稿
app.get('/api/allDraft', (req, res) => {
  db.all(
    'SELECT id, bookName, fontCount, src FROM drafts ORDER BY id DESC',
    (err, drafts) => {
      if (err) {
        console.error('获取草稿失败:', err);
        return res.status(500).json({
          success: false,
          message: '获取草稿失败'
        });
      }

      res.json({
        success: true,
        data: drafts || []
      });
    }
  );
});

// 创建草稿
app.post('/api/createDraft', (req, res) => {
  const { bookName, fontCount, src } = req.body;

  if (!bookName) {
    return res.status(400).json({
      success: false,
      message: '草稿名称不能为空'
    });
  }

  db.run(
    'INSERT INTO drafts (bookName, fontCount, src) VALUES (?, ?, ?)',
    [
      bookName,
      fontCount || 0,
      src || './allBooks/bookList/bookTemplate1.png'
    ],
    function(err) {
      if (err) {
        console.error('创建草稿失败:', err);
        return res.status(500).json({
          success: false,
          message: '创建草稿失败'
        });
      }

      res.status(201).json({
        success: true,
        message: '草稿创建成功',
        data: { id: this.lastID }
      });
    }
  );
});

// 创建作品（书籍）
app.post('/api/createBook', (req, res) => {
  const { bookName, fontCount, src } = req.body;

  if (!bookName) {
    return res.status(400).json({
      success: false,
      message: '作品名称不能为空'
    });
  }

  db.run(
    'INSERT INTO drafts (bookName, fontCount, src) VALUES (?, ?, ?)',
    [
      bookName || '新作品',
      fontCount || 0,
      src || './allBooks/bookList/bookTemplate1.png'
    ],
    function(err) {
      if (err) {
        console.error('创建作品失败:', err);
        return res.status(500).json({
          success: false,
          message: '创建作品失败'
        });
      }

      const createdBook = {
        id: this.lastID,
        bookName: bookName || '新作品',
        fontCount: fontCount || 0,
        src: src || './allBooks/bookList/bookTemplate1.png'
      };

      res.status(201).json({
        success: true,
        message: '作品创建成功',
        data: createdBook
      });
    }
  );
});

// 获取树形数据
app.get('/api/treeData', (req, res) => {
  // 获取所有分卷和章节，构建树形数据结构
  db.all('SELECT * FROM Volumes ORDER BY `order`', (err, volumes) => {
    if (err) {
      console.error('获取分卷数据失败:', err);
      return res.status(500).json({
        success: false,
        message: '获取树形数据失败'
      });
    }

    // 为每个分卷获取章节
    const promises = volumes.map(volume => {
      return new Promise((resolve) => {
        db.all(
          'SELECT * FROM Chapters WHERE volume_id = ? ORDER BY `order`',
          [volume.id],
          (err, chapters) => {
            if (err) {
              console.error('获取章节数据失败:', err);
              resolve([]);
            } else {
              const chapterNodes = chapters.map(chapter => ({
                id: chapter.id,
                title: chapter.title,
                type: 'chapter',
                order: chapter['order'],
                vid: chapter.volume_id,
                key: chapter.id,
                label: chapter.title
              }));
              resolve(chapterNodes);
            }
          }
        );
      });
    });

    Promise.all(promises).then(allChapters => {
      const treeData = volumes.map((volume, index) => ({
        id: volume.id,
        title: volume.title,
        type: 'volume',
        order: volume['order'],
        key: volume.id,
        label: volume.title,
        children: allChapters[index] || []
      }));

      res.json({
        success: true,
        data: treeData
      });
    });
  });
});

// 保存章节
app.post('/api/saveChapter', (req, res) => {
  const { id, content, vid, title, order } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: '章节ID不能为空'
    });
  }

  // 更新章节内容
  db.run(
    'UPDATE Chapters SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [content || '', parseInt(id)],
    function(err) {
      if (err) {
        console.error('保存章节失败:', err);
        return res.status(500).json({
          success: false,
          message: '保存章节失败'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: '章节不存在'
        });
      }

      res.json({
        success: true,
        message: '章节保存成功'
      });
    }
  );
});

// 获取章节内容
app.get('/api/getChapter/:id', (req, res) => {
  const { id } = req.params;

  // 从数据库查询章节数据
  db.get(
    'SELECT * FROM Chapters WHERE id = ?',
    [parseInt(id)],
    (err, chapter) => {
      if (err) {
        console.error('获取章节内容失败:', err);
        return res.status(500).json({
          success: false,
          message: '获取章节内容失败'
        });
      }

      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: '章节不存在'
        });
      }

      res.json({
        success: true,
        data: {
          id: chapter.id,
          title: chapter.title,
          content: chapter.content || '',
          volume_id: chapter.volume_id,
          order_index: chapter['order'],
          created_at: chapter.created_at,
          updated_at: chapter.updated_at
        }
      });
    }
  );
});

// 保存分卷
app.post('/api/saveVolume', (req, res) => {
  const { title, order, bookId } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: '分卷标题不能为空'
    });
  }

  db.run(
    'INSERT INTO volumes (title, book_id, order_index) VALUES (?, ?, ?)',
    [title, bookId || 1, order || 1],
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '保存分卷失败'
        });
      }

      const savedVolume = {
        id: this.lastID,
        title,
        book_id: bookId || 1,
        order_index: order || 1
      };

      res.json({
        success: true,
        message: '分卷保存成功',
        data: savedVolume
      });
    }
  );
});

// 创建章节
app.post('/api/createChapter', (req, res) => {
  const { content, vid, title, order } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: '章节标题不能为空'
    });
  }

  db.run(
    'INSERT INTO chapters (title, content, volume_id, order_index) VALUES (?, ?, ?, ?)',
    [title, content || '', vid || 1, order || 1],
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '创建章节失败'
        });
      }

      const createdChapter = {
        id: this.lastID,
        title,
        content: content || '',
        volume_id: vid || 1,
        order_index: order || 1
      };

      res.json({
        success: true,
        message: '章节创建成功',
        data: createdChapter
      });
    }
  );
});

// 获取所有章节
app.get('/api/chapters', (req, res) => {
  db.all('SELECT * FROM Chapters ORDER BY volume_id, `order`', (err, chapters) => {
    if (err) {
      console.error('获取所有章节失败:', err);
      return res.status(500).json({
        success: false,
        message: '获取所有章节失败'
      });
    }

    const formattedChapters = chapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      content: chapter.content || '',
      volumeId: chapter.volume_id,
      order: chapter['order'],
      created_at: chapter.created_at,
      updated_at: chapter.updated_at
    }));

    res.json({
      success: true,
      data: formattedChapters
    });
  });
});

// 文件上传接口
app.post('/api/upload', (req, res) => {
  // 注意：这是一个简单的文件上传实现
  // 在实际项目中，您需要使用 multer 或类似的中间件来处理文件上传
  res.json({
    success: true,
    message: '文件上传成功',
    data: {
      url: `/uploads/${Date.now()}-image.jpg` // 返回一个模拟的文件URL
    }
  });
});

// 根路由
app.get('/', (req, res) => {
  res.send('kekeYueDu API Server is running!');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 kekeYueDu 服务器运行在 http://localhost:${PORT}`);
  console.log('📚 API 端点已就绪');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接时出错:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(0);
  });
});