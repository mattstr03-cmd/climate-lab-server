const express = require("express");

const app = express();

// 🚨 IMPORTANT: use Railway port ONLY
const PORT = process.env.PORT;

// Root route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Weather route
app.get("/weather", (req, res) => {
  res.json({
    status: "working",
    message: "API is alive",
    data: {
      temperature: 25,
      humidity: 60,
      windSpeed: 10
    }
  });
});

// Bind properly
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});