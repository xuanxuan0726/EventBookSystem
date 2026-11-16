// Starts the PHP API (port 8000) and the Vite dev server together: `npm run dev`
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, '..', 'backend', 'public');
const php = existsSync('C:\\xampp\\php\\php.exe') ? 'C:\\xampp\\php\\php.exe' : 'php';

const api = spawn(php, ['-S', 'localhost:8000', '-t', publicDir, path.join(publicDir, 'index.php')], { stdio: 'inherit' });
api.on('error', (e) => console.error(`\n[api] Could not start PHP (${php}): ${e.message}\n`));
console.log(`[api] PHP API running at http://localhost:8000 (using ${php})`);

const vite = spawn('npx', ['vite'], { stdio: 'inherit', shell: true, cwd: here });

const stop = () => {
  api.kill();
  vite.kill();
  process.exit();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
vite.on('exit', stop);
