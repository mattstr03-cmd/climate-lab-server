import express from "express";

const app = express();

// 🔑 YOUR DETAILS
const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";

// 🌦 WEATHER ROUTE
app.get("/weather", async (req, res) => {
  try {
    const currentUrl = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;
    const historyUrl = `https://api.weather.com/v2/pws/observations/all/1day?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const currentRes = await fetch(currentUrl);
    const historyRes = await fetch(historyUrl);

    const currentData = await currentRes.json();
    const historyData = await historyRes.json();

    const obs = currentData.observations[0];
    const m = obs.metric;

    // 🟢 CURRENT DATA
    const data = {
      temp: m.temp,
      feelsLike: m.heatIndex,
      humidity: obs.humidity,
      wind: m.windSpeed,
      windGust: m.windGust,
      windDir: obs.winddir,
      pressure: m.pressure,
      dewpt: m.dewpt,
      precipRate: m.precipRate,
      precipTotal: m.precipTotal,
      uv: obs.uv,
      solar: obs.solarRadiation,
      updated: obs.obsTimeLocal
    };

    // 📊 LAST 1 HOUR DATA
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const history = historyData.observations.filter(o => {
      return new Date(o.obsTimeLocal).getTime() >= oneHourAgo;
    });

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
<meta http-equiv="refresh" content="10">

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

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
  margin-bottom: 20px;
}

.title {
  text-align: center;
  font-size: 20px;
}

.temp {
  text-align: center;
  font-size: 60px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  font-size: 14px;
  margin-top: 10px;
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

<div class="card">
  <div class="title">🌦 Climate Lab</div>
  <div class="temp">${data.temp}°C</div>

  <div style="text-align:center;font-size:14px;">
    Feels like ${data.feelsLike ?? "--"}°
  </div>

  <div class="grid">
    <div>Humidity: ${data.humidity}%</div>
    <div>Dew Point: ${data.dewpt}°C</div>

    <div>Wind: ${data.wind} km/h</div>
    <div>Gust: ${data.windGust ?? 0} km/h</div>

    <div>Direction: ${data.windDir}°</div>
    <div>Pressure: ${data.pressure} hPa</div>

    <div>Rain Rate: ${data.precipRate} mm</div>
    <div>Rain Total: ${data.precipTotal} mm</div>

    <div>UV: ${data.uv ?? "--"}</div>
    <div>Solar: ${data.solar ?? "--"}</div>
  </div>

  <div style="text-align:center;margin-top:10px;font-size:12px;opacity:0.7;">
    Updated: ${data.updated}
  </div>
</div>

<div class="graph"><canvas id="tempChart"></canvas></div>
<div class="graph"><canvas id="humidityChart"></canvas></div>
<div class="graph"><canvas id="windChart"></canvas></div>
<div class="graph"><canvas id="pressureChart"></canvas></div>

<script>
const labels = ${JSON.stringify(times)};

new Chart(tempChart, {
  type: 'line',
  data: {
    labels,
    datasets: [{
      label: 'Temp (°C)',
      data: ${JSON.stringify(temps)},
      borderColor: '#ff3b30',
      tension: 0.4
    }]
  }
});

new Chart(humidityChart, {
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

new Chart(windChart, {
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

new Chart(pressureChart, {
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
app.listen(PORT, () => console.log("Running on " + PORT));