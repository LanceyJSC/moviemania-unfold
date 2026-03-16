import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import vitePrerender from "vite-plugin-prerender";

const STATIC_PRERENDER_ROUTES = [
  "/",
  "/movies",
  "/tv-shows",
  "/genres",
  "/lists",
  "/members",
  "/blog",
  "/news",
  "/search",
  "/terms",
  "/privacy",
];

const fetchPublishedRoutes = async (
  baseUrl: string,
  publishableKey: string,
  table: "blog_posts" | "news_articles",
  routePrefix: "/blog" | "/news"
) => {
  const response = await fetch(
    `${baseUrl}/rest/v1/${table}?status=eq.published&select=slug`,
    {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch prerender routes for ${table}: ${response.status}`);
  }

  const records = (await response.json()) as Array<{ slug: string | null }>;
  return records
    .map((record) => record.slug?.trim())
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => `${routePrefix}/${slug}`);
};

const getPrerenderRoutes = async (baseUrl?: string, publishableKey?: string) => {
  if (!baseUrl || !publishableKey) {
    return STATIC_PRERENDER_ROUTES;
  }

  try {
    const [blogRoutes, newsRoutes] = await Promise.all([
      fetchPublishedRoutes(baseUrl, publishableKey, "blog_posts", "/blog"),
      fetchPublishedRoutes(baseUrl, publishableKey, "news_articles", "/news"),
    ]);

    return [...new Set([...STATIC_PRERENDER_ROUTES, ...blogRoutes, ...newsRoutes])];
  } catch (error) {
    console.warn("Falling back to static prerender routes:", error);
    return STATIC_PRERENDER_ROUTES;
  }
};

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const Renderer = vitePrerender.PuppeteerRenderer;
  const prerenderRoutes =
    mode === "production"
      ? await getPrerenderRoutes(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
      : [];

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['sceneburn-icon.png', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'SceneBurn - Discover Movies & TV Shows',
          short_name: 'SceneBurn',
          description: 'Discover, Save, and Experience Movies Like Never Before',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          id: '/',
          categories: ['entertainment', 'movies', 'tv'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/sceneburn-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any'
            }
          ],
          screenshots: [
            {
              src: '/splash-750x1334.png',
              sizes: '750x1334',
              type: 'image/png',
              form_factor: 'narrow'
            },
            {
              src: '/splash-1284x2778.png',
              sizes: '1284x2778',
              type: 'image/png',
              form_factor: 'narrow'
            }
          ],
          shortcuts: [
            {
              name: 'Movies',
              short_name: 'Movies',
              url: '/movies',
              icons: [{ src: '/sceneburn-icon.png', sizes: '192x192' }]
            },
            {
              name: 'TV Shows',
              short_name: 'TV',
              url: '/tv-shows',
              icons: [{ src: '/sceneburn-icon.png', sizes: '192x192' }]
            },
            {
              name: 'Search',
              short_name: 'Search',
              url: '/search',
              icons: [{ src: '/sceneburn-icon.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.themoviedb\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tmdb-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tmdb-images-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 7
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      }),
      mode === "production" && vitePrerender({
        staticDir: path.join(__dirname, "dist"),
        routes: prerenderRoutes,
        renderer: new Renderer({
          renderAfterTime: 4000,
          maxConcurrentRoutes: 1,
        }),
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
  };
});
