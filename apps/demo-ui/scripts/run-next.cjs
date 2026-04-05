const path = require('path');
const { spawnSync } = require('child_process');

const demoRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(demoRoot, '..', '..');
const nextCli = path.join(monorepoRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

// Drop `--` so `next start -- -p 3001` does not treat `-p` as a positional project dir.
const argv = process.argv.slice(2).filter((a) => a !== '--');
const [command = 'dev', ...rest] = argv;

const result = spawnSync(process.execPath, [nextCli, command, ...rest], {
  cwd: demoRoot,
  stdio: 'inherit',
  env: { ...process.env },
});

process.exit(result.status ?? 1);
