@echo off
echo Starting Bhakti Marga Media Platform Development Environment...
echo.
:: Start the Hydrogen dev server in a new window with logging to dev.log
echo - Starting Hydrogen development server...
echo - Logs will be written to dev.log
start "Hydrogen Dev Server" powershell -NoExit -Command "cd '%~dp0'; npx shopify hydrogen dev --codegen --env-file .env.local 2>&1 | Tee-Object -FilePath dev.log"

pause
