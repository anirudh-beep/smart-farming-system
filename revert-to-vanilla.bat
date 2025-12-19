@echo off
echo Reverting FramX to Original Vanilla JS Structure
echo =================================================

echo Removing React components and files...
rmdir /s /q client 2>nul
del package-react.json 2>nul
del setup-react.bat 2>nul
del REACT_SETUP_GUIDE.md 2>nul
del update-react-improvements.bat 2>nul
del fix-soil-update.bat 2>nul

echo Restoring original structure...
echo - Keeping original HTML, CSS, JS files
echo - Keeping Node.js backend in src/
echo - Keeping original package.json

echo.
echo ✅ Reverted to Original Vanilla JS Structure!
echo.
echo Current Structure:
echo - public/index.html (Original HTML)
echo - public/styles.css (Original CSS)  
echo - public/script.js (Original JavaScript)
echo - src/ (Node.js backend)
echo - package.json (Original)
echo.
echo Your FramX is now back to the original vanilla setup.
echo Run: npm run dev (to start with nodemon)
echo Or: npm start (to start production)
echo.
pause