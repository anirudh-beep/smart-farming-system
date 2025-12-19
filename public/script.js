// Global variables
let currentLocation = null;
let currentSoilData = null;
let currentWeatherData = null;
let currentCropData = null;
let currentFertilizerData = null;

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
    initializeChatbot();
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
    // Village is now a text input, no need for change listener
    
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

// Test Sample Location Function
async function testSampleLocation() {
    showStatus(gpsStatus, '🧪 Using sample location for testing...', 'info');
    
    try {
        const response = await fetch('/api/location/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                latitude: 18.5204, 
                longitude: 73.8567, 
                accuracy: 100 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentLocation = result.location;
            showLocationResult(result);
            showStatus(gpsStatus, '✅ Sample location loaded successfully!', 'success');
            showNotification(`Sample Location: ${result.location.district}, ${result.location.state}`, 'success');
            enableNextStep('soil');
        } else {
            showStatus(gpsStatus, '❌ Error loading sample location: ' + result.message, 'error');
        }
    } catch (error) {
        showStatus(gpsStatus, '❌ Error loading sample location: ' + error.message, 'error');
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
    const villageInput = document.getElementById('village');
    
    // Reset dependent selects
    stateSelect.innerHTML = '<option value="">Select State</option>';
    districtSelect.innerHTML = '<option value="">Select District</option>';
    villageInput.value = ''; // Clear village text input
    
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
    const villageInput = document.getElementById('village');
    
    // Reset dependent selects
    districtSelect.innerHTML = '<option value="">Select District</option>';
    villageInput.value = ''; // Clear village text input
    
    if (country && state && window.availableRegions[country][state]) {
        Object.keys(window.availableRegions[country][state]).forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
    }
}

// updateVillages function removed - village is now a text input field
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
// AI Chatbot Functions
function initializeChatbot() {
    const chatbot = document.getElementById('ai-chatbot');
    if (chatbot) {
        // Initialize chatbot as minimized
        chatbot.classList.add('minimized');
        
        // Add notification badge for first-time users
        if (!localStorage.getItem('farmx-chatbot-used')) {
            addChatbotNotification();
        }
    }
}

function toggleChatbot() {
    const chatbot = document.getElementById('ai-chatbot');
    chatbot.classList.toggle('minimized');
    
    // Remove notification badge when opened
    const notification = chatbot.querySelector('.chatbot-notification');
    if (notification) {
        notification.remove();
    }
    
    // Mark as used
    localStorage.setItem('farmx-chatbot-used', 'true');
}

function addChatbotNotification() {
    const chatbotHeader = document.querySelector('.chatbot-header');
    if (chatbotHeader && !chatbotHeader.querySelector('.chatbot-notification')) {
        const notification = document.createElement('div');
        notification.className = 'chatbot-notification';
        notification.textContent = '!';
        chatbotHeader.appendChild(notification);
    }
}

function handleChatbotEnter(event) {
    if (event.key === 'Enter') {
        sendChatbotMessage();
    }
}

async function sendChatbotMessage() {
    const input = document.getElementById('chatbot-input-field');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Clear input
    input.value = '';
    
    // Add user message to chat
    addChatMessage(message, 'user');
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send message to AI
        const response = await fetch('/api/crop/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                context: {
                    location: currentLocation,
                    soilData: currentSoilData,
                    weatherData: currentWeatherData,
                    cropData: currentCropData
                }
            })
        });
        
        const result = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        if (result.success) {
            // Add AI response to chat
            addChatMessage(result.response, 'bot');
        } else {
            addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        console.error('Chatbot error:', error);
        removeTypingIndicator();
        addChatMessage('Sorry, I\'m having trouble connecting. Please check your internet connection and try again.', 'bot');
    }
}

function askQuickQuestion(question) {
    const input = document.getElementById('chatbot-input-field');
    input.value = question;
    sendChatbotMessage();
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Process message for farming tips
    if (sender === 'bot' && message.includes('💡')) {
        const parts = message.split('💡');
        content.innerHTML = `<p>${parts[0]}</p>`;
        if (parts[1]) {
            content.innerHTML += `<div class="farming-tip"><strong>💡 Tip:</strong> ${parts[1]}</div>`;
        }
    } else {
        content.innerHTML = `<p>${message}</p>`;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `
        <div class="typing-indicator">
            <span>AI is thinking</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}
// Utility Functions
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showStatus(element, message, type) {
    if (!element) return;
    
    element.innerHTML = message;
    element.className = `status-message status-${type}`;
    element.style.display = 'block';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const content = document.createElement('div');
    content.className = 'notification-content';
    content.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notification.appendChild(content);
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
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

// Modal Functions
function showHelpCenter() {
    document.getElementById('help-center-modal').style.display = 'block';
}

function showContactUs() {
    document.getElementById('contact-us-modal').style.display = 'block';
}

function showDocumentation() {
    document.getElementById('documentation-modal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Contact form handler
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Create mailto link
            const mailtoLink = `mailto:gsani6440@gmail.com?subject=FarmX: ${subject}&body=Name: ${name}%0AEmail: ${email}%0A%0AMessage:%0A${encodeURIComponent(message)}`;
            
            // Open email client
            window.location.href = mailtoLink;
            
            // Show success message
            showNotification('Email client opened! Please send the email from your email application.', 'success');
            
            // Close modal
            closeModal('contact-us-modal');
        });
    }
});
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
            currentSoilData.analysis = result.analysis;
            currentSoilData.recommendations = result.recommendations;
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
    
    const userSoilData = {};
    
    // Collect non-empty form values
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
            currentSoilData.analysis = result.analysis;
            currentSoilData.recommendations = result.recommendations;
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
                    <p><strong>Soil Type:</strong> ${soilData.type}</p>
                    <p><strong>pH Level:</strong> ${soilData.ph}</p>
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
                
                ${analysis.strengths && analysis.strengths.length > 0 ? `
                    <div class="soil-strengths">
                        <h5><i class="fas fa-thumbs-up text-success"></i> Strengths</h5>
                        <ul>
                            ${analysis.strengths.map(strength => `<li>${strength}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${analysis.deficiencies && analysis.deficiencies.length > 0 ? `
                    <div class="soil-deficiencies">
                        <h5><i class="fas fa-exclamation-triangle text-warning"></i> Areas for Improvement</h5>
                        <ul>
                            ${analysis.deficiencies.map(deficiency => `<li>${deficiency}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            
            ${recommendations.fertilizers && recommendations.fertilizers.length > 0 ? `
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
    
    // Farming Insights
    const analysis = result.analysis;
    const totalRainfall = result.forecast.reduce((sum, day) => sum + day.rainfall, 0);
    const avgTemp = result.forecast.reduce((sum, day) => sum + (day.maxTemp + day.minTemp) / 2, 0) / result.forecast.length;
    
    weatherInsights.innerHTML = `
        <div class="weather-insights-content">
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
            </div>
            
            ${analysis.recommendations && analysis.recommendations.length > 0 ? `
                <div class="insight-section recommendations">
                    <h5><i class="fas fa-lightbulb text-info"></i> Recommendations</h5>
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
            
            ${analysis.warnings && analysis.warnings.length > 0 ? `
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
        </div>
    `;
    
    weatherResult.style.display = 'block';
}

function showSeasonalAnalysis(result) {
    const seasonalResult = document.getElementById('seasonal-result');
    const plantingSchedule = document.getElementById('planting-schedule-details');
    const riskAssessment = document.getElementById('risk-assessment-details');
    const cropCalendar = document.getElementById('crop-calendar-details');
    const seasonalTips = document.getElementById('seasonal-tips-details');
    
    // Show basic seasonal information
    plantingSchedule.innerHTML = `
        <div class="planting-info">
            <p><i class="fas fa-seedling"></i> Best planting time: During monsoon season (June-September)</p>
            <p><i class="fas fa-tint"></i> Ensure adequate water supply for optimal growth</p>
        </div>
    `;
    
    riskAssessment.innerHTML = `
        <div class="risk-grid">
            <div class="risk-item">
                <div class="risk-icon"><i class="fas fa-sun"></i></div>
                <div class="risk-details">
                    <h5>Drought Risk</h5>
                    <p>Low - Normal irrigation schedule sufficient</p>
                </div>
            </div>
            <div class="risk-item">
                <div class="risk-icon"><i class="fas fa-water"></i></div>
                <div class="risk-details">
                    <h5>Flood Risk</h5>
                    <p>Low - Standard drainage practices adequate</p>
                </div>
            </div>
        </div>
    `;
    
    cropCalendar.innerHTML = `
        <div class="calendar-info">
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
    
    seasonalTips.innerHTML = `
        <div class="tips-list">
            <div class="tip-item">
                <i class="fas fa-lightbulb text-warning"></i>
                <span>Consult local agricultural extension for region-specific advice</span>
            </div>
            <div class="tip-item">
                <i class="fas fa-lightbulb text-warning"></i>
                <span>Monitor weather patterns for optimal planting times</span>
            </div>
            <div class="tip-item">
                <i class="fas fa-lightbulb text-warning"></i>
                <span>Prepare irrigation systems during dry seasons</span>
            </div>
        </div>
    `;
    
    seasonalResult.style.display = 'block';
    showNotification('Seasonal analysis completed!', 'success');
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
        
        const response = await fetch('/api/crop/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            currentCropData = result;
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
        
        if (result.success) {
            currentFertilizerData = result;
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

function getCurrentSelectedCrop() {
    // Try to get the selected crop from the recommendations
    const selectedCrop = document.querySelector('.crop-card.selected');
    if (selectedCrop) {
        return selectedCrop.dataset.crop;
    }
    
    // If no crop is selected, return the first recommended crop
    if (currentCropData && currentCropData.recommendedCrops && currentCropData.recommendedCrops.length > 0) {
        return currentCropData.recommendedCrops[0].name;
    }
    
    return null;
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
            <div class="crop-card ${isTopRecommendation ? 'top-recommendation' : ''}" data-crop="${crop.name}" onclick="selectCrop(this)">
                ${isTopRecommendation ? `<div class="top-badge"><i class="fas fa-crown"></i> Top Recommendation</div>` : ''}
                
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
    
    cropResult.style.display = 'block';
    showNotification(`Found ${result.recommendedCrops.length} suitable crop recommendations!`, 'success');
}

function selectCrop(cropCard) {
    // Remove selection from other cards
    document.querySelectorAll('.crop-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    cropCard.classList.add('selected');
    
    // Update fertilizer recommendations for selected crop
    if (currentSoilData) {
        getFertilizerRecommendations();
    }
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
                    <i class="fas fa-brain"></i> Smart Farming Insights
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
    const cropData = {
        name: formData.get('cropName') || document.getElementById('custom-crop-name').value,
        growthDuration: parseInt(formData.get('growthDuration') || document.getElementById('custom-growth-duration').value),
        soilTypes: (formData.get('soilTypes') || document.getElementById('custom-soil-types').value).split(',').map(s => s.trim()),
        phRange: (formData.get('phRange') || document.getElementById('custom-ph-range').value).split('-').map(p => parseFloat(p.trim()))
    };
    
    if (!cropData.name || !cropData.growthDuration || cropData.soilTypes.length === 0 || cropData.phRange.length !== 2) {
        alert('Please fill all fields correctly');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/crop/add-custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cropData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Custom crop "${cropData.name}" added successfully!`, 'success');
            e.target.reset();
            
            // Refresh crop recommendations if available
            if (currentLocation && currentSoilData) {
                getCropRecommendations();
            }
        } else {
            alert('Error adding custom crop: ' + result.error);
        }
    } catch (error) {
        alert('Error adding custom crop: ' + error.message);
    } finally {
        showLoading(false);
    }
}
// Smart Farming Calendar Functions
let currentCalendarDate = new Date();

function initializeFarmingCalendar() {
    generateFarmingCalendar();
}

function generateFarmingCalendar() {
    const calendarGrid = document.getElementById('farming-calendar-grid');
    const monthYearElement = document.getElementById('calendar-month-year');
    
    if (!calendarGrid || !monthYearElement) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Set month/year header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearElement.textContent = `${monthNames[month]} ${year}`;
    
    // Clear previous calendar
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        dayHeader.style.cssText = `
            background: var(--primary);
            color: white;
            font-weight: bold;
            padding: 0.75rem 0.5rem;
            text-align: center;
        `;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if it's today
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Get farming activity for this day
        const activity = getFarmingActivity(month, day);
        if (activity.type) {
            dayElement.classList.add(activity.type);
        }
        
        dayElement.innerHTML = `
            <div class="calendar-day-number">${day}</div>
            ${activity.text ? `<div class="calendar-day-activity">${activity.text}</div>` : ''}
        `;
        
        calendarGrid.appendChild(dayElement);
    }
}

function getFarmingActivity(month, day) {
    // Define farming activities based on Indian agricultural calendar
    const activities = {
        // Kharif season (June-September)
        5: { // June
            type: 'planting',
            text: 'Kharif planting'
        },
        6: { // July
            type: 'planting',
            text: 'Rice, Cotton sowing'
        },
        7: { // August
            type: 'maintenance',
            text: 'Crop care'
        },
        8: { // September
            type: 'maintenance',
            text: 'Pest control'
        },
        9: { // October
            type: 'harvesting',
            text: 'Kharif harvest'
        },
        10: { // November
            type: 'planting',
            text: 'Rabi sowing'
        },
        11: { // December
            type: 'planting',
            text: 'Wheat planting'
        },
        0: { // January
            type: 'maintenance',
            text: 'Rabi care'
        },
        1: { // February
            type: 'maintenance',
            text: 'Irrigation'
        },
        2: { // March
            type: 'harvesting',
            text: 'Rabi harvest'
        },
        3: { // April
            type: 'planting',
            text: 'Zaid crops'
        },
        4: { // May
            type: 'maintenance',
            text: 'Summer care'
        }
    };
    
    return activities[month] || { type: null, text: '' };
}

function changeCalendarMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    generateFarmingCalendar();
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeFarmingCalendar, 1000); // Delay to ensure elements are ready
});

// Unique Features to Stand Out
function addUniqueFeatures() {
    // Floating action buttons removed as requested
    
    // Add progress indicator for multi-step process
    addProgressIndicator();
}

function addProgressIndicator() {
    const navbar = document.querySelector('.navbar');
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, var(--primary), var(--accent));
        z-index: 1001;
        transition: width 0.3s ease;
    `;
    document.body.appendChild(progressBar);
    
    // Update progress based on completed steps
    updateProgress();
}

function updateProgress() {
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) return;
    
    let progress = 0;
    
    if (currentLocation) progress += 25;
    if (currentSoilData) progress += 25;
    if (currentWeatherData) progress += 25;
    if (currentCropData) progress += 25;
    
    progressBar.style.width = progress + '%';
}

// Call updateProgress whenever data is updated
const originalEnableNextStep = enableNextStep;
enableNextStep = function(step) {
    originalEnableNextStep(step);
    updateProgress();
};

// Initialize unique features
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(addUniqueFeatures, 500);
});

// Smart Notifications System
class SmartNotificationSystem {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 3;
    }
    
    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.notifications.push(notification);
        
        // Remove oldest if exceeding max
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            oldest.remove();
        }
        
        // Auto remove
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        return notification;
    }
    
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `smart-notification smart-notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: ${100 + (this.notifications.length * 80)}px;
            right: 20px;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'primary'});
            border-radius: var(--radius-md);
            padding: 1rem 1.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            max-width: 350px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}" 
                   style="color: var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'primary'});"></i>
                <span style="flex: 1; color: var(--text-primary);">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.25rem;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        return notification;
    }
    
    remove(notification) {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
            notification.remove();
        }
    }
}

// Initialize smart notification system
const smartNotifications = new SmartNotificationSystem();

// Override the original showNotification function
const originalShowNotification = showNotification;
showNotification = function(message, type = 'info') {
    return smartNotifications.show(message, type);
};