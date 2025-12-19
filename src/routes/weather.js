const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');

// Get current weather and forecast
router.post('/forecast', async (req, res) => {
  try {
    const { location } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'Location data required' });
    }

    const result = await weatherService.getWeatherForecast(location);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get seasonal analysis
router.post('/seasonal', async (req, res) => {
  try {
    const { location, cropType } = req.body;
    
    const result = await weatherService.getSeasonalAnalysis(location, cropType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical weather patterns
router.post('/historical', async (req, res) => {
  try {
    const { location, years } = req.body;
    
    const result = await weatherService.getHistoricalData(location, years || 5);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;