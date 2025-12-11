document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'district_data.csv'; // Relative path
    let districtData = [];
    
    // DOM Elements
    const searchInput = document.getElementById('districtSearch');
    const searchResults = document.getElementById('searchResults');
    const dashboard = document.getElementById('dashboard');
    const districtNameEl = document.getElementById('districtName');
    const tableBody = document.getElementById('tableBody');
    const chartCanvas = document.getElementById('absenteeChart');
    const loadingEl = document.getElementById('loading');

    let chartInstance = null;

    // Define School Years mapping (labels for chart/table) based on CSV columns
    // CSV headers: clean_name,20242025,20232024,20222023,20212022,20202021,20192020
    const yearMapping = [
        { key: '20242025', label: '2024-2025' },
        { key: '20232024', label: '2023-2024' },
        { key: '20222023', label: '2022-2023' },
        { key: '20212022', label: '2021-2022' },
        { key: '20202021', label: '2020-2021' },
        { key: '20192020', label: '2019-2020' }
    ];

    // Initialize
    init();

    function init() {
        showLoading(true);
        Papa.parse(csvUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                districtData = results.data;
                showLoading(false);
                // console.log('Parsed Data:', districtData); // Debug
            },
            error: (err) => {
                console.error('Error parsing CSV:', err);
                loadingEl.textContent = 'Error loading data. Please try refreshing.';
            }
        });
    }

    // Search Handler
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        const matches = districtData.filter(d => 
            d.clean_name && d.clean_name.toLowerCase().includes(query)
        );

        renderSearchResults(matches);
    });

    // Close search results if clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.classList.add('hidden');
        }
    });

    function renderSearchResults(matches) {
        searchResults.innerHTML = '';
        
        if (matches.length === 0) {
            const noResult = document.createElement('div');
            noResult.className = 'search-result-item';
            noResult.textContent = 'No districts found.';
            searchResults.appendChild(noResult);
        } else {
            matches.forEach(district => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.textContent = district.clean_name;
                item.addEventListener('click', () => {
                    selectDistrict(district);
                    searchResults.classList.add('hidden');
                    searchInput.value = district.clean_name;
                });
                searchResults.appendChild(item);
            });
        }
        
        searchResults.classList.remove('hidden');
    }

    function selectDistrict(district) {
        dashboard.classList.remove('hidden');
        districtNameEl.textContent = district.clean_name;

        // Prepare Data for Chart and Table
        // We want chronological order on the X-axis (oldest -> newest) for the line chart usually?
        // Let's reverse the array so 2019 is left and 2024 is right.
        const sortedYears = [...yearMapping].reverse(); 
        
        const labels = sortedYears.map(y => y.label);
        const values = sortedYears.map(y => {
            const val = district[y.key];
            return val === 'NA' || val === '' ? null : parseFloat(val);
        });

        updateChart(labels, values, district.clean_name);
        updateTable(sortedYears, district);
    }

    function updateChart(labels, data, labelName) {
        if (chartInstance) {
            chartInstance.destroy();
        }

        const ctx = chartCanvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Chronic Absenteeism Rate (%)',
                    data: data,
                    borderColor: '#2563eb', // primary color
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.3 // smooth curves
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y + '%';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percent Absent'
                        },
                        grid: {
                            color: '#e2e8f0'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    function updateTable(years, district) {
        tableBody.innerHTML = '';
        // Display newest first in table? Or match chart? Usually tables read better newest to oldest for "history".
        // Let's stick to newest-first for the table as it's often more relevant.
        // The 'yearMapping' is naturally Newest -> Oldest.
        
        yearMapping.forEach(y => {
            const row = document.createElement('tr');
            const yearCell = document.createElement('td');
            const valCell = document.createElement('td');

            yearCell.textContent = y.label;
            const val = district[y.key];
            valCell.textContent = (val === 'NA' || val === '') ? 'N/A' : val + '%';

            row.appendChild(yearCell);
            row.appendChild(valCell);
            tableBody.appendChild(row);
        });
    }

    function showLoading(isLoading) {
        if (isLoading) {
            loadingEl.classList.remove('hidden');
        } else {
            loadingEl.classList.add('hidden');
        }
    }
});
