/**
 * income.js - Lógica de Ingresos de Mercadería
 */

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadIncomes();
    setupFormListeners();
});

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
 * Carga registro de ingresos
 */
async function loadIncomes() {
    try {
        const incomes = await apiCall.get('/income');
        const tbody = document.querySelector('#incomeTable tbody');
        let totalInvested = 0;

        tbody.innerHTML = '';
        
        if (incomes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay ingresos registrados</td></tr>';
            document.getElementById('totalInvested').textContent = '$0.00';
            return;
        }

        incomes.forEach(income => {
            totalInvested += income.total_cost;
            const row = `
                <tr>
                    <td>${utils.formatDate(income.date)}</td>
                    <td>${income.product.name}</td>
                    <td>${income.quantity}</td>
                    <td>${utils.formatMoney(income.cost)}</td>
                    <td><strong>${utils.formatMoney(income.total_cost)}</strong></td>
                    <td>${income.provider || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteIncome(${income.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        document.getElementById('totalInvested').textContent = utils.formatMoney(totalInvested);
    } catch (error) {
        console.error('Error al cargar ingresos:', error);
    }
}

/**
 * Configura listeners del formulario
 */
function setupFormListeners() {
    const quantityInput = document.getElementById('quantityInput');
    const costInput = document.getElementById('costInput');
    
    [quantityInput, costInput].forEach(input => {
        input.addEventListener('input', calculateTotalCost);
    });

    document.getElementById('incomeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveIncome();
    });
}

/**
 * Calcula costo total
 */
function calculateTotalCost() {
    const quantity = parseFloat(document.getElementById('quantityInput').value) || 0;
    const cost = parseFloat(document.getElementById('costInput').value) || 0;
    const total = quantity * cost;
    
    document.getElementById('totalCost').textContent = utils.formatMoney(total);
}

/**
 * Guarda el ingreso
 */
async function saveIncome() {
    try {
        const productId = document.getElementById('productSelect').value;
        const quantity = parseInt(document.getElementById('quantityInput').value);
        const cost = parseFloat(document.getElementById('costInput').value);
        const provider = document.getElementById('providerInput').value;
        const notes = document.getElementById('notesInput').value;

        if (!productId || quantity <= 0 || cost <= 0) {
            utils.showNotification('Por favor completa los campos obligatorios correctamente', 'warning');
            return;
        }

        const data = {
            product_id: productId,
            quantity: quantity,
            cost: cost,
            provider: provider || null,
            notes: notes || null
        };

        await apiCall.post('/income', data);
        
        utils.showNotification('Ingreso registrado correctamente', 'success');
        document.getElementById('incomeForm').reset();
        loadIncomes();
        calculateTotalCost();
    } catch (error) {
        console.error('Error al guardar ingreso:', error);
        utils.showNotification('Error al registrar el ingreso', 'error');
    }
}

/**
 * Elimina un ingreso
 */
async function deleteIncome(incomeId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este ingreso?')) return;
    
    try {
        await apiCall.delete(`/income/${incomeId}`);
        utils.showNotification('Ingreso eliminado', 'success');
        loadIncomes();
    } catch (error) {
        console.error('Error al eliminar ingreso:', error);
        utils.showNotification('Error al eliminar el ingreso', 'error');
    }
}
