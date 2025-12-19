import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ClickSpark from '../ClickSpark/ClickSpark';
import axios from 'axios';

const SoilSection = ({ onSoilAnalyzed, appData }) => {
  const [soilData, setSoilData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualSoilData, setManualSoilData] = useState({
    soilType: '',
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: ''
  });

  // Sync manual inputs with current soil data when available
  useEffect(() => {
    if (soilData?.soilData && !isAnalyzing) {
      setManualSoilData({
        soilType: soilData.soilData.type || '',
        ph: soilData.soilData.ph || '',
        nitrogen: soilData.soilData.nitrogen || '',
        phosphorus: soilData.soilData.phosphorus || '',
        potassium: soilData.soilData.potassium || ''
      });
    }
  }, [soilData, isAnalyzing]);

  const analyzeSoil = async () => {
    if (!appData.location) {
      alert('Please set your location first');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Filter out empty manual data
      const filteredManualData = {};
      Object.keys(manualSoilData).forEach(key => {
        if (manualSoilData[key] && manualSoilData[key] !== '') {
          filteredManualData[key] = manualSoilData[key];
        }
      });

      const response = await axios.post('/api/soil/analyze', {
        location: appData.location,
        userSoilData: filteredManualData
      });

      if (response.data.success) {
        setSoilData(response.data);
        onSoilAnalyzed(response.data.soilData);
      } else {
        alert('Error analyzing soil: ' + response.data.error);
      }
    } catch (error) {
      alert('Error analyzing soil: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualUpdate = (field, value) => {
    setManualSoilData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSoilData = async (e) => {
    e.preventDefault();
    
    if (!appData.location) {
      alert('Please set your location first');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Filter out empty manual data and map field names correctly
      const filteredManualData = {};
      
      if (manualSoilData.soilType && manualSoilData.soilType !== '') {
        filteredManualData.type = manualSoilData.soilType;
      }
      if (manualSoilData.ph && manualSoilData.ph !== '') {
        filteredManualData.ph = parseFloat(manualSoilData.ph);
      }
      if (manualSoilData.nitrogen && manualSoilData.nitrogen !== '') {
        filteredManualData.nitrogen = manualSoilData.nitrogen;
      }
      if (manualSoilData.phosphorus && manualSoilData.phosphorus !== '') {
        filteredManualData.phosphorus = manualSoilData.phosphorus;
      }
      if (manualSoilData.potassium && manualSoilData.potassium !== '') {
        filteredManualData.potassium = manualSoilData.potassium;
      }

      console.log('Sending manual soil data:', filteredManualData);

      const response = await axios.post('/api/soil/analyze', {
        location: appData.location,
        userSoilData: filteredManualData
      });

      if (response.data.success) {
        setSoilData(response.data);
        onSoilAnalyzed(response.data.soilData);
        alert('Soil data updated successfully!');
      } else {
        alert('Error updating soil data: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error updating soil data:', error);
      alert('Error updating soil data: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="soil-section">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>
          <i className="fas fa-microscope"></i>
          Soil Analysis
        </h2>
      </motion.div>

      <div className="grid grid-2">
        {/* Auto Detection Card */}
        <ClickSpark>
          <motion.div 
            className="card clickable auto-detection-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="auto-detection-header">
              <div className="detection-icon">
                <i className="fas fa-search-location"></i>
              </div>
              <h3>Auto-Detection</h3>
            </div>
            
            <div className="detection-content">
              <p className="detection-description">
                Analyzes soil based on your location data
              </p>
              
              <button 
                className="btn btn-primary detection-btn"
                onClick={analyzeSoil}
                disabled={!appData.location || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-flask"></i>
                    Analyze Soil
                  </>
                )}
              </button>

              <div className="detection-features">
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Automatic soil type identification</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Regional nutrient analysis</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Climate-based recommendations</span>
                </div>
              </div>
            </div>
          </motion.div>
        </ClickSpark>

        {/* Manual Input Card */}
        <ClickSpark>
          <motion.div 
            className="card clickable manual-input-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="manual-input-header">
              <div className="input-icon">
                <i className="fas fa-user-edit"></i>
              </div>
              <h3>Manual Input</h3>
            </div>

            <div className="manual-form">
              <div className="form-group">
                <label>Soil Type:</label>
                <select 
                  className="form-select auto-detect-select"
                  value={manualSoilData.soilType}
                  onChange={(e) => handleManualUpdate('soilType', e.target.value)}
                >
                  <option value="">Auto-detect</option>
                  <option value="Black Cotton Soil">Black Cotton Soil</option>
                  <option value="Red Laterite Soil">Red Laterite Soil</option>
                  <option value="Alluvial Soil">Alluvial Soil</option>
                  <option value="Sandy Soil">Sandy Soil</option>
                  <option value="Peaty Soil">Peaty Soil</option>
                </select>
              </div>

              <div className="form-group">
                <label>pH Level:</label>
                <input 
                  type="number"
                  className="form-input auto-detect-input"
                  placeholder="Auto-detect"
                  step="0.1"
                  min="4"
                  max="10"
                  value={manualSoilData.ph}
                  onChange={(e) => handleManualUpdate('ph', e.target.value)}
                />
              </div>

              <div className="grid grid-3">
                <div className="form-group">
                  <label>Nitrogen:</label>
                  <select 
                    className="form-select auto-detect-select"
                    value={manualSoilData.nitrogen}
                    onChange={(e) => handleManualUpdate('nitrogen', e.target.value)}
                  >
                    <option value="">Auto-detect</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phosphorus:</label>
                  <select 
                    className="form-select auto-detect-select"
                    value={manualSoilData.phosphorus}
                    onChange={(e) => handleManualUpdate('phosphorus', e.target.value)}
                  >
                    <option value="">Auto-detect</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Potassium:</label>
                  <select 
                    className="form-select auto-detect-select"
                    value={manualSoilData.potassium}
                    onChange={(e) => handleManualUpdate('potassium', e.target.value)}
                  >
                    <option value="">Auto-detect</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <button 
                className="btn btn-secondary update-btn"
                onClick={updateSoilData}
                disabled={!appData.location || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Update Soil Data
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </ClickSpark>
      </div>

      {/* Soil Results */}
      {soilData && (
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3>
            <i className="fas fa-chart-bar"></i>
            Soil Analysis Results
          </h3>
          
          <div className="soil-results">
            <div className="soil-properties">
              <h4><i className="fas fa-info-circle"></i> Soil Properties</h4>
              <div className="properties-grid">
                <div className="property-item">
                  <strong>Type:</strong> {soilData.soilData.type}
                </div>
                <div className="property-item">
                  <strong>pH:</strong> {soilData.soilData.ph}
                </div>
                <div className="property-item">
                  <strong>Texture:</strong> {soilData.soilData.texture || 'N/A'}
                </div>
                <div className="property-item">
                  <strong>Organic Matter:</strong> {soilData.soilData.organicMatter || 'N/A'}%
                </div>
                <div className="property-item">
                  <strong>Drainage:</strong> {soilData.soilData.drainage || 'N/A'}
                </div>
              </div>
            </div>

            <div className="nutrient-levels">
              <h4><i class="fas fa-flask"></i> Nutrient Levels</h4>
              <div className="nutrients">
                <span className={`nutrient-badge nutrient-${soilData.soilData.nitrogen.toLowerCase()}`}>
                  <i className="fas fa-leaf"></i> Nitrogen: {soilData.soilData.nitrogen}
                </span>
                <span className={`nutrient-badge nutrient-${soilData.soilData.phosphorus.toLowerCase()}`}>
                  <i className="fas fa-seedling"></i> Phosphorus: {soilData.soilData.phosphorus}
                </span>
                <span className={`nutrient-badge nutrient-${soilData.soilData.potassium.toLowerCase()}`}>
                  <i className="fas fa-tree"></i> Potassium: {soilData.soilData.potassium}
                </span>
              </div>
            </div>

            <div className="soil-analysis">
              <h4><i className="fas fa-chart-line"></i> Analysis</h4>
              <p><strong>Fertility Level:</strong> 
                <span className={`fertility-${soilData.analysis?.fertility?.toLowerCase() || 'medium'}`}>
                  {soilData.analysis?.fertility || 'Medium'}
                </span>
              </p>
              
              {soilData.analysis?.strengths?.length > 0 && (
                <div className="soil-strengths">
                  <h5><i className="fas fa-thumbs-up text-success"></i> Strengths</h5>
                  <ul>
                    {soilData.analysis.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {soilData.analysis?.deficiencies?.length > 0 && (
                <div className="soil-deficiencies">
                  <h5><i className="fas fa-exclamation-triangle text-warning"></i> Areas for Improvement</h5>
                  <ul>
                    {soilData.analysis.deficiencies.map((deficiency, index) => (
                      <li key={index}>{deficiency}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <button 
            className="btn btn-success"
            onClick={() => onSoilAnalyzed(soilData.soilData)}
            style={{ marginTop: '2rem' }}
          >
            <i className="fas fa-arrow-right"></i>
            Check Weather Conditions
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SoilSection;