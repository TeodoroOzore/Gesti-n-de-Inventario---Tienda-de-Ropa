# GUÍA RÁPIDA DE INICIO

## 🚀 Pasos para Ejecutar

### Opción 1: Automático (Recomendado)
1. Haz doble clic en `install.bat`
2. Espera a que termine
3. Copia y pega en terminal: `python run.py`
4. Abre http://localhost:5000

### Opción 2: Manual
```bash
# Terminal en la carpeta del proyecto
pip install -r requirements.txt
python run.py
```

## 📋 Primera Vez Usando la App

1. **Ve a Configuración** (icono de rueda dentada)
2. **Crea Vendedores**
   - Código: V001, V002, etc.
   - Nombre: Pedro, María, etc.
3. **Crea Productos**
   - Código: REMERA001, PANTALON001, etc.
   - Nombre, Talle, Color

4. **Prueba**:
   - Ve a Ingresos → Carga stock de prueba
   - Ve a Ventas → Registra una venta
   - Ve a Dashboard → Verás las estadísticas

## 🎯 Lo que puedes hacer

| Opción | Qué hace | Quién la usa |
|--------|----------|-------------|
| Dashboard | Ver resumen del día | Dueño/Gerente |
| Ventas | Registrar cada venta | Vendedor |
| Ingresos | Cargar mercadería nueva | Encargado almacén |
| Egresos | Registrar gastos | Tesorero/Dueño |
| Inventario | Ver existencias | Todos |
| Reportes | Análisis de ganancia | Dueño |
| Configuración | Crear vendedores/productos | Admin |

## ⚙️ Requisitos
- Python 3.10+ instalado en tu PC
- Conexión a internet (solo para instalación)
- Navegador web (Chrome, Firefox, Edge, etc.)

## 📊 Rentabilidad - ¿Cómo se Calcula?

```
Ganancia = Total Vendido - Costo de Productos - Gastos
Rentabilidad = (Ganancia / Total Vendido) × 100
```

Ejemplo:
- Vendiste: $1000
- Productos costaron: $400
- Gastos: $100
- Ganancia: $1000 - $400 - $100 = $500
- Rentabilidad: ($500 / $1000) × 100 = 50%

## 🆘 Problemas Comunes

**"Port 5000 already in use"**
- Copia: `python run.py --port 5001`

**"Flask no encontrado"**
- Terminal: `pip install Flask`

**Base de datos corrupta**
- Borra archivo `data/tienda.db`
- Reinicia la app

## 📞 Soporte

Lee el archivo `README.md` para documentación completa

---

¡Listo! Tu sistema de gestión está lista para usar 🎉
