// Professional Unit Inventory Management System

class InventoryManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 50;
        this.totalItems = 0;
        this.allInventory = [];
        this.filteredInventory = [];
        this.sortColumn = '';
        this.sortDirection = 'asc';
        this.init();
    }

    async init() {
        this.updateDateTime();
        await this.loadInventoryData();
        this.setupEventListeners();
        this.updateStatus('Inventory loaded successfully');
    }

    // Add the missing showLoading method
    showLoading(show = true) {
        const tbody = document.getElementById('inventoryTableBody');
        if (show) {
            tbody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="6" class="loading-cell">
                        <div class="loading-spinner"></div>
                        Loading inventory data...
                    </td>
                </tr>
            `;
        }
    }

    // Update the loadInventoryData method to ensure all products are loaded
    async loadInventoryData() {
        try {
            this.showLoading(true);
            this.updateStatus('Loading all inventory data...');
            
            // Use the UNIT INVENTORY's own API - loads ALL products regardless of stock
            const response = await fetch('api/sales_inventory_load_units.php?page=1&limit=1000&sort=brand&order=ASC');
            const result = await response.json();
            
            console.log('Inventory API Response:', result); // Debug log
            
            if (result.success) {
                this.allInventory = result.data.map(item => ({
                    ...item,
                    stocks: parseInt(item.stocks) || 0, // Ensure stocks is a number
                    status: this.getStockStatus(item.stocks)
                }));
                
                this.filteredInventory = [...this.allInventory];
                this.totalItems = this.allInventory.length;
                
                console.log(`Loaded ${this.allInventory.length} total products`); // Debug log
                
                this.populateFilters();
                this.updateStats();
                this.renderTable();
                this.updatePagination();
                
                this.showNotification(`Loaded ${this.allInventory.length} products successfully (all products including 0 stock)`, 'success');
                this.updateStatus(`Showing all ${this.allInventory.length} products from inventory`);
            } else {
                throw new Error(result.message || 'Failed to load inventory');
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showNotification('Failed to load inventory data: ' + error.message, 'error');
            this.loadFallbackData();
        } finally {
            this.showLoading(false);
        }
    }

    loadFallbackData() {
        // Fallback data if API fails
        this.allInventory = [];
        this.filteredInventory = [];
        this.renderTable();
        this.updateStats();
    }

    // Update the getStockStatus method to handle all stock levels
    getStockStatus(stock) {
        const stockNum = parseInt(stock) || 0;
        if (stockNum === 0) return 'Out of Stock';
        if (stockNum <= 5) return 'Low Stock';
        return 'In Stock';
    }

    populateFilters() {
        // Populate brand filter
        const brands = [...new Set(this.allInventory.map(item => item.brand))].sort();
        const brandFilter = document.getElementById('brandFilter');
        if (brandFilter) {
            brandFilter.innerHTML = '<option value="">All Brands</option>';
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand;
                option.textContent = brand;
                brandFilter.appendChild(option);
            });
        }

        // Populate type filter
        const types = [...new Set(this.allInventory.map(item => item.unit_type).filter(Boolean))].sort();
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.innerHTML = '<option value="">All Types</option>';
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeFilter.appendChild(option);
            });
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 300);
            });

            // Enter key for search
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
        }

        // Filter functionality
        const brandFilter = document.getElementById('brandFilter');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');

        if (brandFilter) brandFilter.addEventListener('change', () => this.applyFilters());
        if (typeFilter) typeFilter.addEventListener('change', () => this.applyFilters());
        if (statusFilter) statusFilter.addEventListener('change', () => this.applyFilters());
    }

    // Ensure filters don't exclude products
    applyFilters() {
        const searchInput = document.getElementById('searchInput');
        const brandFilter = document.getElementById('brandFilter');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');

        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const brandValue = brandFilter ? brandFilter.value.trim() : '';
        const typeValue = typeFilter ? typeFilter.value.trim() : '';
        const statusValue = statusFilter ? statusFilter.value.trim() : '';

        console.log('Applying filters:', { searchTerm, brandValue, typeValue, statusValue }); // Debug log

        this.filteredInventory = this.allInventory.filter(item => {
            const matchesSearch = !searchTerm || 
                (item.brand && item.brand.toLowerCase().includes(searchTerm)) ||
                (item.model && item.model.toLowerCase().includes(searchTerm)) ||
                (item.unit_type && item.unit_type.toLowerCase().includes(searchTerm)) ||
                (item.unit_description && item.unit_description.toLowerCase().includes(searchTerm)) ||
                (item.horsepower && item.horsepower.toString().toLowerCase().includes(searchTerm)) ||
                (item.series && item.series.toLowerCase().includes(searchTerm)) ||
                (item.stocks !== null && item.stocks.toString().includes(searchTerm));

            const matchesBrand = !brandValue || (item.brand && item.brand === brandValue);
            const matchesType = !typeValue || (item.unit_type && item.unit_type === typeValue);
            const matchesStatus = !statusValue || (item.status && item.status === statusValue);

            return matchesSearch && matchesBrand && matchesType && matchesStatus;
        });

        console.log(`Filtered results: ${this.filteredInventory.length} out of ${this.allInventory.length} total products`); // Debug log

        this.currentPage = 1;
        this.updateStats();
        this.renderTable();
        this.updatePagination();
    }

    // Update the updateStats method to show accurate counts
    updateStats() {
        const totalItems = this.filteredInventory.length;
        const inStock = this.filteredInventory.filter(item => {
            const stock = parseInt(item.stocks) || 0;
            return stock > 5;
        }).length;
        const lowStock = this.filteredInventory.filter(item => {
            const stock = parseInt(item.stocks) || 0;
            return stock > 0 && stock <= 5;
        }).length;
        const outStock = this.filteredInventory.filter(item => {
            const stock = parseInt(item.stocks) || 0;
            return stock === 0;
        }).length;

        console.log(`Stats: Total=${totalItems}, In Stock=${inStock}, Low Stock=${lowStock}, Out of Stock=${outStock}`); // Debug log

        const totalElement = document.getElementById('totalItems');
        const inStockElement = document.getElementById('inStockItems');
        const lowStockElement = document.getElementById('lowStockItems');
        const outStockElement = document.getElementById('outStockItems');

        if (totalElement) totalElement.textContent = totalItems.toLocaleString();
        if (inStockElement) inStockElement.textContent = inStock.toLocaleString();
        if (lowStockElement) lowStockElement.textContent = lowStock.toLocaleString();
        if (outStockElement) outStockElement.textContent = outStock.toLocaleString();
    }

    renderTable() {
        const tbody = document.getElementById('inventoryTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredInventory.length === 0) {
            tbody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="6" class="loading-cell">
                        No inventory items found matching your criteria.
                        <br><small>Try adjusting your search or filters.</small>
                    </td>
                </tr>
            `;
            return;
        }

        // Calculate pagination
        const startIndex = this.pageSize === 'all' ? 0 : (this.currentPage - 1) * parseInt(this.pageSize);
        const endIndex = this.pageSize === 'all' ? this.filteredInventory.length : startIndex + parseInt(this.pageSize);
        const pageItems = this.filteredInventory.slice(startIndex, endIndex);

        console.log(`Rendering ${pageItems.length} items out of ${this.filteredInventory.length} filtered items`); // Debug log

        pageItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = 'inventory-row';
            
            const statusClass = item.status.toLowerCase().replace(/\s+/g, '-');
            const stockValue = parseInt(item.stocks) || 0;
            
            row.innerHTML = `
                <td class="col-brand">${item.brand || '-'}</td>
                <td class="col-model">${item.model || '-'}</td>
                <td class="col-capacity text-center">${item.horsepower || '-'}</td>
                <td class="col-type">${item.unit_type || '-'}</td>
                <td class="col-stock text-center ${this.getStockCellClass(stockValue)}">${stockValue}</td>
                <td class="col-status text-center">
                    <span class="status-badge status-${statusClass}">${item.status}</span>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Add helper method for stock cell styling
    getStockCellClass(stock) {
        const stockNum = parseInt(stock) || 0;
        if (stockNum === 0) return 'out-of-stock';
        if (stockNum <= 5) return 'low-stock';
        return 'in-stock';
    }

    sortTable(column) {
        // Update sort direction
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Update sort indicators
        document.querySelectorAll('.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        const currentTh = document.querySelector(`th[onclick="sortTable('${column}')"]`);
        if (currentTh) {
            currentTh.classList.add(`sort-${this.sortDirection}`);
        }

        // Sort the data
        this.filteredInventory.sort((a, b) => {
            let aVal = a[column] || '';
            let bVal = b[column] || '';

            // Handle numeric columns
            if (column === 'stocks' || column === 'horsepower') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else {
                aVal = aVal.toString().toLowerCase();
                bVal = bVal.toString().toLowerCase();
            }

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        this.currentPage = 1;
        this.renderTable();
        this.updatePagination();
    }

    updatePagination() {
        const totalPages = this.pageSize === 'all' ? 1 : Math.ceil(this.filteredInventory.length / parseInt(this.pageSize));
        
        // Update pagination info
        const startItem = this.pageSize === 'all' ? 1 : (this.currentPage - 1) * parseInt(this.pageSize) + 1;
        const endItem = this.pageSize === 'all' ? this.filteredInventory.length : 
            Math.min(this.currentPage * parseInt(this.pageSize), this.filteredInventory.length);
        
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${this.filteredInventory.length} items`;
        }

        // Update navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;

        // Update page numbers
        this.renderPageNumbers(totalPages);
    }

    renderPageNumbers(totalPages) {
        const pageNumbersContainer = document.getElementById('pageNumbers');
        if (!pageNumbersContainer) return;
        
        pageNumbersContainer.innerHTML = '';

        if (this.pageSize === 'all' || totalPages <= 1) return;

        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => this.goToPage(i);
            pageNumbersContainer.appendChild(pageBtn);
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.updatePagination();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
            this.updatePagination();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredInventory.length / parseInt(this.pageSize));
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
            this.updatePagination();
        }
    }

    changePageSize() {
        const pageSizeSelect = document.getElementById('pageSize');
        if (pageSizeSelect) {
            this.pageSize = pageSizeSelect.value;
            this.currentPage = 1;
            this.renderTable();
            this.updatePagination();
        }
    }

    refreshInventory() {
        this.showNotification('Refreshing inventory...', 'info');
        this.loadInventoryData();
    }

    exportInventory() {
        try {
            // Create CSV content
            const headers = ['Brand', 'Model', 'Capacity (HP)', 'Type', 'Stock Quantity', 'Status'];
            const csvContent = [
                headers.join(','),
                ...this.filteredInventory.map(item => [
                    `"${item.brand || ''}"`,
                    `"${item.model || ''}"`,
                    `"${item.horsepower || ''}"`,
                    `"${item.unit_type || ''}"`,
                    `"${item.stocks || '0'}"`,
                    `"${item.status || ''}"`
                ].join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('Inventory exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Failed to export inventory', 'error');
        }
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

        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    updateStatus(message) {
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    showNotification(message, type = 'info') {
        // Remove any existing notifications
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
        
        // Add CSS animations if not already present
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
function searchInventory() {
    if (window.inventoryManager) {
        window.inventoryManager.applyFilters();
    }
}

function refreshInventory() {
    if (window.inventoryManager) {
        window.inventoryManager.refreshInventory();
    }
}

function exportInventory() {
    if (window.inventoryManager) {
        window.inventoryManager.exportInventory();
    }
}

function sortTable(column) {
    if (window.inventoryManager) {
        window.inventoryManager.sortTable(column);
    }
}

function previousPage() {
    if (window.inventoryManager) {
        window.inventoryManager.previousPage();
    }
}

function nextPage() {
    if (window.inventoryManager) {
        window.inventoryManager.nextPage();
    }
}

function changePageSize() {
    if (window.inventoryManager) {
        window.inventoryManager.changePageSize();
    }
}

// Logout functionality
function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        if (window.inventoryManager) {
            window.inventoryManager.showNotification('Logging out...', 'info');
        }
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryManager = new InventoryManager();
});