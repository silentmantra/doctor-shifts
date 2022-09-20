<script setup>

import { reactive, computed } from 'vue';

import { overlaps } from '@/common/utils';

import Layout from '@/components/Layout.vue';
import ShiftHours from '@/components/ShiftHours.vue';
import { useUserStore } from '@/stores/user';
import { formatDate, formatWeek } from '../../common/utils';

const store = useUserStore();

const doctor = reactive(store.doctors.find(doctor => doctor.id === parseInt(localStorage.userId)));

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