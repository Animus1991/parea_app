import fs from 'fs';
import path from 'path';

const pages = [
  ['EventDetailClassic.tsx', 'classic', false],
  ['EventDetailVibrant.tsx', 'vibrant', false],
  ['EventDetailVibrantDark.tsx', 'vibrant', true],
  ['EventDetailNeon.tsx', 'neon', false],
  ['EventDetailNeonDark.tsx', 'neon', true],
  ['EventDetailBento.tsx', 'bento', false],
  ['EventDetailBentoDark.tsx', 'bento', true],
];

const metaRe =
  /\s*<div className="grid grid-cols-2 gap-4">[\s\S]*?\r?\n\s*<EventDetailMapSection/;

const organizerRe =
  /\s*\{organizer && \([\s\S]*?\)\}\s*\r?\n\s*\{\/\* High Trust \/ Outdoor/;

function ensureImport(s, symbol, fromPath) {
  if (s.includes(`from '${fromPath}'`)) return s;
  const anchor = "import { EventDetailAboutSection } from '../components/events/EventDetailAboutSection';";
  if (s.includes(anchor)) {
    return s.replace(anchor, `${anchor}\nimport { ${symbol} } from '${fromPath}';`);
  }
  const mapAnchor = "import { EventDetailMapSection } from '../components/events/EventDetailMapSection';";
  return s.replace(mapAnchor, `${mapAnchor}\nimport { ${symbol} } from '${fromPath}';`);
}

function stripLucide(s) {
  const icons = ['Calendar', 'Clock', 'MapPin', 'ShieldCheck'];
  let m = s.match(/import \{([^}]+)\} from 'lucide-react';/);
  if (!m) return s;
  const kept = m[1]
    .split(',')
    .map((x) => x.trim())
    .filter((x) => {
      if (!x || !icons.includes(x)) return Boolean(x);
      return new RegExp(`<${x}\\b`).test(s);
    });
  if (kept.length === 0) {
    return s.replace(/\s*import \{[^}]+\} from 'lucide-react';\r?\n/, '\n');
  }
  return s.replace(m[0], `import { ${kept.join(', ')} } from 'lucide-react';`);
}

function stripDateFns(s) {
  if (s.includes('parseISO(') || s.includes('format(')) return s;
  return s.replace(/\s*import \{ format, parseISO \} from 'date-fns';\r?\n/, '\n');
}

for (const [name, accent, dark] of pages) {
  const file = path.join('src/pages', name);
  let s = fs.readFileSync(file, 'utf8');
  if (!metaRe.test(s)) {
    console.error('no meta block', name);
    process.exit(1);
  }
  if (!organizerRe.test(s)) {
    console.error('no organizer block', name);
    process.exit(1);
  }
  const darkAttr = dark ? ' darkSurface' : '';
  s = s.replace(
    metaRe,
    `\n             <EventDetailMetaSection event={event} accent="${accent}"${darkAttr} />\n             <EventDetailMapSection`,
  );
  s = s.replace(
    organizerRe,
    `\n             <EventDetailOrganizerSection organizer={organizer} accent="${accent}"${darkAttr} />\n\n             {/* High Trust / Outdoor`,
  );
  s = ensureImport(s, 'EventDetailMetaSection', '../components/events/EventDetailMetaSection');
  s = ensureImport(s, 'EventDetailOrganizerSection', '../components/events/EventDetailOrganizerSection');
  s = stripLucide(s);
  s = stripDateFns(s);
  if (!s.includes('<Link ')) {
    s = s.replace(/\s*import \{([^}]*),?\s*Link([^}]*)\} from 'react-router-dom';/, (full, a, b) => {
      const parts = `${a}${b}`
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x && x !== 'Link');
      if (parts.length === 0) return "\nimport { useParams, useNavigate } from 'react-router-dom';";
      return `\nimport { ${parts.join(', ')} } from 'react-router-dom';`;
    });
  }
  fs.writeFileSync(file, s);
  console.log('ok', name);
}
