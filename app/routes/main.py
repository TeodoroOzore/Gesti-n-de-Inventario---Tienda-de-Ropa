from flask import Blueprint, render_template
from datetime import datetime
from app import db
from app.models import Vendor, Product, Sale, Income, Expense

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    """Página principal del dashboard"""
    return render_template('index.html', now=datetime.utcnow())

@bp.route('/inventory')
def inventory():
    """Página de gestión de inventario"""
    return render_template('inventory.html')

@bp.route('/sales')
def sales():
    """Página de registro de ventas"""
    return render_template('sales.html')

@bp.route('/income')
def income():
    """Página de ingreso de mercadería"""
    return render_template('income.html')

@bp.route('/expenses')
def expenses():
    """Página de egresos"""
    return render_template('expenses.html')

@bp.route('/reports')
def reports():
    """Página de reportes"""
    return render_template('reports.html')

@bp.route('/settings')
def settings():
    """Página de configuración (vendedores, productos)"""
    return render_template('settings.html')
