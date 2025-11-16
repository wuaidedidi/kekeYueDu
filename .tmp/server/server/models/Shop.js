export class ShopModel {
    constructor(db) {
        this.db = db;
        this.initTables();
        this.initDefaultProducts();
    }
    initTables() {
        this.db.serialize(() => {
            // 商品表
            this.db.run(`
        CREATE TABLE IF NOT EXISTS shop_products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          subtitle TEXT,
          description TEXT,
          type TEXT NOT NULL,
          price INTEGER NOT NULL,
          charge_mode TEXT NOT NULL DEFAULT 'points',
          duration_days INTEGER,
          times INTEGER,
          activation_required BOOLEAN DEFAULT 0,
          icon_url TEXT,
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
          stock INTEGER DEFAULT -1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // 用户余额表
            this.db.run(`
        CREATE TABLE IF NOT EXISTS user_balance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          ink_points INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // 订单记录表
            this.db.run(`
        CREATE TABLE IF NOT EXISTS shop_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          points_cost INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // 用户权益表
            this.db.run(`
        CREATE TABLE IF NOT EXISTS user_rights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          start_at DATETIME,
          end_at DATETIME,
          remaining_times INTEGER,
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // 为users表添加墨水余额字段（如果不存在）
            this.db.run(`
        ALTER TABLE users ADD COLUMN ink_points INTEGER DEFAULT 100
      `, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.log('Error adding ink_points column:', err.message);
                }
            });
        });
    }
    async initDefaultProducts() {
        const defaultProducts = [
            {
                title: '7天会员体验',
                subtitle: '全部功能免费使用',
                description: '享受7天完整会员权益，解锁所有高级功能',
                type: 'vip',
                price: 99,
                charge_mode: 'duration',
                duration_days: 7,
                activation_required: false,
                icon_url: '/api/placeholder/64/64',
                status: 'active',
                stock: 100,
            },
            {
                title: '月度会员',
                subtitle: '30天完整会员',
                description: '30天完整会员体验，所有功能开放',
                type: 'vip',
                price: 299,
                charge_mode: 'duration',
                duration_days: 30,
                activation_required: false,
                icon_url: '/api/placeholder/64/64',
                status: 'active',
                stock: -1,
            },
            {
                title: '高级编辑功能券',
                subtitle: '单次使用',
                description: '解锁高级编辑功能一次，包含AI辅助、模板等',
                type: 'coupon',
                price: 50,
                charge_mode: 'times',
                times: 1,
                activation_required: false,
                icon_url: '/api/placeholder/64/64',
                status: 'active',
                stock: -1,
            },
            {
                title: '精美皮肤套装',
                subtitle: '永久使用',
                description: '个性化界面，让你的编辑器更美观，多款主题可选',
                type: 'skin',
                price: 199,
                charge_mode: 'points',
                activation_required: false,
                icon_url: '/api/placeholder/64/64',
                status: 'active',
                stock: -1,
            },
            {
                title: 'AI写作助手',
                subtitle: '月度订阅',
                description: 'AI智能写作助手，提供创意灵感和内容优化',
                type: 'ai_tool',
                price: 199,
                charge_mode: 'duration',
                duration_days: 30,
                activation_required: false,
                icon_url: '/api/placeholder/64/64',
                status: 'active',
                stock: -1,
            },
            {
                title: '数据导出功能',
                subtitle: '永久授权',
                description: '支持导出多种格式，包括PDF、Word、EPUB等',
                type: 'tool',
                price: 149,
                charge_mode: 'points',
                activation_required: false,
                icon_url: '/api/placeholder/64/64',
                status: 'active',
                stock: -1,
            },
        ];
        const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO shop_products
      (title, subtitle, description, type, price, charge_mode, duration_days, times, activation_required, icon_url, status, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        defaultProducts.forEach((product) => {
            stmt.run([
                product.title,
                product.subtitle || null,
                product.description || null,
                product.type,
                product.price,
                product.charge_mode,
                product.duration_days || null,
                product.times || null,
                product.activation_required ? 1 : 0,
                product.icon_url,
                product.status,
                product.stock,
            ]);
        });
        stmt.finalize();
    }
    // 获取用户余额
    async getUserBalance(userId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM user_balance WHERE user_id = ?', [userId], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row || null);
                }
            });
        });
    }
    // 创建或更新用户余额
    async upsertUserBalance(userId, inkPoints) {
        return new Promise((resolve, reject) => {
            this.db.run(`
        INSERT INTO user_balance (user_id, ink_points)
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          ink_points = excluded.ink_points,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, inkPoints], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        id: this.lastID,
                        user_id: userId,
                        ink_points: inkPoints,
                    });
                }
            });
        });
    }
    // 获取商品列表
    async getProducts(filters) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM shop_products';
            const params = [];
            let countQuery = 'SELECT COUNT(*) as total FROM shop_products';
            const countParams = [];
            if (filters) {
                const conditions = [];
                if (filters.type && filters.type !== 'all') {
                    conditions.push('type = ?');
                    params.push(filters.type);
                    countParams.push(filters.type);
                }
                if (filters.status) {
                    conditions.push('status = ?');
                    params.push(filters.status);
                    countParams.push(filters.status);
                }
                if (conditions.length > 0) {
                    const whereClause = ' WHERE ' + conditions.join(' AND ');
                    query += whereClause;
                    countQuery += whereClause;
                }
            }
            // 添加排序
            query += ' ORDER BY created_at DESC';
            // 添加分页
            if (filters?.page && filters?.pageSize) {
                const offset = (filters.page - 1) * filters.pageSize;
                query += ' LIMIT ? OFFSET ?';
                params.push(filters.pageSize, offset);
            }
            // 执行查询
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                // 获取总数
                this.db.get(countQuery, countParams, (countErr, countRow) => {
                    if (countErr) {
                        reject(countErr);
                        return;
                    }
                    resolve({
                        products: rows,
                        total: countRow.total,
                    });
                });
            });
        });
    }
    // 获取单个商品
    async getProduct(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM shop_products WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row || null);
                }
            });
        });
    }
    // 兑换商品
    async redeemProduct(userId, productId, quantity = 1) {
        return new Promise(async (resolve, reject) => {
            try {
                // 获取商品信息
                const product = await this.getProduct(productId);
                if (!product) {
                    resolve({ success: false, message: '商品不存在' });
                    return;
                }
                if (product.status !== 'active') {
                    resolve({ success: false, message: '商品已下架' });
                    return;
                }
                if (product.stock !== -1 && product.stock < quantity) {
                    resolve({ success: false, message: '库存不足' });
                    return;
                }
                // 获取用户余额
                const userBalance = await this.getUserBalance(userId);
                if (!userBalance) {
                    // 创建默认余额
                    await this.upsertUserBalance(userId, 100);
                    resolve({ success: false, message: '余额不足' });
                    return;
                }
                const totalCost = product.price * quantity;
                if (userBalance.ink_points < totalCost) {
                    resolve({ success: false, message: '余额不足' });
                    return;
                }
                // 扣除余额
                const newBalance = userBalance.ink_points - totalCost;
                await this.upsertUserBalance(userId, newBalance);
                // 更新库存
                if (product.stock !== -1) {
                    await this.updateProductStock(productId, product.stock - quantity);
                }
                // 创建订单记录
                await this.createOrder({
                    user_id: userId,
                    product_id: productId,
                    quantity,
                    points_cost: totalCost,
                    status: 'success',
                });
                // 创建用户权益
                const rightData = {
                    user_id: userId,
                    product_id: productId,
                    status: 'active',
                };
                if (product.duration_days) {
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setDate(startDate.getDate() + product.duration_days);
                    rightData.start_at = startDate.toISOString();
                    rightData.end_at = endDate.toISOString();
                }
                if (product.times) {
                    rightData.remaining_times = product.times;
                }
                await this.createUserRight(rightData);
                resolve({
                    success: true,
                    message: '兑换成功',
                    data: {
                        newBalance,
                        product,
                        remainingTimes: product.times,
                    },
                });
            }
            catch (error) {
                console.error('Redeem product error:', error);
                resolve({ success: false, message: '兑换失败，请重试' });
            }
        });
    }
    // 更新商品库存
    async updateProductStock(productId, newStock) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE shop_products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, productId], (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    // 创建订单记录
    async createOrder(order) {
        return new Promise((resolve, reject) => {
            this.db.run(`
        INSERT INTO shop_orders (user_id, product_id, quantity, points_cost, status)
        VALUES (?, ?, ?, ?, ?)
      `, [
                order.user_id,
                order.product_id,
                order.quantity,
                order.points_cost,
                order.status,
            ], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        id: this.lastID,
                        ...order,
                    });
                }
            });
        });
    }
    // 创建用户权益
    async createUserRight(right) {
        return new Promise((resolve, reject) => {
            this.db.run(`
        INSERT INTO user_rights (user_id, product_id, start_at, end_at, remaining_times, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
                right.user_id,
                right.product_id,
                right.start_at,
                right.end_at,
                right.remaining_times,
                right.status,
            ], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        id: this.lastID,
                        ...right,
                    });
                }
            });
        });
    }
    // 获取用户权益列表
    async getUserRights(userId) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM user_rights WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    // 获取用户订单记录
    async getUserOrders(userId, page = 1, pageSize = 20) {
        return new Promise((resolve, reject) => {
            const offset = (page - 1) * pageSize;
            const query = `
        SELECT so.*, sp.title as product_title, sp.icon_url
        FROM shop_orders so
        LEFT JOIN shop_products sp ON so.product_id = sp.id
        WHERE so.user_id = ?
        ORDER BY so.created_at DESC
        LIMIT ? OFFSET ?
      `;
            const countQuery = 'SELECT COUNT(*) as total FROM shop_orders WHERE user_id = ?';
            this.db.all(query, [userId, pageSize, offset], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.db.get(countQuery, [userId], (countErr, countRow) => {
                    if (countErr) {
                        reject(countErr);
                        return;
                    }
                    resolve({
                        orders: rows,
                        total: countRow.total,
                    });
                });
            });
        });
    }
}
