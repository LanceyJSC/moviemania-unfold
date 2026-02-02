import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@/hooks/useNews";

interface FeaturedNewsCardProps {
  article: NewsArticle;
}

export const FeaturedNewsCard = ({ article }: FeaturedNewsCardProps) => {
  const publishedDate = article.published_at
    ? format(new Date(article.published_at), "MMM d, yyyy")
    : null;

  return (
    <Link to={`/news/${article.slug}`} className="block group">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
        {/* Background Image */}
        {article.featured_image ? (
          <img
            src={article.featured_image}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <div className="flex items-center gap-2 mb-2">
            {article.source_name && (
              <Badge variant="secondary" className="text-xs">
                {article.source_name}
              </Badge>
            )}
            {publishedDate && (
              <span className="text-xs text-foreground/60">{publishedDate}</span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
        </div>
      </div>
    </Link>
  );
};
