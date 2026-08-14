export const IMAGE_DIMENSIONS = {
  PRODUCT_IMAGE: {
    width: 1000,
    height: 1000,
    label: "Product Image",
    description: "Standard product image for gallery",
  },

  PRODUCT_GALLERY: {
    width: 1200,
    height: 1200,
    label: "Product Gallery",
    description: "High-resolution product gallery image",
  },

  VARIANT_IMAGE: {
    width: 800,
    height: 800,
    label: "Variant Image",
    description: "Product variant specific image",
  },

  BANNER: {
    width: 1920,
    height: 600,
    label: "Banner",
    description: "Website banner/carousel image",
  },

  CATEGORY_IMAGE: {
    width: 600,
    height: 600,
    label: "Category Image",
    description: "Category thumbnail image",
  },

  BRAND_LOGO: {
    width: 400,
    height: 400,
    label: "Brand Logo",
    description: "Brand/company logo",
  },

  BRAND_IMAGE: {
    width: 300,
    height: 300,
    label: "Brand Image",
    description: "Brand/company image",
  },

  AVATAR: {
    width: 200,
    height: 200,
    label: "Avatar",
    description: "User profile picture",
  },

  DEFAULT: {
    width: 400,
    height: 300,
    label: "Default",
    description: "Default image dimensions",
  },
};

/**
 * Get dimension config by key
 * @param {string} key - Dimension key from IMAGE_DIMENSIONS
 * @returns {Object} Dimension config object with calculated aspectRatio
 */
export const getImageDimensions = (key) => {
  const config = IMAGE_DIMENSIONS[key] || IMAGE_DIMENSIONS.DEFAULT;
  // Calculate aspectRatio automatically from width/height
  return {
    ...config,
    aspectRatio: config.aspectRatio ?? config.width / config.height,
  };
};

/**
 * Get dimension config with fallback
 * @param {string} key - Dimension key from IMAGE_DIMENSIONS
 * @param {Object} fallback - Fallback dimensions if key not found
 * @returns {Object} Dimension config object
 */
export const getImageDimensionsWithFallback = (
  key,
  fallback = IMAGE_DIMENSIONS.DEFAULT
) => {
  return IMAGE_DIMENSIONS[key] || fallback;
};

/**
 * Quick access constants for common use cases
 * Use these in forms for better readability
 */
export const DIMENSIONS = {
  PRODUCT: IMAGE_DIMENSIONS.PRODUCT_IMAGE,
  VARIANT: IMAGE_DIMENSIONS.VARIANT_IMAGE,
  CATEGORY: IMAGE_DIMENSIONS.CATEGORY_IMAGE,
  BRAND: IMAGE_DIMENSIONS.BRAND_LOGO,
  AVATAR: IMAGE_DIMENSIONS.AVATAR,
  BANNER: IMAGE_DIMENSIONS.BANNER,
};
