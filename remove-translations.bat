@echo off
echo Removing translation system...

REM Remove all data-translate attributes from HTML
powershell -Command "(Get-Content 'public/index.html') -replace ' data-translate=\"[^\"]*\"', '' | Set-Content 'public/index.html'"
powershell -Command "(Get-Content 'public/index.html') -replace ' data-translate-placeholder=\"[^\"]*\"', '' | Set-Content 'public/index.html'"

echo Translation system removed successfully!
pause