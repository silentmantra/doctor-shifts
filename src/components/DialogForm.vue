<script setup>

import { ref, onMounted } from 'vue';

const props = defineProps('title onSubmit submitLabel closable'.words);

const dialog = ref();
const form = ref();

onMounted(() => {
    dialog.value.showModal();
    isValid.value = form.value.checkValidity();
});

const isValid = ref(false);

function close(e) {
    if (props.closable && e.target === dialog.value) {
        dialog.value.close();
        history.back();
    }
}

</script>
<template>
    <dialog ref="dialog" @click="close" @close="$emit('close')">
        <form ref="form" @keyup="isValid = form.checkValidity()" @change="isValid = form.checkValidity()"
            @submit.prevent="$emit('submit'); dialog.close()">
            <h1>{{ props.title }}</h1>
            <div>
                <div class="mb-3">
                    <slot></slot>
                </div>
                <div>
                    <button :disabled="!isValid">{{ props.submitLabel }}</button>
                </div>
                <div class="py-5">
                    <img class="inline relative left-[-7px] h-[30px]" src="../assets/logo.png" />
                </div>
            </div>
        </form>
    </dialog>
</template>
        
<style scoped>

    dialog { @apply 
        max-w-[300px] 
        w-full 
        rounded-md 
        shadow-md 
        border border-gray-100 
        text-center
        select-none
    }

    :deep {
        input:not([type=checkbox]), select, button { @apply 
            w-full
        }
    }

</style>