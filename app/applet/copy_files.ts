import * as fs from 'fs';
import * as path from 'path';

function copyFolderSync(from: string, to: string) {
    if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
    }
    const elements = fs.readdirSync(from);
    for (const element of elements) {
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);
        const stat = fs.lstatSync(fromPath);
        if (stat.isFile()) {
            fs.copyFileSync(fromPath, toPath);
            console.log(`Copied ${fromPath} to ${toPath}`);
        } else if (stat.isDirectory()) {
            copyFolderSync(fromPath, toPath);
        }
    }
}

copyFolderSync('./clone_repo/artifacts/nakamas/src', './src');

if (fs.existsSync('./clone_repo/artifacts/nakamas/components.json')) {
    fs.copyFileSync('./clone_repo/artifacts/nakamas/components.json', './components.json');
    console.log('Copied components.json');
}
