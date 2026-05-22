/**
 * inventory.js - Lógica de Gestión de Inventario
 */

document.addEventListener('DOMContentLoaded', function() {
    loadInventory();
    loadProductsForModal();
    setupFormListeners();
});

/**
 * Carga inventario
 */
async function loadInventory() {
    try {
        const inventory = await apiCall.get('/inventory');
        const tbody = document.querySelector('#inventoryTable tbody');

        tbody.innerHTML = '';
        
        if (inventory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay productos en inventario</td></tr>';
            return;
        }

        inventory.forEach(item => {
            const product = item.product;
            const row = `
                <tr>
                    <td><strong>${product.code}</strong></td>
                    <td>${product.name}</td>
                    <td>${product.category || '-'}</td>
                    <td>${product.size || '-'}</td>
                    <td>${product.color || '-'}</td>
                    <td>
                        <span class="badge ${item.quantity > 10 ? 'bg-success' : item.quantity > 0 ? 'bg-warning' : 'bg-danger'}">
                            ${item.quantity}
                        </span>
                    </td>
                    <td>${utils.formatMoney(item.cost)}</td>
                    <td><strong>${utils.formatMoney(item.total_value)}</strong></td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editInventory(${product.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error al cargar inventario:', error);
    }
}

/**
 * Carga productos para el modal
 */
async function loadProductsForModal() {
    try {
        const products = await apiCall.get('/products');
        const select = document.getElementById('productSelect');
        
        select.innerHTML = '<option value="">Selecciona un producto...</option>';
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
 * Configura listeners del formulario
 */
function setupFormListeners() {
    document.getElementById('editInventoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveInventory();
    });

    document.getElementById('saveInventoryBtn').addEventListener('click', async () => {
        await saveInventory();
    });
}

/**
 * Edita inventario de un producto
 */
function editInventory(productId) {
    document.getElementById('productSelect').value = productId;
    const modal = new bootstrap.Modal(document.getElementById('editInventoryModal'));
    modal.show();
}

/**
 * Guarda cambios en inventario
 */
async function saveInventory() {
    try {
        const productId = document.getElementById('productSelect').value;
        const quantity = parseInt(document.getElementById('quantityInput').value);
        const cost = parseFloat(document.getElementById('costInput').value);

        if (!productId || quantity < 0 || cost < 0) {
            utils.showNotification('Por favor completa todos los campos correctamente', 'warning');
            return;
        }

        const data = {
            quantity: quantity,
            cost: cost
        };

        await apiCall.put(`/inventory/${productId}`, data);
        
        utils.showNotification('Inventario actualizado correctamente', 'success');
        document.getElementById('editInventoryForm').reset();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editInventoryModal'));
        if (modal) modal.hide();
        
        loadInventory();
    } catch (error) {
        console.error('Error al guardar inventario:', error);
        utils.showNotification('Error al actualizar el inventario', 'error');
    }
}
