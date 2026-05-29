

# app/routes/api.py (ejemplo)
@api_bp.route('/daily-performance', methods=['GET'])
def get_daily_performance():
    from_date_str = request.args.get('from')
    to_date_str = request.args.get('to')
    # ... lógica para consultar la base de datos y agrupar ventas/ganancias por día ...
    # Devolver un JSON como:
    # [
    #     {"date": "2023-01-01", "sales": 1200, "profit": 350},
    #     {"date": "2023-01-02", "sales": 900, "profit": 280},
    #     # ...
    # ]
    pass
# Gestión de Inventario - Tienda de Ropa

## Descripción del Proyecto

Software intuitivo y amigable para la gestión completa del inventario de una tienda de ropa, diseñado especialmente para usuarios sin experiencia en programación.

## Características Principales

✅ **Dashboard**: Vista general del negocio con estadísticas en tiempo real
✅ **Gestión de Inventario**: Control de existencias de productos
✅ **Registro de Ventas**: Registro individual con código de vendedor
✅ **Ingresos de Mercadería**: Registro de compras con costos
✅ **Egresos/Gastos**: Registro de todos los gastos operacionales
✅ **Reportes**: Análisis detallado de ingresos, costos y rentabilidad
✅ **Configuración**: Gestión de vendedores y productos

## Estructura del Proyecto

```
Gestion tienda ropa/
├── app/
│   ├── __init__.py              # Configuración de Flask
│   ├── models/
│   │   └── models.py            # Modelos de base de datos
│   ├── routes/
│   │   ├── main.py              # Rutas principales (páginas)
│   │   └── api.py               # API endpoints
│   ├── templates/               # Plantillas HTML
│   │   ├── base.html            # Plantilla base
│   │   ├── index.html           # Dashboard
│   │   ├── inventory.html       # Gestión de inventario
│   │   ├── sales.html           # Registro de ventas
│   │   ├── income.html          # Ingresos de mercadería
│   │   ├── expenses.html        # Egresos
│   │   ├── reports.html         # Reportes
│   │   └── settings.html        # Configuración
│   └── static/
│       ├── css/
│       │   └── style.css        # Estilos personalizados
│       └── js/
│           ├── main.js          # Funciones globales
│           ├── dashboard.js     # Dashboard
│           ├── sales.js         # Ventas
│           ├── income.js        # Ingresos
│           ├── inventory.js     # Inventario
│           ├── expenses.js      # Egresos
│           ├── reports.js       # Reportes
│           └── settings.js      # Configuración
├── data/                        # Base de datos (SQLite)
├── requirements.txt             # Dependencias del proyecto
└── run.py                       # Script para ejecutar la aplicación
```

## Instalación y Ejecución

### Requisitos Previos
- Python 3.10 o superior
- pip (gestor de paquetes de Python)

### Pasos de Instalación

1. **Abre una terminal/consola** en la carpeta del proyecto

2. **Instala las dependencias**:
```bash
pip install -r requirements.txt
```

Si algún paquete falla, instálalos manualmente:
```bash
pip install Flask==2.3.3
pip install Flask-SQLAlchemy==3.0.5
pip install python-dateutil==2.8.2
pip install openpyxl==3.1.2
pip install reportlab==4.0.7
pip install Pillow==10.0.0
```

3. **Ejecuta la aplicación**:
```bash
python run.py
```

4. **Accede a la aplicación**:
Abre tu navegador web y ve a:
```
http://localhost:5000
```

## Uso de la Aplicación

### 1. Configuración Inicial (Settings)
Primero, configura los elementos básicos:
- **Vendedores**: Crea una lista de los vendedores con sus códigos
- **Productos**: Agrega todos los productos con código, nombre, categoría, talle y color

### 2. Ingreso de Stock (Ingresos)
Registra las compras de mercadería:
- Producto
- Cantidad recibida
- Costo unitario
- Proveedor (opcional)

### 3. Registro de Ventas
Registra cada venta realizada:
- Selecciona el vendedor (código del vendedor)
- Selecciona el producto vendido
- Cantidad
- Precio de venta
- El sistema automáticamente descuenta del inventario

### 4. Control de Inventario
Visualiza el estado actual del stock:
- Cantidad en stock
- Costos unitarios
- Valor total del inventario
- Ajusta cantidades si es necesario

### 5. Egresos/Gastos
Registra todos los gastos del negocio:
- Descripción del gasto
- Categoría (Alquiler, Servicios, Salarios, etc.)
- Monto

### 6. Reportes y Análisis
Visualiza análisis detallados:
- **Total de Ventas**: Ingresos brutos del período
- **Costo de Ventas**: Lo que gastaste en los productos vendidos
- **Egresos**: Otros gastos operacionales
- **Ganancia Neta**: Lo que realmente ganaste
- **Rentabilidad**: Porcentaje de ganancia respecto a ventas
- Gráficos de vendedores y productos
- Top de productos más vendidos

### 7. Dashboard Principal
Vista general con:
- Ventas del día
- Items en stock
- Rentabilidad en %
- Resumen financiero completo

## Características Técnicas

### Base de Datos
- **SQLite**: Base de datos local (no requiere servidor externo)
- Ubicación: `data/tienda.db`
- Se crea automáticamente al ejecutar la aplicación

### API REST
Todos los datos se manejan através de una API REST completa con endpoints para:
- Vendedores (CRUD)
- Productos (CRUD)
- Inventario (GET, PUT)
- Ventas (GET, POST, DELETE)
- Ingresos (GET, POST, DELETE)
- Egresos (GET, POST, DELETE)
- Reportes (GET)

### Interfaz de Usuario
- **Bootstrap 5**: Framework CSS moderno y responsivo
- **Chart.js**: Gráficos interactivos
- **Diseño Intuitivo**: Fácil de usar para personas sin experiencia técnica
- **Responsive**: Funciona en cualquier dispositivo

## Cálculos de Rentabilidad

### Fórmulas Utilizadas

**Ganancia Bruta:**
```
Ganancia = Total Ventas - Costo de Productos Vendidos
```

**Ganancia Neta:**
```
Ganancia Neta = Total Ventas - Costos - Egresos
```

**Rentabilidad (%):**
```
Rentabilidad = (Ganancia Neta / Total Ventas) × 100
```

## Validaciones y Seguridad

- ✅ Validación de datos en entrada
- ✅ Integridad referencial de base de datos
- ✅ Manejo de errores y excepciones
- ✅ Confirmación antes de eliminaciones
- ✅ Notificaciones de éxito/error en UI

## Solución de Problemas

### "ModuleNotFoundError: No module named 'flask'"
Instala las dependencias:
```bash
pip install -r requirements.txt
```

### Puerto 5000 en uso
Cambia el puerto en `run.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Base de datos corrupta
Elimina `data/tienda.db` y reinicia la aplicación (se creará una nueva)

## Funcionalidades Futuras Sugeridas

- 📊 Exportar reportes a Excel y PDF
- 📸 Cargar imágenes de productos
- 💾 Backup automático de datos
- 📈 Gráficos de tendencias históricas
- 🏷️ Códigos de barras
- 👤 Sistema de usuarios con contraseñas
- 📧 Notificaciones por email

## Licencia

Proyecto de gestión para uso interno.

## Soporte

Para problemas o sugerencias, revisa el código en el IDE o contacta al desarrollador.

---

**¡Disfruta de tu nuevo sistema de gestión de tienda!**
# Gesti-n-de-Inventario---Tienda-de-Ropa
# Gesti-n-de-Inventario---Tienda-de-Ropa
