// Complete Sales Agent Performance Analytics - All Sections

class AgentPerformanceAnalytics {
    constructor() {
        this.currentPeriod = 'month';
        this.currentChannel = 'all';
        this.analyticsData = {};
        this.charts = {};
        this.init();
    }

    async init() {
        this.updateDateTime();
        this.setupEventListeners();
        await this.loadAnalyticsData();
        this.updateStatus('Agent performance loaded successfully');
    }

    setupEventListeners() {
        const periodFilter = document.getElementById('periodFilter');
        const channelFilter = document.getElementById('channelFilter');
        
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.loadAnalyticsData();
            });
        }

        if (channelFilter) {
            channelFilter.addEventListener('change', (e) => {
                this.currentChannel = e.target.value;
                this.loadAnalyticsData();
            });
        }
    }

    async loadAnalyticsData() {
        try {
            this.updateStatus('Loading agent performance data...');
            
            // Generate sample agent data
            this.analyticsData = this.generateAgentData();
            
            // Populate all tables
            this.populateTYvsLYTable();
            this.populateAchievementRateTable();
            this.populateUnitsSoldTable();
            this.populateSalesOrdersTable();
            this.populateTransactionSizeTable();
            this.populateTop10Table();
            
            // Create all charts
            this.createTYvsLYChart();
            this.createAchievementRateChart();
            this.createUnitsSoldChart();
            this.createSalesOrdersChart();
            this.createTransactionSizeChart();
            this.createPerformanceDistributionChart();
            
            this.updateStatus('Agent performance loaded successfully');
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Error loading agent performance data:', error);
            this.updateStatus('Error loading agent performance data');
        }
    }

    generateAgentData() {
        // Period multipliers
        const periodMultipliers = {
            today: 0.03,
            week: 0.25,
            month: 1,
            quarter: 3,
            year: 12
        };

        const multiplier = periodMultipliers[this.currentPeriod] || 1;

        // Sales agents
        const agents = [
            { id: 'SA001', name: 'Mike', channel: 'retail', avatar: '👨‍💼' },
            { id: 'SA002', name: 'Thomas', channel: 'retail', avatar: '👨‍💼'},
            { id: 'SA003', name: 'Mav', channel: 'subdealer', avatar: '👨‍💼'},
            { id: 'SA004', name: 'Radjid', channel: 'subdealer', avatar: '👨‍💼'}
        ];

        // Generate performance data for each agent
        const agentPerformance = agents.map(agent => {
            // Base performance varies by tier and channel
            let baseUnits, baseRevenue, baseTarget, baseOrders;
            
            if (agent.tier === 'Manager') {
                baseUnits = agent.channel === 'retail' ? 45 : 35;
                baseRevenue = agent.channel === 'retail' ? 1800000 : 1050000;
                baseTarget = agent.channel === 'retail' ? 2000000 : 1200000;
                baseOrders = agent.channel === 'retail' ? 50 : 40;
            } else { // Senior
                baseUnits = agent.channel === 'retail' ? 35 : 25;
                baseRevenue = agent.channel === 'retail' ? 1400000 : 750000;
                baseTarget = agent.channel === 'retail' ? 1500000 : 900000;
                baseOrders = agent.channel === 'retail' ? 40 : 30;
            }

            // Add realistic variation
            const variation = 0.8 + (Math.random() * 0.4);
            const lyVariation = 0.85 + (Math.random() * 0.3);

            const tyUnits = Math.floor(baseUnits * multiplier * variation);
            const tyRevenue = Math.floor(baseRevenue * multiplier * variation);
            const lyUnits = Math.floor(baseUnits * multiplier * lyVariation);
            const lyRevenue = Math.floor(baseRevenue * multiplier * lyVariation);
            const target = Math.floor(baseTarget * multiplier);
            const tyOrders = Math.floor(baseOrders * multiplier * variation);
            const lyOrders = Math.floor(baseOrders * multiplier * lyVariation);

            const unitsGrowth = lyUnits > 0 ? ((tyUnits - lyUnits) / lyUnits * 100) : 0;
            const revenueGrowth = lyRevenue > 0 ? ((tyRevenue - lyRevenue) / lyRevenue * 100) : 0;
            const ordersGrowth = lyOrders > 0 ? ((tyOrders - lyOrders) / lyOrders * 100) : 0;
            const achievement = target > 0 ? (tyRevenue / target * 100) : 0;
            const avgOrderTY = tyOrders > 0 ? tyRevenue / tyOrders : 0;
            const avgOrderLY = lyOrders > 0 ? lyRevenue / lyOrders : 0;
            const conversionRate = 60 + Math.random() * 30; // 60-90%

            return {
                ...agent,
                performance: {
                    ty: { units: tyUnits, revenue: tyRevenue, orders: tyOrders },
                    ly: { units: lyUnits, revenue: lyRevenue, orders: lyOrders },
                    target: target,
                    unitsGrowth: unitsGrowth,
                    revenueGrowth: revenueGrowth,
                    ordersGrowth: ordersGrowth,
                    achievement: achievement,
                    avgOrderTY: avgOrderTY,
                    avgOrderLY: avgOrderLY,
                    conversionRate: conversionRate
                }
            };
        });

        // Filter by channel if specified
        let filteredAgents = agentPerformance;
        if (this.currentChannel !== 'all') {
            filteredAgents = agentPerformance.filter(agent => agent.channel === this.currentChannel);
        }

        // Sort by TY revenue for ranking
        filteredAgents.sort((a, b) => b.performance.ty.revenue - a.performance.ty.revenue);

        // Add ranks
        filteredAgents.forEach((agent, index) => {
            agent.performance.rank = index + 1;
        });

        return { agents: filteredAgents };
    }

    // A. TY vs LY Table
    populateTYvsLYTable() {
        const tbody = document.getElementById('agentTYvsLYTableBody');
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

        const getRankClass = (rank) => {
            if (rank === 1) return 'rank-gold';
            if (rank === 2) return 'rank-silver';
            if (rank === 3) return 'rank-bronze';
            return 'rank-normal';
        };

        this.analyticsData.agents.forEach(agent => {
            const perf = agent.performance;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-agent">
                    <div class="agent-info">
                        <span class="agent-avatar">${agent.avatar}</span>
                        <div class="agent-details">
                            <strong>${agent.name}</strong>
                            <small>${agent.tier} • ${agent.id}</small>
                        </div>
                    </div>
                </td>
                <td class="col-channel-filter">
                    <span class="channel-badge ${agent.channel}">${agent.channel.toUpperCase()}</span>
                </td>
                <td class="col-units">${perf.ty.units.toLocaleString()}</td>
                <td class="col-revenue">${formatCurrency(perf.ty.revenue)}</td>
                <td class="col-units">${perf.ly.units.toLocaleString()}</td>
                <td class="col-revenue">${formatCurrency(perf.ly.revenue)}</td>
                <td class="col-growth ${getGrowthClass(perf.unitsGrowth)}">${formatGrowth(perf.unitsGrowth)}</td>
                <td class="col-growth ${getGrowthClass(perf.revenueGrowth)}">${formatGrowth(perf.revenueGrowth)}</td>
                <td class="col-rank ${getRankClass(perf.rank)}">#${perf.rank}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // B. Achievement Rate Table
    populateAchievementRateTable() {
        const tbody = document.getElementById('achievementRateTableBody');
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

        this.analyticsData.agents.forEach(agent => {
            const perf = agent.performance;
            const variance = perf.ty.revenue - perf.target;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-agent">
                    <div class="agent-info">
                        <span class="agent-avatar">${agent.avatar}</span>
                        <div class="agent-details">
                            <strong>${agent.name}</strong>
                            <small>${agent.tier} • ${agent.id}</small>
                        </div>
                    </div>
                </td>
                <td class="col-channel-filter">
                    <span class="channel-badge ${agent.channel}">${agent.channel.toUpperCase()}</span>
                </td>
                <td class="col-actual">${formatCurrency(perf.ty.revenue)}</td>
                <td class="col-target">${formatCurrency(perf.target)}</td>
                <td class="col-variance ${variance >= 0 ? 'growth-positive' : 'growth-negative'}">${formatCurrency(Math.abs(variance))}</td>
                <td class="col-achievement ${getAchievementClass(perf.achievement)}">${perf.achievement.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    // C. Units Sold Table
    populateUnitsSoldTable() {
        const tbody = document.getElementById('unitsSoldTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const getTrendIcon = (growth) => {
            if (growth > 5) return '📈';
            if (growth < -5) return '📉';
            return '📊';
        };

        const getGrowthClass = (growth) => {
            if (growth > 0) return 'growth-positive';
            if (growth < 0) return 'growth-negative';
            return 'growth-neutral';
        };

        this.analyticsData.agents.forEach(agent => {
            const perf = agent.performance;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-agent">
                    <div class="agent-info">
                        <span class="agent-avatar">${agent.avatar}</span>
                        <div class="agent-details">
                            <strong>${agent.name}</strong>
                            <small>${agent.tier} • ${agent.id}</small>
                        </div>
                    </div>
                </td>
                <td class="col-channel-filter">
                    <span class="channel-badge ${agent.channel}">${agent.channel.toUpperCase()}</span>
                </td>
                <td class="col-units-ty">${perf.ty.units.toLocaleString()}</td>
                <td class="col-units-ly">${perf.ly.units.toLocaleString()}</td>
                <td class="col-units-growth ${getGrowthClass(perf.unitsGrowth)}">${perf.unitsGrowth >= 0 ? '+' : ''}${perf.unitsGrowth.toFixed(1)}%</td>
                <td class="col-units-trend">${getTrendIcon(perf.unitsGrowth)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // D. Sales Orders Table
    populateSalesOrdersTable() {
        const tbody = document.getElementById('salesOrdersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const getGrowthClass = (growth) => {
            if (growth > 0) return 'growth-positive';
            if (growth < 0) return 'growth-negative';
            return 'growth-neutral';
        };

        this.analyticsData.agents.forEach(agent => {
            const perf = agent.performance;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-agent">
                    <div class="agent-info">
                        <span class="agent-avatar">${agent.avatar}</span>
                        <div class="agent-details">
                            <strong>${agent.name}</strong>
                            <small>${agent.tier} • ${agent.id}</small>
                        </div>
                    </div>
                </td>
                <td class="col-channel-filter">
                    <span class="channel-badge ${agent.channel}">${agent.channel.toUpperCase()}</span>
                </td>
                <td class="col-orders-ty">${perf.ty.orders.toLocaleString()}</td>
                <td class="col-orders-ly">${perf.ly.orders.toLocaleString()}</td>
                <td class="col-orders-growth ${getGrowthClass(perf.ordersGrowth)}">${perf.ordersGrowth >= 0 ? '+' : ''}${perf.ordersGrowth.toFixed(1)}%</td>
                <td class="col-conversion">${perf.conversionRate.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    // E. Transaction Size Table
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

        this.analyticsData.agents.forEach(agent => {
            const perf = agent.performance;
            const change = perf.avgOrderTY - perf.avgOrderLY;
            const changePercent = perf.avgOrderLY > 0 ? (change / perf.avgOrderLY * 100) : 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-agent">
                    <div class="agent-info">
                        <span class="agent-avatar">${agent.avatar}</span>
                        <div class="agent-details">
                            <strong>${agent.name}</strong>
                            <small>${agent.tier} • ${agent.id}</small>
                        </div>
                    </div>
                </td>
                <td class="col-channel-filter">
                    <span class="channel-badge ${agent.channel}">${agent.channel.toUpperCase()}</span>
                </td>
                <td class="col-avg-order-ty">${formatCurrency(perf.avgOrderTY)}</td>
                <td class="col-avg-order-ly">${formatCurrency(perf.avgOrderLY)}</td>
                <td class="col-order-change ${changePercent >= 0 ? 'growth-positive' : 'growth-negative'}">${formatCurrency(Math.abs(change))}</td>
                <td class="col-order-trend">${getTrendIcon(change)} ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    // F. Top 10 Table
    populateTop10Table() {
        const tbody = document.getElementById('top10TableBody');
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

        const getAchievementClass = (achievement) => {
            if (achievement >= 100) return 'achievement-good';
            if (achievement >= 80) return 'achievement-fair';
            return 'achievement-poor';
        };

        // Show all agents (up to 10)
        const topAgents = this.analyticsData.agents.slice(0, 10);

        topAgents.forEach(agent => {
            const perf = agent.performance;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-rank ${getRankClass(perf.rank)}">#${perf.rank}</td>
                <td class="col-agent">
                    <div class="agent-info">
                        <span class="agent-avatar">${agent.avatar}</span>
                        <div class="agent-details">
                            <strong>${agent.name}</strong>
                            <small>${agent.tier} • ${agent.id}</small>
                        </div>
                    </div>
                </td>
                <td class="col-channel-filter">
                    <span class="channel-badge ${agent.channel}">${agent.channel.toUpperCase()}</span>
                </td>
                <td class="col-revenue">${formatCurrency(perf.ty.revenue)}</td>
                <td class="col-units">${perf.ty.units.toLocaleString()}</td>
                <td class="col-growth ${perf.revenueGrowth >= 0 ? 'growth-positive' : 'growth-negative'}">${perf.revenueGrowth >= 0 ? '+' : ''}${perf.revenueGrowth.toFixed(1)}%</td>
                <td class="col-achievement ${getAchievementClass(perf.achievement)}">${perf.achievement.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Charts
    createTYvsLYChart() {
        const ctx = document.getElementById('agentTYvsLYChart');
        if (!ctx) return;

        if (this.charts['agentTYvsLYChart']) {
            this.charts['agentTYvsLYChart'].destroy();
        }

        const agents = this.analyticsData.agents;
        const labels = agents.map(agent => agent.name);
        
        const tyData = agents.map(agent => agent.performance.ty.revenue / 1000000);
        const lyData = agents.map(agent => agent.performance.ly.revenue / 1000000);

        this.charts['agentTYvsLYChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
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
                        labels: { font: { size: 12 } }
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
                            text: 'Revenue (Millions ₱)',
                            font: { size: 12 }
                        },
                        ticks: { font: { size: 10 } }
                    },
                    x: {
                        ticks: { 
                            font: { size: 10 },
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    }

    createAchievementRateChart() {
        const ctx = document.getElementById('achievementRateChart');
        if (!ctx) return;

        if (this.charts['achievementRateChart']) {
            this.charts['achievementRateChart'].destroy();
        }

        const agents = this.analyticsData.agents;
        const labels = agents.map(agent => agent.name);
        const achievements = agents.map(agent => agent.performance.achievement);

        const colors = achievements.map(achievement => {
            if (achievement >= 100) return '#27ae60';
            if (achievement >= 80) return '#f39c12';
            return '#e74c3c';
        });

        this.charts['achievementRateChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
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

    createUnitsSoldChart() {
        const ctx = document.getElementById('unitsSoldChart');
        if (!ctx) return;

        if (this.charts['unitsSoldChart']) {
            this.charts['unitsSoldChart'].destroy();
        }

        const agents = this.analyticsData.agents;
        const labels = agents.map(agent => agent.name);
        const units = agents.map(agent => agent.performance.ty.units);

        this.charts['unitsSoldChart'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: units,
                    backgroundColor: ['#27ae60', '#3498db', '#9b59b6', '#e67e22'],
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

    createSalesOrdersChart() {
        const ctx = document.getElementById('salesOrdersChart');
        if (!ctx) return;

        if (this.charts['salesOrdersChart']) {
            this.charts['salesOrdersChart'].destroy();
        }

        const agents = this.analyticsData.agents;
        const labels = agents.map(agent => agent.name);
        
        const tyOrders = agents.map(agent => agent.performance.ty.orders);
        const lyOrders = agents.map(agent => agent.performance.ly.orders);

        this.charts['salesOrdersChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'This Year',
                    data: tyOrders,
                    backgroundColor: '#16a085',
                    borderColor: '#138d75',
                    borderWidth: 1
                }, {
                    label: 'Last Year',
                    data: lyOrders,
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
                            text: 'Number of Orders'
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

    createTransactionSizeChart() {
        const ctx = document.getElementById('transactionSizeChart');
        if (!ctx) return;

        if (this.charts['transactionSizeChart']) {
            this.charts['transactionSizeChart'].destroy();
        }

        const agents = this.analyticsData.agents;
        const labels = agents.map(agent => agent.name);
        
        const tyValues = agents.map(agent => agent.performance.avgOrderTY / 1000);
        const lyValues = agents.map(agent => agent.performance.avgOrderLY / 1000);

        this.charts['transactionSizeChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
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

    createPerformanceDistributionChart() {
        const ctx = document.getElementById('performanceDistributionChart');
        if (!ctx) return;

        if (this.charts['performanceDistributionChart']) {
            this.charts['performanceDistributionChart'].destroy();
        }

        const agents = this.analyticsData.agents;
        const labels = agents.map(agent => agent.name);
        const revenues = agents.map(agent => agent.performance.ty.revenue / 1000000);

        // Create color gradient based on performance
        const maxRevenue = Math.max(...revenues);
        const colors = revenues.map(revenue => {
            const intensity = revenue / maxRevenue;
            const red = Math.floor(255 * (1 - intensity));
            const green = Math.floor(255 * intensity);
            return `rgba(${red}, ${green}, 50, 0.8)`;
        });

        this.charts['performanceDistributionChart'] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: revenues,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            font: { size: 10 },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ₱${context.parsed.toFixed(1)}M (${percentage}%)`;
                            }
                        }
                    }
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
    if (window.agentPerformanceAnalytics) {
        window.agentPerformanceAnalytics.loadAnalyticsData();
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        window.location.href = 'index.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.agentPerformanceAnalytics = new AgentPerformanceAnalytics();
});