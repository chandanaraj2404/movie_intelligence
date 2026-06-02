document.addEventListener('DOMContentLoaded', async () => {
    // Shared chart options for premium dark mode aesthetic
    Chart.defaults.color = '#9ba1b0';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
    Chart.defaults.plugins.tooltip.titleColor = '#fff';
    Chart.defaults.plugins.tooltip.bodyColor = '#cbd5e1';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    
    const gridOptions = {
        color: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'transparent'
    };

    // Brand Colors
    const colors = {
        primary: '#6366f1',
        primaryGlow: 'rgba(99, 102, 241, 0.2)',
        secondary: '#ec4899',
        secondaryGlow: 'rgba(236, 72, 153, 0.2)',
        tertiary: '#14b8a6',
        tertiaryGlow: 'rgba(20, 184, 166, 0.2)',
        palette: ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#10b981', '#14b8a6']
    };

    let allMovies = [];
    let charts = {};

    // Get filter elements
    const genreFilter = document.getElementById('genreFilter');
    const yearStart = document.getElementById('yearStart');
    const yearEnd = document.getElementById('yearEnd');
    const ratingFilter = document.getElementById('ratingFilter');
    const ratingVal = document.getElementById('ratingVal');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const insightsGrid = document.getElementById('insights-grid');

    try {
        const response = await fetch('src/assets/raw_movie_data.json');
        if (!response.ok) throw new Error('Network response was not ok');
        allMovies = await response.json();

        // 1. Initialize Filters
        initFilters();

        // 2. Initial Render
        updateDashboard();

        // 3. Set up event listeners
        genreFilter.addEventListener('change', updateDashboard);
        
        yearStart.addEventListener('change', () => {
            // Ensure yearEnd is not less than yearStart
            if (parseInt(yearEnd.value) < parseInt(yearStart.value)) {
                yearEnd.value = yearStart.value;
            }
            updateDashboard();
        });
        
        yearEnd.addEventListener('change', () => {
            if (parseInt(yearStart.value) > parseInt(yearEnd.value)) {
                yearStart.value = yearEnd.value;
            }
            updateDashboard();
        });
        
        ratingFilter.addEventListener('input', (e) => {
            ratingVal.textContent = parseFloat(e.target.value).toFixed(1);
            updateDashboard();
        });
        
        resetFiltersBtn.addEventListener('click', () => {
            resetFilters();
            updateDashboard();
        });

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        insightsGrid.innerHTML = `<div style="color:var(--accent-2); grid-column: 1/-1; text-align: center; padding: 2rem;">Error loading data: Run python script to generate data first.</div>`;
    }

    function initFilters() {
        // Collect genres and years
        const genresSet = new Set();
        const yearsSet = new Set();

        allMovies.forEach(m => {
            if (m.genres) {
                m.genres.forEach(g => genresSet.add(g));
            }
            if (m.year) {
                yearsSet.add(m.year);
            }
        });

        // Populate Genres
        const sortedGenres = Array.from(genresSet).sort();
        genreFilter.innerHTML = '<option value="all">All Genres</option>';
        sortedGenres.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g;
            opt.textContent = g;
            genreFilter.appendChild(opt);
        });

        // Populate Years
        const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
        yearStart.innerHTML = '';
        yearEnd.innerHTML = '';
        sortedYears.forEach(y => {
            const optStart = document.createElement('option');
            optStart.value = y;
            optStart.textContent = y;
            yearStart.appendChild(optStart);

            const optEnd = document.createElement('option');
            optEnd.value = y;
            optEnd.textContent = y;
            yearEnd.appendChild(optEnd);
        });

        // Set defaults
        resetFilters();
    }

    function resetFilters() {
        genreFilter.value = 'all';
        if (yearStart.options.length > 0) {
            yearStart.value = yearStart.options[0].value;
            yearEnd.value = yearEnd.options[yearEnd.options.length - 1].value;
        }
        ratingFilter.value = 0;
        ratingVal.textContent = '0.0';
    }

    function updateDashboard() {
        const selectedGenre = genreFilter.value;
        const startY = parseInt(yearStart.value) || 1920;
        const endY = parseInt(yearEnd.value) || 2020;
        const minRating = parseFloat(ratingFilter.value) || 0;

        // Apply filters
        const filtered = allMovies.filter(m => {
            const matchesGenre = selectedGenre === 'all' || (m.genres && m.genres.includes(selectedGenre));
            const matchesYear = m.year >= startY && m.year <= endY;
            const matchesRating = m.rating >= minRating;
            return matchesGenre && matchesYear && matchesRating;
        });

        // Render dynamic Key Insights
        renderInsights(filtered);

        // Render Charts
        renderTopRatedChart(filtered);
        renderGenresChart(filtered);
        renderReleaseTrendChart(filtered, startY, endY);
        renderRatingDistChart(filtered);
        renderScatterChart(filtered);
    }

    function renderInsights(filtered) {
        if (filtered.length === 0) {
            insightsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No movies match the selected filters. Try broadening your criteria.
                </div>`;
            return;
        }

        // Calculate average rating
        const avgRating = (filtered.reduce((sum, m) => sum + m.rating, 0) / filtered.length).toFixed(2);

        // Find top genre in current selection
        const genreCounts = {};
        filtered.forEach(m => {
            if (m.genres) {
                m.genres.forEach(g => {
                    genreCounts[g] = (genreCounts[g] || 0) + 1;
                });
            }
        });
        let topGenre = 'N/A';
        let topGenreCount = 0;
        Object.entries(genreCounts).forEach(([g, count]) => {
            if (count > topGenreCount) {
                topGenre = g;
                topGenreCount = count;
            }
        });

        // Find max grossing movie
        let maxGrossing = null;
        filtered.forEach(m => {
            if (m.revenue && (!maxGrossing || m.revenue > maxGrossing.revenue)) {
                maxGrossing = m;
            }
        });
        const maxGrossingStr = maxGrossing 
            ? `${maxGrossing.title} ($${(maxGrossing.revenue/1000000).toFixed(0)}M)`
            : 'N/A';

        // Find peak release year
        const yearCounts = {};
        filtered.forEach(m => {
            yearCounts[m.year] = (yearCounts[m.year] || 0) + 1;
        });
        let peakYear = 'N/A';
        let peakYearCount = 0;
        Object.entries(yearCounts).forEach(([y, count]) => {
            if (count > peakYearCount) {
                peakYear = y;
                peakYearCount = count;
            }
        });

        insightsGrid.innerHTML = `
            <div class="insight-item">
                <span class="insight-label">Selection Stats</span>
                <p>Showing <strong>${filtered.length.toLocaleString()}</strong> movies with an average rating of <strong>${avgRating} ⭐</strong>.</p>
            </div>
            <div class="insight-item">
                <span class="insight-label">Dominant Genre</span>
                <p><strong>${topGenre}</strong> leads the selected group, appearing in <strong>${topGenreCount.toLocaleString()}</strong> movies.</p>
            </div>
            <div class="insight-item">
                <span class="insight-label">Financial Leader</span>
                <p>The highest grossing movie in this selection is <strong>${maxGrossingStr}</strong>.</p>
            </div>
            <div class="insight-item">
                <span class="insight-label">Peak Activity</span>
                <p>The year <strong>${peakYear}</strong> saw the highest frequency of releases with <strong>${peakYearCount}</strong> matches.</p>
            </div>
        `;
    }

    // Chart 1: Top Rated Movies Chart
    function renderTopRatedChart(filtered) {
        const canvasId = 'topRatedChart';
        if (charts[canvasId]) charts[canvasId].destroy();

        // Filter out movies with too few votes, unless we don't have enough
        let topMoviesEligible = filtered.filter(m => m.votes >= 1000);
        if (topMoviesEligible.length < 10) topMoviesEligible = filtered.filter(m => m.votes >= 500);
        if (topMoviesEligible.length < 10) topMoviesEligible = filtered.filter(m => m.votes >= 100);
        if (topMoviesEligible.length < 10) topMoviesEligible = filtered;

        const top10Rated = [...topMoviesEligible]
            .sort((a, b) => b.rating - a.rating || b.votes - a.votes)
            .slice(0, 10);

        const ctx = document.getElementById(canvasId).getContext('2d');
        
        let gradTop = ctx.createLinearGradient(0, 0, 400, 0);
        gradTop.addColorStop(0, colors.primary);
        gradTop.addColorStop(1, colors.secondary);

        charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top10Rated.map(m => m.title.length > 25 ? m.title.substring(0, 22) + '...' : m.title),
                datasets: [{
                    label: 'Rating (out of 10)',
                    data: top10Rated.map(m => m.rating),
                    backgroundColor: gradTop,
                    borderRadius: 6,
                    barPercentage: 0.6
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
                            label: (ctx) => {
                                const movie = top10Rated[ctx.dataIndex];
                                return `Rating: ${movie.rating} (${movie.votes.toLocaleString()} votes)`;
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: gridOptions, min: 0, max: 10 },
                    y: { grid: { display: false } }
                }
            }
        });
    }

    // Chart 2: Common Genres Chart
    function renderGenresChart(filtered) {
        const canvasId = 'genresChart';
        if (charts[canvasId]) charts[canvasId].destroy();

        const genreCounts = {};
        filtered.forEach(m => {
            if (m.genres) {
                m.genres.forEach(g => {
                    genreCounts[g] = (genreCounts[g] || 0) + 1;
                });
            }
        });

        const sortedGenres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8); // Top 8 genres for cleaner doughnut representation

        const ctx = document.getElementById(canvasId).getContext('2d');

        charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedGenres.map(g => g[0]),
                datasets: [{
                    data: sortedGenres.map(g => g[1]),
                    backgroundColor: colors.palette,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, usePointStyle: true } }
                },
                cutout: '70%'
            }
        });
    }

    // Chart 3: Release Trend Chart (Line)
    function renderReleaseTrendChart(filtered, startY, endY) {
        const canvasId = 'releaseTrendChart';
        if (charts[canvasId]) charts[canvasId].destroy();

        // Calculate movies per year
        const yearCounts = {};
        // Initialize years range
        for (let y = startY; y <= endY; y++) {
            yearCounts[y] = 0;
        }
        filtered.forEach(m => {
            if (m.year >= startY && m.year <= endY) {
                yearCounts[m.year] = (yearCounts[m.year] || 0) + 1;
            }
        });

        const yearsData = Object.entries(yearCounts).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

        const ctx = document.getElementById(canvasId).getContext('2d');
        let gradTrend = ctx.createLinearGradient(0, 0, 0, 400);
        gradTrend.addColorStop(0, colors.tertiaryGlow);
        gradTrend.addColorStop(1, 'rgba(20, 184, 166, 0)');

        charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: yearsData.map(d => d[0]),
                datasets: [{
                    label: 'Movies Released',
                    data: yearsData.map(d => d[1]),
                    borderColor: colors.tertiary,
                    backgroundColor: gradTrend,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#0d0f17',
                    pointBorderColor: colors.tertiary,
                    pointBorderWidth: 2,
                    pointRadius: yearsData.length > 50 ? 1 : 3, // Smaller points if many years
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false }, 
                    tooltip: { mode: 'index', intersect: false } 
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: gridOptions, beginAtZero: true }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    }

    // Chart 4: Rating Distribution Chart
    function renderRatingDistChart(filtered) {
        const canvasId = 'ratingDistChart';
        if (charts[canvasId]) charts[canvasId].destroy();

        // Create rating bins (0-1, 1-2, 2-3, 3-4, 4-5, 5-6, 6-7, 7-8, 8-9, 9-10)
        const bins = Array(10).fill(0);
        filtered.forEach(m => {
            const rating = m.rating;
            let binIdx = Math.floor(rating);
            if (binIdx >= 10) binIdx = 9; // Handle exact 10.0
            if (binIdx >= 0) {
                bins[binIdx]++;
            }
        });

        const labels = bins.map((_, i) => `${i}-${i+1}`);

        const ctx = document.getElementById(canvasId).getContext('2d');
        charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Movies',
                    data: bins,
                    backgroundColor: colors.primary,
                    borderRadius: 4,
                    barPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: gridOptions }
                }
            }
        });
    }

    // Chart 5: Budget vs Revenue (Scatter)
    function renderScatterChart(filtered) {
        const canvasId = 'scatterChart';
        if (charts[canvasId]) charts[canvasId].destroy();

        // Filter movies with budget and revenue > 0
        const financialMovies = filtered.filter(m => m.budget > 0 && m.revenue > 0);
        
        // Take top 200 by revenue to avoid clutter and lag
        const topFinancials = [...financialMovies]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 200);

        const ctx = document.getElementById(canvasId).getContext('2d');
        charts[canvasId] = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Movies',
                    data: topFinancials.map(m => ({
                        x: m.budget,
                        y: m.revenue,
                        title: m.title
                    })),
                    backgroundColor: colors.secondary,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBorderColor: 'rgba(255,255,255,0.2)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const d = ctx.raw;
                                const bFormat = (d.x / 1000000).toFixed(1) + 'M';
                                const rFormat = (d.y / 1000000).toFixed(1) + 'M';
                                return `${d.title}: Budget $${bFormat}, Rev $${rFormat}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        grid: gridOptions, 
                        title: { display: true, text: 'Budget ($)', color: colors.secondary },
                        ticks: { callback: v => '$' + (v/1000000) + 'M' }
                    },
                    y: { 
                        grid: gridOptions, 
                        title: { display: true, text: 'Revenue ($)', color: colors.secondary },
                        ticks: { callback: v => '$' + (v/1000000) + 'M' }
                    }
                }
            }
        });
    }
});
