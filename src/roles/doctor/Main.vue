<script setup>

import { useUserStore } from '@/stores/user';

const store = useUserStore();

const doctor = reactive(store.getDoctor(parseInt(localStorage.userId)));

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
    <layout>

        <template #header>
            <h1 class="text-2xl mt-1">{{ doctor.title }}</h1>
        </template>

        <shift-hours v-bind="{ data }"></shift-hours>

    </layout>
</template>