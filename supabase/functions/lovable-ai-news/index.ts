import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NewsArticle {
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  image_url?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Fetching entertainment news using Lovable AI...");

    // Call Lovable AI Gateway to get entertainment news
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an entertainment news curator specializing in movies and TV shows. 
Your task is to provide the latest entertainment news stories with clean, professional summaries.
Focus on major news from sources like Variety, Deadline, The Hollywood Reporter, Entertainment Weekly, and similar outlets.
Always provide accurate, factual information with proper source attribution.`,
          },
          {
            role: "user",
            content: `Find and summarize the 8 most recent and important movie and TV entertainment news stories from today or this week.

For each story, provide:
1. A complete, clear headline (no truncation)
2. A 2-3 sentence summary that captures the key information
3. The source name (e.g., Variety, Deadline, THR)
4. The source URL where the story can be found
5. An image URL if one is prominently featured with the story

Focus on:
- New movie/TV announcements and casting news
- Streaming platform updates
- Box office and ratings news
- Industry developments
- Celebrity news related to film/TV projects

Avoid:
- Gossip or tabloid content
- Extremely old news
- Duplicate stories`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_news_articles",
              description: "Return structured news articles data",
              parameters: {
                type: "object",
                properties: {
                  articles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: {
                          type: "string",
                          description: "Complete headline of the news story",
                        },
                        summary: {
                          type: "string",
                          description: "2-3 sentence summary of the story",
                        },
                        source_name: {
                          type: "string",
                          description: "Name of the news source (e.g., Variety, Deadline)",
                        },
                        source_url: {
                          type: "string",
                          description: "URL to the original article",
                        },
                        image_url: {
                          type: "string",
                          description: "URL to the featured image if available",
                        },
                      },
                      required: ["title", "summary", "source_name", "source_url"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["articles"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_news_articles" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limited by Lovable AI");
        return new Response(
          JSON.stringify({ success: false, error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required for Lovable AI");
        return new Response(
          JSON.stringify({ success: false, error: "AI usage limit reached. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`AI request failed with status ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    // Extract articles from tool call response
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "return_news_articles") {
      throw new Error("Unexpected AI response format");
    }

    const articlesData = JSON.parse(toolCall.function.arguments);
    const articles: NewsArticle[] = articlesData.articles || [];

    console.log(`Received ${articles.length} articles from AI`);

    // Generate slugs and insert into database
    let insertedCount = 0;
    for (const article of articles) {
      const slug = article.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 80);

      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      const { error: insertError } = await supabase.from("news_articles").insert({
        title: article.title,
        slug: uniqueSlug,
        excerpt: article.summary,
        content: article.summary,
        source_name: article.source_name,
        source_url: article.source_url,
        featured_image: article.image_url || null,
        status: "draft",
      });

      if (insertError) {
        console.error(`Error inserting article "${article.title}":`, insertError);
      } else {
        insertedCount++;
        console.log(`Inserted: ${article.title}`);
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
