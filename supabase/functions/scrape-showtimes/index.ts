import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  country?: string;
  website?: string;
}

interface ScrapedShowtime {
  movie_title: string;
  showtime: string;
  booking_url?: string;
  ticket_price?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cinema }: { cinema: Cinema } = await req.json();
    console.log('Scraping showtimes for cinema:', cinema.name, cinema.city);

    const showtimes = await scrapeShowtimes(cinema);
    
    return new Response(JSON.stringify({ showtimes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrape-showtimes function:', error);
    return new Response(
      JSON.stringify({ error: error.message, showtimes: [] }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function scrapeShowtimes(cinema: Cinema): Promise<ScrapedShowtime[]> {
  const name = cinema.name.toLowerCase();
  const country = cinema.country?.toLowerCase() || '';
  
  // Try chain-specific scraping first
  const chainShowtimes = await scrapeChainWebsite(cinema);
  if (chainShowtimes.length > 0) {
    return chainShowtimes;
  }
  
  // Fallback to generic scraping
  return await genericScrape(cinema);
}

async function scrapeChainWebsite(cinema: Cinema): Promise<ScrapedShowtime[]> {
  const name = cinema.name.toLowerCase();
  const country = cinema.country?.toLowerCase() || '';
  
  try {
    // UK Chains
    if (name.includes('odeon')) {
      return await scrapeOdeon(cinema);
    }
    if (name.includes('vue')) {
      return await scrapeVue(cinema);
    }
    if (name.includes('cineworld')) {
      return await scrapeCineworld(cinema);
    }
    
    // US Chains
    if (name.includes('amc')) {
      return await scrapeAMC(cinema);
    }
    if (name.includes('regal')) {
      return await scrapeRegal(cinema);
    }
    if (name.includes('cinemark')) {
      return await scrapeCinemark(cinema);
    }
    
    // Other chains by country
    if (country.includes('france') || country.includes('fr')) {
      if (name.includes('pathé') || name.includes('pathe')) {
        return await scrapePathe(cinema);
      }
      if (name.includes('ugc')) {
        return await scrapeUGC(cinema);
      }
    }
    
    if (country.includes('germany') || country.includes('de')) {
      if (name.includes('cinemax')) {
        return await scrapeCinemaxx(cinema);
      }
    }
    
    if (country.includes('australia') || country.includes('au')) {
      if (name.includes('event')) {
        return await scrapeEvent(cinema);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Chain scraping failed:', error);
    return [];
  }
}

async function genericScrape(cinema: Cinema): Promise<ScrapedShowtime[]> {
  try {
    console.log('Attempting generic scrape for:', cinema.name);
    
    // Try website if available
    if (cinema.website) {
      return await scrapeWebsite(cinema.website, cinema);
    }
    
    // Try inferring website
    const inferredSite = inferWebsite(cinema.name, cinema.city, cinema.country);
    if (inferredSite) {
      return await scrapeWebsite(inferredSite, cinema);
    }
    
    return [];
  } catch (error) {
    console.error('Generic scraping failed:', error);
    return [];
  }
}

async function scrapeWebsite(url: string, cinema: Cinema): Promise<ScrapedShowtime[]> {
  try {
    console.log('Scraping website:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    return parseShowtimesFromHTML(html, url);
  } catch (error) {
    console.error('Website scraping failed for', url, ':', error);
    return [];
  }
}

function parseShowtimesFromHTML(html: string, baseUrl: string): ScrapedShowtime[] {
  const showtimes: ScrapedShowtime[] = [];
  
  try {
    // Look for JSON-LD structured data
    const jsonLdMatches = html.match(/<script[^>]*type=\\\"application\\\\/ld\\\\+json\\\"[^>]*>(.*?)<\\\\/script>/gs);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\\\\/script>/, '');
        try {
          const data = JSON.parse(jsonContent);
          const extracted = extractFromStructuredData(data);
          showtimes.push(...extracted);
        } catch (e) {
          console.log('Failed to parse JSON-LD:', e);
        }
      }
    }
    
    // Look for common showtime patterns
    const timePatterns = [
      /(\d{1,2}:\d{2})\s*(AM|PM|am|pm)/g,
      /(\d{1,2}:\d{2})/g
    ];
    
    for (const pattern of timePatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        matches.slice(0, 10).forEach((time, index) => {
          const today = new Date();
          const showtime = new Date(today.toDateString() + ' ' + time);
          
          showtimes.push({
            movie_title: `Movie ${index + 1}`,
            showtime: showtime.toISOString(),
            booking_url: baseUrl
          });
        });
        break;
      }
    }
    
    return showtimes;
  } catch (error) {
    console.error('HTML parsing failed:', error);
    return [];
  }
}

function extractFromStructuredData(data: any): ScrapedShowtime[] {
  const showtimes: ScrapedShowtime[] = [];
  
  // Handle different structured data formats
  if (data['@type'] === 'Movie' || data['@type'] === 'ScreeningEvent') {
    const title = data.name || 'Unknown Movie';
    const startDate = data.startDate;
    const url = data.url;
    
    if (startDate) {
      showtimes.push({
        movie_title: title,
        showtime: new Date(startDate).toISOString(),
        booking_url: url
      });
    }
  }
  
  // Handle arrays of events
  if (Array.isArray(data)) {
    data.forEach(item => {
      showtimes.push(...extractFromStructuredData(item));
    });
  }
  
  return showtimes;
}

function inferWebsite(name: string, city: string, country?: string): string | null {
  const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const n = name.toLowerCase();
  const citySlug = slug(city || '');
  const countryCode = country?.toLowerCase();
  
  if (!citySlug) return null;
  
  // UK chains
  if (n.includes('odeon')) return `https://www.odeon.co.uk/cinemas/${citySlug}/`;
  if (n.includes('vue')) return `https://www.myvue.com/cinema/${citySlug}/whats-on`;
  if (n.includes('cineworld')) return `https://www.cineworld.co.uk/cinemas/${citySlug}`;
  
  // US chains
  if (n.includes('amc')) return `https://www.amctheatres.com/movie-theatres/${citySlug}`;
  if (n.includes('regal')) return `https://www.regmovies.com/theatres/${citySlug}`;
  
  // Generic patterns by country
  if (countryCode === 'us' || countryCode === 'usa') {
    return `https://www.fandango.com/search?q=${encodeURIComponent(name + ' ' + city)}`;
  }
  
  return null;
}

// Chain-specific scrapers (simplified implementations)
async function scrapeOdeon(cinema: Cinema): Promise<ScrapedShowtime[]> {
  const citySlug = cinema.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://www.odeon.co.uk/cinemas/${citySlug}/`;
  return await scrapeWebsite(url, cinema);
}

async function scrapeVue(cinema: Cinema): Promise<ScrapedShowtime[]> {
  const citySlug = cinema.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://www.myvue.com/cinema/${citySlug}/whats-on`;
  return await scrapeWebsite(url, cinema);
}

async function scrapeCineworld(cinema: Cinema): Promise<ScrapedShowtime[]> {
  const citySlug = cinema.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://www.cineworld.co.uk/cinemas/${citySlug}`;
  return await scrapeWebsite(url, cinema);
}

async function scrapeAMC(cinema: Cinema): Promise<ScrapedShowtime[]> {
  const citySlug = cinema.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://www.amctheatres.com/movie-theatres/${citySlug}`;
  return await scrapeWebsite(url, cinema);
}

async function scrapeRegal(cinema: Cinema): Promise<ScrapedShowtime[]> {
  const citySlug = cinema.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://www.regmovies.com/theatres/${citySlug}`;
  return await scrapeWebsite(url, cinema);
}

async function scrapeCinemark(cinema: Cinema): Promise<ScrapedShowtime[]> {
  // Cinemark typically uses location-based URLs
  return [];
}

async function scrapePathe(cinema: Cinema): Promise<ScrapedShowtime[]> {
  // French Pathé cinemas
  return [];
}

async function scrapeUGC(cinema: Cinema): Promise<ScrapedShowtime[]> {
  // French UGC cinemas
  return [];
}

async function scrapeCinemaxx(cinema: Cinema): Promise<ScrapedShowtime[]> {
  // German CinemaxX cinemas
  return [];
}

async function scrapeEvent(cinema: Cinema): Promise<ScrapedShowtime[]> {
  // Australian Event Cinemas
  return [];
}
