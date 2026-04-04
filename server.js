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

function toNumber(value) {
  if (value == null) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
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
    const m = obs?.metric_si || obs?.metric;

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
      temp: toNumber(m.temp),
      feelsLike: toNumber(m.heatIndex),
      humidity: obs.humidity == null ? null : Math.round(Number(obs.humidity)),
      dewpt: toNumber(m.dewpt),
      wind: toNumber(m.windSpeed),
      windGust: toNumber(m.windGust),
      windDir: obs.winddir == null ? null : Math.round(Number(obs.winddir)),
      pressure: toNumber(m.pressure),
      precipRate: toNumber(m.precipRate),
      precipTotal: toNumber(m.precipTotal),
      uv: toNumber(obs.uv),
      solar: toNumber(obs.solarRadiation)
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
      date: data.updated,
      loggedAt: new Date().toISOString(),
      ...data
    };

    let history = [];

    if (fs.existsSync(DATA_FILE)) {
      try {
        history = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      } catch {
        history = [];
      }
    }

    history.push(entry);

    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    history = history.filter((e) => {
      const time = new Date(e.loggedAt || e.date).getTime();
      return Number.isFinite(time) && time > cutoff;
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));

    console.log("Logged observation:", entry.date);
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