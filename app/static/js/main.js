/**
 * main.js - Funciones globales y utilidades
 */

// Configuración API
const API_BASE = '/api';

// Utilidades
const utils = {
    /**
     * Formatea dinero
     */
    formatMoney: function(amount) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount || 0);
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
        const alertClass = type === 'error' ? 'danger' : type;
        const alertHtml = `
            <div class="alert alert-${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.querySelector('main');
        if (container) {
            const alert = document.createElement('div');
            alert.innerHTML = alertHtml;
            container.insertBefore(alert.firstElementChild, container.firstElementChild);
        }
    },

    /**
     * Calcula porcentaje
     */
    calculatePercentage: function(value, total) {
        if (total === 0) return 0;
        return ((value / total) * 100).toFixed(2);
    }
};

// API Helper
const apiCall = {
    /**
     * GET request
     */
    get: async function(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
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
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
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
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
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
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.status === 204 ? null : await response.json();
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
});
