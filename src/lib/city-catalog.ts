/**
 * Server-Side City Catalog
 * 
 * Internal coordinates for distance calculation and weather API requests.
 * These coordinates are NEVER sent to the client or stored in user profiles.
 * The frontend only ever sees { name, country, timezone }.
 */

export interface CityEntry {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/**
 * Popular cities with pre-baked coordinates.
 * Used for instant lookup without hitting external APIs.
 */
export const CITY_CATALOG: CityEntry[] = [
  // ── India ──
  { name: "Delhi", country: "India", latitude: 28.6139, longitude: 77.2090, timezone: "Asia/Kolkata" },
  { name: "Mumbai", country: "India", latitude: 19.0760, longitude: 72.8777, timezone: "Asia/Kolkata" },
  { name: "Jalandhar", country: "India", latitude: 31.3260, longitude: 75.5762, timezone: "Asia/Kolkata" },
  { name: "Chandigarh", country: "India", latitude: 30.7333, longitude: 76.7794, timezone: "Asia/Kolkata" },
  { name: "Bangalore", country: "India", latitude: 12.9716, longitude: 77.5946, timezone: "Asia/Kolkata" },
  { name: "Hyderabad", country: "India", latitude: 17.3850, longitude: 78.4867, timezone: "Asia/Kolkata" },
  { name: "Kolkata", country: "India", latitude: 22.5726, longitude: 88.3639, timezone: "Asia/Kolkata" },
  { name: "Pune", country: "India", latitude: 18.5204, longitude: 73.8567, timezone: "Asia/Kolkata" },
  { name: "Chennai", country: "India", latitude: 13.0827, longitude: 80.2707, timezone: "Asia/Kolkata" },
  { name: "Jaipur", country: "India", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata" },
  { name: "Ahmedabad", country: "India", latitude: 23.0225, longitude: 72.5714, timezone: "Asia/Kolkata" },
  { name: "Lucknow", country: "India", latitude: 26.8467, longitude: 80.9462, timezone: "Asia/Kolkata" },
  { name: "Surat", country: "India", latitude: 21.1702, longitude: 72.8311, timezone: "Asia/Kolkata" },
  { name: "Indore", country: "India", latitude: 22.7196, longitude: 75.8577, timezone: "Asia/Kolkata" },
  { name: "Nagpur", country: "India", latitude: 21.1458, longitude: 79.0882, timezone: "Asia/Kolkata" },
  { name: "Amritsar", country: "India", latitude: 31.6340, longitude: 74.8723, timezone: "Asia/Kolkata" },
  { name: "Ludhiana", country: "India", latitude: 30.9010, longitude: 75.8573, timezone: "Asia/Kolkata" },
  { name: "Patna", country: "India", latitude: 25.6093, longitude: 85.1376, timezone: "Asia/Kolkata" },
  { name: "Bhopal", country: "India", latitude: 23.2599, longitude: 77.4126, timezone: "Asia/Kolkata" },
  { name: "Goa", country: "India", latitude: 15.2993, longitude: 74.1240, timezone: "Asia/Kolkata" },
  { name: "Dehradun", country: "India", latitude: 30.3165, longitude: 78.0322, timezone: "Asia/Kolkata" },
  { name: "Noida", country: "India", latitude: 28.5355, longitude: 77.3910, timezone: "Asia/Kolkata" },
  { name: "Gurgaon", country: "India", latitude: 28.4595, longitude: 77.0266, timezone: "Asia/Kolkata" },
  { name: "Kochi", country: "India", latitude: 9.9312, longitude: 76.2673, timezone: "Asia/Kolkata" },
  { name: "Varanasi", country: "India", latitude: 25.3176, longitude: 83.0130, timezone: "Asia/Kolkata" },
  { name: "Coimbatore", country: "India", latitude: 11.0168, longitude: 76.9558, timezone: "Asia/Kolkata" },
  { name: "Shimla", country: "India", latitude: 31.1048, longitude: 77.1734, timezone: "Asia/Kolkata" },
  { name: "Udaipur", country: "India", latitude: 24.5854, longitude: 73.7125, timezone: "Asia/Kolkata" },

  // ── International (common for long-distance couples) ──
  { name: "London", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278, timezone: "Europe/London" },
  { name: "New York", country: "United States", latitude: 40.7128, longitude: -74.0060, timezone: "America/New_York" },
  { name: "Los Angeles", country: "United States", latitude: 34.0522, longitude: -118.2437, timezone: "America/Los_Angeles" },
  { name: "San Francisco", country: "United States", latitude: 37.7749, longitude: -122.4194, timezone: "America/Los_Angeles" },
  { name: "Toronto", country: "Canada", latitude: 43.6532, longitude: -79.3832, timezone: "America/Toronto" },
  { name: "Vancouver", country: "Canada", latitude: 49.2827, longitude: -123.1207, timezone: "America/Vancouver" },
  { name: "Dubai", country: "UAE", latitude: 25.2048, longitude: 55.2708, timezone: "Asia/Dubai" },
  { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, timezone: "Asia/Singapore" },
  { name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney" },
  { name: "Melbourne", country: "Australia", latitude: -37.8136, longitude: 144.9631, timezone: "Australia/Melbourne" },
  { name: "Berlin", country: "Germany", latitude: 52.5200, longitude: 13.4050, timezone: "Europe/Berlin" },
  { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522, timezone: "Europe/Paris" },
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, timezone: "Asia/Tokyo" },
  { name: "Seoul", country: "South Korea", latitude: 37.5665, longitude: 126.9780, timezone: "Asia/Seoul" },
  { name: "Bangkok", country: "Thailand", latitude: 13.7563, longitude: 100.5018, timezone: "Asia/Bangkok" },
  { name: "Kuala Lumpur", country: "Malaysia", latitude: 3.1390, longitude: 101.6869, timezone: "Asia/Kuala_Lumpur" },
];

/**
 * Look up a city in the catalog by name and country.
 * Returns the full CityEntry (including internal coordinates) or null.
 */
export function findCity(name: string, country: string): CityEntry | null {
  const normalizedName = name.trim().toLowerCase();
  const normalizedCountry = country.trim().toLowerCase();
  
  return CITY_CATALOG.find(
    (c) =>
      c.name.toLowerCase() === normalizedName &&
      c.country.toLowerCase() === normalizedCountry
  ) || null;
}

/**
 * Search cities by partial name match.
 * Returns sanitized results (no coordinates).
 */
export function searchCities(query: string): { name: string; country: string; timezone: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  
  return CITY_CATALOG
    .filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
    .slice(0, 12)
    .map((c) => ({ name: c.name, country: c.country, timezone: c.timezone }));
}

/**
 * Get popular cities for display (no coordinates).
 */
export function getPopularCities(): { name: string; country: string; timezone: string }[] {
  const popular = [
    "Delhi", "Mumbai", "Jalandhar", "Chandigarh",
    "Bangalore", "Hyderabad", "Kolkata", "Pune",
    "Chennai", "Jaipur", "Ahmedabad", "Lucknow",
  ];
  
  return CITY_CATALOG
    .filter((c) => popular.includes(c.name) && c.country === "India")
    .map((c) => ({ name: c.name, country: c.country, timezone: c.timezone }));
}

/**
 * Calculate distance between two cities using the Haversine formula.
 * Returns distance in both miles and km.
 */
export function calculateDistance(
  cityA: CityEntry,
  cityB: CityEntry
): { miles: number; km: number } {
  const R_KM = 6371; // Earth's radius in km
  const R_MI = 3958.8; // Earth's radius in miles

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(cityB.latitude - cityA.latitude);
  const dLng = toRad(cityB.longitude - cityA.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(cityA.latitude)) *
      Math.cos(toRad(cityB.latitude)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return {
    miles: Math.round(R_MI * c),
    km: Math.round(R_KM * c),
  };
}

/**
 * Format distance into a human-readable emotional label.
 */
export function formatDistanceLabel(km: number, miles: number): string {
  if (km < 1) return "Right here ♥";
  if (km < 10) return "Just around the corner";
  return `${miles.toLocaleString()} miles apart`;
}
