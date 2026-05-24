@echo off
REM Script para crear un ejecutable portable de la aplicación
REM Requiere Python y PyInstaller instalados

setlocal
cd /d "%~dp0"
echo ================================================
echo Construyendo ejecutable portable...
echo ================================================

python -m PyInstaller --onefile --add-data "app\templates;app\templates" --add-data "app\static;app\static" --name "GestionTiendaRopa" run.py
if errorlevel 1 goto error

echo.
echo ================================================
echo ¡Compilación completada!
echo Ejecutable generado en: %cd%\dist\GestionTiendaRopa.exe
echo Para enviar por Drive o WhatsApp, comprime la carpeta dist o el exe.
goto end

:error
echo.
echo ================================================
echo [✗] La compilación falló.
echo Verifica que PyInstaller esté instalado y que no haya errores en el proyecto.

:end
endlocal
pause
