<script setup>

const router = useRouter();
const store = useUserStore();

const { currentDate, displayMode, selection } = inject('currentDate displayMode selection');
const search = ref('');

function changeDate(date) {
    router.pushParams({ date: date.format('shortDate').replaceAll('.', '-') });
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

</script>

<template>
    <dynamic-teleport to="#fixed">

        <div class="mt-2 [&>*]:mr-3">
            <input class="py-1" v-model="search" placeholder="Фильтр" />
            <checkbox-select v-model="displayMode"
                :items="selection.length ? { all: 'Показать всех', selected: 'Показать выбранных ( ' + selection.length + ' )' } : { all: 'Показать всех' }">
            </checkbox-select>
            <button v-if="selection.length" @click="selection.length = 0">Сбросить</button>
            <span class="float-right">
                <router-link :to="{ name: 'week-hours' }"><button>Переключиться на недели</button></router-link>
            </span>
        </div>

        <date-slider :date="currentDate" @date="changeDate"></date-slider>

    </dynamic-teleport>

    <shift-hours v-bind="{ data, selectable: true }"></shift-hours>
</template>

<style scoped>
    button { @apply
        px-3 py-1 ml-5 
        bg-gray-400
    }
</style>