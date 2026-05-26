from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
import sys

db = SQLAlchemy()

def create_app():
    if getattr(sys, 'frozen', False):
        # Si es un .exe, los archivos internos (templates/static) están en _MEIPASS
        template_folder = os.path.join(sys._MEIPASS, 'app', 'templates')
        static_folder = os.path.join(sys._MEIPASS, 'app', 'static')
        app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
        # La base de datos debe estar al lado del .exe para no borrarse
        root_dir = os.path.dirname(sys.executable)
    else:
        app = Flask(__name__)
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    data_dir = os.path.join(root_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(data_dir, "tienda.db")}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    # Registrar blueprints
    from app.routes import main, api
    app.register_blueprint(main.bp)
    app.register_blueprint(api.bp, url_prefix='/api')
    
    with app.app_context():
        db.create_all()
    
    return app
