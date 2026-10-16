import { Fragment, type ReactNode } from 'react';

/** Minimal, safe markdown: paragraphs, "- " and "1. " lists, **bold**, *italic*, `code`. */
export function Markdown({ md, inlineOnly = false }: { md: string; inlineOnly?: boolean }) {
  if (inlineOnly) return <>{inline(md)}</>;
  const blocks = md.split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every((l) => /^\s*-\s+/.test(l))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*-\s+/, ''))}</li>)}</ul>;
        }
        if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
          return <ol key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+\.\s+/, ''))}</li>)}</ol>;
        }
        return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 ? <br /> : null}{inline(l)}</Fragment>)}</p>;
      })}
    </>
  );
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith('`')) out.push(<code key={k++}>{t.slice(1, -1)}</code>);
    else out.push(<em key={k++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
