@echo off
echo FramX React Setup
echo =================

echo Step 1: Moving current backend to server folder...
mkdir server 2>nul
move src server\ 2>nul
move dataset.csv server\ 2>nul
move .env server\ 2>nul

echo Step 2: Updating package.json for React structure...
copy package-react.json package.json

echo Step 3: Installing backend dependencies...
npm install

echo Step 4: Installing React dependencies...
cd client
npm install
cd ..

echo Step 5: Creating server .env file...
echo PORT=3001 > server\.env
echo WEATHER_API_KEY=1670989aa9a1404ebe975604251912 >> server\.env
echo GEMINI_API_KEY=AIzaSyCFa1ysArD0oLzZM9whf54uI8EDZEEKH5g >> server\.env
echo NODE_ENV=development >> server\.env

echo Step 6: Updating server app.js for new structure...
echo const express = require('express'); > server\app.js
echo const cors = require('cors'); >> server\app.js
echo const path = require('path'); >> server\app.js
echo require('dotenv').config(); >> server\app.js
echo. >> server\app.js
echo const app = express(); >> server\app.js
echo const PORT = process.env.PORT ^|^| 3001; >> server\app.js
echo. >> server\app.js
echo // Middleware >> server\app.js
echo app.use(cors()); >> server\app.js
echo app.use(express.json()); >> server\app.js
echo. >> server\app.js
echo // API Routes >> server\app.js
echo app.use('/api/location', require('./src/routes/location')); >> server\app.js
echo app.use('/api/soil', require('./src/routes/soil')); >> server\app.js
echo app.use('/api/weather', require('./src/routes/weather')); >> server\app.js
echo app.use('/api/crop', require('./src/routes/crop')); >> server\app.js
echo app.use('/api/dataset', require('./src/routes/dataset')); >> server\app.js
echo. >> server\app.js
echo // Serve React build in production >> server\app.js
echo if (process.env.NODE_ENV === 'production') { >> server\app.js
echo   app.use(express.static(path.join(__dirname, '../client/build'))); >> server\app.js
echo   app.get('*', (req, res) =^> { >> server\app.js
echo     res.sendFile(path.join(__dirname, '../client/build/index.html')); >> server\app.js
echo   }); >> server\app.js
echo } >> server\app.js
echo. >> server\app.js
echo // Health check >> server\app.js
echo app.get('/health', (req, res) =^> { >> server\app.js
echo   res.json({ status: 'healthy', service: 'FramX API' }); >> server\app.js
echo }); >> server\app.js
echo. >> server\app.js
echo app.listen(PORT, () =^> { >> server\app.js
echo   console.log(`FramX API running on port ${PORT}`); >> server\app.js
echo }); >> server\app.js

echo.
echo ✅ FramX React Setup Complete!
echo.
echo To start development:
echo 1. npm run dev (starts both backend and frontend)
echo.
echo Or separately:
echo 1. npm run server (backend on port 3001)
echo 2. npm run client (frontend on port 3000)
echo.
echo Your React app will be at: http://localhost:3000
echo Your API will be at: http://localhost:3001
echo.
pause