const path = require('path');
const { spawnSync } = require('child_process');

const demoRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(demoRoot, '..', '..');
const nextCli = path.join(monorepoRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

const [command = 'dev', ...rest] = process.argv.slice(2);

const result = spawnSync(process.execPath, [nextCli, command, ...rest], {
  cwd: demoRoot,
  stdio: 'inherit',
  env: { ...process.env },
});

process.exit(result.status ?? 1);
