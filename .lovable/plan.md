

# Fix: Make Sitemap Accessible from Your Domain

Google Search Console requires the sitemap to be hosted on the **same domain** as your website. Currently, the dynamic sitemap is hosted at a backend URL which Google won't accept.

---

## The Solution

We have two options, and I recommend **Option 1** for simplicity:

### Option 1: Use the Static Sitemap (Recommended)

Your site already has a static sitemap at `public/sitemap.xml` which we updated earlier. This file is served directly from your domain.

**What to submit to Google Search Console:**
```
https://www.sceneburn.com/sitemap.xml
```

**What I'll update:**
- `public/robots.txt` - Change the Sitemap directive to point to your domain's sitemap

This is the simplest solution and works immediately.

---

### Option 2: Create a Sitemap Proxy Route (Advanced)

Create a client-side route that fetches the dynamic sitemap and returns it. However, this is more complex and may have crawling limitations.

---

## Files to Update

| File | Change |
|------|--------|
| `public/robots.txt` | Update Sitemap line to `https://www.sceneburn.com/sitemap.xml` |

---

## After This Change

1. Submit `https://www.sceneburn.com/sitemap.xml` to Google Search Console
2. Google will accept it because it's on your domain
3. The static sitemap already contains all your main pages

---

## Trade-off Note

The static sitemap contains 12 main pages but not the dynamic movie/TV show pages. However, Google will discover those through:
- Internal links on your site
- The Schema.org structured data on each page
- User traffic patterns

For most sites, this is sufficient for good SEO coverage.

