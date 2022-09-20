<script setup>

import { ref, reactive, watch, computed } from 'vue';
import { RouterView, useRouter } from 'vue-router';

import { propsToRefs, provide } from '@/common/utils';

import Layout from '@/components/Layout.vue';
import { useUserStore } from '@/stores/user';
import AddDoctor from './AddDoctor.vue';

const router = useRouter();
const store = useUserStore();

const props = defineProps('currentDate displayMode selection'.words);
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
    <Layout>
        <template #header>
            <div class="[&>*]:mr-3">
                <button @click="addDoctor = true">Добавить врача</button>
                <button @click="store.generate()">Сгенерировать</button>
                <button @click="selection.clear(); store.clear()">Очистить</button>
            </div>
        </template>
        <RouterView />
    </Layout>
    <AddDoctor v-if="addDoctor" @close="addDoctor = false" />
</template>