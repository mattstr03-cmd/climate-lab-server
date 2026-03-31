import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

const API_KEY = "c9a45997f96d49c2a45997f96d29c22c";
const STATION_ID = "ISYDNE4503";

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.get("/weather", async (req, res) => {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    const obs = data.observations[0];

    res.json({
      temperature: obs.metric.tempAvg,
      humidity: obs.humidityAvg,
      windSpeed: obs.metric.windspeedAvg,
      time: obs.obsTimeLocal
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Weather fetch failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});