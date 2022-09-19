<script setup>

import { ref, onMounted } from 'vue';

const scrollable = ref();
const fixed = ref();


onMounted(() => {

    const resize = () => {

        const rect = fixed.value.getBoundingClientRect();
        scrollable.value.style.height = (window.innerHeight - rect.bottom) + 'px';

    };

    window.addEventListener('resize', resize);

    resize();

});



function logout() {
    delete localStorage.userId;
    location.href = '/';
}

</script>

<template>

    <header>
        <img class="relative top-[7px] float-left h-[30px]" src="../assets/logo.png" />
        <div class="float-left pl-10">
            <slot name="header"></slot>
        </div>
        <button class="float-right" @click="logout()">Выйти</button>
    </header>
    <main>
        <div ref="fixed" id="fixed">
            <slot name="fixed"></slot>
        </div>
        <div ref="scrollable" class="overflow-y-scroll overflow-x-hidden">
            <slot></slot>
        </div>
    </main>

</template>

<style scoped>
    
    header { @apply
        py-3
        after:clear-both after:block
        border-b border-gray-200
    }

</style>