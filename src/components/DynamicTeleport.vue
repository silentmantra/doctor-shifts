<script setup>

import { ref, onMounted, onUpdated } from 'vue';
import { propsToRefs } from '@/common/utils';

defineProps('to disabled'.words);

const { to, disabled } = propsToRefs();

const target = ref();

onMounted(() => target.value = document.querySelector(to.value));

let resized = false;

onUpdated(()=> {
    if (resized) {
        return;
    }
    window.dispatchEvent(new Event('resize'));
    resized = true;
});

</script>

<template>
    <Teleport :to="target" :disabled="!target || disabled">
        <slot></slot>
    </Teleport>
</template>
