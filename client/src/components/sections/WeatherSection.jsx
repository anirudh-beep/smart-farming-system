import React, { useState } from 'react';
import { motion } from 'motion/react';
import ClickSpark from '../ClickSpark/ClickSpark';
import axios from 'axios';

const WeatherSection = ({ onWeatherAnalyzed, appData }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getWeatherForecast = async () => {
    if (!appData.location) {
      alert('Please set your location first');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/weather/forecast', {
        location: appData.location
      });

      if (response.data.success) {
        setWeatherData(response.data);
        onWeatherAnalyzed(response.data);
      } else {
        alert('Error getting weather forecast: ' + response.data.error);
      }
    } catch (error) {
      alert('Error getting weather forecast: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeasonalAnalysis = async () => {
    if (!appData.location) {
      alert('Please set your location first');
      return;
    }

    try {
      const response = await axios.post('/api/weather/seasonal', {
        location: appData.location
      });

      if (response.data.success) {
        // Merge seasonal data with existing weather data
        setWeatherData(prev => ({
          ...prev,
          seasonal: response.data
        }));
      } else {
        alert('Error getting seasonal analysis: ' + response.data.error);
      }
    } catch (error) {
      alert('Error getting seasonal analysis: ' + error.message);
    }
  };

  return (
    <div className="weather-section">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>
          <i className="fas fa-cloud-sun"></i>
          Weather Analysis
        </h2>
      </motion.div>

      <div className="weather-controls-container">
        <div className="weather-controls">
          <ClickSpark>
            <button 
              className="btn btn-primary"
              onClick={getWeatherForecast}
              disabled={!appData.location || isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Loading...
                </>
              ) : (
                <>
                  <i className="fas fa-sync"></i>
                  Get Weather Forecast
                </>
              )}
            </button>
          </ClickSpark>

          <ClickSpark>
            <button 
              className="btn btn-secondary"
              onClick={getSeasonalAnalysis}
              disabled={!appData.location}
            >
              <i className="fas fa-calendar-alt"></i>
              Seasonal Analysis
            </button>
          </ClickSpark>
        </div>
      </div>

      {/* Weather Results - Always show boxes */}
      <motion.div 
        className="weather-results"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-3">
            {/* Current Weather */}
            <ClickSpark>
              <div className="card">
                <h3>
                  <i className="fas fa-thermometer-half"></i>
                  Current Conditions
                </h3>
                <div className="current-weather">
                  <div className="temperature">
                    {weatherData?.current?.temperature || '--'}°C
                  </div>
                  <div className="condition">
                    {weatherData?.current?.condition || 'Click "Get Weather Forecast" to load data'}
                  </div>
                  <div className="weather-details">
                    <p><i className="fas fa-tint"></i> Humidity: {weatherData?.current?.humidity || '--'}%</p>
                    <p><i className="fas fa-wind"></i> Wind: {weatherData?.current?.windSpeed || '--'} km/h</p>
                    <p><i className="fas fa-cloud-rain"></i> Rainfall: {weatherData?.current?.rainfall || '--'}mm</p>
                  </div>
                </div>
              </div>
            </ClickSpark>

            {/* Forecast */}
            <ClickSpark>
              <div className="card">
                <h3>
                  <i className="fas fa-calendar-week"></i>
                  7-Day Forecast
                </h3>
                <div className="forecast-list">
                  {weatherData.forecast?.slice(0, 5).map((day, index) => (
                    <div key={index} className="forecast-day">
                      <div className="day-info">
                        <span className="day-date">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="day-condition">{day.condition}</span>
                      </div>
                      <div className="day-temp">
                        {day.minTemp}° / {day.maxTemp}°
                      </div>
                    </div>
                  )) || <p>Click "Get Weather Forecast" to load 7-day forecast data</p>}
                </div>
              </div>
            </ClickSpark>

            {/* Insights */}
            <ClickSpark>
              <div className="card">
                <h3>
                  <i className="fas fa-lightbulb"></i>
                  Farming Insights
                </h3>
                <div className="weather-insights">
                  {weatherData.analysis?.recommendations?.length > 0 && (
                    <div className="recommendations">
                      <h5><i className="fas fa-check-circle"></i> Recommendations</h5>
                      <ul>
                        {weatherData.analysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {weatherData.analysis?.warnings?.length > 0 && (
                    <div className="warnings">
                      <h5><i className="fas fa-exclamation-triangle"></i> Warnings</h5>
                      <ul>
                        {weatherData.analysis.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </ClickSpark>
          </div>

          {/* Seasonal Analysis */}
          {weatherData.seasonal && (
            <motion.div 
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3>
                <i className="fas fa-calendar-alt"></i>
                Seasonal Analysis
              </h3>
              <div className="seasonal-content">
                <div className="seasonal-info">
                  <h4>Best Planting Time:</h4>
                  <ul>
                    {weatherData.seasonal.bestPlantingTime?.map((time, index) => (
                      <li key={index}>{time}</li>
                    ))}
                  </ul>
                  
                  <h4>Risk Assessment:</h4>
                  <div className="risk-grid">
                    <div className="risk-item">
                      <strong>Drought Risk:</strong> {weatherData.seasonal.riskAssessment?.droughtRisk}
                    </div>
                    <div className="risk-item">
                      <strong>Flood Risk:</strong> {weatherData.seasonal.riskAssessment?.floodRisk}
                    </div>
                    <div className="risk-item">
                      <strong>Temperature Stress:</strong> {weatherData.seasonal.riskAssessment?.temperatureStress}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        {weatherData && (
          <button 
            className="btn btn-success"
            onClick={() => onWeatherAnalyzed(weatherData)}
            style={{ marginTop: '2rem' }}
          >
            <i className="fas fa-arrow-right"></i>
            Get Crop Recommendations
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default WeatherSection;