import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';

const sourceDir = join(__dirname, '../apps/small-app/out');
const targetDir = join(__dirname, '../apps/main-app/public/small-app');

if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });
}

function copyRecursive(src: string, dest: string) {
  if (!existsSync(src)) {
    console.error(`Source directory does not exist: ${src}`);
    process.exit(1);
  }

  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(sourceDir, targetDir);
console.log(`✓ Copied ${sourceDir} to ${targetDir}`);

