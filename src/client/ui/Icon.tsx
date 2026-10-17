// Small stroke icons drawn inline, so the UI doesn't depend on emoji fonts.

const PATHS: Record<string, string> = {
  today: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  workout: 'M12 6a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 14l3.5-3.5M9.5 2h5M12 2v4',
  library: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20',
  gym: 'M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11',
  lab: 'M9 3h6M10 3v6l-5.6 9.7A1.5 1.5 0 0 0 5.7 21h12.6a1.5 1.5 0 0 0 1.3-2.3L14 9V3M7 15h10',
  synth: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  progress: 'M3 3v18h18M7 15l4-4 3 3 6-6',
  settings: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM12 1.5v3M12 19.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M1.5 12h3M19.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1M12 5.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z',
  ear: 'M6 8.5a6 6 0 1 1 12 0c0 3.5-3 4.5-3.5 7.2a3.5 3.5 0 0 1-6.6 1.3M9.2 9a2.8 2.8 0 0 1 5.6 0c0 1.6-1.5 2-1.5 3.2',
  topic: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  groove: 'M12 6c4.4 0 8 1.3 8 3s-3.6 3-8 3s-8-1.3-8-3s3.6-3 8-3zM4 9v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V9M15.5 2.5L12 9M8.5 2.5L12 9',
  target: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 11.5v1',
  keys: 'M3 4h18v16H3zM7.5 13v7M12 13v7M16.5 13v7M6 4h3v9H6zM10.5 4h3v9h-3zM15 4h3v9h-3z',
  writing: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  note: 'M9 18V5l12-2v13M6 15a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM18 13a3 3 0 1 0 0 6a3 3 0 1 0 0-6z',
  keyboard: 'M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10',
  play: 'M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.5-7.2a.8.8 0 0 0 0-1.4L8.2 4.1a.8.8 0 0 0-1.2.7z',
  mute: 'M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6',
  wave: 'M2 12h3l2.5-6 4 13 3.5-10 2.5 5H22',
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={PATHS[name] ?? PATHS.note} />
    </svg>
  );
}
