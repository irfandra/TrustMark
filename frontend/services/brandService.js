import { apiRequest } from './apiClient';

export const DEFAULT_BRAND_ID = 1;

export const brandService = {
  async getBrandById(brandId = DEFAULT_BRAND_ID) {
    return apiRequest(`/brands/${brandId}`);
  },

  async getCreatorBrandProfile(brandId = DEFAULT_BRAND_ID) {
    try {
      const myBrands = await apiRequest('/brands/me');
      if (Array.isArray(myBrands) && myBrands.length > 0) {
        return myBrands[0];
      }
    } catch (_error) {
    }

    return this.getBrandById(brandId);
  },
};
