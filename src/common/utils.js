import { watch, toRef, getCurrentInstance } from 'vue';
import { createRouter as createVueRouter, createWebHistory } from 'vue-router';

export function createRouter(...routes) {

    const router = createVueRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: routes.flat()
    });

    const _push = router.push;

    router.push = function (...args) {

        //todo: preserve only the parent's params

        if (typeof args[0] === 'object') {
            for (const name in router.currentRoute.value.params) {
                args[0].params ?? (args[0].params = {});
                if (name in args[0].params) {
                    continue;
                }
                args[0].params[name] = router.currentRoute.value.params[name];
            }
        }

        return _push.apply(router, args);

    };

    return router;

}

export function propsToRefs() {

    const { props } = getCurrentInstance();

    const out = {};

    for (const name in props) {
        out[name] = toRef(props, name);
    }

    return out;
}

export function watchPost(...args) {
    return watch(...args, { flush: 'post' });
}

export function watchDeepPost(...args) {
    return watch(...args, { deep: true, flush: 'post' });
}

const weekdays = 'Понедельник Вторник Среда Четверг Пятница Суббота Воскресенье'.match(/[^\s]+/g);

export function formatDate(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    let index = date.getDay() - 1;
    index === -1 && (index = 6);
    return '<b>' + day + '.' + month + '</b> ' + weekdays[index];
}

export function formatHour(date) {
    if (typeof date === 'number') {
        return date.toString().padStart(2, '0');
    }
    return date.getHours().toString().padStart(2, '0');
}

export function getScrollbarWidth() {

    var inner = document.createElement('p');
    inner.style.width = '100%';
    inner.style.height = '200px';

    var outer = document.createElement('div');
    outer.style.position = 'absolute';
    outer.style.top = '0px';
    outer.style.left = '0px';
    outer.style.visibility = 'hidden';
    outer.style.width = '200px';
    outer.style.height = '150px';
    outer.style.overflow = 'hidden';
    outer.appendChild(inner);

    document.body.appendChild(outer);
    var w1 = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    var w2 = inner.offsetWidth;
    if (w1 == w2) {
        w2 = outer.clientWidth;
    }

    document.body.removeChild(outer);

    return (w1 - w2);
};