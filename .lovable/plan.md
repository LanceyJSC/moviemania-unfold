

# Fix: Use Existing TMDB API Key in Sitemap

The sitemap edge function was incorrectly set up to require a secret, but your project already has a public TMDB API key that's safe to use.

---

## The Problem

The edge function `generate-sitemap` was looking for a `TMDB_API_KEY` secret that doesn't exist, when the same public key is already in your codebase.

---

## The Solution

Update the edge function to use the existing public TMDB API key directly (since it's a publishable key, this is safe).

---

## File to Update

**supabase/functions/generate-sitemap/index.ts**

Change from:
```typescript
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
```

To:
```typescript
const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8'; // Public key from TMDB
```

---

## Why This Is Safe

TMDB's API keys are designed to be public. They identify your app but don't grant special permissions. The rate limiting is per-key, and TMDB expects these keys to be visible in client-side code.

---

## Result

After this change, the sitemap generator will work immediately without any additional configuration needed.

