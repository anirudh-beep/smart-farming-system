const axios = require('axios');
const datasetService = require('./datasetService');
require('dotenv').config();

class CropService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    console.log('🤖 CropService initialized with Gemini API key:', this.geminiApiKey ? '✅ Present' : '❌ Missing');
    
    // Enhanced crop database with 22 crops from dataset
    this.cropDatabase = {
      // CEREALS & FOOD GRAINS
      'Rice': {
        soilTypes: ['Black Cotton Soil', 'Alluvial Soil', 'Clay Soil'],
        phRange: [5.5, 7.0],
        temperature: [20, 35],
        rainfall: [100, 300],
        growthDuration: 120,
        waterNeeds: 'High',
        yield: '4-6 tons/hectare',
        marketPrice: 2500,
        profitability: 'Medium',
        category: 'cereal',
        season: 'Kharif'
      },
      'Maize': {
        soilTypes: ['Alluvial Soil', 'Red Laterite Soil', 'Black Cotton Soil'],
        phRange: [6.0, 7.0],
        temperature: [18, 32],
        rainfall: [60, 120],
        growthDuration: 90,
        waterNeeds: 'Medium',
        yield: '5-8 tons/hectare',
        marketPrice: 2000,
        profitability: 'Medium',
        category: 'cereal',
        season: 'Kharif/Rabi'
      },
      
      // CASH CROPS
      'Cotton': {
        soilTypes: ['Black Cotton Soil'],
        phRange: [5.8, 8.0],
        temperature: [15, 35],
        rainfall: [50, 100],
        growthDuration: 180,
        waterNeeds: 'Medium',
        yield: '1.5-2.5 tons/hectare',
        marketPrice: 6000,
        profitability: 'High',
        category: 'cash',
        season: 'Kharif'
      },
      'Jute': {
        soilTypes: ['Alluvial Soil', 'Clay Soil'],
        phRange: [6.0, 7.5],
        temperature: [25, 35],
        rainfall: [120, 200],
        growthDuration: 120,
        waterNeeds: 'High',
        yield: '2.5-3.5 tons/hectare',
        marketPrice: 3500,
        profitability: 'Medium',
        category: 'cash',
        season: 'Kharif'
      },
      'Coffee': {
        soilTypes: ['Red Laterite Soil', 'Loamy Soil'],
        phRange: [6.0, 7.0],
        temperature: [15, 25],
        rainfall: [150, 250],
        growthDuration: 240,
        waterNeeds: 'Medium',
        yield: '1.5-2.5 tons/hectare',
        marketPrice: 25000,
        profitability: 'Very High',
        category: 'cash',
        season: 'Perennial'
      },
      
      // PULSES & LEGUMES
      'Chickpea': {
        soilTypes: ['Black Cotton Soil', 'Alluvial Soil'],
        phRange: [6.0, 7.5],
        temperature: [15, 25],
        rainfall: [60, 90],
        growthDuration: 100,
        waterNeeds: 'Low',
        yield: '1.5-2.5 tons/hectare',
        marketPrice: 5000,
        profitability: 'High',
        category: 'pulse',
        season: 'Rabi'
      },
      'Kidneybeans': {
        soilTypes: ['Loamy Soil', 'Alluvial Soil'],
        phRange: [5.5, 6.5],
        temperature: [15, 25],
        rainfall: [60, 150],
        growthDuration: 90,
        waterNeeds: 'Medium',
        yield: '1-2 tons/hectare',
        marketPrice: 10000,
        profitability: 'Very High',
        category: 'pulse',
        season: 'Rabi'
      },
      'Pigeonpeas': {
        soilTypes: ['Red Laterite Soil', 'Black Cotton Soil'],
        phRange: [5.5, 7.0],
        temperature: [20, 35],
        rainfall: [90, 200],
        growthDuration: 150,
        waterNeeds: 'Medium',
        yield: '1.5-2 tons/hectare',
        marketPrice: 6000,
        profitability: 'High',
        category: 'pulse',
        season: 'Kharif'
      },
      'Mothbeans': {
        soilTypes: ['Sandy Soil', 'Red Laterite Soil'],
        phRange: [6.0, 7.5],
        temperature: [25, 35],
        rainfall: [40, 80],
        growthDuration: 75,
        waterNeeds: 'Low',
        yield: '0.8-1.2 tons/hectare',
        marketPrice: 4500,
        profitability: 'Medium',
        category: 'pulse',
        season: 'Kharif'
      },
      'Mungbean': {
        soilTypes: ['Loamy Soil', 'Alluvial Soil'],
        phRange: [6.0, 7.5],
        temperature: [25, 35],
        rainfall: [60, 100],
        growthDuration: 70,
        waterNeeds: 'Medium',
        yield: '1-1.5 tons/hectare',
        marketPrice: 7500,
        profitability: 'High',
        category: 'pulse',
        season: 'Kharif/Summer'
      },
      'Blackgram': {
        soilTypes: ['Red Laterite Soil', 'Alluvial Soil'],
        phRange: [6.0, 7.0],
        temperature: [25, 35],
        rainfall: [60, 100],
        growthDuration: 80,
        waterNeeds: 'Medium',
        yield: '1-1.5 tons/hectare',
        marketPrice: 7000,
        profitability: 'High',
        category: 'pulse',
        season: 'Kharif/Rabi'
      },
      'Lentil': {
        soilTypes: ['Loamy Soil', 'Alluvial Soil'],
        phRange: [6.0, 7.5],
        temperature: [15, 25],
        rainfall: [50, 80],
        growthDuration: 100,
        waterNeeds: 'Low',
        yield: '1.2-1.8 tons/hectare',
        marketPrice: 6500,
        profitability: 'High',
        category: 'pulse',
        season: 'Rabi'
      },
      
      // FRUITS & HORTICULTURE
      'Apple': {
        soilTypes: ['Loamy Soil', 'Well-drained Soil'],
        phRange: [6.0, 7.0],
        temperature: [8, 25],
        rainfall: [100, 150],
        growthDuration: 365,
        waterNeeds: 'Medium',
        yield: '15-25 tons/hectare',
        marketPrice: 10000,
        profitability: 'Very High',
        category: 'fruit',
        season: 'Perennial'
      },
      'Banana': {
        soilTypes: ['Alluvial Soil', 'Loamy Soil'],
        phRange: [6.0, 7.5],
        temperature: [25, 35],
        rainfall: [120, 200],
        growthDuration: 365,
        waterNeeds: 'High',
        yield: '40-60 tons/hectare',
        marketPrice: 3000,
        profitability: 'High',
        category: 'fruit',
        season: 'Year-round'
      },
      'Grapes': {
        soilTypes: ['Black Cotton Soil', 'Red Laterite Soil'],
        phRange: [6.5, 7.5],
        temperature: [15, 30],
        rainfall: [50, 100],
        growthDuration: 240,
        waterNeeds: 'Medium',
        yield: '20-30 tons/hectare',
        marketPrice: 8000,
        profitability: 'Very High',
        category: 'fruit',
        season: 'Perennial'
      },
      'Mango': {
        soilTypes: ['Alluvial Soil', 'Red Laterite Soil'],
        phRange: [6.0, 7.5],
        temperature: [25, 35],
        rainfall: [75, 150],
        growthDuration: 365,
        waterNeeds: 'Medium',
        yield: '10-15 tons/hectare',
        marketPrice: 6000,
        profitability: 'High',
        category: 'fruit',
        season: 'Perennial'
      },
      'Orange': {
        soilTypes: ['Loamy Soil', 'Alluvial Soil'],
        phRange: [6.0, 7.5],
        temperature: [15, 30],
        rainfall: [100, 150],
        growthDuration: 365,
        waterNeeds: 'Medium',
        yield: '20-30 tons/hectare',
        marketPrice: 4000,
        profitability: 'High',
        category: 'fruit',
        season: 'Perennial'
      },
      'Papaya': {
        soilTypes: ['Loamy Soil', 'Alluvial Soil'],
        phRange: [6.0, 7.0],
        temperature: [25, 35],
        rainfall: [100, 200],
        growthDuration: 365,
        waterNeeds: 'High',
        yield: '50-80 tons/hectare',
        marketPrice: 2000,
        profitability: 'Medium',
        category: 'fruit',
        season: 'Year-round'
      },
      'Pomegranate': {
        soilTypes: ['Red Laterite Soil', 'Black Cotton Soil'],
        phRange: [6.5, 7.5],
        temperature: [15, 35],
        rainfall: [50, 100],
        growthDuration: 240,
        waterNeeds: 'Medium',
        yield: '15-25 tons/hectare',
        marketPrice: 10000,
        profitability: 'Very High',
        category: 'fruit',
        season: 'Perennial'
      },
      'Watermelon': {
        soilTypes: ['Sandy Soil', 'Loamy Soil'],
        phRange: [6.0, 7.0],
        temperature: [25, 35],
        rainfall: [50, 100],
        growthDuration: 90,
        waterNeeds: 'High',
        yield: '25-35 tons/hectare',
        marketPrice: 1200,
        profitability: 'Medium',
        category: 'fruit',
        season: 'Summer'
      },
      'Muskmelon': {
        soilTypes: ['Sandy Soil', 'Loamy Soil'],
        phRange: [6.0, 7.0],
        temperature: [25, 35],
        rainfall: [40, 80],
        growthDuration: 100,
        waterNeeds: 'Medium',
        yield: '15-25 tons/hectare',
        marketPrice: 2000,
        profitability: 'Medium',
        category: 'fruit',
        season: 'Summer'
      },
      'Coconut': {
        soilTypes: ['Sandy Soil', 'Alluvial Soil'],
        phRange: [5.5, 7.0],
        temperature: [25, 35],
        rainfall: [120, 200],
        growthDuration: 365,
        waterNeeds: 'High',
        yield: '12,000-15,000 nuts/hectare',
        marketPrice: 2000,
        profitability: 'High',
        category: 'fruit',
        season: 'Perennial'
      },
      
      // LEGACY CROPS (keeping for compatibility)
      'Wheat': {
        soilTypes: ['Alluvial Soil', 'Black Cotton Soil'],
        phRange: [6.0, 7.5],
        temperature: [10, 25],
        rainfall: [50, 100],
        growthDuration: 150,
        waterNeeds: 'Medium',
        yield: '3-5 tons/hectare',
        marketPrice: 2200,
        profitability: 'High',
        category: 'cereal',
        season: 'Rabi'
      },
      'Sugarcane': {
        soilTypes: ['Black Cotton Soil', 'Alluvial Soil'],
        phRange: [6.0, 7.5],
        temperature: [20, 40],
        rainfall: [100, 150],
        growthDuration: 365,
        waterNeeds: 'Very High',
        yield: '60-80 tons/hectare',
        marketPrice: 350,
        profitability: 'Medium',
        category: 'cash',
        season: 'Year-round'
      },
      'Groundnut': {
        soilTypes: ['Red Laterite Soil', 'Alluvial Soil'],
        phRange: [6.0, 7.0],
        temperature: [20, 30],
        rainfall: [50, 75],
        growthDuration: 120,
        waterNeeds: 'Low',
        yield: '2-3 tons/hectare',
        marketPrice: 5500,
        profitability: 'High',
        category: 'oilseed',
        season: 'Kharif/Rabi'
      }
    };

    this.fertilizerDatabase = {
      'Urea': { npk: '46-0-0', price: 6, nutrients: ['Nitrogen'] },
      'DAP': { npk: '18-46-0', price: 25, nutrients: ['Nitrogen', 'Phosphorus'] },
      'MOP': { npk: '0-0-60', price: 18, nutrients: ['Potassium'] },
      'NPK Complex': { npk: '10-26-26', price: 22, nutrients: ['Nitrogen', 'Phosphorus', 'Potassium'] },
      'Single Super Phosphate': { npk: '16-20-0', price: 12, nutrients: ['Phosphorus'] },
      'Ammonium Sulfate': { npk: '21-0-0', price: 8, nutrients: ['Nitrogen', 'Sulfur'] }
    };
  }

  async recommendCrops(location, soilData, weatherData, userPreferences = {}) {
    const suitableCrops = [];
    
    for (const [cropName, cropInfo] of Object.entries(this.cropDatabase)) {
      const suitability = this.calculateCropSuitability(cropName, cropInfo, soilData, weatherData);
      
      if (suitability.score > 0.6) {
        suitableCrops.push({
          name: cropName,
          suitability: suitability.score,
          reasons: suitability.reasons,
          warnings: suitability.warnings,
          ...cropInfo,
          expectedProfit: this.calculateExpectedProfit(cropInfo, location)
        });
      }
    }

    // Get additional recommendations from dataset
    const datasetRecommendations = datasetService.getCropRecommendationsFromDataset(soilData, weatherData);
    
    // Merge dataset recommendations with existing ones
    datasetRecommendations.forEach(datasetRec => {
      const existingCrop = suitableCrops.find(crop => crop.name === datasetRec.crop);
      if (existingCrop) {
        // Boost suitability if dataset also recommends it
        existingCrop.suitability = Math.min(1.0, existingCrop.suitability + 0.1);
        existingCrop.reasons.push(`Dataset analysis: ${datasetRec.reason}`);
      } else if (this.cropDatabase[datasetRec.crop]) {
        // Add new recommendation from dataset
        suitableCrops.push({
          name: datasetRec.crop,
          suitability: datasetRec.suitability,
          reasons: [datasetRec.reason],
          warnings: [],
          ...this.cropDatabase[datasetRec.crop],
          expectedProfit: this.calculateExpectedProfit(this.cropDatabase[datasetRec.crop], location),
          datasetRecommended: true
        });
      }
    });

    // Sort by suitability score
    suitableCrops.sort((a, b) => b.suitability - a.suitability);

    // Get similar locations for additional insights
    const similarLocations = datasetService.searchSimilarConditions(soilData, weatherData);

    return {
      success: true,
      location,
      crops: suitableCrops.slice(0, 5), // Top 5 recommendations
      recommendedCrops: suitableCrops.slice(0, 5), // Keep both for compatibility
      similarLocations: similarLocations.slice(0, 3),
      analysis: {
        totalCropsAnalyzed: Object.keys(this.cropDatabase).length,
        suitableCropsFound: suitableCrops.length,
        topRecommendation: suitableCrops[0]?.name || 'None suitable',
        datasetEnhanced: datasetRecommendations.length > 0
      }
    };
  }

  calculateCropSuitability(cropName, cropInfo, soilData, weatherData) {
    let score = 0;
    const reasons = [];
    const warnings = [];
    const maxScore = 5; // 5 factors to check

    // Check soil type compatibility
    if (cropInfo.soilTypes.includes(soilData.type)) {
      score += 1;
      reasons.push(`Suitable for ${soilData.type}`);
    } else {
      warnings.push(`Not optimal for ${soilData.type}`);
    }

    // Check pH range
    if (soilData.ph >= cropInfo.phRange[0] && soilData.ph <= cropInfo.phRange[1]) {
      score += 1;
      reasons.push(`pH ${soilData.ph} is within optimal range`);
    } else {
      warnings.push(`pH ${soilData.ph} is outside optimal range (${cropInfo.phRange[0]}-${cropInfo.phRange[1]})`);
    }

    // Check temperature (if weather data available)
    if (weatherData && weatherData.current) {
      const temp = weatherData.current.temperature;
      if (temp >= cropInfo.temperature[0] && temp <= cropInfo.temperature[1]) {
        score += 1;
        reasons.push(`Current temperature ${temp}°C is suitable`);
      } else {
        warnings.push(`Temperature ${temp}°C may not be optimal`);
      }
    } else {
      score += 0.5; // Partial score if no weather data
    }

    // Check nutrient availability
    const nutrients = [soilData.nitrogen, soilData.phosphorus, soilData.potassium];
    const adequateNutrients = nutrients.filter(n => n === 'Medium' || n === 'High').length;
    if (adequateNutrients >= 2) {
      score += 1;
      reasons.push('Adequate soil nutrients available');
    } else {
      warnings.push('Soil nutrients may need supplementation');
    }

    // Check drainage compatibility
    if (cropName === 'Rice' && soilData.drainage === 'Poor') {
      score += 1;
      reasons.push('Poor drainage suitable for rice cultivation');
    } else if (cropName !== 'Rice' && soilData.drainage !== 'Poor') {
      score += 1;
      reasons.push('Good drainage suitable for crop');
    } else if (cropName !== 'Rice' && soilData.drainage === 'Poor') {
      warnings.push('Poor drainage may affect crop growth');
    }

    return {
      score: score / maxScore,
      reasons,
      warnings
    };
  }

  calculateExpectedProfit(cropInfo, location) {
    const baseProfit = cropInfo.yield.split('-')[0] * cropInfo.marketPrice;
    const costs = baseProfit * 0.6; // Assume 60% of revenue as costs
    return Math.round(baseProfit - costs);
  }

  async getFertilizerRecommendations(cropType, soilData, budget) {
    const recommendations = [];
    const deficiencies = this.identifyNutrientDeficiencies(soilData);
    
    // Standard recommendations
    for (const deficiency of deficiencies) {
      const fertilizers = this.getFertilizersForNutrient(deficiency);
      recommendations.push(...fertilizers);
    }

    // Budget-based alternatives
    if (budget) {
      const budgetAlternatives = this.getBudgetFriendlyAlternatives(recommendations, budget);
      return {
        success: true,
        cropType,
        standardRecommendations: recommendations,
        budgetAlternatives,
        totalEstimatedCost: this.calculateTotalCost(recommendations),
        budgetFriendlyCost: this.calculateTotalCost(budgetAlternatives)
      };
    }

    return {
      success: true,
      cropType,
      recommendations,
      totalEstimatedCost: this.calculateTotalCost(recommendations)
    };
  }

  identifyNutrientDeficiencies(soilData) {
    const deficiencies = [];
    
    if (soilData.nitrogen === 'Low') deficiencies.push('Nitrogen');
    if (soilData.phosphorus === 'Low') deficiencies.push('Phosphorus');
    if (soilData.potassium === 'Low') deficiencies.push('Potassium');
    
    return deficiencies;
  }

  getFertilizersForNutrient(nutrient) {
    const fertilizerOptions = [];
    
    for (const [name, info] of Object.entries(this.fertilizerDatabase)) {
      if (info.nutrients.includes(nutrient)) {
        fertilizerOptions.push({
          name,
          composition: info.npk,
          pricePerKg: info.price,
          applicationRate: '50 kg/hectare', // Simplified
          cost: info.price * 50
        });
      }
    }
    
    return fertilizerOptions.sort((a, b) => a.cost - b.cost);
  }

  getBudgetFriendlyAlternatives(recommendations, budget) {
    const alternatives = [];
    let totalCost = 0;
    
    // Sort by cost and select within budget
    const sortedByPrice = [...recommendations].sort((a, b) => a.cost - b.cost);
    
    for (const fertilizer of sortedByPrice) {
      if (totalCost + fertilizer.cost <= budget) {
        alternatives.push(fertilizer);
        totalCost += fertilizer.cost;
      }
    }
    
    // Add organic alternatives
    alternatives.push({
      name: 'Compost',
      composition: 'Organic',
      pricePerKg: 2,
      applicationRate: '2-3 tons/hectare',
      cost: 2000,
      benefits: 'Improves soil structure and provides slow-release nutrients'
    });
    
    return alternatives;
  }

  calculateTotalCost(recommendations) {
    return recommendations.reduce((total, rec) => total + (rec.cost || 0), 0);
  }

  async addCustomCrop(cropName, cropDetails) {
    // Validate crop details
    const requiredFields = ['soilTypes', 'phRange', 'temperature', 'growthDuration'];
    const missingFields = requiredFields.filter(field => !cropDetails[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Add to database (in production, this would be saved to a real database)
    this.cropDatabase[cropName] = {
      ...cropDetails,
      waterNeeds: cropDetails.waterNeeds || 'Medium',
      yield: cropDetails.yield || '2-4 tons/hectare',
      marketPrice: cropDetails.marketPrice || 2000,
      profitability: 'Unknown'
    };

    return {
      success: true,
      message: `Custom crop '${cropName}' added successfully`,
      cropData: this.cropDatabase[cropName]
    };
  }

  async getAIInsights(location, soilData, weatherData, cropType) {
    try {
      // Use rule-based insights for now (more reliable)
      return this.getEnhancedRuleBasedInsights(location, soilData, weatherData, cropType);
    } catch (error) {
      console.error('AI Insights Error:', error.message);
      
      // Fallback to basic rule-based insights
      return this.getRuleBasedInsights(location, soilData, weatherData, cropType);
    }
  }

  buildAIPrompt(location, soilData, weatherData, cropType) {
    return `As an agricultural expert, analyze the following farming conditions and provide detailed insights:

Location: ${location.district}, ${location.state}, ${location.country}
Soil Type: ${soilData.type}
Soil pH: ${soilData.ph}
Soil Nutrients: N-${soilData.nitrogen}, P-${soilData.phosphorus}, K-${soilData.potassium}
Organic Matter: ${soilData.organicMatter}%
Current Weather: ${weatherData?.current?.condition || 'Not available'}
Temperature: ${weatherData?.current?.temperature || 'Not available'}°C
Crop Type: ${cropType || 'General farming'}

Please provide:
1. Specific recommendations for this crop and conditions
2. Potential challenges and how to address them
3. Optimal farming practices for this location
4. Fertilizer and irrigation recommendations
5. Disease and pest management advice
6. Market timing suggestions

Keep the response practical and actionable for farmers.`;
  }

  getEnhancedRuleBasedInsights(location, soilData, weatherData, cropType) {
    const insights = [];
    
    // Simple, easy-to-understand insights
    insights.push('🌱 **Farming Tips for Your Land:**');
    
    // Soil insights in simple language
    if (soilData.ph < 6.0) {
      insights.push('• Your soil is too acidic. Add lime to make it better for crops.');
    } else if (soilData.ph > 8.0) {
      insights.push('• Your soil is too alkaline. Add organic matter to balance it.');
    } else {
      insights.push('• Your soil pH is good for most crops.');
    }
    
    if (soilData.organicMatter < 1.5) {
      insights.push('• Add compost or cow dung to make your soil more fertile.');
    }
    
    // Nutrient insights
    if (soilData.nitrogen === 'Low') {
      insights.push('• Your soil needs nitrogen. Use urea or organic manure.');
    }
    if (soilData.phosphorus === 'Low') {
      insights.push('• Your soil needs phosphorus. Use DAP fertilizer.');
    }
    if (soilData.potassium === 'Low') {
      insights.push('• Your soil needs potassium. Use MOP fertilizer.');
    }
    
    // Weather insights
    if (weatherData?.current?.temperature > 35) {
      insights.push('• Very hot weather. Water your crops more often.');
    } else if (weatherData?.current?.temperature < 15) {
      insights.push('• Cold weather. Protect sensitive crops from frost.');
    }
    
    if (weatherData?.current?.rainfall > 100) {
      insights.push('• Heavy rain expected. Make sure water can drain properly.');
    } else if (weatherData?.current?.rainfall < 20) {
      insights.push('• Low rainfall. Plan for irrigation.');
    }
    
    // Location-specific insights
    insights.push(`🗺️ **For ${location.district}, ${location.state}:**`);
    insights.push('• Check with local farmers for best practices in your area.');
    insights.push('• Visit your nearest agriculture office for government schemes.');
    
    // General farming tips
    insights.push('💡 **General Tips:**');
    insights.push('• Test your soil every year to track changes.');
    insights.push('• Rotate different crops to keep soil healthy.');
    insights.push('• Use organic methods when possible.');
    insights.push('• Keep records of what works best on your farm.');
    
    return {
      success: true,
      insights: insights.join('\n'),
      analysisType: 'Smart Analysis',
      timestamp: new Date().toISOString()
    };
  }

  getRuleBasedInsights(location, soilData, weatherData, cropType) {
    const insights = [];
    
    // Basic insights as fallback
    insights.push('🌾 **Basic Farming Advice:**');
    insights.push('• Test your soil regularly');
    insights.push('• Use appropriate fertilizers');
    insights.push('• Monitor weather conditions');
    insights.push('• Consult local agriculture experts');
    
    return {
      success: true,
      insights: insights.join('\n'),
      analysisType: 'Basic Analysis',
      timestamp: new Date().toISOString()
    };
  }

  getCropDatabase() {
    return {
      success: true,
      crops: this.cropDatabase,
      totalCrops: Object.keys(this.cropDatabase).length
    };
  }

  async getChatbotResponse(message, context = {}) {
    try {
      // Create context-aware prompt for the chatbot
      let contextInfo = '';
      
      if (context.location) {
        contextInfo += `User's location: ${context.location.district}, ${context.location.state}, India. `;
      }
      
      if (context.soilData) {
        contextInfo += `Soil type: ${context.soilData.type}, pH: ${context.soilData.ph}, Nitrogen: ${context.soilData.nitrogen}, Phosphorus: ${context.soilData.phosphorus}, Potassium: ${context.soilData.potassium}. `;
      }
      
      if (context.weatherData) {
        contextInfo += `Current weather: ${context.weatherData.current?.temperature}°C, ${context.weatherData.current?.condition}, Rainfall: ${context.weatherData.current?.rainfall}mm. `;
      }
      
      if (context.cropData && context.cropData.recommendedCrops) {
        const topCrops = context.cropData.recommendedCrops.slice(0, 3).map(crop => crop.name).join(', ');
        contextInfo += `Recommended crops: ${topCrops}. `;
      }

      const prompt = `You are FarmX AI Assistant, an expert agricultural advisor for Indian farmers. 
      
Context Information: ${contextInfo}

User Question: ${message}

Instructions:
1. Provide practical, actionable farming advice specific to Indian agriculture
2. Keep responses concise (2-3 sentences maximum)
3. Use simple, farmer-friendly language
4. Include specific recommendations when possible
5. If the question is not farming-related, politely redirect to agricultural topics
6. Focus on solutions that work in Indian farming conditions
7. Include practical tips with 💡 emoji when relevant

Please provide a helpful response:`;

      // Gemini API temporarily disabled due to leaked key
      if (this.geminiApiKey && false) {
        try {
          console.log('Attempting Gemini API call...');
          
          // Use the correct Gemini API endpoint with proper model name
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
            {
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              },
              safetySettings: [
                {
                  category: "HARM_CATEGORY_HARASSMENT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_HATE_SPEECH",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
              ]
            },
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 15000
            }
          );

          console.log('Gemini API response received:', response.status);

          if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            let aiResponse = response.data.candidates[0].content.parts[0].text.trim();
            
            // Add farming tips for common questions
            if (message.toLowerCase().includes('soil') && message.toLowerCase().includes('improve')) {
              aiResponse += ' 💡 Add compost or cow dung to improve soil fertility naturally.';
            } else if (message.toLowerCase().includes('water') || message.toLowerCase().includes('irrigation')) {
              aiResponse += ' 💡 Water early morning or evening to reduce evaporation.';
            } else if (message.toLowerCase().includes('pest') || message.toLowerCase().includes('disease')) {
              aiResponse += ' 💡 Regular field inspection helps catch problems early.';
            }
            
            console.log('Gemini AI response generated successfully');
            return {
              success: true,
              response: aiResponse,
              source: 'Gemini AI',
              timestamp: new Date().toISOString()
            };
          } else {
            console.log('Gemini API returned empty response, using fallback');
          }
        } catch (apiError) {
          console.error('Gemini API error:', apiError.response?.status, apiError.response?.statusText);
          console.error('Gemini API error details:', apiError.response?.data);
          console.log('Falling back to intelligent responses...');
        }
      } else {
        console.log('Using FarmX intelligent knowledge base for optimal responses');
      }
      
      // Fallback responses for common farming questions
      return this.getFallbackChatResponse(message, context);
      
    } catch (error) {
      console.error('Chatbot error:', error);
      return this.getFallbackChatResponse(message, context);
    }
  }

  getFallbackChatResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // First try comprehensive farming knowledge base
    const comprehensiveResponse = this.getComprehensiveFarmingResponse(lowerMessage, context);
    if (comprehensiveResponse) return comprehensiveResponse;
    
    // Enhanced context-aware responses
    if (lowerMessage.includes('crop') && (lowerMessage.includes('best') || lowerMessage.includes('recommend'))) {
      if (context.soilData?.type) {
        const soilSpecificCrops = this.getSoilSpecificCrops(context.soilData.type);
        return {
          success: true,
          response: `For ${context.soilData.type}, I recommend ${soilSpecificCrops}. ${context.location ? `In ${context.location.district}, ${context.location.state}, ` : ''}consider local climate and market prices. 💡 Complete weather analysis for more precise recommendations.`,
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
      return {
        success: true,
        response: 'The best crops depend on your soil type, climate, and local market. Complete your soil analysis first to get personalized recommendations. 💡 Rice, wheat, and cotton are popular choices in India.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    // Context-aware soil improvement advice
    if (lowerMessage.includes('soil') && (lowerMessage.includes('improve') || lowerMessage.includes('fertility'))) {
      let response = 'To improve soil fertility, add organic matter like compost or cow dung, rotate crops, and use appropriate fertilizers based on soil testing.';
      if (context.soilData) {
        if (context.soilData.ph < 6.0) {
          response += ' Your soil is acidic - add lime to balance pH.';
        } else if (context.soilData.ph > 8.0) {
          response += ' Your soil is alkaline - add organic matter to balance pH.';
        }
        
        const lowNutrients = [];
        if (context.soilData.nitrogen === 'Low') lowNutrients.push('nitrogen (use urea)');
        if (context.soilData.phosphorus === 'Low') lowNutrients.push('phosphorus (use DAP)');
        if (context.soilData.potassium === 'Low') lowNutrients.push('potassium (use MOP)');
        
        if (lowNutrients.length > 0) {
          response += ` Focus on adding ${lowNutrients.join(', ')}.`;
        }
      }
      response += ' 💡 Test your soil annually to track improvements.';
      return {
        success: true,
        response: response,
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    // Context-aware irrigation advice
    if (lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
      let response = 'Water crops early morning or evening to reduce evaporation. Use drip irrigation for water efficiency.';
      if (context.weatherData?.current?.rainfall < 20) {
        response += ' With low rainfall expected, plan for regular irrigation.';
      } else if (context.weatherData?.current?.rainfall > 100) {
        response += ' With heavy rainfall expected, ensure proper drainage.';
      }
      if (context.location) {
        response += ` For ${context.location.district}, check local water availability and restrictions.`;
      }
      response += ' 💡 Mulching helps retain soil moisture and reduces watering needs.';
      return {
        success: true,
        response: response,
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    // Context-aware fertilizer advice
    if (lowerMessage.includes('fertilizer')) {
      if (context.soilData) {
        const lowNutrients = [];
        if (context.soilData.nitrogen === 'Low') lowNutrients.push('nitrogen (use urea or compost)');
        if (context.soilData.phosphorus === 'Low') lowNutrients.push('phosphorus (use DAP or bone meal)');
        if (context.soilData.potassium === 'Low') lowNutrients.push('potassium (use MOP or wood ash)');
        
        if (lowNutrients.length > 0) {
          return {
            success: true,
            response: `Based on your soil analysis, focus on ${lowNutrients.join(', ')}. Apply fertilizers in split doses for better efficiency. 💡 Organic fertilizers like compost improve long-term soil health.`,
            source: 'FarmX Assistant',
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            success: true,
            response: `Your soil nutrient levels look balanced (N:${context.soilData.nitrogen}, P:${context.soilData.phosphorus}, K:${context.soilData.potassium}). Use maintenance doses of NPK fertilizers. 💡 Continue with organic matter to maintain soil health.`,
            source: 'FarmX Assistant',
            timestamp: new Date().toISOString()
          };
        }
      }
      return {
        success: true,
        response: 'Use fertilizers based on soil test results. NPK fertilizers provide essential nutrients. Apply in split doses during crop growth stages. 💡 Combine with organic fertilizers for best results.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    // Context-aware weather advice
    if (lowerMessage.includes('weather') || lowerMessage.includes('rain')) {
      let response = 'Monitor weather forecasts regularly for farming decisions.';
      if (context.weatherData?.current) {
        response += ` Current conditions: ${context.weatherData.current.temperature}°C, ${context.weatherData.current.condition}.`;
        if (context.weatherData.current.rainfall > 50) {
          response += ' Heavy rain expected - ensure proper drainage and delay fertilizer application.';
        } else if (context.weatherData.current.rainfall < 10) {
          response += ' Low rainfall - plan irrigation accordingly and consider drought-resistant crops.';
        }
      }
      if (context.location) {
        response += ` For ${context.location.district}, ${context.location.state}, check local weather patterns.`;
      }
      response += ' 💡 Use weather data to time planting, fertilizing, and harvesting operations.';
      return {
        success: true,
        response: response,
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    // Enhanced greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return {
        success: true,
        response: `Hello! I'm your FarmX AI Assistant. ${context.location ? `I see you're from ${context.location.district}, ${context.location.state}. ` : ''}Ask me anything about farming, crops, soil, weather, or agricultural best practices! 🌾`,
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerMessage.includes('who are you') || lowerMessage.includes('what are you')) {
      return {
        success: true,
        response: 'I\'m FarmX AI Assistant, your personal farming expert! I help with crop recommendations, soil analysis, weather insights, and agricultural best practices for Indian farmers. I have comprehensive knowledge about farming practices, pest control, fertilizers, irrigation, and much more. How can I help you today? 🌱',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    // Default comprehensive response
    return {
      success: true,
      response: 'I\'m your FarmX AI Assistant with comprehensive farming knowledge! I can help with crops, soil management, weather planning, fertilizers, pest control, irrigation, seeds, harvesting, and all agricultural practices. Ask me anything about farming! 🌾',
      source: 'FarmX Assistant',
      timestamp: new Date().toISOString()
    };
  }

  getComprehensiveFarmingResponse(lowerMessage, context) {
    // 1. SOIL-CROP COMPATIBILITY QUESTIONS
    if (this.isSoilCropQuestion(lowerMessage)) {
      return this.getSoilCropResponse(lowerMessage);
    }
    
    // 2. FERTILIZER QUESTIONS
    if (this.isFertilizerQuestion(lowerMessage)) {
      return this.getFertilizerResponse(lowerMessage);
    }
    
    // 3. PEST AND DISEASE QUESTIONS
    if (this.isPestDiseaseQuestion(lowerMessage)) {
      return this.getPestDiseaseResponse(lowerMessage);
    }
    
    // 4. IRRIGATION AND WATER QUESTIONS
    if (this.isIrrigationQuestion(lowerMessage)) {
      return this.getIrrigationResponse(lowerMessage);
    }
    
    // 5. SEED AND PLANTING QUESTIONS
    if (this.isSeedPlantingQuestion(lowerMessage)) {
      return this.getSeedPlantingResponse(lowerMessage);
    }
    
    // 6. WEATHER AND SEASON QUESTIONS
    if (this.isWeatherSeasonQuestion(lowerMessage)) {
      return this.getWeatherSeasonResponse(lowerMessage);
    }
    
    // 7. HARVESTING AND POST-HARVEST QUESTIONS
    if (this.isHarvestingQuestion(lowerMessage)) {
      return this.getHarvestingResponse(lowerMessage);
    }
    
    // 8. CROP SPECIFIC QUESTIONS
    if (this.isCropSpecificQuestion(lowerMessage)) {
      return this.getCropSpecificResponse(lowerMessage);
    }
    
    // 9. GENERAL FARMING PRACTICES
    if (this.isGeneralFarmingQuestion(lowerMessage)) {
      return this.getGeneralFarmingResponse(lowerMessage);
    }
    
    return null;
  }

  // SOIL-CROP COMPATIBILITY RESPONSES
  isSoilCropQuestion(message) {
    return (message.includes('soil') && (message.includes('good') || message.includes('best') || message.includes('suitable'))) ||
           (message.includes('which soil') || message.includes('what soil') || message.includes('best soil'));
  }

  getSoilCropResponse(lowerMessage) {
    // Direct questions about best soil for specific crops
    if ((lowerMessage.includes('which soil') || lowerMessage.includes('best soil')) && (lowerMessage.includes('best') || lowerMessage.includes('good'))) {
      if (lowerMessage.includes('wheat')) {
        return {
          success: true,
          response: 'The best soils for wheat are Alluvial soil and Black cotton soil. Alluvial soil is ideal because it\'s fertile, well-drained, and has good water retention. Black cotton soil also works excellently as it retains moisture and has high fertility. 💡 Wheat grows best in pH 6.0-7.5.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      } else if (lowerMessage.includes('rice')) {
        return {
          success: true,
          response: 'The best soils for rice are Alluvial soil and Clay soil. Rice needs soil that can retain water well. Alluvial soil in river deltas is perfect for rice cultivation. Clay soil also works well due to its excellent water retention capacity. 💡 Rice grows best in pH 5.5-7.0.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      } else if (lowerMessage.includes('cotton')) {
        return {
          success: true,
          response: 'Black cotton soil is the best for cotton cultivation! It\'s specifically named after cotton because of its excellent suitability. This soil has good water retention, high fertility, and the right texture for cotton roots. 💡 Cotton grows best in pH 5.8-8.0.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      } else if (lowerMessage.includes('sugarcane')) {
        return {
          success: true,
          response: 'Alluvial soil and Black cotton soil are best for sugarcane. These soils have good fertility, water retention, and drainage. Sugarcane needs rich, deep soil with good organic matter content. 💡 Sugarcane grows best in pH 6.0-7.5.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      } else if (lowerMessage.includes('tomato') || lowerMessage.includes('tamato')) {
        return {
          success: true,
          response: 'The best soils for tomato are well-drained Loamy soil and Alluvial soil. Tomatoes need good drainage, rich organic matter, and pH 6.0-7.0. Sandy loam with good organic content works excellently. 💡 Avoid waterlogged or heavy clay soils for tomatoes.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      } else if (lowerMessage.includes('maize') || lowerMessage.includes('corn')) {
        return {
          success: true,
          response: 'The best soils for maize are Alluvial soil and well-drained Loamy soil. Maize needs fertile, well-drained soil with good organic matter. Black cotton soil can also work if drainage is good. 💡 Maize grows best in pH 6.0-7.0 with adequate nitrogen.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
    }
    
    // Alternative patterns for soil questions
    if (lowerMessage.includes('soil') && lowerMessage.includes('good') && lowerMessage.includes('wheat')) {
      return {
        success: true,
        response: 'The best soils for wheat are Alluvial soil and Black cotton soil. Alluvial soil is ideal because it\'s fertile, well-drained, and has good water retention. Black cotton soil also works excellently as it retains moisture and has high fertility. 💡 Wheat grows best in pH 6.0-7.5.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    if ((lowerMessage.includes('best soil') || lowerMessage.includes('soil')) && (lowerMessage.includes('tomato') || lowerMessage.includes('tamato'))) {
      return {
        success: true,
        response: 'The best soils for tomato are well-drained Loamy soil and Alluvial soil. Tomatoes need good drainage, rich organic matter, and pH 6.0-7.0. Sandy loam with good organic content works excellently. 💡 Avoid waterlogged or heavy clay soils for tomatoes.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    // Questions about soil suitability for specific crops
    if (lowerMessage.includes('red soil')) {
      if (lowerMessage.includes('rice')) {
        return {
          success: true,
          response: 'Red soil is not ideal for rice cultivation. Rice needs water-retentive soil, but red soil drains too quickly and is acidic. For rice, choose Alluvial soil or Clay soil instead. 💡 If you must use red soil, add organic matter and ensure continuous irrigation.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      } else if (lowerMessage.includes('maize') || lowerMessage.includes('corn')) {
        return {
          success: true,
          response: 'Red soil can be good for maize with proper management! While it\'s naturally acidic and less fertile than black soil, you can improve it by adding lime to reduce acidity and organic matter for fertility. 💡 Red soil is better suited for millets, groundnut, and cotton with proper amendments.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: true,
          response: 'Red soil is good for cotton, groundnut, millets, and pulses. It has good drainage but may need lime to reduce acidity and organic matter to improve fertility. 💡 Red soil is common in Tamil Nadu, Karnataka, and Andhra Pradesh.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
    }
    
    // Specific soil-crop compatibility questions
    if (lowerMessage.includes('black soil') || lowerMessage.includes('cotton soil')) {
      if (lowerMessage.includes('wheat')) {
        return {
          success: true,
          response: 'Black cotton soil is excellent for wheat! It retains moisture well and has good fertility. Plant wheat in October-November for best results. 💡 Black soil is also great for cotton, sugarcane, and soybean.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
      
      if (lowerMessage.includes('maize') || lowerMessage.includes('corn')) {
        return {
          success: true,
          response: 'Yes! Black cotton soil is very good for maize cultivation. It has excellent water retention, high fertility, and good organic matter content that maize needs. Black soil provides steady moisture and nutrients throughout the growing season. 💡 Plant maize in June-July (Kharif season) for best results in black soil.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
      
      if (lowerMessage.includes('cotton')) {
        return {
          success: true,
          response: 'Black cotton soil is the best for cotton cultivation! It\'s specifically named after cotton because of its excellent suitability. This soil has good water retention, high fertility, and the right texture for cotton roots. 💡 Cotton grows best in pH 5.8-8.0.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
      
      // General black soil information
      return {
        success: true,
        response: 'Black cotton soil is excellent for many crops! It\'s best for cotton, wheat, maize, sugarcane, and soybean. This soil has high fertility, good water retention, and rich organic matter. 💡 Black soil is found mainly in Maharashtra, Gujarat, Madhya Pradesh, and parts of Karnataka.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerMessage.includes('alluvial soil')) {
      if (lowerMessage.includes('wheat')) {
        return {
          success: true,
          response: 'Alluvial soil is perfect for wheat cultivation! It\'s fertile, well-drained, and ideal for cereal crops. You can expect good yields with proper irrigation. 💡 Alluvial soil is also excellent for rice, maize, and sugarcane.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
      
      if (lowerMessage.includes('rice')) {
        return {
          success: true,
          response: 'Alluvial soil is the best choice for rice cultivation! It has excellent water retention, good fertility, and fine texture perfect for paddy fields. Most rice in India is grown in alluvial soil. 💡 Plant rice in June-July with proper water management.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
      
      if (lowerMessage.includes('maize') || lowerMessage.includes('corn')) {
        return {
          success: true,
          response: 'Alluvial soil is excellent for maize! It provides good drainage, fertility, and the right texture for maize roots. This soil is ideal for both Kharif and Rabi maize cultivation. 💡 Ensure proper irrigation and add organic matter for best yields.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
      
      // General alluvial soil information
      return {
        success: true,
        response: 'Alluvial soil is one of the most fertile soils in India! It\'s excellent for rice, wheat, maize, sugarcane, and most vegetables. Found in river valleys and deltas, it has good water retention and drainage. 💡 Alluvial soil covers about 40% of India\'s total land area.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('laterite soil')) {
      return {
        success: true,
        response: 'Laterite soil is challenging for most crops due to high acidity and low fertility. It\'s suitable for cashew, coconut, and some spices with proper soil amendments. Add lime and organic matter to improve it. 💡 Laterite soil is common in Kerala, Karnataka, and parts of Maharashtra.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  }

  // FERTILIZER QUESTIONS
  isFertilizerQuestion(message) {
    return message.includes('fertilizer') || message.includes('manure') || message.includes('compost') || 
           message.includes('npk') || message.includes('urea') || message.includes('phosphate');
  }

  getFertilizerResponse(lowerMessage) {
    if (lowerMessage.includes('npk')) {
      return {
        success: true,
        response: 'NPK fertilizer contains Nitrogen (N), Phosphorus (P), and Potassium (K). N promotes leaf growth, P helps root development and flowering, K improves disease resistance. Common ratios are 10:26:26 for flowering crops, 20:20:20 for balanced growth. 💡 Apply NPK based on soil test results for best results.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('urea')) {
      return {
        success: true,
        response: 'Urea is a nitrogen fertilizer (46% N) that promotes leaf and stem growth. Apply 2-3 times during crop growth: at planting, vegetative stage, and before flowering. Don\'t apply during flowering as it reduces fruit/grain formation. 💡 Apply urea when soil is moist and avoid direct contact with seeds.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('organic') || lowerMessage.includes('compost') || lowerMessage.includes('manure')) {
      return {
        success: true,
        response: 'Organic fertilizers like compost, cow dung, and vermicompost improve soil health long-term. They release nutrients slowly, improve soil structure, and increase beneficial microbes. Apply 5-10 tons per hectare before planting. 💡 Organic fertilizers work best when combined with small amounts of chemical fertilizers.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('when') && lowerMessage.includes('apply')) {
      return {
        success: true,
        response: 'Fertilizer timing depends on crop stage: Base dose at planting, nitrogen in 2-3 splits during vegetative growth, phosphorus at planting and flowering, potassium throughout growth. Apply early morning or evening when temperature is cool. 💡 Never apply fertilizer on dry soil - water before and after application.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      response: 'Choose fertilizers based on crop needs and soil test. Nitrogen for leaf growth, phosphorus for roots/flowers, potassium for disease resistance. Organic fertilizers improve soil health long-term. 💡 Always do soil testing before applying fertilizers for best results.',
      source: 'FarmX Assistant',
      timestamp: new Date().toISOString()
    };
  }

  // PEST AND DISEASE QUESTIONS
  isPestDiseaseQuestion(message) {
    return message.includes('pest') || message.includes('disease') || message.includes('insect') || 
           message.includes('fungus') || message.includes('virus') || message.includes('aphid') || 
           message.includes('caterpillar') || message.includes('blight') || message.includes('rot');
  }

  getPestDiseaseResponse(lowerMessage) {
    if (lowerMessage.includes('aphid')) {
      return {
        success: true,
        response: 'Aphids are small green/black insects that suck plant sap. Control: Spray neem oil (5ml/liter water), use yellow sticky traps, encourage ladybugs and lacewings. For severe infestation, use imidacloprid. 💡 Check undersides of leaves regularly - early detection is key.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('caterpillar') || lowerMessage.includes('bollworm')) {
      return {
        success: true,
        response: 'Caterpillars eat leaves and bore into fruits/stems. Control: Hand-pick in small areas, spray Bt (Bacillus thuringiensis), use pheromone traps, apply chlorantraniliprole for severe cases. 💡 Check plants in early morning when caterpillars are most active.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('fungus') || lowerMessage.includes('blight') || lowerMessage.includes('rot')) {
      return {
        success: true,
        response: 'Fungal diseases cause leaf spots, blight, and rot. Prevention: Ensure good air circulation, avoid overhead watering, remove infected plant parts. Treatment: Spray copper fungicide or mancozeb. 💡 Apply fungicides preventively during humid weather.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('neem')) {
      return {
        success: true,
        response: 'Neem is an excellent organic pesticide! Mix 5ml neem oil + 1ml liquid soap in 1 liter water. Effective against aphids, whiteflies, thrips, and caterpillars. Spray in evening to avoid leaf burn. 💡 Neem also has antifungal properties and is safe for beneficial insects.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      response: 'For pest control: Regular monitoring, neem oil spray, beneficial insects, crop rotation, and clean cultivation. For diseases: Good drainage, proper spacing, fungicide sprays, and resistant varieties. 💡 Prevention is always better than cure - inspect crops weekly.',
      source: 'FarmX Assistant',
      timestamp: new Date().toISOString()
    };
  }

  // IRRIGATION AND WATER QUESTIONS
  isIrrigationQuestion(message) {
    return message.includes('water') || message.includes('irrigation') || message.includes('drip') || 
           message.includes('sprinkler') || message.includes('drought') || message.includes('moisture');
  }

  getIrrigationResponse(lowerMessage) {
    if (lowerMessage.includes('drip')) {
      return {
        success: true,
        response: 'Drip irrigation saves 30-50% water and increases yield by 20-30%. Water is delivered directly to plant roots through tubes with emitters. Best for vegetables, fruits, and cash crops. Initial cost is high but saves water and labor long-term. 💡 Clean filters regularly to prevent clogging.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('sprinkler')) {
      return {
        success: true,
        response: 'Sprinkler irrigation is good for field crops like wheat, maize, and vegetables. Saves 20-30% water compared to flood irrigation. Works well on uneven land. Avoid during windy conditions and flowering stage of crops. 💡 Operate early morning or evening to reduce evaporation.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('when') && (lowerMessage.includes('water') || lowerMessage.includes('irrigate'))) {
      return {
        success: true,
        response: 'Best irrigation times: Early morning (5-8 AM) or evening (4-7 PM) when evaporation is low. Check soil moisture by inserting finger 2-3 inches deep. Water when top soil feels dry but subsoil is still moist. 💡 Different crops need different watering frequencies - leafy vegetables need daily water, while cereals need water every 3-4 days.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('drought') || lowerMessage.includes('water shortage')) {
      return {
        success: true,
        response: 'Drought management: Use drought-resistant varieties, mulching to retain moisture, drip irrigation, rainwater harvesting, and deep plowing to improve water infiltration. Choose crops with low water requirements like millets, sorghum, and pulses. 💡 Apply organic matter to improve soil water-holding capacity.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      response: 'Efficient irrigation: Water early morning or evening, use drip/sprinkler systems, mulch to retain moisture, and check soil moisture before watering. Different crops have different water needs. 💡 Over-watering can be as harmful as under-watering.',
      source: 'FarmX Assistant',
      timestamp: new Date().toISOString()
    };
  }

  // SEED AND PLANTING QUESTIONS
  isSeedPlantingQuestion(message) {
    return message.includes('seed') || message.includes('plant') || message.includes('sow') || 
           message.includes('germination') || message.includes('spacing') || message.includes('depth');
  }

  getSeedPlantingResponse(lowerMessage) {
    if (lowerMessage.includes('seed treatment')) {
      return {
        success: true,
        response: 'Seed treatment prevents diseases and improves germination. Soak seeds in fungicide solution (2g/liter water) for 30 minutes, then dry in shade. For organic treatment, use cow urine (1:10 ratio) or neem oil. 💡 Treated seeds should be planted within 24 hours for best results.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('germination')) {
      return {
        success: true,
        response: 'Good germination needs: Quality seeds, proper moisture, right temperature, and adequate oxygen. Test germination by placing 100 seeds on wet cloth - if 80+ germinate in 3-7 days, seeds are good. 💡 Old seeds have poor germination - use fresh seeds for better results.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('spacing')) {
      return {
        success: true,
        response: 'Proper spacing prevents competition and disease. Rice: 20x15cm, Wheat: 20cm rows, Maize: 60x20cm, Cotton: 90x30cm, Vegetables: varies by type. Closer spacing increases competition, wider spacing wastes land. 💡 Follow recommended spacing for your crop variety and local conditions.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('depth')) {
      return {
        success: true,
        response: 'Planting depth rule: 2-3 times the seed diameter. Small seeds (vegetables): 0.5-1cm, Medium seeds (wheat, rice): 2-3cm, Large seeds (maize, cotton): 3-5cm. Too deep delays emergence, too shallow causes poor root development. 💡 Plant slightly deeper in sandy soil, shallower in clay soil.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      response: 'For successful planting: Use quality seeds, treat before sowing, plant at right depth and spacing, ensure adequate moisture, and choose appropriate season. Follow recommended practices for your specific crop. 💡 Good planting is the foundation of successful farming.',
      source: 'FarmX Assistant',
      timestamp: new Date().toISOString()
    };
  }

  // WEATHER AND SEASON QUESTIONS
  isWeatherSeasonQuestion(message) {
    return message.includes('weather') || message.includes('season') || message.includes('rain') || 
           message.includes('temperature') || message.includes('kharif') || message.includes('rabi') || 
           message.includes('summer') || message.includes('winter') || message.includes('monsoon');
  }

  getWeatherSeasonResponse(lowerMessage) {
    if (lowerMessage.includes('kharif')) {
      return {
        success: true,
        response: 'Kharif crops are grown during monsoon season (June-October). Major Kharif crops: Rice, maize, cotton, sugarcane, soybean, and millets. These crops need high temperature and humidity during growth and dry weather during harvesting. 💡 Plant Kharif crops with the onset of monsoon for best results.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('rabi')) {
      return {
        success: true,
        response: 'Rabi crops are grown in winter season (November-April). Major Rabi crops: Wheat, barley, peas, gram, mustard, and linseed. These crops need cool weather during growth and warm weather during harvesting. 💡 Rabi crops generally give higher yields due to fewer pests and diseases.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('monsoon') || lowerMessage.includes('rain')) {
      return {
        success: true,
        response: 'Monsoon is crucial for Indian agriculture. Pre-monsoon: Prepare fields, arrange seeds and fertilizers. During monsoon: Plant Kharif crops, manage excess water, control weeds. Post-monsoon: Harvest Kharif crops, prepare for Rabi season. 💡 Use weather forecasts to plan farming activities.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('temperature') && lowerMessage.includes('crop')) {
      return {
        success: true,
        response: 'Temperature affects crop growth: Rice needs 20-35°C, Wheat needs 15-25°C, Cotton needs 21-30°C, Maize needs 21-27°C. High temperature reduces yield, low temperature slows growth. Choose varieties suited to your local temperature. 💡 Use shade nets or mulching to protect crops from extreme temperatures.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      response: 'Weather planning is essential for farming success. Choose crops based on season: Kharif (monsoon crops), Rabi (winter crops), and Summer crops. Monitor weather forecasts and plan accordingly. 💡 Climate change requires adaptive farming practices.',
      source: 'FarmX Assistant',
      timestamp: new Date().toISOString()
    };
  }

  // HARVESTING QUESTIONS
  isHarvestingQuestion(message) {
    return message.includes('harvest') || message.includes('maturity') || message.includes('ready') || 
           message.includes('storage') || message.includes('drying') || message.includes('post-harvest');
  }

  getHarvestingResponse(lowerMessage) {
    if (lowerMessage.includes('when') && (lowerMessage.includes('harvest') || lowerMessage.includes('ready'))) {
      return {
        success: true,
        response: 'Harvest timing signs: Grains are hard and moisture content is 20-25%, leaves turn yellow, pods rattle when shaken, fruits change color and detach easily. Harvest in dry weather, early morning for vegetables, and when dew has dried for grains. 💡 Timely harvesting prevents losses from weather, pests, and over-ripening.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('storage') || lowerMessage.includes('store')) {
      return {
        success: true,
        response: 'Proper storage prevents losses: Dry grains to 12-14% moisture, clean thoroughly, use airtight containers, add neem leaves or diatomaceous earth for pest control. Store in cool, dry place away from sunlight. 💡 Check stored grains monthly and maintain proper ventilation.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('drying')) {
      return {
        success: true,
        response: 'Proper drying is crucial: Spread grains in thin layers on clean surface, turn regularly, protect from rain and birds. Sun-dry for 3-5 days until moisture is 12-14%. Use moisture meter for accuracy. 💡 Over-drying makes grains brittle, under-drying causes fungal growth.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      response: 'Post-harvest management: Harvest at right maturity, dry properly to safe moisture levels, clean and grade, store in pest-proof containers, and maintain proper records. Good post-harvest practices prevent 15-20% losses. 💡 Invest in proper storage facilities for better returns.',
      source: 'FarmX Assistant',
      timestamp: new Date().toISOString()
    };
  }

  // CROP SPECIFIC QUESTIONS
  isCropSpecificQuestion(message) {
    const crops = [
      // Cereals & Food Grains
      'rice', 'wheat', 'maize', 'corn',
      // Cash Crops
      'cotton', 'sugarcane', 'jute', 'coffee',
      // Pulses & Legumes
      'chickpea', 'gram', 'kidneybeans', 'kidney beans', 'rajma',
      'pigeonpeas', 'pigeon peas', 'arhar', 'tur',
      'mothbeans', 'moth beans', 'moth',
      'mungbean', 'mung bean', 'moong',
      'blackgram', 'black gram', 'urad',
      'lentil', 'masoor',
      // Fruits & Horticulture
      'apple', 'banana', 'grapes', 'mango', 'orange', 'papaya', 
      'pomegranate', 'watermelon', 'muskmelon', 'coconut',
      // Vegetables & Others
      'tomato', 'tamato', 'potato', 'onion', 'chili', 'brinjal', 
      'groundnut', 'peanut', 'mustard', 'peas', 'barley', 'millets', 'sorghum'
    ];
    return crops.some(crop => message.includes(crop));
  }

  getCropSpecificResponse(lowerMessage) {
    // CEREALS & FOOD GRAINS
    if (lowerMessage.includes('rice')) {
      return {
        success: true,
        response: 'Rice cultivation: Plant in June-July, needs 150-200cm annual rainfall, grows best in alluvial/clay soil, requires continuous water during growth. Varieties: Basmati (aromatic), IR-64 (high yield), Swarna (disease resistant). 💡 Maintain 2-5cm water level in paddy fields throughout growing season.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('wheat')) {
      return {
        success: true,
        response: 'Wheat cultivation: Plant in November-December, needs 50-75cm annual rainfall, grows best in alluvial/black soil, requires cool weather during growth. Varieties: HD-2967 (high yield), PBW-343 (disease resistant), Sharbati (quality). 💡 Apply nitrogen in 3 splits for better grain filling.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('maize') || lowerMessage.includes('corn')) {
      // Check for specific questions about maize growing conditions
      if (lowerMessage.includes('condition') || lowerMessage.includes('grow') || lowerMessage.includes('best')) {
        return {
          success: true,
          response: 'Best conditions for maize: Well-drained fertile soil (pH 6.0-7.0), temperature 21-27°C, 60-120cm annual rainfall, full sunlight. Soil: Alluvial or loamy soil with good organic matter. Climate: Warm weather during growth, avoid waterlogging. 💡 Plant in June-July (Kharif) or February-March (Rabi) depending on your region.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        success: true,
        response: 'Maize cultivation: Plant in June-July (Kharif) or February-March (Rabi), needs well-drained soil, requires moderate water. Varieties: Hybrid maize (high yield), Sweet corn (vegetable), Popcorn (specialty). 💡 Apply nitrogen when plants are knee-high for maximum grain filling.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    // CASH CROPS
    if (lowerMessage.includes('cotton')) {
      return {
        success: true,
        response: 'Cotton cultivation: Plant in May-June, needs 50-100cm rainfall, grows best in black cotton soil, requires warm weather. Varieties: Bt cotton (pest resistant), Desi cotton (traditional), Hybrid cotton (high yield). 💡 Maintain proper plant population (30,000-40,000 plants/hectare) for optimal yield.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('jute')) {
      return {
        success: true,
        response: 'Jute cultivation: Plant in April-May, needs high humidity and 120-200cm rainfall, grows best in alluvial soil of river deltas. Requires warm, moist climate. Harvest after 120 days when plants flower. 💡 Jute is called "golden fiber" and is eco-friendly alternative to synthetic materials.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('coffee')) {
      return {
        success: true,
        response: 'Coffee cultivation: Plant in monsoon season, needs 150-250cm rainfall, grows best in well-drained red laterite soil at 600-1600m altitude. Requires shade and cool climate. Varieties: Arabica (high quality), Robusta (disease resistant). 💡 Coffee plants start bearing after 3-4 years and remain productive for 50+ years.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    // PULSES & LEGUMES
    if (lowerMessage.includes('chickpea') || lowerMessage.includes('gram')) {
      return {
        success: true,
        response: 'Chickpea cultivation: Plant in October-November (Rabi season), needs 60-90cm rainfall, grows best in black cotton/alluvial soil. Drought tolerant crop, fixes nitrogen in soil. Varieties: Desi (small seed), Kabuli (large seed). 💡 Chickpea improves soil fertility for next crop and has high protein content.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('kidneybeans') || lowerMessage.includes('kidney beans') || lowerMessage.includes('rajma')) {
      return {
        success: true,
        response: 'Kidney beans cultivation: Plant in October-November, needs cool climate (15-25°C), grows best in well-drained loamy soil. Requires moderate water and good drainage. High protein crop with excellent market value. 💡 Kidney beans are premium pulse crop with export potential and high nutritional value.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('pigeonpeas') || lowerMessage.includes('pigeon peas') || lowerMessage.includes('arhar') || lowerMessage.includes('tur')) {
      return {
        success: true,
        response: 'Pigeon peas cultivation: Plant in June-July, needs 90-200cm rainfall, grows in various soils including red laterite. Drought tolerant, fixes nitrogen, improves soil health. Long duration crop (150-180 days). 💡 Pigeon peas can be intercropped with cotton, maize, or sorghum for additional income.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('mungbean') || lowerMessage.includes('mung bean') || lowerMessage.includes('moong')) {
      return {
        success: true,
        response: 'Mung bean cultivation: Plant in June-July (Kharif) or March-April (Summer), needs 60-100cm rainfall, grows in loamy soil. Short duration crop (60-70 days), fixes nitrogen. Good for crop rotation and intercropping. 💡 Mung beans can give 3 crops per year and improve soil fertility naturally.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('blackgram') || lowerMessage.includes('black gram') || lowerMessage.includes('urad')) {
      return {
        success: true,
        response: 'Black gram cultivation: Plant in June-July (Kharif) or October-November (Rabi), needs 60-100cm rainfall, grows in red laterite/alluvial soil. Drought tolerant, fixes nitrogen. Duration 75-90 days. 💡 Black gram is excellent for soil health improvement and has high market demand for dal production.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('lentil') || lowerMessage.includes('masoor')) {
      return {
        success: true,
        response: 'Lentil cultivation: Plant in October-November (Rabi season), needs 50-80cm rainfall, grows best in loamy/alluvial soil. Cool season crop, drought tolerant, fixes nitrogen. Duration 95-110 days. 💡 Lentils are high-protein crop with excellent export potential and improve soil for next crop.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('mothbeans') || lowerMessage.includes('moth beans') || lowerMessage.includes('moth')) {
      return {
        success: true,
        response: 'Moth beans cultivation: Plant in July-August, needs 40-80cm rainfall, grows in sandy/red laterite soil. Extremely drought tolerant, suitable for arid regions. Short duration (75-90 days), fixes nitrogen. 💡 Moth beans are perfect for drought-prone areas and improve soil fertility in harsh conditions.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    // FRUITS & HORTICULTURE
    if (lowerMessage.includes('apple')) {
      return {
        success: true,
        response: 'Apple cultivation: Plant in winter, needs cool climate (8-25°C), grows best in well-drained loamy soil at high altitude (1500-3000m). Requires chilling hours for fruit development. Varieties: Red Delicious, Golden Delicious, Gala. 💡 Apple orchards are long-term investment with high returns in hill regions.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('banana')) {
      return {
        success: true,
        response: 'Banana cultivation: Plant year-round, needs warm humid climate (25-35°C), grows best in alluvial/loamy soil with good drainage. Requires regular water and wind protection. Varieties: Robusta (cooking), Dwarf Cavendish (table), Red banana (premium). 💡 Banana gives quick returns (12-15 months) and high yield per hectare.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('grapes')) {
      return {
        success: true,
        response: 'Grapes cultivation: Plant in monsoon, needs moderate climate (15-30°C), grows best in black cotton/red laterite soil with good drainage. Requires trellising and pruning. Varieties: Thompson Seedless (table), Bangalore Blue (juice), Anab-e-Shahi (table). 💡 Grapes are high-value crop with export potential and wine-making opportunities.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('mango')) {
      return {
        success: true,
        response: 'Mango cultivation: Plant in monsoon, needs tropical climate (25-35°C), grows in various soils with good drainage. Long-term crop, starts bearing in 3-5 years. Varieties: Alphonso (premium), Dasheri (table), Totapuri (processing). 💡 Mango is king of fruits with excellent domestic and export market potential.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('orange')) {
      return {
        success: true,
        response: 'Orange cultivation: Plant in monsoon, needs subtropical climate (15-30°C), grows best in well-drained loamy soil. Requires regular irrigation and pest management. Varieties: Nagpur orange (famous), Mosambi (sweet lime), Blood orange (specialty). 💡 Orange orchards provide steady income and are suitable for medium-scale farming.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('papaya')) {
      return {
        success: true,
        response: 'Papaya cultivation: Plant year-round, needs warm climate (25-35°C), grows in well-drained loamy soil. Fast-growing crop, starts bearing in 8-12 months. Varieties: Red Lady (hybrid), Pusa Dwarf (compact), Solo (small fruit). 💡 Papaya gives quick returns and continuous harvest for 4-5 years.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('pomegranate')) {
      return {
        success: true,
        response: 'Pomegranate cultivation: Plant in monsoon, needs semi-arid climate (15-35°C), grows best in red laterite/black cotton soil with good drainage. Drought tolerant once established. Varieties: Bhagwa (red), Ganesh (pink), Ruby (deep red). 💡 Pomegranate is premium fruit with excellent export potential and medicinal properties.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('watermelon')) {
      return {
        success: true,
        response: 'Watermelon cultivation: Plant in February-March (summer) or June-July (monsoon), needs warm climate (25-35°C), grows in sandy/loamy soil with good drainage. Requires plenty of water during fruit development. 💡 Watermelon is profitable summer crop with high water content, perfect for hot climate regions.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('muskmelon')) {
      return {
        success: true,
        response: 'Muskmelon cultivation: Plant in February-March, needs warm dry climate (25-35°C), grows in sandy/loamy soil with excellent drainage. Requires careful water management - reduce watering near harvest. Varieties: Hara Madhu, Pusa Madhuras. 💡 Muskmelon is high-value summer fruit with sweet aroma and good market demand.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('coconut')) {
      return {
        success: true,
        response: 'Coconut cultivation: Plant in monsoon, needs tropical coastal climate (25-35°C), grows in sandy/alluvial soil with good drainage. Requires high humidity and regular water. Varieties: Tall (traditional), Dwarf (early bearing), Hybrid (high yield). 💡 Coconut is complete tree - every part is useful, provides income throughout the year.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    // VEGETABLES & OTHERS
    if (lowerMessage.includes('tomato') || lowerMessage.includes('tamato')) {
      return {
        success: true,
        response: 'Tomato cultivation: Plant year-round with proper varieties, needs well-drained soil, requires regular watering and support. Varieties: Determinate (bush type), Indeterminate (vine type), Cherry tomatoes (small fruits). 💡 Stake tall varieties and prune suckers for better fruit development.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('sugarcane')) {
      return {
        success: true,
        response: 'Sugarcane cultivation: Plant in February-March or October-November, needs warm humid climate (20-40°C), grows best in black cotton/alluvial soil. Long duration crop (12-18 months), requires plenty of water. 💡 Sugarcane provides multiple harvests (ratoon crops) and has guaranteed government procurement.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('groundnut') || lowerMessage.includes('peanut')) {
      return {
        success: true,
        response: 'Groundnut cultivation: Plant in June-July (Kharif) or November-December (Rabi), needs 50-75cm rainfall, grows best in red laterite/sandy soil. Drought tolerant oilseed crop. Duration 120-140 days. 💡 Groundnut fixes nitrogen in soil and has excellent oil content with good market demand.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      response: 'Each crop has specific requirements for soil, climate, and management. Choose varieties suited to your local conditions, follow recommended planting times, and use proper cultural practices. 💡 Consult local agricultural extension services for region-specific advice.',
      source: 'FarmX Assistant',
      timestamp: new Date().toISOString()
    };
  }

  // GENERAL FARMING QUESTIONS
  isGeneralFarmingQuestion(message) {
    return message.includes('farming') || message.includes('agriculture') || message.includes('crop rotation') || 
           message.includes('organic') || message.includes('yield') || message.includes('profit') || 
           message.includes('sustainable') || message.includes('hello') || message.includes('hi') || 
           message.includes('who are you') || message.includes('what are you');
  }

  getGeneralFarmingResponse(lowerMessage) {
    if (lowerMessage.includes('crop rotation')) {
      return {
        success: true,
        response: 'Crop rotation improves soil health and reduces pests. Rotate between cereals, legumes, and cash crops. Example: Rice → Wheat → Legumes → Cotton. Legumes fix nitrogen, cereals use it, cash crops provide income. 💡 Never grow the same crop family continuously in the same field.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('organic farming')) {
      return {
        success: true,
        response: 'Organic farming uses natural methods: compost, crop rotation, biological pest control, and avoiding synthetic chemicals. Start gradually by reducing chemical inputs and building soil health with organic matter. 💡 Organic certification can increase market value by 20-30%.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('yield') || lowerMessage.includes('increase production')) {
      return {
        success: true,
        response: 'To increase yield: Use quality seeds, maintain soil health, apply balanced fertilizers, ensure proper irrigation, control pests/diseases, and follow recommended practices. Soil testing and timely operations are crucial. 💡 Focus on soil health first - healthy soil produces healthy crops with higher yields.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('profit') || lowerMessage.includes('income')) {
      return {
        success: true,
        response: 'To increase farm profits: Choose high-value crops, reduce input costs, improve quality, add value through processing, and market directly to consumers when possible. Keep detailed records to track profitability. 💡 Diversification reduces risk and can increase overall income.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('sustainable')) {
      return {
        success: true,
        response: 'Sustainable farming balances productivity, environmental health, and economic viability. Use integrated pest management, conserve water, maintain soil health, and preserve biodiversity. 💡 Sustainable practices ensure long-term farm productivity and environmental protection.',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return {
        success: true,
        response: 'Hello! I\'m your FarmX AI Assistant, ready to help with all your farming questions. Ask me about crops, soil, weather, fertilizers, pest control, or any agricultural practices! 🌾',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    if (lowerMessage.includes('who are you') || lowerMessage.includes('what are you')) {
      return {
        success: true,
        response: 'I\'m FarmX AI Assistant, your personal farming expert! I help with crop recommendations, soil analysis, weather insights, fertilizer advice, pest control, and agricultural best practices for Indian farmers. How can I help you today? 🌱',
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      response: 'Good farming practices include: soil testing, using quality seeds, balanced fertilization, proper irrigation, integrated pest management, and keeping farm records. Focus on soil health as the foundation of successful farming. 💡 Continuous learning and adaptation are key to farming success.',
      source: 'FarmX Assistant',
      timestamp: new Date().toISOString()
    };
  }

  getSoilSpecificCrops(soilType) {
    const soilCropMap = {
      'Black Cotton Soil': 'cotton, wheat, maize, sugarcane, soybean, chickpea, grapes, and pomegranate (excellent fertility and moisture retention)',
      'Red Laterite Soil': 'groundnut, millets, cotton, cashew, pigeonpeas, blackgram, pomegranate, and mango (needs lime and organic matter for better results)',
      'Alluvial Soil': 'rice, wheat, maize, sugarcane, vegetables, banana, mango, orange, papaya, kidneybeans, lentil, and mungbean (most fertile soil with excellent water retention)',
      'Sandy Soil': 'millets, groundnut, watermelon, muskmelon, coconut, and mothbeans (good drainage but needs frequent irrigation)',
      'Peaty Soil': 'rice and other water-loving crops (high organic matter, good for paddy cultivation)',
      'Red Soil': 'cotton, groundnut, millets, pulses, pigeonpeas, and blackgram (good drainage, may need pH correction)',
      'Clay Soil': 'rice, wheat, jute, and water-retentive crops (heavy soil, excellent for paddy fields)',
      'Loamy Soil': 'most crops including vegetables, fruits, cereals, apple, orange, papaya, chickpea, kidneybeans, lentil, and mungbean (ideal balanced soil)',
      'Well-drained Soil': 'apple, grapes, pomegranate, and other fruit crops (excellent for horticulture)'
    };
    
    return soilCropMap[soilType] || 'crops suitable for your specific soil type based on its unique properties';
  }

  extractCrop(message) {
    const crops = [
      // Cereals & Food Grains
      'rice', 'wheat', 'maize', 'corn',
      // Cash Crops  
      'cotton', 'sugarcane', 'jute', 'coffee',
      // Pulses & Legumes
      'chickpea', 'kidneybeans', 'kidney beans', 'pigeonpeas', 'pigeon peas', 
      'mothbeans', 'moth beans', 'mungbean', 'mung bean', 'blackgram', 'black gram', 'lentil',
      // Fruits & Horticulture
      'apple', 'banana', 'grapes', 'mango', 'orange', 'papaya', 'pomegranate', 
      'watermelon', 'muskmelon', 'coconut',
      // Vegetables & Others
      'tomato', 'potato', 'onion', 'chili', 'brinjal', 'groundnut', 'mustard', 
      'gram', 'peas', 'barley', 'millets', 'sorghum'
    ];
    const lowerMessage = message.toLowerCase();
    
    for (const crop of crops) {
      if (lowerMessage.includes(crop)) {
        // Normalize crop names
        if (crop === 'corn') return 'maize';
        if (crop === 'kidney beans') return 'kidneybeans';
        if (crop === 'pigeon peas') return 'pigeonpeas';
        if (crop === 'moth beans') return 'mothbeans';
        if (crop === 'mung bean') return 'mungbean';
        if (crop === 'black gram') return 'blackgram';
        return crop;
      }
    }
    return null;
  }
}

module.exports = new CropService();