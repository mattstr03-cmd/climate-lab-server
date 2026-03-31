import express from "express";

const app = express();

// IMPORTANT: Railway uses dynamic ports
const PORT = process.env.PORT || 3000;

// Root route (just to confirm server is alive)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Weather route (test data for now)
app.get("/weather", (req, res) => {
  res.json({
    status: "working",
    message: "API is alive",
    data: {
      temperature: 25,
      humidity: 60,
      windSpeed: 10,
      source: "test data (not live yet)"
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});