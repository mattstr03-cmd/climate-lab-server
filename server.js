import express from "express";

const app = express();

const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";
const PORT = process.env.PORT || 8080;

// 🔌 API route
app.get("/api/weather", async (req, res) => {
  try {
    const historyUrl = `https://api.weather.com/v2/pws/observations/all/1day?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;
    const response = await fetch(historyUrl);
    const data = await response.json();

    const observations = data.observations;

    res.json(observations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

// 🌐 UI
app.get("/weather", (req, res) => {
  res.send(`
<html>
<head>
<title>Climate Lab</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
body {
  margin: 0;
  font-family: -apple-system;
  background: linear-gradient(to bottom, #0f172a, #1e293b);
  color: white;
  padding: 20px;
}

.card {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(20px);
  padding: 25px;
  border-radius: 25px;
  max-width: 420px;
  margin: auto;
}

.title {
  text-align: center;
  font-size: 20px;
}

.temp {
  text-align: center;
  font-size: 60px;
  margin: 10px 0;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  font-size: 14px;
}

.slider {
  width: 100%;
  margin-top: 20px;
}

.time-label {
  text-align: center;
  margin-top: 10px;
  opacity: 0.7;
}
</style>
</head>

<body>

<div class="card">
  <div class="title">🌦 Climate Lab</div>

  <div class="temp" id="temp">--°C</div>

  <div class="grid">
    <div>Humidity: <span id="humidity"></span>%</div>
    <div>Dew: <span id="dew"></span>°C</div>

    <div>Wind: <span id="wind"></span> km/h</div>
    <div>Gust: <span id="gust"></span> km/h</div>

    <div>Direction: <span id="dir"></span>°</div>
    <div>Pressure: <span id="pressure"></span> hPa</div>

    <div>Rain Rate: <span id="rainRate"></span></div>
    <div>Rain Total: <span id="rainTotal"></span></div>

    <div>UV: <span id="uv"></span></div>
    <div>Solar: <span id="solar"></span></div>
  </div>

  <input type="range" min="0" max="100" value="100" class="slider" id="slider">
  <div class="time-label" id="timeLabel">Now</div>
</div>

<script>
let data = [];

// 🔄 Load data
async function load() {
  const res = await fetch("/api/weather");
  data = await res.json();

  updateDisplay(data.length - 1); // latest
}

// 🎚 Slider logic
document.getElementById("slider").addEventListener("input", (e) => {
  const percent = e.target.value / 100;

  const index = Math.floor(percent * (data.length - 1));
  updateDisplay(index);
});

function updateDisplay(i) {
  const obs = data[i];
  const m = obs.metric;

  document.getElementById("temp").textContent = m.temp + "°C";
  document.getElementById("humidity").textContent = obs.humidity;
  document.getElementById("dew").textContent = m.dewpt;

  document.getElementById("wind").textContent = m.windSpeed;
  document.getElementById("gust").textContent = m.windGust || 0;

  document.getElementById("dir").textContent = obs.winddir;
  document.getElementById("pressure").textContent = m.pressure;

  document.getElementById("rainRate").textContent = m.precipRate;
  document.getElementById("rainTotal").textContent = m.precipTotal;

  document.getElementById("uv").textContent = obs.uv ?? "--";
  document.getElementById("solar").textContent = obs.solarRadiation ?? "--";

  document.getElementById("timeLabel").textContent = obs.obsTimeLocal;
}

// ⚡ auto refresh data every 10s (keeps slider working)
setInterval(load, 10000);

load();
</script>

</body>
</html>
  `);
});

// 🚀 Start
app.listen(PORT, () => console.log("Running on " + PORT));