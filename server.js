const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});