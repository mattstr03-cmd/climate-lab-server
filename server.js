import express from "express";

const app = express();

const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";
const PORT = process.env.PORT || 8080;

function toTimeLabel(obsTimeLocal) {
  if (!obsTimeLocal) return "--:--";
  const parts = obsTimeLocal.split(" ");
  return parts[1]?.slice(0, 5) || obsTimeLocal;
}

function safeNum(value, fallback = null) {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

// Raw JSON endpoint for current + history
app.get("/api/weather", async (req, res) => {
  try {
    const currentUrl = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;
    const historyUrl = `https://api.weather.com/v2/pws/observations/all/1day?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const [currentRes, historyRes] = await Promise.all([
      fetch(currentUrl),
      fetch(historyUrl),
    ]);

    const [currentData, historyData] = await Promise.all([
      currentRes.json(),
      historyRes.json(),
    ]);

    if (!currentData?.observations?.length) {
      return res.status(500).json({ error: "No current observation data" });
    }

    if (!historyData?.observations?.length) {
      return res.status(500).json({ error: "No history observation data" });
    }

    const currentObs = currentData.observations[0];
    const currentMetric = currentObs.metric || {};

    // Last 1 hour by taking recent points from the end and comparing epoch seconds
    const allHistory = historyData.observations;
    const latestEpoch = allHistory[allHistory.length - 1]?.epoch || currentObs.epoch;
    const oneHourAgoEpoch = latestEpoch - 3600;

    const lastHour = allHistory.filter((o) => (o.epoch || 0) >= oneHourAgoEpoch);

    const chart = {
      labels: lastHour.map((o) => toTimeLabel(o.obsTimeLocal)),
      temperature: lastHour.map((o) => safeNum(o.metric?.temp)),
      humidity: lastHour.map((o) => safeNum(o.humidity)),
      windSpeed: lastHour.map((o) => safeNum(o.metric?.windSpeed)),
      pressure: lastHour.map((o) => safeNum(o.metric?.pressure)),
      rainRate: lastHour.map((o) => safeNum(o.metric?.precipRate, 0)),
      rainTotal: lastHour.map((o) => safeNum(o.metric?.precipTotal, 0)),
    };

    const current = {
      location: currentObs.neighborhood || "Your Station",
      updated: currentObs.obsTimeLocal,
      temp: safeNum(currentMetric.temp),
      feelsLike: safeNum(currentMetric.heatIndex),
      humidity: safeNum(currentObs.humidity),
      dewpt: safeNum(currentMetric.dewpt),
      wind: safeNum(currentMetric.windSpeed, 0),
      windGust: safeNum(currentMetric.windGust, 0),
      windDir: safeNum(currentObs.winddir),
      pressure: safeNum(currentMetric.pressure),
      precipRate: safeNum(currentMetric.precipRate, 0),
      precipTotal: safeNum(currentMetric.precipTotal, 0),
      uv: safeNum(currentObs.uv),
      solar: safeNum(currentObs.solarRadiation),
    };

    res.json({ current, chart });
  } catch (err) {
    console.error("API weather error:", err);
    res.status(500).json({ error: "Failed to load weather data" });
  }
});

// Simple root
app.get("/", (req, res) => {
  res.send('Climate Lab is running 🚀 Open <a href="/weather">/weather</a>');
});

// Dashboard page
app.get("/weather", (req, res) => {
  res.send(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Climate Lab</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
      background: linear-gradient(to bottom, #0f172a, #1e293b);
      color: white;
      padding: 20px;
    }

    .wrap {
      max-width: 1100px;
      margin: 0 auto;
    }

    .card {
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(20px);
      border-radius: 28px;
      padding: 24px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.35);
      margin-bottom: 20px;
    }

    .top {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
    }

    .title {
      font-size: 22px;
      font-weight: 700;
      text-align: center;
    }

    .location {
      text-align: center;
      opacity: 0.7;
      font-size: 13px;
      margin-top: 4px;
    }

    .temp {
      text-align: center;
      font-size: 72px;
      font-weight: 700;
      line-height: 1;
      margin: 16px 0 8px;
    }

    .feels {
      text-align: center;
      opacity: 0.8;
      margin-bottom: 18px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
      font-size: 15px;
    }

    .metric-box {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 12px 14px;
    }

    .metric-label {
      opacity: 0.7;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 20px;
      font-weight: 600;
    }

    .updated {
      margin-top: 16px;
      text-align: center;
      font-size: 12px;
      opacity: 0.65;
    }

    .charts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .chart-card {
      background: rgba(255,255,255,0.06);
      border-radius: 22px;
      padding: 16px;
      min-height: 260px;
    }

    .chart-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 10px;
      opacity: 0.9;
    }

    .status {
      text-align: center;
      margin-bottom: 12px;
      font-size: 13px;
      opacity: 0.8;
    }

    @media (max-width: 900px) {
      .top, .charts {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="status" id="status">Loading…</div>

    <div class="top">
      <div class="card">
        <div class="title">🌦 Climate Lab</div>
        <div class="location" id="location">—</div>
        <div class="temp" id="temp">--°C</div>
        <div class="feels" id="feels">Feels like --°</div>

        <div class="grid">
          <div class="metric-box">
            <div class="metric-label">Humidity</div>
            <div class="metric-value" id="humidity">--%</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Dew Point</div>
            <div class="metric-value" id="dewpt">--°C</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Wind</div>
            <div class="metric-value" id="wind">-- km/h</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Wind Gust</div>
            <div class="metric-value" id="windGust">-- km/h</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Wind Direction</div>
            <div class="metric-value" id="windDir">--°</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Pressure</div>
            <div class="metric-value" id="pressure">-- hPa</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Rain Rate</div>
            <div class="metric-value" id="precipRate">-- mm</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Rain Total</div>
            <div class="metric-value" id="precipTotal">-- mm</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">UV</div>
            <div class="metric-value" id="uv">--</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Solar</div>
            <div class="metric-value" id="solar">--</div>
          </div>
        </div>

        <div class="updated" id="updated">Updated: --</div>
      </div>

      <div class="card">
        <div class="chart-title">Station Summary</div>
        <div class="grid">
          <div class="metric-box">
            <div class="metric-label">Current Temp</div>
            <div class="metric-value" id="summaryTemp">--°C</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Current Humidity</div>
            <div class="metric-value" id="summaryHumidity">--%</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Current Wind</div>
            <div class="metric-value" id="summaryWind">-- km/h</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Current Pressure</div>
            <div class="metric-value" id="summaryPressure">-- hPa</div>
          </div>
        </div>
      </div>
    </div>

    <div class="charts">
      <div class="chart-card">
        <div class="chart-title">Temperature · Last 1 Hour</div>
        <canvas id="tempChart"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-title">Humidity · Last 1 Hour</div>
        <canvas id="humidityChart"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-title">Wind Speed · Last 1 Hour</div>
        <canvas id="windChart"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-title">Pressure · Last 1 Hour</div>
        <canvas id="pressureChart"></canvas>
      </div>
    </div>
  </div>

  <script>
    let tempChart, humidityChart, windChart, pressureChart;

    function makeChart(canvasId, label, color, labels, data) {
      return new Chart(document.getElementById(canvasId), {
        type: "line",
        data: {
          labels,
          datasets: [{
            label,
            data,
            borderColor: color,
            backgroundColor: color,
            tension: 0.35,
            spanGaps: true,
            pointRadius: 2,
            pointHoverRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: {
              labels: { color: "#ffffff" }
            }
          },
          scales: {
            x: {
              ticks: { color: "rgba(255,255,255,0.7)" },
              grid: { color: "rgba(255,255,255,0.08)" }
            },
            y: {
              ticks: { color: "rgba(255,255,255,0.7)" },
              grid: { color: "rgba(255,255,255,0.08)" }
            }
          }
        }
      });
    }

    function updateOrCreateChart(chartRef, canvasId, label, color, labels, data) {
      if (!chartRef) {
        return makeChart(canvasId, label, color, labels, data);
      }
      chartRef.data.labels = labels;
      chartRef.data.datasets[0].data = data;
      chartRef.update("none");
      return chartRef;
    }

    function setText(id, value) {
      document.getElementById(id).textContent = value;
    }

    async function loadWeather() {
      try {
        setText("status", "Refreshing…");

        const res = await fetch("/api/weather?t=" + Date.now());
        const payload = await res.json();

        if (!res.ok || payload.error) {
          throw new Error(payload.error || "Failed to load weather");
        }

        const c = payload.current;
        const g = payload.chart;

        setText("location", c.location || "Your Station");
        setText("temp", \`\${c.temp ?? "--"}°C\`);
        setText("feels", \`Feels like \${c.feelsLike ?? "--"}°\`);

        setText("humidity", \`\${c.humidity ?? "--"}%\`);
        setText("dewpt", \`\${c.dewpt ?? "--"}°C\`);
        setText("wind", \`\${c.wind ?? "--"} km/h\`);
        setText("windGust", \`\${c.windGust ?? "--"} km/h\`);
        setText("windDir", \`\${c.windDir ?? "--"}°\`);
        setText("pressure", \`\${c.pressure ?? "--"} hPa\`);
        setText("precipRate", \`\${c.precipRate ?? "--"} mm\`);
        setText("precipTotal", \`\${c.precipTotal ?? "--"} mm\`);
        setText("uv", c.uv ?? "--");
        setText("solar", c.solar ?? "--");
        setText("updated", \`Updated: \${c.updated ?? "--"}\`);

        setText("summaryTemp", \`\${c.temp ?? "--"}°C\`);
        setText("summaryHumidity", \`\${c.humidity ?? "--"}%\`);
        setText("summaryWind", \`\${c.wind ?? "--"} km/h\`);
        setText("summaryPressure", \`\${c.pressure ?? "--"} hPa\`);

        tempChart = updateOrCreateChart(
          tempChart, "tempChart", "Temperature (°C)", "#ff453a", g.labels, g.temperature
        );
        humidityChart = updateOrCreateChart(
          humidityChart, "humidityChart", "Humidity (%)", "#0a84ff", g.labels, g.humidity
        );
        windChart = updateOrCreateChart(
          windChart, "windChart", "Wind (km/h)", "#30d158", g.labels, g.windSpeed
        );
        pressureChart = updateOrCreateChart(
          pressureChart, "pressureChart", "Pressure (hPa)", "#ffd60a", g.labels, g.pressure
        );

        setText("status", "Live • updates every 10 seconds");
      } catch (err) {
        console.error(err);
        setText("status", "Failed to refresh data");
      }
    }

    loadWeather();
    setInterval(loadWeather, 10000);
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});