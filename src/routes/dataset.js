const express = require('express');
const router = express.Router();
const datasetService = require('../services/datasetService');

// Get dataset statistics
router.get('/stats', (req, res) => {
  try {
    const stats = datasetService.getDatasetStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available locations from dataset
router.get('/locations', (req, res) => {
  try {
    const locations = datasetService.getAvailableLocations();
    res.json({
      success: true,
      locations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get seasonal insights for a location
router.post('/seasonal-insights', (req, res) => {
  try {
    const { state, district } = req.body;
    
    if (!state || !district) {
      return res.status(400).json({ error: 'State and district required' });
    }
    
    const insights = datasetService.getSeasonalInsights(state, district);
    
    if (!insights) {
      return res.status(404).json({ error: 'No data found for this location' });
    }
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search for similar conditions
router.post('/similar-conditions', (req, res) => {
  try {
    const { soilData, weatherData } = req.body;
    
    if (!soilData || !weatherData) {
      return res.status(400).json({ error: 'Soil and weather data required' });
    }
    
    const similarLocations = datasetService.searchSimilarConditions(soilData, weatherData);
    
    res.json({
      success: true,
      similarLocations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;