const path = require('path');
const { spawnSync } = require('child_process');

const apiRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(apiRoot, '..', '..');
const nestCli = path.join(monorepoRoot, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

const ensure = spawnSync(
  process.execPath,
  [path.join(__dirname, 'ensure-contracts-built.cjs')],
  { cwd: apiRoot, stdio: 'inherit' },
);
if (ensure.status !== 0) {
  process.exit(ensure.status ?? 1);
}

const args = process.argv.slice(2);
const nestArgs = args.length ? args : ['start', '--watch'];

const result = spawnSync(process.execPath, [nestCli, ...nestArgs], {
  cwd: apiRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_PATH: [
      path.join(apiRoot, 'node_modules'),
      path.join(monorepoRoot, 'node_modules'),
      process.env.NODE_PATH,
    ]
      .filter(Boolean)
      .join(path.delimiter),
  },
});

process.exit(result.status ?? 1);
