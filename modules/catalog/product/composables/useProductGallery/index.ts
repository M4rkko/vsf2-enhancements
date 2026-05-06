import { computed, Ref } from '@nuxtjs/composition-api';
import { getGallery as getProductGallery } from '~/modules/catalog/product/getters/productGetters';
import { useImage } from '~/composables';

import type { Product } from '~/modules/catalog/product/types';
import type { UseProductGalleryInterface } from '~/modules/catalog/product/composables/useProductGallery/useProductGallery';

const FALLBACK_IMAGE = '/img/product-placeholder.svg';

/**
 * The `useProductGallery()` composable allows building product's gallery data structure.
 *
 * See the {@link UseProductGalleryInterface} page for more information.
 */

export function useProductGallery(product: Ref<Product>, imgPlaceholder = ''): UseProductGalleryInterface {
  const { getMagentoImage, imageSizes } = useImage();
  const productGallery = computed(() => getProductGallery(product.value).map((img) => ({
    mobile: { url: getMagentoImage(img.small) },
    desktop: { url: getMagentoImage(img.normal) },
    big: { url: getMagentoImage(img.big) },
    alt: product.value.name,
    placeholder: imgPlaceholder,
  })));

  return {
    productGallery,
    imageSizes,
  };
}

/**
export function useProductGallery(
  product: Ref<Product>,
  imgPlaceholder = '',
): UseProductGalleryInterface {
  const { getMagentoImage, imageSizes } = useImage();

  const getSafeMagentoImage = (image?: string | null) => {
    if (!image) {
      return FALLBACK_IMAGE;
    }

    const magentoImage = getMagentoImage(image);

    return magentoImage || FALLBACK_IMAGE;
  };

  const productGallery = computed(() => {
    const gallery = getProductGallery(product.value);
    const alt = product.value?.name || 'Product image';

    if (!gallery?.length) {
      return [
        {
          mobile: { url: FALLBACK_IMAGE },
          desktop: { url: FALLBACK_IMAGE },
          big: { url: FALLBACK_IMAGE },
          alt,
          placeholder: imgPlaceholder,
        },
      ];
    }

    return gallery.map((img) => ({
      mobile: { url: getSafeMagentoImage(img.small) },
      desktop: { url: getSafeMagentoImage(img.normal) },
      big: { url: getSafeMagentoImage(img.big) },
      alt,
      placeholder: imgPlaceholder,
    }));
  });

  return {
    productGallery,
    imageSizes,
  };
}
 */
export default useProductGallery;
export * from './useProductGallery';
