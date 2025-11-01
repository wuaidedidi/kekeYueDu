const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'keke-dev-secret';
const CLIENT_ORIGIN = (process.env.VITE_DEV_SERVER_HOST && process.env.VITE_DEV_SERVER_PORT)
  ? `http://${process.env.VITE_DEV_SERVER_HOST}:${process.env.VITE_DEV_SERVER_PORT}`
  : undefined;

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
app.use(cors({
  origin: CLIENT_ORIGIN || true,
  credentials: true,
}));
app.use(express.json());

// JSON 解析错误统一处理，避免返回 HTML 错误页
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    console.error('JSON解析失败:', err);
    return res.status(400).json({ success: false, message: '请求体不是有效的 JSON' });
  }
  next(err);
});

// 静态资源：上传目录
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// 静态资源：公共目录（用于提供 allBooks 图片等）
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// multer 配置：保存到 uploads 目录
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: '令牌无效或已过期' });
  }
};

// 初始化数据库表
function initDatabase() {
  db.serialize(() => {
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
  });
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
        console.error('查询用户名是否存在时出错:', err);
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
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(password, 12);
      } catch (hashErr) {
        console.error('密码加密失败:', hashErr);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }

      // 插入新用户
      db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username.trim(), hashedPassword],
        function(err) {
          if (err) {
            console.error('插入新用户失败:', err);
            return res.status(500).json({
              success: false,
              message: '注册失败'
            });
          }

          const newUserId = this.lastID;
          const minimalUser = { id: newUserId, username: username.trim() };

          console.log('新用户注册成功:', minimalUser);
          const token = jwt.sign(
            { id: minimalUser.id, username: minimalUser.username },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          // 直接返回最小用户信息，避免因旧表缺少列导致查询失败
          res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
              user: minimalUser,
              token
            }
          });
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

        const token = jwt.sign(
          { id: userInfo.id, username: userInfo.username },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        res.json({
          success: true,
          message: '登录成功',
          data: {
            user: userInfo,
            token
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

// 获取用户信息（需认证）
app.get('/api/profile', authenticateToken, (req, res) => {
  const userId = req.query.userId || (req.user && req.user.id);

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: '用户ID不能为空'
    });
  }

  // 禁止越权更新：仅允许更新本人信息
  if (req.user && Number(userId) !== Number(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: '无权更新其他用户信息'
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

// 更新用户信息（需认证）
app.put('/api/profile', authenticateToken, (req, res) => {
  const { userId: bodyUserId, updates } = req.body;
  const userId = bodyUserId || (req.user && req.user.id);

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
      src || '/allBooks/bookList/bookTemplate1.png'
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
      src || '/allBooks/bookList/bookTemplate1.png'
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

// 根据ID获取单个章节
app.get('/api/chapters/:id', (req, res) => {
  const chapterId = req.params.id;

  db.get('SELECT * FROM chapters WHERE id = ?', [chapterId], (err, chapter) => {
    if (err) {
      console.error('获取章节失败:', err);
      return res.status(500).json({
        success: false,
        message: '获取章节失败'
      });
    }

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }

    const formattedChapter = {
      id: chapter.id,
      title: chapter.title,
      content: chapter.content || '',
      volumeId: chapter.volume_id,
      order: chapter['order'],
      created_at: chapter.created_at,
      updated_at: chapter.updated_at,
      current_version_id: chapter.current_version_id
    };

    res.json({
      success: true,
      data: formattedChapter
    });
  });
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

// 文件上传接口（需认证，使用 multer 处理）
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未接收到文件' });
    }

    const relativeUrl = `/uploads/${req.file.filename}`;
    const absoluteUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;
    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        url: absoluteUrl,
        relativeUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      }
    });
  } catch (err) {
    console.error('文件上传失败:', err);
    res.status(500).json({ success: false, message: '文件上传失败' });
  }
});

// ===== 历史版本管理 API =====

// 工具函数：从HTML提取纯文本
function extractTextFromHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// 工具函数：计算文本统计
function calculateTextStats(html) {
  if (!html) {
    return {
      wordCount: 0,
      charCount: 0,
      paragraphCount: 0
    };
  }

  // 提取纯文本
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  // 字数统计（中文字符和英文单词）
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const wordCount = chineseChars + englishWords;

  // 字符数统计
  const charCount = text.length;

  // 段落数统计
  const paragraphCount = text.split(/\n\n+/).filter(p => p.trim()).length;

  return {
    wordCount,
    charCount,
    paragraphCount
  };
}

// 工具函数：计算文本差异
function calculateDiff(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const diffs = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex];
    const newLine = newLines[newIndex];

    if (oldIndex >= oldLines.length) {
      // 新文本有额外的行
      diffs.push({ type: 'insert', value: newLine });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // 旧文本有额外的行
      diffs.push({ type: 'delete', value: oldLine });
      oldIndex++;
    } else if (oldLine === newLine) {
      // 相同行
      diffs.push({ type: 'equal', value: oldLine });
      oldIndex++;
      newIndex++;
    } else {
      // 不同行 - 简单处理
      diffs.push({ type: 'delete', value: oldLine });
      diffs.push({ type: 'insert', value: newLine });
      oldIndex++;
      newIndex++;
    }
  }

  return diffs;
}

// 创建新版本
app.post('/api/chapters/:id/versions', (req, res) => {
  try {
    const chapterId = req.params.id;
    const { content_html, source = 'auto', label = null, is_snapshot = false } = req.body;
    // 暂时使用固定用户ID用于开发测试
    const userId = 1;

    console.log('创建版本请求:', {
      chapterId,
      source,
      label,
      is_snapshot,
      contentLength: content_html?.length,
      content: content_html ? (content_html.length > 100 ? content_html.substring(0, 100) + '...' : content_html) : 'EMPTY',
      userId
    });

    if (!content_html) {
      console.log('错误: 章节内容为空');
      return res.status(400).json({ success: false, message: '章节内容不能为空' });
    }

    if (!content_html.trim()) {
      console.log('错误: 章节内容只包含空白字符');
      return res.status(400).json({ success: false, message: '章节内容不能为空' });
    }

    // 获取章节信息
    db.get('SELECT * FROM chapters WHERE id = ?', [chapterId], (err, chapter) => {
      if (err) {
        console.error('查询章节失败:', err);
        return res.status(500).json({ success: false, message: '查询章节失败' });
      }

      if (!chapter) {
        return res.status(404).json({ success: false, message: '章节不存在' });
      }

      // 获取当前最大版本号
      db.get(
        'SELECT MAX(version_seq) as max_seq FROM chapter_versions WHERE chapter_id = ?',
        [chapterId],
        (err, result) => {
          if (err) {
            console.error('查询版本号失败:', err);
            return res.status(500).json({ success: false, message: '查询版本号失败' });
          }

          const newVersionSeq = (result.max_seq || 0) + 1;
          const contentText = extractTextFromHtml(content_html);

          // 确定是否需要创建快照
          const shouldCreateSnapshot = is_snapshot || (newVersionSeq % 10 === 0);

          // 插入新版本
          db.run(
            `INSERT INTO chapter_versions
             (chapter_id, version_seq, content_html, content_text, is_snapshot, author_id, source, label, pinned)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [chapterId, newVersionSeq, content_html, contentText, shouldCreateSnapshot, userId, source, label, false],
            function(err) {
              if (err) {
                console.error('创建版本失败:', err);
                return res.status(500).json({ success: false, message: '创建版本失败' });
              }

              // 更新章节的当前版本ID
              db.run(
                'UPDATE chapters SET current_version_id = ? WHERE id = ?',
                [this.lastID, chapterId],
                (err) => {
                  if (err) {
                    console.error('更新章节当前版本失败:', err);
                    // 不返回错误，因为版本已创建成功
                  }
                }
              );

              // 返回创建的版本信息
              res.json({
                success: true,
                message: '版本创建成功',
                data: {
                  id: this.lastID,
                  chapterId: parseInt(chapterId),
                  versionSeq: newVersionSeq,
                  contentHtml: content_html,
                  contentText: contentText,
                  wordCount: contentText.length,
                  isSnapshot: shouldCreateSnapshot,
                  source: source,
                  label: label,
                  isPinned: false,
                  createdAt: new Date().toISOString()
                }
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('创建版本异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 获取章节版本列表
app.get('/api/chapters/:id/versions', authenticateToken, (req, res) => {
  try {
    const chapterId = req.params.id;
    const { page = 1, limit = 20, source } = req.query;
    const offset = (page - 1) * limit;

    // 验证章节存在
    db.get('SELECT id FROM chapters WHERE id = ?', [chapterId], (err, chapter) => {
      if (err) {
        console.error('查询章节失败:', err);
        return res.status(500).json({ success: false, message: '查询章节失败' });
      }

      if (!chapter) {
        return res.status(404).json({ success: false, message: '章节不存在' });
      }

      // 构建查询条件
      let whereClause = 'WHERE chapter_id = ?';
      let params = [chapterId];

      if (source) {
        whereClause += ' AND source = ?';
        params.push(source);
      }

      // 查询版本列表
      const query = `
        SELECT
          id, chapter_id, version_seq, content_text, is_snapshot,
          author_id, created_at, source, label, pinned,
          LENGTH(content_text) as word_count
        FROM chapter_versions
        ${whereClause}
        ORDER BY version_seq DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);

      db.all(query, params, (err, versions) => {
        if (err) {
          console.error('查询版本列表失败:', err);
          return res.status(500).json({ success: false, message: '查询版本列表失败' });
        }

        // 查询总数
        const countQuery = `SELECT COUNT(*) as total FROM chapter_versions ${whereClause}`;
        const countParams = [chapterId];
        if (source) countParams.push(source);

        db.get(countQuery, countParams, (err, countResult) => {
          if (err) {
            console.error('查询版本总数失败:', err);
            return res.status(500).json({ success: false, message: '查询版本总数失败' });
          }

          res.json({
            success: true,
            data: {
              versions: versions.map(v => ({
                id: v.id,
                chapterId: v.chapter_id,
                versionSeq: v.version_seq,
                wordCount: v.word_count,
                isSnapshot: Boolean(v.is_snapshot),
                source: v.source,
                label: v.label,
                isPinned: Boolean(v.pinned),
                createdAt: v.created_at,
                authorId: v.author_id
              })),
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / limit)
              }
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('获取版本列表异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 计算版本差异
app.get('/api/chapters/:id/diff', (req, res) => {
  try {
    const chapterId = req.params.id;
    const { baseVersionId, compareVersionId, format = 'json' } = req.query;

    if (!baseVersionId) {
      return res.status(400).json({ success: false, message: '缺少 baseVersionId 参数' });
    }

    // 验证章节存在
    db.get('SELECT id FROM chapters WHERE id = ?', [chapterId], (err, chapter) => {
      if (err) {
        console.error('查询章节失败:', err);
        return res.status(500).json({ success: false, message: '查询章节失败' });
      }

      if (!chapter) {
        return res.status(404).json({ success: false, message: '章节不存在' });
      }

      // 获取基础版本
      db.get(
        'SELECT * FROM chapter_versions WHERE id = ? AND chapter_id = ?',
        [baseVersionId, chapterId],
        (err, baseVersion) => {
          if (err) {
            console.error('查询基础版本失败:', err);
            return res.status(500).json({ success: false, message: '查询基础版本失败' });
          }

          if (!baseVersion) {
            return res.status(404).json({ success: false, message: '基础版本不存在' });
          }

          // 获取对比版本（如果未指定则使用当前章节内容）
          if (compareVersionId) {
            db.get(
              'SELECT * FROM chapter_versions WHERE id = ? AND chapter_id = ?',
              [compareVersionId, chapterId],
              (err, compareVersion) => {
                if (err) {
                  console.error('查询对比版本失败:', err);
                  return res.status(500).json({ success: false, message: '查询对比版本失败' });
                }

                if (!compareVersion) {
                  return res.status(404).json({ success: false, message: '对比版本不存在' });
                }

                generateDiff(baseVersion, compareVersion);
              }
            );
          } else {
            // 使用当前章节内容作为对比版本
            db.get(
              'SELECT content FROM chapters WHERE id = ?',
              [chapterId],
              (err, chapter) => {
                if (err) {
                  console.error('查询章节当前内容失败:', err);
                  return res.status(500).json({ success: false, message: '查询章节当前内容失败' });
                }

                const compareVersion = {
                  id: 'current',
                  content_text: extractTextFromHtml(chapter.content),
                  content_html: chapter.content
                };

                generateDiff(baseVersion, compareVersion);
              }
            );
          }

          function generateDiff(base, compare) {
            const diffs = calculateDiff(base.content_text, compare.content_text);

            // 计算统计信息
            let insertions = 0;
            let deletions = 0;

            diffs.forEach(diff => {
              if (diff.type === 'insert') {
                insertions += diff.value.length;
              } else if (diff.type === 'delete') {
                deletions += diff.value.length;
              }
            });

            const response = {
              success: true,
              data: {
                baseVersionId: parseInt(baseVersionId),
                compareVersionId: compare.id === 'current' ? 'current' : parseInt(compare.id),
                stats: {
                  insertions,
                  deletions
                },
                diffs: format === 'html' ? convertDiffsToHtml(diffs) : diffs
              }
            };

            res.json(response);
          }

          function convertDiffsToHtml(diffs) {
            return diffs.map(diff => {
              let className = '';
              let value = diff.value.replace(/\n/g, '<br>');

              switch (diff.type) {
                case 'insert':
                  className = 'diff-insert';
                  break;
                case 'delete':
                  className = 'diff-delete';
                  break;
                default:
                  className = 'diff-equal';
              }

              return `<span class="${className}">${value}</span>`;
            }).join('');
          }
        }
      );
    });
  } catch (error) {
    console.error('计算版本差异异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 置顶/取消置顶版本
app.post('/api/chapters/:id/versions/:versionId/pin', (req, res) => {
  try {
    const chapterId = req.params.id;
    const versionId = req.params.versionId;
    const { pinned = true } = req.body;

    db.run(
      'UPDATE chapter_versions SET pinned = ? WHERE id = ? AND chapter_id = ?',
      [pinned, versionId, chapterId],
      function(err) {
        if (err) {
          console.error('更新版本置顶状态失败:', err);
          return res.status(500).json({ success: false, message: '更新版本置顶状态失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ success: false, message: '版本不存在' });
        }

        res.json({
          success: true,
          message: pinned ? '版本已置顶' : '已取消置顶',
          data: {
            id: parseInt(versionId),
            chapterId: parseInt(chapterId),
            isPinned: Boolean(pinned)
          }
        });
      }
    );
  } catch (error) {
    console.error('置顶版本异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 删除版本
app.delete('/api/chapters/:id/versions/:versionId', (req, res) => {
  try {
    const chapterId = req.params.id;
    const versionId = req.params.versionId;
    const userId = req.user.id;

    // 验证权限并检查是否为置顶版本
    db.get(
      'SELECT * FROM chapter_versions WHERE id = ? AND chapter_id = ?',
      [versionId, chapterId],
      (err, version) => {
        if (err) {
          console.error('查询版本失败:', err);
          return res.status(500).json({ success: false, message: '查询版本失败' });
        }

        if (!version) {
          return res.status(404).json({ success: false, message: '版本不存在' });
        }

        if (version.pinned) {
          return res.status(400).json({ success: false, message: '不能删除置顶版本' });
        }

        // 检查是否为当前版本
        db.get(
          'SELECT current_version_id FROM chapters WHERE id = ?',
          [chapterId],
          (err, chapter) => {
            if (err) {
              console.error('查询章节失败:', err);
              return res.status(500).json({ success: false, message: '查询章节失败' });
            }

            if (chapter.current_version_id == versionId) {
              return res.status(400).json({ success: false, message: '不能删除当前版本' });
            }

            // 删除版本
            db.run(
              'DELETE FROM chapter_versions WHERE id = ? AND chapter_id = ?',
              [versionId, chapterId],
              function(err) {
                if (err) {
                  console.error('删除版本失败:', err);
                  return res.status(500).json({ success: false, message: '删除版本失败' });
                }

                res.json({
                  success: true,
                  message: '版本已删除',
                  data: {
                    id: parseInt(versionId),
                    chapterId: parseInt(chapterId)
                  }
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('删除版本异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 回退到指定版本
app.post('/api/chapters/:id/revert', (req, res) => {
  try {
    const chapterId = req.params.id;
    const { toVersionId, label = `回退到版本 ${toVersionId}` } = req.body;

    if (!toVersionId) {
      return res.status(400).json({ success: false, message: '缺少 toVersionId 参数' });
    }

    // 获取目标版本
    db.get(
      'SELECT * FROM chapter_versions WHERE id = ? AND chapter_id = ?',
      [toVersionId, chapterId],
      (err, targetVersion) => {
        if (err) {
          console.error('查询目标版本失败:', err);
          return res.status(500).json({ success: false, message: '查询目标版本失败' });
        }

        if (!targetVersion) {
          return res.status(404).json({ success: false, message: '目标版本不存在' });
        }

        // 更新章节内容
        db.run(
          'UPDATE chapters SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [targetVersion.content_html, chapterId],
          function(err) {
            if (err) {
              console.error('更新章节内容失败:', err);
              return res.status(500).json({ success: false, message: '更新章节内容失败' });
            }

            // 创建新的版本记录（记录回退操作）
            db.run(
              `INSERT INTO chapter_versions
               (chapter_id, version_seq, content_html, content_text, is_snapshot, author_id, source, label, pinned)
               SELECT chapter_id,
                      (SELECT MAX(version_seq) FROM chapter_versions WHERE chapter_id = ?) + 1,
                      content_html, content_text, 1, ?, 'revert', ?, 0
               FROM chapter_versions WHERE id = ?`,
              [chapterId, 1, label, toVersionId], // 暂时使用固定用户ID
              function(err) {
                if (err) {
                  console.error('创建回退版本记录失败:', err);
                  // 不影响主要功能，继续返回成功
                }

                // 更新章节的当前版本ID
                db.run(
                  'UPDATE chapters SET current_version_id = ? WHERE id = ?',
                  [this.lastID, chapterId],
                  (err) => {
                    if (err) {
                      console.error('更新章节当前版本失败:', err);
                    }
                  }
                );

                res.json({
                  success: true,
                  message: '已成功回退到指定版本',
                  data: {
                    chapterId: parseInt(chapterId),
                    revertedToVersionId: parseInt(toVersionId),
                    newVersionId: this.lastID,
                    content: targetVersion.content_html
                  }
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('回退版本异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 获取版本详细内容
app.get('/api/chapters/:id/versions/:versionId', (req, res) => {
  try {
    const chapterId = req.params.id;
    const versionId = req.params.versionId;

    // 验证章节存在
    db.get('SELECT id FROM chapters WHERE id = ?', [chapterId], (err, chapter) => {
      if (err) {
        console.error('查询章节失败:', err);
        return res.status(500).json({ success: false, message: '查询章节失败' });
      }

      if (!chapter) {
        return res.status(404).json({ success: false, message: '章节不存在' });
      }

      // 获取版本详细信息
      db.get(
        `SELECT
          cv.*,
          c.title as chapter_title
        FROM chapter_versions cv
        JOIN chapters c ON cv.chapter_id = c.id
        WHERE cv.id = ? AND cv.chapter_id = ?`,
        [versionId, chapterId],
        (err, version) => {
          if (err) {
            console.error('查询版本失败:', err);
            return res.status(500).json({ success: false, message: '查询版本失败' });
          }

          if (!version) {
            return res.status(404).json({ success: false, message: '版本不存在' });
          }

          // 计算文本统计
          const textStats = calculateTextStats(version.content_html);

          res.json({
            success: true,
            data: {
              id: version.id,
              chapterId: version.chapter_id,
              versionSeq: version.version_seq,
              contentHtml: version.content_html,
              contentText: version.content_text,
              isSnapshot: version.is_snapshot,
              isPinned: version.pinned,
              source: version.source,
              label: version.label,
              createdAt: version.created_at,
              ...textStats
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('获取版本内容异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
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