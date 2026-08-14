"use client";

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/lib/store/hooks';
import { selectPermissions, selectIsCacheValid } from '@/lib/store/slices/permissionsSlice';
import { getUserPermissions } from '@/lib/permissions';

export function usePermissions() {
  const permissions = useAppSelector(selectPermissions);
  const isCacheValid = useAppSelector(selectIsCacheValid);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (permissions.length === 0 || !isCacheValid) {
      setIsLoading(true);
      getUserPermissions()
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [permissions.length, isCacheValid]);

  return permissions;
}
