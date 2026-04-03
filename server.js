import express from "express";
import fs from "fs";
import crypto from "crypto";

const app = express();

const API_KEY = "d7a10b87676b42fca10b87676b02fcea";
const STATION_ID = "ISYDNE4503";
const PORT = process.env.PORT || 8080;

const DATA_FILE = "weather-log.json";

// ==============================
// 🧠 CACHE (LATEST DATA)
// ==============================
let latestData = null;

// ==============================
// 🧠 FETCH WEATHER (REAL API)
// ==============================
async function fetchWeatherRaw() {
  const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();

  const obs = data.observations[0];
  const m = obs.metric;

  return {
    location: obs.neighborhood || "Your Station",
    updated: obs.obsTimeLocal,

    temp: m.temp,
    feelsLike: m.heatIndex,

    humidity: obs.humidity,
    dewpt: m.dewpt,

    wind: m.windSpeed,
    windGust: m.windGust,
    windDir: obs.winddir,

    pressure: m.pressure,

    precipRate: m.precipRate,
    precipTotal: m.precipTotal,

    uv: obs.uv,
    solar: obs.solarRadiation
  };
}

// ==============================
// 📊 LOGGER (every 60s)
// ==============================
async function logWeather() {
  try {
    const data = await fetchWeatherRaw();

    // ✅ update cache
    latestData = data;

    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),

      temp: data.temp,
      feelsLike: data.feelsLike,
      humidity: data.humidity,
      dewpt: data.dewpt,

      wind: data.wind,
      windGust: data.windGust,
      windDir: data.windDir,

      pressure: data.pressure,

      precipRate: data.precipRate,
      precipTotal: data.precipTotal,

      uv: data.uv,
      solar: data.solar
    };

    let history = [];

    if (fs.existsSync(DATA_FILE)) {
      history = JSON.parse(fs.readFileSync(DATA_FILE));
    }

    history.push(entry);

    // keep last 7 days
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    history = history.filter(e => new Date(e.date).getTime() > cutoff);

    fs.writeFileSync(DATA_FILE, JSON.stringify(history));

    console.log("📊 Logged:", entry.date);

  } catch (err) {
    console.error("❌ Logger failed:", err.message);
  }
}

// run every 60 seconds
setInterval(logWeather, 60000);

// run immediately on startup
logWeather();

// ==============================
// 🌦 CURRENT API (CACHED)
// ==============================
app.get("/api/weather", (req, res) => {
  if (!latestData) {
    return res.status(503).json({ error: "No data yet" });
  }

  res.json(latestData);
});

// ==============================
// 👆 MANUAL FETCH (DIRECT API)
// ==============================
app.get("/api/weather/manual", async (req, res) => {
  try {
    const data = await fetchWeatherRaw();

    // optionally update cache
    latestData = data;

    res.json(data);
  } catch {
    res.status(500).json({ error: "Manual fetch failed" });
  }
});

// ==============================
// 📈 HISTORY API
// ==============================
app.get("/api/history", (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to load history" });
  }
});

// ==============================
app.listen(PORT, () => console.log("Running on " + PORT));