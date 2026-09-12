const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const locationRoutes = require('./routes/location');
const soilRoutes = require('./routes/soil');
const weatherRoutes = require('./routes/weather');
const cropRoutes = require('./routes/crop');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/location', locationRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/crop', cropRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong!' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`FarmX running on port ${port}`);
  });
}

module.exports = app;