import io
import os
import json
import zipfile
import csv
from flask import Blueprint, request, jsonify, make_response, send_file
from app import db # Asegúrate de que 'db' esté importado
from app.models import Vendor, Product, Inventory, Sale, Income, Expense
from datetime import datetime
from sqlalchemy import func

bp = Blueprint('api', __name__)

# ============== INFORMACIÓN DEL NEGOCIO ==============
# Nota: En una implementación ideal, esto debería estar en una tabla 'Settings' en models.py.
SETTINGS_FILE = 'data/business_settings.json'

def load_business_data():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {
        "name": "Mi Tienda de Ropa",
        "cuit": "00-00000000-0",
        "address": "Calle Falsa 123",
        "tax_condition": "Monotributista"
    }

business_data = load_business_data()

@bp.route('/business-info', methods=['GET', 'POST'])
def business_info():
    global business_data
    if request.method == 'POST':
        data = request.get_json()
        business_data["name"] = data.get('name', business_data['name'])
        business_data["cuit"] = data.get('cuit', business_data['cuit'])
        business_data["address"] = data.get('address', business_data['address'])
        business_data["tax_condition"] = data.get('tax_condition', business_data['tax_condition'])
        
        os.makedirs('data', exist_ok=True)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(business_data, f)
        return jsonify(business_data)
    return jsonify(business_data)

def parse_date(date_str):
    """Helper para parsear fechas de forma segura"""
    if not date_str:
        return None
    try:
        # Maneja formatos YYYY-MM-DD y YYYY-MM-DD HH:MM:SS
        if ' ' in date_str:
            return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        return datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            return None

# ============== VENDEDORES ==============
@bp.route('/vendors', methods=['GET', 'POST'])
def vendors():
    if request.method == 'POST':
        data = request.get_json()
        vendor = Vendor(code=data['code'], name=data['name'])
        db.session.add(vendor)
        db.session.commit()
        return jsonify(vendor.to_dict()), 201
    
    vendors = Vendor.query.all()
    return jsonify([v.to_dict() for v in vendors])

@bp.route('/vendors/<int:id>', methods=['PUT', 'DELETE'])
def vendor_detail(id):
    vendor = Vendor.query.get_or_404(id)
    
    if request.method == 'PUT':
        data = request.get_json()
        vendor.code = data.get('code', vendor.code)
        vendor.name = data.get('name', vendor.name)
        db.session.commit()
        return jsonify(vendor.to_dict())
    
    db.session.delete(vendor)
    db.session.commit()
    return '', 204

# ============== PRODUCTOS ==============
@bp.route('/products', methods=['GET', 'POST'])
def products():
    if request.method == 'POST':
        data = request.get_json()

        # Validar código único
        existing_code = Product.query.filter_by(code=data['code']).first()
        if existing_code:
            return jsonify({'error': 'El código ya está en uso por otro producto.'}), 400

        # Validar producto duplicado por nombre, talle, color y categoría
        duplicate_product = Product.query.filter(
            Product.name == data['name'],
            Product.size == data.get('size'),
            Product.color == data.get('color'),
            Product.category == data.get('category')
        ).first()
        if duplicate_product:
            return jsonify({'error': 'Ya existe un producto con el mismo nombre, talle, color y categoría.'}), 400

        product = Product(
            code=data['code'],
            name=data['name'],
            size=data.get('size'),
            color=data.get('color'),
            category=data.get('category')
        )
        db.session.add(product)
        db.session.commit()
        return jsonify(product.to_dict()), 201
    
    products = Product.query.all()
    return jsonify([p.to_dict() for p in products])

@bp.route('/products/<int:id>', methods=['PUT', 'DELETE'])
def product_detail(id):
    product = Product.query.get_or_404(id)
    
    if request.method == 'PUT':
        data = request.get_json()

        new_code = data.get('code', product.code)
        if new_code != product.code:
            duplicate_code = Product.query.filter(Product.code == new_code, Product.id != id).first()
            if duplicate_code:
                return jsonify({'error': 'El código ya está en uso por otro producto.'}), 400

        new_name = data.get('name', product.name)
        new_size = data.get('size', product.size)
        new_color = data.get('color', product.color)
        new_category = data.get('category', product.category)
        duplicate_product = Product.query.filter(
            Product.name == new_name,
            Product.size == new_size,
            Product.color == new_color,
            Product.category == new_category,
            Product.id != id
        ).first()
        if duplicate_product:
            return jsonify({'error': 'Ya existe otro producto con el mismo nombre, talle, color y categoría.'}), 400

        product.code = new_code
        product.name = new_name
        product.size = new_size
        product.color = new_color
        product.category = new_category
        db.session.commit()
        return jsonify(product.to_dict())
    
    db.session.delete(product)
    db.session.commit()
    return '', 204

# ============== INVENTARIO ==============
@bp.route('/inventory', methods=['GET'])
def get_inventory():
    inventory = db.session.query(Inventory).join(Product).all()
    result = []
    for item in inventory:
        inv_dict = item.to_dict()
        inv_dict['total_value'] = item.quantity * item.cost
        result.append(inv_dict)
    return jsonify(result)

@bp.route('/inventory/<int:product_id>', methods=['PUT'])
def update_inventory(product_id):
    data = request.get_json()
    product = Product.query.get_or_404(product_id)
    
    inventory = Inventory.query.filter_by(product_id=product_id).first()
    if not inventory:
        inventory = Inventory(product_id=product_id)
        db.session.add(inventory)
    
    inventory.quantity = data.get('quantity', inventory.quantity)
    inventory.cost = data.get('cost', inventory.cost)
    inventory.price = data.get('price', inventory.price)
    db.session.commit()
    
    return jsonify(inventory.to_dict())

# ============== VENTAS ==============
@bp.route('/sales', methods=['GET', 'POST'])
def sales():
    if request.method == 'POST':
        data = request.get_json()
        
        # Validar stock suficiente
        inventory = Inventory.query.filter_by(product_id=data['product_id']).first()
        if not inventory or (inventory.quantity or 0) < data['quantity']:
            return jsonify({'error': 'Stock insuficiente para realizar la venta.'}), 400

        # Crear venta
        sale = Sale(
            vendor_id=data['vendor_id'],
            product_id=data['product_id'],
            quantity=data['quantity'],
            price=data['price'],
            total=data['quantity'] * data['price'],
            payment_method=data.get('payment_method', 'Efectivo') # Por defecto Efectivo
        )
        
        # Actualizar inventario
        if inventory:
            inventory.quantity = (inventory.quantity or 0) - data['quantity']
        
        db.session.add(sale)
        db.session.commit()
        return jsonify(sale.to_dict()), 201
    
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    
    query = Sale.query
    
    from_dt = parse_date(date_from)
    if from_dt:
        query = query.filter(Sale.date >= from_dt)
    
    to_dt = parse_date(date_to)
    if to_dt:
        query = query.filter(Sale.date <= to_dt)
    
    sales_list = query.order_by(Sale.date.desc()).all()
    return jsonify([s.to_dict() for s in sales_list])

@bp.route('/sales/<int:id>', methods=['PUT', 'DELETE'])
def update_delete_sale(id):
    sale = Sale.query.get_or_404(id)
    
    if request.method == 'PUT':
        data = request.get_json()
        new_qty = data.get('quantity', sale.quantity)
        new_product_id = data.get('product_id', sale.product_id)

        # Validar stock suficiente antes de actualizar
        # Sumamos la cantidad de la venta actual al stock disponible para validar el nuevo total
        target_inv = Inventory.query.filter_by(product_id=new_product_id).first()
        available_stock = (target_inv.quantity or 0) if target_inv else 0
        
        if new_product_id == sale.product_id:
            available_stock += sale.quantity

        if available_stock < new_qty:
            return jsonify({'error': 'Stock insuficiente para actualizar la venta.'}), 400
        
        # Revertir inventario de la venta original
        inventory = Inventory.query.filter_by(product_id=sale.product_id).first()
        if inventory:
            inventory.quantity = (inventory.quantity or 0) + sale.quantity
        
        # Actualizar datos de la venta
        sale.vendor_id = data.get('vendor_id', sale.vendor_id)
        sale.product_id = data.get('product_id', sale.product_id)
        sale.quantity = data.get('quantity', sale.quantity)
        sale.price = data.get('price', sale.price)
        sale.payment_method = data.get('payment_method', sale.payment_method)
        sale.total = sale.quantity * sale.price
        
        # Ajustar inventario del producto actualizado
        new_inventory = Inventory.query.filter_by(product_id=sale.product_id).first()
        if new_inventory:
            new_inventory.quantity = (new_inventory.quantity or 0) - sale.quantity
        
        db.session.commit()
        return jsonify(sale.to_dict()), 200
    
    # DELETE
    inventory = Inventory.query.filter_by(product_id=sale.product_id).first()
    if inventory:
        inventory.quantity = (inventory.quantity or 0) + sale.quantity
    
    db.session.delete(sale)
    db.session.commit()
    return '', 204

# ============== INGRESOS DE MERCADERÍA ==============
@bp.route('/income', methods=['GET', 'POST'])
def income():
    if request.method == 'POST':
        data = request.get_json()
        
        # Crear ingreso
        income_record = Income(
            product_id=data['product_id'],
            quantity=data['quantity'],
            cost=data['cost'],
            price=data.get('price', data['cost']),
            total_cost=data['quantity'] * data['cost'],
            provider=data.get('provider'),
            notes=data.get('notes')
        )
        
        # Actualizar inventario
        inventory = Inventory.query.filter_by(product_id=data['product_id']).first()
        if not inventory:
            inventory = Inventory(
                product_id=data['product_id'],
                cost=data['cost'],
                price=data.get('price', data['cost']),
                quantity=0
            )
            db.session.add(inventory)

        quantity = data['quantity'] if isinstance(data['quantity'], int) else int(data['quantity'])
        inventory.quantity = (inventory.quantity or 0) + quantity
        inventory.cost = data['cost']
        if 'price' in data and data['price']:
            inventory.price = data['price']

        db.session.add(income_record)
        db.session.commit()
        return jsonify(income_record.to_dict()), 201
    
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    
    query = Income.query
    
    from_dt = parse_date(date_from)
    if from_dt:
        query = query.filter(Income.date >= from_dt)
        
    to_dt = parse_date(date_to)
    if to_dt:
        query = query.filter(Income.date <= to_dt)
    
    income_list = query.all()
    return jsonify([i.to_dict() for i in income_list])

@bp.route('/income/<int:id>', methods=['PUT', 'DELETE'])
def income_update_delete(id):
    income = Income.query.get_or_404(id)
    inventory = Inventory.query.filter_by(product_id=income.product_id).first()

    if request.method == 'PUT':
        data = request.get_json()

        # Revertir inventario del ingreso original
        if inventory:
            inventory.quantity = (inventory.quantity or 0) - income.quantity

        income.product_id = data.get('product_id', income.product_id)
        income.quantity = data.get('quantity', income.quantity)
        income.cost = data.get('cost', income.cost)
        income.price = data.get('price', income.price)
        income.total_cost = income.quantity * income.cost
        income.provider = data.get('provider', income.provider)
        income.notes = data.get('notes', income.notes)

        # Ajustar inventario del producto actualizado
        new_inventory = Inventory.query.filter_by(product_id=income.product_id).first()
        if not new_inventory:
            new_inventory = Inventory(
                product_id=income.product_id,
                cost=income.cost,
                price=income.price,
                quantity=0
            )
            db.session.add(new_inventory)

        new_inventory.quantity = (new_inventory.quantity or 0) + income.quantity
        new_inventory.cost = income.cost
        new_inventory.price = income.price

        db.session.commit()
        return jsonify(income.to_dict()), 200

    # DELETE
    if inventory:
        inventory.quantity = (inventory.quantity or 0) - income.quantity
    db.session.delete(income)
    db.session.commit()
    return '', 204

# ============== EGRESOS ==============
@bp.route('/expenses', methods=['GET', 'POST'])
def expenses():
    if request.method == 'POST':
        data = request.get_json()
        expense = Expense(
            description=data['description'],
            amount=data['amount'],
            category=data.get('category'),
            notes=data.get('notes')
        )
        db.session.add(expense)
        db.session.commit()
        return jsonify(expense.to_dict()), 201
    
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    
    query = Expense.query
    
    from_dt = parse_date(date_from)
    if from_dt:
        query = query.filter(Expense.date >= from_dt)
        
    to_dt = parse_date(date_to)
    if to_dt:
        query = query.filter(Expense.date <= to_dt)
    
    expenses_list = query.all()
    return jsonify([e.to_dict() for e in expenses_list])

@bp.route('/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    expense = Expense.query.get_or_404(id)
    db.session.delete(expense)
    db.session.commit()
    return '', 204

# ============== REPORTES ==============
@bp.route('/dashboard-stats')
def dashboard_stats():
    """Estadísticas para el dashboard"""
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Query bases
    sales_query = Sale.query
    expenses_query = Expense.query

    from_dt = parse_date(date_from)
    if from_dt:
        sales_query = sales_query.filter(Sale.date >= from_dt)
        expenses_query = expenses_query.filter(Expense.date >= from_dt)
        
    to_dt = parse_date(date_to)
    if to_dt:
        sales_query = sales_query.filter(Sale.date <= to_dt)
        expenses_query = expenses_query.filter(Expense.date <= to_dt)

    # Ventas del día
    sales_today = db.session.query(func.sum(Sale.total)).filter(
        Sale.date >= today
    ).scalar() or 0
    
    # Total de ingresos de mercadería (Stock Actual)
    total_inventory_cost = db.session.query(
        func.sum(Inventory.quantity * Inventory.cost)
    ).scalar() or 0
    
    # Cantidad de productos en inventario
    total_products = db.session.query(func.count(Product.id)).scalar() or 0
    
    # Cantidad de items en inventario
    total_items = db.session.query(func.sum(Inventory.quantity)).scalar() or 0
    
    # Rentabilidad
    # Obtenemos los IDs de las ventas filtradas para calcular costos precisos
    filtered_sale_ids = [s.id for s in sales_query.with_entities(Sale.id).all()]
    
    total_sales = sales_query.with_entities(func.sum(Sale.total)).scalar() or 0
    
    total_costs = db.session.query(func.sum(Sale.quantity * Inventory.cost))\
        .join(Inventory, Sale.product_id == Inventory.product_id)\
        .filter(Sale.id.in_(filtered_sale_ids))\
        .scalar() or 0 if filtered_sale_ids else 0
    
    total_expenses = expenses_query.with_entities(func.sum(Expense.amount)).scalar() or 0
    profit = total_sales - total_costs - total_expenses
    profitability = ((profit / total_sales) * 100) if total_sales > 0 else 0
    
    return jsonify({
        'sales_today': sales_today,
        'total_inventory_cost': total_inventory_cost,
        'total_expenses': total_expenses,
        'total_products': total_products,
        'total_items': total_items,
        'total_sales': total_sales,
        'total_costs': total_costs,
        'profit': profit,
        'profitability': round(profitability, 2)
    })

@bp.route('/sales-by-vendor')
def sales_by_vendor():
    """Ventas por vendedor"""
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    
    query = db.session.query(
        Vendor.name,
        func.sum(Sale.total),
        func.count(Sale.id)
    ).outerjoin(Sale).group_by(Vendor.id)
    
    from_dt = parse_date(date_from)
    if from_dt:
        query = query.filter(Sale.date >= from_dt)
    to_dt = parse_date(date_to)
    if to_dt:
        query = query.filter(Sale.date <= to_dt)
    
    results = query.all()
    return jsonify([{
        'vendor': r[0],
        'total': r[1] or 0,
        'count': r[2]
    } for r in results])

@bp.route('/inventory-status')
def inventory_status():
    """Estado del inventario"""
    inventory = db.session.query(Inventory).join(Product).all()
    
    result = {
        'total_items': 0,
        'low_stock': [],
        'categories': {}
    }
    
    for item in inventory:
        qty = item.quantity or 0
        result['total_items'] += qty

        category = item.product.category or 'Sin categoría'
        if category not in result['categories']:
            result['categories'][category] = 0
        result['categories'][category] += qty

        if qty < 5:
            result['low_stock'].append({
                'product': item.product.name,
                'quantity': qty
            })
    
    return jsonify(result)

@bp.route('/daily-billing')
def daily_billing():
    """Facturación del día o rango de fechas con datos para gráfico"""
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    
    if date_from and date_to:
        start_date = parse_date(date_from)
        end_date = parse_date(date_to)
    else:
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = datetime.now().replace(hour=23, minute=59, second=59)

    sales = Sale.query.filter(Sale.date >= start_date, Sale.date <= end_date).all()
    expenses = Expense.query.filter(Expense.date >= start_date, Expense.date <= end_date).all()
    
    # Agrupar por día para el gráfico
    chart_map = {}
    
    # Procesar ventas
    for s in sales:
        day = s.date.strftime('%Y-%m-%d')
        if day not in chart_map:
            chart_map[day] = {'date': day, 'sales': 0, 'profit': 0, 'expenses': 0}
        chart_map[day]['sales'] += s.total
        # Calcular ganancia (venta - costo)
        inv = Inventory.query.filter_by(product_id=s.product_id).first()
        cost = s.quantity * (inv.cost or 0) if inv else 0
        chart_map[day]['profit'] += (s.total - cost)

    # Procesar gastos
    for e in expenses:
        day = e.date.strftime('%Y-%m-%d')
        if day not in chart_map:
            chart_map[day] = {'date': day, 'sales': 0, 'profit': 0, 'expenses': 0}
        
        chart_map[day]['expenses'] += e.amount
        # Restar gastos de la ganancia diaria
        chart_map[day]['profit'] -= e.amount

    total_sales = sum(s.total for s in sales)
    total_expenses = sum(e.amount for e in expenses)
    
    total_costs = 0
    payment_stats = {'Efectivo': 0, 'Otros': 0}
    vendor_counts = {}

    for s in sales:
        # Calcular costos
        inv = Inventory.query.filter_by(product_id=s.product_id).first()
        total_costs += s.quantity * (inv.cost or 0) if inv else 0
        
        # Estadísticas de pago
        method = s.payment_method if hasattr(s, 'payment_method') else 'Efectivo'
        if method == 'Efectivo':
            payment_stats['Efectivo'] += 1
        else:
            payment_stats['Otros'] += 1
            
        # Vendedor con más ventas
        vendor_name = s.vendor.name
        vendor_counts[vendor_name] = vendor_counts.get(vendor_name, 0) + 1

    top_vendor = max(vendor_counts, key=vendor_counts.get) if vendor_counts else "N/A"
    
    net_profit = total_sales - total_costs - total_expenses
    
    return jsonify({
        'total_sales': total_sales,
        'total_expenses': total_expenses,
        'total_costs': total_costs,
        'net_profit': net_profit,
        'sales_count': len(sales),
        'top_vendor': top_vendor,
        'payment_stats': payment_stats,
        'sales': [s.to_dict() for s in sales],
        'chart_data': sorted(chart_map.values(), key=lambda x: x['date'])
    })

@bp.route('/reports/accounting-package')
def accounting_package():
    """Genera un ZIP con reportes de Ventas, Compras y Gastos en CSV"""
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    
    from_dt = parse_date(date_from)
    to_dt = parse_date(date_to)

    # 1. Preparar CSV de Ventas
    sales = Sale.query.filter(Sale.date >= from_dt, Sale.date <= to_dt).all()
    sales_io = io.StringIO()
    sales_writer = csv.writer(sales_io)
    sales_writer.writerow(['Fecha', 'Comprobante', 'Vendedor', 'Producto', 'Cantidad', 'Precio Unit.', 'Total', 'Metodo Pago'])
    for s in sales:
        sales_writer.writerow([
            s.date.strftime('%Y-%m-%d %H:%M'),
            f"Venta #{s.id}",
            s.vendor.name if s.vendor else 'N/A',
            s.product.name if s.product else 'N/A',
            s.quantity, s.price, s.total, s.payment_method
        ])

    # 2. Preparar CSV de Compras (Ingresos)
    incomes = Income.query.filter(Income.date >= from_dt, Income.date <= to_dt).all()
    incomes_io = io.StringIO()
    incomes_writer = csv.writer(incomes_io)
    incomes_writer.writerow(['Fecha', 'Producto', 'Cantidad', 'Costo Unit.', 'Costo Total', 'Proveedor'])
    for i in incomes:
        incomes_writer.writerow([
            i.date.strftime('%Y-%m-%d'),
            i.product.name if i.product else 'N/A',
            i.quantity, i.cost, i.total_cost, i.provider or '-'
        ])

    # 3. Preparar CSV de Gastos (Egresos)
    expenses = Expense.query.filter(Expense.date >= from_dt, Expense.date <= to_dt).all()
    expenses_io = io.StringIO()
    expenses_writer = csv.writer(expenses_io)
    expenses_writer.writerow(['Fecha', 'Categoria', 'Descripcion', 'Monto', 'Notas'])
    for e in expenses:
        expenses_writer.writerow([
            e.date.strftime('%Y-%m-%d'),
            e.category, e.description, e.amount, e.notes or '-'
        ])

    # Crear el ZIP en memoria
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zf:
        zf.writestr('libro_ventas.csv', sales_io.getvalue())
        zf.writestr('libro_compras_mercaderia.csv', incomes_io.getvalue())
        zf.writestr('libro_gastos_operativos.csv', expenses_io.getvalue())
        
        # Agregar info del negocio si existe
        info_txt = f"Reporte Contable: {business_data['name']}\nCUIT: {business_data['cuit']}\nPeriodo: {date_from} al {date_to}"
        zf.writestr('info_negocio.txt', info_txt)

    memory_file.seek(0)
    
    filename = f"paquete_contable_{datetime.now().strftime('%Y%m%d_%H%M')}.zip"
    
    return send_file(
        memory_file,
        mimetype='application/zip',
        as_attachment=True,
        download_name=filename
    )
