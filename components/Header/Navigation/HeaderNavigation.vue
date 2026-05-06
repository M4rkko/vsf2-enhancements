<template>
  <nav
    class="header-navigation"
    aria-label="Main categories"
  >
    <NuxtLink
      v-for="category in visibleHeaderCategories"
      :key="category.uid || category.id"
      class="header-navigation__link"
      :to="localePath(getCatLink(category))"
    >
      {{ category.name }}
    </NuxtLink>
  </nav>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from '@nuxtjs/composition-api';
import { CategoryTree } from '~/modules/GraphQL/types';
import { useUiHelpers } from '~/composables';

export default defineComponent({
  name: 'HeaderNavigation',

  props: {
    categoryTree: {
      type: Array as PropType<CategoryTree[]>,
      default: () => [],
    },
  },

  setup(props) {
    const { getCatLink } = useUiHelpers();

    const hiddenHeaderCategoryNames = new Set([
      'what\'s new',
      'sale',
    ]);

    const visibleHeaderCategories = computed(() => props.categoryTree.filter((category) => {
      const categoryName = String(category.name || '').trim().toLowerCase();

      return !hiddenHeaderCategoryNames.has(categoryName);
    }));

    return {
      getCatLink,
      visibleHeaderCategories,
    };
  },
});
</script>

<style lang="scss" scoped>
.header-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacer-xl);
  width: 100%;
  min-height: 46px;
}

.header-navigation__link {
  color: var(--theme-text-soft);
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-decoration: none;
  transition: color var(--theme-transition);

  &:hover,
  &.nuxt-link-active,
  &.nuxt-link-exact-active {
    color: var(--theme-text-strong);
    text-decoration: none;
  }
}
</style>
