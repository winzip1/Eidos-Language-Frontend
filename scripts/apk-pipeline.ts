/**
 * Eidos Language OS — Smart APK Build & Sync Pipeline
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const GRADLE_PATH = path.resolve(FRONTEND_DIR, 'android', 'app', 'build.gradle');

// Auto-resolve Java JBR / Android SDK if present
if (!process.env.JAVA_HOME) {
  const possibleJbr = 'C:\\Program Files\\Android\\Android Studio\\jbr';
  if (fs.existsSync(possibleJbr)) {
    process.env.JAVA_HOME = possibleJbr;
    process.env.PATH = `${path.join(possibleJbr, 'bin')}${path.delimiter}${process.env.PATH}`;
  }
}
if (!process.env.ANDROID_HOME) {
  const possibleSdk = path.resolve(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
  if (fs.existsSync(possibleSdk)) {
    process.env.ANDROID_HOME = possibleSdk;
  }
}

function runCommand(cmd: string, cwd: string = FRONTEND_DIR) {
  console.log(`\n[APK Pipeline] > ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

async function main() {
  const args = process.argv.slice(2);
  const noBuild = args.includes('--no-build');

  console.log('=======================================================');
  console.log('  Eidos Language OS - Mobile APK Build Pipeline');
  console.log('=======================================================');

  if (!noBuild) {
    console.log('[1/3] Building Web assets with Vite...');
    runCommand('npm run build');
  }

  const androidDir = path.join(FRONTEND_DIR, 'android');
  if (fs.existsSync(androidDir)) {
    console.log('[2/3] Syncing Capacitor Android project...');
    runCommand('npx cap sync android');

    console.log('[3/3] Building Android APK (Debug/Release)...');
    try {
      const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat assembleDebug' : './gradlew assembleDebug';
      runCommand(gradlewCmd, androidDir);
      console.log('✅ Android APK compiled successfully!');
    } catch (err: any) {
      console.warn('⚠️ Gradle build skipped or failed. Run inside Android Studio if SDK tools are required.');
    }
  } else {
    console.log('[2/3] Capacitor Android directory not found, initializing...');
    runCommand('npx cap add android');
    runCommand('npx cap sync android');
    console.log('✅ Capacitor Android synced successfully!');
  }
}

main().catch((err) => {
  console.error('[APK Pipeline Error]', err);
  process.exit(1);
});
