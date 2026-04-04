const path = require('path');
const { spawnSync } = require('child_process');

const apiRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(apiRoot, '..', '..');
const nestCli = path.join(monorepoRoot, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

const args = process.argv.slice(2);
const nestArgs = args.length ? args : ['start', '--watch'];

const result = spawnSync(process.execPath, [nestCli, ...nestArgs], {
  cwd: apiRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_PATH: [path.join(monorepoRoot, 'node_modules'), process.env.NODE_PATH]
      .filter(Boolean)
      .join(path.delimiter),
  },
});

process.exit(result.status ?? 1);
