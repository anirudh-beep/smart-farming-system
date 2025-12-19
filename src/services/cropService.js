const axios = require('axios');
const datasetService = require('./datasetService');

class CropService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
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

      const prompt = `You are FarmX AI Assistant, a helpful farming expert for Indian agriculture. 
      
Context: ${contextInfo}

User question: ${message}

Please provide a helpful, practical answer about farming, crops, soil, weather, or agricultural practices. Keep responses concise (2-3 sentences max), friendly, and focused on actionable advice for Indian farmers. If the question is not related to farming, politely redirect to agricultural topics.

Use simple language and include practical tips when relevant. If you mention specific recommendations, relate them to the user's context when available.`;

      // Try Gemini API with correct endpoint and model name
      if (this.geminiApiKey) {
        try {
          console.log('Attempting Gemini API call...');
          
          // Use the correct Gemini API endpoint with proper model name
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
            {
              contents: [{
                parts: [{
                  text: prompt
                }]
              }]
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
          }
        } catch (apiError) {
          console.error('Gemini API error:', apiError.response?.status, apiError.response?.statusText);
          console.error('Gemini API error details:', apiError.response?.data);
          console.log('Falling back to intelligent responses...');
        }
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
    
    // Direct questions about best soil for specific crops
    if (lowerMessage.includes('which soil') && lowerMessage.includes('best')) {
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
          response: 'The best soils for rice are Alluvial soil and Black cotton soil. Rice needs soil that can retain water well. Alluvial soil in river deltas is perfect for rice cultivation. Black cotton soil also works well due to its water retention capacity. 💡 Rice grows best in pH 5.5-7.0.',
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
      }
    }
    
    // Specific soil-crop compatibility questions
    if (lowerMessage.includes('red soil') || lowerMessage.includes('red laterite')) {
      if (lowerMessage.includes('wheat')) {
        return {
          success: true,
          response: 'Red soil can grow wheat, but it\'s not the best choice. Red soil is better for groundnut, millets, and cashew. For wheat, black cotton soil or alluvial soil work better. 💡 If you must grow wheat in red soil, add organic matter and ensure proper irrigation.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      } else if (lowerMessage.includes('crop') || lowerMessage.includes('good')) {
        return {
          success: true,
          response: 'Red laterite soil is excellent for groundnut, millets, cashew, coconut, and spices. It\'s well-drained but needs organic matter for better fertility. 💡 Crops that tolerate slightly acidic conditions do well in red soil.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
    }
    
    if (lowerMessage.includes('black soil') || lowerMessage.includes('cotton soil')) {
      if (lowerMessage.includes('wheat')) {
        return {
          success: true,
          response: 'Black cotton soil is excellent for wheat! It retains moisture well and has good fertility. Plant wheat in October-November for best results. 💡 Black soil is also great for cotton, sugarcane, and soybean.',
          source: 'FarmX Assistant',
          timestamp: new Date().toISOString()
        };
      }
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
    }
    
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
    
    if (lowerMessage.includes('soil') && (lowerMessage.includes('improve') || lowerMessage.includes('fertility'))) {
      let response = 'To improve soil fertility, add organic matter like compost or cow dung, rotate crops, and use appropriate fertilizers based on soil testing.';
      if (context.soilData) {
        if (context.soilData.ph < 6.0) {
          response += ' Your soil is acidic - add lime to balance pH.';
        } else if (context.soilData.ph > 8.0) {
          response += ' Your soil is alkaline - add organic matter to balance pH.';
        }
      }
      response += ' 💡 Test your soil annually to track improvements.';
      return {
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
      let response = 'Water crops early morning or evening to reduce evaporation. Use drip irrigation for water efficiency.';
      if (context.weatherData?.current?.rainfall < 20) {
        response += ' With low rainfall expected, plan for regular irrigation.';
      } else if (context.weatherData?.current?.rainfall > 100) {
        response += ' With heavy rainfall expected, ensure proper drainage.';
      }
      response += ' 💡 Mulching helps retain soil moisture.';
      return {
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      };
    }
    
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
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            success: true,
            response: `Your soil nutrient levels look balanced (N:${context.soilData.nitrogen}, P:${context.soilData.phosphorus}, K:${context.soilData.potassium}). Use maintenance doses of NPK fertilizers. 💡 Continue with organic matter to maintain soil health.`,
            timestamp: new Date().toISOString()
          };
        }
      }
      return {
        success: true,
        response: 'Use fertilizers based on soil test results. NPK fertilizers provide essential nutrients. Apply in split doses during crop growth stages. 💡 Combine with organic fertilizers for best results.',
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerMessage.includes('weather') || lowerMessage.includes('rain')) {
      let response = 'Monitor weather forecasts regularly for farming decisions.';
      if (context.weatherData?.current) {
        response += ` Current conditions: ${context.weatherData.current.temperature}°C, ${context.weatherData.current.condition}.`;
        if (context.weatherData.current.rainfall > 50) {
          response += ' Heavy rain expected - ensure proper drainage.';
        } else if (context.weatherData.current.rainfall < 10) {
          response += ' Low rainfall - plan irrigation accordingly.';
        }
      }
      response += ' 💡 Use weather data to time planting and harvesting.';
      return {
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerMessage.includes('pest') || lowerMessage.includes('disease')) {
      return {
        success: true,
        response: 'Regular field inspection helps detect pests and diseases early. Use integrated pest management combining biological, cultural, and chemical methods. 💡 Healthy soil and proper spacing reduce disease risk.',
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerMessage.includes('plant') || lowerMessage.includes('sow') || lowerMessage.includes('when')) {
      let response = 'Plant timing depends on crop type and local climate. Kharif crops are planted during monsoon (June-July), Rabi crops in winter (October-December).';
      if (context.location) {
        response += ` For ${context.location.district}, ${context.location.state}, consult local agricultural calendar.`;
      }
      response += ' 💡 Check current weather conditions before planting.';
      return {
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('market')) {
      return {
        success: true,
        response: 'Market prices vary by location and season. Check local mandis (markets) for current rates. Consider crops with good demand in your area. 💡 Value-added crops often fetch better prices.',
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerMessage.includes('organic') || lowerMessage.includes('natural')) {
      return {
        success: true,
        response: 'Organic farming uses natural methods like compost, crop rotation, and biological pest control. Start gradually by reducing chemical inputs and building soil health. 💡 Organic certification can increase market value.',
        timestamp: new Date().toISOString()
      };
    }
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return {
        success: true,
        response: `Hello! I'm your FarmX AI Assistant. ${context.location ? `I see you're from ${context.location.district}, ${context.location.state}. ` : ''}Ask me anything about farming, crops, soil, or weather!`,
        source: 'FarmX Assistant',
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerMessage.includes('who are you') || lowerMessage.includes('what are you')) {
      return {
        success: true,
        response: 'I\'m FarmX AI Assistant, your personal farming expert! I help with crop recommendations, soil analysis, weather insights, and agricultural best practices for Indian farmers. How can I help you today?',
        timestamp: new Date().toISOString()
      };
    }
    
    // Default response
    return {
      success: true,
      response: 'I\'m here to help with farming questions! Ask me about crops, soil, weather, fertilizers, or any agricultural practices. You can also complete your location and soil analysis for personalized recommendations.',
      source: 'FarmX Assistant',
      timestamp: new Date().toISOString()
    };
  }
  
  getSoilSpecificCrops(soilType) {
    const soilCropMap = {
      'Black Cotton Soil': 'cotton, sugarcane, wheat, and soybean',
      'Red Laterite Soil': 'groundnut, millets, cashew, and coconut',
      'Alluvial Soil': 'rice, wheat, maize, and sugarcane',
      'Sandy Soil': 'millets, groundnut, and drought-resistant crops',
      'Peaty Soil': 'rice and other water-loving crops'
    };
    
    return soilCropMap[soilType] || 'crops suitable for your soil type';
  }
}

module.exports = new CropService();