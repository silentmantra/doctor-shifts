
// auto-import components in templates (unplugin-vue-components is dump and doesnt react to moving / new files)

export default function () {

    const known = new Set('RouterLink RouterView KeepAlive Teleport Component Transition'.words);

    return {

        transform({ dom, imports, walk }) {

            return walk(dom, async (elem, level, { isHTML }) => {

                if (!isHTML) {

                    const name = elem.tagName.toLowerCase().camelize().capitalize();

                    if (known.has(name)) {
                        return;
                    }

                    imports.push(`import ${name} from '${name + '.vue'}'`);

                }
            });

        },

    }
}