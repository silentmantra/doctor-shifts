<script setup>

import { ref } from 'vue';

import DialogForm from '@/components/DialogForm.vue';
import { useUserStore } from '@/stores/user';

const { users } = useUserStore();

const id = ref();

function login(id) {
    localStorage.userId = id;
    location.reload();
}

</script>
<template>
    <DialogForm @submit="login(id)" title="Авторизация"
        submit-label="Авторизоваться">
            <label class="block mb-2">Войти как</label>
            <select required class="mb-1" v-model="id" placeholder="Войти как:">
                <option v-for="user of users" :key="user.id" :value="user.id">{{ user.title }}</option>
            </select>
    </DialogForm>
</template>