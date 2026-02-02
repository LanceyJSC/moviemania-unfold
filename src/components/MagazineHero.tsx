import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@/hooks/useNews";

interface MagazineHeroProps {
  article: NewsArticle;
}

export const MagazineHero = ({ article }: MagazineHeroProps) => {
  const publishedDate = article.published_at
    ? format(new Date(article.published_at), "MMM d, yyyy")
    : null;

  return (
    <Link to={`/news/${article.slug}`} className="block group">
      <div className="relative aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden">
        {/* Background Image */}
        {article.featured_image ? (
          <img
            src={article.featured_image}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              {article.source_name && (
                <Badge className="bg-primary text-primary-foreground">
                  {article.source_name}
                </Badge>
              )}
              {publishedDate && (
                <span className="text-sm text-foreground/70">{publishedDate}</span>
              )}
            </div>
            <h2 className="text-2xl md:text-4xl font-cinematic text-foreground leading-tight mb-3 group-hover:text-primary transition-colors">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="text-foreground/80 text-sm md:text-base line-clamp-2 max-w-2xl">
                {article.excerpt}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
