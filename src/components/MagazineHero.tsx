import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { NewsArticle } from "@/hooks/useNews";

interface MagazineHeroProps {
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

export const MagazineHero = ({ article }: MagazineHeroProps) => {
  const publishedDate = article.published_at
    ? format(new Date(article.published_at), "MMM d, yyyy")
    : null;
  
  const cleanedExcerpt = cleanExcerpt(article.excerpt);

  return (
    <Link to={`/news/${article.slug}`} className="block group">
      <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden">
        {/* Background Image */}
        {article.featured_image ? (
          <img
            src={article.featured_image}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/40" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              {article.source_name && (
                <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                  {article.source_name}
                  <ExternalLink className="h-3 w-3" />
                </Badge>
              )}
              {publishedDate && (
                <span className="text-sm text-foreground/70">{publishedDate}</span>
              )}
            </div>
            <h2 className="text-2xl md:text-4xl font-cinematic text-foreground leading-tight mb-3 group-hover:text-primary transition-colors">
              {article.title}
            </h2>
            {cleanedExcerpt && (
              <p className="text-foreground/80 text-sm md:text-base line-clamp-2 max-w-2xl">
                {cleanedExcerpt}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};