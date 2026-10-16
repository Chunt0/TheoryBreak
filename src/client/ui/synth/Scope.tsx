import { useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/engine';

/** Oscilloscope (rising-edge triggered) or log-frequency spectrum of the master output. */
export function Scope() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'wave' | 'spectrum'>('wave');

  useEffect(() => {
    let raf = 0;
    let time: Float32Array<ArrayBuffer> | null = null;
    let freq: Float32Array<ArrayBuffer> | null = null;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = canvas.current;
      const an = audio.analyser;
      if (!c || !an) return;
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth * dpr;
      const h = c.clientHeight * dpr;
      if (c.width !== w) c.width = w;
      if (c.height !== h) c.height = h;
      const g = c.getContext('2d')!;
      g.fillStyle = '#0a0d0a';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#1d2a1d';
      g.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        g.beginPath();
        g.moveTo(0, (h * i) / 4);
        g.lineTo(w, (h * i) / 4);
        g.stroke();
      }
      g.strokeStyle = '#9fd36a';
      g.lineWidth = 1.5 * dpr;
      g.beginPath();
      if (mode === 'wave') {
        if (!time || time.length !== an.fftSize) time = new Float32Array(an.fftSize);
        an.getFloatTimeDomainData(time);
        let start = 0;
        for (let i = 1; i < time.length / 2; i++) if (time[i - 1] < 0 && time[i] >= 0) { start = i; break; }
        const n = Math.min(1024, time.length - start);
        for (let i = 0; i < n; i++) {
          const x = (i / n) * w;
          const y = h / 2 - time[start + i] * h * 0.9;
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
      } else {
        if (!freq || freq.length !== an.frequencyBinCount) freq = new Float32Array(an.frequencyBinCount);
        an.getFloatFrequencyData(freq);
        const sr = audio.ctx?.sampleRate ?? 48000;
        const fmin = 30;
        const fmax = 16000;
        for (let x = 0; x < w; x++) {
          const f = fmin * Math.pow(fmax / fmin, x / w);
          const bin = Math.min(freq.length - 1, Math.round((f / (sr / 2)) * freq.length));
          const db = Math.max(-100, freq[bin]);
          const y = h - ((db + 100) / 100) * h;
          if (x) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
      }
      g.stroke();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  return (
    <div className="scope">
      <div className="row between" style={{ marginBottom: 6 }}>
        <span className="dx-title">Scope</span>
        <div className="seg">
          <button type="button" className={mode === 'wave' ? 'on' : ''} onClick={() => setMode('wave')}>Wave</button>
          <button type="button" className={mode === 'spectrum' ? 'on' : ''} onClick={() => setMode('spectrum')}>Spectrum</button>
        </div>
      </div>
      <canvas ref={canvas} />
    </div>
  );
}
