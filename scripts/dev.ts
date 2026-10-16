// Dev loop: rebuild the client on changes and run the server.
import { watch } from 'node:fs';
import { build } from './build';

process.argv.push('--dev');
await build();
let timer: ReturnType<typeof setTimeout> | null = null;
watch('src/client', { recursive: true }, () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    const t = performance.now();
    const ok = await build();
    console.log(ok ? `rebuilt in ${Math.round(performance.now() - t)} ms` : 'build failed');
  }, 120);
});
await import('../src/server/index.ts');
