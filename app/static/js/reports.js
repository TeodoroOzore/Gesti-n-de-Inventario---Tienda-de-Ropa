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
    setupDownloadListeners();
});

/**
 * Configura listener del botón de filtro
 */
function setupFilterListener() {
    document.getElementById('filterBtn').addEventListener('click', loadReports);
}

/**
 * Configura listener del botón de descarga de ARCA
 */
function setupDownloadListeners() {
    document.getElementById('downloadArcaReportBtn').addEventListener('click', downloadArcaReport);
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
        
        document.getElementById('periodSales').innerHTML = utils.formatMoney(stats.total_sales, 'gain');
        document.getElementById('periodCosts').innerHTML = utils.formatMoney(stats.total_costs, 'loss');
        document.getElementById('periodExpenses').innerHTML = utils.formatMoney(stats.total_expenses, 'loss');
        document.getElementById('periodProfit').innerHTML = utils.formatMoney(stats.profit, 'auto');

        // Cargar Resumen Diario (Nuevo)
        const dailyData = await apiCall.get('/daily-billing');
        if (document.getElementById('dailySaleCount')) {
            document.getElementById('dailySaleCount').textContent = dailyData.sales_count;
            document.getElementById('topVendorDay').textContent = dailyData.top_vendor;
            document.getElementById('cashSales').textContent = dailyData.payment_stats.Efectivo;
            document.getElementById('otherSales').textContent = dailyData.payment_stats.Otros;
        }

        // Cargar ventas por vendedor
        const vendorSales = await apiCall.get(`/sales-by-vendor?from=${fromDate}&to=${toDate}`);
        loadTopVendorsChart(vendorSales);

        // Cargar estado de inventario (productos más vendidos simulado)
        loadTopProducts(fromDate, toDate);

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
async function loadTopProducts(fromDate = null, toDate = null) {
    try {
        let url = '/sales';
        if (fromDate && toDate) {
            url += `?from=${fromDate}&to=${toDate}`;
        }
        const sales = await apiCall.get(url);
        const currentInventory = await apiCall.get('/inventory'); // Fetch current inventory for costs
        const inventoryMap = new Map(currentInventory.map(item => [item.product.id, item]));
        
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
            
            // Para precisión histórica, el costo debería estar en el registro de venta.
            // Aquí usamos el costo actual del inventario como aproximación.
            const inventoryItem = inventoryMap.get(productId);
            const unitCost = inventoryItem ? inventoryItem.cost : 0;
            productSales[productId].cost += sale.quantity * unitCost;
        });

        const sortedProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        const tbody = document.querySelector('#topProductsTable tbody');
        tbody.innerHTML = '';
        let html = '';

        if (sortedProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay datos</td></tr>';
            return;
        }

        sortedProducts.forEach(item => {
            const profit = item.revenue - item.cost;
            const margin = item.revenue > 0 ? ((profit / item.revenue) * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td><strong>${item.product.name}</strong></td>
                    <td>${item.quantity}</td>
                    <td>${utils.formatMoney(item.revenue, 'gain')}</td>
                    <td>${utils.formatMoney(item.cost, 'loss')}</td>
                    <td><strong>${utils.formatMoney(profit, 'auto')}</strong></td>
                    <td><span class="badge ${margin >= 0 ? 'bg-success' : 'bg-danger'}">${margin}%</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

    } catch (error) {
        console.error('Error al cargar productos más vendidos:', error);
    }
}

/**
 * Descarga el reporte de ventas para ARCA en formato CSV
 */
async function downloadArcaReport() {
    try {
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;

        if (!dateFrom || !dateTo) {
            utils.showNotification('Por favor selecciona ambas fechas para el reporte ARCA', 'warning');
            return;
        }

        const fromDate = new Date(dateFrom).toISOString();
        const toDate = new Date(dateTo).toISOString();

        // La API ya devuelve el CSV directamente, solo necesitamos abrirlo o descargarlo
        const url = `${API_BASE}/reports/arca-sales-csv?from=${fromDate}&to=${toDate}`;
        window.open(url, '_blank'); // Abre en una nueva pestaña para descargar
        
        utils.showNotification('Reporte ARCA generado y descargado.', 'success');

    } catch (error) {
        console.error('Error al descargar reporte ARCA:', error);
        utils.showNotification('Error al descargar el reporte ARCA', 'error');
    }
}
