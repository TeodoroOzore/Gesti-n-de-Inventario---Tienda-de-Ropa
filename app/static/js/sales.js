/**
 * sales.js - Lógica de Ventas con Carrito de Compras
 */

let cart = [];
let products = [];

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
        products = await apiCall.get('/products');
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
        
        if (!Array.isArray(sales) || sales.length === 0) {
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
    document.getElementById('productSelect').addEventListener('change', loadProductPrice);
    document.getElementById('quantityInput').addEventListener('input', calculateLineTotal);
    document.getElementById('addToCartBtn').addEventListener('click', addToCart);
    
    document.getElementById('saleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSale();
    });
}

/**
 * Carga el precio del producto seleccionado desde el inventario
 */
async function loadProductPrice() {
    const productId = document.getElementById('productSelect').value;
    const priceDisplay = document.getElementById('priceDisplay');
    
    if (!productId) {
        priceDisplay.value = '';
        document.getElementById('quantityInput').value = '1';
        return;
    }

    try {
        const inventory = await apiCall.get('/inventory');
        const inventoryItem = inventory.find(item => item.product.id == productId);
        
        if (inventoryItem) {
            const salePrice = inventoryItem.price || inventoryItem.cost;
            priceDisplay.value = utils.formatMoney(salePrice);
            document.getElementById('priceValue').value = salePrice;
        } else {
            priceDisplay.value = '$0.00';
            document.getElementById('priceValue').value = '0';
        }
        document.getElementById('quantityInput').value = '1';
        calculateLineTotal();
    } catch (error) {
        console.error('Error al cargar precio:', error);
        priceDisplay.value = '$0.00';
        document.getElementById('priceValue').value = '0';
    }
}

/**
 * Calcula el total de la línea
 */
function calculateLineTotal() {
    const quantity = parseInt(document.getElementById('quantityInput').value) || 1;
    const price = parseFloat(document.getElementById('priceValue').value) || 0;
    const total = quantity * price;
    
    document.getElementById('subtotal').textContent = utils.formatMoney(total);
    document.getElementById('totalPrice').textContent = utils.formatMoney(total);
}

/**
 * Agrega un producto al carrito
 */
function addToCart() {
    const productId = parseInt(document.getElementById('productSelect').value);
    const quantity = parseInt(document.getElementById('quantityInput').value);
    const price = parseFloat(document.getElementById('priceValue').value) || 0;

    if (!productId || quantity <= 0 || price <= 0) {
        utils.showNotification('Selecciona un producto con precio válido y cantidad mayor a 0', 'warning');
        return;
    }

    const existingItem = cart.find(item => item.product_id === productId);
    const product = products.find(p => p.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
        utils.showNotification(`Cantidad actualizada para ${product.name}`, 'info');
    } else {
        cart.push({
            product_id: productId,
            product_name: product.name,
            product_code: product.code,
            quantity: quantity,
            price: price
        });
        utils.showNotification(`${product.name} agregado al carrito`, 'success');
    }

    document.getElementById('productSelect').value = '';
    document.getElementById('quantityInput').value = '1';
    document.getElementById('priceDisplay').value = '';

    updateCartDisplay();
}

/**
 * Actualiza la visualización del carrito
 */
function updateCartDisplay() {
    const cartContainer = document.getElementById('cartContainer');
    const registerBtn = document.getElementById('registerSaleBtn');

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="text-muted text-center py-3">El carrito está vacío</p>';
        registerBtn.disabled = true;
        document.getElementById('subtotal').textContent = '$0.00';
        document.getElementById('totalPrice').textContent = '$0.00';
        return;
    }

    registerBtn.disabled = false;
    let cartHTML = '';
    let cartTotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.quantity * item.price;
        cartTotal += itemTotal;
        
        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div>
                        <strong>${item.product_code} - ${item.product_name}</strong>
                        <br>
                        <small class="text-muted">${item.quantity} x ${utils.formatMoney(item.price)}</small>
                    </div>
                    <div class="text-right">
                        <div class="cart-item-price">${utils.formatMoney(itemTotal)}</div>
                        <button type="button" class="btn btn-sm btn-outline-danger mt-2" onclick="removeFromCart(${index})">
                            <i class="bi bi-trash"></i> Quitar
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    cartContainer.innerHTML = cartHTML;
    document.getElementById('subtotal').textContent = utils.formatMoney(cartTotal);
    document.getElementById('totalPrice').textContent = utils.formatMoney(cartTotal);
}

/**
 * Elimina un producto del carrito
 */
function removeFromCart(index) {
    const item = cart[index];
    cart.splice(index, 1);
    utils.showNotification(`${item.product_name} removido del carrito`, 'info');
    updateCartDisplay();
}

/**
 * Guarda todas las ventas del carrito
 */
async function saveSale() {
    try {
        const vendorId = document.getElementById('vendorSelect').value;

        if (!vendorId) {
            utils.showNotification('Por favor selecciona un vendedor', 'warning');
            return;
        }

        if (cart.length === 0) {
            utils.showNotification('El carrito está vacío', 'warning');
            return;
        }

        for (const item of cart) {
            const saleData = {
                vendor_id: vendorId,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            };

            await apiCall.post('/sales', saleData);
        }

        utils.showNotification('Venta registrada correctamente', 'success');
        
        cart = [];
        document.getElementById('saleForm').reset();
        document.getElementById('priceValue').value = '0';
        document.getElementById('vendorSelect').focus();
        updateCartDisplay();
        loadSales();
    } catch (error) {
        console.error('Error al registrar venta:', error);
        utils.showNotification(error.message || 'Error al registrar la venta', 'error');
    }
}

/**
 * Elimina una venta
 */
async function deleteSale(saleId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta venta?')) return;

    try {
        await apiCall.delete(`/sales/${saleId}`);
        utils.showNotification('Venta eliminada correctamente', 'success');
        loadSales();
    } catch (error) {
        console.error('Error al eliminar venta:', error);
        utils.showNotification('Error al eliminar la venta', 'error');
    }
}
