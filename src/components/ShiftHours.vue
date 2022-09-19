<script setup>

import { ref, watch, computed, onMounted } from 'vue';
import { overlaps, getScrollbarWidth, watchPost, formatHour, propsToRefs } from '@/common/utils';
import DynamicTeleport from '@/components/DynamicTeleport.vue';
import { useUserStore } from '@/stores/user';

defineProps('data'.words);
const { data } = propsToRefs();

const store = useUserStore();

const doctorTitle = ref();
const hoursTitle = ref();

const resizeTitle = () => {

    const cell = doctorTitle.value?.[0];

    if (cell) {
        hoursTitle.value.style.width = cell.offsetWidth + 'px';
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

function toggleHour(e, schedule) {

    const from = schedule.date.clone();
    from.setHours(hoverHour.value);
    const to = from.addHour();

    const allocated = schedule.shifts.some(shift => overlaps(shift, from, to));
    allocated ? store.removeRange(schedule.doctorId, from, to) : store.addRange(schedule.doctorId, from, to);

}

</script>
<template>
    <DynamicTeleport to="#fixed">

        <table class="w-full">
            <tr>
                <td ref="hoursTitle"></td>
                <td class="relative">
                    <ul class="flex border-b border-gray-200">
                        <li class="py-2 w-0 flex-grow relative text-center transition-colors" v-for="n in 24"
                            @click="json(data.hours[n-1])"
                            :class=" !data.hours[n - 1] ? 'bg-red-500 text-white' : '' ">{{ formatHour(n - 1) }}
                            <div
                                class="absolute left-0 top-0 h-[2160px] border-l border-gray-200 pointer-events-none">
                            </div>
                        </li>
                    </ul>
                </td>
                <td :style="{width: getScrollbarWidth() + 'px'}"></td>
            </tr>
        </table>

    </DynamicTeleport>

    <table>
        <tr v-for="schedule of data.list" :key="schedule.id"
            class="cursor-pointer hover:bg-sky-200">
            <td ref="doctorTitle" class="whitespace-nowrap px-2" v-html="schedule.title"></td>
            <td @mousemove="onMousemove" @click="toggleHour($event, schedule)"
                class="group relative w-full overflow-hidden">
                <ul class="hidden flex border-b border-gray-200">
                    <li class="py-2 w-0 flex-grow relative text-center transition-colors" v-for="n in 24"
                        @click="json(data.hours[n-1])"
                        :class=" !data.hours[n - 1] ? 'bg-red-500 text-white' : '' ">{{ formatHour(n - 1) }}
                        <div
                            class="absolute left-0 top-0 h-[2160px] border-l border-gray-200 pointer-events-none">
                        </div>
                    </li>
                </ul>
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
                    <span class="text-3xl relative top-[-7px] text-[rgba(0,0,0,.5)]">{{ formatHour(hoverHour) }}</span>
                </div>
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td></td>
        </tr>
    </table>

</template>