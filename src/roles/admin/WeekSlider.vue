<script setup>

import { reactive, onMounted, ref, watch } from 'vue';
import { formatWeek, propsToRefs, watchPost } from '@/common/utils';

defineProps('date'.words);
const { date } = propsToRefs();

const WEEK_COUNT = 4;

const days = reactive((new Array(WEEK_COUNT).fill(null).map(() => new Date)));

watch(date, calcDays);
calcDays();

function calcDays() {

    const monday = Date.Today().snapDayBack(1);

    let start = monday.clone();
    let current;

    if (date.value > monday) {
        while (date.value > (current = start.addWeek(4))) {
            start = current;
        }
    } else {
        while (date.value < (current = start.addWeek(-4))) {
            start = current;
        }
    }

    if (days[0].isSame(date.value.snapDayBack(1))) {
        return;
    }

    for (let i = 0; i < WEEK_COUNT; i++) {
        const day = start.clone();
        days[i].setTime(day.addWeek(i).getTime());
    }

}

const list = ref();
const activeDateRect = ref({ width: 0, left: 0 });
watchPost(date, markActiveDate);
onMounted(markActiveDate);

function markActiveDate() {
    const rect = list.value.querySelector('.active')?.getBoundingClientRect();
    if (!rect) {
        return;
    }
    const listRect = list.value.getBoundingClientRect();
    activeDateRect.value = { width: rect.width, left: rect.left - listRect.left };
}

</script>

<template>
    <div class="relative" @wheel="$emit('date', date.addWeek($event.deltaY > 0 ? 1 : -1))">
        <div class="round-button" @click="$emit('date', date.addWeek(-1))">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z"
                    fill="rgba(115,174,234,1)" />
            </svg>
        </div>
        <ul ref="list" class="w-full flex py-3 px-[50px]">
            <li class="absolute z-[-1] top=0 h-[32px] bg-[color:var(--bg-color)] rounded-xl transition-all"
                :style="{left: activeDateRect.left + 'px', width: activeDateRect.width + 'px'}"></li>
            <li
                v-for="day of days"
                :key="day"
                class="flex-grow text-center">
                <a
                    @click="$emit('date', day)"
                    v-html="formatWeek(day)"
                    :class="{ active: day.isSameWeek(date)}"
                    class="
                        block px-3 py-1 rounded-xl cursor-pointer 
                        hover:underline hover:[&.active]:no-underline 
                        [&.active]:bg2-[color:var(--bg-color)] 
                        [&.active]:text-white transition-colors duration-500
                    ">
                </a>
            </li>
        </ul>
        <div class="round-button right-0" @click="$emit('date', date.addWeek())">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                    fill="rgba(115,174,234,1)" />
            </svg>
        </div>
    </div>
</template>

<style scoped>
    .round-button { @apply
        top-[10px]
    }
</style>