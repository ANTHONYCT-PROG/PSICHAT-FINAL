@echo off
echo Limpiando caches de PsiChatV2...

REM Limpiar caches de Python
echo Limpiando caches de Python...
if exist backend\.mypy_cache rmdir /s /q backend\.mypy_cache
if exist backend\.pytest_cache rmdir /s /q backend\.pytest_cache

REM Limpiar __pycache__
echo Limpiando __pycache__...
for /r backend %%i in (__pycache__) do if exist "%%i" rmdir /s /q "%%i"

REM Limpiar archivos .pyc
echo Limpiando archivos .pyc...
for /r backend %%i in (*.pyc) do if exist "%%i" del "%%i"

REM Limpiar logs de debug
echo Limpiando logs de debug...
if exist backend\logs\debug.log type nul > backend\logs\debug.log
if exist backend\logs\access.log type nul > backend\logs\access.log

REM Limpiar caches de Node.js (opcional)
echo Limpiando caches de Node.js...
if exist frontend\node_modules\.cache rmdir /s /q frontend\node_modules\.cache

echo Limpieza completada!
pause 