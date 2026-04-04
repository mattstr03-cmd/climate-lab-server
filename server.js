import express from "express";
import fs from "fs";
import crypto from "crypto";

const app = express();

const API_KEY = "d7a10b87676b42fca10b87676b02fcea";
const STATION_ID = "ISYDNE4503";
const PORT = process.env.PORT || 8080;

const DATA_FILE = "weather-log.json";

let latestData = null;

let apiStatus = {
  ok: true,
  message: "OK",
  lastSuccessTime: null,
  lastErrorTime: null
};

function roundTo(value, decimals) {
  if (value == null || Number.isNaN(value)) return value;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

async function fetchWeatherRaw() {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Weather API HTTP ${response.status}`);
    }

    if (text.trimStart().startsWith("<")) {
      throw new Error("API returned HTML (likely blocked or quota exceeded)");
    }

    const data = JSON.parse(text);

    if (data.success === false || data.errors) {
      throw new Error(data.errors?.[0]?.message || "Unknown API error");
    }

    const obs = data.observations?.[0];
    const m = obs?.metric;

    if (!obs || !m) {
      throw new Error("Weather API payload missing observation data");
    }

    apiStatus.ok = true;
    apiStatus.message = "OK";
    apiStatus.lastSuccessTime = new Date().toISOString();
    apiStatus.lastErrorTime = null;

    return {
      location: obs.neighborhood || "Your Station",
      updated: obs.obsTimeLocal,
      temp: roundTo(m.temp, 1),
      feelsLike: roundTo(m.heatIndex, 1),
      humidity: obs.humidity,
      dewpt: roundTo(m.dewpt, 1),
      wind: roundTo(m.windSpeed, 1),
      windGust: roundTo(m.windGust, 1),
      windDir: obs.winddir,
      pressure: roundTo(m.pressure, 2),
      precipRate: m.precipRate,
      precipTotal: m.precipTotal,
      uv: obs.uv,
      solar: obs.solarRadiation
    };
  } catch (err) {
    apiStatus.ok = false;
    apiStatus.message = err.message;
    apiStatus.lastErrorTime = new Date().toISOString();

    console.log("API ERROR:", err.message);
    return null;
  }
}

async function logWeather() {
  try {
    const data = await fetchWeatherRaw();

    if (!data) {
      console.log("Skipping log - API issue");
      return;
    }

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
      history = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }

    history.push(entry);

    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    history = history.filter((e) => new Date(e.date).getTime() > cutoff);

    fs.writeFileSync(DATA_FILE, JSON.stringify(history));

    console.log("Logged:", entry.date);
  } catch (err) {
    apiStatus.ok = false;
    apiStatus.message = err.message;
    apiStatus.lastErrorTime = new Date().toISOString();

    console.error("Logger failed:", err.message);
  }
}

setInterval(logWeather, 60000);
logWeather();

app.get("/api/weather", (req, res) => {
  res.json({
    status: apiStatus,
    data: latestData
  });
});

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

app.get("/api/history", (req, res) => {
  try {
    let data = [];

    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }

    res.json({
      status: apiStatus,
      data
    });
  } catch (err) {
    apiStatus.ok = false;
    apiStatus.message = err.message;
    apiStatus.lastErrorTime = new Date().toISOString();

    res.status(500).json({
      status: apiStatus,
      data: []
    });
  }
});

app.get("/api/status", (req, res) => {
  res.json(apiStatus);
});

app.get("/", (req, res) => {
  res.send("Weather server running");
});

app.listen(PORT, () => console.log("Running on " + PORT));