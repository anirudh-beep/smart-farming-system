const axios = require('axios');
const datasetService = require('./datasetService');

class LocationService {
  constructor() {
    this.regions = {
      'India': {
        'Maharashtra': {
          'Pune': ['Khed', 'Maval', 'Mulshi', 'Bhor', 'Junnar', 'Shirur', 'Daund', 'Indapur'],
          'Nashik': ['Igatpuri', 'Sinnar', 'Niphad', 'Dindori', 'Surgana', 'Kalwan'],
          'Aurangabad': ['Paithan', 'Gangapur', 'Vaijapur', 'Khuldabad', 'Sillod']
        },
        'Karnataka': {
          'Bangalore': ['Anekal', 'Hoskote', 'Devanahalli', 'Nelamangala', 'Doddaballapur'],
          'Mysore': ['Hunsur', 'Piriyapatna', 'Srirangapatna', 'Nanjangud', 'T.Narasipura'],
          'Belgaum': ['Bailhongal', 'Gokak', 'Ramdurg', 'Khanapur', 'Chikodi'],
          'Gulbarga': ['Aland', 'Chincholi', 'Sedam', 'Afzalpur', 'Jewargi']
        },
        'Madhya Pradesh': {
          'Gwalior': ['Dabra', 'Bhitarwar', 'Ghatigaon', 'Morar', 'Murar'],
          'Indore': ['Mhow', 'Depalpur', 'Sanwer', 'Hatod', 'Gautampura']
        },
        'Gujarat': {
          'Surat': ['Bardoli', 'Mandvi', 'Kamrej', 'Palsana', 'Mangrol'],
          'Rajkot': ['Gondal', 'Jasdan', 'Dhoraji', 'Upleta', 'Kotda Sangani']
        },
        'Bihar': {
          'Muzaffarpur': ['Sahebganj', 'Minapur', 'Kanti', 'Gaighat', 'Bochaha', 'Kurhani', 'Aurai', 'Marwan'],
          'Patna': ['Danapur', 'Phulwari', 'Masaurhi', 'Naubatpur', 'Bikram'],
          'Gaya': ['Tekari', 'Atri', 'Khizersarai', 'Dobhi', 'Manpur']
        },
        'Uttar Pradesh': {
          'Varanasi': ['Pindra', 'Cholapur', 'Sewapuri', 'Harahua', 'Kashi Vidyapeeth', 'Baragaon', 'Chiraigaon', 'Harhua'],
          'Lucknow': ['Mohanlalganj', 'Malihabad', 'Bakshi Ka Talab', 'Chinhat', 'Gosainganj', 'Sarojininagar', 'Kakori', 'Itaunja'],
          'Kanpur': ['Bilhaur', 'Ghatampur', 'Akbarpur', 'Sarsaul', 'Derapur', 'Bhognipur', 'Shivrajpur', 'Kalyanpur'],
          'Agra': ['Fatehabad', 'Kheragarh', 'Bah', 'Shamshabad', 'Etmadpur'],
          'Meerut': ['Sardhana', 'Daurala', 'Parikshitgarh', 'Rajpura', 'Jani Khurd']
        },
        'Haryana': {
          'Faridabad': ['Ballabgarh', 'Tigaon', 'Prithla', 'Badkhal', 'Surajkund']
        },
        'Andhra Pradesh': {
          'Visakhapatnam': ['Anakapalle', 'Bheemunipatnam', 'Narsipatnam', 'Yelamanchili'],
          'Anantapur': ['Gooty', 'Guntakal', 'Rayadurg', 'Kadiri', 'Dharmavaram']
        },
        'West Bengal': {
          'Kolkata': ['Barrackpore', 'Barasat', 'Basirhat', 'Diamond Harbour', 'Alipore']
        },
        'Odisha': {
          'Puri': ['Satyabadi', 'Nimapara', 'Pipili', 'Gop', 'Kakatpur']
        }
      },
      'USA': {
        'California': {
          'Fresno': ['Clovis', 'Sanger', 'Selma', 'Fowler', 'Kerman'],
          'Kern': ['Bakersfield', 'Delano', 'Wasco', 'Shafter', 'Arvin']
        }
      }
    };
  }

  async detectLocation(latitude, longitude, accuracy) {
    try {
      console.log(`GPS Detection: lat=${latitude}, lng=${longitude}, accuracy=${accuracy}m`);
      
      // More lenient accuracy check - allow up to 1000m for rural areas
      if (accuracy > 1000) {
        return {
          success: false,
          error: 'GPS_WEAK_SIGNAL',
          message: 'GPS signal is too weak (accuracy: ' + Math.round(accuracy) + 'm). Please try manual location selection.',
          fallback: true,
          coordinates: { latitude, longitude, accuracy }
        };
      }

      // Enhanced reverse geocoding with better location matching
      const location = await this.reverseGeocode(latitude, longitude);
      
      if (!location) {
        return {
          success: false,
          error: 'LOCATION_NOT_FOUND',
          message: 'Could not identify your location. Please use manual selection.',
          fallback: true,
          coordinates: { latitude, longitude, accuracy }
        };
      }
      
      return {
        success: true,
        location,
        coordinates: { latitude, longitude, accuracy },
        method: 'GPS',
        accuracy: Math.round(accuracy)
      };
    } catch (error) {
      console.error('Location detection error:', error);
      return {
        success: false,
        error: 'GPS_ERROR',
        message: 'Unable to detect location: ' + error.message,
        fallback: true
      };
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      // Major cities and agricultural districts with broader coverage
      const majorLocations = [
        // Maharashtra - Major cities and agricultural districts
        { lat: 18.5204, lng: 73.8567, country: 'India', state: 'Maharashtra', district: 'Pune', village: 'Pune City' },
        { lat: 19.0760, lng: 72.8777, country: 'India', state: 'Maharashtra', district: 'Mumbai', village: 'Mumbai City' },
        { lat: 19.9975, lng: 73.7898, country: 'India', state: 'Maharashtra', district: 'Nashik', village: 'Nashik City' },
        { lat: 19.8762, lng: 75.3433, country: 'India', state: 'Maharashtra', district: 'Aurangabad', village: 'Aurangabad City' },
        { lat: 20.9374, lng: 77.7796, country: 'India', state: 'Maharashtra', district: 'Nagpur', village: 'Nagpur City' },
        
        // Karnataka - Major agricultural and tech hubs
        { lat: 12.9716, lng: 77.5946, country: 'India', state: 'Karnataka', district: 'Bangalore', village: 'Bangalore City' },
        { lat: 12.2958, lng: 76.6394, country: 'India', state: 'Karnataka', district: 'Mysore', village: 'Mysore City' },
        { lat: 15.8497, lng: 74.4977, country: 'India', state: 'Karnataka', district: 'Belgaum', village: 'Belgaum City' },
        { lat: 14.4426, lng: 79.9865, country: 'India', state: 'Karnataka', district: 'Gulbarga', village: 'Gulbarga City' },
        
        // Madhya Pradesh - Agricultural heartland
        { lat: 26.2183, lng: 78.1828, country: 'India', state: 'Madhya Pradesh', district: 'Gwalior', village: 'Gwalior City' },
        { lat: 22.7196, lng: 75.8577, country: 'India', state: 'Madhya Pradesh', district: 'Indore', village: 'Indore City' },
        { lat: 23.2599, lng: 77.4126, country: 'India', state: 'Madhya Pradesh', district: 'Bhopal', village: 'Bhopal City' },
        { lat: 24.5854, lng: 73.7125, country: 'India', state: 'Madhya Pradesh', district: 'Ujjain', village: 'Ujjain City' },
        
        // Gujarat - Agricultural and industrial centers
        { lat: 21.1702, lng: 72.8311, country: 'India', state: 'Gujarat', district: 'Surat', village: 'Surat City' },
        { lat: 22.3039, lng: 70.8022, country: 'India', state: 'Gujarat', district: 'Rajkot', village: 'Rajkot City' },
        { lat: 23.0225, lng: 72.5714, country: 'India', state: 'Gujarat', district: 'Ahmedabad', village: 'Ahmedabad City' },
        { lat: 22.2587, lng: 71.8253, country: 'India', state: 'Gujarat', district: 'Bhavnagar', village: 'Bhavnagar City' },
        
        // Uttar Pradesh - Major agricultural state
        { lat: 25.3176, lng: 82.9739, country: 'India', state: 'Uttar Pradesh', district: 'Varanasi', village: 'Varanasi City' },
        { lat: 26.8467, lng: 80.9462, country: 'India', state: 'Uttar Pradesh', district: 'Lucknow', village: 'Lucknow City' },
        { lat: 26.4499, lng: 80.3319, country: 'India', state: 'Uttar Pradesh', district: 'Kanpur', village: 'Kanpur City' },
        { lat: 27.1767, lng: 78.0081, country: 'India', state: 'Uttar Pradesh', district: 'Agra', village: 'Agra City' },
        { lat: 28.9845, lng: 77.7064, country: 'India', state: 'Uttar Pradesh', district: 'Meerut', village: 'Meerut City' },
        
        // Bihar - Agricultural regions
        { lat: 26.1197, lng: 85.3910, country: 'India', state: 'Bihar', district: 'Muzaffarpur', village: 'Muzaffarpur City' },
        { lat: 25.5941, lng: 85.1376, country: 'India', state: 'Bihar', district: 'Patna', village: 'Patna City' },
        { lat: 24.7914, lng: 85.0002, country: 'India', state: 'Bihar', district: 'Gaya', village: 'Gaya City' },
        
        // Haryana - Agricultural belt
        { lat: 28.3949, lng: 77.3178, country: 'India', state: 'Haryana', district: 'Faridabad', village: 'Faridabad City' },
        { lat: 29.1492, lng: 75.7217, country: 'India', state: 'Haryana', district: 'Hisar', village: 'Hisar City' },
        { lat: 28.4595, lng: 77.0266, country: 'India', state: 'Haryana', district: 'Gurgaon', village: 'Gurgaon City' },
        
        // Punjab - Agricultural powerhouse
        { lat: 31.6340, lng: 74.8723, country: 'India', state: 'Punjab', district: 'Amritsar', village: 'Amritsar City' },
        { lat: 30.9010, lng: 75.8573, country: 'India', state: 'Punjab', district: 'Ludhiana', village: 'Ludhiana City' },
        { lat: 31.3260, lng: 75.5762, country: 'India', state: 'Punjab', district: 'Jalandhar', village: 'Jalandhar City' },
        
        // Rajasthan - Agricultural areas
        { lat: 26.9124, lng: 75.7873, country: 'India', state: 'Rajasthan', district: 'Jaipur', village: 'Jaipur City' },
        { lat: 26.2389, lng: 73.0243, country: 'India', state: 'Rajasthan', district: 'Jodhpur', village: 'Jodhpur City' },
        { lat: 24.5854, lng: 73.7125, country: 'India', state: 'Rajasthan', district: 'Udaipur', village: 'Udaipur City' },
        
        // Andhra Pradesh & Telangana
        { lat: 17.6868, lng: 83.2185, country: 'India', state: 'Andhra Pradesh', district: 'Visakhapatnam', village: 'Visakhapatnam City' },
        { lat: 14.6819, lng: 77.6006, country: 'India', state: 'Andhra Pradesh', district: 'Anantapur', village: 'Anantapur City' },
        { lat: 17.3850, lng: 78.4867, country: 'India', state: 'Telangana', district: 'Hyderabad', village: 'Hyderabad City' },
        
        // Tamil Nadu
        { lat: 13.0827, lng: 80.2707, country: 'India', state: 'Tamil Nadu', district: 'Chennai', village: 'Chennai City' },
        { lat: 11.0168, lng: 76.9558, country: 'India', state: 'Tamil Nadu', district: 'Coimbatore', village: 'Coimbatore City' },
        { lat: 9.9252, lng: 78.1198, country: 'India', state: 'Tamil Nadu', district: 'Madurai', village: 'Madurai City' },
        
        // West Bengal
        { lat: 22.5726, lng: 88.3639, country: 'India', state: 'West Bengal', district: 'Kolkata', village: 'Kolkata City' },
        { lat: 23.2324, lng: 87.8615, country: 'India', state: 'West Bengal', district: 'Durgapur', village: 'Durgapur City' },
        
        // Odisha
        { lat: 20.2961, lng: 85.8245, country: 'India', state: 'Odisha', district: 'Bhubaneswar', village: 'Bhubaneswar City' },
        { lat: 19.8135, lng: 85.8312, country: 'India', state: 'Odisha', district: 'Puri', village: 'Puri City' },
        
        // USA - Major agricultural regions
        { lat: 36.7378, lng: -119.7871, country: 'USA', state: 'California', district: 'Fresno', village: 'Fresno City' },
        { lat: 35.3733, lng: -119.0187, country: 'USA', state: 'California', district: 'Kern', village: 'Bakersfield City' },
        { lat: 39.7391, lng: -104.9847, country: 'USA', state: 'Colorado', district: 'Denver', village: 'Denver City' }
      ];

      // Find closest location with improved distance calculation
      let closest = null;
      let minDistance = Infinity;

      for (const loc of majorLocations) {
        const distance = this.calculateDistance(lat, lng, loc.lat, loc.lng);
        if (distance < minDistance) {
          minDistance = distance;
          closest = loc;
        }
      }

      // Use major city/district if within reasonable distance (150km for major cities)
      if (closest && minDistance <= 150) {
        console.log(`Found major location: ${closest.district}, ${closest.state} (${minDistance.toFixed(2)}km away)`);
        
        // If very close to a major city (within 50km), use the city name
        if (minDistance <= 50) {
          closest.village = closest.district + ' City';
        }
        
        return closest;
      }

      console.log(`No suitable major location found. Closest was ${minDistance?.toFixed(2)}km away`);
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  manualLocation(country, state, district, village) {
    if (!this.regions[country] || !this.regions[country][state] || !this.regions[country][state][district]) {
      throw new Error('Location not found in database');
    }

    const availableVillages = this.regions[country][state][district];
    if (village && !availableVillages.includes(village)) {
      throw new Error('Village not found in selected district');
    }

    return {
      success: true,
      location: { country, state, district, village: village || availableVillages[0] },
      method: 'MANUAL'
    };
  }

  getAvailableRegions() {
    // Merge dataset locations with predefined regions
    const datasetLocations = datasetService.getAvailableLocations();
    const mergedRegions = { ...this.regions };
    
    // Add dataset locations to India
    if (datasetLocations) {
      if (!mergedRegions['India']) {
        mergedRegions['India'] = {};
      }
      
      Object.entries(datasetLocations).forEach(([state, districts]) => {
        if (!mergedRegions['India'][state]) {
          mergedRegions['India'][state] = {};
        }
        
        districts.forEach(district => {
          if (!mergedRegions['India'][state][district]) {
            mergedRegions['India'][state][district] = ['Village 1', 'Village 2'];
          }
        });
      });
    }
    
    return mergedRegions;
  }
}

module.exports = new LocationService();