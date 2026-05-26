@echo off
REM Script para crear un ejecutable único (.exe) de la aplicación
REM Asegúrate de tener instaladas las dependencias: pip install pyinstaller flask flask-sqlalchemy

setlocal
cd /d "%~dp0"
echo ================================================
echo Construyendo ejecutable único para Windows...
echo ================================================

REM --onefile: Crea un solo archivo .exe que contiene todo.
REM --windowed: Evita que se abra la consola negra al ejecutar la app.
REM --add-data: Incluye las carpetas de plantillas y estilos dentro del paquete.
python -m PyInstaller --noconfirm --onefile --windowed --clean ^
    --add-data "app/templates;app/templates" ^
    --add-data "app/static;app/static" ^
    --collect-all flask ^
    --name "GestionTiendaRopa" run.py

if errorlevel 1 goto error

echo Generando paquete comprimido para distribución...
if exist GestionTiendaRopa_Portable.zip del /F /Q GestionTiendaRopa_Portable.zip
powershell -NoProfile -Command "Compress-Archive -Path .\dist\* -DestinationPath .\GestionTiendaRopa_Portable.zip -Force"
if errorlevel 1 goto error

echo.
echo ================================================
echo ¡Compilación completada!
echo 1. Tu ejecutable está en: dist\GestionTiendaRopa.exe
echo 2. El archivo ZIP para compartir está en la raíz del proyecto.
goto end

:error
echo.
echo ================================================
echo [✗] La compilación falló.
echo Verifica que PyInstaller esté instalado y que no haya errores en el proyecto.

:end
endlocal
pause
