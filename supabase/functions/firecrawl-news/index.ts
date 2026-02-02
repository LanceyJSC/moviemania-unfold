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

// Check if URL is an actual article (not a homepage or category page)
function isArticleUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Reject homepage and category pages
    if (path === "/" || path === "") return false;
    if (path.match(/^\/(v\/)?[a-z-]+\/?$/i)) return false; // /film/, /movies/, /tv/
    if (path.match(/^\/tag\//)) return false;
    if (path.match(/^\/category\//)) return false;
    
    // Articles usually have dates or IDs in the URL
    if (path.match(/\/\d{4}\/\d{2}\//)) return true; // /2026/02/
    if (path.match(/-\d{5,}/)) return true; // article ID like -11897109
    if (path.match(/\/[a-z-]+-[a-z-]+-\d+/)) return true; // slug with ID
    
    // If path has multiple segments, likely an article
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

// Clean markdown content - remove navigation, links, and formatting artifacts
function cleanContent(content: string | null): string | null {
  if (!content) return null;
  
  // Remove skip links and navigation
  let cleaned = content.replace(/\[Skip to[^\]]*\]\([^)]*\)/gi, "");
  
  // Remove markdown images
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  
  // Remove markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  
  // Remove escaped characters
  cleaned = cleaned.replace(/\\\\/g, "");
  cleaned = cleaned.replace(/\\([_*`])/g, "$1");
  
  // Remove excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  
  // Remove lines that are just numbers or single characters
  cleaned = cleaned
    .split("\n")
    .filter(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+$/)) return false;
      if (trimmed.length === 1) return false;
      return true;
    })
    .join("\n");
  
  return cleaned.trim() || null;
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
      
      // Filter out non-article pages
      if (!isArticleUrl(result.url)) {
        console.log(`Skipping non-article URL: ${result.url}`);
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

      // Clean the excerpt
      const rawExcerpt = result.description || 
        (result.markdown ? result.markdown.slice(0, 300) : null);
      const excerpt = rawExcerpt ? cleanContent(rawExcerpt)?.slice(0, 200) + "..." : null;

      // Clean the content
      const content = cleanContent(result.markdown);

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