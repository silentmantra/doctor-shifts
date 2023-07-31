<script setup>

const props = defineProps({
    modelValue: String,
    items: Object
});

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
    <checkbox v-for="item in items" v-model="item.selected" :key="item.id"><span v-html="item.title"></span></checkbox>
</template>
