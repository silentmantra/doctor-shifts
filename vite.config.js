import { fileURLToPath, pathToFileURL, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import path from 'path';
import fs from 'fs';
import { globExports } from './node-utils.mjs';
import './index.js';

export default defineConfig(async ({ command, mode, ssrBuild }) => {

    // collect vite plugins and apply them automatically
    const configDir = path.dirname(fileURLToPath(import.meta.url));

    const globals = await globExports('./src/common/utils.js');
    'createApp watch watchEffect onMounted onUnmounted onUpdated ref unref computed reactive'.words.forEach(name => globals[name] = 'vue');

    const importPlugins = dir => Promise.all(
        fs
            .readdirSync(dir)
            .filter(name => name.startsWith('vite.plugin.'))
            .map(async path => (await import(pathToFileURL(dir + '/' + path))).default)
    );

    const plugins = [...await importPlugins(configDir)];

    console.log(`VITE BUILD MODE: ${mode}, COMMAND: ${command}`);

    return {
        mode,
        command,
        resolve: {
            alias: [
                { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
            ]
        },
        plugins: [
            ...plugins.map(plugin => plugin({ command, mode, ssrBuild, projectRoot: process.cwd() })),
            vue(),
            AutoImport({
                imports: [
                    'vue-router',
                    {
                        'vue-router': ['createWebHashHistory'],
                        '@/stores/user': ['useUserStore']
                    }
                ],
                resolvers: [
                    name => {
                        if (name === 'constructor' || name === 'default') {
                            return;
                        }
                        if (globals[name]) {
                            return { name, from: globals[name] };
                        }
                    }
                ]
            })
        ],
        server: {
            strictPort: true,
            port: 8000,
        },
        build: {
            reportCompressedSize: !['dev', 'test'].includes(mode),
            target: mode === 'dev' ? 'esnext' : 'modules',
            emptyOutDir: true,
            manifest: true,
        },


    };

});