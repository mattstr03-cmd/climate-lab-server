import express from "express";
import fetch from "node-fetch";

const app = express();
const port = process.env.PORT || 8080;

const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";

async function renderWeather(req, res) {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data?.observations?.[0]?.metric) {
      console.error("Bad weather response:", data);
      return res.status(500).send("Cannot get weather");
    }

    const obs = data.observations[0];
    const m = obs.metric;

    res.send(`
      <html>
        <body style="background:black;color:white;font-family:sans-serif;text-align:center;padding-top:100px;">
          <h1>🌤 Climate Lab</h1>
          <h2 style="font-size:60px;">${m.temp}°C</h2>

          <p>Humidity: ${obs.humidity}%</p>
          <p>Wind: ${m.windSpeed} km/h</p>
          <p>Pressure: ${m.pressure} hPa</p>
          <p>Dew Point: ${m.dewpt}°C</p>
          <p>Feels Like: ${m.heatIndex}°C</p>

          <p style="margin-top:30px;font-size:12px;">
            Updated: ${obs.obsTimeLocal}
          </p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Weather fetch error:", err);
    res.status(500).send("Cannot get weather");
  }
}

app.get("/", renderWeather);
app.get("/weather", renderWeather);

app.listen(port, () => {
  console.log("Server running on port " + port);
});