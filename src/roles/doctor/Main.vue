<script setup>

import { ref, reactive, watch, computed, onMounted } from 'vue';
import { RouterView, RouterLink, useRouter } from 'vue-router';

import { overlaps, getScrollbarWidth, watchPost, formatHour, propsToRefs } from '@/common/utils';

import Main from '@/components/Main.vue';
import WeekSlider from './WeekSlider.vue';
import { useUserStore } from '@/stores/user';
import { formatDate } from '../../common/utils';

const router = useRouter();
const store = useUserStore();

const doctorId = parseInt(localStorage.userId);
const doctor = reactive(store.doctors.find(doctor => doctor.id === doctorId));

defineProps(['currentDate']);
const { currentDate } = propsToRefs();

function changeDate(date) {
    router.push({ name: 'main', params: { date: date.format('shortDate').replaceAll('.', '-') } });
}

const data = computed(() => {

    const list = [];
    const hours = new Array(24).fill(true);

    const from = currentDate.value;

    //todo: optimize since the doctor's shifts are sorted
    from.eachDayOf(7, from => {

        const to = from.addDay();

        list.push({
            id: from.getTime(),
            title: formatDate(from),
            shifts: doctor.shifts.filter(shift => overlaps(shift, from, to))
        });

    });

    return { list, hours };

});

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

function show(shifts) {
    alert(shifts.map(shift => shift.start.format('short') + ' - ' + shift.stop.format('short')).join('\n'));
}

function json(what) {
    console.log(what);
}

const hoverPos = ref(0);
const hoverHour = ref(0);

function onMousemove(e) {
    const { left } = e.currentTarget.getBoundingClientRect();
    const offset = e.pageX - left;
    const width = e.currentTarget.offsetWidth / 24;
    hoverHour.value = Math.floor(offset / width);
    hoverPos.value = hoverHour.value * width;
}

function toggleHour(e, doctor) {

    const from = currentDate.value.clone();
    from.setHours(hoverHour.value);
    const to = from.addHour();

    const allocated = doctor.shifts.some(shift => overlaps(shift, from, to));
    allocated ? store.removeRange(doctor.id, from, to) : store.addRange(doctor.id, from, to);

}

</script>
    
<template>
    <Main>

        <template #header>
            <h1 class="text-2xl mt-1">{{ doctor.title }}</h1>
        </template>

        <template #fixed>

            <WeekSlider :date="currentDate" @date="changeDate" />

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

        </template>

        <table>
            <tr v-for="doctor of data.list" :key="doctor.id"
                class="cursor-pointer hover:bg-sky-200">
                <td ref="doctorTitle" class="whitespace-nowrap px-2" v-html="doctor.title">
                </td>
                <td @mousemove="onMousemove" @click="toggleHour($event, doctor)"
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
                            v-for="shift of doctor.shifts" :key="shift"
                            :style="{
                                left: 'calc(' + shift.start.dayPercent(currentDate, 2) + '% + 5px)',
                                right: 'calc(' + (100 - shift.stop.dayPercent(currentDate)).toFixed(2) + '% + 5px)'
                            }"></li>
                    </ul>
                    <div style="width: calc(100%/24)"
                        :style="{left: hoverPos + 'px'}"
                        class="top-0 text-center absolute group-hover:block hidden h-[100%] border border-gray-300 bg-[rgba(255,255,0,.3)]">
                        <span class="text-3xl relative top-[-7px] text-[rgba(0,0,0,.5)]">{{ formatHour(hoverHour)
                        }}</span>
                    </div>
                </td>
            </tr>
            <tr>
                <td>&nbsp;</td>
                <td></td>
            </tr>
        </table>

    </Main>
    <RouterView />
</template>