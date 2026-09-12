const express = require('express');
const router = express.Router();
const soilService = require('../services/soilService');

// Get soil analysis for location
router.post('/analyze', async (req, res) => {
  try {
    const { location, userSoilData } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'Location data required' });
    }

    const result = await soilService.analyzeSoil(location, userSoilData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update soil data with user input
router.post('/update', async (req, res) => {
  try {
    const { location, soilData } = req.body;
    
    const result = await soilService.updateSoilData(location, soilData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get soil types reference
router.get('/types', (req, res) => {
  const soilTypes = soilService.getSoilTypes();
  res.json(soilTypes);
});

module.exports = router;