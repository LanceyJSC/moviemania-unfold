
# Entertainment News Aggregator with Firecrawl

## Overview
Create a dedicated **News** section that automatically fetches and displays the latest movie and TV news from major entertainment sources using Firecrawl. This keeps "News" separate from "Blog" (which can remain for original editorial content).

---

## What We'll Build

### 1. New Database Table: `news_articles`
A dedicated table for scraped news content, separate from `blog_posts`:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `title` | text | Article headline |
| `excerpt` | text | Short summary |
| `content` | text | Full article content (markdown) |
| `source_url` | text | Original article URL |
| `source_name` | text | Publication name (Variety, Deadline, etc.) |
| `featured_image` | text | Article image URL |
| `published_at` | timestamp | When scraped/published |
| `created_at` | timestamp | When added to database |
| `status` | text | 'draft' or 'published' |

### 2. New Pages
- **`/news`** - Public news listing page showing all published articles
- **`/news/:slug`** - Individual news article page

### 3. Edge Function: `firecrawl-news`
Backend function that:
1. Searches for latest movie/TV news via Firecrawl
2. Scrapes content from top entertainment sources
3. Extracts title, content, and images
4. Saves as draft articles for admin review

### 4. Admin Panel Updates
Add a "News" tab with:
- "Fetch Latest News" button to trigger scraping
- List of fetched/imported articles
- One-click publish functionality

### 5. Navigation Updates
- Add "News" link to mobile navigation (Newspaper icon)
- Add "News" link to desktop header
- Update sitemap to include `/news`

---

## Architecture

```text
+------------------+     +-------------------+     +------------------+
|  Admin Dashboard | --> |  firecrawl-news   | --> |  news_articles   |
|  "Fetch News"    |     |  Edge Function    |     |  table           |
+------------------+     +-------------------+     +------------------+
                                 |
                                 v
                         +------------------+
                         |  Firecrawl API   |
                         +------------------+
                                 |
                                 v
                   +-------------------------------+
                   |  Entertainment News Sources   |
                   |  Variety, Deadline, THR, etc  |
                   +-------------------------------+
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/firecrawl-news/index.ts` | Scrape news via Firecrawl |
| `src/pages/News.tsx` | Public news listing page |
| `src/pages/NewsArticle.tsx` | Individual article page |
| `src/hooks/useNews.tsx` | React Query hooks for news data |
| `src/components/NewsCard.tsx` | News article card component |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Register new edge function |
| `src/App.tsx` | Add /news routes |
| `src/pages/Admin.tsx` | Add News tab with fetch functionality |
| `src/components/Navigation.tsx` | Add News link to mobile nav |
| `src/components/DesktopHeader.tsx` | Add News link to desktop nav |
| `public/sitemap.xml` | Add /news page |

---

## User Experience

### For Visitors
1. Click "News" in navigation
2. See latest entertainment headlines with images
3. Click article to read full story
4. Each article shows source attribution

### For Admin
1. Go to Admin > News tab
2. Click "Fetch Latest News"
3. Review scraped articles
4. Publish approved articles with one click

---

## News Sources (Configurable)
- Variety
- Deadline
- The Hollywood Reporter
- Entertainment Weekly
- Screen Rant
- Collider

---

## First Step Required
Before implementation, I'll need to connect the Firecrawl connector to provide the API key for web scraping.
