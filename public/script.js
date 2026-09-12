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
    // GPS Detection - with null check
    if (gpsDetectBtn) {
        gpsDetectBtn.addEventListener('click', detectGPSLocation);
    }
    
    // Test Location
    const testLocationBtn = document.getElementById('test-location');
    if (testLocationBtn) {
        testLocationBtn.addEventListener('click', testSampleLocation);
    }
    
    // Manual Location - with null check
    if (manualLocationForm) {
        manualLocationForm.addEventListener('submit', handleManualLocation);
    }
    
    const countrySelect = document.getElementById('country');
    if (countrySelect) {
        countrySelect.addEventListener('change', updateStates);
    }
    
    const stateSelect = document.getElementById('state');
    if (stateSelect) {
        stateSelect.addEventListener('change', updateDistricts);
    }
    
    // Village is now a text input, no need for change listener
    
    // Soil Analysis - with null checks
    if (analyzeSoilBtn) {
        analyzeSoilBtn.addEventListener('click', analyzeSoil);
    }
    if (soilInputForm) {
        soilInputForm.addEventListener('submit', updateSoilData);
    }
    
    // Weather - with null checks
    if (getWeatherBtn) {
        getWeatherBtn.addEventListener('click', getWeatherForecast);
    }
    if (seasonalAnalysisBtn) {
        seasonalAnalysisBtn.addEventListener('click', getSeasonalAnalysis);
    }
    
    // Crop Recommendations - with null checks
    if (getRecommendationsBtn) {
        getRecommendationsBtn.addEventListener('click', getCropRecommendations);
    }
    if (fertilizerRecommendationsBtn) {
        fertilizerRecommendationsBtn.addEventListener('click', getFertilizerRecommendations);
    }
    
    // Custom Crop - with null check
    if (customCropForm) {
        customCropForm.addEventListener('submit', addCustomCrop);
    }
    
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
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        z-index: 9999;
        transition: width 0.3s ease;
    `;
    document.body.appendChild(progressBar);
}

function updateProgress(percentage) {
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
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
    const countrySelect = document.getElementById('country');
    const stateSelect = document.getElementById('state');
    const districtSelect = document.getElementById('district');
    const villageInput = document.getElementById('village');
    
    if (!countrySelect || !stateSelect || !districtSelect || !villageInput) {
        console.error('Required form elements not found for updateStates');
        return;
    }
    
    const country = countrySelect.value;
    
    // Reset dependent selects
    stateSelect.innerHTML = '<option value="">Select State</option>';
    districtSelect.innerHTML = '<option value="">Select District</option>';
    villageInput.value = ''; // Clear village text input
    
    if (country && window.availableRegions && window.availableRegions[country]) {
        Object.keys(window.availableRegions[country]).forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
    }
}

function updateDistricts() {
    const countrySelect = document.getElementById('country');
    const stateSelect = document.getElementById('state');
    const districtSelect = document.getElementById('district');
    const villageInput = document.getElementById('village');
    
    if (!countrySelect || !stateSelect || !districtSelect || !villageInput) {
        console.error('Required form elements not found for updateDistricts');
        return;
    }
    
    const country = countrySelect.value;
    const state = stateSelect.value;
    
    // Reset dependent selects
    districtSelect.innerHTML = '<option value="">Select District</option>';
    villageInput.value = ''; // Clear village text input
    
    if (country && state && window.availableRegions && 
        window.availableRegions[country] && window.availableRegions[country][state]) {
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

// Continue with the rest of the functions...
// This file will be completed with all the remaining functions from the original script.js
// excluding the market intelligence functions

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

// Modal Functions - with null checks
function showHelpCenter() {
    const modal = document.getElementById('help-center-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function showContactUs() {
    const modal = document.getElementById('contact-us-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function showDocumentation() {
    const modal = document.getElementById('documentation-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
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

// Placeholder for remaining functions - these would need to be copied from the original file
// Soil Analysis Functions
// Weather Functions  
// Crop Recommendation Functions
// etc.

console.log('FarmX Script loaded successfully - Market Intelligence removed');

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
    
    // Collect non-empty form values with null checks
    const soilTypeElement = document.getElementById('soil-type');
    const soilPhElement = document.getElementById('soil-ph');
    const nitrogenElement = document.getElementById('nitrogen');
    const phosphorusElement = document.getElementById('phosphorus');
    const potassiumElement = document.getElementById('potassium');
    
    if (soilTypeElement && soilTypeElement.value && soilTypeElement.value !== '') {
        userSoilData.type = soilTypeElement.value;
    }
    if (soilPhElement && soilPhElement.value && soilPhElement.value !== '') {
        userSoilData.ph = parseFloat(soilPhElement.value);
    }
    if (nitrogenElement && nitrogenElement.value && nitrogenElement.value !== '') {
        userSoilData.nitrogen = nitrogenElement.value;
    }
    if (phosphorusElement && phosphorusElement.value && phosphorusElement.value !== '') {
        userSoilData.phosphorus = phosphorusElement.value;
    }
    if (potassiumElement && potassiumElement.value && potassiumElement.value !== '') {
        userSoilData.potassium = potassiumElement.value;
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
        console.log('Getting weather forecast for:', currentLocation);
        
        const response = await fetch('/api/weather/forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: currentLocation })
        });
        
        const result = await response.json();
        console.log('Weather API response:', result);
        
        if (result.success) {
            currentWeatherData = result;
            showWeatherResult(result);
            enableNextStep('crops');
        } else {
            alert('Error getting weather forecast: ' + result.error);
        }
    } catch (error) {
        console.error('Weather forecast error:', error);
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
    console.log('showWeatherResult called with:', result);
    
    const weatherDetails = document.getElementById('current-weather-details');
    const forecastDetails = document.getElementById('forecast-details');
    const weatherInsights = document.getElementById('weather-insights');
    const { current, forecast } = result;
    
    console.log('DOM elements found:', {
        weatherDetails: !!weatherDetails,
        forecastDetails: !!forecastDetails,
        weatherInsights: !!weatherInsights,
        weatherResult: !!weatherResult
    });
    
    // Add null checks to prevent errors
    if (!weatherDetails) {
        console.error('Weather details element not found');
        alert('Error: Weather details section not found in page');
        return;
    }
    
    if (!current || !forecast) {
        console.error('Invalid weather data structure:', { current, forecast });
        alert('Error: Invalid weather data received');
        return;
    }
    
    // Update current weather details with better error handling
    if (current) {
        const temp = typeof current.temperature === 'number' ? Math.round(current.temperature) : 'N/A';
        const humidity = typeof current.humidity === 'number' ? current.humidity : 'N/A';
        const windSpeed = typeof current.windSpeed === 'number' ? Math.round(current.windSpeed) : 'N/A';
        const rainfall = typeof current.rainfall === 'number' ? current.rainfall.toFixed(1) : '0.0';
        const condition = current.condition || 'Unknown';
        
        weatherDetails.innerHTML = `
            <div class="weather-current">
                <div class="weather-main">
                    <span class="temperature">${temp}°C</span>
                    <span class="condition">${condition}</span>
                </div>
                <div class="weather-details-grid">
                    <div class="weather-detail">
                        <i class="fas fa-eye"></i>
                        <span>Humidity: ${humidity}%</span>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-wind"></i>
                        <span>Wind: ${windSpeed} km/h</span>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-tint"></i>
                        <span>Rainfall: ${rainfall}mm</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        weatherDetails.innerHTML = '<p>Weather data not available</p>';
    }
    
    // Update forecast details if element exists
    if (forecastDetails && forecast && Array.isArray(forecast)) {
        console.log('Updating forecast with data:', forecast);
        
        forecastDetails.innerHTML = `
            <div class="forecast-grid">
                ${forecast.map((day, index) => {
                    console.log(`Forecast day ${index}:`, day);
                    
                    // Ensure we have valid data
                    const dayName = day.day || 'Day ' + (index + 1);
                    const temp = typeof day.temperature === 'number' ? Math.round(day.temperature) : 'N/A';
                    const condition = day.condition || 'Unknown';
                    const rainfall = typeof day.rainfall === 'number' ? day.rainfall.toFixed(1) : '0.0';
                    
                    return `
                        <div class="forecast-day">
                            <div class="day-name">${dayName}</div>
                            <div class="day-temp">${temp}°C</div>
                            <div class="day-condition">${condition}</div>
                            <div class="day-rain">${rainfall}mm</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else {
        console.error('Forecast data is invalid:', { forecastDetails: !!forecastDetails, forecast });
    }
    
    // Update weather insights if element exists
    if (weatherInsights) {
        weatherInsights.innerHTML = `
            <div class="insights-grid">
                <div class="insight-item">
                    <i class="fas fa-seedling"></i>
                    <span>Good conditions for planting</span>
                </div>
                <div class="insight-item">
                    <i class="fas fa-tint"></i>
                    <span>Adequate moisture levels</span>
                </div>
            </div>
        `;
    }
    
    // Show the weather result section
    if (weatherResult) {
        weatherResult.style.display = 'block';
    }
}

function showSeasonalAnalysis(result) {
    const seasonalContent = document.getElementById('seasonal-content');
    const { season, analysis, recommendations } = result;
    
    // Add null check to prevent errors
    if (!seasonalContent) {
        console.error('Seasonal content element not found');
        return;
    }
    
    seasonalContent.innerHTML = `
        <div class="seasonal-info">
            <div class="season-header">
                <h4><i class="fas fa-calendar"></i> Seasonal Analysis - ${season.name}</h4>
                <p class="season-period">${season.period}</p>
            </div>
            
            <div class="season-conditions">
                <h5><i class="fas fa-cloud-sun"></i> Expected Conditions</h5>
                <div class="conditions-grid">
                    <div class="condition-item">
                        <span class="condition-label">Temperature Range:</span>
                        <span class="condition-value">${season.temperatureRange}</span>
                    </div>
                    <div class="condition-item">
                        <span class="condition-label">Rainfall:</span>
                        <span class="condition-value">${season.rainfall}</span>
                    </div>
                    <div class="condition-item">
                        <span class="condition-label">Humidity:</span>
                        <span class="condition-value">${season.humidity}</span>
                    </div>
                </div>
            </div>
            
            <div class="season-analysis">
                <h5><i class="fas fa-chart-line"></i> Analysis</h5>
                <p>${analysis}</p>
            </div>
            
            <div class="season-recommendations">
                <h5><i class="fas fa-lightbulb"></i> Recommendations</h5>
                <ul>
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    
    // Show seasonal details section
    const seasonalResult = document.getElementById('seasonal-result');
    if (seasonalResult) {
        seasonalResult.style.display = 'block';
    }
}

// Crop Recommendation Functions
async function getCropRecommendations() {
    if (!currentLocation || !currentSoilData) {
        alert('Please complete location detection and soil analysis first');
        return;
    }
    
    try {
        showLoading(true);
        console.log('Getting crop recommendations with data:', {
            location: currentLocation,
            soilData: currentSoilData,
            weatherData: currentWeatherData
        });
        
        const response = await fetch('/api/crop/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                location: currentLocation,
                soilData: currentSoilData,
                weatherData: currentWeatherData
            })
        });
        
        console.log('Crop recommendation response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Crop recommendation error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Crop recommendation result:', result);
        
        if (result.success) {
            currentCropData = result.crops;
            showCropRecommendations(result);
        } else {
            alert('Error getting crop recommendations: ' + result.error);
        }
    } catch (error) {
        console.error('Crop recommendation error:', error);
        alert('Error getting crop recommendations: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function getFertilizerRecommendations() {
    if (!currentLocation || !currentSoilData) {
        alert('Please complete location detection and soil analysis first');
        return;
    }
    
    const budgetElement = document.getElementById('fertilizer-budget');
    const budget = budgetElement ? budgetElement.value : null;
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/crop/fertilizers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                location: currentLocation,
                soilData: currentSoilData,
                budget: budget ? parseFloat(budget) : null
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentFertilizerData = result.fertilizers;
            showFertilizerRecommendations(result);
        } else {
            alert('Error getting fertilizer recommendations: ' + result.error);
        }
    } catch (error) {
        alert('Error getting fertilizer recommendations: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showCropRecommendations(result) {
    const cropList = document.getElementById('crop-list');
    console.log('showCropRecommendations called with:', result);
    
    // Check both crops and recommendedCrops for compatibility
    const crops = result.crops || result.recommendedCrops || [];
    
    if (crops && crops.length > 0) {
        // Group crops by category
        const cropsByCategory = {};
        crops.forEach(crop => {
            const category = crop.category || 'other';
            if (!cropsByCategory[category]) {
                cropsByCategory[category] = [];
            }
            cropsByCategory[category].push(crop);
        });

        // Category display names and icons
        const categoryInfo = {
            'cereal': { name: 'Cereals & Food Grains', icon: 'fas fa-wheat-awn', color: '#8B4513' },
            'cash': { name: 'Cash Crops', icon: 'fas fa-coins', color: '#DAA520' },
            'pulse': { name: 'Pulses & Legumes', icon: 'fas fa-seedling', color: '#228B22' },
            'fruit': { name: 'Fruits & Horticulture', icon: 'fas fa-apple-alt', color: '#FF6347' },
            'oilseed': { name: 'Oilseeds', icon: 'fas fa-oil-can', color: '#FF8C00' },
            'other': { name: 'Other Crops', icon: 'fas fa-leaf', color: '#32CD32' }
        };

        let cropHTML = '';
        
        // Display crops by category
        Object.keys(cropsByCategory).forEach(category => {
            const categoryData = categoryInfo[category] || categoryInfo['other'];
            const crops = cropsByCategory[category];
            
            cropHTML += `
                <div class="crop-category">
                    <div class="category-header">
                        <i class="${categoryData.icon}" style="color: ${categoryData.color}"></i>
                        <h4>${categoryData.name}</h4>
                        <span class="crop-count">${crops.length} crop${crops.length > 1 ? 's' : ''}</span>
                    </div>
                    <div class="category-crops">
                        ${crops.map(crop => `
                            <div class="crop-card ${crop.suitability > 0.8 ? 'high-suitability' : crop.suitability > 0.6 ? 'medium-suitability' : 'low-suitability'}">
                                <div class="crop-header">
                                    <h5>${crop.name || crop.crop}</h5>
                                    <span class="suitability-score">${Math.round((crop.suitability || 0) * 100)}%</span>
                                </div>
                                <div class="crop-details">
                                    ${crop.expectedYield ? `<p><strong>Expected Yield:</strong> ${crop.expectedYield}</p>` : ''}
                                    ${crop.marketValue ? `<p><strong>Market Value:</strong> ${crop.marketValue}</p>` : ''}
                                    ${crop.growthDuration ? `<p><strong>Duration:</strong> ${crop.growthDuration}</p>` : ''}
                                    ${crop.waterNeeds ? `<p><strong>Water Needs:</strong> ${crop.waterNeeds}</p>` : ''}
                                </div>
                                ${crop.reason || crop.reasons ? `
                                    <div class="crop-reason">
                                        <strong>Why recommended:</strong>
                                        <p>${crop.reason || (Array.isArray(crop.reasons) ? crop.reasons.join(', ') : crop.reasons)}</p>
                                    </div>
                                ` : ''}
                                ${crop.warnings && crop.warnings.length > 0 ? `
                                    <div class="crop-warnings">
                                        <strong>⚠️ Considerations:</strong>
                                        <ul>
                                            ${crop.warnings.map(warning => `<li>${warning}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        cropList.innerHTML = cropHTML;
        
        // Add analysis summary
        if (result.analysis) {
            const analysisHTML = `
                <div class="analysis-summary">
                    <h4><i class="fas fa-chart-line"></i> Analysis Summary</h4>
                    <div class="analysis-stats">
                        <div class="stat-item">
                            <span class="stat-number">${result.analysis.totalCropsAnalyzed}</span>
                            <span class="stat-label">Crops Analyzed</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${result.analysis.suitableCropsFound}</span>
                            <span class="stat-label">Suitable Crops</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-highlight">${result.analysis.topRecommendation}</span>
                            <span class="stat-label">Top Recommendation</span>
                        </div>
                        ${result.analysis.datasetEnhanced ? `
                            <div class="stat-item">
                                <span class="stat-badge">✨ ML Enhanced</span>
                                <span class="stat-label">Dataset Analysis</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            cropList.innerHTML += analysisHTML;
        }

        // Add similar locations if available
        if (result.similarLocations && result.similarLocations.length > 0) {
            const similarHTML = `
                <div class="similar-locations">
                    <h4><i class="fas fa-map-marker-alt"></i> Similar Growing Conditions</h4>
                    <p>These locations have similar soil and climate conditions:</p>
                    <div class="locations-grid">
                        ${result.similarLocations.map(loc => `
                            <div class="location-card">
                                <h6>${loc.district}, ${loc.state}</h6>
                                <p><strong>Similarity:</strong> ${Math.round(loc.similarity * 100)}%</p>
                                <p><strong>Soil:</strong> ${loc.soilType}</p>
                                <p><strong>Climate:</strong> ${loc.avgTemp}°C, ${loc.rainfall}mm</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            cropList.innerHTML += similarHTML;
        }
        
    } else {
        cropList.innerHTML = `
            <div class="no-recommendations">
                <i class="fas fa-info-circle"></i>
                <h4>Complete Your Analysis</h4>
                <p>Please complete your location and soil analysis to get personalized crop recommendations.</p>
                <button class="btn btn-primary" onclick="scrollToSection('location')">
                    <i class="fas fa-map-marker-alt"></i> Start Location Analysis
                </button>
            </div>
        `;
    }
    
    cropResult.style.display = 'block';
}

function showFertilizerRecommendations(result) {
    const fertilizerList = document.getElementById('fertilizer-list');
    const { fertilizers, totalCost, budgetAnalysis } = result;
    
    fertilizerList.innerHTML = `
        <div class="fertilizer-summary">
            <h5>Recommended Fertilizers</h5>
            ${budgetAnalysis ? `<p class="budget-info">${budgetAnalysis}</p>` : ''}
            <p class="total-cost">Total Estimated Cost: ₹${totalCost}</p>
        </div>
        
        <div class="fertilizer-grid">
            ${fertilizers.map(fert => `
                <div class="fertilizer-card">
                    <div class="fertilizer-header">
                        <h6>${fert.name}</h6>
                        <span class="fertilizer-type">${fert.type}</span>
                    </div>
                    <div class="fertilizer-details">
                        <p><strong>Purpose:</strong> ${fert.purpose}</p>
                        <p><strong>Application Rate:</strong> ${fert.applicationRate}</p>
                        <p><strong>Timing:</strong> ${fert.timing}</p>
                        <p><strong>Cost:</strong> ₹${fert.cost}</p>
                    </div>
                    ${fert.benefits ? `
                        <div class="fertilizer-benefits">
                            <strong>Benefits:</strong>
                            <ul>
                                ${fert.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    fertilizerResult.style.display = 'block';
}

function showAIInsights(insights) {
    const aiInsightsContent = document.getElementById('ai-insights-content');
    
    aiInsightsContent.innerHTML = `
        <div class="ai-insights">
            <div class="insights-header">
                <h5><i class="fas fa-brain"></i> AI-Powered Insights</h5>
                <p class="insights-subtitle">Smart recommendations based on your specific conditions</p>
            </div>
            
            ${insights.topRecommendation ? `
                <div class="top-recommendation">
                    <h6><i class="fas fa-star"></i> Top Recommendation</h6>
                    <p>${insights.topRecommendation}</p>
                </div>
            ` : ''}
            
            ${insights.seasonalAdvice ? `
                <div class="seasonal-advice">
                    <h6><i class="fas fa-calendar-alt"></i> Seasonal Advice</h6>
                    <p>${insights.seasonalAdvice}</p>
                </div>
            ` : ''}
            
            ${insights.riskFactors && insights.riskFactors.length > 0 ? `
                <div class="risk-factors">
                    <h6><i class="fas fa-exclamation-triangle"></i> Risk Factors to Consider</h6>
                    <ul>
                        ${insights.riskFactors.map(risk => `<li>${risk}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${insights.optimizationTips && insights.optimizationTips.length > 0 ? `
                <div class="optimization-tips">
                    <h6><i class="fas fa-lightbulb"></i> Optimization Tips</h6>
                    <ul>
                        ${insights.optimizationTips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    aiInsightsResult.style.display = 'block';
}

async function addCustomCrop(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const customCrop = {
        name: formData.get('crop-name'),
        season: formData.get('crop-season'),
        soilType: formData.get('crop-soil-type')
    };
    
    if (!customCrop.name) {
        alert('Please enter a crop name');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/crop/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crop: customCrop,
                location: currentLocation,
                soilData: currentSoilData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showCustomCropResult(result);
            e.target.reset();
        } else {
            alert('Error analyzing custom crop: ' + result.error);
        }
    } catch (error) {
        alert('Error analyzing custom crop: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showCustomCropResult(result) {
    const customCropResult = document.getElementById('custom-crop-result');
    const { analysis, recommendations } = result;
    
    customCropResult.innerHTML = `
        <div class="custom-crop-analysis">
            <h5><i class="fas fa-search"></i> Custom Crop Analysis: ${analysis.cropName}</h5>
            
            <div class="suitability-analysis">
                <h6>Suitability Assessment</h6>
                <div class="suitability-score suitability-${analysis.suitability.toLowerCase()}">
                    <span class="score-label">Overall Suitability:</span>
                    <span class="score-value">${analysis.suitability}</span>
                </div>
                <p class="suitability-reason">${analysis.reason}</p>
            </div>
            
            ${recommendations && recommendations.length > 0 ? `
                <div class="custom-recommendations">
                    <h6>Recommendations</h6>
                    <ul>
                        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${analysis.challenges && analysis.challenges.length > 0 ? `
                <div class="potential-challenges">
                    <h6>Potential Challenges</h6>
                    <ul>
                        ${analysis.challenges.map(challenge => `<li>${challenge}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    customCropResult.style.display = 'block';
}

// Smart Notification System
class SmartNotificationSystem {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 3;
        this.defaultDuration = 5000;
    }
    
    show(message, type = 'info', duration = this.defaultDuration) {
        const notification = this.createNotification(message, type, duration);
        this.addNotification(notification);
        return notification;
    }
    
    createNotification(message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `smart-notification notification-${type}`;
        
        const icon = this.getIcon(type);
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icon}"></i>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress"></div>
        `;
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentElement) {
                this.removeNotification(notification);
            }
        }, duration);
        
        return notification;
    }
    
    addNotification(notification) {
        // Remove oldest if at max capacity
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            if (oldest.parentElement) {
                this.removeNotification(oldest);
            }
        }
        
        this.notifications.push(notification);
        
        // Add to DOM
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    }
    
    removeNotification(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }
    
    getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// Initialize smart notifications
const smartNotifications = new SmartNotificationSystem();

// Override the original showNotification function
const originalShowNotification = showNotification;
showNotification = function(message, type = 'info') {
    return smartNotifications.show(message, type);
};