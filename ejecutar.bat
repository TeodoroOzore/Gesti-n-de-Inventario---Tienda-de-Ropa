@echo off
REM Script para ejecutar la aplicación
REM Gestión de Tienda de Ropa

echo.
echo ================================================
echo    GESTION DE TIENDA DE ROPA
echo ================================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no está instalado
    echo Instala Python desde https://www.python.org
    pause
    exit /b 1
)

echo [✓] Iniciando servidor...
echo.
echo La aplicación estará disponible en:
echo   http://localhost:5000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

python run.py
pause
