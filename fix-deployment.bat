@echo off
echo Fixing Deployment Issue - Adding Public Folder
echo ===============================================

echo Adding public folder to Git...
git add public/

echo Adding updated .gitignore...
git add .gitignore

echo Committing the fix...
git commit -m "FramX - Fix deployment: Add public folder with HTML, CSS, JS files"

echo Pushing to GitHub (this will trigger automatic redeployment)...
git push origin main

echo.
echo ✅ Fix deployed! 
echo Your app at https://framx.onrender.com should work in 2-3 minutes
echo.
echo The public folder with index.html, styles.css, and script.js is now included.
echo Render will automatically redeploy your application.
echo.
pause