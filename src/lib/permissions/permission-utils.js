import { decryptPermissions } from './decryption.util';
import { rolesPermissionsApi } from '@/services/roles-permissions/roles-permissions-api';
import { store } from '@/lib/store/store';
import { setPermissions, setLoading, setError, clearPermissions, selectPermissions, selectIsCacheValid } from '@/lib/store/slices/permissionsSlice';

const PERMISSIONS_STORAGE_KEY = 'soouqlive_permissions';

function getDecryptedPermissionsFromStore() {
  const state = store.getState();
  return selectPermissions(state);
}

function isCacheValid() {
  const state = store.getState();
  return selectIsCacheValid(state);
}

async function loadPermissionsFromStorage() {
  try {
    if (typeof window === 'undefined') {
      return [];
    }

    const cachedPermissions = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    
    if (!cachedPermissions) {
      return [];
    }

    const decryptedPermissions = JSON.parse(cachedPermissions);
    /* FUTURE ENCRYPTION LOGIC:
    const encryptedPermissions = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!encryptedPermissions) return [];
    const decryptedPermissions = decryptPermissions(encryptedPermissions);
    */
    store.dispatch(setPermissions(decryptedPermissions));
    
    const state = store.getState();
    const stored = selectPermissions(state);
    
    if (stored.length === 0) {
      throw new Error('Failed to store permissions in Redux');
    }
    
    return stored;
  } catch (error) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    }
    store.dispatch(setError(error.message));
    throw error;
  }
}

async function fetchPermissionsFromAPI() {
  try {
    store.dispatch(setLoading(true));
    
    const response = await rolesPermissionsApi.getEncryptedPermissions();
    const plainPermissions = response.data?.permissions || response.data || [];

    if (!plainPermissions) {
      throw new Error('No permissions data received from API');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(plainPermissions));
    }

    /* FUTURE ENCRYPTION LOGIC:
    const encryptedPermissions = response.data;
    if (!encryptedPermissions) throw new Error('No permissions data received from API');
    if (typeof window !== 'undefined') localStorage.setItem(PERMISSIONS_STORAGE_KEY, encryptedPermissions);
    const decryptedPermissions = decryptPermissions(encryptedPermissions);
    store.dispatch(setPermissions(decryptedPermissions));
    return decryptedPermissions;
    */

    store.dispatch(setPermissions(plainPermissions));
    return plainPermissions;
  } catch (error) {
    store.dispatch(setError(error.message));
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
}

async function ensurePermissionsLoaded() {
  const cachedPermissions = getDecryptedPermissionsFromStore();
  if (cachedPermissions.length > 0 && isCacheValid()) {
    return cachedPermissions;
  }

  try {
    const storagePermissions = await loadPermissionsFromStorage();
    if (storagePermissions.length > 0) {
      const verifyPermissions = getDecryptedPermissionsFromStore();
      if (verifyPermissions.length > 0) {
        return verifyPermissions;
      }
    }
  } catch (error) {
    // Fall through to API fetch
  }

  return await fetchPermissionsFromAPI();
}

export function hasPermissionSync(permissions) {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  
  if (permissionArray.length === 0) {
    return false;
  }

  const userPermissions = getDecryptedPermissionsFromStore();
  
  if (userPermissions.length === 0) {
    return false;
  }

  return permissionArray.some(permission => userPermissions.includes(permission));
}

export async function hasPermission(permissions) {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  
  if (permissionArray.length === 0) {
    return false;
  }

  try {
    const userPermissions = await ensurePermissionsLoaded();
    return permissionArray.some(permission => userPermissions.includes(permission));
  } catch (error) {
    return false;
  }
}

export async function getUserPermissions() {
  return await ensurePermissionsLoaded();
}

export function getUserPermissionsSync() {
  return getDecryptedPermissionsFromStore();
}

export function clearUserPermissions() {
  store.dispatch(clearPermissions());
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
  }
}
