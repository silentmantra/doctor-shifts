<script setup>

import { useModel } from '@/common/useModel';
import { computed, reactive } from 'vue';
import Checkbox from './Checkbox.vue';

const props = defineProps('modelValue items'.words);
const value = useModel();

const items = computed(() => {

    const out = [];

    for (const id in props.items) {
        out.push(reactive({
            id,
            title: props.items[id],
            selected: computed({
                get: () => value.value === id,
                set: val => {
                    value.value = val ? id : null
                }
            })
        }));
    }

    return out;

});

</script>

<template>
    <Checkbox v-for="item in items" v-model="item.selected" :key="item.id"><span v-html="item.title"></span></Checkbox>
</template>
