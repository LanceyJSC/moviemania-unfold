

# Fix Domain: Update to www.sceneburn.com

All SEO files currently reference the wrong domain (`sceneburn.app`). This needs to be changed to your actual domain (`www.sceneburn.com`) for Google to properly index your site.

---

## Why This Matters

Google uses canonical URLs and sitemap domains to understand where your content lives. If the URLs in your sitemap and meta tags don't match your actual domain, Google may:
- Not index your pages correctly
- Show the wrong URL in search results
- Split your SEO authority between domains

---

## Files to Update

| File | Changes |
|------|---------|
| `index.html` | Update canonical URL, OG URL, and image URLs |
| `src/components/SEOHead.tsx` | Change siteUrl constant |
| `src/components/MovieSchema.tsx` | Update schema URL |
| `src/components/TVShowSchema.tsx` | Update schema URL |
| `src/components/ArticleSchema.tsx` | Update all URLs and image references |
| `supabase/functions/generate-sitemap/index.ts` | Change SITE_URL constant |
| `public/sitemap.xml` | Update all static URLs (backup file) |

---

## Specific Changes

**index.html**:
- `https://sceneburn.app` → `https://www.sceneburn.com`
- Update canonical, og:url, og:image, twitter:image URLs

**src/components/SEOHead.tsx**:
```
const siteUrl = 'https://www.sceneburn.com';
```

**src/components/MovieSchema.tsx**:
```
"url": `https://www.sceneburn.com/movie/${movie.id}`
```

**src/components/TVShowSchema.tsx**:
```
"url": `https://www.sceneburn.com/tv/${tvShow.id}`
```

**src/components/ArticleSchema.tsx**:
- Update all 4 occurrences of sceneburn.app to www.sceneburn.com

**supabase/functions/generate-sitemap/index.ts**:
```
const SITE_URL = 'https://www.sceneburn.com';
```

**public/sitemap.xml**:
- Update all 12 static page URLs

---

## After This Change

Once updated:
1. All meta tags will point to your real domain
2. The dynamic sitemap will generate correct URLs
3. Schema.org data will reference your actual site
4. Google will properly associate all content with www.sceneburn.com

You should then re-submit the sitemap to Google Search Console for your www.sceneburn.com property.

