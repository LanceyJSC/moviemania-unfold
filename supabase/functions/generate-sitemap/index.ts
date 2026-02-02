import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

const SITE_URL = 'https://sceneburn.app';
const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8'; // Public TMDB API key
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

async function fetchTMDBMovies(): Promise<SitemapUrl[]> {
  if (!TMDB_API_KEY) {
    console.log('No TMDB API key, skipping movie fetch');
    return [];
  }

  const urls: SitemapUrl[] = [];
  const today = new Date().toISOString().split('T')[0];

  try {
    // Fetch multiple pages of popular movies
    for (let page = 1; page <= 5; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      
      for (const movie of data.results || []) {
        urls.push({
          loc: `${SITE_URL}/movie/${movie.id}`,
          lastmod: today,
          changefreq: 'weekly',
          priority: '0.8'
        });
      }
    }

    // Also fetch trending movies
    const trendingResponse = await fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`
    );
    const trendingData = await trendingResponse.json();
    
    for (const movie of trendingData.results || []) {
      // Avoid duplicates
      if (!urls.some(u => u.loc === `${SITE_URL}/movie/${movie.id}`)) {
        urls.push({
          loc: `${SITE_URL}/movie/${movie.id}`,
          lastmod: today,
          changefreq: 'daily',
          priority: '0.9'
        });
      }
    }
  } catch (error) {
    console.error('Error fetching movies from TMDB:', error);
  }

  return urls;
}

async function fetchTMDBTVShows(): Promise<SitemapUrl[]> {
  if (!TMDB_API_KEY) {
    console.log('No TMDB API key, skipping TV show fetch');
    return [];
  }

  const urls: SitemapUrl[] = [];
  const today = new Date().toISOString().split('T')[0];

  try {
    // Fetch multiple pages of popular TV shows
    for (let page = 1; page <= 5; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      
      for (const show of data.results || []) {
        urls.push({
          loc: `${SITE_URL}/tv/${show.id}`,
          lastmod: today,
          changefreq: 'weekly',
          priority: '0.8'
        });
      }
    }

    // Also fetch trending TV shows
    const trendingResponse = await fetch(
      `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}`
    );
    const trendingData = await trendingResponse.json();
    
    for (const show of trendingData.results || []) {
      if (!urls.some(u => u.loc === `${SITE_URL}/tv/${show.id}`)) {
        urls.push({
          loc: `${SITE_URL}/tv/${show.id}`,
          lastmod: today,
          changefreq: 'daily',
          priority: '0.9'
        });
      }
    }
  } catch (error) {
    console.error('Error fetching TV shows from TMDB:', error);
  }

  return urls;
}

async function fetchBlogPosts(): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&select=slug,published_at,updated_at`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      }
    );
    
    const posts = await response.json();
    
    for (const post of posts || []) {
      urls.push({
        loc: `${SITE_URL}/blog/${post.slug}`,
        lastmod: (post.updated_at || post.published_at || new Date().toISOString()).split('T')[0],
        changefreq: 'weekly',
        priority: '0.7'
      });
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error);
  }

  return urls;
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/movies</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/tv-shows</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/search</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/genres</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/lists</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/recommendations</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/pro</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  ${urlEntries}
</urlset>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Generating sitemap...');

    // Fetch all URLs in parallel
    const [movieUrls, tvUrls, blogUrls] = await Promise.all([
      fetchTMDBMovies(),
      fetchTMDBTVShows(),
      fetchBlogPosts()
    ]);

    console.log(`Found ${movieUrls.length} movies, ${tvUrls.length} TV shows, ${blogUrls.length} blog posts`);

    // Combine all URLs
    const allUrls = [...movieUrls, ...tvUrls, ...blogUrls];

    // Generate XML
    const xml = generateSitemapXML(allUrls);

    return new Response(xml, {
      headers: corsHeaders,
      status: 200
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
