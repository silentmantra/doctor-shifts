<script setup>

import { reactive, computed } from 'vue';
import { useRouter } from 'vue-router';

import { inject, overlaps } from '@/common/utils';

import Layout from '@/components/Layout.vue';
import ShiftHours from '@/components/ShiftHours.vue';
import WeekSlider from './WeekSlider.vue';
import { useUserStore } from '@/stores/user';
import { formatDate } from '../../common/utils';
import DynamicTeleport from '../../components/DynamicTeleport.vue';

const router = useRouter();
const store = useUserStore();

const { currentDate, selection } = inject('currentDate selection');

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

        <div class="mt-2 [&>*]:mr-3 h-[34px] text-right">
            <RouterLink :to="{name: 'day-hours'}"><button>Вернуться к дневному списку</button></RouterLink>
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