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
        :key="`${crumb.text}-link`"
        class="category-current-path__link"
        :to="crumb.link"
      >
        {{ crumb.text }}
      </NuxtLink>

      <span
        v-else
        :key="`${crumb.text}-current`"
        class="category-current-path__current"
      >
        {{ crumb.text }}
      </span>

      <span
        v-if="index < breadcrumbs.length - 1"
        :key="`${crumb.text}-separator`"
        class="category-current-path__separator"
      >
        →
      </span>
    </template>
  </nav>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  useContext,
  useFetch,
} from '@nuxtjs/composition-api';
import { useUiHelpers } from '~/composables';
import { useTraverseCategory } from '~/modules/catalog/category/helpers/useTraverseCategory';
import { Breadcrumb } from '~/modules/catalog/types';

export default defineComponent({
  name: 'CategoryBreadcrumbs',

  setup() {
    const { getCatLink } = useUiHelpers();
    const { localePath } = useContext();

    const {
      categoryAncestors,
      isCategoryTreeLoaded,
      loadCategoryTree,
    } = useTraverseCategory();

    const breadcrumbs = ref<Breadcrumb[]>([]);

    useFetch(async () => {
      if (!isCategoryTreeLoaded.value) {
        await loadCategoryTree();
      }

      breadcrumbs.value = categoryAncestors.value.map((category) => ({
        text: category.name,
        link: localePath(getCatLink(category)),
      }));
    });

    return {
      breadcrumbs,
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
  margin: 0 0 0.75rem var(--spacer-sm);
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

@include for-mobile {
  .category-current-path {
    margin-top: var(--spacer-lg);
  }
}
</style>
