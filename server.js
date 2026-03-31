import express from "express";

const app = express();

// 🔑 YOUR DETAILS
const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";

// 🌦 WEATHER + GRAPH ROUTE
app.get("/weather", async (req, res) => {
  try {
    // current
    const currentUrl = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    // historical (last ~1 day)
    const historyUrl = `https://api.weather.com/v2/pws/observations/all/1day?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const currentRes = await fetch(currentUrl);
    const historyRes = await fetch(historyUrl);

    const currentData = await currentRes.json();
    const historyData = await historyRes.json();

    const observation = currentData.observations[0];
    const metric = observation.metric;

    // 🌡️ CURRENT DATA
    const temp = metric.temp;
    const humidity = observation.humidity;
    const wind = metric.windSpeed;
    const pressure = metric.pressure;
    const updated = observation.obsTimeLocal;

    // 📊 GRAPH DATA (last 20 points)
    const history = historyData.observations.slice(-20);

    const times = history.map(o => o.obsTimeLocal.split(" ")[1]);
    const temps = history.map(o => o.metric.temp);
    const humidityArr = history.map(o => o.humidity);
    const windArr = history.map(o => o.metric.windSpeed);
    const pressureArr = history.map(o => o.metric.pressure);

    res.send(`
      <html>
        <head>
          <title>Climate Lab</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

          <style>
            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont;
              background: linear-gradient(to bottom, #0f172a, #1e293b);
              color: white;
              padding: 20px;
            }

            .card {
              background: rgba(255,255,255,0.08);
              backdrop-filter: blur(20px);
              padding: 25px;
              border-radius: 25px;
              max-width: 400px;
              margin: auto;
              text-align: center;
              margin-bottom: 20px;
            }

            h1 {
              margin: 0;
              font-size: 22px;
            }

            .temp {
              font-size: 60px;
              margin: 10px 0;
            }

            .info {
              font-size: 14px;
              opacity: 0.85;
            }

            .graph {
              background: rgba(255,255,255,0.05);
              padding: 20px;
              border-radius: 20px;
              margin-top: 20px;
            }
          </style>
        </head>

        <body>

          <!-- CURRENT CARD -->
          <div class="card">
            <h1>🌦 Climate Lab</h1>
            <div class="temp">${temp}°C</div>
            <div class="info">Humidity: ${humidity}%</div>
            <div class="info">Wind: ${wind} km/h</div>
            <div class="info">Pressure: ${pressure} hPa</div>
            <div class="info">Updated: ${updated}</div>
          </div>

          <!-- TEMP GRAPH -->
          <div class="graph">
            <canvas id="tempChart"></canvas>
          </div>

          <!-- HUMIDITY GRAPH -->
          <div class="graph">
            <canvas id="humidityChart"></canvas>
          </div>

          <!-- WIND GRAPH -->
          <div class="graph">
            <canvas id="windChart"></canvas>
          </div>

          <!-- PRESSURE GRAPH -->
          <div class="graph">
            <canvas id="pressureChart"></canvas>
          </div>

          <script>
            const labels = ${JSON.stringify(times)};

            new Chart(document.getElementById('tempChart'), {
              type: 'line',
              data: {
                labels,
                datasets: [{
                  label: 'Temperature (°C)',
                  data: ${JSON.stringify(temps)},
                  borderColor: '#ff3b30',
                  tension: 0.4
                }]
              }
            });

            new Chart(document.getElementById('humidityChart'), {
              type: 'line',
              data: {
                labels,
                datasets: [{
                  label: 'Humidity (%)',
                  data: ${JSON.stringify(humidityArr)},
                  borderColor: '#0a84ff',
                  tension: 0.4
                }]
              }
            });

            new Chart(document.getElementById('windChart'), {
              type: 'line',
              data: {
                labels,
                datasets: [{
                  label: 'Wind (km/h)',
                  data: ${JSON.stringify(windArr)},
                  borderColor: '#34c759',
                  tension: 0.4
                }]
              }
            });

            new Chart(document.getElementById('pressureChart'), {
              type: 'line',
              data: {
                labels,
                datasets: [{
                  label: 'Pressure (hPa)',
                  data: ${JSON.stringify(pressureArr)},
                  borderColor: '#ff9f0a',
                  tension: 0.4
                }]
              }
            });
          </script>

        </body>
      </html>
    `);

  } catch (err) {
    console.error(err);
    res.send("Error loading data");
  }
});

// 🚀 PORT
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});