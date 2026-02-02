import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Newspaper } from "lucide-react";
import type { NewsArticle } from "@/hooks/useNews";

interface FeaturedNewsCardProps {
  article: NewsArticle;
}

// Clean excerpt by removing boilerplate patterns
const cleanExcerpt = (excerpt: string | null): string | null => {
  if (!excerpt) return null;
  
  let cleaned = excerpt
    .replace(/TV Premiere Dates.*?·/gi, "")
    .replace(/The Rotten Tomatoes App.*?·/gi, "")
    .replace(/Home.*?·/gi, "")
    .replace(/Best & Popular.*?·/gi, "")
    .replace(/Watch for Free.*?·/gi, "")
    .replace(/·/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  if (cleaned.length < 20) return null;
  return cleaned;
};

export const FeaturedNewsCard = ({ article }: FeaturedNewsCardProps) => {
  const publishedDate = article.published_at
    ? format(new Date(article.published_at), "MMM d, yyyy")
    : null;
  
  const cleanedExcerpt = cleanExcerpt(article.excerpt);

  return (
    <Link to={`/news/${article.slug}`} className="block group">
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden">
        {/* Fallback Background - always visible as base layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Newspaper className="h-16 w-16 text-primary" />
          </div>
        </div>
        
        {/* Background Image - overlays the fallback */}
        {article.featured_image && (
          <img
            src={article.featured_image}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 z-10"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-20" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 z-30">
          <div className="flex items-center gap-2 mb-2">
            {article.source_name && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                {article.source_name}
                <ExternalLink className="h-3 w-3" />
              </Badge>
            )}
            {publishedDate && (
              <span className="text-xs text-foreground/60">{publishedDate}</span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          {cleanedExcerpt && (
            <p className="text-sm text-foreground/70 line-clamp-2 mt-1">
              {cleanedExcerpt}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};