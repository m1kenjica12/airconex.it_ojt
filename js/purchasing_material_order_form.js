// Professional Material Order Form System

class MaterialOrderForm {
    constructor() {
        this.rowCounter = 1;
        this.materialData = null;
        this.suppliers = null;
        this.init();
    }

    async init() {
        this.updateDateTime();
        this.updateStatus('Loading material data...');
        
        await this.loadMaterialData();
        this.setupEventListeners();
        this.updateStats();
        this.updateStatus('Ready to create material order');
        
        // Set default PO date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('poDate').value = today;
        
        // Populate initial category dropdown
        this.populateInitialCategories();
        
        // Populate suppliers dropdown
        this.populateSuppliers();
    }

    async loadMaterialData() {
        try {
            const response = await fetch('api/purchasing_material_order_form_load_dropdown.php');
            const data = await response.json();
            
            if (data.success) {
                this.materialData = data.data;
                this.suppliers = data.suppliers;
                console.log('Material data loaded from database:', this.materialData);
                console.log('Suppliers loaded from database:', this.suppliers);
                this.showNotification(`Loaded ${data.total_categories} categories and ${data.total_suppliers} suppliers from database`, 'success');
            } else {
                console.error('Failed to load material data:', data.message);
                this.showNotification('Failed to load material data', 'error');
            }
        } catch (error) {
            console.error('Error loading material data:', error);
            this.showNotification('Error loading material data', 'error');
        }
    }

    populateInitialCategories() {
        if (!this.materialData) return;
        
        // Get the first row's category dropdown
        const firstRow = document.querySelector('tr[data-row="1"]');
        if (firstRow) {
            const categorySelect = firstRow.querySelector('.category-select');
            this.populateCategorySelect(categorySelect);
        }
    }

    populateSuppliers() {
        if (!this.suppliers) return;
        
        const supplierSelect = document.getElementById('supplier');
        if (!supplierSelect) return;
        
        // Clear existing options except placeholder
        supplierSelect.innerHTML = '<option value="">Select Supplier</option>';
        
        // Add all suppliers from database
        this.suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier;
            option.textContent = supplier;
            supplierSelect.appendChild(option);
        });
        
        console.log(`Populated supplier dropdown with ${this.suppliers.length} suppliers`);
    }

    populateCategorySelect(selectElement) {
        if (!this.materialData || !selectElement) return;
        
        // Clear existing options except placeholder
        selectElement.innerHTML = '<option value="">Select Category</option>';
        
        // Add all categories from database
        Object.keys(this.materialData).forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            selectElement.appendChild(option);
        });
        
        console.log(`Populated category dropdown with ${Object.keys(this.materialData).length} categories`);
    }

    setupEventListeners() {
        // Form controls
        const poDate = document.getElementById('poDate');
        const supplier = document.getElementById('supplier');
        
        if (poDate) {
            poDate.addEventListener('change', () => this.updateStatus('PO date updated'));
        }
        
        if (supplier) {
            supplier.addEventListener('change', () => this.updateStatus('Supplier information updated'));
        }

        // Quantity input listeners
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('qty-input')) {
                this.updateStats();
            }
        });

        // Unit price input listeners
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('unit-price-input')) {
                this.formatUnitPrice(e.target);
                this.updateStats();
            }
        });

        // Form submit handler
        const form = document.getElementById('materialOrderForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitMaterialOrder();
            });
        }

        // Modal event listeners
        this.setupModalListeners();
    }

    formatUnitPrice(input) {
        // Store cursor position
        const cursorPos = input.selectionStart;
        const prevLength = input.value.length;
        
        // Remove non-numeric characters except decimal point
        let value = input.value.replace(/[^\d.]/g, '');
        
        // Handle multiple decimal points - keep only the first one
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Handle decimal places
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        // Format with commas for thousands
        if (value !== '') {
            const numParts = value.split('.');
            numParts[0] = numParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            value = numParts.join('.');
        }
        
        input.value = value;
        
        // Adjust cursor position
        const newLength = input.value.length;
        const posDiff = newLength - prevLength;
        input.setSelectionRange(cursorPos + posDiff, cursorPos + posDiff);
    }

    setupModalListeners() {
        // Close modal when clicking X
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.style.display = 'none';
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    updateMaterialOptions(selectElement, rowNumber) {
        const row = document.querySelector(`tr[data-row="${rowNumber}"]`);
        if (!row || !this.materialData) return;

        const categorySelect = row.querySelector('.category-select');
        const materialSelect = row.querySelector('.material-select');
        const uomSelect = row.querySelector('.unit-select');

        if (selectElement === categorySelect) {
            const selectedCategory = categorySelect.value;
            
            // Clear material dropdown first
            materialSelect.innerHTML = '<option value="">Select Material</option>';
            materialSelect.disabled = true;
            
            // Clear UOM dropdown
            uomSelect.innerHTML = '<option value="">Select UOM</option>';
            uomSelect.disabled = true;
            
            if (selectedCategory && this.materialData[selectedCategory]) {
                // Load materials for the selected category
                this.loadMaterialsForCategory(selectedCategory, materialSelect);
            }
        } else if (selectElement === materialSelect) {
            // Handle material selection and load UOM
            this.loadUOMForMaterial(materialSelect, uomSelect);
        }

        this.updateStats();
    }

    loadMaterialsForCategory(category, materialSelect) {
        if (!this.materialData[category]) return;
        
        // Sort materials alphabetically for better UX
        const sortedMaterials = this.materialData[category].sort((a, b) => 
            a.description.localeCompare(b.description)
        );
        
        // Populate material dropdown with sorted materials
        sortedMaterials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.description;
            option.textContent = material.description;
            option.setAttribute('data-uom', material.uom);
            option.setAttribute('data-category', category);
            materialSelect.appendChild(option);
        });
        
        materialSelect.disabled = false;
        this.showNotification(`Loaded ${sortedMaterials.length} materials for category "${category}"`, 'info');
    }

    loadUOMForMaterial(materialSelect, uomSelect) {
        const selectedOption = materialSelect.options[materialSelect.selectedIndex];
        const uom = selectedOption.getAttribute('data-uom');
        
        // Clear and set UOM dropdown
        uomSelect.innerHTML = '<option value="">Select UOM</option>';
        
        if (uom) {
            const option = document.createElement('option');
            option.value = uom;
            option.textContent = uom;
            option.selected = true;
            uomSelect.appendChild(option);
            uomSelect.disabled = false;
            
            this.showNotification(`UOM "${uom}" selected for material`, 'info');
        }
    }

    addMaterialRow() {
        this.rowCounter++;
        
        const tbody = document.getElementById('materialsTableBody');
        
        if (!tbody) {
            console.error('Could not find materialsTableBody element');
            this.showNotification('Error: Could not add material row', 'error');
            return;
        }
        
        const newRow = document.createElement('tr');
        newRow.className = 'material-row';
        newRow.setAttribute('data-row', this.rowCounter);
        
        newRow.innerHTML = `
            <td class="col-category">
                <select name="category[]" class="form-select category-select" onchange="updateMaterialOptions(this, ${this.rowCounter})" required>
                    <option value="">Select Category</option>
                </select>
            </td>
            <td class="col-material">
                <select name="material[]" class="form-select material-select" onchange="updateMaterialOptions(this, ${this.rowCounter})" required disabled>
                    <option value="">Select Material</option>
                </select>
            </td>
            <td class="col-unit">
                <select name="unit[]" class="form-select unit-select" required disabled>
                    <option value="">Select UOM</option>
                </select>
            </td>
            <td class="col-qty">
                <input type="number" name="quantity[]" class="form-input qty-input" value="1" min="1" onchange="updateTotalItems()" required>
            </td>
            <td class="col-unit-price">
                <input type="text" name="unit_price[]" class="form-input unit-price-input" placeholder="0.00" required>
            </td>
            <td class="col-action">
                <button type="button" class="btn-remove" onclick="removeMaterialRow(${this.rowCounter})">🗑️</button>
            </td>
        `;
        
        tbody.appendChild(newRow);
        
        // Populate category dropdown for new row
        const categorySelect = newRow.querySelector('.category-select');
        this.populateCategorySelect(categorySelect);
        
        this.updateRemoveButtons();
        this.updateStats();
        
        this.showNotification('Material row added. Start by selecting a Category.', 'success');
        this.updateStatus('Material row added');
    }

    removeMaterialRow(rowNumber) {
        const row = document.querySelector(`tr[data-row="${rowNumber}"]`);
        if (row) {
            row.remove();
            this.updateRemoveButtons();
            this.updateStats();
            this.showNotification('Material row removed', 'success');
            this.updateStatus('Material row removed');
        }
    }

    updateRemoveButtons() {
        const rows = document.querySelectorAll('.material-row');
        rows.forEach((row, index) => {
            const removeBtn = row.querySelector('.btn-remove');
            if (removeBtn) {
                removeBtn.disabled = rows.length <= 1;
            }
        });
    }

    updateStats() {
        const rows = document.querySelectorAll('.material-row');
        let totalItems = 0;
        let totalQuantity = 0;
        let totalValue = 0;
        let uniqueCategories = new Set();
        
        rows.forEach(row => {
            const categorySelect = row.querySelector('.category-select');
            const materialSelect = row.querySelector('.material-select');
            const qtyInput = row.querySelector('.qty-input');
            const unitPriceInput = row.querySelector('.unit-price-input');
            
            if (categorySelect && categorySelect.value && materialSelect && materialSelect.value) {
                totalItems++;
                uniqueCategories.add(categorySelect.value);
            }
            
            const quantity = parseInt(qtyInput?.value) || 0;
            const unitPriceText = unitPriceInput?.value || '0';
            const unitPrice = parseFloat(unitPriceText.replace(/,/g, '')) || 0;
            
            if (quantity > 0) {
                totalQuantity += quantity;
                totalValue += (quantity * unitPrice);
            }
        });
        
        // Format as Philippine Peso
        const formattedValue = new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(totalValue);
        
        // Update total items display - count items, not quantities
        const totalItemsElement = document.getElementById('totalItems');
        if (totalItemsElement) {
            totalItemsElement.textContent = `Total Items: ${totalItems} | Total Value: ${formattedValue}`;
        }
    }

    async submitMaterialOrder() {
        try {
            this.updateStatus('Validating material order...');
            
            const formData = this.collectFormData();
            
            if (!this.validateFormData(formData)) {
                return;
            }
            
            this.updateStatus('Submitting material order...');
            
            const submitBtn = document.querySelector('.btn-primary');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.textContent = '⏳ Submitting...';
                submitBtn.disabled = true;
                
                try {
                    const response = await fetch('api/purchasing_material_order_form_submit.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });

                    const responseText = await response.text();
                    console.log('API Response:', responseText);
                    
                    let result;
                    try {
                        result = JSON.parse(responseText);
                    } catch (e) {
                        console.error('Invalid JSON response:', responseText);
                        throw new Error('Server returned invalid response');
                    }

                    if (!response.ok) {
                        throw new Error(result.message || `HTTP error! status: ${response.status}`);
                    }

                    if (result.success) {
                        this.handleSubmissionSuccess(result.data);
                    } else {
                        throw new Error(result.message || 'Failed to submit material order');
                    }

                } catch (error) {
                    console.error('Submission error:', error);
                    this.showNotification('Failed to submit material order: ' + error.message, 'error');
                    this.updateStatus('Error submitting material order');
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            }
            
        } catch (error) {
            console.error('Submission error:', error);
            this.showNotification('Failed to submit material order: ' + error.message, 'error');
            this.updateStatus('Error submitting material order');
        }
    }

    handleSubmissionSuccess(data) {
        document.getElementById('generatedPONumber').textContent = data.po_number;
        document.getElementById('orderDate').textContent = this.formatDate(data.po_date);
        document.getElementById('modalTotalItems').textContent = data.total_materials;
        
        document.getElementById('successModal').style.display = 'block';
        
        this.showNotification(`Material order ${data.po_number} created successfully!`, 'success');
        this.updateStatus(`Material order ${data.po_number} submitted successfully`);
        
        const lastSavedElement = document.getElementById('lastSaved');
        if (lastSavedElement) {
            lastSavedElement.textContent = `Last saved: ${new Date().toLocaleTimeString()}`;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    clearForm() {
        if (confirm('Are you sure you want to clear the form? All data will be lost.')) {
            document.getElementById('poDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('supplier').value = '';
            document.getElementById('remarks').value = '';
            
            const tbody = document.getElementById('materialsTableBody');
            const rows = tbody.querySelectorAll('.material-row');
            
            for (let i = 1; i < rows.length; i++) {
                rows[i].remove();
            }
            
            const firstRow = tbody.querySelector('.material-row');
            if (firstRow) {
                const categorySelect = firstRow.querySelector('.category-select');
                this.populateCategorySelect(categorySelect);
                categorySelect.selectedIndex = 0;
                
                firstRow.querySelector('.material-select').innerHTML = '<option value="">Select Material</option>';
                firstRow.querySelector('.material-select').disabled = true;
                firstRow.querySelector('.unit-select').innerHTML = '<option value="">Select UOM</option>';
                firstRow.querySelector('.unit-select').disabled = true;
                firstRow.querySelector('.qty-input').value = '1';
                firstRow.querySelector('.unit-price-input').value = '';
            }
            
            this.rowCounter = 1;
            this.updateRemoveButtons();
            this.updateStats();
            
            this.showNotification('Form cleared', 'success');
            this.updateStatus('Form cleared - ready for new material order');
        }
    }

    closeSuccessModal() {
        document.getElementById('successModal').style.display = 'none';
    }

    createNewOrder() {
        this.closeSuccessModal();
        this.clearForm();
    }

    updateDateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = dateStr;
        }
    }

    updateStatus(message) {
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => {
            if (notif.parentNode) {
                notif.parentNode.removeChild(notif);
            }
        });

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        let backgroundColor, icon;
        switch(type) {
            case 'success':
                backgroundColor = '#4caf50';
                icon = '✓';
                break;
            case 'error':
                backgroundColor = '#f44336';
                icon = '✗';
                break;
            case 'warning':
                backgroundColor = '#ff9800';
                icon = '⚠';
                break;
            case 'info':
            default:
                backgroundColor = '#4caf50';
                icon = 'ℹ';
                break;
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 15px 25px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.4s ease-out;
            max-width: 400px;
            word-wrap: break-word;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 16px; font-weight: bold;">${icon}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        const duration = type === 'success' ? 5000 : 4000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.4s ease-out forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 400);
            }
        }, duration);
        
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { 
                        transform: translateX(100%) scale(0.8); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateX(0) scale(1); 
                        opacity: 1; 
                    }
                }
                @keyframes slideOut {
                    from { 
                        transform: translateX(0) scale(1); 
                        opacity: 1; 
                    }
                    to { 
                        transform: translateX(100%) scale(0.8); 
                        opacity: 0; 
                    }
                }
                
                .notification:hover {
                    transform: scale(1.02);
                    transition: transform 0.2s ease;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        });
    }

    collectFormData() {
        const data = {
            poDate: document.getElementById('poDate').value,
            supplier: document.getElementById('supplier').value,
            remarks: document.getElementById('remarks').value,
            materials: []
        };
        
        const rows = document.querySelectorAll('.material-row');
        rows.forEach(row => {
            const category = row.querySelector('.category-select').value;
            const material = row.querySelector('.material-select').value;
            const unit = row.querySelector('.unit-select').value;
            const quantity = parseInt(row.querySelector('.qty-input').value) || 0;
            
            const unitPriceInput = row.querySelector('.unit-price-input');
            const unitPriceText = unitPriceInput?.value || '0';
            const unitPrice = parseFloat(unitPriceText.replace(/,/g, '')) || 0;
            
            if (category && material && unit && quantity > 0 && unitPrice > 0) {
                data.materials.push({
                    category,
                    material,
                    unit,
                    quantity,
                    unit_price: unitPrice
                });
            }
        });
        
        return data;
    }

    validateFormData(data) {
        if (!data.poDate) {
            this.showNotification('Please select a PO date', 'error');
            return false;
        }
        
        if (!data.supplier) {
            this.showNotification('Please select a supplier', 'error');
            return false;
        }
        
        if (data.materials.length === 0) {
            this.showNotification('Please add at least one complete material with unit price', 'error');
            return false;
        }
        
        return true;
    }
}

// Global functions
function updateMaterialOptions(selectElement, rowNumber) {
    if (window.materialOrderForm) {
        window.materialOrderForm.updateMaterialOptions(selectElement, rowNumber);
    }
}

function addMaterialRow() {
    if (window.materialOrderForm) {
        window.materialOrderForm.addMaterialRow();
    }
}

function removeMaterialRow(rowNumber) {
    if (window.materialOrderForm) {
        window.materialOrderForm.removeMaterialRow(rowNumber);
    }
}

function updateTotalItems() {
    if (window.materialOrderForm) {
        window.materialOrderForm.updateStats();
    }
}

function closeSuccessModal() {
    if (window.materialOrderForm) {
        window.materialOrderForm.closeSuccessModal();
    }
}

function createNewOrder() {
    if (window.materialOrderForm) {
        window.materialOrderForm.createNewOrder();
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        if (window.materialOrderForm) {
            window.materialOrderForm.showNotification('Logging out...', 'info');
        }
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.materialOrderForm = new MaterialOrderForm();
});


