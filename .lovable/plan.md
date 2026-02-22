

# Letterboxd-Style Collection Page Enhancements

Here's what's currently missing compared to Letterboxd, and what we can add to close the gap:

---

## 1. Reviews Tab
Letterboxd has a dedicated "Reviews" section showing all your written reviews in a clean list. Currently, reviews are buried inside the Diary tab.

- Add a 5th tab called "Reviews" with a speech bubble icon
- Show each review with: poster thumbnail, title, flame rating, review text, and date
- Include edit and delete actions on each review

## 2. Lists Tab
Letterboxd prominently features your custom lists. You already have a Lists system (`useUserLists`) but it's not on the Collection page.

- Add a 6th tab called "Lists" with a layers/stack icon
- Show all user-created lists as cards with cover art (first 4 posters as a mini-grid)
- Include a "Create New List" button
- Tapping a list navigates to the existing `/list/:id` page

## 3. Poster Hover Overlay (Desktop)
On Letterboxd, hovering a poster shows quick-action icons (rate, like, add to watchlist) without navigating away.

- On desktop hover, show a semi-transparent overlay with 3 icon buttons: flame rating, heart (favorite), and bookmark (watchlist)
- On mobile, keep the current tap-to-navigate behavior

## 4. "Liked" Heart Badge on Posters
Letterboxd shows a small green heart on posters you've liked/favorited.

- Check if each poster item is in the user's favorites
- If yes, show a small flame-colored heart icon in the bottom-left corner of the poster

## 5. Diary Calendar/Heatmap View
Letterboxd shows a contribution-graph-style heatmap of your viewing activity.

- Add a small calendar heatmap above or below the Diary tab content
- Show intensity by number of films logged per day (light to dark shading)
- Clicking a day filters the diary to that date

## 6. Genre and Decade Filters
Letterboxd lets you filter your collection by genre and release decade.

- Add a "Genre" dropdown filter next to the existing sort/rating filters
- Add a "Decade" dropdown (2020s, 2010s, 2000s, etc.)
- These require fetching genre/year data from TMDB for each item (can be cached)

## 7. Rewatch Indicator
Letterboxd marks entries where a film was rewatched with a small circular arrow icon.

- In the Diary table, if a movie appears more than once, show a rewatch icon
- On poster grid items, show a small rewatch badge if logged multiple times

---

## Technical Details

### New Components
- `src/components/CollectionReviewsList.tsx` - Reviews tab content
- `src/components/CollectionListsGrid.tsx` - Lists tab content  
- `src/components/DiaryHeatmap.tsx` - Calendar heatmap for diary
- `src/components/PosterOverlay.tsx` - Hover overlay with quick actions

### Modified Files
- `src/pages/Collection.tsx` - Add Reviews, Lists tabs; add genre/decade filters; integrate heatmap
- `src/components/CollectionPosterGrid.tsx` - Add hover overlay, liked badge, rewatch indicator
- `src/components/DiaryTable.tsx` - Add rewatch indicator, switch from stars to flames

### Data Requirements
- Reviews data: already available via `user_reviews` table
- Lists data: already available via `useUserLists` hook
- Favorites lookup: already available via `useFavorites` hook
- Genre/year data: will need to store or fetch from TMDB per item (can use existing cached data)
- Rewatch detection: count diary entries per movie_id

### No database changes needed
All data already exists in the current schema. This is purely a frontend enhancement.

