import express from "express";
import fetch from "node-fetch";

const app = express();
const port = process.env.PORT || 8080;

const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";

// 🔥 FUNCTION TO FETCH DATA
async function getWeatherData() {
  const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  const obs = data.observations[0];
  const m = obs.metric;

  return {
    temp: m.temp,
    humidity: obs.humidity,
    wind: m.windSpeed,
    pressure: m.pressure,
    dewPoint: m.dewpt,
    feelsLike: m.heatIndex,
    updated: obs.obsTimeLocal,
  };
}

// 🌐 HTML PAGE (browser)
app.get("/", async (req, res) => {
  try {
    const w = await getWeatherData();

    res.send(`
      <html>
        <body style="background:black;color:white;font-family:sans-serif;text-align:center;padding-top:100px;">
          <h1>🌤 Climate Lab</h1>
          <h2 style="font-size:60px;">${w.temp}°C</h2>

          <p>Humidity: ${w.humidity}%</p>
          <p>Wind: ${w.wind} km/h</p>
          <p>Pressure: ${w.pressure} hPa</p>
          <p>Dew Point: ${w.dewPoint}°C</p>
          <p>Feels Like: ${w.feelsLike}°C</p>

          <p style="margin-top:30px;font-size:12px;">
            Updated: ${w.updated}
          </p>
        </body>
      </html>
    `);
  } catch (err) {
    res.send("Error fetching weather");
  }
});

// 📱 JSON API (for iPhone app)
app.get("/api/weather", async (req, res) => {
  try {
    const data = await getWeatherData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

app.listen(port, () => {
  console.log("Server running on port " + port);
});