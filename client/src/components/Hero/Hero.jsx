import React from 'react';
import { motion } from 'motion/react';
import ClickSpark from '../ClickSpark/ClickSpark';
import './Hero.css';

const Hero = ({ onGetStarted, onNavigateToSection }) => {
  const features = [
    {
      icon: 'fas fa-location-arrow',
      title: 'Smart Location Detection',
      description: 'GPS detection with manual fallback for remote areas',
      section: 'location'
    },
    {
      icon: 'fas fa-microscope',
      title: 'Advanced Soil Analysis',
      description: 'Comprehensive soil testing and nutrient recommendations',
      section: 'soil'
    },
    {
      icon: 'fas fa-cloud-sun',
      title: 'Weather Intelligence',
      description: 'Real-time weather data and seasonal forecasting',
      section: 'weather'
    },
    {
      icon: 'fas fa-leaf',
      title: 'AI Crop Recommendations',
      description: 'Machine learning powered crop selection and optimization',
      section: 'crops'
    }
  ];

  return (
    <div className="hero-container">
      <motion.div 
        className="hero-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.div
          className="hero-logo"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1
          }}
        >
          <i className="fas fa-seedling"></i>
        </motion.div>
        
        <motion.h1 
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          FramX
        </motion.h1>
        
        <motion.p 
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Smart farming platform for maximizing crop yield and sustainable agriculture
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <ClickSpark
            sparkColor="#fbbf24"
            sparkCount={12}
            sparkRadius={25}
          >
            <button 
              className="hero-cta"
              onClick={onGetStarted}
            >
              <i className="fas fa-rocket"></i>
              Get Started
            </button>
          </ClickSpark>
        </motion.div>
      </motion.div>

      <motion.div 
        className="hero-features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="feature-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 1.2 + index * 0.1 
            }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            onClick={() => onNavigateToSection(feature.section)}
          >
            <ClickSpark>
              <div className="feature-content">
                <motion.div 
                  className="feature-icon"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <i className={feature.icon}></i>
                </motion.div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </ClickSpark>
          </motion.div>
        ))}
      </motion.div>

      {/* Floating Elements */}
      <div className="floating-elements">
        <motion.div 
          className="floating-element"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🌱
        </motion.div>
        <motion.div 
          className="floating-element"
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          🚜
        </motion.div>
        <motion.div 
          className="floating-element"
          animate={{ 
            y: [0, -25, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          🌾
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;