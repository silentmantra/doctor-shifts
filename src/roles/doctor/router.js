import { createRouter } from '@/common/utils';

export const router = createRouter({
    path: '/:date(\\d{2}-\\d{2}-\\d{2})?',
    name: 'main',
    component: () => import('./Main.vue'),
    props: route => {

        let currentDate;
        if (!route.params.date) {
            currentDate = Date.Today();
        } else {
            const [day, month, year] = route.params.date.split('-');
            currentDate = new Date(20 + year, month - 1, day);;
        }

        return { currentDate };

    }
});
