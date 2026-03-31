const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// 🧠 cache
let cache = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 60 * 1000; // 1 minute

// 🔥 YOUR STATION ID
const STATION_ID = "ISYDNE4503";

app.get("/weather", async (req, res) => {
  try {
    const now = Date.now();

    // ⚡ serve cached data
    if (cache.data && now - cache.timestamp < CACHE_DURATION) {
      console.log("⚡ Serving cached station data");
      return res.json(cache.data);
    }

    console.log("🌐 Fetching station data...");

    // 🔥 Wunderground internal endpoint
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=2d0d8b9d9b8d4b5fa3b8b9d8b9d8b9d`;

    const response = await fetch(url);
    const data = await response.json();

    // ✅ extract only useful data
    const obs = data.observations?.[0];

    const cleaned = {
      tempC: obs?.metric?.temp,
      humidity: obs?.humidity,
      windSpeedKPH: obs?.metric?.windSpeed,
      pressure: obs?.metric?.pressure,
      windDir: obs?.winddir
    };

    // 💾 cache it
    cache = {
      data: cleaned,
      timestamp: now
    };

    res.json(cleaned);

  } catch (error) {
    console.error(error);

    // fallback to cache
    if (cache.data) {
      return res.json(cache.data);
    }

    res.status(500).json({ error: "Failed to fetch station data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});