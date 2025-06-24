// Professional Sales Analytics Dashboard with Complete TY vs LY Channel Analysis

class SalesAnalytics {
    constructor() {
        this.currentPeriod = 'month';
        this.analyticsData = {};
        this.charts = {};
        this.init();
    }

    async init() {
        this.updateDateTime();
        this.setupEventListeners();
        await this.loadAnalyticsData();
        this.updateStatus('Analytics dashboard loaded successfully');
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
            this.updateStatus('Loading analytics data...');
            
            // Load sample data for demonstration
            this.analyticsData = this.generateSampleData();
            
            this.populateAllTables();
            this.createAllCharts();
            
            this.updateStatus('Analytics data loaded successfully');
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.updateStatus('Error loading analytics data');
        }
    }

    generateSampleData() {
        // Different data based on selected period
        const periodMultipliers = {
            today: 0.03,    // 3% of monthly
            week: 0.25,     // 25% of monthly
            month: 1,       // 100% baseline
            quarter: 3,     // 3x monthly
            year: 12        // 12x monthly
        };

        const multiplier = periodMultipliers[this.currentPeriod] || 1;

        // Base monthly data - Only RETAIL and SUBDEALER
        const salesByChannel = {
            retail: {
                ty: { units: Math.floor(120 * multiplier), revenue: Math.floor(4800000 * multiplier) },
                ly: { units: Math.floor(95 * multiplier), revenue: Math.floor(3800000 * multiplier) }
            },
            subdealer: {
                ty: { units: Math.floor(85 * multiplier), revenue: Math.floor(2550000 * multiplier) },
                ly: { units: Math.floor(110 * multiplier), revenue: Math.floor(3300000 * multiplier) }
            }
        };

        // Calculate growth percentages
        Object.keys(salesByChannel).forEach(channel => {
            const data = salesByChannel[channel];
            data.unitsGrowth = data.ly.units > 0 ? 
                ((data.ty.units - data.ly.units) / data.ly.units * 100) : 0;
            data.revenueGrowth = data.ly.revenue > 0 ? 
                ((data.ty.revenue - data.ly.revenue) / data.ly.revenue * 100) : 0;
        });

        return {
            // A. TY vs LY
            salesByChannel: salesByChannel,

            // B. TY vs Target
            targetAnalysis: {
                retail: {
                    actual: Math.floor(4800000 * multiplier),
                    target: Math.floor(5000000 * multiplier),
                    achievement: 96.0
                },
                subdealer: {
                    actual: Math.floor(2550000 * multiplier),
                    target: Math.floor(3000000 * multiplier),
                    achievement: 85.0
                }
            },

            // C. Units Analysis (already in salesByChannel)

            // D. Customer Count
            customerCount: {
                retail: {
                    ty: Math.floor(180 * multiplier),
                    ly: Math.floor(165 * multiplier),
                    newCustomers: Math.floor(25 * multiplier)
                },
                subdealer: {
                    ty: Math.floor(45 * multiplier),
                    ly: Math.floor(52 * multiplier),
                    newCustomers: Math.floor(8 * multiplier)
                }
            },

            // E. Transaction Size
            transactionSize: {
                retail: {
                    ty: 40000,  // Average order value
                    ly: 38000
                },
                subdealer: {
                    ty: 30000,
                    ly: 32000
                }
            },

            // F. Sales Orders
            salesOrders: {
                retail: {
                    ty: Math.floor(120 * multiplier),
                    ly: Math.floor(110 * multiplier),
                    conversionRate: 67.5
                },
                subdealer: {
                    ty: Math.floor(85 * multiplier),
                    ly: Math.floor(95 * multiplier),
                    conversionRate: 78.2
                }
            }
        };
    }

    populateAllTables() {
        this.populateTYvsLYTable();        // A
        this.populateTYvsTargetTable();    // B
        this.populateUnitsVsLYTable();     // C
        this.populateCustomerCountTable(); // D
        this.populateTransactionSizeTable(); // E
        this.populateSalesOrdersTable();   // F
    }

    // A. TY vs LY Performance Table
    populateTYvsLYTable() {
        const tbody = document.getElementById('tyVsLyTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP'
            }).format(amount);
        };

        const formatGrowth = (growth) => {
            const sign = growth >= 0 ? '+' : '';
            return `${sign}${growth.toFixed(1)}%`;
        };

        const getGrowthClass = (growth) => {
            if (growth > 0) return 'growth-positive';
            if (growth < 0) return 'growth-negative';
            return 'growth-neutral';
        };

        // Only RETAIL and SUBDEALER
        const channels = [
            { key: 'retail', name: 'RETAIL', icon: '🏪' },
            { key: 'subdealer', name: 'SUBDEALER', icon: '🤝' }
        ];

        let totalTYUnits = 0, totalTYRevenue = 0;
        let totalLYUnits = 0, totalLYRevenue = 0;

        channels.forEach(channel => {
            const data = this.analyticsData.salesByChannel[channel.key];
            
            totalTYUnits += data.ty.units;
            totalTYRevenue += data.ty.revenue;
            totalLYUnits += data.ly.units;
            totalLYRevenue += data.ly.revenue;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-channel">
                    <span class="channel-icon">${channel.icon}</span>
                    <strong>${channel.name}</strong>
                </td>
                <td class="col-units">${data.ty.units.toLocaleString()}</td>
                <td class="col-revenue">${formatCurrency(data.ty.revenue)}</td>
                <td class="col-units">${data.ly.units.toLocaleString()}</td>
                <td class="col-revenue">${formatCurrency(data.ly.revenue)}</td>
                <td class="col-growth ${getGrowthClass(data.unitsGrowth)}">${formatGrowth(data.unitsGrowth)}</td>
                <td class="col-growth ${getGrowthClass(data.revenueGrowth)}">${formatGrowth(data.revenueGrowth)}</td>
            `;
            tbody.appendChild(row);
        });

        // Add total row
        const totalUnitsGrowth = totalLYUnits > 0 ? ((totalTYUnits - totalLYUnits) / totalLYUnits * 100) : 0;
        const totalRevenueGrowth = totalLYRevenue > 0 ? ((totalTYRevenue - totalLYRevenue) / totalLYRevenue * 100) : 0;

        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td class="col-channel"><strong>TOTAL</strong></td>
            <td class="col-units"><strong>${totalTYUnits.toLocaleString()}</strong></td>
            <td class="col-revenue"><strong>${formatCurrency(totalTYRevenue)}</strong></td>
            <td class="col-units"><strong>${totalLYUnits.toLocaleString()}</strong></td>
            <td class="col-revenue"><strong>${formatCurrency(totalLYRevenue)}</strong></td>
            <td class="col-growth ${getGrowthClass(totalUnitsGrowth)}"><strong>${formatGrowth(totalUnitsGrowth)}</strong></td>
            <td class="col-growth ${getGrowthClass(totalRevenueGrowth)}"><strong>${formatGrowth(totalRevenueGrowth)}</strong></td>
        `;
        tbody.appendChild(totalRow);
    }

    // B. TY vs Target Performance Table
    populateTYvsTargetTable() {
        const tbody = document.getElementById('tyVsTargetTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP'
            }).format(amount);
        };

        const getAchievementClass = (achievement) => {
            if (achievement >= 100) return 'achievement-good';
            if (achievement >= 80) return 'achievement-fair';
            return 'achievement-poor';
        };

        // Only RETAIL and SUBDEALER
        const channels = [
            { key: 'retail', name: 'RETAIL', icon: '🏪' },
            { key: 'subdealer', name: 'SUBDEALER', icon: '🤝' }
        ];

        channels.forEach(channel => {
            const data = this.analyticsData.targetAnalysis[channel.key];
            const variance = data.actual - data.target;
            const achievement = (data.actual / data.target * 100);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-channel">
                    <span class="channel-icon">${channel.icon}</span>
                    <strong>${channel.name}</strong>
                </td>
                <td class="col-actual">${formatCurrency(data.actual)}</td>
                <td class="col-target">${formatCurrency(data.target)}</td>
                <td class="col-variance ${variance >= 0 ? 'growth-positive' : 'growth-negative'}">${formatCurrency(Math.abs(variance))}</td>
                <td class="col-achievement ${getAchievementClass(achievement)}">${achievement.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    // C. Units Sold vs LY Table
    populateUnitsVsLYTable() {
        const tbody = document.getElementById('unitsVsLyTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const getTrendIcon = (growth) => {
            if (growth > 5) return '📈';
            if (growth < -5) return '📉';
            return '📊';
        };

        // Only RETAIL and SUBDEALER
        const channels = [
            { key: 'retail', name: 'RETAIL', icon: '🏪' },
            { key: 'subdealer', name: 'SUBDEALER', icon: '🤝' }
        ];

        channels.forEach(channel => {
            const data = this.analyticsData.salesByChannel[channel.key];

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-channel">
                    <span class="channel-icon">${channel.icon}</span>
                    <strong>${channel.name}</strong>
                </td>
                <td class="col-units-ty">${data.ty.units.toLocaleString()}</td>
                <td class="col-units-ly">${data.ly.units.toLocaleString()}</td>
                <td class="col-units-growth ${data.unitsGrowth >= 0 ? 'growth-positive' : 'growth-negative'}">${data.unitsGrowth >= 0 ? '+' : ''}${data.unitsGrowth.toFixed(1)}%</td>
                <td class="col-units-trend">${getTrendIcon(data.unitsGrowth)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // D. Customer Count vs LY Table
    populateCustomerCountTable() {
        const tbody = document.getElementById('customerCountTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Only RETAIL and SUBDEALER
        const channels = [
            { key: 'retail', name: 'RETAIL', icon: '🏪' },
            { key: 'subdealer', name: 'SUBDEALER', icon: '🤝' }
        ];

        channels.forEach(channel => {
            const data = this.analyticsData.customerCount[channel.key];
            const growth = data.ly > 0 ? ((data.ty - data.ly) / data.ly * 100) : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-channel">
                    <span class="channel-icon">${channel.icon}</span>
                    <strong>${channel.name}</strong>
                </td>
                <td class="col-customers-ty">${data.ty.toLocaleString()}</td>
                <td class="col-customers-ly">${data.ly.toLocaleString()}</td>
                <td class="col-customers-growth ${growth >= 0 ? 'growth-positive' : 'growth-negative'}">${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%</td>
                <td class="col-customers-new">${data.newCustomers.toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // E. Transaction Size Analysis Table
    populateTransactionSizeTable() {
        const tbody = document.getElementById('transactionSizeTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP'
            }).format(amount);
        };

        const getTrendIcon = (change) => {
            if (change > 0) return '⬆️';
            if (change < 0) return '⬇️';
            return '➡️';
        };

        // Only RETAIL and SUBDEALER
        const channels = [
            { key: 'retail', name: 'RETAIL', icon: '🏪' },
            { key: 'subdealer', name: 'SUBDEALER', icon: '🤝' }
        ];

        channels.forEach(channel => {
            const data = this.analyticsData.transactionSize[channel.key];
            const change = data.ty - data.ly;
            const changePercent = data.ly > 0 ? (change / data.ly * 100) : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-channel">
                    <span class="channel-icon">${channel.icon}</span>
                    <strong>${channel.name}</strong>
                </td>
                <td class="col-avg-order-ty">${formatCurrency(data.ty)}</td>
                <td class="col-avg-order-ly">${formatCurrency(data.ly)}</td>
                <td class="col-order-change ${changePercent >= 0 ? 'growth-positive' : 'growth-negative'}">${formatCurrency(Math.abs(change))}</td>
                <td class="col-order-trend">${getTrendIcon(change)} ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    // F. Sales Orders Analysis Table
    populateSalesOrdersTable() {
        const tbody = document.getElementById('salesOrdersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Only RETAIL and SUBDEALER
        const channels = [
            { key: 'retail', name: 'RETAIL', icon: '🏪' },
            { key: 'subdealer', name: 'SUBDEALER', icon: '🤝' }
        ];

        channels.forEach(channel => {
            const data = this.analyticsData.salesOrders[channel.key];
            const growth = data.ly > 0 ? ((data.ty - data.ly) / data.ly * 100) : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-channel">
                    <span class="channel-icon">${channel.icon}</span>
                    <strong>${channel.name}</strong>
                </td>
                <td class="col-orders-ty">${data.ty.toLocaleString()}</td>
                <td class="col-orders-ly">${data.ly.toLocaleString()}</td>
                <td class="col-orders-growth ${growth >= 0 ? 'growth-positive' : 'growth-negative'}">${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%</td>
                <td class="col-conversion">${data.conversionRate.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Create All Charts for A-F
    createAllCharts() {
        // A. TY vs LY - Side by Side Bar Chart
        this.createTYvsLYChart();
        
        // B. TY vs Target - Progress Bar/Gauge Chart
        this.createTargetAchievementChart();
        
        // C. Units Sold - Doughnut Chart
        this.createUnitsChart();
        
        // D. Customer Count - Stacked Bar Chart
        this.createCustomerChart();
        
        // E. Transaction Size - Line Chart
        this.createTransactionSizeChart();
        
        // F. Sales Orders - Radar Chart
        this.createSalesOrdersChart();
        
        // Create additional pie charts
        this.createPieCharts();
    }

    // A. TY vs LY - Side by Side Bar Chart
    createTYvsLYChart() {
        const ctx = document.getElementById('tyVsLyChart');
        if (!ctx) return;

        if (this.charts['tyVsLyChart']) {
            this.charts['tyVsLyChart'].destroy();
        }

        const channelData = this.analyticsData.salesByChannel;
        // Only RETAIL and SUBDEALER
        const channels = ['Retail', 'Subdealer'];
        
        const tyData = [
            channelData.retail.ty.revenue / 1000000,
            channelData.subdealer.ty.revenue / 1000000
        ];
        
        const lyData = [
            channelData.retail.ly.revenue / 1000000,
            channelData.subdealer.ly.revenue / 1000000
        ];

        this.charts['tyVsLyChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: channels,
                datasets: [{
                    label: 'This Year',
                    data: tyData,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                }, {
                    label: 'Last Year',
                    data: lyData,
                    backgroundColor: '#95a5a6',
                    borderColor: '#7f8c8d',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { font: { size: 10 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ₱${context.parsed.y.toFixed(1)}M`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue (Millions ₱)'
                        },
                        ticks: { font: { size: 9 } }
                    },
                    x: {
                        ticks: { font: { size: 9 } }
                    }
                }
            }
        });
    }

    // B. TY vs Target - Horizontal Bar Chart
    createTargetAchievementChart() {
        const ctx = document.getElementById('targetAchievementChart');
        if (!ctx) return;

        if (this.charts['targetAchievementChart']) {
            this.charts['targetAchievementChart'].destroy();
        }

        const targetData = this.analyticsData.targetAnalysis;
        // Only RETAIL and SUBDEALER
        const channels = ['Retail', 'Subdealer'];
        const achievements = [
            targetData.retail.achievement,
            targetData.subdealer.achievement
        ];

        const colors = achievements.map(achievement => {
            if (achievement >= 100) return '#27ae60';
            if (achievement >= 80) return '#f39c12';
            return '#e74c3c';
        });

        this.charts['targetAchievementChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: channels,
                datasets: [{
                    label: 'Achievement %',
                    data: achievements,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Achievement: ${context.parsed.x.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 120,
                        title: {
                            display: true,
                            text: 'Achievement %'
                        },
                        ticks: { font: { size: 9 } }
                    },
                    y: {
                        ticks: { font: { size: 9 } }
                    }
                }
            }
        });
    }

    // C. Units Sold - Doughnut Chart
    createUnitsChart() {
        const ctx = document.getElementById('unitsChart');
        if (!ctx) return;

        if (this.charts['unitsChart']) {
            this.charts['unitsChart'].destroy();
        }

        const channelData = this.analyticsData.salesByChannel;
        // Only RETAIL and SUBDEALER
        const unitsData = [
            { label: 'Retail', value: channelData.retail.ty.units },
            { label: 'Subdealer', value: channelData.subdealer.ty.units }
        ];

        this.charts['unitsChart'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: unitsData.map(item => item.label),
                datasets: [{
                    data: unitsData.map(item => item.value),
                    backgroundColor: ['#27ae60', '#3498db'],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 10 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} units (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // D. Customer Count - Stacked Bar Chart
    createCustomerChart() {
        const ctx = document.getElementById('customerChart');
        if (!ctx) return;

        if (this.charts['customerChart']) {
            this.charts['customerChart'].destroy();
        }

        const customerData = this.analyticsData.customerCount;
        // Only RETAIL and SUBDEALER
        const channels = ['Retail', 'Subdealer'];
        
        const tyCustomers = [
            customerData.retail.ty,
            customerData.subdealer.ty
        ];
        
        const lyCustomers = [
            customerData.retail.ly,
            customerData.subdealer.ly
        ];

        this.charts['customerChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: channels,
                datasets: [{
                    label: 'This Year',
                    data: tyCustomers,
                    backgroundColor: '#16a085',
                    borderColor: '#138d75',
                    borderWidth: 1
                }, {
                    label: 'Last Year',
                    data: lyCustomers,
                    backgroundColor: '#85c1e9',
                    borderColor: '#5dade2',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { font: { size: 10 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Customer Count'
                        },
                        ticks: { font: { size: 9 } }
                    },
                    x: {
                        ticks: { font: { size: 9 } }
                    }
                }
            }
        });
    }

    // E. Transaction Size - Line Chart
    createTransactionSizeChart() {
        const ctx = document.getElementById('transactionSizeChart');
        if (!ctx) return;

        if (this.charts['transactionSizeChart']) {
            this.charts['transactionSizeChart'].destroy();
        }

        const transactionData = this.analyticsData.transactionSize;
        // Only RETAIL and SUBDEALER
        const channels = ['Retail', 'Subdealer'];
        
        const tyValues = [
            transactionData.retail.ty / 1000,
            transactionData.subdealer.ty / 1000
        ];
        
        const lyValues = [
            transactionData.retail.ly / 1000,
            transactionData.subdealer.ly / 1000
        ];

        this.charts['transactionSizeChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: channels,
                datasets: [{
                    label: 'This Year',
                    data: tyValues,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Last Year',
                    data: lyValues,
                    borderColor: '#95a5a6',
                    backgroundColor: 'rgba(149, 165, 166, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { font: { size: 10 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ₱${context.parsed.y.toFixed(0)}K`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Average Order Value (₱K)'
                        },
                        ticks: { font: { size: 9 } }
                    },
                    x: {
                        ticks: { font: { size: 9 } }
                    }
                }
            }
        });
    }

    // F. Sales Orders - Radar Chart
    createSalesOrdersChart() {
        const ctx = document.getElementById('salesOrdersChart');
        if (!ctx) return;

        if (this.charts['salesOrdersChart']) {
            this.charts['salesOrdersChart'].destroy();
        }

        const orderData = this.analyticsData.salesOrders;
        // Only RETAIL and SUBDEALER
        const channels = ['Retail', 'Subdealer'];
        
        // Normalize data for radar chart (scale to 0-100)
        const tyOrders = [
            orderData.retail.ty,
            orderData.subdealer.ty
        ];
        
        const maxOrders = Math.max(...tyOrders);
        const normalizedOrders = tyOrders.map(val => (val / maxOrders) * 100);

        const conversionRates = [
            orderData.retail.conversionRate,
            orderData.subdealer.conversionRate
        ];

        this.charts['salesOrdersChart'] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: channels,
                datasets: [{
                    label: 'Orders (Normalized)',
                    data: normalizedOrders,
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#9b59b6',
                    pointBorderColor: '#8e44ad',
                    pointRadius: 4
                }, {
                    label: 'Conversion Rate %',
                    data: conversionRates,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#f39c12',
                    pointBorderColor: '#e67e22',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { font: { size: 10 } }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { 
                            display: false,
                            font: { size: 8 }
                        },
                        pointLabels: {
                            font: { size: 9 }
                        }
                    }
                }
            }
        });
    }

    // Create additional pie charts
    createPieCharts() {
        const channelData = this.analyticsData.salesByChannel;

        // This Year Sales by Channel - Only RETAIL and SUBDEALER
        const tyData = [
            { label: 'Retail', value: channelData.retail.ty.revenue },
            { label: 'Subdealer', value: channelData.subdealer.ty.revenue }
        ];

        // Last Year Sales by Channel - Only RETAIL and SUBDEALER
        const lyData = [
            { label: 'Retail', value: channelData.retail.ly.revenue },
            { label: 'Subdealer', value: channelData.subdealer.ly.revenue }
        ];

        // Growth Comparison (showing absolute growth) - Only RETAIL and SUBDEALER
        const growthData = [
            { 
                label: 'Retail', 
                value: Math.abs(channelData.retail.ty.revenue - channelData.retail.ly.revenue)
            },
            { 
                label: 'Subdealer', 
                value: Math.abs(channelData.subdealer.ty.revenue - channelData.subdealer.ly.revenue)
            }
        ];

        // Market Share (TY units) - Only RETAIL and SUBDEALER
        const marketShareData = [
            { label: 'Retail', value: channelData.retail.ty.units },
            { label: 'Subdealer', value: channelData.subdealer.ty.units }
        ];

        // Create charts
        this.createPieChart('salesByChannelTYChart', {
            title: 'Sales by Channel (This Year)',
            data: tyData,
            colors: ['#27ae60', '#3498db']
        });

        this.createPieChart('salesByChannelLYChart', {
            title: 'Sales by Channel (Last Year)',
            data: lyData,
            colors: ['#2ecc71', '#5dade2']
        });

        this.createPieChart('growthComparisonChart', {
            title: 'Revenue Growth',
            data: growthData,
            colors: ['#e74c3c', '#9b59b6']
        });

        this.createPieChart('marketShareChart', {
            title: 'Market Share',
            data: marketShareData,
            colors: ['#34495e', '#16a085']
        });
    }

    createPieChart(canvasId, config) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const labels = config.data.map(item => item.label);
        const values = config.data.map(item => item.value);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: config.colors,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 10,
                                family: 'Segoe UI'
                            },
                            color: '#2c3e50'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#34495e',
                        borderWidth: 1,
                        titleFont: {
                            size: 11,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 10
                        },
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                
                                if (canvasId.includes('marketShare')) {
                                    return `${label}: ${value} units (${percentage}%)`;
                                } else {
                                    return `${label}: ₱${value.toLocaleString()} (${percentage}%)`;
                                }
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
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

// Global functions
function refreshData() {
    if (window.salesAnalytics) {
        window.salesAnalytics.loadAnalyticsData();
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        window.location.href = 'index.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.salesAnalytics = new SalesAnalytics();
});