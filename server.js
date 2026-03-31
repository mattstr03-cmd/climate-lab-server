const express = require('express')
const app = express()

let latestData = {
    tempC: 24.8,
    humidity: 57,
    windSpeedKPH: 0,
    pressure: 1032,
    windDir: "WNW"
}

app.get('/weather', (req, res) => {
    res.json(latestData)
})

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000')
})