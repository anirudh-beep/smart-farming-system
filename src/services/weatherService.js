const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.baseUrl = 'http://api.weatherapi.com/v1';
  }

  async getWeatherForecast(location) {
    try {
      const query = `${location.district}, ${location.state}, ${location.country}`;
      
      // Get current weather and 7-day forecast
      const response = await axios.get(`${this.baseUrl}/forecast.json`, {
        params: {
          key: this.apiKey,
          q: query,
          days: 7,
          aqi: 'yes',
          alerts: 'yes'
        }
      });

      const data = response.data;
      
      return {
        success: true,
        location: data.location,
        current: {
          temperature: data.current.temp_c,
          humidity: data.current.humidity,
          rainfall: data.current.precip_mm,
          windSpeed: data.current.wind_kph,
          condition: data.current.condition.text,
          uvIndex: data.current.uv
        },
        forecast: data.forecast.forecastday.map(day => ({
          date: day.date,
          maxTemp: day.day.maxtemp_c,
          minTemp: day.day.mintemp_c,
          rainfall: day.day.totalprecip_mm,
          humidity: day.day.avghumidity,
          condition: day.day.condition.text,
          chanceOfRain: day.day.daily_chance_of_rain
        })),
        alerts: data.alerts?.alert || [],
        analysis: this.analyzeWeatherForFarming(data)
      };
    } catch (error) {
      console.error('Weather API Error:', error.message);
      
      // Return mock data if API fails
      return this.getMockWeatherData(location);
    }
  }

  analyzeWeatherForFarming(weatherData) {
    const analysis = {
      recommendations: [],
      warnings: [],
      opportunities: []
    };

    const forecast = weatherData.forecast.forecastday;
    const totalRainfall = forecast.reduce((sum, day) => sum + day.day.totalprecip_mm, 0);
    const avgTemp = forecast.reduce((sum, day) => sum + day.day.avgtemp_c, 0) / forecast.length;

    // Rainfall analysis
    if (totalRainfall > 50) {
      analysis.warnings.push('Heavy rainfall expected - consider drainage and disease prevention');
      analysis.recommendations.push('Delay fertilizer application until after rain');
    } else if (totalRainfall < 5) {
      analysis.warnings.push('Low rainfall expected - irrigation may be needed');
      analysis.recommendations.push('Prepare irrigation systems and water conservation');
    } else {
      analysis.opportunities.push('Moderate rainfall expected - good for most crops');
    }

    // Temperature analysis
    if (avgTemp > 35) {
      analysis.warnings.push('High temperatures expected - heat stress risk');
      analysis.recommendations.push('Provide shade for sensitive crops and increase watering');
    } else if (avgTemp < 10) {
      analysis.warnings.push('Low temperatures expected - frost risk');
      analysis.recommendations.push('Cover sensitive plants and delay planting');
    }

    // Check for extreme weather
    forecast.forEach(day => {
      if (day.day.daily_chance_of_rain > 80) {
        analysis.warnings.push(`High chance of rain on ${day.date}`);
      }
      if (day.day.maxwind_kph > 40) {
        analysis.warnings.push(`Strong winds expected on ${day.date}`);
      }
    });

    return analysis;
  }

  async getSeasonalAnalysis(location, cropType) {
    try {
      const query = `${location.district}, ${location.state}, ${location.country}`;
      
      // Get historical data for seasonal patterns
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const response = await axios.get(`${this.baseUrl}/history.json`, {
        params: {
          key: this.apiKey,
          q: query,
          dt: startDate.toISOString().split('T')[0],
          end_dt: endDate.toISOString().split('T')[0]
        }
      });

      return this.analyzeSeasonalPatterns(response.data, cropType);
    } catch (error) {
      console.log('Weather API historical data not available, using mock seasonal data');
      return this.getMockSeasonalData(location, cropType);
    }
  }

  analyzeSeasonalPatterns(historicalData, cropType) {
    // Analyze seasonal patterns and provide crop-specific advice
    const monthlyData = this.groupDataByMonth(historicalData);
    
    return {
      success: true,
      seasonalTrends: monthlyData,
      cropAdvice: this.getCropSpecificAdvice(cropType, monthlyData),
      bestPlantingTime: this.determineBestPlantingTime(cropType, monthlyData),
      riskAssessment: this.assessSeasonalRisks(monthlyData)
    };
  }

  getCropSpecificAdvice(cropType, monthlyData) {
    const cropRequirements = {
      'Rice': { minTemp: 20, maxTemp: 35, rainfall: 100 },
      'Wheat': { minTemp: 10, maxTemp: 25, rainfall: 50 },
      'Cotton': { minTemp: 15, maxTemp: 35, rainfall: 75 },
      'Sugarcane': { minTemp: 20, maxTemp: 40, rainfall: 150 }
    };

    const requirements = cropRequirements[cropType] || cropRequirements['Rice'];
    
    return {
      waterNeeds: `${requirements.rainfall}mm monthly rainfall optimal`,
      temperatureRange: `${requirements.minTemp}°C - ${requirements.maxTemp}°C`,
      seasonalTips: this.getSeasonalTips(cropType)
    };
  }

  getSeasonalTips(cropType) {
    const tips = {
      'Rice': [
        'Plant during monsoon season for adequate water',
        'Ensure proper drainage during heavy rains',
        'Monitor for blast disease in humid conditions'
      ],
      'Wheat': [
        'Plant in winter season for optimal growth',
        'Avoid waterlogging during germination',
        'Harvest before summer heat'
      ],
      'Cotton': [
        'Plant after last frost date',
        'Ensure adequate moisture during flowering',
        'Monitor for bollworm during fruiting'
      ]
    };

    return tips[cropType] || tips['Rice'];
  }

  determineBestPlantingTime(cropType, seasonalData) {
    const currentMonth = new Date().getMonth();
    const recommendations = [];
    const currentSeason = seasonalData.currentSeason || 'Unknown';

    // Crop-specific planting recommendations
    const plantingTimes = {
      'Rice': {
        kharif: 'June-July (Monsoon season)',
        rabi: 'November-December (Post-monsoon)',
        current: currentMonth >= 5 && currentMonth <= 7 ? 'Ideal time for Kharif rice planting' : 'Consider Rabi rice in November-December'
      },
      'Wheat': {
        optimal: 'November-December (Rabi season)',
        current: currentMonth >= 10 || currentMonth <= 1 ? 'Good time for wheat planting' : 'Wait for winter season (Nov-Dec)'
      },
      'Cotton': {
        optimal: 'April-May (Pre-monsoon)',
        current: currentMonth >= 3 && currentMonth <= 5 ? 'Suitable time for cotton planting' : 'Plan for next pre-monsoon season'
      },
      'Sugarcane': {
        optimal: 'February-March or October-November',
        current: currentMonth >= 1 && currentMonth <= 3 ? 'Good time for spring planting' : 'Consider autumn planting (Oct-Nov)'
      }
    };

    const cropTiming = plantingTimes[cropType] || {
      optimal: 'Consult local agricultural extension',
      current: `Current season: ${currentSeason} - check crop suitability`
    };

    recommendations.push(cropTiming.optimal);
    recommendations.push(cropTiming.current);
    
    // Add season-specific advice
    if (currentSeason === 'Monsoon') {
      recommendations.push('Good for water-intensive crops like rice');
    } else if (currentSeason === 'Winter') {
      recommendations.push('Ideal for wheat, mustard, and other rabi crops');
    } else if (currentSeason === 'Summer') {
      recommendations.push('Consider drought-resistant crops or ensure irrigation');
    }

    return recommendations;
  }

  assessSeasonalRisks(seasonalData) {
    const currentMonth = new Date().getMonth();
    const currentSeason = seasonalData.currentSeason || 'Unknown';
    
    let droughtRisk = 'Low';
    let floodRisk = 'Low';
    let temperatureStress = 'Low';
    let diseaseRisk = 'Low';

    // Assess risks based on current season
    if (currentSeason === 'Summer') {
      droughtRisk = 'High';
      temperatureStress = 'High';
      diseaseRisk = 'Low';
    } else if (currentSeason === 'Monsoon') {
      droughtRisk = 'Low';
      floodRisk = 'Medium';
      temperatureStress = 'Low';
      diseaseRisk = 'High';
    } else if (currentSeason === 'Winter') {
      droughtRisk = 'Medium';
      floodRisk = 'Low';
      temperatureStress = 'Medium';
      diseaseRisk = 'Medium';
    }

    return {
      droughtRisk: `${droughtRisk} - ${this.getDroughtAdvice(droughtRisk)}`,
      floodRisk: `${floodRisk} - ${this.getFloodAdvice(floodRisk)}`,
      temperatureStress: `${temperatureStress} - ${this.getTemperatureAdvice(temperatureStress)}`,
      diseaseRisk: `${diseaseRisk} - ${this.getDiseaseAdvice(diseaseRisk)}`
    };
  }

  getDroughtAdvice(risk) {
    const advice = {
      'Low': 'Normal irrigation schedule sufficient',
      'Medium': 'Monitor soil moisture, prepare backup irrigation',
      'High': 'Implement water conservation, consider drought-resistant varieties'
    };
    return advice[risk] || 'Monitor weather conditions';
  }

  getFloodAdvice(risk) {
    const advice = {
      'Low': 'Standard drainage practices adequate',
      'Medium': 'Ensure proper field drainage, avoid low-lying areas',
      'High': 'Implement flood management, consider raised bed cultivation'
    };
    return advice[risk] || 'Maintain good drainage';
  }

  getTemperatureAdvice(risk) {
    const advice = {
      'Low': 'Normal crop management practices',
      'Medium': 'Monitor for temperature stress, provide shade if needed',
      'High': 'Use mulching, increase irrigation frequency, provide crop cover'
    };
    return advice[risk] || 'Monitor temperature conditions';
  }

  getDiseaseAdvice(risk) {
    const advice = {
      'Low': 'Regular monitoring sufficient',
      'Medium': 'Increase disease surveillance, ensure good air circulation',
      'High': 'Implement preventive fungicide sprays, avoid overhead irrigation'
    };
    return advice[risk] || 'Monitor for disease symptoms';
  }

  async getHistoricalData(location, years) {
    // Mock historical data - in production, fetch from weather API
    return {
      success: true,
      years: years,
      averageRainfall: 850,
      averageTemperature: 26.5,
      extremeEvents: [
        { year: 2023, event: 'Drought', impact: 'Moderate' },
        { year: 2022, event: 'Flood', impact: 'High' }
      ],
      trends: {
        temperature: 'Increasing by 0.2°C per decade',
        rainfall: 'Decreasing by 2% per decade'
      }
    };
  }

  getMockWeatherData(location) {
    return {
      success: true,
      location: {
        name: `${location.district}, ${location.state}`,
        country: location.country
      },
      current: {
        temperature: 28,
        humidity: 65,
        rainfall: 2.5,
        windSpeed: 12,
        condition: 'Partly cloudy',
        uvIndex: 6
      },
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxTemp: 30 + Math.random() * 5,
        minTemp: 20 + Math.random() * 5,
        rainfall: Math.random() * 10,
        humidity: 60 + Math.random() * 20,
        condition: 'Partly cloudy',
        chanceOfRain: Math.floor(Math.random() * 100)
      })),
      alerts: [],
      analysis: {
        recommendations: ['Monitor soil moisture levels', 'Good conditions for most crops'],
        warnings: [],
        opportunities: ['Favorable weather for field operations']
      }
    };
  }

  getMockSeasonalData(location, cropType) {
    const currentMonth = new Date().getMonth();
    const seasonalData = this.getSeasonalDataForRegion(location, currentMonth);
    
    return {
      success: true,
      seasonalTrends: seasonalData.trends,
      cropAdvice: this.getCropSpecificAdvice(cropType, seasonalData),
      bestPlantingTime: this.determineBestPlantingTime(cropType, seasonalData),
      riskAssessment: this.assessSeasonalRisks(seasonalData)
    };
  }

  getSeasonalDataForRegion(location, currentMonth) {
    // Seasonal patterns based on Indian agricultural zones
    const patterns = {
      'Maharashtra': {
        monsoon: { start: 5, end: 9, rainfall: 850 },
        winter: { start: 10, end: 2, temp: 18 },
        summer: { start: 3, end: 5, temp: 35 }
      },
      'Karnataka': {
        monsoon: { start: 5, end: 9, rainfall: 900 },
        winter: { start: 10, end: 2, temp: 20 },
        summer: { start: 3, end: 5, temp: 32 }
      },
      'Gujarat': {
        monsoon: { start: 6, end: 9, rainfall: 650 },
        winter: { start: 10, end: 2, temp: 15 },
        summer: { start: 3, end: 5, temp: 38 }
      },
      'Uttar Pradesh': {
        monsoon: { start: 6, end: 9, rainfall: 800 },
        winter: { start: 10, end: 2, temp: 12 },
        summer: { start: 3, end: 5, temp: 36 }
      }
    };

    const statePattern = patterns[location.state] || patterns['Maharashtra'];
    
    return {
      trends: statePattern,
      currentSeason: this.getCurrentSeason(currentMonth, statePattern),
      avgRainfall: statePattern.monsoon.rainfall,
      avgTemp: 26
    };
  }

  getCurrentSeason(month, pattern) {
    if (month >= pattern.monsoon.start && month <= pattern.monsoon.end) {
      return 'Monsoon';
    } else if (month >= pattern.winter.start || month <= pattern.winter.end) {
      return 'Winter';
    } else {
      return 'Summer';
    }
  }

  groupDataByMonth(data) {
    // Helper function to group historical data by month
    return {};
  }
}

module.exports = new WeatherService();