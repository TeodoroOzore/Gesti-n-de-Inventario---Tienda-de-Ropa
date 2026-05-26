/**
 * dashboard.js - Lógica del Dashboard
 */

let vendorChart, dailyChart;

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadVendorSales();
});

/**
 * Carga estadísticas del dashboard
 */
async function loadDashboardStats() {
    try {
        const stats = await apiCall.get('/dashboard-stats');
        
        // Actualizar elementos del dashboard
        // Limpiar fondos de tarjetas y forzar texto oscuro para asegurar visibilidad de colores rojo/verde
        ['sales-today', 'inventory-cost', 'profitability', 'profit', 'total-sales', 'total-costs', 'total-expenses', 'total-items'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.closest('.card')) {
                const card = el.closest('.card');
                // Removemos cualquier clase de fondo o texto blanco de Bootstrap
                card.classList.remove('bg-success', 'bg-danger', 'bg-primary', 'bg-info', 'bg-warning', 'bg-dark', 'text-white');
                card.classList.add('bg-white', 'text-dark', 'shadow-sm', 'border-0');
                
                // También limpiamos clases en etiquetas secundarias (títulos) dentro de la tarjeta
                card.querySelectorAll('.card-title, .text-white-50, h6').forEach(label => {
                    label.classList.remove('text-white', 'text-white-50');
                    label.classList.add('text-muted');
                });
            }
        });

        document.getElementById('sales-today').innerHTML = utils.formatMoney(stats.sales_today, 'gain');
        document.getElementById('total-items').textContent = stats.total_items || 0;
        document.getElementById('inventory-cost').innerHTML = utils.formatMoney(stats.total_inventory_cost, 'loss');
        document.getElementById('profitability').innerHTML = `<span class="${stats.profitability >= 0 ? 'text-success' : 'text-danger'}">${stats.profitability}%</span>`;
        
        // Resumen financiero
        document.getElementById('total-sales').innerHTML = utils.formatMoney(stats.total_sales, 'neutral');
        document.getElementById('total-costs').innerHTML = utils.formatMoney(stats.total_costs, 'neutral');
        document.getElementById('total-expenses').innerHTML = utils.formatMoney(stats.total_expenses, 'neutral');
        document.getElementById('profit').innerHTML = utils.formatMoney(stats.profit, 'auto');
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        utils.showNotification('Error al cargar estadísticas', 'error');
    }
}

/**
 * Carga ventas por vendedor
 */
async function loadVendorSales() {
    try {
        const salesByVendor = await apiCall.get('/sales-by-vendor');
        
        if (salesByVendor.length === 0) {
            return;
        }

        const vendorNames = salesByVendor.map(s => s.vendor);
        const salesData = salesByVendor.map(s => s.total);

        const ctx = document.getElementById('vendorChart');
        if (ctx && window.Chart) {
            if (vendorChart) vendorChart.destroy();
            
            vendorChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: vendorNames,
                    datasets: [{
                        label: 'Ventas por Vendedor',
                        data: salesData,
                        backgroundColor: 'rgba(0, 123, 255, 0.7)',
                        borderColor: 'rgba(0, 123, 255, 1)',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return utils.formatMoney(value, 'neutral', false);
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar ventas por vendedor:', error);
    }
}
