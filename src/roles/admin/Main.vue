<script setup>

import { ref, watch, computed, onMounted } from 'vue';
import { RouterView, RouterLink, useRouter } from 'vue-router';

import { getScrollbarWidth, watchPost, formatHour, propsToRefs } from '@/common/utils';

import Main from '@/components/Main.vue';
import Checkbox from '@/components/Checkbox.vue';
import DateSlider from './DateSlider.vue';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const store = useUserStore();

const search = ref(localStorage.search || '');
watch(search, val => localStorage.search = val);

const showAllDoctors = ref(false);

defineProps(['currentDate']);
const { currentDate } = propsToRefs();

function changeDate(date) {
    router.push({ name: 'main', params: { date: date.format('shortDate').replaceAll('.', '-') } });
}

function overlaps(shift, from, to) {

    if (shift.start >= from && shift.start < to) {
        return true;
    }

    if (shift.stop > from && shift.stop <= to) {
        return true;
    }

    if (shift.start >= from && shift.stop <= to) {
        return true;
    }

    if (from >= shift.start && to <= shift.stop) {
        return true;
    }

    return false;

}

const data = computed(() => {

    const list = [];
    const hours = new Array(24);

    const from = currentDate.value;
    const to = from.addDay();

    for (const doctor of store.doctors) {

        const current = [];

        for (const shift of doctor.shifts) {

            if (!overlaps(shift, from, to)) {
                continue;
            }

            current.push(shift);

            const hour = from.clone();

            // mark allocated hours
            for (let i = 0; i < 24; i++) {

                if (hours[i]) {
                    continue;
                }

                hour.setHours(i);
                const range = new DateRange(shift.start, shift.stop);
                if (range.includes(hour, hour.addHour())) {
                    hours[i] = { doctor, shift };
                }

            }

        }

        if (search.value && !doctor.title.toLowerCase().includes(search.value.toLowerCase())) {
            continue;
        }

        if (current.length || showAllDoctors.value) {
            list.push({
                id: doctor.id,
                title: doctor.title,
                shifts: current
            });
        }
    }

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
            <div class="[&>*]:mr-3">
                <RouterLink :to="{name:'add-doctor'}"><button>Добавить врача</button>
                </RouterLink>
                <button @click="store.generate()">Сгенерировать</button>
                <button @click="store.clear()">Очистить</button>
            </div>
        </template>

        <template #fixed>

            <div class="mt-2 [&>*]:mr-3">
                <input class="py-1" v-model="search" placeholder="Фильтр" />
                <Checkbox v-model="showAllDoctors">Показывать всех</Checkbox>
            </div>

            <DateSlider :date="currentDate" @date="changeDate" />

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
                <td ref="doctorTitle" class="whitespace-nowrap px-2">
                    <RouterLink :to="{name:'doctor', params:{id:doctor.id}}">{{ doctor.title }}</RouterLink>
                </td>
                <td @mousemove="onMousemove" @click="toggleHour($event, doctor)"
                    class="group relative w-full overflow-hidden">
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
                        <span class="text-3xl relative top-[-7px] text-[rgba(0,0,0,.5)]">{{ formatHour(hoverHour) }}</span>
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