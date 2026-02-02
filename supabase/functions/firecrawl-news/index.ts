import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate a URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)
    .replace(/-$/, "");
}

// Allowed entertainment news domains
const ALLOWED_DOMAINS = [
  "variety.com",
  "deadline.com",
  "hollywoodreporter.com",
  "ew.com",
  "screenrant.com",
  "collider.com",
  "thewrap.com",
  "indiewire.com",
  "theguardian.com",
  "forbes.com",
  "rottentomatoes.com",
];

// Check if URL is from an allowed source and is an actual article
function isValidArticleUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "").replace("editorial.", "");
    const path = urlObj.pathname;
    
    // Must be from allowed domain
    if (!ALLOWED_DOMAINS.some(d => hostname.includes(d))) {
      return false;
    }
    
    // Reject homepage and category pages
    if (path === "/" || path === "") return false;
    if (path.match(/^\/(v\/)?[a-z-]+\/?$/i)) return false;
    if (path.match(/^\/tag\//)) return false;
    if (path.match(/^\/category\//)) return false;
    
    // Articles usually have dates or IDs in the URL
    if (path.match(/\/\d{4}\/\d{2}\//)) return true;
    if (path.match(/-\d{5,}/)) return true;
    if (path.match(/\/[a-z-]+-[a-z-]+-\d+/)) return true;
    
    const segments = path.split("/").filter(s => s.length > 0);
    return segments.length >= 2;
  } catch {
    return false;
  }
}

// Check if title looks like a real article (not a category page title)
function isArticleTitle(title: string): boolean {
  const genericTitles = [
    "box office",
    "film",
    "movies",
    "tv news",
    "entertainment news",
    "entertainment weekly",
    "the hollywood reporter",
    "variety",
    "deadline",
    "screen rant",
    "collider",
  ];
  
  const lowerTitle = title.toLowerCase().trim();
  
  // Reject if title is just a source name or generic category
  for (const generic of genericTitles) {
    if (lowerTitle === generic || lowerTitle.startsWith(generic + ":") || lowerTitle.startsWith(generic + " -")) {
      return false;
    }
  }
  
  // Article titles should be reasonably long
  if (title.length < 20) return false;
  
  return true;
}

// Clean markdown content - remove navigation, ads, and junk aggressively
function cleanContent(content: string | null): string | null {
  if (!content) return null;
  
  let cleaned = content;
  
  // Remove common junk patterns first
  const junkPatterns = [
    /\[Skip to[^\]]*\]\([^)]*\)/gi,
    /!\[[^\]]*\]\([^)]*\)/g, // markdown images
    /View image in fullscreen/gi,
    /Photograph:\s*[^\n]+/gi,
    /###?\s*(Related|More Stories)[^\n]*(\n[^\n#]*){0,3}/gi,
    /Tap Here To Add[^\n]*/gi,
    /Add as a preferred source[^\n]*/gi,
    /Sign up for[^\n]*/gi,
    /Get the .* App[^\n]*/gi,
    /Reviews, Ratings, Watchlists[^\n]*/gi,
    /Install\s*Install/gi,
    /Facebook\s*Twitter\s*Instagram[^\n]*/gi,
    /We value your privacy[^\n]*/gi,
    /cookies? (and )?process personal data[^\n]*/gi,
    /Please (login|signup|wait)[^\n]*/gi,
    /Jump to content[^\n]*/gi,
    /From Wikipedia[^\n]*/gi,
    /Wiki Loves[^\n]*/gi,
    /Help with translations[^\n]*/gi,
    /\|\s*\|/g,
    /Don't miss these/gi,
    /YOUR NEXT READ/gi,
    /Notice Message App/gi,
    /Close\s*Close/gi,
    /in [A-Z][a-z]+\.\s*$/gm,
    /Share on (Facebook|X|LinkedIn|Pinterest|Reddit|Tumblr|Whats App)[^\n]*/gi,
    /Send an Email[^\n]*/gi,
    /Show additional share options[^\n]*/gi,
    /Google Preferred[^\n]*/gi,
    /Follow Sign Up[^\n]*/gi,
    /Plus Icon[^\n]*/gi,
    /View All[^\n]*/gi,
    /Follow Author[^\n]*/gi,
    /Forbes contributors[^\n]*/gi,
    /## Live[^\n]*/gi,
    /Courtesy of [^\n]*/gi,
  ];
  
  for (const pattern of junkPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }
  
  // Remove markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  
  // Remove escaped characters
  cleaned = cleaned.replace(/\\\\/g, "");
  cleaned = cleaned.replace(/\\([_*`\[\]])/g, "$1");
  
  // Remove duplicate lines (like repeated captions)
  const lines = cleaned.split("\n");
  const uniqueLines: string[] = [];
  const seenLines = new Set<string>();
  for (const line of lines) {
    const normalized = line.trim().toLowerCase();
    if (normalized.length > 15 && seenLines.has(normalized)) continue;
    if (normalized.length > 15) seenLines.add(normalized);
    uniqueLines.push(line);
  }
  cleaned = uniqueLines.join("\n");
  
  // Find the main headline (first # heading) and extract content from there
  const mainHeadingMatch = cleaned.match(/^#\s+[A-Z][^\n]{20,}/m);
  if (mainHeadingMatch && mainHeadingMatch.index !== undefined) {
    cleaned = cleaned.slice(mainHeadingMatch.index);
  }
  
  // Remove lines that are junk
  cleaned = cleaned
    .split("\n")
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed.match(/^\d+$/)) return false;
      if (trimmed.length <= 5) return false;
      if (trimmed.match(/^©/)) return false;
      if (trimmed.match(/^\*+$/)) return false;
      if (trimmed.match(/^[-_]{3,}$/)) return false;
      if (trimmed.match(/^(Home|Login|Sign Up|Menu|Close|Install|Review)$/i)) return false;
      if (trimmed.toLowerCase().includes("advertisement")) return false;
      if (trimmed.toLowerCase().includes("sponsored")) return false;
      if (trimmed.match(/^\s*-\s*(Home|Best|Watch|Upcoming|Share)/i)) return false;
      if (trimmed.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/i) && trimmed.length < 30) return false; // Standalone date
      if (trimmed.match(/^By\s+[A-Z][a-z]+\s*,?$/i)) return false; // "By Monica," author lines
      return true;
    })
    .join("\n");
  
  // Remove excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.trim();
  
  // Reject if mostly movie title lists
  const finalLines = cleaned.split("\n").filter(l => l.trim());
  const italicLines = finalLines.filter(l => l.trim().startsWith("_") && l.trim().endsWith("_"));
  if (italicLines.length > finalLines.length * 0.4) return null;
  
  // Must have substantial content
  return cleaned.length > 200 ? cleaned : null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error("Supabase configuration not found");
    }

    // Check if this is a scheduled cron call (uses anon key in Authorization)
    const authHeader = req.headers.get("Authorization");
    const isCronCall = authHeader === `Bearer ${supabaseAnonKey}`;
    
    // For non-cron calls, verify admin access
    if (!isCronCall) {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
      
      if (claimsError || !claims?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = claims.claims.sub;

      // Check admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();

      if (roleError || !roleData) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`Fetching entertainment news via Firecrawl (cron: ${isCronCall})...`);

    // Get Firecrawl API key
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Firecrawl connector not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Search for ACTUAL news articles with specific terms that indicate real articles
    const searchQuery = `("new movie" OR "trailer released" OR "cast announced" OR "box office" OR "review" OR "premiere") (movie OR film OR TV show) 2026`;

    console.log("Search query:", searchQuery);

    // Search for news using Firecrawl
    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 20, // Get more to filter
        tbs: "qdr:d", // Last 24 hours
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
      }),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error("Firecrawl search error:", searchData);
      return new Response(
        JSON.stringify({
          error: searchData.error || "Failed to search for news",
        }),
        {
          status: searchResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${searchData.data?.length || 0} raw results`);

    if (!searchData.data || searchData.data.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No new articles found",
          imported: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process and filter articles
    const articles = [];
    for (const result of searchData.data) {
      if (!result.title || !result.url) continue;
      
      // Filter out non-article pages and non-allowed sources
      if (!isValidArticleUrl(result.url)) {
        console.log(`Skipping invalid URL: ${result.url}`);
        continue;
      }
      
      if (!isArticleTitle(result.title)) {
        console.log(`Skipping generic title: ${result.title}`);
        continue;
      }

      // Extract source name from URL
      let sourceName = "Unknown";
      try {
        const url = new URL(result.url);
        const hostname = url.hostname.replace("www.", "");
        const sourceMap: Record<string, string> = {
          "variety.com": "Variety",
          "deadline.com": "Deadline",
          "hollywoodreporter.com": "The Hollywood Reporter",
          "ew.com": "Entertainment Weekly",
          "screenrant.com": "Screen Rant",
          "collider.com": "Collider",
          "ign.com": "IGN",
          "thewrap.com": "The Wrap",
          "indiewire.com": "IndieWire",
        };
        sourceName = sourceMap[hostname] || hostname;
      } catch {
        // Keep default
      }

      // Generate unique slug
      const baseSlug = generateSlug(result.title);
      const timestamp = Date.now().toString(36);
      const slug = `${baseSlug}-${timestamp}`;

      // Use clean description as excerpt - don't store messy scraped content
      const excerpt = result.description ? result.description.slice(0, 300) : null;
      
      // Don't store full content - it's too messy from scraping
      // Users will click through to read the original article
      const content = null;

      // Get image - prefer og:image from metadata
      let imageUrl = null;
      if (result.metadata?.ogImage) {
        imageUrl = result.metadata.ogImage;
      } else if (result.metadata?.["og:image"]) {
        imageUrl = result.metadata["og:image"];
      } else if (result.image) {
        imageUrl = result.image;
      }
      
      // Skip if image looks like a generic site logo/placeholder
      if (imageUrl) {
        const lowerImg = imageUrl.toLowerCase();
        if (lowerImg.includes("icon-512") || 
            lowerImg.includes("placeholder") || 
            lowerImg.includes("og-img") ||
            lowerImg.includes("social/sr-")) {
          imageUrl = null;
        }
      }

      console.log(`✓ Valid article: "${result.title}" - Image: ${imageUrl || 'none'}`);

      articles.push({
        slug,
        title: result.title,
        excerpt,
        content,
        source_url: result.url,
        source_name: sourceName,
        featured_image: imageUrl,
        status: "published",
        published_at: new Date().toISOString(),
      });
    }

    console.log(`Filtered to ${articles.length} valid articles`);

    if (articles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No valid articles found after filtering",
          imported: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for database operations
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Delete ALL existing articles first (replace with fresh content)
    const { error: deleteError } = await adminSupabase
      .from("news_articles")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      console.error("Error deleting old articles:", deleteError);
    } else {
      console.log("Deleted all old articles");
    }

    // Insert new articles
    const { data: insertedArticles, error: insertError } = await adminSupabase
      .from("news_articles")
      .insert(articles)
      .select();

    if (insertError) {
      console.error("Error inserting articles:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save articles: " + insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully imported ${insertedArticles?.length || 0} articles`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Replaced news with ${insertedArticles?.length || 0} fresh articles`,
        imported: insertedArticles?.length || 0,
        articles: insertedArticles,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in firecrawl-news function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});