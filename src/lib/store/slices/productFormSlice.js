import { createSlice } from "@reduxjs/toolkit";

export const PRODUCT_FORM_STORAGE_KEY = "soouqlive_product_form_draft";

export const getInitialProductFormState = () => ({
  type: "simple",
  name: "",
  name_arabic: "",
  desc_short: "",
  desc_short_arabic: "",
  desc_full: "",
  desc_full_arabic: "",
  status: "published",
  is_visible: true,
  track_inventory: true,
  allow_backorder: false,
  min_order_qty: 1,
  max_order_qty: 10,
  low_stock_threshold: 5,
  taxable: true,
  vat_percentage: 5,
  gender: "unisex",
  tags: "",
  is_returnable: false,
  return_days: 0,
  return_policy: "",
  is_exchangeable: false,
  exchange_days: 0,
  exchange_policy: "",
  meta_title: "",
  meta_description: "",
  categories: [],
  images: [],
  modifier_groups: [],
  questions: [],
  attributes: [],
  variants: [],
});

const initialState = {
  formData: getInitialProductFormState(),
  isFoodItem: false,
  productImages: [],
  activeStepId: "general",
  hydrated: false,
};

const productFormSlice = createSlice({
  name: "productForm",
  initialState,
  reducers: {
    updateProductFormDraft: (state, action) => {
      const { formData, isFoodItem, productImages, activeStepId } = action.payload;

      if (formData !== undefined) {
        state.formData = formData;
      }
      if (isFoodItem !== undefined) {
        state.isFoodItem = isFoodItem;
      }
      if (productImages !== undefined) {
        state.productImages = productImages;
      }
      if (activeStepId !== undefined) {
        state.activeStepId = activeStepId;
      }
    },
    hydrateProductForm: (state, action) => {
      const { formData, isFoodItem, productImages, activeStepId } = action.payload;
      state.formData = formData ?? state.formData;
      state.isFoodItem = isFoodItem ?? state.isFoodItem;
      state.productImages = productImages ?? state.productImages;
      state.activeStepId = activeStepId ?? state.activeStepId;
      state.hydrated = true;
    },
    setProductFormHydrated: (state) => {
      state.hydrated = true;
    },
    resetProductForm: () => ({
      formData: getInitialProductFormState(),
      isFoodItem: false,
      productImages: [],
      activeStepId: "general",
      hydrated: true,
    }),
  },
});

export const {
  updateProductFormDraft,
  hydrateProductForm,
  setProductFormHydrated,
  resetProductForm,
} = productFormSlice.actions;

export const selectProductFormDraft = (state) => state.productForm;

export function readProductFormFromStorage() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(PRODUCT_FORM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeProductFormToStorage(draft) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRODUCT_FORM_STORAGE_KEY, JSON.stringify(draft));
}

export function clearProductFormStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PRODUCT_FORM_STORAGE_KEY);
}

export default productFormSlice.reducer;
