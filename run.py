#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script principal para ejecutar la aplicación de gestión de tienda de ropa
"""

import os
import threading
import webbrowser
from app import create_app

if __name__ == '__main__':
    app = create_app()

    def open_browser():
        webbrowser.open('http://127.0.0.1:5000')

    if os.environ.get('WERKZEUG_RUN_MAIN') in (None, 'true'):
        threading.Timer(1.0, open_browser).start()

    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
