// Global variables
let currentLocation = null;
let currentSoilData = null;
let currentWeatherData = null;

// DOM Elements
const gpsDetectBtn = document.getElementById('gps-detect');
const gpsStatus = document.getElementById('gps-status');
const manualLocationForm = document.getElementById('manual-location-form');
const locationResult = document.getElementById('location-result');
const analyzeSoilBtn = document.getElementById('analyze-soil');
const soilInputForm = document.getElementById('soil-input-form');
const soilResult = document.getElementById('soil-result');
const getWeatherBtn = document.getElementById('get-weather');
const seasonalAnalysisBtn = document.getElementById('seasonal-analysis');
const weatherResult = document.getElementById('weather-result');
const getRecommendationsBtn = document.getElementById('get-recommendations');
const fertilizerRecommendationsBtn = document.getElementById('fertilizer-recommendations');
const cropResult = document.getElementById('crop-result');
const fertilizerResult = document.getElementById('fertilizer-result');
const aiInsightsResult = document.getElementById('ai-insights-result');
const customCropForm = document.getElementById('custom-crop-form');
const loadingOverlay = document.getElementById('loading-overlay');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadAvailableRegions();
    setupNavigation();
}

function setupEventListeners() {
    // GPS Detection
    gpsDetectBtn.addEventListener('click', detectGPSLocation);
    
    // Test Location
    document.getElementById('test-location').addEventListener('click', testSampleLocation);
    
    // Manual Location
    manualLocationForm.addEventListener('submit', handleManualLocation);
    document.getElementById('country').addEventListener('change', updateStates);
    document.getElementById('state').addEventListener('change', updateDistricts);
    document.getElementById('district').addEventListener('change', updateVillages);
    
    // Soil Analysis
    analyzeSoilBtn.addEventListener('click', analyzeSoil);
    soilInputForm.addEventListener('submit', updateSoilData);
    
    // Weather
    getWeatherBtn.addEventListener('click', getWeatherForecast);
    seasonalAnalysisBtn.addEventListener('click', getSeasonalAnalysis);
    
    // Crop Recommendations
    getRecommendationsBtn.addEventListener('click', getCropRecommendations);
    fertilizerRecommendationsBtn.addEventListener('click', getFertilizerRecommendations);
    
    // Custom Crop
    customCropForm.addEventListener('submit', addCustomCrop);
}

function setupNavigation() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
    
    // Hero feature cards navigation - enhanced
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.addEventListener('click', function() {
            const sections = ['location', 'soil', 'weather', 'crops'];
            if (sections[index]) {
                scrollToSection(sections[index]);
                
                // Add visual feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            }
        });
        
        // Make cards look clickable
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s ease';
    });
    
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Location Functions
function detectGPSLocation() {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        showStatus(gpsStatus, '📍 GPS not supported by this browser. Please use manual selection.', 'error');
        return;
    }
    
    showStatus(gpsStatus, '🔍 Requesting location permission...', 'info');
    gpsDetectBtn.disabled = true;
    gpsDetectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
    
    // Try multiple approaches for better success rate
    const options = [
        // High accuracy GPS
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
        // Network location (faster)
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        // Last resort - cached location
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    ];
    
    let attemptCount = 0;
    
    function tryGeolocation(optionIndex = 0) {
        if (optionIndex >= options.length) {
            showStatus(gpsStatus, '❌ All location detection methods failed. Please use manual selection.', 'error');
            gpsDetectBtn.disabled = false;
            gpsDetectBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Try Again';
            return;
        }
        
        attemptCount++;
        const currentOptions = options[optionIndex];
        
        showStatus(gpsStatus, `🔍 Trying location method ${attemptCount}...`, 'info');
        
        navigator.geolocation.getCurrentPosition(
            async function(position) {
                const { latitude, longitude, accuracy } = position.coords;
                
                console.log(`GPS Success: lat=${latitude}, lng=${longitude}, accuracy=${accuracy}m`);
                showStatus(gpsStatus, '📍 Location found! Processing...', 'info');
                
                try {
                    const response = await fetch('/api/location/detect', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude, longitude, accuracy })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    console.log('Location API response:', result);
                    
                    if (result.success) {
                        currentLocation = result.location;
                        showLocationResult(result);
                        showStatus(gpsStatus, '✅ Location detected successfully!', 'success');
                        showNotification(`Location: ${result.location.district}, ${result.location.state}`, 'success');
                        enableNextStep('soil');
                    } else {
                        showStatus(gpsStatus, '⚠️ ' + result.message, 'warning');
                        setTimeout(() => {
                            showStatus(gpsStatus, '👇 Please use manual location selection below', 'info');
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Location API error:', error);
                    showStatus(gpsStatus, '❌ Error processing location: ' + error.message, 'error');
                    setTimeout(() => {
                        showStatus(gpsStatus, '👇 Please use manual location selection below', 'info');
                    }, 2000);
                }
                
                gpsDetectBtn.disabled = false;
                gpsDetectBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Detect My Location';
            },
            function(error) {
                console.error(`Geolocation attempt ${attemptCount} failed:`, error);
                
                // Try next method
                if (optionIndex < options.length - 1) {
                    setTimeout(() => tryGeolocation(optionIndex + 1), 1000);
                    return;
                }
                
                // All methods failed
                let message = '❌ Location detection failed: ';
                let suggestion = '';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Permission denied.';
                        suggestion = '💡 Please allow location access and try again.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Position unavailable.';
                        suggestion = '💡 Please check your GPS/internet connection.';
                        break;
                    case error.TIMEOUT:
                        message += 'Request timeout.';
                        suggestion = '💡 Location detection took too long.';
                        break;
                    default:
                        message += 'Unknown error.';
                        suggestion = '💡 Please try manual selection.';
                        break;
                }
                
                showStatus(gpsStatus, message, 'error');
                setTimeout(() => {
                    showStatus(gpsStatus, suggestion, 'info');
                }, 2000);
                
                gpsDetectBtn.disabled = false;
                gpsDetectBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Try Again';
            },
            currentOptions
        );
    }
    
    // Start the detection process
    tryGeolocation(0);
}

async function loadAvailableRegions() {
    try {
        const response = await fetch('/api/location/regions');
        const regions = await response.json();
        
        const countrySelect = document.getElementById('country');
        countrySelect.innerHTML = '<option value="">Select Country</option>';
        
        Object.keys(regions).forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
        
        // Store regions globally for state/district updates
        window.availableRegions = regions;
    } catch (error) {
        console.error('Error loading regions:', error);
    }
}

function updateStates() {
    const country = document.getElementById('country').value;
    const stateSelect = document.getElementById('state');
    const districtSelect = document.getElementById('district');
    const villageSelect = document.getElementById('village');
    
    // Reset dependent selects
    stateSelect.innerHTML = '<option value="">Select State</option>';
    districtSelect.innerHTML = '<option value="">Select District</option>';
    villageSelect.innerHTML = '<option value="">Select Village (Optional)</option>';
    
    if (country && window.availableRegions[country]) {
        Object.keys(window.availableRegions[country]).forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
    }
}

function updateDistricts() {
    const country = document.getElementById('country').value;
    const state = document.getElementById('state').value;
    const districtSelect = document.getElementById('district');
    const villageSelect = document.getElementById('village');
    
    // Reset dependent selects
    districtSelect.innerHTML = '<option value="">Select District</option>';
    villageSelect.innerHTML = '<option value="">Select Village (Optional)</option>';
    
    if (country && state && window.availableRegions[country][state]) {
        Object.keys(window.availableRegions[country][state]).forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
    }
}

function updateVillages() {
    const country = document.getElementById('country').value;
    const state = document.getElementById('state').value;
    const district = document.getElementById('district').value;
    const villageSelect = document.getElementById('village');
    
    villageSelect.innerHTML = '<option value="">Select Village (Optional)</option>';
    
    if (country && state && district && window.availableRegions[country][state][district]) {
        window.availableRegions[country][state][district].forEach(village => {
            const option = document.createElement('option');
            option.value = village;
            option.textContent = village;
            villageSelect.appendChild(option);
        });
    }
}

async function handleManualLocation(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const locationData = {
        country: formData.get('country') || document.getElementById('country').value,
        state: formData.get('state') || document.getElementById('state').value,
        district: formData.get('district') || document.getElementById('district').value,
        village: formData.get('village') || document.getElementById('village').value
    };
    
    if (!locationData.country || !locationData.state || !locationData.district) {
        alert('Please select at least Country, State, and District');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/location/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentLocation = result.location;
            showLocationResult(result);
            enableNextStep('soil');
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error setting location: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showLocationResult(result) {
    const locationDetails = document.getElementById('location-details');
    const location = result.location;
    
    locationDetails.innerHTML = `
        <div class="location-info">
            <p><strong>Country:</strong> ${location.country}</p>
            <p><strong>State:</strong> ${location.state}</p>
            <p><strong>District:</strong> ${location.district}</p>
            ${location.village ? `<p><strong>Village:</strong> ${location.village}</p>` : ''}
            <p><strong>Detection Method:</strong> ${result.method}</p>
            ${result.coordinates ? `
                <p><strong>Coordinates:</strong> ${result.coordinates.latitude.toFixed(4)}, ${result.coordinates.longitude.toFixed(4)}</p>
                <p><strong>Accuracy:</strong> ${result.coordinates.accuracy}m</p>
            ` : ''}
        </div>
    `;
    
    locationResult.style.display = 'block';
}

// Soil Analysis Functions
async function analyzeSoil() {
    if (!currentLocation) {
        alert('Please set your location first');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/soil/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: currentLocation })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentSoilData = result.soilData;
            showSoilResult(result);
            enableNextStep('weather');
        } else {
            alert('Error analyzing soil: ' + result.error);
        }
    } catch (error) {
        alert('Error analyzing soil: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function updateSoilData(e) {
    e.preventDefault();
    
    if (!currentLocation) {
        alert('Please set your location first');
        return;
    }
    
    const formData = new FormData(e.target);
    const userSoilData = {};
    
    // Collect non-empty form values with proper field mapping
    const soilTypeValue = document.getElementById('soil-type').value;
    const soilPhValue = document.getElementById('soil-ph').value;
    const nitrogenValue = document.getElementById('nitrogen').value;
    const phosphorusValue = document.getElementById('phosphorus').value;
    const potassiumValue = document.getElementById('potassium').value;
    
    if (soilTypeValue && soilTypeValue !== '') {
        userSoilData.type = soilTypeValue;
    }
    if (soilPhValue && soilPhValue !== '') {
        userSoilData.ph = parseFloat(soilPhValue);
    }
    if (nitrogenValue && nitrogenValue !== '') {
        userSoilData.nitrogen = nitrogenValue;
    }
    if (phosphorusValue && phosphorusValue !== '') {
        userSoilData.phosphorus = phosphorusValue;
    }
    if (potassiumValue && potassiumValue !== '') {
        userSoilData.potassium = potassiumValue;
    }
    
    console.log('Manual soil data to send:', userSoilData);
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/soil/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                location: currentLocation,
                userSoilData: userSoilData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentSoilData = result.soilData;
            showSoilResult(result);
            enableNextStep('weather');
        } else {
            alert('Error updating soil data: ' + result.error);
        }
    } catch (error) {
        alert('Error updating soil data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showSoilResult(result) {
    const soilDetails = document.getElementById('soil-details');
    const { soilData, analysis, recommendations } = result;
    
    soilDetails.innerHTML = `
        <div class="soil-info">
            <div class="soil-basic-info">
                <h4><i class="fas fa-info-circle"></i> Soil Properties</h4>
                <div class="soil-properties">
                    <p><strong>Type:</strong> ${soilData.type}</p>
                    <p><strong>pH:</strong> ${soilData.ph}</p>
                    <p><strong>Texture:</strong> ${soilData.texture}</p>
                    <p><strong>Organic Matter:</strong> ${soilData.organicMatter}%</p>
                    <p><strong>Drainage:</strong> ${soilData.drainage}</p>
                </div>
            </div>
            
            <div class="nutrient-levels">
                <h4><i class="fas fa-flask"></i> Nutrient Levels</h4>
                <div class="nutrients">
                    <span class="nutrient-badge nutrient-${soilData.nitrogen.toLowerCase()}">
                        <i class="fas fa-leaf"></i> Nitrogen: ${soilData.nitrogen}
                    </span>
                    <span class="nutrient-badge nutrient-${soilData.phosphorus.toLowerCase()}">
                        <i class="fas fa-seedling"></i> Phosphorus: ${soilData.phosphorus}
                    </span>
                    <span class="nutrient-badge nutrient-${soilData.potassium.toLowerCase()}">
                        <i class="fas fa-tree"></i> Potassium: ${soilData.potassium}
                    </span>
                </div>
            </div>
            
            <div class="soil-analysis">
                <h4><i class="fas fa-chart-line"></i> Analysis</h4>
                <p><strong>Fertility Level:</strong> <span class="fertility-${analysis.fertility.toLowerCase()}">${analysis.fertility}</span></p>
                
                ${analysis.strengths.length > 0 ? `
                    <div class="soil-strengths">
                        <h5><i class="fas fa-thumbs-up text-success"></i> Strengths</h5>
                        <ul>
                            ${analysis.strengths.map(strength => `<li>${strength}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${analysis.deficiencies.length > 0 ? `
                    <div class="soil-deficiencies">
                        <h5><i class="fas fa-exclamation-triangle text-warning"></i> Areas for Improvement</h5>
                        <ul>
                            ${analysis.deficiencies.map(deficiency => `<li>${deficiency}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            
            ${recommendations.fertilizers.length > 0 ? `
                <div class="fertilizer-recommendations">
                    <h4><i class="fas fa-prescription-bottle"></i> Fertilizer Recommendations</h4>
                    ${recommendations.fertilizers.map(fert => `
                        <div class="fertilizer-rec">
                            <strong>${fert.type} Fertilizer:</strong>
                            <p>Options: ${fert.options.join(', ')}</p>
                            <p>Application: ${fert.application}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    // Add CSS for nutrient badges
    const style = document.createElement('style');
    style.textContent = `
        .soil-properties { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-bottom: 1rem; }
        .nutrients { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .nutrient-badge { padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold; display: inline-flex; align-items: center; gap: 0.5rem; }
        .nutrient-low { background: #f8d7da; color: #721c24; }
        .nutrient-medium { background: #fff3cd; color: #856404; }
        .nutrient-high { background: #d4edda; color: #155724; }
        .fertility-low { color: #dc3545; font-weight: bold; }
        .fertility-medium { color: #ffc107; font-weight: bold; }
        .fertility-high { color: #28a745; font-weight: bold; }
        .soil-strengths, .soil-deficiencies, .fertilizer-rec { margin-bottom: 1rem; }
        .fertilizer-rec { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem; }
    `;
    document.head.appendChild(style);
    
    soilResult.style.display = 'block';
}

// Weather Functions
async function getWeatherForecast() {
    if (!currentLocation) {
        alert('Please set your location first');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/weather/forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: currentLocation })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentWeatherData = result;
            showWeatherResult(result);
            enableNextStep('crops');
        } else {
            alert('Error getting weather forecast: ' + result.error);
        }
    } catch (error) {
        alert('Error getting weather forecast: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function getSeasonalAnalysis() {
    if (!currentLocation) {
        alert('Please set your location first');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/weather/seasonal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: currentLocation })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSeasonalAnalysis(result);
        } else {
            alert('Error getting seasonal analysis: ' + result.error);
        }
    } catch (error) {
        alert('Error getting seasonal analysis: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showWeatherResult(result) {
    const currentWeatherDetails = document.getElementById('current-weather-details');
    const forecastDetails = document.getElementById('forecast-details');
    const weatherInsights = document.getElementById('weather-insights');
    
    // Current weather
    currentWeatherDetails.innerHTML = `
        <div class="current-weather-info">
            <div class="weather-main">
                <div class="temperature">${Math.round(result.current.temperature)}°C</div>
                <div class="condition">${result.current.condition}</div>
            </div>
            <div class="weather-details">
                <p><i class="fas fa-tint"></i> Humidity: ${result.current.humidity}%</p>
                <p><i class="fas fa-cloud-rain"></i> Rainfall: ${result.current.rainfall.toFixed(1)}mm</p>
                <p><i class="fas fa-wind"></i> Wind: ${Math.round(result.current.windSpeed)} km/h</p>
                <p><i class="fas fa-sun"></i> UV Index: ${result.current.uvIndex}</p>
            </div>
        </div>
    `;
    
    // Forecast
    forecastDetails.innerHTML = result.forecast.map(day => `
        <div class="weather-day">
            <div class="weather-day-info">
                <div class="weather-day-date">${new Date(day.date).toLocaleDateString()}</div>
                <div class="weather-day-condition">${day.condition}</div>
            </div>
            <div class="weather-day-temp">${Math.round(day.minTemp)}° / ${Math.round(day.maxTemp)}°</div>
            <div class="weather-day-rain">
                <i class="fas fa-cloud-rain"></i> ${day.rainfall.toFixed(1)}mm (${day.chanceOfRain}%)
            </div>
        </div>
    `).join('');
    
    // Enhanced Farming Insights
    const analysis = result.analysis;
    const totalRainfall = result.forecast.reduce((sum, day) => sum + day.rainfall, 0);
    const avgTemp = result.forecast.reduce((sum, day) => sum + (day.maxTemp + day.minTemp) / 2, 0) / result.forecast.length;
    const avgHumidity = result.forecast.reduce((sum, day) => sum + day.humidity, 0) / result.forecast.length;
    
    weatherInsights.innerHTML = `
        <div class="weather-insights-content">
            <!-- Weather Summary Cards -->
            <div class="weather-summary-cards">
                <div class="summary-card rainfall-card">
                    <div class="card-icon"><i class="fas fa-cloud-rain"></i></div>
                    <div class="card-content">
                        <h6>7-Day Rainfall</h6>
                        <span class="card-value">${totalRainfall.toFixed(1)}mm</span>
                        <small class="card-status ${totalRainfall > 50 ? 'status-high' : totalRainfall > 20 ? 'status-medium' : 'status-low'}">
                            ${totalRainfall > 50 ? 'Heavy' : totalRainfall > 20 ? 'Moderate' : 'Light'}
                        </small>
                    </div>
                </div>
                <div class="summary-card temperature-card">
                    <div class="card-icon"><i class="fas fa-thermometer-half"></i></div>
                    <div class="card-content">
                        <h6>Avg Temperature</h6>
                        <span class="card-value">${avgTemp.toFixed(1)}°C</span>
                        <small class="card-status ${avgTemp > 30 ? 'status-high' : avgTemp > 20 ? 'status-medium' : 'status-low'}">
                            ${avgTemp > 30 ? 'Hot' : avgTemp > 20 ? 'Moderate' : 'Cool'}
                        </small>
                    </div>
                </div>
                <div class="summary-card humidity-card">
                    <div class="card-icon"><i class="fas fa-tint"></i></div>
                    <div class="card-content">
                        <h6>Avg Humidity</h6>
                        <span class="card-value">${avgHumidity.toFixed(0)}%</span>
                        <small class="card-status ${avgHumidity > 70 ? 'status-high' : avgHumidity > 50 ? 'status-medium' : 'status-low'}">
                            ${avgHumidity > 70 ? 'High' : avgHumidity > 50 ? 'Moderate' : 'Low'}
                        </small>
                    </div>
                </div>
            </div>

            <!-- Detailed Farming Insights -->
            <div class="farming-insights-detailed">
                ${analysis.recommendations.length > 0 ? `
                    <div class="insight-section recommendations">
                        <h5><i class="fas fa-lightbulb text-info"></i> Farming Recommendations</h5>
                        <div class="insight-grid">
                            ${analysis.recommendations.map(rec => `
                                <div class="insight-item">
                                    <i class="fas fa-check-circle text-success"></i>
                                    <span>${rec}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${analysis.warnings.length > 0 ? `
                    <div class="insight-section warnings">
                        <h5><i class="fas fa-exclamation-triangle text-warning"></i> Weather Alerts</h5>
                        <div class="insight-grid">
                            ${analysis.warnings.map(warning => `
                                <div class="insight-item warning-item">
                                    <i class="fas fa-exclamation-circle text-warning"></i>
                                    <span>${warning}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${analysis.opportunities.length > 0 ? `
                    <div class="insight-section opportunities">
                        <h5><i class="fas fa-star text-success"></i> Farming Opportunities</h5>
                        <div class="insight-grid">
                            ${analysis.opportunities.map(opp => `
                                <div class="insight-item opportunity-item">
                                    <i class="fas fa-seedling text-success"></i>
                                    <span>${opp}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Additional Farming Guidance -->
                <div class="insight-section farming-guidance">
                    <h5><i class="fas fa-tractor"></i> Field Operations Guidance</h5>
                    <div class="guidance-grid">
                        <div class="guidance-item">
                            <i class="fas fa-seedling"></i>
                            <div class="guidance-content">
                                <h6>Planting Conditions</h6>
                                <p>${this.getPlantingGuidance(result.current, totalRainfall)}</p>
                            </div>
                        </div>
                        <div class="guidance-item">
                            <i class="fas fa-spray-can"></i>
                            <div class="guidance-content">
                                <h6>Spraying Conditions</h6>
                                <p>${this.getSprayingGuidance(result.current)}</p>
                            </div>
                        </div>
                        <div class="guidance-item">
                            <i class="fas fa-cut"></i>
                            <div class="guidance-content">
                                <h6>Harvesting Conditions</h6>
                                <p>${this.getHarvestingGuidance(result.current, result.forecast)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add weather-specific CSS
    const style = document.createElement('style');
    style.textContent = `
        .current-weather-info { display: flex; gap: 2rem; align-items: center; flex-wrap: wrap; }
        .weather-main { text-align: center; }
        .temperature { font-size: 3rem; font-weight: bold; color: #2c5530; }
        .condition { font-size: 1.2rem; color: #6c757d; }
        .weather-details p { margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
        .weather-day { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; border-radius: 8px; margin-bottom: 0.5rem; }
        .weather-day-date { font-weight: bold; }
        .weather-day-temp { font-size: 1.1rem; font-weight: bold; color: #2c5530; }
        .weather-day-rain { font-size: 0.9rem; color: #6c757d; }
        .recommendations, .warnings, .opportunities { margin-bottom: 1rem; }
        .recommendations ul, .warnings ul, .opportunities ul { margin-left: 1rem; }
    `;
    document.head.appendChild(style);
    
    weatherResult.style.display = 'block';
}

function showSeasonalAnalysis(result) {
    // Show seasonal analysis in separate section
    const seasonalResult = document.getElementById('seasonal-result');
    const plantingSchedule = document.getElementById('planting-schedule-details');
    const riskAssessment = document.getElementById('risk-assessment-details');
    const cropCalendar = document.getElementById('crop-calendar-details');
    const seasonalTips = document.getElementById('seasonal-tips-details');
    
    // Planting Schedule
    plantingSchedule.innerHTML = `
        <div class="planting-info">
            <div class="planting-times">
                ${result.bestPlantingTime.map(time => `
                    <div class="planting-item">
                        <i class="fas fa-check-circle text-success"></i>
                        <span>${time}</span>
                    </div>
                `).join('')}
            </div>
            ${result.cropAdvice ? `
                <div class="crop-requirements">
                    <h5>Crop Requirements</h5>
                    <div class="requirement-item">
                        <i class="fas fa-tint"></i>
                        <span><strong>Water Needs:</strong> ${result.cropAdvice.waterNeeds}</span>
                    </div>
                    <div class="requirement-item">
                        <i class="fas fa-thermometer-half"></i>
                        <span><strong>Temperature Range:</strong> ${result.cropAdvice.temperatureRange}</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Risk Assessment
    riskAssessment.innerHTML = `
        <div class="risk-grid">
            <div class="risk-item risk-drought">
                <div class="risk-icon"><i class="fas fa-sun"></i></div>
                <div class="risk-details">
                    <h5>Drought Risk</h5>
                    <p>${result.riskAssessment.droughtRisk}</p>
                </div>
            </div>
            <div class="risk-item risk-flood">
                <div class="risk-icon"><i class="fas fa-water"></i></div>
                <div class="risk-details">
                    <h5>Flood Risk</h5>
                    <p>${result.riskAssessment.floodRisk}</p>
                </div>
            </div>
            <div class="risk-item risk-temperature">
                <div class="risk-icon"><i class="fas fa-temperature-high"></i></div>
                <div class="risk-details">
                    <h5>Temperature Stress</h5>
                    <p>${result.riskAssessment.temperatureStress}</p>
                </div>
            </div>
            <div class="risk-item risk-disease">
                <div class="risk-icon"><i class="fas fa-virus"></i></div>
                <div class="risk-details">
                    <h5>Disease Risk</h5>
                    <p>${result.riskAssessment.diseaseRisk}</p>
                </div>
            </div>
        </div>
    `;
    
    // Agricultural Calendar
    const currentMonth = new Date().getMonth();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    cropCalendar.innerHTML = `
        <div class="calendar-info">
            <p class="current-month"><i class="fas fa-calendar-day"></i> Current Month: <strong>${months[currentMonth]}</strong></p>
            <div class="season-timeline">
                <div class="season-block monsoon">
                    <h6>Monsoon Season</h6>
                    <p>June - September</p>
                    <small>Kharif crops: Rice, Cotton, Maize</small>
                </div>
                <div class="season-block winter">
                    <h6>Winter Season</h6>
                    <p>October - February</p>
                    <small>Rabi crops: Wheat, Mustard, Barley</small>
                </div>
                <div class="season-block summer">
                    <h6>Summer Season</h6>
                    <p>March - May</p>
                    <small>Zaid crops: Watermelon, Cucumber, Vegetables</small>
                </div>
            </div>
        </div>
    `;
    
    // Seasonal Tips
    seasonalTips.innerHTML = `
        <div class="tips-list">
            ${result.cropAdvice && result.cropAdvice.seasonalTips ? 
                result.cropAdvice.seasonalTips.map(tip => `
                    <div class="tip-item">
                        <i class="fas fa-lightbulb text-warning"></i>
                        <span>${tip}</span>
                    </div>
                `).join('') 
                : '<p>Complete weather analysis to get seasonal tips</p>'
            }
        </div>
    `;
    
    seasonalResult.style.display = 'block';
    showNotification('Seasonal analysis completed!', 'success');
    
    // Scroll to seasonal results
    seasonalResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Crop Recommendation Functions
async function getCropRecommendations() {
    if (!currentLocation) {
        showNotification('Please set your location first', 'warning');
        scrollToSection('location');
        return;
    }
    
    if (!currentSoilData) {
        showNotification('Please complete soil analysis first', 'warning');
        scrollToSection('soil');
        return;
    }
    
    try {
        showLoading(true);
        
        const requestData = {
            location: currentLocation,
            soilData: currentSoilData,
            weatherData: currentWeatherData || null
        };
        
        console.log('Sending crop recommendation request:', requestData);
        
        const response = await fetch('/api/crop/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Crop recommendations response:', result);
        
        if (result.success) {
            showCropRecommendations(result);
            // Get AI insights after showing recommendations
            setTimeout(() => getAIInsights(), 1000);
        } else {
            showNotification('Error getting crop recommendations: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Crop recommendations error:', error);
        showNotification('Error getting crop recommendations: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function getFertilizerRecommendations() {
    if (!currentSoilData) {
        showNotification('Please complete soil analysis first', 'warning');
        scrollToSection('soil');
        return;
    }
    
    const budget = document.getElementById('fertilizer-budget').value;
    const cropType = getCurrentSelectedCrop() || 'General';
    
    try {
        showLoading(true);
        
        console.log('Requesting fertilizer recommendations:', {
            cropType,
            soilData: currentSoilData,
            budget: budget ? parseInt(budget) : null
        });
        
        const response = await fetch('/api/crop/fertilizer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cropType: cropType,
                soilData: currentSoilData,
                budget: budget ? parseInt(budget) : null
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Fertilizer recommendations response:', result);
        
        if (result.success) {
            showFertilizerRecommendations(result);
            showNotification('Fertilizer recommendations loaded!', 'success');
        } else {
            showNotification('Error: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Fertilizer recommendations error:', error);
        showNotification('Error getting fertilizer recommendations: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function getAIInsights() {
    if (!currentLocation || !currentSoilData) {
        return;
    }
    
    try {
        const response = await fetch('/api/crop/ai-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                location: currentLocation,
                soilData: currentSoilData,
                weatherData: currentWeatherData,
                cropType: getCurrentSelectedCrop()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAIInsights(result);
        }
    } catch (error) {
        console.error('Error getting AI insights:', error);
    }
}

function showCropRecommendations(result) {
    const cropList = document.getElementById('crop-list');
    
    if (!result.recommendedCrops || result.recommendedCrops.length === 0) {
        cropList.innerHTML = `
            <div class="no-recommendations">
                <div class="no-recommendations-content">
                    <i class="fas fa-seedling"></i>
                    <h4>No Suitable Crops Found</h4>
                    <p>Based on your current soil and weather conditions, we couldn't find optimal crop matches. Consider improving soil conditions or try manual crop selection.</p>
                    <button class="btn btn-primary" onclick="scrollToSection('soil')">
                        <i class="fas fa-arrow-left"></i> Improve Soil Analysis
                    </button>
                </div>
            </div>
        `;
        cropResult.style.display = 'block';
        return;
    }
    
    cropList.innerHTML = result.recommendedCrops.map((crop, index) => {
        const suitabilityClass = crop.suitability > 0.8 ? 'high' : crop.suitability > 0.6 ? 'medium' : 'low';
        const isTopRecommendation = index === 0;
        
        return `
            <div class="crop-card ${isTopRecommendation ? 'top-recommendation' : ''}" data-crop="${crop.name}">
                ${isTopRecommendation ? '<div class="top-badge"><i class="fas fa-crown"></i> Top Recommendation</div>' : ''}
                
                <div class="crop-header">
                    <h4>
                        <i class="fas fa-leaf"></i> ${crop.name}
                    </h4>
                    <span class="crop-suitability suitability-${suitabilityClass}">
                        ${Math.round(crop.suitability * 100)}% Match
                    </span>
                </div>
                
                <div class="crop-details">
                    <div class="crop-info">
                        <div class="info-item">
                            <i class="fas fa-chart-line"></i>
                            <span><strong>Expected Yield:</strong> ${crop.yield || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span><strong>Growth Duration:</strong> ${crop.growthDuration || 'N/A'} days</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-tint"></i>
                            <span><strong>Water Needs:</strong> ${crop.waterNeeds || 'Medium'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-rupee-sign"></i>
                            <span><strong>Market Price:</strong> ₹${crop.marketPrice || 'N/A'}/ton</span>
                        </div>
                        <div class="info-item profit-highlight">
                            <i class="fas fa-coins"></i>
                            <span><strong>Expected Profit:</strong> ₹${crop.expectedProfit || 'N/A'}/hectare</span>
                        </div>
                        ${crop.datasetRecommended ? `
                            <div class="info-item dataset-enhanced">
                                <i class="fas fa-database"></i>
                                <span>Dataset Enhanced Recommendation</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${crop.reasons && crop.reasons.length > 0 ? `
                        <div class="crop-reasons">
                            <h6><i class="fas fa-check-circle text-success"></i> Why This Crop is Recommended:</h6>
                            <ul>
                                ${crop.reasons.map(reason => `<li>${reason}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${crop.warnings && crop.warnings.length > 0 ? `
                        <div class="crop-warnings">
                            <h6><i class="fas fa-exclamation-triangle text-warning"></i> Important Considerations:</h6>
                            <ul>
                                ${crop.warnings.map(warning => `<li>${warning}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Add similar locations if available
    if (result.similarLocations && result.similarLocations.length > 0) {
        cropList.innerHTML += `
            <div class="similar-locations">
                <h4><i class="fas fa-map-marked-alt"></i> Similar Agricultural Conditions Found In:</h4>
                <div class="similar-locations-grid">
                    ${result.similarLocations.map(loc => `
                        <div class="similar-location">
                            <div class="location-header">
                                <strong>${loc.district}, ${loc.state}</strong>
                                <span class="similarity-badge">${Math.round(loc.similarity * 100)}% Similar</span>
                            </div>
                            <div class="location-details">
                                <p><i class="fas fa-mountain"></i> Soil: ${loc.soilType}</p>
                                <p><i class="fas fa-thermometer-half"></i> Avg Temp: ${loc.avgTemp}°C</p>
                                <p><i class="fas fa-cloud-rain"></i> Rainfall: ${loc.rainfall}mm</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Add analysis summary
    if (result.analysis) {
        cropList.innerHTML += `
            <div class="analysis-summary">
                <h4><i class="fas fa-analytics"></i> Analysis Summary</h4>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-number">${result.analysis.totalCropsAnalyzed}</span>
                        <span class="stat-label">Crops Analyzed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${result.analysis.suitableCropsFound}</span>
                        <span class="stat-label">Suitable Crops</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${result.analysis.topRecommendation}</span>
                        <span class="stat-label">Top Choice</span>
                    </div>
                    ${result.analysis.datasetEnhanced ? `
                        <div class="stat-item">
                            <i class="fas fa-database text-success"></i>
                            <span class="stat-label">Dataset Enhanced</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    cropResult.style.display = 'block';
    showNotification(`Found ${result.recommendedCrops.length} suitable crop recommendations!`, 'success');
}

function showFertilizerRecommendations(result) {
    const fertilizerList = document.getElementById('fertilizer-list');
    
    let content = '';
    
    if (result.standardRecommendations) {
        content += `
            <div class="fertilizer-section">
                <h5><i class="fas fa-prescription-bottle"></i> Standard Recommendations</h5>
                ${result.standardRecommendations.map(fert => `
                    <div class="fertilizer-card">
                        <h6>${fert.name}</h6>
                        <p class="fertilizer-composition">Composition: ${fert.composition}</p>
                        <p>Application: ${fert.applicationRate}</p>
                        <p class="fertilizer-price">Cost: ₹${fert.cost}/hectare</p>
                    </div>
                `).join('')}
                <p><strong>Total Estimated Cost: ₹${result.totalEstimatedCost}</strong></p>
            </div>
        `;
    }
    
    if (result.budgetAlternatives) {
        content += `
            <div class="fertilizer-section">
                <h5><i class="fas fa-coins"></i> Budget-Friendly Alternatives</h5>
                ${result.budgetAlternatives.map(fert => `
                    <div class="fertilizer-card">
                        <h6>${fert.name}</h6>
                        <p class="fertilizer-composition">Composition: ${fert.composition}</p>
                        <p>Application: ${fert.applicationRate}</p>
                        <p class="fertilizer-price">Cost: ₹${fert.cost}/hectare</p>
                        ${fert.benefits ? `<p class="text-info">${fert.benefits}</p>` : ''}
                    </div>
                `).join('')}
                <p><strong>Budget-Friendly Total: ₹${result.budgetFriendlyCost}</strong></p>
            </div>
        `;
    }
    
    fertilizerList.innerHTML = content;
    fertilizerResult.style.display = 'block';
}

function showAIInsights(result) {
    const aiInsightsContent = document.getElementById('ai-insights-content');
    
    // Process insights to make them more readable
    const insights = result.insights.split('\n').filter(line => line.trim());
    let processedInsights = '';
    
    insights.forEach(line => {
        line = line.trim();
        if (line.startsWith('🌱') || line.startsWith('🗺️') || line.startsWith('💡')) {
            // Section headers
            processedInsights += `<h5 class="insight-section-header">${line}</h5>`;
        } else if (line.startsWith('•')) {
            // Bullet points
            processedInsights += `<div class="insight-bullet">${line}</div>`;
        } else if (line.length > 0) {
            // Regular text
            processedInsights += `<p class="insight-text">${line}</p>`;
        }
    });
    
    aiInsightsContent.innerHTML = `
        <div class="ai-insights-content">
            <div class="insights-header">
                <div class="analysis-badge">
                    <i class="fas fa-brain"></i> ${result.analysisType}
                </div>
                <small class="timestamp">Generated: ${new Date(result.timestamp).toLocaleString()}</small>
            </div>
            <div class="insights-body">
                ${processedInsights}
            </div>
            <div class="insights-footer">
                <p class="disclaimer">
                    <i class="fas fa-info-circle"></i>
                    These recommendations are based on your soil and weather data. Always consult local agricultural experts for best results.
                </p>
            </div>
        </div>
    `;
    
    aiInsightsResult.style.display = 'block';
}

async function addCustomCrop(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const cropName = formData.get('cropName') || document.getElementById('custom-crop-name').value;
    const growthDuration = parseInt(formData.get('growthDuration') || document.getElementById('custom-growth-duration').value);
    const soilTypes = (formData.get('soilTypes') || document.getElementById('custom-soil-types').value).split(',').map(s => s.trim());
    const phRange = (formData.get('phRange') || document.getElementById('custom-ph-range').value).split('-').map(p => parseFloat(p.trim()));
    
    if (!cropName || !growthDuration || soilTypes.length === 0 || phRange.length !== 2) {
        alert('Please fill all required fields correctly');
        return;
    }
    
    const cropDetails = {
        soilTypes,
        phRange,
        temperature: [15, 35], // Default temperature range
        growthDuration,
        waterNeeds: 'Medium',
        yield: '2-4 tons/hectare',
        marketPrice: 2500
    };
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/crop/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cropName, cropDetails })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Custom crop '${cropName}' added successfully!`);
            customCropForm.reset();
        } else {
            alert('Error adding custom crop: ' + result.error);
        }
    } catch (error) {
        alert('Error adding custom crop: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Utility Functions
function getCurrentSelectedCrop() {
    const selectedCropCard = document.querySelector('.crop-card.selected');
    return selectedCropCard ? selectedCropCard.dataset.crop : null;
}

function enableNextStep(step) {
    switch(step) {
        case 'soil':
            analyzeSoilBtn.disabled = false;
            break;
        case 'weather':
            getWeatherBtn.disabled = false;
            seasonalAnalysisBtn.disabled = false;
            break;
        case 'crops':
            getRecommendationsBtn.disabled = false;
            fertilizerRecommendationsBtn.disabled = false;
            break;
    }
}

function showStatus(element, message, type) {
    element.innerHTML = message;
    element.className = `status-message status-${type}`;
    element.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Add click handlers for crop selection
document.addEventListener('click', function(e) {
    if (e.target.closest('.crop-card')) {
        // Remove previous selection
        document.querySelectorAll('.crop-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked card
        e.target.closest('.crop-card').classList.add('selected');
    }
});

// Sample locations array for testing
const sampleLocations = [
    { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra' },
    { lat: 12.9716, lng: 77.5946, name: 'Bangalore, Karnataka' },
    { lat: 26.2183, lng: 78.1828, name: 'Gwalior, Madhya Pradesh' },
    { lat: 21.1702, lng: 72.8311, name: 'Surat, Gujarat' },
    { lat: 25.3176, lng: 82.9739, name: 'Varanasi, Uttar Pradesh' },
    { lat: 26.8467, lng: 80.9462, name: 'Lucknow, Uttar Pradesh' },
    { lat: 26.1197, lng: 85.3910, name: 'Muzaffarpur, Bihar' },
    { lat: 28.3949, lng: 77.3178, name: 'Faridabad, Haryana' },
    { lat: 22.7196, lng: 75.8577, name: 'Indore, Madhya Pradesh' },
    { lat: 19.9975, lng: 73.7898, name: 'Nashik, Maharashtra' }
];

let currentSampleIndex = 0;

// Test sample location function with rotation
async function testSampleLocation() {
    const location = sampleLocations[currentSampleIndex];
    const nextLocation = sampleLocations[(currentSampleIndex + 1) % sampleLocations.length];
    currentSampleIndex = (currentSampleIndex + 1) % sampleLocations.length;
    
    // Update button text to show next location
    const testLocationText = document.getElementById('test-location-text');
    testLocationText.textContent = `Next: ${nextLocation.name}`;
    
    showStatus(gpsStatus, `🧪 Testing with sample location (${location.name})...`, 'info');
    
    try {
        const response = await fetch('/api/location/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                latitude: location.lat, 
                longitude: location.lng, 
                accuracy: Math.floor(Math.random() * 100) + 20 // Random accuracy 20-120m
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentLocation = result.location;
            showLocationResult(result);
            showStatus(gpsStatus, '✅ Sample location loaded successfully!', 'success');
            showNotification('Test location: ' + result.location.district + ', ' + result.location.state, 'success');
            enableNextStep('soil');
        } else {
            showStatus(gpsStatus, '❌ Sample location test failed: ' + result.message, 'error');
        }
    } catch (error) {
        showStatus(gpsStatus, '❌ Sample location test error: ' + error.message, 'error');
    }
}

// Add CSS for selected crop card
const cropSelectionStyle = document.createElement('style');
cropSelectionStyle.textContent = `
    .crop-card.selected {
        border-color: var(--primary) !important;
        background-color: var(--bg-tertiary) !important;
    }
    .similar-locations {
        margin-top: 2rem;
        padding: 1.5rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
    }
    .similar-location {
        background: var(--bg-primary);
        padding: 1rem;
        border-radius: var(--radius-sm);
        margin-bottom: 0.5rem;
        border-left: 3px solid var(--primary);
    }
    .fertilizer-section {
        margin-bottom: 2rem;
    }
`;
document.head.appendChild(cropSelectionStyle);

// Helper functions for farming guidance
function getPlantingGuidance(current, totalRainfall) {
    if (current.windSpeed > 20) {
        return "High winds - postpone planting until conditions calm down";
    } else if (totalRainfall > 50) {
        return "Excellent soil moisture for planting - ideal conditions";
    } else if (totalRainfall < 10) {
        return "Low rainfall expected - ensure irrigation before planting";
    } else {
        return "Good planting conditions - moderate weather expected";
    }
}

function getSprayingGuidance(current) {
    if (current.windSpeed > 15) {
        return "High winds - avoid spraying to prevent drift";
    } else if (current.humidity > 80) {
        return "High humidity - good for fungicide application";
    } else if (current.temperature > 35) {
        return "High temperature - spray early morning or evening";
    } else {
        return "Good spraying conditions - low wind and moderate temperature";
    }
}

function getHarvestingGuidance(current, forecast) {
    const rainInNext3Days = forecast.slice(0, 3).reduce((sum, day) => sum + day.rainfall, 0);
    
    if (rainInNext3Days > 20) {
        return "Heavy rain expected - harvest immediately if crops are ready";
    } else if (current.humidity > 85) {
        return "High humidity - ensure proper drying after harvest";
    } else if (current.windSpeed > 25) {
        return "Strong winds - delay harvesting to prevent crop damage";
    } else {
        return "Good harvesting conditions - dry weather expected";
    }
}
// Modal Functions
function showHelpCenter() {
    document.getElementById('help-center-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function showContactUs() {
    document.getElementById('contact-us-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function showDocumentation() {
    document.getElementById('documentation-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = '';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = ['help-center-modal', 'contact-us-modal', 'documentation-modal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            closeModal(modalId);
        }
    });
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = ['help-center-modal', 'contact-us-modal', 'documentation-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal.style.display === 'block') {
                closeModal(modalId);
            }
        });
    }
});

// Contact form submission
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Create mailto link
            const mailtoLink = `mailto:gsani6440@gmail.com?subject=FarmX Support: ${subject}&body=Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0AMessage:%0D%0A${encodeURIComponent(message)}`;
            
            // Open email client
            window.location.href = mailtoLink;
            
            // Show success message
            showNotification('Email client opened! Please send the email to complete your request.', 'success');
            
            // Reset form
            this.reset();
            
            // Close modal after a delay
            setTimeout(() => {
                closeModal('contact-us-modal');
            }, 2000);
        });
    }
});

// Enhanced feature card navigation
function updateFeatureCardNavigation() {
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.addEventListener('click', function() {
            const sections = ['location', 'soil', 'weather', 'crops'];
            if (sections[index]) {
                scrollToSection(sections[index]);
            }
        });
        
        // Add cursor pointer and hover effect
        card.style.cursor = 'pointer';
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Initialize enhanced navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateFeatureCardNavigation();
});