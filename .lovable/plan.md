

# Replace Firecrawl with Lovable AI (Free) for News Feature

## Overview

Replace the problematic Firecrawl news scraper with **Lovable AI** - a free, already-integrated solution that generates clean, readable news summaries instead of messy scraped HTML.

## Why Lovable AI is Better

| Firecrawl (Current) | Lovable AI (Free) |
|---------------------|-------------------|
| Scrapes raw HTML → garbage content | AI-generated clean summaries |
| Boilerplate text in excerpts | Professional, readable content |
| Truncated titles with "..." | Complete, clean titles |
| Requires API costs | **FREE** - included with Lovable Cloud |

---

## Changes Summary

### 1. Create New Edge Function
Create `lovable-ai-news` that uses the free Lovable AI Gateway to search for and summarize entertainment news.

### 2. Fix Navigation
Add Search back to navbar for logged-in users (currently missing).

### 3. Improve Magazine Layout
Better visual design with proper image proportions and typography.

### 4. Delete Old Firecrawl Function
Remove the `firecrawl-news` function since it's no longer needed.

---

## Files to Modify

| File | Action |
|------|--------|
| `supabase/functions/lovable-ai-news/index.ts` | **Create** - New AI-powered news fetcher |
| `supabase/config.toml` | Modify - Add new function, remove old |
| `src/hooks/useNews.tsx` | Modify - Point to new edge function |
| `src/components/Navigation.tsx` | Modify - Add Search for logged-in users |
| `src/components/DesktopHeader.tsx` | Modify - Add Search for logged-in users |
| `src/pages/News.tsx` | Modify - Improve magazine layout |
| `src/components/MagazineHero.tsx` | Modify - Better hero design |
| `src/components/NewsCard.tsx` | Modify - Fix image proportions |
| `src/components/FeaturedNewsCard.tsx` | Modify - Fix image proportions |
| `supabase/functions/firecrawl-news/` | **Delete** - Remove old function |

---

## Result

- **Clean news content** - AI-generated summaries, not scraped garbage
- **Proper titles** - No more "..." truncation
- **No boilerplate** - Clean excerpts without junk text
- **Search accessible** - Visible in navbar for all users
- **Magazine feel** - Professional layout with proper images
- **100% FREE** - Uses Lovable AI included with your project

