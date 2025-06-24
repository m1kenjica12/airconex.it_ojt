// Professional Materials Receiving System - Excel Style

class MaterialsReceiving {
    constructor() {
        this.materialOrders = [];
        this.selectedPO = null;
        this.receivingItems = [];
        this.init();
    }

    async init() {
        this.updateDateTime();
        await this.loadMaterialOrders();
        this.setupEventListeners();
        this.updateStatus('Ready to receive material order items');
    }

    async loadMaterialOrders() {
        try {
            this.updateStatus('Loading material orders...');
            
            const response = await fetch('api/warehouse_materials_receiving_load_po.php');
            const result = await response.json();
            
            console.log('Material Orders Response:', result);
            
            if (result.success) {
                this.materialOrders = result.data;
                this.populatePODropdown();
                this.showNotification(`Loaded ${this.materialOrders.length} material orders`, 'success');
                this.updateStatus('Material orders loaded successfully');
            } else {
                throw new Error(result.message || 'Failed to load material orders');
            }
        } catch (error) {
            console.error('Error loading material orders:', error);
            this.showNotification('Failed to load material orders: ' + error.message, 'error');
            this.updateStatus('Error loading material orders');
        }
    }

    populatePODropdown() {
        const poSelect = document.getElementById('poSelection');
        if (!poSelect) return;

        poSelect.innerHTML = '<option value="">Select Material Order</option>';
        
        this.materialOrders.forEach(po => {
            const option = document.createElement('option');
            option.value = po.po_number;
            option.textContent = `${po.po_number} - ${po.supplier} (${po.items.length} items)`;
            poSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        const poSelect = document.getElementById('poSelection');
        if (poSelect) {
            poSelect.addEventListener('change', (e) => this.handlePOSelection(e.target.value));
        }

        const receivingForm = document.getElementById('receivingForm');
        if (receivingForm) {
            receivingForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Set default DR date to today
        const drDateInput = document.getElementById('drDate');
        if (drDateInput) {
            drDateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    handlePOSelection(poNumber) {
        if (!poNumber) {
            this.clearPODetails();
            return;
        }

        this.selectedPO = this.materialOrders.find(po => po.po_number === poNumber);
        if (this.selectedPO) {
            this.populatePODetails();
            this.generateItemsTable();
            this.showItemsSection();
        }
    }

    populatePODetails() {
        if (!this.selectedPO) return;

        document.getElementById('poNumber').value = this.selectedPO.po_number;
        document.getElementById('supplier').value = this.selectedPO.supplier;
        
        this.updateStatus(`Selected PO: ${this.selectedPO.po_number} with ${this.selectedPO.items.length} items`);
    }

    generateItemsTable() {
        const tbody = document.getElementById('itemsSerialBody');
        if (!tbody || !this.selectedPO) return;

        tbody.innerHTML = '';
        this.receivingItems = [];

        this.selectedPO.items.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = 'item-row incomplete';
            row.dataset.itemIndex = index;

            row.innerHTML = `
                <td class="col-unit-desc item-unit-desc">${item.material}</td>
                <td class="col-indoor-model item-model-display indoor-model-display">
                    ${item.category || '-'}
                </td>
                <td class="col-indoor-serial item-model-display">
                    ${item.quantity}
                </td>
                <td class="col-outdoor-model item-model-display outdoor-model-display">
                    ${item.unit || '-'}
                </td>
                <td class="col-outdoor-serial">
                    <input type="number" 
                           class="qty-input received-qty" 
                           data-item-index="${index}"
                           min="0"
                           value="${item.quantity}"
                           placeholder="Received Qty" 
                           required>
                </td>
                <td class="col-variance">
                    <span class="variance-display" data-item-index="${index}">0</span>
                </td>
            `;

            tbody.appendChild(row);

            // Add item to receivingItems array
            this.receivingItems.push({
                id: item.id,
                category: item.category,
                material: item.material,
                unit: item.unit,
                ordered_qty: item.quantity,
                received_qty: item.quantity,
                variance: 0,
                completed: true
            });
        });

        // Add event listeners to quantity inputs
        this.setupQuantityInputListeners();
    }

    setupQuantityInputListeners() {
        const qtyInputs = document.querySelectorAll('.received-qty');
        
        qtyInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const itemIndex = parseInt(e.target.dataset.itemIndex);
                const value = parseInt(e.target.value) || 0;

                if (this.receivingItems[itemIndex]) {
                    this.receivingItems[itemIndex].received_qty = value;
                    this.updateVariance(itemIndex);
                    this.updateRowStatus(itemIndex);
                }
            });
        });
    }

    updateVariance(itemIndex) {
        const item = this.receivingItems[itemIndex];
        if (!item) return;

        const variance = item.received_qty - item.ordered_qty;
        item.variance = variance;

        const varianceDisplay = document.querySelector(`span.variance-display[data-item-index="${itemIndex}"]`);
        if (varianceDisplay) {
            varianceDisplay.textContent = variance > 0 ? `+${variance}` : variance.toString();
            
            // Apply color coding
            varianceDisplay.className = 'variance-display';
            if (variance === 0) {
                varianceDisplay.classList.add('variance-green');
            } else if (Math.abs(variance) <= 2) {
                varianceDisplay.classList.add('variance-orange');
            } else {
                varianceDisplay.classList.add('variance-red');
            }
        }
    }

    updateRowStatus(itemIndex) {
        const item = this.receivingItems[itemIndex];
        const row = document.querySelector(`tr[data-item-index="${itemIndex}"]`);
        
        if (!item || !row) return;

        const hasReceivedQty = item.received_qty >= 0;
        
        item.completed = hasReceivedQty;

        if (item.completed) {
            row.className = 'item-row completed';
        } else {
            row.className = 'item-row incomplete';
        }
    }

    showItemsSection() {
        const itemsSection = document.getElementById('itemsSection');
        if (itemsSection) {
            itemsSection.style.display = 'block';
        }
    }

    clearPODetails() {
        document.getElementById('poNumber').value = '';
        document.getElementById('supplier').value = '';
        
        const itemsSection = document.getElementById('itemsSection');
        if (itemsSection) {
            itemsSection.style.display = 'none';
        }

        this.selectedPO = null;
        this.receivingItems = [];
        this.updateStatus('Ready to receive material order items');
    }

    async handleSubmit(e) {
        e.preventDefault();

        try {
            if (!this.validateForm()) {
                return;
            }

            this.updateStatus('Submitting receiving data...');
            
            const submitData = {
                poNumber: document.getElementById('poNumber').value,
                drNumber: document.getElementById('drNumber').value,
                drDate: document.getElementById('drDate').value,
                items: this.receivingItems.map(item => ({
                    id: item.id,
                    category: item.category,
                    material: item.material,
                    unit: item.unit,
                    ordered_qty: item.ordered_qty,
                    received_qty: item.received_qty
                }))
            };

            console.log('Submitting data:', submitData);

            const response = await fetch('api/warehouse_materials_receiving_submit.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData)
            });

            const result = await response.json();
            console.log('Submit response:', result);

            if (result.success) {
                this.showSuccessModal(result.data);
                this.updateStatus('Materials received successfully');
                this.updateLastSaved();
            } else {
                throw new Error(result.message || 'Failed to submit receiving data');
            }

        } catch (error) {
            console.error('Submit error:', error);
            this.showNotification('Failed to submit: ' + error.message, 'error');
            this.updateStatus('Error submitting receiving data');
        }
    }

    validateForm() {
        const drNumber = document.getElementById('drNumber').value.trim();
        const drDate = document.getElementById('drDate').value;

        if (!drNumber) {
            this.showNotification('DR Number is required', 'error');
            return false;
        }

        if (!drDate) {
            this.showNotification('DR Date is required', 'error');
            return false;
        }

        if (!this.selectedPO) {
            this.showNotification('Please select a Material Order', 'error');
            return false;
        }

        const incompleteItems = this.receivingItems.filter(item => !item.completed);
        if (incompleteItems.length > 0) {
            this.showNotification(`Please complete ${incompleteItems.length} remaining items`, 'error');
            return false;
        }

        return true;
    }

    showSuccessModal(data) {
        const modal = document.getElementById('successModal');
        const summary = document.getElementById('receivingSummary');
        
        if (!modal || !summary) return;

        summary.innerHTML = `
            <div class="summary-item">
                <strong>PO Number:</strong> ${data.po_number}
            </div>
            <div class="summary-item">
                <strong>DR Number:</strong> ${data.dr_number}
            </div>
            <div class="summary-item">
                <strong>DR Date:</strong> ${data.dr_date}
            </div>
            <div class="summary-item">
                <strong>Total Items Received:</strong> ${data.total_items}
            </div>
            <div class="summary-item">
                <strong>Items Detail:</strong>
                ${data.received_items.map(item => 
                    `<div style="margin-left: 10px; margin-top: 5px; font-size: 10px;">
                        ${item.material}<br>
                        Category: ${item.category} | UOM: ${item.unit}<br>
                        Ordered: ${item.ordered_qty} | Received: ${item.received_qty}
                    </div>`
                ).join('')}
            </div>
        `;

        modal.style.display = 'block';
    }

    clearForm() {
        document.getElementById('receivingForm').reset();
        document.getElementById('poSelection').value = '';
        document.getElementById('drDate').value = new Date().toISOString().split('T')[0];
        this.clearPODetails();
        this.showNotification('Form cleared', 'info');
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

    updateLastSaved() {
        const lastSavedElement = document.getElementById('lastSaved');
        if (lastSavedElement) {
            const now = new Date();
            lastSavedElement.textContent = `Last saved: ${now.toLocaleTimeString()}`;
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
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
                backgroundColor = '#27ae60';
                icon = '✓';
                break;
            case 'error':
                backgroundColor = '#e74c3c';
                icon = '✗';
                break;
            case 'warning':
                backgroundColor = '#f39c12';
                icon = '⚠';
                break;
            case 'info':
            default:
                backgroundColor = '#3498db';
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
        
        const duration = type === 'success' ? 3000 : 4000;
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
        
        // Add animation styles if not present
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
}

// Global functions
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function receiveAnother() {
    closeSuccessModal();
    if (window.materialsReceiving) {
        window.materialsReceiving.clearForm();
    }
}

function clearForm() {
    if (window.materialsReceiving) {
        window.materialsReceiving.clearForm();
    }
}

function goBack() {
    window.location.href = 'warehouse_materials_inventory.html';
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        window.location.href = 'index.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.materialsReceiving = new MaterialsReceiving();
});