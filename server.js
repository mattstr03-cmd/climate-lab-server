import express from "express";

const app = express();

// 🔑 PUT YOUR DETAILS HERE
const STATION_ID = "ISYDNE4503";
const API_KEY = "c9a45997f96d49c2a45997f96d29c22c"; // paste your real key inside the quotes

// ✅ Root route (prevents Railway 404)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// 🌦️ Weather route (MAIN ONE)
app.get("/weather", async (req, res) => {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    // Safety check
    if (!data.observations || data.observations.length === 0) {
      return res.status(500).send("No weather data available");
    }

    const obs = data.observations[0];

    // 👇 Clean display (NOT JSON anymore)
    res.send(`
      <html>
        <head>
          <title>Weather Station</title>
          <style>
            body {
              font-family: Arial;
              background: #0f172a;
              color: white;
              text-align: center;
              padding-top: 50px;
            }
            .card {
              background: #1e293b;
              padding: 30px;
              border-radius: 20px;
              display: inline-block;
            }
            h1 { margin-bottom: 20px; }
            p { font-size: 20px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🌦️ My Weather Station</h1>
            <p><strong>Temp:</strong> ${obs.metric.temp}°C</p>
            <p><strong>Humidity:</strong> ${obs.humidity}%</p>
            <p><strong>Wind:</strong> ${obs.metric.windSpeed} km/h</p>
            <p><strong>Pressure:</strong> ${obs.metric.pressure} hPa</p>
            <p><strong>Updated:</strong> ${obs.obsTimeLocal}</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("Weather fetch error:", error);
    res.status(500).send("Error fetching weather data");
  }
});

// 🚀 PORT FIX (VERY IMPORTANT FOR RAILWAY)
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});