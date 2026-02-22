
# Fix Collection Page: Reviews Count, Lists Functionality, and Review Categorization

## Issues Found

1. **Reviews tab has no count badge** - Watchlist, Favorites, and Watched all show counts, but Reviews doesn't
2. **Lists tab - can't create lists** - The CreateListModal exists and works, but may be blocked by the `canCreateList` check tied to subscription status. Need to verify the subscription hook isn't incorrectly blocking free users who haven't hit the limit yet.
3. **No way to add movies/shows to lists** - The `AddToListButton` component exists but is NOT used anywhere in the app (not on MovieDetail, TVShowDetail, or any other page). Users literally cannot add items to their lists.
4. **Reviews tab doesn't separate movie vs TV vs episode reviews** - All reviews are dumped in one flat list with no categorization

---

## Plan

### 1. Add review count badge to Reviews tab
- Fetch review count from `user_reviews` table
- Display count badge next to "Reviews" tab trigger, matching the style of other tabs

### 2. Add "Add to List" button on movie and TV show detail pages
- Import and place `AddToListButton` on `MovieDetail.tsx` and `TVShowDetail.tsx` pages alongside the existing watchlist/favorite buttons
- This is the primary way users add content to lists (just like Letterboxd)

### 3. Add review type filter tabs inside Reviews tab
- Add sub-filter pills inside the Reviews tab: **All | Movies | TV Shows**
- Filter reviews by `media_type` column (`movie` vs `tv`)
- Show a small badge icon (Film or TV icon) next to each review title so users can tell at a glance

### 4. Add list count badge to Lists tab
- Show the number of lists next to the Lists tab trigger

### 5. Fix CreateListModal if blocked
- Verify the `canCreateList` logic works for free users with fewer than 3 lists
- The `useSubscription` hook's `loading` state may cause `canCreateList` to be false during loading, which would disable the create button

---

## Technical Details

### Files to modify:
- `src/pages/Collection.tsx` - Add review count state, fetch count, add badge to Reviews and Lists tabs, add sub-filter inside Reviews tab
- `src/components/CollectionReviewsList.tsx` - Accept a `mediaTypeFilter` prop to filter reviews, expose review count
- `src/pages/MovieDetail.tsx` - Add `AddToListButton` component
- `src/pages/TVShowDetail.tsx` - Add `AddToListButton` component
- `src/components/CollectionListsGrid.tsx` - Minor: expose list count for parent

### Key changes:

**Collection.tsx - Reviews tab with count and filter:**
- Fetch review count with a lightweight query on mount
- Add sub-filter state (`reviewFilter: 'all' | 'movie' | 'tv'`)
- Pass filter to `CollectionReviewsList`
- Show count badge on tab

**CollectionReviewsList.tsx - Filter support:**
- Accept `mediaTypeFilter` prop
- Filter the fetched reviews by media_type
- Show Film/TV icon badge next to each review title
- Expose count via callback or internal count display

**MovieDetail.tsx / TVShowDetail.tsx:**
- Add `AddToListButton` in the action buttons area (next to watchlist, favorite, etc.)

### No database changes needed
All data and columns already exist.
