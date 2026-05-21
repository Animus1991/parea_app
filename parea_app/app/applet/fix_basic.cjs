const fs = require('fs');
const path = require('path');

function processFile(p) {
  let content = fs.readFileSync(p, 'utf8');
  let changed = false;

  // 1. Remove duplicate t declarations.
  if (content.match(/const\s+\{\s*t\s*\}\s*=\s*useLanguage\(\)\s*;/g)?.length > 1) {
    let first = true;
    content = content.replace(/const\s+\{\s*t\s*\}\s*=\s*useLanguage\(\)\s*;/g, (match) => {
      if (first) {
        first = false;
        return match;
      }
      return '';
    });
    changed = true;
  }

  // 2. Remove broken {t(``, ``)} at EOF
  if (content.includes('{t(``, ``)}')) {
    content = content.replace(/\{t\(\`\`,\s*\`\`\)\}$/gm, '');
    changed = true;
  }

  // 3. Fix navigate errors
  if (p.includes('EventCard.tsx')) {
    // EventCard seems to have unclosed template literals?
    // Let's just fix the onClick arrow function
    if (content.includes('onClick={() => navigate(`/events/${event.id}')) {
      content = content.replace(/onClick=\{\(\) => navigate\(\`\/events\/\$\{event\.id\}\n\s*\>/g, 'onClick={() => navigate(`/events/${event.id}`)}\n    >');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(p, content);
    console.log('Fixed syntax anomalies in', p);
  }
}

function walk(dir) {
  for (let f of fs.readdirSync(dir)) {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) processFile(p);
  }
}

walk('src');
