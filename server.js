import express from "express";

const app = express();

const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";
const PORT = process.env.PORT || 8080;

function safe(v, fallback = "--") {
  return v !== undefined && v !== null ? v : fallback;
}

// API ROUTE
app.get("/api/weather", async (req, res) => {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    const obs = data.observations[0];
    const m = obs.metric;

    res.json({
      location: obs.neighborhood || "Your Station",
      updated: obs.obsTimeLocal,

      temp: m.temp,
      feelsLike: m.heatIndex,

      humidity: obs.humidity,
      dewpt: m.dewpt,

      wind: m.windSpeed,
      windGust: m.windGust,
      windDir: obs.winddir,

      pressure: m.pressure,

      precipRate: m.precipRate,
      precipTotal: m.precipTotal,

      uv: obs.uv,
      solar: obs.solarRadiation
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to load weather" });
  }
});

// ROOT
app.get("/", (req, res) => {
  res.send('Climate Lab running 🚀 <a href="/weather">Open Dashboard</a>');
});

// UI PAGE
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
  display: flex;
  justify-content: center;
  padding: 20px;
}

.card {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(20px);
  padding: 25px;
  border-radius: 30px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.4);
}

.title {
  text-align: center;
  font-size: 22px;
  font-weight: 600;
}

.location {
  text-align: center;
  opacity: 0.7;
  font-size: 13px;
}

.temp {
  text-align: center;
  font-size: 70px;
  margin: 15px 0 5px;
}

.feels {
  text-align: center;
  opacity: 0.8;
  margin-bottom: 20px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.box {
  background: rgba(255,255,255,0.05);
  padding: 12px;
  border-radius: 16px;
}

.label {
  font-size: 12px;
  opacity: 0.6;
}

.value {
  font-size: 18px;
  font-weight: 600;
}

.updated {
  text-align: center;
  margin-top: 15px;
  font-size: 12px;
  opacity: 0.6;
}
</style>
</head>

<body>

<div class="card">
  <div class="title">🌦 Climate Lab</div>
  <div class="location" id="location">--</div>

  <div class="temp" id="temp">--°C</div>
  <div class="feels" id="feels">Feels like --°</div>

  <div class="grid">
    <div class="box"><div class="label">Humidity</div><div class="value" id="humidity">--%</div></div>
    <div class="box"><div class="label">Dew Point</div><div class="value" id="dewpt">--°C</div></div>

    <div class="box"><div class="label">Wind</div><div class="value" id="wind">-- km/h</div></div>
    <div class="box"><div class="label">Wind Gust</div><div class="value" id="windGust">-- km/h</div></div>

    <div class="box"><div class="label">Direction</div><div class="value" id="windDir">--°</div></div>
    <div class="box"><div class="label">Pressure</div><div class="value" id="pressure">-- hPa</div></div>

    <div class="box"><div class="label">Rain Rate</div><div class="value" id="rainRate">-- mm</div></div>
    <div class="box"><div class="label">Rain Total</div><div class="value" id="rainTotal">-- mm</div></div>

    <div class="box"><div class="label">UV</div><div class="value" id="uv">--</div></div>
    <div class="box"><div class="label">Solar</div><div class="value" id="solar">--</div></div>
  </div>

  <div class="updated" id="updated">Updated: --</div>
</div>

<script>
async function updateWeather() {
  try {
    const res = await fetch("/api/weather?t=" + Date.now());
    const data = await res.json();

    document.getElementById("location").textContent = data.location;
    document.getElementById("temp").textContent = data.temp + "°C";
    document.getElementById("feels").textContent = "Feels like " + (data.feelsLike ?? "--") + "°";

    document.getElementById("humidity").textContent = (data.humidity ?? "--") + "%";
    document.getElementById("dewpt").textContent = (data.dewpt ?? "--") + "°C";

    document.getElementById("wind").textContent = (data.wind ?? "--") + " km/h";
    document.getElementById("windGust").textContent = (data.windGust ?? "--") + " km/h";
    document.getElementById("windDir").textContent = (data.windDir ?? "--") + "°";

    document.getElementById("pressure").textContent = (data.pressure ?? "--") + " hPa";

    document.getElementById("rainRate").textContent = (data.precipRate ?? "--") + " mm";
    document.getElementById("rainTotal").textContent = (data.precipTotal ?? "--") + " mm";

    document.getElementById("uv").textContent = data.uv ?? "--";
    document.getElementById("solar").textContent = data.solar ?? "--";

    document.getElementById("updated").textContent = "Updated: " + data.updated;

  } catch (err) {
    console.error(err);
  }
}

updateWeather();
setInterval(updateWeather, 10000);
</script>

</body>
</html>
  `);
});

app.listen(PORT, () => console.log("Running on " + PORT));