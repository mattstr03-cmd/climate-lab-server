import express from "express";

const app = express();

// 🔑 Your real values
const STATION_ID = "ISYDNE4503";
const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";

// Root route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Test route
app.get("/test", (req, res) => {
  res.json({ status: "working", message: "API is alive" });
});

// Weather route
app.get("/weather", async (req, res) => {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    const obs = data.observations[0];

    res.send(`
      <h1>🌦️ My Weather Station</h1>
      <p><strong>Temp:</strong> ${obs.metric.temp}°C</p>
      <p><strong>Humidity:</strong> ${obs.humidity}%</p>
      <p><strong>Wind:</strong> ${obs.metric.windSpeed} km/h</p>
      <p><strong>Pressure:</strong> ${obs.metric.pressure} hPa</p>
      <p><strong>Updated:</strong> ${obs.obsTimeLocal}</p>
    `);

  } catch (error) {
    res.status(500).send("Error fetching weather");
  }
});

// Railway port fix
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});