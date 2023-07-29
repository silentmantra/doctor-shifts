<script setup>

import { overlaps, getScrollbarWidth, watchPost, formatHour, propsToRefs } from '@/common/utils';
import { useUserStore } from '@/stores/user';

defineProps('data selectable'.words);
const { data, selectable } = propsToRefs();

const store = useUserStore();

const someSelected = computed({
    get: () => data.value.list.some(schedule => schedule.selected),
    set: val => data.value.list.forEach(schedule => schedule.selected = false)
});

const storedSelection = ref([]);

watch(() => data.value.list.filter('selected').map('doctorId'), value => {
    storedSelection.value = value;
})

const doctorTitle = ref();
const hoursTitle = ref();

let maxTitleWidth;

const resizeTitle = () => {

    // avoid jumping, always expand

    const cell = doctorTitle.value?.[0];

    const width = cell?.offsetWidth || 150;

    if (maxTitleWidth === undefined || width > maxTitleWidth) {
        maxTitleWidth = width;
    }

    hoursTitle.value.style.width = maxTitleWidth + 'px';
    if (cell) {
        cell.style.minWidth = maxTitleWidth + 'px';
    }

};

onMounted(resizeTitle);
watchPost(data, resizeTitle);

const hoverPos = ref(0);
const hoverHour = ref(0);

function onMousemove(e) {
    const { left } = e.currentTarget.getBoundingClientRect();
    const offset = e.pageX - left;
    const width = e.currentTarget.offsetWidth / 24;
    hoverHour.value = Math.floor(offset / width);
    hoverPos.value = hoverHour.value * width;
}

function toggleHour(schedule) {

    const from = schedule.date.clone();
    from.setHours(hoverHour.value);

    // add 4 hours if there's no shifts yet for the day
    const to = from.addHour(schedule.shifts.length ? 1 : 4);

    const allocated = schedule.shifts.some(shift => overlaps(shift, from, to));

    store[allocated ? 'removeRange' : 'addRange'](schedule.doctorId, from, to);

}

</script>
<template>
    <dynamic-teleport to="#fixed">

        <table class="w-full">
            <tr>
                <td ref="hoursTitle">
                    <checkbox v-if="false && someSelected" v-model="someSelected" class="ml-2">
                        <span v-if="someSelected">Сбросить</span>
                        <span v-else>Восстановить</span>
                    </checkbox>
                </td>
                <td class="relative">
                    <ul class="flex border-b border-gray-200">
                        <li class="w-0 flex-grow relative text-center" v-for="(l, n) in 24">
                            <div
                                class="absolute z-0 w-full left-0 top-0 h-[2160px] border-l pointer-events-none"
                                :class="{
                                    'border-gray-200': n % 6 !== 0,
                                    'border-gray-300': n % 6 === 0,
                                    'bg-indigo-50': n >= 0 && n < 6, 
                                    'bg-green-50': n >= 6 && n < 12,
                                    'bg-yellow-50': n >= 12 && n < 18,
                                    'bg-orange-50' : n >= 18 && n < 24
                                }">
                            </div>
                            <div class="relative py-2 transition-colors border-b"
                                :class=" !data.hours[n] ? 'bg-red-500 text-white' : '' ">{{ formatHour(n) }}</div>
                        </li>
                    </ul>
                </td>
                <td :style="{width: getScrollbarWidth() + 'px'}"></td>
            </tr>
        </table>

    </dynamic-teleport>

    <table class="relative z-10">
        <tr v-for="schedule of data.list" :key="schedule.id"
            class="first:border-t-0"
            :class="{
                'cursor-pointer hover:bg-sky-200': !schedule.group,
                'border-t border-t-gray-300 border-b border-b-gray-300': schedule.group
            }">
            <template v-if="schedule.group">
                <td colspan="2">
                    <div class="relative text-center bg-white py-2 tracking-wider" v-html="schedule.group"></div>
                </td>
            </template>
            <template v-else>
                <td ref="doctorTitle" class="whitespace-nowrap px-2">
                    <checkbox class="!block" v-if="selectable" v-model="schedule.selected"><span
                            v-html="schedule.title"></span>
                    </checkbox>
                    <span v-else v-html="schedule.title"></span>
                </td>
                <td @mousemove="onMousemove" @click="toggleHour(schedule)"
                    class="group relative w-full overflow-hidden">
                    <ul>
                        <li class="top-[50%] -mt-[10px] absolute bg-emerald-400 rounded-lg h-[20px]"
                            v-for="shift of schedule.shifts" :key="shift"
                            :style="{
                                left: 'calc(' + shift.start.dayPercent(schedule.date, 2) + '% + 5px)',
                                right: 'calc(' + (100 - shift.stop.dayPercent(schedule.date)).toFixed(2) + '% + 5px)'
                            }"></li>
                    </ul>
                    <div style="width: calc(100% / 24)"
                        :style="{left: hoverPos + 'px'}"
                        class="top-0 text-center absolute group-hover:block hidden h-[100%] border border-gray-300 bg-[rgba(255,255,0,.3)]">
                        <span class="hidden text-3xl relative top-[-7px] text-[rgba(0,0,0,.5)]">{{ formatHour(hoverHour)
                        }}</span>
                    </div>
                </td>
            </template>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td></td>
        </tr>
    </table>

</template>