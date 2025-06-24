// Complete Brand Performance Analytics - All Sections

class BrandPerformanceAnalytics {
    constructor() {
        this.currentPeriod = 'month';
        this.analyticsData = {};
        this.init();
    }

    async init() {
        this.updateDateTime();
        this.setupEventListeners();
        await this.loadAnalyticsData();
        this.updateStatus('Brand performance loaded successfully');
    }

    setupEventListeners() {
        const periodFilter = document.getElementById('periodFilter');
        
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.loadAnalyticsData();
            });
        }
    }

    async loadAnalyticsData() {
        try {
            this.updateStatus('Loading brand performance data...');
            
            this.analyticsData = this.generateBrandData();
            
            this.populateBrandRankingTable();
            this.populateCapRankingTable();
            
            this.updateStatus('Brand performance loaded successfully');
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Error loading brand performance data:', error);
            this.updateStatus('Error loading brand performance data');
        }
    }

    generateBrandData() {
        const periodMultipliers = {
            today: 0.03,
            week: 0.25,
            month: 1,
            quarter: 3,
            year: 12
        };

        const multiplier = periodMultipliers[this.currentPeriod] || 1;

        // Brands
        const brands = [
            { name: 'Daikin', avatar: '', marketShare: 0.35 },
            { name: 'Panasonic', avatar: '', marketShare: 0.28 },
            { name: 'Midea', avatar: '', marketShare: 0.22 },
            { name: 'Hitachi', avatar: '', marketShare: 0.15 }
        ];

        // Capacities
        const capacities = ['1.0', '1.5', '2.0', '2.5', '3.0'];

        // Generate brand performance
        const brandPerformance = brands.map((brand, index) => {
            const baseUnits = Math.floor(200 * brand.marketShare * multiplier);
            const baseRevenue = 40000;
            
            const variation = 0.8 + (Math.random() * 0.4);
            const tyUnits = Math.floor(baseUnits * variation);
            const tyRevenue = Math.floor(tyUnits * baseRevenue * variation);

            return {
                ...brand,
                performance: {
                    units: tyUnits,
                    revenue: tyRevenue,
                    rank: 0
                }
            };
        });

        // Generate capacity performance
        const capacityPerformance = capacities.map((capacity, index) => {
            const popularityFactor = capacity === '1.5' ? 1.5 : 
                                   capacity === '2.0' ? 1.3 : 
                                   capacity === '1.0' ? 1.1 : 0.8;
            
            const baseUnits = Math.floor(150 * popularityFactor * multiplier);
            const baseRevenue = parseFloat(capacity) * 35000;

            const variation = 0.8 + (Math.random() * 0.4);
            const tyUnits = Math.floor(baseUnits * variation);
            const tyRevenue = Math.floor(tyUnits * baseRevenue * variation);

            return {
                capacity: capacity,
                performance: {
                    units: tyUnits,
                    revenue: tyRevenue,
                    rank: 0
                }
            };
        });

        // Sort and rank
        brandPerformance.sort((a, b) => b.performance.revenue - a.performance.revenue);
        capacityPerformance.sort((a, b) => b.performance.revenue - a.performance.revenue);

        brandPerformance.forEach((brand, index) => {
            brand.performance.rank = index + 1;
        });
        capacityPerformance.forEach((capacity, index) => {
            capacity.performance.rank = index + 1;
        });

        return { 
            brands: brandPerformance, 
            capacities: capacityPerformance
        };
    }

    populateBrandRankingTable() {
        const tbody = document.getElementById('brandRankingTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP'
            }).format(amount);
        };

        const getRankClass = (rank) => {
            if (rank === 1) return 'rank-gold';
            if (rank === 2) return 'rank-silver';
            if (rank === 3) return 'rank-bronze';
            return 'rank-normal';
        };

        const totalRevenue = this.analyticsData.brands.reduce((sum, brand) => sum + brand.performance.revenue, 0);

        this.analyticsData.brands.forEach(brand => {
            const perf = brand.performance;
            const marketShare = (perf.revenue / totalRevenue * 100);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-rank ${getRankClass(perf.rank)}">#${perf.rank}</td>
                <td class="col-agent">
                    <div class="agent-info">
                        <span class="agent-avatar">${brand.avatar}</span>
                        <div class="agent-details">
                            <strong>${brand.name}</strong>
                        </div>
                    </div>
                </td>
                <td class="col-units">${perf.units.toLocaleString()}</td>
                <td class="col-revenue">${formatCurrency(perf.revenue)}</td>
                <td class="col-achievement">${marketShare.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    populateCapRankingTable() {
        const tbody = document.getElementById('capRankingTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP'
            }).format(amount);
        };

        const getRankClass = (rank) => {
            if (rank === 1) return 'rank-gold';
            if (rank === 2) return 'rank-silver';
            if (rank === 3) return 'rank-bronze';
            return 'rank-normal';
        };

        const totalRevenue = this.analyticsData.capacities.reduce((sum, capacity) => sum + capacity.performance.revenue, 0);

        this.analyticsData.capacities.forEach(capacity => {
            const perf = capacity.performance;
            const marketShare = (perf.revenue / totalRevenue * 100);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-rank ${getRankClass(perf.rank)}">#${perf.rank}</td>
                <td class="col-agent">
                    <div class="agent-info">
                        <span class="agent-avatar"></span>
                        <div class="agent-details">
                            <strong>${capacity.capacity} HP</strong>
                        </div>
                    </div>
                </td>
                <td class="col-units">${perf.units.toLocaleString()}</td>
                <td class="col-revenue">${formatCurrency(perf.revenue)}</td>
                <td class="col-achievement">${marketShare.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
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

    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            const now = new Date();
            lastUpdatedElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }
}

function refreshData() {
    if (window.brandPerformanceAnalytics) {
        window.brandPerformanceAnalytics.loadAnalyticsData();
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.brandPerformanceAnalytics = new BrandPerformanceAnalytics();
});