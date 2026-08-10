import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findCity, calculateDistance, formatDistanceLabel, CITY_CATALOG } from "@/lib/city-catalog";
import { getCachedWeather, setCachedWeather, WeatherData } from "@/lib/weather-cache";
import { getWeatherInfo } from "@/lib/weather-codes";

async function fetchWeatherInternal(cityName: string, countryName: string): Promise<WeatherData> {
  const cached = getCachedWeather(cityName, countryName);
  if (cached) return cached;

  let cityEntry = findCity(cityName, countryName);
  if (!cityEntry) {
    cityEntry = CITY_CATALOG.find((c) => c.name.toLowerCase() === cityName.toLowerCase()) || null;
  }

  const lat = cityEntry ? cityEntry.latitude : 28.6139;
  const lng = cityEntry ? cityEntry.longitude : 77.2090;

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day`;
    const weatherRes = await fetch(weatherUrl, { next: { revalidate: 900 } });

    if (weatherRes.ok) {
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

      setCachedWeather(cityName, countryName, weatherData);
      return weatherData;
    }
  } catch (e) {
    console.error(`Failed to fetch weather for ${cityName}:`, e);
  }

  return {
    temperature: 24,
    feelsLike: 25,
    humidity: 65,
    windSpeed: 10,
    precipitation: 0,
    weatherCode: 3,
    description: "Cloudy",
    icon: "☁️",
    isDay: true,
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch current user's profile with city
    const { data: userProfile } = await supabase
      .from("users")
      .select("id, display_name, city")
      .eq("id", user.id)
      .single();

    const userCity = userProfile?.city || null;

    // 2. Fetch user's active pair
    const { data: pair } = await supabase
      .from("pairs")
      .select("id, user_a_id, user_b_id, status")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .single();

    if (!pair) {
      return NextResponse.json({
        state: "no_pair",
        you: userCity ? { city: userCity.name, country: userCity.country, timezone: userCity.timezone } : null,
        partner: null,
      });
    }

    // 3. Fetch partner's profile with city
    const partnerId = pair.user_a_id === user.id ? pair.user_b_id : pair.user_a_id;
    let partnerProfile: any = null;

    if (partnerId) {
      const { data: partnerData } = await supabase
        .from("users")
        .select("id, display_name, city")
        .eq("id", partnerId)
        .single();
      partnerProfile = partnerData;
    }

    const partnerCity = partnerProfile?.city || null;

    // State 1: Current user has no city set
    if (!userCity) {
      return NextResponse.json({
        state: "no_city",
        you: null,
        partner: partnerCity ? { city: partnerCity.name, country: partnerCity.country, timezone: partnerCity.timezone } : null,
        partnerName: partnerProfile?.display_name || "Partner",
      });
    }

    // State 2: Current user has city, partner has no city
    if (!partnerCity) {
      return NextResponse.json({
        state: "waiting_partner",
        you: { city: userCity.name, country: userCity.country, timezone: userCity.timezone },
        partner: null,
        partnerName: partnerProfile?.display_name || "Partner",
      });
    }

    // State 3: Both partners have cities set!
    const userCityEntry = findCity(userCity.name, userCity.country) || {
      name: userCity.name,
      country: userCity.country,
      latitude: 31.326,
      longitude: 75.576,
      timezone: userCity.timezone || "Asia/Kolkata",
    };

    const partnerCityEntry = findCity(partnerCity.name, partnerCity.country) || {
      name: partnerCity.name,
      country: partnerCity.country,
      latitude: 28.6139,
      longitude: 77.209,
      timezone: partnerCity.timezone || "Asia/Kolkata",
    };

    // Calculate distance server-side
    const dist = calculateDistance(userCityEntry, partnerCityEntry);
    const label = formatDistanceLabel(dist.km, dist.miles);

    // Fetch weather for both cities
    const [partnerWeather, yourWeather] = await Promise.all([
      fetchWeatherInternal(partnerCity.name, partnerCity.country),
      fetchWeatherInternal(userCity.name, userCity.country),
    ]);

    // Return aggregated payload (STRICTLY NO COORDINATES)
    return NextResponse.json({
      state: "complete",
      you: {
        city: userCity.name,
        country: userCity.country,
        timezone: userCity.timezone || "Asia/Kolkata",
      },
      partner: {
        city: partnerCity.name,
        country: partnerCity.country,
        timezone: partnerCity.timezone || "Asia/Kolkata",
      },
      partnerName: partnerProfile?.display_name || "Partner",
      distance: {
        miles: dist.miles,
        km: dist.km,
        label,
      },
      partnerWeather,
      yourWeather,
    });
  } catch (err: any) {
    console.error("GET /api/meanwhile error:", err);
    return NextResponse.json({ error: err.message || "Failed to load Meanwhile data" }, { status: 500 });
  }
}
