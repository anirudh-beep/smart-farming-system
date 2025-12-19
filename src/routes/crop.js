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

// AI Chatbot endpoint
router.post('/ai-chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log('Chatbot request:', { message, context: context ? 'present' : 'none' });
    const result = await cropService.getChatbotResponse(message, context);
    console.log('Chatbot response:', result);
    res.json(result);
  } catch (error) {
    console.error('Chatbot route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test Gemini API endpoint
router.get('/test-gemini', async (req, res) => {
  try {
    const testResult = await cropService.getChatbotResponse('Hello, can you help me with farming?', {});
    res.json({ 
      success: true, 
      message: 'Gemini API test completed',
      result: testResult 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Gemini API test failed'
    });
  }
});

module.exports = router;