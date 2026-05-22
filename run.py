#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script principal para ejecutar la aplicación de gestión de tienda de ropa
"""

from app import create_app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
