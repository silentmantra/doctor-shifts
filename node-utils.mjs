import _glob from 'fast-glob';
import { fileURLToPath } from 'node:url';
import fs from 'fs';
import { dirname } from 'path';
import { parse as acornParse } from 'acorn';

export async function resolve(dirs, id, importer, subdir = '', excludeDir = '') {

    //todo: search only inside dirs

    const dir = dirname(importer);
    let path = dir + (subdir ? '/**/' + subdir : '') + '/**/' + id;
    const found = await glob(excludeDir ? [path, '!' + excludeDir] : path, { absolute: true });

    if (!found.length) {

        if (dir === '/') {
            return;
        }
        //console.log(`NOT FOUND ${id} in ${dir}, looking in parent dir`);
        return resolve(dirs, id, dirname(dir) + '/dummy.file', subdir, dir);
    }

    found.sort((a, b) => a.length - b.length); // use shortest path
    return found[0];

}

export function glob(path, options = { absolute: true }) {
    if (typeof path === 'string') {
        path = [path];
    }

    // fucking Windows...
    path = path.map(path => path.replaceAll('\\', '/'));

    if (options.cwd) {
        let dir = options.cwd;
        if (dir.startsWith('file:/')) {
            dir = fileURLToPath(dir);
            if (!fs.lstatSync(dir).isDirectory()) {
                dir = dirname(dir);
            }
            options.cwd = dir;
        }
    }

    return _glob(path, options);
}

function getExports(file) {

    const code = acornParse(fs.readFileSync(file).toString(), { sourceType: 'module', ecmaVersion: 'latest' });

    return code.body
        .filter(node => node.type === 'ExportNamedDeclaration')
        .map(node => {
            if (node.declaration.type === 'VariableDeclaration') {
                return node.declaration.declarations[0].id.name;
            } else if (node.declaration.type === 'FunctionDeclaration') {
                return node.declaration.id.name;
            }
        }).filter(Boolean);
}

export async function globExports(pattern) {

    const files = await glob(pattern, { absolute: true });

    const out = {};

    for (const file of files) {
        for (const name of getExports(file)) {
            out[name] = file;
        }
    }

    return out;

}