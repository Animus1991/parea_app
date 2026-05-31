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



const aboutRe =

  /\s*<div className="pt-5 border-t border-gray-\d+ mt-5">\s*<h3 className="text-\[11px\][\s\S]*?About the experience'\)\}<\/h3>[\s\S]*?<\/div>\s*\r?\n\s*\{organizer && \(/;



function ensureImport(s, symbol, fromPath) {

  if (s.includes(`from '${fromPath}'`)) return s;

  const anchor = "import { EventDetailMapSection } from '../components/events/EventDetailMapSection';";

  if (s.includes(anchor)) {

    return s.replace(

      anchor,

      `${anchor}\nimport { ${symbol} } from '${fromPath}';`,

    );

  }

  const groupAnchor = "import { EventDetailGroupCard } from '../components/events/EventDetailGroupCard';";

  return s.replace(

    groupAnchor,

    `${groupAnchor}\nimport { ${symbol} } from '${fromPath}';`,

  );

}



function stripUnused(s) {

  if (!s.includes('homePathWithSearch(')) {

    s = s.replace(

      /import \{ homePathWithSearch \} from '\.\.\/lib\/homeDeepLinks';\r?\n/,

      '',

    );

  }

  if (!s.includes('<Hash')) {

    s = s.replace(/\s*Hash,?\r?\n/, '\n');

  }

  if (!s.includes('<ExternalLink')) {

    s = s.replace(/\s*ExternalLink,?\r?\n/, '\n');

  }

  return s;

}



for (const [name, accent, dark] of pages) {

  const file = path.join('src/pages', name);

  let s = fs.readFileSync(file, 'utf8');

  if (!aboutRe.test(s)) {

    console.error('no about block', name);

    process.exit(1);

  }

  const darkAttr = dark ? ' darkSurface' : '';

  const replacement = `\n             <EventDetailAboutSection event={event} accent="${accent}"${darkAttr} />\n\n             {organizer && (`;

  s = s.replace(aboutRe, replacement);

  s = ensureImport(s, 'EventDetailAboutSection', '../components/events/EventDetailAboutSection');

  s = stripUnused(s);

  fs.writeFileSync(file, s);

  console.log('ok', name);

}

