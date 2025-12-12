import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const limit = url.searchParams.get('limit') || '25';
    
    // KinoCheck API - fetch latest trailers without category filter
    const kinoCheckUrl = `https://api.kinocheck.com/trailers/latest?language=en&limit=${limit}`;
    
    console.log('Fetching from KinoCheck:', kinoCheckUrl);
    
    const response = await fetch(kinoCheckUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('KinoCheck API error:', response.status, response.statusText);
      throw new Error(`KinoCheck API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('KinoCheck response count:', Array.isArray(data) ? data.length : 'not an array');
    console.log('KinoCheck first item:', JSON.stringify(data[0] || {}).slice(0, 300));

    return new Response(JSON.stringify({ trailers: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in kinocheck-trailers function:', error);
    return new Response(JSON.stringify({ error: error.message, trailers: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
