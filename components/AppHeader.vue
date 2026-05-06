<template>
  <div class="app-header">
    <SfHeader
      class="sf-header--has-mobile-search"
      :class="{ 'header-on-top': isSearchOpen }"
    >
      <template #logo>
        <div class="app-header__brand">
          <HeaderLogo />

          <ThemeToggle
            v-if="showThemeToggle"
            :active-theme="activeTheme"
            :themes="themeOptions"
            @set-theme="applyTheme"
          />
        </div>
      </template>

      <template #aside>
        <div class="sf-header__switchers">
          <CurrencySelector
            v-if="hasCurrencyToSelect"
            class="smartphone-only"
          />

          <StoreSwitcher
            v-if="hasStoresToSelect"
            class="smartphone-only"
          />
        </div>
      </template>

      <template #header-icons="{ activeIcon }">
        <div class="sf-header__icons">
          <StoreSwitcher
            v-if="hasStoresToSelect"
            class="desktop-only app-header__store-switcher"
          />

          <CurrencySelector
            v-if="hasCurrencyToSelect"
            class="desktop-only app-header__currency-switcher"
          />

          <SfButton
            v-e2e="'app-header-account'"
            class="sf-button--pure sf-header__action"
            data-testid="accountIcon"
            aria-label="Account"
            @click="handleAccountClick"
          >
            <SvgImage
              :icon="accountIcon"
              :label="$t('Account')"
              width="1.25rem"
              height="1.25rem"
              :class="{
                'sf-header__icon is-active': activeIcon === 'account',
              }"
            />
          </SfButton>

          <SfButton
            v-if="isAuthenticated"
            class="sf-button--pure sf-header__action"
            data-testid="wishlistIcon"
            aria-label="Wishlist"
            @click="toggleWishlistSidebar"
          >
            <SvgImage
              :icon="wishlistHasProducts ? 'heart_fill' : 'heart'"
              :label="$t('Wishlist')"
              width="1.25rem"
              height="1.25rem"
              class="sf-header__icon"
              :class="{
                'sf-header__icon is-active': activeIcon === 'wishlist',
              }"
            />

            <SfBadge
              v-if="wishlistHasProducts"
              class="sf-badge--number cart-badge"
            >
              {{ wishlistItemsQty }}
            </SfBadge>
          </SfButton>

          <SfButton
            v-e2e="'app-header-cart'"
            class="sf-button--pure sf-header__action"
            aria-label="Toggle cart sidebar"
            @click="toggleCartSidebar"
          >
            <SvgImage
              icon="empty_cart"
              :label="$t('Cart')"
              width="20"
              height="20"
              class="sf-header__icon"
              :class="{
                'sf-header__icon is-active': activeIcon === 'cart',
              }"
            />

            <SfBadge
              v-if="cartTotalItems"
              class="sf-badge--number cart-badge"
            >
              {{ cartTotalItems }}
            </SfBadge>
          </SfButton>
        </div>
      </template>

      <template #search>
        <SearchBar
          :is-search-open="isSearchOpen"
          @set-is-open="isSearchOpen = $event"
          @set-search-results="productSearchResults = $event"
        />
      </template>
    </SfHeader>

    <div
      v-if="categoryTree.length > 0"
      class="app-header__navigation-row"
    >
      <div class="app-header__navigation-inner">
        <HeaderNavigation :category-tree="categoryTree" />
      </div>
    </div>

    <SearchResults
      v-if="isSearchOpen"
      :visible="isSearchOpen"
      :search-results="productSearchResults"
      @close="isSearchOpen = false"
    />

    <SfOverlay :visible="isSearchOpen" />
  </div>
</template>

<script lang="ts">
import {
  SfOverlay,
  SfHeader,
  SfButton,
  SfBadge,
} from '@storefront-ui/vue';
import {
  computed,
  ref,
  defineComponent,
  useRouter,
  useContext,
  onMounted,
  useFetch,
} from '@nuxtjs/composition-api';

import HeaderNavigation from '~/components/Header/Navigation/HeaderNavigation.vue';
import HeaderLogo from '~/components/HeaderLogo.vue';
import SvgImage from '~/components/General/SvgImage.vue';
import ThemeToggle from '~/components/ThemeToggle.vue';
import { useCategory } from '~/modules/catalog/category/composables/useCategory';
import { useUiState } from '~/composables';
import { useCart } from '~/modules/checkout/composables/useCart';
import { useWishlist } from '~/modules/wishlist/composables/useWishlist';
import { useUser } from '~/modules/customer/composables/useUser';
import { useWishlistStore } from '~/modules/wishlist/store/wishlistStore';

import type { CategoryTree, ProductInterface } from '~/modules/GraphQL/types';

import { useTopBar } from './TopBar/useTopBar';

type ThemeOption = {
  value: string;
  label: string;
};

type ThemeRuntimeConfig = {
  default?: string;
  showToggle?: boolean;
  available?: string[];
};

const THEME_STORAGE_KEY = 'vsf-theme';

const formatThemeLabel = (theme: string) => (
  theme.charAt(0).toUpperCase() + theme.slice(1)
);

export default defineComponent({
  name: 'AppHeader',

  components: {
    HeaderNavigation,
    SfHeader,
    SfOverlay,
    HeaderLogo,
    SvgImage,
    SfButton,
    SfBadge,
    ThemeToggle,
    CurrencySelector: () => import('~/components/CurrencySelector.vue'),
    StoreSwitcher: () => import('~/components/StoreSwitcher.vue'),
    SearchBar: () => import('~/components/Header/SearchBar/SearchBar.vue'),
    SearchResults: () => import(
      /* webpackPrefetch: true */ '~/components/Header/SearchBar/SearchResults.vue'
    ),
  },

  setup() {
    const router = useRouter();
    const context = useContext();
    const { app } = context;

    const runtimeThemeConfig = ((context as any).$config?.theme ?? {}) as ThemeRuntimeConfig;

    const availableThemes = runtimeThemeConfig.available?.length
      ? runtimeThemeConfig.available
      : ['default', 'fire', 'ice'];

    const defaultTheme = availableThemes.includes(runtimeThemeConfig.default || '')
      ? runtimeThemeConfig.default as string
      : 'default';

    const showThemeToggle = runtimeThemeConfig.showToggle !== false;

    const themeOptions = computed<ThemeOption[]>(() => availableThemes.map((theme) => ({
      value: theme,
      label: formatThemeLabel(theme),
    })));

    const {
      toggleCartSidebar,
      toggleWishlistSidebar,
      toggleLoginModal,
    } = useUiState();

    const { isAuthenticated } = useUser();
    const { loadTotalQty: loadCartTotalQty, cart } = useCart();
    const { loadItemsCount: loadWishlistItemsCount } = useWishlist();
    const { categories: categoryList, load: categoriesListLoad } = useCategory();
    const { hasCurrencyToSelect, hasStoresToSelect } = useTopBar();

    const isSearchOpen = ref(false);
    const productSearchResults = ref<ProductInterface[] | null>(null);
    const categoryTree = ref<CategoryTree[]>([]);
    const activeTheme = ref(defaultTheme);

    const removeThemeClasses = () => {
      availableThemes
        .filter((theme) => theme !== 'default')
        .forEach((theme) => {
          document.documentElement.classList.remove(`theme-${theme}`);
        });
    };

    const applyTheme = (theme: string) => {
      if (!process.client) return;

      const safeTheme = availableThemes.includes(theme) ? theme : defaultTheme;

      removeThemeClasses();

      if (safeTheme !== 'default') {
        document.documentElement.classList.add(`theme-${safeTheme}`);
      }

      localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
      activeTheme.value = safeTheme;
    };

    const wishlistStore = useWishlistStore();
    const wishlistItemsQty = computed(() => wishlistStore.wishlist?.items_count ?? 0);
    const wishlistHasProducts = computed(() => wishlistItemsQty.value > 0);
    const accountIcon = computed(() => (isAuthenticated.value ? 'profile_fill' : 'profile'));
    const cartTotalItems = computed(() => cart.value?.total_quantity ?? 0);

    const handleAccountClick = async () => {
      if (isAuthenticated.value) {
        await router.push(app.localeRoute({ name: 'customer-my-profile' }));
      } else {
        toggleLoginModal();
      }
    };

    useFetch(async () => {
      await categoriesListLoad({ pageSize: 20 });

      categoryTree.value = categoryList.value?.[0]?.children
        ?.filter((category) => category.include_in_menu) ?? [];
    });

    onMounted(async () => {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme;

      applyTheme(savedTheme);

      if (app.$device.isDesktop) {
        await loadCartTotalQty();
        await loadWishlistItemsCount();
      }
    });

    return {
      accountIcon,
      activeTheme,
      applyTheme,
      cartTotalItems,
      categoryTree,
      handleAccountClick,
      hasCurrencyToSelect,
      hasStoresToSelect,
      isAuthenticated,
      isSearchOpen,
      productSearchResults,
      showThemeToggle,
      themeOptions,
      toggleCartSidebar,
      toggleWishlistSidebar,
      wishlistHasProducts,
      wishlistItemsQty,
    };
  },
});
</script>

<style lang="scss" scoped>
.app-header {
  position: relative;
  z-index: 2;
  background: var(--theme-header-bg);
  border-bottom: 1px solid var(--theme-border);
}

.sf-header {
  --header-padding: var(--spacer-sm);

  border-bottom: 0;

  @include for-desktop {
    --header-padding: 0 var(--spacer-sm);
  }

  &__switchers,
  &__icons {
    display: flex;
    align-items: center;
  }

  &__icons {
    gap: 0.5rem;
  }
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: var(--spacer-sm);
}

.app-header__store-switcher,
.app-header__currency-switcher {
  margin-right: 0.5rem;
}

.app-header__navigation-row {
  display: none;

  @include for-desktop {
    position: relative;
    display: block;
    min-height: 46px;
    background: var(--theme-header-bg);
    border-top: 1px solid var(--theme-border);
  }
}

.app-header__navigation-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 77.5rem;
  min-height: 46px;
  margin: 0 auto;
  padding: 0 var(--spacer-sm);
}

.header-on-top {
  z-index: 2;
}

.cart-badge {
  position: absolute;
  bottom: 40%;
  left: 40%;
}
</style>
