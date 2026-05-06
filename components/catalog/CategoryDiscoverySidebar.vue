<template>
  <aside class="category-discovery-sidebar">
    <section
      v-if="visibleChildren.length > 0"
      class="category-discovery-sidebar__section"
    >
      <h2 class="category-discovery-sidebar__title">
        Refine by category
      </h2>

      <p
        v-if="filterMode === 'general'"
        class="category-discovery-sidebar__text"
      >
        Choose a more specific category to unlock detailed filters.
      </p>

      <CatalogCategoryTree :categories="visibleChildren" />
    </section>

    <section class="category-discovery-sidebar__section">
      <template v-if="filterMode === 'general'">
        <h2 class="category-discovery-sidebar__title">
          General filters
        </h2>

        <HomeCatalogFilters
          :cat-uid="catUid"
          @reloadProducts="$emit('reloadProducts')"
        />
      </template>

      <CategoryFilters
        v-else
        :is-visible="isFilterSidebarOpen"
        :cat-uid="catUid"
        @close="$emit('close')"
        @reloadProducts="$emit('reloadProducts')"
      />
    </section>
  </aside>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from '@nuxtjs/composition-api';

import { useCategory } from '~/composables';

import CatalogCategoryTree from '~/components/catalog/CatalogCategoryTree.vue';
import HomeCatalogFilters from '~/components/HomeCatalogFilters.vue';

import CategoryFilters from '~/modules/catalog/category/components/filters/CategoryFilters.vue';

import type { CategoryTree } from '~/modules/GraphQL/types';

type CategoryNode = CategoryTree & {
  url_path?: string | null;
  url_key?: string | null;
};

export default defineComponent({
  name: 'CategoryDiscoverySidebar',

  components: {
    CatalogCategoryTree,
    HomeCatalogFilters,
    CategoryFilters,
  },

  props: {
    activeCategory: {
      type: Object,
      default: null,
    },

    catUid: {
      type: String,
      required: true,
    },

    currentPath: {
      type: String,
      default: '',
    },

    filterMode: {
      type: String,
      default: 'full',
      validator: (value: string) => ['general', 'full'].includes(value),
    },

    isFilterSidebarOpen: {
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    const {
      categories: categoryList,
      load: loadCategories,
    } = useCategory();

    const categoryFromTree = ref<CategoryNode | null>(null);

    const normalizePath = (path = '') => path
      .toLowerCase()
      .replace(/^\/[a-z]{2}(?=\/)/, '')
      .replace(/^\/+/, '')
      .replace(/\.html$/, '')
      .replace(/\/$/, '');

    const isMatchingCategory = (
      category: CategoryNode,
      uid: string,
      normalizedCurrentPath: string,
    ) => {
      const categoryUrlPath = normalizePath(String(category.url_path ?? ''));
      const categoryUrlKey = normalizePath(String(category.url_key ?? ''));

      return (
        category.uid === uid
        || categoryUrlPath === normalizedCurrentPath
        || categoryUrlKey === normalizedCurrentPath
      );
    };

    const findCategory = (
      categories: CategoryNode[],
      uid: string,
      currentPath: string,
    ): CategoryNode | null => {
      const normalizedCurrentPath = normalizePath(currentPath);

      return categories.reduce<CategoryNode | null>((foundCategory, category) => {
        if (foundCategory) {
          return foundCategory;
        }

        if (isMatchingCategory(category, uid, normalizedCurrentPath)) {
          return category;
        }

        const children = (category.children ?? []) as CategoryNode[];

        return children.length > 0
          ? findCategory(children, uid, currentPath)
          : null;
      }, null);
    };

    const resolveCategory = async () => {
      if (props.catUid.length === 0 && props.currentPath.length === 0) {
        return;
      }

      await loadCategories({ pageSize: 100 });

      categoryFromTree.value = findCategory(
        (categoryList.value ?? []) as CategoryNode[],
        props.catUid,
        props.currentPath,
      );
    };

    const categorySource = computed<CategoryNode | null>(() => (
      categoryFromTree.value
      || (props.activeCategory as unknown as CategoryNode | null)
      || null
    ));

    const visibleChildren = computed<CategoryTree[]>(() => (
      (categorySource.value?.children ?? []) as CategoryTree[]
    ).filter((category) => category.include_in_menu));

    onMounted(resolveCategory);

    watch(
      () => [props.catUid, props.currentPath],
      resolveCategory,
    );

    return {
      visibleChildren,
    };
  },
});
</script>

<style lang="scss" scoped>
.category-discovery-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-discovery-sidebar__section {
  border: 1px solid var(--theme-border);
  background: var(--theme-surface);
  padding: 1.25rem;
}

.category-discovery-sidebar__title {
  margin: 0 0 1rem;
  color: var(--theme-text-strong);
  font-size: 1.15rem;
}

.category-discovery-sidebar__text {
  margin: 0 0 1rem;
  color: var(--theme-text-soft);
  line-height: 1.5;
}
</style>
