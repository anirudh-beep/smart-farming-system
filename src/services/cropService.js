const axios = require('axios');
const datasetService = require('./datasetService');

class CropService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    
    this.cropDatabase = {
      'Rice': {
        soilTypes: ['Black Cotton Soil', 'Alluvial Soil'],
        phRange: [5.5, 7.0],
        temperature: [20, 35],
        rainfall: [100, 200],
        growthDuration: 120,
        waterNeeds: 'High',
        yield: '4-6 tons/hectare',
        marketPrice: 2500,
        profitability: 'Medium'
      },
      'Wheat': {
        soilTypes: ['Alluvial Soil', 'Black Cotton Soil'],
        phRange: [6.0, 7.5],
        temperature: [10, 25],
        rainfall: [50, 100],
        growthDuration: 150,
        waterNeeds: 'Medium',
        yield: '3-5 tons/hectare',
        marketPrice: 2200,
        profitability: 'High'
      },
      'Cotton': {
        soilTypes: ['Black Cotton Soil'],
        phRange: [5.8, 8.0],
        temperature: [15, 35],
        rainfall: [50, 100],
        growthDuration: 180,
        waterNeeds: 'Medium',
        yield: '1.5-2.5 tons/hectare',
        marketPrice: 6000,
        profitability: 'High'
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
        profitability: 'Medium'
      },
      'Maize': {
        soilTypes: ['Alluvial Soil', 'Red Laterite Soil'],
        phRange: [6.0, 7.0],
        temperature: [18, 32],
        rainfall: [60, 120],
        growthDuration: 90,
        waterNeeds: 'Medium',
        yield: '5-8 tons/hectare',
        marketPrice: 2000,
        profitability: 'Medium'
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
        profitability: 'High'
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
      recommendedCrops: suitableCrops.slice(0, 5), // Top 5 recommendations
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
}

module.exports = new CropService();