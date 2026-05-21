const fs = require('fs');
const path = require('path');
const { Project, SyntaxKind } = require('ts-morph');

const project = new Project({
    tsConfigFilePath: './tsconfig.json',
});

const skipDirs = ['components/ui', 'hooks', 'lib'];
let changedFiles = 0;

function getImportPath(sourcePath) {
    const depth = sourcePath.split('/src/')[1].split('/').length - 1;
    if (depth === 0) return './lib/i18n';
    return '../'.repeat(depth) + 'lib/i18n';
}

project.getSourceFiles().forEach(sourceFile => {
    const filePath = sourceFile.getFilePath();
    if (filePath.endsWith('.json')) return;
    if (skipDirs.some(dir => filePath.includes('/src/' + dir + '/'))) return;

    let changed = false;
    let needsImport = false;

    sourceFile.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.JsxText) {
            const text = node.getText();
            const trimmedText = text.trim();
            if (/[α-ωΑ-Ω]/.test(trimmedText)) {
                const parent = node.getParent();
                if (parent.getKind() === SyntaxKind.JsxElement || parent.getKind() === SyntaxKind.JsxFragment) {
                    const spacesMatch = text.match(/^([\s\n]*)/);
                    const leadingSpaces = spacesMatch ? spacesMatch[0] : '';
                    const spacesMatchEnd = text.match(/([\s\n]*)$/);
                    const trailingSpaces = spacesMatchEnd ? spacesMatchEnd[0] : '';

                    const safeGreek = trimmedText.replace(/`/g, '\\`');
                    // We use t(`text`, `text`)
                    node.replaceWithText(`${leadingSpaces}{t(\`${safeGreek}\`, \`${safeGreek}\`)}${trailingSpaces}`);
                    changed = true;
                    needsImport = true;
                }
            }
        }
    });

    if (changed) {
        if (needsImport) {
            const imports = sourceFile.getImportDeclarations();
            const hasUseLanguage = imports.some(imp => imp.getNamedImports().some(n => n.getName() === 'useLanguage'));
            let hasUseLanguageCall = false;

            sourceFile.forEachDescendant(node => {
                if (node.getKind() === SyntaxKind.CallExpression) {
                    if (node.getExpression().getText() === 'useLanguage') {
                        hasUseLanguageCall = true;
                    }
                }
            });

            if (!hasUseLanguage) {
                sourceFile.insertImportDeclaration(0, {
                    namedImports: ['useLanguage'],
                    moduleSpecifier: getImportPath(filePath)
                });
            }

            if (!hasUseLanguageCall) {
                // Try to find the export default function or main component function and inject
                const functions = sourceFile.getFunctions();
                const arrowFunctions = sourceFile.getVariableDeclarations().filter(v => v.getInitializer()?.getKind() === SyntaxKind.ArrowFunction);
                
                // We'll just print if it needs manual fix
                console.log(`Need to add 'const { t } = useLanguage();' to ${filePath}`);
            }
        }
        sourceFile.saveSync();
        changedFiles++;
    }
});

console.log('Modified', changedFiles, 'files.');
