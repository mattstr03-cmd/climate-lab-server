import express from "express";

const app = express();

const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";
const PORT = process.env.PORT || 8080;

function safe(v, d = "--") {
  return v ?? d;
}

app.get("/api/weather", async (req, res) => {
  try {
    const url = `https://api.weather.com/v2/pws/observations/all/1day?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;
    const r = await fetch(url);
    const data = await r.json();

    res.json(data.observations);
  } catch (err) {
    res.status(500).json({ error: "Failed to load" });
  }
});

app.get("/weather", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Climate Lab</title>

<style>
body {
  margin:0;
  font-family:-apple-system;
  background:linear-gradient(#0f172a,#1e293b);
  color:white;
  padding:20px;
}

.card {
  max-width:420px;
  margin:auto;
  background:rgba(255,255,255,0.08);
  backdrop-filter:blur(20px);
  border-radius:25px;
  padding:20px;
}

.title {
  text-align:center;
  font-size:22px;
}

.temp {
  text-align:center;
  font-size:60px;
  margin:10px 0;
}

.grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}

.box {
  background:rgba(255,255,255,0.05);
  padding:10px;
  border-radius:12px;
  font-size:14px;
}

.slider-wrap {
  margin-top:20px;
  text-align:center;
}

input[type=range] {
  width:100%;
}

.time-label {
  font-size:13px;
  opacity:0.7;
  margin-top:5px;
}

.updated {
  text-align:center;
  font-size:12px;
  opacity:0.6;
  margin-top:10px;
}
</style>
</head>

<body>

<div class="card">
  <div class="title">🌦 Climate Lab</div>
  <div class="temp" id="temp">--°C</div>

  <div class="grid">
    <div class="box">Humidity: <b id="humidity">--</b>%</div>
    <div class="box">Dew Point: <b id="dewpt">--</b>°C</div>

    <div class="box">Wind: <b id="wind">--</b> km/h</div>
    <div class="box">Gust: <b id="gust">--</b> km/h</div>

    <div class="box">Direction: <b id="dir">--</b>°</div>
    <div class="box">Pressure: <b id="pressure">--</b> hPa</div>

    <div class="box">Rain Rate: <b id="rainRate">--</b></div>
    <div class="box">Rain Total: <b id="rainTotal">--</b></div>

    <div class="box">UV: <b id="uv">--</b></div>
    <div class="box">Solar: <b id="solar">--</b></div>
  </div>

  <div class="slider-wrap">
    <input type="range" min="0" max="24" value="0" id="slider">
    <div class="time-label" id="timeLabel">Now</div>
  </div>

  <div class="updated" id="updated">Updated: --</div>
</div>

<script>
let allData = [];

function set(id, val){
  document.getElementById(id).innerText = val ?? "--";
}

function updateDisplay(index){
  const obs = allData[index];
  if(!obs) return;

  const m = obs.metric;

  set("temp", m.temp + "°C");
  set("humidity", obs.humidity);
  set("dewpt", m.dewpt);
  set("wind", m.windSpeed);
  set("gust", m.windGust);
  set("dir", obs.winddir);
  set("pressure", m.pressure);
  set("rainRate", m.precipRate);
  set("rainTotal", m.precipTotal);
  set("uv", obs.uv);
  set("solar", obs.solarRadiation);

  set("updated", "Updated: " + obs.obsTimeLocal);
}

async function load(){
  const res = await fetch("/api/weather");
  const data = await res.json();

  // newest last
  allData = data;

  updateDisplay(allData.length - 1);
}

document.getElementById("slider").addEventListener("input", (e)=>{
  const hoursAgo = parseInt(e.target.value);

  const nowIndex = allData.length - 1;

  // approx: 1 reading every ~5 min → 12 per hour
  const offset = hoursAgo * 12;

  const index = Math.max(0, nowIndex - offset);

  updateDisplay(index);

  document.getElementById("timeLabel").innerText =
    hoursAgo === 0 ? "Now" : hoursAgo + " hour(s) ago";
});

// auto refresh latest data
setInterval(load, 10000);

load();
</script>

</body>
</html>
`);
});

app.listen(PORT, () => {
  console.log("Running on " + PORT);
});