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

const mapRe =
  /\s*<div className=\{`\$\{isMapFullscreen[\s\S]*?\r?\n\s*<\/div>\s*\r?\n\s*<div className="pt-5 border-t/;

for (const [name, accent, dark] of pages) {
  const file = path.join('src/pages', name);
  let s = fs.readFileSync(file, 'utf8');
  const darkAttr = dark ? ' darkSurface' : '';
  const replacement = `\n             <EventDetailMapSection event={event} accent="${accent}"${darkAttr} />\n             <div className="pt-5 border-t`;
  if (!mapRe.test(s)) {
    console.error('no map match', name);
    process.exit(1);
  }
  s = s.replace(mapRe, replacement);
  s = s.replace(/\s*const \[isMapFullscreen, setIsMapFullscreen\] = useState\(false\);\r?\n/, '\n');
  s = s.replace(/\s*const apiKey = \(import\.meta as any\)\.env\?\.VITE_GOOGLE_MAPS_API_KEY \|\| '';\r?\n/, '\n');
  s = s.replace(/\s*const apiKey = getGoogleMapsApiKey\(\);\r?\n\s*const mapsReady = isGoogleMapsConfigured\(\);\r?\n/, '\n');
  if (!s.includes('EventDetailMapSection')) {
    const mapImport =
      "import { EventDetailMapSection } from '../components/events/EventDetailMapSection';";
    if (s.includes("import { EventDetailGroupCard }")) {
      s = s.replace(
        "import { EventDetailGroupCard } from '../components/events/EventDetailGroupCard';",
        `import { EventDetailGroupCard } from '../components/events/EventDetailGroupCard';\n${mapImport}`,
      );
    } else if (s.includes("import { EventDetailActionBar }")) {
      s = s.replace(
        "import { EventDetailActionBar } from '../components/events/EventDetailActionBar';",
        `import { EventDetailActionBar } from '../components/events/EventDetailActionBar';\n${mapImport}`,
      );
    } else {
      s = s.replace(
        /(import \{ useEventDetailActions \}[^\n]+\n)/,
        `$1${mapImport}\n`,
      );
    }
  }
  s = s.replace(
    /import \{ APIProvider, Map, AdvancedMarker, Pin \} from '@vis\.gl\/react-google-maps';\r?\n/,
    '',
  );
  s = s.replace(
    /import \{ getGoogleMapsApiKey, isGoogleMapsConfigured \} from '\.\.\/lib\/maps';\r?\n/,
    '',
  );
  if (/Maximize|Minimize/.test(s) && !s.includes('EventDetailMapSection')) {
    /* keep Maximize if used elsewhere */
  }
  fs.writeFileSync(file, s);
  console.log('ok', name);
}
