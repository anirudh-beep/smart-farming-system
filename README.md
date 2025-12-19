# FarmX - Smart Farming Platform

A comprehensive web application for location-based data and soil analysis to maximize crop yield and promote sustainable farming practices.

## Features

### 🌍 Location Detection
- **GPS Detection**: Automatic location detection with fallback for weak GPS signals
- **Manual Selection**: Village/district selection for remote areas
- **Dataset Integration**: Enhanced location data from comprehensive agricultural dataset

### 🔬 Soil Analysis
- **Automated Analysis**: Soil type identification using regional geo-data
- **Manual Input**: User can provide detailed soil information
- **Comprehensive Reports**: pH, nutrients (N-P-K), organic matter, texture analysis
- **Recommendations**: Fertilizer and soil improvement suggestions

### 🌤️ Weather Integration
- **Real-time Forecast**: 7-day weather predictions using WeatherAPI
- **Seasonal Analysis**: Historical patterns and climate trends
- **Farming Insights**: Weather-based recommendations for crop management
- **Risk Assessment**: Drought, flood, and temperature stress warnings

### 🌱 Crop Recommendations
- **AI-Powered Suggestions**: Gemini AI integration for intelligent recommendations
- **Dataset-Enhanced**: Recommendations based on similar regional conditions
- **Profitability Analysis**: Expected yield and profit calculations
- **Custom Crops**: Add and analyze non-standard crops

### 💡 Innovation Features
- **Budget-Friendly Fertilizers**: Cost-optimized fertilizer combinations
- **Similar Conditions Search**: Find locations with comparable farming conditions
- **Seasonal Risk Management**: Month-wise risk assessment and mitigation
- **Multi-source Data Integration**: Combines API data with local dataset

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **APIs**: 
  - WeatherAPI for weather data
  - Google Gemini AI for intelligent insights
- **Data**: CSV dataset with regional agricultural data
- **Styling**: Modern responsive design with CSS Grid/Flexbox

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd farmx
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   The `.env` file is already configured with the provided API keys:
   ```env
   PORT=3000
   WEATHER_API_KEY=1670989aa9a1404ebe975604251912
   GEMINI_API_KEY=AIzaSyCFa1ysArD0oLzZM9whf54uI8EDZEEKH5g
   NODE_ENV=development
   ```

4. **Dataset**
   
   Ensure `dataset.csv` is in the root directory (already included)

5. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   
   Open your browser and navigate to: `http://localhost:3000`

## API Endpoints

### Location Services
- `POST /api/location/detect` - GPS-based location detection
- `POST /api/location/manual` - Manual location selection
- `GET /api/location/regions` - Available regions and districts

### Soil Analysis
- `POST /api/soil/analyze` - Analyze soil for location
- `POST /api/soil/update` - Update soil data with user input
- `GET /api/soil/types` - Soil types reference

### Weather Services
- `POST /api/weather/forecast` - Get weather forecast
- `POST /api/weather/seasonal` - Seasonal analysis
- `POST /api/weather/historical` - Historical weather data

### Crop Recommendations
- `POST /api/crop/recommend` - Get crop recommendations
- `POST /api/crop/fertilizer` - Fertilizer recommendations
- `POST /api/crop/custom` - Add custom crop
- `POST /api/crop/ai-insights` - AI-powered insights
- `GET /api/crop/database` - Crop database

### Dataset Services
- `GET /api/dataset/stats` - Dataset statistics
- `GET /api/dataset/locations` - Available locations from dataset
- `POST /api/dataset/seasonal-insights` - Seasonal insights for location
- `POST /api/dataset/similar-conditions` - Find similar farming conditions

## Usage Guide

### 1. Location Setup
- Click "Detect My Location" for GPS detection
- If GPS fails, use manual selection dropdowns
- Select Country → State → District → Village (optional)

### 2. Soil Analysis
- Click "Analyze Soil" for automatic analysis based on location
- Or manually input soil parameters for more accuracy
- Review soil properties, nutrient levels, and recommendations

### 3. Weather Analysis
- Get current weather and 7-day forecast
- Review farming-specific insights and warnings
- Check seasonal analysis for long-term planning

### 4. Crop Recommendations
- Get AI-powered crop suggestions based on all factors
- Set fertilizer budget for cost-optimized recommendations
- Add custom crops not in the database
- Review profitability and suitability scores

## Edge Cases Handled

1. **Weak GPS Signal**: Automatic fallback to manual location selection
2. **Budget Constraints**: Alternative fertilizer combinations within budget
3. **Custom Crops**: Support for crops not in standard database
4. **API Failures**: Graceful degradation with mock data
5. **Data Validation**: Comprehensive input validation and error handling

## Dataset Integration

The system uses a comprehensive CSV dataset containing:
- 19+ agricultural regions across India
- Soil properties (pH, NPK, organic matter, texture)
- Weather patterns (temperature, rainfall, humidity)
- Monthly variations and seasonal trends

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the documentation
- Review API endpoints
- Contact the development team

---

**FarmX** - Empowering farmers with smart technology for sustainable agriculture 🌱