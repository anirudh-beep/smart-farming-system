import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ClickSpark from '../ClickSpark/ClickSpark';
import axios from 'axios';

const LocationSection = ({ onLocationSet, appData }) => {
  const [gpsStatus, setGpsStatus] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [regions, setRegions] = useState({});
  const [selectedLocation, setSelectedLocation] = useState({
    country: '',
    state: '',
    district: '',
    village: ''
  });
  const [locationResult, setLocationResult] = useState(null);

  // Sample locations for testing
  const sampleLocations = [
    { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra' },
    { lat: 12.9716, lng: 77.5946, name: 'Bangalore, Karnataka' },
    { lat: 26.2183, lng: 78.1828, name: 'Gwalior, Madhya Pradesh' },
    { lat: 21.1702, lng: 72.8311, name: 'Surat, Gujarat' },
    { lat: 25.3176, lng: 82.9739, name: 'Varanasi, Uttar Pradesh' },
    { lat: 26.1197, lng: 85.3910, name: 'Muzaffarpur, Bihar' },
    { lat: 28.3949, lng: 77.3178, name: 'Faridabad, Haryana' },
    { lat: 22.7196, lng: 75.8577, name: 'Indore, Madhya Pradesh' },
    { lat: 19.9975, lng: 73.7898, name: 'Nashik, Maharashtra' },
    { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, Gujarat' }
  ];

  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const response = await axios.get('/api/location/regions');
      setRegions(response.data);
    } catch (error) {
      console.error('Error loading regions:', error);
      // Fallback regions - India only
      setRegions({
        India: {
          Maharashtra: {
            Pune: ['Kothrud', 'Hadapsar', 'Wakad', 'Baner', 'Aundh'],
            Mumbai: ['Andheri', 'Bandra', 'Colaba', 'Powai', 'Thane'],
            Nashik: ['Nashik Road', 'Panchavati', 'Satpur'],
            Aurangabad: ['CIDCO', 'Garkheda', 'Waluj']
          },
          Karnataka: {
            Bangalore: ['Whitefield', 'Koramangala', 'Indiranagar', 'Electronic City', 'Hebbal'],
            Mysore: ['Mysore City', 'Chamundi Hills', 'KRS'],
            Hubli: ['Hubli City', 'Dharwad', 'Unkal']
          },
          'Uttar Pradesh': {
            Lucknow: ['Gomti Nagar', 'Hazratganj', 'Alambagh'],
            Varanasi: ['Cantonment', 'Lanka', 'Sigra'],
            Agra: ['Taj Ganj', 'Sadar', 'Sikandra']
          },
          Gujarat: {
            Ahmedabad: ['Satellite', 'Bopal', 'Maninagar'],
            Surat: ['Adajan', 'Vesu', 'Katargam'],
            Vadodara: ['Alkapuri', 'Fatehgunj', 'Manjalpur']
          },
          'Madhya Pradesh': {
            Bhopal: ['New Market', 'MP Nagar', 'Arera Colony'],
            Indore: ['Vijay Nagar', 'Palasia', 'Rau'],
            Gwalior: ['Lashkar', 'Morar', 'City Centre']
          }
        }
      });
    }
  };

  const detectGPSLocation = async () => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS not supported by this browser');
      return;
    }

    setIsDetecting(true);
    setGpsStatus('Requesting location permission...');

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        try {
          const response = await axios.post('/api/location/detect', {
            latitude,
            longitude,
            accuracy
          });

          if (response.data.success) {
            setLocationResult(response.data);
            setGpsStatus('Location detected successfully!');
            onLocationSet(response.data.location);
          } else {
            setGpsStatus(response.data.message || 'Location detection failed');
          }
        } catch (error) {
          setGpsStatus('Error processing location: ' + error.message);
        }
        
        setIsDetecting(false);
      },
      (error) => {
        let message = 'Location detection failed: ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message += 'Permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message += 'Position unavailable';
            break;
          case error.TIMEOUT:
            message += 'Request timeout';
            break;
          default:
            message += 'Unknown error';
        }
        setGpsStatus(message);
        setIsDetecting(false);
      },
      options
    );
  };

  const testSampleLocation = async () => {
    const location = sampleLocations[currentSampleIndex];
    const nextIndex = (currentSampleIndex + 1) % sampleLocations.length;
    setCurrentSampleIndex(nextIndex);

    setGpsStatus(`Testing with sample location: ${location.name}`);
    
    try {
      const response = await axios.post('/api/location/detect', {
        latitude: location.lat,
        longitude: location.lng,
        accuracy: Math.floor(Math.random() * 100) + 20
      });

      if (response.data.success) {
        setLocationResult(response.data);
        setGpsStatus('Sample location loaded successfully!');
        onLocationSet(response.data.location);
      } else {
        setGpsStatus('Sample location test failed');
      }
    } catch (error) {
      setGpsStatus('Sample location test error: ' + error.message);
    }
  };

  const handleManualLocationSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLocation.country || !selectedLocation.state || !selectedLocation.district) {
      alert('Please select at least Country, State, and District');
      return;
    }

    try {
      const response = await axios.post('/api/location/manual', selectedLocation);
      
      if (response.data.success) {
        setLocationResult(response.data);
        onLocationSet(response.data.location);
      } else {
        alert('Error: ' + response.data.error);
      }
    } catch (error) {
      alert('Error setting location: ' + error.message);
    }
  };

  const updateStates = (country) => {
    setSelectedLocation(prev => ({
      ...prev,
      country,
      state: '',
      district: '',
      village: ''
    }));
  };

  const updateDistricts = (state) => {
    setSelectedLocation(prev => ({
      ...prev,
      state,
      district: '',
      village: ''
    }));
  };

  const updateVillages = (district) => {
    setSelectedLocation(prev => ({
      ...prev,
      district,
      village: ''
    }));
  };

  const nextSampleLocation = sampleLocations[(currentSampleIndex + 1) % sampleLocations.length];

  return (
    <div className="location-section">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>
          <i className="fas fa-map-marker-alt"></i>
          Location Detection
        </h2>
      </motion.div>

      <div className="grid grid-2">
        {/* GPS Detection Card */}
        <ClickSpark>
          <motion.div 
            className="card clickable"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3>
              <i className="fas fa-satellite"></i>
              GPS Detection
            </h3>
            
            <div className="gps-controls">
              <button 
                className="btn btn-primary"
                onClick={detectGPSLocation}
                disabled={isDetecting}
              >
                {isDetecting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Detecting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-crosshairs"></i>
                    Detect My Location
                  </>
                )}
              </button>

              <button 
                className="btn btn-outline"
                onClick={testSampleLocation}
                style={{ marginTop: '1rem' }}
              >
                <i className="fas fa-vial"></i>
                Test: {nextSampleLocation.name}
              </button>
            </div>

            {gpsStatus && (
              <motion.div 
                className={`status-message ${
                  gpsStatus.includes('success') ? 'status-success' : 
                  gpsStatus.includes('failed') || gpsStatus.includes('Error') ? 'status-error' : 
                  'status-info'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {gpsStatus}
              </motion.div>
            )}
          </motion.div>
        </ClickSpark>

        {/* Manual Selection Card */}
        <ClickSpark>
          <motion.div 
            className="card clickable"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3>
              <i className="fas fa-edit"></i>
              Manual Selection
            </h3>
            
            <form onSubmit={handleManualLocationSubmit}>
              <div className="form-group">
                <label>Country:</label>
                <select 
                  className="form-select"
                  value={selectedLocation.country}
                  onChange={(e) => updateStates(e.target.value)}
                  required
                >
                  <option value="">Select Country</option>
                  {Object.keys(regions).map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>State:</label>
                <select 
                  className="form-select"
                  value={selectedLocation.state}
                  onChange={(e) => updateDistricts(e.target.value)}
                  required
                >
                  <option value="">Select State</option>
                  {selectedLocation.country && regions[selectedLocation.country] && 
                    Object.keys(regions[selectedLocation.country]).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label>District:</label>
                <select 
                  className="form-select"
                  value={selectedLocation.district}
                  onChange={(e) => updateVillages(e.target.value)}
                  required
                >
                  <option value="">Select District</option>
                  {selectedLocation.state && regions[selectedLocation.country]?.[selectedLocation.state] && 
                    Object.keys(regions[selectedLocation.country][selectedLocation.state]).map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label>Village (Optional):</label>
                <select 
                  className="form-select"
                  value={selectedLocation.village}
                  onChange={(e) => setSelectedLocation(prev => ({ ...prev, village: e.target.value }))}
                >
                  <option value="">Select Village</option>
                  {selectedLocation.district && 
                    regions[selectedLocation.country]?.[selectedLocation.state]?.[selectedLocation.district]?.map(village => (
                      <option key={village} value={village}>{village}</option>
                    ))
                  }
                </select>
              </div>

              <button type="submit" className="btn btn-secondary">
                <i className="fas fa-check"></i>
                Set Location
              </button>
            </form>
          </motion.div>
        </ClickSpark>
      </div>

      {/* Location Result */}
      {locationResult && (
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3>
            <i className="fas fa-map-pin"></i>
            Selected Location
          </h3>
          
          <div className="location-details">
            <div className="location-info">
              <p><strong>Country:</strong> {locationResult.location.country}</p>
              <p><strong>State:</strong> {locationResult.location.state}</p>
              <p><strong>District:</strong> {locationResult.location.district}</p>
              {locationResult.location.village && (
                <p><strong>Village:</strong> {locationResult.location.village}</p>
              )}
              <p><strong>Detection Method:</strong> {locationResult.method}</p>
              {locationResult.coordinates && (
                <>
                  <p><strong>Coordinates:</strong> {locationResult.coordinates.latitude.toFixed(4)}, {locationResult.coordinates.longitude.toFixed(4)}</p>
                  <p><strong>Accuracy:</strong> {locationResult.coordinates.accuracy}m</p>
                </>
              )}
            </div>
          </div>

          <button 
            className="btn btn-success"
            onClick={() => onLocationSet(locationResult.location)}
          >
            <i className="fas fa-arrow-right"></i>
            Proceed to Soil Analysis
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default LocationSection;