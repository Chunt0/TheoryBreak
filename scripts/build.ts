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
    // the build time shows in ⚙, so you can tell whether a phone runs the latest version
    define: { 'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'), 'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC') },
  });
  // worklets and the service worker run in their own scopes: one file each, fixed names
  const single = (entry: string, name: string) => Bun.build({ ...common, entrypoints: [entry], outdir, naming: `${name}.[ext]` });
  const worklet = await single('src/client/audio/worklet/dx7-processor.ts', 'dx7-processor');
  const rack = await single('src/client/audio/worklet/rack-processor.ts', 'rack-processor');
  const sw = await single('src/client/sw.ts', 'sw');
  for (const r of [app, worklet, rack, sw]) {
    if (!r.success) {
      for (const log of r.logs) console.error(log);
      return false;
    }
  }
  await cp('src/client/index.html', `${outdir}/index.html`);
  await cp('src/client/styles.css', `${outdir}/styles.css`);
  await cp('src/client/themes.css', `${outdir}/themes.css`);
  await cp('src/client/fonts', `${outdir}/fonts`, { recursive: true });
  await cp('src/client/icons', `${outdir}/icons`, { recursive: true });
  await cp('src/client/manifest.webmanifest', `${outdir}/manifest.webmanifest`);
  return true;
}

if (import.meta.main) {
  if (!dev) await rm(outdir, { recursive: true, force: true });
  const t = performance.now();
  const ok = await build();
  console.log(ok ? `Built client in ${Math.round(performance.now() - t)} ms → ${outdir}/` : 'Build failed');
  process.exit(ok ? 0 : 1);
}
