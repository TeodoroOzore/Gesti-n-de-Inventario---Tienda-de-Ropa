@echo off
REM Script de instalación para Gestión de Tienda de Ropa
REM Este script instala todas las dependencias necesarias

echo.
echo ===============================================
echo Instalador - Gestion de Tienda de Ropa
echo ===============================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no está instalado o no está en PATH
    echo Por favor instala Python desde https://www.python.org
    pause
    exit /b 1
)

echo [✓] Python detectado
echo.

REM Actualizar pip
echo Actualizando pip...
python -m pip install --upgrade pip --quiet
if errorlevel 1 (
    echo Advertencia: No se pudo actualizar pip, continuando...
)

echo.
echo Instalando dependencias...
echo.

REM Instalar cada paquete
echo [*] Instalando Flask...
python -m pip install Flask==2.3.3 --quiet
if errorlevel 1 goto error

echo [✓] Flask instalado

echo [*] Instalando Flask-SQLAlchemy...
python -m pip install Flask-SQLAlchemy==3.0.5 --quiet
if errorlevel 1 goto error

echo [✓] Flask-SQLAlchemy instalado

echo [*] Instalando python-dateutil...
python -m pip install python-dateutil==2.8.2 --quiet
if errorlevel 1 goto error

echo [✓] python-dateutil instalado

echo [*] Instalando openpyxl...
python -m pip install openpyxl==3.1.2 --quiet
if errorlevel 1 goto error

echo [✓] openpyxl instalado

echo [*] Instalando reportlab...
python -m pip install reportlab==4.0.7 --quiet
if errorlevel 1 goto error

echo [✓] reportlab instalado

echo [*] Instalando Pillow...
python -m pip install Pillow==10.0.0 --quiet
if errorlevel 1 goto error

echo [✓] Pillow instalado

echo.
echo ===============================================
echo [✓] ¡Instalación completada exitosamente!
echo ===============================================
echo.
echo Ahora puedes ejecutar la aplicación con:
echo   python run.py
echo.
echo Luego abre tu navegador en:
echo   http://localhost:5000
echo.
pause
exit /b 0

:error
echo.
echo ===============================================
echo [✗] Error durante la instalación
echo ===============================================
echo.
echo Intenta ejecutar manualmente:
echo   pip install -r requirements.txt
echo.
pause
exit /b 1
