/**
 * settings.js - Lógica de Configuración
 */

let productsCache = [];

document.addEventListener('DOMContentLoaded', function() {
    loadVendors();
    loadProducts();
    setupFormListeners();
});

/**
 * Carga lista de vendedores
 */
async function loadVendors() {
    try {
        const vendors = await apiCall.get('/vendors');
        const vendorsList = document.getElementById('vendorsList');
        
        if (vendors.length === 0) {
            vendorsList.innerHTML = '<p class="text-muted text-center">No hay vendedores registrados</p>';
            return;
        }

        let html = '';
        vendors.forEach(vendor => {
            html += `
                <div class="list-item-action">
                    <div>
                        <strong>${vendor.code}</strong> - ${vendor.name}
                    </div>
                    <div>
                        <button class="btn btn-sm btn-warning" onclick="editVendor(${vendor.id}, '${vendor.code}', '${vendor.name}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteVendor(${vendor.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        vendorsList.innerHTML = html;
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
        productsCache = products;
        const tbody = document.querySelector('#productsTable tbody');
        
        tbody.innerHTML = '';
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay productos registrados</td></tr>';
            return;
        }

        products.forEach(product => {
            const row = `
                <tr>
                    <td><strong>${product.code}</strong></td>
                    <td>${product.name}</td>
                    <td>${product.category || '-'}</td>
                    <td>${product.size || '-'}</td>
                    <td>${product.color || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editProduct(${product.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

/**
 * Configura listeners de formularios
 */
function setupFormListeners() {
    document.getElementById('vendorForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveVendor();
    });

    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProduct();
    });
}

/**
 * Guarda un nuevo vendedor
 */
async function saveVendor() {
    try {
        const code = document.getElementById('vendorCode').value;
        const name = document.getElementById('vendorName').value;

        if (!code || !name) {
            utils.showNotification('Por favor completa todos los campos', 'warning');
            return;
        }

        const data = { code, name };
        await apiCall.post('/vendors', data);

        utils.showNotification('Vendedor creado correctamente', 'success');
        document.getElementById('vendorForm').reset();
        loadVendors();
    } catch (error) {
        console.error('Error al guardar vendedor:', error);
        utils.showNotification('Error al crear el vendedor', 'error');
    }
}

/**
 * Edita un vendedor
 */
async function editVendor(id, code, name) {
    const newCode = prompt('Nuevo código:', code);
    if (newCode === null) return;
    
    const newName = prompt('Nuevo nombre:', name);
    if (newName === null) return;

    try {
        const data = { code: newCode, name: newName };
        await apiCall.put(`/vendors/${id}`, data);

        utils.showNotification('Vendedor actualizado', 'success');
        loadVendors();
    } catch (error) {
        console.error('Error al editar vendedor:', error);
        utils.showNotification('Error al actualizar el vendedor', 'error');
    }
}

/**
 * Elimina un vendedor
 */
async function deleteVendor(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este vendedor?')) return;

    try {
        await apiCall.delete(`/vendors/${id}`);
        utils.showNotification('Vendedor eliminado', 'success');
        loadVendors();
    } catch (error) {
        console.error('Error al eliminar vendedor:', error);
        utils.showNotification('Error al eliminar el vendedor', 'error');
    }
}

/**
 * Guarda un nuevo producto
 */
async function saveProduct() {
    try {
        const code = document.getElementById('productCode').value.trim();
        const name = document.getElementById('productName').value.trim();
        const category = document.getElementById('productCategory').value.trim();
        const size = document.getElementById('productSize').value;
        const color = document.getElementById('productColor').value.trim();

        if (!code || !name) {
            utils.showNotification('Por favor completa los campos obligatorios', 'warning');
            return;
        }

        const products = await apiCall.get('/products');
        const normalizedCode = code.toLowerCase();
        const normalizedName = name.toLowerCase();
        const normalizedCategory = category.toLowerCase();
        const normalizedSize = size ? size.toLowerCase() : '';
        const normalizedColor = color.toLowerCase();

        if (products.some(product => product.code.toLowerCase() === normalizedCode)) {
            utils.showNotification('El código ya está en uso por otro producto.', 'warning');
            return;
        }

        const duplicateProduct = products.find(product =>
            product.name.toLowerCase() === normalizedName &&
            (product.category || '').toLowerCase() === normalizedCategory &&
            (product.size || '').toLowerCase() === normalizedSize &&
            (product.color || '').toLowerCase() === normalizedColor
        );

        if (duplicateProduct) {
            utils.showNotification('Ya existe un producto con el mismo nombre, talle, color y categoría.', 'warning');
            return;
        }

        const data = {
            code,
            name,
            category: category || null,
            size: size || null,
            color: color || null
        };

        await apiCall.post('/products', data);

        utils.showNotification('Producto creado correctamente', 'success');
        document.getElementById('productForm').reset();
        loadProducts();
    } catch (error) {
        console.error('Error al guardar producto:', error);
        utils.showNotification(error.message || 'Error al crear el producto', 'error');
    }
}

/**
 * Edita un producto
 */
async function editProduct(id) {
    const product = productsCache.find(p => p.id === id);
    if (!product) {
        utils.showNotification('No se encontró el producto para editar.', 'error');
        return;
    }

    const newCode = prompt('Nuevo código de producto:', product.code);
    if (newCode === null) return;

    const newName = prompt('Nuevo nombre:', product.name);
    if (newName === null) return;

    const newCategory = prompt('Nueva categoría:', product.category || '');
    if (newCategory === null) return;

    const newSize = prompt('Nuevo talle:', product.size || '');
    if (newSize === null) return;

    const newColor = prompt('Nuevo color:', product.color || '');
    if (newColor === null) return;

    if (!newCode.trim() || !newName.trim()) {
        utils.showNotification('El código y el nombre son obligatorios.', 'warning');
        return;
    }

    const normalizedCode = newCode.trim().toLowerCase();
    const normalizedName = newName.trim().toLowerCase();
    const normalizedCategory = newCategory.trim().toLowerCase();
    const normalizedSize = newSize.trim().toLowerCase();
    const normalizedColor = newColor.trim().toLowerCase();

    const otherProducts = productsCache.filter(p => p.id !== id);

    if (otherProducts.some(product => product.code.toLowerCase() === normalizedCode)) {
        utils.showNotification('El código ya está en uso por otro producto.', 'warning');
        return;
    }

    const duplicateProduct = otherProducts.find(product =>
        product.name.toLowerCase() === normalizedName &&
        (product.category || '').toLowerCase() === normalizedCategory &&
        (product.size || '').toLowerCase() === normalizedSize &&
        (product.color || '').toLowerCase() === normalizedColor
    );

    if (duplicateProduct) {
        utils.showNotification('Ya existe otro producto con el mismo nombre, talle, color y categoría.', 'warning');
        return;
    }

    try {
        const data = {
            code: newCode.trim(),
            name: newName.trim(),
            category: newCategory.trim() || null,
            size: newSize.trim() || null,
            color: newColor.trim() || null
        };

        await apiCall.put(`/products/${id}`, data);
        utils.showNotification('Producto actualizado correctamente', 'success');
        loadProducts();
    } catch (error) {
        console.error('Error al editar producto:', error);
        utils.showNotification(error.message || 'Error al actualizar el producto', 'error');
    }
}

/**
 * Elimina un producto
 */
async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
        await apiCall.delete(`/products/${id}`);
        utils.showNotification('Producto eliminado', 'success');
        loadProducts();
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        utils.showNotification('Error al eliminar el producto', 'error');
    }
}
