import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Buyer } from "@/types";

interface CachedAction {
  id: string;
  label: string;
  command: string;
  type: "artifact" | "thinking";
}

interface CacheEntry {
  actions: CachedAction[];
  cachedAt: Date;
  isStale: boolean;
}

interface UseRecommendationCacheReturn {
  getCachedActions: (buyerId: string) => CacheEntry | null;
  setCachedActions: (buyerId: string, actions: CachedAction[]) => Promise<void>;
  invalidateCache: (buyerId: string) => Promise<void>;
  lastRefreshed: Date | null;
  isCacheHit: boolean;
}

// In-memory cache for instant access
const memoryCache = new Map<string, CacheEntry>();

export function useRecommendationCache(): UseRecommendationCacheReturn {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isCacheHit, setIsCacheHit] = useState(false);

  // Load from database into memory on mount
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const { data } = await supabase
          .from("buyer_recommendations")
          .select("*")
          .eq("status", "valid")
          .gt("expires_at", new Date().toISOString());

        if (data) {
          data.forEach((row) => {
            const actions = row.actions_json as unknown as CachedAction[];
            memoryCache.set(row.buyer_id, {
              actions,
              cachedAt: new Date(row.created_at),
              isStale: false,
            });
          });
        }
      } catch (err) {
        console.error("Failed to load recommendation cache:", err);
      }
    };

    loadFromDB();
  }, []);

  const getCachedActions = useCallback((buyerId: string): CacheEntry | null => {
    const cached = memoryCache.get(buyerId);
    
    if (cached) {
      // Check if cache is older than 1 hour
      const ageMs = Date.now() - cached.cachedAt.getTime();
      const isStale = ageMs > 60 * 60 * 1000; // 1 hour
      
      if (!isStale) {
        setIsCacheHit(true);
        setLastRefreshed(cached.cachedAt);
        return { ...cached, isStale: false };
      } else {
        return { ...cached, isStale: true };
      }
    }
    
    setIsCacheHit(false);
    return null;
  }, []);

  const setCachedActions = useCallback(async (buyerId: string, actions: CachedAction[]) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    // Update memory cache immediately
    memoryCache.set(buyerId, {
      actions,
      cachedAt: now,
      isStale: false,
    });
    setLastRefreshed(now);

    // Persist to database in background
    try {
      // First, mark old entries as stale
      await supabase
        .from("buyer_recommendations")
        .update({ status: "stale" })
        .eq("buyer_id", buyerId)
        .eq("status", "valid");

      // Insert new entry using type assertion for JSONB compatibility
      const insertData = {
        buyer_id: buyerId,
        actions_json: JSON.parse(JSON.stringify(actions)),
        expires_at: expiresAt.toISOString(),
        status: "valid" as const,
      };
      await supabase.from("buyer_recommendations").insert([insertData]);
    } catch (err) {
      console.error("Failed to persist recommendation cache:", err);
    }
  }, []);

  const invalidateCache = useCallback(async (buyerId: string) => {
    memoryCache.delete(buyerId);
    
    try {
      await supabase
        .from("buyer_recommendations")
        .update({ status: "stale" })
        .eq("buyer_id", buyerId);
    } catch (err) {
      console.error("Failed to invalidate cache:", err);
    }
  }, []);

  return {
    getCachedActions,
    setCachedActions,
    invalidateCache,
    lastRefreshed,
    isCacheHit,
  };
}
