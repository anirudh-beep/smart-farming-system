import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Dock from './components/Dock/Dock';
import ClickSpark from './components/ClickSpark/ClickSpark';
import CircularText from './components/CircularText/CircularText';
import LocationSection from './components/sections/LocationSection';
import SoilSection from './components/sections/SoilSection';
import WeatherSection from './components/sections/WeatherSection';
import CropSection from './components/sections/CropSection';
import Hero from './components/Hero/Hero';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [appData, setAppData] = useState({
    location: null,
    soilData: null,
    weatherData: null,
    cropData: null
  });

  const sectionRefs = {
    home: useRef(null),
    location: useRef(null),
    soil: useRef(null),
    weather: useRef(null),
    crops: useRef(null)
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    sectionRefs[sectionId]?.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const dockItems = [
    {
      icon: <i className="fas fa-home"></i>,
      label: 'Home',
      onClick: () => scrollToSection('home'),
      className: activeSection === 'home' ? 'active' : ''
    },
    {
      icon: <i className="fas fa-map-marker-alt"></i>,
      label: 'Location',
      onClick: () => scrollToSection('location'),
      className: activeSection === 'location' ? 'active' : ''
    },
    {
      icon: <i className="fas fa-microscope"></i>,
      label: 'Soil Analysis',
      onClick: () => scrollToSection('soil'),
      className: activeSection === 'soil' ? 'active' : ''
    },
    {
      icon: <i className="fas fa-cloud-sun"></i>,
      label: 'Weather',
      onClick: () => scrollToSection('weather'),
      className: activeSection === 'weather' ? 'active' : ''
    },
    {
      icon: <i className="fas fa-leaf"></i>,
      label: 'Crops',
      onClick: () => scrollToSection('crops'),
      className: activeSection === 'crops' ? 'active' : ''
    }
  ];

  const updateAppData = (section, data) => {
    setAppData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  return (
    <ClickSpark>
      <div className="app">
        {/* Hero Section */}
        <motion.section 
          ref={sectionRefs.home}
          className="hero-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Hero 
            onGetStarted={() => scrollToSection('location')} 
            onNavigateToSection={scrollToSection}
          />
        </motion.section>

        {/* Location Section */}
        <motion.section 
          ref={sectionRefs.location}
          className="section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <LocationSection 
            onLocationSet={(location) => {
              updateAppData('location', location);
              scrollToSection('soil');
            }}
            appData={appData}
          />
        </motion.section>

        {/* Soil Section */}
        <motion.section 
          ref={sectionRefs.soil}
          className="section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <SoilSection 
            onSoilAnalyzed={(soilData) => {
              updateAppData('soilData', soilData);
              scrollToSection('weather');
            }}
            appData={appData}
          />
        </motion.section>

        {/* Weather Section */}
        <motion.section 
          ref={sectionRefs.weather}
          className="section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <WeatherSection 
            onWeatherAnalyzed={(weatherData) => {
              updateAppData('weatherData', weatherData);
              scrollToSection('crops');
            }}
            appData={appData}
          />
        </motion.section>

        {/* Crop Section */}
        <motion.section 
          ref={sectionRefs.crops}
          className="section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <CropSection 
            onCropAnalyzed={(cropData) => {
              updateAppData('cropData', cropData);
            }}
            appData={appData}
          />
        </motion.section>

        {/* Floating Circular Text */}
        <div className="floating-circular-text">
          <CircularText 
            text="FramX • Smart Farming • Sustainable Agriculture • "
            spinDuration={30}
            onHover="speedUp"
          />
        </div>

        {/* Dock Navigation */}
        <Dock 
          items={dockItems}
          magnification={80}
          distance={150}
        />

        {/* Loading Overlay */}
        <AnimatePresence>
          {/* Add loading state if needed */}
        </AnimatePresence>
      </div>
    </ClickSpark>
  );
}

export default App;