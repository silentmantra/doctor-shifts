<script setup>

defineProps({
    to: String,
    disabled: Boolean
});

const { to, disabled } = propsToRefs();

const target = ref();

onMounted(() => target.value = document.querySelector(to.value));

let resized = false;

onUpdated(() => {
    if (resized) {
        return;
    }
    window.dispatchEvent(new Event('resize'));
    resized = true;
});

</script>

<template>
    <teleport :to="target" :disabled="!target || disabled">
        <slot></slot>
    </teleport>
</template>
