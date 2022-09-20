<script setup>

import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';

import { inject, overlaps } from '@/common/utils';

import ShiftHours from '@/components/ShiftHours.vue';
import WeekSlider from './WeekSlider.vue';
import { useUserStore } from '@/stores/user';
import { formatDate } from '../../common/utils';
import DynamicTeleport from '../../components/DynamicTeleport.vue';

const router = useRouter();
const store = useUserStore();

const { currentDate, selection } = inject('currentDate selection');

const allDoctors = computed(() => store.doctors.filter(doctor => !selection.includes(doctor.id)));
const doctorToAdd = ref(0);
watch(doctorToAdd, () => {
    doctorToAdd.value && selection.unshift(doctorToAdd.value);
    doctorToAdd.value = 0;
});

const doctors = computed(() => store.doctors.filter(doctor => selection.includes(doctor.id)));

function changeDate(date) {
    router.pushParams({ date: date.format('shortDate').replaceAll('.', '-') });
}

const data = computed(() => {

    const list = [];
    const hours = new Array(24).fill(true);

    const monday = currentDate.value.snapDayBack(1);

    for (const doctor of doctors.value) {

        list.push({
            group: doctor.title
        });

        monday.eachDayOf(7, from => {

            const to = from.addDay();

            list.push({
                doctorId: doctor.id,
                date: from,
                title: formatDate(from),
                shifts: doctor.shifts.filter(shift => overlaps(shift, from, to))
            });

        });

    }

    return { list, hours };

});

</script>
        
<template>

    <DynamicTeleport to="#fixed">

        <div class="mt-2 [&>*]:mr-3 h-[34px]">

            <select class="py-1" v-model="doctorToAdd">
                <option value="0" disabled selected>Добавить врача к выбранным:</option>
                <option v-for="user of allDoctors" :key="user.id" :value="user.id">{{ user.title }}</option>
            </select>

            <template v-if="selection.length">
                Выбранные: {{ selection.length }}
                <button @click="selection.clear()">Сбросить</button>
            </template>

            <div class="float-right">
                <RouterLink :to="{name: 'day-hours'}"><button>Переключиться на дни</button></RouterLink>
            </div>

            <div class="clear-both"></div>
        </div>
        <WeekSlider :date="currentDate" @date="changeDate" />

    </DynamicTeleport>

    <ShiftHours v-bind="{ data }" />

</template>

<style scoped>
    button { @apply
        px-3 py-1 ml-5 
        bg-gray-400
    }
</style>