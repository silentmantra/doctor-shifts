<script setup>

import { computed } from 'vue';
import { formatDate, propsToRefs } from '@/common/utils';

defineProps(['date']);
const { date } = propsToRefs();

const days = computed(()=>{

    const out=[];

    const monday = date.value.snapDayBack(1);

    for (let i = 0; i < 7; i++) {
        const day = monday.clone();
        day.setDate(monday.getDate() + i);
        out.push(day);
    }

    return out;

});

</script>

<template>
    <div class="root relative">
        <div class="round-button" @click="$emit('date', date.addDay(-1))">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z"
                    fill="rgba(115,174,234,1)" />
            </svg>
        </div>
        <ul class="w-full flex py-3 px-[50px]">
            <li
                v-for="day of days"
                :key="day"
                class="flex-grow text-center">
                <a
                    @click="$emit('date', day)"
                    v-html="formatDate(day)"
                    :class="{ active: day.isSame(date)}"
                    class="block px-3 py-1 rounded-xl cursor-pointer hover:underline hover:[&.active]:no-underline [&.active]:bg-[color:var(--bg-color)] [&.active]:text-white">
                </a>
            </li>
        </ul>
        <div class="round-button right-0" @click="$emit('date', date.addDay())">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                    fill="rgba(115,174,234,1)" />
            </svg>
        </div>
    </div>
</template>

<style scoped>

    .root {
        --bg-color: #73AEEA;
        --button-size: 36px;
    }

    .round-button { @apply
        top-[10px]
        absolute 
        rounded-full 
        border border-[color:var(--bg-color)]
        h-[var(--button-size)] w-[var(--button-size)]
        cursor-pointer
        hover:shadow-md
        ;
        svg { @apply
            absolute
            top-[50%]
            left-[50%]
            mt-[-12px]
            ml-[-12px]
        }
    }
</style>