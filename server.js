import express from "express";

const app = express();

// 🔑 PASTE YOUR DETAILS HERE
const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";

// 🌐 ROOT ROUTE (optional)
app.get("/", (req, res) => {
  res.send("Climate Lab API is running 🚀");
});

// 🌦 WEATHER ROUTE
app.get("/weather", async (req, res) => {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    const obs = data.observations[0].metric;

    const temp = obs.temp;
    const humidity = obs.humidity;
    const wind = obs.windSpeed;
    const pressure = obs.pressure;
    const updated = data.observations[0].obsTimeLocal;

    res.send(`
      <html>
        <head>
          <title>Climate Lab</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(to bottom, #1c1c1e, #2c2c2e);
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
              color: white;
            }

            .card {
              background: rgba(255,255,255,0.08);
              backdrop-filter: blur(20px);
              padding: 30px;
              border-radius: 25px;
              width: 320px;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            }

            h1 {
              margin-bottom: 20px;
              font-size: 26px;
            }

            .temp {
              font-size: 60px;
              font-weight: 600;
              margin-bottom: 10px;
            }

            .info {
              font-size: 16px;
              opacity: 0.85;
              margin: 6px 0;
            }

            .updated {
              margin-top: 15px;
              font-size: 12px;
              opacity: 0.6;
            }
          </style>
        </head>

        <body>
          <div class="card">
            <h1>🌦 Climate Lab</h1>

            <div class="temp">${temp}°C</div>

            <div class="info">Humidity: ${humidity}%</div>
            <div class="info">Wind: ${wind} km/h</div>
            <div class="info">Pressure: ${pressure} hPa</div>

            <div class="updated">Updated: ${updated}</div>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching weather data ❌");
  }
});

// 🚀 PORT (IMPORTANT FOR RAILWAY)
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});