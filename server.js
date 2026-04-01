import express from "express";
import fetch from "node-fetch";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 8080;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const API_KEY = process.env.API_KEY;
const STATION_ID = process.env.STATION_ID;

// Create table if not exists
await pool.query(`
  CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temp FLOAT,
    humidity FLOAT,
    wind FLOAT,
    pressure FLOAT
  );
`);

// Function to fetch + store data
async function fetchAndStore() {
  try {
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    const obs = data.observations[0].metric;

    await pool.query(
      `INSERT INTO weather_data (temp, humidity, wind, pressure)
       VALUES ($1, $2, $3, $4)`,
      [
        obs.temp,
        data.observations[0].humidity,
        obs.windSpeed,
        obs.pressure,
      ]
    );

    console.log("Saved weather data");
  } catch (err) {
    console.error("Error:", err);
  }
}

// Run every 10 seconds
setInterval(fetchAndStore, 10000);

// Route to get history
app.get("/history", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM weather_data ORDER BY time DESC LIMIT 1000"
  );
  res.json(result.rows);
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});