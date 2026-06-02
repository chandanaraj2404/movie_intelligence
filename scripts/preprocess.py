import csv
import ast
import json
import os

def process_data():
    dataset_dir = r'D:\movie_data'
    metadata_file = os.path.join(dataset_dir, 'movies_metadata.csv')
    
    movies_list = []
    
    print("Reading movies_metadata.csv...")
    with open(metadata_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return
            
        title_idx = headers.index('title')
        vote_avg_idx = headers.index('vote_average')
        vote_count_idx = headers.index('vote_count')
        genres_idx = headers.index('genres')
        release_date_idx = headers.index('release_date')
        budget_idx = headers.index('budget')
        revenue_idx = headers.index('revenue')
        
        for row in reader:
            if len(row) <= max(title_idx, vote_avg_idx, vote_count_idx, genres_idx, release_date_idx, budget_idx, revenue_idx):
                continue
                
            title = row[title_idx]
            
            # Rating and Vote Count
            try:
                vote_avg = float(row[vote_avg_idx])
                vote_count = int(float(row[vote_count_idx]))
            except ValueError:
                continue
            
            # Release Year
            release_date = row[release_date_idx]
            if not release_date:
                continue
            year_str = release_date.split('-')[0]
            if not (year_str.isdigit() and len(year_str) == 4):
                continue
            year = int(year_str)
            
            # Filter years to reasonable range
            if not (1920 <= year <= 2020):
                continue
                
            # Budget and Revenue
            try:
                budget = float(row[budget_idx])
                revenue = float(row[revenue_idx])
            except ValueError:
                budget, revenue = 0.0, 0.0
                
            # Genres
            genres = []
            genres_str = row[genres_idx]
            if genres_str:
                try:
                    genres_list = ast.literal_eval(genres_str)
                    if isinstance(genres_list, list):
                        for g in genres_list:
                            if isinstance(g, dict) and 'name' in g:
                                genres.append(g['name'])
                except (ValueError, SyntaxError):
                    pass
            
            # Filter movies that have at least 10 votes, OR have valid budget/revenue.
            if vote_count >= 10 or (budget > 0 and revenue > 0):
                movies_list.append({
                    'title': title,
                    'rating': round(vote_avg, 1),
                    'votes': vote_count,
                    'genres': genres,
                    'year': year,
                    'budget': budget,
                    'revenue': revenue
                })
                
    # Sort movies by votes descending to prioritize well-known movies
    movies_list.sort(key=lambda x: x['votes'], reverse=True)
    
    # Keep up to 15,000 movies
    final_movies = movies_list[:15000]
    
    out_dir = r'C:\Users\Chandana\.gemini\antigravity\playground\tidal-gemini\src\assets'
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'raw_movie_data.json')
    
    print(f"Writing {len(final_movies)} movies to {out_file}...")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(final_movies, f, indent=0)
        
    print("Done!")

if __name__ == '__main__':
    process_data()
