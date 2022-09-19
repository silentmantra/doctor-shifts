<script setup>

import { ref, reactive, watch, computed, toRef } from 'vue';
import { RouterView, RouterLink, useRouter } from 'vue-router';

import { overlaps, propsToRefs } from '@/common/utils';

import Layout from '@/components/Layout.vue';
import CheckboxSelect from '@/components/CheckboxSelect.vue';
import DateSlider from './DateSlider.vue';
import ShiftHours from '@/components/ShiftHours.vue';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const store = useUserStore();

const search = ref(localStorage.search || '');
watch(search, val => localStorage.search = val);

const props = defineProps('currentDate displayMode selection'.words);
const { currentDate, displayMode, selection } = propsToRefs();

watch(displayMode, displayMode => router.push({ params: { displayMode } }));
watch(selection, selection => {

    const params = { selection: selection.join(',') };

    if (!selection.length && displayMode.value === 'selected') {
        params.displayMode = null;
    }
    router.push({ params });
});

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

        if (
            (current.length && !displayMode.value) ||
            displayMode.value === 'all' ||
            (displayMode.value === 'selected' && selection.includes(doctor.id))
        ) {
            list.push(reactive({
                doctorId: doctor.id,
                date: currentDate.value,
                title: doctor.title,
                shifts: current,
                selected: computed({
                    get: () => selection.includes(doctor.id),
                    set: val => {
                        if (val) {
                            if (selection.length >= 10) {
                                selection.shift();
                            }
                            selection.push(doctor.id);
                            return;
                        }
                        selection.remove(doctor.id);
                    }
                })
            }));
        }
    }

    return { list, hours };

});

function show(shifts) {
    alert(shifts.map(shift => shift.start.format('short') + ' - ' + shift.stop.format('short')).join('\n'));
}

</script>
    
<template>
    <Layout>
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
                <CheckboxSelect v-model="displayMode"
                    :items="selection.length ? {all: 'Показать всех', selected: 'Показать выбранных'} : {all: 'Показать всех'}" />
                <span v-if="selection.length" class="[&>*]:px-3 [&>*]:py-1 [&>*]:ml-5 [&>*]:bg-gray-400">
                    Выбранные:
                    <button>Редактировать</button>
                    <button @click="selection.clear()">Сбросить</button>
                </span>
            </div>

            <DateSlider :date="currentDate" @date="changeDate" />

        </template>

        <ShiftHours v-bind="{ data, selectable:true }" />

    </Layout>
    <RouterView />
</template>