/**
 * main.js - Funciones globales y utilidades
 */

// Configuración API
const API_BASE = '/api';

// Utilidades
const utils = {
    /**
     * Formatea dinero con colores o texto plano según el tipo
     * type: 'gain' (verde), 'loss' (rojo), 'neutral' (negro), 'auto' (según valor)
     * asHtml: si es true devuelve span con color, si es false devuelve solo texto
     */
    formatMoney: function(amount, type = 'neutral', asHtml = true) {
        const formatted = new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount || 0);

        if (!asHtml) return formatted;

        let colorClass = 'text-dark';
        if (type === 'gain') colorClass = 'text-success';
        if (type === 'loss') colorClass = 'text-danger';
        if (type === 'auto') {
            if (amount > 0) colorClass = 'text-success';
            else if (amount < 0) colorClass = 'text-danger';
        }

        return `<span class="${colorClass} fw-bold">${formatted}</span>`;
    },

    /**
     * Formatea fecha
     */
    formatDate: function(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    /**
     * Formatea hora
     */
    formatTime: function(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Formatea fecha y hora
     */
    formatDateTime: function(date) {
        return this.formatDate(date) + ' ' + this.formatTime(date);
    },

    /**
     * Muestra notificación
     */
    showNotification: function(message, type = 'success') {
        // 1. Asegurar que exista el contenedor de notificaciones en el DOM
        let container = document.getElementById('toast-container-global');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container-global';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '1080'; 
            document.body.appendChild(container);
        }

        // 2. Mapeo de estilos y colores
        const bgClass = type === 'error' || type === 'danger' ? 'bg-danger' : 
                        type === 'warning' ? 'bg-warning text-dark' : 
                        'bg-success';
        const textClass = type === 'warning' ? '' : 'text-white';
        const icon = type === 'error' || type === 'danger' ? 'bi-exclamation-octagon' :
                     type === 'warning' ? 'bi-exclamation-triangle' :
                     'bi-check-circle';

        // 3. Crear el HTML del Toast
        const toastId = 'toast-' + Date.now();
        const btnCloseClass = type === 'warning' ? '' : 'btn-close-white';
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center ${bgClass} ${textClass} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center">
                        <i class="bi ${icon} fs-5 me-2"></i>
                        <span>${message}</span>
                    </div>
                    <button type="button" class="btn-close ${btnCloseClass} me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
                </div>
            </div>
        `;

        // 4. Insertar y disparar con la API de Bootstrap 5
        container.insertAdjacentHTML('beforeend', toastHtml);
        const toastElement = document.getElementById(toastId);
        const bsToast = new bootstrap.Toast(toastElement, { delay: 4000 });
        bsToast.show();

        // 5. Limpieza del DOM al terminar la animación
        toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
    },

    /**
     * Calcula porcentaje
     */
    calculatePercentage: function(value, total) {
        if (total === 0) return 0;
        return ((value / total) * 100).toFixed(2);
    },

    /**
     * Obtiene los datos de configuración del negocio
     */
    getBusinessInfo: async function() {
        try {
            return await apiCall.get('/business-info');
        } catch (error) {
            return {
                name: 'Mi Tienda de Ropa',
                cuit: '',
                address: '',
                tax_condition: 'Monotributista'
            };
        }
    },

    /**
     * Guarda los datos de configuración del negocio
     */
    saveBusinessInfo: async function(data) {
        try {
            const response = await apiCall.post('/business-info', data);
            utils.showNotification('Datos del negocio guardados correctamente', 'success');
            return response;
        } catch (error) {
            utils.showNotification('Error al guardar los datos del negocio', 'error');
            throw error;
        }
    }
};

// API Helper
const apiCall = {
    /**
     * GET request
     */
    handleResponse: async function(response) {
        if (response.ok) {
            return response.status === 204 ? null : await response.json();
        }

        let errorMessage = `HTTP ${response.status}`;
        try {
            const body = await response.json();
            errorMessage = body.error || body.message || errorMessage;
        } catch (e) {
            // ignore invalid JSON body
        }

        throw new Error(errorMessage);
    },

    get: async function(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error en GET:', error);
            throw error;
        }
    },

    /**
     * POST request
     */
    post: async function(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error en POST:', error);
            throw error;
        }
    },

    /**
     * PUT request
     */
    put: async function(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error en PUT:', error);
            throw error;
        }
    },

    /**
     * DELETE request
     */
    delete: async function(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'DELETE'
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error en DELETE:', error);
            throw error;
        }
    }
};

// Inicialización del DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Inicializar popovers de Bootstrap
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Inicialización de la configuración del negocio (si existe el formulario)
    const businessForm = document.getElementById('businessInfoForm');
    if (businessForm) {
        setupBusinessInfo();
    }
});

/**
 * Configura y carga el formulario de información del negocio
 */
async function setupBusinessInfo() {
    const info = await utils.getBusinessInfo();
    
    document.getElementById('businessName').value = info.name || '';
    document.getElementById('businessCUIT').value = info.cuit || '';
    document.getElementById('businessAddress').value = info.address || '';
    document.getElementById('taxCondition').value = info.tax_condition || 'Monotributista';

    document.getElementById('businessInfoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await utils.saveBusinessInfo({
            name: document.getElementById('businessName').value,
            cuit: document.getElementById('businessCUIT').value,
            address: document.getElementById('businessAddress').value,
            tax_condition: document.getElementById('taxCondition').value
        });
    });
}
