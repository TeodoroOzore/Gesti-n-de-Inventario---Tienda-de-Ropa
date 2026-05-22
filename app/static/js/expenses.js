/**
 * expenses.js - Lógica de Gestión de Egresos
 */

document.addEventListener('DOMContentLoaded', function() {
    loadExpenses();
    setupFormListeners();
});

/**
 * Carga registro de egresos
 */
async function loadExpenses() {
    try {
        const expenses = await apiCall.get('/expenses');
        const tbody = document.querySelector('#expenseTable tbody');
        let totalExpenses = 0;

        tbody.innerHTML = '';
        
        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay egresos registrados</td></tr>';
            document.getElementById('totalExpenses').textContent = '$0.00';
            return;
        }

        expenses.forEach(expense => {
            totalExpenses += expense.amount;
            const row = `
                <tr>
                    <td>${utils.formatDate(expense.date)}</td>
                    <td>${expense.description}</td>
                    <td><span class="badge bg-secondary">${expense.category}</span></td>
                    <td><strong>${utils.formatMoney(expense.amount)}</strong></td>
                    <td>${expense.notes || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        document.getElementById('totalExpenses').textContent = utils.formatMoney(totalExpenses);
    } catch (error) {
        console.error('Error al cargar egresos:', error);
    }
}

/**
 * Configura listeners del formulario
 */
function setupFormListeners() {
    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveExpense();
    });
}

/**
 * Guarda un nuevo egreso
 */
async function saveExpense() {
    try {
        const description = document.getElementById('descriptionInput').value;
        const category = document.getElementById('categorySelect').value;
        const amount = parseFloat(document.getElementById('amountInput').value);
        const notes = document.getElementById('notesInput').value;

        if (!description || !category || amount <= 0) {
            utils.showNotification('Por favor completa todos los campos obligatorios correctamente', 'warning');
            return;
        }

        const data = {
            description: description,
            category: category,
            amount: amount,
            notes: notes || null
        };

        await apiCall.post('/expenses', data);
        
        utils.showNotification('Egreso registrado correctamente', 'success');
        document.getElementById('expenseForm').reset();
        loadExpenses();
    } catch (error) {
        console.error('Error al guardar egreso:', error);
        utils.showNotification('Error al registrar el egreso', 'error');
    }
}

/**
 * Elimina un egreso
 */
async function deleteExpense(expenseId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este egreso?')) return;
    
    try {
        await apiCall.delete(`/expenses/${expenseId}`);
        utils.showNotification('Egreso eliminado', 'success');
        loadExpenses();
    } catch (error) {
        console.error('Error al eliminar egreso:', error);
        utils.showNotification('Error al eliminar el egreso', 'error');
    }
}
