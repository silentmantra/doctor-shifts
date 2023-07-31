<script setup>

defineProps({
    modelValue: Boolean
});

const value = useModel();

</script>

<template>
    <div class="inline-block relative cursor-pointer">
        <label class="block hover:underline pl-[20px]">
            <input class="left-0 absolute scale-125 top-[7px] mr-2" type="checkbox" v-model="value" />
            <slot></slot>
        </label>
    </div>
</template>