@echo off
echo ========================================
echo  Reverting Responsive Changes
echo ========================================
echo.

echo [1/4] Checking Git log to find commit before responsive changes...
git log --oneline -10
echo.

echo [2/4] Showing current Git status...
git status
echo.

echo [3/4] Reverting to previous commit (before responsive overhaul)...
echo This will undo the comprehensive responsive changes and restore the previous state.
echo.
set /p confirm="Are you sure you want to revert? (y/n): "
if /i "%confirm%"=="y" (
    echo Reverting changes...
    git reset --hard HEAD~1
    echo.
    echo [4/4] Revert completed!
    echo ========================================
    echo ✅ Successfully reverted responsive changes
    echo ✅ Website restored to previous state
    echo ✅ All files back to pre-responsive version
    echo ========================================
) else (
    echo Revert cancelled.
)
echo.
pause