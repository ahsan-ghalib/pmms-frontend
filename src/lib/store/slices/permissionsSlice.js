import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  decryptedPermissions: [],
  isLoading: false,
  lastFetched: null,
  error: null,
  // Cache TTL: 30 minutes (in milliseconds)
  cacheTTL: 30 * 60 * 1000,
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissions: (state, action) => {
      state.decryptedPermissions = action.payload;
      state.lastFetched = Date.now();
      state.error = null;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearPermissions: (state) => {
      state.decryptedPermissions = [];
      state.lastFetched = null;
      state.error = null;
    },
  },
});

export const { setPermissions, setLoading, setError, clearPermissions } = permissionsSlice.actions;

// Selectors
export const selectPermissions = (state) => state.permissions.decryptedPermissions;
export const selectIsLoading = (state) => state.permissions.isLoading;
export const selectLastFetched = (state) => state.permissions.lastFetched;
export const selectError = (state) => state.permissions.error;
export const selectCacheTTL = (state) => state.permissions.cacheTTL;

// Check if cache is still valid
export const selectIsCacheValid = (state) => {
  const { lastFetched, cacheTTL } = state.permissions;
  if (!lastFetched) return false;
  return Date.now() - lastFetched < cacheTTL;
};

export default permissionsSlice.reducer;
