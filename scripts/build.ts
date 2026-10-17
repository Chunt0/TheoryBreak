// Bundles the client (React app + AudioWorklet) into dist/.
import { cp, mkdir, rm } from 'node:fs/promises';

const outdir = 'dist';
const dev = process.argv.includes('--dev');

export async function build(): Promise<boolean> {
  await mkdir(outdir, { recursive: true });
  const common = { target: 'browser' as const, minify: !dev, sourcemap: dev ? ('inline' as const) : ('linked' as const) };
  const app = await Bun.build({
    ...common,
    entrypoints: ['src/client/main.tsx'],
    outdir,
    naming: '[name].[ext]',
    define: { 'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production') },
  });
  const worklet = await Bun.build({
    ...common,
    entrypoints: ['src/client/audio/worklet/dx7-processor.ts'],
    outdir,
    naming: 'dx7-processor.[ext]',
  });
  for (const r of [app, worklet]) {
    if (!r.success) {
      for (const log of r.logs) console.error(log);
      return false;
    }
  }
  await cp('src/client/index.html', `${outdir}/index.html`);
  await cp('src/client/styles.css', `${outdir}/styles.css`);
  await cp('src/client/fonts', `${outdir}/fonts`, { recursive: true });
  return true;
}

if (import.meta.main) {
  if (!dev) await rm(outdir, { recursive: true, force: true });
  const t = performance.now();
  const ok = await build();
  console.log(ok ? `Built client in ${Math.round(performance.now() - t)} ms → ${outdir}/` : 'Build failed');
  process.exit(ok ? 0 : 1);
}
