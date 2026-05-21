const fs = require('fs');
const path = require('path');

function fixFile(p) {
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;
  
  // Fix {t(`...`, `...
  c = c.replace(/\{t\(\`([^`]*)\`,\s*\`([^`]*)$/gm, '{t(`$1`, `$2`)}');
  c = c.replace(/\{t\(\`([^`]*)\`,\s*\`([^`]*)\"$/gm, '{t(`$1`, `$2`)}"');
  c = c.replace(/\{t\(\`([^`]*)\`,\s*\`([^`]*)\<$/gm, '{t(`$1`, `$2`)}<');
  c = c.replace(/\{t\(\`([^`]*)\`,\s*\`([^`]*)\>$/gm, '{t(`$1`, `$2`)}>');
  
  // Custom fixes for EventCard
  c = c.replace(/onClick=\{\(\) => navigate\(\`\/events\/\$\{event\.id\}(\s*\n)/g, 'onClick={() => navigate(`/events/${event.id}`)}$1');

  if (c !== orig) {
     fs.writeFileSync(p, c);
     console.log('Fixed', p);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (let f of fs.readdirSync(dir)) {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) fixFile(p);
  }
}
walk('src');
