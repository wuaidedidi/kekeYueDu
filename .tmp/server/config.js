import net from 'node:net';
export function getEnv() {
    const raw = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
    if (raw.startsWith('prod'))
        return 'production';
    if (raw.startsWith('test'))
        return 'test';
    return 'development';
}
const DEFAULTS = {
    development: { frontend: 3000, backend: 5000 },
    test: { frontend: 4000, backend: 6000 },
};
export function resolvePorts(env = getEnv(), envVars = process.env) {
    const ports = { frontend: 0, backend: 0 };
    if (env === 'development') {
        ports.frontend = Number(envVars.FRONTEND_PORT || DEFAULTS.development.frontend);
        ports.backend = Number(envVars.BACKEND_PORT || DEFAULTS.development.backend);
    }
    else if (env === 'test') {
        ports.frontend = Number(envVars.FRONTEND_PORT || DEFAULTS.test.frontend);
        ports.backend = Number(envVars.BACKEND_PORT || DEFAULTS.test.backend);
    }
    else {
        const f = envVars.FRONTEND_PORT;
        const b = envVars.BACKEND_PORT || envVars.PORT;
        if (!f || !b) {
            throw new Error('Production ports must be provided via env: FRONTEND_PORT and BACKEND_PORT (or PORT for backend)');
        }
        ports.frontend = Number(f);
        ports.backend = Number(b);
    }
    if (isNaN(ports.frontend) || isNaN(ports.backend)) {
        throw new Error('Invalid port values: FRONTEND_PORT or BACKEND_PORT are not numbers');
    }
    return ports;
}
export function buildOrigins(ports) {
    const serverOrigin = `http://localhost:${ports.backend}`;
    const clientOrigin = `http://localhost:${ports.frontend}`;
    return { serverOrigin, clientOrigin };
}
export function buildProxy(serverOrigin) {
    return {
        '/api': { target: serverOrigin, changeOrigin: true, secure: false },
        '/uploads': { target: serverOrigin, changeOrigin: true, secure: false },
    };
}
export function isPortFree(port, host = '0.0.0.0') {
    return new Promise((resolve) => {
        const srv = net
            .createServer()
            .once('error', () => resolve(false))
            .once('listening', () => srv.close(() => resolve(true)))
            .listen(port, host);
    });
}
export async function pickAvailablePort(desired, maxRetries = 20, host = '0.0.0.0') {
    let p = desired;
    for (let i = 0; i <= maxRetries; i++) {
        if (await isPortFree(p, host))
            return p;
        p += 1;
    }
    throw new Error(`No available port found starting from ${desired}`);
}
export function startServerWithRetry(app, initialPort, maxRetries = 20, onListening) {
    let attempts = 0;
    function tryListen(p) {
        const server = app.listen(p, () => {
            if (typeof onListening === 'function')
                onListening(p);
        });
        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE' && attempts < maxRetries) {
                attempts += 1;
                const next = p + 1;
                console.warn(`\u26a0\ufe0f  端口 ${p} 已被占用，尝试使用 ${next} ...`);
                tryListen(next);
                return;
            }
            console.error('服务器启动失败:', err);
        });
        return server;
    }
    return tryListen(initialPort);
}
export default {
    getEnv,
    resolvePorts,
    buildOrigins,
    buildProxy,
    isPortFree,
    pickAvailablePort,
    startServerWithRetry,
};
