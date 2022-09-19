<script setup>

import { reactive, computed } from 'vue';
import { useRouter } from 'vue-router';

import { overlaps, propsToRefs } from '@/common/utils';

import Main from '@/components/Main.vue';
import ShiftHours from '@/components/ShiftHours.vue';
import WeekSlider from './WeekSlider.vue';
import { useUserStore } from '@/stores/user';
import { formatDate } from '../../common/utils';

const router = useRouter();
const store = useUserStore();

const doctor = reactive(store.doctors.find(doctor => doctor.id === parseInt(localStorage.userId)));

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
            doctorId: doctor.id,
            date: from,
            title: formatDate(from),
            shifts: doctor.shifts.filter(shift => overlaps(shift, from, to))
        });

    });

    return { list, hours };

});

</script>
    
<template>
    <Main>

        <template #header>
            <h1 class="text-2xl mt-1">{{ doctor.title }}</h1>
        </template>

        <template #fixed>
            <WeekSlider :date="currentDate" @date="changeDate" />
        </template>

        <ShiftHours v-bind="{ data, currentDate }" />

    </Main>
</template>