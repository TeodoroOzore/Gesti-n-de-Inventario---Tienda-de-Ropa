from flask import Blueprint, request, jsonify
from app import db
from app.models import Vendor, Product, Inventory, Sale, Income, Expense
from datetime import datetime, timedelta
from sqlalchemy import func

bp = Blueprint('api', __name__)

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
        product.code = data.get('code', product.code)
        product.name = data.get('name', product.name)
        product.size = data.get('size', product.size)
        product.color = data.get('color', product.color)
        product.category = data.get('category', product.category)
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
    db.session.commit()
    
    return jsonify(inventory.to_dict())

# ============== VENTAS ==============
@bp.route('/sales', methods=['GET', 'POST'])
def sales():
    if request.method == 'POST':
        data = request.get_json()
        
        # Crear venta
        sale = Sale(
            vendor_id=data['vendor_id'],
            product_id=data['product_id'],
            quantity=data['quantity'],
            price=data['price'],
            total=data['quantity'] * data['price']
        )
        
        # Actualizar inventario
        inventory = Inventory.query.filter_by(product_id=data['product_id']).first()
        if inventory:
            inventory.quantity = (inventory.quantity or 0) - data['quantity']
        
        db.session.add(sale)
        db.session.commit()
        return jsonify(sale.to_dict()), 201
    
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    
    query = Sale.query
    
    if date_from:
        query = query.filter(Sale.date >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Sale.date <= datetime.fromisoformat(date_to))
    
    sales_list = query.all()
    return jsonify([s.to_dict() for s in sales_list])

@bp.route('/sales/<int:id>', methods=['DELETE'])
def delete_sale(id):
    sale = Sale.query.get_or_404(id)
    
    # Revertir inventario
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
            total_cost=data['quantity'] * data['cost'],
            provider=data.get('provider'),
            notes=data.get('notes')
        )
        
        # Actualizar inventario
        inventory = Inventory.query.filter_by(product_id=data['product_id']).first()
        if not inventory:
            # Inicializar quantity a 0 para evitar NoneType + int
            inventory = Inventory(product_id=data['product_id'], cost=data['cost'], quantity=0)
            db.session.add(inventory)
        
        # Asegurarse de que quantity no sea None antes de sumar
        inventory.quantity = (inventory.quantity or 0) + data['quantity']
        inventory.cost = data['cost']
        
        db.session.add(income_record)
        db.session.commit()
        return jsonify(income_record.to_dict()), 201
    
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    
    query = Income.query
    
    if date_from:
        query = query.filter(Income.date >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Income.date <= datetime.fromisoformat(date_to))
    
    income_list = query.all()
    return jsonify([i.to_dict() for i in income_list])

@bp.route('/income/<int:id>', methods=['DELETE'])
def delete_income(id):
    income = Income.query.get_or_404(id)
    
    # Revertir inventario
    inventory = Inventory.query.filter_by(product_id=income.product_id).first()
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
    
    if date_from:
        query = query.filter(Expense.date >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Expense.date <= datetime.fromisoformat(date_to))
    
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
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Ventas del día
    sales_today = db.session.query(func.sum(Sale.total)).filter(
        Sale.date >= today
    ).scalar() or 0
    
    # Total de ingresos de mercadería
    total_inventory_cost = db.session.query(
        func.sum(Inventory.quantity * Inventory.cost)
    ).scalar() or 0
    
    # Total egresos (gastos)
    total_expenses = db.session.query(func.sum(Expense.amount)).scalar() or 0
    
    # Cantidad de productos en inventario
    total_products = db.session.query(func.count(Product.id)).scalar() or 0
    
    # Cantidad de items en inventario
    total_items = db.session.query(func.sum(Inventory.quantity)).scalar() or 0
    
    # Rentabilidad
    total_sales = db.session.query(func.sum(Sale.total)).scalar() or 0
    total_costs = db.session.query(
        func.sum(Sale.quantity * Inventory.cost)
    ).select_from(Sale).join(Inventory, Sale.product_id == Inventory.product_id).scalar() or 0
    
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
    ).join(Sale).group_by(Vendor.id)
    
    if date_from:
        query = query.filter(Sale.date >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Sale.date <= datetime.fromisoformat(date_to))
    
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
    """Facturación del día"""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    sales = Sale.query.filter(Sale.date >= today).all()
    expenses = Expense.query.filter(Expense.date >= today).all()
    
    total_sales = sum(s.total for s in sales)
    total_expenses = sum(e.amount for e in expenses)
    total_costs = sum(
        s.quantity * (Inventory.query.filter_by(product_id=s.product_id).first().cost or 0)
        for s in sales
    )
    
    net_profit = total_sales - total_costs - total_expenses
    
    return jsonify({
        'total_sales': total_sales,
        'total_expenses': total_expenses,
        'total_costs': total_costs,
        'net_profit': net_profit,
        'sales_count': len(sales),
        'sales': [s.to_dict() for s in sales]
    })
