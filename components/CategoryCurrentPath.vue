<template>
  <nav
    v-if="breadcrumbs.length > 0"
    class="category-current-path"
    aria-label="Current category"
  >
    <span class="category-current-path__label">
      Current category:
    </span>

    <template v-for="(crumb, index) in breadcrumbs">
      <NuxtLink
        v-if="index < breadcrumbs.length - 1"
        :key="`${crumb.uid || crumb.id}-link`"
        class="category-current-path__link"
        :to="localePath(getCatLink(crumb))"
      >
        {{ crumb.name }}
      </NuxtLink>

      <span
        v-else
        :key="`${crumb.uid || crumb.id}-current`"
        class="category-current-path__current"
      >
        {{ crumb.name }}
      </span>

      <span
        v-if="index < breadcrumbs.length - 1"
        :key="`${crumb.uid || crumb.id}-separator`"
        class="category-current-path__separator"
      >
        →
      </span>
    </template>
  </nav>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  useFetch,
  useRoute,
} from '@nuxtjs/composition-api';

import { useCategory } from '~/modules/catalog/category/composables/useCategory';
import { useUiHelpers } from '~/composables';

import type { CategoryTree } from '~/modules/GraphQL/types';

type CategoryTreeWithUrl = CategoryTree & {
  url_path?: string | null;
  url_key?: string | null;
  children?: CategoryTreeWithUrl[] | null;
};

export default defineComponent({
  name: 'CategoryCurrentPath',

  setup() {
    const route = useRoute();
    const { getCatLink } = useUiHelpers();

    const {
      categories,
      load: loadCategories,
    } = useCategory();

    useFetch(async () => {
      if (categories.value?.length === 0) {
        await loadCategories({ pageSize: 50 });
      }
    });

    const normalizePath = (value = '') => value
      .toLowerCase()
      .replace(/^\/[a-z]{2}(?=\/)/, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .replace(/\.html$/, '');

    const getCategoryUrlPath = (category: CategoryTreeWithUrl) => normalizePath(
      String(category.url_path || category.url_key || ''),
    );

    const routePath = computed(() => normalizePath(route.value.path));

    const isCurrentCategoryPath = (categoryUrlPath: string) => {
      if (categoryUrlPath.length === 0) {
        return false;
      }

      return (
        routePath.value === categoryUrlPath
        || routePath.value.endsWith(`/${categoryUrlPath}`)
      );
    };

    const findPath = (
      list: CategoryTreeWithUrl[],
      parents: CategoryTreeWithUrl[] = [],
    ): CategoryTreeWithUrl[] => list.reduce<CategoryTreeWithUrl[]>((matchedPath, category) => {
      if (matchedPath.length > 0) {
        return matchedPath;
      }

      const nextPath = [...parents, category];
      const categoryUrlPath = getCategoryUrlPath(category);

      if (isCurrentCategoryPath(categoryUrlPath)) {
        return nextPath;
      }

      const children = category.children ?? [];

      return children.length > 0
        ? findPath(children, nextPath)
        : [];
    }, []);

    const breadcrumbs = computed(() => {
      const rootChildren = (categories.value?.[0]?.children ?? []) as CategoryTreeWithUrl[];

      return findPath(rootChildren);
    });

    return {
      breadcrumbs,
      getCatLink,
    };
  },
});
</script>

<style lang="scss" scoped>
.category-current-path {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.75rem;
  color: var(--theme-text-soft);
  font-size: 0.9rem;
}

.category-current-path__label {
  color: var(--theme-text-muted);
}

.category-current-path__link {
  color: var(--theme-text-soft);
  text-decoration: none;

  &:hover {
    color: var(--theme-text-strong);
    text-decoration: underline;
  }
}

.category-current-path__current {
  color: var(--theme-text-strong);
  font-weight: 600;
}

.category-current-path__separator {
  color: var(--theme-text-muted);
}
</style>
