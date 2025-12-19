@echo off
echo Fixing Git Push Issue...
echo ========================

echo Pulling remote changes first...
git pull origin main --allow-unrelated-histories

echo Adding any new changes...
git add .

echo Committing merge...
git commit -m "FramX - Merge remote and local repositories"

echo Pushing to GitHub...
git push -u origin main

echo.
echo Git push completed successfully!
echo Your repository is now synced with GitHub.
echo.
pause