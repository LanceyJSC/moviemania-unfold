import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  image?: string;
  source: string;
}

// RSS feeds from major entertainment news sources
const RSS_FEEDS = [
  { url: "https://variety.com/feed/", source: "Variety" },
  { url: "https://deadline.com/feed/", source: "Deadline" },
  { url: "https://www.hollywoodreporter.com/feed/", source: "The Hollywood Reporter" },
  { url: "https://collider.com/feed/", source: "Collider" },
  { url: "https://screenrant.com/feed/", source: "Screen Rant" },
];

// Parse RSS XML to extract items
function parseRssXml(xml: string, source: string): RssItem[] {
  const items: RssItem[] = [];
  
  // Extract all <item> elements
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  
  for (const itemXml of itemMatches.slice(0, 5)) { // Take first 5 from each feed
    try {
      // Extract title
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
                         itemXml.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : "";
      
      // Extract link
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i) ||
                        itemXml.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/i);
      const link = linkMatch ? linkMatch[1].trim() : "";
      
      // Extract description/summary
      const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/is) ||
                        itemXml.match(/<description>(.*?)<\/description>/is);
      let description = descMatch ? descMatch[1].trim() : "";
      // Clean HTML from description
      description = description.replace(/<[^>]*>/g, "").trim();
      description = decodeHtmlEntities(description);
      // Limit to 2-3 sentences
      description = description.split(/[.!?]/).slice(0, 3).join(". ").trim();
      if (description && !description.endsWith(".")) description += ".";
      
      // Extract pubDate
      const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
      const pubDate = dateMatch ? dateMatch[1].trim() : "";
      
      // Extract image from media:content, enclosure, or content
      let image = "";
      const mediaMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["']/i) ||
                         itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i) ||
                         itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i) ||
                         itemXml.match(/<image><url>(.*?)<\/url>/i) ||
                         itemXml.match(/src=["'](https?:\/\/[^"']+\.(jpg|jpeg|png|webp)[^"']*)["']/i);
      if (mediaMatch) {
        image = mediaMatch[1];
      }
      
      if (title && link) {
        items.push({ title, link, description, pubDate, image, source });
      }
    } catch (e) {
      console.error("Error parsing RSS item:", e);
    }
  }
  
  return items;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&nbsp;/g, " ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Fetching entertainment news from RSS feeds...");

    // Fetch all RSS feeds in parallel
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SceneBurn/1.0)",
            "Accept": "application/rss+xml, application/xml, text/xml",
          },
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch ${feed.source}: ${response.status}`);
          return [];
        }
        
        const xml = await response.text();
        return parseRssXml(xml, feed.source);
      } catch (e) {
        console.error(`Error fetching ${feed.source}:`, e);
        return [];
      }
    });

    const feedResults = await Promise.all(feedPromises);
    const allItems = feedResults.flat();
    
    console.log(`Fetched ${allItems.length} total items from RSS feeds`);

    // Sort by date (newest first) and take top 10
    const sortedItems = allItems
      .filter(item => item.title && item.description)
      .sort((a, b) => {
        const dateA = new Date(a.pubDate).getTime() || 0;
        const dateB = new Date(b.pubDate).getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 10);

    console.log(`Processing ${sortedItems.length} articles`);

    // Insert articles into database
    let insertedCount = 0;
    for (const item of sortedItems) {
      const slug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 80);

      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      const { error: insertError } = await supabase.from("news_articles").insert({
        title: item.title,
        slug: uniqueSlug,
        excerpt: item.description,
        content: item.description,
        source_name: item.source,
        source_url: item.link,
        featured_image: item.image || null,
        status: "draft",
      });

      if (insertError) {
        console.error(`Error inserting article "${item.title}":`, insertError);
      } else {
        insertedCount++;
        console.log(`Inserted: ${item.title}`);
      }
    }

    console.log(`Successfully inserted ${insertedCount} articles`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fetched and saved ${insertedCount} news articles from RSS feeds`,
        count: insertedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in lovable-ai-news:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
