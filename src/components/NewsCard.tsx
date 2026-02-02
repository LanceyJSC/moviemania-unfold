import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { NewsArticle } from "@/hooks/useNews";

interface NewsCardProps {
  article: NewsArticle;
}

// Clean excerpt by removing boilerplate patterns
const cleanExcerpt = (excerpt: string | null): string | null => {
  if (!excerpt) return null;
  
  // Remove common boilerplate patterns
  let cleaned = excerpt
    .replace(/TV Premiere Dates.*?·/gi, "")
    .replace(/The Rotten Tomatoes App.*?·/gi, "")
    .replace(/Home.*?·/gi, "")
    .replace(/Best & Popular.*?·/gi, "")
    .replace(/Watch for Free.*?·/gi, "")
    .replace(/·/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  // If cleaned text is too short, return null
  if (cleaned.length < 20) return null;
  
  return cleaned;
};

export const NewsCard = ({ article }: NewsCardProps) => {
  const publishedDate = article.published_at
    ? format(new Date(article.published_at), "MMM d, yyyy")
    : null;
  
  const cleanedExcerpt = cleanExcerpt(article.excerpt);

  return (
    <Card className="bg-card/60 border-border/50 overflow-hidden hover:border-primary/30 transition-colors group">
      <Link to={`/news/${article.slug}`}>
        {/* Image - use aspect-[16/10] for better proportion */}
        <div className="aspect-[16/10] overflow-hidden bg-muted relative">
          {article.featured_image ? (
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center absolute inset-0 ${article.featured_image ? 'hidden' : ''}`}>
            <div className="text-center">
              <span className="text-5xl font-cinematic text-primary/40">📰</span>
              <p className="text-xs text-muted-foreground mt-2 px-4 line-clamp-2">{article.source_name}</p>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {article.source_name && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                {article.source_name}
                <ExternalLink className="h-3 w-3" />
              </Badge>
            )}
            {publishedDate && (
              <span className="text-xs text-muted-foreground">{publishedDate}</span>
            )}
          </div>
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          {cleanedExcerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {cleanedExcerpt}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};