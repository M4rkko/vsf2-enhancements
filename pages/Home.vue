<template>
  <div
    id="home"
    class="home-page"
  >
    <HomeAllProductsCatalog />
  </div>
</template>

<script lang="ts" type="module">
import {
  defineComponent,
  ref,
  onMounted,
  useFetch,
} from '@nuxtjs/composition-api';
import { useCache, CacheTagPrefix } from '@vue-storefront/cache';
import { CmsPage } from '~/modules/GraphQL/types';
import { getMetaInfo } from '~/helpers/getMetaInfo';
import { useContent } from '~/composables';
import HomeAllProductsCatalog from '~/components/HomeAllProductsCatalog.vue';

export default defineComponent({
  name: 'HomePage',

  components: {
    HomeAllProductsCatalog,
  },

  setup() {
    const { addTags } = useCache();
    const { loadPage } = useContent();

    const page = ref<CmsPage | null>(null);

    useFetch(async () => {
      page.value = await loadPage({ identifier: 'home' });
    });

    onMounted(() => {
      addTags([{ prefix: CacheTagPrefix.View, value: 'home' }]);
    });

    return {
      page,
    };
  },

  head() {
    return getMetaInfo(this.page);
  },
});
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: var(--theme-bg);
  color: var(--theme-text);
  padding-bottom: var(--spacer-xl);
}
</style>
