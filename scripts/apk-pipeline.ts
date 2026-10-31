/**
 * Eidos Language OS — Smart APK Build & Versioned Deployment Pipeline
 * 
 * Features:
 * - Dynamic semantic versioning (reads from frontend/package.json & android/app/build.gradle)
 * - Automatic version bump support (--bump, --bump-minor, --bump-major, --bump-only, --set-version <v>)
 * - Synchronizes version between package.json, build.gradle, and tauri.conf.json
 * - Outputs clean versioned APKs:
 *     - Root: Eidos-Language-OS-v<version>.apk (e.g., Eidos-Language-OS-v1.0.0.apk)
 *     - Root (pointer): Eidos-Language-OS.apk
 *     - Android outputs: Eidos-Language-OS-v<version>-debug.apk
 * - Fail-loud error handling with actionable logging
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(FRONTEND_DIR, '..');
const PACKAGE_JSON_PATH = path.resolve(FRONTEND_DIR, 'package.json');
const ROOT_PACKAGE_JSON_PATH = path.resolve(ROOT_DIR, 'package.json');
const GRADLE_PATH = path.resolve(FRONTEND_DIR, 'android', 'app', 'build.gradle');
const TAURI_CONF_PATH = path.resolve(FRONTEND_DIR, 'src-tauri', 'tauri.conf.json');

// Auto-resolve Java JBR / Android SDK if present
const possibleJbr = 'C:\\Program Files\\Android\\Android Studio\\jbr';
if (!process.env.JAVA_HOME && fs.existsSync(possibleJbr)) {
  process.env.JAVA_HOME = possibleJbr;
}
if (process.env.JAVA_HOME) {
  const javaBin = path.join(process.env.JAVA_HOME, 'bin');
  const currentPath = process.env.PATH || '';
  if (!currentPath.includes(javaBin)) {
    process.env.PATH = `${javaBin}${path.delimiter}${currentPath}`;
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

interface VersionInfo {
  version: string;
  versionCode: number;
  versionName: string;
}

/**
 * Reads version info from frontend/package.json and android/app/build.gradle
 */
function getVersionInfo(): VersionInfo {
  let version = '1.0.0';
  let versionCode = 1;
  let versionName = '1.0.0';

  if (fs.existsSync(PACKAGE_JSON_PATH)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
      if (pkg.version) version = pkg.version;
    } catch {
      // fallback
    }
  }

  if (fs.existsSync(GRADLE_PATH)) {
    const content = fs.readFileSync(GRADLE_PATH, 'utf-8');
    const codeMatch = content.match(/versionCode\s+(\d+)/);
    const nameMatch = content.match(/versionName\s+["']([^"']+)["']/);

    if (codeMatch) versionCode = parseInt(codeMatch[1], 10);
    if (nameMatch) versionName = nameMatch[1];
  }

  return { version, versionCode, versionName };
}

/**
 * Calculates next semantic version
 */
function bumpSemanticVersion(current: string, type: 'patch' | 'minor' | 'major'): string {
  const parts = current.split('.').map((p) => parseInt(p, 10));
  const major = isNaN(parts[0]) ? 1 : parts[0];
  const minor = isNaN(parts[1]) ? 0 : parts[1];
  const patch = isNaN(parts[2]) ? 0 : parts[2];

  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Synchronizes new version across package.json, build.gradle, and tauri.conf.json
 */
function syncVersion(newVersion: string, newVersionCode: number) {
  console.log(`\n📝 Version synchronization: v${newVersion} (versionCode: ${newVersionCode})`);

  // 1. Update frontend/package.json
  if (fs.existsSync(PACKAGE_JSON_PATH)) {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    pkg.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log(`   ✓ Updated frontend/package.json -> ${newVersion}`);
  }

  // 2. Update root package.json if version exists or add it
  if (fs.existsSync(ROOT_PACKAGE_JSON_PATH)) {
    const rootPkg = JSON.parse(fs.readFileSync(ROOT_PACKAGE_JSON_PATH, 'utf-8'));
    rootPkg.version = newVersion;
    fs.writeFileSync(ROOT_PACKAGE_JSON_PATH, JSON.stringify(rootPkg, null, 2) + '\n', 'utf-8');
    console.log(`   ✓ Updated root package.json -> ${newVersion}`);
  }

  // 3. Update android/app/build.gradle
  if (fs.existsSync(GRADLE_PATH)) {
    let gradleContent = fs.readFileSync(GRADLE_PATH, 'utf-8');
    gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${newVersionCode}`);
    gradleContent = gradleContent.replace(/versionName\s+["'][^"']+["']/, `versionName "${newVersion}"`);
    fs.writeFileSync(GRADLE_PATH, gradleContent, 'utf-8');
    console.log(`   ✓ Updated android/app/build.gradle -> versionCode ${newVersionCode}, versionName "${newVersion}"`);
  }

  // 4. Update tauri.conf.json if exists
  if (fs.existsSync(TAURI_CONF_PATH)) {
    try {
      const tauriConf = JSON.parse(fs.readFileSync(TAURI_CONF_PATH, 'utf-8'));
      tauriConf.version = newVersion;
      fs.writeFileSync(TAURI_CONF_PATH, JSON.stringify(tauriConf, null, 2) + '\n', 'utf-8');
      console.log(`   ✓ Updated src-tauri/tauri.conf.json -> ${newVersion}`);
    } catch {
      // Ignore if not present or malformed
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const noBuild = args.includes('--no-build');
  const isRelease = args.includes('--release');
  const isBumpPatch = args.includes('--bump') || args.includes('--bump-patch');
  const isBumpMinor = args.includes('--bump-minor');
  const isBumpMajor = args.includes('--bump-major');
  const isBumpOnly = args.includes('--bump-only');
  const setVersionIdx = args.indexOf('--set-version');
  const explicitVersion = setVersionIdx !== -1 && args[setVersionIdx + 1] ? args[setVersionIdx + 1] : null;

  console.log('========================================================================');
  console.log('  Eidos Language OS - Akıllı Versiyonlu Mobil APK Derleme Hattı');
  console.log('========================================================================');

  let { version, versionCode, versionName } = getVersionInfo();

  // Determine if a version bump or manual version set is requested
  let targetVersion = version;
  let targetVersionCode = versionCode;
  let didBump = false;

  if (explicitVersion) {
    targetVersion = explicitVersion;
    targetVersionCode = versionCode + 1;
    didBump = true;
  } else if (isBumpMajor) {
    targetVersion = bumpSemanticVersion(version, 'major');
    targetVersionCode = versionCode + 1;
    didBump = true;
  } else if (isBumpMinor) {
    targetVersion = bumpSemanticVersion(version, 'minor');
    targetVersionCode = versionCode + 1;
    didBump = true;
  } else if (isBumpPatch || isBumpOnly) {
    targetVersion = bumpSemanticVersion(version, 'patch');
    targetVersionCode = versionCode + 1;
    didBump = true;
  } else if (versionName !== version) {
    // Gradle versionName and package.json version were out of sync; harmonize them
    targetVersion = version;
    targetVersionCode = versionCode;
    didBump = true;
  }

  if (didBump) {
    syncVersion(targetVersion, targetVersionCode);
    version = targetVersion;
    versionCode = targetVersionCode;
    versionName = targetVersion;
  }

  console.log(`\n📌 Aktif Versiyon: v${version} (Build Code: ${versionCode})`);

  if (isBumpOnly) {
    console.log(`\n✅ Sadece versiyon artırıldı (--bump-only). Derleme atlandı.`);
    return;
  }

  // Step 1: Web build
  if (!noBuild) {
    console.log('\n[1/3] Web varlıkları Vite ile derleniyor (npm run build)...');
    runCommand('npm run build');
  } else {
    console.log('\n[1/3] Web varlıkları derlemesi atlandı (--no-build).');
  }

  // Step 2: Capacitor sync
  const androidDir = path.join(FRONTEND_DIR, 'android');
  if (!fs.existsSync(androidDir)) {
    console.log('\n[2/3] Capacitor Android dizini bulunamadı, ekleniyor...');
    runCommand('npx cap add android');
  }

  console.log('\n[2/3] Capacitor Android projesi senkronize ediliyor (npx cap sync android)...');
  runCommand('npx cap sync android');

  // Step 3: Gradle APK compilation
  const buildType = isRelease ? 'release' : 'debug';
  const gradleTask = isRelease ? 'assembleRelease' : 'assembleDebug';
  const gradlewCmd = process.platform === 'win32' ? `.\\gradlew.bat ${gradleTask}` : `./gradlew ${gradleTask}`;

  console.log(`\n[3/3] Android APK derleniyor (${gradleTask})...`);
  const startTime = Date.now();

  try {
    runCommand(gradlewCmd, androidDir);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Android Gradle derlemesi ${duration} saniyede başarıyla tamamlandı!`);

    const apkOutputDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', buildType);
    if (!fs.existsSync(apkOutputDir)) {
      throw new Error(`APK çıktı dizini bulunamadı: ${apkOutputDir}`);
    }

    // Find the generated apk
    const allFiles = fs.readdirSync(apkOutputDir);
    const apkFiles = allFiles.filter((f) => f.endsWith('.apk'));

    if (apkFiles.length === 0) {
      throw new Error(`Çıktı dizininde hiçbir .apk dosyası bulunamadı: ${apkOutputDir}`);
    }

    // Pick standard generated APK
    const candidateApk = apkFiles.find((f) => f.includes(`app-${buildType}`)) || apkFiles[0];
    const sourceApkPath = path.join(apkOutputDir, candidateApk);

    // TARGET NAMES:
    // 1. Primary Versioned APK at root: Eidos-Language-OS-v1.0.0.apk
    const rootVersionedApk = path.resolve(ROOT_DIR, `Eidos-Language-OS-v${version}.apk`);
    // 2. Generic pointer at root: Eidos-Language-OS.apk
    const rootPointerApk = path.resolve(ROOT_DIR, 'Eidos-Language-OS.apk');
    // 3. Versioned APK in debug/release directory: Eidos-Language-OS-v1.0.0-debug.apk
    const localVersionedApk = path.join(apkOutputDir, `Eidos-Language-OS-v${version}-${buildType}.apk`);

    // Copy to all destinations
    fs.copyFileSync(sourceApkPath, rootVersionedApk);
    fs.copyFileSync(sourceApkPath, rootPointerApk);
    fs.copyFileSync(sourceApkPath, localVersionedApk);

    const stats = fs.statSync(rootVersionedApk);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    const sizeBytes = stats.size.toLocaleString('tr-TR');

    console.log('\n========================================================================');
    console.log('  📦 VERSİYONLU APK BAŞARIYLA DAĞITILDI & GÜNCELLENDİ!');
    console.log('========================================================================');
    console.log(`  🏷️  Versiyon       : v${version} (versionCode: ${versionCode}, buildType: ${buildType})`);
    console.log(`  📏  Boyut          : ${sizeMb} MB (${sizeBytes} bayt)`);
    console.log(`  📁  Ana Versiyonlu : ${rootVersionedApk}`);
    console.log(`  📁  Kök Gösterici  : ${rootPointerApk}`);
    console.log(`  📁  Gradle Çıktısı : ${localVersionedApk}`);
    console.log('========================================================================\n');
  } catch (err: any) {
    console.error('\n❌ [APK Pipeline Hatası] Gradle derlemesi veya kopyalama başarısız oldu:', err.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n❌ [Beklenmeyen Pipeline Hatası]', err);
  process.exit(1);
});
