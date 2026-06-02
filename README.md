# 🎬 Movies Intelligence Dashboard

An interactive, premium, data-driven dashboard visualizing movie industry trends, ratings, and financials using TMDB and Netflix datasets.

🔗 **Live Dashboard:** [https://chandanaraj2404.github.io/movie_intelligence/](https://chandanaraj2404.github.io/movie_intelligence/)

---

##  Features

- **Interactive Filters**: 
  - Dynamic **Genre** filter populated from the dataset.
  - **Start / End Year** range selectors to focus on specific eras.
  - **Minimum Rating** range slider with live feedback.
  - Quick **Reset** button to restore defaults.
- **Dynamic Key Insights**: Re-aggregates selection metrics in real-time, showing:
  - Total filtered movies and average rating.
  - Most frequent (dominant) genre.
  - Highest grossing leader (Revenue vs. Budget).
  - Peak activity year.
- **Interactive Visualizations (Chart.js)**:
  - **Top 10 Highest Rated Movies** (Horizontal Bar Chart)
  - **Most Common Movie Genres** (Doughnut Chart)
  - **Movie Releases Per Year** (Line Chart)
  - **Distribution of Movie Ratings** (Histogram)
  - **Budget vs. Revenue** (Scatter Plot comparing top 200 grossing movies)

---

##  Getting Started

### Prerequisites

- Python 3.x

### Running Locally

1. **Preprocess Data** (if modifying raw CSVs):
   If you have the TMDB/Netflix dataset, place it in `D:\movie_data` and run the preprocessing script to aggregate the records:
   ```bash
   python scripts/preprocess.py
   ```
   *Note: This outputs a compact filterable JSON database to `src/assets/raw_movie_data.json`.*

2. **Start a Local HTTP Server**:
   Start a simple server to serve the frontend files:
   ```bash
   python -m http.server 8080
   ```

3. **Open the Dashboard**:
   Navigate to:
   ```
   http://localhost:8080/index.html
   ```

---

## Built With

- **HTML5 & CSS3**: Responsive grid layout and glassmorphic dark theme.
- **JavaScript (ES6)**: Real-time data filtration and metric aggregations.
- **Chart.js**: Rich interactive chart rendering.
