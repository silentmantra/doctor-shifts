import { createRouter } from '@/common/utils';

export const router = createRouter({
    path: '/',
    name: 'main',
    component: () => import('./Main.vue')
});

