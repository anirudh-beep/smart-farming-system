@echo off
echo FarmX - Removing USA Locations
echo ================================

echo Removed USA and related states from:
echo - Location service regions database
echo - Reverse geocoding major locations
echo - Soil service location mappings
echo - HTML country selection dropdown
echo.
echo Now FarmX supports India locations only:
echo - 15+ Indian states with major agricultural districts
echo - 50+ cities and districts across India
echo - Comprehensive village coverage
echo - Enhanced GPS detection for Indian locations
echo.

echo Adding updated files...
git add src/services/locationService.js
git add src/services/soilService.js
git add public/index.html

echo Committing changes...
git commit -m "FarmX - Remove USA locations, India-only platform"

echo Pushing to GitHub...
git push origin main

echo.
echo ✅ USA Locations Removed Successfully!
echo.
echo FarmX now supports:
echo - India only (15+ states)
echo - Maharashtra, Karnataka, Gujarat, UP, MP, Bihar, etc.
echo - Major agricultural districts and cities
echo - Village-level location selection
echo.
echo Your FarmX platform is now India-focused! 🇮🇳
echo.
pause