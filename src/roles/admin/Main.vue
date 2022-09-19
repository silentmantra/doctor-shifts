<script setup>

import { ref, watch, computed, onMounted } from 'vue';
import { RouterView, RouterLink, useRouter } from 'vue-router';

import { overlaps, getScrollbarWidth, watchPost, formatHour, propsToRefs } from '@/common/utils';

import Main from '@/components/Main.vue';
import Checkbox from '@/components/Checkbox.vue';
import DateSlider from './DateSlider.vue';
import ShiftHours from '@/components/ShiftHours.vue';
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
                doctorId: doctor.id,
                date: currentDate.value,
                title: doctor.title,
                shifts: current
            });
        }
    }

    return { list, hours };

});

function show(shifts) {
    alert(shifts.map(shift => shift.start.format('short') + ' - ' + shift.stop.format('short')).join('\n'));
}

function json(what) {
    console.log(what);
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

        </template>

        <ShiftHours v-bind="{ data, currentDate }" />

    </Main>
    <RouterView />
</template>