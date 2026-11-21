import { Fragment, type ReactNode } from 'react';
import { safeExternalUrl } from '../../lib/safeUrl';

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"«»]+[^\s<>"«».,;:!?)\]])/gi;
const MENTION_RE = /(@[\p{L}\p{N}_-]{1,40})/gu;

function withMentions(text: string, keyPrefix: string): ReactNode[] {
  const bits = text.split(MENTION_RE);
  return bits.map((bit, i) =>
    bit.startsWith('@') ? (
      <span key={`${keyPrefix}-m-${i}`} className="font-bold text-accent">
        {bit}
      </span>
    ) : (
      <Fragment key={`${keyPrefix}-t-${i}`}>{bit}</Fragment>
    ),
  );
}

/**
 * Post/comment text with safe, clickable links: only http(s) URLs pass
 * `safeExternalUrl`, links open in a new tab and are marked as user content
 * (`nofollow ugc`). @mentions are highlighted. Everything else stays plain
 * text (React escapes it).
 */
export function RichText({ text }: { text: string }) {
  const parts: Array<{ kind: 'text' | 'link'; value: string; href?: string }> = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ kind: 'text', value: text.slice(last, start) });
    const href = safeExternalUrl(m[0]);
    parts.push(href ? { kind: 'link', value: m[0], href } : { kind: 'text', value: m[0] });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', value: text.slice(last) });
  return (
    <>
      {parts.map((p, i) =>
        p.kind === 'link' ? (
          <a key={i} href={p.href} target="_blank" rel="noopener noreferrer nofollow ugc" className="break-all font-bold underline">
            {p.value}
          </a>
        ) : (
          <Fragment key={i}>{withMentions(p.value, String(i))}</Fragment>
        ),
      )}
    </>
  );
}
