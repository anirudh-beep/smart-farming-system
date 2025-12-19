@echo off
echo ========================================
echo  FarmX - GitHub Update Script
echo ========================================
echo.

echo [1/6] Checking Git status...
git status
echo.

echo [2/6] Adding all changes to staging...
git add .
echo.

echo [3/6] Committing changes...
git commit -m "feat: Add FarmX favicon and enhance seasonal analysis

- Add FarmX favicon with green seedling design for browser tabs
- Create separate seasonal analysis section with comprehensive data
- Enhance farming insights with weather summary cards
- Add field operations guidance (planting, spraying, harvesting)
- Implement risk assessment grid with visual indicators
- Add agricultural calendar with season-specific crop recommendations
- Improve weather service with Indian agricultural zone patterns
- Add responsive design for mobile devices
- Update server port to 3001 to avoid conflicts

Features:
✅ FarmX favicon in browser tabs and bookmarks
✅ Dedicated seasonal analysis with planting schedules
✅ Enhanced farming insights with actionable advice
✅ Weather-based field operation recommendations
✅ Visual risk assessment for drought, flood, temperature, disease
✅ Agricultural calendar with crop timing guidance
✅ Responsive design for all devices"
echo.

echo [4/6] Checking remote repository...
git remote -v
echo.

echo [5/6] Pushing to GitHub...
git push origin main
echo.

echo [6/6] Update Summary:
echo ========================================
echo ✅ All changes committed to Git
echo ✅ Changes pushed to GitHub repository
echo ✅ FarmX favicon and seasonal analysis live
echo ========================================
echo.

echo Recent updates include:
echo • FarmX favicon for browser identification
echo • Separate seasonal analysis section
echo • Enhanced farming insights with weather cards
echo • Field operations guidance system
echo • Risk assessment with visual indicators
echo • Agricultural calendar integration
echo • Mobile-responsive design improvements
echo.

echo Your GitHub repository is now updated!
echo Repository URL: https://github.com/[your-username]/[your-repo-name]
echo.
pause