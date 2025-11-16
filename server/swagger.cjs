const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'kekeYueDu API Documentation',
      version: '1.0.0',
      description: 'kekeYueDu 阅读写作平台的后端API文档',
      contact: {
        name: 'API Support',
        email: 'support@kekeyuedu.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://api.kekeyuedu.com'
          : `http://localhost:${process.env.PORT || 7777}`,
        description: process.env.NODE_ENV === 'production'
          ? 'Production Server'
          : 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT访问令牌'
        }
      },
      schemas: {
        // 用户相关模型
        User: {
          type: 'object',
          required: ['id', 'username'],
          properties: {
            id: {
              type: 'integer',
              description: '用户ID',
              example: 1
            },
            username: {
              type: 'string',
              description: '用户名',
              example: 'testuser'
            },
            email: {
              type: 'string',
              description: '邮箱地址',
              example: 'test@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: '用户角色',
              example: 'user'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '更新时间'
            }
          }
        },
        // 认证相关模型
        AuthRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: '用户名',
              example: 'testuser'
            },
            password: {
              type: 'string',
              description: '密码',
              example: 'password123'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'password', 'confirmPassword'],
          properties: {
            username: {
              type: 'string',
              description: '用户名（3-20个字符）',
              example: 'testuser'
            },
            password: {
              type: 'string',
              description: '密码（至少6个字符，包含字母和数字）',
              example: 'password123'
            },
            confirmPassword: {
              type: 'string',
              description: '确认密码',
              example: 'password123'
            },
            email: {
              type: 'string',
              description: '邮箱地址（可选）',
              example: 'test@example.com'
            }
          }
        },
        // API响应模型
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '请求是否成功',
              example: true
            },
            message: {
              type: 'string',
              description: '响应消息',
              example: '操作成功'
            },
            data: {
              type: 'object',
              description: '响应数据'
            }
          }
        },
        AuthResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    user: {
                      $ref: '#/components/schemas/User'
                    },
                    token: {
                      type: 'string',
                      description: 'JWT访问令牌',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                    }
                  }
                }
              }
            }
          ]
        },
        // 分页参数
        PaginationParams: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: '页码（从1开始）',
              example: 1
            },
            pageSize: {
              type: 'integer',
              description: '每页数量（1-100）',
              example: 20
            }
          }
        },
        // 评论模型
        Comment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '评论ID'
            },
            book_id: {
              type: 'integer',
              description: '书籍ID'
            },
            chapter_id: {
              type: 'integer',
              description: '章节ID'
            },
            user_id: {
              type: 'integer',
              description: '用户ID'
            },
            nickname: {
              type: 'string',
              description: '用户昵称'
            },
            content_html: {
              type: 'string',
              description: 'HTML格式的评论内容'
            },
            content_text: {
              type: 'string',
              description: '纯文本格式的评论内容'
            },
            is_read: {
              type: 'boolean',
              description: '是否已读'
            },
            status: {
              type: 'string',
              enum: ['new', 'read', 'handled'],
              description: '评论状态'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: '用户认证相关接口'
      },
      {
        name: 'Users',
        description: '用户管理相关接口'
      },
      {
        name: 'Comments',
        description: '评论管理相关接口'
      },
      {
        name: 'Shop',
        description: '商城相关接口'
      },
      {
        name: 'Admin',
        description: '管理员相关接口'
      }
    ]
  },
  apis: [
    './routes/user.js',
    './index.js'
  ]
};

// 生成Swagger规范
const specs = swaggerJsdoc(swaggerOptions);

// 配置Swagger UI选项
const uiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'kekeYueDu API Documentation',
  explorer: true,
  showExtensions: true,
  showCommonExtensions: true,
  docExpansion: 'list',
  defaultModelsExpandDepth: 2,
  defaultModelExpandDepth: 2
};

module.exports = {
  specs,
  swaggerUi: swaggerUi.serve,
  swaggerUiOptions: uiOptions,
  setup: (app) => {
    // 设置Swagger UI路由
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(specs, uiOptions));

    // 提供JSON格式的API规范
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });

    // API规范导出路由
    app.get('/api-docs.yaml', (req, res) => {
      const yaml = require('yamljs');
      res.setHeader('Content-Type', 'text/yaml');
      res.send(yaml.stringify(specs));
    });

    const port = process.env.PORT || 7777;
    console.log(`📚 API文档已启用: http://localhost:${port}/api-docs`);
    console.log(`📄 API规范(JSON): http://localhost:${port}/api-docs.json`);
    console.log(`📄 API规范(YAML): http://localhost:${port}/api-docs.yaml`);
  }
};