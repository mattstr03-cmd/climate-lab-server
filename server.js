import express from "express";

const app = express();

// 🔑 YOUR DETAILS
const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";

// 🌐 ROOT
app.get("/", (req, res) => {
  res.send("Climate Lab API is running 🚀");
});

// 🌦 WEATHER ROUTE
app.get("/weather", async (req, res) => {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    const observation = data.observations[0];
    const metric = observation.metric;

    // 🌡️ CORE DATA
    const temp = metric.temp;
    const feelsLike = metric.heatIndex;
    const dewPoint = metric.dewpt;

    // 💧 ATMOSPHERE
    const humidity = observation.humidity;
    const pressure = metric.pressure;

    // 💨 WIND
    const windSpeed = metric.windSpeed;
    const windGust = metric.windGust;
    const windDir = observation.winddir;

    // 🌧️ RAIN
    const precipRate = metric.precipRate;
    const precipTotal = metric.precipTotal;

    // 📍 META
    const updated = observation.obsTimeLocal;
    const location = observation.neighborhood || "Your Station";

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
              background: linear-gradient(to bottom, #0f172a, #1e293b);
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
              color: white;
            }

            .card {
              background: rgba(255,255,255,0.08);
              backdrop-filter: blur(25px);
              padding: 30px;
              border-radius: 28px;
              width: 340px;
              text-align: center;
              box-shadow: 0 30px 60px rgba(0,0,0,0.5);
            }

            h1 {
              font-size: 22px;
              margin-bottom: 5px;
              opacity: 0.9;
            }

            .location {
              font-size: 13px;
              opacity: 0.6;
              margin-bottom: 15px;
            }

            .temp {
              font-size: 64px;
              font-weight: 600;
              margin-bottom: 10px;
            }

            .section {
              margin-top: 15px;
              font-size: 14px;
              opacity: 0.9;
            }

            .small {
              font-size: 12px;
              opacity: 0.6;
              margin-top: 10px;
            }

            hr {
              border: none;
              border-top: 1px solid rgba(255,255,255,0.1);
              margin: 15px 0;
            }
          </style>
        </head>

        <body>
          <div class="card">
            <h1>🌦 Climate Lab</h1>
            <div class="location">${location}</div>

            <div class="temp">${temp}°C</div>

            <div class="section">
              Feels Like: ${feelsLike}°C<br>
              Humidity: ${humidity}%<br>
              Dew Point: ${dewPoint}°C
            </div>

            <hr>

            <div class="section">
              Wind: ${windSpeed} km/h<br>
              Gust: ${windGust} km/h<br>
              Direction: ${windDir}°
            </div>

            <hr>

            <div class="section">
              Pressure: ${pressure} hPa<br>
              Rain Rate: ${precipRate} mm/h<br>
              Rain Today: ${precipTotal} mm
            </div>

            <div class="small">Updated: ${updated}</div>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching weather data ❌");
  }
});

// 🚀 PORT
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});