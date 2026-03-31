const express = require("express");

const app = express();

// ✅ Railway uses this port automatically
const PORT = process.env.PORT || 8080;

// Root route (IMPORTANT for Railway)
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

// ✅ CRITICAL: bind to 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});