<script setup>

import { ref, watch } from 'vue';
import DialogForm from '@/components/DialogForm.vue';
import Checkbox from '@/components/Checkbox.vue';

const title = ref('');
const addMore = ref(false);
const gotoDoctor = ref(false);

watch(addMore, val => val && (gotoDoctor.value = false));
watch(gotoDoctor, val => val && (addMore.value = false));

function addDoctor() {
    alert(title.value)
}

</script>

<template>

    <DialogForm @submit="addDoctor()" title="Добавить врача"
        submit-label="Добавить" :closable="true">
        <div class="text-left">
            <input class="mb-3" v-model="title" required placeholder="Иванова A.И." />
            <Checkbox v-model="addMore">Добавить еще</Checkbox>
            <Checkbox v-model="gotoDoctor">Перейти в календарь врача</Checkbox>
        </div>
    </DialogForm>

</template>