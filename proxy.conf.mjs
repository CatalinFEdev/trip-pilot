import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createConnection } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const require = createRequire(import.meta.url);
const proxyTargets = require('./proxy.conf.json');

const projectRoot = dirname(fileURLToPath(import.meta.url));
const agentPort = Number(process.env.AGENT_PORT ?? 8000);
const localhost = '127.0.0.1';

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: localhost, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(1000);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

function killProcessTree(child) {
  if (!child.pid || child.exitCode !== null) {
    return;
  }
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

function startService(name, command, port, description) {
  const child = spawn(command, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: String(port) },
  });

  child.on('error', (error) => {
    console.error(`[${name}] failed to start:`, error.message);
  });
  child.on('exit', (code, signal) => {
    console.log(`[${name}] exited (code: ${code ?? 'null'}, signal: ${signal ?? 'null'})`);
  });

  const shutdown = () => killProcessTree(child);
  process.once('exit', shutdown);
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  process.once('SIGHUP', shutdown);

  console.log(`[${name}] starting ${description} on port ${port}...`);
}

function isAutoStartDisabled(envVar) {
  return ['0', 'false', 'no'].includes(String(process.env[envVar] ?? '').toLowerCase());
}

async function autoStart(name, envVar, guard, command, port, description) {
  if (isAutoStartDisabled(envVar) || globalThis[guard]) return;
  globalThis[guard] = true;
  if (await isPortInUse(port)) {
    console.log(`[${name}] already running on port ${port}, skipping auto-start.`);
  } else {
    startService(name, command, port, description);
  }
}

await autoStart(
  'agent',
  'START_AGENT',
  '__tripPilotAgentStarted',
  'npm run dev --workspace agent-server',
  agentPort,
  'AG-UI agent server',
);

export default proxyTargets;
