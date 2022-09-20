import { computed, reactive, watch } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {

    // we assume that shifts are always sorted

    const doctors = reactive(JSON.parse(localStorage.doctors || '[]', Date.reviver));

    const users = computed(() => [{ id: 1, title: 'Координатор' }, ...doctors]);

    watch(doctors, doctors => localStorage.doctors = JSON.stringify(doctors, Date.replacer));

    return { doctors, getDoctor, addDoctor, generate, clear, users, addRange, removeRange };

    function getDoctor(id) {
        id = typeof id === 'number' ? id : id.id;
        return doctors.find(doctor => doctor.id === id);
    }

    function addDoctor(title) {
        const id = doctors.map('id').max() + 1;
        const doctor = { id, title, shifts: [] };
        doctors.unshift(doctor);
        return doctor;
    }

    function getShifts(doctor, start, stop) {

        const { shifts } = getDoctor(doctor);

        const added = new DateRange(start, stop);

        let before, after, container;
        const inside = [];

        for (const shift of shifts) {

            const range = new DateRange(shift.start, shift.stop);

            if (range.includes(added)) {
                container = shift;
                break;
            }

            if (added.includes(range)) {
                inside.push(shift);
            } else if (added.includes(shift.stop)) {
                before = shift;
            } else if (added.includes(shift.start)) {
                after = shift;
            }
        }

        return { before, after, inside, container, shifts };


    }

    function addRange(doctor, start, stop) {

        const { before, after, inside, container, shifts } = getShifts(doctor, start, stop);

        if (container) {
            return; // already included in another shift
        }

        // insert sorted
        shifts.removeArray(inside);

        before && (start = before.start) && shifts.remove(before);
        after && (stop = after.stop) && shifts.remove(after);

        const insertIdx = shifts.findIndex(shift => shift.start > stop);
        shifts.splice(insertIdx, 0, { start, stop });


    }

    function removeRange(doctor, start, stop) {

        const { before, after, inside, container, shifts } = getShifts(doctor, start, stop);

        if (container) {

            if (container.start.isSame(start) && container.stop.isSame(stop)) { // just remove the container
                shifts.remove(container);
                return;
            }

            if (container.stop.isSame(stop)) { // shorten the container from the end
                container.stop = start;
                return;
            }

            if (container.start.isSame(start)) { // shorten the container from the start
                container.start = stop;
                return;
            }

            // split container in 2;
            const stop2 = container.stop;
            container.stop = start;
            const insertIdx = shifts.indexOf(container) + 1;
            shifts.splice(insertIdx, 0, { start: stop, stop: stop2 });
            return;

        }

    }

    async function generate() {

        const { titles } = await import('./names.js');

        clear();

        let id = 2;

        for (const title of titles) {

            const shifts = [];

            const source = Date.Today();

            // generate random shifts in the current month
            for (let i = 1; i < 31; i++) {

                if (Math.random() < 0.8) {
                    continue;
                }

                // generate number of shifts in 24 hours
                const shiftCount = Math.ceil(Math.random() * 3);
                const shiftWidth = 24 / shiftCount;

                for (let n = 0; n < shiftCount; n++) {

                    if (Math.random() < 0.5) {
                        continue;
                    }

                    const start = source.clone();
                    start.setDate(i);

                    // random hour in a day within a shift range
                    const hour = Math.floor(Math.random() * shiftWidth + shiftWidth * n);
                    start.setHours(hour);

                    // generate number of hours in a shift
                    const hours = Math.ceil(Math.random() * 6);

                    const stop = start.clone().addHour(hours);

                    shifts.push({ start, stop });

                }
            }

            doctors.push({
                id: id++,
                title,
                shifts
            });

        }

    }

    function clear() {
        doctors.splice(0, doctors.length);
    }

});
