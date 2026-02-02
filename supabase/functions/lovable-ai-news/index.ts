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

// RSS feeds from major entertainment news sources (only feeds that reliably include images)
const RSS_FEEDS = [
  { url: "https://variety.com/feed/", source: "Variety" },
  { url: "https://deadline.com/feed/", source: "Deadline" },
  { url: "https://collider.com/feed/", source: "Collider" },
  { url: "https://screenrant.com/feed/", source: "Screen Rant" },
  { url: "https://movieweb.com/feed/", source: "MovieWeb" },
  { url: "https://www.slashfilm.com/feed/", source: "SlashFilm" },
  { url: "https://www.cbr.com/feed/", source: "CBR" },
  { url: "https://www.denofgeek.com/feed/", source: "Den of Geek" },
];

// Parse RSS XML to extract items with full content
function parseRssXml(xml: string, source: string): RssItem[] {
  const items: RssItem[] = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  
  for (const itemXml of itemMatches.slice(0, 5)) {
    try {
      // Extract title
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
                         itemXml.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : "";
      
      // Extract link
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i) ||
                        itemXml.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/i);
      const link = linkMatch ? linkMatch[1].trim() : "";
      
      // Extract FULL content from content:encoded (most RSS feeds include this)
      let fullContent = "";
      const contentMatch = itemXml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i) ||
                           itemXml.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i);
      if (contentMatch) {
        fullContent = contentMatch[1];
      }
      
      // Fallback to description
      const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
                        itemXml.match(/<description>([\s\S]*?)<\/description>/i);
      let description = descMatch ? descMatch[1].trim() : "";
      
      // Use full content if available, otherwise use description
      let content = fullContent || description;
      
      // Clean HTML and extract text
      content = cleanHtmlContent(content);
      
      // Extract pubDate
      const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
      const pubDate = dateMatch ? dateMatch[1].trim() : "";
      
      // Extract image from multiple sources - try ALL methods
      let image = "";
      
      // Method 1: media:content with url attribute
      const mediaContentMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["']/i);
      if (mediaContentMatch) image = mediaContentMatch[1];
      
      // Method 2: media:thumbnail
      if (!image) {
        const thumbMatch = itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
        if (thumbMatch) image = thumbMatch[1];
      }
      
      // Method 3: enclosure tag (common in RSS)
      if (!image) {
        const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["']/i);
        if (enclosureMatch) image = enclosureMatch[1];
      }
      
      // Method 4: Look for img tags in content:encoded
      if (!image && fullContent) {
        const imgMatch = fullContent.match(/<img[^>]*src=["'](https?:\/\/[^"']+)["']/i);
        if (imgMatch) image = imgMatch[1];
      }
      
      // Method 5: Look for image URLs in description
      if (!image && description) {
        const descImgMatch = description.match(/<img[^>]*src=["'](https?:\/\/[^"']+)["']/i);
        if (descImgMatch) image = descImgMatch[1];
      }
      
      // Method 6: Look for any URL ending in image extension
      if (!image) {
        const urlMatch = itemXml.match(/https?:\/\/[^"'\s<>]+\.(jpg|jpeg|png|webp)/i);
        if (urlMatch) image = urlMatch[0];
      }
      
      // Only include articles that have an image - skip those without
      if (title && link && content.length > 50 && image) {
        items.push({ 
          title, 
          link, 
          description: content,
          pubDate, 
          image, 
          source 
        });
      }
    } catch (e) {
      console.error("Error parsing RSS item:", e);
    }
  }
  
  return items;
}

function cleanHtmlContent(html: string): string {
  // Remove script and style tags with content
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  
  // Convert common HTML to readable text
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<li>/gi, '• ');
  text = text.replace(/<\/li>/gi, '\n');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = decodeHtmlEntities(text);
  
  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.trim();
  
  // Remove common boilerplate phrases
  const boilerplatePatterns = [
    /Continue reading.*$/i,
    /Read more.*$/i,
    /Click here.*$/i,
    /Subscribe.*newsletter.*$/i,
    /Sign up.*$/i,
    /The post .* appeared first on.*$/i,
  ];
  
  for (const pattern of boilerplatePatterns) {
    text = text.replace(pattern, '');
  }
  
  return text.trim();
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
    .replace(/&#038;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

// Generate a clean excerpt from content
function generateExcerpt(content: string, maxLength: number = 300): string {
  // Get first 3-4 sentences for a richer excerpt
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  let excerpt = sentences.slice(0, 4).join(' ').trim();
  
  if (excerpt.length > maxLength) {
    excerpt = excerpt.substring(0, maxLength - 3) + '...';
  }
  
  return excerpt || content.substring(0, maxLength);
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
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
      .filter(item => item.title && item.description.length > 100)
      .sort((a, b) => {
        const dateA = new Date(a.pubDate).getTime() || 0;
        const dateB = new Date(b.pubDate).getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 20);

    console.log(`Processing ${sortedItems.length} quality articles`);

    let insertedCount = 0;
    
    for (const item of sortedItems) {
      try {
        // Store more content for richer articles (up to 5000 chars)
        const content = item.description.length > 5000 
          ? item.description.substring(0, 5000) + '...'
          : item.description;
        
        const excerpt = generateExcerpt(item.description, 350);
        
        const slug = item.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 80);

        const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

        const { error: insertError } = await supabase.from("news_articles").insert({
          title: item.title,
          slug: uniqueSlug,
          excerpt: excerpt,
          content: content,
          source_name: item.source,
          source_url: item.link,
          featured_image: item.image || null,
          status: "published",
          published_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error(`Error inserting "${item.title}":`, insertError);
        } else {
          insertedCount++;
          console.log(`Inserted: ${item.title.substring(0, 50)}...`);
        }
      } catch (e) {
        console.error(`Error processing ${item.title}:`, e);
      }
    }

    console.log(`Successfully inserted ${insertedCount} articles`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fetched and saved ${insertedCount} news articles`,
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
