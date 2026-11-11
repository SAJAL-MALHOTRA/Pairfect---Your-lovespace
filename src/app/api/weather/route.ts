import { NextResponse } from "next/server";
import { findCity, CITY_CATALOG } from "@/lib/city-catalog";
import { getCachedWeather, setCachedWeather, WeatherData } from "@/lib/weather-cache";
import { getWeatherInfo } from "@/lib/weather-codes";

// Sliding-window rate limiter per client IP to protect upstream weather API
const weatherRateLimitMap = new Map<string, number[]>();
const WEATHER_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_WEATHER_REQUESTS_PER_MINUTE = 30; // Max 30 lookups per IP per minute

function isWeatherRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (weatherRateLimitMap.get(ip) || []).filter(
    (t) => now - t < WEATHER_WINDOW_MS
  );

  if (timestamps.length >= MAX_WEATHER_REQUESTS_PER_MINUTE) {
    weatherRateLimitMap.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  weatherRateLimitMap.set(ip, timestamps);

  if (weatherRateLimitMap.size > 5000) {
    for (const [key, times] of weatherRateLimitMap.entries()) {
      const valid = times.filter((t) => now - t < WEATHER_WINDOW_MS);
      if (valid.length === 0) {
        weatherRateLimitMap.delete(key);
      } else {
        weatherRateLimitMap.set(key, valid);
      }
    }
  }

  return false;
}

export async function GET(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    if (isWeatherRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many weather queries. Please pause before checking the weather again." },
        { status: 429 }
      );
    }
    const { searchParams } = new URL(request.url);
    const cityName = searchParams.get("city");
    const countryName = searchParams.get("country") || "India";

    if (!cityName) {
      return NextResponse.json({ error: "City parameter is required" }, { status: 400 });
    }

    // 1. Check in-memory weather cache first
    const cached = getCachedWeather(cityName, countryName);
    if (cached) {
      return NextResponse.json({ weather: cached, cached: true });
    }

    // 2. Look up internal server coordinates (NEVER exposed to client)
    let cityEntry = findCity(cityName, countryName);
    
    // Fallback: match by city name alone if country match fails
    if (!cityEntry) {
      cityEntry = CITY_CATALOG.find((c) => c.name.toLowerCase() === cityName.toLowerCase()) || null;
    }

    // Default fallback coordinates if city is not in catalog (Delhi coords as default server lookup)
    const lat = cityEntry ? cityEntry.latitude : 28.6139;
    const lng = cityEntry ? cityEntry.longitude : 77.2090;

    // 3. Fetch current weather from Open-Meteo (server-to-server request)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day`;
    
    const weatherRes = await fetch(weatherUrl, { next: { revalidate: 900 } });

    if (!weatherRes.ok) {
      throw new Error(`Weather API returned status ${weatherRes.status}`);
    }

    const raw = await weatherRes.json();
    const current = raw.current || {};

    const info = getWeatherInfo(current.weather_code ?? 0);

    const weatherData: WeatherData = {
      temperature: Math.round(current.temperature_2m ?? 24),
      feelsLike: Math.round(current.apparent_temperature ?? 25),
      humidity: Math.round(current.relative_humidity_2m ?? 65),
      windSpeed: Math.round(current.wind_speed_10m ?? 10),
      precipitation: Math.round(current.precipitation ?? 0),
      weatherCode: current.weather_code ?? 0,
      description: info.description,
      icon: info.icon,
      isDay: current.is_day === 1,
      updatedAt: new Date().toISOString(),
    };

    // 4. Store in server cache for 15 minutes
    setCachedWeather(cityName, countryName, weatherData);

    // 5. Return sanitized weather data (NO coordinates)
    return NextResponse.json({ weather: weatherData, cached: false });
  } catch (err: any) {
    console.error("GET /api/weather error:", err);
    
    // Graceful fallback weather so the UI never breaks completely
    const fallbackWeather: WeatherData = {
      temperature: 24,
      feelsLike: 25,
      humidity: 60,
      windSpeed: 10,
      precipitation: 0,
      weatherCode: 3,
      description: "Cloudy",
      icon: "☁️",
      isDay: true,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ weather: fallbackWeather, error: "Weather temporarily unavailable, showing fallback." });
  }
}
