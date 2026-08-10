/**
 * WMO Weather Code → Friendly Description & Icon Mapping
 * 
 * Based on Open-Meteo WMO Weather interpretation codes.
 * https://open-meteo.com/en/docs
 */

export interface WeatherInfo {
  description: string;
  icon: string; // Emoji for simple rendering
  category: "clear" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "thunderstorm";
}

const WEATHER_CODES: Record<number, WeatherInfo> = {
  0:  { description: "Clear sky", icon: "☀️", category: "clear" },
  1:  { description: "Mostly clear", icon: "🌤️", category: "clear" },
  2:  { description: "Partly cloudy", icon: "⛅", category: "cloudy" },
  3:  { description: "Cloudy", icon: "☁️", category: "cloudy" },
  45: { description: "Foggy", icon: "🌫️", category: "fog" },
  48: { description: "Icy fog", icon: "🌫️", category: "fog" },
  51: { description: "Light drizzle", icon: "🌦️", category: "drizzle" },
  53: { description: "Drizzle", icon: "🌦️", category: "drizzle" },
  55: { description: "Heavy drizzle", icon: "🌧️", category: "drizzle" },
  56: { description: "Freezing drizzle", icon: "🌧️", category: "drizzle" },
  57: { description: "Heavy freezing drizzle", icon: "🌧️", category: "drizzle" },
  61: { description: "Light rain", icon: "🌧️", category: "rain" },
  63: { description: "Rain", icon: "🌧️", category: "rain" },
  65: { description: "Heavy rain", icon: "🌧️", category: "rain" },
  66: { description: "Freezing rain", icon: "🌧️", category: "rain" },
  67: { description: "Heavy freezing rain", icon: "🌧️", category: "rain" },
  71: { description: "Light snow", icon: "🌨️", category: "snow" },
  73: { description: "Snow", icon: "❄️", category: "snow" },
  75: { description: "Heavy snow", icon: "❄️", category: "snow" },
  77: { description: "Snow grains", icon: "❄️", category: "snow" },
  80: { description: "Light showers", icon: "🌦️", category: "rain" },
  81: { description: "Showers", icon: "🌧️", category: "rain" },
  82: { description: "Heavy showers", icon: "🌧️", category: "rain" },
  85: { description: "Light snow showers", icon: "🌨️", category: "snow" },
  86: { description: "Heavy snow showers", icon: "❄️", category: "snow" },
  95: { description: "Thunderstorm", icon: "⛈️", category: "thunderstorm" },
  96: { description: "Thunderstorm with hail", icon: "⛈️", category: "thunderstorm" },
  99: { description: "Severe thunderstorm", icon: "⛈️", category: "thunderstorm" },
};

/**
 * Get weather info from a WMO weather code.
 * Falls back to "Unknown" for unrecognized codes.
 */
export function getWeatherInfo(code: number): WeatherInfo {
  return WEATHER_CODES[code] || { description: "Unknown", icon: "🌤️", category: "clear" };
}

/**
 * Get the time-of-day period from a timezone.
 */
export function getTimeOfDay(timezone: string): {
  period: "morning" | "afternoon" | "evening" | "night";
  label: string;
  hour: number;
} {
  try {
    const now = new Date();
    const timeStr = now.toLocaleString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(timeStr, 10);

    if (hour >= 5 && hour < 12) return { period: "morning", label: "It's morning there.", hour };
    if (hour >= 12 && hour < 17) return { period: "afternoon", label: "It's afternoon there.", hour };
    if (hour >= 17 && hour < 21) return { period: "evening", label: "It's evening there.", hour };
    return { period: "night", label: "It's night there.", hour };
  } catch {
    return { period: "evening", label: "It's evening there.", hour: 20 };
  }
}
