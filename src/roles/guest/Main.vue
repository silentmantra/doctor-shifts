<script setup>

import { useUserStore } from '@/stores/user';

const { users } = useUserStore();

const id = ref();

function login(id) {
    localStorage.userId = id;
    location.reload();
}

</script>
<template>
    <dialog-form @submit="login(id)" title="Авторизация"
        submit-label="Авторизоваться">
        <label class="block mb-2">Войти как</label>
        <select required class="mb-1 w-full" v-model="id" placeholder="Войти как:">
            <option v-for="user of users" :key="user.id" :value="user.id">{{ user.title }}</option>
        </select>
    </dialog-form>
</template>