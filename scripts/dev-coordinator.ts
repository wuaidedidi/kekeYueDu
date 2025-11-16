import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import * as cfg from '../config.ts'

async function main() {
  const env = cfg.getEnv()
  const desired = cfg.resolvePorts(env, process.env)
  const frontend = await cfg.pickAvailablePort(desired.frontend)
  const backend = await cfg.pickAvailablePort(desired.backend)

  const sharedEnv = {
    ...process.env,
    APP_ENV: env,
    FRONTEND_PORT: String(frontend),
    BACKEND_PORT: String(backend),
  }

  try {
    const envPath = path.join(__dirname, '..', '.env')
    const content = fs.readFileSync(envPath, 'utf8')
    const updated = content
      .replace(/FRONTEND_PORT=\d+/g, `FRONTEND_PORT=${frontend}`)
      .replace(/BACKEND_PORT=\d+/g, `BACKEND_PORT=${backend}`)
    fs.writeFileSync(envPath, updated)
    console.log(`Updated .env FRONTEND_PORT=${frontend} BACKEND_PORT=${backend}`)
  } catch (e: any) {
    console.warn('Could not update .env:', e.message)
  }

  const vite = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    env: sharedEnv,
    stdio: 'inherit',
    shell: true,
  })

  const server = spawn('npm', ['run', 'server:dev'], {
    cwd: path.join(__dirname, '..'),
    env: sharedEnv,
    stdio: 'inherit',
    shell: true,
  })

  const cleanup = () => {
    try { vite.kill() } catch {}
    try { server.kill() } catch {}
    process.exit(0)
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

main().catch((err) => {
  console.error('Dev coordinator failed:', err)
  process.exit(1)
})
