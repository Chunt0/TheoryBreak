// The design kit's themes (putty-ai-design/themes.ts): what the picker shows and the
// background each one pairs with. Their colours live in themes.css; this sets
// data-theme (plus data-pattern and data-frosted) on <html>.

import { store } from './store';

export type Pattern = 'none' | 'dots' | 'rain' | 'synapse' | 'embers' | 'petals' | 'constellations' | 'perlin-flow' | 'sparkles';

export interface ThemeInfo {
  key: string;
  label: string;
  light: boolean;
  /** swatch colours for the picker: canvas, panel, text, accent */
  bg: string;
  panel: string;
  fg: string;
  accent: string;
  pattern: Pattern;
  /** colour of the moving background, when it is not the accent */
  effect?: string;
  /** 0..1 */
  intensity?: number;
  frosted?: boolean;
}

const t = (key: string, label: string, light: boolean, bg: string, fg: string, panel: string, accent: string, pattern: Pattern = 'none', more: Partial<ThemeInfo> = {}): ThemeInfo => ({ key, label, light, bg, fg, panel, accent, pattern, ...more });

/** In the kit's order. "auto" is Mono, light or dark with the system. */
export const THEMES: ThemeInfo[] = [
  t('putty', 'Mono', false, '#0e0e10', '#eaeaec', '#1b1c1f', '#e06c75', 'dots'),
  t('putty-light', 'Mono light', true, '#f5f5f6', '#1b1c1f', '#ffffff', '#c2454f', 'dots'),
  t('dark', 'Original', false, '#282c34', '#9cdef2', '#111111', '#e06c75'),
  t('light', 'Light', true, '#f0ebe3', '#5a5248', '#faf6f0', '#c47d5a', 'dots'),
  t('midnight', 'Midnight', false, '#0d1117', '#c9d1d9', '#161b22', '#f85149', 'rain', { effect: '#ffffff', intensity: 0.5 }),
  t('paper', 'Paper', true, '#faf8f5', '#3b3836', '#ffffff', '#c5ac4a', 'dots'),
  t('cyberpunk', 'Cyberpunk', false, '#0a0a0f', '#0ff0fc', '#12101a', '#e040fb', 'synapse'),
  t('retrowave', 'Retrowave', false, '#1a1a2e', '#e94560', '#16213e', '#e94560', 'embers'),
  t('forest', 'Forest', false, '#1b2a1b', '#a8d5a2', '#142414', '#7cb871', 'petals'),
  t('ocean', 'Ocean', false, '#0b1a2c', '#64d2ff', '#091422', '#4facfe', 'constellations'),
  t('ume', 'Ume', false, '#2b1b2e', '#f5c2e7', '#1e1420', '#f5a0c0', 'petals', { effect: '#f5a0c0' }),
  t('copper', 'Copper', false, '#1c1410', '#e8c39e', '#140f0a', '#d4764e'),
  t('terminal', 'Terminal', false, '#000000', '#00ff41', '#0a0a0a', '#00ff41', 'perlin-flow', { intensity: 0.8 }),
  t('organs', 'Organs', false, '#0a0406', '#efe1c8', '#15080a', '#c83240', 'rain', { effect: '#451616', intensity: 0.65 }),
  t('lavender', 'Lavender', true, '#f3eef8', '#3d3551', '#faf7ff', '#9b6dcc', 'none', { frosted: true }),
  t('gpt', 'GPT', false, '#212121', '#ececec', '#171717', '#949494'),
  t('claude', 'Claude', false, '#262624', '#f5f4f0', '#30302e', '#c6613f'),
  t('cute', 'Cute', true, '#fff0f5', '#d4608a', '#fff8fa', '#ff6b9d', 'sparkles', { effect: '#ff8cb8' }),
];

export const themeByKey = (key: string): ThemeInfo | undefined => THEMES.find((x) => x.key === key);

const dark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

/** The theme on screen: "auto" resolves to Mono or Mono light. */
export function resolveTheme(key: string): ThemeInfo {
  return themeByKey(key) ?? themeByKey(dark() ? 'putty' : 'putty-light')!;
}

/** The background a theme shows with the Background setting. */
export function patternFor(theme: ThemeInfo, backdrop: 'theme' | 'dots' | 'off'): Pattern {
  if (backdrop === 'off') return 'none';
  if (backdrop === 'dots') return 'dots';
  return theme.pattern;
}

let shown = '';

/** Put the stored theme on the page; call once at start and it follows the store and the system. */
export function initTheme(): void {
  const apply = () => {
    const { theme: key, backdrop } = store.get().settings;
    const theme = resolveTheme(key);
    const root = document.documentElement;
    const id = `${key}|${backdrop}|${theme.key}`;
    if (id === shown) return;
    const first = shown === '';
    shown = id;
    // one frame without transitions, so nothing is caught mid-fade between two themes
    if (!first) root.setAttribute('data-theme-switching', '');
    if (key === 'auto') delete root.dataset.theme;
    else root.dataset.theme = theme.key;
    root.dataset.pattern = patternFor(theme, backdrop);
    root.toggleAttribute('data-frosted', !!theme.frosted);
    for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) m.content = key === 'auto' ? (m.media.includes('dark') ? '#0e0e10' : '#f5f5f6') : theme.bg;
    if (!first) requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute('data-theme-switching')));
  };
  apply();
  store.subscribe(apply);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    shown = '';
    apply();
  });
}
