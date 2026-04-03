import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { brandService } from '@/services/brandService';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [isCreatorProfileLoading, setIsCreatorProfileLoading] = useState(true);
  const [creatorProfileError, setCreatorProfileError] = useState('');

  const loadCreatorProfile = useCallback(async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setIsCreatorProfileLoading(true);
      }

      setCreatorProfileError('');
      const data = await brandService.getCreatorBrandProfile();
      setCreatorProfile(data);
    } catch (error) {
      setCreatorProfile(null);
      setCreatorProfileError(error?.message || 'Failed to load creator profile');
    } finally {
      if (showLoader) {
        setIsCreatorProfileLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCreatorProfile({ showLoader: true });
  }, [loadCreatorProfile]);

  const reloadCreatorProfile = useCallback(
    async (showLoader = false) => {
      await loadCreatorProfile({ showLoader });
    },
    [loadCreatorProfile]
  );

  const value = useMemo(
    () => ({
      role: 'creator',
      creatorProfile,
      isCreatorProfileLoading,
      creatorProfileError,
      reloadCreatorProfile,
    }),
    [creatorProfile, isCreatorProfileLoading, creatorProfileError, reloadCreatorProfile]
  );

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};