import fs from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'path';
import './index.js';

// auto-import directives in templates (cannot do it with unplugin-vue-components ({directives: true}))

export default function () {

    const dir = path.dirname(fileURLToPath(import.meta.url)) + '/src/directives';
    const directives = fs.readdirSync(dir);

    const standardDirectives = new Set('text html show if else else-if for on bind model slot pre once memo cloak'.words);

    return {
        transform({ dom, imports, walk }) {

            return walk(dom, elem => {

                for (const attr of elem.attributes) {

                    if (attr.name.startsWith('v-')) {

                        const name = attr.name.match(/v-(.*)/)[1];

                        if (directives.includes(`${name}.js`)) {
                            imports.push(`import {default as v${name.camelize().capitalize()}} from '@frontend/directives/${name}'`);
                        }
                    }
                }
            });

        },

    }
}