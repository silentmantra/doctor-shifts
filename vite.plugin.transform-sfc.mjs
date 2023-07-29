import fs from 'fs';
import { JSDOM } from 'jsdom';
import { glob } from './node-utils.mjs';
import { pathToFileURL } from 'node:url';

const document = new JSDOM('').window.document;

var isHTML = (function () {
    var unknown = '[object HTMLUnknownElement]', overrides = { CANVAS: 1, VIDEO: 1 }; //html5 elements. Some browsers don't support these.
    return function (tag) {
        return overrides[tag = tag.toUpperCase()] || (!overrides.hasOwnProperty(tag) && (overrides[tag] = (document.createElement(tag).toString() !== unknown)));
    };
})();

export default function ({ projectRoot, frontendDir }) {

    let plugins;
    let config;

    return {

        name: 'transform-sfc',

        config(val) {
            config = val;
        },

        async resolveId(id, importer) {

            //find bare vue component imports
            if (id.endsWith('.vue') && !id.includes('/')) {

                let files = await glob(projectRoot + '/**/' + id, { absolute: true });

                if (!files.length) {
                    files = await glob(frontendDir + '/components/**/' + id, { absolute: true });
                }

                if (!files.length) {
                    throw new Error(`Component ${id} not found`);
                }

                if (files.length > 1) {
                    this.warn('Ambigous resolve: ' + files.join(', '));
                }

                return files[0];
            }

        },

        async load(id) {

            if (!id.endsWith('.vue')) {
                return;
            }

            plugins ??= await Promise.all((await glob('vite.transform-sfc.*', { absolute: true, cwd: import.meta.url }))
                .map(async path => (await import(pathToFileURL(path))).default({ config, projectRoot, frontendDir })));

            let code = fs.readFileSync(id).toString();

            const template = code.match(/<template>(.*)<\/template>/msi)?.[1];
            if (!template) {
                return;
            }

            let style = code.match(/<style[^>]+>(.*)<\/style>/msi)?.[1];

            const frag = JSDOM.fragment('<div>' + template + '</div>').children[0];

            const imports = [];

            for (const plugin of plugins) {

                const html = frag.innerHTML;

                const result = await plugin.transform({ id, code, imports, dom: frag, walk, config });

                if (result?.code) {
                    code = result.code;
                }

                if (html !== frag.innerHTML) {
                    code = code.replace(/<template>.*<\/template>/msi, '<template>' + frag.innerHTML + '</template>');
                }

            }

            if (imports.length) {
                if (!code.includes('<script setup>')) {
                    code = '<script setup>\n' + [...new Set(imports)].join(';\n') + ';\n</script>' + code;
                } else {
                    code = code.replace('<script setup>', '<script setup>\n' + [...new Set(imports)].join(';\n') + ';\n');
                }
            }

            //code = code.replace(/<style([^>]+)>.*<\/style>/msi, '<style$1>' + style + '</style>');

            async function walk(parent, cb, level = 0, props = {}) {
                if (parent.tagName === 'TEMPLATE') {
                    parent = parent.content;
                }
                for (const elem of parent.children) {
                    if (elem.tagName === 'svg') {
                        continue;
                    }
                    props.isHTML = !elem.tagName.includes('-') && isHTML(elem.tagName);
                    await cb(elem, level, props);
                    elem.children && await walk(elem, cb, level + 1, props);
                }
            }

            return {
                code
            };
        },

    }
}

