import { t } from "./i18n.js";

export { fetchWeather, renderWeather };

let weatherCache = null;

function renderWeather() {
    if (!weatherCache) return;
    const weatherEl = document.getElementById("weather-display");
    if (!weatherEl) return;
    const useCelsius = JSON.parse(localStorage.getItem("checkboxes"))?.celsius ?? true;
    const temp = useCelsius ? `${weatherCache.tempC}°C` : `${weatherCache.tempF}°F`;
    weatherEl.textContent = `${weatherCache.emoji} ${temp}${weatherCache.city ? ` · ${weatherCache.city}` : ""}`;
}

const WMO_CODES = {
    0: "☀️",
    1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌧️",
    56: "🌧️", 57: "🌧️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    66: "🌧️", 67: "🌧️",
    71: "🌨️", 73: "🌨️", 75: "❄️",
    77: "❄️",
    80: "🌦️", 81: "🌧️", 82: "🌧️",
    85: "🌨️", 86: "❄️",
    95: "⛈️", 96: "⛈️", 99: "⛈️",
};

async function fetchWeather() {
    const weatherEl = document.getElementById("weather-display");
    if (!weatherEl) return;

    weatherEl.textContent = t("weather_loading");

    try {
        let lat, lon, city = "";
        const pos = await new Promise(resolve =>
            navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 })
        );

        if (pos) {
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            const geoRes  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
            const geoData = await geoRes.json();
            city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || "";
        } else {
            const ipRes  = await fetch("https://ipapi.co/json/");
            const ipData = await ipRes.json();
            lat  = ipData.latitude;
            lon  = ipData.longitude;
            city = ipData.city || "";
        }

        const [resC, resF] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&temperature_unit=celsius&forecast_days=1`),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&temperature_unit=fahrenheit&forecast_days=1`),
        ]);
        const [dataC, dataF] = await Promise.all([resC.json(), resF.json()]);

        const code  = dataC.current.weathercode;
        const tempC = Math.round(dataC.current.temperature_2m);
        const tempF = Math.round(dataF.current.temperature_2m);
        const emoji = WMO_CODES[code] ?? "🌡️";

        weatherCache = { code, tempC, tempF, city, emoji };
        renderWeather();
    } catch {
        weatherEl.textContent = t("weather_error");
    }
}
