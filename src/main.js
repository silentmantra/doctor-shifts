import './assets/main.css';

import './common/common';
import './common/date';

import { createPinia } from 'pinia';
import { RouterView as App } from 'vue-router';
import { createRouter, formatDate } from '@/common/utils';

(async () => {

    const userId = parseInt(localStorage.userId || 0);
    let router;
    try {
        ({ router } = await import(`./roles/${userId > 1 ? 'doctor' : userId ? 'admin' : 'guest'}/router.js`));
    } catch (e) {
        router = createRouter({
            path: '/',
            name: 'main',
            component: () => import(`./roles/${userId > 1 ? 'doctor' : userId ? 'admin' : 'guest'}/Main.vue`)
        });
    }

    const app = createApp(App);

    Object.assign(app.config.globalProperties, {
        formatDate
    });

    app.use(router)
        .use(createPinia())
        .mount('#app');


})();

