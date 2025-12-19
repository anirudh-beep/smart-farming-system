const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const locationRoutes = require('./routes/location');
const soilRoutes = require('./routes/soil');
const weatherRoutes = require('./routes/weather');
const cropRoutes = require('./routes/crop');
const datasetRoutes = require('./routes/dataset');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/location', locationRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/crop', cropRoutes);
app.use('/api/dataset', datasetRoutes);

// Health check endpoint for AWS
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Smart Farming System running on port ${PORT}`);
});

module.exports = app;