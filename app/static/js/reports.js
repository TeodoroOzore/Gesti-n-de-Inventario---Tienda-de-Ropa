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
    setupAccountingListeners();
    checkMonotributoStatus();
});

/**
 * Configura listener del botón de filtro
 */
function setupFilterListener() {
    document.getElementById('filterBtn').addEventListener('click', loadReports);
}

/**
 * Configura listeners para reportes contables
 */
function setupAccountingListeners() {
    document.getElementById('downloadArcaReportBtn').addEventListener('click', downloadAccountingPackage);
}

/**
 * Carga reportes según rango de fechas
 */
async function loadReports() {
    try {
        const fromDateInput = document.getElementById('dateFrom').value;
        const toDateInput = document.getElementById('dateTo').value;

        if (!fromDateInput || !toDateInput) {
            utils.showNotification('Por favor selecciona ambas fechas', 'warning');
            return;
        }

        // Agregamos la hora para asegurar que el filtro sea inclusivo (todo el día final)
        const fromDate = fromDateInput;
        const toDate = toDateInput + ' 23:59:59';

        // 1. Cargar estadísticas generales filtradas por el rango de fechas
        const stats = await apiCall.get(`/dashboard-stats?from=${fromDate}&to=${toDate}`);

        // Usamos || 0 para evitar errores si el backend devuelve nulos
        if (document.getElementById('billingTotalSales')) document.getElementById('billingTotalSales').innerHTML = utils.formatMoney(stats.total_sales || 0, 'gain');
        if (document.getElementById('billingTotalCosts')) document.getElementById('billingTotalCosts').innerHTML = utils.formatMoney(stats.total_costs || 0, 'loss');
        if (document.getElementById('billingTotalExpenses')) document.getElementById('billingTotalExpenses').innerHTML = utils.formatMoney(stats.total_expenses || 0, 'loss');
        if (document.getElementById('billingNetProfit')) document.getElementById('billingNetProfit').innerHTML = utils.formatMoney(stats.profit || 0, 'auto');

        // Cargar ventas por vendedor
        const vendorSales = await apiCall.get(`/sales-by-vendor?from=${fromDate}&to=${toDate}`);
        loadTopVendorsChart(vendorSales || []);

        // Cargar estado de inventario (productos más vendidos)
        await loadTopProducts(fromDate, toDate);

        // Cargar gráfico de rendimiento diario (requiere endpoint de backend)
        await loadDailyPerformanceChart(fromDate, toDate);

    } catch (error) {
        console.error('Error al cargar reportes:', error);
        utils.showNotification('Error al cargar los reportes', 'error');
    }
}

/**
 * Carga gráfico de vendedores top
 */
function loadTopVendorsChart(data) {
    const ctx = document.getElementById('topVendorsChart');
    if (!ctx || !window.Chart) return;

    if (!data || data.length === 0) {
        if (topVendorsChart) topVendorsChart.destroy();
        return;
    }

    const vendorNames = data.map(v => v.vendor);
    const salesData = data.map(v => v.total);

    if (ctx) {
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
        // 1. Cargar inventario actual para cruzar datos de costos
        const inventoryData = await apiCall.get('/inventory') || [];
        const inventoryMap = new Map();
        
        inventoryData.forEach(item => {
            if (item.product && item.product.id) inventoryMap.set(item.product.id, item);
        });

        let url = '/sales';
        if (fromDate && toDate) {
            url += `?from=${fromDate}&to=${toDate}`;
        }
        const sales = await apiCall.get(url) || [];
        
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
            
            // Obtener costo unitario histórico o actual
            const invItem = inventoryMap.get(productId);
            const cost = invItem ? invItem.cost : 0;
            productSales[productId].cost += sale.quantity * cost;
        });

        const sortedProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        const tbody = document.getElementById('topProductsTable');
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
 * Descarga el Paquete Contable Completo (Ventas, Compras y Egresos)
 * Ideal para presentación ante contador o control de Monotributo.
 */
async function downloadAccountingPackage() {
    try {
        const fromDateInput = document.getElementById('dateFrom').value;
        const toDateInput = document.getElementById('dateTo').value;

        if (!fromDateInput || !toDateInput) {
            utils.showNotification('Selecciona un rango de fechas para el reporte contable', 'warning');
            return;
        }

        const fromDate = fromDateInput;
        const toDate = toDateInput + ' 23:59:59';

        // Solicitamos al backend el paquete completo (Ventas + Compras + Gastos)
        // El endpoint /reports/accounting-zip debe generar un archivo comprimido
        const url = `${API_BASE}/reports/accounting-package?from=${fromDate}&to=${toDate}`;
        
        utils.showNotification('Generando paquete contable... Por favor espera.', 'info');
        window.open(url, '_blank');
        
        utils.showNotification('Paquete contable generado con éxito.', 'success');

    } catch (error) {
        console.error('Error al descargar reporte contable:', error);
        utils.showNotification('Error al generar los documentos contables', 'error');
    }
}

/**
 * Verifica la facturación de los últimos 12 meses para control de categoría de Monotributo
 */
async function checkMonotributoStatus() {
    try {
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        const from = oneYearAgo.toISOString().split('T')[0];
        const to = today.toISOString().split('T')[0] + ' 23:59:59';

        const stats = await apiCall.get(`/dashboard-stats?from=${from}&to=${to}`);
        const annualBilling = stats.total_sales || 0;

        // Si existe un elemento de alerta en el UI, mostrar el estado
        const alertElement = document.getElementById('monotributoAlert');
        if (alertElement) {
            alertElement.innerHTML = `
                <strong>Facturación Anual Móvil:</strong> ${utils.formatMoney(annualBilling, 'neutral')} 
                <small class="d-block text-muted">Período: ${utils.formatDate(from)} al ${utils.formatDate(today)}</small>
            `;
        }
    } catch (error) {
        console.warn('No se pudo calcular el estado del Monotributo:', error);
    }
}

/**
 * Carga y renderiza un gráfico de rendimiento diario (ventas/ganancias) para el período.
 * NOTA: Este gráfico requiere un endpoint de backend que devuelva datos diarios para un rango de fechas.
 * Por ejemplo: GET /api/daily-performance?from=...&to=...
 * El endpoint debería devolver un array de objetos como:
 * [{ date: "YYYY-MM-DD", sales: 1000, profit: 300 }, ...]
 */
async function loadDailyPerformanceChart(fromDate, toDate) {
    const ctx = document.getElementById('dailyPerformanceChart'); // Asumiendo un canvas HTML con este ID
    if (!ctx || !window.Chart) {
        console.warn('Canvas para gráfico de rendimiento diario no encontrado o Chart.js no cargado.');
        return;
    }

    let dailyPerformanceData = [];
    try {
        // Intentamos obtener los datos del endpoint de facturación diaria
        const response = await apiCall.get(`/daily-billing?from=${fromDate}&to=${toDate}`);
        dailyPerformanceData = response.chart_data || [];

        // Actualizar los campos del resumen detallado si los elementos existen en el DOM
        const summaryMap = {
            'billingTotalSales': { val: response.total_sales, format: true, type: 'gain' },
            'billingTotalCosts': { val: response.total_costs, format: true, type: 'loss' },
            'billingTotalExpenses': { val: response.total_expenses, format: true, type: 'loss' },
            'billingNetProfit': { val: response.net_profit, format: true, type: 'auto' },
            'billingSalesCount': { val: response.sales_count, format: false },
            'billingTopVendor': { val: response.top_vendor, format: false },
            'billingCashPayments': { val: response.payment_stats?.Efectivo, format: false },
            'billingOtherPayments': { val: response.payment_stats?.Otros, format: false }
        };

        Object.keys(summaryMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const item = summaryMap[id];
                el.innerHTML = item.format ? utils.formatMoney(item.val || 0, item.type) : (item.val || 0);
            }
        });

    } catch (e) {
        console.warn('No se pudo cargar el rendimiento diario:', e);
    }

    if (!dailyPerformanceData || dailyPerformanceData.length === 0) {
        // Opcional: Mostrar un mensaje en el canvas si no hay datos
        const context = ctx.getContext('2d');
        context.clearRect(0, 0, ctx.width, ctx.height);
        context.font = '14px Arial';
        context.fillStyle = '#6c757d'; // text-muted color
        context.textAlign = 'center';
        context.fillText('No hay datos diarios para el período seleccionado.', ctx.width / 2, ctx.height / 2);
        if (dailyChart) dailyChart.destroy(); // Destruir chart anterior si existe
        return;
    }

    const dates = dailyPerformanceData.map(d => utils.formatDate(d.date));
    const sales = dailyPerformanceData.map(d => d.sales);
    const profits = dailyPerformanceData.map(d => d.profit);
    const expenses = dailyPerformanceData.map(d => d.expenses || 0);

    if (dailyChart) dailyChart.destroy();

    dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Ventas Diarias',
                    data: sales,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Ganancia Diaria',
                    data: profits,
                    borderColor: 'rgba(40, 167, 69, 1)',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Gastos Diarios',
                    data: expenses,
                    borderColor: 'rgba(220, 53, 69, 1)',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Rendimiento Diario (Ventas y Ganancias)'
                }
            },
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Monto ($)'
                    },
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
