from app import db
from datetime import datetime

class Vendor(db.Model):
    """Modelo de Vendedor"""
    __tablename__ = 'vendors'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    sales = db.relationship('Sale', backref='vendor', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name
        }

class Product(db.Model):
    """Modelo de Producto"""
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    size = db.Column(db.String(10))
    color = db.Column(db.String(50))
    category = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    inventory = db.relationship('Inventory', backref='product', lazy=True, cascade='all, delete-orphan')
    sales = db.relationship('Sale', backref='product', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'size': self.size,
            'color': self.color,
            'category': self.category
        }

class Inventory(db.Model):
    """Modelo de Inventario"""
    __tablename__ = 'inventory'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=0)
    cost = db.Column(db.Float, default=0)  # Costo unitario
    price = db.Column(db.Float, default=0)  # Precio de venta al público
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product': self.product.to_dict() if self.product else None,
            'quantity': self.quantity,
            'cost': self.cost,
            'price': self.price
        }

class Sale(db.Model):
    """Modelo de Venta"""
    __tablename__ = 'sales'
    
    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default='Efectivo')
    date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'vendor': self.vendor.to_dict() if self.vendor else None,
            'product': self.product.to_dict() if self.product else None,
            'quantity': self.quantity,
            'price': self.price,
            'total': self.total,
            'payment_method': self.payment_method,
            'date': self.date.isoformat()
        }

class Income(db.Model):
    """Modelo de Ingreso de Mercadería"""
    __tablename__ = 'incomes'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    cost = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total_cost = db.Column(db.Float, nullable=False)
    provider = db.Column(db.String(100))
    notes = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product', backref='incomes')
    
    def to_dict(self):
        return {
            'id': self.id,
            'product': self.product.to_dict() if self.product else None,
            'quantity': self.quantity,
            'cost': self.cost,
            'price': self.price,
            'total_cost': self.total_cost,
            'provider': self.provider,
            'notes': self.notes,
            'date': self.date.isoformat()
        }

class Expense(db.Model):
    """Modelo de Egreso"""
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    notes = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'category': self.category,
            'notes': self.notes,
            'date': self.date.isoformat()
        }
