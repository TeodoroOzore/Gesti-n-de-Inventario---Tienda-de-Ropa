/**
 * sales.js - Lógica de Ventas con Carrito de Compras
 */

let cart = [];
let products = [];
let inventory = [];

document.addEventListener('DOMContentLoaded', function() {
    loadVendors();
    loadProducts();
    loadInventory();
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
        renderProductOptions();
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

/**
 * Carga inventario disponible
 */
async function loadInventory() {
    try {
        inventory = await apiCall.get('/inventory');
        // Refrescar el selector de productos una vez que el inventario esté disponible
        if (products && products.length > 0) renderProductOptions();
    } catch (error) {
        console.error('Error al cargar inventario:', error);
        inventory = [];
    }
}

/**
 * Renderiza las opciones de productos en el select
 */
function renderProductOptions(filteredProducts = null) {
    const select = document.getElementById('productSelect');
    const productsToRender = filteredProducts || products;
    
    select.innerHTML = '<option value="">Selecciona producto...</option>';
    
    productsToRender.forEach(product => {
        // Verificar si el producto tiene stock
        const inventoryItem = inventory.find(item => item.product && item.product.id == product.id);
        const hasStock = inventoryItem && inventoryItem.quantity > 0;
        
        const option = document.createElement('option');
        option.value = product.id;
        
        let text = `${product.code} - ${product.name}`;
        if (product.size) text += ` (${product.size})`;
        if (product.color) text += ` - ${product.color}`;
        
        // Agregar indicador de disponibilidad
        if (!hasStock) {
            text += ' [SIN STOCK]';
            option.style.backgroundColor = '#e9ecef';
            option.style.color = '#999';
            option.className = 'product-option-disabled';
        }
        
        option.textContent = text;
        option.dataset.outOfStock = !hasStock;
        select.appendChild(option);
    });
}

/**
 * Carga historial completo de ventas
 */
async function loadSales() {
    try {
        const sales = await apiCall.get(`/sales`);
        const tbody = document.getElementById('salesTable');
        let total = 0;
        let html = '';

        tbody.innerHTML = '';
        
        if (!Array.isArray(sales) || sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay ventas registradas</td></tr>';
            document.getElementById('dayTotal').innerHTML = utils.formatMoney(0, 'gain');
            return;
        }

        sales.forEach(sale => {
            total += sale.total;
            const row = `
                <tr id="saleRow-${sale.id}">
                    <td>${sale.vendor.name}</td>
                    <td>${sale.product.name}</td>
                    <td>${sale.quantity}</td>
                    <td>${utils.formatMoney(sale.price, 'neutral')}</td>
                    <td><strong>${utils.formatMoney(sale.total, 'gain')}</strong></td>
                    <td>${utils.formatTime(sale.date)}</td>
                    <td>
                        <button class="btn btn-sm btn-warning me-2" onclick="editSale(${sale.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteSale(${sale.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            html += row;
        });
        
        tbody.innerHTML = html;
        window.salesData = sales;
        const dayTotalEl = document.getElementById('dayTotal');
        if (dayTotalEl) dayTotalEl.innerHTML = utils.formatMoney(total, 'gain');
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
    document.getElementById('productSearchInput').addEventListener('input', filterProductsByCode);
    document.getElementById('clearSearchBtn').addEventListener('click', clearProductSearch);
    
    document.getElementById('saleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSale();
    });
}

/**
 * Filtra productos por código de búsqueda
 */
function filterProductsByCode() {
    const searchInput = document.getElementById('productSearchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderProductOptions(products);
        return;
    }
    
    const filteredProducts = products.filter(product => 
        product.code.toLowerCase().includes(searchTerm) ||
        product.name.toLowerCase().includes(searchTerm)
    );
    
    renderProductOptions(filteredProducts);
}

/**
 * Limpia la búsqueda de productos
 */
function clearProductSearch() {
    document.getElementById('productSearchInput').value = '';
    renderProductOptions(products);
    document.getElementById('productSelect').focus();
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
        const inventoryItem = inventory.find(item => item.product.id == productId);
        
        if (inventoryItem) {
            const salePrice = inventoryItem.price || inventoryItem.cost;
            priceDisplay.value = utils.formatMoney(salePrice);
            document.getElementById('priceValue').value = salePrice;
            
            // Validar disponibilidad de stock
            if (inventoryItem.quantity <= 0) {
                utils.showNotification('Este producto no tiene stock disponible', 'warning');
            }
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
    const editingSaleId = document.getElementById('editingSaleId').value;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="text-muted text-center py-3">El carrito está vacío</p>';
        
        // En modo edición, habilitar el botón si tenemos datos en el formulario
        if (editingSaleId) {
            const productId = document.getElementById('productSelect').value;
            const vendorId = document.getElementById('vendorSelect').value;
            registerBtn.disabled = !(vendorId && productId);
        } else {
            registerBtn.disabled = true;
        }
        
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
 * Guarda todas las ventas del carrito o edita una venta existente
 */
async function saveSale() {
    try {
        const vendorId = document.getElementById('vendorSelect').value;
        const editingSaleId = document.getElementById('editingSaleId').value;

        if (!vendorId) {
            utils.showNotification('Por favor selecciona un vendedor', 'warning');
            return;
        }

        if (editingSaleId) {
            // Modo edición: actualizar una venta existente
            if (cart.length === 0) {
                const saleData = {
                    vendor_id: vendorId,
                    product_id: document.getElementById('productSelect').value,
                    quantity: parseInt(document.getElementById('quantityInput').value),
                    price: parseFloat(document.getElementById('priceValue').value),
                    payment_method: document.getElementById('paymentMethodSelect')?.value || 'Efectivo'
                };
                
                await apiCall.put(`/sales/${editingSaleId}`, saleData);
                utils.showNotification('Venta actualizada correctamente', 'success');
                cancelSaleEdit();
            } else {
                utils.showNotification('Vacía el carrito antes de actualizar la venta', 'warning');
                return;
            }
        } else {
            // Modo nuevo: crear múltiples ventas del carrito
            if (cart.length === 0) {
                utils.showNotification('El carrito está vacío', 'warning');
                return;
            }

            const paymentMethod = document.getElementById('paymentMethodSelect')?.value || 'Efectivo';

            for (const item of cart) {
                const saleData = {
                    vendor_id: vendorId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    payment_method: paymentMethod
                };

                await apiCall.post('/sales', saleData);
            }
            utils.showNotification('Venta registrada correctamente', 'success');
        }
        
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
 * Edita una venta existente
 */
function editSale(saleId) {
    const salesData = window.salesData || [];
    const sale = salesData.find(s => s.id === saleId);
    
    if (!sale) {
        utils.showNotification('Venta no encontrada', 'error');
        return;
    }
    
    // Cargar datos en el formulario
    document.getElementById('vendorSelect').value = sale.vendor.id;
    document.getElementById('productSelect').value = sale.product.id;
    document.getElementById('quantityInput').value = sale.quantity;
    document.getElementById('priceDisplay').value = utils.formatMoney(sale.price);
    document.getElementById('paymentMethodSelect').value = sale.payment_method || 'Efectivo';
    document.getElementById('priceValue').value = sale.price;
    document.getElementById('editingSaleId').value = saleId;
    
    // Cambiar el botón a "Actualizar"
    const btn = document.getElementById('registerSaleBtn');
    btn.innerHTML = '<i class="bi bi-save"></i> Actualizar Venta';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-info');
    
    // Agregar botón de cancelar
    if (!document.getElementById('cancelSaleEditBtn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.id = 'cancelSaleEditBtn';
        cancelBtn.className = 'btn btn-secondary w-100';
        cancelBtn.innerHTML = '<i class="bi bi-x-circle"></i> Cancelar Edición';
        cancelBtn.addEventListener('click', cancelSaleEdit);
        btn.parentElement.appendChild(cancelBtn);
    }
    
    // Desactivar botón de agregar al carrito
    document.getElementById('addToCartBtn').disabled = true;
    
    // Actualizar estado del botón de guardar
    updateCartDisplay();
    
    utils.showNotification('Modo edición activado', 'info');
}

/**
 * Cancela la edición de una venta
 */
function cancelSaleEdit() {
    document.getElementById('editingSaleId').value = '';
    document.getElementById('saleForm').reset();
    document.getElementById('priceValue').value = '0';
    document.getElementById('addToCartBtn').disabled = false;
    
    const btn = document.getElementById('registerSaleBtn');
    btn.innerHTML = '<i class="bi bi-check-circle"></i> Registrar Venta Completa';
    btn.classList.remove('btn-info');
    btn.classList.add('btn-success');
    
    const cancelBtn = document.getElementById('cancelSaleEditBtn');
    if (cancelBtn) cancelBtn.remove();
    
    updateCartDisplay();
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
