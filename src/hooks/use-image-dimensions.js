/**
 * Hook for accessing image dimensions
 * Provides a convenient way to use dimension configs in components
 * 
 * @example
 * const { width, height, aspectRatio } = useImageDimensions('PRODUCT_IMAGE');
 * // Or use with override
 * const dimensions = useImageDimensions('PRODUCT_IMAGE', { width: 1000 });
 */
import { useMemo } from "react";
import { getImageDimensions } from "@/config/image-dimensions";

export const useImageDimensions = (dimensionKey, overrides = {}) => {
  return useMemo(() => {
    if (!dimensionKey) {
      return {
        width: overrides.width || 400,
        height: overrides.height || 300,
        aspectRatio: overrides.aspectRatio || null,
      };
    }

    const config = getImageDimensions(dimensionKey);
    return {
      width: overrides.width || config.width,
      height: overrides.height || config.height,
      aspectRatio: overrides.aspectRatio ?? config.aspectRatio,
    };
  }, [dimensionKey, overrides]);
};

