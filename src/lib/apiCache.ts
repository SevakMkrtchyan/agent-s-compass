import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

const MONTHLY_QUOTA_LIMIT = 1000;
const QUOTA_WARNING_THRESHOLD = 900;

export async function logApiCall(
  endpoint: string,
  requestParams?: Json,
  responseStatus?: number,
  userId?: string
): Promise<void> {
  try {
    await supabase.from("api_logs").insert([{
      endpoint,
      user_id: userId,
      request_params: requestParams,
      response_status: responseStatus,
    }]);
  } catch (error) {
    console.error("Failed to log API call:", error);
  }
}

export async function checkMonthlyQuota(): Promise<{
  count: number;
  limit: number;
  isWarning: boolean;
  isExceeded: boolean;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("api_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    console.error("Failed to check quota:", error);
    return { count: 0, limit: MONTHLY_QUOTA_LIMIT, isWarning: false, isExceeded: false };
  }

  const currentCount = count || 0;

  return {
    count: currentCount,
    limit: MONTHLY_QUOTA_LIMIT,
    isWarning: currentCount >= QUOTA_WARNING_THRESHOLD,
    isExceeded: currentCount >= MONTHLY_QUOTA_LIMIT,
  };
}

export async function getCachedProperty<T>(cacheKey: string): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from("property_cache")
      .select("data")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    console.log(`Cache hit for: ${cacheKey}`);
    return data.data as T;
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}

export async function setCachedProperty(
  cacheKey: string,
  data: Json,
  zpid?: string,
  ttlHours: number = 24
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await supabase.from("property_cache").upsert([{
      cache_key: cacheKey,
      data,
      zpid,
      cached_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }], { onConflict: "cache_key" });

    console.log(`Cached: ${cacheKey}, expires: ${expiresAt.toISOString()}`);
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

export function generateCacheKey(type: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join("|");
  return `${type}:${sortedParams}`;
}

export async function getCachedOrFetch<T extends Json>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  zpid?: string,
  ttlHours: number = 24
): Promise<{ data: T; fromCache: boolean }> {
  // Check cache first
  const cached = await getCachedProperty<T>(cacheKey);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  // Fetch fresh data
  const fresh = await fetchFn();

  // Cache it
  await setCachedProperty(cacheKey, fresh, zpid, ttlHours);

  return { data: fresh, fromCache: false };
}
