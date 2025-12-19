const fs = require('fs');
const path = require('path');

class DatasetService {
  constructor() {
    this.datasetPath = path.join(__dirname, '../../dataset.csv');
    this.data = [];
    this.loadDataset();
  }

  loadDataset() {
    try {
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
      
      console.log(`Loaded ${this.data.length} records from dataset`);
    } catch (error) {
      console.error('Error loading dataset:', error.message);
      this.data = [];
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
    
    return recommendations.sort((a, b) => b.suitability - a.suitability);
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