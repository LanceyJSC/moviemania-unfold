

## Group Episode Reviews by Series

Right now, every episode review shows as a separate row with the same poster repeated. When you review 10+ episodes of "The Rookie," that's 10 identical-looking rows cluttering the list. The fix: **group episode reviews under their parent series** with a collapsible accordion.

### How it will look

```text
+--------------------------------------------------+
| [Poster] The Rookie          3 episode reviews  v |
|   +----------------------------------------------+
|   | S6E1 - 🔥🔥🔥  "sdfsadfsda..."   Feb 24    x |
|   | S1E2 - 🔥🔥    "episode"          Feb 22    x |
|   +----------------------------------------------+
| [Poster] The Rookie (series review)              |
|   🔥🔥  "ddd"                        Feb 22    x |
+--------------------------------------------------+
```

- Series-level and movie reviews stay as flat rows (unchanged)
- Episode reviews for the same `movie_id` get grouped into a collapsible section
- The group header shows the series poster, title, and episode count badge
- Clicking the header expands/collapses the episode list
- Each episode row inside is compact: just the S#E# tag, flames, review snippet, date, and delete button
- The "Episodes" filter pill still works, just shows the grouped view

### Technical details

**File: `src/components/CollectionReviewsList.tsx`**

1. After filtering, partition `filteredReviews` into two buckets:
   - `standaloneReviews`: movies (`media_type === 'movie'`) and series-level TV reviews (`media_type === 'tv'` with `episode_number == null`)
   - `episodeReviews`: TV reviews with `episode_number != null`

2. Group `episodeReviews` by `movie_id` into a `Map<number, Review[]>`, sorting episodes within each group by season then episode number

3. Render standalone reviews as current flat rows (no change)

4. For each episode group, render a collapsible section using `@radix-ui/react-collapsible`:
   - **Trigger**: poster thumbnail, series title, episode count badge, chevron icon
   - **Content**: compact episode rows with S#E# badge, flames, review text snippet, date, delete button
   - Groups are interleaved with standalone reviews in chronological order (by most recent review in the group)

5. Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from existing `@/components/ui/collapsible` and `ChevronDown` from lucide-react

No database changes needed. No new dependencies.
