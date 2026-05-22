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
        document.getElementById('sales-today').textContent = utils.formatMoney(stats.sales_today);
        document.getElementById('total-items').textContent = stats.total_items || 0;
        document.getElementById('inventory-cost').textContent = utils.formatMoney(stats.total_inventory_cost);
        document.getElementById('profitability').textContent = stats.profitability + '%';
        
        // Resumen financiero
        document.getElementById('total-sales').textContent = utils.formatMoney(stats.total_sales);
        document.getElementById('total-costs').textContent = utils.formatMoney(stats.total_costs);
        document.getElementById('total-expenses').textContent = utils.formatMoney(stats.total_expenses);
        document.getElementById('profit').textContent = utils.formatMoney(stats.profit);
        
        // Cambiar color de rentabilidad según valor
        const profitabilityEl = document.getElementById('profitability');
        if (stats.profitability >= 20) {
            profitabilityEl.classList.add('text-success');
        } else if (stats.profitability >= 10) {
            profitabilityEl.classList.add('text-warning');
        } else {
            profitabilityEl.classList.add('text-danger');
        }
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
                                    return utils.formatMoney(value);
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
