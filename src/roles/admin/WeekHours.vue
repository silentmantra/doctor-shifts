<script setup>

import { useUserStore } from '@/stores/user';

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

    <dynamic-teleport to="#fixed">

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
                <router-link :to="{name: 'day-hours'}"><button>Переключиться на дни</button></router-link>
            </div>

            <div class="clear-both"></div>
        </div>
        <week-slider :date="currentDate" @date="changeDate"></week-slider>

    </dynamic-teleport>

    <shift-hours v-bind="{ data }"></shift-hours>

</template>

<style scoped>
    button { @apply
        px-3 py-1 ml-5 
        bg-gray-400
    }
</style>