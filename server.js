const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

let cache = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 60 * 1000;
const STATION_ID = "ISYDNE4503";

app.get("/weather", async (req, res) => {
  try {
    const now = Date.now();

    if (cache.data && now - cache.timestamp < CACHE_DURATION) {
      console.log("⚡ Cached");
      return res.json(cache.data);
    }

    console.log("🌐 Fetching station data...");

    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=2d0d8b9d9b8d4b5fa3b8b9d8b9d8b9d`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("❌ API FAILED:", response.status);
      return res.status(500).json({
        error: "Weather API failed",
        status: response.status,
      });
    }

    const data = await response.json();

    const obs = data.observations?.[0];

    if (!obs) {
      return res.status(500).json({
        error: "No observation data",
      });
    }

    const cleaned = {
      tempC: obs.metric?.temp,
      humidity: obs.humidity,
      windSpeedKPH: obs.metric?.windSpeed,
      pressure: obs.metric?.pressure,
      windDir: obs.winddir,
    };

    cache = {
      data: cleaned,
      timestamp: now,
    };

    res.json(cleaned);

  } catch (err) {
    console.error("🔥 CRASH:", err);

    res.status(500).json({
      error: "Server crash",
      message: err.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Server running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});