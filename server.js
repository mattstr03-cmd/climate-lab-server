import express from "express";

const app = express();

// 🔥 THIS IS THE KEY FIX
const PORT = process.env.PORT;

// Root route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Weather route (safe test)
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

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});