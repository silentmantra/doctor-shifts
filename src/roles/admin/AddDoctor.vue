<script setup>

import { ref } from 'vue';
import { inject } from '@/common/utils';
import DialogForm from '@/components/DialogForm.vue';
import Checkbox from '@/components/Checkbox.vue';
import { useUserStore } from '@/stores/user';

const { selection } = inject('selection');

const store = useUserStore();

const title = ref('');
const addToSelection = ref(true);

function addDoctor() {
    const doctor = store.addDoctor(title.value);
    if (addToSelection.value) {
        selection.unshift(doctor.id);
    }
}

</script>

<template>

    <DialogForm @submit="addDoctor()" title="Добавить врача"
        submit-label="Добавить" :closable="true">
        <div class="text-left">
            <input class="mb-3" v-model="title" required placeholder="Иванова A.И." />
            <Checkbox v-model="addToSelection">Добавить в выбранные</Checkbox>
        </div>
    </DialogForm>

</template>