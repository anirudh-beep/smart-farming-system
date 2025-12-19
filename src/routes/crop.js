const express = require('express');
const router = express.Router();
const cropService = require('../services/cropService');

// Get crop recommendations
router.post('/recommend', async (req, res) => {
  try {
    const { location, soilData, weatherData, userPreferences } = req.body;
    
    if (!location || !soilData) {
      return res.status(400).json({ error: 'Location and soil data required' });
    }

    const result = await cropService.recommendCrops(location, soilData, weatherData, userPreferences);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fertilizer recommendations
router.post('/fertilizer', async (req, res) => {
  try {
    const { cropType, soilData, budget } = req.body;
    
    const result = await cropService.getFertilizerRecommendations(cropType, soilData, budget);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add custom crop
router.post('/custom', async (req, res) => {
  try {
    const { cropName, cropDetails } = req.body;
    
    const result = await cropService.addCustomCrop(cropName, cropDetails);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get crop database
router.get('/database', (req, res) => {
  const crops = cropService.getCropDatabase();
  res.json(crops);
});

// Get AI-powered insights
router.post('/ai-insights', async (req, res) => {
  try {
    const { location, soilData, weatherData, cropType } = req.body;
    
    const result = await cropService.getAIInsights(location, soilData, weatherData, cropType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;