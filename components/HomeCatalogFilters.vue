<template>
  <div>
    <div
      v-if="isLoading"
      data-testid="skeleton-loader"
    >
      <SkeletonLoader
        class="filters__title sf-heading--left sf-heading"
        height="20px"
        width="85%"
      />
      <SkeletonLoader width="50%" />
      <SkeletonLoader width="62%" />
      <SkeletonLoader
        width="40%"
        height="10px"
      />
    </div>

    <div
      v-else
      class="filters desktop-only home-general-filters"
    >
      <SelectedFilters
        :removable-filters="removableFilters"
        @removeFilter="doRemoveFilter($event)"
      />

      <hr class="sf-divider">

      <div
        v-for="(filter, i) in filteredFilters"
        :key="i"
        data-testid="category-filter"
      >
        <component
          :is="getFilterConfig(filter.attribute_code).component"
          :filter="filter"
          @selectFilter="selectFilter(filter, $event)"
        />
      </div>

      <div
        v-if="filteredFilters.length === 0"
        class="home-general-filters__empty"
      >
        No general filters available for this catalog view.
      </div>

      <div
        v-if="filteredFilters.length > 0"
        class="filters__buttons"
      >
        <SfButton
          class="sf-button--full-width"
          data-testid="apply-filters"
          @click="doApplyFilters"
        >
          {{ $t('Apply filters') }}
        </SfButton>

        <SfButton
          class="sf-button--full-width filters__button-clear"
          data-testid="clear-filters"
          @click="doClearFilters"
        >
          {{ $t('Clear all') }}
        </SfButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  provide,
  Ref,
  ref,
} from '@nuxtjs/composition-api';
import {
  SfButton,
  SfFilter,
  SfHeading,
  SfRadio,
} from '@storefront-ui/vue';

import SkeletonLoader from '~/components/SkeletonLoader/index.vue';
import { useUiHelpers } from '~/composables';
import { getFilterConfig, isFilterEnabled } from '~/modules/catalog/category/config/FiltersConfig';
import SelectedFilters from '~/modules/catalog/category/components/filters/FiltersSidebar/SelectedFilters.vue';
import { getProductFilterByCategoryCommand } from '~/modules/catalog/category/components/filters/command/getProductFilterByCategoryCommand';

import type { Aggregation } from '~/modules/GraphQL/types';
import type { SelectedFiltersInterface } from '~/modules/catalog/category/components/filters/useFilters';
import { useFilters } from '~/modules/catalog/category/components/filters/useFilters';

export interface UseFiltersProviderInterface {
  selectedFilters: Ref<SelectedFiltersInterface>,
  filters: Ref<Aggregation[]>,
}

export default defineComponent({
  name: 'HomeCatalogFilters',

  components: {
    SelectedFilters,
    SkeletonLoader,
    CheckboxType: () => import('~/modules/catalog/category/components/filters/renderer/CheckboxType.vue'),
    SwatchColorType: () => import('~/modules/catalog/category/components/filters/renderer/SwatchColorType.vue'),
    RadioType: () => import('~/modules/catalog/category/components/filters/renderer/RadioType.vue'),
    YesNoType: () => import('~/modules/catalog/category/components/filters/renderer/YesNoType.vue'),
    SfButton,
    SfFilter,
    SfHeading,
    SfRadio,
  },

  props: {
    catUid: {
      type: String,
      required: true,
    },
  },

  setup(props, { emit }) {
    const allowedFilterCodes = new Set(['price', 'color', 'new', 'sale']);

    const { changeFilters, clearFilters } = useUiHelpers();

    const removableFilters = ref([]);
    const filters = ref<Aggregation[]>([]);
    const isLoading = ref(true);

    const {
      selectedFilters,
      selectFilter,
      removeFilter,
      isFilterSelected,
      getRemovableFilters,
    } = useFilters();

    const filteredFilters = computed(() => filters.value.filter((filter) => (
      allowedFilterCodes.has(filter.attribute_code)
    )));

    const updateRemovableFilters = () => {
      removableFilters.value = getRemovableFilters(filteredFilters.value, selectedFilters.value);
    };

    const doApplyFilters = () => {
      changeFilters(selectedFilters.value, false);
      updateRemovableFilters();

      if (window?.scroll) {
        window.scroll(0, 0);
      }

      emit('reloadProducts');
    };

    const doRemoveFilter = ({ id, value }: { id: string, value: string }) => {
      removeFilter(id, value);
      changeFilters(selectedFilters.value, false);
      updateRemovableFilters();

      emit('reloadProducts');
    };

    const doClearFilters = () => {
      clearFilters(false);
      selectedFilters.value = {};
      updateRemovableFilters();

      emit('reloadProducts');
    };

    onMounted(async () => {
      const loadedFilters = await getProductFilterByCategoryCommand.execute({ eq: props.catUid });

      filters.value = loadedFilters.filter((filter) => (
        isFilterEnabled(filter.attribute_code)
        && allowedFilterCodes.has(filter.attribute_code)
      ));

      updateRemovableFilters();
      isLoading.value = false;
    });

    provide('UseFiltersProvider', {
      isFilterSelected,
      selectedFilters,
      filters,
    });

    return {
      selectFilter,
      doApplyFilters,
      doRemoveFilter,
      doClearFilters,
      getFilterConfig,
      selectedFilters,
      filters,
      filteredFilters,
      isLoading,
      removableFilters,
    };
  },
});
</script>
