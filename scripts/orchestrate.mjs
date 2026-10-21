import { spawn } from 'node:child_process';

const mode = process.argv[2] === 'start' ? 'start' : 'dev';
const programs = [
  { name: 'api', port: '3001', args: ['pnpm', '--filter', '@okard/api', mode] },
  { name: 'web', port: String(process.env.PORT || 3000), args: ['pnpm', '--filter', '@okard/web', mode] },
];

const children = [];
let stopping = false;
function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 500).unref();
}

for (const program of programs) {
  const env = {
    ...process.env,
    HOST: '0.0.0.0',
    ...(program.name === 'api' ? { API_PORT: program.port } : { PORT: program.port }),
  };
  const child = spawn('corepack', program.args, { stdio: 'inherit', env });
  children.push(child);
  child.on('error', (error) => {
    console.error('[okard:' + program.name + '] failed to start:', error.message);
    stopAll(1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error('[okard:' + program.name + '] stopped:', signal || code);
      stopAll(code === 0 ? 1 : (code || 1));
    }
  });
}
process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
