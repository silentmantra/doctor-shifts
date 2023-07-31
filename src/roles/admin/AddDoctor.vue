<script setup>

const { selection } = inject('selection');

const store = useUserStore();

const title = ref('');
const addToSelection = ref(true);

function addDoctor() {
    const doctor = store.addDoctor(title.value);
    if (addToSelection.value) {
        selection.unshift(doctor.id);
    }
}

</script>

<template>

    <dialog-form @submit="addDoctor()" title="Добавить врача"
        submit-label="Добавить" :closable="true">
        <div class="text-left">
            <input class="mb-3" v-model="title" required placeholder="Иванова A.И." />
            <checkbox v-model="addToSelection">Добавить в выбранные</checkbox>
        </div>
    </dialog-form>

</template>