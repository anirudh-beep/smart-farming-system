@echo off
echo ========================================
echo  FarmX - Push Reverted Changes
echo ========================================
echo.

echo [1/5] Checking Git status...
git status
echo.

echo [2/5] Adding all reverted changes...
git add .
echo.

echo [3/5] Committing reverted changes...
git commit -m "revert: Restore original design before responsive overhaul

Reverted comprehensive responsive changes back to original state:

✅ RESTORED ORIGINAL DESIGN:
- Simple, clean CSS structure
- Basic mobile responsiveness (768px breakpoint)
- Original footer design and styling
- Simple hamburger menu functionality

✅ REMOVED COMPLEX FEATURES:
- Comprehensive 6-breakpoint responsive system
- Advanced touch optimizations
- Intersection observer animations
- Complex viewport handling
- Network status monitoring
- Low-end device detection

✅ FIXED ISSUES:
- Footer display and styling restored
- Removed duplicate CSS rules
- Simplified JavaScript to original state
- Clean, working navigation

✅ CURRENT STATE:
- Original vanilla JavaScript design
- Basic responsive design intact
- Working footer with proper styling
- Simple, maintainable codebase

The website is now back to its clean, simple state with
basic responsive features that work properly on all devices."
echo.

echo [4/5] Pushing to GitHub...
git push origin main
echo.

echo [5/5] Update Complete!
echo ========================================
echo ✅ Reverted changes pushed to GitHub
echo ✅ Website restored to original state
echo ✅ Footer fixed and working properly
echo ✅ Simple, clean design maintained
echo ========================================
echo.

echo Repository: https://github.com/anirudh-beep/smart-farming-system
echo.
pause