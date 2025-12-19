@echo off
echo FarmX - Complete Branding Update
echo ==================================

echo Updated Branding from FramX to FarmX:
echo - Website title and navigation
echo - Hero section branding  
echo - Footer information
echo - Package.json metadata
echo - README documentation
echo - Console messages
echo - Health check responses

echo.
echo Adding all updated files...
git add .

echo Committing branding changes...
git commit -m "FarmX - Complete rebranding from FramX to FarmX"

echo Pushing to GitHub...
git push origin main

echo.
echo ✅ FarmX Branding Update Complete!
echo.
echo Updated Components:
echo - HTML: Title, navigation, hero, footer
echo - Package.json: Name, description, author, keywords
echo - Backend: Console messages, health check
echo - README: Documentation and setup guide
echo.
echo Your FarmX platform is now fully rebranded!
echo Live at: https://farmx.onrender.com (after deployment)
echo.
pause