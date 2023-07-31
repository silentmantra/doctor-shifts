<script setup>

const props = defineProps({
    title: String,
    onSubmit: Function,
    submitLabel: String,
    closable: Boolean
});

const emit = defineEmits(['submit']);

const dialog = ref();
const closeButton = ref();
const form = ref();

onMounted(() => {
    dialog.value.showModal();
    isValid.value = form.value.checkValidity();
});

const isValid = ref(false);

function submit() {
    emit('submit');
    dialog.value.close();
}

function close(e) {
    if (props.closable && [dialog, closeButton].map('value').includes(e.target)) {
        dialog.value.close();
    }
}

</script>
<template>
    <dialog ref="dialog" @click="close" @close="$emit('close')">
        <div v-if="closable" ref="closeButton" @click="close" class="absolute round-button right-[-40px] top-[-40px]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z" />
                <path
                    d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"
                    fill="rgba(115,174,234,1)" />
            </svg>
        </div>
        <form ref="form" @keyup="isValid = form.checkValidity()" @change="isValid = form.checkValidity()"
            @submit.prevent="submit">
            <h1>{{ title }}</h1>
            <div>
                <div class="mb-3">
                    <slot></slot>
                </div>
                <div>
                    <button :disabled="!isValid">{{ submitLabel }}</button>
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
        relative
        overflow-visible
        max-w-[350px] 
        w-full 
        p-4
        rounded-md 
        shadow-md 
        border border-gray-100 
        text-center
        select-none
    }

    :deep(input:not([type=checkbox]), select, button) { @apply 
        w-full
    }
    
</style>