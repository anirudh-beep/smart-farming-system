const datasetService = require('./datasetService');

class SoilService {
  constructor() {
    this.soilDatabase = {
      'India-Maharashtra-Pune': {
        type: 'Black Cotton Soil',
        ph: 7.2,
        nitrogen: 'Medium',
        phosphorus: 'Low',
        potassium: 'High',
        organicMatter: 1.8,
        texture: 'Clay',
        drainage: 'Poor',
        waterHoldingCapacity: 'High'
      },
      'India-Karnataka-Bangalore': {
        type: 'Red Laterite Soil',
        ph: 6.5,
        nitrogen: 'Low',
        phosphorus: 'Medium',
        potassium: 'Medium',
        organicMatter: 1.2,
        texture: 'Sandy Clay',
        drainage: 'Good',
        waterHoldingCapacity: 'Medium'
      },
      'USA-California-Fresno': {
        type: 'Alluvial Soil',
        ph: 7.8,
        nitrogen: 'High',
        phosphorus: 'High',
        potassium: 'Medium',
        organicMatter: 2.5,
        texture: 'Loam',
        drainage: 'Excellent',
        waterHoldingCapacity: 'Medium'
      }
    };

    this.soilTypes = {
      'Black Cotton Soil': {
        characteristics: 'High clay content, good for cotton and sugarcane',
        suitableCrops: ['Cotton', 'Sugarcane', 'Wheat', 'Jowar'],
        challenges: 'Poor drainage, cracks when dry'
      },
      'Red Laterite Soil': {
        characteristics: 'Iron-rich, well-drained, acidic',
        suitableCrops: ['Rice', 'Ragi', 'Groundnut', 'Cashew'],
        challenges: 'Low fertility, requires organic matter'
      },
      'Alluvial Soil': {
        characteristics: 'Fertile, well-balanced nutrients',
        suitableCrops: ['Wheat', 'Rice', 'Maize', 'Vegetables'],
        challenges: 'May need specific nutrient management'
      }
    };
  }

  async analyzeSoil(location, userSoilData) {
    const locationKey = `${location.country}-${location.state}-${location.district}`;
    let soilData = this.soilDatabase[locationKey];

    // Try to get data from dataset first
    if (!soilData && location.state && location.district) {
      const datasetSoilData = datasetService.getSoilDataForLocation(location.state, location.district);
      if (datasetSoilData) {
        soilData = {
          type: datasetSoilData.type,
          ph: datasetSoilData.ph,
          nitrogen: datasetSoilData.nitrogen,
          phosphorus: datasetSoilData.phosphorus,
          potassium: datasetSoilData.potassium,
          organicMatter: datasetSoilData.organicMatter,
          texture: datasetSoilData.texture,
          drainage: this.getDrainageFromTexture(datasetSoilData.texture),
          waterHoldingCapacity: this.getWaterHoldingCapacity(datasetSoilData.texture),
          electricalConductivity: datasetSoilData.electricalConductivity
        };
      }
    }

    if (!soilData) {
      // Default soil data for unknown locations
      soilData = {
        type: 'Mixed Soil',
        ph: 6.8,
        nitrogen: 'Medium',
        phosphorus: 'Medium',
        potassium: 'Medium',
        organicMatter: 1.5,
        texture: 'Loam',
        drainage: 'Good',
        waterHoldingCapacity: 'Medium'
      };
    }

    // Merge with user-provided soil data if available
    if (userSoilData) {
      soilData = { ...soilData, ...userSoilData };
    }

    const analysis = this.generateSoilAnalysis(soilData);
    
    return {
      success: true,
      location,
      soilData,
      analysis,
      recommendations: this.getSoilRecommendations(soilData)
    };
  }

  generateSoilAnalysis(soilData) {
    const analysis = {
      fertility: this.calculateFertility(soilData),
      suitability: this.assessSuitability(soilData),
      deficiencies: this.identifyDeficiencies(soilData),
      strengths: this.identifyStrengths(soilData)
    };

    return analysis;
  }

  calculateFertility(soil) {
    const scores = {
      nitrogen: { 'Low': 1, 'Medium': 2, 'High': 3 },
      phosphorus: { 'Low': 1, 'Medium': 2, 'High': 3 },
      potassium: { 'Low': 1, 'Medium': 2, 'High': 3 }
    };

    const totalScore = scores.nitrogen[soil.nitrogen] + 
                      scores.phosphorus[soil.phosphorus] + 
                      scores.potassium[soil.potassium];
    
    const phScore = (soil.ph >= 6.0 && soil.ph <= 7.5) ? 1 : 0.5;
    const organicScore = soil.organicMatter > 2 ? 1 : soil.organicMatter > 1 ? 0.7 : 0.4;

    const fertility = ((totalScore / 9) + phScore + organicScore) / 3;
    
    if (fertility > 0.8) return 'High';
    if (fertility > 0.6) return 'Medium';
    return 'Low';
  }

  assessSuitability(soil) {
    const suitability = [];
    
    if (soil.type in this.soilTypes) {
      suitability.push(...this.soilTypes[soil.type].suitableCrops);
    }

    // Additional logic based on soil properties
    if (soil.ph > 7.5) {
      suitability.push('Alkaline-tolerant crops');
    }
    if (soil.drainage === 'Poor') {
      suitability.push('Rice', 'Sugarcane');
    }

    return [...new Set(suitability)]; // Remove duplicates
  }

  identifyDeficiencies(soil) {
    const deficiencies = [];
    
    if (soil.nitrogen === 'Low') deficiencies.push('Nitrogen deficiency - consider organic manure');
    if (soil.phosphorus === 'Low') deficiencies.push('Phosphorus deficiency - add bone meal or rock phosphate');
    if (soil.potassium === 'Low') deficiencies.push('Potassium deficiency - use wood ash or potash');
    if (soil.organicMatter < 1.5) deficiencies.push('Low organic matter - add compost');
    if (soil.ph < 6.0) deficiencies.push('Acidic soil - consider liming');
    if (soil.ph > 8.0) deficiencies.push('Alkaline soil - add organic matter');

    return deficiencies;
  }

  identifyStrengths(soil) {
    const strengths = [];
    
    if (soil.nitrogen === 'High') strengths.push('Rich in nitrogen');
    if (soil.phosphorus === 'High') strengths.push('Good phosphorus content');
    if (soil.potassium === 'High') strengths.push('High potassium levels');
    if (soil.organicMatter > 2) strengths.push('Rich organic matter');
    if (soil.ph >= 6.0 && soil.ph <= 7.5) strengths.push('Optimal pH range');
    if (soil.drainage === 'Excellent') strengths.push('Excellent drainage');

    return strengths;
  }

  getSoilRecommendations(soil) {
    const recommendations = {
      fertilizers: this.getFertilizerRecommendations(soil),
      amendments: this.getSoilAmendments(soil),
      practices: this.getBestPractices(soil)
    };

    return recommendations;
  }

  getFertilizerRecommendations(soil) {
    const fertilizers = [];
    
    if (soil.nitrogen === 'Low') {
      fertilizers.push({
        type: 'Nitrogen',
        options: ['Urea (46-0-0)', 'Ammonium Sulfate (21-0-0)', 'Compost'],
        application: '50-100 kg/hectare'
      });
    }
    
    if (soil.phosphorus === 'Low') {
      fertilizers.push({
        type: 'Phosphorus',
        options: ['DAP (18-46-0)', 'Single Super Phosphate (16-20-0)', 'Bone meal'],
        application: '25-50 kg/hectare'
      });
    }
    
    if (soil.potassium === 'Low') {
      fertilizers.push({
        type: 'Potassium',
        options: ['Muriate of Potash (0-0-60)', 'Wood ash', 'Potassium sulfate'],
        application: '30-60 kg/hectare'
      });
    }

    return fertilizers;
  }

  getSoilAmendments(soil) {
    const amendments = [];
    
    if (soil.ph < 6.0) {
      amendments.push('Add lime to increase pH (2-4 tons/hectare)');
    }
    if (soil.ph > 8.0) {
      amendments.push('Add sulfur or organic matter to decrease pH');
    }
    if (soil.organicMatter < 2.0) {
      amendments.push('Add compost or well-rotted manure (5-10 tons/hectare)');
    }
    if (soil.drainage === 'Poor') {
      amendments.push('Improve drainage with organic matter and raised beds');
    }

    return amendments;
  }

  getBestPractices(soil) {
    return [
      'Test soil annually for nutrient monitoring',
      'Rotate crops to maintain soil health',
      'Use cover crops during off-season',
      'Apply organic mulch to retain moisture',
      'Practice conservation tillage'
    ];
  }

  updateSoilData(location, newSoilData) {
    const locationKey = `${location.country}-${location.state}-${location.district}`;
    
    // In a real application, this would update a database
    if (this.soilDatabase[locationKey]) {
      this.soilDatabase[locationKey] = { ...this.soilDatabase[locationKey], ...newSoilData };
    } else {
      this.soilDatabase[locationKey] = newSoilData;
    }

    return {
      success: true,
      message: 'Soil data updated successfully',
      updatedData: this.soilDatabase[locationKey]
    };
  }

  getDrainageFromTexture(texture) {
    const drainageMap = {
      'Clay': 'Poor',
      'Clay Loam': 'Fair',
      'Loam': 'Good',
      'Sandy Loam': 'Good',
      'Sandy Clay': 'Fair',
      'Sandy': 'Excellent',
      'Loamy Sand': 'Excellent'
    };
    return drainageMap[texture] || 'Good';
  }

  getWaterHoldingCapacity(texture) {
    const capacityMap = {
      'Clay': 'High',
      'Clay Loam': 'High',
      'Loam': 'Medium',
      'Sandy Loam': 'Medium',
      'Sandy Clay': 'Medium',
      'Sandy': 'Low',
      'Loamy Sand': 'Low'
    };
    return capacityMap[texture] || 'Medium';
  }

  getSoilTypes() {
    return this.soilTypes;
  }
}

module.exports = new SoilService();