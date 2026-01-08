import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

// Configuration - default interval in seconds
const DEFAULT_INTERVAL_SECONDS = 60;

const ROOT_DIR = join(__dirname, '..');
const DATA_FILE = join(ROOT_DIR, 'data/floorplans-data.json');

let lastHash: string | null = null;
let isBuilding = false;

function getFileHash(): string | null {
  if (!existsSync(DATA_FILE)) {
    return null;
  }
  const content = readFileSync(DATA_FILE, 'utf-8');
  return crypto.createHash('md5').update(content).digest('hex');
}

function triggerBuild(): void {
  if (isBuilding) {
    console.log('⏳ Build already in progress, skipping...');
    return;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 Changes detected! Triggering build...`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}\n`);

  isBuilding = true;

  try {
    execSync('npm run build:floorplans:all', {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    console.log(`\n✅ Build completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`\n❌ Build failed!`);
  } finally {
    isBuilding = false;
    console.log(`\n👀 Watching for changes... (Ctrl+C to stop)\n`);
  }
}

function checkForChanges(): void {
  const currentHash = getFileHash();

  if (currentHash === null) {
    console.log(`⚠️  Data file not found: ${DATA_FILE}`);
    return;
  }

  if (lastHash === null) {
    // First run - just store the hash
    lastHash = currentHash;
    console.log(`📋 Initial hash: ${currentHash.substring(0, 8)}...`);
    return;
  }

  if (currentHash !== lastHash) {
    console.log(`\n📝 File changed!`);
    console.log(`   Previous: ${lastHash.substring(0, 8)}...`);
    console.log(`   Current:  ${currentHash.substring(0, 8)}...`);
    lastHash = currentHash;
    triggerBuild();
  }
}

function formatInterval(seconds: number): string {
  if (seconds >= 60) {
    const mins = seconds / 60;
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

// Parse command line arguments for interval
function getIntervalFromArgs(): number {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--interval' || args[i] === '-i') && args[i + 1]) {
      const value = parseInt(args[i + 1], 10);
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
    // Support --interval=60 format
    if (args[i].startsWith('--interval=')) {
      const value = parseInt(args[i].split('=')[1], 10);
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
  }

  // Check environment variable
  const envInterval = process.env.POLL_INTERVAL;
  if (envInterval) {
    const value = parseInt(envInterval, 10);
    if (!isNaN(value) && value > 0) {
      return value;
    }
  }

  return DEFAULT_INTERVAL_SECONDS;
}

// Main
const intervalSeconds = getIntervalFromArgs();

console.log(`\n${'='.repeat(60)}`);
console.log(`👀 Floorplans Watcher`);
console.log(`${'='.repeat(60)}`);
console.log(`📁 Watching: ${DATA_FILE}`);
console.log(`⏱️  Interval: ${formatInterval(intervalSeconds)}`);
console.log(`🕐 Started:  ${new Date().toISOString()}`);
console.log(`\nPress Ctrl+C to stop.\n`);

// Initial check
checkForChanges();

// Set up polling interval
const intervalId = setInterval(checkForChanges, intervalSeconds * 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n\n👋 Watcher stopped.`);
  clearInterval(intervalId);
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(intervalId);
  process.exit(0);
});

