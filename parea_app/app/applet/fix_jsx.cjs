const fs = require('fs');

function countOpenTags(code) {
  // A very naive JSX tag stack parser
  const stack = [];
  // Ignore everything inside comments or braces `{}` if we can? We just need a naive one
  // match <Tag or </Tag>
  const tagRegex = /<\/?([A-Za-z0-9_-]+)/g;
  let match;
  while ((match = tagRegex.exec(code)) !== null) {
    const isClosing = match[0].startsWith('</');
    const tagName = match[1];
    
    // Ignore self-closing tags (we check if it ends with "/>" manually)
    // Actually, it's hard. Let's just find `</` and `<`.
  }
}

function closeTags(code) {
    // Better way: use a simple regex to find unclosed navigate stuff
    code = code.replace(/navigate\(\`\/events\/\$\{event\.id\}\n\s*\>/g, 'navigate(`/events/${event.id}`)}\n    >');
    code = code.replace(/\{t\(\`\`,\s*\`\`\)\}$/gm, '');

    // Let's just append closing tags based on a stack approach.
    // Instead of building a full parser, I will try to use the TS compiler API if it's available, but it fails on syntax error.
    
    return code;
}
