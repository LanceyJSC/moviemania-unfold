

# Comprehensive SEO Enhancement Plan for SceneBurn

This plan implements four major SEO improvements to help SceneBurn rank higher in Google search results and attract more organic traffic.

---

## Overview

| Feature | Impact | Complexity |
|---------|--------|------------|
| Dynamic SEO Meta Tags | High | Medium |
| Schema.org Structured Data | High | Medium |
| Blog/Articles Section | High | High |
| Dynamic Sitemap Generation | Medium | Medium |

---

## 1. Dynamic SEO Meta Tags

**Goal**: Give every movie and TV show page its own unique title, description, and Open Graph tags for better Google indexing and social sharing.

**What you'll get**:
- Movie pages titled like: "The Dark Knight (2008) - SceneBurn"
- Descriptions pulled from TMDB: "When the Joker wreaks havoc on Gotham..."
- Proper Open Graph images showing the movie poster when shared on social media

**Implementation**:
- Install `react-helmet-async` package for managing `<head>` tags dynamically
- Create a reusable `SEOHead` component
- Add dynamic SEO to MovieDetail, TVShowDetail, and other key pages
- Update the canonical URL to match each page's unique URL

**Pages to update**:
- MovieDetail.tsx (e.g., `/movie/550` becomes "Fight Club (1999) - SceneBurn")
- TVShowDetail.tsx
- ActorDetail.tsx
- EpisodeDetail.tsx
- SeasonDetail.tsx
- Index.tsx (homepage)
- Static pages (Movies, TV Shows, Search, etc.)

---

## 2. Schema.org Structured Data (JSON-LD)

**Goal**: Add structured data that helps Google understand your content and display rich snippets in search results (showing ratings, release dates, images).

**What you'll get**:
- Google can show movie ratings and images directly in search results
- Rich snippet cards for movies with aggregate ratings
- Better visibility for TV show pages with episode information

**Implementation**:
- Create `MovieSchema` component that outputs JSON-LD for movies
- Create `TVShowSchema` component for TV series
- Include: name, image, description, datePublished, aggregateRating, director, actors, genre
- Inject into `<head>` via react-helmet-async

**Example output**:
```text
+-------------------------------------------+
| @type: Movie                              |
| name: "The Dark Knight"                   |
| datePublished: "2008-07-18"               |
| image: poster URL                         |
| aggregateRating:                          |
|   @type: AggregateRating                  |
|   ratingValue: 9.0                        |
|   bestRating: 10                          |
|   ratingCount: 25000                      |
| director: "Christopher Nolan"             |
| genre: ["Action", "Crime", "Drama"]       |
+-------------------------------------------+
```

---

## 3. Blog/Articles Section

**Goal**: Create a content marketing platform to publish SEO-focused articles like "Best Movies of 2025", "Top Horror Films", etc.

**What you'll get**:
- New `/blog` page listing all articles
- Individual article pages at `/blog/[slug]`
- Admin interface to create/edit/publish articles
- SEO-optimized articles with proper meta tags and structured data

**Database Structure**:
- New `blog_posts` table with:
  - id, slug, title, excerpt, content (markdown)
  - featured_image, author_id
  - status (draft/published), published_at
  - seo_title, seo_description, seo_keywords
  - created_at, updated_at

**Components to create**:
- `Blog.tsx` - List page with article cards
- `BlogArticle.tsx` - Individual article page with markdown rendering
- `BlogEditor.tsx` - Admin component for creating/editing articles
- Article structured data (BlogPosting schema)

**Admin Dashboard Addition**:
- New "Blog" tab in Admin.tsx for managing articles
- Rich text/markdown editor for content
- Image upload for featured images
- SEO fields for custom titles/descriptions

---

## 4. Dynamic Sitemap Generation

**Goal**: Create a backend function that generates a sitemap including popular movies and TV shows, helping Google discover and index individual content pages.

**What you'll get**:
- Sitemap at `/api/sitemap.xml` with 1000+ movie/TV URLs
- Automatic updates based on trending content
- Includes blog articles when published
- Priority weighting (homepage > movies > individual items)

**Implementation**:
- Create edge function `generate-sitemap` that:
  - Fetches trending/popular movies from TMDB
  - Fetches trending/popular TV shows from TMDB
  - Fetches published blog articles from database
  - Generates XML sitemap with proper lastmod dates
- Add caching (regenerate daily)
- Update `robots.txt` to point to the new sitemap

**Sitemap structure**:
```text
+----------------------------------------+
| URL                          | Priority |
|------------------------------|----------|
| https://sceneburn.app/       | 1.0      |
| https://sceneburn.app/movies | 0.9      |
| https://sceneburn.app/tv-shows | 0.9    |
| https://sceneburn.app/movie/550 | 0.8   |
| https://sceneburn.app/tv/1399  | 0.8    |
| https://sceneburn.app/blog/best-2025 | 0.7 |
+----------------------------------------+
```

---

## Technical Implementation Details

### New Files to Create

**Components**:
- `src/components/SEOHead.tsx` - Reusable meta tag component
- `src/components/MovieSchema.tsx` - Movie JSON-LD
- `src/components/TVShowSchema.tsx` - TV Show JSON-LD
- `src/components/ArticleSchema.tsx` - BlogPosting JSON-LD
- `src/components/BlogCard.tsx` - Blog article preview card
- `src/components/BlogEditor.tsx` - Admin blog editor

**Pages**:
- `src/pages/Blog.tsx` - Blog listing page
- `src/pages/BlogArticle.tsx` - Individual article page

**Edge Functions**:
- `supabase/functions/generate-sitemap/index.ts` - Dynamic sitemap generator

**Hooks**:
- `src/hooks/useBlogPosts.tsx` - Blog data fetching

### Files to Modify

- `src/main.tsx` - Wrap with HelmetProvider
- `src/pages/MovieDetail.tsx` - Add SEOHead and MovieSchema
- `src/pages/TVShowDetail.tsx` - Add SEOHead and TVShowSchema
- `src/pages/ActorDetail.tsx` - Add SEOHead
- `src/pages/Index.tsx` - Add homepage SEOHead
- `src/pages/Admin.tsx` - Add blog management tab
- `src/App.tsx` - Add blog routes
- `public/robots.txt` - Update sitemap URL

### Database Migration

```sql
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text,
  featured_image text,
  author_id uuid REFERENCES profiles(id),
  status text DEFAULT 'draft',
  published_at timestamptz,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Published posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Only admins can manage posts
CREATE POLICY "Admins can manage all posts"
  ON blog_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### New Package

- `react-helmet-async` - For managing document head meta tags

---

## Implementation Order

1. **Phase 1: Dynamic Meta Tags** (Foundation)
   - Install react-helmet-async
   - Create SEOHead component
   - Add to all major pages

2. **Phase 2: Schema.org Markup** (Rich Snippets)
   - Create schema components
   - Add to MovieDetail and TVShowDetail

3. **Phase 3: Blog System** (Content Marketing)
   - Create database table
   - Build blog pages and editor
   - Add admin controls

4. **Phase 4: Dynamic Sitemap** (Discovery)
   - Create edge function
   - Update robots.txt
   - Test with Google Search Console

---

## Expected Results

After implementation:
- Each movie/TV page will have unique, indexable meta tags
- Google can display rich snippets with ratings and images
- Fresh blog content will attract organic search traffic
- Google will discover and index thousands of movie/TV pages

