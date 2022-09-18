import { computed, getCurrentInstance } from 'vue';

export function useModel() {

    const self = getCurrentInstance();

    const value = computed({
        get() {
            return self.props.modelValue;
        },
        set(value) {
            return self.emit('update:modelValue', value);
        }
    });

    return value;

}