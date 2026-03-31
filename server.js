const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "working",
    message: "API is alive"
  });
});

// TEMP TEST ROUTE (no API yet)
app.get("/weather", (req, res) => {
  res.json({
    temperature: 22.5,
    humidity: 60,
    source: "test"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});