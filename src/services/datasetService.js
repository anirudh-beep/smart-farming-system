const fs = require('fs');
const path = require('path');

class DatasetService {
  constructor() {
    this.datasetPath = path.join(__dirname, '../../dataset.csv');
    this.cropRecommendationPath = path.join(__dirname, '../../Crop_recommendation.csv');
    this.data = [];
    this.cropRecommendationData = [];
    this.isLoading = false;
    
    console.log('📊 DatasetService initializing...');
    console.log('   • Dataset path:', this.datasetPath);
    console.log('   • Crop recommendation path:', this.cropRecommendationPath);
    
    // Load datasets asynchronously to avoid blocking server startup
    this.initializeDatasets();
  }

  async initializeDatasets() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // Use setTimeout to make loading non-blocking
      setTimeout(() => {
        this.loadDataset();
        this.loadCropRecommendationDataset();
        this.isLoading = false;
      }, 100);
    } catch (error) {
      console.error('Dataset initialization error:', error.message);
      this.isLoading = false;
    }
  }

  loadDataset() {
    try {
      if (!fs.existsSync(this.datasetPath)) {
        console.warn('Dataset file not found:', this.datasetPath);
        return;
      }
      
      const csvContent = fs.readFileSync(this.datasetPath, 'utf8');
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',');
      
      this.data = lines.slice(1).map(line => {
        const values = line.split(',');
        const record = {};
        headers.forEach((header, index) => {
          record[header.trim()] = values[index]?.trim();
        });
        return record;
      });
      
      console.log(`✅ Loaded ${this.data.length} records from dataset`);
    } catch (error) {
      console.error('❌ Error loading dataset:', error.message);
      this.data = [];
    }
  }

  loadCropRecommendationDataset() {
    try {
      if (!fs.existsSync(this.cropRecommendationPath)) {
        console.warn('Crop recommendation dataset file not found:', this.cropRecommendationPath);
        return;
      }
      
      const csvContent = fs.readFileSync(this.cropRecommendationPath, 'utf8');
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(header => header.trim().replace(/\r/g, ''));
      
      this.cropRecommendationData = lines.slice(1).map(line => {
        const values = line.split(',').map(value => value.trim().replace(/\r/g, ''));
        const record = {};
        headers.forEach((header, index) => {
          const value = values[index];
          // Convert numeric values
          if (header === 'N' || header === 'P' || header === 'K' || 
              header === 'temperature' || header === 'humidity' || 
              header === 'ph' || header === 'rainfall') {
            record[header] = parseFloat(value) || 0;
          } else {
            record[header] = value;
          }
        });
        return record;
      });
      
      console.log(`✅ Loaded ${this.cropRecommendationData.length} crop recommendation records`);
      
      // Analyze crop distribution
      const cropCounts = {};
      this.cropRecommendationData.forEach(record => {
        if (record.label) {
          cropCounts[record.label] = (cropCounts[record.label] || 0) + 1;
        }
      });
      console.log('🌾 Available crops:', Object.keys(cropCounts).sort());
      
    } catch (error) {
      console.error('❌ Error loading crop recommendation dataset:', error.message);
      this.cropRecommendationData = [];
    }
  }

  findLocationData(state, district) {
    return this.data.filter(record => 
      record.state?.toLowerCase() === state?.toLowerCase() && 
      record.district?.toLowerCase() === district?.toLowerCase()
    );
  }

  getSoilDataForLocation(state, district, month = null) {
    let locationData = this.findLocationData(state, district);
    
    if (month) {
      const monthData = locationData.filter(record => 
        record.month?.toLowerCase() === month?.toLowerCase()
      );
      if (monthData.length > 0) {
        locationData = monthData;
      }
    }

    if (locationData.length === 0) {
      return null;
    }

    // Get the most recent or average data
    const record = locationData[0];
    
    return {
      type: this.mapSoilType(record.soil_type),
      ph: parseFloat(record.soil_pH) || 7.0,
      nitrogen: this.categorizeNutrient(parseFloat(record.nitrogen_mgkg), 'nitrogen'),
      phosphorus: this.categorizeNutrient(parseFloat(record.phosphorus_mgkg), 'phosphorus'),
      potassium: this.categorizeNutrient(parseFloat(record.potassium_mgkg), 'potassium'),
      organicMatter: parseFloat(record.organic_carbon_pct) || 1.0,
      texture: record.soil_texture || 'Loam',
      electricalConductivity: parseFloat(record.electrical_conductivity_dSm) || 0.3,
      coordinates: {
        latitude: parseFloat(record.latitude),
        longitude: parseFloat(record.longitude)
      }
    };
  }

  getWeatherDataForLocation(state, district, month = null) {
    let locationData = this.findLocationData(state, district);
    
    if (month) {
      const monthData = locationData.filter(record => 
        record.month?.toLowerCase() === month?.toLowerCase()
      );
      if (monthData.length > 0) {
        locationData = monthData;
      }
    }

    if (locationData.length === 0) {
      return null;
    }

    const record = locationData[0];
    
    return {
      temperature: parseFloat(record.avg_temperature_C) || 25,
      rainfall: parseFloat(record.rainfall_mm) || 100,
      humidity: parseFloat(record.humidity_pct) || 60,
      windSpeed: parseFloat(record.wind_speed_kmh) || 5,
      month: record.month
    };
  }

  mapSoilType(soilType) {
    const mapping = {
      'Black': 'Black Cotton Soil',
      'Red': 'Red Laterite Soil',
      'Alluvial': 'Alluvial Soil',
      'Laterite': 'Red Laterite Soil',
      'Desert': 'Sandy Soil',
      'Peaty': 'Peaty Soil'
    };
    
    return mapping[soilType] || soilType || 'Mixed Soil';
  }

  categorizeNutrient(value, nutrientType) {
    if (!value || isNaN(value)) return 'Medium';
    
    const thresholds = {
      nitrogen: { low: 200, high: 300 },
      phosphorus: { low: 10, high: 20 },
      potassium: { low: 150, high: 250 }
    };
    
    const threshold = thresholds[nutrientType] || thresholds.nitrogen;
    
    if (value < threshold.low) return 'Low';
    if (value > threshold.high) return 'High';
    return 'Medium';
  }

  getAvailableLocations() {
    const locations = {};
    
    this.data.forEach(record => {
      const state = record.state;
      const district = record.district;
      
      if (!locations[state]) {
        locations[state] = new Set();
      }
      locations[state].add(district);
    });
    
    // Convert Sets to Arrays
    Object.keys(locations).forEach(state => {
      locations[state] = Array.from(locations[state]);
    });
    
    return locations;
  }

  getCropRecommendationsFromDataset(soilData, weatherData) {
    const recommendations = [];
    
    // Get ML-based recommendations from crop recommendation dataset
    const mlRecommendations = this.getMLCropRecommendations(soilData, weatherData);
    recommendations.push(...mlRecommendations);
    
    // Legacy rule-based recommendations (keep for fallback)
    const ruleBasedRecommendations = this.getRuleBasedRecommendations(soilData, weatherData);
    
    // Merge and deduplicate recommendations
    const mergedRecommendations = this.mergeRecommendations(recommendations, ruleBasedRecommendations);
    
    return mergedRecommendations.sort((a, b) => b.suitability - a.suitability);
  }

  getMLCropRecommendations(soilData, weatherData) {
    const recommendations = [];
    
    // Create input vector from user's conditions
    const userConditions = {
      N: this.convertNutrientToNumeric(soilData.nitrogen, 'nitrogen'),
      P: this.convertNutrientToNumeric(soilData.phosphorus, 'phosphorus'),
      K: this.convertNutrientToNumeric(soilData.potassium, 'potassium'),
      temperature: weatherData.temperature || 25,
      humidity: weatherData.humidity || 60,
      ph: soilData.ph || 7.0,
      rainfall: weatherData.rainfall || 100
    };
    
    // Get all unique crops from the dataset
    const availableCrops = [...new Set(this.cropRecommendationData.map(record => record.label))];
    
    // Calculate suitability score for each crop
    availableCrops.forEach(crop => {
      const cropData = this.cropRecommendationData.filter(record => record.label === crop);
      const suitabilityScore = this.calculateCropSuitabilityScore(userConditions, cropData);
      
      if (suitabilityScore > 0.5) { // Only recommend crops with >50% suitability
        recommendations.push({
          crop: this.formatCropName(crop),
          suitability: suitabilityScore,
          reason: this.generateRecommendationReason(crop, userConditions, cropData),
          expectedYield: this.getExpectedYield(crop),
          category: this.getCropCategory(crop),
          marketValue: this.getMarketValue(crop),
          growthDuration: this.getGrowthDuration(crop)
        });
      }
    });
    
    return recommendations;
  }

  calculateCropSuitabilityScore(userConditions, cropData) {
    if (cropData.length === 0) return 0;
    
    let totalScore = 0;
    let validSamples = 0;
    
    // Calculate similarity with each sample in the dataset
    cropData.forEach(sample => {
      const similarity = this.calculateConditionSimilarity(userConditions, sample);
      if (similarity > 0.3) { // Only consider reasonably similar conditions
        totalScore += similarity;
        validSamples++;
      }
    });
    
    return validSamples > 0 ? totalScore / validSamples : 0;
  }

  calculateConditionSimilarity(userConditions, sampleConditions) {
    const weights = {
      N: 0.15,
      P: 0.15,
      K: 0.15,
      temperature: 0.20,
      humidity: 0.10,
      ph: 0.15,
      rainfall: 0.10
    };
    
    let totalSimilarity = 0;
    
    Object.keys(weights).forEach(param => {
      const userValue = userConditions[param];
      const sampleValue = sampleConditions[param];
      
      if (userValue !== undefined && sampleValue !== undefined) {
        const normalizedDiff = this.getNormalizedDifference(param, userValue, sampleValue);
        const similarity = Math.max(0, 1 - normalizedDiff);
        totalSimilarity += similarity * weights[param];
      }
    });
    
    return totalSimilarity;
  }

  getNormalizedDifference(param, value1, value2) {
    const ranges = {
      N: 120,        // Max N range in dataset
      P: 145,        // Max P range in dataset  
      K: 205,        // Max K range in dataset
      temperature: 35, // Reasonable temperature range
      humidity: 85,    // Humidity range
      ph: 6,          // pH range (3-9)
      rainfall: 280    // Rainfall range
    };
    
    const maxRange = ranges[param] || 100;
    return Math.abs(value1 - value2) / maxRange;
  }

  convertNutrientToNumeric(nutrientLevel, nutrientType) {
    const conversions = {
      nitrogen: { 'Low': 40, 'Medium': 80, 'High': 120 },
      phosphorus: { 'Low': 20, 'Medium': 50, 'High': 80 },
      potassium: { 'Low': 50, 'Medium': 120, 'High': 180 }
    };
    
    return conversions[nutrientType]?.[nutrientLevel] || conversions[nutrientType]?.['Medium'] || 50;
  }

  formatCropName(crop) {
    const nameMapping = {
      'rice': 'Rice',
      'maize': 'Maize', 
      'cotton': 'Cotton',
      'chickpea': 'Chickpea',
      'kidneybeans': 'Kidney Beans',
      'pigeonpeas': 'Pigeon Peas',
      'mothbeans': 'Moth Beans',
      'mungbean': 'Mung Bean',
      'blackgram': 'Black Gram',
      'lentil': 'Lentil',
      'pomegranate': 'Pomegranate',
      'banana': 'Banana',
      'mango': 'Mango',
      'grapes': 'Grapes',
      'watermelon': 'Watermelon',
      'muskmelon': 'Muskmelon',
      'apple': 'Apple',
      'orange': 'Orange',
      'papaya': 'Papaya',
      'coconut': 'Coconut',
      'jute': 'Jute',
      'coffee': 'Coffee'
    };
    
    return nameMapping[crop.toLowerCase()] || crop;
  }

  generateRecommendationReason(crop, userConditions, cropData) {
    const avgConditions = this.calculateAverageConditions(cropData);
    const reasons = [];
    
    // Check which conditions are favorable
    if (Math.abs(userConditions.temperature - avgConditions.temperature) < 5) {
      reasons.push('optimal temperature');
    }
    if (Math.abs(userConditions.ph - avgConditions.ph) < 1) {
      reasons.push('suitable pH level');
    }
    if (Math.abs(userConditions.rainfall - avgConditions.rainfall) < 50) {
      reasons.push('appropriate rainfall');
    }
    
    const category = this.getCropCategory(crop);
    if (category === 'fruit') {
      reasons.push('high market value fruit crop');
    } else if (category === 'pulse') {
      reasons.push('nitrogen-fixing legume crop');
    }
    
    return reasons.length > 0 ? 
      `Good match: ${reasons.join(', ')}` : 
      'Suitable based on similar growing conditions';
  }

  calculateAverageConditions(cropData) {
    const totals = { N: 0, P: 0, K: 0, temperature: 0, humidity: 0, ph: 0, rainfall: 0 };
    
    cropData.forEach(sample => {
      Object.keys(totals).forEach(key => {
        totals[key] += sample[key] || 0;
      });
    });
    
    const count = cropData.length;
    Object.keys(totals).forEach(key => {
      totals[key] = totals[key] / count;
    });
    
    return totals;
  }

  getCropCategory(crop) {
    const categories = {
      fruit: ['apple', 'banana', 'mango', 'grapes', 'watermelon', 'muskmelon', 'orange', 'papaya', 'pomegranate', 'coconut'],
      pulse: ['chickpea', 'kidneybeans', 'pigeonpeas', 'mothbeans', 'mungbean', 'blackgram', 'lentil'],
      cereal: ['rice', 'maize'],
      cash: ['cotton', 'jute', 'coffee']
    };
    
    for (const [category, crops] of Object.entries(categories)) {
      if (crops.includes(crop.toLowerCase())) {
        return category;
      }
    }
    return 'other';
  }

  getExpectedYield(crop) {
    const yields = {
      'rice': '4-6 tons/hectare',
      'maize': '5-8 tons/hectare',
      'cotton': '1.5-2.5 tons/hectare',
      'chickpea': '1.5-2.5 tons/hectare',
      'kidneybeans': '1-2 tons/hectare',
      'pigeonpeas': '1.5-2 tons/hectare',
      'mothbeans': '0.8-1.2 tons/hectare',
      'mungbean': '1-1.5 tons/hectare',
      'blackgram': '1-1.5 tons/hectare',
      'lentil': '1.2-1.8 tons/hectare',
      'pomegranate': '15-25 tons/hectare',
      'banana': '40-60 tons/hectare',
      'mango': '10-15 tons/hectare',
      'grapes': '20-30 tons/hectare',
      'watermelon': '25-35 tons/hectare',
      'muskmelon': '15-25 tons/hectare',
      'apple': '15-25 tons/hectare',
      'orange': '20-30 tons/hectare',
      'papaya': '50-80 tons/hectare',
      'coconut': '12,000-15,000 nuts/hectare',
      'jute': '2.5-3.5 tons/hectare',
      'coffee': '1.5-2.5 tons/hectare'
    };
    
    return yields[crop.toLowerCase()] || '2-4 tons/hectare';
  }

  getMarketValue(crop) {
    const marketValues = {
      'pomegranate': 'Premium (₹80-120/kg)',
      'grapes': 'High (₹60-100/kg)',
      'apple': 'High (₹80-150/kg)',
      'mango': 'High (₹40-80/kg)',
      'coffee': 'Premium (₹200-400/kg)',
      'banana': 'Medium (₹20-40/kg)',
      'orange': 'Medium (₹30-50/kg)',
      'papaya': 'Medium (₹15-25/kg)',
      'coconut': 'Medium (₹15-25/nut)',
      'cotton': 'High (₹5000-7000/quintal)',
      'rice': 'Medium (₹2000-3000/quintal)',
      'maize': 'Medium (₹1800-2500/quintal)',
      'chickpea': 'High (₹4000-6000/quintal)',
      'lentil': 'High (₹5000-8000/quintal)',
      'kidneybeans': 'Premium (₹8000-12000/quintal)',
      'pigeonpeas': 'High (₹5000-7000/quintal)',
      'mungbean': 'High (₹6000-9000/quintal)',
      'blackgram': 'High (₹6000-8000/quintal)',
      'mothbeans': 'Medium (₹4000-6000/quintal)',
      'watermelon': 'Medium (₹8-15/kg)',
      'muskmelon': 'Medium (₹15-25/kg)',
      'jute': 'Medium (₹3000-4000/quintal)'
    };
    
    return marketValues[crop.toLowerCase()] || 'Medium (₹2000-4000/quintal)';
  }

  getGrowthDuration(crop) {
    const durations = {
      'rice': '120-150 days',
      'maize': '90-120 days', 
      'cotton': '180-200 days',
      'chickpea': '90-120 days',
      'kidneybeans': '90-110 days',
      'pigeonpeas': '150-180 days',
      'mothbeans': '75-90 days',
      'mungbean': '60-90 days',
      'blackgram': '75-90 days',
      'lentil': '95-110 days',
      'pomegranate': '6-8 months (fruit)',
      'banana': '12-15 months',
      'mango': '3-5 months (fruit)',
      'grapes': '4-6 months (fruit)',
      'watermelon': '80-100 days',
      'muskmelon': '90-110 days',
      'apple': '5-7 months (fruit)',
      'orange': '8-12 months (fruit)',
      'papaya': '6-12 months',
      'coconut': '12 months (nuts)',
      'jute': '120-150 days',
      'coffee': '6-8 months (beans)'
    };
    
    return durations[crop.toLowerCase()] || '90-120 days';
  }

  getRuleBasedRecommendations(soilData, weatherData) {
    const recommendations = [];
    
    // Rice recommendations
    if (soilData.type.includes('Alluvial') || soilData.type.includes('Black')) {
      if (weatherData.rainfall > 100 && weatherData.temperature > 20) {
        recommendations.push({
          crop: 'Rice',
          suitability: 0.9,
          reason: 'High rainfall and suitable soil type',
          expectedYield: '4-6 tons/hectare'
        });
      }
    }
    
    // Wheat recommendations
    if (soilData.type.includes('Alluvial')) {
      if (weatherData.temperature < 30 && weatherData.rainfall < 100) {
        recommendations.push({
          crop: 'Wheat',
          suitability: 0.85,
          reason: 'Moderate temperature and low rainfall suitable',
          expectedYield: '3-5 tons/hectare'
        });
      }
    }
    
    // Cotton recommendations
    if (soilData.type.includes('Black')) {
      if (weatherData.temperature > 25 && soilData.ph > 7) {
        recommendations.push({
          crop: 'Cotton',
          suitability: 0.8,
          reason: 'Black cotton soil and warm temperature',
          expectedYield: '1.5-2.5 tons/hectare'
        });
      }
    }
    
    // Sugarcane recommendations
    if (weatherData.rainfall > 120 && weatherData.temperature > 25) {
      recommendations.push({
        crop: 'Sugarcane',
        suitability: 0.75,
        reason: 'High rainfall and warm temperature',
        expectedYield: '60-80 tons/hectare'
      });
    }
    
    return recommendations;
  }

  mergeRecommendations(mlRecommendations, ruleBasedRecommendations) {
    const merged = [...mlRecommendations];
    
    // Add rule-based recommendations that aren't already covered by ML
    ruleBasedRecommendations.forEach(ruleRec => {
      const existingML = merged.find(mlRec => mlRec.crop === ruleRec.crop);
      if (!existingML) {
        merged.push({
          ...ruleRec,
          category: this.getCropCategory(ruleRec.crop),
          marketValue: this.getMarketValue(ruleRec.crop),
          growthDuration: this.getGrowthDuration(ruleRec.crop)
        });
      } else {
        // Boost suitability if both ML and rules recommend it
        existingML.suitability = Math.min(1.0, existingML.suitability + 0.1);
        existingML.reason += ' (also recommended by traditional analysis)';
      }
    });
    
    return merged;
  }

  getSeasonalInsights(state, district) {
    const locationData = this.findLocationData(state, district);
    
    if (locationData.length === 0) {
      return null;
    }
    
    const monthlyData = {};
    locationData.forEach(record => {
      const month = record.month;
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push({
        temperature: parseFloat(record.avg_temperature_C),
        rainfall: parseFloat(record.rainfall_mm),
        humidity: parseFloat(record.humidity_pct)
      });
    });
    
    return {
      monthlyPatterns: monthlyData,
      bestMonths: this.identifyBestMonths(monthlyData),
      riskMonths: this.identifyRiskMonths(monthlyData)
    };
  }

  identifyBestMonths(monthlyData) {
    const bestMonths = [];
    
    Object.entries(monthlyData).forEach(([month, data]) => {
      const avgRainfall = data.reduce((sum, d) => sum + d.rainfall, 0) / data.length;
      const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
      
      if (avgRainfall > 80 && avgRainfall < 150 && avgTemp > 20 && avgTemp < 35) {
        bestMonths.push({
          month,
          reason: 'Optimal rainfall and temperature for most crops'
        });
      }
    });
    
    return bestMonths;
  }

  identifyRiskMonths(monthlyData) {
    const riskMonths = [];
    
    Object.entries(monthlyData).forEach(([month, data]) => {
      const avgRainfall = data.reduce((sum, d) => sum + d.rainfall, 0) / data.length;
      const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
      
      if (avgRainfall < 50) {
        riskMonths.push({
          month,
          risk: 'Drought risk - low rainfall',
          mitigation: 'Ensure adequate irrigation'
        });
      }
      
      if (avgTemp > 40) {
        riskMonths.push({
          month,
          risk: 'Heat stress risk',
          mitigation: 'Provide shade and increase watering'
        });
      }
      
      if (avgRainfall > 200) {
        riskMonths.push({
          month,
          risk: 'Flood risk - excessive rainfall',
          mitigation: 'Ensure proper drainage'
        });
      }
    });
    
    return riskMonths;
  }

  searchSimilarConditions(targetSoilData, targetWeatherData) {
    const similarLocations = [];
    
    this.data.forEach(record => {
      const soilData = this.getSoilDataForLocation(record.state, record.district);
      const weatherData = this.getWeatherDataForLocation(record.state, record.district);
      
      if (soilData && weatherData) {
        const similarity = this.calculateSimilarity(
          { soil: targetSoilData, weather: targetWeatherData },
          { soil: soilData, weather: weatherData }
        );
        
        if (similarity > 0.7) {
          similarLocations.push({
            state: record.state,
            district: record.district,
            similarity,
            soilType: soilData.type,
            avgTemp: weatherData.temperature,
            rainfall: weatherData.rainfall
          });
        }
      }
    });
    
    return similarLocations.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  calculateSimilarity(conditions1, conditions2) {
    let score = 0;
    let factors = 0;
    
    // Soil type similarity
    if (conditions1.soil.type === conditions2.soil.type) {
      score += 0.3;
    }
    factors += 0.3;
    
    // pH similarity
    const phDiff = Math.abs(conditions1.soil.ph - conditions2.soil.ph);
    score += Math.max(0, (2 - phDiff) / 2) * 0.2;
    factors += 0.2;
    
    // Temperature similarity
    const tempDiff = Math.abs(conditions1.weather.temperature - conditions2.weather.temperature);
    score += Math.max(0, (10 - tempDiff) / 10) * 0.25;
    factors += 0.25;
    
    // Rainfall similarity
    const rainDiff = Math.abs(conditions1.weather.rainfall - conditions2.weather.rainfall);
    score += Math.max(0, (50 - rainDiff) / 50) * 0.25;
    factors += 0.25;
    
    return score / factors;
  }

  getDatasetStats() {
    const stats = {
      totalRecords: this.data.length,
      states: new Set(this.data.map(r => r.state)).size,
      districts: new Set(this.data.map(r => r.district)).size,
      soilTypes: new Set(this.data.map(r => r.soil_type)).size,
      months: new Set(this.data.map(r => r.month)).size
    };
    
    return stats;
  }
}

module.exports = new DatasetService();