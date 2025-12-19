import React, { useState } from 'react';
import { motion } from 'motion/react';
import ClickSpark from '../ClickSpark/ClickSpark';
import axios from 'axios';

const CropSection = ({ onCropAnalyzed, appData }) => {
  const [cropData, setCropData] = useState(null);
  const [fertilizerData, setFertilizerData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [budget, setBudget] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);

  const getCropRecommendations = async () => {
    if (!appData.location || !appData.soilData) {
      alert('Please complete location and soil analysis first');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get crop recommendations
      const cropResponse = await axios.post('/api/crop/recommend', {
        location: appData.location,
        soilData: appData.soilData,
        weatherData: appData.weatherData
      });

      if (cropResponse.data.success) {
        setCropData(cropResponse.data);
        
        // Automatically get fertilizer recommendations
        const fertilizerResponse = await axios.post('/api/crop/fertilizer', {
          cropType: cropResponse.data.recommendedCrops?.[0]?.name || 'General',
          soilData: appData.soilData,
          budget: budget ? parseInt(budget) : null
        });

        if (fertilizerResponse.data.success) {
          setFertilizerData(fertilizerResponse.data);
        }

        // Get AI insights
        const aiResponse = await axios.post('/api/crop/ai-insights', {
          location: appData.location,
          soilData: appData.soilData,
          weatherData: appData.weatherData,
          cropType: cropResponse.data.recommendedCrops?.[0]?.name
        });

        if (aiResponse.data.success) {
          setAiInsights(aiResponse.data);
        }

        onCropAnalyzed(cropResponse.data);
      } else {
        alert('Error getting crop recommendations: ' + cropResponse.data.error);
      }
    } catch (error) {
      alert('Error getting crop recommendations: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getFertilizerRecommendations = async () => {
    if (!appData.soilData) {
      alert('Please complete soil analysis first');
      return;
    }

    try {
      const response = await axios.post('/api/crop/fertilizer', {
        cropType: selectedCrop || 'General',
        soilData: appData.soilData,
        budget: budget ? parseInt(budget) : null
      });

      if (response.data.success) {
        setFertilizerData(response.data);
      } else {
        alert('Error getting fertilizer recommendations: ' + response.data.error);
      }
    } catch (error) {
      alert('Error getting fertilizer recommendations: ' + error.message);
    }
  };

  return (
    <div className="crop-section">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>
          <i className="fas fa-leaf"></i>
          Crop Recommendations
        </h2>
      </motion.div>

      <div className="crop-controls-container">
        <div className="crop-controls">
          <ClickSpark>
            <button 
              className="btn btn-primary"
              onClick={getCropRecommendations}
              disabled={!appData.location || !appData.soilData || isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  Get AI Recommendations
                </>
              )}
            </button>
          </ClickSpark>

          <div className="fertilizer-controls">
            <div className="form-group">
              <label>Budget for fertilizers (₹):</label>
              <input 
                type="number"
                className="form-input"
                placeholder="10000"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            
            <ClickSpark>
              <button 
                className="btn btn-secondary"
                onClick={getFertilizerRecommendations}
                disabled={!appData.soilData}
              >
                <i className="fas fa-coins"></i>
                Fertilizer Options
              </button>
            </ClickSpark>
          </div>
        </div>
      </div>

      {/* Crop Recommendations - Always show box */}
      <motion.div 
        className="crop-results"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card">
            <h3>
              <i className="fas fa-star"></i>
              Recommended Crops
            </h3>
            
            {cropData?.recommendedCrops?.length > 0 ? (
              <div className="crops-grid">
                {cropData.recommendedCrops.map((crop, index) => (
                  <ClickSpark key={index}>
                    <motion.div 
                      className={`crop-card ${selectedCrop === crop.name ? 'active' : ''} ${index === 0 ? 'top-recommendation' : ''}`}
                      onClick={() => setSelectedCrop(crop.name)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {index === 0 && (
                        <div className="top-badge">
                          <i className="fas fa-crown"></i>
                          Top Recommendation
                        </div>
                      )}
                      
                      <div className="crop-header">
                        <h4>
                          <i className="fas fa-leaf"></i>
                          {crop.name}
                        </h4>
                        <span className={`crop-suitability suitability-${crop.suitability > 0.8 ? 'high' : crop.suitability > 0.6 ? 'medium' : 'low'}`}>
                          {Math.round(crop.suitability * 100)}% Match
                        </span>
                      </div>

                      <div className="crop-details">
                        <div className="crop-info">
                          <div className="info-item">
                            <i className="fas fa-chart-line"></i>
                            <span><strong>Expected Yield:</strong> {crop.yield || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-calendar-alt"></i>
                            <span><strong>Growth Duration:</strong> {crop.growthDuration || 'N/A'} days</span>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-rupee-sign"></i>
                            <span><strong>Expected Profit:</strong> ₹{crop.expectedProfit || 'N/A'}/hectare</span>
                          </div>
                        </div>

                        {crop.reasons?.length > 0 && (
                          <div className="crop-reasons">
                            <h6><i className="fas fa-check-circle"></i> Why This Crop:</h6>
                            <ul>
                              {crop.reasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </ClickSpark>
                ))}
              </div>
            ) : (
              <div className="no-recommendations">
                <i className="fas fa-seedling"></i>
                <h4>Crop Recommendations</h4>
                <p>Click "Get AI Recommendations" to analyze your soil and weather data for optimal crop suggestions.</p>
              </div>
            )}
          </div>
        </motion.div>

      {/* Fertilizer Recommendations - Always show box */}
      <motion.div 
        className="fertilizer-results"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="card">
          <h3>
            <i className="fas fa-flask"></i>
            Fertilizer Recommendations
          </h3>
          
          {fertilizerData ? (
            <div className="fertilizer-sections">
        <motion.div 
          className="fertilizer-results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="card">
            <h3>
              <i className="fas fa-flask"></i>
              Fertilizer Recommendations
            </h3>
            
            <div className="fertilizer-sections">
              {fertilizerData.standardRecommendations && (
                <div className="fertilizer-section">
                  <h4>Standard Recommendations</h4>
                  {fertilizerData.standardRecommendations.map((fert, index) => (
                    <ClickSpark key={index}>
                      <div className="fertilizer-card">
                        <h5>{fert.name}</h5>
                        <p><strong>Composition:</strong> {fert.composition}</p>
                        <p><strong>Application:</strong> {fert.applicationRate}</p>
                        <p className="fertilizer-price"><strong>Cost:</strong> ₹{fert.cost}/hectare</p>
                      </div>
                    </ClickSpark>
                  ))}
                  <p className="total-cost">
                    <strong>Total Estimated Cost: ₹{fertilizerData.totalEstimatedCost}</strong>
                  </p>
                </div>
              )}

              {fertilizerData.budgetAlternatives && (
                <div className="fertilizer-section">
                  <h4>Budget-Friendly Alternatives</h4>
                  {fertilizerData.budgetAlternatives.map((fert, index) => (
                    <ClickSpark key={index}>
                      <div className="fertilizer-card budget-friendly">
                        <h5>{fert.name}</h5>
                        <p><strong>Composition:</strong> {fert.composition}</p>
                        <p><strong>Application:</strong> {fert.applicationRate}</p>
                        <p className="fertilizer-price"><strong>Cost:</strong> ₹{fert.cost}/hectare</p>
                        {fert.benefits && <p className="benefits">{fert.benefits}</p>}
                      </div>
                    </ClickSpark>
                  ))}
                  <p className="total-cost budget-cost">
                    <strong>Budget-Friendly Total: ₹{fertilizerData.budgetFriendlyCost}</strong>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-fertilizer-data">
              <i className="fas fa-flask"></i>
              <p>Click "Fertilizer Options" to get budget-friendly fertilizer recommendations based on your soil analysis.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* AI Insights - Always show box */}
      <motion.div 
        className="ai-insights-results"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="card">
          <h3>
            <i className="fas fa-robot"></i>
            Smart Farming Insights
          </h3>
          
          {aiInsights ? (
        <motion.div 
          className="ai-insights-results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="card">
            <h3>
              <i className="fas fa-robot"></i>
              Smart Farming Insights
            </h3>
            
            <div className="insights-content">
              <div className="insights-header">
                <div className="analysis-badge">
                  <i className="fas fa-brain"></i>
                  {aiInsights.analysisType || 'AI Analysis'}
                </div>
                <small className="timestamp">
                  Generated: {new Date(aiInsights.timestamp).toLocaleString()}
                </small>
              </div>

              <div className="insights-body">
                {aiInsights.insights && (
                  <div className="insights-text">
                    {aiInsights.insights.split('\n').filter(line => line.trim().length > 0).slice(0, 8).map((line, index) => {
                      if (line.trim().startsWith('🌱') || line.trim().startsWith('🗺️') || line.trim().startsWith('💡')) {
                        return <h4 key={index} className="insight-section-header highlighted">{line}</h4>;
                      } else if (line.trim().startsWith('•')) {
                        return <div key={index} className="insight-bullet">{line.replace('•', '').trim()}</div>;
                      } else if (line.trim().length > 0) {
                        return <p key={index} className="insight-text">{line}</p>;
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              <div className="insights-footer">
                <p className="disclaimer">
                  <i className="fas fa-info-circle"></i>
                  These recommendations are based on your soil and weather data. Always consult local agricultural experts for best results.
                </p>
              </div>
            </div>
          ) : (
            <div className="no-insights-data">
              <i className="fas fa-brain"></i>
              <h4>AI-Powered Insights</h4>
              <p>Get AI recommendations after completing crop analysis for personalized farming insights and best practices.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CropSection;