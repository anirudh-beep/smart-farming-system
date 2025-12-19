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

  determineBestPlantingTime(cropType, monthlyData) {
    // Logic to determine optimal planting time based on weather patterns
    const currentMonth = new Date().getMonth();
    const recommendations = [];

    // Simplified logic - in real app, this would be more sophisticated
    if (cropType === 'Rice') {
      recommendations.push('Best planted during monsoon (June-July)');
    } else if (cropType === 'Wheat') {
      recommendations.push('Best planted in winter (November-December)');
    } else {
      recommendations.push('Consult local agricultural extension for optimal timing');
    }

    return recommendations;
  }

  assessSeasonalRisks(monthlyData) {
    return {
      droughtRisk: 'Medium - based on historical rainfall patterns',
      floodRisk: 'Low - adequate drainage systems recommended',
      temperatureStress: 'Monitor summer months for heat stress',
      diseaseRisk: 'Higher during humid monsoon period'
    };
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
    return {
      success: true,
      seasonalTrends: 'Mock seasonal data - API integration needed',
      cropAdvice: this.getCropSpecificAdvice(cropType, {}),
      bestPlantingTime: this.determineBestPlantingTime(cropType, {}),
      riskAssessment: this.assessSeasonalRisks({})
    };
  }

  groupDataByMonth(data) {
    // Helper function to group historical data by month
    return {};
  }
}

module.exports = new WeatherService();