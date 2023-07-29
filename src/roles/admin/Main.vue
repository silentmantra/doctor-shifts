<script setup>

import { propsToRefs, provide } from '@/common/utils';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const store = useUserStore();

const props = defineProps({
    currentDate: Date,
    displayMode: String,
    selection: Array
});

const { currentDate, displayMode, selection } = propsToRefs();
provide({ currentDate, displayMode, selection });

const addDoctor = ref(false);

watch(displayMode, displayMode => router.pushParams({ displayMode }));
watch(selection, selection => {

    const params = { selection: selection.join(',') };

    if (!selection.length && displayMode.value === 'selected') {
        params.displayMode = null;
    }
    router.pushParams(params);
});

</script>
    
<template>
    <layout>
        <template #header>
            <div class="[&>*]:mr-3">
                <button @click="addDoctor = true">Добавить врача</button>
                <button @click="store.generate()">Сгенерировать</button>
                <button @click="selection.clear(); store.clear()">Очистить</button>
            </div>
        </template>
        <router-view></router-view>
    </layout>
    <add-doctor v-if="addDoctor" @close="addDoctor = false"></add-doctor>
</template>