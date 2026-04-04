import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const pairs = [
  ['apps/api/.env.example', 'apps/api/.env'],
  ['apps/demo-ui/.env.local.example', 'apps/demo-ui/.env.local'],
];

for (const [fromRel, toRel] of pairs) {
  const from = join(root, fromRel);
  const to = join(root, toRel);
  if (!existsSync(from)) {
    console.warn(`skip (missing template): ${fromRel}`);
    continue;
  }
  if (existsSync(to)) {
    console.log(`skip (exists): ${toRel}`);
    continue;
  }
  copyFileSync(from, to);
  console.log(`created ${toRel}`);
}
