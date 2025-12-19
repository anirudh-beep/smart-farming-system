@echo off
echo ========================================
echo  Fix Git Push - Pull and Rebase
echo ========================================
echo.

echo [1/3] Pulling latest changes from GitHub...
git pull origin main --rebase
echo.

echo [2/3] Checking status after pull...
git status
echo.

echo [3/3] Pushing changes to GitHub...
git push origin main
echo.

echo ========================================
echo  Push completed!
echo ========================================
echo.
pause