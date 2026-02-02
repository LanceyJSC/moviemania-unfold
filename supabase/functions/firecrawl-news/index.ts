import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Entertainment news sources to search
const NEWS_SOURCES = [
  "site:variety.com",
  "site:deadline.com",
  "site:hollywoodreporter.com",
  "site:ew.com",
  "site:screenrant.com",
  "site:collider.com",
];

// Generate a URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)
    .replace(/-$/, "");
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration not found");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
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

    console.log("Fetching entertainment news via Firecrawl...");

    // Build search query with news sources
    const searchQuery = `movie OR "TV show" news ${NEWS_SOURCES.join(" OR ")}`;

    // Search for news using Firecrawl with image extraction
    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 10,
        tbs: "qdr:d", // Last 24 hours
        scrapeOptions: {
          formats: ["markdown", "html"],
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

    console.log(`Found ${searchData.data?.length || 0} news results`);

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

    // Process and save articles
    const articles = [];
    for (const result of searchData.data) {
      if (!result.title || !result.url) continue;

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
        };
        sourceName = sourceMap[hostname] || hostname;
      } catch {
        // Keep default
      }

      // Generate unique slug
      const baseSlug = generateSlug(result.title);
      const timestamp = Date.now().toString(36);
      const slug = `${baseSlug}-${timestamp}`;

      // Extract excerpt from description or markdown
      const excerpt =
        result.description ||
        (result.markdown ? result.markdown.slice(0, 200) + "..." : null);

      // Get content from markdown
      const content = result.markdown || null;

      // Extract image from various possible sources
      let imageUrl = null;
      
      // Try ogImage first (OpenGraph image)
      if (result.metadata?.ogImage) {
        imageUrl = result.metadata.ogImage;
      } 
      // Try og:image from metadata
      else if (result.metadata?.["og:image"]) {
        imageUrl = result.metadata["og:image"];
      }
      // Try image field directly
      else if (result.image) {
        imageUrl = result.image;
      }
      // Try to extract first image from HTML content
      else if (result.html) {
        const imgMatch = result.html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1] && !imgMatch[1].includes('data:')) {
          imageUrl = imgMatch[1];
        }
      }
      
      console.log(`Article "${result.title}" - Image: ${imageUrl || 'none found'}`);

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

    // Insert articles into database using service role for insert
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      throw new Error("Service role key not configured");
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

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
        message: `Imported ${insertedArticles?.length || 0} articles as drafts`,
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
