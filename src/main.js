import './assets/main.css';

import './common/common';
import './common/date';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

const userId = parseInt(localStorage.userId || 0);

const { default: App } = await import(`./roles/${userId > 1 ? 'doctor' : userId ? 'admin' : 'guest'}/App.vue`);
const { router } = await import(`./roles/${userId > 1 ? 'doctor' : userId ? 'admin' : 'guest'}/router.js`);

createApp(App)
    .use(router)
    .use(createPinia())
    .mount('#app');
