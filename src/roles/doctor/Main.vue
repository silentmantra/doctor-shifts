<script setup>

import { reactive, computed } from 'vue';
import { useRouter } from 'vue-router';

import { overlaps, propsToRefs } from '@/common/utils';

import Layout from '@/components/Layout.vue';
import ShiftHours from '@/components/ShiftHours.vue';
import { useUserStore } from '@/stores/user';
import { formatDate, formatWeek } from '../../common/utils';

const router = useRouter();
const store = useUserStore();

const doctor = reactive(store.doctors.find(doctor => doctor.id === parseInt(localStorage.userId)));

defineProps('currentDate'.words);
const { currentDate } = propsToRefs();

function changeDate(date) {
    router.push({ name: 'main', params: { date: date.format('shortDate').replaceAll('.', '-') } });
}

const data = computed(() => {

    const list = [];
    const hours = new Array(24).fill(true);

    const monday = new Date().snapDayBack(1);

    //todo: optimize since the doctor's shifts are sorted

    // get 4 weeks of shifts for editing from this week's monday
    monday.eachWeekOf(4, from => {

        list.push({
            group: formatWeek(from)
        });

        from.eachDayOf(7, from => {

            const to = from.addDay();

            list.push({
                doctorId: doctor.id,
                date: from,
                title: formatDate(from),
                shifts: doctor.shifts.filter(shift => overlaps(shift, from, to))
            });

        });

    })

    return { list, hours };

});

</script>
    
<template>
    <Layout>

        <template #header>
            <h1 class="text-2xl mt-1">{{ doctor.title }}</h1>
        </template>

        <ShiftHours v-bind="{ data }" />

    </Layout>
</template>