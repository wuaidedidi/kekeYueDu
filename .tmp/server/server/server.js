import express from 'express';
import cors from 'cors';
import useRouter from './routes/user.js';
import shopRouter from './routes/shop.js';
import cfg from '../config.js';
const server = express();
const env = cfg.getEnv();
const desired = cfg.resolvePorts(env, process.env);
server.use(cors());
server.use(express.json());
// 使用认证路由
server.use('/api', useRouter); // 将认证路由挂载到 /api 路径下
server.use('/api', shopRouter); // 将商店路由挂载到 /api 路径下
// 占位图片API
server.get('/api/placeholder/:width/:height', (req, res) => {
    const { width, height } = req.params;
    const w = parseInt(width) || 200;
    const h = parseInt(height) || 150;
    // 创建SVG占位图片
    const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f2f5"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="#999">
        ${w}x${h}
      </text>
    </svg>
  `;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg.trim());
});
server.get('/', (req, res) => {
    res.send('Hello from Express!');
});
cfg.startServerWithRetry(server, desired.backend, 20, (p) => {
    console.log(`Express server is running at http://localhost:${p}`);
});
