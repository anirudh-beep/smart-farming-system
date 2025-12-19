@echo off
echo FramX - Branding Update Complete
echo =================================

echo Updating all branding to FramX...

echo Adding all updated files...
git add .

echo Committing branding changes...
git commit -m "FramX - Complete rebranding from Smart Farming System to FramX"

echo Pushing to GitHub...
git push origin main

echo.
echo ✅ FramX Branding Update Complete!
echo.
echo Updated Components:
echo - Website title and navigation
echo - Hero section branding
echo - Footer information
echo - Package.json metadata
echo - README documentation
echo - Console messages
echo.
echo Your FramX platform is now fully branded!
echo Live at: https://framx.onrender.com
echo.
pause