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

const adventureRe =
  /\s*\{\/\* High Trust \/ Outdoor Template Mock \*\/\}\s*\{\(event\.category === 'Hiking' \|\| event\.category === 'Nearby escapes'\) && \([\s\S]*?\)\}\s*\r?\n\s*<\/section>/;

const reliabilityRe =
  /\s*\{\/\* Contextual Context Note \*\/\}\s*<section className="rounded-[^"]+">[\s\S]*?Why this group is reliable[\s\S]*?<\/section>/;

function ensureImport(s, symbol, fromPath) {
  if (s.includes(`from '${fromPath}'`)) return s;
  const anchor = "import { EventDetailOrganizerSection } from '../components/events/EventDetailOrganizerSection';";
  return s.replace(
    anchor,
    `${anchor}\nimport { ${symbol} } from '${fromPath}';`,
  );
}

for (const [name, accent, dark] of pages) {
  const file = path.join('src/pages', name);
  let s = fs.readFileSync(file, 'utf8');
  if (!adventureRe.test(s)) {
    console.error('no adventure block', name);
    process.exit(1);
  }
  if (!reliabilityRe.test(s)) {
    console.error('no reliability block', name);
    process.exit(1);
  }
  const darkAttr = dark ? ' darkSurface' : '';
  const safetyLine = `             <EventDetailSafetySection event={event} accent="${accent}"${darkAttr} />\n             <EventDetailAdventureSection event={event} accent="${accent}"${darkAttr} />\n          </section>`;

  s = s.replace(adventureRe, safetyLine);

  s = s.replace(
    reliabilityRe,
    `\n          <EventDetailReliabilityNote event={event} accent="${accent}"${darkAttr} />`,
  );

  s = ensureImport(s, 'EventDetailSafetySection', '../components/events/EventDetailSafetySection');
  s = ensureImport(s, 'EventDetailAdventureSection', '../components/events/EventDetailAdventureSection');
  s = ensureImport(s, 'EventDetailReliabilityNote', '../components/events/EventDetailReliabilityNote');

  if (!s.includes('<Users')) {
    s = s.replace(/\s*Users,?\r?\n/, '\n');
  }
  if (!s.includes('<MapPin') && !s.includes('MapPin className')) {
    s = s.replace(/\s*MapPin,?\r?\n/, '\n');
  }
  if (!s.includes('<CheckCircle')) {
    s = s.replace(/\s*CheckCircle,?\r?\n/, '\n');
  }
  if (!s.includes('<ShieldCheck')) {
    s = s.replace(/\s*ShieldCheck,?\r?\n/, '\n');
  }

  fs.writeFileSync(file, s);
  console.log('ok', name);
}
