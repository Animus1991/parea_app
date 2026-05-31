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

const re = /function Group\([\s\S]*?\r?\n\}\r?\n\r?\nexport default/;

for (const [name, accent, dark] of pages) {
  const file = path.join('src/pages', name);
  let s = fs.readFileSync(file, 'utf8');
  const darkAttr = dark ? ' darkSurface' : '';
  const replacement = `function Group({ group, event, navigate }: { group: import('../types').Group; event: import('../types').Event; navigate: import('react-router-dom').NavigateFunction }) {
  return <EventDetailGroupCard group={group} event={event} navigate={navigate} accent="${accent}"${darkAttr} />;
}

export default`;
  if (!re.test(s)) {
    console.error('no match', name);
    process.exit(1);
  }
  s = s.replace(re, replacement);
  if (!s.includes('EventDetailGroupCard')) {
    s = s.replace(
      "import { EventDetailQrModal } from '../components/events/EventDetailQrModal';",
      "import { EventDetailGroupCard } from '../components/events/EventDetailGroupCard';\nimport { EventDetailQrModal } from '../components/events/EventDetailQrModal';",
    );
  }
  fs.writeFileSync(file, s);
  console.log('ok', name);
}
