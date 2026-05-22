/**
 * sales.js - Lógica de Ventas
 */

document.addEventListener('DOMContentLoaded', function() {
    loadVendors();
    loadProducts();
    loadSales();
    setupFormListeners();
});

/**
 * Carga lista de vendedores
 */
async function loadVendors() {
    try {
        const vendors = await apiCall.get('/vendors');
        const select = document.getElementById('vendorSelect');
        
        select.innerHTML = '<option value="">Selecciona vendedor...</option>';
        vendors.forEach(vendor => {
            const option = document.createElement('option');
            option.value = vendor.id;
            option.textContent = `${vendor.code} - ${vendor.name}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar vendedores:', error);
    }
}

/**
 * Carga lista de productos
 */
async function loadProducts() {
    try {
        const products = await apiCall.get('/products');
        const select = document.getElementById('productSelect');
        
        select.innerHTML = '<option value="">Selecciona producto...</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.code} - ${product.name}`;
            if (product.size) option.textContent += ` (${product.size})`;
            if (product.color) option.textContent += ` - ${product.color}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

/**
 * Carga ventas del día
 */
async function loadSales() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const from = today + 'T00:00:00';
        const to = today + 'T23:59:59';
        
        const sales = await apiCall.get(`/sales?from=${from}&to=${to}`);
        const tbody = document.querySelector('#salesTable tbody');
        let total = 0;

        tbody.innerHTML = '';
        
        if (sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay ventas registradas</td></tr>';
            document.getElementById('dayTotal').textContent = '$0.00';
            return;
        }

        sales.forEach(sale => {
            total += sale.total;
            const row = `
                <tr>
                    <td>${sale.vendor.name}</td>
                    <td>${sale.product.name}</td>
                    <td>${sale.quantity}</td>
                    <td>${utils.formatMoney(sale.price)}</td>
                    <td><strong>${utils.formatMoney(sale.total)}</strong></td>
                    <td>${utils.formatTime(sale.date)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteSale(${sale.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        document.getElementById('dayTotal').textContent = utils.formatMoney(total);
    } catch (error) {
        console.error('Error al cargar ventas:', error);
    }
}

/**
 * Configura listeners del formulario
 */
function setupFormListeners() {
    const quantityInput = document.getElementById('quantityInput');
    const priceInput = document.getElementById('priceInput');
    
    [quantityInput, priceInput].forEach(input => {
        input.addEventListener('input', calculateTotal);
    });

    document.getElementById('saleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSale();
    });
}

/**
 * Calcula total de venta
 */
function calculateTotal() {
    const quantity = parseFloat(document.getElementById('quantityInput').value) || 0;
    const price = parseFloat(document.getElementById('priceInput').value) || 0;
    const total = quantity * price;
    
    document.getElementById('subtotal').textContent = utils.formatMoney(quantity * price);
    document.getElementById('totalPrice').textContent = utils.formatMoney(total);
}

/**
 * Guarda la venta
 */
async function saveSale() {
    try {
        const vendorId = document.getElementById('vendorSelect').value;
        const productId = document.getElementById('productSelect').value;
        const quantity = parseInt(document.getElementById('quantityInput').value);
        const price = parseFloat(document.getElementById('priceInput').value);

        if (!vendorId || !productId || quantity <= 0 || price <= 0) {
            utils.showNotification('Por favor completa todos los campos correctamente', 'warning');
            return;
        }

        const data = {
            vendor_id: vendorId,
            product_id: productId,
            quantity: quantity,
            price: price
        };

        await apiCall.post('/sales', data);
        
        utils.showNotification('Venta registrada correctamente', 'success');
        document.getElementById('saleForm').reset();
        loadSales();
        calculateTotal();
    } catch (error) {
        console.error('Error al guardar venta:', error);
        utils.showNotification('Error al registrar la venta', 'error');
    }
}

/**
 * Elimina una venta
 */
async function deleteSale(saleId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta venta?')) return;
    
    try {
        await apiCall.delete(`/sales/${saleId}`);
        utils.showNotification('Venta eliminada', 'success');
        loadSales();
    } catch (error) {
        console.error('Error al eliminar venta:', error);
        utils.showNotification('Error al eliminar la venta', 'error');
    }
}
