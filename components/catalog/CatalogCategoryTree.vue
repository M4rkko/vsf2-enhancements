<template>
  <nav
    v-if="categories.length > 0"
    class="catalog-category-tree"
    aria-label="Catalog categories"
  >
    <div
      v-for="category in categories"
      :key="category.uid || category.id"
      class="catalog-category-tree__group"
    >
      <NuxtLink
        class="catalog-category-tree__link catalog-category-tree__link--parent"
        :to="localePath(getCatLink(category))"
      >
        {{ category.name }}
      </NuxtLink>

      <div
        v-if="getVisibleChildren(category).length > 0"
        class="catalog-category-tree__children"
      >
        <NuxtLink
          v-for="child in getVisibleChildren(category)"
          :key="child.uid || child.id"
          class="catalog-category-tree__link"
          :to="localePath(getCatLink(child))"
        >
          {{ child.name }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';
import { useUiHelpers } from '~/composables';
import type { CategoryTree } from '~/modules/GraphQL/types';

export default defineComponent({
  name: 'CatalogCategoryTree',

  props: {
    categories: {
      type: Array,
      default: () => [],
    },
  },

  setup() {
    const { getCatLink } = useUiHelpers();

    const getVisibleChildren = (category: CategoryTree) => (
      category.children ?? []
    ).filter((child) => child.include_in_menu);

    return {
      getCatLink,
      getVisibleChildren,
    };
  },
});
</script>

<style lang="scss" scoped>
.catalog-category-tree {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.catalog-category-tree__group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.catalog-category-tree__link {
  color: var(--theme-text-soft);
  text-decoration: none;
  font-weight: 600;
}

.catalog-category-tree__link:hover {
  color: var(--theme-text-strong);
}

.catalog-category-tree__link--parent {
  color: var(--theme-text-strong);
  font-weight: 800;
}

.catalog-category-tree__children {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-left: 1rem;
  border-left: 1px solid var(--theme-border);
}
</style>
