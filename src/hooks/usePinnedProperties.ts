import { useState, useCallback, useEffect } from 'react';
import { MLSProperty } from '@/types/property';

const STORAGE_KEY = 'pinned-properties';

export function usePinnedProperties() {
  const [pinnedProperties, setPinnedProperties] = useState<MLSProperty[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedProperties));
  }, [pinnedProperties]);

  const isPinned = useCallback((propertyId: string) => {
    return pinnedProperties.some(p => p.id === propertyId);
  }, [pinnedProperties]);

  const togglePin = useCallback((property: MLSProperty) => {
    setPinnedProperties(prev => {
      const exists = prev.some(p => p.id === property.id);
      if (exists) {
        return prev.filter(p => p.id !== property.id);
      }
      return [...prev, property];
    });
  }, []);

  const pinProperty = useCallback((property: MLSProperty) => {
    setPinnedProperties(prev => {
      if (prev.some(p => p.id === property.id)) return prev;
      return [...prev, property];
    });
  }, []);

  const unpinProperty = useCallback((propertyId: string) => {
    setPinnedProperties(prev => prev.filter(p => p.id !== propertyId));
  }, []);

  const clearPinned = useCallback(() => {
    setPinnedProperties([]);
  }, []);

  return {
    pinnedProperties,
    pinnedCount: pinnedProperties.length,
    isPinned,
    togglePin,
    pinProperty,
    unpinProperty,
    clearPinned,
  };
}
