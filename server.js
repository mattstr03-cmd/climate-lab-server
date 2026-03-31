import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 YOUR DETAILS
const API_KEY = "1nIKe0qQ";
const STATION_ID = "ISYDNE4503";

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "working",
    message: "API is alive"
  });
});

// Weather route
app.get("/weather", async (req, res) => {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error fetching weather:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});