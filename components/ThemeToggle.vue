<template>
  <div
    class="theme-toggle"
    role="group"
    aria-label="Theme selector"
  >
    <button
      v-for="theme in themes"
      :key="theme.value"
      type="button"
      class="theme-toggle__button"
      :class="{ 'theme-toggle__button--active': activeTheme === theme.value }"
      @click="$emit('set-theme', theme.value)"
    >
      {{ theme.label }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';
import type { PropType } from 'vue';

type ThemeOption = {
  value: string;
  label: string;
};

export default defineComponent({
  name: 'ThemeToggle',

  props: {
    activeTheme: {
      type: String,
      required: true,
    },

    themes: {
      type: Array as PropType<ThemeOption[]>,
      default: () => [
        { value: 'default', label: 'Default' },
        { value: 'fire', label: 'Fire' },
        { value: 'ice', label: 'Ice' },
      ],
    },
  },

  emits: ['set-theme'],
});
</script>
