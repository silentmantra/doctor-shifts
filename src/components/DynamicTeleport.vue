<script setup>

import { ref, onMounted } from 'vue';
import { propsToRefs } from '@/common/utils';

defineProps('to disabled'.words);

const { to, disabled } = propsToRefs();

const target = ref();

onMounted(() => target.value = document.querySelector(to.value));

</script>

<template>
    <Teleport :to="target" :disabled="!target || disabled">
        <slot></slot>
    </Teleport>
</template>
