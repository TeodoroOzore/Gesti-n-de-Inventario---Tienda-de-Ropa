/**
 * reports.js - Lógica de Reportes
 */

let dailyChart, topVendorsChart;

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    document.getElementById('dateFrom').valueAsDate = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('dateTo').valueAsDate = today;
    
    loadReports();
    setupFilterListener();
});

/**
 * Configura listener del botón de filtro
 */
function setupFilterListener() {
    document.getElementById('filterBtn').addEventListener('click', loadReports);
}

/**
 * Carga reportes según rango de fechas
 */
async function loadReports() {
    try {
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;

        if (!dateFrom || !dateTo) {
            utils.showNotification('Por favor selecciona ambas fechas', 'warning');
            return;
        }

        const fromDate = new Date(dateFrom).toISOString();
        const toDate = new Date(dateTo).toISOString();

        // Cargar estadísticas generales
        const stats = await apiCall.get('/dashboard-stats');
        
        document.getElementById('periodSales').textContent = utils.formatMoney(stats.total_sales);
        document.getElementById('periodCosts').textContent = utils.formatMoney(stats.total_costs);
        document.getElementById('periodExpenses').textContent = utils.formatMoney(stats.total_expenses);
        document.getElementById('periodProfit').textContent = utils.formatMoney(stats.profit);

        // Cargar ventas por vendedor
        const vendorSales = await apiCall.get(`/sales-by-vendor?from=${fromDate}&to=${toDate}`);
        loadTopVendorsChart(vendorSales);

        // Cargar estado de inventario (productos más vendidos simulado)
        loadTopProducts();

    } catch (error) {
        console.error('Error al cargar reportes:', error);
        utils.showNotification('Error al cargar los reportes', 'error');
    }
}

/**
 * Carga gráfico de vendedores top
 */
function loadTopVendorsChart(data) {
    if (data.length === 0) {
        return;
    }

    const vendorNames = data.map(v => v.vendor);
    const salesData = data.map(v => v.total);

    const ctx = document.getElementById('topVendorsChart');
    if (ctx && window.Chart) {
        if (topVendorsChart) topVendorsChart.destroy();
        
        topVendorsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: vendorNames,
                datasets: [{
                    data: salesData,
                    backgroundColor: [
                        '#007bff',
                        '#28a745',
                        '#ffc107',
                        '#dc3545',
                        '#17a2b8'
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

/**
 * Carga tabla de productos más vendidos
 */
async function loadTopProducts() {
    try {
        const sales = await apiCall.get('/sales');
        
        // Agrupar y sumar ventas por producto
        const productSales = {};
        
        sales.forEach(sale => {
            const productId = sale.product.id;
            if (!productSales[productId]) {
                productSales[productId] = {
                    product: sale.product,
                    quantity: 0,
                    revenue: 0,
                    cost: 0
                };
            }
            productSales[productId].quantity += sale.quantity;
            productSales[productId].revenue += sale.total;
            productSales[productId].cost += sale.quantity * 0; // Simplificado
        });

        const sortedProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        const tbody = document.querySelector('#topProductsTable tbody');
        tbody.innerHTML = '';

        if (sortedProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay datos</td></tr>';
            return;
        }

        sortedProducts.forEach(item => {
            const profit = item.revenue - item.cost;
            const margin = item.revenue > 0 ? ((profit / item.revenue) * 100).toFixed(2) : 0;
            
            const row = `
                <tr>
                    <td><strong>${item.product.name}</strong></td>
                    <td>${item.quantity}</td>
                    <td>${utils.formatMoney(item.revenue)}</td>
                    <td>${utils.formatMoney(item.cost)}</td>
                    <td><strong>${utils.formatMoney(profit)}</strong></td>
                    <td><span class="badge bg-success">${margin}%</span></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error('Error al cargar productos más vendidos:', error);
    }
}
