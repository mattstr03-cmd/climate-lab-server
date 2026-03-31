const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 Your API key (replace this)
const API_KEY = process.env.API_KEY || "YOUR_API_KEY_HERE";

// 🧠 Simple in-memory cache
let cache = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

app.get("/weather", async (req, res) => {
  try {
    const now = Date.now();

    // ✅ Return cached data if still valid
    if (cache.data && now - cache.timestamp < CACHE_DURATION) {
      console.log("Serving from cache");
      return res.json(cache.data);
    }

    console.log("Fetching fresh weather data");

    // 🌍 Example: Sydney weather (change if needed)
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Sydney&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API error");
    }

    // 💾 Save to cache
    cache = {
      data: data,
      timestamp: now,
    };

    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

app.get("/", (req, res) => {
  res.send("Weather API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});