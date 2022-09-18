<script setup>

import { useModel } from '@/common/useModel';
defineProps(['modelValue']);
const value = useModel();

</script>

<template>
    <div class="inline-block">
        <label>
            <input type="checkbox" v-model="value" />
            <slot></slot>
        </label>
    </div>
</template>

<style scoped>

    label { @apply
        cursor-pointer
    }

    input[type=checkbox] { @apply
        w-auto
        mr-2
    }
</style>