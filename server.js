import express from "express";
import fs from "fs";
import crypto from "crypto";

const app = express();

const API_KEY = "d7a10b87676b42fca10b87676b02fcea";
const STATION_ID = "ISYDNE4503";
const PORT = process.env.PORT || 8080;

const DATA_FILE = "weather-log.json";

// ==============================
// 🧠 CACHE + STATUS
// ==============================
let latestData = null;

let apiStatus = {
  ok: true,
  message: "OK",
  lastSuccessTime: null,
  lastErrorTime: null
};

// ==============================
// 🧠 FETCH WEATHER (SAFE + DETECT)
// ==============================
async function fetchWeatherRaw() {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const text = await response.text();

    // ❌ HTML response (CDN / blocked / quota)
    if (text.startsWith("<")) {
      throw new Error("API returned HTML (likely blocked or quota exceeded)");
    }

    const data = JSON.parse(text);

    // ❌ API error object
    if (data.success === false || data.errors) {
      throw new Error(data.errors?.[0]?.message || "Unknown API error");
    }

    const obs = data.observations[0];
    const m = obs.metric;

    // ✅ SUCCESS
    apiStatus.ok = true;
    apiStatus.message = "OK";
    apiStatus.lastSuccessTime = new Date().toISOString();

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

  } catch (err) {
    // ❌ ERROR STATE
    apiStatus.ok = false;
    apiStatus.message = err.message;
    apiStatus.lastErrorTime = new Date().toISOString();

    console.log("⚠️ API ERROR:", err.message);

    return null;
  }
}

// ==============================
// 📊 LOGGER (every 60s)
// ==============================
async function logWeather() {
  try {
    const data = await fetchWeatherRaw();

    // ❌ skip logging if bad data
    if (!data) {
      console.log("⏸ Skipping log — API issue");
      return;
    }

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
// 🌦 CURRENT API (CACHED + STATUS)
// ==============================
app.get("/api/weather", (req, res) => {
  res.json({
    status: apiStatus,
    data: latestData
  });
});

// ==============================
// 👆 MANUAL FETCH (DIRECT API)
// ==============================
app.get("/api/weather/manual", async (req, res) => {
  const data = await fetchWeatherRaw();

  if (!data) {
    return res.status(503).json({
      status: apiStatus,
      data: null
    });
  }

  latestData = data;

  res.json({
    status: apiStatus,
    data
  });
});

// ==============================
// 📈 HISTORY API
// ==============================
app.get("/api/history", (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);

    const data = JSON.parse(fs.readFileSync(DATA_FILE));

    res.json({
      status: apiStatus,
      data
    });

  } catch {
    res.status(500).json({
      status: apiStatus,
      data: []
    });
  }
});

// ==============================
// 📊 STATUS API (simple)
// ==============================
app.get("/api/status", (req, res) => {
  res.json(apiStatus);
});

// ==============================
// ROOT (optional)
// ==============================
app.get("/", (req, res) => {
  res.send("Weather server running 🚀");
});

// ==============================
app.listen(PORT, () => console.log("Running on " + PORT));