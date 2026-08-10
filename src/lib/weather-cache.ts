/**
 * Server-Side Weather Cache
 * 
 * Caches weather data per city for 15 minutes to reduce
 * unnecessary Open-Meteo API calls. All users requesting
 * the same city reuse the cached data.
 */

interface CachedWeather {
  data: WeatherData;
  cachedAt: number; // timestamp ms
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  description: string;
  icon: string;
  isDay: boolean;
  updatedAt: string;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const cache = new Map<string, CachedWeather>();

function getCacheKey(city: string, country: string): string {
  return `${city.toLowerCase()}-${country.toLowerCase()}`;
}

/**
 * Get cached weather for a city, or null if expired/missing.
 */
export function getCachedWeather(city: string, country: string): WeatherData | null {
  const key = getCacheKey(city, country);
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  const age = Date.now() - entry.cachedAt;
  if (age > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Store weather data in the cache.
 */
export function setCachedWeather(city: string, country: string, data: WeatherData): void {
  const key = getCacheKey(city, country);
  cache.set(key, { data, cachedAt: Date.now() });
  
  // Prune old entries to prevent memory leak (keep max 200 entries)
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.cachedAt > CACHE_TTL_MS) {
        cache.delete(k);
      }
    }
  }
}
