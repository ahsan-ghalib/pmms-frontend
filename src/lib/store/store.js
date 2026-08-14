import { configureStore } from "@reduxjs/toolkit";
import permissionsReducer from "./slices/permissionsSlice";
import productFormReducer, {
  clearProductFormStorage,
  writeProductFormToStorage,
} from "./slices/productFormSlice";

export const store = configureStore({
  reducer: {
    permissions: permissionsReducer,
    productForm: productFormReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat((storeApi) => (next) => (action) => {
      const result = next(action);

      if (action.type?.startsWith("productForm/")) {
        if (action.type === "productForm/resetProductForm") {
          clearProductFormStorage();
        } else {
          // Always write all 4 fields so nothing gets lost
          const { formData, isFoodItem, productImages, activeStepId } =
            storeApi.getState().productForm;
          writeProductFormToStorage({
            formData,
            isFoodItem,
            productImages,
            activeStepId,
          });
        }
      }

      return result;
    }),
});
