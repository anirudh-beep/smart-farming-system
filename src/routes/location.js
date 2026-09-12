const express = require('express');
const router = express.Router();
const locationService = require('../services/locationService');

// Get location from GPS coordinates
router.post('/detect', async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const result = await locationService.detectLocation(latitude, longitude, accuracy);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual location selection
router.post('/manual', async (req, res) => {
  try {
    const { country, state, district, village } = req.body;
    
    if (!district) {
      return res.status(400).json({ error: 'District is required' });
    }

    const result = await locationService.manualLocation(country, state, district, village);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available locations
router.get('/regions', (req, res) => {
  const regions = locationService.getAvailableRegions();
  res.json(regions);
});

module.exports = router;