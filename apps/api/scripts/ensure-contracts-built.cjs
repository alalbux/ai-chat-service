const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const apiRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(apiRoot, '..', '..');
const marker = path.join(monorepoRoot, 'packages', 'contracts', 'dist', 'index.js');

if (fs.existsSync(marker)) {
  process.exit(0);
}

const result = spawnSync(
  'npm',
  ['run', 'build', '-w', '@ai-chat/contracts'],
  { cwd: monorepoRoot, stdio: 'inherit', shell: true },
);

process.exit(result.status ?? 1);
