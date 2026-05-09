const fs = require('fs');
const path = require('path');

function replaceAlias(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceAlias(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;
            
            // Very naive replacement but safe for these components
            const depth = fullPath.split(path.sep).length - 2; // src/components/ui/button.tsx -> depth 3 (from root), so 2 levels up to src
            let relativePathToSrc = Array(depth-1).fill('..').join('/');
            if (relativePathToSrc === '') relativePathToSrc = '.';
            
            newContent = newContent.replace(/@\/lib\/utils/g, relativePathToSrc + '/lib/utils');
            newContent = newContent.replace(/@\/components\//g, relativePathToSrc + '/components/');
            newContent = newContent.replace(/@\/hooks\//g, relativePathToSrc + '/hooks/');
            
            if (newContent !== content) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
            }
        }
    }
}

replaceAlias(path.join(__dirname, 'src'));
console.log('Paths replaced!');
