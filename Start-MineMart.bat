@echo off
chcp 65001 >nul
title Mine Mart Store & Admin Launcher 2026
color 0A

echo ================================================================
echo           MINE MART - تشغيل خادم المتجر ولوحة الإدارة
echo ================================================================
echo.
echo [1/2] جاري تشغيل سيرفر المتجر المحلي (Port 5000)...
echo [2/2] جاري فتح المتجر ولوحة التحكم في المتصفح تلقائياً...
echo.
echo   - رابط لوحة الإدارة: http://localhost:5000/admin.html
echo   - رابط المتجر المباشر: http://localhost:5000/index.html
echo.
echo   * كافة التعديلات والإضافات تُحفظ فورياً في مجلد data\
echo ================================================================
echo.

timeout /t 2 /nobreak >nul
start "" "http://localhost:5000/admin.html"
start "" "http://localhost:5000/index.html"

node server.js
pause
