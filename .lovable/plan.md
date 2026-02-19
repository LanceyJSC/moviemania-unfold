

# Collection Page Redesign

## Current Issues
- Cards are plain and text-heavy with small 64x96px poster thumbnails
- Stats section uses tiny, cramped cards with minimal visual hierarchy
- No visual distinction between tabs -- all content looks the same
- Cards lack genre tags, release year, or runtime context
- Diary entries don't show enough detail at a glance
- The layout feels like a simple list rather than a curated personal collection

## Proposed Changes

### 1. Enhanced Stats Header
- Replace the cramped 4-column grid with a visually rich banner
- Add a gradient background with subtle cinema styling
- Larger typography for key numbers with animated counters feel
- Add a visual progress bar showing level progress (e.g., "Level 3 -- 12/20 to next level")

### 2. Larger, Richer Media Cards
- Increase poster size from w-16 h-24 (64x96) to w-20 h-28 (80x112) for better visual presence
- Add release year and genre tags below the title
- Show a brief overview/tagline fetched from TMDB (1-line, truncated)
- Add the "Added on" or "Watched on" date more prominently
- For watched items: show a subtle green checkmark overlay on the poster
- For diary entries: show the review snippet more prominently with a styled quote block

### 3. Desktop Grid Layout
- On desktop (md+), switch from stacked list to a 2-column grid layout for cards
- This uses the wider screen estate much better and reduces scrolling
- Mobile stays as single-column stacked list

### 4. Improved Tab Visual Design
- Add item counts more prominently in each tab
- Show an icon + count summary strip below the tabs (e.g., "23 Movies, 8 TV Shows")

### 5. Empty States
- Make empty states more inviting with larger icons and a direct CTA button linking to Movies/TV Shows browse pages

## Technical Details

### Files to modify:

**src/pages/Collection.tsx**
- Redesign the stats section with a gradient banner component
- Add `md:grid md:grid-cols-2` to the card container divs for desktop 2-column layout
- Enhance empty state cards with browse CTAs

**src/components/CollectionMediaCard.tsx**
- Increase poster size to w-20 h-28
- Fetch and display release year and genre from TMDB (add to existing useEffect)
- Add a 1-line overview/tagline
- Style the children content area (dates, reviews) with better spacing
- Add watched overlay on poster when applicable

**src/components/TVShowCollectionCard.tsx**
- Match the same poster size increase (w-20 h-28)
- Add network/first air date info from the existing TMDB fetch
- Better visual styling for season/episode counts (use badges instead of plain text)

### No database changes required -- all enhancements use existing data plus TMDB API info already being fetched.

