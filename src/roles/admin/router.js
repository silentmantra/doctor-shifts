import { createRouter } from '@/common/utils';

export const router = createRouter({
    path: '/:date(\\d{2}-\\d{2}-\\d{2})?/:displayMode(all|selected)?/:selection([\\d,]+)?',
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

        let selection = [];
        if (route.params.selection) {
            selection = route.params.selection.split(',').map(id => parseInt(id));
        }

        return { currentDate, displayMode: route.params.displayMode, selection };

    },
    children: [
        {
            path: 'add-doctor',
            name: 'add-doctor',
            component: () => import('./AddDoctor.vue')
        }
    ]
});
