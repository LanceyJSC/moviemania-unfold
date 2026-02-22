

# Fix Collection Reviews - Letterboxd-Style Behavior

## Problems Found

1. **Reviews link to movie page, not reviews page** - Clicking a poster/title in the Reviews tab navigates to `/movie/:id` instead of `/movie/:id/reviews`. On Letterboxd, clicking a review takes you to the review/reviews page, not the general movie page.

2. **No media_type on user_reviews** - The `user_reviews` table has no `media_type` column, so TV show reviews always link to `/movie/:id` instead of `/tv/:id`. This is the "wrong show/movie" bug.

3. **Diary vs Reviews redundancy** - Diary tracks *when* you watched something (dates, rewatches, personal notes/log). Reviews are your published opinions with text and ratings. On Letterboxd these are separate concepts: the diary is your viewing log, reviews are your written thoughts. They complement each other, so both should stay -- but you could consider merging the diary tab *into* a timeline view if you prefer fewer tabs.

---

## Plan

### Step 1: Add `media_type` column to `user_reviews`
- Add a `media_type` text column defaulting to `'movie'` so existing rows are unaffected
- TV show reviews will be stored with `media_type = 'tv'`

### Step 2: Fix `CollectionReviewsList` navigation
- Use `media_type` to build the correct link: `/movie/:id/reviews` or `/tv/:id/reviews`
- Poster and title clicks go to the **reviews page**, not the detail page (matching Letterboxd behavior)

### Step 3: Update review creation to pass `media_type`
- Find where reviews are inserted (likely `LogMediaModal` or similar) and ensure `media_type` is saved

---

## Technical Details

### Database migration
```sql
ALTER TABLE public.user_reviews 
ADD COLUMN media_type text DEFAULT 'movie';
```

### CollectionReviewsList changes
- Change `Link to={/movie/${review.movie_id}}` to use `media_type` for correct routing
- Link to `/movie/:id/reviews` or `/tv/:id/reviews` instead of the detail page

### Review insert locations
- Search for `.insert` on `user_reviews` to find all places that create reviews and add `media_type` field

