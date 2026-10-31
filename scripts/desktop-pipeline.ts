/**
 * Eidos Language OS — Desktop Tauri Build Pipeline
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');

function runCommand(cmd: string, cwd: string = FRONTEND_DIR) {
  console.log(`\n[Desktop Pipeline] > ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

async function main() {
  const args = process.argv.slice(2);
  const cleanOnly = args.includes('--clean-only');
  const targetDir = path.resolve(FRONTEND_DIR, 'src-tauri', 'target');

  if (cleanOnly) {
    if (fs.existsSync(targetDir)) {
      console.log('Cleaning Tauri target directory...');
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    console.log('✅ Tauri target directory cleaned.');
    return;
  }

  console.log('=======================================================');
  console.log('  Eidos Language OS - Desktop Tauri Build Pipeline');
  console.log('=======================================================');

  console.log('[1/2] Building Frontend...');
  runCommand('npm run build');

  console.log('[2/2] Building Tauri Desktop Binary...');
  runCommand('npx tauri build');

  console.log('✅ Desktop App compiled successfully!');
}

main().catch((err) => {
  console.error('[Desktop Pipeline Error]', err);
  process.exit(1);
});
