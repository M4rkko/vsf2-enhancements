<template>
  <section class="home-catalog">
    <aside class="home-catalog__sidebar">
      <div class="home-catalog__sidebar-card">
        <h2 class="home-catalog__sidebar-title">
          Browse categories
        </h2>

        <p class="home-catalog__sidebar-text">
          Choose a category for more specific filters.
        </p>

        <nav
          v-if="visibleCategories.length > 0"
          class="home-catalog__tree"
        >
          <div
            v-for="category in visibleCategories"
            :key="category.uid || category.id"
            class="home-catalog__tree-group"
          >
            <NuxtLink
              class="home-catalog__tree-link home-catalog__tree-link--parent"
              :to="localePath(getCatLink(category))"
            >
              {{ category.name }}
            </NuxtLink>

            <div
              v-if="getVisibleChildren(category).length > 0"
              class="home-catalog__tree-children"
            >
              <NuxtLink
                v-for="child in getVisibleChildren(category)"
                :key="child.uid || child.id"
                class="home-catalog__tree-link"
                :to="localePath(getCatLink(child))"
              >
                {{ child.name }}
              </NuxtLink>
            </div>
          </div>
        </nav>
      </div>

      <div
        v-if="filterCategoryUid"
        class="home-catalog__filters-card"
      >
        <h2 class="home-catalog__sidebar-title">
          General filters
        </h2>

        <HomeCatalogFilters
          :key="filterCategoryUid"
          :cat-uid="filterCategoryUid"
          @reloadProducts="onReloadProducts"
        />
      </div>
    </aside>

    <div class="home-catalog__main">
      <div class="home-catalog__heading-row">
        <h2 class="home-catalog__title">
          All Products
        </h2>
      </div>

      <CategoryNavbar
        class="home-catalog__navbar"
        :sort-by="sortBy"
        :pagination="pagination"
        :is-loading="loading"
        @reloadProducts="reloadProducts"
      />

      <SfLoader
        :loading="loading"
        class="home-catalog__loader"
      >
        <div class="home-catalog__results">
          <CategoryProductGrid
            v-if="isCategoryGridView"
            :products="products"
            :prices-loaded="true"
            :loading="loading"
            @click:wishlist="addItemToWishlist"
            @click:add-to-cart="addItemToCart"
          />

          <CategoryProductList
            v-else
            :products="products"
            :prices-loaded="true"
            :loading="loading"
            @click:wishlist="addItemToWishlist"
            @click:add-to-cart="addItemToCart"
          />

          <div
            v-if="!loading && pagination.totalPages > 1"
            class="home-catalog__pagination-row"
          >
            <nav
              class="home-catalog__pagination"
              aria-label="Product pagination"
            >
              <button
                type="button"
                class="home-catalog__pagination-button"
                :disabled="pagination.currentPage <= 1"
                @click="goToPage(pagination.currentPage - 1)"
              >
                ←
              </button>

              <button
                v-for="page in visiblePages"
                :key="page"
                type="button"
                class="home-catalog__pagination-page"
                :class="{ 'home-catalog__pagination-page--active': page === pagination.currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>

              <button
                type="button"
                class="home-catalog__pagination-button"
                :disabled="pagination.currentPage >= pagination.totalPages"
                @click="goToPage(pagination.currentPage + 1)"
              >
                →
              </button>
            </nav>

            <div class="home-catalog__show">
              <span>Show</span>

              <select
                v-model.number="itemsPerPage"
                class="home-catalog__select home-catalog__select--small"
                @change="changeItemsPerPage"
              >
                <option
                  v-for="option in pageOptions"
                  :key="option"
                  :value="option"
                >
                  {{ option }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </SfLoader>
    </div>
  </section>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  ref,
} from '@nuxtjs/composition-api';
import { SfLoader } from '@storefront-ui/vue';
import {
  useCategory,
  useFacet,
  useUiHelpers,
  useUiState,
} from '~/composables';
import { useWishlist } from '~/modules/wishlist/composables/useWishlist';
import { useAddToCart } from '~/helpers/cart/addToCart';
import facetGetters from '~/modules/catalog/category/getters/facetGetters';
import CategoryNavbar from '~/modules/catalog/category/components/navbar/CategoryNavbar.vue';

import type { CategoryTree, ProductInterface } from '~/modules/GraphQL/types';
import type { Product } from '~/modules/catalog/product/types';
import type { SortingModel } from '~/modules/catalog/category/composables/useFacet/sortingOptions';

export default defineComponent({
  name: 'HomeAllProductsCatalog',

  components: {
    SfLoader,
    CategoryNavbar,
    HomeCatalogFilters: () => import('~/components/HomeCatalogFilters.vue'),
    CategoryProductGrid: () => import('~/modules/catalog/category/components/views/CategoryProductGrid.vue'),
    CategoryProductList: () => import('~/modules/catalog/category/components/views/CategoryProductList.vue'),
  },

  setup() {
    const uiHelpers = useUiHelpers();
    const { getCatLink } = uiHelpers;

    const { isCategoryGridView } = useUiState();

    const {
      categories: categoryList,
      load: loadCategories,
    } = useCategory();

    const {
      result,
      search,
      loading,
    } = useFacet();

    const { addItemToCart } = useAddToCart();

    const {
      addItem: addItemToWishlistBase,
      removeItem: removeItemFromWishlist,
      isInWishlist,
      load: loadWishlist,
    } = useWishlist();

    const products = ref<ProductInterface[]>([]);
    const sortBy = ref<SortingModel>({ selected: '', options: [] });
    const itemsPerPage = ref(8);
    const pageOptions = [8, 12, 16, 24];

    const pagination = ref({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 8,
      pageOptions,
    });

    const hiddenHomeCategoryNames = new Set([
      'whats new',
      'training',
      'sale',
    ]);

    const normalizeCategoryName = (name?: string | null) => (
      name ?? ''
    )
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const rootCategory = computed(() => {
      const categories = categoryList.value ?? [];

      return (
        categories.find((category) => category.children?.length)
        ?? categories[0]
        ?? null
      );
    });

    const visibleCategories = computed(() => {
      const rootChildren = rootCategory.value?.children ?? [];

      return rootChildren.filter((category) => (
        category.include_in_menu
        && !hiddenHomeCategoryNames.has(normalizeCategoryName(category.name))
      ));
    });

    const rootCategoryUid = computed(() => rootCategory.value?.uid || '');

    const filterCategoryUid = computed(() => {
      if (rootCategoryUid.value) {
        return rootCategoryUid.value;
      }

      return visibleCategories.value?.[0]?.uid || '';
    });

    const visiblePages = computed(() => {
      const total = pagination.value.totalPages || 1;
      const current = pagination.value.currentPage || 1;

      const start = Math.max(1, current - 2);
      const end = Math.min(total, start + 4);

      const pages: number[] = [];

      for (let page = start; page <= end; page += 1) {
        pages.push(page);
      }

      return pages;
    });

    const getVisibleChildren = (category: CategoryTree) => (
      category.children ?? []
    ).filter((child) => child.include_in_menu);

    const loadProducts = async (page = 1) => {
      if (!rootCategoryUid.value) {
        return;
      }

      await search({
        ...uiHelpers.getFacetsFromURL(),
        category_uid: rootCategoryUid.value,
        page,
        itemsPerPage: itemsPerPage.value,
      });

      products.value = facetGetters.getProducts(result.value) ?? [];
      sortBy.value = facetGetters.getSortOptions(result.value);

      const nextPagination = facetGetters.getPagination(result.value);

      pagination.value = {
        currentPage: nextPagination.currentPage || page,
        totalPages: nextPagination.totalPages || 1,
        totalItems: nextPagination.totalItems || 0,
        itemsPerPage: itemsPerPage.value,
        pageOptions,
      };
    };

    const reloadProducts = async () => {
      await loadProducts(1);
    };

    const onReloadProducts = async () => {
      await nextTick();
      await loadProducts(1);

      if (process.client) {
        document
          .querySelector('.home-catalog')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const goToPage = async (page: number) => {
      if (
        !page
        || page === pagination.value.currentPage
        || page < 1
        || page > pagination.value.totalPages
      ) {
        return;
      }

      await loadProducts(page);

      if (process.client) {
        document
          .querySelector('.home-catalog__main')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const changeItemsPerPage = async () => {
      await loadProducts(1);
    };

    const addItemToWishlist = async (product: Product) => {
      await (
        isInWishlist({ product })
          ? removeItemFromWishlist({ product })
          : addItemToWishlistBase({ product })
      );
    };

    onMounted(async () => {
      await loadCategories({ pageSize: 20 });
      await Promise.all([
        loadWishlist(),
        loadProducts(1),
      ]);
    });

    return {
      addItemToCart,
      addItemToWishlist,
      changeItemsPerPage,
      filterCategoryUid,
      getCatLink,
      getVisibleChildren,
      goToPage,
      itemsPerPage,
      isCategoryGridView,
      loading,
      onReloadProducts,
      pageOptions,
      pagination,
      products,
      reloadProducts,
      rootCategoryUid,
      sortBy,
      visibleCategories,
      visiblePages,
    };
  },
});
</script>
