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
        const products = await apiCall.get('/products') || [];
        const select = document.getElementById('productSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Selecciona producto...</option>';

        if (!Array.isArray(products) || products.length === 0) {
            select.innerHTML = '<option value="">No hay productos creados. Ve a Configuración.</option>';
            select.disabled = true;
            // Continue to allow form reset, but product selection will be disabled
        }

        select.disabled = false;
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
        utils.showNotification('Error al cargar productos. Intenta nuevamente.', 'error');
    }
}

/**
 * Carga registro de ingresos
 */
async function loadIncomes() {
    try {
        const incomes = await apiCall.get('/income');
        const tbody = document.getElementById('incomeTable');
        let totalInvested = 0;
        let html = '';

        tbody.innerHTML = '';

        if (!Array.isArray(incomes) || incomes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay ingresos registrados</td></tr>';
            document.getElementById('totalInvested').innerHTML = utils.formatMoney(0, 'loss');
            return;
        }

        window.incomes = incomes;
        incomes.forEach(income => {
            totalInvested += income.total_cost;
            html += `
                <tr id="incomeRow-${income.id}">
                    <td>${utils.formatDate(income.date)}</td>
                    <td>${income.product.name}</td>
                    <td>${income.quantity}</td> <!-- Quantity is a neutral number, not currency -->
                    <td>${utils.formatMoney(income.cost, 'neutral')}</td>
                    <td><strong>${utils.formatMoney(income.total_cost, 'loss')}</strong></td>
                    <td>${income.provider || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-2" onclick="editIncome(${income.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteIncome(${income.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        document.getElementById('totalInvested').innerHTML = utils.formatMoney(totalInvested, 'loss');
    } catch (error) {
        console.error('Error al cargar ingresos:', error);
        utils.showNotification('Error al cargar ingresos. Intenta nuevamente.', 'error');
    }
}

/**
 * Configura listeners del formulario
 */
function setupFormListeners() {
    const quantityInput = document.getElementById('quantityInput');
    const costInput = document.getElementById('costInput');
    const priceInput = document.getElementById('priceInput');

    [quantityInput, costInput, priceInput].forEach(input => {
        if (input) input.addEventListener('input', calculateTotalCost);
    });

    document.getElementById('incomeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveIncome();
    });

    document.getElementById('cancelIncomeEditBtn').addEventListener('click', cancelIncomeEdit);
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
let editingIncomeId = null;

async function saveIncome() {
    try {
        const productValue = document.getElementById('productSelect').value;
        const productId = productValue ? parseInt(productValue, 10) : null;
        const quantity = parseInt(document.getElementById('quantityInput').value, 10);
        const cost = parseFloat(document.getElementById('costInput').value);
        const price = parseFloat(document.getElementById('priceInput').value);
        const provider = document.getElementById('providerInput').value;
        const notes = document.getElementById('notesInput').value;

        if (!productId || quantity <= 0 || cost <= 0 || price <= 0) {
            utils.showNotification('Por favor completa los campos obligatorios correctamente', 'warning');
            return;
        }

        const payload = {
            product_id: productId,
            quantity: quantity,
            cost: cost,
            price: price,
            provider: provider || null,
            notes: notes || null
        };

        if (editingIncomeId) {
            await apiCall.put(`/income/${editingIncomeId}`, payload);
            utils.showNotification('Ingreso actualizado correctamente.', 'success');
        } else {
            await apiCall.post('/income', payload);
            utils.showNotification('Ingreso registrado correctamente. Stock actualizado automáticamente.', 'success');
        }

        resetIncomeForm();
        loadProducts();
        loadIncomes();
        if (typeof loadInventory === 'function') {
            loadInventory();
        }
        calculateTotalCost();
    } catch (error) {
        console.error('Error al guardar ingreso:', error);
        utils.showNotification(error.message || 'Error al registrar el ingreso', 'error');
    }
}

function resetIncomeForm() {
    editingIncomeId = null;
    document.getElementById('incomeForm').reset();
    document.getElementById('incomeIdInput').value = '';
    document.getElementById('submitIncomeBtn').innerHTML = '<i class="bi bi-check-circle"></i> Registrar Ingreso';
    document.getElementById('cancelIncomeEditBtn').classList.add('d-none');
    document.querySelector('.card-header.bg-success h5').textContent = 'Nuevo Ingreso de Stock';
}

function setIncomeEditMode(income) {
    editingIncomeId = income.id;
    document.getElementById('incomeIdInput').value = income.id;
    document.getElementById('productSelect').value = income.product.id;
    document.getElementById('quantityInput').value = income.quantity;
    document.getElementById('costInput').value = income.cost;
    document.getElementById('priceInput').value = income.price;
    document.getElementById('providerInput').value = income.provider || '';
    document.getElementById('notesInput').value = income.notes || '';
    document.getElementById('submitIncomeBtn').innerHTML = '<i class="bi bi-save"></i> Guardar Cambios';
    document.getElementById('cancelIncomeEditBtn').classList.remove('d-none');
    document.querySelector('.card-header.bg-success h5').textContent = 'Editar Ingreso de Stock';
}

function editIncome(incomeId) {
    const incomesData = window.incomes || [];
    const income = incomesData.find(item => item.id === incomeId);
    if (!income) {
        utils.showNotification('No se encontró el ingreso para editar.', 'error');
        return;
    }
    setIncomeEditMode(income);
}

function cancelIncomeEdit() {
    resetIncomeForm();
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
